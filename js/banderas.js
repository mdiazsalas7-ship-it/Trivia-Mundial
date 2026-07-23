/* ---------- BANDERAS ---------- */

const HERALDO = {
  oro:    { n:"Oro",     c:"#E5B54A" },
  plata:  { n:"Plata",   c:"#E8EAF0" },
  gules:  { n:"Rojo",    c:"#C0392B" },
  azur:   { n:"Azul",    c:"#2C5AA0" },
  sable:  { n:"Negro",   c:"#141824" },
  sinople:{ n:"Verde",   c:"#1E7A5F" },
  purpura:{ n:"Púrpura", c:"#5B3FA8" },
  naranja:{ n:"Fuego",   c:"#D9531E" },
  hielo:  { n:"Hielo",   c:"#17A2A2" },
  hueso:  { n:"Hueso",   c:"#D8CBB0" }
};
const COLORES = Object.keys(HERALDO);

/* Divisiones: dibujan el paño en un lienzo 60x40 con dos colores */
const DIVISIONES = [
  { id:"solido",   n:"Liso",       d:(a,b)=>`<rect width="60" height="40" fill="${a}"/>` },
  { id:"fajas2",   n:"Dos fajas",  d:(a,b)=>`<rect width="60" height="40" fill="${a}"/><rect y="20" width="60" height="20" fill="${b}"/>` },
  { id:"fajas3",   n:"Tres fajas", d:(a,b)=>`<rect width="60" height="40" fill="${a}"/><rect y="13.3" width="60" height="13.4" fill="${b}"/>` },
  { id:"palos",    n:"Verticales", d:(a,b)=>`<rect width="60" height="40" fill="${a}"/><rect x="20" width="20" height="40" fill="${b}"/>` },
  { id:"partido",  n:"Partido",    d:(a,b)=>`<rect width="60" height="40" fill="${a}"/><rect x="30" width="30" height="40" fill="${b}"/>` },
  { id:"tajado",   n:"Diagonal",   d:(a,b)=>`<rect width="60" height="40" fill="${a}"/><path d="M0 40 L60 0 L60 40 Z" fill="${b}"/>` },
  { id:"cruz",     n:"Cruz",       d:(a,b)=>`<rect width="60" height="40" fill="${a}"/><rect x="20" width="9" height="40" fill="${b}"/><rect y="15.5" width="60" height="9" fill="${b}"/>` },
  { id:"aspa",     n:"Aspa",       d:(a,b)=>`<rect width="60" height="40" fill="${a}"/><path d="M0 0 L10 0 L60 33 L60 40 L50 40 L0 7 Z" fill="${b}"/><path d="M60 0 L50 0 L0 33 L0 40 L10 40 L60 7 Z" fill="${b}"/>` },
  { id:"cuartel",  n:"Cuartelado", d:(a,b)=>`<rect width="60" height="40" fill="${a}"/><rect x="30" width="30" height="20" fill="${b}"/><rect y="20" width="30" height="20" fill="${b}"/>` },
  { id:"chevron",  n:"Chevrón",    d:(a,b)=>`<rect width="60" height="40" fill="${a}"/><path d="M0 40 L30 12 L60 40 Z" fill="${b}"/>` },
  { id:"triangulo",n:"Cantón",     d:(a,b)=>`<rect width="60" height="40" fill="${a}"/><path d="M0 0 L26 20 L0 40 Z" fill="${b}"/>` },
  { id:"bordura",  n:"Bordura",    d:(a,b)=>`<rect width="60" height="40" fill="${b}"/><rect x="4" y="4" width="52" height="32" fill="${a}"/>` }
];

