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
    <div id="lienzo" class="mt-4 overflow-x-auto"><div class="min-w-[1600px]">${mapaSVG({natal:true})}</div></div>
    <div id="ficha" class="px-4"></div>
  </main>`;
  centrar(760);
};

/* ---------- MAPA ---------- */
function mapaSVG(opts){
  const o = opts || {};
  const mios = new Set(J.misTerritorios().map(t => t.id));
  const alcance = o.natal ? null : J.alcanzables();

  const lineas = [];
  RUTAS.forEach(r => {
    const a = territorio(r.a), b = territorio(r.b);
    const dash = r.c === 1 ? "5 5" : (r.c === 2 ? "3 7" : "2 9");
    const op = r.c === 1 ? 0.5 : 0.32;
    lineas.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#5B6B8C" stroke-width="${r.c===1?2:1.5}" stroke-dasharray="${dash}" opacity="${op}"/>`);
  });

  const marcas = TERRITORIOS.map(t => {
    const d = J.duenoDe(t.id);
    const mio = mios.has(t.id);
    const g = J.guarnicion(t.id);
    const puede = o.natal ? true : (alcance && alcance.has(t.id));
    const destac = o.destacado === t.id;
    const rad = t.v === 3 ? 15 : (t.v === 2 ? 13 : 11);
    let cuerpo;
    if(d && d.jb){
      cuerpo = `<g transform="translate(${-rad},${-rad*0.66})">
        <foreignObject width="${rad*2}" height="${rad*1.34}">
          <div xmlns="http://www.w3.org/1999/xhtml">${banderaMini(d.jb, rad*2)}</div>
        </foreignObject></g>`;
    } else {
      cuerpo = `<circle r="${rad*0.72}" fill="#1A2033" stroke="#4A5878" stroke-width="2"/>`;
    }
    const aro = mio ? `<circle r="${rad+4}" fill="none" stroke="#E5B54A" stroke-width="2.5"/>`
             : (puede && !o.natal ? `<circle r="${rad+3}" fill="none" stroke="#C0392B" stroke-width="2" stroke-dasharray="3 3" opacity="0.85"/>` : "");
    const pulso = destac ? `<circle r="${rad+10}" fill="${mio?"#E5B54A":"#C0392B"}" opacity="0.25"><animate attributeName="r" values="${rad+6};${rad+16};${rad+6}" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.3;0.05;0.3" dur="1.5s" repeatCount="indefinite"/></circle>` : "";
    return `<g transform="translate(${t.x},${t.y})" style="cursor:pointer" onclick="tocarTerritorio('${t.id}')" role="button" aria-label="${t.n}">
      ${pulso}${aro}${cuerpo}
      <text y="${rad+13}" text-anchor="middle" font-size="11" font-weight="700" fill="#D8DCE8" style="paint-order:stroke;stroke:#05081C;stroke-width:4">${t.n}</text>
      <text y="${-rad-5}" text-anchor="middle" font-size="10.5" font-weight="800" fill="${mio?"#E5B54A":"#F0A8A8"}" style="paint-order:stroke;stroke:#05081C;stroke-width:4">${g}</text>
    </g>`;
  }).join("");

  return `<svg id="svgMapa" viewBox="0 0 1600 800" width="1600" height="800" role="img" aria-label="Mapa del mundo">
    <image href="${MAPA}" x="0" y="0" width="1600" height="800" preserveAspectRatio="none" opacity="0.92"/>
    <g>${lineas.join("")}</g>${marcas}
  </svg>`;
}

