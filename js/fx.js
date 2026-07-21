const FX = {
  on: localStorage.getItem("tm_sound") !== "off",
  ctx: null,
  ac(){
    if(!this.ctx){ try { this.ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){} }
    if(this.ctx && this.ctx.state === "suspended") this.ctx.resume().catch(()=>{});
    return this.ctx;
  },
  tone(freq, dur, type="sine", vol=0.18, delay=0, slideTo=null){
    if(!this.on) return;
    const ac = this.ac(); if(!ac) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur=0.5, vol=0.14){
    if(!this.on) return;
    const ac = this.ac(); if(!ac) return;
    const n = ac.sampleRate * dur;
    const buf = ac.createBuffer(1, n, ac.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/n, 2);
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = "bandpass";
    f.frequency.setValueAtTime(500, ac.currentTime);
    f.frequency.exponentialRampToValueAtTime(3000, ac.currentTime + dur*0.6);
    f.frequency.exponentialRampToValueAtTime(400, ac.currentTime + dur);
    const g = ac.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(ac.destination);
    src.start();
  },
  whoosh(){ this.noise(0.75, 0.1); this.tone(180, 0.5, "sine", 0.06, 0, 700); },
  land(){ this.tone(90, 0.22, "square", 0.16); this.noise(0.14, 0.09); },
  flip(){ this.tone(520, 0.09, "triangle", 0.1); this.tone(760, 0.09, "triangle", 0.08, 0.07); },
  tick(){ this.tone(1400, 0.05, "square", 0.05); },
  hurry(){ this.tone(1750, 0.08, "square", 0.09); },
  good(streak=0){
    const base = [523, 659, 784, 1047];
    base.forEach((f,i) => this.tone(f * (streak>=3?1.25:1), 0.16, "triangle", 0.16, i*0.075));
    if(streak >= 3) this.tone(1568, 0.4, "sine", 0.1, 0.3);
  },
  bad(){ this.tone(220, 0.28, "sawtooth", 0.13); this.tone(160, 0.42, "sawtooth", 0.12, 0.12); },
  drum(){ [0,0.1,0.2].forEach((d,i)=> this.tone(140+i*30, 0.12, "square", 0.13, d)); },
  fanfare(){
    [[523,0],[659,0.12],[784,0.24],[1047,0.36],[784,0.5],[1047,0.6]].forEach(([f,d]) => this.tone(f, 0.35, "triangle", 0.17, d));
  },
  toggle(){
    this.on = !this.on;
    localStorage.setItem("tm_sound", this.on ? "on" : "off");
    if(this.on){ this.tone(880, 0.12, "triangle", 0.15); if(this.music.on) this.music.arranca(); }
    else this.music.para();
    return this.on;
  }
};

/* ---------- Música de fondo generada ---------- */
/* Si existe assets/music.mp3 se usa esa pista; si no, suena la música generada */
FX.track = {
  el: null, listo: false, fallo: false,
  init(){
    if(this.el || this.fallo) return;
    try {
      const a = new Audio("assets/music.mp3");
      a.loop = true; a.volume = 0.35; a.preload = "auto";
      a.addEventListener("canplaythrough", () => { this.listo = true; }, { once:true });
      a.addEventListener("error", () => { this.fallo = true; this.el = null; }, { once:true });
      this.el = a;
    } catch(e){ this.fallo = true; }
  },
  play(){
    this.init();
    if(!this.el) return false;
    const p = this.el.play();
    if(p && p.catch) p.catch(() => {});
    return true;
  },
  stop(){
    if(!this.el) return;
    const a = this.el;
    let v = a.volume;
    const baja = setInterval(() => {
      v -= 0.05;
      if(v <= 0.02){ clearInterval(baja); a.pause(); a.currentTime = 0; a.volume = 0.35; }
      else a.volume = v;
    }, 60);
  },
  disponible(){ this.init(); return !!this.el && !this.fallo; }
};

