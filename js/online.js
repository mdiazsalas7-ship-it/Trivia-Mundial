import { db, doc, setDoc, getDoc, updateDoc, onSnapshot, deleteDoc } from "./firebase.js";

const O = {
  code: null, me: null, isHost: false,
  room: null, unsub: null, tick: null, sending: false
};
window.O = O;

const RID = () => Math.random().toString(36).slice(2, 10);
const CODE = () => { const L = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({length:4},()=>L[Math.floor(Math.random()*L.length)]).join(""); };
const roomRef = c => doc(db, "salas", c);
const now = () => Date.now();

function myName(){ const p = O.room?.jugadores?.find(j => j.id === O.me); return p ? p.nombre : ""; }
function isMyTurn(){ const r = O.room; return r && r.jugadores[r.turno] && r.jugadores[r.turno].id === O.me; }
function turnName(){ const r = O.room; return r?.jugadores?.[r.turno]?.nombre || ""; }

function stopAll(){
  if(O.unsub){ O.unsub(); O.unsub = null; }
  if(O.tick){ clearInterval(O.tick); O.tick = null; }
}
window.leaveRoom = async function(){
  if(!confirm("¿Salir de la sala?")) return;
  const r = O.room;
  if(r && r.fase === "lobby"){
    try {
      const rest = r.jugadores.filter(j => j.id !== O.me);
      if(rest.length === 0 && O.isHost) await deleteDoc(roomRef(O.code));
      else await updateDoc(roomRef(O.code), { jugadores: rest });
    } catch(e){}
  }
  stopAll(); O.code = null; O.room = null; O.isHost = false;
  go("home");
};