function centrar(x){
  const w = document.getElementById("lienzo");
  if(!w) return;
  w.scrollLeft = Math.max(0, x - w.clientWidth/2);
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
    <div id="lienzo" class="mt-3 overflow-x-auto"><div class="min-w-[1600px]">${mapaSVG({})}</div></div>
    <div id="ficha" class="px-4"></div>
  </main>${pieNav("mapa")}`;
  centrar(mios.length ? mios[0].x : 760);
  if(mios.length) setTimeout(()=>tocarTerritorio(mios[0].id), 200);
};

window.tocarTerritorio = function(id){
  const t = territorio(id);
  const d = J.duenoDe(id);
  const g = J.guarnicion(id);
  const mio = J.esMio(id);
  const ficha = document.getElementById("ficha");
  if(!ficha) return;
  const eligiendo = S.pantalla === "natal";
  const puede = J.puedeAtacar(id);
  const ruta = eligiendo ? null : J.rutaDeAtaque(id);
  const sinAtaques = J.ataquesRestantes() <= 0;

  let accion;
  if(eligiendo){
    accion = `<button onclick="fijarNatal('${id}')" class="w-full boton-oro py-3.5 rounded-xl font-titulo font-extrabold text-lg mt-4">
      <span class="material-symbols-outlined align-middle">flag</span> Nacer en ${t.n}</button>`;
  } else if(mio){
    accion = `<button onclick="prepararAtaque('${id}')" ${sinAtaques?"disabled":""} class="w-full ${sinAtaques?"boton-muerto":"boton-hierro"} py-3.5 rounded-xl font-titulo font-extrabold text-lg mt-4">
      <span class="material-symbols-outlined align-middle">shield</span> ${sinAtaques?"Sin ataques hoy":"Reforzar plaza"}</button>`;
  } else if(!puede){
    accion = `<div class="mt-4 rounded-xl border-2 border-hierro p-3 text-center">
      <p class="text-bruma text-sm"><span class="material-symbols-outlined align-middle text-bruma" style="font-size:17px">block</span> Fuera de tu alcance</p>
      <p class="text-bruma/70 text-xs mt-1">Debes conquistar primero un territorio vecino.</p></div>`;
  } else {
    const via = ruta && ruta.tipo === "mar"
      ? `<span class="text-oro">Travesía · ${ruta.ruta.n}</span>` : `<span class="text-hueso">Por tierra desde ${ruta?territorio(ruta.desde).n:""}</span>`;
    accion = `<p class="text-center text-xs mt-3">${via}</p>
      <button onclick="prepararAtaque('${id}')" ${sinAtaques?"disabled":""} class="w-full ${sinAtaques?"boton-muerto":"boton-sangre"} py-3.5 rounded-xl font-titulo font-extrabold text-lg mt-2">
      <span class="material-symbols-outlined align-middle">swords</span> ${sinAtaques?"Sin ataques hoy":"Atacar"}</button>`;
  }

  ficha.innerHTML = `<div class="panel p-4 mt-4 aparece">
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0 asta-mini">${d && d.jb ? banderaSVG(d.jb, 62) : `<div class="w-[62px] h-[41px] rounded border-2 border-hierro flex items-center justify-center"><span class="material-symbols-outlined text-bruma" style="font-size:18px">landscape</span></div>`}</div>
      <div class="flex-1 min-w-0">
        <p class="font-titulo font-extrabold text-lg leading-tight">${t.n}</p>
        <p class="text-bruma text-sm">${REGIONES[t.r].n} · ${["","Aldea","Provincia","Gran plaza"][t.v]}</p>
        <p class="text-sm mt-1">${d && d.cod ? (mio ? `<span class="text-oro font-bold">Tu territorio</span>` : `En manos de <span class="font-bold text-carmesi">${d.jn}</span>`) : `<span class="text-bruma">Guarnición local</span>`}</p>
      </div>
      <div class="text-right flex-shrink-0">
        <p class="text-bruma text-[10px] font-bold uppercase tracking-wider">Defensa</p>
        <p class="font-titulo font-extrabold text-2xl ${mio?"text-oro":"text-carmesi"}">${g}</p>
      </div>
    </div>
    ${accion}
  </div>`;
  const w = document.getElementById("lienzo");
  if(w){
    const svg = document.getElementById("svgMapa");
    if(svg) svg.outerHTML = mapaSVG({ destacado:id, natal: S.pantalla === "natal" });
    w.scrollTo({ left: Math.max(0, t.x - w.clientWidth/2), behavior:"smooth" });
  }
};

window.fijarNatal = async function(id){
  const t = territorio(id);
  const btn = event && event.target;
  if(btn) btn.disabled = true;
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
          <div class="asta-mini flex-shrink-0">${x.bandera?banderaSVG(x.bandera,56):""}</div>
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
  const porRegion = {};
  mios.forEach(t => porRegion[t.r] = (porRegion[t.r]||0)+1);
  const c = cmdPorId(J.yo.comandante);
  app.innerHTML = `${barra()}
  <main class="max-w-lg mx-auto px-4 py-5 pb-28">
    <div class="panel overflow-hidden">
      <div class="relative" style="height:150px">
        <img src="${c.img}" alt="" class="w-full h-full object-cover object-top"/>
        <div class="absolute inset-0" style="background:linear-gradient(transparent 25%, #0B1020f2 92%)"></div>
        <div class="absolute inset-x-0 bottom-0 p-4 flex items-end gap-3">
          <div class="asta-mini flex-shrink-0">${banderaSVG(J.yo.bandera, 74)}</div>
          <div class="flex-1 min-w-0">
            <p class="font-titulo font-extrabold text-xl leading-tight truncate">${J.yo.nombre}</p>
            <p class="text-bruma text-sm">${c.t} · código ${J.yo.cod}</p>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 p-4">
        <div class="caja"><p class="text-bruma text-[10px] uppercase tracking-wider">Territorios</p><p class="font-titulo font-extrabold text-2xl text-oro">${mios.length}</p></div>
        <div class="caja"><p class="text-bruma text-[10px] uppercase tracking-wider">Fuerza</p><p class="font-titulo font-extrabold text-2xl">${fuerza}</p></div>
        <div class="caja"><p class="text-bruma text-[10px] uppercase tracking-wider">Frentes</p><p class="font-titulo font-extrabold text-2xl text-carmesi">${J.fronterasAbiertas()}</p></div>
      </div>
    </div>

    ${mios.length ? `<p class="text-bruma text-xs font-bold uppercase tracking-[0.18em] mt-5 mb-2">Tus dominios</p>
    <div class="grid gap-2">
      ${mios.sort((a,b)=>J.guarnicion(b.id)-J.guarnicion(a.id)).map(t=>{
        const g = J.guarnicion(t.id);
        const amenaza = [...VECINOS[t.id]].filter(v=>!J.esMio(v)).length;
        return `<button onclick="ir('mapa');setTimeout(()=>tocarTerritorio('${t.id}'),150)" class="panel p-3 flex items-center gap-3 text-left active:translate-y-0.5">
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:${REGIONES[t.r].c}"></span>
          <div class="flex-1 min-w-0">
            <p class="font-bold truncate">${t.n}</p>
            <p class="text-bruma text-xs">${amenaza} frontera${amenaza===1?"":"s"} expuesta${amenaza===1?"":"s"}</p>
          </div>
          <span class="font-titulo font-extrabold ${g<25?"text-carmesi":"text-oro"}">${g}</span>
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
          <div class="asta-mini flex-shrink-0">${im.bandera?banderaSVG(im.bandera,52):""}</div>
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
