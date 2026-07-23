import { db, doc, setDoc, getDoc, collection, getDocs } from "./firebase.js";

/* ---------- MOTOR DE CONQUISTA ---------- */

const REGLAS = {
  ASALTOS: 5,
  SEGUNDOS: 15,
  ATAQUES_DIA: 6,
  HERENCIA: 0.70,      // conservas el 70% de la guarnición que había
  MINIMO_PROPIO: 0.60, // ...o el 60% de tu marca, lo que sea mayor
  DESGASTE_ASEDIO: 0.05, // cada ataque fallido debilita un 5%
  DECAIMIENTO_DIA: 0.03, // la guarnición cae un 3% al día sin refuerzos
  MAXIMA: 130            // ninguna plaza es inexpugnable
};

/* Guarnición neutral: el mundo nunca está vacío */
function guarnicionNeutral(t){
  const base = { 1: 22, 2: 38, 3: 56 }[t.v] || 25;
  const paso = RUTAS.some(r => (r.a === t.id || r.b === t.id) && r.c === 1);
  return Math.round(base * (paso ? 1.25 : 1));
}

/* La guarnición se debilita sola con el tiempo */
function guarnicionEfectiva(d, t){
  if(!d) return guarnicionNeutral(t);
  const dias = Math.max(0, (Date.now() - (d.ts || 0)) / 86400000);
  const g = Math.round((d.g || 0) * Math.pow(1 - REGLAS.DECAIMIENTO_DIA, dias));
  return Math.max(10, g);
}