/* ---------- MENÚ ONLINE ---------- */
window.renderOnlineMenu = function(){
  stopAll();
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 px-5 py-6 pb-10 max-w-lg mx-auto w-full">
    <h2 class="font-display font-bold text-2xl mb-1">Jugar en línea</h2>
    <p class="text-on-surface-variant mb-6">Todos responden a la vez desde su propio celular. El más rápido gana más puntos.</p>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mb-4">
      <p class="font-bold mb-3">Tu nombre</p>
      <input id="onName" placeholder="Ej. Abuela Rosa" maxlength="18" value="${localStorage.getItem("tm_name")||""}" class="w-full border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary-container focus:ring-0"/>
    </div>
    <button onclick="createRoom()" class="w-full bg-primary-container text-white py-4 rounded-2xl font-display font-extrabold text-xl block-shadow-primary active-btn-press transition-all flex items-center justify-center gap-2 mb-4">
      <span class="material-symbols-outlined">add_circle</span> Crear sala</button>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm">
      <p class="font-bold mb-3">¿Tienes un código?</p>
      <input id="onCode" placeholder="ABCD" maxlength="4" oninput="this.value=this.value.toUpperCase()" class="w-full border-2 border-outline-variant rounded-xl px-4 py-3 text-center font-display font-extrabold text-3xl tracking-[0.4em] focus:border-primary-container focus:ring-0"/>
      <button onclick="joinRoom()" class="mt-3 w-full bg-cat-ciencia text-white py-3.5 rounded-xl font-bold text-lg active-btn-press transition-all" style="box-shadow:0 6px 0 0 #0f5340;">Unirme a la sala</button>
    </div>
    <p id="onErr" class="text-error font-bold text-center mt-4"></p>
  </main>`;
};

function readName(){
  const v = (document.getElementById("onName")?.value || "").trim();
  if(!v){ const e = document.getElementById("onErr"); if(e) e.textContent = "Escribe tu nombre para continuar."; return null; }
  localStorage.setItem("tm_name", v);
  return v;
}

window.createRoom = async function(){
  const name = readName(); if(!name) return;
  O.me = RID(); O.isHost = true;
  let code = CODE();
  try {
    for(let i=0;i<5;i++){ const s = await getDoc(roomRef(code)); if(!s.exists()) break; code = CODE(); }
    await setDoc(roomRef(code), {
      creada: now(), host: O.me, fase: "lobby",
      jugadores: [{ id:O.me, nombre:name, pts:0, fifty:true }],
      totalQ: 10, segundos: 20,
      orden: [], turno: 0, hechas: 0, mano: [], carta: null,
      usadas: [], respuestas: {}, oculta50: {}, deadline: 0, bolsa: []
    });
    O.code = code; listen();
  } catch(e){ showErr(e); }
};

window.joinRoom = async function(){
  const name = readName(); if(!name) return;
  const code = (document.getElementById("onCode")?.value || "").trim().toUpperCase();
  const err = document.getElementById("onErr");
  if(code.length !== 4){ if(err) err.textContent = "El código tiene 4 letras."; return; }
  try {
    const snap = await getDoc(roomRef(code));
    if(!snap.exists()){ if(err) err.textContent = "No encontramos esa sala. Revisa el código."; return; }
    const r = snap.data();
    if(r.fase !== "lobby"){ if(err) err.textContent = "Esa partida ya comenzó."; return; }
    if(r.jugadores.length >= 8){ if(err) err.textContent = "La sala está llena (máximo 8)."; return; }
    O.me = RID(); O.isHost = false; O.code = code;
    await updateDoc(roomRef(code), { jugadores: [...r.jugadores, { id:O.me, nombre:name, pts:0, fifty:true }] });
    listen();
  } catch(e){ showErr(e); }
};

function showErr(e){
  console.error(e);
  const el = document.getElementById("onErr");
  const msg = String(e?.code||e).includes("permission")
    ? "Sin permisos: revisa las reglas de Firestore en la consola de Firebase."
    : "No pudimos conectar. Revisa tu internet e inténtalo de nuevo.";
  if(el) el.textContent = msg; else alert(msg);
}

function listen(){
  stopAll();
  O.unsub = onSnapshot(roomRef(O.code), snap => {
    if(!snap.exists()){ stopAll(); alert("La sala fue cerrada."); go("home"); return; }
    O.room = snap.data();
    paint();
  }, showErr);
  O.tick = setInterval(() => {
    const r = O.room;
    if(!r || r.fase !== "pregunta") return;
    const left = Math.max(0, Math.ceil((r.deadline - now())/1000));
    paintClock(left);
    if(!O.isHost) return;
    const todos = r.jugadores.every(j => r.respuestas && r.respuestas[j.id]);
    if((left <= 0 || todos) && !O.sending){ O.sending = true; cerrarRonda().finally(()=>{ O.sending = false; }); }
  }, 300);
}

/* ---------- PINTAR SEGÚN LA FASE ---------- */
function paint(){
  const r = O.room;
  if(!r) return;
  if(r.fase === "lobby") return paintLobby();
  if(r.fase === "mazo") return paintDeck();
  if(r.fase === "pregunta"){
    if(O.lastCarta !== r.carta){ O.lastCarta = r.carta; return throwOnline(); }
    return paintQuestion();
  }
  if(r.fase === "ronda") return paintRonda();
  if(r.fase === "fin") return paintEnd();
}

function paintLobby(){
  const r = O.room;
  app.innerHTML = `${topBar({exit:false})}
  <main class="flex-1 px-5 py-6 pb-10 max-w-lg mx-auto w-full">
    <div class="bg-primary-container text-white rounded-2xl p-6 text-center mb-5" style="box-shadow:0 6px 0 0 #21005e;">
      <p class="text-white/80 font-bold text-sm uppercase tracking-widest">Código de la sala</p>
      <p class="font-display font-extrabold text-6xl tracking-[0.2em] my-2">${O.code}</p>
      <button onclick="shareCode()" class="mt-1 bg-white/25 px-4 py-2 rounded-xl font-bold inline-flex items-center gap-1 active:scale-95 transition-transform">
        <span class="material-symbols-outlined" style="font-size:18px;">share</span> Compartir</button>
    </div>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mb-5">
      <p class="font-bold mb-3">En la sala (${r.jugadores.length})</p>
      ${r.jugadores.map((j,i)=>`<div class="flex items-center gap-3 py-2 border-b-2 border-outline-variant last:border-0">
        <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style="background:${Object.values(CATS)[i%6].color}">${j.nombre.charAt(0).toUpperCase()}</div>
        <span class="font-bold flex-1">${j.nombre}${j.id===O.me?" (tú)":""}</span>
        ${j.id===r.host?'<span class="text-xs font-bold bg-primary-fixed text-primary px-2 py-1 rounded-full">Anfitrión</span>':""}
      </div>`).join("")}
      ${r.jugadores.length<2?'<p class="text-on-surface-variant text-sm mt-3">Esperando a que se una alguien más…</p>':""}
    </div>
    ${O.isHost ? `<div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mb-5">
      <p class="font-bold mb-3">Preguntas de la partida</p>
      <div class="flex gap-3">${[5,10,15].map(n=>`<button onclick="setCfg('totalQ',${n})" class="flex-1 py-3 rounded-xl font-bold border-2 transition-all active:translate-y-1 ${r.totalQ===n?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">${n}</button>`).join("")}</div>
      <p class="font-bold mt-4 mb-3">Segundos por pregunta</p>
      <div class="flex gap-3">${[15,20,30].map(n=>`<button onclick="setCfg('segundos',${n})" class="flex-1 py-3 rounded-xl font-bold border-2 transition-all active:translate-y-1 ${r.segundos===n?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">${n} s</button>`).join("")}</div>
    </div>
    <button onclick="startOnline()" ${r.jugadores.length<2?"disabled":""} class="w-full ${r.jugadores.length<2?"bg-outline-variant text-white/70":"bg-primary-container text-white block-shadow-primary active-btn-press"} py-4 rounded-2xl font-display font-extrabold text-xl transition-all">
      ${r.jugadores.length<2?"Faltan jugadores":"¡Comenzar partida!"}</button>`
    : `<div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-6 text-center">
        <span class="material-symbols-outlined text-primary" style="font-size:36px;">hourglass_top</span>
        <p class="font-bold mt-2">Esperando al anfitrión…</p>
        <p class="text-on-surface-variant text-sm mt-1">La partida empieza cuando ${r.jugadores.find(j=>j.id===r.host)?.nombre||"el anfitrión"} lo indique.</p>
      </div>`}
    <button onclick="leaveRoom()" class="mt-5 w-full text-on-surface-variant font-bold py-3">Salir de la sala</button>
  </main>`;
}

window.shareCode = async function(){
  const url = location.origin + location.pathname;
  const txt = `¡Juguemos Trivia Mundial! Entra a ${url} y usa el código ${O.code}`;
  try {
    if(navigator.share) await navigator.share({ title:"Trivia Mundial", text:txt });
    else { await navigator.clipboard.writeText(txt); alert("Invitación copiada. ¡Pégala en WhatsApp!"); }
  } catch(e){}
};

window.setCfg = async function(k,v){ try { await updateDoc(roomRef(O.code), { [k]: v }); } catch(e){ showErr(e); } };

function nuevaBolsaOnline(){ return shuffle(Object.keys(CATS)); }

function manoConBolsa(pool, bolsa, excluir){
  let b = (bolsa && bolsa.length) ? bolsa.slice() : nuevaBolsaOnline();
  const disponibles = pool.filter(qi => !excluir.includes(qi));
  let cats = b.filter(c => disponibles.some(qi => QS[qi].c === c)).slice(0,4);
  if(cats.length < 4){
    const extra = nuevaBolsaOnline().filter(c => !cats.includes(c) && disponibles.some(qi => QS[qi].c === c));
    cats = cats.concat(extra.slice(0, 4 - cats.length));
  }
  let mano = cats.map(c => {
    const delCat = disponibles.filter(qi => QS[qi].c === c);
    return delCat[Math.floor(Math.random()*delCat.length)];
  }).filter(x => x !== undefined);
  if(mano.length < 4) mano = mano.concat(shuffle(disponibles.filter(qi=>!mano.includes(qi))).slice(0, 4-mano.length));
  return { mano: shuffle(mano), bolsa: b };
}

function manoVariada(pool, excluir){
  const porCat = {};
  shuffle(pool.slice()).forEach(qi => { if(excluir.includes(qi)) return; const c = QS[qi].c; if(!porCat[c]) porCat[c] = qi; });
  let mano = shuffle(Object.values(porCat)).slice(0,4);
  if(mano.length < 4){
    const resto = shuffle(pool.filter(qi => !mano.includes(qi) && !excluir.includes(qi)));
    mano = mano.concat(resto.slice(0, 4 - mano.length));
  }
  return mano;
}

function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

window.startOnline = async function(){
  if(FX.on && FX.music.on) FX.music.arranca();
  const orden = shuffle(QS.map((_,i)=>i));
  try {
    await updateDoc(roomRef(O.code), {
      fase:"mazo", orden, turno:0, hechas:0, usadas:[],
      ...(()=>{ const x = manoConBolsa(orden, nuevaBolsaOnline(), []); return { mano:x.mano, bolsa:x.bolsa }; })(),
      carta:null,
      respuestas:{}, oculta50:{},
      jugadores: O.room.jugadores.map(j=>({ id:j.id, nombre:j.nombre, pts:0, fifty:true }))
    });
  } catch(e){ showErr(e); }
};

/* ---------- MAZO: elige quien tiene el turno, responden todos ---------- */
function paintDeck(){
  O.lastCarta = null; O.lastFx = null;
  const r = O.room;
  const mine = isMyTurn();
  const ronda = r.hechas + 1;
  app.innerHTML = `${topBar({exit:false})}
  <main class="flex-1 px-5 py-5 pb-10 max-w-lg mx-auto w-full">
    ${scoreStrip()}
    <div class="text-center my-4">
      <p class="text-on-surface-variant font-bold text-sm uppercase tracking-wider">Pregunta ${ronda} de ${r.totalQ}</p>
      <h2 class="font-display font-bold text-2xl">${mine ? "Elige la carta" : turnName()+" elige la carta"}</h2>
      <p class="text-on-surface-variant text-sm mt-1">Después responden todos a la vez</p>
    </div>
    <div class="grid grid-cols-2 gap-4 ${mine?"":"opacity-60 pointer-events-none"}">
      ${r.mano.map((qi,i)=>`<button onclick="pickOnline(${qi})" class="card-perspective aspect-[3/4] relative w-full active:translate-y-1 transition-transform deal-in" style="animation-delay:${i*0.08}s">
        <div class="absolute inset-0 floating-card" style="--rot:0deg;animation-delay:${i*-1.4}s;">${cardFace(QS[qi].c)}</div></button>`).join("")}
    </div>
    <p class="text-center text-on-surface-variant mt-5">${mine ? "Tu elección marca la categoría para todos" : "Prepárate…"}</p>
    ${hostTools()}
  </main>`;
}

window.pickOnline = async function(qi){
  if(!isMyTurn() || O.sending) return;
  O.sending = true;
  try {
    const cat = QS[qi].c;
    let bolsa = (O.room.bolsa || []).filter(c => c !== cat);
    if(bolsa.length === 0) bolsa = nuevaBolsaOnline();
    await updateDoc(roomRef(O.code), {
      fase:"pregunta", carta:qi, bolsa, deadline: now() + O.room.segundos*1000 + 2600, respuestas:{}
    });
  } catch(e){ showErr(e); }
  O.sending = false;
};

/* ---------- PREGUNTA SIMULTÁNEA ---------- */
function throwOnline(){
  const r = O.room, q = QS[r.carta], c = CATS[q.c];
  FX.whoosh(); vibrate(20);
  app.innerHTML = `${topBar({exit:false})}
  <main class="flex-1 px-5 max-w-lg mx-auto w-full">
    <div class="stage card-perspective">
      <div id="oFlyer" class="throwing w-56 aspect-[3/4] relative">${cardFace(q.c)}</div>
    </div>
    <p id="oFlyTxt" class="text-center font-display font-bold text-xl text-on-surface-variant">${turnName()} lanza la carta…</p>
  </main>`;
  setTimeout(()=>FX.drum(), 900);
  setTimeout(()=>{
    FX.land(); vibrate(40); shakeScreen();
    const t = document.getElementById("oFlyTxt");
    if(t){ t.textContent = q.c.toUpperCase(); t.style.color = c.color; t.classList.add("animate-pop"); }
    const f = document.getElementById("oFlyer"); if(f) f.classList.add("glow");
  }, 1880);
  setTimeout(()=>{ if(O.room && O.room.fase === "pregunta") paintQuestion(); }, 2500);
}

function paintClock(left){
  const clk = document.getElementById("oClk"), ring = document.getElementById("oRing");
  if(clk) clk.textContent = left;
  if(ring){
    ring.style.strokeDashoffset = 251.3 * (1 - left / (O.room.segundos || 20));
    if(left <= 5){ ring.setAttribute("stroke", "#FF6B6B"); if(clk){ clk.classList.add("text-error"); clk.classList.remove("text-primary"); } }
  }
  if(left <= 5 && left > 0 && O.lastBeep !== left && !yaRespondi()){ O.lastBeep = left; FX.hurry(); }
}

function yaRespondi(){ return !!(O.room?.respuestas && O.room.respuestas[O.me]); }

function paintQuestion(){
  const r = O.room, q = QS[r.carta], c = CATS[q.c];
  const left = Math.max(0, Math.ceil((r.deadline - now())/1000));
  const me = r.jugadores.find(j=>j.id===O.me);
  if(yaRespondi()) return paintEsperando();
  app.innerHTML = `${topBar({exit:false})}
  <main class="flex-1 px-5 py-4 pb-10 max-w-lg mx-auto w-full flex flex-col items-center">
    <div class="relative w-24 h-24 mb-2">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="40" fill="transparent" stroke="#2B3160" stroke-width="9"></circle>
        <circle id="oRing" cx="48" cy="48" r="40" fill="transparent" stroke="${c.color}" stroke-width="9" stroke-linecap="round" stroke-dasharray="251.3" stroke-dashoffset="0"></circle>
      </svg>
      <span id="oClk" class="absolute inset-0 flex items-center justify-center font-display font-extrabold text-4xl text-primary">${left}</span>
    </div>
    <p class="font-bold mb-3 text-center">¡Responden todos! Cuanto más rápido, más puntos</p>
    <div class="w-full bg-surface-container rounded-[28px] border-4 p-5" style="border-color:${c.color};box-shadow:0 8px 0 0 rgba(0,0,0,0.55);">
      <div class="flex justify-center mb-4">
        <span class="text-white text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full flex items-center gap-1" style="background:${c.color}">
          <span class="material-symbols-outlined" style="font-size:15px;">${c.icon}</span>${q.c}${c.x2?" · x2":""}</span></div>
      <p class="font-display font-bold text-xl text-center mb-5">${q.q}</p>
      <div class="grid gap-3" id="oOpts">
        ${q.o.map((o,j)=>{
          const hidden = (r.oculta50 && r.oculta50[O.me] || []).includes(j);
          return `<button ${hidden?"disabled":`onclick="answerOnline(${j})"`} class="w-full border-2 border-outline-variant rounded-2xl py-3.5 px-4 font-bold text-left block-shadow-sm transition-all ${hidden?"opacity-25":"active-btn-press hover:border-primary-container"}">${o}</button>`;
        }).join("")}
      </div>
      ${me?.fifty ? `<button onclick="fiftyOnline()" class="mt-4 w-full border-2 border-cat-ciencia text-cat-ciencia rounded-xl py-2.5 font-bold flex items-center justify-center gap-1 active:translate-y-1 transition-all">
        <span class="material-symbols-outlined" style="font-size:18px;">bolt</span> Lifeline 50/50</button>` : ""}
    </div>
  </main>`;
}

function paintEsperando(){
  const r = O.room;
  const total = r.jugadores.length;
  const hechas = Object.keys(r.respuestas || {}).length;
  const left = Math.max(0, Math.ceil((r.deadline - now())/1000));
  app.innerHTML = `${topBar({exit:false})}
  <main class="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col items-center justify-center">
    <div class="bg-surface-container border-2 border-outline-variant rounded-[28px] p-8 w-full text-center block-shadow-sm">
      <span class="material-symbols-outlined text-primary msf urgent" style="font-size:46px;">hourglass_top</span>
      <h2 class="font-display font-extrabold text-2xl mt-2">Respuesta enviada</h2>
      <p class="text-on-surface-variant mt-1">Esperando a los demás… <span id="oClk">${left}</span> s</p>
      <p class="font-display font-extrabold text-3xl text-primary mt-4">${hechas} / ${total}</p>
      <div class="flex flex-wrap justify-center gap-2 mt-4">
        ${r.jugadores.map(j=>`<span class="px-3 py-1.5 rounded-full text-sm font-bold border-2 ${r.respuestas && r.respuestas[j.id] ? "border-success text-success" : "border-outline-variant text-on-surface-variant"}">${j.nombre}</span>`).join("")}
      </div>
    </div>
    ${hostTools()}
  </main>`;
}

window.fiftyOnline = async function(){
  const r = O.room, q = QS[r.carta];
  const wrong = shuffle(q.o.map((_,i)=>i).filter(i=>i!==q.a)).slice(0,2);
  try {
    await updateDoc(roomRef(O.code), {
      ["oculta50." + O.me]: wrong,
      jugadores: r.jugadores.map(j => j.id===O.me ? { ...j, fifty:false } : j)
    });
  } catch(e){ showErr(e); }
};

window.answerOnline = async function(j){
  if(O.sending || yaRespondi()) return;
  O.sending = true;
  const r = O.room, q = QS[r.carta], c = CATS[q.c];
  const restante = Math.max(0, (r.deadline - now())/1000);
  const ok = j === q.a;
  const base = c.x2 ? 20 : 10;
  const rapidez = ok ? Math.round(base * 0.5 * Math.min(1, restante / r.segundos)) : 0;
  const pts = ok ? base + rapidez : 0;
  if(ok){ FX.tone(880,0.1,"triangle",0.14); } else { FX.tone(200,0.15,"sawtooth",0.1); }
  try {
    await updateDoc(roomRef(O.code), {
      ["respuestas." + O.me]: { j, ok, pts, t: now() }
    });
  } catch(e){ showErr(e); }
  O.sending = false;
};

/* ---------- RESULTADOS DE LA RONDA ---------- */
async function cerrarRonda(){
  const r = O.room;
  if(!r || r.fase !== "pregunta") return;
  const resp = r.respuestas || {};
  const jugadores = r.jugadores.map(j => {
    const mi = resp[j.id];
    return { ...j, pts: j.pts + (mi ? mi.pts : 0), ultimo: mi ? { ok: mi.ok, pts: mi.pts } : { ok:false, pts:0, sin:true } };
  });
  try { await updateDoc(roomRef(O.code), { fase:"ronda", jugadores }); }
  catch(e){ showErr(e); }
}

function paintRonda(){
  const r = O.room, q = QS[r.carta], c = CATS[q.c];
  const mio = r.jugadores.find(j=>j.id===O.me);
  const acerte = mio?.ultimo?.ok;
  if(O.lastFx !== "ronda"){
    O.lastFx = "ronda";
    if(acerte){ FX.good(0); burstConfetti(40); flashPoints("+"+mio.ultimo.pts, "#37D399"); vibrate([30,50,30]); }
    else { FX.bad(); shakeScreen(); vibrate(80); }
  }
  const orden = [...r.jugadores].sort((a,b)=>b.pts-a.pts);
  app.innerHTML = `${topBar({exit:false})}
  <main class="flex-1 px-5 py-5 pb-10 max-w-lg mx-auto w-full">
    <div class="bg-surface-container border-4 rounded-[28px] p-5 text-center animate-pop" style="border-color:${acerte?"#1E7A5F":c.color};box-shadow:0 8px 0 0 rgba(0,0,0,0.55);">
      <span class="material-symbols-outlined msf" style="font-size:44px;color:${acerte?"#37D399":"#FF6B6B"};">${acerte?"check_circle":"cancel"}</span>
      <h2 class="font-display font-extrabold text-2xl mt-1">${acerte?"¡Correcto! +"+mio.ultimo.pts:"Fallaste"}</h2>
      <p class="text-on-surface-variant mt-2 text-sm">La respuesta era</p>
      <p class="font-display font-extrabold text-xl" style="color:${c.color}">${q.o[q.a]}</p>
    </div>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-4 mt-4 block-shadow-sm">
      <p class="font-bold mb-2 text-sm uppercase tracking-wider text-on-surface-variant">Clasificación</p>
      ${orden.map((p,i)=>`<div class="flex items-center justify-between py-2 border-b-2 border-outline-variant last:border-0">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-6 text-center font-display font-extrabold ${i===0?"text-cat-historia":"text-on-surface-variant"}">${i+1}</span>
          <span class="material-symbols-outlined msf" style="font-size:17px;color:${p.ultimo?.ok?"#37D399":(p.ultimo?.sin?"#6F6A92":"#FF6B6B")};">${p.ultimo?.ok?"check_circle":(p.ultimo?.sin?"schedule":"cancel")}</span>
          <span class="font-bold truncate">${p.nombre}${p.id===O.me?" (tú)":""}</span>
        </div>
        <div class="text-right flex-shrink-0">
          ${p.ultimo?.pts?`<span class="text-success font-bold text-sm mr-2">+${p.ultimo.pts}</span>`:""}
          <span class="font-display font-extrabold">${p.pts}</span>
        </div></div>`).join("")}
    </div>
    ${O.isHost
      ? `<button onclick="nextOnline()" class="mt-5 w-full bg-primary-container text-white py-4 rounded-2xl font-bold text-lg block-shadow-primary active-btn-press transition-all">Siguiente pregunta</button>`
      : `<p class="text-center text-on-surface-variant mt-5">Esperando al anfitrión…</p>`}
  </main>`;
}

window.nextOnline = async function(){
  const r = O.room;
  const hechas = r.hechas + 1;
  if(hechas >= r.totalQ) return updateDoc(roomRef(O.code), { fase:"fin", hechas });
  const usadas = (r.usadas || []).concat([r.carta]);
  const restantes = r.orden.filter(qi => !usadas.includes(qi));
  if(restantes.length < 4) return updateDoc(roomRef(O.code), { fase:"fin", hechas });
  try {
    await updateDoc(roomRef(O.code), {
      fase:"mazo", hechas, usadas,
      turno: (r.turno + 1) % r.jugadores.length,
      mano: manoConBolsa(restantes, r.bolsa, []).mano,
      carta:null, respuestas:{}, oculta50:{},
      jugadores: r.jugadores.map(j => { const { ultimo, ...resto } = j; return resto; })
    });
  } catch(e){ showErr(e); }
};

/* ---------- FIN ---------- */
function paintEnd(){
  const r = O.room;
  if(O.lastFx !== "fin"){ O.lastFx = "fin"; FX.music.para(); FX.fanfare(); burstConfetti(90, true); setTimeout(()=>burstConfetti(60,true),700); vibrate([60,40,60,40,120]); }
  const s = [...r.jugadores].sort((a,b)=>b.pts-a.pts);
  const tie = s.length>1 && s[0].pts===s[1].pts;
  const medals = ["#DD9414","#9ca3af","#b45309"];
  app.innerHTML = `${topBar()}
  <main class="flex-1 px-5 py-8 max-w-lg mx-auto w-full">
    <div class="bg-surface-container border-2 border-outline-variant rounded-[28px] p-6 text-center block-shadow-sm animate-pop">
      <span class="material-symbols-outlined text-cat-historia msf" style="font-size:60px;">trophy</span>
      <h2 class="font-display font-extrabold text-3xl mt-1">${tie?"¡Empate mundial!":"¡Ganó "+s[0].nombre+"!"}</h2>
      <p class="text-on-surface-variant mt-1 mb-5">Sala ${O.code}</p>
      <div class="text-left">
        ${s.map((p,i)=>`<div class="flex items-center justify-between py-3 border-b-2 border-outline-variant last:border-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style="background:${i<3?medals[i]:"#2B3160"}">${i+1}</div>
            <span class="font-bold">${p.nombre}${p.id===O.me?" (tú)":""}</span></div>
          <span class="font-display font-extrabold text-primary">${p.pts} pts</span></div>`).join("")}
      </div>
      <div class="grid gap-3 mt-6">
        ${O.isHost?`<button onclick="startOnline()" class="w-full bg-primary-container text-white py-4 rounded-2xl font-bold text-lg block-shadow-primary active-btn-press transition-all flex items-center justify-center gap-2"><span class="material-symbols-outlined">replay</span> Revancha</button>`:""}
        <button onclick="leaveRoom()" class="w-full bg-surface-container border-2 border-outline-variant py-3.5 rounded-2xl font-bold text-on-surface-variant block-shadow-sm active-btn-press transition-all">Salir de la sala</button>
      </div>
    </div>
  </main>`;
}

/* ---------- COMUNES ---------- */
function scoreStrip(){
  const r = O.room;
  const orden = [...r.jugadores].sort((a,b)=>b.pts-a.pts);
  return `<div class="flex gap-2 overflow-x-auto pb-1">
    ${orden.map((j)=>`<div class="flex-shrink-0 px-3 py-2 rounded-xl border-2 ${j.id===O.me?"border-primary-container bg-primary-fixed":"border-outline-variant bg-surface-container"}">
      <p class="text-xs font-bold ${j.id===O.me?"text-primary":"text-on-surface-variant"}">${j.nombre}${j.id===O.me?" (tú)":""}</p>
      <p class="font-display font-extrabold text-lg">${j.pts}</p></div>`).join("")}
  </div>`;
}

function hostTools(){
  if(!O.isHost) return "";
  return `<button onclick="forzarSiguiente()" class="mt-6 mx-auto block text-on-surface-variant text-sm font-bold underline">Forzar siguiente (anfitrión)</button>`;
}

window.forzarSiguiente = function(){
  const r = O.room;
  if(!r) return;
  if(r.fase === "pregunta") return cerrarRonda();
  if(r.fase === "ronda") return nextOnline();
  if(r.fase === "mazo" && r.mano?.length) return pickOnline(r.mano[0]);
};
