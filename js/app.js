/* ---------- CONQUISTA MUNDIAL ---------- */
const VER = "1.0";
const MAPA = "assets/mapa.webp?v=1";
const COMANDANTES = [
  { id:"vikingo", n:"El Jarl del Norte", t:"Vikingo", img:"assets/cmd-vikingo.webp", c:"#7FA8C9",
    lema:"Quien no teme al mar, no teme a nada." },
  { id:"samurai", n:"El Señor de la Guerra", t:"Samurái", img:"assets/cmd-samurai.webp", c:"#C0392B",
    lema:"La derrota es una lección; la rendición, jamás." }
];
const cmdPorId = id => COMANDANTES.find(c => c.id === id) || COMANDANTES[0];

const S = { pantalla:"carga", sel:null, batalla:null, timer:null, arrancado:false };
const app = document.getElementById("app");
const barajar = a => { for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const pararReloj = () => { if(S.timer){ clearInterval(S.timer); S.timer = null; } };

/* ---------- COMUNES ---------- */
function barra(opts){
  const o = opts || {};
  const izq = o.volver
    ? `<button onclick="${o.volver}" class="p-2 text-bruma active:translate-y-0.5" aria-label="Volver"><span class="material-symbols-outlined">arrow_back</span></button>`
    : `<span class="w-10"></span>`;
  const der = o.limpio ? `<span class="w-10"></span>`
    : `<button onclick="alternarSonido(this)" class="p-2 text-bruma active:translate-y-0.5" aria-label="Sonido"><span class="material-symbols-outlined">${FX.on?"volume_up":"volume_off"}</span></button>`;
  return `<header class="sticky top-0 z-40 bg-noche/95 border-b-2 border-hierro backdrop-blur">
    <div class="flex items-center justify-between h-14 px-3 max-w-3xl mx-auto">
      ${izq}
      <h1 class="font-titulo font-extrabold text-lg tracking-[0.18em] uppercase text-oro">Conquista</h1>
      ${der}
    </div></header>`;
}
function alternarSonido(btn){
  const on = FX.toggle();
  if(btn) btn.querySelector("span").textContent = on ? "volume_up" : "volume_off";
}
function pieNav(activo){
  const items = [["mapa","public","Mapa"],["imperio","fort","Imperio"],["rango","military_tech","Rangos"],["ajustes","settings","Ajustes"]];
  return `<nav class="fixed bottom-0 left-0 w-full z-40 bg-noche/95 border-t-2 border-hierro backdrop-blur pb-3 pt-1.5">
    <div class="flex justify-around max-w-3xl mx-auto">
      ${items.map(([id,ic,tx]) => `<button onclick="ir('${id}')" class="flex flex-col items-center px-4 py-1 ${activo===id?"text-oro":"text-bruma"} active:scale-95 transition-transform">
        <span class="material-symbols-outlined ${activo===id?"msf":""}">${ic}</span>
        <span class="text-[11px] font-bold tracking-wide">${tx}</span></button>`).join("")}
    </div></nav>`;
}
function ir(p){ pararReloj(); FX.pararMarcha(); S.pantalla = p; (P[p]||P.mapa)(); window.scrollTo(0,0); }
const P = {};

/* ---------- ARRANQUE ---------- */
P.carga = () => {
  app.innerHTML = `<main class="min-h-screen flex flex-col items-center justify-center px-6">
    <img src="assets/logo.webp" alt="" class="w-28 h-28 rounded-2xl mb-6 opacity-90"/>
    <p class="font-titulo font-extrabold text-2xl tracking-[0.2em] uppercase text-oro">Conquista</p>
    <p class="text-bruma mt-1">Mundial</p>
    <div class="mt-8 flex gap-1.5">
      ${[0,1,2].map(i=>`<span class="w-2.5 h-2.5 rounded-full bg-oro pulso" style="animation-delay:${i*0.16}s"></span>`).join("")}
    </div>
    <p id="cargaMsg" class="text-bruma text-sm mt-6">Desplegando el mundo…</p>
  </main>`;
};

window.alArrancar = async function(){
  if(S.arrancado) return;
  S.arrancado = true;
  P.carga();
  J.cargar();
  const m = await J.cargarMundo(true);
  if(m === null){
    const el = document.getElementById("cargaMsg");
    if(el) el.innerHTML = `Sin conexión con el mundo.<br><button onclick="location.reload()" class="mt-3 px-4 py-2 rounded-lg border-2 border-hierro text-hueso font-bold">Reintentar</button>`;
    return;
  }
  if(!J.yo) return ir("crear");
  if(J.misTerritorios().length === 0 && !J.yo.natal) return ir("natal");
  if(J.cronica.length) return ir("cronica");
  ir("mapa");
};

/* ---------- CREACIÓN ---------- */
P.crear = () => {
  if(!S.nuevo) S.nuevo = { paso:0, comandante:"vikingo", bandera:banderaAleatoria(), nombre:"" };
  const n = S.nuevo;
  if(n.paso === 0) return pasoComandante();
  if(n.paso === 1) return pasoBandera();
  return pasoNombre();
};

function pasoComandante(){
  const n = S.nuevo;
  app.innerHTML = `${barra({limpio:true})}
  <main class="max-w-3xl mx-auto px-4 py-6 pb-10">
    <p class="text-bruma text-xs font-bold tracking-[0.2em] uppercase text-center">Paso 1 de 3</p>
    <h2 class="font-titulo font-extrabold text-2xl text-center mt-1 mb-1">Elige tu comandante</h2>
    <p class="text-bruma text-center text-sm mb-5">Será el rostro que vean tus enemigos</p>
    <div class="grid gap-4 sm:grid-cols-2">
      ${COMANDANTES.map(c => `<button onclick="elegirComandante('${c.id}')" class="relative rounded-2xl overflow-hidden border-4 transition-all active:scale-[0.98] ${n.comandante===c.id?"border-oro":"border-hierro"}" style="aspect-ratio:3/4">
        <img src="${c.img}" alt="${c.n}" class="w-full h-full object-cover"/>
        <div class="absolute inset-x-0 bottom-0 p-3 text-left" style="background:linear-gradient(transparent,#05081Cef 55%)">
          <p class="font-titulo font-extrabold text-lg leading-tight">${c.n}</p>
          <p class="text-bruma text-sm">${c.t}</p>
          <p class="text-hueso/70 text-xs italic mt-1">«${c.lema}»</p>
        </div>
        ${n.comandante===c.id?`<span class="absolute top-3 right-3 w-8 h-8 rounded-full bg-oro flex items-center justify-center"><span class="material-symbols-outlined text-noche" style="font-size:20px">check</span></span>`:""}
      </button>`).join("")}
    </div>
    <button onclick="S.nuevo.paso=1;P.crear()" class="mt-6 w-full boton-oro py-4 rounded-xl font-titulo font-extrabold text-lg">Continuar</button>
  </main>`;
}
window.elegirComandante = id => { S.nuevo.comandante = id; FX.espadas(); P.crear(); };

function pasoBandera(){
  const n = S.nuevo;
  const b = n.bandera;
  const fila = (titulo, items, campo, render) => `
    <p class="text-bruma text-[11px] font-bold uppercase tracking-[0.15em] mt-4 mb-1.5">${titulo}</p>
    <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      ${items.map(it => `<button onclick="setBandera('${campo}','${it.id}')" class="flex-shrink-0 rounded-lg border-2 p-1 transition-all active:scale-90 ${b[campo]===it.id?"border-oro":"border-hierro"}" title="${it.n}">${render(it)}</button>`).join("")}
    </div>`;
  app.innerHTML = `${barra({volver:"S.nuevo.paso=0;P.crear()"})}
  <main class="max-w-3xl mx-auto px-4 py-5 pb-10">
    <p class="text-bruma text-xs font-bold tracking-[0.2em] uppercase text-center">Paso 2 de 3</p>
    <h2 class="font-titulo font-extrabold text-2xl text-center mt-1 mb-4">Alza tu estandarte</h2>
    <div class="flex justify-center mb-2">
      <div class="asta">${banderaSVG(b, 190)}</div>
    </div>
    <button onclick="dadoBandera()" class="mx-auto block px-4 py-2 rounded-lg border-2 border-hierro text-bruma font-bold text-sm active:translate-y-0.5">
      <span class="material-symbols-outlined align-middle" style="font-size:17px">casino</span> Al azar</button>
    ${fila("Emblema", EMBLEMAS, "emb", it => `<span style="display:block;width:44px;height:30px;">${banderaSVG({...b, emb:it.id}, 44)}</span>`)}
    ${fila("Diseño", DIVISIONES, "div", it => `<span style="display:block;width:44px;height:30px;">${banderaSVG({...b, div:it.id}, 44)}</span>`)}
    ${fila("Forma", Object.keys(FORMAS).map(k=>({id:k,n:FORMAS[k].n})), "forma", it => `<span style="display:block;width:44px;height:30px;">${banderaSVG({...b, forma:it.id}, 44)}</span>`)}
    ${fila("Color principal", COLORES.map(c=>({id:c,n:HERALDO[c].n})), "c1", it => `<span style="display:block;width:30px;height:30px;border-radius:6px;background:${HERALDO[it.id].c}"></span>`)}
    ${fila("Color secundario", COLORES.map(c=>({id:c,n:HERALDO[c].n})), "c2", it => `<span style="display:block;width:30px;height:30px;border-radius:6px;background:${HERALDO[it.id].c}"></span>`)}
    ${fila("Color del emblema", COLORES.map(c=>({id:c,n:HERALDO[c].n})), "ec", it => `<span style="display:block;width:30px;height:30px;border-radius:6px;background:${HERALDO[it.id].c}"></span>`)}
    <button onclick="S.nuevo.paso=2;P.crear()" class="mt-6 w-full boton-oro py-4 rounded-xl font-titulo font-extrabold text-lg">Continuar</button>
  </main>`;
}
window.setBandera = (campo, v) => { S.nuevo.bandera[campo] = v; FX.tono(760,0.04,"triangle",0.06); P.crear(); };
window.dadoBandera = () => { S.nuevo.bandera = banderaAleatoria(); FX.bandera(); P.crear(); };

function pasoNombre(){
  const n = S.nuevo;
  const c = cmdPorId(n.comandante);
  app.innerHTML = `${barra({volver:"S.nuevo.paso=1;P.crear()"})}
  <main class="max-w-lg mx-auto px-4 py-6 pb-10">
    <p class="text-bruma text-xs font-bold tracking-[0.2em] uppercase text-center">Paso 3 de 3</p>
    <h2 class="font-titulo font-extrabold text-2xl text-center mt-1 mb-5">¿Cómo te llamarán?</h2>
    <div class="panel p-5">
      <div class="flex items-center gap-4 mb-5">
        <img src="${c.img}" alt="" class="w-16 h-20 object-cover rounded-lg border-2 border-hierro"/>
        <div class="asta">${banderaSVG(n.bandera, 96)}</div>
      </div>
      <input id="nomJugador" maxlength="16" placeholder="Tu nombre de guerra" value="${(n.nombre||"").replace(/"/g,"&quot;")}" class="w-full campo px-4 py-3 rounded-xl text-lg font-bold"/>
      <p class="text-bruma text-xs mt-2">Así aparecerás en los territorios que conquistes.</p>
    </div>
    <button onclick="fundarImperio()" class="mt-6 w-full boton-oro py-4 rounded-xl font-titulo font-extrabold text-lg">Fundar mi imperio</button>
    <p id="errNom" class="text-carmesi text-center font-bold mt-3"></p>
  </main>`;
}
window.fundarImperio = () => {
  const el = document.getElementById("nomJugador");
  const nombre = (el && el.value.trim()) || "";
  if(nombre.length < 2){ const e = document.getElementById("errNom"); if(e) e.textContent = "Escribe un nombre."; return; }
  J.crear(nombre, S.nuevo.bandera, S.nuevo.comandante, null);
  FX.cuerno();
  ir("natal");
};

/* ---------- TIERRA NATAL ---------- */
P.natal = () => {
  app.innerHTML = `${barra({limpio:true})}
  <main class="max-w-3xl mx-auto pb-28">
    <div class="px-4 pt-5 text-center">
      <h2 class="font-titulo font-extrabold text-2xl">Elige tu tierra natal</h2>
      <p class="text-bruma text-sm mt-1">Desde aquí comenzará tu expansión. Elige bien: solo podrás atacar territorios vecinos.</p>
    </div>
    ${herramientasMapa()}
    <div id="lienzo" class="mt-3 overflow-x-auto"><div id="contMapa" style="min-width:${anchoMapa()}px">${mapaSVG({natal:true})}</div></div>
  </main>`;
  centrar(760);
};

/* ---------- MAPA ---------- */
function mapaSVG(opts){
  const o = opts || {};
  const mios = new Set(J.misTerritorios().map(t => t.id));
  const alcance = o.natal ? null : J.alcanzables();
  const verNombres = S.nombres !== false;

  const lineas = RUTAS.map(r => {
    const a = territorio(r.a), b = territorio(r.b);
    const dash = r.c === 1 ? "6 5" : (r.c === 2 ? "3 8" : "2 10");
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#5B6B8C" stroke-width="${r.c===1?2:1.4}" stroke-dasharray="${dash}" opacity="${r.c===1?0.45:0.28}"/>`;
  }).join("");

  const marcas = TERRITORIOS.map(t => {
    const d = J.duenoDe(t.id);
    const conDueno = !!(d && d.cod);
    const mio = mios.has(t.id);
    const g = J.guarnicion(t.id);
    const puede = o.natal ? true : (alcance && alcance.has(t.id));
    const destac = o.destacado === t.id;
    const w = t.v === 3 ? 34 : (t.v === 2 ? 30 : 26);
    const h = Math.round(w * 1.18);

    let escudo;
    if(conDueno){
      const borde = mio ? "#E5B54A" : "#0B1020";
      escudo = `<g transform="translate(${-w/2},${-h/2})">${escudoSVG(d.jb, w, { borde, grosor: mio ? 4 : 3 })}</g>`;
    } else {
      escudo = `<g transform="translate(${-w/2},${-h/2})">
        <svg viewBox="0 0 50 62" width="${w}" height="${h}">
          <path d="M2 2 L48 2 L48 32 C48 48 34 56 25 60 C16 56 2 48 2 32 Z" fill="#161D30" stroke="#3E4A68" stroke-width="3"/>
          <text x="25" y="34" text-anchor="middle" font-size="22" font-weight="800" fill="#5E6A87">?</text>
        </svg></g>`;
    }

    const halo = destac
      ? `<circle r="${w*0.95}" fill="${mio?"#E5B54A":"#C0392B"}" opacity="0.22">
           <animate attributeName="r" values="${w*0.75};${w*1.15};${w*0.75}" dur="1.5s" repeatCount="indefinite"/>
           <animate attributeName="opacity" values="0.3;0.05;0.3" dur="1.5s" repeatCount="indefinite"/></circle>`
      : (puede && !o.natal && !mio
        ? `<circle r="${w*0.82}" fill="none" stroke="#C0392B" stroke-width="2" stroke-dasharray="4 4" opacity="0.75"/>` : "");

    const cifra = `<g transform="translate(0,${h/2 - 2})">
      <rect x="-15" y="-9" width="30" height="17" rx="8.5" fill="#05081C" stroke="${mio?"#E5B54A":(conDueno?"#7C2F26":"#3E4A68")}" stroke-width="2"/>
      <text y="4" text-anchor="middle" font-size="12" font-weight="800" fill="${mio?"#E5B54A":"#E4E8F2"}">${g}</text></g>`;

    const nombre = verNombres || destac || mio
      ? `<text y="${h/2 + 24}" text-anchor="middle" font-size="11.5" font-weight="700" fill="${mio?"#E5B54A":"#C7CEDF"}" style="paint-order:stroke;stroke:#05081C;stroke-width:5;stroke-linejoin:round">${t.n}</text>` : "";

    return `<g transform="translate(${t.x},${t.y})" style="cursor:pointer" onclick="tocarTerritorio('${t.id}')" role="button" aria-label="${t.n}">
      ${halo}${escudo}${cifra}${nombre}</g>`;
  }).join("");

  return `<svg id="svgMapa" viewBox="0 0 1600 800" width="1600" height="800" role="img" aria-label="Mapa del mundo">
    <image href="${MAPA}" x="0" y="0" width="1600" height="800" preserveAspectRatio="none" opacity="0.9"/>
    <g>${lineas}</g>${marcas}
  </svg>`;
}

function centrar(x){
  const w = document.getElementById("lienzo");
  if(!w) return;
  const k = anchoMapa() / 1600;
  w.scrollLeft = Math.max(0, x * k - w.clientWidth/2);
}

const ZOOMS = [1, 1.4, 1.9, 2.5];
function anchoMapa(){ return Math.round(1600 * (ZOOMS[S.zoom || 0])); }
window.cambiarZoom = function(dir){
  const z = (S.zoom || 0) + dir;
  if(z < 0 || z >= ZOOMS.length) return;
  const w = document.getElementById("lienzo");
  const centro = w ? (w.scrollLeft + w.clientWidth/2) / anchoMapa() : 0.5;
  S.zoom = z;
  const cont = document.getElementById("contMapa");
  if(cont) cont.style.minWidth = anchoMapa() + "px";
  const btn = document.getElementById("zoomLbl");
  if(btn) btn.textContent = Math.round(ZOOMS[z]*100) + "%";
  if(w) w.scrollLeft = centro * anchoMapa() - w.clientWidth/2;
  FX.tono(620,0.05,"triangle",0.06);
};
window.alternarNombres = function(btn){
  S.nombres = S.nombres === false;
  const svg = document.getElementById("svgMapa");
  if(svg) svg.outerHTML = mapaSVG({ destacado: S.sel && S.sel.id, natal: S.pantalla === "natal" });
  if(btn) btn.classList.toggle("borde-oro", S.nombres !== false);
};
function herramientasMapa(){
  return `<div class="flex items-center justify-center gap-2 mt-2">
    <button onclick="cambiarZoom(-1)" class="w-9 h-9 rounded-lg border-2 border-hierro text-hueso active:translate-y-0.5"><span class="material-symbols-outlined" style="font-size:18px">remove</span></button>
    <span id="zoomLbl" class="text-bruma text-xs font-bold w-12 text-center">${Math.round(ZOOMS[S.zoom||0]*100)}%</span>
    <button onclick="cambiarZoom(1)" class="w-9 h-9 rounded-lg border-2 border-hierro text-hueso active:translate-y-0.5"><span class="material-symbols-outlined" style="font-size:18px">add</span></button>
    <button onclick="alternarNombres(this)" class="ml-2 px-3 h-9 rounded-lg border-2 ${S.nombres!==false?"borde-oro text-oro":"border-hierro text-bruma"} font-bold text-xs active:translate-y-0.5">
      <span class="material-symbols-outlined align-middle" style="font-size:16px">label</span> Nombres</button>
  </div>`;
}

P.mapa = () => {
  const mios = J.misTerritorios();
  app.innerHTML = `${barra()}
  <main class="max-w-3xl mx-auto pb-28">
    <div class="flex items-center justify-center gap-2 px-4 pt-3 flex-wrap">
      <span class="pastilla"><span class="material-symbols-outlined text-oro" style="font-size:15px">flag</span>${mios.length} territorios</span>
      <span class="pastilla"><span class="material-symbols-outlined text-carmesi" style="font-size:15px">swords</span>${J.ataquesRestantes()} ataques hoy</span>
      <span class="pastilla"><span class="material-symbols-outlined text-bruma" style="font-size:15px">shield</span>${J.fronterasAbiertas()} frentes</span>
    </div>
    ${herramientasMapa()}
    <div id="lienzo" class="mt-2 overflow-x-auto"><div id="contMapa" style="min-width:${anchoMapa()}px">${mapaSVG({})}</div></div>
  </main>${pieNav("mapa")}`;
  centrar(mios.length ? mios[0].x : 760);

};

window.tocarTerritorio = function(id){
  const t = territorio(id);
  S.sel = { id, objetivo: J.guarnicion(id), mio: J.esMio(id) };
  const svg = document.getElementById("svgMapa");
  if(svg) svg.outerHTML = mapaSVG({ destacado:id, natal: S.pantalla === "natal" });
  const w = document.getElementById("lienzo");
  if(w){ const k = anchoMapa()/1600; w.scrollTo({ left: Math.max(0, t.x*k - w.clientWidth/2), behavior:"smooth" }); }
  abrirCarta(id);
};

window.cerrarCarta = function(){
  const m = document.getElementById("cartaTerr");
  if(m){ m.classList.add("sale"); setTimeout(()=>m.remove(), 200); }
};

function abrirCarta(id){
  const previa = document.getElementById("cartaTerr");
  if(previa) previa.remove();
  const t = territorio(id);
  const d = J.duenoDe(id);
  const conDueno = !!(d && d.cod);
  const g = J.guarnicion(id);
  const mio = J.esMio(id);
  const eligiendo = S.pantalla === "natal";
  const puede = J.puedeAtacar(id);
  const ruta = eligiendo ? null : J.rutaDeAtaque(id);
  const sinAtaques = J.ataquesRestantes() <= 0;
  const cmd = conDueno && d.jc ? cmdPorId(d.jc) : null;
  const vecinos = [...VECINOS[id]];
  const amenazas = vecinos.filter(v => J.esMio(v)).length;
  const color = mio ? "#E5B54A" : (conDueno ? "#C0392B" : "#4A5878");

  let accion;
  if(eligiendo){
    accion = `<button onclick="fijarNatal('${id}')" class="w-full boton-oro py-3.5 rounded-xl font-titulo font-extrabold text-lg">
      <span class="material-symbols-outlined align-middle">flag</span> Nacer aquí</button>`;
  } else if(mio){
    accion = `<button onclick="cerrarCarta();prepararAtaque('${id}')" ${sinAtaques?"disabled":""} class="w-full ${sinAtaques?"boton-muerto":"boton-hierro"} py-3.5 rounded-xl font-titulo font-extrabold text-lg">
      <span class="material-symbols-outlined align-middle">shield</span> ${sinAtaques?"Sin ataques hoy":"Reforzar plaza"}</button>`;
  } else if(!puede){
    accion = `<div class="rounded-xl border-2 border-hierro p-3 text-center">
      <p class="text-bruma text-sm font-bold"><span class="material-symbols-outlined align-middle" style="font-size:17px">block</span> Fuera de tu alcance</p>
      <p class="text-bruma/70 text-xs mt-1">Conquista antes un territorio vecino.</p></div>`;
  } else {
    accion = `<button onclick="cerrarCarta();prepararAtaque('${id}')" ${sinAtaques?"disabled":""} class="w-full ${sinAtaques?"boton-muerto":"boton-sangre"} py-3.5 rounded-xl font-titulo font-extrabold text-lg">
      <span class="material-symbols-outlined align-middle">${ruta&&ruta.tipo==="mar"?"sailing":"swords"}</span> ${sinAtaques?"Sin ataques hoy":"Atacar"}</button>`;
  }

  const m = document.createElement("div");
  m.id = "cartaTerr";
  m.className = "velo";
  m.innerHTML = `<div class="carta entra" style="border-color:${color}">
    <button onclick="cerrarCarta()" class="absolute top-2 right-2 z-20 w-9 h-9 rounded-full bg-noche/80 border border-hierro flex items-center justify-center" aria-label="Cerrar">
      <span class="material-symbols-outlined text-bruma" style="font-size:19px">close</span></button>

    <div class="carta-arte">
      ${cmd ? `<img src="${cmd.img}" alt="" class="w-full h-full object-cover object-top"/>`
            : `<div class="w-full h-full flex items-center justify-center" style="background:radial-gradient(circle at 50% 32%, #232B42, #05081C)">
                 <span class="material-symbols-outlined text-bruma" style="font-size:70px">castle</span></div>`}
      <div class="carta-velo"></div>
      <div class="absolute inset-x-0 top-0 p-3 flex items-start justify-between">
        <span class="pastilla" style="border-color:${REGIONES[t.r].c}"><span class="w-2 h-2 rounded-full" style="background:${REGIONES[t.r].c}"></span>${REGIONES[t.r].n}</span>
      </div>
      <div class="absolute inset-x-0 bottom-0 p-4">
        <p class="text-bruma text-[10px] font-bold uppercase tracking-[0.2em]">${["","Aldea","Provincia","Gran plaza"][t.v]}</p>
        <h3 class="font-titulo font-extrabold text-3xl leading-none mt-0.5">${t.n}</h3>
        <div class="flex items-end gap-3 mt-3">
          ${conDueno ? `<div class="asta-mini flex-shrink-0">${banderaSVG(d.jb, 76)}</div>` : ""}
          <div class="flex-1 min-w-0">
            <p class="text-bruma text-[10px] font-bold uppercase tracking-[0.18em]">${mio?"Tu dominio":(conDueno?"Domina":"Sin dueño")}</p>
            <p class="font-titulo font-extrabold text-lg leading-tight truncate ${mio?"text-oro":""}">${conDueno?d.jn:"Guarnición local"}</p>
            ${cmd?`<p class="text-bruma text-xs">${cmd.t}</p>`:""}
          </div>
        </div>
      </div>
    </div>

    <div class="p-4">
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="caja"><p class="text-bruma text-[9px] uppercase tracking-wider">Defensa</p><p class="font-titulo font-extrabold text-xl" style="color:${color}">${g}</p></div>
        <div class="caja"><p class="text-bruma text-[9px] uppercase tracking-wider">Fronteras</p><p class="font-titulo font-extrabold text-xl">${vecinos.length}</p></div>
        <div class="caja"><p class="text-bruma text-[9px] uppercase tracking-wider">Tuyas</p><p class="font-titulo font-extrabold text-xl ${amenazas?"text-oro":"text-bruma"}">${amenazas}</p></div>
      </div>
      ${!eligiendo && ruta ? `<p class="text-center text-xs mb-3 ${ruta.tipo==="mar"?"text-oro":"text-bruma"}">
        <span class="material-symbols-outlined align-middle" style="font-size:15px">${ruta.tipo==="mar"?"sailing":"landscape"}</span>
        ${ruta.tipo==="mar"?"Travesía · "+ruta.ruta.n:"Por tierra desde "+territorio(ruta.desde).n}</p>` : ""}
      ${accion}
    </div>
  </div>`;
  m.onclick = ev => { if(ev.target === m) cerrarCarta(); };
  document.body.appendChild(m);
  FX.tono(700, 0.05, "triangle", 0.07);
}

window.fijarNatal = async function(id){
  const t = territorio(id);
  const btn = event && event.target;
  if(btn) btn.disabled = true;
  cerrarCarta();
  J.yo.natal = id; J.guardar();
  const ok = await J.reclamarNatal(id);
  if(!ok){ if(btn) btn.disabled = false; return alert("No se pudo reclamar el territorio. Revisa tu conexión."); }
  FX.trompetas(); chispas(60); vibrar([50,40,80]);
  grito("¡" + t.n + " es tuyo!", "#E5B54A");
  setTimeout(()=>ir("mapa"), 900);
};

/* ---------- DESEMBARCO ---------- */
window.prepararAtaque = function(id){
  if(J.ataquesRestantes() <= 0) return;
  const t = territorio(id);
  const d = J.duenoDe(id);
  const g = J.guarnicion(id);
  const mio = J.esMio(id);
  const ruta = J.rutaDeAtaque(id);
  const porMar = ruta && ruta.tipo === "mar";
  const cmd = d && d.jc ? cmdPorId(d.jc) : null;

  S.sel = { id, objetivo: g, mio };
  FX.musica.para();
  FX.marcha(58);

  app.innerHTML = `${barra({volver:"ir('mapa')"})}
  <main class="max-w-lg mx-auto px-4 py-5 pb-10">
    <p class="text-center text-bruma text-xs font-bold uppercase tracking-[0.22em]">${mio ? "Refuerzo" : (porMar ? "Travesía · " + ruta.ruta.n : "Invasión")}</p>
    <h2 class="font-titulo font-extrabold text-3xl text-center mt-1 mb-1">${t.n}</h2>
    <p class="text-center text-bruma text-sm mb-4">${REGIONES[t.r].n}</p>

    <div class="estandarte aparece">
      ${cmd ? `<img src="${cmd.img}" alt="" class="w-full h-full object-cover"/>` : `<div class="w-full h-full flex items-center justify-center" style="background:radial-gradient(circle at 50% 35%, #2A3348, #05081C)"><span class="material-symbols-outlined text-bruma" style="font-size:64px">castle</span></div>`}
      <div class="absolute inset-0" style="background:linear-gradient(transparent 45%, #05081Cf5 92%)"></div>
      <div class="absolute inset-x-0 bottom-0 p-4">
        <div class="flex items-end gap-3">
          ${d && d.jb ? `<div class="asta-mini flex-shrink-0">${banderaSVG(d.jb, 68)}</div>` : ""}
          <div class="flex-1 min-w-0">
            <p class="text-bruma text-[10px] font-bold uppercase tracking-[0.18em]">${mio ? "Tu guarnición" : (d && d.cod ? "Defiende" : "Resistencia local")}</p>
            <p class="font-titulo font-extrabold text-xl leading-tight truncate">${d && d.cod ? d.jn : "Guarnición local"}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-bruma text-[10px] font-bold uppercase tracking-wider">Defensa</p>
            <p class="font-titulo font-extrabold text-3xl text-carmesi">${g}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="panel p-4 mt-4">
      <p class="text-center text-hueso">${mio
        ? `Vuelve a jugar para elevar la defensa de ${t.n}. Solo cuenta si superas <span class="font-bold text-oro">${g}</span>.`
        : `Necesitas más de <span class="font-bold text-carmesi">${g}</span> puntos en ${REGLAS.ASALTOS} asaltos.`}</p>
      <p class="text-center text-bruma text-xs mt-2">${REGLAS.SEGUNDOS} segundos por asalto · responde rápido para golpear más fuerte</p>
    </div>

    <button onclick="iniciarBatalla('${id}')" class="mt-5 w-full ${mio?"boton-hierro":"boton-sangre"} py-4 rounded-xl font-titulo font-extrabold text-xl late">
      <span class="material-symbols-outlined align-middle">${porMar?"sailing":"swords"}</span> ${mio ? "Reforzar" : (porMar ? "Desembarcar" : "Cargar")}</button>
    <button onclick="ir('mapa')" class="mt-3 w-full py-3 rounded-xl border-2 border-hierro text-bruma font-bold">Retirarse</button>
  </main>`;
};

/* ---------- BATALLA ---------- */
window.iniciarBatalla = function(id){
  J.gastarAtaque();
  const usadas = new Set();
  const cats = barajar(Object.keys(CATS));
  const preguntas = [];
  cats.forEach(c => {
    if(preguntas.length >= REGLAS.ASALTOS) return;
    const pool = QS.map((q,i)=>({q,i})).filter(x => x.q.c === c && !usadas.has(x.i));
    if(pool.length){ const p = pool[Math.floor(Math.random()*pool.length)]; preguntas.push(p.i); usadas.add(p.i); }
  });
  while(preguntas.length < REGLAS.ASALTOS){
    const r = Math.floor(Math.random()*QS.length);
    if(!usadas.has(r)){ preguntas.push(r); usadas.add(r); }
  }
  S.batalla = { id, objetivo: S.sel.objetivo, mio: S.sel.mio, preguntas, idx:0, puntos:0, aciertos:0, maximo: 0 };
  S.batalla.maximo = REGLAS.ASALTOS * 30;
  FX.pararMarcha();
  FX.cuerno();
  setTimeout(asalto, 700);
};

function asalto(){
  const b = S.batalla;
  if(b.idx >= b.preguntas.length) return desenlace();
  const qi = b.preguntas[b.idx];
  const q = QS[qi], cat = CATS[q.c];
  b.left = REGLAS.SEGUNDOS;
  FX.marcha(64 + b.idx * 12);

  const pct = Math.max(6, Math.min(94, 50 + (b.puntos - b.objetivo * (b.idx / REGLAS.ASALTOS)) / (b.maximo/2) * 50));
  app.innerHTML = `${barra({limpio:true})}
  <main class="max-w-lg mx-auto px-4 py-3 pb-8">
    <div class="flex items-center justify-between text-xs font-bold mb-1.5">
      <span class="text-oro">TÚ · ${b.puntos}</span>
      <span class="text-bruma">Asalto ${b.idx+1} de ${REGLAS.ASALTOS}</span>
      <span class="text-carmesi">${b.objetivo} · MURALLA</span>
    </div>
    <div class="barra-guerra mb-3"><div id="frente" class="frente" style="width:${pct}%"></div></div>

    <div class="flex justify-center mb-2">
      <div class="reloj-guerra">
        <svg viewBox="0 0 100 100" class="-rotate-90 w-full h-full">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#232B42" stroke-width="9"/>
          <circle id="aro" cx="50" cy="50" r="42" fill="none" stroke="${cat.c}" stroke-width="9" stroke-linecap="round" stroke-dasharray="263.9" stroke-dashoffset="0"/>
        </svg>
        <span id="cuenta" class="absolute inset-0 flex items-center justify-center font-titulo font-extrabold text-2xl">${b.left}</span>
      </div>
    </div>

    <div class="panel p-4 aparece" style="border-color:${cat.c}">
      <p class="text-center text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style="color:${cat.c}">${q.c}</p>
      <p class="font-titulo font-bold text-lg text-center mb-4">${q.q}</p>
      <div class="grid gap-2.5" id="opciones">
        ${q.o.map((o,j)=>`<button onclick="responder(${j},${qi})" class="opcion">${o}</button>`).join("")}
      </div>
    </div>
  </main>`;

  pararReloj();
  S.timer = setInterval(()=>{
    b.left--;
    const c = document.getElementById("cuenta"), a = document.getElementById("aro");
    if(c){ c.textContent = b.left; if(b.left<=4) c.classList.add("text-carmesi"); }
    if(a){ a.style.strokeDashoffset = 263.9*(1 - b.left/REGLAS.SEGUNDOS); if(b.left<=4) a.setAttribute("stroke","#C0392B"); }
    if(b.left<=4 && b.left>0) FX.alarma();
    if(b.left<=0){ pararReloj(); responder(-1, qi); }
  }, 1000);
}

window.responder = function(j, qi){
  pararReloj();
  const b = S.batalla, q = QS[qi], cat = CATS[q.c];
  const btns = document.querySelectorAll("#opciones button");
  btns.forEach(x => x.style.pointerEvents = "none");
  const bien = j === q.a;

  if(bien){
    const base = cat.x2 ? 22 : 14;
    const veloz = Math.round(16 * (b.left / REGLAS.SEGUNDOS));
    const pts = base + veloz;
    b.puntos += pts; b.aciertos++;
    if(btns[j]) btns[j].classList.add("acierta");
    FX.acierto(); FX.espadas(); vibrar(25);
    grito("+" + pts, "#6BD6A6");
  } else {
    if(j >= 0 && btns[j]) btns[j].classList.add("falla");
    if(btns[q.a]) btns[q.a].classList.add("acierta");
    FX.fallo(); FX.golpe(0.4); temblor(1); vibrar([70,50,70]);
  }
  const pct = Math.max(6, Math.min(94, 50 + (b.puntos - b.objetivo * ((b.idx+1) / REGLAS.ASALTOS)) / (b.maximo/2) * 50));
  const f = document.getElementById("frente");
  if(f) f.style.width = pct + "%";
  b.idx++;
  setTimeout(asalto, 1150);
};

/* ---------- DESENLACE ---------- */
async function desenlace(){
  pararReloj(); FX.pararMarcha();
  const b = S.batalla;
  const t = territorio(b.id);
  const res = await J.resolver(b.id, b.puntos);
  const gana = res.gana;

  if(gana){ FX.trompetas(); chispas(80); vibrar([60,40,60,40,120]); }
  else { FX.derrumbe(); temblor(2); vibrar(180); }

  const cmdMio = cmdPorId(J.yo.comandante);
  app.innerHTML = `${barra({limpio:true})}
  <main class="max-w-lg mx-auto px-4 py-6 pb-28">
    <div class="panel p-6 text-center aparece" style="border-color:${gana?"#E5B54A":"#C0392B"}">
      <span class="material-symbols-outlined msf" style="font-size:56px;color:${gana?"#E5B54A":"#C0392B"}">${gana?"military_tech":"shield_with_heart"}</span>
      <h2 class="font-titulo font-extrabold text-2xl mt-2">${gana ? (res.mio ? "Plaza reforzada" : "¡" + t.n + " ha caído!") : "El asedio fracasó"}</h2>
      <p class="text-bruma mt-1">${gana
        ? (res.mio ? "Tu guarnición resistirá mejor el próximo asalto." : `${t.n} ondea tu estandarte`)
        : `La muralla resistió, pero quedó dañada`}</p>

      ${gana && !res.mio ? `<div class="flex justify-center my-4"><div class="asta">${banderaSVG(J.yo.bandera, 130)}</div></div>` : ""}

      <div class="grid grid-cols-3 gap-2 mt-5 text-center">
        <div class="caja"><p class="text-bruma text-[10px] uppercase tracking-wider">Tu ataque</p><p class="font-titulo font-extrabold text-xl text-oro">${b.puntos}</p></div>
        <div class="caja"><p class="text-bruma text-[10px] uppercase tracking-wider">Muralla</p><p class="font-titulo font-extrabold text-xl">${res.antes}</p></div>
        <div class="caja"><p class="text-bruma text-[10px] uppercase tracking-wider">Ahora</p><p class="font-titulo font-extrabold text-xl ${gana?"text-oro":"text-carmesi"}">${res.nueva}</p></div>
      </div>
      <p class="text-bruma text-sm mt-3">${b.aciertos} de ${REGLAS.ASALTOS} asaltos ganados</p>
      ${!gana ? `<p class="text-hueso text-sm mt-3 italic">«${cmdMio.lema}»</p>` : ""}

      <div class="grid gap-2.5 mt-6">
        ${J.ataquesRestantes()>0 ? `<button onclick="prepararAtaque('${b.id}')" class="w-full ${gana?"boton-hierro":"boton-sangre"} py-3.5 rounded-xl font-titulo font-extrabold">
          <span class="material-symbols-outlined align-middle">replay</span> ${gana?"Reforzar":"Atacar de nuevo"} (${J.ataquesRestantes()})</button>` : ""}
        <button onclick="ir('mapa')" class="w-full py-3.5 rounded-xl border-2 border-hierro text-hueso font-bold">Volver al mapa</button>
      </div>
    </div>
  </main>`;
}

/* ---------- CRÓNICA ---------- */
P.cronica = () => {
  const n = J.cronica;
  FX.golpe(0.35);
  app.innerHTML = `${barra({limpio:true})}
  <main class="max-w-lg mx-auto px-4 py-8 pb-28">
    <p class="text-center text-bruma text-xs font-bold uppercase tracking-[0.22em]">Crónica de guerra</p>
    <h2 class="font-titulo font-extrabold text-2xl text-center mt-1 mb-5">Mientras no estabas…</h2>
    <div class="grid gap-3">
      ${n.map(x => {
        const t = territorio(x.id);
        return `<div class="panel p-4 flex items-center gap-3 aparece" style="border-color:#C0392B">
          <span class="flex-shrink-0">${x.bandera?escudoSVG(x.bandera,34,{borde:"#C0392B",grosor:3}):""}</span>
          <div class="flex-1 min-w-0">
            <p class="font-bold"><span class="text-carmesi">${x.quien}</span> te arrebató</p>
            <p class="font-titulo font-extrabold text-lg leading-tight">${t?t.n:x.id}</p>
          </div>
          <button onclick="prepararAtaque('${x.id}')" class="boton-sangre px-4 py-2.5 rounded-lg font-bold text-sm flex-shrink-0">Recuperar</button>
        </div>`;
      }).join("")}
    </div>
    <button onclick="ir('mapa')" class="mt-6 w-full py-3.5 rounded-xl border-2 border-hierro text-hueso font-bold">Ver el mapa</button>
  </main>`;
};

/* ---------- IMPERIO ---------- */
P.imperio = () => {
  const mios = J.misTerritorios();
  const fuerza = mios.reduce((a,t)=>a+J.guarnicion(t.id), 0);
  const c = cmdPorId(J.yo.comandante);
  const emb = EMBLEMAS.find(e => e.id === J.yo.bandera.emb);
  app.innerHTML = `${barra()}
  <main class="max-w-lg mx-auto px-4 py-5 pb-28">

    <div class="carta-comandante entra">
      <div class="carta-arte-grande">
        <img src="${c.img}" alt="${c.n}" class="w-full h-full object-cover"/>
        <div class="carta-velo"></div>
        <div class="absolute top-3 left-3 asta-mini">${banderaSVG(J.yo.bandera, 84)}</div>
        <div class="absolute inset-x-0 bottom-0 p-4">
          <p class="text-bruma text-[10px] font-bold uppercase tracking-[0.22em]">${c.t} · ${emb?emb.n:""}</p>
          <h2 class="font-titulo font-extrabold text-3xl leading-none mt-1">${J.yo.nombre}</h2>
          <p class="text-hueso/60 text-xs italic mt-1.5">«${c.lema}»</p>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 p-4">
        <div class="caja"><p class="text-bruma text-[9px] uppercase tracking-wider">Territorios</p><p class="font-titulo font-extrabold text-2xl text-oro">${mios.length}</p></div>
        <div class="caja"><p class="text-bruma text-[9px] uppercase tracking-wider">Fuerza</p><p class="font-titulo font-extrabold text-2xl">${fuerza}</p></div>
        <div class="caja"><p class="text-bruma text-[9px] uppercase tracking-wider">Frentes</p><p class="font-titulo font-extrabold text-2xl text-carmesi">${J.fronterasAbiertas()}</p></div>
      </div>
    </div>

    ${mios.length ? `<p class="text-bruma text-xs font-bold uppercase tracking-[0.18em] mt-5 mb-2">Tus dominios</p>
    <div class="grid gap-2">
      ${mios.slice().sort((a,b)=>J.guarnicion(b.id)-J.guarnicion(a.id)).map(t=>{
        const g = J.guarnicion(t.id);
        const amenaza = [...VECINOS[t.id]].filter(v=>!J.esMio(v)).length;
        return `<button onclick="ir('mapa');setTimeout(()=>tocarTerritorio('${t.id}'),200)" class="panel p-3 flex items-center gap-3 text-left active:translate-y-0.5">
          <span class="flex-shrink-0">${escudoSVG(J.yo.bandera, 26, {borde:"#E5B54A",grosor:3})}</span>
          <div class="flex-1 min-w-0">
            <p class="font-bold truncate">${t.n}</p>
            <p class="text-bruma text-xs">${REGIONES[t.r].n} · ${amenaza} frontera${amenaza===1?"":"s"} expuesta${amenaza===1?"":"s"}</p>
          </div>
          <span class="font-titulo font-extrabold text-lg ${g<25?"text-carmesi":"text-oro"}">${g}</span>
        </button>`;
      }).join("")}
    </div>` : `<div class="panel p-6 text-center mt-5">
      <p class="text-bruma">Aún no dominas ningún territorio.</p>
      <button onclick="ir('mapa')" class="mt-3 boton-oro px-5 py-2.5 rounded-lg font-bold">Ir al mapa</button></div>`}
  </main>${pieNav("imperio")}`;
};

/* ---------- RANGOS ---------- */
P.rango = () => {
  const lista = J.imperios();
  app.innerHTML = `${barra()}
  <main class="max-w-lg mx-auto px-4 py-5 pb-28">
    <h2 class="font-titulo font-extrabold text-2xl mb-1">Potencias del mundo</h2>
    <p class="text-bruma text-sm mb-4">Ordenadas por territorios dominados</p>
    ${lista.length ? `<div class="grid gap-2.5">
      ${lista.map((im,i)=>{
        const mio = J.yo && im.cod === J.yo.cod;
        const medalla = ["#E5B54A","#C3CBDA","#B87333"][i] || "#4A5878";
        return `<div class="panel p-3 flex items-center gap-3 ${mio?"borde-oro":""}">
          <span class="w-6 text-center font-titulo font-extrabold" style="color:${medalla}">${i+1}</span>
          <span class="flex-shrink-0">${im.bandera?escudoSVG(im.bandera,30,{borde:mio?"#E5B54A":"#0B1020",grosor:3}):""}</span>
          <div class="flex-1 min-w-0">
            <p class="font-bold truncate">${im.nombre}${mio?' <span class="text-oro text-xs">(tú)</span>':""}</p>
            <p class="text-bruma text-xs">Fuerza ${im.fuerza}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="font-titulo font-extrabold text-xl text-oro">${im.n}</p>
            <p class="text-bruma text-[10px] uppercase tracking-wider">territorios</p>
          </div>
        </div>`;
      }).join("")}
    </div>` : `<div class="panel p-6 text-center"><p class="text-bruma">El mundo aún está por repartir.</p></div>`}
    <p class="text-bruma text-xs text-center mt-5">${TERRITORIOS.length - Object.keys(J.mundo).filter(k=>J.mundo[k].cod).length} territorios siguen sin dueño</p>
  </main>${pieNav("rango")}`;
};

/* ---------- AJUSTES ---------- */
P.ajustes = () => {
  app.innerHTML = `${barra()}
  <main class="max-w-lg mx-auto px-4 py-5 pb-28">
    <h2 class="font-titulo font-extrabold text-2xl mb-4">Ajustes</h2>
    <div class="panel p-4 mb-4">
      <p class="font-bold mb-3">Audio</p>
      <div class="grid gap-2">
        <button onclick="FX.toggle();P.ajustes()" class="w-full py-3 px-4 rounded-lg font-bold border-2 flex items-center justify-between ${FX.on?"borde-oro text-oro":"border-hierro text-bruma"}">
          <span class="flex items-center gap-2"><span class="material-symbols-outlined">${FX.on?"volume_up":"volume_off"}</span> Efectos y tambores</span>
          <span class="text-sm">${FX.on?"Activados":"Silencio"}</span></button>
        <button onclick="FX.musica.toggle();P.ajustes()" class="w-full py-3 px-4 rounded-lg font-bold border-2 flex items-center justify-between ${FX.musica.on?"borde-oro text-oro":"border-hierro text-bruma"}">
          <span class="flex items-center gap-2"><span class="material-symbols-outlined">${FX.musica.on?"music_note":"music_off"}</span> Música</span>
          <span class="text-sm">${FX.musica.on?"Activada":"Apagada"}</span></button>
      </div>
    </div>
    <div class="panel p-4 mb-4">
      <p class="font-bold mb-1">Tu código de imperio</p>
      <p class="text-bruma text-sm mb-2">Guárdalo: con él recuperas tu imperio en otro dispositivo.</p>
      <div class="flex items-center gap-2">
        <span class="font-titulo font-extrabold text-2xl tracking-[0.18em] flex-1">${J.yo?J.yo.cod:"—"}</span>
        <button onclick="copiarCodigo()" class="p-2.5 rounded-lg border-2 border-hierro active:translate-y-0.5"><span class="material-symbols-outlined" style="font-size:18px">content_copy</span></button>
      </div>
      <button onclick="recuperarImperio()" class="mt-3 w-full py-3 rounded-lg border-2 border-hierro text-bruma font-bold">Recuperar imperio con un código</button>
    </div>
    <div class="panel p-4">
      <p class="font-bold mb-1">Reglas de la guerra</p>
      <ul class="text-bruma text-sm space-y-1.5 mt-2">
        <li>· Solo puedes atacar territorios que toquen tu imperio.</li>
        <li>· Al conquistar heredas el ${Math.round(REGLAS.HERENCIA*100)}% de la muralla enemiga.</li>
        <li>· Cada ataque fallido debilita la plaza un ${Math.round(REGLAS.DESGASTE_ASEDIO*100)}%.</li>
        <li>· Las guarniciones caen un ${Math.round(REGLAS.DECAIMIENTO_DIA*100)}% al día si no las refuerzas.</li>
        <li>· ${REGLAS.ATAQUES_DIA} ataques por día.</li>
      </ul>
    </div>
    <p class="text-center text-bruma text-xs mt-6">Conquista Mundial · versión ${VER}</p>
  </main>${pieNav("ajustes")}`;
};
window.copiarCodigo = () => {
  const c = J.yo.cod;
  if(navigator.clipboard) navigator.clipboard.writeText(c).then(()=>alert("Código copiado: "+c)).catch(()=>alert("Tu código: "+c));
  else alert("Tu código: " + c);
};
window.recuperarImperio = () => {
  const c = prompt("Escribe el código de imperio (8 caracteres):");
  if(!c) return;
  const cod = c.trim().toUpperCase();
  const suyo = Object.values(J.mundo).find(d => d.cod === cod);
  if(!suyo) return alert("No encontramos ningún imperio con ese código.");
  J.yo = { cod, nombre: suyo.jn, bandera: suyo.jb, comandante: suyo.jc, natal: null, desde: Date.now() };
  J.guardar();
  FX.trompetas();
  alert("¡Imperio de " + suyo.jn + " recuperado!");
  ir("mapa");
};
