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
  return `<div class="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
    <div class="floating-card absolute top-10 left-[5%] w-20 h-24 bg-primary-fixed rounded-xl border-2 border-primary-fixed-dim opacity-25" style="--rot:-12deg;"></div>
    <div class="floating-card absolute top-1/4 right-[8%] w-16 h-20 rounded-xl border-2 opacity-25" style="--rot:15deg;background:#c9f0ec;border-color:#17A2A2;animation-delay:-2s;"></div>
    <div class="floating-card absolute bottom-1/4 left-[12%] w-24 h-28 rounded-xl border-2 opacity-25" style="--rot:5deg;background:#fbd8e5;border-color:#D6336C;animation-delay:-4s;"></div>
    <div class="floating-card absolute top-2/3 right-[5%] w-20 h-24 rounded-xl border-2 opacity-25" style="--rot:-20deg;background:#fce4d6;border-color:#D9531E;animation-delay:-1s;"></div>
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

function probarMusica(btn){
  if(!FX.on) FX.toggle();
  if(!FX.music.on) FX.music.on = true;
  FX.music.para(); FX.music.arranca();
  if(btn){ btn.innerHTML = '<span class="material-symbols-outlined">graphic_eq</span> Sonando…'; }
  setTimeout(()=>{ FX.music.para(); render.settings(); }, 9000);
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

const APP_VER = "1.6";
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
        <span class="material-symbols-outlined msf">explore</span><span>Modo Aventura</span></button>
      <button onclick="go('setup')" class="w-full bg-cat-entret text-white py-4 rounded-2xl font-display font-extrabold text-2xl active-btn-press transition-all flex items-center justify-center gap-3" style="box-shadow:0 6px 0 0 #8f1f47;">
        <span class="material-symbols-outlined msf">groups</span><span>En grupo aquí</span></button>
      <button onclick="go('online')" class="w-full bg-cat-cultura text-white py-4 rounded-2xl font-display font-extrabold text-2xl active-btn-press transition-all flex items-center justify-center gap-3" style="box-shadow:0 6px 0 0 #0d6b6b;">
        <span class="material-symbols-outlined msf">travel_explore</span><span>En línea</span></button>
      <p class="text-center text-on-surface-variant text-sm -mt-1">Aventura = tú contra rivales legendarios · En grupo = hasta 8 en un celular · En línea = cada quien con el suyo</p>
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
      <div class="grid gap-3">
        <button onclick="switchSonido()" class="w-full py-3 px-4 rounded-xl font-bold border-2 flex items-center justify-between transition-all active:translate-y-1 ${FX.on?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">
          <span class="flex items-center gap-2"><span class="material-symbols-outlined">${FX.on?"volume_up":"volume_off"}</span> Efectos de sonido</span>
          <span class="text-sm">${FX.on?"Activados":"Silenciados"}</span></button>
        <button onclick="switchMusica()" class="w-full py-3 px-4 rounded-xl font-bold border-2 flex items-center justify-between transition-all active:translate-y-1 ${FX.music.on?"bg-cat-cultura text-white border-cat-cultura":"border-outline-variant text-on-surface-variant"}">
          <span class="flex items-center gap-2"><span class="material-symbols-outlined">${FX.music.on?"music_note":"music_off"}</span> Música de fondo</span>
          <span class="text-sm">${FX.music.on?"Activada":"Apagada"}</span></button>
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

render.solo = () => {
  if(S._bots===undefined) S._bots = 1;
  if(S._dif===undefined) S._dif = "normal";
  const difs = { facil:{n:"Fácil",d:"Se equivoca seguido",c:"#1E7A5F"}, normal:{n:"Normal",d:"Buen rival",c:"#DD9414"}, dificil:{n:"Difícil",d:"Casi nunca falla",c:"#D9531E"} };
  app.innerHTML = `${topBar({back:"go('home')"})}
  <main class="flex-1 px-5 py-6 pb-10 max-w-lg mx-auto w-full">
    <div class="text-center mb-5">
      <span class="material-symbols-outlined text-primary msf" style="font-size:44px;">explore</span>
      <h2 class="font-display font-bold text-2xl">Modo Aventura</h2>
      <p class="text-on-surface-variant">Enfréntate a rivales legendarios: solo preguntas, sin retos. Encadena aciertos y conquista el podio.</p>
    </div>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mb-4">
      <p class="font-bold mb-3">Tu nombre</p>
      <input id="soloName" placeholder="Tu nombre" value="${localStorage.getItem("tm_name")||""}" class="w-full border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary-container focus:ring-0"/>
    </div>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mb-4">
      <p class="font-bold mb-1">¿Cuántos rivales?</p>
      <p class="text-on-surface-variant text-sm mb-3">Marco Polo, Cleopatra y Da Vinci te esperan</p>
      <div class="grid grid-cols-3 gap-3">
        ${[1,2,3].map(n=>`<button onclick="S._bots=${n};render.solo()" class="py-3 rounded-xl font-display font-extrabold text-xl border-2 transition-all active:translate-y-1 ${S._bots===n?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">${n}</button>`).join("")}
      </div>
    </div>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mb-4">
      <p class="font-bold mb-3">Dificultad</p>
      <div class="grid gap-3">
        ${Object.entries(difs).map(([k,v])=>`<button onclick="S._dif='${k}';render.solo()" class="w-full py-3 px-4 rounded-xl font-bold border-2 text-left flex items-center justify-between transition-all active:translate-y-1 ${S._dif===k?"text-white border-transparent":"border-outline-variant text-on-surface-variant"}" style="${S._dif===k?`background:${v.c};`:""}">
          <span>${v.n}</span><span class="text-sm font-normal ${S._dif===k?"text-white/80":"text-on-surface-variant"}">${v.d}</span></button>`).join("")}
      </div>
    </div>
    <div class="bg-surface-container border-2 border-outline-variant rounded-2xl p-5 block-shadow-sm mb-6">
      <p class="font-bold mb-3">Preguntas por jugador</p>
      <div class="flex gap-3">
        ${[3,5,8,10].map(n=>`<button onclick="S.qPerPlayer=${n};render.solo()" class="flex-1 py-3 rounded-xl font-bold border-2 transition-all active:translate-y-1 ${S.qPerPlayer===n?"bg-primary-container text-white border-primary-container":"border-outline-variant text-on-surface-variant"}">${n}</button>`).join("")}
      </div>
    </div>
    <button onclick="startSolo()" class="w-full bg-primary-container text-white py-4 rounded-2xl font-display font-extrabold text-xl block-shadow-primary active-btn-press transition-all flex items-center justify-center gap-2">
      <span class="material-symbols-outlined">play_arrow</span> ¡Empezar!</button>
  </main>`;
};

const BOT_NAMES = ["Marco Polo","Cleopatra","Da Vinci"];
const BOT_ACC = { facil:0.45, normal:0.68, dificil:0.88 };

function startSolo(){
  const el = document.getElementById("soloName");
  const yo = (el && el.value.trim()) || "Tú";
  localStorage.setItem("tm_name", yo);
  S.players = [yo, ...BOT_NAMES.slice(0, S._bots)];
  S.modo = 'aventura';
  if(FX.on && FX.music.on) FX.music.arranca();
  S.bots = [false, ...Array(S._bots).fill(true)];
  S.scores = S.players.map(()=>0);
  S.fifty = S.players.map(()=>true);
  S.turn=0; S.qDone=0; S.streak=0; S.used=new Set();
  go("deck");
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
  if(FX.on && FX.music.on) FX.music.arranca();
  S.bots = S.players.map(()=>false);
  S.scores = S.players.map(()=>0);
  S.fifty  = S.players.map(()=>true);
  S.turn=0; S.qDone=0; S.streak=0; S.used=new Set();
  go("deck");
}

render.deck = () => {
  const avail = QS.map((_,i)=>i).filter(i=>!S.used.has(i));
  if(avail.length===0) return finishGame();
  let hand = [];
  const porCat = {};
  shuffle(avail.slice()).forEach(qi => { const c = QS[qi].c; if(!porCat[c]) porCat[c] = qi; });
  hand = shuffle(Object.values(porCat)).slice(0,4);
  if(hand.length < 4){
    const resto = shuffle(avail.filter(qi => !hand.includes(qi)));
    hand = hand.concat(resto.slice(0, 4 - hand.length));
  }
  const racha = S.streak >= 2 ? `<div class="streak-badge inline-flex items-center gap-1 bg-cat-deportes text-white font-display font-extrabold px-4 py-1.5 rounded-full text-lg mb-2" style="box-shadow:0 4px 0 0 #8f3512;">
      <span class="material-symbols-outlined msf" style="font-size:20px;">local_fire_department</span> ¡Racha x${S.streak}!</div>` : "";
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-6 pb-10 max-w-lg mx-auto w-full">
    <div class="text-center mb-4">
      ${racha}
      <p class="text-on-surface-variant font-bold text-sm uppercase tracking-wider">Partida en curso</p>
      <h2 class="font-display font-bold text-2xl">Turno de: <span class="text-primary-container">${S.players[S.turn]}</span></h2>
      <p class="text-on-surface-variant text-sm mt-1">Pregunta ${Math.floor(S.qDone/S.players.length)+1} de ${S.qPerPlayer}</p>
    </div>
    <div class="bg-surface-container-low border-2 border-outline-variant rounded-xl p-4 mb-5 text-center block-shadow-sm">
      <p class="text-on-surface-variant font-bold">${S.modo === "aventura" ? "Elige tu categoría y lánzala" : "¡Lanza tu carta al aire!"}</p>
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
      if(S.left<=0){ stopTimer(); S.modo === "aventura" ? showFallo(qi,true) : showReto(qi,true); }
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
    setTimeout(()=>{ S.modo === "aventura" ? showFallo(qi,false) : showReto(qi,false); }, 900);
  }
}

function showReto(qi,timeout){
  const q=QS[qi];
  S.streak = 0;
  if(S.modo === 'aventura') return showFallo(qi, timeout);
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

function showFallo(qi, timeout){
  const q = QS[qi], c = CATS[q.c];
  const mio = !isBot();
  if(timeout && mio){ FX.bad(); shakeScreen(); vibrate(120); }
  app.innerHTML = `${topBar({exit:true})}
  <main class="flex-1 px-5 py-10 max-w-lg mx-auto w-full flex flex-col items-center justify-center">
    <div class="bg-surface-container border-4 rounded-[28px] p-8 text-center w-full animate-pop" style="border-color:${c.color};box-shadow:0 8px 0 0 rgba(0,0,0,0.55);">
      <span class="material-symbols-outlined text-error msf" style="font-size:52px;">cancel</span>
      <h2 class="font-display font-extrabold text-2xl mt-2">${timeout?"¡Se acabó el tiempo!":(mio?"Fallaste":S.players[S.turn]+" falló")}</h2>
      <p class="text-on-surface-variant mt-3 mb-1">La respuesta correcta era</p>
      <p class="font-display font-extrabold text-2xl" style="color:${c.color}">${q.o[q.a]}</p>
      <p class="text-on-surface-variant text-sm mt-4">${mio?"Sin puntos en este turno. ¡A por la siguiente!":"Tu oportunidad de recortar distancia."}</p>
      <button onclick="nextTurn()" class="mt-6 w-full bg-primary-container text-white py-4 rounded-2xl font-bold text-lg block-shadow-primary active-btn-press transition-all">Siguiente turno</button>
    </div>
  </main>`;
  if(isBot()){ clearBot(); S.botTO = setTimeout(nextTurn, 2200); }
}

function retoOk(){
  S.scores[S.turn]+=5;
  FX.good(0); burstConfetti(25); flashPoints("+5","#DD9414"); vibrate(40);
  setTimeout(nextTurn, 600);
}

function nextTurn(){
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
