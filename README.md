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
