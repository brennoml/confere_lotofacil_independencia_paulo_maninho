// Este arquivo foi limpo para evitar conflitos com a lógica de geração de PDF em script.js.
// A função generatePDFReport() e suas funções auxiliares agora residem em script.js.
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

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("Relatório de Premiações - Lotofácil da Independência", doc.internal.pageSize.width / 2, 20, { align: 'center' });
  
  if (selectedOnly) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text("Exibindo apenas os jogos selecionados.", doc.internal.pageSize.width / 2, 26, { align: 'center' });
  }

  // Bolas Sorteadas
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Números Sorteados:", 14, 40);
  
  // Desenhar bolas
  const ballRadius = 3.5;
  const ballSpacing = 3;
  const totalBallsWidth = drawnNumbers.length * (ballRadius * 2 + ballSpacing) - ballSpacing;
  const startX = 14;
  let currentX = startX;
  
  drawnNumbers.forEach(num => {
    doc.setFillColor(0, 102, 204);
    doc.setDrawColor(0, 0, 0);
    doc.circle(currentX + ballRadius, 48, ballRadius, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(num.toString(), currentX + ballRadius, 48, { align: 'center', baseline: 'middle' });
    
    currentX += ballRadius * 2 + ballSpacing;
  });

  let currentY = 60;

  // Calcula o resumo de prêmios
  const summary = calculatePrizeSummary(gamesToReport);

  // Adiciona Resumo da Premiação
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Resumo da Premiação", 14, currentY);
  currentY += 8;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Arrecadado: `, 14, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatCurrency(summary.totalPrize)}`, 48, currentY);
  currentY += 5;
  
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
        `${count} prêmio${plural}`,
        formatCurrency(categoryPrize)
      ]);
    }
  });

  if (prizeBreakdownBody.length > 0) {
    doc.autoTable({
      startY: currentY,
      head: [['Faixa de Acertos', 'Nº de Prêmios', 'Valor Total na Faixa']],
      body: prizeBreakdownBody,
      theme: 'striped',
      headStyles: { fillColor: [44, 62, 80], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });
    currentY = doc.lastAutoTable.finalY + 10;
  } else {
    currentY += 5;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Detalhes dos Jogos Premiados", 14, currentY);
  let lastY = currentY + 5;

  if (viewByGame) {
    const bodyData = gamesToReport.map(jogo => {
      const gameId = `Jogo ${jogo.numero_jogo + 1}`;
      const prizeDetails = jogo.prizes.map(p => `${p.count}x ${p.category} acertos`).join(' | ');
      const totalPrizeForGame = showValues ? formatCurrency(jogo.prizes.reduce((sum, p) => sum + (p.count * prizeValues[p.category]), 0)) : 'N/A';
      return [gameId, prizeDetails, totalPrizeForGame];
    });

    doc.autoTable({
      startY: lastY,
      head: [['Jogo', 'Prêmios Ganhos', 'Valor Total do Jogo']],
      body: bodyData,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });

  } else {
    prizeCategories.forEach(tier => {
      const gamesInTier = gamesToReport.filter(jogo => 
        jogo.prizes.some(p => p.category === tier)
      );

      if (gamesInTier.length > 0) {
        const bodyData = gamesInTier.map(jogo => {
          const prizeDetails = jogo.prizes.map(p => `${p.count}x ${p.category} acertos`).join(' | ');
          return {
            id: `Jogo ${jogo.numero_jogo + 1}`,
            numbers: jogo.numeros, // Passa os números para o hook
            prizes: prizeDetails
          };
        });

        if (bodyData.length > 0) {
          doc.autoTable({
            startY: lastY,
            head: [[`Jogos com ${tier} acertos`, 'Números do Jogo', 'Prêmios Ganhos']],
            body: bodyData.map(d => [d.id, '', d.prizes]), // Coluna de números fica vazia
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80], fontSize: 10 },
            styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
            margin: { left: 14, right: 14 },
            didDrawCell: (data) => {
              if (data.section === 'body' && data.column.index === 1) {
                const jogo = bodyData[data.row.index];
                const cell = data.cell;
                let x = cell.x + cell.padding('left');
                const y = cell.y + cell.height / 2 + 1; // Centralizado verticalmente

                jogo.numbers.forEach((num, index) => {
                  const isHit = drawnNumbers.includes(num);
                  doc.setFont('helvetica', isHit ? 'bold' : 'normal');
                  
                  const text = num.toString() + (index < jogo.numbers.length - 1 ? ', ' : '');
                  doc.text(text, x, y);
                  x += doc.getTextWidth(text);
                });
              }
            },
            didDrawPage: (data) => {
              lastY = data.cursor.y;
            }
          });
          lastY = doc.lastAutoTable.finalY + 5;
        }
      }
    });
  }

  addPageNumbers(doc);

  const fileName = selectedOnly ? 'relatorio_selecionado_lotofacil.pdf' : 'relatorio_completo_lotofacil.pdf';
  doc.save(fileName);
}

function addPageNumbers(doc) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }
}
