/* ---------- SONIDO ---------- */
const FX = {
  on: localStorage.getItem("cq_sound") !== "off",
  ctx: null,
  ac(){
    if(!this.ctx){ try { this.ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){} }
    if(this.ctx && this.ctx.state === "suspended") this.ctx.resume().catch(()=>{});
    return this.ctx;
  },
  tono(f, dur, tipo="sine", vol=0.18, delay=0, hasta=null){
    if(!this.on) return;
    const ac = this.ac(); if(!ac) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t);
    if(hasta) o.frequency.exponentialRampToValueAtTime(hasta, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + dur + 0.05);
  },
  ruido(dur=0.4, vol=0.12, f0=400, f1=2000){
    if(!this.on) return;
    const ac = this.ac(); if(!ac) return;
    const n = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, n, ac.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/n, 2);
    const src = ac.createBufferSource(); src.buffer = buf;
    const filt = ac.createBiquadFilter(); filt.type = "bandpass";
    filt.frequency.setValueAtTime(f0, ac.currentTime);
    filt.frequency.exponentialRampToValueAtTime(f1, ac.currentTime + dur);
    const g = ac.createGain(); g.gain.value = vol;
    src.connect(filt); filt.connect(g); g.connect(ac.destination);
    src.start();
  },

  /* --- tambor de guerra --- */
  golpe(vol=0.3, delay=0, tono=68){
    if(!this.on) return;
    const ac = this.ac(); if(!ac) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(tono*2.6, t);
    o.frequency.exponentialRampToValueAtTime(tono, t + 0.14);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + 0.4);
    // cuerpo del parche
    const n = Math.floor(ac.sampleRate * 0.09);
    const buf = ac.createBuffer(1, n, ac.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/n, 3);
    const s = ac.createBufferSource(); s.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420;
    const gg = ac.createGain(); gg.gain.value = vol*0.5;
    s.connect(f); f.connect(gg); gg.connect(ac.destination);
    s.start(t);
  },
  tambores: null,
  marcha(bpm){
    this.pararMarcha();
    if(!this.on) return;
    const intervalo = 60000 / bpm;
    let paso = 0;
    const tic = () => {
      const fuerte = paso % 4 === 0;
      this.golpe(fuerte ? 0.34 : 0.18, 0, fuerte ? 62 : 78);
      paso++;
    };
    tic();
    this.tambores = setInterval(tic, intervalo);
  },
  pararMarcha(){ if(this.tambores){ clearInterval(this.tambores); this.tambores = null; } },

  cuerno(){ this.tono(146, 1.1, "sawtooth", 0.12); this.tono(220, 1.0, "sawtooth", 0.09, 0.06); this.tono(293, 0.9, "sawtooth", 0.07, 0.12); },
  trompetas(){ [[392,0],[523,0.14],[659,0.28],[784,0.42],[659,0.58],[784,0.68],[1047,0.8]].forEach(([f,d]) => this.tono(f, 0.4, "square", 0.13, d)); },
  acierto(){ [523,659,784].forEach((f,i)=>this.tono(f, 0.15, "triangle", 0.15, i*0.06)); },
  fallo(){ this.tono(180, 0.3, "sawtooth", 0.14); this.tono(120, 0.45, "sawtooth", 0.12, 0.1); },
  espadas(){ this.ruido(0.18, 0.1, 2200, 5000); this.tono(1800, 0.08, "square", 0.06); },
  bandera(){ this.ruido(0.6, 0.07, 300, 900); },
  reloj(){ this.tono(1500, 0.04, "square", 0.05); },
  alarma(){ this.tono(1900, 0.07, "square", 0.09); },
  derrumbe(){ this.tono(90, 0.7, "sawtooth", 0.16, 0, 40); this.ruido(0.8, 0.1, 200, 60); },
  toggle(){
    this.on = !this.on;
    localStorage.setItem("cq_sound", this.on ? "on" : "off");
    if(this.on) this.tono(880, 0.12, "triangle", 0.14); else { this.pararMarcha(); this.musica.para(); }
    return this.on;
  }
};

/* --- música de fondo --- */
FX.pistas = [
  { id:"epica",   n:"Marcha",  src:"assets/music/upbeat.mp3" },
  { id:"tension", n:"Tensión", src:"assets/music/barcelona.mp3" }
];
FX.musica = {
  on: localStorage.getItem("cq_music") !== "off",
  el: null, actual: null, sonando: false,
  elegida(){ return localStorage.getItem("cq_track") || "epica"; },
  elegir(id){ localStorage.setItem("cq_track", id); if(this.sonando){ this.para(); setTimeout(()=>this.arranca(), 150); } },
  arranca(){
    if(!this.on || !FX.on) return;
    const p = FX.pistas.find(x => x.id === this.elegida()) || FX.pistas[0];
    try {
      if(!this.el){ this.el = new Audio(); this.el.loop = true; }
      if(this.actual !== p.src){ this.el.src = p.src; this.actual = p.src; }
      this.el.volume = 0.22;
      const pr = this.el.play(); if(pr && pr.catch) pr.catch(()=>{});
      this.sonando = true;
    } catch(e){}
  },
  para(){
    const a = this.el;
    this.sonando = false;
    if(!a || a.paused) return;
    let v = a.volume;
    const baja = setInterval(()=>{ v -= 0.04; if(v <= 0.02){ clearInterval(baja); a.pause(); a.currentTime = 0; a.volume = 0.22; } else a.volume = v; }, 60);
  },
  toggle(){ this.on = !this.on; localStorage.setItem("cq_music", this.on?"on":"off"); if(this.on) this.arranca(); else this.para(); return this.on; }
};

function temblor(fuerza){
  const el = document.getElementById("app");
  if(!el) return;
  const cls = fuerza === 2 ? "temblor-fuerte" : "temblor";
  el.classList.remove("temblor","temblor-fuerte"); void el.offsetWidth; el.classList.add(cls);
  setTimeout(()=>el.classList.remove(cls), 700);
}
function vibrar(ms){ if(navigator.vibrate) try { navigator.vibrate(ms); } catch(e){} }
function chispas(n = 40, colores){
  const cols = colores || ["#E5B54A","#C0392B","#E8EAF0","#D9531E","#17A2A2"];
  const wrap = document.createElement("div");
  wrap.className = "capa-chispas";
  for(let i=0;i<n;i++){
    const p = document.createElement("i");
    const s = 5 + Math.random()*8;
    p.style.cssText = `left:${Math.random()*100}%;width:${s}px;height:${s*1.4}px;background:${cols[i%cols.length]};animation-delay:${Math.random()*0.35}s;animation-duration:${1.3+Math.random()*1.1}s;border-radius:${Math.random()>0.5?"50%":"1px"};`;
    wrap.appendChild(p);
  }
  document.body.appendChild(wrap);
  setTimeout(()=>wrap.remove(), 3000);
}
function grito(texto, color){
  const el = document.createElement("div");
  el.className = "grito";
  el.textContent = texto;
  el.style.color = color || "#E5B54A";
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 1500);
}

(function(){
  const abrir = () => {
    const ac = FX.ac();
    if(ac && ac.state === "suspended") ac.resume().catch(()=>{});
  };
  ["pointerdown","touchstart","keydown"].forEach(ev => document.addEventListener(ev, abrir));
})();
