// --- FUNÇÕES DE ATUALIZAÇÃO DA UI ---

function updatePageTitle() {
  const titulo = document.querySelector('h1');
  if (titulo) {
    titulo.textContent = 'Lotofácil da Independência';
  }
}

function initializePrizeInputs() {
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
}

function atualizarResultados(winningGames, uniqueWinningGames) {
  // 1. Limpa a UI de resultados
  prizeCategories.forEach(cat => {
    const div = document.getElementById(`acertos-${cat}`);
    if (div) div.innerHTML = '';
  });

  // 2. Calcula os totais de prêmios
  const { totalPrize, totalHitsCount } = calculatePrizeSummary(uniqueWinningGames);

  // 3. Preenche as seções de exibição com os jogos e atualiza os totais
  prizeCategories.forEach(category => {
    updateCategoryUI(category, winningGames[category], totalHitsCount[category]);
  });
  updateByGameView(uniqueWinningGames);

  // 4. Atualiza o resumo geral de prêmios
  updateTotalsUI(totalPrize, totalHitsCount);

  // 5. Controla a visibilidade da seção de jogos premiados
  const winningGamesSection = document.getElementById('winning-games-section');
  if (winningGamesSection) {
    const hasWinners = Object.values(totalHitsCount).some(count => count > 0);
    winningGamesSection.style.display = hasWinners ? 'block' : 'none';
  }

  // 6. Atualiza a mensagem de status
  atualizarMensagem(totalHitsCount);
}

function updateByGameView(uniqueWinningGames) {
  const byGameSection = document.getElementById('by-game-section');
  if (!byGameSection) return;

  byGameSection.innerHTML = '';

  if (uniqueWinningGames.length === 0) return;

  uniqueWinningGames.forEach(jogo => {
    const totalPrizeForGame = jogo.prizes.reduce((sum, p) => sum + (p.count * prizeValues[p.category]), 0);

    const gameDiv = document.createElement('div');
    const isChecked = selectedGameIds.has(jogo.numero_jogo);
    const formattedGame = formatarJogo(jogo, jogo.dezenasSorteio, isChecked);
    
    let prizeSummary = '';
    if (showValues) {
      prizeSummary = `<div class="game-prize-summary">Total ganho no jogo: ${formatCurrency(totalPrizeForGame)}</div>`;
    }

    gameDiv.innerHTML = formattedGame + prizeSummary;
    byGameSection.appendChild(gameDiv);
  });
}

function updateCategoryUI(category, jogos, totalHitsInCategory) {
  const div = document.getElementById(`acertos-${category}`);
  const totalDiv = document.getElementById(`total-${category}-acertos`);
  const sectionDiv = document.getElementById(`acertos-${category}-section`);

  if (!div || !totalDiv || !sectionDiv) return;

  // Renderiza os jogos na categoria
  div.innerHTML = '';
  jogos.forEach(jogo => {
    const linha = document.createElement('div');
    const isChecked = selectedGameIds.has(jogo.numero_jogo);
    linha.innerHTML = formatarJogo(jogo, jogo.dezenasSorteio, isChecked);
    div.appendChild(linha);
  });

  // Atualiza o texto de resumo da categoria
  const gamesCount = jogos.length;
  const categoryPrize = totalHitsInCategory * prizeValues[category];

  const pluralJogos = gamesCount !== 1 ? 's' : '';
  const verboGanhar = gamesCount !== 1 ? 'ganharam' : 'ganhou';
  const pluralPremios = totalHitsInCategory !== 1 ? 's' : '';

  let summaryText = `${gamesCount} Jogo${pluralJogos} ${verboGanhar} ${totalHitsInCategory} prêmio${pluralPremios}`;
  if (showValues && totalHitsInCategory > 0) {
    summaryText += ` no valor total de ${formatCurrency(categoryPrize)}`;
  }
  totalDiv.textContent = summaryText;

  // Controla a visibilidade da seção
  sectionDiv.style.display = totalHitsInCategory > 0 ? 'block' : 'none';
}

