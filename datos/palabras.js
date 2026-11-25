/* =========================================================================
   PAREJAS QUE LEEN — DATOS EDITABLES
   =========================================================================
   Este es el único archivo que hace falta tocar para cambiar palabras,
   temáticas o la curva de dificultad.

   FORMATO DE CADA PAREJA:   ["emoji", "PALABRA"]
   - La palabra va en MAYÚSCULAS y con tilde si lleva (LIMÓN, AVIÓN).
   - Cuidado con las comas: cada pareja termina con coma.
   - Un mismo emoji o una misma palabra no deberían repetirse
     dentro de la misma temática.

   GRUPOS DE CADA TEMÁTICA:
   - cortas     → hasta 4 letras (SOL, PEZ, OSO, GATO)
   - medianas   → 5 o 6 letras
   - largas     → 7 letras o más
   - parecidas  → grupos de palabras que EMPIEZAN IGUAL.
                  Cada grupo va entre corchetes. Pueden repetir
                  palabras que ya estén en cortas/medianas/largas.

   Si a un grupo le faltan palabras para un nivel, el juego completa
   automáticamente con palabras del grupo vecino.

   IMPORTANTE: después de editar este archivo, subí el número de
   VERSION en sw.js (por ejemplo de "v1" a "v2") para que las tablets
   descarguen los cambios.
   ========================================================================= */

window.CONFIG = {
  vidas: 5,                 // vidas al empezar cada partida
  cambiarTemaCada: 3,       // la temática cambia cada X niveles
  mantenerParaLeer: 550,    // milisegundos apretando una palabra para que la lea en voz alta
  avanceAutomatico: 4500,   // milisegundos del festejo entre niveles antes de seguir solo (0 = no avanza solo)

  /* CURVA DE DIFICULTAD
     Un renglón por nivel. "tipo" puede ser un grupo o varios mezclados.
     Después del último renglón, se repite el último. */
  niveles: [
    { parejas: 3, tipo: ["cortas"] },               // 1
    { parejas: 3, tipo: ["cortas"] },               // 2
    { parejas: 4, tipo: ["cortas"] },               // 3
    { parejas: 4, tipo: ["cortas", "medianas"] },   // 4
    { parejas: 5, tipo: ["medianas"] },             // 5
    { parejas: 5, tipo: ["medianas"] },             // 6
    { parejas: 6, tipo: ["medianas", "largas"] },   // 7
    { parejas: 6, tipo: ["largas"] },               // 8
    { parejas: 6, tipo: ["parecidas"] },            // 9
    { parejas: 7, tipo: ["parecidas"] },            // 10
    { parejas: 8, tipo: ["parecidas"] }             // 11 en adelante
  ]
};

