/* ================= ESTADO ================= */
const S = {
  screen:"home",
  players:[], scores:[], fifty:[],
  turn:0, qDone:0, qPerPlayer:5,
  timerSecs:20, timer:null, left:20,
  used:new Set(), lastResults:null
};
const app = document.getElementById("app");
const shuffle = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const stopTimer = () => { if(S.timer){clearInterval(S.timer);S.timer=null;} };

/* ================= COMPONENTES ================= */
function topBar(opts={}){
  const left = opts.back
    ? `<button onclick="${opts.back}" class="text-primary p-2 rounded-xl active:translate-y-1 transition-all"><span class="material-symbols-outlined">arrow_back</span></button>`
    : `<span class="material-symbols-outlined text-primary msf">emoji_events</span>`;
  const right = opts.exit
    ? `<button onclick="confirmExit()" class="text-on-surface-variant p-2 rounded-xl active:translate-y-1 transition-all" aria-label="Salir de la partida"><span class="material-symbols-outlined">close</span></button>`
    : `<span class="w-10"></span>`;
  return `<header class="bg-surface w-full sticky top-0 z-40 border-b-2 border-outline-variant shadow-[0_4px_0_0_rgba(0,0,0,0.06)]">
    <div class="flex justify-between items-center px-5 h-16 max-w-lg mx-auto w-full">
      ${left}
      <h1 class="font-display font-extrabold text-2xl text-primary tracking-tight">Trivia Mundial</h1>
      ${right}
    </div></header>`;
}

function bottomNav(active){
  const items = [
    {id:"home",icon:"home",label:"Inicio"},
    {id:"cats",icon:"category",label:"Categorías"},
    {id:"board",icon:"military_tech",label:"Marcador"},
    {id:"settings",icon:"settings",label:"Ajustes"}
  ];
  return `<nav class="fixed bottom-0 left-0 w-full bg-surface z-50 rounded-t-xl border-t-2 border-outline-variant shadow-[0_-4px_0_0_rgba(0,0,0,0.05)] pb-4 pt-2">
    <div class="flex justify-around items-center px-2 max-w-lg mx-auto">
    ${items.map(it => it.id===active
      ? `<button onclick="go('${it.id}')" class="flex flex-col items-center bg-primary-container text-white rounded-xl px-4 py-1 -translate-y-1 border-b-4 border-primary-fixed-dim active:scale-95 transition-transform"><span class="material-symbols-outlined msf">${it.icon}</span><span class="text-sm font-bold">${it.label}</span></button>`
      : `<button onclick="go('${it.id}')" class="flex flex-col items-center text-on-surface-variant p-2 hover:text-primary active:scale-95 transition-all"><span class="material-symbols-outlined">${it.icon}</span><span class="text-sm font-bold">${it.label}</span></button>`
    ).join("")}
    </div></nav>`;
}

function floatingBg(){
  return `<div class="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
    <div class="floating-card absolute top-10 left-[5%] w-20 h-24 bg-primary-fixed rounded-xl border-2 border-primary-fixed-dim opacity-40" style="--rot:-12deg;"></div>
    <div class="floating-card absolute top-1/4 right-[8%] w-16 h-20 rounded-xl border-2 opacity-40" style="--rot:15deg;background:#c9f0ec;border-color:#17A2A2;animation-delay:-2s;"></div>
    <div class="floating-card absolute bottom-1/4 left-[12%] w-24 h-28 rounded-xl border-2 opacity-40" style="--rot:5deg;background:#fbd8e5;border-color:#D6336C;animation-delay:-4s;"></div>
    <div class="floating-card absolute top-2/3 right-[5%] w-20 h-24 rounded-xl border-2 opacity-40" style="--rot:-20deg;background:#fce4d6;border-color:#D9531E;animation-delay:-1s;"></div>
  </div>`;
}

