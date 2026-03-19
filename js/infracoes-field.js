(function () {
  const state = {
    initialized: false,
    loading: false,
    records: [],
    categories: [],
    measures: [],
    selectedCode: '',
    elements: null
  };

  const SEARCH_CODE_SHORTCUTS = [
    { code: '7366-2', terms: ['7366-2', 'celular', 'uso celular', 'telefone'] },
    { code: '5185-0', terms: ['5185-0', 'cinto', 'sem cinto'] },
    { code: '5185-1', terms: ['5185-1', 'desobedecer ordem', 'ordem agente'] },
    { code: '5010-0', terms: ['5010-0', 'sem cnh', 'nao habilitado', 'inabilitado'] },
    { code: '7579-0', terms: ['7579-0', 'etilometro', 'bafometro', 'recusa teste'] },
    { code: '6599-0', terms: ['6599-0', 'nao licenciado', 'licenciamento', 'crlv'] }
  ];

  function getElements() {
    if (state.elements) return state.elements;

    state.elements = {
      search: document.getElementById('infra_search'),
      category: document.getElementById('infra_category'),
      measure: document.getElementById('infra_measure'),
      clear: document.getElementById('infra_clear'),
      tabConsulta: document.getElementById('infra_tab_consulta'),
      tabFrequentes: document.getElementById('infra_tab_frequentes'),
      panelConsulta: document.getElementById('infra_panel_consulta'),
      panelFrequentes: document.getElementById('infra_panel_frequentes'),
      totalCount: document.getElementById('infra_totalCount'),
      filteredCount: document.getElementById('infra_filteredCount'),
      categoryCount: document.getElementById('infra_categoryCount'),
      status: document.getElementById('infra_status'),
      summary: document.getElementById('infra_summary'),
      emptyState: document.getElementById('infra_emptyState'),
      resultsGrid: document.getElementById('infra_resultsGrid'),
      detailTitle: document.getElementById('infra_detailTitle'),
      detailSubtitle: document.getElementById('infra_detailSubtitle'),
      detailCode: document.getElementById('infra_detailCode'),
      detailArticle: document.getElementById('infra_detailArticle'),
      detailOffender: document.getElementById('infra_detailOffender'),
      detailCategory: document.getElementById('infra_detailCategory'),
      detailNature: document.getElementById('infra_detailNature'),
      detailMeasure: document.getElementById('infra_detailMeasure'),
      detailValue: document.getElementById('infra_detailValue'),
      detailDescription: document.getElementById('infra_detailDescription')
    };

    return state.elements;
  }

  function safeText(value) {
    return String(value || '').trim();
  }

  function normalizeText(value) {
    return safeText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"') {
        if (quoted && next === '"') {
          cell += '"';
          i++;
        } else {
          quoted = !quoted;
        }
        continue;
      }

      if (char === ',' && !quoted) {
        row.push(cell);
        cell = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && next === '\n') i++;
        row.push(cell);
        if (row.some(function (item) { return item.trim() !== ''; })) rows.push(row);
        row = [];
        cell = '';
        continue;
      }

      cell += char;
    }

    if (cell.length || row.length) {
      row.push(cell);
      if (row.some(function (item) { return item.trim() !== ''; })) rows.push(row);
    }

    return rows;
  }

  function decodeEmbeddedBase64(base64) {
    return new TextDecoder('utf-8').decode(Uint8Array.from(atob(base64), function (char) {
      return char.charCodeAt(0);
    }));
  }

  function normalizeCategory(value) {
    const normalized = normalizeText(value);
    if (normalized.includes('gravissima')) return 'Gravíssima';
    if (normalized.includes('grave')) return 'Grave';
    if (normalized.includes('media')) return 'Média';
    if (normalized.includes('leve')) return 'Leve';
    return 'Sem categoria';
  }

  function categoryClass(value) {
    const normalized = normalizeText(value);
    if (normalized.includes('gravissima')) return 'gravissima';
    if (normalized.includes('grave')) return 'grave';
    if (normalized.includes('media')) return 'media';
    if (normalized.includes('leve')) return 'leve';
    return 'sem-categoria';
  }

  function normalizeMeasure(value) {
    const normalized = normalizeText(value);
    if (!normalized) return '';
    if (normalized.includes('remoc')) return 'Remoção do veículo';
    if (normalized.includes('retenc')) return 'Retenção do veículo';
    if (normalized.includes('recolh')) return 'Recolhimento';
    return safeText(value);
  }

  function measureClass(value) {
    const normalized = normalizeText(value);
    if (normalized.includes('remoc')) return 'remocao';
    if (normalized.includes('retenc')) return 'retencao';
    if (normalized.includes('recolh')) return 'recolhimento';
    return 'none';
  }

  function measureIcon(value) {
    const normalized = normalizeText(value);
    if (normalized.includes('remoc')) return 'RM';
    if (normalized.includes('retenc')) return 'RT';
    if (normalized.includes('recolh')) return 'RC';
    return 'OK';
  }

  function resolveNature(record) {
    if (record.infrator) return record.infrator;
    if (record.categoria && record.categoria !== 'Sem categoria') return record.categoria;
    return 'Infração de trânsito';
  }

  function parseValue(value) {
    const text = safeText(value)
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '');
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function findHeaderIndex(headers, aliases) {
    for (let i = 0; i < headers.length; i++) {
      if (aliases.indexOf(headers[i]) >= 0) return i;
    }
    return -1;
  }

  function mapRecords(rows) {
    if (!rows.length) return [];

    const headers = rows[0].map(normalizeText);
    const indexMap = {
      codigo: findHeaderIndex(headers, ['codigo infracao', 'codigo']),
      descricao: findHeaderIndex(headers, ['descricao da infracao', 'descricao infracao', 'descricao']),
      artigo: findHeaderIndex(headers, ['art ctb decreto', 'art decreto', 'artigo decreto', 'artigo']),
      infrator: findHeaderIndex(headers, ['infrator']),
      valor: findHeaderIndex(headers, ['valor real r', 'valor real rs', 'valor real', 'valor']),
      categoria: findHeaderIndex(headers, ['categoria']),
      medida: findHeaderIndex(headers, ['medida administrativa', 'medida'])
    };

    return rows.slice(1).filter(function (row) {
      return row.some(function (cell) { return safeText(cell) !== ''; });
    }).map(function (row) {
      const record = {
        codigo: safeText(row[indexMap.codigo] || ''),
        descricao: safeText(row[indexMap.descricao] || ''),
        artigo: safeText(row[indexMap.artigo] || ''),
        infrator: safeText(row[indexMap.infrator] || ''),
        categoria: normalizeCategory(row[indexMap.categoria] || ''),
        medida: normalizeMeasure(row[indexMap.medida] || ''),
        valor: parseValue(row[indexMap.valor] || '')
      };

      record.search = normalizeText([
        record.codigo,
        record.descricao,
        record.artigo,
        record.infrator,
        record.categoria,
        record.medida
      ].join(' '));

      return record;
    }).filter(function (record) {
      return record.codigo || record.descricao || record.artigo;
    });
  }

  function fillSelect(select, values, emptyLabel) {
    const current = select.value;
    select.innerHTML = '<option value="">' + emptyLabel + '</option>' + values.map(function (value) {
      return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
    }).join('');
    select.value = values.indexOf(current) >= 0 ? current : '';
  }

  function updateStats(filtered) {
    const elements = getElements();
    elements.totalCount.textContent = state.records.length.toLocaleString('pt-BR');
    elements.filteredCount.textContent = filtered.length.toLocaleString('pt-BR');
    elements.categoryCount.textContent = state.categories.length.toLocaleString('pt-BR');
  }

  function setDetail(record) {
    const elements = getElements();

    if (!record) {
      elements.detailTitle.textContent = 'Selecione uma infração';
      elements.detailSubtitle.textContent = 'Toque em um card para ver os dados essenciais para decisão policial.';
      elements.detailCode.textContent = '-';
      elements.detailArticle.textContent = '-';
      elements.detailOffender.textContent = '-';
      elements.detailCategory.textContent = '-';
      elements.detailNature.textContent = '-';
      elements.detailMeasure.textContent = '-';
      elements.detailValue.textContent = '-';
      elements.detailDescription.textContent = 'Nenhuma infração selecionada.';
      return;
    }

    elements.detailTitle.textContent = record.descricao || 'Infração selecionada';
    elements.detailSubtitle.textContent = 'Leitura rápida para conferência em campo.';
    elements.detailCode.textContent = record.codigo || '-';
    elements.detailArticle.textContent = record.artigo || 'Não informado';
    elements.detailOffender.textContent = record.infrator || 'Não informado';
    elements.detailCategory.textContent = record.categoria || 'Sem categoria';
    elements.detailNature.textContent = resolveNature(record);
    elements.detailMeasure.textContent = record.medida || 'Sem medida administrativa';
    elements.detailValue.textContent = formatCurrency(record.valor || 0);
    elements.detailDescription.textContent = record.descricao || 'Sem descrição.';
  }

  function render(records) {
    const elements = getElements();
    updateStats(records);

    if (!records.length) {
      elements.resultsGrid.innerHTML = '';
      elements.emptyState.hidden = false;
      elements.status.textContent = 'Nenhum resultado encontrado';
      elements.summary.textContent = 'Refine o termo ou ajuste os filtros operacionais.';
      setDetail(null);
      return;
    }

    elements.emptyState.hidden = true;
    elements.status.textContent = records.length.toLocaleString('pt-BR') + ' infrações em consulta';
    elements.summary.textContent = state.records.length === records.length
      ? 'Base completa pronta para consulta em campo.'
      : 'Resultados filtrados sobre ' + state.records.length.toLocaleString('pt-BR') + ' registros.';

    const selected = records.find(function (record) { return record.codigo === state.selectedCode; }) || records[0];
    state.selectedCode = selected.codigo;
    setDetail(selected);

    elements.resultsGrid.innerHTML = records.map(function (record) {
      const activeClass = record.codigo === state.selectedCode ? ' active' : '';
      const measureText = record.medida || 'Sem medida';
      return [
        '<button class="infra-result-card' + activeClass + '" type="button" data-code="' + escapeHtml(record.codigo) + '">',
        '<div class="infra-card-top">',
        '<span class="infra-card-code">' + escapeHtml(record.codigo) + '</span>',
        '<span class="infra-card-article">' + escapeHtml(record.artigo || 'Sem artigo') + '</span>',
        '</div>',
        '<strong class="infra-card-title">' + escapeHtml(record.descricao) + '</strong>',
        '<div class="infra-card-tags">',
        '<span class="infra-card-badge ' + categoryClass(record.categoria) + '">' + escapeHtml(record.categoria) + '</span>',
        '<span class="infra-card-nature">' + escapeHtml(resolveNature(record)) + '</span>',
        '<span class="infra-card-measure ' + measureClass(record.medida) + '"><span class="infra-card-measure-icon">' + escapeHtml(measureIcon(record.medida)) + '</span>' + escapeHtml(measureText) + '</span>',
        '</div>',
        '<div class="infra-card-bottom">',
        '<span class="infra-card-offender">' + escapeHtml(record.infrator || 'Não informado') + '</span>',
        '<strong class="infra-card-value">' + escapeHtml(formatCurrency(record.valor)) + '</strong>',
        '</div>',
        '</button>'
      ].join('');
    }).join('');
  }

  function resolveShortcut(term) {
    const normalizedTerm = normalizeText(term);
    if (!normalizedTerm) return '';

    for (let i = 0; i < SEARCH_CODE_SHORTCUTS.length; i++) {
      const shortcut = SEARCH_CODE_SHORTCUTS[i];
      if (shortcut.code === term) return shortcut.code;
      if (shortcut.terms.some(function (item) { return normalizeText(item) === normalizedTerm; })) return shortcut.code;
    }

    return '';
  }

  function applyFilters() {
    const elements = getElements();
    const term = normalizeText(elements.search.value);
    const category = elements.category.value;
    const measure = elements.measure.value;
    const forcedCode = resolveShortcut(elements.search.value);
    const parts = term ? term.split(/\s+/).filter(Boolean) : [];

    const filtered = state.records.filter(function (record) {
      if (forcedCode && record.codigo !== forcedCode) return false;
      if (!forcedCode && parts.length && !parts.every(function (part) { return record.search.indexOf(part) >= 0; })) return false;
      if (category && record.categoria !== category) return false;
      if (measure && record.medida !== measure) return false;
      return true;
    });

    render(filtered);
  }

  function bindEvents() {
    const elements = getElements();
    if (!elements.search || elements.search.dataset.bound === 'true') return;

    elements.search.dataset.bound = 'true';
    elements.search.addEventListener('input', applyFilters);
    elements.category.addEventListener('change', applyFilters);
    elements.measure.addEventListener('change', applyFilters);
    elements.clear.addEventListener('click', function () {
      elements.search.value = '';
      elements.category.value = '';
      elements.measure.value = '';
      state.selectedCode = '';
      render(state.records);
    });

    elements.resultsGrid.addEventListener('click', function (event) {
      const card = event.target.closest('[data-code]');
      if (!card) return;
      state.selectedCode = card.getAttribute('data-code') || '';
      applyFilters();
    });
  }

  function loadRecords() {
    const csvText = window.INFRACOES_CSV_BASE64 ? decodeEmbeddedBase64(window.INFRACOES_CSV_BASE64) : '';
    const rows = parseCsv(csvText);
    state.records = mapRecords(rows);
    state.categories = Array.from(new Set(state.records.map(function (record) { return record.categoria; }).filter(Boolean))).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR');
    });
    state.measures = Array.from(new Set(state.records.map(function (record) { return record.medida; }).filter(Boolean))).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR');
    });
  }

  function infra_showTab(tab) {
    const elements = getElements();
    const isConsulta = tab !== 'frequentes';

    elements.tabConsulta.classList.toggle('active', isConsulta);
    elements.tabFrequentes.classList.toggle('active', !isConsulta);
    elements.panelConsulta.classList.toggle('active', isConsulta);
    elements.panelConsulta.hidden = !isConsulta;
    elements.panelFrequentes.classList.toggle('active', !isConsulta);
    elements.panelFrequentes.hidden = isConsulta;
  }

  function infra_applyShortcut(term) {
    const elements = getElements();
    elements.search.value = term;
    infra_showTab('consulta');
    applyFilters();
  }

  function infra_init() {
    const elements = getElements();
    if (!elements.search) return;

    bindEvents();
    infra_showTab('consulta');

    if (state.initialized || state.loading) {
      if (state.initialized) render(state.records);
      return;
    }

    state.loading = true;
    elements.status.textContent = 'Carregando base...';
    elements.summary.textContent = 'Preparando consulta operacional.';

    try {
      loadRecords();
      fillSelect(elements.category, state.categories, 'Todas');
      fillSelect(elements.measure, state.measures, 'Todas');
      state.initialized = true;
      render(state.records);
    } catch (error) {
      elements.status.textContent = 'Falha ao carregar a base';
      elements.summary.textContent = error && error.message ? error.message : 'Não foi possível ler a base local.';
      elements.emptyState.hidden = false;
      elements.resultsGrid.innerHTML = '';
      setDetail(null);
    } finally {
      state.loading = false;
    }
  }

  window.infra_init = infra_init;
  window.infra_showTab = infra_showTab;
  window.infra_applyShortcut = infra_applyShortcut;
})();
