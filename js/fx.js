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
FX.music = {
  on: localStorage.getItem("tm_music") !== "off",
  playing: false, timer: null, bus: null, paso: 0,
  // progresión melancólica y épica: Dm - Bb - F - C
  acordes: [[146.83,220.00,293.66],[116.54,174.61,233.08],[174.61,261.63,349.23],[130.81,196.00,261.63]],
  arranca(){
    if(this.playing || !this.on) return;
    const ac = FX.ac(); if(!ac) return;
    this.bus = ac.createGain();
    this.bus.gain.setValueAtTime(0.0001, ac.currentTime);
    this.bus.gain.exponentialRampToValueAtTime(0.055, ac.currentTime + 2.5);
    const filtro = ac.createBiquadFilter();
    filtro.type = "lowpass"; filtro.frequency.value = 900;
    this.bus.connect(filtro); filtro.connect(ac.destination);
    this.playing = true; this.paso = 0;
    this.compas();
    this.timer = setInterval(()=>this.compas(), 4000);
  },
  compas(){
    const ac = FX.ac(); if(!ac || !this.bus) return;
    const t = ac.currentTime;
    const acorde = this.acordes[this.paso % this.acordes.length];
    acorde.forEach((freq, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5 / (i+1.2), t + 1.2);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);
      o.connect(g); g.connect(this.bus);
      o.start(t); o.stop(t + 4.4);
    });
    // pulso suave que marca el tiempo
    [0, 2].forEach(d => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(acorde[0] * 2, t + d);
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.18, t + d + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.9);
      o.connect(g); g.connect(this.bus);
      o.start(t + d); o.stop(t + d + 1);
    });
    this.paso++;
  },
  para(){
    if(this.timer){ clearInterval(this.timer); this.timer = null; }
    const ac = FX.ctx;
    if(ac && this.bus){
      try {
        this.bus.gain.cancelScheduledValues(ac.currentTime);
        this.bus.gain.setValueAtTime(this.bus.gain.value || 0.05, ac.currentTime);
        this.bus.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.2);
      } catch(e){}
    }
    this.playing = false;
  },
  toggle(){
    this.on = !this.on;
    localStorage.setItem("tm_music", this.on ? "on" : "off");
    if(this.on) this.arranca(); else this.para();
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