FX.music = {
  on: localStorage.getItem("tm_music") !== "off",
  playing: false, timer: null, bus: null, paso: 0,
  // Dm - Bb - F - C, en registro medio-agudo para que se oiga en altavoces de celular
  acordes: [
    { pad:[293.66, 440.00, 587.33], arp:[587.33, 698.46, 880.00, 698.46] },
    { pad:[233.08, 349.23, 466.16], arp:[466.16, 587.33, 698.46, 587.33] },
    { pad:[349.23, 523.25, 698.46], arp:[698.46, 880.00, 1046.50, 880.00] },
    { pad:[261.63, 392.00, 523.25], arp:[523.25, 659.25, 784.00, 659.25] }
  ],
  arranca(){
    if(this.playing || !this.on || !FX.on) return;
    if(FX.track.disponible()){ this.playing = true; FX.track.play(); return; }
    const ac = FX.ac(); if(!ac) return;
    this.bus = ac.createGain();
    this.bus.gain.setValueAtTime(0.0001, ac.currentTime);
    this.bus.gain.exponentialRampToValueAtTime(0.13, ac.currentTime + 2);
    const filtro = ac.createBiquadFilter();
    filtro.type = "lowpass"; filtro.frequency.value = 2600; filtro.Q.value = 0.7;
    this.bus.connect(filtro); filtro.connect(ac.destination);
    this.playing = true; this.paso = 0;
    this.compas();
    this.timer = setInterval(()=>this.compas(), 4000);
  },
  compas(){
    const ac = FX.ac(); if(!ac || !this.bus || !this.playing) return;
    const t = ac.currentTime;
    const { pad, arp } = this.acordes[this.paso % this.acordes.length];

    // colchón de acordes
    pad.forEach((freq, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.34 / (i*0.5 + 1), t + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.1);
      o.connect(g); g.connect(this.bus);
      o.start(t); o.stop(t + 4.3);
    });

    // arpegio: la melodía que realmente se escucha
    arp.forEach((freq, i) => {
      const d = i * 1;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, t + d);
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.5, t + d + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.85);
      o.connect(g); g.connect(this.bus);
      o.start(t + d); o.stop(t + d + 0.9);
    });

    this.paso++;
  },
  para(){
    FX.track.stop();
    if(this.timer){ clearInterval(this.timer); this.timer = null; }
    const ac = FX.ctx;
    if(ac && this.bus){
      try {
        const g = this.bus.gain;
        g.cancelScheduledValues(ac.currentTime);
        g.setValueAtTime(Math.max(g.value, 0.0001), ac.currentTime);
        g.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1);
      } catch(e){}
    }
    this.bus = null;
    this.playing = false;
  },
  toggle(){
    this.on = !this.on;
    localStorage.setItem("tm_music", this.on ? "on" : "off");
    if(this.on){ this.para(); this.arranca(); } else this.para();
    return this.on;
  }
};

window.FX = FX;

function shakeScreen(){
  const el = document.getElementById("app");
  if(!el) return;
  el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
  setTimeout(()=>el.classList.remove("shake"), 600);
}
window.shakeScreen = shakeScreen;

function burstConfetti(n = 40, big = false){
  const cols = ["#5B3FA8","#17A2A2","#D6336C","#DD9414","#D9531E","#1E7A5F"];
  const wrap = document.createElement("div");
  wrap.className = "confetti-layer";
  for(let i=0;i<n;i++){
    const p = document.createElement("i");
    const size = big ? 8 + Math.random()*10 : 6 + Math.random()*7;
    p.style.cssText = `left:${Math.random()*100}%;width:${size}px;height:${size*1.5}px;background:${cols[i%cols.length]};animation-delay:${Math.random()*0.4}s;animation-duration:${1.4+Math.random()*1.2}s;border-radius:${Math.random()>0.5?"50%":"2px"};`;
    wrap.appendChild(p);
  }
  document.body.appendChild(wrap);
  setTimeout(()=>wrap.remove(), 3200);
}
window.burstConfetti = burstConfetti;

function flashPoints(text, color = "#1E7A5F"){
  const el = document.createElement("div");
  el.className = "points-pop";
  el.textContent = text;
  el.style.color = color;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 1400);
}
window.flashPoints = flashPoints;

function vibrate(ms){ if(navigator.vibrate) try { navigator.vibrate(ms); } catch(e){} }
window.vibrate = vibrate;

// Desbloquear el audio en el primer toque de la pantalla
(function(){
  const unlock = () => {
    const ac = FX.ac();
    if(ac && ac.state === "suspended") ac.resume().catch(()=>{});
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("touchstart", unlock);
    document.removeEventListener("keydown", unlock);
  };
  document.addEventListener("pointerdown", unlock, { once:false });
  document.addEventListener("touchstart", unlock, { once:false });
  document.addEventListener("keydown", unlock, { once:false });
})();
