/* Instalación como app (PWA) */
let deferredPrompt = null;

const yaInstalada = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

function ocultarBanner(){
  const b = document.getElementById("installBanner");
  if(b) b.remove();
}

function mostrarBanner(){
  if(document.getElementById("installBanner")) return;
  if(yaInstalada() || localStorage.getItem("cq_install") === "no") return;

  const iOS = esIOS();
  const div = document.createElement("div");
  div.id = "installBanner";
  div.className = "fixed left-0 right-0 bottom-0 z-[9997] p-4";
  div.innerHTML = `
    <div class="max-w-lg mx-auto panel rounded-2xl p-4 flex items-center gap-3 " style="box-shadow:0 8px 30px rgba(0,0,0,.6);">
      <img src="icons/icon-192.png" alt="" class="w-12 h-12 rounded-xl flex-shrink-0"/>
      <div class="flex-1 min-w-0">
        <p class="font-bold leading-tight">Instala Conquista Mundial</p>
        <p class="text-bruma text-sm leading-snug">${iOS
          ? 'Toca <span class="material-symbols-outlined align-middle" style="font-size:16px;">ios_share</span> y luego “Añadir a pantalla de inicio”.'
          : "Juega a pantalla completa, incluso sin internet."}</p>
      </div>
      ${iOS ? "" : `<button onclick="instalarApp()" class="boton-oro text-white px-4 py-2.5 rounded-xl font-bold flex-shrink-0 active-btn-press transition-all" >Instalar</button>`}
      <button onclick="rechazarInstalar()" aria-label="Ahora no" class="text-bruma p-1 flex-shrink-0"><span class="material-symbols-outlined">close</span></button>
    </div>`;
  document.body.appendChild(div);
}

window.mostrarBannerManual = function(){ localStorage.removeItem("cq_install"); mostrarBanner(); };

window.rechazarInstalar = function(){
  localStorage.setItem("cq_install", "no");
  ocultarBanner();
};

window.instalarApp = async function(){
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  if(outcome === "accepted") ocultarBanner();
};

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  window.deferredPromptReady = true;
  setTimeout(mostrarBanner, 2500);
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  localStorage.setItem("cq_install", "ok");
  ocultarBanner();
});

// iOS no dispara beforeinstallprompt: mostramos las instrucciones igualmente
if(esIOS() && !yaInstalada()) setTimeout(mostrarBanner, 3000);

// Registrar el service worker (habilita instalación y juego sin conexión)
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(err => console.warn("SW no registrado:", err));
  });
}