function cardFace(cat, extra=""){
  const c = CATS[cat];
  if(c.img) return `<div class="card-face absolute inset-0 rounded-xl border-4 border-white overflow-hidden block-shadow-md ${extra}" style="background-image:url('${c.img}');background-size:cover;background-position:center;"></div>`;
  const badge = c.x2 ? `<span class="absolute top-2 right-2 bg-white text-cat-sorpresa text-xs font-bold px-2 py-0.5 rounded-full">x2 puntos</span>` : "";
  return `<div class="card-face absolute inset-0 rounded-xl border-4 border-white flex items-center justify-center overflow-hidden block-shadow-md ${extra}" style="background:${c.color};">
    <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image:${c.pattern};background-size:${c.psize};"></div>
    ${badge}
    <div class="flex flex-col items-center gap-2 z-10">
      <span class="material-symbols-outlined text-white" style="font-size:52px;">${c.icon}</span>
      <span class="text-white font-bold text-sm tracking-widest uppercase">${cat}</span>
    </div></div>`;
}

/* ================= PANTALLAS ================= */
function go(screen){ stopTimer(); S.screen=screen; render[screen](); window.scrollTo(0,0); }
function confirmExit(){
  if(confirm("¿Salir de la partida? Se perderá el progreso.")){ go("home"); }
}

const render = {};

render.home = () => {
  app.innerHTML = `${topBar()}
  <main class="flex-1 flex flex-col items-center justify-center px-5 pb-32 relative max-w-lg mx-auto w-full">
    ${floatingBg()}
    <div class="z-10 mt-8 mb-8"><img alt="Logo de Trivia Mundial" src="${LOGO_IMG}" class="w-56 h-56 object-contain drop-shadow-xl"/></div>
    <div class="z-10 w-full flex flex-col gap-4">
      <button onclick="go('setup')" class="w-full bg-primary-container text-white py-5 rounded-2xl font-display font-extrabold text-2xl block-shadow-primary active-btn-press transition-all flex items-center justify-center gap-2">
        <span class="material-symbols-outlined msf">groups</span><span>Jugar aquí</span></button>
      <button onclick="go('online')" class="w-full bg-cat-cultura text-white py-5 rounded-2xl font-display font-extrabold text-2xl active-btn-press transition-all flex items-center justify-center gap-2" style="box-shadow:0 6px 0 0 #0d6b6b;">
        <span class="material-symbols-outlined msf">travel_explore</span><span>Jugar en línea</span></button>
      <p class="text-center text-on-surface-variant text-sm -mt-1">Aquí = un solo celular · En línea = cada quien con el suyo</p>
      <div class="grid grid-cols-3 gap-3">
        <button onclick="go('cats')" class="bg-cat-ciencia text-white py-4 rounded-xl font-bold block-shadow-md active-btn-press transition-all flex flex-col items-center gap-1"><span class="material-symbols-outlined">category</span><span class="text-sm">Categorías</span></button>
        <button onclick="go('board')" class="bg-cat-entret text-white py-4 rounded-xl font-bold block-shadow-md active-btn-press transition-all flex flex-col items-center gap-1"><span class="material-symbols-outlined">military_tech</span><span class="text-sm">Marcador</span></button>
        <button onclick="go('settings')" class="bg-cat-deportes text-white py-4 rounded-xl font-bold block-shadow-md active-btn-press transition-all flex flex-col items-center gap-1"><span class="material-symbols-outlined">settings</span><span class="text-sm">Ajustes</span></button>
      </div>
      <div class="mt-4 bg-surface-container border-2 border-outline-variant p-5 rounded-2xl flex items-start gap-3">
        <div class="bg-primary-fixed p-2 rounded-full text-primary"><span class="material-symbols-outlined">lightbulb</span></div>
        <div><p class="font-bold text-sm">Reto del día</p>
        <p class="text-on-surface-variant mt-1">¿Cuántas maravillas del mundo conoces? Desafía a tus amigos ahora.</p></div>
      </div>
    </div>
  </main>${bottomNav("home")}`;
};

