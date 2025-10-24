import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BudgetRecord, BudgetLineProduct } from '../types/budget';
import type { CompanyProfile } from '../types/company';

type RGB = readonly [number, number, number];

const palette = {
  hero: [32, 35, 58] as RGB,
  accent: [220, 53, 69] as RGB,
  surface: [248, 249, 252] as RGB,
  border: [230, 233, 240] as RGB,
  text: [45, 55, 72] as RGB,
  muted: [117, 117, 117] as RGB,
};

const setFill = (doc: jsPDF, color: RGB) => doc.setFillColor(color[0], color[1], color[2]);
const setStroke = (doc: jsPDF, color: RGB) => doc.setDrawColor(color[0], color[1], color[2]);
const setText = (doc: jsPDF, color: RGB) => doc.setTextColor(color[0], color[1], color[2]);

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (iso?: string) => {
  if (!iso) return '-';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('pt-BR');
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '-';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString('pt-BR');
};

const drawHeroHeader = (
  doc: jsPDF,
  budget: BudgetRecord,
  company: CompanyProfile,
  marginLeft: number,
  marginRight: number,
) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  setFill(doc, palette.hero);
  doc.rect(0, 0, pageWidth, 150, 'F');

  setFill(doc, palette.accent);
  doc.rect(pageWidth - 180, -40, 260, 220, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  setText(doc, [255, 255, 255]);
  doc.text(company.name || 'Empresa', marginLeft, 58);

  const companyLines = [
    company.address,
    company.phone,
    company.email,
    company.website,
  ].filter(Boolean) as string[];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  companyLines.forEach((line, index) => {
    doc.text(line, marginLeft, 78 + index * 12);
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Orçamento comercial', marginRight, 40, { align: 'right' });

  doc.setFontSize(28);
  doc.text(formatCurrency(budget.total), marginRight, 68, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Código: ${budget.codigo}`, marginRight, 88, { align: 'right' });
  doc.text(`Emitido em: ${formatDate(budget.criadoEm)}`, marginRight, 102, { align: 'right' });

  return 160;
};

const drawSectionHeading = (
  doc: jsPDF,
  title: string,
  startY: number,
  marginLeft: number,
  marginRight: number,
) => {
  setFill(doc, palette.surface);
  doc.roundedRect(marginLeft, startY, marginRight - marginLeft, 28, 8, 8, 'F');
  setStroke(doc, palette.border);
  doc.roundedRect(marginLeft, startY, marginRight - marginLeft, 28, 8, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setText(doc, palette.accent);
  doc.text(title, marginLeft + 14, startY + 18);

  return startY + 40;
};

interface InfoEntry {
  label: string;
  value: string;
}

const drawInfoGrid = (
  doc: jsPDF,
  entries: InfoEntry[],
  columns: number,
  startY: number,
  marginLeft: number,
  marginRight: number,
) => {
  if (entries.length === 0) return startY;

  const columnWidth = (marginRight - marginLeft) / columns;
  const rows: Array<{ items: Array<{ label: string; valueLines: string[] }>; height: number }> = [];

  for (let i = 0; i < entries.length; i += columns) {
    const slice = entries.slice(i, i + columns);
    const mapped = slice.map(entry => {
      const valueLines = doc.splitTextToSize(entry.value || '-', columnWidth - 8) as string[];
      return { label: entry.label, valueLines };
    });
    const rowHeight =
      mapped.reduce((max, item) => Math.max(max, item.valueLines.length), 0) * 12 + 20;
    rows.push({ items: mapped, height: rowHeight });
  }

  let cursorY = startY;
  rows.forEach(row => {
    row.items.forEach((item, index) => {
      const x = marginLeft + index * columnWidth;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setText(doc, palette.muted);
      doc.text(item.label.toUpperCase(), x, cursorY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      setText(doc, palette.text);
      doc.text(item.valueLines, x, cursorY + 14);
    });
    cursorY += row.height;
  });

  return cursorY + 10;
};

const drawItemsTable = (
  doc: jsPDF,
  items: BudgetLineProduct[],
  startY: number,
  marginLeft: number,
  marginRight: number,
) => {
  const rows = (items ?? []).map(item => {
    const quantidade = item.quantidade ?? 0;
    const unitario =
      item.valorUnitario ??
      (quantidade > 0 ? (item.valorTotal ?? 0) / quantidade : 0);
    const total = item.valorTotal ?? unitario * quantidade;
    return [
      item.nome,
      String(quantidade),
      formatCurrency(unitario),
      formatCurrency(total),
    ];
  });

  autoTable(doc, {
    startY,
    margin: { left: marginLeft, right: marginLeft },
    tableWidth: marginRight - marginLeft,
    head: [['Descrição', 'Qtd', 'Valor unitário', 'Subtotal']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: { top: 6, right: 8, bottom: 6, left: 8 } },
    headStyles: { fillColor: palette.accent, textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: palette.text },
    alternateRowStyles: { fillColor: palette.surface },
    tableLineColor: palette.border,
    tableLineWidth: 0.5,
  });

  return (doc as any).lastAutoTable.finalY + 16;
};

const drawTotalsCard = (
  doc: jsPDF,
  subtotal: number,
  desconto: number,
  total: number,
  startY: number,
  marginLeft: number,
  marginRight: number,
) => {
  const width = marginRight - marginLeft;
  const height = desconto > 0 ? 96 : 80;

  setFill(doc, palette.surface);
  doc.roundedRect(marginLeft, startY, width, height, 10, 10, 'F');
  setStroke(doc, palette.border);
  doc.roundedRect(marginLeft, startY, width, height, 10, 10, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setText(doc, palette.muted);
  doc.text('Resumo financeiro', marginLeft + 16, startY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setText(doc, palette.text);
  doc.text(`Subtotal dos produtos: ${formatCurrency(subtotal)}`, marginLeft + 16, startY + 38);

  let offsetY = startY + 54;
  if (desconto > 0) {
    doc.text(`Desconto aplicado: - ${formatCurrency(desconto)}`, marginLeft + 16, offsetY);
    offsetY += 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setText(doc, palette.accent);
  doc.text(`Total geral: ${formatCurrency(total)}`, marginLeft + 16, offsetY);

  return startY + height + 14;
};

const drawObservationBox = (
  doc: jsPDF,
  observation: string,
  startY: number,
  marginLeft: number,
  marginRight: number,
) => {
  const maxLines = 8;
  const lines = doc.splitTextToSize(observation || 'Sem observações adicionais.', marginRight - marginLeft - 24) as string[];
  const displayLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    displayLines[displayLines.length - 1] = `${displayLines[displayLines.length - 1]} (...)`;
  }

  const height = displayLines.length * 12 + 38;

  setFill(doc, palette.surface);
  doc.roundedRect(marginLeft, startY, marginRight - marginLeft, height, 10, 10, 'F');
  setStroke(doc, palette.accent);
  doc.roundedRect(marginLeft, startY, marginRight - marginLeft, height, 10, 10, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setText(doc, palette.accent);
  doc.text('Observações', marginLeft + 14, startY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setText(doc, palette.text);
  doc.text(displayLines, marginLeft + 14, startY + 36);

  return startY + height;
};

export interface GenerateBudgetPdfResult {
  dataUri: string;
  fileName: string;
  generatedAt: string;
}

export const generateBudgetPdf = (
  budget: BudgetRecord,
  options: { company?: CompanyProfile } = {},
): GenerateBudgetPdfResult => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const company = options.company ?? { name: 'Vortex Projetos' };
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 48;
  const marginRight = pageWidth - marginLeft;
  const generatedAtIso = new Date().toISOString();

  let cursorY = drawHeroHeader(doc, budget, company, marginLeft, marginRight);

  cursorY = drawSectionHeading(doc, 'Dados do cliente', cursorY, marginLeft, marginRight);

  const clientInfo: InfoEntry[] = [
    { label: 'Cliente', value: budget.clienteNome },
  ];
  if (budget.clienteDocumento) clientInfo.push({ label: 'Documento', value: budget.clienteDocumento });
  if (budget.clienteEndereco) clientInfo.push({ label: 'Endereço', value: budget.clienteEndereco });
  if (budget.enderecoEntrega) clientInfo.push({ label: 'Endereço de entrega', value: budget.enderecoEntrega });
  if (budget.clienteTelefone) clientInfo.push({ label: 'Telefone', value: budget.clienteTelefone });
  if (budget.clienteEmail) clientInfo.push({ label: 'E-mail', value: budget.clienteEmail });

  cursorY = drawInfoGrid(doc, clientInfo, 2, cursorY, marginLeft, marginRight);

  cursorY = drawSectionHeading(doc, 'Produtos e valores', cursorY, marginLeft, marginRight);
  cursorY = drawItemsTable(doc, budget.itens ?? [], cursorY, marginLeft, marginRight);

  const subtotalProdutos = (budget.itens ?? []).reduce((acc, item) => {
    const quantidade = item.quantidade ?? 0;
    const unitario =
      item.valorUnitario ??
      (quantidade > 0 ? (item.valorTotal ?? 0) / quantidade : 0);
    return acc + unitario * quantidade;
  }, 0);
  const desconto = budget.desconto ?? 0;

  cursorY = drawTotalsCard(doc, subtotalProdutos, desconto, budget.total, cursorY, marginLeft, marginRight);

  cursorY = drawSectionHeading(doc, 'Informações do orçamento', cursorY, marginLeft, marginRight);

  const infoPairs: InfoEntry[] = [
    { label: 'Forma de pagamento', value: budget.formaPagamento || '-' },
  ];
  if (budget.formaPagamento === 'Personalizado' && budget.formaPagamentoPersonalizado) {
    infoPairs.push({ label: 'Detalhes de pagamento', value: budget.formaPagamentoPersonalizado });
  }
  infoPairs.push(
    { label: 'Prazo estimado de entrega', value: formatDate(budget.previsaoEntrega) },
    { label: 'Data prevista de início', value: formatDate(budget.previsaoInicio) },
    { label: 'Gerado em', value: formatDateTime(budget.criadoEm) },
  );
  if (typeof budget.enviosProgramados === 'number') {
    const envios =
      budget.enviosProgramados > 0 ? `${budget.enviosProgramados} envio(s)` : 'Não definido';
    infoPairs.push({ label: 'Envios programados', value: envios });
  }

  cursorY = drawInfoGrid(doc, infoPairs, 2, cursorY, marginLeft, marginRight);

  cursorY = drawObservationBox(
    doc,
    budget.observacoes ?? '',
    cursorY,
    marginLeft,
    marginRight,
  );

  const dataUri = doc.output('datauristring');

  return {
    dataUri,
    fileName: `orcamento-${budget.codigo}.pdf`,
    generatedAt: generatedAtIso,
  };
};
