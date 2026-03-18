/* ---------------------------------------------------------------
   RELATÓRIO COMPLETO (Envolvidos + Danos)
--------------------------------------------------------------- */
function relFull_gerarTexto() {
  const data = new Date().toLocaleDateString('pt-BR');
  let txt = '📋 *RELATÓRIO COMPLETO — SINISTRO DE TRÂNSITO*\n';
  txt += 'Data: ' + data + '\n';

  // ── Envolvidos ──────────────────────────────────────────────
  txt += '\n═══════════════════════════════\n';
  txt += '👥 *ENVOLVIDOS*\n';
  txt += '═══════════════════════════════\n';
  const cards = document.querySelectorAll('#env_lista .person-card');
  if (!cards.length) {
    txt += '(nenhum envolvido registrado)\n';
  } else {
    cards.forEach(function(c, i) {
      const nome     = (c.querySelector('.nome')?.value     || '').trim().toUpperCase();
      const marca    = (c.querySelector('.marca')?.value    || '').trim().toUpperCase();
      const contato  = (c.querySelector('.contato')?.value  || '').trim();
      const endereco = (c.querySelector('.endereco')?.value || '').trim().toUpperCase();
      const relato   = (c.querySelector('.relato')?.value   || '').trim();
      const tipo     = (c.querySelector('.tipo')?.value     || 'ENVOLVIDO').toUpperCase();
      txt += '\n*' + tipo + ' ' + (i + 1) + '*\n';
      if (nome)     txt += '- Nome: ' + nome + '\n';
      if (marca)    txt += '- Veículo: ' + marca + '\n';
      if (contato)  txt += '- Contato: ' + contato + '\n';
      if (endereco) txt += '- Local: ' + endereco + '\n';
      if (relato)   txt += '- Relato: ' + relato + '\n';
    });
  }

  // ── Danos ───────────────────────────────────────────────────
  txt += '\n═══════════════════════════════\n';
  txt += '🚗 *DANOS APARENTES*\n';
  txt += '═══════════════════════════════\n';
  if (!danVeiculosSalvos.length) {
    txt += '(nenhum veículo com danos registrado)\n';
  } else {
    txt += 'Veículos analisados: ' + danVeiculosSalvos.length + '\n';
    danVeiculosSalvos.forEach(function(v, idx) {
      const label = v.tipo === 'moto' ? 'Motocicleta' : 'Carro';
      txt += '\n*Veículo ' + (idx + 1) + ' — ' + label + '*\n';
      txt += '---------------------------\n';
      if (v.tipo === 'moto') {
        const V360_NAMES_L = { frente: 'Frente', tras: 'Traseira', direita: 'Lado Direito', esquerda: 'Lado Esquerdo' };
        ['frente','tras','direita','esquerda'].forEach(function(t) {
          const its = v.v360db[t].filter(function(i) { return i.dano !== null; });
          if (!its.length) return;
          txt += '\n' + V360_NAMES_L[t] + ':\n';
          its.sort(function(a,b) { return a.num - b.num; }).forEach(function(i) {
            txt += '• ' + i.nome + ': ' + i.dano + '\n';
          });
        });
      } else {
        const cfg_map = DAN_DIAGRAMAS[v.tipo];
        const porVista = { frontal: [], traseira: [], esquerda: [], direita: [] };
        Object.keys(v.danos).forEach(function(id) {
          const mapa = { F: 'frontal', T: 'traseira', E: 'esquerda', D: 'direita' };
          const vis = mapa[id.charAt(0)];
          if (vis) porVista[vis].push(id);
        });
        Object.entries(porVista).forEach(function([vista, pontos]) {
          if (!pontos.length) return;
          const cfg = cfg_map[vista];
          txt += '\n' + DAN_VISTA_LABELS[vista] + ':\n';
          pontos.forEach(function(id) {
            const ponto = cfg.pontos.find(function(p) { return p.id === id; });
            if (!ponto) return;
            const tipo = v.danos[id];
            const num = cfg.pontos.indexOf(ponto) + 1;
            txt += '• ' + ponto.label + ': ' + tipo + '\n';
          });
        });
      }
    });
  }

  txt += '\nObs.: relato baseado em condições visíveis no local, sem caráter pericial.';
  return txt;
}

function relFull_gerar() {
  const texto = relFull_gerarTexto();
  document.getElementById('rel-result-text').textContent = texto;
  const ra = document.getElementById('rel-result-area');
  ra.style.display = 'block';
  ra.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function relFull_copiar(btn) {
  navigator.clipboard.writeText(document.getElementById('rel-result-text').textContent).then(function() {
    const old = btn.innerHTML;
    btn.innerHTML = '✅ Copiado!';
    btn.classList.add('btn-success');
    setTimeout(function() { btn.innerHTML = old; btn.classList.remove('btn-success'); }, 2000);
  });
}

function relFull_fotoMiniatura(input) {
  const container = document.getElementById('rel-local-grid');
  const actions = document.getElementById('rel-local-actions');
  const atuais = container.querySelectorAll('img').length;
  const disponiveis = Math.max(0, 2 - atuais);
  if (!input.files || !disponiveis) {
    input.value = '';
    return;
  }

  Array.from(input.files).slice(0, disponiveis).forEach(function(arquivo) {
    const r = new FileReader();
    r.onload = function(e) {
      const wrap = document.createElement('div');
      wrap.className = 'foto-wrap';
      const img = document.createElement('img');
      img.src = e.target.result;
      const del = document.createElement('button');
      del.className = 'foto-del';
      del.type = 'button';
      del.textContent = '✕';
      del.onclick = function() {
        wrap.remove();
        actions.style.display = container.querySelectorAll('img').length ? 'flex' : 'none';
      };
      wrap.appendChild(img);
      wrap.appendChild(del);
      container.appendChild(wrap);
      actions.style.display = 'flex';
    };
    r.readAsDataURL(arquivo);
  });

  input.value = '';
}

function relFull_limparFotosLocal() {
  document.getElementById('rel-local-grid').innerHTML = '';
  document.getElementById('rel-local-actions').style.display = 'none';
}

function relFull_dataUrlParaArquivo(src, nomeBase, indice) {
  const arr = src.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) return null;
  const mime = mimeMatch[1];
  const ext = mime.split('/')[1] || 'jpg';
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
  return new File([u8arr], `${nomeBase}_foto${indice + 1}.${ext}`, { type: mime });
}