/* Emblemas: siluetas en un lienzo 100x100, centradas */
const EMBLEMAS = [
  { id:"lobo", n:"Lobo", g:1, d:`<path d="M28 78 L24 52 L18 34 L30 42 L38 30 L50 26 L62 30 L70 42 L82 34 L76 52 L72 78 L62 74 L60 60 L52 66 L48 66 L40 60 L38 74 Z"/><circle cx="42" cy="46" r="3.2" fill="#0000" /><circle cx="58" cy="46" r="3.2" fill="#0000"/>` },
  { id:"oso", n:"Oso", g:1, d:`<circle cx="30" cy="32" r="11"/><circle cx="70" cy="32" r="11"/><path d="M50 22 C28 22 20 40 22 58 C24 76 36 84 50 84 C64 84 76 76 78 58 C80 40 72 22 50 22 Z"/><ellipse cx="50" cy="70" rx="10" ry="8" fill="#0002"/>` },
  { id:"leon", n:"León", g:1, d:`<path d="M50 8 C61 8 68 15 70 22 C79 23 85 30 84 39 C90 46 90 56 84 62 C83 71 76 77 67 77 C63 85 56 89 50 89 C44 89 37 85 33 77 C24 77 17 71 16 62 C10 56 10 46 16 39 C15 30 21 23 30 22 C32 15 39 8 50 8 Z"/><circle cx="50" cy="48" r="18" fill="#0003"/><circle cx="43" cy="44" r="3" fill="#0000"/><circle cx="57" cy="44" r="3" fill="#0000"/><path d="M50 54 L45 60 L55 60 Z" fill="#0000"/>` },
  { id:"tigre", n:"Tigre", g:1, d:`<circle cx="50" cy="50" r="26"/><path d="M24 34 L30 18 L42 28 Z"/><path d="M76 34 L70 18 L58 28 Z"/><rect x="34" y="40" width="4" height="14" rx="2" fill="#0003"/><rect x="62" y="40" width="4" height="14" rx="2" fill="#0003"/>` },
  { id:"aguila", n:"Águila", g:2, d:`<circle cx="50" cy="22" r="9"/><path d="M42 24 L32 28 L42 32 Z"/><path d="M44 30 L56 30 L58 70 L50 88 L42 70 Z"/><path d="M46 34 C32 28 16 30 8 42 C18 40 26 42 32 46 C21 49 13 56 10 66 C22 60 34 60 42 64 L46 56 Z"/><path d="M54 34 C68 28 84 30 92 42 C82 40 74 42 68 46 C79 49 87 56 90 66 C78 60 66 60 58 64 L54 56 Z"/>` },
  { id:"halcon", n:"Halcón", g:2, d:`<path d="M50 20 C46 20 42 26 42 34 L20 44 L40 48 L34 78 L50 62 L66 78 L60 48 L80 44 L58 34 C58 26 54 20 50 20 Z"/>` },
  { id:"cuervo", n:"Cuervo", g:2, d:`<path d="M18 40 L44 34 L52 22 L60 34 L86 42 L64 50 L70 76 L50 62 L30 76 L36 50 Z"/><path d="M60 34 L74 28 L64 40 Z"/>` },
  { id:"buho", n:"Búho", g:2, d:`<path d="M50 18 C30 18 22 34 22 52 C22 72 34 84 50 84 C66 84 78 72 78 52 C78 34 70 18 50 18 Z"/><circle cx="38" cy="46" r="9" fill="#0003"/><circle cx="62" cy="46" r="9" fill="#0003"/><path d="M24 22 L34 34 L20 34 Z"/><path d="M76 22 L66 34 L80 34 Z"/>` },
  { id:"dragon", n:"Dragón", g:4, d:`<path d="M14 30 C14 20 24 14 34 16 L46 20 L44 12 L54 18 L58 10 L60 22 C70 26 74 34 72 42 L60 44 L58 34 L46 32 L40 40 L26 38 Z"/><path d="M20 24 L10 18 L20 30 Z"/><path d="M54 42 C66 46 76 56 78 70 C86 66 92 68 94 76 C86 74 82 78 80 84 C68 84 56 76 50 64 C44 74 34 80 22 80 C26 72 24 66 16 62 C26 58 34 60 40 66 C42 54 46 46 54 42 Z"/><path d="M44 46 C56 34 74 30 88 38 C78 40 70 46 66 54 C58 52 50 50 44 46 Z"/><circle cx="30" cy="26" r="3" fill="#0000"/>` },
  { id:"grifo", n:"Grifo", g:4, d:`<circle cx="34" cy="24" r="10"/><path d="M26 26 L14 30 L26 34 Z"/><path d="M28 32 C22 44 24 60 32 72 C38 82 48 88 58 88 L54 78 L64 84 L62 72 C70 66 74 56 72 46 L56 40 Z"/><path d="M44 36 C58 26 78 26 90 38 C78 38 68 42 62 50 C56 46 50 42 44 36 Z"/><path d="M70 60 C82 62 90 72 90 84 C84 78 78 76 72 78 Z"/><circle cx="30" cy="22" r="2.6" fill="#0000"/>` },
  { id:"fenix", n:"Fénix", g:4, d:`<circle cx="50" cy="20" r="8"/><path d="M43 22 L34 26 L43 30 Z"/><path d="M44 28 L56 28 L56 56 L44 56 Z"/><path d="M46 32 C34 20 18 14 6 20 C16 24 22 32 24 42 C16 40 10 42 6 48 C18 50 28 56 34 64 L46 52 Z"/><path d="M54 32 C66 20 82 14 94 20 C84 24 78 32 76 42 C84 40 90 42 94 48 C82 50 72 56 66 64 L54 52 Z"/><path d="M44 56 C40 68 40 82 46 94 L50 78 L54 94 C60 82 60 68 56 56 Z"/>` },
  { id:"kraken", n:"Kraken", g:4, d:`<ellipse cx="50" cy="34" rx="20" ry="22"/><path d="M32 50 C20 60 16 74 20 86 M40 56 C34 68 34 80 38 88 M50 58 C50 70 50 80 50 88 M60 56 C66 68 66 80 62 88 M68 50 C80 60 84 74 80 86" stroke-width="6" stroke-linecap="round" fill="none"/>` },
  { id:"serpiente", n:"Serpiente", g:3, d:`<path d="M22 82 C22 62 46 62 46 46 C46 32 30 32 30 22 C30 14 40 12 50 12 C64 12 76 20 76 34 C76 52 54 54 54 68 C54 78 62 82 70 84" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="50" cy="16" r="4" fill="#0003"/>` },
  { id:"escorpion", n:"Escorpión", g:3, d:`<ellipse cx="50" cy="56" rx="12" ry="20"/><path d="M38 44 L20 34 L14 44 M62 44 L80 34 L86 44" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M50 36 C50 24 66 18 74 26 C80 32 74 40 68 38" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M38 62 L22 66 M38 72 L24 80 M62 62 L78 66 M62 72 L76 80" stroke-width="5" stroke-linecap="round" fill="none"/>` },
  { id:"zorro", n:"Zorro", g:3, d:`<path d="M50 84 L26 56 L18 26 L36 38 L50 32 L64 38 L82 26 L74 56 Z"/><circle cx="40" cy="52" r="3.4" fill="#0003"/><circle cx="60" cy="52" r="3.4" fill="#0003"/>` },
  { id:"arania", n:"Araña", g:3, d:`<ellipse cx="50" cy="56" rx="15" ry="19"/><circle cx="50" cy="32" r="10"/><path d="M36 44 L14 30 M36 52 L10 50 M36 62 L12 72 M36 70 L20 86 M64 44 L86 30 M64 52 L90 50 M64 62 L88 72 M64 70 L80 86" stroke-width="4.5" stroke-linecap="round" fill="none"/>` },
  { id:"toro", n:"Toro", g:5, d:`<path d="M50 30 C34 30 26 42 26 56 C26 72 36 84 50 84 C64 84 74 72 74 56 C74 42 66 30 50 30 Z"/><path d="M28 40 C12 36 8 20 14 12 C22 18 26 28 32 34 Z"/><path d="M72 40 C88 36 92 20 86 12 C78 18 74 28 68 34 Z"/><circle cx="40" cy="54" r="3.6" fill="#0003"/><circle cx="60" cy="54" r="3.6" fill="#0003"/>` },
  { id:"jabali", n:"Jabalí", g:5, d:`<path d="M20 60 L28 40 L44 32 L68 34 L84 46 L82 66 L64 76 L34 74 Z"/><path d="M30 66 C22 66 20 76 26 80 C30 76 32 72 34 70 Z"/><path d="M46 68 C40 70 40 80 46 82 C50 78 50 72 50 70 Z"/><circle cx="60" cy="48" r="3.6" fill="#0003"/>` },
  { id:"elefante", n:"Elefante", g:5, d:`<path d="M26 40 C26 26 40 18 54 18 C72 18 84 30 84 48 L84 78 L68 78 L68 58 L46 58 L46 78 L30 78 Z"/><path d="M40 52 C34 62 34 76 40 84 C44 78 44 64 46 58 Z"/><circle cx="64" cy="38" r="4" fill="#0003"/>` },
  { id:"rinoceronte", n:"Rinoceronte", g:5, d:`<path d="M18 62 L26 44 L46 34 L74 36 L86 50 L84 70 L66 78 L32 76 Z"/><path d="M84 46 L96 26 L88 44 Z"/><path d="M74 40 L82 30 L78 42 Z"/><circle cx="66" cy="50" r="3.4" fill="#0003"/>` },
  { id:"tortuga", n:"Tortuga", g:5, d:`<ellipse cx="50" cy="54" rx="28" ry="22"/><ellipse cx="50" cy="54" rx="18" ry="14" fill="#0003"/><circle cx="50" cy="26" r="9"/><ellipse cx="22" cy="76" rx="9" ry="6"/><ellipse cx="78" cy="76" rx="9" ry="6"/>` },
  { id:"tiburon", n:"Tiburón", g:6, d:`<path d="M8 56 C24 40 52 34 78 42 L92 30 L86 50 L94 62 L76 62 C56 74 26 70 8 56 Z"/><path d="M50 36 L54 16 L62 38 Z"/><circle cx="74" cy="48" r="3" fill="#0003"/>` },
  { id:"orca", n:"Orca", g:6, d:`<path d="M10 58 C26 42 56 38 82 48 L94 40 L88 58 L94 72 L78 66 C54 76 26 72 10 58 Z"/><path d="M46 40 L50 14 L60 42 Z"/><ellipse cx="30" cy="54" rx="8" ry="4" fill="#0003"/>` },
  { id:"buitre", n:"Buitre", g:6, d:`<path d="M50 26 C42 26 38 32 38 40 L10 52 L36 54 L30 82 L50 68 L70 82 L64 54 L90 52 L62 40 C62 32 58 26 50 26 Z"/><circle cx="50" cy="20" r="7"/>` },
  { id:"camello", n:"Camello", g:7, d:`<path d="M20 76 L24 52 C24 44 32 38 42 40 C48 30 60 30 66 40 C76 40 82 48 82 58 L80 76 L72 76 L70 60 L34 60 L32 76 Z"/><path d="M66 40 L74 22 L78 40 Z"/>` },
  { id:"cocodrilo", n:"Cocodrilo", g:7, d:`<path d="M6 58 L34 50 L56 46 L82 42 L94 50 L82 58 L56 58 L34 62 Z"/><path d="M34 50 L38 40 L44 50 M50 48 L54 38 L60 48 M66 44 L70 34 L76 44" /><circle cx="80" cy="48" r="3" fill="#0003"/><path d="M20 62 L26 74 M40 62 L46 76 M62 60 L68 74" stroke-width="5" stroke-linecap="round" fill="none"/>` },
  { id:"bisonte", n:"Bisonte", g:7, d:`<path d="M22 74 L26 46 C26 34 40 26 56 28 C74 30 84 42 82 58 L80 76 L68 76 L66 58 L38 56 L36 74 Z"/><path d="M28 38 C16 34 14 22 20 16 C26 22 28 30 32 34 Z"/><circle cx="62" cy="42" r="3.4" fill="#0003"/>` },
  { id:"cabra", n:"Cabra montés", g:7, d:`<path d="M50 84 L32 62 L28 40 L44 44 L50 38 L56 44 L72 40 L68 62 Z"/><path d="M36 36 C24 26 20 12 26 6 C34 14 38 26 42 34 Z"/><path d="M64 36 C76 26 80 12 74 6 C66 14 62 26 58 34 Z"/>` },
  { id:"mantis", n:"Mantis", g:7, d:`<ellipse cx="50" cy="60" rx="11" ry="24"/><path d="M50 30 L44 20 L56 20 Z"/><circle cx="44" cy="24" r="3.4" fill="#0003"/><circle cx="56" cy="24" r="3.4" fill="#0003"/><path d="M40 42 L20 32 L14 46 M60 42 L80 32 L86 46" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M40 66 L22 76 M40 76 L26 88 M60 66 L78 76 M60 76 L74 88" stroke-width="4.5" fill="none" stroke-linecap="round"/>` },
  { id:"avispa", n:"Avispa", g:7, d:`<ellipse cx="50" cy="66" rx="13" ry="20"/><rect x="37" y="56" width="26" height="5" fill="#0003"/><rect x="37" y="68" width="26" height="5" fill="#0003"/><circle cx="50" cy="38" r="11"/><path d="M42 44 L18 26 M58 44 L82 26" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M50 86 L50 96" stroke-width="5" stroke-linecap="round" fill="none"/>` }
];

