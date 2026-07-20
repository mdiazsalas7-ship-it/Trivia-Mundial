/* ================= DATOS DEL JUEGO ================= */
const LOGO_IMG = "assets/logo.webp";
const DEPORTES_IMG = "assets/card-deportes.webp";

const CATS = {
  "Cultura":       { color:"#17A2A2", dark:"#0d6b6b", icon:"public",        pattern:"radial-gradient(#fff 2px, transparent 2px)", psize:"20px 20px" },
  "Ciencia":       { color:"#1E7A5F", dark:"#0f5340", icon:"science",       pattern:"repeating-linear-gradient(45deg,#fff,#fff 10px,transparent 10px,transparent 20px)", psize:"auto" },
  "Historia":      { color:"#DD9414", dark:"#8a5a08", icon:"history_edu",   pattern:"radial-gradient(circle at 50% 50%,#fff 2px,transparent 0)", psize:"15px 15px" },
  "Entretenimiento":{ color:"#D6336C", dark:"#8f1f47", icon:"movie",        pattern:"linear-gradient(0deg,#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", psize:"25px 25px" },
  "Deportes":      { color:"#D9531E", dark:"#8f3512", icon:"sports_soccer", img:DEPORTES_IMG },
  "Sorpresa":      { color:"#5B3FA8", dark:"#2d1d5e", icon:"question_mark", pattern:"radial-gradient(#fff 2px, transparent 2px)", psize:"18px 18px", x2:true }
};

const QS = [
 {c:"Cultura",q:"¿En qué ciudad está el Coliseo?",o:["Atenas","Roma","Estambul","Nápoles"],a:1},
 {c:"Cultura",q:"¿Qué civilización construyó Chichén Itzá?",o:["Inca","Azteca","Maya","Tolteca"],a:2},
 {c:"Cultura",q:"¿En qué país está el monte Everest?",o:["India","China","Nepal","Bután"],a:2},
 {c:"Cultura",q:"¿Cuál es la capital de Australia?",o:["Sídney","Melbourne","Canberra","Perth"],a:2},
 {c:"Cultura",q:"¿Qué país regaló la Estatua de la Libertad a EE. UU.?",o:["Reino Unido","España","Francia","Italia"],a:2},
 {c:"Cultura",q:"¿En qué país nació el tango?",o:["Uruguay","Argentina","Chile","Paraguay"],a:1},
 {c:"Ciencia",q:"¿Qué porcentaje de la Tierra está cubierto de agua, aprox.?",o:["50%","60%","70%","85%"],a:2},
 {c:"Ciencia",q:"¿Cuál es el punto más profundo del océano?",o:["Fosa de las Marianas","Fosa de Java","Fosa de Perú","Mar Muerto"],a:0},
 {c:"Ciencia",q:"¿Qué produce el choque de placas tectónicas?",o:["Mareas","Terremotos","Auroras","Eclipses"],a:1},
 {c:"Ciencia",q:"¿Cuál es el planeta más grande del sistema solar?",o:["Saturno","Júpiter","Neptuno","Urano"],a:1},
 {c:"Ciencia",q:"¿Cuántos corazones tiene un pulpo?",o:["1","2","3","4"],a:2},
 {c:"Ciencia",q:"¿Qué vitamina produce el cuerpo con el sol?",o:["A","B12","C","D"],a:3},
 {c:"Historia",q:"¿Qué imperio tuvo como capital a Tenochtitlán?",o:["Maya","Inca","Azteca","Olmeca"],a:2},
 {c:"Historia",q:"¿Qué ciudad quedó sepultada por el Vesubio?",o:["Roma","Pompeya","Atenas","Cartago"],a:1},
 {c:"Historia",q:"¿Quién fue el libertador de gran parte de Sudamérica?",o:["San Martín","Bolívar","Sucre","O'Higgins"],a:1},
 {c:"Historia",q:"¿En qué país comenzó la Revolución Industrial?",o:["Francia","Alemania","Reino Unido","EE. UU."],a:2},
 {c:"Historia",q:"¿Qué faraón es famoso por su tumba hallada intacta en 1922?",o:["Ramsés II","Tutankamón","Keops","Akenatón"],a:1},
 {c:"Historia",q:"¿Qué muro cayó en 1989?",o:["Muro de Adriano","Muro de Berlín","Gran Muralla","Muro de los Lamentos"],a:1},
 {c:"Entretenimiento",q:"¿Qué película animada transcurre en la tierra de los muertos mexicana?",o:["Encanto","Coco","El libro de la vida","Moana"],a:1},
 {c:"Entretenimiento",q:"¿En qué país nació el anime?",o:["China","Corea","Japón","Tailandia"],a:2},
 {c:"Entretenimiento",q:"¿Qué festival brasileño es famoso mundialmente?",o:["Oktoberfest","Carnaval de Río","Tomatina","Coachella"],a:1},
 {c:"Entretenimiento",q:"¿De qué país es la banda Coldplay?",o:["EE. UU.","Australia","Reino Unido","Irlanda"],a:2},
 {c:"Entretenimiento",q:"¿De qué país es el grupo BTS?",o:["Japón","Corea del Sur","China","Filipinas"],a:1},
 {c:"Entretenimiento",q:"¿Cómo se llama el reino de Elsa en Frozen?",o:["Arendelle","Corona","Dunbroch","Agrabah"],a:0},
 {c:"Deportes",q:"¿En qué país nacieron los Juegos Olímpicos?",o:["Italia","Grecia","Egipto","Turquía"],a:1},
 {c:"Deportes",q:"¿Qué país domina el rugby con los All Blacks?",o:["Australia","Sudáfrica","Nueva Zelanda","Fiyi"],a:2},
 {c:"Deportes",q:"¿Qué país inventó el taekwondo?",o:["Japón","China","Corea","Vietnam"],a:2},
 {c:"Deportes",q:"¿Dónde se juega el torneo de Wimbledon?",o:["París","Nueva York","Londres","Melbourne"],a:2},
 {c:"Deportes",q:"¿Qué selección ganó el Mundial de Qatar 2022?",o:["Francia","Brasil","Argentina","Croacia"],a:2},
 {c:"Deportes",q:"¿En qué año se celebró el primer Mundial de fútbol?",o:["1930","1950","1924","1934"],a:0},
 {c:"Sorpresa",q:"¿Cuántos husos horarios tiene Rusia?",o:["7","9","11","13"],a:2},
 {c:"Sorpresa",q:"¿Cuál es el país más pequeño del mundo?",o:["Mónaco","Vaticano","San Marino","Malta"],a:1},
 {c:"Sorpresa",q:"¿Qué país tiene una bandera que no es rectangular?",o:["Suiza","Nepal","Qatar","Chipre"],a:1},
 {c:"Sorpresa",q:"¿En qué país es de mala educación dejar propina?",o:["Japón","México","Italia","Brasil"],a:0},
 {c:"Sorpresa",q:"¿Qué país tiene más islas en el mundo?",o:["Indonesia","Filipinas","Suecia","Canadá"],a:2}
];

const RETOS = [
 "Saluda en 3 idiomas distintos",
 "Imita a un guía turístico presentando esta sala",
 "Di 5 capitales del mundo en 10 segundos",
 "Habla con el acento que elija el grupo hasta tu próximo turno",
 "Imita a un comentarista deportivo narrando este momento",
 "Nombra 5 comidas típicas de distintos países en 15 segundos",
 "Canta 10 segundos de una canción en otro idioma",
 "Di un trabalenguas sin equivocarte",
 "Baila un ritmo de otro país por 10 segundos",
 "¡Haz 10 sentadillas mientras cantas el himno de tu país!"
];

