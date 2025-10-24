import { useMemo, useRef, useState } from 'react';
import {
  Container,
  Card,
  Table,
  Form,
  InputGroup,
  Button,
  Stack,
  Alert,
  Badge,
} from 'react-bootstrap';
import { Search, UploadCloud, Download } from 'react-feather';
import type { SupplierRecord, SupplierSpreadsheetRow, SupplierPurchaseRecord } from './Cadastros';

interface FornecedoresProps {
  suppliers: SupplierRecord[];
  onMergeSpreadsheet: (rows: SupplierSpreadsheetRow[]) => void;
}

type ProductOption = {
  productId: string;
  productName: string;
  productCategory?: string;
};

type FeedbackState = {
  variant: 'success' | 'danger';
  message: string;
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const formatCurrency = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const escapeCsv = (value: unknown) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/["\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const escapeHtml = (value: unknown) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const getLastPurchaseForProduct = (supplier: SupplierRecord, productId: string): SupplierPurchaseRecord | null => {
  let latest: SupplierRecord['purchases'][number] | null = null;
  supplier.purchases.forEach(purchase => {
    if (purchase.productId !== productId) return;
    if (!latest || purchase.purchaseDate > latest.purchaseDate) {
      latest = purchase;
    }
  });
  return latest;
};

const parseCsvLine = (line: string) => {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

const Fornecedores = ({ suppliers, onMergeSpreadsheet }: FornecedoresProps) => {
  const [query, setQuery] = useState('');
  const [productFilter, setProductFilter] = useState<'all' | string>('all');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const productOptions = useMemo<ProductOption[]>(() => {
    const map = new Map<string, ProductOption>();
    suppliers.forEach(supplier => {
      supplier.catalog.forEach(product => {
        if (!map.has(product.productId)) {
          map.set(product.productId, {
            productId: product.productId,
            productName: product.productName,
            productCategory: product.productCategory,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.productName.localeCompare(b.productName, 'pt-BR'),
    );
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    const trimmed = query.trim();
    const normalizedQuery = trimmed ? normalize(trimmed) : '';

    return suppliers
      .filter(supplier => {
        if (productFilter !== 'all') {
          const hasProduct = supplier.catalog.some(item => item.productId === productFilter);
          if (!hasProduct) {
            return false;
          }
        }

        if (!normalizedQuery) {
          return true;
        }

        const searchableFields = [
          supplier.nome,
          supplier.contato,
          supplier.telefone,
          ...supplier.catalog.map(item => item.productName),
        ].filter(Boolean);

        return searchableFields.some(field =>
          normalize(String(field)).includes(normalizedQuery),
        );
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [suppliers, query, productFilter]);

  const visibleRows = useMemo<SupplierSpreadsheetRow[]>(() => {
    const rows: SupplierSpreadsheetRow[] = [];
    filteredSuppliers.forEach(supplier => {
      const relevantProducts =
        productFilter === 'all'
          ? supplier.catalog
          : supplier.catalog.filter(item => item.productId === productFilter);

      if (relevantProducts.length === 0) {
        rows.push({
          supplierName: supplier.nome,
          contact: supplier.contato,
          phone: supplier.telefone,
          productName: '',
          productId: '',
          productCategory: '',
          currency: '',
          price: 0,
          referenceCode: '',
        });
        return;
      }

      relevantProducts.forEach(product => {
        const lastPurchase = getLastPurchaseForProduct(supplier, product.productId);
        rows.push({
          supplierName: supplier.nome,
          contact: supplier.contato,
          phone: supplier.telefone,
          productName: product.productName,
          productId: product.productId,
          productCategory: product.productCategory,
          currency: product.currency,
          price: product.price,
          referenceCode: product.referenceCode,
          lastPurchaseDate: lastPurchase?.purchaseDate,
          lastPurchaseQuantity: lastPurchase?.quantity,
          lastPurchaseUnitPrice: lastPurchase?.unitPrice,
          lastPurchaseTotal: lastPurchase?.totalPrice,
          lastPurchaseNotes: lastPurchase?.notes,
        });
      });
    });
    return rows;
  }, [filteredSuppliers, productFilter]);

  const suppliersByProduct = useMemo(() => {
    const map = new Map<
      string,
      {
        productId: string;
        productName: string;
        productCategory?: string;
        rows: Array<{
          supplierName: string;
          price: number;
          currency: string;
          lastPurchaseDate?: string;
          lastPurchaseQuantity?: number;
        }>;
      }
    >();

    suppliers.forEach(supplier => {
      supplier.catalog.forEach(product => {
        const entry =
          map.get(product.productId) ??
          {
            productId: product.productId,
            productName: product.productName,
            productCategory: product.productCategory,
            rows: [],
          };

        const lastPurchase = getLastPurchaseForProduct(supplier, product.productId);
        entry.rows.push({
          supplierName: supplier.nome,
          price: product.price,
          currency: product.currency,
          lastPurchaseDate: lastPurchase?.purchaseDate,
          lastPurchaseQuantity: lastPurchase?.quantity,
        });

        map.set(product.productId, entry);
      });
    });

    return Array.from(map.values())
      .map(entry => ({
        ...entry,
        rows: entry.rows.sort((a, b) => a.price - b.price),
      }))
      .sort((a, b) => a.productName.localeCompare(b.productName, 'pt-BR'));
  }, [suppliers]);

  const selectedProductLabel =
    productFilter === 'all'
      ? 'Todos os produtos'
      : productOptions.find(option => option.productId === productFilter)?.productName ?? 'Produto filtrado';

  const triggerImport = () => {
    setFeedback(null);
    fileInputRef.current?.click();
  };

  const buildCsv = (rows: SupplierSpreadsheetRow[]) => {
    const headers = [
      'supplierName',
      'contact',
      'phone',
      'productName',
      'productId',
      'productCategory',
      'currency',
      'price',
      'referenceCode',
      'lastPurchaseDate',
      'lastPurchaseQuantity',
      'lastPurchaseUnitPrice',
      'lastPurchaseTotal',
      'lastPurchaseNotes',
    ];
    const csvLines = [headers.join(',')];
    rows.forEach(row => {
      const record = row as unknown as Record<string, unknown>;
      csvLines.push(
        headers
          .map(header => {
            const value = record[header];
            return escapeCsv(value);
          })
          .join(','),
      );
    });
    return csvLines.join('\n');
  };

  const buildXls = (rows: SupplierSpreadsheetRow[]) => {
    const headers = [
      'Fornecedor',
      'Contato',
      'Telefone',
      'Produto',
      'Codigo do Produto',
      'Categoria',
      'Moeda',
      'Preco',
      'Referencia',
      'Data da Ultima Compra',
      'Quantidade da Ultima Compra',
      'Preco Unitario da Ultima Compra',
      'Total da Ultima Compra',
      'Notas da Ultima Compra',
    ];

    const headerRow = headers.map(title => `<th>${escapeHtml(title)}</th>`).join('');
    const bodyRows = rows
      .map(row => {
        const cells = [
          row.supplierName,
          row.contact,
          row.phone,
          row.productName,
          row.productId,
          row.productCategory,
          row.currency,
          row.price,
          row.referenceCode,
          row.lastPurchaseDate,
          row.lastPurchaseQuantity,
          row.lastPurchaseUnitPrice,
          row.lastPurchaseTotal,
          row.lastPurchaseNotes,
        ].map(value => `<td>${escapeHtml(value)}</td>`);
        return `<tr>${cells.join('')}</tr>`;
      })
      .join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><table>${`<thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody>`}</table></body></html>`;
  };

  const downloadBlob = (content: string, mime: string, filename: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: 'csv' | 'xls') => {
    if (visibleRows.length === 0) {
      setFeedback({ variant: 'danger', message: 'Nao ha dados visiveis para exportar.' });
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
      const csv = buildCsv(visibleRows);
      downloadBlob(csv, 'text/csv;charset=utf-8;', `fornecedores-${timestamp}.csv`);
      setFeedback({ variant: 'success', message: 'Planilha exportada em CSV.' });
      return;
    }

    const xls = buildXls(visibleRows);
    downloadBlob(
      `\ufeff${xls}`,
      'application/vnd.ms-excel;charset=utf-8;',
      `fornecedores-${timestamp}.xls`,
    );
    setFeedback({ variant: 'success', message: 'Planilha exportada em XLS.' });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.name.match(/\.(csv|xls)$/i)) {
      setFeedback({ variant: 'danger', message: 'Formato nao suportado. Use arquivos .csv ou .xls.' });
      return;
    }

    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

      if (lines.length <= 1) {
        setFeedback({ variant: 'danger', message: 'O arquivo nao possui dados para importar.' });
        return;
      }

      const headerColumns = parseCsvLine(lines[0]).map(column => normalize(column));
      const expectedColumns = [
        'suppliername',
        'contact',
        'phone',
        'productname',
        'productid',
        'productcategory',
        'currency',
        'price',
        'referencecode',
        'lastpurchasedate',
        'lastpurchasequantity',
        'lastpurchaseunitprice',
        'lastpurchasetotal',
        'lastpurchasenotes',
      ];

      const missingHeaders = expectedColumns.filter(column => !headerColumns.includes(column));
      if (missingHeaders.length > 0) {
        setFeedback({
          variant: 'danger',
          message: `Colunas ausentes: ${missingHeaders.join(', ')}`,
        });
        return;
      }

      const rows: SupplierSpreadsheetRow[] = lines.slice(1).map(line => {
        const columns = parseCsvLine(line);
        const get = (key: string) => {
          const index = headerColumns.indexOf(key);
          return index >= 0 ? columns[index] ?? '' : '';
        };

        const quantityValue = Number(get('lastpurchasequantity'));
        const unitPriceValue = Number(get('lastpurchaseunitprice'));
        const totalValue = Number(get('lastpurchasetotal'));

        return {
          supplierName: get('suppliername'),
          contact: get('contact'),
          phone: get('phone'),
          productName: get('productname'),
          productId: get('productid'),
          productCategory: get('productcategory'),
          currency: get('currency') || 'BRL',
          price: Number(get('price')) || 0,
          referenceCode: get('referencecode'),
          lastPurchaseDate: get('lastpurchasedate') || undefined,
          lastPurchaseQuantity: Number.isFinite(quantityValue) ? quantityValue : undefined,
          lastPurchaseUnitPrice: Number.isFinite(unitPriceValue) ? unitPriceValue : undefined,
          lastPurchaseTotal: Number.isFinite(totalValue) ? totalValue : undefined,
          lastPurchaseNotes: get('lastpurchasenotes') || undefined,
        };
      });

      onMergeSpreadsheet(rows);
      setFeedback({
        variant: 'success',
        message: `${rows.length} linha(s) importadas com sucesso.`,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'erro desconhecido';
      setFeedback({ variant: 'danger', message: `Falha ao importar planilha: ${reason}` });
    }
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h2 className="mb-0">Fornecedores</h2>
          <small className="text-secondary">
            {filteredSuppliers.length} fornecedor(es)  {selectedProductLabel}
          </small>
        </div>
        <Stack direction="horizontal" gap={3} className="flex-wrap">
          <InputGroup className="w-auto" style={{ minWidth: 260 }}>
            <InputGroup.Text>
              <Search size={16} />
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Buscar por fornecedor ou produto"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </InputGroup>
          <Form.Select
            value={productFilter}
            onChange={event => setProductFilter(event.target.value)}
            style={{ minWidth: 220 }}
          >
            <option value="all">Todos os produtos</option>
            {productOptions.map(option => (
              <option key={option.productId} value={option.productId}>
                {option.productName}
                {option.productCategory ? ` - ${option.productCategory}` : ''}
              </option>
            ))}
          </Form.Select>
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button variant="outline-secondary" size="sm" onClick={triggerImport}>
              <UploadCloud size={16} className="me-2" /> Importar planilha
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={() => handleExport('csv')}>
              <Download size={16} className="me-2" /> Exportar CSV
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={() => handleExport('xls')}>
              <Download size={16} className="me-2" /> Exportar XLS
            </Button>
          </Stack>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </Stack>
      </div>

      {feedback && (
        <Alert
          variant={feedback.variant}
          onClose={() => setFeedback(null)}
          dismissible
          className="mb-4"
        >
          {feedback.message}
        </Alert>
      )}

      <Card className="rounded-4 mb-4">
        <Card.Header className="bg-white">
          <strong>Planilha de fornecedores e produtos</strong>
        </Card.Header>
        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <Table bordered hover className="mb-0 table-sm text-nowrap">
            <thead className="table-light">
              <tr>
                <th>Fornecedor</th>
                <th>Contato</th>
                <th>Telefone</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Referencia</th>
                <th>Moeda</th>
                <th>Preco praticado</th>
                <th>Ultima compra</th>
                <th>Qtd ultima compra</th>
                <th>Preco unitario ultima compra</th>
                <th>Total ultima compra</th>
                <th>Notas ultima compra</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center text-secondary py-4">
                    Nenhum resultado. Ajuste os filtros ou importe uma planilha.
                  </td>
                </tr>
              ) : (
                visibleRows.map(row => {
                  const highlight = productFilter !== 'all' && row.productId === productFilter;
                  return (
                    <tr key={`${row.supplierName}-${row.productId}`} className={highlight ? 'table-primary' : undefined}>
                      <td className="fw-semibold">{row.supplierName || 'N/D'}</td>
                      <td>{row.contact || 'N/D'}</td>
                      <td>{row.phone || 'N/D'}</td>
                      <td>{row.productName || 'Sem vinculo'}</td>
                      <td>{row.productCategory || '--'}</td>
                      <td>{row.referenceCode || '--'}</td>
                      <td>{row.currency || '--'}</td>
                      <td>{row.currency ? formatCurrency(row.price, row.currency) : '--'}</td>
                      <td>{row.lastPurchaseDate ? formatDate(row.lastPurchaseDate) : '--'}</td>
                      <td>{row.lastPurchaseQuantity ?? '--'}</td>
                      <td>
                        {row.lastPurchaseUnitPrice !== undefined && row.currency
                          ? formatCurrency(row.lastPurchaseUnitPrice, row.currency)
                          : '--'}
                      </td>
                      <td>
                        {row.lastPurchaseTotal !== undefined && row.currency
                          ? formatCurrency(row.lastPurchaseTotal, row.currency)
                          : '--'}
                      </td>
                      <td>{row.lastPurchaseNotes || '--'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
          </div>
        </Card.Body>
        <Card.Footer className="text-secondary small">
          Dica: utilize os botoes de exportacao acima para gerar arquivos prontos para uso em planilhas.
        </Card.Footer>
      </Card>

      {suppliersByProduct.length > 0 && (
        <Card className="rounded-4">
          <Card.Header className="bg-white">
            <strong>Visao por produto</strong>
          </Card.Header>
          <Card.Body className="p-0">
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <Table bordered className="mb-0 table-sm text-nowrap">
              <thead className="table-light">
                <tr>
                  <th style={{ minWidth: 160 }}>Produto</th>
                  <th>Categoria</th>
                  <th>Fornecedor</th>
                  <th>Preco</th>
                  <th>Historico recente</th>
                </tr>
              </thead>
              <tbody>
                {suppliersByProduct.map(product =>
                  product.rows.map((row, index) => (
                    <tr key={`${product.productId}-${row.supplierName}`}>
                      {index === 0 && (
                        <>
                          <td rowSpan={product.rows.length} className="fw-semibold align-middle">
                            {product.productName}
                          </td>
                          <td rowSpan={product.rows.length} className="align-middle">
                            {product.productCategory || '--'}
                          </td>
                        </>
                      )}
                      <td>{row.supplierName}</td>
                      <td>
                        {formatCurrency(row.price, row.currency)}{' '}
                        {index === 0 && <Badge bg="success" pill>Melhor preco</Badge>}
                      </td>
                      <td>
                        {row.lastPurchaseDate
                          ? `${formatDate(row.lastPurchaseDate)} - ${row.lastPurchaseQuantity ?? 0} un`
                          : 'Sem historico'}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Fornecedores;
