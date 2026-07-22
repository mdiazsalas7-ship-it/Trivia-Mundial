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

function switchSync(){
  if(!window.SYNC) return alert("La sincronización necesita conexión a internet.");
  const nuevo = !SYNC.activo();
  if(nuevo && !perfilActivo()) return alert("Crea primero un jugador en Ajustes.");
  SYNC.activar(nuevo);
  render.settings();
  if(nuevo) FX.good(0);
}

function copiarCodigo(){
  const cod = SYNC.codigoDe(perfilActivo().id);
  if(navigator.clipboard) navigator.clipboard.writeText(cod).then(()=>alert("Código copiado: " + cod)).catch(()=>alert("Tu código es: " + cod));
  else alert("Tu código es: " + cod);
}

function recuperarViaje(){
  const cod = prompt("Escribe el código de viajero (8 caracteres):");
  if(!cod) return;
  SYNC.recuperar(cod).then(datos => {
    if(!datos) return alert("No encontramos ningún viaje con ese código.");
    const yo = perfilActivo();
    if(!yo) return alert("Crea primero un jugador.");
    if(!confirm(`Se encontró el viaje de ${datos.nombre} (${datos.estrellas||0} estrellas). ¿Cargarlo en el perfil ${yo.nombre}? Se reemplazará su progreso actual.`)) return;
    guardarMundo({ max: datos.etapa||0, estrellas: datos.estrellasPorEtapa||{}, mejor: datos.mejorPorEtapa||{} }, yo.id);
    SYNC.asociar(yo.id, cod.trim().toUpperCase());
    FX.fanfare(); burstConfetti(50);
    alert("¡Viaje recuperado!");
    render.settings();
  });
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

const APP_VER = "3.4";
/* ---------- PERFILES DE JUGADORES ---------- */
function perfiles(){
  try { return JSON.parse(localStorage.getItem("tm_perfiles")) || []; } catch(e){ return []; }
}
function guardarPerfiles(list){ localStorage.setItem("tm_perfiles", JSON.stringify(list)); }
function nuevoId(){ return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2,5); }
function perfilPorId(id){ return perfiles().find(p => p.id === id); }

const DESCRIPCIONES = {
  "Cultura":        { d:"Geografía, capitales, monumentos, idiomas, comidas y costumbres de los cinco continentes.", ej:"¿En qué ciudad está el Coliseo?" },
  "Ciencia":        { d:"El cuerpo humano, los animales, el espacio, la química, la física y los grandes inventos.", ej:"¿Cuántos corazones tiene un pulpo?" },
  "Historia":       { d:"Civilizaciones antiguas, personajes, guerras, descubrimientos y hechos que cambiaron el mundo.", ej:"¿Qué ciudad sepultó el Vesubio?" },
  "Entretenimiento":{ d:"Cine, música, series, videojuegos, libros, festivales y cultura popular de todo el planeta.", ej:"¿En qué país nació el anime?" },
  "Deportes":       { d:"Fútbol, olimpiadas, tenis, récords, grandes figuras y reglas de los deportes del mundo.", ej:"¿Qué país inventó el taekwondo?" },
  "Sorpresa":       { d:"Datos curiosos e insólitos de todo el planeta. ¡Ojo! Esta carta vale el doble de puntos.", ej:"¿Qué país tiene una bandera que no es rectangular?" }
};

/* ---------- EXPLORADORES ÉPICOS ---------- */
const AURAS = [
  { id:0, n:"Turquesa", c:"#17A2A2", luz:"#8FF3F0" },
  { id:1, n:"Esmeralda", c:"#1E7A5F", luz:"#7CE8B8" },
  { id:2, n:"Ámbar",    c:"#DD9414", luz:"#FFD98A" },
  { id:3, n:"Magenta",  c:"#D6336C", luz:"#FF9CC0" },
  { id:4, n:"Fuego",    c:"#D9531E", luz:"#FFB088" },
  { id:5, n:"Púrpura",  c:"#5B3FA8", luz:"#C6B6FF" }
];

/* cada equipo dibuja su silueta; se pinta dos veces: contorno luminoso + relleno oscuro */
const EQUIPOS = [
  { id:0, n:"Explorador", d:`<path d="M28 52 Q28 24 60 24 Q92 24 92 52 L92 55 Q78 47 60 47 Q42 47 28 55 Z"/><path d="M16 56 Q60 44 104 56 Q60 68 16 56 Z"/>` },
  { id:1, n:"Aviador",    d:`<path d="M30 54 Q30 22 60 22 Q90 22 90 54 L90 62 Q90 70 82 70 L80 52 Q72 44 60 44 Q48 44 40 52 L38 70 Q30 70 30 62 Z"/><rect x="36" y="42" width="20" height="13" rx="6"/><rect x="64" y="42" width="20" height="13" rx="6"/><rect x="52" y="46" width="16" height="5"/>` },
  { id:2, n:"Capucha",    d:`<path d="M22 78 Q22 20 60 20 Q98 20 98 78 L86 78 Q86 42 60 42 Q34 42 34 78 Z"/>` },
  { id:3, n:"Turbante",   d:`<path d="M30 50 Q30 20 60 20 Q90 20 90 50 Q90 56 84 56 L36 56 Q30 56 30 50 Z"/><path d="M32 44 Q60 34 88 44" fill="none" stroke-width="3"/>` },
  { id:4, n:"Polar",      d:`<path d="M30 50 Q30 20 60 20 Q90 20 90 50 Z"/><rect x="26" y="46" width="68" height="13" rx="6"/><circle cx="60" cy="15" r="8"/>` },
  { id:5, n:"Sombrero",   d:`<path d="M36 50 Q36 26 60 26 Q84 26 84 50 Z"/><path d="M22 52 Q60 42 98 52 Q60 62 22 52 Z"/>` },
  { id:6, n:"Casco",      d:`<path d="M30 52 Q30 22 60 22 Q90 22 90 52 L90 58 L30 58 Z"/><ellipse cx="60" cy="58" rx="38" ry="7"/><rect x="56" y="20" width="8" height="14" rx="4"/>` },
  { id:7, n:"Laurel",     d:`<path d="M34 52 Q34 26 60 26 Q86 26 86 52 Z"/><path d="M26 60 Q30 40 44 32" fill="none" stroke-width="4"/><path d="M94 60 Q90 40 76 32" fill="none" stroke-width="4"/>` }
];

const CAPAS = [
  { id:0, n:"Abrigo",  d:`<path d="M18 120 L18 104 Q18 86 40 80 L60 76 L80 80 Q102 86 102 104 L102 120 Z"/><path d="M60 76 L50 96 L60 104 L70 96 Z"/>` },
  { id:1, n:"Capa",    d:`<path d="M14 120 L18 100 Q22 84 42 79 L60 75 L78 79 Q98 84 102 100 L106 120 Z"/><circle cx="60" cy="84" r="6"/>` },
  { id:2, n:"Bufanda", d:`<path d="M18 120 L18 102 Q18 86 40 80 L60 76 L80 80 Q102 86 102 104 L102 120 Z"/><path d="M36 84 Q60 96 84 84 L86 94 Q60 106 34 94 Z"/><rect x="52" y="92" width="11" height="26" rx="4"/>` },
  { id:3, n:"Poncho",  d:`<path d="M16 120 L26 92 Q34 78 60 76 Q86 78 94 92 L104 120 Z"/><path d="M30 100 L90 100" fill="none" stroke-width="4"/>` }
];

const MIRADAS = [
  { id:0, n:"Intensa",  d:(l)=>`<g><ellipse cx="49" cy="62" rx="5" ry="2.6" fill="${l}"/><ellipse cx="71" cy="62" rx="5" ry="2.6" fill="${l}"/></g>` },
  { id:1, n:"Serena",   d:(l)=>`<g opacity="0.75"><rect x="45" y="61" width="10" height="2.6" rx="1.3" fill="${l}"/><rect x="65" y="61" width="10" height="2.6" rx="1.3" fill="${l}"/></g>` },
  { id:2, n:"Enigma",   d:(l)=>`` }
];

function personajeDefecto(){ return { equipo:0, capa:0, aura:0, mirada:0 }; }
function personajeAleatorio(){
  const r = n => Math.floor(Math.random()*n);
  return { equipo:r(EQUIPOS.length), capa:r(CAPAS.length), aura:r(AURAS.length), mirada:r(MIRADAS.length) };
}