window.TEMAS = {

  ANIMALES: {
    icono: "🐾",
    cortas: [
      ["🐻", "OSO"], ["🐟", "PEZ"], ["🐱", "GATO"], ["🦆", "PATO"],
      ["🐸", "RANA"], ["🦁", "LEÓN"], ["🐮", "VACA"], ["🐺", "LOBO"],
      ["🐒", "MONO"], ["🦉", "BÚHO"], ["🐂", "TORO"], ["🦃", "PAVO"]
    ],
    medianas: [
      ["🐶", "PERRO"], ["🐭", "RATÓN"], ["🐝", "ABEJA"], ["🦒", "JIRAFA"],
      ["🐰", "CONEJO"], ["🐑", "OVEJA"], ["🐯", "TIGRE"], ["🦊", "ZORRO"],
      ["🐼", "PANDA"], ["🐨", "KOALA"], ["🐐", "CABRA"]
    ],
    largas: [
      ["🐴", "CABALLO"], ["🐔", "GALLINA"], ["🐢", "TORTUGA"], ["🐘", "ELEFANTE"],
      ["🐧", "PINGÜINO"], ["🦋", "MARIPOSA"], ["🐌", "CARACOL"], ["🐷", "CHANCHO"],
      ["🐊", "COCODRILO"], ["🦖", "DINOSAURIO"], ["🐫", "CAMELLO"]
    ],
    parecidas: [
      [["🦆", "PATO"], ["🦃", "PAVO"], ["🐼", "PANDA"], ["🕊️", "PALOMA"]],
      [["🐂", "TORO"], ["🐢", "TORTUGA"]],
      [["🐴", "CABALLO"], ["🐐", "CABRA"], ["🐫", "CAMELLO"], ["🐌", "CARACOL"]],
      [["🐶", "PERRO"], ["🐟", "PEZ"], ["🐧", "PINGÜINO"]],
      [["🐱", "GATO"], ["🐔", "GALLINA"], ["🐓", "GALLO"]],
      [["🐻", "OSO"], ["🐑", "OVEJA"]],
      [["🐰", "CONEJO"], ["🐊", "COCODRILO"]],
      [["🐒", "MONO"], ["🦟", "MOSQUITO"]]
    ]
  },

  FRUTAS: {
    icono: "🍎",
    cortas: [
      ["🍐", "PERA"], ["🍇", "UVA"], ["🥥", "COCO"], ["🥝", "KIWI"]
    ],
    medianas: [
      ["🍋", "LIMÓN"], ["🍈", "MELÓN"], ["🥭", "MANGO"], ["🥑", "PALTA"],
      ["🍍", "ANANÁ"], ["🍒", "CEREZA"], ["🍉", "SANDÍA"], ["🍌", "BANANA"],
      ["🍅", "TOMATE"]
    ],
    largas: [
      ["🍎", "MANZANA"], ["🍊", "NARANJA"], ["🍓", "FRUTILLA"], ["🍑", "DURAZNO"]
    ],
    parecidas: [
      [["🍎", "MANZANA"], ["🥭", "MANGO"], ["🍈", "MELÓN"]],
      [["🍐", "PERA"], ["🥑", "PALTA"]],
      [["🍒", "CEREZA"], ["🥥", "COCO"]],
      [["🍌", "BANANA"], ["🍓", "FRUTILLA"]],
      [["🍉", "SANDÍA"], ["🍅", "TOMATE"]],
      [["🍋", "LIMÓN"], ["🍊", "NARANJA"]],
      [["🍑", "DURAZNO"], ["🍇", "UVA"]]
    ]
  },

  CASA: {
    icono: "🏠",
    cortas: [
      ["🛏️", "CAMA"], ["🕯️", "VELA"], ["☕", "TAZA"], ["📺", "TELE"],
      ["🧲", "IMÁN"]
    ],
    medianas: [
      ["🪑", "SILLA"], ["🔑", "LLAVE"], ["⏰", "RELOJ"], ["🍽️", "PLATO"],
      ["📖", "LIBRO"], ["✏️", "LÁPIZ"], ["🧼", "JABÓN"], ["🚿", "DUCHA"],
      ["🎈", "GLOBO"], ["🚪", "PUERTA"], ["🛋️", "SILLÓN"], ["🧹", "ESCOBA"],
      ["🪞", "ESPEJO"], ["✂️", "TIJERA"], ["🎁", "REGALO"], ["🪴", "PLANTA"]
    ],
    largas: [
      ["🥄", "CUCHARA"], ["🪟", "VENTANA"], ["🧽", "ESPONJA"], ["🚽", "INODORO"],
      ["📞", "TELÉFONO"], ["🔦", "LINTERNA"], ["🛁", "BAÑADERA"], ["🧺", "CANASTA"]
    ],
    parecidas: [
      [["🪑", "SILLA"], ["🛋️", "SILLÓN"]],
      [["🧹", "ESCOBA"], ["🪞", "ESPEJO"], ["🧽", "ESPONJA"]],
      [["📺", "TELE"], ["📞", "TELÉFONO"], ["✂️", "TIJERA"]],
      [["🍽️", "PLATO"], ["🪴", "PLANTA"]],
      [["🛏️", "CAMA"], ["🧺", "CANASTA"]],
      [["🕯️", "VELA"], ["🪟", "VENTANA"]],
      [["📖", "LIBRO"], ["🔦", "LINTERNA"], ["✏️", "LÁPIZ"]]
    ]
  },

  TRANSPORTES: {
    icono: "🚗",
    cortas: [
      ["🚗", "AUTO"], ["🚂", "TREN"], ["🚲", "BICI"], ["🚕", "TAXI"],
      ["🏍️", "MOTO"], ["🛸", "OVNI"]
    ],
    medianas: [
      ["✈️", "AVIÓN"], ["🚢", "BARCO"], ["🚚", "CAMIÓN"], ["🚀", "COHETE"],
      ["⛵", "VELERO"], ["🛶", "CANOA"], ["🚤", "LANCHA"], ["🚇", "SUBTE"]
    ],
    largas: [
      ["🚌", "COLECTIVO"], ["🚁", "HELICÓPTERO"], ["🚑", "AMBULANCIA"],
      ["🚓", "PATRULLERO"], ["🚜", "TRACTOR"], ["🛴", "MONOPATÍN"],
      ["🛹", "PATINETA"], ["🛻", "CAMIONETA"]
    ],
    parecidas: [
      [["🚚", "CAMIÓN"], ["🛻", "CAMIONETA"], ["🛶", "CANOA"]],
      [["🚀", "COHETE"], ["🚌", "COLECTIVO"]],
      [["🚓", "PATRULLERO"], ["🛹", "PATINETA"]],
      [["🚂", "TREN"], ["🚜", "TRACTOR"], ["🚕", "TAXI"]],
      [["🏍️", "MOTO"], ["🛴", "MONOPATÍN"]],
      [["🚗", "AUTO"], ["✈️", "AVIÓN"], ["🚑", "AMBULANCIA"]],
      [["🚢", "BARCO"], ["🚲", "BICI"]]
    ]
  },

  MAR: {
    icono: "🌊",
    cortas: [
      ["🐟", "PEZ"], ["🌊", "OLA"], ["☀️", "SOL"], ["🏝️", "ISLA"],
      ["🦭", "FOCA"]
    ],
    medianas: [
      ["🐙", "PULPO"], ["⚓", "ANCLA"], ["🏖️", "PLAYA"], ["🐬", "DELFÍN"],
      ["🪣", "BALDE"], ["🦦", "NUTRIA"], ["🚢", "BARCO"]
    ],
    largas: [
      ["🦀", "CANGREJO"], ["🐳", "BALLENA"], ["🦈", "TIBURÓN"], ["🐢", "TORTUGA"],
      ["🦑", "CALAMAR"], ["🐚", "CARACOL"], ["🦞", "LANGOSTA"], ["🦐", "CAMARÓN"],
      ["🐧", "PINGÜINO"], ["🦩", "FLAMENCO"]
    ],
    parecidas: [
      [["🦀", "CANGREJO"], ["🦑", "CALAMAR"], ["🐚", "CARACOL"], ["🦐", "CAMARÓN"]],
      [["🐳", "BALLENA"], ["🪣", "BALDE"], ["🚢", "BARCO"]],
      [["🐙", "PULPO"], ["🏖️", "PLAYA"], ["🐟", "PEZ"], ["🐧", "PINGÜINO"]],
      [["🦈", "TIBURÓN"], ["🐢", "TORTUGA"]],
      [["🦭", "FOCA"], ["🦩", "FLAMENCO"]]
    ]
  },

  CUERPO: {
    icono: "🖐️",
    cortas: [
      ["👁️", "OJO"], ["🦶", "PIE"], ["✋", "MANO"], ["👄", "BOCA"],
      ["☝️", "DEDO"], ["💅", "UÑA"], ["🙂", "CARA"]
    ],
    medianas: [
      ["👃", "NARIZ"], ["👂", "OREJA"], ["🦷", "DIENTE"], ["👅", "LENGUA"],
      ["🦵", "PIERNA"], ["💪", "BRAZO"], ["🦴", "HUESO"], ["🧔", "BARBA"],
      ["👍", "PULGAR"]
    ],
    largas: [
      ["🧠", "CEREBRO"]
    ],
    parecidas: [
      [["🦶", "PIE"], ["🦵", "PIERNA"], ["👍", "PULGAR"]],
      [["👄", "BOCA"], ["💪", "BRAZO"], ["🧔", "BARBA"]],
      [["☝️", "DEDO"], ["🦷", "DIENTE"]],
      [["👁️", "OJO"], ["👂", "OREJA"]],
      [["🙂", "CARA"], ["🧠", "CEREBRO"]]
    ]
  }
};