render.cats = () => {
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 px-5 py-6 pb-32 max-w-lg mx-auto w-full">
    <h2 class="font-display font-bold text-2xl mb-1">Categorías oficiales</h2>
    <p class="text-on-surface-variant mb-5">Seis mundos de preguntas. La tarjeta Sorpresa vale el doble.</p>
    <div class="grid grid-cols-2 gap-4">
      ${Object.keys(CATS).map((k,i)=>`<div class="card-perspective aspect-[3/4] relative animate-pop" style="animation-delay:${i*0.06}s">${cardFace(k)}</div>`).join("")}
    </div>
  </main>${bottomNav("cats")}`;
};

render.board = () => {
  const r = S.lastResults;
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 px-5 py-6 pb-32 max-w-lg mx-auto w-full">
    <h2 class="font-display font-bold text-2xl mb-5">Marcador</h2>
    ${ r ? `<div class="bg-white border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm">
        <p class="text-on-surface-variant text-sm font-bold uppercase tracking-wider mb-3">Última partida</p>
        ${r.map((p,i)=>scoreRow(p,i)).join("")}
      </div>`
    : `<div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-8 text-center">
        <span class="material-symbols-outlined text-primary" style="font-size:44px;">military_tech</span>
        <p class="font-bold mt-2">Aún no hay partidas</p>
        <p class="text-on-surface-variant mt-1 mb-4">Juega tu primera ronda y el podio aparecerá aquí.</p>
        <button onclick="go('setup')" class="bg-primary-container text-white px-6 py-3 rounded-xl font-bold block-shadow-primary active-btn-press transition-all">Jugar ahora</button>
      </div>` }
  </main>${bottomNav("board")}`;
};

render.settings = () => {
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 px-5 py-6 pb-32 max-w-lg mx-auto w-full">
    <h2 class="font-display font-bold text-2xl mb-5">Ajustes</h2>
    <div class="bg-white border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm">
      <p class="font-bold mb-2">Tiempo por pregunta</p>
      <div class="flex gap-3">
        ${[15,20,30].map(t=>`<button onclick="S.timerSecs=${t};render.settings()" class="flex-1 py-3 rounded-xl font-bold border-2 transition-all active:translate-y-1 ${S.timerSecs===t?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">${t} s</button>`).join("")}
      </div>
      <p class="text-on-surface-variant text-sm mt-3">Menos tiempo, más adrenalina. El bonus de rapidez se ajusta solo.</p>
    </div>
  </main>${bottomNav("settings")}`;
};

render.setup = () => {
  if(S._np===undefined) S._np=3;
  const est = Math.round(S._np * S.qPerPlayer * 0.7);
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 px-5 py-6 pb-10 max-w-lg mx-auto w-full">
    <h2 class="font-display font-bold text-2xl mb-5">Configuración de partida</h2>
    <div class="bg-white border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mb-5">
      <div class="flex justify-between items-center mb-3"><p class="font-bold">Jugadores (2 a 6)</p><span class="bg-primary-fixed text-primary font-bold px-3 py-1 rounded-full text-sm">${S._np}/6</span></div>
      <input type="range" min="2" max="6" step="1" value="${S._np}" class="w-full accent-primary-container" oninput="S._np=+this.value;render.setup()"/>
      <div class="grid gap-3 mt-4">
        ${Array.from({length:S._np},(_,i)=>`<div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style="background:${Object.values(CATS)[i%6].color}">${i+1}</div>
          <input id="pname${i}" placeholder="Jugador ${i+1}" value="${S._names&&S._names[i]?S._names[i]:""}" oninput="S._names=S._names||[];S._names[${i}]=this.value" class="flex-1 border-2 border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary-container focus:ring-0"/>
        </div>`).join("")}
      </div>
    </div>
    <div class="bg-white border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mb-6">
      <p class="font-bold mb-3">Preguntas por jugador</p>
      <div class="flex gap-3">
        ${[3,5,8,10].map(n=>`<button onclick="S.qPerPlayer=${n};render.setup()" class="flex-1 py-3 rounded-xl font-bold border-2 transition-all active:translate-y-1 ${S.qPerPlayer===n?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">${n}</button>`).join("")}
      </div>
      <p class="text-on-surface-variant text-sm mt-3">${S.qPerPlayer} preguntas ≈ ${est} minutos de partida</p>
    </div>
    <button onclick="startGame()" class="w-full bg-primary-container text-white py-4 rounded-2xl font-display font-extrabold text-xl block-shadow-primary active-btn-press transition-all flex items-center justify-center gap-2">
      <span class="material-symbols-outlined">style</span> Repartir cartas</button>
  </main>`;
};

