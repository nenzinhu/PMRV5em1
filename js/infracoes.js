(function () {
  const state = {
    initialized: false,
    loading: false,
    records: [],
    categories: [],
    measures: [],
    elements: null
  };

  const SEARCH_SYNONYM_GROUPS = [
    ['licenciamento', 'licen', 'licenca', 'licença', 'crlv', 'crlv-e', 'crlv e', 'documento', 'documentos', 'doc', 'docu', 'regularizacao', 'regularização'],
    ['placa', 'placas', 'identificacao', 'identificação', 'sinal identificador'],
    ['cnh', 'habilitacao', 'habilitação', 'carteira', 'motorista', 'condutor', 'permissao', 'permissão', 'ppd'],
    ['documento', 'documentos', 'porte', 'obrigatorio', 'obrigatório', 'apresentacao', 'apresentação'],
    ['veiculo', 'veículo', 'carro', 'automovel', 'automóvel', 'moto', 'motocicleta', 'motoneta', 'ciclomotor'],
    ['capacete', 'viseira', 'oculos', 'óculos', 'protecao', 'proteção'],
    ['estacionar', 'estacionamento', 'parar', 'parada'],
    ['alcool', 'álcool', 'embriaguez', 'bebida', 'etilometro', 'etilômetro', 'bafometro', 'bafômetro'],
    ['celular', 'telefone', 'smartphone', 'aparelho'],
    ['farol', 'farois', 'faróis', 'luz', 'lanterna', 'iluminacao', 'iluminação'],
    ['ultrapassagem', 'ultrapassar', 'passagem'],
    ['pedestre', 'faixa', 'travessia', 'passarela'],
    ['remocao', 'remoção', 'guincho', 'recolhimento'],
    ['retencao', 'retenção', 'reter'],
    ['placa mercosul', 'mercosul', 'identificacao veicular', 'identificação veicular'],
    ['escapamento', 'silenciador', 'descarga', 'ruido', 'ruído'],
    ['licenca ambiental', 'licença ambiental', 'transporte perigoso', 'produto perigoso']
  ];

  const SEARCH_INTENT_RULES = [
    {
      triggers: ['nao pagou', 'não pagou', 'licenciamento atrasado', 'licenciamento vencido', 'nao licenciou', 'não licenciou', 'veiculo atrasado', 'veículo atrasado', 'documento atrasado'],
      expansions: ['licenciamento', 'licen', 'crlv', 'documento', 'regularizacao', 'regularização']
    },
    {
      triggers: ['recusou', 'recusou bafometro', 'recusou bafômetro', 'recusou teste', 'nao soprou', 'não soprou', 'negou bafometro', 'negou bafômetro'],
      expansions: ['recusa', 'etilometro', 'etilômetro', 'bafometro', 'bafômetro', 'teste']
    },
    {
      triggers: ['nao habilitado', 'não habilitado', 'nao tem habilitacao', 'não tem habilitação', 'sem habilitacao', 'sem habilitação', 'sem cnh', 'nao possui cnh', 'não possui cnh'],
      expansions: ['nao habilitado', 'não habilitado', 'habilitacao', 'habilitação', 'cnh', 'permissao', 'permissão']
    },
    {
      triggers: ['placa errada', 'placa sem lacre', 'sem placa', 'placa ilegivel', 'placa ilegível'],
      expansions: ['placa', 'identificacao', 'identificação']
    },
    {
      triggers: ['bebeu', 'bebado', 'bebado dirigindo', 'bêbado', 'alcool', 'álcool'],
      expansions: ['alcool', 'álcool', 'embriaguez', 'etilometro', 'etilômetro', 'bafometro', 'bafômetro']
    },
    {
      triggers: ['sem documento', 'documento vencido', 'nao portava documento', 'não portava documento'],
      expansions: ['documento', 'documentos', 'porte', 'obrigatorio', 'obrigatório', 'crlv']
    },
    {
      triggers: ['sem capacete', 'capacete errado', 'viseira levantada', 'sem viseira'],
      expansions: ['capacete', 'viseira', 'oculos', 'óculos', 'protecao', 'proteção']
    },
    {
      triggers: ['mexendo no celular', 'no celular', 'usando celular'],
      expansions: ['celular', 'telefone', 'aparelho']
    }
  ];

  const SEARCH_CODE_SHORTCUTS = [
    { code: '7366-2', terms: ['7366-2', '736-62', '252-6', 'cel vol', 'cel cond', 'uso cel', 'cel mao', 'cel mão', 'cel ao vol', 'cel'] },
    { code: '5185-2', terms: ['5185-0', '518-50', '518-52', 'sem cinto', 's cinto', 's/ cinto', 'cinto aus', 'cinto n uso', 'cinto ñ uso', 'falta cinto', 'cinto'] },
    { code: '5185-1', terms: ['5185-1', '518-51', 'desobedecer ordem agente', 'ordem agente', 'desobedecer agente'] },
    { code: '6050-1', terms: ['605-01', 'sinal verm', 'av sinal', 'av s v', 'av s/v', 'semaf verm', 'avan sinal', 'sinal'] },
    { code: '5010-1', terms: ['5010-0', '501-00', 's cnh', 's/ cnh', 'n habil', 'ñ habil', 'sem habil', 'n poss cnh', 'inabil'] },
    { code: '5045-1', terms: ['504-50', 'cnh venc', 'habil venc', 'doc venc', 'cnh exp', 'cnh atras', 'venc'] },
    { code: '5169-1', terms: ['7579-0', '757-90', '165-1', 'alcool', 'embriag', 'lei seca', 'sob alcool', 'sob álcool', 'alcoolemia', 'rec', 'recusar'] },
    { code: '5738-0', terms: ['5738-0', '573-80', 'faixa continua amarela', 'faixa contínua amarela', 'contramao faixa continua', 'contramão faixa contínua'] },
    { code: '5746-1', terms: ['5746-1', '574-61', 'transitar acostamento', 'pelo acostamento'] },
    { code: '6599-0', terms: ['6599-0', '659-90', 'veiculo nao licenciado', 'veículo não licenciado', 'nao licenciado', 'não licenciado'] },
    { code: '6599-2', terms: ['6599-2', '659-92', 'mau estado conservacao', 'mau estado conservação', 'mau estado'] },
    { code: '6610-2', terms: ['6610-2', '661-02', 'iluminacao alterada', 'iluminação alterada', 'sinalizacao alterada', 'sinalização alterada'] },
    { code: '6637-2', terms: ['6637-2', '663-72', 'equipamento desacordo contran', 'equipamento em desacordo com o contran'] },
    { code: '7420-1', terms: ['604-11', 'ped fora fx', 'n pref ped', 'ñ pref ped', 'ped s pref', 'ped s/ pref', 'desres ped', 'ped n prior', 'ped ñ prior'] },
    { code: '6122-1', terms: ['604-12', 'ped na fx', 'n pref fx', 'ñ pref fx', 'ped faixa', 'desres fx', 'ped prior n', 'ped prior ñ', 'fx', 'ped'] },
    { code: '6599-1', terms: ['659-92', 'veic n lic', 'veic ñ lic', 's lic', 's/ lic', 'lic venc', 'veic irreg', 'doc atras', 'n lic', 'ñ lic'] }
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
      tableBody: document.getElementById('infra_tableBody'),
      emptyState: document.getElementById('infra_emptyState')
    };

    return state.elements;
  }

  function repairBrokenText(text) {
    let output = String(text || '');

    for (let i = 0; i < 3; i++) {
      const looksBroken = output.indexOf('Ã') >= 0 || output.indexOf('Â') >= 0 || output.indexOf('â') >= 0;
      if (!looksBroken) break;

      try {
        output = new TextDecoder('utf-8').decode(Uint8Array.from(output, function (char) {
          return char.charCodeAt(0) & 255;
        }));
      } catch (error) {
        break;
      }
    }

    const replacements = [
      ['� proibido', 'É proibido'],
      ['sinaliza��o', 'sinalização'],
      ['infra��o', 'infração'],
      ['infra��es', 'infrações'],
      ['descri��o', 'descrição'],
      ['tr�nsito', 'trânsito'],
      ['espec�fica', 'específica'],
      ['ve�culo', 'veículo'],
      ['ve�c', 'veíc'],
      ['seguran�a', 'segurança'],
      ['aten��o', 'atenção'],
      ['remo��o', 'remoção'],
      ['reten��o', 'retenção'],
      ['situa��o', 'situação'],
      ['condu��o', 'condução'],
      ['obriga��o', 'obrigação'],
      ['jur�dica', 'jurídica'],
      ['f�sica', 'física'],
      ['p�blica', 'pública'],
      ['n�o', 'não'],
      ['�', '']
    ];

    replacements.forEach(function (entry) {
      output = output.split(entry[0]).join(entry[1]);
    });

    return output.replace(/\uFFFD/g, '').trim();
  }

  function safeText(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    return repairBrokenText(text);
  }

  function normalizeHeader(value) {
    return safeText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function normalizeSearchText(value) {
    return safeText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function resolveCodeShortcut(term) {
    const normalizedTerm = normalizeSearchText(term);
    if (!normalizedTerm) return '';

    for (let i = 0; i < SEARCH_CODE_SHORTCUTS.length; i++) {
      const entry = SEARCH_CODE_SHORTCUTS[i];
      const matched = entry.terms.some(function (candidate) {
        return normalizeSearchText(candidate) === normalizedTerm;
      });
      if (matched) return entry.code;
    }

    return '';
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

  function findHeaderIndex(headers, options) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (options.some(function (option) { return header === option; })) return i;
    }
    return -1;
  }

  function normalizeCategory(value) {
    const normalized = normalizeHeader(value);
    if (!normalized) return 'Sem categoria';
    if (normalized.includes('gravissima')) return 'Gravíssima';
    if (normalized.includes('grave')) return 'Grave';
    if (normalized.includes('media')) return 'Média';
    if (normalized.includes('leve')) return 'Leve';
    return safeText(value) || 'Sem categoria';
  }

  function categoryClass(value) {
    const normalized = normalizeHeader(value);
    if (normalized.includes('gravissima')) return 'gravissima';
    if (normalized.includes('grave')) return 'grave';
    if (normalized.includes('media')) return 'media';
    if (normalized.includes('leve')) return 'leve';
    return 'sem-categoria';
  }

  function normalizeMeasure(value) {
    const normalized = normalizeHeader(value);
    if (!normalized) return '';
    if (normalized.includes('remoc')) return 'REMOÇÃO';
    if (normalized.includes('retenc')) return 'RETENÇÃO';
    return safeText(value).toUpperCase();
  }

  function measureClass(value) {
    const normalized = normalizeHeader(value);
    if (normalized.includes('remoc')) return 'remocao';
    if (normalized.includes('retenc')) return 'retencao';
    return 'none';
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

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fillSelect(select, values, emptyLabel) {
    const current = select.value;
    select.innerHTML = '<option value="">' + emptyLabel + '</option>' + values.map(function (value) {
      return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
    }).join('');
    select.value = values.indexOf(current) >= 0 ? current : '';
  }

  function buildSearchIndex(record) {
    const base = normalizeSearchText([
      record.codigo,
      record.descricao,
      record.artigo,
      record.infrator,
      record.categoria,
      record.medida
    ].join(' '));

    const additions = [];
    SEARCH_SYNONYM_GROUPS.forEach(function (group) {
      const hasGroupMatch = group.some(function (term) {
        return base.indexOf(normalizeSearchText(term)) >= 0;
      });

      if (hasGroupMatch) additions.push(group.join(' '));
    });

    return [base].concat(additions).join(' ');
  }

  function expandSearchIntent(term) {
    const expanded = [term];

    SEARCH_INTENT_RULES.forEach(function (rule) {
      const matched = rule.triggers.some(function (trigger) {
        return term.indexOf(normalizeSearchText(trigger)) >= 0;
      });

      if (matched) {
        rule.expansions.forEach(function (item) {
          expanded.push(normalizeSearchText(item));
        });
      }
    });

    return Array.from(new Set(expanded.join(' ').split(/\s+/).filter(Boolean)));
  }

  function mapRecords(rows) {
    const elements = getElements();
    if (!rows.length) {
      elements.status.textContent = 'Base vazia';
      elements.summary.textContent = 'Nenhum registro foi encontrado na base local.';
      return [];
    }

    const headers = rows[0].map(normalizeHeader);
    const indexMap = {
      codigo: findHeaderIndex(headers, ['codigo infracao', 'codigo']),
      descricao: findHeaderIndex(headers, ['descricao da infracao', 'descricao infracao', 'descricao']),
      artigo: findHeaderIndex(headers, ['art ctb decreto', 'art decreto', 'artigo decreto', 'artigo']),
      infrator: findHeaderIndex(headers, ['infrator']),
      valor: findHeaderIndex(headers, ['valor real r', 'valor real rs', 'valor real', 'valor']),
      categoria: findHeaderIndex(headers, ['categoria']),
      medida: findHeaderIndex(headers, ['medida administrativa', 'medida'])
    };

    return rows.slice(1)
      .filter(function (row) {
        return row.some(function (cell) { return safeText(cell) !== ''; });
      })
      .filter(function (row) {
        return normalizeHeader(row[indexMap.codigo] || '') !== 'codigo infracao';
      })
      .map(function (row) {
        const record = {
          codigo: safeText(row[indexMap.codigo] || ''),
          descricao: safeText(row[indexMap.descricao] || ''),
          artigo: safeText(row[indexMap.artigo] || ''),
          infrator: safeText(row[indexMap.infrator] || ''),
          categoria: normalizeCategory(row[indexMap.categoria] || ''),
          medida: normalizeMeasure(row[indexMap.medida] || ''),
          valor: parseValue(row[indexMap.valor] || '')
        };

        record.search = buildSearchIndex(record);
        return record;
      })
      .filter(function (record) {
        return record.codigo || record.descricao || record.artigo;
      });
  }

  function mapFishRecord(row) {
    const cells = row
      .map(safeText)
      .filter(function (cell) { return cell !== ''; });

    if (!cells.length) return null;
    if (!/^\d{4,5}(?:-\d+)?$/.test(cells[0])) return null;

    const record = {
      codigo: cells[0],
      descricao: '',
      artigo: '',
      infrator: '',
      categoria: 'Sem categoria',
      medida: '',
      valor: 0
    };

    if (cells.length >= 7) {
      record.descricao = cells.slice(1, cells.length - 4).join(' ').trim();
      record.artigo = cells[cells.length - 4] || '';
      record.infrator = cells[cells.length - 3] || '';
      record.categoria = normalizeCategory(cells[cells.length - 2] || '');

      const maybeMeasure = cells[cells.length - 1] || '';
      record.medida = /reten|remoc/i.test(maybeMeasure) ? normalizeMeasure(maybeMeasure) : '';
    } else {
      record.descricao = cells[1] || '';
      record.artigo = cells[2] || '';
      record.infrator = cells[3] || '';
      record.categoria = normalizeCategory(cells[4] || '');
      record.medida = normalizeMeasure(cells[5] || '');
    }

    record.search = buildSearchIndex(record);
    return record;
  }

  function mapFishRecords(rows) {
    return rows
      .map(mapFishRecord)
      .filter(function (record) {
        return record && (record.codigo || record.descricao || record.artigo);
      });
  }

  function mergeRecords() {
    const merged = [];
    const seen = new Set();

    Array.prototype.slice.call(arguments).forEach(function (records) {
      (records || []).forEach(function (record) {
        const key = [
          normalizeSearchText(record.codigo),
          normalizeSearchText(record.descricao),
          normalizeSearchText(record.artigo),
          normalizeSearchText(record.infrator)
        ].join('|');

        if (seen.has(key)) return;
        seen.add(key);
        merged.push(record);
      });
    });

    return merged;
  }

  function updateStats(records, filtered) {
    const elements = getElements();

    elements.totalCount.textContent = records.length.toLocaleString('pt-BR');
    elements.filteredCount.textContent = filtered.length.toLocaleString('pt-BR');
    elements.categoryCount.textContent = state.categories.length.toLocaleString('pt-BR');
  }

  function infra_showTab(tab) {
    const elements = getElements();
    const isConsulta = tab !== 'frequentes';

    if (elements.tabConsulta) elements.tabConsulta.classList.toggle('active', isConsulta);
    if (elements.tabFrequentes) elements.tabFrequentes.classList.toggle('active', !isConsulta);

    if (elements.panelConsulta) {
      elements.panelConsulta.classList.toggle('active', isConsulta);
      elements.panelConsulta.hidden = !isConsulta;
    }

    if (elements.panelFrequentes) {
      elements.panelFrequentes.classList.toggle('active', !isConsulta);
      elements.panelFrequentes.hidden = isConsulta;
    }
  }

  function render(records) {
    const elements = getElements();

    updateStats(state.records, records);

    if (!records.length) {
      elements.tableBody.innerHTML = '';
      elements.emptyState.hidden = false;
      elements.status.textContent = 'Nenhum resultado encontrado';
      elements.summary.textContent = 'Ajuste os filtros para ampliar a pesquisa na base local.';
      return;
    }

    elements.emptyState.hidden = true;
    elements.status.textContent = records.length.toLocaleString('pt-BR') + ' infrações listadas';
    elements.summary.textContent = state.records.length === records.length
      ? 'Base completa carregada para consulta local.'
      : 'Resultados filtrados sobre ' + state.records.length.toLocaleString('pt-BR') + ' registros da base.';

    elements.tableBody.innerHTML = records.map(function (record) {
      const measureText = record.medida || 'Sem medida';
      return [
        '<tr>',
        '<td class="infra-code">' + escapeHtml(record.codigo) + '</td>',
        '<td class="infra-description">' + escapeHtml(record.descricao) + '</td>',
        '<td class="infra-muted-cell">' + escapeHtml(record.artigo || 'Não informado') + '</td>',
        '<td class="infra-muted-cell">' + escapeHtml(record.infrator || 'Não informado') + '</td>',
        '<td><span class="infra-badge ' + categoryClass(record.categoria) + '">' + escapeHtml(record.categoria) + '</span></td>',
        '<td><span class="infra-measure ' + measureClass(record.medida) + '">' + escapeHtml(measureText) + '</span></td>',
        '<td class="infra-code">' + escapeHtml(formatCurrency(record.valor)) + '</td>',
        '</tr>'
      ].join('');
    }).join('');
  }

  function applyFilters() {
    const elements = getElements();
    const term = normalizeSearchText(elements.search.value);
    const category = elements.category.value;
    const measure = elements.measure.value;

    const termParts = term ? expandSearchIntent(term) : [];
    const forcedCode = resolveCodeShortcut(term);

    const filtered = state.records.filter(function (record) {
      if (forcedCode && record.codigo !== forcedCode) return false;
      if (!forcedCode && termParts.length && !termParts.every(function (part) { return record.search.indexOf(part) >= 0; })) return false;
      if (category && record.categoria !== category) return false;
      if (measure && record.medida !== measure) return false;
      return true;
    });

    render(filtered);
  }

  function infra_applyShortcut(term) {
    const elements = getElements();
    if (!elements.search) return;

    elements.search.value = term;
    infra_showTab('consulta');
    applyFilters();
  }

  function bindEvents() {
    const elements = getElements();
    if (!elements.search) return;
    if (elements.search.dataset.bound === 'true') return;

    elements.search.dataset.bound = 'true';
    elements.search.addEventListener('input', applyFilters);
    elements.category.addEventListener('change', applyFilters);
    elements.measure.addEventListener('change', applyFilters);
    elements.clear.addEventListener('click', function () {
      elements.search.value = '';
      elements.category.value = '';
      elements.measure.value = '';
      render(state.records);
    });
  }

  function decodeEmbeddedBase64(base64) {
    return new TextDecoder('utf-8').decode(Uint8Array.from(atob(base64), function (char) {
      return char.charCodeAt(0);
    }));
  }

  function loadCsv() {
    const elements = getElements();
    elements.status.textContent = 'Carregando base...';
    elements.summary.textContent = 'Lendo a base local de infrações.';

    const basePromise = window.INFRACOES_CSV_BASE64
      ? Promise.resolve(decodeEmbeddedBase64(window.INFRACOES_CSV_BASE64))
      : fetch('./infracoes/infracoes.csv.txt', { cache: 'no-store' })
          .then(function (response) {
            if (!response.ok) throw new Error('Falha ao carregar o CSV local.');
            return response.arrayBuffer();
          })
          .then(function (buffer) {
            return new TextDecoder('utf-8').decode(buffer);
          });

    const fishPromise = fetch('./fish.csv', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) return '';
        return response.arrayBuffer();
      })
      .then(function (buffer) {
        if (!buffer) return '';
        return new TextDecoder('utf-8').decode(buffer);
      })
      .catch(function () {
        return '';
      });

    return Promise.all([basePromise, fishPromise]);
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

    loadCsv()
      .then(function (payload) {
        const csvText = payload[0] || '';
        const fishText = payload[1] || '';
        const rows = parseCsv(csvText);
        const fishRows = fishText ? parseCsv(fishText) : [];
        state.records = mergeRecords(mapRecords(rows), mapFishRecords(fishRows));
        state.categories = Array.from(new Set(state.records.map(function (record) { return record.categoria; }).filter(Boolean)));
        state.measures = Array.from(new Set(state.records.map(function (record) { return record.medida; }).filter(Boolean)));

        state.categories.sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
        state.measures.sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });

        fillSelect(elements.category, state.categories, 'Todas');
        fillSelect(elements.measure, state.measures, 'Todas');

        state.initialized = true;
        render(state.records);
      })
      .catch(function (error) {
        elements.status.textContent = 'Falha ao carregar a base';
        elements.summary.textContent = error && error.message ? error.message : 'Não foi possível ler a base local.';
        elements.emptyState.hidden = false;
        elements.tableBody.innerHTML = '';
      })
      .finally(function () {
        state.loading = false;
      });
  }

  window.infra_init = infra_init;
  window.infra_showTab = infra_showTab;
  window.infra_applyShortcut = infra_applyShortcut;
})();