const GRADOS = { 1:"Común", 2:"Común", 3:"Poco común", 4:"Legendario", 5:"Poco común", 6:"Poco común", 7:"Raro" };

function banderaDefecto(){
  return { div:"fajas2", c1:"gules", c2:"oro", emb:"lobo", ec:"plata", forma:"rect" };
}
function banderaAleatoria(){
  const r = a => a[Math.floor(Math.random()*a.length)];
  const c1 = r(COLORES);
  let c2 = r(COLORES); while(c2 === c1) c2 = r(COLORES);
  let ec = r(COLORES); while(ec === c1) ec = r(COLORES);
  return { div:r(DIVISIONES).id, c1, c2, emb:r(EMBLEMAS).id, ec, forma:r(["rect","cola","gallardete"]) };
}

const FORMAS = {
  rect:       { n:"Recta",      p:"M0 0 L60 0 L60 40 L0 40 Z" },
  cola:       { n:"Golondrina", p:"M0 0 L60 0 L48 20 L60 40 L0 40 Z" },
  gallardete: { n:"Gallardete", p:"M0 0 L60 0 L34 20 L60 40 L0 40 Z" },
  punta:      { n:"Punta",      p:"M0 0 L60 0 L60 26 L30 40 L0 26 Z" }
};

function banderaSVG(b, ancho, opts){
  const f = Object.assign(banderaDefecto(), b || {});
  const o = opts || {};
  const div = DIVISIONES.find(d => d.id === f.div) || DIVISIONES[0];
  const emb = EMBLEMAS.find(e => e.id === f.emb);
  const c1 = (HERALDO[f.c1] || HERALDO.gules).c;
  const c2 = (HERALDO[f.c2] || HERALDO.oro).c;
  const ec = (HERALDO[f.ec] || HERALDO.plata).c;
  const forma = FORMAS[f.forma] || FORMAS.rect;
  const alto = Math.round(ancho * 40 / 60);
  const uid = "b" + Math.random().toString(36).slice(2,7);
  const desgaste = o.desgaste || 0;

  const emblema = emb ? `<g transform="translate(30 20) scale(0.30) translate(-50 -50)" fill="${ec}" stroke="${ec}">${emb.d}</g>` : "";
  const sombra = `<rect width="60" height="40" fill="url(#s${uid})"/>`;
  const rasgado = desgaste > 0 ? `<g fill="#05081C" opacity="${Math.min(0.9, desgaste)}">
      <path d="M60 6 l-4 3 l4 3 Z"/><path d="M60 18 l-6 4 l6 4 Z"/><path d="M60 30 l-3 3 l3 3 Z"/>
      <circle cx="56" cy="12" r="1.6"/><circle cx="53" cy="27" r="1.2"/></g>` : "";

  return `<svg viewBox="0 0 60 40" width="${ancho}" height="${alto}" style="display:block;overflow:visible;" role="img" aria-label="Bandera">
    <defs>
      <clipPath id="c${uid}"><path d="${forma.p}"/></clipPath>
      <linearGradient id="s${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.14"/>
        <stop offset="45%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.28"/>
      </linearGradient>
    </defs>
    <g clip-path="url(#c${uid})">
      ${div.d(c1, c2)}
      ${emblema}
      ${sombra}
      ${rasgado}
    </g>
    <path d="${forma.p}" fill="none" stroke="#05081C" stroke-width="1.4" opacity="0.85"/>
  </svg>`;
}