/* rango según logros: territorios conquistados y estrellas del viaje */
const RANGOS = [
  { min:0,  n:"Novato",   c:"#8a6a45", luz:"#C9A57A" },
  { min:6,  n:"Veterano", c:"#9aa3b2", luz:"#DCE3EE" },
  { min:18, n:"Maestro",  c:"#DD9414", luz:"#FFE0A0" },
  { min:36, n:"Leyenda",  c:"#C6B6FF", luz:"#F0EAFF" }
];
function rangoDe(puntosLogro){
  let r = RANGOS[0];
  RANGOS.forEach(x => { if(puntosLogro >= x.min) r = x; });
  return r;
}
function logrosDe(perfilId){
  const prog = progresoMundo(perfilId);
  const estrellas = Object.values(prog.estrellas||{}).reduce((a,b)=>a+b,0);
  let terr = 0;
  try {
    const mio = (window.SYNC && perfilId) ? SYNC.mapa()[perfilId] : null;
    if(mio && S._terr) terr = Object.values(S._terr).filter(t => t.codigo === mio).length;
  } catch(e){}
  return { estrellas, terr, total: terr*3 + Math.floor(estrellas/2) };
}

function personajeSVG(cfg, size, logros){
  const c = Object.assign(personajeDefecto(), cfg||{});
  const eq = EQUIPOS[c.equipo] || EQUIPOS[0];
  const capa = CAPAS[c.capa] || CAPAS[0];
  const aura = AURAS[c.aura] || AURAS[0];
  const mirada = MIRADAS[c.mirada] || MIRADAS[0];
  const L = logros || { total:0, terr:0 };
  const rango = rangoDe(L.total);
  const grande = size >= 56;
  const uid = "a" + (c.equipo)+(c.capa)+(c.aura)+(c.mirada)+Math.round(size);

  const figura = `${capa.d}<path d="M50 74 L50 62 L70 62 L70 74 Z"/><path d="M34 46 Q34 18 60 18 Q86 18 86 46 L86 56 Q86 76 60 76 Q34 76 34 56 Z"/>${eq.d}`;

  const marco = () => {
    if(!grande) return `<circle cx="60" cy="60" r="57" fill="none" stroke="${rango.c}" stroke-width="4"/>`;
    let m = `<circle cx="60" cy="60" r="57" fill="none" stroke="${rango.c}" stroke-width="4"/>
             <circle cx="60" cy="60" r="52" fill="none" stroke="${rango.luz}" stroke-width="1.2" opacity="0.6"/>`;
    if(L.total >= 6) m += `<circle cx="60" cy="60" r="59.5" fill="none" stroke="${rango.luz}" stroke-width="1.5" opacity="0.5"/>`;
    if(L.total >= 18) m += [0,90,180,270].map(ang=>`<g transform="rotate(${ang} 60 60)"><path d="M60 0.5 L64 6 L60 11 L56 6 Z" fill="${rango.luz}"/></g>`).join("");
    if(L.total >= 36) m += `<path d="M18 92 Q6 70 14 46" fill="none" stroke="${rango.luz}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M102 92 Q114 70 106 46" fill="none" stroke="${rango.luz}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M48 4 L54 12 L60 2 L66 12 L72 4 L72 14 L48 14 Z" fill="${rango.luz}"/>`;
    return m;
  };

  return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" style="display:block;border-radius:50%;overflow:hidden;">
    <defs>
      <radialGradient id="f${uid}" cx="50%" cy="34%">
        <stop offset="0%" stop-color="${aura.c}" stop-opacity="0.95"/>
        <stop offset="55%" stop-color="${aura.c}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#03050F" stop-opacity="1"/>
      </radialGradient>
      <clipPath id="c${uid}"><circle cx="60" cy="60" r="60"/></clipPath>
    </defs>
    <g clip-path="url(#c${uid})">
      <rect width="120" height="120" fill="#03050F"/>
      <rect width="120" height="120" fill="url(#f${uid})"/>
      ${grande?`<g opacity="0.22">
        <path d="M60 30 L34 120 L46 120 Z" fill="${aura.luz}"/>
        <path d="M60 30 L86 120 L74 120 Z" fill="${aura.luz}"/>
        <path d="M60 30 L58 120 L62 120 Z" fill="${aura.luz}"/></g>`:""}
      <circle cx="60" cy="46" r="30" fill="${aura.luz}" opacity="0.28"/>
      <g fill="none" stroke="${aura.luz}" stroke-width="5" stroke-linejoin="round" opacity="0.95">${figura}</g>
      <g fill="#05070F" stroke="#05070F" stroke-width="0.5">${figura}</g>
      ${mirada.d(aura.luz)}
    </g>
    ${marco()}
    ${grande && L.terr > 0 ? `<g>
      <rect x="42" y="100" width="36" height="16" rx="8" fill="#05070F" stroke="${rango.c}" stroke-width="1.5"/>
      <text x="60" y="111.5" text-anchor="middle" font-size="10" font-weight="800" fill="${rango.luz}" font-family="Plus Jakarta Sans">${L.terr} 🏴</text>
    </g>` : ""}
  </svg>`;
}

const AVATARES = ["😀","😎","🤓","🥳","😺","🐶","🦊","🐼","🦁","🐨","🐵","🦄","🐸","🐯","🐧","🦖","🤖","👽","🦉","🐙","🍕","⚽","🎸","🚀","🌟","🔥","🎯","👑","🎩","🦸","🧙","🧠"];
function avatarColor(i){ return Object.values(CATS)[i%6].color; }

function renderAvatarCara(av, i, size){
  const s = size || 40;
  if(av && typeof av === "string" && av.startsWith("avt:")){
    try {
      const cfg = JSON.parse(av.slice(4));
      const L = arguments.length > 3 ? arguments[3] : (cfg._id ? logrosDe(cfg._id) : null);
      return `<span style="display:inline-block;width:${s}px;height:${s}px;">${personajeSVG(cfg, s, L)}</span>`;
    } catch(e){ /* si falla, sigue con el resto */ }
  }
  if(av && av.startsWith("data:")){
    return `<img src="${av}" alt="" class="rounded-full object-cover" style="width:${s}px;height:${s}px;"/>`;
  }
  const emoji = av && !/^\d+$/.test(av) ? av : null;
  return `<div class="rounded-full flex items-center justify-center flex-shrink-0" style="width:${s}px;height:${s}px;background:${emoji?"var(--tm-surface,#111740)":avatarColor(i)};font-size:${Math.round(s*0.55)}px;">${emoji || `<span class="text-white font-bold" style="font-size:${Math.round(s*0.4)}px">${i+1}</span>`}</div>`;
}

window.editarPerfil = function(id){
  S._avTab = "personaje";
  const lista = perfiles();
  const p = id ? lista.find(x=>x.id===id) : { id:null, nombre:"", av:"avt:" + JSON.stringify(personajeAleatorio()) };
  S._perfilEdit = JSON.parse(JSON.stringify(p));
  pintarEditorPerfil();
};

function pintarEditorPerfil(){
  const p = S._perfilEdit;
  const viejo = document.getElementById("perfilModal"); if(viejo) viejo.remove();
  const modal = document.createElement("div");
  modal.id = "perfilModal";
  modal.className = "fixed inset-0 z-[9998] flex items-center justify-center p-4";
  modal.style.background = "rgba(0,0,0,.65)";
  modal.innerHTML = `<div class="bg-surface-container border-2 border-outline-variant rounded-3xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto" style="box-shadow:0 12px 40px rgba(0,0,0,.6)">
    <div class="flex justify-between items-center mb-4">
      <p class="font-display font-extrabold text-xl">${p.id?"Editar jugador":"Nuevo jugador"}</p>
      <button onclick="cerrarPerfil()" class="p-1 text-on-surface-variant"><span class="material-symbols-outlined">close</span></button>
    </div>
    <div class="flex flex-col items-center mb-4">
      ${renderAvatarCara(p.av, 0, 96)}
    </div>
    <input id="perfilNombre" placeholder="Nombre" maxlength="18" value="${(p.nombre||"").replace(/"/g,'&quot;')}" class="w-full border-2 border-outline-variant rounded-xl px-4 py-3 mb-4 focus:border-primary-container focus:ring-0"/>
    <div class="flex gap-2 mb-4">
      ${[["personaje","Personaje","face"],["emoji","Emoji","mood"],["foto","Foto","photo_camera"]].map(([id,txt,ic])=>`
        <button onclick="S._avTab='${id}';pintarEditorPerfil()" class="flex-1 py-2.5 rounded-xl font-bold text-sm border-2 flex items-center justify-center gap-1 transition-all active:translate-y-1 ${(S._avTab||"personaje")===id?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">
          <span class="material-symbols-outlined" style="font-size:17px;">${ic}</span>${txt}</button>`).join("")}
    </div>
    ${(S._avTab||"personaje")==="personaje" ? editorPersonaje(p) : ""}
    ${(S._avTab||"personaje")==="emoji" ? `<div class="grid grid-cols-6 gap-2 mb-4">
      ${AVATARES.map(e=>`<button onclick="elegirAvatar('${e}')" class="aspect-square rounded-xl flex items-center justify-center text-2xl border-2 ${p.av===e?"border-primary-container bg-primary-fixed":"border-outline-variant"} active:scale-90 transition-transform">${e}</button>`).join("")}
    </div>` : ""}
    ${(S._avTab||"personaje")==="foto" ? `<div class="text-center mb-4">
      <button onclick="document.getElementById('avFile').click()" class="w-full py-3.5 rounded-xl font-bold border-2 border-primary-container text-primary flex items-center justify-center gap-2 active:translate-y-1 transition-all">
        <span class="material-symbols-outlined">photo_camera</span> Elegir foto del dispositivo</button>
      <input type="file" id="avFile" accept="image/*" class="hidden" onchange="subirFoto(event)"/>
      <p class="text-on-surface-variant text-xs mt-2">La foto se guarda solo en este dispositivo.</p>
    </div>` : ""}
    <div class="grid gap-2">
      <button onclick="guardarPerfilEdit()" class="w-full bg-primary-container text-white py-3.5 rounded-xl font-bold active-btn-press transition-all" style="box-shadow:0 4px 0 0 #21005e;">Guardar</button>
      ${p.id?`<button onclick="borrarPerfil('${p.id}')" class="w-full py-3 rounded-xl font-bold text-error border-2 border-outline-variant active:translate-y-1 transition-all">Eliminar jugador</button>`:""}
    </div>
  </div>`;
  document.body.appendChild(modal);
}

function cfgActual(p){
  if(p.av && typeof p.av === "string" && p.av.startsWith("avt:")){
    try { return JSON.parse(p.av.slice(4)); } catch(e){}
  }
  return personajeDefecto();
}

function editorPersonaje(p){
  const c = cfgActual(p);
  const yo = perfilActivo();
  const L = logrosDe(p.id || (yo && yo.id));
  const rango = rangoDe(L.total);
  const fila = (titulo, items, campo) => `
    <p class="text-on-surface-variant text-xs font-bold uppercase tracking-wider mt-4 mb-1.5">${titulo}</p>
    <div class="flex gap-2 overflow-x-auto pb-1">
      ${items.map((it,i)=>`<button onclick="setPersonaje('${campo}',${i})" class="flex-shrink-0 rounded-2xl border-2 p-1 transition-all active:scale-90 ${c[campo]===i?"border-primary-container":"border-outline-variant"}" title="${it.n}">
        <span style="display:block;width:52px;height:52px;">${personajeSVG({...c,[campo]:i}, 52, L)}</span></button>`).join("")}
    </div>`;
  return `<div class="mb-4">
    <div class="rounded-2xl border-2 border-outline-variant p-3 mb-3 flex items-center gap-3" style="background:linear-gradient(135deg, ${rango.c}22, transparent);">
      <span class="material-symbols-outlined msf" style="color:${rango.c};font-size:26px;">military_tech</span>
      <div class="flex-1">
        <p class="font-display font-extrabold" style="color:${rango.luz}">${rango.n}</p>
        <p class="text-on-surface-variant text-xs">${L.terr} territorio${L.terr===1?"":"s"} · ${L.estrellas} estrella${L.estrellas===1?"":"s"} · conquista más para subir de rango</p>
      </div>
    </div>
    <button onclick="dadoPersonaje()" class="w-full py-2.5 rounded-xl font-bold border-2 border-outline-variant text-on-surface-variant flex items-center justify-center gap-2 active:translate-y-1 transition-all">
      <span class="material-symbols-outlined" style="font-size:18px;">casino</span> Sorpréndeme</button>
    ${fila("Equipo", EQUIPOS, "equipo")}
    ${fila("Atuendo", CAPAS, "capa")}
    ${fila("Aura", AURAS, "aura")}
    ${fila("Mirada", MIRADAS, "mirada")}
  </div>`;
}

window.setPersonaje = function(campo, valor){
  const el = document.getElementById("perfilNombre");
  if(el) S._perfilEdit.nombre = el.value;
  const c = cfgActual(S._perfilEdit);
  c[campo] = valor;
  S._perfilEdit.av = "avt:" + JSON.stringify(c);
  FX.tone(760,0.04,"triangle",0.06);
  pintarEditorPerfil();
};

window.dadoPersonaje = function(){
  const el = document.getElementById("perfilNombre");
  if(el) S._perfilEdit.nombre = el.value;
  S._perfilEdit.av = "avt:" + JSON.stringify(personajeAleatorio());
  FX.tone(880,0.08,"triangle",0.1); vibrate(20);
  pintarEditorPerfil();
};

window.cerrarPerfil = function(){ const m=document.getElementById("perfilModal"); if(m) m.remove(); };
window.guardarPerfilEdit = function(){
  const el = document.getElementById("perfilNombre");
  const nombre = (el && el.value.trim()) || "Jugador";
  const p = S._perfilEdit;
  const lista = perfiles();
  const marcarId = (av, id) => {
    if(typeof av === "string" && av.startsWith("avt:")){
      try { const c = JSON.parse(av.slice(4)); c._id = id; return "avt:" + JSON.stringify(c); } catch(e){}
    }
    return av;
  };
  if(p.id){
    const i = lista.findIndex(x=>x.id===p.id);
    if(i>=0) lista[i] = { id:p.id, nombre, av:marcarId(p.av, p.id) };
  } else {
    const id = nuevoId();
    lista.push({ id, nombre, av:marcarId(p.av, id) });
    if(!localStorage.getItem("tm_perfil_activo")) localStorage.setItem("tm_perfil_activo", id);
  }
  guardarPerfiles(lista);
  cerrarPerfil();
  if(S.screen === "settings") render.settings();
  else if(S.screen === "setup") render.setup();
  else if(S.screen === "solo") render.solo();
  else if(S.screen === "board") render.board();
};
window.borrarPerfil = function(id){
  if(!confirm("¿Eliminar este jugador y su progreso?")) return;
  guardarPerfiles(perfiles().filter(p=>p.id!==id));
  localStorage.removeItem("tm_mundo_" + id);
  if(localStorage.getItem("tm_perfil_activo")===id) localStorage.removeItem("tm_perfil_activo");
  cerrarPerfil();
  if(S.screen === "settings") render.settings(); else render.board();
};

window.abrirAvatar = function(idx){
  S._avEdit = idx;
  const actual = (S._avatars && S._avatars[idx]) || "";
  const modal = document.createElement("div");
  modal.id = "avModal";
  modal.className = "fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-4";
  modal.style.background = "rgba(0,0,0,.6)";
  modal.innerHTML = `<div class="bg-surface-container border-2 border-outline-variant rounded-3xl p-5 w-full max-w-sm max-h-[80vh] overflow-y-auto" style="box-shadow:0 12px 40px rgba(0,0,0,.6)">
    <div class="flex justify-between items-center mb-4">
      <p class="font-display font-extrabold text-xl">Elige tu avatar</p>
      <button onclick="cerrarAvatar()" class="p-1 text-on-surface-variant"><span class="material-symbols-outlined">close</span></button>
    </div>
    <button onclick="document.getElementById('avFile').click()" class="w-full mb-4 py-3 rounded-xl font-bold border-2 border-primary-container text-primary flex items-center justify-center gap-2 active:translate-y-1 transition-all">
      <span class="material-symbols-outlined">photo_camera</span> Subir mi foto</button>
    <input type="file" id="avFile" accept="image/*" class="hidden" onchange="subirFoto(event)"/>
    <p class="text-on-surface-variant text-sm font-bold mb-2">O elige un emoji</p>
    <div class="grid grid-cols-6 gap-2">
      ${AVATARES.map(e=>`<button onclick="elegirAvatar('${e}')" class="aspect-square rounded-xl flex items-center justify-center text-2xl border-2 ${actual===e?"border-primary-container bg-primary-fixed":"border-outline-variant"} active:scale-90 transition-transform">${e}</button>`).join("")}
    </div>
  </div>`;
  document.body.appendChild(modal);
};
window.cerrarAvatar = function(){ const m = document.getElementById("avModal"); if(m) m.remove(); };
window.elegirAvatar = function(e){
  if(S._perfilEdit){ S._perfilEdit.av = e; const el=document.getElementById("perfilNombre"); if(el) S._perfilEdit.nombre = el.value; return pintarEditorPerfil(); }
  S._avatars = S._avatars || [];
  S._avatars[S._avEdit] = e;
  cerrarAvatar(); render.setup();
};
window.subirFoto = function(ev){
  const file = ev.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      // recortar a cuadrado y reducir para no ocupar memoria
      const size = 128;
      const c = document.createElement("canvas"); c.width = size; c.height = size;
      const ctx = c.getContext("2d");
      const lado = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width-lado)/2, (img.height-lado)/2, lado, lado, 0, 0, size, size);
      const dataUrl = c.toDataURL("image/jpeg", 0.8);
      if(S._perfilEdit){ S._perfilEdit.av = dataUrl; const el=document.getElementById("perfilNombre"); if(el) S._perfilEdit.nombre = el.value; return pintarEditorPerfil(); }
      S._avatars = S._avatars || [];
      S._avatars[S._avEdit] = dataUrl;
      cerrarAvatar(); render.setup();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
};
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
      <button onclick="go('conquista')" class="w-full bg-cat-deportes text-white py-4 rounded-2xl font-display font-extrabold text-2xl active-btn-press transition-all flex items-center justify-center gap-3" style="box-shadow:0 6px 0 0 #8f3512;">
        <span class="material-symbols-outlined msf">flag</span><span>Conquista Mundial</span></button>
      <p class="text-center text-on-surface-variant text-sm -mt-1">Vuelta al Mundo = tu aventura · En grupo = hasta 8 aquí · En línea = salas con código · Conquista = gana países a jugadores reales</p>
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
  const conteo = {};
  QS.forEach(q => conteo[q.c] = (conteo[q.c]||0)+1);
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 px-5 py-6 pb-32 max-w-lg mx-auto w-full">
    <h2 class="font-display font-bold text-2xl mb-1">Categorías</h2>
    <p class="text-on-surface-variant mb-5">Toca una carta para ver de qué trata. ${QS.length} preguntas en total.</p>
    <div class="grid grid-cols-2 gap-4">
      ${Object.keys(CATS).map((k,i)=>`<button onclick="verCategoria('${k}')" class="card-perspective aspect-[3/4] relative animate-pop active:scale-95 transition-transform" style="animation-delay:${i*0.06}s">${cardFace(k)}</button>`).join("")}
    </div>
    <div id="detalleCat" class="mt-4"></div>
  </main>${bottomNav("cats")}`;
};

window.verCategoria = function(cat){
  const c = CATS[cat], info = DESCRIPCIONES[cat];
  const conteo = QS.filter(q=>q.c===cat).length;
  FX.flip();
  const cont = document.getElementById("detalleCat");
  if(!cont) return;
  cont.innerHTML = `<div class="bg-surface-container border-4 rounded-[24px] p-5 animate-pop" style="border-color:${c.color};box-shadow:0 8px 0 0 rgba(0,0,0,0.55);">
    <div class="flex items-center gap-3 mb-3">
      <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background:${c.color}">
        <span class="material-symbols-outlined text-white msf">${c.icon}</span></div>
      <div>
        <p class="font-display font-extrabold text-lg leading-tight">${cat}</p>
        <p class="text-on-surface-variant text-sm">${conteo} preguntas${c.x2?" · vale x2 puntos":""}</p>
      </div>
    </div>
    <p class="leading-relaxed">${info.d}</p>
    <div class="mt-4 rounded-xl p-3" style="background:${c.color}22;">
      <p class="text-xs font-bold uppercase tracking-wider mb-1" style="color:${c.color}">Ejemplo</p>
      <p class="font-bold">${info.ej}</p>
    </div>
  </div>`;
  cont.scrollIntoView({ block:"nearest", behavior:"smooth" });
};

render.board = () => {
  if(S._tabRank === undefined) S._tabRank = "familia";
  if(S._tabRank === "mundial") return boardMundial();
  const lista = perfiles();
  const filas = lista.map(p => {
    const prog = progresoMundo(p.id);
    return { ...p, estrellas: estrellasTotales(prog), puntos: puntosTotales(prog), etapas: Math.min(prog.max, ETAPAS.length-1) + (prog.estrellas[ETAPAS.length-1]?1:0), max: prog.max };
  }).sort((a,b)=> b.estrellas - a.estrellas || b.puntos - a.puntos);
  const medals = ["#DD9414","#9ca3af","#b45309"];
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 px-5 py-6 pb-32 max-w-lg mx-auto w-full">
    <h2 class="font-display font-bold text-2xl mb-1">Ranking</h2>
    <p class="text-on-surface-variant mb-4">Solo cuenta la Vuelta al Mundo. Las partidas en grupo no puntúan.</p>
    ${tabsRanking("familia")}
    ${filas.length === 0 || filas.every(f=>f.puntos===0)
      ? `<div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-8 text-center block-shadow-sm">
          <span class="material-symbols-outlined text-primary" style="font-size:44px;">emoji_events</span>
          <p class="font-bold mt-2">El podio está vacío</p>
          <p class="text-on-surface-variant mt-1 mb-4">Completa etapas de la Vuelta al Mundo para aparecer aquí.</p>
          <button onclick="go('solo')" class="bg-primary-container text-white px-6 py-3 rounded-xl font-bold block-shadow-primary active-btn-press transition-all">Empezar el viaje</button>
        </div>`
      : `<div class="grid gap-2.5">
          ${filas.map((f,i)=>`<div class="bg-surface-container border-2 ${i===0?"border-cat-historia":"border-outline-variant"} rounded-2xl p-4 flex items-center gap-3 block-shadow-sm">
            <span class="w-7 text-center font-display font-extrabold text-lg" style="color:${i<3?medals[i]:"#6F6A92"}">${i+1}</span>
            ${renderAvatarCara(f.av, i, 46)}
            <div class="flex-1 min-w-0">
              <p class="font-bold truncate">${f.nombre}</p>
              <p class="text-on-surface-variant text-sm">${f.max+1 > ETAPAS.length ? "Viaje completado" : "Etapa "+(f.max+1)+" · "+ETAPAS[Math.min(f.max,ETAPAS.length-1)].n}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="font-display font-extrabold text-primary">${f.puntos.toLocaleString("es")}</p>
              <p class="text-sm flex items-center gap-0.5 justify-end"><span class="material-symbols-outlined msf text-cat-historia" style="font-size:15px;">star</span>${f.estrellas}</p>
            </div>
          </div>`).join("")}
        </div>
        <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 mt-5 block-shadow-sm">
          <p class="font-bold mb-3">Récords por destino${perfilActivo()?" · "+perfilActivo().nombre:""}</p>
          ${(()=>{ const pr = progresoMundo(); const hechas = ETAPAS.map((e,i)=>({e,i,pts:pr.mejor[i]||0,est:pr.estrellas[i]||0})).filter(x=>x.pts>0);
            return hechas.length ? hechas.map(x=>`<div class="flex items-center justify-between py-2 border-b-2 border-outline-variant last:border-0">
              <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full" style="background:${x.e.color}"></span><span class="font-bold text-sm">${x.i+1}. ${x.e.n}</span></span>
              <span class="flex items-center gap-2"><span class="text-sm">${[0,1,2].map(s=>s<x.est?"★":"☆").join("")}</span><span class="font-display font-extrabold text-sm">${x.pts}</span></span>
            </div>`).join("") : '<p class="text-on-surface-variant text-sm">Sin récords todavía.</p>'; })()}
        </div>`}
  </main>${bottomNav("board")}`;
};

