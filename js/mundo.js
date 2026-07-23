/* ---------- EL MUNDO ---------- */

const REGIONES = {
  na:{n:"Norteamérica",c:"#D9531E"}, sa:{n:"Sudamérica",c:"#1E7A5F"}, eu:{n:"Europa",c:"#17A2A2"},
  af:{n:"África",c:"#DD9414"}, om:{n:"Oriente Medio",c:"#D6336C"}, ac:{n:"Asia Central",c:"#7A5AB8"},
  as:{n:"Asia",c:"#5B3FA8"}, oc:{n:"Oceanía",c:"#2B6CB0"}
};

const TERRITORIOS = [
  {id:"ala",n:"Alaska",x:52,y:122,r:"na",v:1,t:["cno"]},
  {id:"cno",n:"Canadá Oeste",x:217,y:163,r:"na",v:1,t:["ala","cse","uso"]},
  {id:"cse",n:"Canadá Este",x:395,y:177,r:"na",v:2,t:["cno","use"]},
  {id:"gro",n:"Groenlandia",x:541,y:86,r:"na",v:1,t:[]},
  {id:"uso",n:"EE. UU. Oeste",x:217,y:236,r:"na",v:3,t:["cno","use","mex"]},
  {id:"use",n:"EE. UU. Este",x:350,y:236,r:"na",v:3,t:["uso","cse","mex"]},
  {id:"mex",n:"México",x:275,y:308,r:"na",v:2,t:["uso","use","cam"]},
  {id:"cam",n:"Centroamérica",x:346,y:349,r:"na",v:1,t:["mex","col"]},
  {id:"car",n:"Caribe",x:403,y:326,r:"na",v:1,t:[]},
  {id:"col",n:"Colombia",x:399,y:394,r:"sa",v:2,t:["cam","ven","per","bra"]},
  {id:"ven",n:"Venezuela",x:435,y:381,r:"sa",v:1,t:["col","bra"]},
  {id:"per",n:"Perú",x:395,y:458,r:"sa",v:2,t:["col","bra","bol","chi"]},
  {id:"bra",n:"Brasil",x:501,y:458,r:"sa",v:3,t:["col","ven","per","bol","arg"]},
  {id:"bol",n:"Bolivia",x:443,y:490,r:"sa",v:1,t:["per","bra","chi","arg"]},
  {id:"chi",n:"Chile",x:412,y:562,r:"sa",v:2,t:["per","bol","arg","pat"]},
  {id:"arg",n:"Argentina",x:443,y:567,r:"sa",v:2,t:["bra","bol","chi","pat"]},
  {id:"pat",n:"Patagonia",x:417,y:630,r:"sa",v:1,t:["chi","arg"]},
  {id:"isl",n:"Islandia",x:643,y:118,r:"eu",v:1,t:[]},
  {id:"rui",n:"Reino Unido",x:719,y:168,r:"eu",v:2,t:[]},
  {id:"esc",n:"Escandinavia",x:794,y:131,r:"eu",v:2,t:["fin","rue"]},
  {id:"fin",n:"Finlandia",x:843,y:122,r:"eu",v:1,t:["esc","rue"]},
  {id:"pba",n:"Países Bajos",x:750,y:177,r:"eu",v:2,t:["ale","fra"]},
  {id:"ale",n:"Alemania",x:772,y:181,r:"eu",v:3,t:["pba","fra","pol","ita","bal"]},
  {id:"pol",n:"Polonia",x:812,y:177,r:"eu",v:2,t:["ale","bal","ucr","rue"]},
  {id:"fra",n:"Francia",x:737,y:199,r:"eu",v:3,t:["pba","ale","esp","ita"]},
  {id:"esp",n:"España",x:710,y:231,r:"eu",v:3,t:["fra","por"]},
  {id:"por",n:"Portugal",x:692,y:236,r:"eu",v:1,t:["esp"]},
  {id:"ita",n:"Italia",x:781,y:222,r:"eu",v:2,t:["fra","ale","bal"]},
  {id:"bal",n:"Balcanes",x:817,y:213,r:"eu",v:2,t:["ale","pol","ita","gre","ucr"]},
  {id:"gre",n:"Grecia",x:826,y:236,r:"eu",v:1,t:["bal","tur"]},
  {id:"ucr",n:"Ucrania",x:866,y:190,r:"eu",v:2,t:["pol","bal","rue"]},
  {id:"rue",n:"Rusia Europea",x:906,y:159,r:"eu",v:3,t:["fin","esc","pol","ucr","cau","kaz","sio"]},
  {id:"mar",n:"Marruecos",x:701,y:267,r:"af",v:1,t:["arg2","sah"]},
  {id:"arg2",n:"Argelia",x:741,y:286,r:"af",v:1,t:["mar","lib","sah"]},
  {id:"lib",n:"Libia",x:803,y:290,r:"af",v:1,t:["arg2","egi","sah"]},
  {id:"egi",n:"Egipto",x:861,y:290,r:"af",v:3,t:["lib","sah","lev"]},
  {id:"sah",n:"Sahel",x:772,y:345,r:"af",v:1,t:["mar","arg2","lib","egi","occ","nig","etp","con"]},
  {id:"occ",n:"África Occidental",x:683,y:349,r:"af",v:1,t:["sah","nig"]},
  {id:"nig",n:"Nigeria",x:763,y:372,r:"af",v:2,t:["occ","sah","con"]},
  {id:"con",n:"Congo",x:826,y:426,r:"af",v:2,t:["nig","sah","etp","ken","ang"]},
  {id:"etp",n:"Etiopía",x:901,y:372,r:"af",v:1,t:["sah","con","ken"]},
  {id:"ken",n:"Kenia",x:892,y:413,r:"af",v:1,t:["etp","con","ang","sud"]},
  {id:"ang",n:"Angola",x:808,y:467,r:"af",v:1,t:["con","ken","sud"]},
  {id:"sud",n:"Sudáfrica",x:834,y:544,r:"af",v:2,t:["ang","ken"]},
  {id:"mad",n:"Madagascar",x:937,y:499,r:"af",v:1,t:[]},
  {id:"tur",n:"Turquía",x:883,y:236,r:"om",v:3,t:["gre","cau","lev","irq"]},
  {id:"cau",n:"Cáucaso",x:928,y:222,r:"om",v:1,t:["tur","rue","irn"]},
  {id:"lev",n:"Levante",x:892,y:263,r:"om",v:1,t:["tur","egi","irq","ara"]},
  {id:"irq",n:"Irak",x:923,y:263,r:"om",v:1,t:["tur","lev","irn","ara"]},
  {id:"ara",n:"Arabia",x:928,y:304,r:"om",v:2,t:["lev","irq","gol"]},
  {id:"gol",n:"Golfo",x:963,y:299,r:"om",v:2,t:["ara","irn"]},
  {id:"irn",n:"Irán",x:968,y:267,r:"om",v:2,t:["cau","irq","gol","afg","pak","uzb"]},
  {id:"kaz",n:"Kazajistán",x:1030,y:195,r:"ac",v:1,t:["rue","uzb","sio","chn"]},
  {id:"uzb",n:"Asia Central",x:1012,y:227,r:"ac",v:1,t:["kaz","afg","irn"]},
  {id:"afg",n:"Afganistán",x:1021,y:258,r:"ac",v:1,t:["uzb","irn","pak"]},
  {id:"sio",n:"Siberia Oeste",x:1083,y:141,r:"ac",v:1,t:["rue","kaz","sie","mon","chn"]},
  {id:"sie",n:"Siberia Este",x:1261,y:131,r:"ac",v:1,t:["sio","mon","chn"]},
  {id:"pak",n:"Pakistán",x:1039,y:281,r:"as",v:1,t:["afg","irn","ind"]},
  {id:"ind",n:"India",x:1074,y:313,r:"as",v:3,t:["pak","him","ind2"]},
  {id:"him",n:"Himalaya",x:1106,y:281,r:"as",v:1,t:["ind","chn"]},
  {id:"ind2",n:"Bengala",x:1128,y:304,r:"as",v:1,t:["ind","ich"]},
  {id:"chn",n:"China",x:1208,y:258,r:"as",v:3,t:["him","sio","sie","mon","cor","ich","kaz"]},
  {id:"mon",n:"Mongolia",x:1194,y:199,r:"as",v:1,t:["chn","sio","sie"]},
  {id:"cor",n:"Corea",x:1297,y:245,r:"as",v:1,t:["chn"]},
  {id:"jap",n:"Japón",x:1341,y:245,r:"as",v:2,t:[]},
  {id:"ich",n:"Indochina",x:1186,y:345,r:"as",v:2,t:["chn","ind2","mal"]},
  {id:"mal",n:"Malasia",x:1181,y:394,r:"as",v:1,t:["ich"]},
  {id:"idn",n:"Indonesia",x:1230,y:426,r:"as",v:2,t:[]},
  {id:"fil",n:"Filipinas",x:1270,y:354,r:"as",v:1,t:[]},
  {id:"auo",n:"Australia Oeste",x:1270,y:526,r:"oc",v:1,t:["aue"]},
  {id:"aue",n:"Australia Este",x:1381,y:535,r:"oc",v:2,t:["auo"]},
  {id:"nze",n:"Nueva Zelanda",x:1492,y:603,r:"oc",v:1,t:[]},
  {id:"pap",n:"Papúa",x:1372,y:440,r:"oc",v:1,t:[]}
];

