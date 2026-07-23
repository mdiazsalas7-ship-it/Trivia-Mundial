# Conquista Mundial

Juego de conquista territorial asíncrona. Ganas países a jugadores reales de todo el mundo respondiendo preguntas: cada territorio guarda la marca del último que lo tomó, y para arrebatárselo hay que superarla.

**Stack:** HTML + Tailwind (CDN) + JavaScript vanilla + Firestore. Sitio estático, sin build.

## Cómo se juega

1. Eliges **comandante** (el rostro que verán tus enemigos), diseñas tu **bandera** y tu nombre de guerra.
2. Eliges tu **tierra natal**: tu primer territorio, gratis.
3. Solo puedes atacar territorios que **toquen tu imperio**, por tierra o por rutas marítimas.
4. Cada batalla son **5 asaltos** de 15 segundos. Cuanto más rápido respondes, más fuerte golpeas.
5. Si superas la defensa enemiga, el territorio es tuyo y ondea tu bandera para todo el mundo.

### Reglas de la guerra

| Regla | Efecto |
|---|---|
| Herencia | Al conquistar heredas el **70%** de la muralla enemiga (o el 60% de tu marca, lo que sea mayor) |
| Asedio | Cada ataque fallido debilita la plaza un **5%** |
| Decaimiento | Las guarniciones caen un **3% al día** si no se refuerzan |
| Tope | Ninguna plaza pasa de **130** de defensa: todo es conquistable |
| Energía | **6 ataques al día** por jugador |
| Sin bloqueo | Si te quedas sin territorios, puedes atacar cualquier punto del mapa |

El mundo nunca está vacío: los territorios sin dueño tienen **guarnición local** proporcional a su valor, y los pasos estratégicos (Gibraltar, Suez, Panamá, Bering…) defienden un 25% más.

## Estructura

```
├── index.html
├── css/styles.css
├── js/
│   ├── preguntas.js   500 preguntas y categorías
│   ├── mundo.js       73 territorios, fronteras y 41 rutas marítimas
│   ├── banderas.js    diseñador heráldico (972.000 combinaciones)
│   ├── fx.js          tambores de guerra, sonido y efectos
│   ├── firebase.js    configuración
│   ├── juego.js       motor: guarniciones, alcance, conquista
│   ├── app.js         pantallas y batalla
│   └── instalar.js    instalación como app
├── firestore.rules
├── sw.js · manifest.webmanifest · vercel.json
└── assets/  mapa, comandantes, logo, música
```

Para añadir territorios o cambiar fronteras solo se edita `js/mundo.js`.

## Puesta en marcha

**GitHub → Vercel:** sube el contenido del repo, importa en Vercel con preset *Other* y despliega. Sin build.

**Firebase (obligatorio):** consola → Firestore Database → pestaña **Rules** → pega `firestore.rules` → *Publish*. Sin esto, el mapa no cargará.

Los datos viajan en la colección `cq_terr`, un documento por territorio con `cod` (código del jugador), `jn` (nombre), `jb` (bandera), `jc` (comandante), `g` (guarnición) y `ts` (fecha). No se guardan imágenes ni datos personales.

## Equilibrio (simulado sobre 3.000 batallas)

| Defensa | Novato | Medio | Experto |
|---|---|---|---|
| Aldea (28) | 84% | 98% | 100% |
| Provincia (48) | 65% | 90% | 100% |
| Gran plaza (70) | 37% | 72% | 97% |
| Reforzada (100) | 9% | 29% | 70% |
| Tope (130) | 1% | 3% | 11% |

## Siguiente fase (v2)

- Oro por territorio y **flotas** para cruzar océanos con coste
- **Temporadas** mensuales con reinicio y coronación
- Peaje en los pasos estratégicos
- Notificación cuando alguien te arrebate un territorio
- Más comandantes