function updateTotalsUI(totalPrize, totalHitsCount) {
  const totalPrizeDiv = document.getElementById('total-prize');
  if (totalPrizeDiv) {
    totalPrizeDiv.textContent = `Total Arrecadado: ${formatCurrency(totalPrize)}`;
  }

  const prizeBreakdownDiv = document.getElementById('prize-breakdown');
  if (prizeBreakdownDiv) {
    prizeBreakdownDiv.innerHTML = ''; // Limpa o detalhamento anterior
    prizeCategories.forEach(cat => {
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
}

function formatarJogo(jogo, numerosSorteados, isChecked) {
  const numerosFormatados = jogo.numeros.map(numero =>
    numerosSorteados.includes(numero)
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

  const checkboxId = `check-${jogo.numero_jogo}-${Math.random()}`; // ID único para o label
  const checkedAttr = isChecked ? 'checked' : '';

  return `
    <div class="game-line-container">
      <input type="checkbox" class="game-checkbox" id="${checkboxId}" data-jogo-id="${jogo.numero_jogo}" ${checkedAttr}>
      <label for="${checkboxId}"><span class="jogo-id">Jogo ${jogo.numero_jogo + 1}: </span> ${numerosFormatados} ${prizeDetails}</label>
    </div>
  `;
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
  let hasWinners = false;

  prizeCategories.forEach(cat => {
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
    const allFilled = getDrawnNumbers().length === 15;
    if (allFilled) {
      resultMessage.textContent = "Não foi dessa vez.";
    } else {
      resultMessage.innerHTML = "Digite os números sorteados ou gere um jogo aleatório para testar sua sorte!";
    }
  }
}

// --- FUNÇÕES DE CONTROLE DA UI (TOGGLES, LIMPEZA) ---

function limparCampos() {
  console.log('Executando limparCampos');
  // Limpa campos de sorteio
  document.querySelectorAll(".input-container input[type='number']").forEach(input => {
    input.value = '';
  });

  // Reseta a mensagem inicial
  const resultMessage = document.getElementById('result-message');
  if (resultMessage) {
    resultMessage.textContent = "Digite os números sorteados ou gere um jogo aleatório para testar sua sorte!";
    resultMessage.style.display = 'block';
  }

  // Limpa seções de resultados
  prizeCategories.forEach(id => {
    const sectionDiv = document.getElementById(`acertos-${id}-section`);
    if (sectionDiv) sectionDiv.style.display = 'none';
    const div = document.getElementById(`acertos-${id}`);
    if (div) div.innerHTML = '';
    const totalDiv = document.getElementById(`total-${id}-acertos`);
    if (totalDiv) totalDiv.textContent = '';
  });

  // Oculta e reseta a lista de todos os jogos
  const allGamesContainer = document.getElementById('all-games-container');
  if (allGamesContainer) allGamesContainer.style.display = 'none';
  const allGamesDiv = document.getElementById('all-games');
  if (allGamesDiv) allGamesDiv.innerHTML = '';
  document.getElementById('list-all-games-button').textContent = 'Listar Nossos Jogos';
  showAllGames = false;

  // Oculta e reseta a seção de valores
  document.getElementById('values-section').style.display = 'none';
  document.getElementById('toggle-values-button').textContent = 'Exibir Valores';
  showValues = false;

  // Oculta e reseta a configuração de prêmios
  document.querySelector('.prizes-container').style.display = 'none';
  document.getElementById('toggle-prize-config-button').textContent = 'Ajustar Valores Estimados';
  showPrizeConfig = false;

  // Oculta a seção de jogos premiados
  const winningGamesSection = document.getElementById('winning-games-section');
  if (winningGamesSection) winningGamesSection.style.display = 'none';

  // Reseta os totais e seleções
  updateTotalsUI(0, { 11: 0, 12: 0, 13: 0, 14: 0, 15: 0 });
  lastUniqueWinningGames = []; // Limpa os jogos salvos
  selectedGameIds.clear();
  updateSelectedGamesButton();
}

function displayAllGames() {
  showAllGames = !showAllGames;
  const allGamesContainer = document.getElementById('all-games-container');
  const listAllGamesButton = document.getElementById('list-all-games-button');

  if (showAllGames) {
    listarTodosJogos();
    allGamesContainer.style.display = 'block';
    listAllGamesButton.textContent = 'Ocultar Nossos Jogos';
  } else {
    document.getElementById('all-games').innerHTML = '';
    allGamesContainer.style.display = 'none';
    listAllGamesButton.textContent = 'Listar Nossos Jogos';
  }
}

function toggleValues() {
  showValues = !showValues;
  document.getElementById('values-section').style.display = showValues ? 'block' : 'none';
  document.getElementById('toggle-values-button').textContent = showValues ? 'Ocultar Valores' : 'Exibir Valores';
  buscarJogos(); // Recalcula para exibir/ocultar os valores nos resultados
}

function togglePrizeConfig() {
  showPrizeConfig = !showPrizeConfig;
  document.querySelector('.prizes-container').style.display = showPrizeConfig ? 'block' : 'none';
  document.getElementById('toggle-prize-config-button').textContent = showPrizeConfig ? 'Ocultar Ajustes' : 'Ajustar Valores Estimados';
}

function toggleWinningGamesView() {
  viewByGame = !viewByGame;
  const button = document.getElementById('toggle-view-button');
  const byHitsSection = document.getElementById('by-hits-section');
  const byGameSection = document.getElementById('by-game-section');

  if (viewByGame) {
    button.textContent = 'Exibir Prêmios por Acertos';
    byHitsSection.style.display = 'none';
    byGameSection.style.display = 'block';
  } else {
    button.textContent = 'Exibir Prêmios por Jogo';
    byHitsSection.style.display = 'block';
    byGameSection.style.display = 'none';
  }
}

function listarTodosJogos() {
  const allGamesDiv = document.getElementById('all-games');
  if (!allGamesDiv) return;

  allGamesDiv.innerHTML = '';
  window.jogos.forEach(jogo => {
    const linha = document.createElement('div');
    linha.innerHTML = `<span class="jogo-id"> Jogo ${jogo.numero_jogo + 1}: </span> ${jogo.numeros.join(', ')}`;
    allGamesDiv.appendChild(linha);
  });
}

// --- GESTÃO DE SELEÇÃO DE JOGOS ---

function clearSelection() {
  selectedGameIds.clear();
  document.querySelectorAll('.game-checkbox').forEach(box => {
    box.checked = false;
  });
  updateSelectedGamesButton();
}

function invertSelection() {
  const allWinningGameIds = new Set(lastUniqueWinningGames.map(g => g.numero_jogo));
  const newSelectedGameIds = new Set();

  allWinningGameIds.forEach(id => {
    if (!selectedGameIds.has(id)) {
      newSelectedGameIds.add(id);
    }
  });

  selectedGameIds = newSelectedGameIds;

  document.querySelectorAll('.game-checkbox').forEach(box => {
    const gameId = parseInt(box.dataset.jogoId, 10);
    box.checked = selectedGameIds.has(gameId);
  });

  updateSelectedGamesButton();
}

function updateSelectedGamesButton() {
  const selectedBtn = document.getElementById('generate-selected-pdf-button');
  const clearBtn = document.getElementById('limpar-selecao-button');
  const invertBtn = document.getElementById('inverter-selecao-button');
  const hasSelection = selectedGameIds.size > 0;

  if (selectedBtn) {
    selectedBtn.disabled = !hasSelection;
  }
  if (clearBtn) {
    clearBtn.disabled = !hasSelection;
  }
  if (invertBtn) {
    // O botão de inverter só faz sentido se houver jogos para inverter.
    invertBtn.disabled = lastUniqueWinningGames.length === 0;
  }
}