function tabsRanking(activa){
  return `<div class="flex gap-2 mb-5">
    <button onclick="S._tabRank='familia';render.board()" class="flex-1 py-2.5 rounded-xl font-bold border-2 transition-all active:translate-y-1 ${activa==="familia"?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">En este dispositivo</button>
    <button onclick="S._tabRank='mundial';render.board()" class="flex-1 py-2.5 rounded-xl font-bold border-2 transition-all active:translate-y-1 ${activa==="mundial"?"bg-cat-cultura text-white border-cat-cultura":"border-outline-variant text-on-surface-variant"}">Mundial</button>
  </div>`;
}

function boardMundial(){
  const medals = ["#DD9414","#9ca3af","#b45309"];
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 px-5 py-6 pb-32 max-w-lg mx-auto w-full">
    <h2 class="font-display font-bold text-2xl mb-1">Ranking</h2>
    <p class="text-on-surface-variant mb-4">Viajeros de todo el mundo. Solo se comparten nombre, emoji y puntos.</p>
    ${tabsRanking("mundial")}
    <div id="rankGlobal">
      <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-8 text-center block-shadow-sm">
        <span class="material-symbols-outlined text-primary urgent" style="font-size:36px;">travel_explore</span>
        <p class="text-on-surface-variant mt-2">Cargando el ranking mundial…</p>
      </div>
    </div>
  </main>${bottomNav("board")}`;

  if(!window.SYNC){ return pintarRankError("El ranking mundial no está disponible sin conexión."); }
  const misCodigos = Object.values(SYNC.mapa());
  SYNC.ranking(50).then(filas => {
    const cont = document.getElementById("rankGlobal");
    if(!cont) return;
    if(!filas) return pintarRankError("No pudimos cargar el ranking. Revisa tu conexión.");
    if(filas.length === 0) return pintarRankError("Aún no hay viajeros en el ranking. ¡Sé el primero!");
    cont.innerHTML = `<div class="grid gap-2.5">
      ${filas.map((f,i)=>{
        const mio = misCodigos.includes(f.codigo);
        return `<div class="bg-surface-container border-2 ${mio?"border-primary-container":(i===0?"border-cat-historia":"border-outline-variant")} rounded-2xl p-3.5 flex items-center gap-3 block-shadow-sm">
          <span class="w-7 text-center font-display font-extrabold text-lg" style="color:${i<3?medals[i]:"#6F6A92"}">${i+1}</span>
          <span class="text-3xl">${f.emoji || "🙂"}</span>
          <div class="flex-1 min-w-0">
            <p class="font-bold truncate">${f.nombre}${mio?' <span class="text-xs text-primary">(tú)</span>':""}</p>
            <p class="text-on-surface-variant text-sm">Etapa ${Math.min((f.etapa||0)+1, ETAPAS.length)} de ${ETAPAS.length}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="font-display font-extrabold text-primary">${(f.puntos||0).toLocaleString("es")}</p>
            <p class="text-sm flex items-center gap-0.5 justify-end"><span class="material-symbols-outlined msf text-cat-historia" style="font-size:15px;">star</span>${f.estrellas||0}</p>
          </div></div>`;
      }).join("")}</div>
      ${!SYNC.activo()?`<div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 mt-4 text-center block-shadow-sm">
        <p class="font-bold">No estás compitiendo aún</p>
        <p class="text-on-surface-variant text-sm mt-1 mb-3">Activa la sincronización en Ajustes para aparecer en el ranking.</p>
        <button onclick="go('settings')" class="bg-primary-container text-white px-5 py-2.5 rounded-xl font-bold block-shadow-primary active-btn-press transition-all">Ir a Ajustes</button>
      </div>`:""}`;
  });
}

function pintarRankError(msg){
  const cont = document.getElementById("rankGlobal");
  if(cont) cont.innerHTML = `<div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-8 text-center block-shadow-sm">
    <span class="material-symbols-outlined text-on-surface-variant" style="font-size:36px;">cloud_off</span>
    <p class="text-on-surface-variant mt-2">${msg}</p></div>`;
}

render.settings = () => {
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 px-5 py-6 pb-32 max-w-lg mx-auto w-full">
    <h2 class="font-display font-bold text-2xl mb-5">Ajustes</h2>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mb-5">
      <div class="flex justify-between items-center mb-1">
        <p class="font-bold">Jugadores</p>
        <span class="text-on-surface-variant text-sm">${perfiles().length} guardado${perfiles().length===1?"":"s"}</span>
      </div>
      <p class="text-on-surface-variant text-sm mb-3">Crea un perfil con foto para cada miembro de la familia. Se usan en todas las partidas.</p>
      <div class="grid gap-2">
        ${perfiles().map(p=>`<button onclick="editarPerfil('${p.id}')" class="w-full py-2.5 px-3 rounded-xl border-2 border-outline-variant flex items-center gap-3 active:translate-y-1 transition-all">
          ${renderAvatarCara(p.av, 0, 40)}
          <span class="font-bold flex-1 text-left">${p.nombre}</span>
          ${perfilActivo() && perfilActivo().id===p.id?'<span class="text-xs font-bold bg-primary-fixed text-primary px-2 py-1 rounded-full">principal</span>':""}
          <span class="material-symbols-outlined text-on-surface-variant">edit</span></button>`).join("")}
        <button onclick="editarPerfil(null)" class="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant font-bold flex items-center justify-center gap-2 active:translate-y-1 transition-all">
          <span class="material-symbols-outlined">person_add</span> Añadir jugador</button>
      </div>
    </div>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm">
      <p class="font-bold mb-2">Tiempo por pregunta</p>
      <div class="flex gap-3">
        ${[15,20,30].map(t=>`<button onclick="S.timerSecs=${t};render.settings()" class="flex-1 py-3 rounded-xl font-bold border-2 transition-all active:translate-y-1 ${S.timerSecs===t?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">${t} s</button>`).join("")}
      </div>
      <p class="text-on-surface-variant text-sm mt-3">Menos tiempo, más adrenalina. El bonus de rapidez se ajusta solo.</p>
    </div>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mt-5">
      <p class="font-bold mb-3">Audio</p>
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
      <p class="font-bold mb-1">Ranking mundial y respaldo</p>
      <p class="text-on-surface-variant text-sm mb-3">Comparte tu progreso para competir en el ranking mundial y poder recuperarlo en otro dispositivo. <span class="text-primary font-bold">Tus fotos nunca se envían</span>: solo viajan nombre, emoji, estrellas y puntos.</p>
      <button onclick="switchSync()" class="w-full py-3 px-4 rounded-xl font-bold border-2 flex items-center justify-between transition-all active:translate-y-1 ${(window.SYNC&&SYNC.activo())?"bg-cat-cultura text-white border-cat-cultura":"border-outline-variant text-on-surface-variant"}">
        <span class="flex items-center gap-2"><span class="material-symbols-outlined">${(window.SYNC&&SYNC.activo())?"cloud_done":"cloud_off"}</span> Sincronizar mi progreso</span>
        <span class="text-sm">${(window.SYNC&&SYNC.activo())?"Activado":"Desactivado"}</span></button>
      ${(window.SYNC&&SYNC.activo()&&perfilActivo())?`
        <div class="mt-3 rounded-xl border-2 border-outline-variant p-3">
          <p class="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Código de ${perfilActivo().nombre}</p>
          <div class="flex items-center gap-2">
            <span class="font-display font-extrabold text-2xl tracking-widest flex-1">${SYNC.codigoDe(perfilActivo().id)}</span>
            <button onclick="copiarCodigo()" class="p-2 rounded-lg border-2 border-outline-variant active:translate-y-1 transition-all"><span class="material-symbols-outlined" style="font-size:18px;">content_copy</span></button>
          </div>
          <p class="text-on-surface-variant text-xs mt-2">Guárdalo: con él recuperas tu viaje en otro celular.</p>
        </div>
        <button onclick="recuperarViaje()" class="mt-3 w-full py-3 rounded-xl font-bold border-2 border-outline-variant text-on-surface-variant flex items-center justify-center gap-2 active:translate-y-1 transition-all">
          <span class="material-symbols-outlined">restore</span> Recuperar viaje con un código</button>`:""}
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

const TERRITORIOS = [
  { id:"mx", n:"México", x:275, y:308 },
  { id:"us", n:"Estados Unidos", x:292, y:236 },
  { id:"ca", n:"Canadá", x:257, y:159 },
  { id:"br", n:"Brasil", x:501, y:458 },
  { id:"ar", n:"Argentina", x:443, y:567 },
  { id:"pe", n:"Perú", x:395, y:458 },
  { id:"co", n:"Colombia", x:403, y:394 },
  { id:"cl", n:"Chile", x:412, y:571 },
  { id:"gl", n:"Groenlandia", x:541, y:86 },
  { id:"es", n:"España", x:711, y:231 },
  { id:"fr", n:"Francia", x:738, y:199 },
  { id:"uk", n:"Reino Unido", x:719, y:168 },
  { id:"de", n:"Alemania", x:772, y:181 },
  { id:"it", n:"Italia", x:783, y:222 },
  { id:"gr", n:"Grecia", x:826, y:236 },
  { id:"ma", n:"Marruecos", x:701, y:267 },
  { id:"eg", n:"Egipto", x:861, y:290 },
  { id:"ng", n:"Nigeria", x:763, y:372 },
  { id:"ke", n:"Kenia", x:892, y:413 },
  { id:"za", n:"Sudáfrica", x:834, y:544 },
  { id:"ru", n:"Rusia", x:994, y:141 },
  { id:"tr", n:"Turquía", x:883, y:236 },
  { id:"sa", n:"Arabia Saudita", x:928, y:304 },
  { id:"in", n:"India", x:1074, y:313 },
  { id:"cn", n:"China", x:1194, y:254 },
  { id:"jp", n:"Japón", x:1341, y:245 },
  { id:"kr", n:"Corea del Sur", x:1294, y:249 },
  { id:"id", n:"Indonesia", x:1230, y:422 },
  { id:"au", n:"Australia", x:1323, y:526 },
  { id:"nz", n:"Nueva Zelanda", x:1492, y:603 }
];

const ENERGIA_MAX = 5;
function energia(){
  const hoy = new Date().toISOString().slice(0,10);
  let e;
  try { e = JSON.parse(localStorage.getItem("tm_energia")) || {}; } catch(err){ e = {}; }
  if(e.dia !== hoy) e = { dia:hoy, usados:0 };
  return e;
}
function energiaRestante(){ return Math.max(0, ENERGIA_MAX - energia().usados); }
function gastarEnergia(){
  const e = energia();
  e.usados = Math.min(ENERGIA_MAX, e.usados + 1);
  localStorage.setItem("tm_energia", JSON.stringify(e));
}
function miCodigo(){
  const yo = perfilActivo();
  if(!yo || !window.SYNC) return null;
  return SYNC.codigoDe(yo.id);
}

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

function perfilActivo(){
  const id = localStorage.getItem("tm_perfil_activo");
  return perfilPorId(id) || perfiles()[0] || null;
}
function progresoMundo(id){
  const pid = id || (perfilActivo() && perfilActivo().id) || "anon";
  try { return JSON.parse(localStorage.getItem("tm_mundo_" + pid)) || { max:0, estrellas:{}, mejor:{} }; }
  catch(e){ return { max:0, estrellas:{}, mejor:{} }; }
}
function guardarMundo(p, id){
  const pid = id || (perfilActivo() && perfilActivo().id) || "anon";
  localStorage.setItem("tm_mundo_" + pid, JSON.stringify(p));
}
function puntosTotales(prog){ return Object.values(prog.mejor||{}).reduce((a,b)=>a+b,0); }
function estrellasTotales(prog){ return Object.values(prog.estrellas||{}).reduce((a,b)=>a+b,0); }

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

window.atacarTerritorio = function(id){
  if(energiaRestante() <= 0) return;
  const t = TERRITORIOS.find(x=>x.id===id);
  const d = (S._terr||{})[id];
  gastarEnergia();
  // 5 preguntas de categorías variadas
  const bolsa = shuffle(Object.keys(CATS));
  const preguntas = [];
  bolsa.slice(0,5).forEach(c => {
    const delCat = QS.map((q,i)=>({q,i})).filter(x=>x.q.c===c);
    if(delCat.length) preguntas.push(delCat[Math.floor(Math.random()*delCat.length)].i);
  });
  while(preguntas.length < 5){
    const r = Math.floor(Math.random()*QS.length);
    if(!preguntas.includes(r)) preguntas.push(r);
  }
  S.conq = { id, nombre:t.n, objetivo: d ? d.puntos : 0, dueno: d ? d.nombre : null, preguntas, idx:0, puntos:0, aciertos:0 };
  if(FX.on && FX.music.on) FX.music.arranca();
  conqPregunta();
};

function conqPregunta(){
  const c = S.conq;
  if(c.idx >= c.preguntas.length) return conqResultado();
  const qi = c.preguntas[c.idx];
  const q = QS[qi], cat = CATS[q.c];
  const SEG = 15;
  c.left = SEG;
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-4 pb-10 max-w-lg mx-auto w-full flex flex-col items-center">
    <div class="w-full flex items-center justify-between mb-2">
      <span class="text-on-surface-variant font-bold text-sm">Conquistando ${c.nombre}</span>
      <span class="font-display font-extrabold">${c.puntos} pts</span>
    </div>
    <div class="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden mb-3">
      <div class="h-full rounded-full" style="width:${(c.idx/c.preguntas.length)*100}%;background:linear-gradient(90deg,#17A2A2,#5B3FA8);"></div>
    </div>
    <div class="relative w-20 h-20 mb-2">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="40" fill="transparent" stroke="#2B3160" stroke-width="10"></circle>
        <circle id="cqRing" cx="48" cy="48" r="40" fill="transparent" stroke="${cat.color}" stroke-width="10" stroke-linecap="round" stroke-dasharray="251.3" stroke-dashoffset="0"></circle>
      </svg>
      <span id="cqClk" class="absolute inset-0 flex items-center justify-center font-display font-extrabold text-3xl text-primary">${SEG}</span>
    </div>
    <div class="w-full bg-surface-container border-4 rounded-[24px] p-5 animate-pop" style="border-color:${cat.color};box-shadow:0 8px 0 0 rgba(0,0,0,0.55);">
      <div class="flex justify-center mb-3">
        <span class="text-white text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full flex items-center gap-1" style="background:${cat.color}">
          <span class="material-symbols-outlined" style="font-size:14px;">${cat.icon}</span>${q.c}${cat.x2?" · x2":""}</span>
      </div>
      <p class="font-display font-bold text-lg text-center mb-4">${q.q}</p>
      <div class="grid gap-2.5" id="cqOpts">
        ${q.o.map((o,j)=>`<button onclick="conqResponder(${j},${qi})" class="w-full border-2 border-outline-variant rounded-xl py-3 px-4 font-bold text-left block-shadow-sm active-btn-press transition-all">${o}</button>`).join("")}
      </div>
    </div>
    <p class="text-on-surface-variant text-sm mt-3">Pregunta ${c.idx+1} de ${c.preguntas.length}${c.objetivo?" · objetivo: "+(c.objetivo+1)+" pts":""}</p>
  </main>`;
  stopTimer();
  S.timer = setInterval(()=>{
    c.left--;
    const k = document.getElementById("cqClk"), r = document.getElementById("cqRing");
    if(k){ k.textContent = c.left; if(c.left<=4) k.classList.add("text-error"); }
    if(r){ r.style.strokeDashoffset = 251.3*(1-c.left/SEG); if(c.left<=4) r.setAttribute("stroke","#FF6B6B"); }
    if(c.left<=4 && c.left>0) FX.hurry();
    if(c.left<=0){ stopTimer(); conqResponder(-1, qi); }
  }, 1000);
}

