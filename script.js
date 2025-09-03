document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado, vinculando eventos...');

  let showValues = false;
  let showAllGames = false;
  let showPrizeConfig = false;
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

  // Helper functions for formatting
  const formatValue = (value) => {
    if (isNaN(parseFloat(value))) return '';
    return Number(value).toLocaleString('de-DE');
  };
  const unformatValue = (value) => String(value).replace(/\./g, '');

  // Altere o título principal, se existir
  const titulo = document.querySelector('h1');
  if (titulo) {
    titulo.textContent = 'Lotofácil da Independência';
  }

  // Navegação com setas entre os campos de entrada
  document.addEventListener("keydown", (event) => {
    const fields = document.querySelectorAll("input[type='number']");
    let currentIndex = -1;
    fields.forEach((field, index) => {
      if (document.activeElement === field) {
        currentIndex = index;
      }
    });
    if (currentIndex !== -1) {
      if (event.key === "ArrowLeft" && currentIndex > 0) {
        fields[currentIndex - 1].focus();
      } else if (event.key === "ArrowRight" && currentIndex < fields.length - 1) {
        fields[currentIndex + 1].focus();
      }
    }
  });

  // Adicionar eventos de input para todos os campos
  document.querySelectorAll("input[type='number']").forEach(input => {
    input.addEventListener('input', buscarJogos);
  });

  // Evento do botão Gerar Jogo Aleatório
  const randomGameButton = document.getElementById('random-game-button');
  if (randomGameButton) {
    randomGameButton.addEventListener('click', () => {
      console.log('Botão Gerar Jogo Aleatório clicado');
      gerarJogoAleatorio();
    });
  }

  // Evento do botão Limpar
  const clearButton = document.getElementById('clear-button');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      console.log('Botão Limpar clicado');
      limparCampos();
    });
  } else {
    console.warn("Botão com ID 'clear-button' não encontrado no DOM.");
  }

  // Evento do botão Listar Todos os Jogos
  const listAllGamesButton = document.getElementById('list-all-games-button');
  if (listAllGamesButton) {
    listAllGamesButton.addEventListener('click', () => {
      console.log('Botão Listar/Ocultar Todos os Jogos clicado');
      showAllGames = !showAllGames;
      const allGamesContainer = document.getElementById('all-games-container');

      if (showAllGames) {
        listAllGamesButton.textContent = 'Ocultar Nossos Jogos';
        if (allGamesContainer) allGamesContainer.style.display = 'block';
        listarTodosJogos();
      } else {
        listAllGamesButton.textContent = 'Listar Nossos Jogos';
        if (allGamesContainer) allGamesContainer.style.display = 'none';
      }
    });
  } else {
    console.warn("Botão com ID 'list-all-games-button' não encontrado no DOM.");
  }

  // Evento do botão Atualizar Valores
  const updatePrizesButton = document.getElementById('update-prizes-button');
  if (updatePrizesButton) {
    updatePrizesButton.addEventListener('click', () => {
      console.log('Botão Atualizar Valores clicado');
      updatePrizes();
      buscarJogos(); // Recalcula os resultados com os novos valores
    });
  }

  // Evento do botão Exibir/Ocultar Valores
  const toggleValuesButton = document.getElementById('toggle-values-button');
  if (toggleValuesButton) {
    toggleValuesButton.addEventListener('click', () => {
      showValues = !showValues;
      const valuesSection = document.getElementById('values-section');
      if (showValues) {
        valuesSection.style.display = 'block';
        toggleValuesButton.textContent = 'Ocultar Valores';
      } else {
        valuesSection.style.display = 'none';
        toggleValuesButton.textContent = 'Exibir Valores';
      }
      buscarJogos(); // Re-renderiza os resultados com ou sem valores
    });
  }

  // Evento do botão Ajustar Valores Estimados
  const togglePrizeConfigButton = document.getElementById('toggle-prize-config-button');
  if (togglePrizeConfigButton) {
    togglePrizeConfigButton.addEventListener('click', () => {
      showPrizeConfig = !showPrizeConfig;
      const prizeConfigContainer = document.querySelector('.prizes-container');
      if (showPrizeConfig) {
        prizeConfigContainer.style.display = 'block';
        togglePrizeConfigButton.textContent = 'Ocultar Ajuste de Valores';
      } else {
        prizeConfigContainer.style.display = 'none';
        togglePrizeConfigButton.textContent = 'Ajustar Valores Estimados';
      }
    });
  }

  // Formatação para campos de prêmio
  const prizeInputs = document.querySelectorAll('.prize-inputs input');
  prizeInputs.forEach(input => {
    input.value = formatValue(input.value);
    input.addEventListener('focus', () => {
      if (input.value) input.value = unformatValue(input.value);
    });
    input.addEventListener('blur', () => {
      if (input.value) input.value = formatValue(input.value);
    });
  });

  function gerarJogoAleatorio() {
    const numeros = new Set();
    while (numeros.size < 15) {
      numeros.add(Math.floor(Math.random() * 25) + 1);
    }
    
    const numerosSorteados = Array.from(numeros).sort((a, b) => a - b);

    for (let i = 0; i < 15; i++) {
      const input = document.getElementById(`sorteio-number${i + 1}`);
      if (input) {
        input.value = numerosSorteados[i];
      }
    }
    
    buscarJogos();
  }

  function updatePrizes() {
    prizeValues[11] = parseFloat(unformatValue(document.getElementById('prize-11').value)) || 0;
    prizeValues[12] = parseFloat(unformatValue(document.getElementById('prize-12').value)) || 0;
    prizeValues[13] = parseFloat(unformatValue(document.getElementById('prize-13').value)) || 0;
    prizeValues[14] = parseFloat(unformatValue(document.getElementById('prize-14').value)) || 0;
    prizeValues[15] = parseFloat(unformatValue(document.getElementById('prize-15').value)) || 0;
  }

  function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function buscarJogos() {
    // Obter dezenas do Sorteio (Lotofácil)
    const sorteioInputs = [];
    for (let i = 1; i <= 15; i++) {
      sorteioInputs.push(document.getElementById(`sorteio-number${i}`));
    }

    const numerosDigitados = sorteioInputs
      .map(input => parseInt(input.value))
      .filter(num => !isNaN(num));

    const winningGames = { 11: [], 12: [], 13: [], 14: [], 15: [] };
    const uniqueWinningGames = [];

    if (numerosDigitados.length === 15) {
      window.jogos.forEach(jogo => {
        const betSize = jogo.numeros.length;
        const acertos = numerosDigitados.filter(num => jogo.numeros.includes(num)).length;

        if (acertos >= 11) {
          let prizes = [];
          // Aposta simples de 15 dezenas
          if (betSize === 15) {
            prizes.push({ category: acertos, count: 1 });
          } 
          // Aposta múltipla (16 a 20 dezenas)
          else if (prizeMultipliers[betSize] && prizeMultipliers[betSize][acertos]) {
            prizes = prizeMultipliers[betSize][acertos];
          }

          if (prizes.length > 0) {
            const jogoPremiado = { 
              ...jogo, 
              dezenasSorteio: numerosDigitados,
              prizes: prizes
            };
            uniqueWinningGames.push(jogoPremiado);
            // Adiciona o jogo em cada categoria que ele ganhou prêmio
            prizes.forEach(p => {
              if (winningGames[p.category]) {
                winningGames[p.category].push(jogoPremiado);
              }
            });
          }
        }
      });
    }

    atualizarResultados(winningGames, uniqueWinningGames);
  }

  function atualizarResultados(winningGames, uniqueWinningGames) {
    const divs = {
      '11': document.getElementById('acertos-11'),
      '12': document.getElementById('acertos-12'),
      '13': document.getElementById('acertos-13'),
      '14': document.getElementById('acertos-14'),
      '15': document.getElementById('acertos-15'),
    };
    const totais = {
      '11': document.getElementById('total-11-acertos'),
      '12': document.getElementById('total-12-acertos'),
      '13': document.getElementById('total-13-acertos'),
      '14': document.getElementById('total-14-acertos'),
      '15': document.getElementById('total-15-acertos'),
    };
    const totaisJogos = {
      '11': document.getElementById('total-jogos-11'),
      '12': document.getElementById('total-jogos-12'),
      '13': document.getElementById('total-jogos-13'),
      '14': document.getElementById('total-jogos-14'),
      '15': document.getElementById('total-jogos-15'),
    };

    let totalPrize = 0;
    const totalHitsCount = { 11: 0, 12: 0, 13: 0, 14: 0, 15: 0 };

    // 1. Limpa as divs de resultado
    for (const key in divs) {
      if (divs[key]) divs[key].innerHTML = '';
    }

    // 2. Calcula os totais de prêmios e valores usando a lista de jogos únicos
    uniqueWinningGames.forEach(jogo => {
      jogo.prizes.forEach(p => {
        totalPrize += p.count * prizeValues[p.category];
        totalHitsCount[p.category] += p.count;
      });
    });

    // 3. Preenche as seções de exibição com os jogos
    for (const category in winningGames) {
      const jogos = winningGames[category];
      const div = divs[category];

      if (div) {
        jogos.forEach(jogo => {
          const linha = document.createElement('div');
          linha.innerHTML = formatarJogo(jogo, jogo.dezenasSorteio);
          div.appendChild(linha);
        });
      }
    }
    
    // 4. Atualiza os totais de cada categoria na tela
    for (const category in totais) {
      const totalDiv = totais[category];

      if (totalDiv) {
        const count = totalHitsCount[category];
        const gamesCount = winningGames[category] ? winningGames[category].length : 0;
        const categoryPrize = count * prizeValues[category];

        const pluralJogos = gamesCount !== 1 ? 's' : '';
        const verboGanhar = gamesCount !== 1 ? 'ganharam' : 'ganhou';
        const pluralPremios = count !== 1 ? 's' : '';
        
        let summaryText = `${gamesCount} Jogo${pluralJogos} ${verboGanhar} ${count} prêmio${pluralPremios}`;

        if (showValues && count > 0) {
          summaryText += ` no valor total de ${formatCurrency(categoryPrize)}`;
        }
        
        totalDiv.textContent = summaryText;
        
        const sectionDiv = document.getElementById(`acertos-${category}-section`);
        if (sectionDiv) {
          sectionDiv.style.display = count > 0 ? 'block' : 'none';
        }
      }
    }

    const totalPrizeDiv = document.getElementById('total-prize');
    if (totalPrizeDiv) {
      totalPrizeDiv.textContent = `Total Arrecadado: ${formatCurrency(totalPrize)}`;
    }

    const prizeBreakdownDiv = document.getElementById('prize-breakdown');
    if (prizeBreakdownDiv) {
      prizeBreakdownDiv.innerHTML = ''; // Limpa o detalhamento anterior
      const categories = [15, 14, 13, 12, 11];
      categories.forEach(cat => {
        const count = totalHitsCount[cat];
        if (count > 0) {
          const categoryPrize = count * prizeValues[cat];
          const plural = count > 1 ? 's' : '';
          const breakdownLine = document.createElement('div');
          breakdownLine.className = 'breakdown-line';
          breakdownLine.innerHTML = `<span class="breakdown-label">${cat} acertos:</span> <span class="breakdown-value">${formatCurrency(categoryPrize)} (${count} prêmio${plural})</span>`;
          prizeBreakdownDiv.appendChild(breakdownLine);
        }
      });
    }

    const winningGamesSection = document.getElementById('winning-games-section');
    if (winningGamesSection) {
      const hasWinners = Object.values(totalHitsCount).some(count => count > 0);
      winningGamesSection.style.display = hasWinners ? 'block' : 'none';
    }

    atualizarMensagem(totalHitsCount);
  }

  function formatarJogo(jogo, numerosDigitados) {
    const numerosFormatados = jogo.numeros.map(numero =>
      numerosDigitados.includes(numero)
        ? `<span class="highlight">${numero}</span>`
        : numero
    ).join(', ');

    let prizeDetails = '';
    if (jogo.prizes && jogo.prizes.length > 0) {
      const details = jogo.prizes
        .map(p => `${p.count}x ${p.category} acertos`)
        .join(', ');
      prizeDetails = `<span class="prize-details">(Ganhos: ${details})</span>`;
    }

    return `<span class="jogo-id">Jogo ${jogo.numero_jogo+1}: </span> ${numerosFormatados} ${prizeDetails}`;
  }

  function atualizarMensagem(totalHitsCount) {
    const resultMessage = document.getElementById('result-message');
    if (!resultMessage) return;

    if (showValues) {
      resultMessage.style.display = 'none';
      return;
    }
    resultMessage.style.display = 'block';

    const summaryLines = [];
    const categories = [15, 14, 13, 12, 11];
    let hasWinners = false;

    categories.forEach(cat => {
      const count = totalHitsCount[cat];
      if (count > 0) {
        hasWinners = true;
        const plural = count > 1 ? 's' : '';
        summaryLines.push(`<div>${count} prêmio${plural} de ${cat} acertos</div>`);
      }
    });

    if (hasWinners) {
      resultMessage.innerHTML = `<h3>Resumo dos Prêmios</h3>${summaryLines.join('')}`;
    } else {
      // Verifica se os números foram digitados antes de mostrar "Não foi dessa vez"
      const sorteioInputs = document.querySelectorAll(".input-container input[type='number']");
      const allFilled = Array.from(sorteioInputs).every(input => input.value !== '');
      
      if (allFilled) {
        resultMessage.textContent = "Não foi dessa vez.";
      } else {
        resultMessage.innerHTML = "Digite os números sorteados ou gere um jogo aleatório para testar sua sorte!";
      }
    }
  }

  function limparCampos() {
    console.log('Executando limparCampos');
    document.querySelectorAll("input[type='number']").forEach(input => {
      if (!input.id.startsWith('prize-')) {
        input.value = '';
      }
    });
    const resultMessage = document.getElementById('result-message');
    if (resultMessage) {
      resultMessage.textContent = "Digite os números sorteados ou gere um jogo aleatório para testar sua sorte!";
      resultMessage.style.display = 'block';
    }
    
    const ids = ['11', '12', '13', '14', '15'];
    ids.forEach(id => {
      const div = document.getElementById(`acertos-${id}`);
      if (div) div.innerHTML = '';
      const totalDiv = document.getElementById(`total-${id}-acertos`);
      if (totalDiv) totalDiv.textContent = '';
      const sectionDiv = document.getElementById(`acertos-${id}-section`);
      if (sectionDiv) sectionDiv.style.display = 'none';
    });

    const allGamesDiv = document.getElementById('all-games');
    if (allGamesDiv) allGamesDiv.innerHTML = '';
    const allGamesContainer = document.getElementById('all-games-container');
    if (allGamesContainer) allGamesContainer.style.display = 'none';
    const listAllGamesBtn = document.getElementById('list-all-games-button');
    if(listAllGamesBtn) listAllGamesBtn.textContent = 'Listar Nossos Jogos';
    showAllGames = false;

    const valuesSection = document.getElementById('values-section');
    if (valuesSection) valuesSection.style.display = 'none';
    
    const toggleBtn = document.getElementById('toggle-values-button');
    if(toggleBtn) toggleBtn.textContent = 'Exibir Valores';
    showValues = false;

    const prizeConfigContainer = document.querySelector('.prizes-container');
    if (prizeConfigContainer) prizeConfigContainer.style.display = 'none';
    const togglePrizeConfigBtn = document.getElementById('toggle-prize-config-button');
    if (togglePrizeConfigBtn) togglePrizeConfigBtn.textContent = 'Ajustar Valores Estimados';
    showPrizeConfig = false;

    const winningGamesSection = document.getElementById('winning-games-section');
    if (winningGamesSection) winningGamesSection.style.display = 'none';

    const totalPrizeDiv = document.getElementById('total-prize');
    if (totalPrizeDiv) {
      totalPrizeDiv.textContent = `Total Arrecadado: R$ 0,00`;
    }
    const prizeBreakdownDiv = document.getElementById('prize-breakdown');
    if (prizeBreakdownDiv) {
      prizeBreakdownDiv.innerHTML = '';
    }
  }

  function listarTodosJogos() {
    console.log('Executando listarTodosJogos');
    const allGamesDiv = document.getElementById('all-games');
    if (!allGamesDiv) {
      console.warn("Elemento com ID 'all-games' não encontrado no DOM.");
      return;
    }

    allGamesDiv.innerHTML = '';

    window.jogos.forEach(jogo => {
      const linha = document.createElement('div');
      linha.innerHTML = `<span class="jogo-id"> Jogo ${jogo.numero_jogo+1}: </span> ${jogo.numeros.join(', ')}`;
      allGamesDiv.appendChild(linha);
    });
  }
});