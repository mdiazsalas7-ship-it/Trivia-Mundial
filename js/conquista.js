import { db, doc, setDoc, getDoc, collection, getDocs } from "./firebase.js";

/*
  Conquista Mundial — asíncrona.
  Cada territorio guarda quién lo domina y con cuántos puntos.
  Para conquistarlo hay que superar esa marca. Solo viajan datos ligeros.
*/

const CONQ = {
  cache: null,
  cargadoEn: 0,

  async cargar(forzar){
    if(!forzar && this.cache && Date.now() - this.cargadoEn < 20000) return this.cache;
    try {
      const snap = await getDocs(collection(db, "territorios"));
      const mapa = {};
      snap.forEach(d => mapa[d.id] = d.data());
      this.cache = mapa;
      this.cargadoEn = Date.now();
      return mapa;
    } catch(e){
      console.warn("conquista:", e);
      return null;
    }
  },

  async conquistar(idTerritorio, datos){
    try {
      await setDoc(doc(db, "territorios", idTerritorio), {
        nombre: String(datos.nombre || "Viajero").slice(0,18),
        avatar: String(datos.avatar || "🙂").slice(0,200),
        codigo: String(datos.codigo || "").slice(0,8),
        puntos: Number(datos.puntos) || 0,
        fecha: Date.now()
      });
      if(this.cache) this.cache[idTerritorio] = { ...datos, fecha: Date.now() };
      return true;
    } catch(e){ console.warn("conquistar:", e); return false; }
  },

  async territorio(id){
    try {
      const snap = await getDoc(doc(db, "territorios", id));
      return snap.exists() ? snap.data() : null;
    } catch(e){ return null; }
  }
};

window.CONQ = CONQ;