const J = {
  yo: null,
  mundo: {},      // id -> {cod, jn, jb, jc, g, ts}
  cargadoEn: 0,
  cronica: [],

  /* --- perfil local --- */
  cargar(){
    try { this.yo = JSON.parse(localStorage.getItem("cq_jugador")); } catch(e){ this.yo = null; }
    return this.yo;
  },
  guardar(){ if(this.yo) localStorage.setItem("cq_jugador", JSON.stringify(this.yo)); },
  crear(nombre, bandera, comandante, natal){
    const L = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const cod = Array.from({length:8}, () => L[Math.floor(Math.random()*L.length)]).join("");
    this.yo = { cod, nombre, bandera, comandante, natal, desde: Date.now() };
    this.guardar();
    return this.yo;
  },

  /* --- energía diaria --- */
  energia(){
    const hoy = new Date().toISOString().slice(0,10);
    let e; try { e = JSON.parse(localStorage.getItem("cq_energia")) || {}; } catch(err){ e = {}; }
    if(e.dia !== hoy) e = { dia: hoy, usados: 0 };
    return e;
  },
  ataquesRestantes(){ return Math.max(0, REGLAS.ATAQUES_DIA - this.energia().usados); },
  gastarAtaque(){
    const e = this.energia();
    e.usados = Math.min(REGLAS.ATAQUES_DIA, e.usados + 1);
    localStorage.setItem("cq_energia", JSON.stringify(e));
  },

  /* --- mundo --- */
  async cargarMundo(forzar){
    if(!forzar && this.cargadoEn && Date.now() - this.cargadoEn < 15000) return this.mundo;
    try {
      const snap = await getDocs(collection(db, "cq_terr"));
      const m = {};
      snap.forEach(d => m[d.id] = d.data());
      this.detectarCambios(m);
      this.mundo = m;
      this.cargadoEn = Date.now();
      localStorage.setItem("cq_mundo_visto", JSON.stringify(this.resumen(m)));
      return m;
    } catch(e){ console.warn("mundo:", e); return null; }
  },
  resumen(m){
    const r = {};
    Object.keys(m).forEach(id => r[id] = m[id].cod || "");
    return r;
  },
  detectarCambios(m){
    if(!this.yo) return;
    let antes = {};
    try { antes = JSON.parse(localStorage.getItem("cq_mundo_visto")) || {}; } catch(e){}
    if(!Object.keys(antes).length) return;
    const noticias = [];
    Object.keys(antes).forEach(id => {
      const eraMio = antes[id] === this.yo.cod;
      const ahora = m[id] ? m[id].cod : null;
      if(eraMio && ahora && ahora !== this.yo.cod){
        noticias.push({ tipo:"perdido", id, quien: m[id].jn, bandera: m[id].jb, cuando: m[id].ts });
      }
    });
    this.cronica = noticias;
  },

  duenoDe(id){ return this.mundo[id] || null; },
  esMio(id){ const d = this.mundo[id]; return !!(d && this.yo && d.cod === this.yo.cod); },
  misTerritorios(){ return TERRITORIOS.filter(t => this.esMio(t.id)); },
  guarnicion(id){ return guarnicionEfectiva(this.mundo[id], territorio(id)); },

  /* --- alcance: solo puedo atacar lo que toca mi imperio --- */
  alcanzables(){
    const mios = this.misTerritorios().map(t => t.id);
    const set = new Set();
    mios.forEach(id => VECINOS[id].forEach(v => { if(!this.esMio(v)) set.add(v); }));
    return set;
  },
  puedeAtacar(id){
    if(!this.yo) return false;
    if(this.esMio(id)) return true; // reforzar
    if(this.misTerritorios().length === 0) return true; // aún sin tierras
    return this.alcanzables().has(id);
  },
  rutaDeAtaque(id){
    const mios = this.misTerritorios().map(t => t.id);
    for(const m of mios){
      if(territorio(m).t.includes(id)) return { tipo:"tierra", desde:m };
    }
    for(const m of mios){
      const r = rutaEntre(m, id);
      if(r) return { tipo:"mar", desde:m, ruta:r };
    }
    return null;
  },

  /* --- resultado de batalla --- */
  async resolver(id, puntos){
    const t = territorio(id);
    const antes = this.guarnicion(id);
    const mio = this.esMio(id);
    const gana = mio ? true : puntos > antes;
    let nueva;
    if(gana){
      nueva = mio
        ? Math.max(antes, Math.round(puntos))
        : Math.max(Math.round(antes * REGLAS.HERENCIA), Math.round(puntos * REGLAS.MINIMO_PROPIO));
      nueva = Math.min(REGLAS.MAXIMA, nueva);
    } else {
      nueva = Math.max(10, Math.round(antes * (1 - REGLAS.DESGASTE_ASEDIO)));
    }
    const datos = gana
      ? { cod:this.yo.cod, jn:this.yo.nombre, jb:this.yo.bandera, jc:this.yo.comandante, g:nueva, ts:Date.now() }
      : Object.assign({}, this.mundo[id] || { cod:"", jn:"Guarnición local", jb:null, jc:null }, { g:nueva, ts:Date.now() });
    try {
      await setDoc(doc(db, "cq_terr", id), datos);
      this.mundo[id] = datos;
      const visto = this.resumen(this.mundo);
      localStorage.setItem("cq_mundo_visto", JSON.stringify(visto));
    } catch(e){ console.warn("resolver:", e); }
    return { gana, antes, nueva, mio };
  },

  async reclamarNatal(id){
    const datos = { cod:this.yo.cod, jn:this.yo.nombre, jb:this.yo.bandera, jc:this.yo.comandante,
                    g: Math.round(guarnicionNeutral(territorio(id)) * 0.9), ts:Date.now() };
    try {
      await setDoc(doc(db, "cq_terr", id), datos);
      this.mundo[id] = datos;
      localStorage.setItem("cq_mundo_visto", JSON.stringify(this.resumen(this.mundo)));
      return true;
    } catch(e){ console.warn("natal:", e); return false; }
  },

  /* --- clasificación --- */
  imperios(){
    const por = {};
    Object.keys(this.mundo).forEach(id => {
      const d = this.mundo[id];
      if(!d.cod) return;
      if(!por[d.cod]) por[d.cod] = { cod:d.cod, nombre:d.jn, bandera:d.jb, comandante:d.jc, n:0, fuerza:0 };
      por[d.cod].n++;
      por[d.cod].fuerza += guarnicionEfectiva(d, territorio(id));
    });
    return Object.values(por).sort((a,b) => b.n - a.n || b.fuerza - a.fuerza);
  },
  fronterasAbiertas(){
    let n = 0;
    this.misTerritorios().forEach(t => VECINOS[t.id].forEach(v => { if(!this.esMio(v)) n++; }));
    return n;
  }
};

window.J = J;
window.REGLAS = REGLAS;
window.guarnicionNeutral = guarnicionNeutral;
window.guarnicionEfectiva = guarnicionEfectiva;
window.avisarListo = () => { if(window.alArrancar) window.alArrancar(); };
avisarListo();