window.conqResponder = function(j, qi){
  stopTimer();
  const c = S.conq, q = QS[qi], cat = CATS[q.c];
  const btns = document.querySelectorAll("#cqOpts button");
  btns.forEach(b => b.style.pointerEvents = "none");
  if(j === q.a){
    const base = cat.x2 ? 20 : 10;
    const rapidez = Math.round(base * 0.5 * (c.left/15));
    const pts = base + rapidez;
    c.puntos += pts; c.aciertos++;
    if(btns[j]){ btns[j].style.background="#1E7A5F"; btns[j].style.color="#fff"; btns[j].style.borderColor="#1E7A5F"; }
    FX.good(0); flashPoints("+"+pts, "#37D399"); vibrate(30);
  } else {
    if(j>=0 && btns[j]){ btns[j].style.background="#C62828"; btns[j].style.color="#fff"; btns[j].style.borderColor="#C62828"; }
    if(btns[q.a]){ btns[q.a].style.background="#1E7A5F"; btns[q.a].style.color="#fff"; btns[q.a].style.borderColor="#1E7A5F"; }
    FX.bad(); shakeScreen();
  }
  c.idx++;
  setTimeout(conqPregunta, 1100);
};

function conqResultado(){
  stopTimer(); FX.music.para();
  const c = S.conq;
  const gana = c.puntos > c.objetivo;
  const yo = perfilActivo();
  if(gana){
    FX.fanfare(); burstConfetti(80,true); vibrate([60,40,60,40,120]);
    CONQ.conquistar(c.id, { nombre: yo.nombre, avatar: yo.av, codigo: miCodigo(), puntos: c.puntos })
      .then(ok => { if(ok && S._terr) S._terr[c.id] = { nombre:yo.nombre, avatar:yo.av, codigo:miCodigo(), puntos:c.puntos }; });
  } else { FX.bad(); shakeScreen(); }
  app.innerHTML = `${topBar()}
  <main class="flex-1 px-5 py-8 pb-32 max-w-lg mx-auto w-full">
    <div class="bg-surface-container border-4 rounded-[28px] p-7 text-center block-shadow-sm animate-pop" style="border-color:${gana?"#1E7A5F":"#D6336C"};">
      <span class="material-symbols-outlined msf" style="font-size:56px;color:${gana?"#37D399":"#FF6B6B"};">${gana?"flag":"shield"}</span>
      <h2 class="font-display font-extrabold text-2xl mt-2">${gana?"¡"+c.nombre+" es tuyo!":"No pudiste conquistar "+c.nombre}</h2>
      <p class="font-display font-extrabold text-4xl text-primary mt-3">${c.puntos} pts</p>
      <p class="text-on-surface-variant text-sm">${c.aciertos} de ${c.preguntas.length} aciertos${c.objetivo?" · marca a batir: "+c.objetivo:""}</p>
      ${gana?`<div class="mt-4 flex items-center justify-center gap-2">
        <span style="display:inline-block;width:36px;height:36px;">${renderAvatarCara(yo.av,0,36)}</span>
        <span class="font-bold">Tu bandera ondea en ${c.nombre}</span></div>`
      :`<p class="text-on-surface-variant mt-4">${c.dueno?c.dueno+" defiende su territorio con "+c.objetivo+" puntos.":"Necesitas al menos "+(c.objetivo+1)+" puntos."}</p>`}
      <div class="grid gap-3 mt-6">
        ${energiaRestante()>0?`<button onclick="atacarTerritorio('${c.id}')" class="w-full bg-primary-container text-white py-3.5 rounded-xl font-bold block-shadow-primary active-btn-press transition-all flex items-center justify-center gap-2"><span class="material-symbols-outlined">replay</span> Intentar otra vez (${energiaRestante()} ataques)</button>`:""}
        <button onclick="go('conquista')" class="w-full bg-surface-container border-2 border-outline-variant py-3.5 rounded-xl font-bold text-on-surface-variant block-shadow-sm active-btn-press transition-all">Volver al mapa</button>
      </div>
    </div>
  </main>${bottomNav("home")}`;
}

