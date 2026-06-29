// Recetas de crafteo: combinaciones de ids de items -> id del item resultante.
// Son "shapeless": no importa la posición en la grilla, sino el conjunto exacto
// de ingredientes (cantidades incluidas). Editá/agregá recetas libremente.
export const craftingRecipes = [
  // { ingredients: ['book_int', 'book_dex', 'book_str'], result: 'sword' },
  { ingredients: ['sword_01', 'sword_01', 'jewel_01'], result: 'sword_10' },
  // { ingredients: ['shield_10', 'book_str'], result: 'shield' },
  // { ingredients: ['sword_01', 'book_dex'], result: 'bow' },
]

// Índice por clave normalizada (ingredientes ordenados) -> result.
const RECIPE_MAP = Object.fromEntries(
  craftingRecipes.map((r) => [[...r.ingredients].sort().join('+'), r.result])
)

// Devuelve el id del item resultante para una lista de ids (o null si no hay receta).
export function matchRecipe(ids) {
  const key = [...ids].filter(Boolean).sort().join('+')
  return RECIPE_MAP[key] || null
}
