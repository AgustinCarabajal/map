// Arreglo estático de XP acumulada por Nivel (Índice = Nivel)
export const LEVEL_XP = [
  0, // Nivel 0 (No usado)
  0, // Nivel 1
  50, // Nivel 2
  141, // Nivel 3
  259, // Nivel 4
  400, // Nivel 5
  562, // Nivel 6
  743, // Nivel 7
  942, // Nivel 8
  1157, // Nivel 9
  1388, // Nivel 10
  1635, // Nivel 11
  1896, // Nivel 12
  2171, // Nivel 13
  2460, // Nivel 14
  2762, // Nivel 15
  3077, // Nivel 16
  3405, // Nivel 17
  3745, // Nivel 18
  4097, // Nivel 19
  4461, // Nivel 20
  4836, // Nivel 21
  5222, // Nivel 22
  5619, // Nivel 23
  6027, // Nivel 24
  6445, // Nivel 25
  6874, // Nivel 26
  7313, // Nivel 27
  7762, // Nivel 28
  8221, // Nivel 29
  8690, // Nivel 30
  9168, // Nivel 31
  9656, // Nivel 32
  10153, // Nivel 33
  10659, // Nivel 34
  11174, // Nivel 35
  11698, // Nivel 36
  12229, // Nivel 37
  12769, // Nivel 38
  13317, // Nivel 39
  13872, // Nivel 40
  14436, // Nivel 41
  15007, // Nivel 42
  15586, // Nivel 43
  16172, // Nivel 44
  16766, // Nivel 45
  17367, // Nivel 46
  17975, // Nivel 47
  18591, // Nivel 48
  19213, // Nivel 49
  19843, // Nivel 50
  20480, // Nivel 51
  21123, // Nivel 52
  21774, // Nivel 53
  22431, // Nivel 54
  23095, // Nivel 55
  23766, // Nivel 56
  24443, // Nivel 57
  25127, // Nivel 58
  25817, // Nivel 59
  26514, // Nivel 60
  27218, // Nivel 61
  27928, // Nivel 62
  28644, // Nivel 63
  29367, // Nivel 64
  30096, // Nivel 65
  30831, // Nivel 66
  31572, // Nivel 67
  32320, // Nivel 68
  33073, // Nivel 69
  33833, // Nivel 70
  34598, // Nivel 71
  35370, // Nivel 72
  36147, // Nivel 73
  36931, // Nivel 74
  37720, // Nivel 75
  38515, // Nivel 76
  39316, // Nivel 77
  40123, // Nivel 78
  40935, // Nivel 79
  41753, // Nivel 80
  42577, // Nivel 81
  43406, // Nivel 82
  44241, // Nivel 83
  45081, // Nivel 84
  45927, // Nivel 85
  46779, // Nivel 86
  47636, // Nivel 87
  48498, // Nivel 88
  49366, // Nivel 89
  50239, // Nivel 90
  51118, // Nivel 91
  52002, // Nivel 92
  52891, // Nivel 93
  53786, // Nivel 94
  54686, // Nivel 95
  55591, // Nivel 96
  56501, // Nivel 97
  57416, // Nivel 98
  58336, // Nivel 99
  59262, // Nivel 100
];

// Función para obtener el nivel a partir de la XP acumulada
export function getLevelFromXP(xp) {
  for (let lvl = LEVEL_XP.length - 1; lvl >= 1; lvl--) {
    if (xp >= LEVEL_XP[lvl]) {
      return lvl;
    }
  }
  return 1;
}