function relFull_coletarFotosEnvolvidos() {
  const arquivos = [];
  const resumo = [];
  const cards = document.querySelectorAll('#env_lista .person-card');

  cards.forEach(function(card, cardIndex) {
    const nome = (card.querySelector('.nome')?.value || '').trim().toUpperCase() || `ENVOLVIDO_${cardIndex + 1}`;
    const veiculo = (card.querySelector('.marca')?.value || '').trim().toUpperCase() || `VEICULO_${cardIndex + 1}`;
    const base = nome.replace(/\s+/g, '_').replace(/[^\w-]/g, '');
    const imgs = Array.from(card.querySelectorAll('.foto-grid img'));
    let count = 0;

    imgs.forEach(function(img, imgIndex) {
      if (!img.src || !img.src.startsWith('data:')) return;
      const arquivo = relFull_dataUrlParaArquivo(img.src, base || `ENVOLVIDO_${cardIndex + 1}`, imgIndex);
      if (arquivo) {
        arquivos.push(arquivo);
        count++;
      }
    });

    if (count) resumo.push(`- ${veiculo}: ${count} foto(s)`);
  });

  return { arquivos: arquivos, resumo: resumo };
}

function relFull_coletarFotosLocal() {
  const arquivos = [];
  const imgs = Array.from(document.querySelectorAll('#rel-local-grid img'));
  imgs.forEach(function(img, imgIndex) {
    if (!img.src || !img.src.startsWith('data:')) return;
    const arquivo = relFull_dataUrlParaArquivo(img.src, 'LOCAL_SINISTRO', imgIndex);
    if (arquivo) arquivos.push(arquivo);
  });
  return arquivos;
}

function relFull_coletarPacoteFotos() {
  const envolvidos = relFull_coletarFotosEnvolvidos();
  const local = relFull_coletarFotosLocal();
  const resumo = [
    '*📸 FOTOS — RELATÓRIO COMPLETO*',
    `🗓️ Data: ${new Date().toLocaleDateString('pt-BR')}`,
    ''
  ];

  if (envolvidos.resumo.length) {
    resumo.push('🚗 Fotos por veículo:');
    envolvidos.resumo.forEach(function(linha) { resumo.push(linha); });
  } else {
    resumo.push('🚗 Fotos por veículo: nenhuma foto anexada nos envolvidos.');
  }

  resumo.push(`📍 Local do sinistro: ${local.length} foto(s)`);

  return {
    arquivos: envolvidos.arquivos.concat(local),
    texto: resumo.join('\n')
  };
}

function relFull_baixarArquivo(arquivo) {
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement('a');
  a.href = url;
  a.download = arquivo.name || 'arquivo';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
}

function relFull_baixarArquivos(arquivos) {
  arquivos.forEach(function(arquivo, indice) {
    setTimeout(function() {
      relFull_baixarArquivo(arquivo);
    }, indice * 180);
  });
}

function relFull_criarArquivoTxt(texto) {
  const data = new Date().toISOString().slice(0,10);
  const nome = 'relatorio-sinistro-' + data + '.txt';
  try {
    return new File(
      [texto],
      nome,
      { type: 'text/plain;charset=utf-8' }
    );
  } catch (e) {
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    blob.name = nome;
    return blob;
  }
}

function relFull_podeCompartilharArquivos(arquivos) {
  try {
    return !!(navigator.canShare && navigator.canShare({ files: arquivos }));
  } catch (e) {
    return false;
  }
}

function relFull_whatsapp() {
  const texto = document.getElementById('rel-result-text').textContent || relFull_gerarTexto();
  window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
}

function relFull_baixar() {
  const texto = document.getElementById('rel-result-text').textContent || relFull_gerarTexto();
  const arquivoTxt = relFull_criarArquivoTxt(texto);
  relFull_baixarArquivo(arquivoTxt);
}

async function relFull_compartilharFotos() {
  const pacote = relFull_coletarPacoteFotos();
  if (!pacote.arquivos.length) {
    alert('Nenhuma foto foi anexada nos envolvidos ou nas fotos do local.');
    return;
  }

  if (relFull_podeCompartilharArquivos(pacote.arquivos)) {
    try {
      await navigator.share({
        title: 'Fotos do Relatório Completo',
        text: pacote.texto,
        files: pacote.arquivos
      });
      return;
    } catch (e) {
      // Se o compartilhamento falhar ou for cancelado, cai para download.
    }
  }

  relFull_baixarArquivos(pacote.arquivos);
}