/* c:1 estrecho · 2 travesía oceánica · 3 gran travesía */
const RUTAS = [
  {a:"esp",b:"mar",c:1,n:"Gibraltar"},
  {a:"gre",b:"tur",c:1,n:"Egeo"},
  {a:"bal",b:"tur",c:1,n:"Bósforo"},
  {a:"egi",b:"ara",c:1,n:"Suez"},
  {a:"gol",b:"pak",c:1,n:"Ormuz"},
  {a:"ara",b:"etp",c:1,n:"Bab el-Mandeb"},
  {a:"mal",b:"idn",c:1,n:"Malaca"},
  {a:"ich",b:"fil",c:1,n:"Luzón"},
  {a:"idn",b:"pap",c:1,n:"Arafura"},
  {a:"pap",b:"aue",c:1,n:"Torres"},
  {a:"cam",b:"col",c:1,n:"Panamá"},
  {a:"ala",b:"sie",c:1,n:"Bering"},
  {a:"rui",b:"fra",c:1,n:"Dover"},
  {a:"rui",b:"isl",c:1,n:"Mar de Irlanda"},
  {a:"isl",b:"gro",c:1,n:"Estrecho de Dinamarca"},
  {a:"gro",b:"cse",c:1,n:"Davis"},
  {a:"cor",b:"jap",c:1,n:"Corea"},
  {a:"chn",b:"jap",c:1,n:"Mar Amarillo"},
  {a:"chn",b:"fil",c:1,n:"Formosa"},
  {a:"mex",b:"car",c:1,n:"Yucatán"},
  {a:"car",b:"ven",c:1,n:"Antillas"},
  {a:"car",b:"use",c:1,n:"Florida"},
  {a:"mad",b:"sud",c:1,n:"Mozambique"},
  {a:"mad",b:"ken",c:1,n:"Índico Oeste"},
  {a:"esc",b:"rui",c:1,n:"Mar del Norte"},
  {a:"esc",b:"isl",c:1,n:"Mar de Noruega"},
  {a:"fin",b:"esc",c:1,n:"Báltico"},
  {a:"por",b:"mar",c:1,n:"Atlántico Ibérico"},
  {a:"idn",b:"auo",c:1,n:"Timor"},
  {a:"fil",b:"pap",c:1,n:"Célebes"},
  {a:"nze",b:"aue",c:1,n:"Tasmania"},
  {a:"chi",b:"pat",c:1,n:"Fiordos"},
  {a:"occ",b:"bra",c:2,n:"Atlántico Sur"},
  {a:"rui",b:"cse",c:2,n:"Atlántico Norte"},
  {a:"esp",b:"car",c:2,n:"Ruta de las Indias"},
  {a:"sud",b:"arg",c:2,n:"Atlántico Austral"},
  {a:"ara",b:"ind",c:2,n:"Índico"},
  {a:"sud",b:"auo",c:2,n:"Índico Sur"},
  {a:"jap",b:"uso",c:3,n:"Pacífico Norte"},
  {a:"aue",b:"chi",c:3,n:"Pacífico Sur"},
  {a:"pat",b:"nze",c:3,n:"Paso de Drake"}
];

const T_POR_ID = {};
TERRITORIOS.forEach(t => T_POR_ID[t.id] = t);

/* vecinos totales: tierra + rutas marítimas */
const VECINOS = {};
TERRITORIOS.forEach(t => VECINOS[t.id] = new Set(t.t));
RUTAS.forEach(r => { VECINOS[r.a].add(r.b); VECINOS[r.b].add(r.a); });

function rutaEntre(a, b){
  return RUTAS.find(r => (r.a===a && r.b===b) || (r.a===b && r.b===a)) || null;
}
function esVecino(a, b){ return VECINOS[a] && VECINOS[a].has(b); }
function territorio(id){ return T_POR_ID[id]; }
