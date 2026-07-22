import { db, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from "./firebase.js";

/*
  Sincronización ligera del progreso de la Vuelta al Mundo.
  Se envían SOLO: nombre, emoji, estrellas, puntos y etapa.
  Las fotos NUNCA salen del dispositivo.
*/

const ref = id => doc(db, "viajeros", id);

function codigoNuevo(){
  const L = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({length:8},()=>L[Math.floor(Math.random()*L.length)]).join("");
}

const SYNC = {
  activo(){ return localStorage.getItem("tm_sync") === "on"; },

  activar(on){
    localStorage.setItem("tm_sync", on ? "on" : "off");
    if(on) this.subirTodos();
  },

  // cada perfil local tiene un código de viajero para recuperarlo en otro dispositivo
  codigoDe(perfilId){
    const mapa = this.mapa();
    if(!mapa[perfilId]){
      mapa[perfilId] = codigoNuevo();
      localStorage.setItem("tm_sync_map", JSON.stringify(mapa));
    }
    return mapa[perfilId];
  },
  mapa(){
    try { return JSON.parse(localStorage.getItem("tm_sync_map")) || {}; } catch(e){ return {}; }
  },
  asociar(perfilId, codigo){
    const mapa = this.mapa();
    mapa[perfilId] = codigo;
    localStorage.setItem("tm_sync_map", JSON.stringify(mapa));
  },

  async subir(perfil, prog){
    if(!this.activo() || !perfil) return false;
    const codigo = this.codigoDe(perfil.id);
    // el emoji: si el avatar es una foto, se usa uno genérico (la foto no viaja)
    const emoji = (perfil.av && !perfil.av.startsWith("data:")) ? perfil.av : "🙂";
    const estrellas = Object.values(prog.estrellas || {}).reduce((a,b)=>a+b,0);
    const puntos = Object.values(prog.mejor || {}).reduce((a,b)=>a+b,0);
    try {
      await setDoc(ref(codigo), {
        nombre: String(perfil.nombre || "Viajero").slice(0,18),
        emoji,
        estrellas,
        puntos,
        etapa: prog.max || 0,
        estrellasPorEtapa: prog.estrellas || {},
        mejorPorEtapa: prog.mejor || {},
        actualizado: Date.now()
      });
      return true;
    } catch(e){ console.warn("sync:", e); return false; }
  },

  async subirTodos(){
    if(!this.activo() || !window.perfiles) return;
    for(const p of perfiles()){
      await this.subir(p, progresoMundo(p.id));
    }
  },

  async ranking(n = 50){
    try {
      const q = query(collection(db, "viajeros"), orderBy("estrellas","desc"), orderBy("puntos","desc"), limit(n));
      const snap = await getDocs(q);
      const filas = [];
      snap.forEach(d => filas.push({ codigo: d.id, ...d.data() }));
      return filas;
    } catch(e){
      console.warn("ranking:", e);
      // si falta el índice compuesto, se ordena en el cliente
      try {
        const snap = await getDocs(query(collection(db, "viajeros"), orderBy("estrellas","desc"), limit(n)));
        const filas = [];
        snap.forEach(d => filas.push({ codigo: d.id, ...d.data() }));
        return filas.sort((a,b)=> b.estrellas-a.estrellas || b.puntos-a.puntos);
      } catch(e2){ return null; }
    }
  },

  async recuperar(codigo){
    try {
      const snap = await getDoc(ref(codigo.trim().toUpperCase()));
      if(!snap.exists()) return null;
      return snap.data();
    } catch(e){ console.warn("recuperar:", e); return null; }
  }
};

window.SYNC = SYNC;
