// =============================================================================
// Atlas de tiles
// -----------------------------------------------------------------------------
// SUELOS: salen de `tiles.png` (banda superior, 8 texturas completas de ~135px).
//
// PAREDES: cada PNG de assets/walls se carga como su propia textura. Tras
// analizar las hojas, la grilla real de cada una es:
//
//   top-horizontal.png  -> 7x7 tiles de 132px.  X=[38,208,383,558,732,907,1081]
//                          Y=[35,202,374,545,715,881,1048]. Los 2 de la fila 0
//                          (cols 0 y 3) son LISOS y tilean sin costuras -> muros
//                          horizontales. El resto son variantes decoradas
//                          (puertas, ventanas, estandartes, antorchas, grietas).
//   top_vertical.png    -> es UN SOLO tile: se usa la imagen completa escalada
//                          a la celda (32x32) como cuerpo de muros verticales.
//   bottom_vertical.png -> 5 cols x 3 filas de 132px. X=[20,190,365,540,714].
//                          Fila 0 (y=18, cols 0/3/4) = LISOS -> cierre inferior
//                          de muros verticales. Filas y=358/529 = decoradas.
//
// IMPORTANTE: las coords son del CONTENIDO del tile (sin el margen oscuro que
// separa cada celda). Incluir el margen es lo que generaba las costuras feas.
// =============================================================================

// --- SUELOS (textura 'floors' = tiles.png) ---
const FLOOR_COL_X = [25, 179, 334, 487, 637, 791, 944, 1098]
export const FLOOR_FRAMES = FLOOR_COL_X.map((x, i) => ({
  name: `floor${i}`,
  x,
  y: 30,
  w: 135,
  h: 135,
}))

// --- MUROS HORIZONTALES lisos (textura 'wallH' = top-horizontal.png) ---
export const WALL_H_FRAMES = [
  { name: 'h0', x: 38, y: 35, w: 132, h: 132 },
  { name: 'h1', x: 558, y: 35, w: 132, h: 132 },
]

// Variantes decoradas para muros horizontales (aparecen de vez en cuando).
// Coords = fila 1 (y=202: puertas/ventanas) y fila 2 (y=374: estandartes/antorcha).
export const WALL_H_FEATURES = [
  { name: 'hf_window', x: 383, y: 202, w: 132, h: 132 }, // ventana con rejas
  { name: 'hf_arch', x: 907, y: 202, w: 132, h: 132 },   // arco / portal oscuro
  { name: 'hf_torch', x: 383, y: 374, w: 132, h: 132 },  // antorcha
  { name: 'hf_banner_r', x: 38, y: 374, w: 132, h: 132 }, // estandarte rojo
  { name: 'hf_banner_b', x: 208, y: 374, w: 132, h: 132 }, // estandarte azul
]

// --- MUROS VERTICALES (textura 'wallV' = top_vertical.png) ---
// Es un único tile: se usa la imagen completa (frame base de la textura),
// por eso no se registran sub-frames.

// --- MUROS VERTICALES, cierre inferior (textura 'wallB' = bottom_vertical.png) ---
export const WALL_B_FRAMES = [
  { name: 'b0', x: 20, y: 18, w: 132, h: 132 },
  { name: 'b1', x: 540, y: 18, w: 132, h: 132 },
  { name: 'b2', x: 714, y: 18, w: 132, h: 132 },
]

// Mapa textura -> frames, para registrarlos en el preload de Phaser.
// 'wallV' no lleva frames: se usa la imagen completa como tile único.
export const TEXTURE_FRAMES = {
  floors: FLOOR_FRAMES,
  wallH: [...WALL_H_FRAMES, ...WALL_H_FEATURES],
  wallB: WALL_B_FRAMES,
}
