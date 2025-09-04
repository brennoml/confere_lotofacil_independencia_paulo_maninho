// Valores padrão dos prêmios (podem ser atualizados pelo usuário)
let prizeValues = {
  11: 7,
  12: 14,
  13: 35,
  14: 2000,
  15: 2500000
};

// Tabela de prêmios múltiplos conforme regras da Caixa
const prizeMultipliers = {
  16: {
    15: [{ category: 15, count: 1 }, { category: 14, count: 15 }],
    14: [{ category: 14, count: 2 }, { category: 13, count: 14 }],
    13: [{ category: 13, count: 3 }, { category: 12, count: 13 }],
    12: [{ category: 12, count: 4 }, { category: 11, count: 12 }],
    11: [{ category: 11, count: 5 }]
  },
  17: {
    15: [{ category: 15, count: 1 }, { category: 14, count: 30 }, { category: 13, count: 240 }],
    14: [{ category: 14, count: 3 }, { category: 13, count: 42 }, { category: 12, count: 189 }],
    13: [{ category: 13, count: 6 }, { category: 12, count: 65 }, { category: 11, count: 294 }],
    12: [{ category: 12, count: 10 }, { category: 11, count: 100 }],
    11: [{ category: 11, count: 15 }]
  },
  18: {
    15: [{ category: 15, count: 1 }, { category: 14, count: 45 }, { category: 13, count: 540 }, { category: 12, count: 1890 }],
    14: [{ category: 14, count: 4 }, { category: 13, count: 84 }, { category: 12, count: 504 }, { category: 11, count: 1575 }],
    13: [{ category: 13, count: 10 }, { category: 12, count: 130 }, { category: 11, count: 882 }],
    12: [{ category: 12, count: 20 }, { category: 11, count: 220 }],
    11: [{ category: 11, count: 30 }]
  },
  19: {
    15: [{ category: 15, count: 1 }, { category: 14, count: 60 }, { category: 13, count: 900 }, { category: 12, count: 4536 }, { category: 11, count: 9450 }],
    14: [{ category: 14, count: 5 }, { category: 13, count: 140 }, { category: 12, count: 1008 }, { category: 11, count: 4410 }],
    13: [{ category: 13, count: 15 }, { category: 12, count: 210 }, { category: 11, count: 1890 }],
    12: [{ category: 12, count: 35 }, { category: 11, count: 495 }],
    11: [{ category: 11, count: 56 }]
  },
  20: {
    15: [{ category: 15, count: 1 }, { category: 14, count: 75 }, { category: 13, count: 1350 }, { category: 12, count: 8505 }, { category: 11, count: 25200 }],
    14: [{ category: 14, count: 6 }, { category: 13, count: 210 }, { category: 12, count: 1890 }, { category: 11, count: 9240 }],
    13: [{ category: 13, count: 21 }, { category: 12, count: 330 }, { category: 11, count: 3564 }],
    12: [{ category: 12, count: 56 }, { category: 11, count: 990 }],
    11: [{ category: 11, count: 112 }]
  }
};

const prizeCategories = [15, 14, 13, 12, 11];
