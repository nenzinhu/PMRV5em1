/* ---------------------------------------------------------------
   INICIANDO O SERVIÇO
--------------------------------------------------------------- */
/* ---------------------------------------------------------------
   ASSUNÇÃO — GUARNIÇÃO POR GRUPOS
--------------------------------------------------------------- */
const ASS_GRUPOS = {
  efetivo: [
    'Sub Ten JORGE LUIZ', 'Sub Ten OSORIO',
    '2º Sgt BARDT', '2º Sgt CAVALLAZZI', '3º Sgt DOUGLAS', '3º Sgt FIGUEIREDO', '3º Sgt FRANCISCO', '3º Sgt FRANCINE', '3º Sgt LEONARDO', '3º Sgt MARTINS', '3º Sgt WALTER',
    'Cb ADEMIR', 'Cb ANDRADE', 'Cb CABRAL', 'Cb DIEGO', 'Cb FABIANA', 'Cb JEFERSON', 'Cb JULIANA', 'Cb MATHEUS', 'Cb RODRIGUES', 'Cb SANTOS', 'Cb SCARABELOT', 'Cb SILVA', 'Cb THIAGO'
  ]
};

// === Iniciando o Serviço ===
let ass_mesa = false;
let ass_lotes = []; // [{viatura:'0005', policiais:[...]}, ...]
// estado do builder
let ass_build_vtr = null;
let ass_build_pol = [];

function ass_toggleMesa() {
  ass_mesa = !ass_mesa;
  document.getElementById('ass_mesa_btn').classList.toggle('active', ass_mesa);
  document.getElementById('ass_build_vtr_section').style.display = ass_mesa ? 'none' : '';
  document.getElementById('ass_build_pol_label').textContent = ass_mesa ? 'Policiais na Mesa' : 'Policiais desta Viatura';
  document.getElementById('ass_build_hor_label').textContent = ass_mesa ? 'Horário da Mesa' : 'Horário desta Viatura';
  document.getElementById('ass_build_confirmar_btn').textContent = ass_mesa ? '+ Confirmar Mesa' : '+ Confirmar Viatura';
  if (ass_mesa) {
    document.getElementById('ass_horario').value = '07h às 19h';
    document.getElementById('ass_build_horario').value = '07h às 19h';
    ass_toggleManual();
  }
  ass_renderLotes();
}

