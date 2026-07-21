# Trivia Mundial

Juego de trivia con tarjetas 3D y retos para jugar en grupo (2 a 6 jugadores, pasa y juega). Preguntas de cultura, ciencia, historia, entretenimiento y deportes, más la tarjeta Sorpresa que vale doble.

**Stack:** HTML + Tailwind (CDN) + JavaScript vanilla. Sitio 100% estático: no requiere build, backend ni base de datos. Ideal para validar el producto.

## Estructura del proyecto

```
trivia-mundial/
├── index.html          # Punto de entrada y configuración de Tailwind
├── css/
│   └── styles.css      # Animaciones y estilos custom (flip 3D, confeti, sombras)
├── js/
│   ├── data.js         # Contenido del juego: categorías, preguntas y retos
│   └── app.js          # Motor del juego: pantallas, turnos, timer, puntajes
├── assets/
│   ├── logo.webp       # Logo oficial
│   └── card-deportes.webp  # Arte de la tarjeta Deportes
├── vercel.json         # Configuración de despliegue
└── README.md
```

Para agregar preguntas o retos solo edita `js/data.js` — no hace falta tocar la lógica.

## Cómo subirlo a GitHub

**Opción A — desde la web (sin instalar nada):**
1. Entra a [github.com](https://github.com) → botón **New repository**.
2. Nombre: `trivia-mundial` → **Create repository** (público o privado, da igual para Vercel).
3. En el repo vacío: **uploading an existing file** → arrastra TODO el contenido de esta carpeta (incluyendo las subcarpetas `css`, `js` y `assets`).
4. **Commit changes**.

**Opción B — con git desde la terminal:**
```bash
cd trivia-mundial
git init
git add .
git commit -m "Trivia Mundial v1: MVP jugable"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/trivia-mundial.git
git push -u origin main
```

## Cómo desplegarlo en Vercel

1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. **Add New → Project** → importa el repositorio `trivia-mundial`.
3. Framework preset: **Other**. No cambies nada más (no hay build: Output Directory vacío o `.`).
4. **Deploy**. En menos de un minuto tendrás tu URL: `https://trivia-mundial-xxxx.vercel.app`.

Desde ese momento, cada `git push` a `main` publica automáticamente la nueva versión.

## Probar en local

Basta con abrir `index.html` en el navegador, o si prefieres un servidor local:
```bash
npx serve .
```

## Hoja de ruta

- **v1 (esta):** pasa y juega en un solo dispositivo. Validación con usuarios reales.
- **v2:** más preguntas por categoría, niveles de dificultad, sonidos, guardar historial de partidas en el dispositivo.
- **v3:** salas multijugador en tiempo real (cada quien desde su celular) — requiere backend (por ejemplo Supabase o Firebase) y es el paso previo a monetizar.


## Modo multijugador en línea (Firebase)

La app tiene dos modos: **Jugar aquí** (pasa y juega en un dispositivo, funciona sin internet) y **Jugar en línea** (cada jugador desde su celular, con código de sala de 4 letras).

El backend es **Firestore** y la configuración vive en `js/firebase.js`.

### Activar Firestore (una sola vez)

1. Entra a la [consola de Firebase](https://console.firebase.google.com) → proyecto `trivia-mundial-3b4ee`.
2. Menú **Build → Firestore Database → Create database**.
3. Elige **Start in production mode** y la región más cercana (por ejemplo `us-west1` o `southamerica-east1`).
4. Ve a la pestaña **Rules**, borra lo que haya y pega el contenido del archivo `firestore.rules` de este repo → **Publish**.

Sin ese último paso el modo en línea mostrará un error de permisos.

### Cómo se juega en línea

1. Un jugador toca **Jugar en línea → Crear sala** y recibe un código (ej. `QZ4P`).
2. Lo comparte por WhatsApp con el botón **Compartir** (manda el enlace y el código juntos).
3. Los demás abren la web, tocan **Jugar en línea**, escriben su nombre y el código.
4. El anfitrión ajusta preguntas y segundos, y toca **¡Comenzar partida!**.
5. Todos ven en vivo el turno, el reloj y el marcador. Los retos se cumplen por videollamada y el grupo vota desde sus celulares.

Máximo 8 jugadores por sala. El anfitrión tiene un botón **Saltar turno** por si alguien pierde conexión.

### Modelo de datos

Colección `salas`, un documento por partida (el ID es el código):

| Campo | Descripción |
|---|---|
| `fase` | `lobby`, `mazo`, `pregunta`, `resultado`, `reto`, `fin` |
| `jugadores` | Lista con `id`, `nombre`, `pts`, `fifty` |
| `orden`, `mano`, `carta` | Preguntas barajadas, las 4 en mesa, la elegida |
| `turno`, `hechas` | Índice del jugador en turno y preguntas jugadas |
| `deadline` | Marca de tiempo en que vence el reloj (así todos van sincronizados) |
| `qPorJugador`, `segundos` | Configuración de la partida |

El banco actual tiene **500 preguntas** (unas 83 por categoría) y **40 retos**, todo en `js/data.js`. Moverlas a Firestore es el siguiente paso natural cuando quieras editarlas sin tocar código.


## App instalable (PWA)

La web es instalable como app en Android, iPhone, Windows y Mac.

- **Android / Chrome:** aparece un banner “Instalar Trivia Mundial” a los pocos segundos, o desde el menú ⋮ → *Instalar aplicación*.
- **iPhone / Safari:** botón *Compartir* → *Añadir a pantalla de inicio* (el banner muestra la instrucción automáticamente).
- **Escritorio:** icono de instalar en la barra de direcciones.
- También hay un botón permanente en **Ajustes → Instalar en este dispositivo**.

Una vez instalada se abre a pantalla completa, sin barra del navegador, y **funciona sin internet** gracias al service worker (`sw.js`). El único modo que necesita conexión es el multijugador en línea.

Archivos implicados: `manifest.webmanifest`, `sw.js`, `js/install.js`, `favicon.ico` y la carpeta `icons/`.

**Importante:** la instalación solo funciona sobre HTTPS (Vercel lo da automáticamente) o en `localhost`. Abriendo el archivo directamente desde el disco no aparecerá el botón.

Al publicar una versión nueva, sube el número de `VERSION` en `sw.js` (por ejemplo `tm-v4`) para que los dispositivos actualicen la caché.


## Cambiar la música de fondo

El juego trae una música generada por código como respaldo. Para usar una pista real:

1. Consigue una pista **libre de regalías con licencia comercial** (Uppbeat, Epidemic Sound, Artlist, Pixabay Music, Biblioteca de Audio de YouTube) o encárgala a un compositor. **No uses canciones comerciales de artistas conocidos**: requieren licencias de sincronización y máster que cuestan miles de dólares, y las tiendas retiran la app ante un reclamo.
2. Busca una pista pensada para bucle, de 1 a 3 minutos, sin voces (las voces distraen durante las preguntas).
3. Guárdala como `assets/music.mp3` (idealmente menos de 2 MB; conviértela a 128 kbps mono si hace falta).
4. Súbela al repo y listo: la app la detecta sola y deja de usar la música generada.
5. Añade `./assets/music.mp3` a la lista `SHELL` de `sw.js` si quieres que también funcione sin conexión.

Guarda la factura o el certificado de licencia de la pista: las tiendas de apps pueden pedirlo.