/* versión mínima para el mapa: sin emblema, solo el patrón (legible a 16px) */
function banderaMini(b, ancho){
  const f = Object.assign(banderaDefecto(), b || {});
  const div = DIVISIONES.find(d => d.id === f.div) || DIVISIONES[0];
  const c1 = (HERALDO[f.c1] || HERALDO.gules).c;
  const c2 = (HERALDO[f.c2] || HERALDO.oro).c;
  const alto = Math.round(ancho * 40 / 60);
  return `<svg viewBox="0 0 60 40" width="${ancho}" height="${alto}" style="display:block;">
    ${div.d(c1, c2)}
    <rect width="60" height="40" fill="none" stroke="#05081C" stroke-width="3"/>
  </svg>`;
}


/* ---------- ESCUDO: la marca en el mapa ----------
   Un escudo con los colores del jugador y su emblema al centro.
   El emblema es lo que distingue a un imperio de otro de un vistazo. */
function escudoSVG(bandera, ancho, opts){
  const o = opts || {};
  const f = Object.assign(banderaDefecto(), bandera || {});
  const div = DIVISIONES.find(d => d.id === f.div) || DIVISIONES[0];
  const emb = EMBLEMAS.find(e => e.id === f.emb);
  const c1 = (HERALDO[f.c1] || HERALDO.gules).c;
  const c2 = (HERALDO[f.c2] || HERALDO.oro).c;
  const ec = (HERALDO[f.ec] || HERALDO.plata).c;
  const alto = Math.round(ancho * 1.18);
  const uid = "e" + Math.random().toString(36).slice(2,7);
  const borde = o.borde || "#05081C";
  const grosor = o.grosor || 3;
  const forma = "M2 2 L48 2 L48 32 C48 48 34 56 25 60 C16 56 2 48 2 32 Z";
  return `<svg viewBox="0 0 50 62" width="${ancho}" height="${alto}" style="display:block;overflow:visible;">
    <defs><clipPath id="c${uid}"><path d="${forma}"/></clipPath></defs>
    <g clip-path="url(#c${uid})">
      <g transform="translate(-5 0) scale(1 1.55)">${div.d(c1, c2)}</g>
      ${emb ? `<g transform="translate(25 28) scale(0.40) translate(-50 -50)" fill="${ec}" stroke="${ec}">${emb.d}</g>` : ""}
      <path d="${forma}" fill="url(#lus${uid})"/>
    </g>
    <defs><linearGradient id="lus${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.16"/>
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.3"/></linearGradient></defs>
    <path d="${forma}" fill="none" stroke="${borde}" stroke-width="${grosor}"/>
  </svg>`;
}

/* silueta del emblema suelta, para insignias */
function emblemaSVG(id, tam, color){
  const e = EMBLEMAS.find(x => x.id === id);
  if(!e) return "";
  return `<svg viewBox="0 0 100 100" width="${tam}" height="${tam}" style="display:block">
    <g fill="${color}" stroke="${color}">${e.d}</g></svg>`;
}