// ---- Builder: seleção de viatura ----
function ass_build_selecionarVtr(btn, numero) {
  document.querySelectorAll('#ass_build_vtr_grid .vtr-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ass_build_vtr = numero;
  document.getElementById('ass_build_vtr_manual_wrap').classList.add('hidden');
  const label = document.getElementById('ass_build_vtr_label');
  label.style.display = 'block';
  label.textContent = 'PM-' + numero;
  // reset tipo e mostra seleção de escala
  ass_build_tipo = null;
  document.querySelectorAll('.ass-tipo-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('ass_build_tipo_manual_wrap').classList.add('hidden');
  document.getElementById('ass_build_tipo_input').value = '';
  document.getElementById('ass_build_tipo_section').style.display = 'block';
}

function ass_build_toggleVtrManual(btn) {
  const wrap = document.getElementById('ass_build_vtr_manual_wrap');
  const isHidden = wrap.classList.contains('hidden');
  document.querySelectorAll('#ass_build_vtr_grid .vtr-btn').forEach(b => b.classList.remove('active'));
  if (isHidden) {
    wrap.classList.remove('hidden');
    btn.classList.add('active');
    ass_build_vtr = '__manual__';
    document.getElementById('ass_build_vtr_input').focus();
    document.getElementById('ass_build_vtr_label').style.display = 'none';
    // reset tipo
    ass_build_tipo = null;
    document.querySelectorAll('.ass-tipo-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('ass_build_tipo_section').style.display = 'block';
  } else {
    wrap.classList.add('hidden');
    ass_build_vtr = null;
    ass_build_tipo = null;
    document.getElementById('ass_build_vtr_label').style.display = 'none';
    document.getElementById('ass_build_tipo_section').style.display = 'none';
  }
}

function ass_build_selecionarTipo(btn, tipo) {
  document.querySelectorAll('.ass-tipo-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const manualWrap = document.getElementById('ass_build_tipo_manual_wrap');
  if (tipo === '__manual__') {
    ass_build_tipo = null;
    manualWrap.classList.remove('hidden');
    document.getElementById('ass_build_tipo_input').focus();
  } else {
    ass_build_tipo = tipo;
    manualWrap.classList.add('hidden');
    document.getElementById('ass_build_tipo_input').value = '';
    // Ordinária → aplica 24h automaticamente
    if (tipo === 'Ordinária') {
      document.getElementById('ass_build_horario').value = '07h às 07h';
    }
  }
  ass_build_atualizarLabel();
}

function ass_build_atualizarLabel() {
  const label = document.getElementById('ass_build_vtr_label');
  if (!label.style.display || label.style.display === 'none') return;
  const vtrNum = ass_build_vtr === '__manual__'
    ? (document.getElementById('ass_build_vtr_input').value.trim() || '????')
    : ass_build_vtr;
  let tipoLabel = ass_build_tipo ? ass_build_tipo : '';
  if (!tipoLabel) {
    const tipoInput = document.getElementById('ass_build_tipo_input').value.trim();
    if (tipoInput) tipoLabel = tipoInput;
  }
  label.textContent = 'PM-' + vtrNum + (tipoLabel ? ' — ' + tipoLabel : '');
}

// ---- Builder: seleção de policiais ----
function ass_build_carregarGrupo(btn, grupo) {
  document.querySelectorAll('#ass_build_grupos_grid .vtr-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const grid = document.getElementById('ass_build_nomes_grid');
  grid.innerHTML = '';
  grid.style.display = 'flex';
  ASS_GRUPOS[grupo].forEach(nome => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'vtr-btn';
    if (ass_build_pol.includes(nome)) b.classList.add('active');
    b.style.cssText = 'font-size:12px;padding:7px 10px;font-family:var(--font-body);font-weight:700;';
    b.textContent = nome;
    b.onclick = () => ass_build_toggleNome(b, nome);
    grid.appendChild(b);
  });
}

function ass_build_toggleNome(btn, nome) {
  const idx = ass_build_pol.indexOf(nome);
  if (idx === -1) { ass_build_pol.push(nome); btn.classList.add('active'); }
  else { ass_build_pol.splice(idx, 1); btn.classList.remove('active'); }
  ass_build_renderChips();
}

function ass_build_toggleManualPol() {
  document.getElementById('ass_build_manual_pol_wrap').classList.toggle('hidden');
}

function ass_build_adicionarManual() {
  const grad = document.getElementById('ass_build_grad_manual').value;
  const nome = document.getElementById('ass_build_nome_manual').value.trim().toUpperCase();
  if (!nome) return;
  const completo = grad + ' ' + nome;
  if (!ass_build_pol.includes(completo)) { ass_build_pol.push(completo); ass_build_renderChips(); }
  document.getElementById('ass_build_nome_manual').value = '';
}

function ass_build_renderChips() {
  const wrap = document.getElementById('ass_build_pol_chips_wrap');
  const lista = document.getElementById('ass_build_pol_chips');
  lista.innerHTML = '';
  if (!ass_build_pol.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  ass_build_pol.forEach((nome, i) => {
    const tag = document.createElement('span');
    tag.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;background:rgba(245,130,32,.15);border:1px solid rgba(245,130,32,.35);color:#F58220;font-size:12px;font-weight:700;cursor:pointer;';
    tag.innerHTML = nome + ' <span style="font-size:10px;opacity:.7;">✕</span>';
    tag.onclick = () => {
      ass_build_pol.splice(i, 1);
      document.querySelectorAll('#ass_build_nomes_grid .vtr-btn').forEach(b => {
        if (b.textContent === nome) b.classList.remove('active');
      });
      ass_build_renderChips();
    };
    lista.appendChild(tag);
  });
}

// ---- Confirmar e adicionar lote ----
function ass_adicionarLote() {
  if (!ass_build_pol.length) { alert('Selecione ao menos um policial.'); return; }
  const horLote = document.getElementById('ass_build_horario').value;

  if (ass_mesa) {
    // no modo Mesa, adiciona diretamente como lote de mesa
    ass_lotes.push({ viatura: null, policiais: ass_build_pol.slice(), horario: horLote, mesa: true });
  } else {
    let vtr = ass_build_vtr;
    if (vtr === '__manual__') {
      vtr = document.getElementById('ass_build_vtr_input').value.trim();
      if (!vtr) { alert('Digite o número da viatura.'); return; }
    }
    if (!vtr) { alert('Selecione a viatura.'); return; }
    // suporte a tipo manual de escala
    let tipoFinal = ass_build_tipo;
    if (!tipoFinal) {
      tipoFinal = document.getElementById('ass_build_tipo_input').value.trim() || null;
    }
    ass_lotes.push({ viatura: vtr, tipo: tipoFinal, policiais: ass_build_pol.slice(), horario: horLote, mesa: false });
  }

  // reset builder
  ass_build_vtr = null;
  ass_build_tipo = null;
  ass_build_pol = [];
  document.querySelectorAll('#ass_build_vtr_grid .vtr-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('ass_build_vtr_label').style.display = 'none';
  document.getElementById('ass_build_tipo_section').style.display = 'none';
  document.querySelectorAll('.ass-tipo-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('ass_build_tipo_manual_wrap').classList.add('hidden');
  document.getElementById('ass_build_tipo_input').value = '';
  document.getElementById('ass_build_vtr_manual_wrap').classList.add('hidden');
  document.getElementById('ass_build_vtr_input').value = '';
  document.getElementById('ass_build_nomes_grid').innerHTML = '';
  document.getElementById('ass_build_nomes_grid').style.display = 'none';
  document.querySelectorAll('#ass_build_grupos_grid .vtr-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('ass_build_manual_pol_wrap').classList.add('hidden');
  document.getElementById('ass_build_nome_manual').value = '';
  document.getElementById('ass_build_horario').selectedIndex = 0;
  ass_build_renderChips();

  // Se estava no modo Mesa, desativa e volta para builder de viaturas
  if (ass_mesa) {
    ass_mesa = false;
    document.getElementById('ass_mesa_btn').classList.remove('active');
    document.getElementById('ass_build_vtr_section').style.display = '';
    document.getElementById('ass_build_pol_label').textContent = 'Policiais desta Viatura';
    document.getElementById('ass_build_hor_label').textContent = 'Horário desta Viatura';
    document.getElementById('ass_build_confirmar_btn').textContent = '+ Confirmar Viatura';
  }

  ass_renderLotes();
}

function ass_renderLotes() {
  const wrap = document.getElementById('ass_lotes_wrap');
  const lista = document.getElementById('ass_lotes_lista');
  lista.innerHTML = '';
  const total = ass_lotes.length + (ass_mesa ? 1 : 0);
  if (!total) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';

  // Recepção P19 sempre no topo (estado ativo)
  if (ass_mesa) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:8px;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.4);margin-bottom:8px;font-size:13px;font-weight:700;';
    row.innerHTML = '<span>🪑 <b style="color:#a78bfa;">Recepção do P19</b> <span style="opacity:.6;font-size:11px;font-weight:400;">[07h às 19h]</span></span>'
      + '<button type="button" style="background:none;border:none;color:#ef4444;font-size:16px;cursor:pointer;padding:0 4px;" data-click="ass_toggleMesa()">✕</button>';
    lista.appendChild(row);
  }

  // Lotes de Recepção adicionados (mesa:true dentro de ass_lotes)
  // e viaturas empilhadas abaixo
  ass_lotes.forEach((lote, i) => {
    const row = document.createElement('div');
    if (lote.mesa) {
      row.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;padding:10px 14px;border-radius:8px;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.3);margin-bottom:6px;font-size:13px;';
      row.innerHTML = '<div><div style="font-weight:700;color:#a78bfa;">🪑 Recepção do P19 <span style="opacity:.6;font-size:11px;font-weight:400;">[' + lote.horario + ']</span></div>'
        + '<div style="margin-top:3px;opacity:.8;font-size:12px;">' + lote.policiais.join(' · ') + '</div></div>'
        + '<button type="button" style="background:none;border:none;color:#ef4444;font-size:16px;cursor:pointer;padding:0 4px;flex-shrink:0;" data-click="ass_removerLote(' + i + ')">✕</button>';
    } else {
      const tipoLabel = lote.tipo ? ' — ' + lote.tipo : '';
      row.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;padding:10px 14px;border-radius:8px;background:rgba(59,130,246,.10);border:1px solid rgba(59,130,246,.25);margin-bottom:6px;font-size:13px;';
      row.innerHTML = '<div><div style="font-weight:700;color:#60a5fa;">🚔 PM-' + lote.viatura + tipoLabel + ' <span style="opacity:.6;font-size:11px;font-weight:400;">[' + lote.horario + ']</span></div>'
        + '<div style="margin-top:3px;opacity:.8;font-size:12px;">' + lote.policiais.join(' · ') + '</div></div>'
        + '<button type="button" style="background:none;border:none;color:#ef4444;font-size:16px;cursor:pointer;padding:0 4px;flex-shrink:0;" data-click="ass_removerLote(' + i + ')">✕</button>';
    }
    lista.appendChild(row);
  });
}

function ass_removerLote(i) {
  ass_lotes.splice(i, 1);
  ass_renderLotes();
}

function ass_toggleManual() {
  const v = document.getElementById('ass_horario').value;
  document.getElementById('ass_horarioManual').classList.toggle('hidden', v !== 'MANUAL');
}

function ass_gerar() {
  const total = ass_lotes.length + (ass_mesa ? 1 : 0);
  if (!total) { alert('Adicione ao menos uma Viatura ou selecione Recepção do P19.'); return; }

  let local = document.getElementById('ass_local').value;
  const localManual = document.getElementById('ass_localManual').value.trim();
  if (localManual) local = localManual;

  let horario = document.getElementById('ass_horario').value;
  if (horario === 'MANUAL') horario = document.getElementById('ass_horarioManual').value.trim();

  const h = new Date().getHours();
  const saudacao = h >= 5 && h < 12 ? '☀️ Bom dia'
                 : h >= 12 && h < 18 ? '🌤️ Boa tarde'
                 : '🌙 Boa noite';

  let linhas = saudacao + '! Guarnição iniciando serviço\n';

  // Recepção P19 sempre primeira: estado ativo OU lotes de mesa
  const loteMesa = ass_lotes.filter(l => l.mesa);
  const loteVtr  = ass_lotes.filter(l => !l.mesa);

  if (ass_mesa) {
    linhas += '🔹 Na Recepção do P19 (' + horario + ')\n';
  }
  loteMesa.forEach(lote => {
    linhas += '🔹 Na Recepção do P19 (' + lote.horario + ')\n';
    linhas += '🔹 *Policiais:* ' + lote.policiais.join(' / ') + '\n';
  });

  loteVtr.forEach(lote => {
    linhas += '🔹 *Viatura* PM-' + lote.viatura + (lote.tipo ? ' — ' + lote.tipo : '') + '\n';
    linhas += '🔹 *Policiais:* ' + lote.policiais.join(' / ') + '\n';
    linhas += '🔹 *Horário:* ' + lote.horario + '\n';
  });

  if (!ass_mesa && ass_lotes.length === 0) linhas += '🔹 *Horário:* ' + horario + '\n';
  linhas += '🔹 *Local:* ' + local + '\n';
  linhas += 'Bom serviço a todos! 👮‍♂️🚓';

  document.getElementById('ass_resultado').textContent = linhas;
  document.getElementById('ass_result').classList.add('visible');
  document.getElementById('ass_result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}