function startGame(){
  S.players = Array.from({length:S._np},(_,i)=>{
    const el=document.getElementById("pname"+i);
    const v=el&&el.value.trim(); return v||("Jugador "+(i+1));
  });
  S.scores = S.players.map(()=>0);
  S.fifty  = S.players.map(()=>true);
  S.turn=0; S.qDone=0; S.used=new Set();
  go("deck");
}

render.deck = () => {
  const avail = QS.map((_,i)=>i).filter(i=>!S.used.has(i));
  if(avail.length===0) return finishGame();
  let hand = shuffle(avail.slice()).slice(0,Math.min(4,avail.length));
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-6 pb-10 max-w-lg mx-auto w-full">
    <div class="text-center mb-5">
      <p class="text-on-surface-variant font-bold text-sm uppercase tracking-wider">Partida en curso</p>
      <h2 class="font-display font-bold text-2xl">Turno de: <span class="text-primary-container">${S.players[S.turn]}</span></h2>
      <p class="text-on-surface-variant text-sm mt-1">Pregunta ${Math.floor(S.qDone/S.players.length)+1} de ${S.qPerPlayer}</p>
    </div>
    <div class="bg-surface-container-low border-2 border-outline-variant rounded-xl p-4 mb-5 text-center block-shadow-sm">
      <p class="text-on-surface-variant">Elige una carta para revelar tu pregunta</p>
    </div>
    <div class="grid grid-cols-2 gap-4">
      ${hand.map((qi,i)=>`<button onclick="pickCard(${qi})" class="card-perspective aspect-[3/4] relative w-full active:translate-y-1 transition-transform group">
        <div class="absolute inset-0 floating-card" style="--rot:0deg;animation-delay:${i*-1.4}s;animation-duration:${5+i}s;">${cardFace(QS[qi].c,"group-hover:scale-[1.02] transition-transform")}</div>
      </button>`).join("")}
    </div>
    <button onclick="render.deck()" class="mt-6 mx-auto flex items-center gap-1 text-on-surface-variant font-bold hover:text-primary transition-colors">
      <span class="material-symbols-outlined">shuffle</span> Mezclar cartas</button>
  </main>`;
};

function pickCard(qi){
  S.used.add(qi);
  const q=QS[qi], c=CATS[q.c];
  S.left=S.timerSecs;
  const ring = 2*Math.PI*40;
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-6 pb-10 max-w-lg mx-auto w-full flex flex-col items-center">
    <div class="relative w-28 h-28 mb-4">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="40" fill="transparent" stroke="#e6e0ea" stroke-width="9"></circle>
        <circle id="timerRing" cx="48" cy="48" r="40" fill="transparent" stroke="${c.color}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${ring}" stroke-dashoffset="0"></circle>
      </svg>
      <span id="timerText" class="absolute inset-0 flex items-center justify-center font-display font-extrabold text-4xl text-primary">${S.left}</span>
    </div>
    <div class="card-perspective w-full">
      <div id="qcard" class="card-inner3d w-full min-h-[420px]">
        <div class="absolute inset-0">${cardFace(q.c)}</div>
        <div class="card-back card-face bg-white rounded-[28px] border-4 p-5 flex flex-col" style="border-color:${c.color};box-shadow:0 8px 0 0 rgba(202,196,212,1);">
          <div class="flex justify-center mb-4">
            <span class="text-white text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full flex items-center gap-1" style="background:${c.color}">
              <span class="material-symbols-outlined" style="font-size:15px;">${c.icon}</span>${q.c}${c.x2?" · x2":""}</span>
          </div>
          <p class="font-display font-bold text-xl text-center mb-5">${q.q}</p>
          <div class="grid gap-3 flex-1" id="opts">
            ${q.o.map((o,j)=>`<button data-i="${j}" onclick="answer(${j},${qi})" class="w-full border-2 border-outline-variant rounded-2xl py-3.5 px-4 font-bold text-left block-shadow-sm active-btn-press transition-all hover:border-primary-container">${o}</button>`).join("")}
          </div>
          <button id="lifeline" onclick="useFifty(${qi})" class="mt-4 w-full border-2 rounded-xl py-2.5 font-bold flex items-center justify-center gap-1 transition-all ${S.fifty[S.turn]?"border-cat-ciencia text-cat-ciencia active:translate-y-1":"border-outline-variant text-outline-variant pointer-events-none"}">
            <span class="material-symbols-outlined" style="font-size:18px;">bolt</span> Lifeline 50/50 ${S.fifty[S.turn]?"":"(usado)"}</button>
        </div>
      </div>
    </div>
  </main>`;
  setTimeout(()=>{ const el=document.getElementById("qcard"); if(el) el.classList.add("card-flipped"); },150);
  setTimeout(()=>{
    S.timer=setInterval(()=>{
      S.left--;
      const t=document.getElementById("timerText"), r=document.getElementById("timerRing");
      if(t){ t.textContent=S.left; if(S.left<=5){t.classList.remove("text-primary");t.classList.add("text-error");} }
      if(r){ r.style.strokeDashoffset = ring*(1-S.left/S.timerSecs); if(S.left<=5) r.setAttribute("stroke","#ba1a1a"); }
      if(S.left<=0){ stopTimer(); showReto(qi,true); }
    },1000);
  },850);
}