render.conquista = () => {
  const yo = perfilActivo();
  if(!yo){
    app.innerHTML = `${topBar({back:"go('home')"})}
    <main class="flex-1 px-5 py-10 max-w-lg mx-auto w-full">
      <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-7 text-center block-shadow-sm">
        <span class="material-symbols-outlined text-primary" style="font-size:44px;">person_add</span>
        <p class="font-display font-extrabold text-xl mt-2">Necesitas un personaje</p>
        <p class="text-on-surface-variant mt-1 mb-4">Tu personaje representa tu bandera en el mapa mundial.</p>
        <button onclick="editarPerfil(null)" class="bg-primary-container text-white px-6 py-3 rounded-xl font-bold block-shadow-primary active-btn-press transition-all">Crear mi personaje</button>
      </div>
    </main>${bottomNav("home")}`;
    return;
  }
  if(!window.SYNC || !SYNC.activo()){
    app.innerHTML = `${topBar({back:"go('home')"})}
    <main class="flex-1 px-5 py-10 max-w-lg mx-auto w-full">
      <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-7 text-center block-shadow-sm">
        <span class="material-symbols-outlined text-cat-cultura" style="font-size:44px;">public</span>
        <p class="font-display font-extrabold text-xl mt-2">Activa la conexión mundial</p>
        <p class="text-on-surface-variant mt-1 mb-4">Para conquistar países compites contra jugadores reales de todo el mundo. Solo se comparten tu nombre, tu personaje y tus puntos.</p>
        <button onclick="go('settings')" class="bg-primary-container text-white px-6 py-3 rounded-xl font-bold block-shadow-primary active-btn-press transition-all">Ir a Ajustes</button>
      </div>
    </main>${bottomNav("home")}`;
    return;
  }
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 pb-32 max-w-3xl mx-auto w-full">
    <div class="px-5 pt-5 text-center">
      <h2 class="font-display font-bold text-2xl">Conquista Mundial</h2>
      <p class="text-on-surface-variant text-sm">Supera la marca del dueño para quedarte con su país</p>
      <div class="flex items-center justify-center gap-2 mt-3" id="conqResumen">
        <span class="inline-flex items-center gap-1 bg-surface-container border-2 border-outline-variant rounded-full px-3 py-1">
          <span class="material-symbols-outlined text-cat-deportes msf" style="font-size:16px;">bolt</span>
          <span class="font-display font-extrabold text-sm">${energiaRestante()}</span>
          <span class="text-on-surface-variant text-xs">/ ${ENERGIA_MAX} ataques hoy</span></span>
      </div>
    </div>
    <div id="mapaWrap" class="mt-3 overflow-x-auto overflow-y-hidden">
      <div class="min-w-[1600px]" id="mapaConq">
        <div class="flex items-center justify-center" style="height:300px">
          <span class="material-symbols-outlined text-primary urgent" style="font-size:40px;">travel_explore</span>
        </div>
      </div>
    </div>
    <div id="fichaTerr" class="px-5"></div>
  </main>${bottomNav("home")}`;

  CONQ.cargar(true).then(mapa => {
    if(!mapa) {
      const c = document.getElementById("mapaConq");
      if(c) c.innerHTML = `<div class="p-8 text-center text-on-surface-variant">No pudimos cargar el mapa. Revisa tu conexión.</div>`;
      return;
    }
    S._terr = mapa;
    pintarMapaConquista();
  });
};

function pintarMapaConquista(destacado){
  const mapa = S._terr || {};
  const mio = miCodigo();
  const cont = document.getElementById("mapaConq");
  if(!cont) return;
  const marcas = TERRITORIOS.map(t => {
    const d = mapa[t.id];
    const esMio = d && d.codigo === mio;
    const color = d ? (esMio ? "#5B3FA8" : "#D6336C") : "#2B3160";
    return `<g transform="translate(${t.x},${t.y})" style="cursor:pointer" onclick="verTerritorio('${t.id}')" role="button" aria-label="${t.n}">
      ${destacado===t.id?`<circle r="24" fill="${color}" opacity="0.3"><animate attributeName="r" values="18;28;18" dur="1.6s" repeatCount="indefinite"/></circle>`:""}
      <circle r="13" fill="${color}" stroke="${esMio?"#C6B6FF":"#05081C"}" stroke-width="${esMio?3:2}"/>
      ${d ? `<text y="5" text-anchor="middle" font-size="14">${String(d.avatar||"").startsWith("avt:")?"":(d.avatar||"🙂")}</text>` : `<text y="5" text-anchor="middle" font-size="13" fill="#6F6A92" font-weight="700">?</text>`}
      <text y="28" text-anchor="middle" font-size="12" font-weight="700" fill="#ECEAF7" style="paint-order:stroke;stroke:#05081C;stroke-width:4;">${t.n}</text>
    </g>`;
  }).join("");
  cont.innerHTML = `<svg viewBox="0 0 1600 800" width="1600" height="800" role="img" aria-label="Mapa de conquista">
    <image href="${MAPA_IMG}" x="0" y="0" width="1600" height="800" preserveAspectRatio="none"/>
    ${marcas}
  </svg>`;
  const mios = TERRITORIOS.filter(t => mapa[t.id] && mapa[t.id].codigo === mio).length;
  const res = document.getElementById("conqResumen");
  if(res && !res.dataset.listo){
    res.dataset.listo = "1";
    res.insertAdjacentHTML("beforeend", `<span class="inline-flex items-center gap-1 bg-surface-container border-2 border-outline-variant rounded-full px-3 py-1">
      <span class="material-symbols-outlined text-primary msf" style="font-size:16px;">flag</span>
      <span class="font-display font-extrabold text-sm" id="misPaises">${mios}</span>
      <span class="text-on-surface-variant text-xs">tuyos</span></span>`);
  } else if(document.getElementById("misPaises")) document.getElementById("misPaises").textContent = mios;
}

window.verTerritorio = function(id){
  const t = TERRITORIOS.find(x=>x.id===id);
  const d = (S._terr||{})[id];
  const mio = miCodigo();
  const esMio = d && d.codigo === mio;
  const ficha = document.getElementById("fichaTerr");
  if(!ficha) return;
  const objetivo = d ? d.puntos : 0;
  ficha.innerHTML = `<div class="bg-surface-container border-2 ${esMio?"border-primary-container":"border-outline-variant"} rounded-2xl p-5 mt-4 block-shadow-sm animate-pop">
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden" style="background:${d?(esMio?"#5B3FA8":"#D6336C"):"#2B3160"}">
        ${d ? (String(d.avatar||"").startsWith("avt:") ? renderAvatarCara(d.avatar,0,48) : (d.avatar||"🙂")) : '<span class="material-symbols-outlined text-on-surface-variant">flag</span>'}
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-display font-extrabold text-lg leading-tight">${t.n}</p>
        <p class="text-on-surface-variant text-sm">${d ? (esMio ? "Es tuyo · defiende con "+d.puntos+" pts" : "De "+d.nombre+" · "+d.puntos+" pts") : "Territorio libre"}</p>
      </div>
    </div>
    <p class="text-on-surface-variant text-sm mt-3">${d ? (esMio ? "Vuelve a jugar para subir tu marca y hacerlo más difícil de robar." : "Necesitas más de "+objetivo+" puntos en 5 preguntas para conquistarlo.") : "Responde 5 preguntas para plantar tu bandera."}</p>
    <button onclick="atacarTerritorio('${id}')" ${energiaRestante()<=0?"disabled":""} class="mt-4 w-full ${energiaRestante()<=0?"bg-outline-variant text-white/60":"bg-primary-container text-white block-shadow-primary active-btn-press"} py-3.5 rounded-xl font-display font-extrabold text-lg transition-all flex items-center justify-center gap-2">
      <span class="material-symbols-outlined">${energiaRestante()<=0?"hourglass_empty":"swords"}</span>
      ${energiaRestante()<=0 ? "Sin ataques hoy" : (esMio ? "Reforzar" : "Conquistar")}</button>
  </div>`;
  pintarMapaConquista(id);
  const wrap = document.getElementById("mapaWrap");
  if(wrap) wrap.scrollTo({ left: Math.max(0, t.x - wrap.clientWidth/2), behavior:"smooth" });
};

render.solo = () => {
  const yo = perfilActivo();
  if(!yo){
    app.innerHTML = `${topBar({back:"go('home')"})}
    <main class="flex-1 px-5 py-10 max-w-lg mx-auto w-full">
      <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-7 text-center block-shadow-sm">
        <span class="material-symbols-outlined text-primary" style="font-size:44px;">person_add</span>
        <p class="font-display font-extrabold text-xl mt-2">Primero crea tu jugador</p>
        <p class="text-on-surface-variant mt-1 mb-4">Tu progreso del viaje se guarda en tu perfil, con tu foto.</p>
        <button onclick="editarPerfil(null)" class="bg-primary-container text-white px-6 py-3 rounded-xl font-bold block-shadow-primary active-btn-press transition-all">Crear mi perfil</button>
      </div>
    </main>${bottomNav("home")}`;
    return;
  }
  const p = progresoMundo(yo.id);
  const totalEstrellas = Object.values(p.estrellas).reduce((a,b)=>a+b,0);
  const actual = Math.min(p.max, ETAPAS.length-1);
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 pb-32 max-w-3xl mx-auto w-full">
    <div class="px-5 pt-5 text-center">
      <h2 class="font-display font-bold text-2xl">Vuelta al Mundo</h2>
      <button onclick="cambiarViajero()" class="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-full border-2 border-outline-variant bg-surface-container active:translate-y-1 transition-all">
        ${renderAvatarCara(yo.av, 0, 26)}
        <span class="font-bold text-sm">${yo.nombre}</span>
        <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px;">swap_horiz</span>
      </button>
      <p class="text-on-surface-variant text-sm mt-1">Toca un destino para volar hacia él</p>
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

window.cambiarViajero = function(){
  const lista = perfiles();
  const m = document.createElement("div");
  m.id = "viajeroModal";
  m.className = "fixed inset-0 z-[9998] flex items-center justify-center p-4";
  m.style.background = "rgba(0,0,0,.65)";
  m.innerHTML = `<div class="bg-surface-container border-2 border-outline-variant rounded-3xl p-5 w-full max-w-sm" style="box-shadow:0 12px 40px rgba(0,0,0,.6)">
    <p class="font-display font-extrabold text-xl mb-4">¿Quién viaja?</p>
    <div class="grid gap-2">
      ${lista.map(p=>`<button onclick="ponerViajero('${p.id}')" class="w-full py-2.5 px-3 rounded-xl border-2 flex items-center gap-3 active:translate-y-1 transition-all ${perfilActivo()&&perfilActivo().id===p.id?"border-primary-container bg-primary-fixed":"border-outline-variant"}">
        ${renderAvatarCara(p.av,0,38)}<span class="font-bold flex-1 text-left">${p.nombre}</span>
        <span class="text-on-surface-variant text-sm">${estrellasTotales(progresoMundo(p.id))} ★</span></button>`).join("")}
      <button onclick="cerrarViajero();editarPerfil(null)" class="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant font-bold flex items-center justify-center gap-2 active:translate-y-1 transition-all">
        <span class="material-symbols-outlined">person_add</span> Nuevo jugador</button>
    </div></div>`;
  m.onclick = ev => { if(ev.target===m) m.remove(); };
  document.body.appendChild(m);
};
window.cerrarViajero = function(){ const m=document.getElementById("viajeroModal"); if(m) m.remove(); };
window.ponerViajero = function(id){
  localStorage.setItem("tm_perfil_activo", id);
  cerrarViajero(); render.solo();
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
  const yo = perfilActivo();
  S.players = [yo ? yo.nombre : "Tú"];
  S.avatars = [yo ? yo.av : "😀"];
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
  const lista = perfiles();
  S._sel = (S._sel || []).filter(id => lista.some(p=>p.id===id));
  const n = S._sel.length;
  const est = Math.round(Math.max(n,2) * S.qPerPlayer * 0.7);
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 px-5 py-6 pb-10 max-w-lg mx-auto w-full">
    <h2 class="font-display font-bold text-2xl mb-1">¿Quiénes juegan?</h2>
    <p class="text-on-surface-variant mb-4">Toca para seleccionar (de 2 a 8 jugadores)</p>
    ${lista.length === 0 ? `<div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-6 text-center block-shadow-sm mb-5">
        <span class="material-symbols-outlined text-primary" style="font-size:40px;">group_add</span>
        <p class="font-bold mt-2">Aún no hay jugadores</p>
        <p class="text-on-surface-variant text-sm mt-1 mb-4">Crea un perfil con foto para cada persona.</p>
        <button onclick="editarPerfil(null)" class="bg-primary-container text-white px-6 py-3 rounded-xl font-bold block-shadow-primary active-btn-press transition-all">Crear el primero</button>
      </div>`
    : `<div class="grid grid-cols-3 gap-3 mb-5">
        ${lista.map(p=>{
          const sel = S._sel.includes(p.id);
          const idx = S._sel.indexOf(p.id);
          return `<button onclick="toggleJugador('${p.id}')" class="relative rounded-2xl border-2 p-3 flex flex-col items-center gap-2 transition-all active:scale-95 ${sel?"border-primary-container bg-primary-fixed":"border-outline-variant bg-surface-container"}">
            ${renderAvatarCara(p.av, 0, 56)}
            <span class="font-bold text-sm truncate w-full text-center">${p.nombre}</span>
            ${sel?`<span class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary-container border-2 border-background flex items-center justify-center font-display font-extrabold text-sm text-white">${idx+1}</span>`:""}
          </button>`;
        }).join("")}
        <button onclick="editarPerfil(null)" class="rounded-2xl border-2 border-dashed border-outline-variant p-3 flex flex-col items-center justify-center gap-1 text-on-surface-variant active:scale-95 transition-all">
          <span class="material-symbols-outlined" style="font-size:28px;">person_add</span>
          <span class="text-xs font-bold">Añadir</span></button>
      </div>`}
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mb-6">
      <p class="font-bold mb-3">Preguntas por jugador</p>
      <div class="flex gap-3">
        ${[3,5,8,10].map(q=>`<button onclick="S.qPerPlayer=${q};render.setup()" class="flex-1 py-3 rounded-xl font-bold border-2 transition-all active:translate-y-1 ${S.qPerPlayer===q?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">${q}</button>`).join("")}
      </div>
      <p class="text-on-surface-variant text-sm mt-3">${S.qPerPlayer} preguntas ≈ ${est} minutos de partida</p>
    </div>
    <button onclick="startGame()" ${n<2?"disabled":""} class="w-full ${n<2?"bg-outline-variant text-white/60":"bg-primary-container text-white block-shadow-primary active-btn-press"} py-4 rounded-2xl font-display font-extrabold text-xl transition-all flex items-center justify-center gap-2">
      <span class="material-symbols-outlined">style</span> ${n<2?"Elige al menos 2 jugadores":"Repartir cartas ("+n+")"}</button>
  </main>`;
};

window.toggleJugador = function(id){
  S._sel = S._sel || [];
  const i = S._sel.indexOf(id);
  if(i>=0) S._sel.splice(i,1);
  else if(S._sel.length < 8) S._sel.push(id);
  FX.tone(700,0.05,"triangle",0.08);
  render.setup();
};

function startGame(){
  const sel = (S._sel||[]).map(id => perfilPorId(id)).filter(Boolean);
  if(sel.length < 2) return;
  S.players = sel.map(p=>p.nombre);
  S.avatars = sel.map(p=>p.av);
  S.perfilIds = sel.map(p=>p.id);
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
           <div class="flex items-center justify-center gap-2">
             ${S.avatars?renderAvatarCara(S.avatars[S.turn], S.turn, 32):""}
             <h2 class="font-display font-bold text-2xl">Turno de: <span class="text-primary-container">${S.players[S.turn]}</span></h2>
           </div>
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

function showReto(qi, timeout){
  S.streak = 0;
  if(S.modo === 'mundo') return perderVida(qi, timeout);
  return showRebote(qi, timeout);
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
  const yo = perfilActivo();
  const p = progresoMundo(yo && yo.id);
  p.estrellas[S.etapa] = Math.max(p.estrellas[S.etapa] || 0, est);
  p.mejor[S.etapa] = Math.max(p.mejor[S.etapa] || 0, S.scores[0]);
  const ultima = S.etapa >= ETAPAS.length - 1;
  if(!ultima) p.max = Math.max(p.max, S.etapa + 1);
  guardarMundo(p, yo && yo.id);
  if(window.SYNC && SYNC.activo()) SYNC.subir(yo, p);
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
      ${otros.map(o=>`<button onclick="roba(${o.i},${qi})" class="w-full py-3 px-4 rounded-xl font-bold border-2 border-outline-variant bg-surface-container flex items-center justify-between active:translate-y-1 transition-all block-shadow-sm">
        <span class="flex items-center gap-2">${S.avatars?renderAvatarCara(S.avatars[o.i], o.i, 32):""} ${o.n}</span>
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
  const av = p.av !== undefined ? p.av : String(i);
  return `<div class="flex items-center justify-between py-3 border-b-2 border-outline-variant last:border-0">
    <div class="flex items-center gap-3">
      <span class="w-6 text-center font-display font-extrabold ${i<3?"":"text-on-surface-variant"}" style="${i<3?`color:${medals[i]}`:""}">${i+1}</span>
      ${renderAvatarCara(av, i, 36)}
      <span class="font-bold">${p.n}</span>
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
  const sorted = S.players.map((n,i)=>({n,s:S.scores[i],av:(S.avatars&&S.avatars[i])})).sort((a,b)=>b.s-a.s);
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
