document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado, inicializando aplicação...');

  // --- ESTADO DA APLICAÇÃO E CONFIGURAÇÕES ---

  let showValues = false;
  let showAllGames = false;
  let showPrizeConfig = false;
  let viewByGame = false;
  let lastUniqueWinningGames = []; // Armazena os jogos premiados da última busca
  let selectedGameIds = new Set(); // Armazena os IDs dos jogos selecionados

  // --- FUNÇÕES AUXILIARES ---

  const formatValue = (value) => {
    if (isNaN(parseFloat(value))) return '';
    return Number(value).toLocaleString('de-DE');
  };
  const unformatValue = (value) => String(value).replace(/\./g, '').replace(/,/g, '.');
  const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // --- INICIALIZAÇÃO ---

  function initialize() {
    setupEventListeners();
    updatePageTitle();
    initializePrizeInputs();
  }

  function setupEventListeners() {
    // Navegação com setas entre os campos de sorteio
    document.addEventListener("keydown", handleArrowNavigation);

    // Atualiza resultados ao digitar nos campos de sorteio
    document.querySelectorAll(".input-container input[type='number']").forEach(input => {
      input.addEventListener('input', buscarJogos);
    });

    // Botões principais
    document.getElementById('random-game-button').addEventListener('click', gerarJogoAleatorio);
    document.getElementById('clear-button').addEventListener('click', limparCampos);
    document.getElementById('list-all-games-button').addEventListener('click', displayAllGames);
    document.getElementById('toggle-values-button').addEventListener('click', toggleValues);

    // Botões da seção de resultados
    document.getElementById('generate-pdf-button').addEventListener('click', () => generatePDFReport(false));
    document.getElementById('generate-selected-pdf-button').addEventListener('click', () => generatePDFReport(true));
    document.getElementById('limpar-selecao-button').addEventListener('click', clearSelection);
    document.getElementById('inverter-selecao-button').addEventListener('click', invertSelection);
    document.getElementById('toggle-prize-config-button').addEventListener('click', togglePrizeConfig);
    document.getElementById('toggle-view-button').addEventListener('click', toggleWinningGamesView);
    document.getElementById('update-prizes-button').addEventListener('click', () => {
      updatePrizes();
      buscarJogos(); // Recalcula com os novos valores
    });
  }

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

  function handleArrowNavigation(event) {
    const fields = document.querySelectorAll(".input-container input[type='number']");
    const currentIndex = Array.from(fields).indexOf(document.activeElement);

    if (currentIndex === -1) return;

    if (event.key === "ArrowLeft" && currentIndex > 0) {
      fields[currentIndex - 1].focus();
    } else if (event.key === "ArrowRight" && currentIndex < fields.length - 1) {
      fields[currentIndex + 1].focus();
    }
  }

  // --- FUNÇÕES PRINCIPAIS DE LÓGICA ---

  function getDrawnNumbers() {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      const input = document.getElementById(`sorteio-number${i}`);
      if (input && input.value) {
        numbers.push(parseInt(input.value, 10));
      }
    }
    return numbers;
  }

  function buscarJogos() {
    const numerosSorteados = getDrawnNumbers();
    const winningGames = { 11: [], 12: [], 13: [], 14: [], 15: [] };
    const uniqueWinningGames = [];

    if (numerosSorteados.length === 15) {
      window.jogos.forEach(jogo => {
        const betSize = jogo.numeros.length;
        const acertos = numerosSorteados.filter(num => jogo.numeros.includes(num)).length;

        if (acertos >= 11) {
          let prizes = [];
          if (betSize === 15) {
            prizes.push({ category: acertos, count: 1 });
          } else if (prizeMultipliers[betSize] && prizeMultipliers[betSize][acertos]) {
            prizes = prizeMultipliers[betSize][acertos];
          }

          if (prizes.length > 0) {
            const jogoPremiado = { ...jogo, dezenasSorteio: numerosSorteados, prizes };
            uniqueWinningGames.push(jogoPremiado);
            prizes.forEach(p => {
              if (winningGames[p.category]) {
                winningGames[p.category].push(jogoPremiado);
              }
            });
          }
        }
      });
    }

    lastUniqueWinningGames = uniqueWinningGames; // Salva os resultados
    atualizarResultados(winningGames, uniqueWinningGames);
  }

  function gerarJogoAleatorio() {
    const numeros = new Set();
    while (numeros.size < 15) {
      numeros.add(Math.floor(Math.random() * 25) + 1);
    }
    const numerosSorteados = Array.from(numeros).sort((a, b) => a - b);

    numerosSorteados.forEach((num, i) => {
      const input = document.getElementById(`sorteio-number${i + 1}`);
      if (input) input.value = num;
    });

    buscarJogos();
  }

  function updatePrizes() {
    prizeCategories.forEach(cat => {
      const input = document.getElementById(`prize-${cat}`);
      if (input) {
        prizeValues[cat] = parseFloat(unformatValue(input.value)) || 0;
      }
    });
  }

  function calculatePrizeSummary(games) {
    const totalHitsCount = { 11: 0, 12: 0, 13: 0, 14: 0, 15: 0 };
    let totalPrize = 0;

    games.forEach(jogo => {
      jogo.prizes.forEach(p => {
        totalPrize += p.count * prizeValues[p.category];
        totalHitsCount[p.category] += p.count;
      });
    });

    return { totalPrize, totalHitsCount };
  }

  // --- FUNÇÕES DE ATUALIZAÇÃO DA UI ---

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

  document.getElementById('winning-games-section').addEventListener('change', (event) => {
    if (event.target.classList.contains('game-checkbox')) {
      const gameId = parseInt(event.target.dataset.jogoId, 10);
      const isChecked = event.target.checked;

      if (isChecked) {
        selectedGameIds.add(gameId);
      } else {
        selectedGameIds.delete(gameId);
      }

      // Sincroniza todos os checkboxes para o mesmo jogo
      document.querySelectorAll(`.game-checkbox[data-jogo-id="${gameId}"]`).forEach(box => {
        box.checked = isChecked;
      });

      updateSelectedGamesButton();
    }
  });

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

  // --- GERAÇÃO DE PDF ---

  function generatePDFReport(selectedOnly = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const drawnNumbers = getDrawnNumbers();

    if (drawnNumbers.length < 15) {
      alert("Por favor, insira os 15 números sorteados ou gere um jogo aleatório antes de criar um relatório.");
      return;
    }

    const gamesToReport = selectedOnly 
      ? lastUniqueWinningGames.filter(jogo => selectedGameIds.has(jogo.numero_jogo))
      : lastUniqueWinningGames;

    if (selectedOnly && gamesToReport.length === 0) {
      alert("Nenhum jogo selecionado para o relatório.");
      return;
    }

    // Título centralizado
    doc.setFontSize(16);
    doc.text("Relatório de Premiações - Lotofácil da Independência 2025", doc.internal.pageSize.width / 2, 22, { align: 'center' });
    
    if (selectedOnly) {
      doc.setFontSize(10);
      doc.text("Exibindo apenas os jogos selecionados.", 14, 32);
    }

    // Bolas Sorteadas
    doc.setFontSize(12);
    doc.text("Bolas Sorteadas:", doc.internal.pageSize.width / 2, 45, { align: 'center' });
    
    // Desenhar bolas
    const ballRadius = 4; // Raio menor
    const startX = (doc.internal.pageSize.width - (drawnNumbers.length * (ballRadius * 2 + 3))) / 2; // Centralizar com espaçamento menor
    let currentX = startX;
    drawnNumbers.forEach(num => {
      // Desenhar círculo
      doc.setFillColor(0, 102, 204); // Azul igual às bolas acertadas (#0066CC)
      doc.setDrawColor(0, 0, 0); // Preto
      doc.circle(currentX + ballRadius, 55, ballRadius, 'FD'); // 'FD' para preenchido e contorno
      
      // Texto dentro do círculo
      doc.setFont('helvetica', 'bold'); // Negrito
      doc.setFontSize(10); // Fonte maior para legibilidade
      doc.setTextColor(255, 255, 255); // Branco igual às bolas acertadas
      doc.text(num.toString(), currentX + ballRadius, 55, { align: 'center', baseline: 'middle' }); // Centralizar horizontal e verticalmente
      
      currentX += ballRadius * 2 + 3; // Espaçamento menor entre bolas
    });

    // Posição Y após as bolas
    let currentY = 75; // Ajuste para começar o resumo após as bolas

    // Calcula o resumo de prêmios com base nos jogos a serem reportados
    const summary = calculatePrizeSummary(gamesToReport);

    // Adiciona Resumo da Premiação
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 51, 153); // Azul escuro (#003399) igual ao site
    doc.text("Resumo da Premiação", doc.internal.pageSize.width / 2, currentY, { align: 'center' });
    currentY += 10;
    
    // Total Arrecadado com destaque e centralizado
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 102, 204); // Azul igual ao site
    doc.text(`Total Arrecadado: ${formatCurrency(summary.totalPrize)}`, doc.internal.pageSize.width / 2, currentY, { align: 'center' });
    currentY += 12;
    
    // Resetar fonte para o resto do conteúdo
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const prizeBreakdownBody = [];
    prizeCategories.forEach(cat => {
      const count = summary.totalHitsCount[cat];
      if (count > 0) {
        const categoryPrize = count * prizeValues[cat];
        const plural = count > 1 ? 's' : '';
        prizeBreakdownBody.push([
          `${cat} acertos`,
          formatCurrency(categoryPrize),
          `${count} prêmio${plural}`
        ]);
      }
    });

    if (prizeBreakdownBody.length > 0) {
      doc.autoTable({
        startY: currentY,
        head: [['Faixa de Acertos', 'Valor Total na Faixa', 'Nº de Prêmios']],
        body: prizeBreakdownBody,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133], fontSize: 9, cellPadding: 1.5 },
        styles: { fillColor: [248, 249, 250], fontSize: 9, cellPadding: 1.5 },
      });
      currentY = doc.lastAutoTable.finalY + 15;
    } else {
      currentY += 15; // Espaço se não houver tabela
    }

    doc.setFontSize(12);
    doc.text("Jogos Premiados", 14, currentY);
    let lastY = currentY + 15;

    if (viewByGame) {
      // Geração do PDF por Jogo
      const bodyData = gamesToReport.map(jogo => {
        const gameId = `Jogo ${jogo.numero_jogo + 1}`;
        // Os números acertados serão indicados com um asterisco (*) para simplificar a quebra de linha.
        const numbersText = jogo.numeros.map(n => drawnNumbers.includes(n) ? `${n}*` : n).join(', ');
        const prizeDetails = jogo.prizes.map(p => `${p.count}x ${p.category} acertos`).join(', ');
        const totalPrizeForGame = showValues ? formatCurrency(jogo.prizes.reduce((sum, p) => sum + (p.count * prizeValues[p.category]), 0)) : 'N/A';
        return [gameId, numbersText, prizeDetails, totalPrizeForGame];
      });

      doc.autoTable({
        startY: lastY,
        head: [['Jogo', 'Dezenas do Jogo (*acerto)', 'Prêmios Ganhos', 'Valor Total Ganho']],
        body: bodyData,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], fontSize: 9 },
        styles: { fillColor: [248, 249, 250], valign: 'middle', fontSize: 8 },
        // A biblioteca autoTable cuidará da quebra de linha automaticamente.
      });

    } else {
      // Geração do PDF por Acertos (comportamento original)
      prizeCategories.forEach(tier => {
        // Filtra os jogos para a categoria atual
        const gamesInTier = gamesToReport.filter(jogo => 
          jogo.prizes.some(p => p.category === tier)
        );

        if (gamesInTier.length > 0) {
          const bodyData = gamesInTier.map(jogo => {
            const gameIdText = `Jogo ${jogo.numero_jogo + 1}:`;
            const numbersText = jogo.numeros.map(n => drawnNumbers.includes(n) ? `${n}*` : n).join(', ');
            const gameInfo = `${gameIdText} ${numbersText}`;
            
            const prizeDetails = jogo.prizes.map(p => `${p.count}x ${p.category} acertos`).join(', ');

            return [gameInfo, prizeDetails];
          });

          if (bodyData.length > 0) {
            doc.autoTable({
              startY: lastY,
              head: [[`Jogos com ${tier} acertos (*acerto)`, 'Total de prêmios por Jogo']],
              body: bodyData,
              theme: 'grid',
              headStyles: { fillColor: [44, 62, 80], fontSize: 10 },
              styles: { fillColor: [248, 249, 250], fontSize: 9 }, // Fundo suave para células
            });
            lastY = doc.lastAutoTable.finalY;
          }
        }
      });
    }

    // Adiciona numeração de páginas
    addPageNumbers(doc);

    const fileName = selectedOnly ? 'relatorio_selecionado_lotofacil.pdf' : 'relatorio_completo_lotofacil.pdf';
    doc.save(fileName);
  }

  function addPageNumbers(doc) {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10); // Fonte maior para visibilidade
      doc.setTextColor(0, 0, 0); // Preto
      doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' }); // Rodapé centralizado
    }
  }

  // --- INICIA A APLICAÇÃO ---
  initialize();
});