function useFifty(qi){
  if(!S.fifty[S.turn]) return;
  S.fifty[S.turn]=false;
  const q=QS[qi];
  const wrong = shuffle(q.o.map((_,i)=>i).filter(i=>i!==q.a)).slice(0,2);
  wrong.forEach(i=>{ const b=document.querySelector(`#opts button[data-i="${i}"]`); if(b){b.style.opacity="0.3";b.style.pointerEvents="none";} });
  const lf=document.getElementById("lifeline");
  if(lf){ lf.classList.add("border-outline-variant","text-outline-variant","pointer-events-none"); lf.classList.remove("border-cat-ciencia","text-cat-ciencia"); lf.innerHTML='<span class="material-symbols-outlined" style="font-size:18px;">bolt</span> Lifeline 50/50 (usado)'; }
}

function answer(j,qi){
  stopTimer();
  const q=QS[qi], c=CATS[q.c];
  if(j===q.a){
    const base = c.x2?20:10;
    const fast = S.left >= S.timerSecs*0.75 ? 5 : (S.left >= S.timerSecs*0.4 ? 3 : 0);
    const pts = base+fast;
    S.scores[S.turn]+=pts;
    app.innerHTML = `${topBar({exit:true})}
    <main class="flex-1 px-5 py-10 max-w-lg mx-auto w-full flex flex-col items-center justify-center">
      <div class="bg-white border-4 border-success rounded-[28px] p-8 text-center w-full animate-pop" style="box-shadow:0 8px 0 0 #0f5340;">
        <span class="material-symbols-outlined text-success msf" style="font-size:56px;">check_circle</span>
        <h2 class="font-display font-extrabold text-3xl mt-2">¡Correcto!</h2>
        <p class="font-display font-extrabold text-4xl text-success mt-1">+${pts} pts</p>
        <p class="text-on-surface-variant mt-2">${base} base${fast>0?` + ${fast} por rapidez`:""}${c.x2?" · carta sorpresa x2":""}</p>
        <button onclick="nextTurn()" class="mt-6 bg-primary-container text-white px-8 py-3.5 rounded-2xl font-bold text-lg block-shadow-primary active-btn-press transition-all">Siguiente turno</button>
      </div>
    </main>`;
  } else { showReto(qi,false); }
}

