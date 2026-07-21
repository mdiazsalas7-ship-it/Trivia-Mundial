/* ================= ESTADO ================= */
const S = {
  screen:"home",
  players:[], scores:[], fifty:[],
  turn:0, qDone:0, qPerPlayer:5, streak:0, modo:'grupo', bots:[], botTO:null,
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
  const snd = `<button onclick="toggleSound(this)" class="text-on-surface-variant p-2 rounded-xl active:translate-y-1 transition-all" aria-label="Activar o silenciar sonido"><span class="material-symbols-outlined">${FX.on?"volume_up":"volume_off"}</span></button>`;
  const right = opts.exit
    ? `<div class="flex items-center">${snd}<button onclick="confirmExit()" class="text-on-surface-variant p-2 rounded-xl active:translate-y-1 transition-all" aria-label="Salir de la partida"><span class="material-symbols-outlined">close</span></button></div>`
    : snd;
  return `<header class="bg-surface-container-low w-full sticky top-0 z-40 border-b-2 border-outline-variant shadow-[0_4px_0_0_rgba(0,0,0,0.4)]">
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
  return `<nav class="fixed bottom-0 left-0 w-full bg-surface-container-low z-50 rounded-t-xl border-t-2 border-outline-variant shadow-[0_-4px_0_0_rgba(0,0,0,0.4)] pb-4 pt-2">
    <div class="flex justify-around items-center px-2 max-w-lg mx-auto">
    ${items.map(it => it.id===active
      ? `<button onclick="go('${it.id}')" class="flex flex-col items-center bg-primary-container text-white rounded-xl px-4 py-1 -translate-y-1 border-b-4 border-primary-fixed-dim active:scale-95 transition-transform"><span class="material-symbols-outlined msf">${it.icon}</span><span class="text-sm font-bold">${it.label}</span></button>`
      : `<button onclick="go('${it.id}')" class="flex flex-col items-center text-on-surface-variant p-2 hover:text-primary active:scale-95 transition-all"><span class="material-symbols-outlined">${it.icon}</span><span class="text-sm font-bold">${it.label}</span></button>`
    ).join("")}
    </div></nav>`;
}

function floatingBg(){
  const flota = [
    { cat:"Deportes",        top:"6%",  left:"4%",  w:88,  rot:-13, delay:0,  op:0.16 },
    { cat:"Historia",        top:"22%", right:"5%", w:76,  rot:14,  delay:-2, op:0.14 },
    { cat:"Sorpresa",        bottom:"20%", left:"7%", w:96, rot:6,   delay:-4, op:0.18 },
    { cat:"Cultura",         top:"60%", right:"6%", w:82,  rot:-19, delay:-1, op:0.13 },
    { cat:"Ciencia",         bottom:"6%", right:"22%", w:64, rot:9,  delay:-3, op:0.10 },
    { cat:"Entretenimiento", top:"40%", left:"14%", w:58,  rot:-6,  delay:-5, op:0.10 }
  ];
  return `<div class="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
    ${flota.map(f=>{
      const img = CATS[f.cat].img;
      const pos = [f.top?`top:${f.top};`:"", f.bottom?`bottom:${f.bottom};`:"", f.left?`left:${f.left};`:"", f.right?`right:${f.right};`:""].join("");
      return `<div class="floating-card absolute rounded-xl overflow-hidden" style="${pos}width:${f.w}px;aspect-ratio:3/4;--rot:${f.rot}deg;animation-delay:${f.delay}s;opacity:${f.op};background-image:url('${img}');background-size:cover;background-position:center;filter:saturate(0.85);box-shadow:0 8px 30px rgba(0,0,0,.5);"></div>`;
    }).join("")}
  </div>`;
}

function cardFace(cat, extra="", ajustar=false){
  const c = CATS[cat];
  if(c.img){
    const badge = c.x2 ? `<span class="absolute top-2 right-2 bg-white/95 text-cat-sorpresa text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow">x2</span>` : "";
    const fit = ajustar ? `background-size:contain;background-repeat:no-repeat;background-color:${c.dark};` : `background-size:cover;`;
    return `<div class="card-face absolute inset-0 rounded-xl overflow-hidden block-shadow-md ${extra}" style="background-image:url('${c.img}');${fit}background-position:center;">${badge}</div>`;
  }
  const badge = c.x2 ? `<span class="absolute top-2 right-2 bg-white text-cat-sorpresa text-xs font-bold px-2 py-0.5 rounded-full">x2 puntos</span>` : "";
  return `<div class="card-face absolute inset-0 rounded-xl border-4 border-white flex items-center justify-center overflow-hidden block-shadow-md ${extra}" style="background:${c.color};">
    ${badge}
    <div class="flex flex-col items-center gap-2 z-10">
      <span class="material-symbols-outlined text-white" style="font-size:52px;">${c.icon}</span>
      <span class="text-white font-bold text-sm tracking-widest uppercase">${cat}</span>
    </div></div>`;
}

/* ================= PANTALLAS ================= */
function isBot(){ return !!(S.bots && S.bots[S.turn]); }
function clearBot(){ if(S.botTO){ clearTimeout(S.botTO); S.botTO=null; } }

function elegirPista(id){
  FX.track.elegir(id);
  if(!FX.on) FX.toggle();
  if(!FX.music.on){ FX.music.on = true; localStorage.setItem("tm_music","on"); }
  FX.music.para(); FX.music.arranca();
  setTimeout(()=>render.settings(), 60);
}

function probarMusica(btn){
  if(!FX.on) FX.toggle();
  if(!FX.music.on) FX.music.on = true;
  FX.music.para(); FX.music.arranca();
  if(btn){ btn.innerHTML = '<span class="material-symbols-outlined">graphic_eq</span> Sonando…'; }
  setTimeout(()=>{ FX.music.para(); render.settings(); }, 12000);
}

function switchSonido(){ FX.toggle(); render.settings(); }
function switchMusica(){
  const on = FX.music.toggle();
  if(on && !FX.on){ FX.toggle(); }
  render.settings();
}

function pedirInstalacion(){
  if(typeof instalarApp === "function" && window.deferredPromptReady){ instalarApp(); return; }
  if(typeof mostrarBannerManual === "function"){ mostrarBannerManual(); return; }
  alert("Para instalar:\n\n• Android/Chrome: menú ⋮ → “Instalar aplicación”.\n• iPhone/Safari: botón Compartir → “Añadir a pantalla de inicio”.\n• Escritorio: icono de instalar en la barra de direcciones.");
}

function toggleSound(btn){
  const on = FX.toggle();
  if(btn) btn.querySelector("span").textContent = on ? "volume_up" : "volume_off";
}

function go(screen){ stopTimer(); clearBot(); S.screen=screen; render[screen](); window.scrollTo(0,0); }
function confirmExit(){
  if(confirm("¿Salir de la partida? Se perderá el progreso.")){ FX.music.para(); go("home"); }
}

const APP_VER = "2.5";
const render = {};

render.home = () => {
  app.innerHTML = `${topBar()}
  <main class="flex-1 flex flex-col items-center justify-center px-5 pb-32 relative max-w-lg mx-auto w-full">
    ${floatingBg()}
    <div class="z-10 mt-4 mb-6 w-full flex justify-center">
      <img alt="Logo de Trivia Mundial" src="${LOGO_IMG}" class="w-64 max-w-full rounded-[28px]" style="filter:drop-shadow(0 12px 30px rgba(91,63,168,.5));"/>
    </div>
    <div class="z-10 w-full flex flex-col gap-4">
      <button onclick="go('solo')" class="w-full bg-primary-container text-white py-4 rounded-2xl font-display font-extrabold text-2xl block-shadow-primary active-btn-press transition-all flex items-center justify-center gap-3">
        <span class="material-symbols-outlined msf">explore</span><span>Vuelta al Mundo</span></button>
      <button onclick="go('setup')" class="w-full bg-cat-entret text-white py-4 rounded-2xl font-display font-extrabold text-2xl active-btn-press transition-all flex items-center justify-center gap-3" style="box-shadow:0 6px 0 0 #8f1f47;">
        <span class="material-symbols-outlined msf">groups</span><span>En grupo aquí</span></button>
      <button onclick="go('online')" class="w-full bg-cat-cultura text-white py-4 rounded-2xl font-display font-extrabold text-2xl active-btn-press transition-all flex items-center justify-center gap-3" style="box-shadow:0 6px 0 0 #0d6b6b;">
        <span class="material-symbols-outlined msf">travel_explore</span><span>En línea</span></button>
      <p class="text-center text-on-surface-variant text-sm -mt-1">Vuelta al Mundo = tu aventura en solitario · En grupo = hasta 8 en un celular · En línea = cada quien con el suyo</p>
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
    ${ r ? `<div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm">
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
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm">
      <p class="font-bold mb-2">Tiempo por pregunta</p>
      <div class="flex gap-3">
        ${[15,20,30].map(t=>`<button onclick="S.timerSecs=${t};render.settings()" class="flex-1 py-3 rounded-xl font-bold border-2 transition-all active:translate-y-1 ${S.timerSecs===t?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">${t} s</button>`).join("")}
      </div>
      <p class="text-on-surface-variant text-sm mt-3">Menos tiempo, más adrenalina. El bonus de rapidez se ajusta solo.</p>
    </div>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mt-5">
      <p class="font-bold mb-3">Audio</p>
      <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-4 mb-4 block-shadow-sm">
      <div class="flex justify-between text-sm font-bold mb-2"><span>Progreso del viaje</span><span class="text-primary">${Math.min(p.max, ETAPAS.length-1)+1} / ${ETAPAS.length}</span></div>
      <div class="h-3 rounded-full bg-surface-container-lowest overflow-hidden">
        <div class="h-full rounded-full transition-all" style="width:${Math.round((Math.min(p.max,ETAPAS.length-1)+1)/ETAPAS.length*100)}%;background:linear-gradient(90deg,#17A2A2,#5B3FA8);"></div>
      </div>
    </div>
    <div class="grid gap-2.5">
        <button onclick="switchSonido()" class="w-full py-3 px-4 rounded-xl font-bold border-2 flex items-center justify-between transition-all active:translate-y-1 ${FX.on?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">
          <span class="flex items-center gap-2"><span class="material-symbols-outlined">${FX.on?"volume_up":"volume_off"}</span> Efectos de sonido</span>
          <span class="text-sm">${FX.on?"Activados":"Silenciados"}</span></button>
        <button onclick="switchMusica()" class="w-full py-3 px-4 rounded-xl font-bold border-2 flex items-center justify-between transition-all active:translate-y-1 ${FX.music.on?"bg-cat-cultura text-white border-cat-cultura":"border-outline-variant text-on-surface-variant"}">
          <span class="flex items-center gap-2"><span class="material-symbols-outlined">${FX.music.on?"music_note":"music_off"}</span> Música de fondo</span>
          <span class="text-sm">${FX.music.on?"Activada":"Apagada"}</span></button>
      </div>
      <p class="font-bold mt-5 mb-3">Pista musical</p>
      <div class="grid gap-2">
        ${FX.pistas.map(p=>`<button onclick="elegirPista('${p.id}')" class="w-full py-3 px-4 rounded-xl font-bold border-2 flex items-center justify-between transition-all active:translate-y-1 ${FX.track.elegida()===p.id?"bg-cat-entret text-white border-cat-entret":"border-outline-variant text-on-surface-variant"}">
          <span class="flex items-center gap-2"><span class="material-symbols-outlined">${p.src?"music_note":"shuffle"}</span> ${p.nombre}</span>
          ${FX.track.elegida()===p.id?'<span class="material-symbols-outlined">check</span>':""}</button>`).join("")}
        <button onclick="probarMusica(this)" class="w-full py-3 px-4 rounded-xl font-bold border-2 border-outline-variant text-on-surface-variant flex items-center justify-center gap-2 active:translate-y-1 transition-all">
          <span class="material-symbols-outlined">play_circle</span> Escuchar una muestra</button>
      </div>
      <p class="text-on-surface-variant text-sm mt-3">La música suena durante las partidas, muy suave para no tapar las conversaciones.</p>
    </div>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mt-5">
      <p class="font-bold mb-1">Instalar en este dispositivo</p>
      <p class="text-on-surface-variant text-sm mb-3">Se abre a pantalla completa y funciona sin internet (excepto el modo en línea).</p>
      <button onclick="pedirInstalacion()" class="w-full bg-primary-container text-white py-3.5 rounded-xl font-bold active-btn-press transition-all flex items-center justify-center gap-2" style="box-shadow:0 4px 0 0 #21005e;">
        <span class="material-symbols-outlined">install_mobile</span> Instalar Trivia Mundial</button>
    </div>
    <p class="text-center text-on-surface-variant text-xs mt-6">Trivia Mundial · versión ${APP_VER}</p>
  </main>${bottomNav("settings")}`;
};

const ETAPAS = [
  { n:"París",           pais:"Francia",        seg:24, num:6,  icon:"tour",            color:"#17A2A2", x:738, y:186 },
  { n:"Roma",            pais:"Italia",         seg:23, num:6,  icon:"account_balance", color:"#DD9414", x:783, y:224 },
  { n:"Madrid",          pais:"España",         seg:22, num:7,  icon:"stadium",         color:"#D9531E", x:705, y:232 },
  { n:"Lisboa",          pais:"Portugal",       seg:22, num:7,  icon:"sailing",         color:"#1E7A5F", x:676, y:243 },
  { n:"Londres",         pais:"Reino Unido",    seg:21, num:8,  icon:"schedule",        color:"#5B3FA8", x:722, y:168 },
  { n:"Ámsterdam",       pais:"Países Bajos",   seg:21, num:8,  icon:"pedal_bike",      color:"#D6336C", x:757, y:166 },
  { n:"Berlín",          pais:"Alemania",       seg:20, num:9,  icon:"apartment",       color:"#17A2A2", x:793, y:172 },
  { n:"Atenas",          pais:"Grecia",         seg:20, num:9,  icon:"temple_hindu",    color:"#DD9414", x:833, y:242 },
  { n:"Estambul",        pais:"Turquía",        seg:19, num:10, icon:"mosque",          color:"#D9531E", x:858, y:224 },
  { n:"El Cairo",        pais:"Egipto",         seg:19, num:10, icon:"landscape",       color:"#1E7A5F", x:866, y:276 },
  { n:"Nairobi",         pais:"Kenia",          seg:18, num:11, icon:"pets",            color:"#5B3FA8", x:891, y:418 },
  { n:"Ciudad del Cabo", pais:"Sudáfrica",      seg:18, num:11, icon:"terrain",         color:"#D6336C", x:809, y:566 },
  { n:"Nueva Delhi",     pais:"India",          seg:17, num:12, icon:"temple_buddhist", color:"#17A2A2", x:1071, y:282 },
  { n:"Pekín",           pais:"China",          seg:17, num:12, icon:"fort",            color:"#DD9414", x:1245, y:231 },
  { n:"Tokio",           pais:"Japón",          seg:16, num:13, icon:"biotech",         color:"#D9531E", x:1348, y:250 },
  { n:"Sídney",          pais:"Australia",      seg:16, num:13, icon:"waves",           color:"#1E7A5F", x:1399, y:566 },
  { n:"Ciudad de México",pais:"México",         seg:15, num:14, icon:"celebration",     color:"#5B3FA8", x:287, y:324 },
  { n:"Río de Janeiro",  pais:"Brasil",         seg:15, num:14, icon:"festival",        color:"#D6336C", x:535, y:516 },
  { n:"Buenos Aires",    pais:"Argentina",      seg:14, num:15, icon:"music_note",      color:"#17A2A2", x:468, y:569 },
  { n:"Everest",         pais:"Nepal",          seg:12, num:16, icon:"summarize",       color:"#DD9414", x:1114, y:285 }
];

/* Bolsa de categorías: no se repite ninguna hasta que salgan todas */
function nuevaBolsa(){ return shuffle(Object.keys(CATS)); }
function sacarDeBolsa(cat){
  S.bolsa = (S.bolsa || []).filter(c => c !== cat);
  if(S.bolsa.length === 0) S.bolsa = nuevaBolsa();
}

function progresoMundo(){
  try { return JSON.parse(localStorage.getItem("tm_mundo")) || { max:0, estrellas:{}, mejor:{} }; }
  catch(e){ return { max:0, estrellas:{}, mejor:{} }; }
}
function guardarMundo(p){ localStorage.setItem("tm_mundo", JSON.stringify(p)); }

/* ---------- MAPA MUNDI ---------- */
const MAPA_IMG = "assets/mapa.webp?v=1";

function mapaSVG(p, destacada = -1){

  const ruta = ETAPAS.map((e,i)=>{
    if(i === 0) return "";
    const a0 = ETAPAS[i-1];
    const abierta = i <= p.max;
    const mx = (a0.x+e.x)/2, my = (a0.y+e.y)/2 - Math.abs(e.x-a0.x)*0.12 - 12;
    return `<path d="M ${a0.x} ${a0.y} Q ${mx} ${my} ${e.x} ${e.y}" fill="none" stroke="${abierta?"#5B3FA8":"#232a54"}" stroke-width="2.5" stroke-dasharray="7 7" opacity="${abierta?0.9:0.5}"/>`;
  }).join("");

  const marcas = ETAPAS.map((e,i)=>{
    const abierta = i <= p.max;
    const est = p.estrellas[i] || 0;
    const actual = i === Math.min(p.max, ETAPAS.length-1);
    return `<g transform="translate(${e.x},${e.y})" style="cursor:${abierta?"pointer":"default"}" onclick="${abierta?`verEtapa(${i})`:""}" role="button" aria-label="Etapa ${i+1}: ${e.n}">
      ${actual?`<circle r="26" fill="${e.color}" opacity="0.25"><animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite"/></circle>`:""}
      <circle r="15" fill="${abierta?e.color:"#232a54"}" stroke="${destacada===i?"#fff":(abierta?"#05081C":"#2B3160")}" stroke-width="${destacada===i?3:2.5}"/>
      <text y="5" text-anchor="middle" font-size="14" font-weight="800" fill="${abierta?"#fff":"#6F6A92"}" font-family="Plus Jakarta Sans">${abierta?(i+1):"🔒"}</text>
      ${est>0?`<g transform="translate(0,-24)">${[0,1,2].map(s=>`<circle cx="${(s-1)*8}" cy="0" r="3" fill="${s<est?"#DD9414":"#2B3160"}"/>`).join("")}</g>`:""}
      ${abierta?`<text y="32" text-anchor="middle" font-size="13" font-weight="700" fill="#ECEAF7" font-family="Be Vietnam Pro" style="paint-order:stroke;stroke:#05081C;stroke-width:4;">${e.n}</text>`:""}
    </g>`;
  }).join("");

  return `<svg id="mapaSvg" viewBox="0 0 1600 800" width="1600" height="800" role="img" aria-label="Mapa del viaje">
    <image href="${MAPA_IMG}" x="0" y="0" width="1600" height="800" preserveAspectRatio="none"/>
    ${ruta}${marcas}
    <g id="avionCapa"></g>
  </svg>`;
}

render.solo = () => {
  const p = progresoMundo();
  const totalEstrellas = Object.values(p.estrellas).reduce((a,b)=>a+b,0);
  const actual = Math.min(p.max, ETAPAS.length-1);
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 pb-32 max-w-3xl mx-auto w-full">
    <div class="px-5 pt-5 text-center">
      <h2 class="font-display font-bold text-2xl">Vuelta al Mundo</h2>
      <p class="text-on-surface-variant text-sm">Toca un destino para volar hacia él</p>
      <div class="flex items-center justify-center gap-3 mt-3">
        <span class="inline-flex items-center gap-1 bg-surface-container border-2 border-outline-variant rounded-full px-3 py-1">
          <span class="material-symbols-outlined msf text-cat-historia" style="font-size:16px;">star</span>
          <span class="font-display font-extrabold text-sm">${totalEstrellas}</span>
          <span class="text-on-surface-variant text-xs">/ ${ETAPAS.length*3}</span></span>
        <span class="inline-flex items-center gap-1 bg-surface-container border-2 border-outline-variant rounded-full px-3 py-1">
          <span class="material-symbols-outlined text-primary" style="font-size:16px;">flag</span>
          <span class="font-display font-extrabold text-sm">${actual+1}</span>
          <span class="text-on-surface-variant text-xs">/ ${ETAPAS.length}</span></span>
      </div>
    </div>
    <div id="mapaWrap" class="mt-3 overflow-x-auto overflow-y-hidden">
      <div class="min-w-[1600px]">${mapaSVG(p)}</div>
    </div>
    <div id="fichaEtapa" class="px-5"></div>
  </main>${bottomNav("home")}`;
  setTimeout(()=>centrarMapa(ETAPAS[actual]), 100);
  setTimeout(()=>verEtapa(actual), 350);
};

function centrarMapa(e){
  const wrap = document.getElementById("mapaWrap");
  if(!wrap) return;
  const escala = wrap.scrollWidth / 1600 || 1;
  wrap.scrollTo({ left: Math.max(0, e.x * escala - wrap.clientWidth/2), behavior:"smooth" });
}

function verEtapa(i){
  const e = ETAPAS[i], p = progresoMundo();
  const est = p.estrellas[i] || 0;
  const ficha = document.getElementById("fichaEtapa");
  if(!ficha) return;
  ficha.innerHTML = `<div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 mt-4 block-shadow-sm animate-pop">
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background:${e.color}">
        <span class="material-symbols-outlined text-white msf">${e.icon}</span></div>
      <div class="flex-1 min-w-0">
        <p class="font-display font-extrabold text-lg leading-tight">${i+1}. ${e.n}</p>
        <p class="text-on-surface-variant text-sm">${e.pais} · ${e.num} preguntas · ${e.seg}s cada una</p>
      </div>
      <div class="flex gap-0.5 flex-shrink-0">
        ${[0,1,2].map(s=>`<span class="material-symbols-outlined ${s<est?"msf text-cat-historia":"text-outline-variant"}" style="font-size:18px;">star</span>`).join("")}
      </div>
    </div>
    ${p.mejor[i]?`<p class="text-on-surface-variant text-sm mt-2">Tu récord aquí: <span class="font-bold text-primary">${p.mejor[i]} pts</span></p>`:""}
    <button onclick="volarA(${i})" class="mt-4 w-full bg-primary-container text-white py-3.5 rounded-xl font-display font-extrabold text-lg block-shadow-primary active-btn-press transition-all flex items-center justify-center gap-2">
      <span class="material-symbols-outlined">flight_takeoff</span> Volar a ${e.n}</button>
  </div>`;
  const p2 = progresoMundo();
  const wrap = document.getElementById("mapaWrap");
  if(wrap){ const svg = document.getElementById("mapaSvg"); if(svg) svg.outerHTML = mapaSVG(p2, i); }
  centrarMapa(e);
}

function volarA(destino){
  const p = progresoMundo();
  const origen = (S.etapa !== undefined && S.etapa !== destino) ? S.etapa : Math.max(0, destino - 1);
  const desde = ETAPAS[Math.max(0, Math.min(origen, ETAPAS.length-1))];
  return despegar(desde, ETAPAS[destino], destino);
}

function despegar(a0, e, destino){
  FX.whoosh(); vibrate(30);
  const mx = (a0.x+e.x)/2, my = (a0.y+e.y)/2 - Math.abs(e.x-a0.x)*0.12 - 30;
  const d = `M ${a0.x} ${a0.y} Q ${mx} ${my} ${e.x} ${e.y}`;
  const mismo = a0.x === e.x && a0.y === e.y;
  const dur = mismo ? 0.8 : 2.6;
  app.innerHTML = `${topBar()}
  <main class="flex-1 max-w-3xl mx-auto w-full pb-10">
    <p class="text-center font-display font-extrabold text-xl pt-5">Rumbo a ${e.n}</p>
    <p class="text-center text-on-surface-variant text-sm mb-2">${e.pais}</p>
    <div id="mapaWrap" class="overflow-x-auto overflow-y-hidden">
      <div class="min-w-[1600px]">
        ${mapaSVG(progresoMundo(), destino).replace('<g id="avionCapa"></g>', `
          <path d="${d}" fill="none" stroke="#C6B6FF" stroke-width="3" stroke-dasharray="10 8" opacity="0.9">
            <animate attributeName="stroke-dashoffset" from="200" to="0" dur="${dur}s" fill="freeze"/>
          </path>
          <g>
            <g transform="translate(-14,-14)">
              <circle cx="14" cy="14" r="16" fill="#5B3FA8" opacity="0.35"/>
              <text x="14" y="21" text-anchor="middle" font-size="22">✈️</text>
            </g>
            <animateMotion dur="${dur}s" path="${d}" rotate="auto" fill="freeze"/>
          </g>`)}
      </div>
    </div>
    <p class="text-center text-on-surface-variant mt-4"><span class="material-symbols-outlined align-middle urgent" style="font-size:20px;">flight</span> Preparando el aterrizaje…</p>
  </main>`;
  const wrap = document.getElementById("mapaWrap");
  if(wrap){
    wrap.scrollTo({ left: Math.max(0, a0.x - wrap.clientWidth/2) });
    setTimeout(()=>wrap.scrollTo({ left: Math.max(0, e.x - wrap.clientWidth/2), behavior:"smooth" }), 400);
  }
  setTimeout(()=>{ FX.land(); vibrate(50); }, dur*1000 - 100);
  setTimeout(()=>empezarEtapa(destino), dur*1000 + 400);
}

function empezarEtapa(i){
  const e = ETAPAS[i];
  S.modo = 'mundo'; S.etapa = i;
  S.vidas = 3; S.streak = 0;
  S.players = [localStorage.getItem("tm_name") || "Tú"];
  S.bots = [false];
  S.scores = [0];
  S.fifty = [true];
  S.turn = 0; S.qDone = 0; S.qPerPlayer = e.num;
  S.timerSecs = e.seg;
  S.pool = shuffle(QS.map((_,k)=>k));
  S.bolsa = nuevaBolsa();
  S.used = new Set();
  if(FX.on && FX.music.on) FX.music.arranca();
  go("deck");
}

function vidasHTML(){
  return `<div class="flex items-center justify-center gap-1 mb-2">
    ${[0,1,2].map(i=>`<span class="material-symbols-outlined ${i<S.vidas?"msf text-error":"text-outline-variant"}" style="font-size:22px;">favorite</span>`).join("")}
  </div>`;
}


render.setup = () => {
  if(S._np===undefined) S._np=3;
  const est = Math.round(S._np * S.qPerPlayer * 0.7);
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 px-5 py-6 pb-10 max-w-lg mx-auto w-full">
    <h2 class="font-display font-bold text-2xl mb-5">Configuración de partida</h2>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mb-5">
      <p class="font-bold mb-3">¿Cuántos juegan? (2 a 8)</p>
      <div class="grid grid-cols-4 gap-2 mb-1">
        ${[2,3,4,5,6,7,8].map(n=>`<button onclick="S._np=${n};render.setup()" class="py-3 rounded-xl font-display font-extrabold text-xl border-2 transition-all active:translate-y-1 ${S._np===n?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">${n}</button>`).join("")}
      </div>
      <div class="grid gap-3 mt-4">
        ${Array.from({length:S._np},(_,i)=>`<div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style="background:${Object.values(CATS)[i%6].color}">${i+1}</div>
          <input id="pname${i}" placeholder="Jugador ${i+1}" value="${S._names&&S._names[i]?S._names[i]:""}" oninput="S._names=S._names||[];S._names[${i}]=this.value" class="flex-1 border-2 border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary-container focus:ring-0"/>
        </div>`).join("")}
      </div>
    </div>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mb-6">
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
  S.modo = 'grupo';
  S.bolsa = nuevaBolsa();
  if(FX.on && FX.music.on) FX.music.arranca();
  S.bots = S.players.map(()=>false);
  S.scores = S.players.map(()=>0);
  S.fifty  = S.players.map(()=>true);
  S.turn=0; S.qDone=0; S.streak=0; S.used=new Set();
  go("deck");
}

render.deck = () => {
  const base = S.modo === 'mundo' ? S.pool : QS.map((_,i)=>i);
  const avail = base.filter(i=>!S.used.has(i));
  if(avail.length===0) return S.modo === 'mundo' ? etapaSuperada() : finishGame();
  if(!S.bolsa || S.bolsa.length === 0) S.bolsa = nuevaBolsa();
  // categorías pendientes de la vuelta actual, priorizando las que aún no salieron
  let cats = S.bolsa.filter(c => avail.some(qi => QS[qi].c === c)).slice(0, 4);
  if(cats.length < 4){
    const extra = nuevaBolsa().filter(c => !cats.includes(c) && avail.some(qi => QS[qi].c === c));
    cats = cats.concat(extra.slice(0, 4 - cats.length));
  }
  let hand = cats.map(c => {
    const delCat = avail.filter(qi => QS[qi].c === c);
    return delCat[Math.floor(Math.random()*delCat.length)];
  }).filter(x => x !== undefined);
  if(hand.length < 4){
    const resto = shuffle(avail.filter(qi => !hand.includes(qi)));
    hand = hand.concat(resto.slice(0, 4 - hand.length));
  }
  hand = shuffle(hand);
  const racha = S.streak >= 2 ? `<div class="streak-badge inline-flex items-center gap-1 bg-cat-deportes text-white font-display font-extrabold px-4 py-1.5 rounded-full text-lg mb-2" style="box-shadow:0 4px 0 0 #8f3512;">
      <span class="material-symbols-outlined msf" style="font-size:20px;">local_fire_department</span> ¡Racha x${S.streak}!</div>` : "";
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-6 pb-10 max-w-lg mx-auto w-full">
    <div class="text-center mb-4">
      ${S.modo === 'mundo' ? vidasHTML() : ""}
      ${racha}
      ${S.modo === 'mundo'
        ? `<p class="text-on-surface-variant font-bold text-sm uppercase tracking-wider">Etapa ${S.etapa+1} · ${ETAPAS[S.etapa].n}</p>
           <h2 class="font-display font-bold text-2xl">Pregunta ${S.qDone+1} <span class="text-on-surface-variant">de ${S.qPerPlayer}</span></h2>`
        : `<p class="text-on-surface-variant font-bold text-sm uppercase tracking-wider">Partida en curso</p>
           <h2 class="font-display font-bold text-2xl">Turno de: <span class="text-primary-container">${S.players[S.turn]}</span></h2>
           <p class="text-on-surface-variant text-sm mt-1">Pregunta ${Math.floor(S.qDone/S.players.length)+1} de ${S.qPerPlayer}</p>`}
    </div>
    <div class="bg-surface-container-low border-2 border-outline-variant rounded-xl p-4 mb-5 text-center block-shadow-sm">
      <p class="text-on-surface-variant font-bold">${S.modo === "mundo" ? "Elige tu carta y lánzala" : "¡Lanza tu carta al aire!"}</p>
      <p class="text-on-surface-variant text-xs mt-1">Categorías por salir en esta vuelta: ${(S.bolsa||[]).length}</p>
    </div>
    <div class="grid grid-cols-2 gap-4">
      ${hand.map((qi,i)=>`<button onclick="throwCard(${qi})" class="card-perspective aspect-[3/4] relative w-full active:translate-y-1 transition-transform group deal-in" style="--tilt:${(i%2?2:-2)}deg;animation-delay:${i*0.09}s;">
        <div class="absolute inset-0 floating-card" style="--rot:0deg;animation-delay:${i*-1.4}s;animation-duration:${5+i}s;">${cardFace(QS[qi].c,"group-hover:scale-[1.03] transition-transform")}</div>
      </button>`).join("")}
    </div>
    <button onclick="render.deck()" class="mt-6 mx-auto flex items-center gap-1 text-on-surface-variant font-bold hover:text-primary transition-colors">
      <span class="material-symbols-outlined">shuffle</span> Mezclar cartas</button>
  </main>`;
  FX.tone(700, 0.06, "triangle", 0.07);
  FX.tone(900, 0.06, "triangle", 0.06, 0.09);
  if(isBot()){
    document.querySelectorAll(".deal-in").forEach(b=>b.style.pointerEvents="none");
    const aviso = document.createElement("p");
    aviso.className = "text-center font-bold text-primary mt-5 urgent";
    aviso.textContent = S.players[S.turn] + " está eligiendo su carta…";
    document.querySelector("main")?.appendChild(aviso);
    clearBot();
    S.botTO = setTimeout(()=>{ throwCard(hand[Math.floor(Math.random()*hand.length)]); }, 1600);
  }
};

function throwCard(qi){
  S.used.add(qi);
  const q = QS[qi], c = CATS[q.c];
  sacarDeBolsa(q.c);
  FX.whoosh(); vibrate(20);
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 max-w-lg mx-auto w-full">
    <div class="stage card-perspective">
      <div id="flyer" class="throwing w-56 aspect-[3/4] relative">${cardFace(q.c)}</div>
    </div>
    <p id="flyTxt" class="text-center font-display font-bold text-xl text-on-surface-variant">La suerte está en el aire…</p>
  </main>`;
  setTimeout(()=>{ FX.drum(); }, 900);
  setTimeout(()=>{
    FX.land(); vibrate(40); shakeScreen();
    const t = document.getElementById("flyTxt");
    if(t){ t.textContent = q.c.toUpperCase(); t.style.color = c.color; t.classList.add("animate-pop"); }
    const f = document.getElementById("flyer");
    if(f) f.classList.add("glow");
  }, 1880);
  setTimeout(()=>{ showQuestion(qi); }, 2500);
}

function showQuestion(qi){
  const q = QS[qi], c = CATS[q.c];
  S.left = S.timerSecs;
  const ring = 2*Math.PI*40;
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-5 pb-10 max-w-lg mx-auto w-full flex flex-col items-center">
    <div class="relative w-28 h-28 mb-3" id="clockWrap">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="40" fill="transparent" stroke="#e6e0ea" stroke-width="9"></circle>
        <circle id="timerRing" cx="48" cy="48" r="40" fill="transparent" stroke="${c.color}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${ring}" stroke-dashoffset="0"></circle>
      </svg>
      <span id="timerText" class="absolute inset-0 flex items-center justify-center font-display font-extrabold text-4xl text-primary">${S.left}</span>
    </div>
    <div class="card-perspective w-full">
      <div id="qcard" class="card-inner3d w-full">
        ${cardFace(q.c, "rounded-[28px]", true)}
        <div class="card-back card-face bg-surface-container rounded-[28px] border-4 p-5 flex flex-col" style="border-color:${c.color};box-shadow:0 8px 0 0 rgba(0,0,0,0.55);">
          <div class="flex justify-center mb-4">
            <span class="text-white text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full flex items-center gap-1" style="background:${c.color}">
              <span class="material-symbols-outlined" style="font-size:15px;">${c.icon}</span>${q.c}${c.x2?" · x2":""}</span>
          </div>
          <p class="font-display font-bold text-xl text-center mb-5">${q.q}</p>
          <div class="grid gap-3" id="opts">
            ${q.o.map((o,j)=>`<button data-i="${j}" onclick="answer(${j},${qi})" class="w-full border-2 border-outline-variant rounded-2xl py-3.5 px-4 font-bold text-left block-shadow-sm active-btn-press transition-all hover:border-primary-container">${o}</button>`).join("")}
          </div>
          <button id="lifeline" onclick="useFifty(${qi})" class="mt-4 w-full border-2 rounded-xl py-2.5 font-bold flex items-center justify-center gap-1 transition-all ${S.fifty[S.turn]?"border-cat-ciencia text-cat-ciencia active:translate-y-1":"border-outline-variant text-outline-variant pointer-events-none"}">
            <span class="material-symbols-outlined" style="font-size:18px;">bolt</span> Lifeline 50/50 ${S.fifty[S.turn]?"":"(usado)"}</button>
        </div>
      </div>
    </div>
  </main>`;
  setTimeout(()=>{ const el=document.getElementById("qcard"); if(el){ el.classList.add("card-flipped"); FX.flip(); } },120);
  if(isBot()){
    setTimeout(()=>{
      document.querySelectorAll("#opts button").forEach(b=>{ b.style.pointerEvents="none"; });
      const lf = document.getElementById("lifeline"); if(lf) lf.style.display = "none";
      const opts = document.getElementById("opts");
      if(opts){
        const p = document.createElement("p");
        p.className = "text-center font-bold text-on-surface-variant mt-3";
        p.innerHTML = '<span class="material-symbols-outlined align-middle" style="font-size:18px;">explore</span> ' + S.players[S.turn] + " está pensando…";
        opts.parentNode.appendChild(p);
      }
    }, 900);
    const acc = BOT_ACC[S._dif] || 0.68;
    const piensa = 2200 + Math.random() * Math.min(6000, (S.timerSecs-4)*1000);
    clearBot();
    S.botTO = setTimeout(()=>{
      const q2 = QS[qi];
      let elige;
      if(Math.random() < acc) elige = q2.a;
      else { const malas = q2.o.map((_,k)=>k).filter(k=>k!==q2.a); elige = malas[Math.floor(Math.random()*malas.length)]; }
      answer(elige, qi);
    }, piensa + 900);
  }
  setTimeout(()=>{
    S.timer=setInterval(()=>{
      S.left--;
      const t=document.getElementById("timerText"), r=document.getElementById("timerRing"), w=document.getElementById("clockWrap");
      if(t){ t.textContent=S.left; if(S.left<=5){t.classList.remove("text-primary");t.classList.add("text-error");} }
      if(r){ r.style.strokeDashoffset = ring*(1-S.left/S.timerSecs); if(S.left<=5) r.setAttribute("stroke","#ba1a1a"); }
      if(S.left<=5 && S.left>0){ FX.hurry(); vibrate(15); if(w) w.classList.add("urgent"); }
      else if(S.left<=10){ FX.tick(); }
      if(S.left<=0){ stopTimer(); showReto(qi,true); }
    },1000);
  },900);
}

function pickCard(qi){ throwCard(qi); }

function useFifty(qi){
  if(!S.fifty[S.turn]) return;
  S.fifty[S.turn]=false;
  FX.tone(1200, 0.12, "sawtooth", 0.12); FX.tone(600, 0.2, "sawtooth", 0.1, 0.1);
  const q=QS[qi];
  const wrong = shuffle(q.o.map((_,i)=>i).filter(i=>i!==q.a)).slice(0,2);
  wrong.forEach(i=>{ const b=document.querySelector(`#opts button[data-i="${i}"]`); if(b){ b.classList.add("fade-away"); setTimeout(()=>{ b.style.opacity="0.25"; b.style.pointerEvents="none"; b.classList.remove("fade-away"); },340); } });
  const lf=document.getElementById("lifeline");
  if(lf){ lf.classList.add("border-outline-variant","text-outline-variant","pointer-events-none"); lf.classList.remove("border-cat-ciencia","text-cat-ciencia"); lf.innerHTML='<span class="material-symbols-outlined" style="font-size:18px;">bolt</span> Lifeline 50/50 (usado)'; }
}

function answer(j,qi){
  stopTimer();
  const q=QS[qi], c=CATS[q.c];
  const btns = document.querySelectorAll('#opts button');
  if(j===q.a){
    S.streak++;
    const base = c.x2?20:10;
    const fast = S.left >= S.timerSecs*0.75 ? 5 : (S.left >= S.timerSecs*0.4 ? 3 : 0);
    const bonusRacha = S.streak >= 3 ? 10 : (S.streak === 2 ? 5 : 0);
    const pts = base+fast+bonusRacha;
    S.scores[S.turn]+=pts;
    if(btns[j]){ btns[j].style.background = "#1E7A5F"; btns[j].style.color = "#fff"; btns[j].style.borderColor = "#1E7A5F"; }
    FX.good(S.streak); vibrate([30,50,30]);
    burstConfetti(S.streak>=3?70:40, S.streak>=3);
    flashPoints("+"+pts, "#1E7A5F");
    setTimeout(()=>{
      app.innerHTML = `${topBar({exit:true})}
      <main class="flex-1 px-5 py-10 max-w-lg mx-auto w-full flex flex-col items-center justify-center">
        <div class="bg-surface-container border-4 border-success rounded-[28px] p-8 text-center w-full animate-pop" style="box-shadow:0 8px 0 0 #0f5340;">
          <span class="material-symbols-outlined text-success msf" style="font-size:56px;">check_circle</span>
          <h2 class="font-display font-extrabold text-3xl mt-2">¡Correcto!</h2>
          <p class="font-display font-extrabold text-5xl text-success mt-1">+${pts}</p>
          <p class="text-on-surface-variant mt-2">${base} base${fast>0?` + ${fast} rapidez`:""}${bonusRacha>0?` + ${bonusRacha} racha`:""}${c.x2?" · sorpresa x2":""}</p>
          ${S.streak>=2?`<div class="streak-badge inline-flex items-center gap-1 bg-cat-deportes text-white font-display font-extrabold px-5 py-2 rounded-full text-xl mt-4" style="box-shadow:0 4px 0 0 #8f3512;">
            <span class="material-symbols-outlined msf">local_fire_department</span> ¡${S.streak} seguidas!</div>`:""}
          <button onclick="nextTurn()" class="mt-6 w-full bg-primary-container text-white py-4 rounded-2xl font-bold text-lg block-shadow-primary active-btn-press transition-all">Siguiente turno</button>
        </div>
      </main>`;
    }, 700);
  } else {
    S.streak = 0;
    if(btns[j]){ btns[j].style.background = "#C62828"; btns[j].style.color = "#fff"; btns[j].style.borderColor = "#ba1a1a"; }
    if(btns[q.a]){ btns[q.a].style.background = "#1E7A5F"; btns[q.a].style.color = "#fff"; btns[q.a].style.borderColor = "#1E7A5F"; }
    FX.bad(); vibrate([80,60,80]); shakeScreen();
    setTimeout(()=>showReto(qi,false), 900);
  }
}

function showReto(qi,timeout){
  const q=QS[qi];
  S.streak = 0;
  if(S.modo === 'mundo') return perderVida(qi, timeout);
  return showRebote(qi, timeout);
  const r=RETOS[Math.floor(Math.random()*RETOS.length)];
  if(timeout){ FX.bad(); shakeScreen(); vibrate(120); }
  setTimeout(()=>FX.drum(), 250);
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-8 max-w-lg mx-auto w-full flex flex-col items-center">
    <p class="font-bold text-error mb-1">${timeout?"¡Se acabó el tiempo!":"Incorrecto"}</p>
    <p class="text-on-surface-variant mb-5">La respuesta era: <span class="font-bold text-on-surface">${q.o[q.a]}</span></p>
    <div class="w-full bg-cat-historia rounded-[28px] border-4 border-white p-6 text-center relative overflow-hidden animate-pop glow" style="box-shadow:0 8px 0 0 #8a5a08;">
      <div class="absolute inset-0 opacity-10" style="background-image:radial-gradient(#fff 2px,transparent 2px);background-size:18px 18px;"></div>
      <div class="relative z-10">
        <span class="material-symbols-outlined text-white msf urgent" style="font-size:48px;">local_fire_department</span>
        <p class="text-white/90 text-xs font-bold tracking-widest uppercase mt-1">Reto especial · 5 puntos</p>
        <p class="text-white font-display font-extrabold text-2xl mt-3 leading-snug">${r}</p>
      </div>
    </div>
    <p class="text-on-surface-variant text-sm mt-5 mb-3">${isBot()?S.players[S.turn]+" intenta cumplir el reto…":"El grupo decide si lo cumplió"}</p>
    <div class="w-full grid gap-3 ${isBot()?"opacity-25 pointer-events-none":""}">
      <button onclick="retoOk()" class="w-full bg-success text-white py-4 rounded-2xl font-bold text-lg active-btn-press transition-all" style="box-shadow:0 6px 0 0 #0f5340;">Lo cumplió (+5)</button>
      <button onclick="nextTurn()" class="w-full bg-surface-container border-2 border-outline-variant py-3.5 rounded-2xl font-bold text-on-surface-variant block-shadow-sm active-btn-press transition-all">No lo cumplió</button>
    </div>
  </main>`;
  if(isBot()){
    clearBot();
    S.botTO = setTimeout(()=>{ Math.random() < 0.5 ? retoOk() : nextTurn(); }, 2600);
  }
}

function perderVida(qi, timeout){
  const q = QS[qi], c = CATS[q.c];
  S.vidas--;
  FX.bad(); shakeScreen(); vibrate(120);
  const muerto = S.vidas <= 0;
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-10 max-w-lg mx-auto w-full flex flex-col items-center justify-center">
    <div class="bg-surface-container border-4 rounded-[28px] p-8 text-center w-full animate-pop" style="border-color:${c.color};box-shadow:0 8px 0 0 rgba(0,0,0,0.55);">
      ${vidasHTML()}
      <h2 class="font-display font-extrabold text-2xl mt-1">${timeout?"¡Se acabó el tiempo!":"Fallaste"}</h2>
      <p class="text-on-surface-variant mt-3 mb-1">La respuesta correcta era</p>
      <p class="font-display font-extrabold text-2xl" style="color:${c.color}">${q.o[q.a]}</p>
      <p class="text-on-surface-variant text-sm mt-4">${muerto ? "Te quedaste sin vidas." : "Te quedan "+S.vidas+" vida"+(S.vidas===1?"":"s")+". ¡Sigue!"}</p>
      <button onclick="${muerto?"etapaFallida()":"nextTurn()"}" class="mt-6 w-full bg-primary-container text-white py-4 rounded-2xl font-bold text-lg block-shadow-primary active-btn-press transition-all">${muerto?"Ver resultado":"Continuar"}</button>
    </div>
  </main>`;
}

function etapaFallida(){
  stopTimer(); FX.music.para();
  const e = ETAPAS[S.etapa];
  app.innerHTML = `${topBar()}
  <main class="flex-1 px-5 py-10 pb-32 max-w-lg mx-auto w-full">
    <div class="bg-surface-container border-2 border-outline-variant rounded-[28px] p-7 text-center block-shadow-sm animate-pop">
      <span class="material-symbols-outlined text-error msf" style="font-size:54px;">heart_broken</span>
      <h2 class="font-display font-extrabold text-2xl mt-2">Etapa no superada</h2>
      <p class="text-on-surface-variant mt-1">${e.n} se te resistió esta vez.</p>
      <p class="font-display font-extrabold text-4xl text-primary mt-4">${S.scores[0]} pts</p>
      <p class="text-on-surface-variant text-sm">${S.qDone} de ${S.qPerPlayer} preguntas respondidas</p>
      <div class="grid gap-3 mt-6">
        <button onclick="empezarEtapa(${S.etapa})" class="w-full bg-primary-container text-white py-4 rounded-2xl font-bold text-lg block-shadow-primary active-btn-press transition-all flex items-center justify-center gap-2"><span class="material-symbols-outlined">replay</span> Reintentar etapa</button>
        <button onclick="go('solo')" class="w-full bg-surface-container border-2 border-outline-variant py-3.5 rounded-2xl font-bold text-on-surface-variant block-shadow-sm active-btn-press transition-all">Volver al mapa</button>
      </div>
    </div>
  </main>${bottomNav("home")}`;
}

function etapaSuperada(){
  stopTimer(); FX.music.para();
  FX.fanfare(); burstConfetti(90,true); setTimeout(()=>burstConfetti(60,true),700); vibrate([60,40,60,40,120]);
  const e = ETAPAS[S.etapa];
  const est = S.vidas === 3 ? 3 : (S.vidas === 2 ? 2 : 1);
  const p = progresoMundo();
  p.estrellas[S.etapa] = Math.max(p.estrellas[S.etapa] || 0, est);
  p.mejor[S.etapa] = Math.max(p.mejor[S.etapa] || 0, S.scores[0]);
  const ultima = S.etapa >= ETAPAS.length - 1;
  if(!ultima) p.max = Math.max(p.max, S.etapa + 1);
  guardarMundo(p);
  app.innerHTML = `${topBar()}
  <main class="flex-1 px-5 py-10 pb-32 max-w-lg mx-auto w-full">
    <div class="bg-surface-container border-2 border-outline-variant rounded-[28px] p-7 text-center block-shadow-sm animate-pop">
      <span class="material-symbols-outlined text-cat-historia msf" style="font-size:56px;">${ultima?"trophy":"flag"}</span>
      <h2 class="font-display font-extrabold text-2xl mt-2">${ultima?"¡Diste la vuelta al mundo!":"¡"+e.n+" conquistada!"}</h2>
      <div class="flex items-center justify-center gap-1 mt-3">
        ${[0,1,2].map(s=>`<span class="material-symbols-outlined ${s<est?"msf text-cat-historia":"text-outline-variant"} ${s<est?"streak-badge":""}" style="font-size:38px;animation-delay:${s*0.15}s">star</span>`).join("")}
      </div>
      <p class="font-display font-extrabold text-4xl text-primary mt-4">${S.scores[0]} pts</p>
      <p class="text-on-surface-variant text-sm">${S.vidas} vida${S.vidas===1?"":"s"} restante${S.vidas===1?"":"s"}</p>
      <div class="grid gap-3 mt-6">
        ${!ultima?`<button onclick="volarA(${S.etapa+1})" class="w-full bg-primary-container text-white py-4 rounded-2xl font-bold text-lg block-shadow-primary active-btn-press transition-all flex items-center justify-center gap-2"><span class="material-symbols-outlined">flight_takeoff</span> Volar a ${ETAPAS[S.etapa+1].n}</button>`:""}
        <button onclick="go('solo')" class="w-full bg-surface-container border-2 border-outline-variant py-3.5 rounded-2xl font-bold text-on-surface-variant block-shadow-sm active-btn-press transition-all">Volver al mapa</button>
      </div>
    </div>
  </main>${bottomNav("home")}`;
}

/* ---------- REBOTE (modo en grupo) ---------- */
function showRebote(qi, timeout){
  const q = QS[qi], c = CATS[q.c];
  const fallo = S.turn;
  FX.bad(); shakeScreen(); vibrate([80,60,80]);
  const otros = S.players.map((n,i)=>({n,i})).filter(o => o.i !== fallo);
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-6 max-w-lg mx-auto w-full">
    <p class="text-center font-bold text-error">${timeout?"¡Se acabó el tiempo!":"Falló "+S.players[fallo]}</p>
    <div class="bg-surface-container border-4 rounded-[28px] p-5 mt-4 text-center animate-pop glow" style="border-color:${c.color};box-shadow:0 8px 0 0 rgba(0,0,0,0.55);">
      <p class="text-xs font-bold tracking-widest uppercase" style="color:${c.color}">¡Rebote! · 8 puntos</p>
      <p class="font-display font-bold text-lg mt-2">${q.q}</p>
    </div>
    <p class="text-center text-on-surface-variant mt-5 mb-3">¿Quién se anima a robar los puntos?</p>
    <div class="grid gap-2">
      ${otros.map(o=>`<button onclick="roba(${o.i},${qi})" class="w-full py-3.5 px-4 rounded-xl font-bold border-2 border-outline-variant bg-surface-container flex items-center justify-between active:translate-y-1 transition-all block-shadow-sm">
        <span class="flex items-center gap-2"><span class="material-symbols-outlined" style="font-size:20px;">pan_tool</span> ${o.n}</span>
        <span class="text-on-surface-variant text-sm">${S.scores[o.i]} pts</span></button>`).join("")}
      <button onclick="nadieSabe(${qi})" class="w-full py-3 rounded-xl font-bold text-on-surface-variant border-2 border-outline-variant/60 active:translate-y-1 transition-all">Nadie lo sabe</button>
    </div>
  </main>`;
}

function nadieSabe(qi){
  const q = QS[qi], c = CATS[q.c];
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-10 max-w-lg mx-auto w-full flex flex-col items-center justify-center">
    <div class="bg-surface-container border-4 rounded-[28px] p-8 text-center w-full animate-pop" style="border-color:${c.color};box-shadow:0 8px 0 0 rgba(0,0,0,0.55);">
      <span class="material-symbols-outlined text-on-surface-variant" style="font-size:48px;">visibility</span>
      <p class="text-on-surface-variant mt-3 mb-1">La respuesta era</p>
      <p class="font-display font-extrabold text-2xl" style="color:${c.color}">${q.o[q.a]}</p>
      <button onclick="nextTurn()" class="mt-6 w-full bg-primary-container text-white py-4 rounded-2xl font-bold text-lg block-shadow-primary active-btn-press transition-all">Siguiente turno</button>
    </div>
  </main>`;
}

function roba(quien, qi){
  const q = QS[qi], c = CATS[q.c];
  S.ladron = quien;
  let left = 10;
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col items-center">
    <p class="font-display font-extrabold text-xl mb-1">Roba <span class="text-primary">${S.players[quien]}</span></p>
    <p class="text-on-surface-variant text-sm mb-3">10 segundos · 8 puntos si aciertas</p>
    <div class="relative w-20 h-20 mb-4">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="40" fill="transparent" stroke="#2B3160" stroke-width="10"></circle>
        <circle id="robRing" cx="48" cy="48" r="40" fill="transparent" stroke="${c.color}" stroke-width="10" stroke-linecap="round" stroke-dasharray="251.3" stroke-dashoffset="0"></circle>
      </svg>
      <span id="robClk" class="absolute inset-0 flex items-center justify-center font-display font-extrabold text-3xl text-primary">10</span>
    </div>
    <div class="w-full bg-surface-container border-4 rounded-[28px] p-5" style="border-color:${c.color};box-shadow:0 8px 0 0 rgba(0,0,0,0.55);">
      <p class="font-display font-bold text-lg text-center mb-4">${q.q}</p>
      <div class="grid gap-3">
        ${q.o.map((o,j)=>`<button onclick="resultadoRobo(${j},${qi})" class="w-full border-2 border-outline-variant rounded-2xl py-3.5 px-4 font-bold text-left block-shadow-sm active-btn-press transition-all">${o}</button>`).join("")}
      </div>
    </div>
  </main>`;
  stopTimer();
  S.timer = setInterval(()=>{
    left--;
    const k = document.getElementById("robClk"), r = document.getElementById("robRing");
    if(k){ k.textContent = left; if(left<=3) k.classList.add("text-error"); }
    if(r){ r.style.strokeDashoffset = 251.3*(1-left/10); if(left<=3) r.setAttribute("stroke","#FF6B6B"); }
    if(left<=3 && left>0) FX.hurry();
    if(left<=0){ stopTimer(); resultadoRobo(-1, qi); }
  }, 1000);
}

function resultadoRobo(j, qi){
  stopTimer();
  const q = QS[qi], c = CATS[q.c];
  const quien = S.ladron;
  const ok = j === q.a;
  if(ok){
    S.scores[quien] += 8;
    FX.good(0); burstConfetti(40); flashPoints("+8", "#37D399"); vibrate([30,50,30]);
  } else { FX.bad(); shakeScreen(); }
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-10 max-w-lg mx-auto w-full flex flex-col items-center justify-center">
    <div class="bg-surface-container border-4 rounded-[28px] p-8 text-center w-full animate-pop" style="border-color:${ok?"#1E7A5F":c.color};box-shadow:0 8px 0 0 rgba(0,0,0,0.55);">
      <span class="material-symbols-outlined msf" style="font-size:52px;color:${ok?"#37D399":"#FF6B6B"};">${ok?"trending_up":"block"}</span>
      <h2 class="font-display font-extrabold text-2xl mt-2">${ok?"¡Robo perfecto!":"Robo fallido"}</h2>
      <p class="text-on-surface-variant mt-1">${ok?S.players[quien]+" se lleva 8 puntos":"Nadie se lleva los puntos"}</p>
      ${!ok?`<p class="text-on-surface-variant mt-4 mb-1 text-sm">La respuesta era</p><p class="font-display font-extrabold text-xl" style="color:${c.color}">${q.o[q.a]}</p>`:""}
      <button onclick="nextTurn()" class="mt-6 w-full bg-primary-container text-white py-4 rounded-2xl font-bold text-lg block-shadow-primary active-btn-press transition-all">Siguiente turno</button>
    </div>
  </main>`;
}

function nextTurn(){
  clearBot();
  if(S.modo === 'mundo'){
    S.qDone++;
    if(S.qDone >= S.qPerPlayer) return etapaSuperada();
    return go("deck");
  }
  S.qDone++; S.turn=(S.turn+1)%S.players.length;
  const totalQ = S.players.length*S.qPerPlayer;
  if(S.qDone>=totalQ) return finishGame();
  go("deck");
}

function scoreRow(p,i){
  const medals=["#DD9414","#9ca3af","#b45309"];
  const esBot = BOT_NAMES.includes(p.n);
  return `<div class="flex items-center justify-between py-3 border-b-2 border-outline-variant last:border-0">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style="background:${i<3?medals[i]:"#cac4d4"}">${i+1}</div>
      <span class="font-bold flex items-center gap-1">${esBot?'<span class="material-symbols-outlined text-on-surface-variant" style="font-size:17px;">explore</span>':""}${p.n}</span>
    </div>
    <span class="font-display font-extrabold text-primary">${p.s.toLocaleString("es")} pts</span></div>`;
}

function finishGame(){
  stopTimer();
  FX.music.para();
  FX.fanfare(); vibrate([60,40,60,40,120]);
  burstConfetti(90, true);
  setTimeout(()=>burstConfetti(60, true), 700);
  setTimeout(()=>burstConfetti(40, true), 1500);
  const sorted = S.players.map((n,i)=>({n,s:S.scores[i]})).sort((a,b)=>b.s-a.s);
  S.lastResults = sorted;
  const tie = sorted.length>1 && sorted[0].s===sorted[1].s;
  const conf = ["#5B3FA8","#17A2A2","#D6336C","#DD9414","#D9531E"].map((c,i)=>
    `<span class="confetti absolute w-2.5 h-4 rounded-sm" style="background:${c};left:${12+i*18}%;animation-delay:${i*0.25}s;"></span>`).join("");
  app.innerHTML = `${topBar()}
  <main class="flex-1 px-5 py-8 pb-32 max-w-lg mx-auto w-full">
    <div class="bg-surface-container border-2 border-outline-variant rounded-[28px] p-6 text-center relative overflow-hidden block-shadow-sm animate-pop">
      <div class="absolute inset-x-0 top-0 h-24 pointer-events-none" aria-hidden="true">${conf}</div>
      <img alt="" src="${LOGO_IMG}" class="w-20 h-20 object-contain mx-auto rounded-2xl relative"/>
      <span class="material-symbols-outlined text-cat-historia msf relative block" style="font-size:44px;">trophy</span>
      <h2 class="font-display font-extrabold text-3xl mt-1">${tie?"¡Empate mundial!":"¡Felicidades, "+sorted[0].n+"!"}</h2>
      <p class="text-on-surface-variant mt-1 mb-5">${tie?"Comparten el podio de hoy":"Has conquistado el podio de hoy"}</p>
      <div class="text-left">${sorted.map((p,i)=>scoreRow(p,i)).join("")}</div>
      <div class="grid gap-3 mt-6">
        <button onclick="go('setup')" class="w-full bg-primary-container text-white py-4 rounded-2xl font-bold text-lg block-shadow-primary active-btn-press transition-all flex items-center justify-center gap-2"><span class="material-symbols-outlined">replay</span> Jugar otra vez</button>
        <button onclick="go('home')" class="w-full bg-surface-container border-2 border-outline-variant py-3.5 rounded-2xl font-bold text-on-surface-variant block-shadow-sm active-btn-press transition-all">Volver al inicio</button>
      </div>
    </div>
  </main>${bottomNav("board")}`;
}

render.online = () => { if(window.renderOnlineMenu) renderOnlineMenu(); else app.innerHTML = '<p class=\"p-8 text-center\">Cargando modo en línea…</p>'; };

render.home();