function showReto(qi,timeout){
  const q=QS[qi];
  const r=RETOS[Math.floor(Math.random()*RETOS.length)];
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-8 max-w-lg mx-auto w-full flex flex-col items-center">
    <p class="font-bold text-error mb-1">${timeout?"¡Se acabó el tiempo!":"Incorrecto"}</p>
    <p class="text-on-surface-variant mb-5">La respuesta era: <span class="font-bold text-on-surface">${q.o[q.a]}</span></p>
    <div class="w-full bg-cat-historia rounded-[28px] border-4 border-white p-6 text-center relative overflow-hidden animate-pop" style="box-shadow:0 8px 0 0 #8a5a08;">
      <div class="absolute inset-0 opacity-10" style="background-image:radial-gradient(#fff 2px,transparent 2px);background-size:18px 18px;"></div>
      <div class="relative z-10">
        <span class="material-symbols-outlined text-white msf" style="font-size:48px;">local_fire_department</span>
        <p class="text-white/90 text-xs font-bold tracking-widest uppercase mt-1">Reto especial · 5 puntos</p>
        <p class="text-white font-display font-extrabold text-2xl mt-3 leading-snug">${r}</p>
      </div>
    </div>
    <p class="text-on-surface-variant text-sm mt-5 mb-3">El grupo decide si lo cumplió</p>
    <div class="w-full grid gap-3">
      <button onclick="S.scores[S.turn]+=5;nextTurn()" class="w-full bg-success text-white py-4 rounded-2xl font-bold text-lg active-btn-press transition-all" style="box-shadow:0 6px 0 0 #0f5340;">Lo cumplió (+5)</button>
      <button onclick="nextTurn()" class="w-full bg-white border-2 border-outline-variant py-3.5 rounded-2xl font-bold text-on-surface-variant block-shadow-sm active-btn-press transition-all">No lo cumplió</button>
    </div>
  </main>`;
}

function nextTurn(){
  S.qDone++; S.turn=(S.turn+1)%S.players.length;
  const totalQ = S.players.length*S.qPerPlayer;
  if(S.qDone>=totalQ) return finishGame();
  go("deck");
}

function scoreRow(p,i){
  const medals=["#DD9414","#9ca3af","#b45309"];
  return `<div class="flex items-center justify-between py-3 border-b-2 border-outline-variant last:border-0">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style="background:${i<3?medals[i]:"#cac4d4"}">${i+1}</div>
      <span class="font-bold">${p.n}</span>
    </div>
    <span class="font-display font-extrabold text-primary">${p.s.toLocaleString("es")} pts</span></div>`;
}

function finishGame(){
  stopTimer();
  const sorted = S.players.map((n,i)=>({n,s:S.scores[i]})).sort((a,b)=>b.s-a.s);
  S.lastResults = sorted;
  const tie = sorted.length>1 && sorted[0].s===sorted[1].s;
  const conf = ["#5B3FA8","#17A2A2","#D6336C","#DD9414","#D9531E"].map((c,i)=>
    `<span class="confetti absolute w-2.5 h-4 rounded-sm" style="background:${c};left:${12+i*18}%;animation-delay:${i*0.25}s;"></span>`).join("");
  app.innerHTML = `${topBar()}
  <main class="flex-1 px-5 py-8 pb-32 max-w-lg mx-auto w-full">
    <div class="bg-white border-2 border-outline-variant rounded-[28px] p-6 text-center relative overflow-hidden block-shadow-sm animate-pop">
      <div class="absolute inset-x-0 top-0 h-24 pointer-events-none" aria-hidden="true">${conf}</div>
      <span class="material-symbols-outlined text-cat-historia msf relative" style="font-size:60px;">trophy</span>
      <h2 class="font-display font-extrabold text-3xl mt-1">${tie?"¡Empate mundial!":"¡Felicidades, "+sorted[0].n+"!"}</h2>
      <p class="text-on-surface-variant mt-1 mb-5">${tie?"Comparten el podio de hoy":"Has conquistado el podio de hoy"}</p>
      <div class="text-left">${sorted.map((p,i)=>scoreRow(p,i)).join("")}</div>
      <div class="grid gap-3 mt-6">
        <button onclick="go('setup')" class="w-full bg-primary-container text-white py-4 rounded-2xl font-bold text-lg block-shadow-primary active-btn-press transition-all flex items-center justify-center gap-2"><span class="material-symbols-outlined">replay</span> Jugar otra vez</button>
        <button onclick="go('home')" class="w-full bg-white border-2 border-outline-variant py-3.5 rounded-2xl font-bold text-on-surface-variant block-shadow-sm active-btn-press transition-all">Volver al inicio</button>
      </div>
    </div>
  </main>${bottomNav("board")}`;
}

render.online = () => { if(window.renderOnlineMenu) renderOnlineMenu(); else app.innerHTML = '<p class=\"p-8 text-center\">Cargando modo en línea…</p>'; };

render.home();
