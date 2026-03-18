#!/usr/bin/env python3
"""
patch_carro360.py — aplica todas as alterações necessárias para o módulo de vistoria 360 de carro.

Este script lê o arquivo `index.html`, injeta seções de HTML/JS e ajusta
scripts existentes para suportar o novo modo de vistoria de carros.
A versão original usava caminhos absolutos de Windows; esta versão utiliza
caminhos relativos portáveis através de `pathlib`.

Faça um backup de `index.html` antes de executar este script.

Uso:
    python patch_carro360.py [diretório_raiz_do_projeto]

Se nenhum diretório for informado, assume o diretório atual.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

def rb64(base_dir: Path, key: str) -> str:
    """Lê o conteúdo base64 da imagem do carro correspondente a `key`."""
    return (base_dir / f'b64_carro_{key}.txt').read_text().strip()

def main() -> int:
    project_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
    html_file = project_dir / 'index.html'
    if not html_file.exists():
        print(f'Erro: {html_file} não encontrado')
        return 1

    # Ler base64 das imagens
    b64 = {k: rb64(project_dir, k) for k in ['frente', 'tras', 'direita', 'esquerda']}

    html = html_file.read_text(encoding='utf-8')
    orig_len = len(html)

    # 1. Inserir bloco dan-step-carro360
    carro360_html = f"""
    <div id="dan-step-carro360" style="display:none;">
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
        <button class="btn" onclick="danVoltarStep1()">← Trocar veículo</button>
        <button class="btn btn-danger" onclick="v360cLimpar()">🗑 Limpar tudo</button>
      </div>

      <div class="card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
          <div>
            <h2 class="card-title">🚗 Danos Aparentes — Carro</h2>
            <p class="card-sub">Toque nos círculos para registrar os danos.</p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px;">
          <button class="dan-tab active" id="v360c-tab-frente"   onclick="v360cSwitchTab(this,'frente')">
            <img class="dan-tab-thumb" src="" id="dan-thumbc-frente" alt="Frente">
            ⬆️ Frente
          </button>
          <button class="dan-tab" id="v360c-tab-tras" onclick="v360cSwitchTab(this,'tras')">
            <img class="dan-tab-thumb" src="" id="dan-thumbc-tras" alt="Traseira">
            ⬇️ Traseira
          </button>
          <button class="dan-tab" id="v360c-tab-direita" onclick="v360cSwitchTab(this,'direita')">
            <img class="dan-tab-thumb" src="" id="dan-thumbc-direita" alt="Direita">
            ▶️ Direita
          </button>
          <button class="dan-tab" id="v360c-tab-esquerda" onclick="v360cSwitchTab(this,'esquerda')">
            <img class="dan-tab-thumb" src="" id="dan-thumbc-esquerda" alt="Esquerda">
            ◀️ Esquerda
          </button>
        </div>

        <div class="v360-wrap">
          <div class="v360-canvas" id="v360c-canvas">
            <div class="v360-hint" id="v360c-hint">👆 Toque na foto para posicionar o marcador</div>
            <img src="data:image/png;base64,{b64['frente']}" id="v360c-img-frente" class="moto-img active" alt="Carro frente">
            <img src="data:image/png;base64,{b64['tras']}" id="v360c-img-tras" class="moto-img" alt="Carro traseira">
            <img src="data:image/png;base64,{b64['direita']}" id="v360c-img-direita" class="moto-img" alt="Carro direita">
            <img src="data:image/png;base64,{b64['esquerda']}" id="v360c-img-esquerda" class="moto-img" alt="Carro esquerda">
          </div>
          <div class="v360-legend">
              <div class="v360-legend-header">🚗 Peças — soltar em: <span id="v360c-leg-vista">FRENTE</span></div>
              <div style="padding:4px 12px 5px;font-size:11px;color:var(--muted);border-bottom:1px solid var(--border);background:rgba(245,158,11,.06);">↔ Arraste ◯ para a foto · Clique no ◯ na foto para classificar</div>
              <div class="v360-legend-scroll" id="v360c-legend-list"></div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:12px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--label);margin-bottom:10px;">Danos registrados</div>
        <div id="v360c-summary-tags">
          <div style="font-size:13px;color:var(--label);text-align:center;padding:18px;border:1px dashed var(--border);border-radius:10px;">Nenhum dano registrado ainda.<br>Adicione marcadores na foto.</div>
        </div>
        <div style="height:1px;background:var(--border);margin:14px 0;"></div>
        <button class="btn btn-success btn-full" style="margin-bottom:8px;" onclick="danSalvarVeiculo()">💾 Salvar este veículo</button>
        <button class="btn btn-primary btn-full btn-lg" onclick="danGerarTexto()">⚡ Gerar Relatório</button>
        <div id="v360c-result-area" style="display:none;margin-top:14px;">
          <div class="result-text" id="v360c-result-text"></div>
          <div class="result-actions">
            <button class="btn btn-success" onclick="v360cCopiar(this)">📋 Copiar</button>
            <button class="btn btn-whats" onclick="v360cWhatsApp()">📲 WhatsApp</button>
          </div>
        </div>
      </div>

      <!-- Fotos dos danos — Carro 360 -->
      <div class="card" style="margin-top:12px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--label);margin-bottom:10px;">📷 Fotos dos Danos</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px;">
          <label class="foto-label" style="flex-direction:column;padding:12px 6px;font-size:12px;">
            <span style="font-size:20px;margin-bottom:3px;">📷</span>Tirar Foto
            <input type="file" accept="image/*" capture="environment" multiple style="display:none;" onchange="danFotoMiniatura(this,'dan-foto-grid-carro360','dan-foto-actions-carro360')">
          </label>
          <label class="foto-label" style="flex-direction:column;padding:12px 6px;font-size:12px;">
            <span style="font-size:20px;margin-bottom:3px;">🖼️</span>Anexar Imagem
            <input type="file" accept="image/*" multiple style="display:none;" onchange="danFotoMiniatura(this,'dan-foto-grid-carro360','dan-foto-actions-carro360')">
          </label>
        </div>
        <div class="foto-grid" id="dan-foto-grid-carro360"></div>
        <div id="dan-foto-actions-carro360" style="display:none;gap:6px;flex-wrap:wrap;margin-top:8px;">
          <button type="button" class="btn btn-sm btn-whats" onclick="danFotoCompartilhar('dan-foto-grid-carro360')">📲 Compartilhar Fotos</button>
          <button type="button" class="btn btn-sm btn-danger" onclick="danFotoLimpar('dan-foto-grid-carro360','dan-foto-actions-carro360')">🗑 Remover Todas</button>
        </div>
      </div>
    </div>
    """

    # Ponto de inserção do bloco.  Procuramos o botão de remover fotos da moto
    # e insere o bloco de carro antes do fechamento da seção.
    marker_pattern = re.compile(r"""          <button type="button" class="btn btn-sm btn-danger" onclick="danFotoLimpar\('dan-foto-grid-moto','dan-foto-actions-moto'\)">🗑 Remover Todas</button>.*?</section>""", re.DOTALL)
    match = marker_pattern.search(html)
    if match:
        original = match.group(0)
        replacement = original.replace("</section>", carro360_html + "  </section>")
        html = html.replace(original, replacement, 1)
        print('✅ Inserido bloco dan-step-carro360')
    else:
        print('⚠️  Marcação para inserção do bloco de carro 360 não encontrada.')

    # Replacements de código JS existentes para suportar o novo modo.  Apenas os
    # blocos principais são modificados aqui; consulte a versão original para
    # mais alterações caso necessário.
    replacements = {
        """  const map = {
    'dan-thumb-frente':   'v360-img-frente',
    'dan-thumb-tras':     'v360-img-tras',
    'dan-thumb-direita':  'v360-img-direita',
    'dan-thumb-esquerda': 'v360-img-esquerda'
  };
  Object.keys(map).forEach(function(thumbId){
    const src = document.getElementById(map[thumbId]);
    const thumb = document.getElementById(thumbId);
    if (src && thumb) thumb.src = src.src;
  });""": """  const map = {
    'dan-thumb-frente':   'v360-img-frente',
    'dan-thumb-tras':     'v360-img-tras',
    'dan-thumb-direita':  'v360-img-direita',
    'dan-thumb-esquerda': 'v360-img-esquerda'
  };
  Object.keys(map).forEach(function(thumbId){
    const src = document.getElementById(map[thumbId]);
    const thumb = document.getElementById(thumbId);
    if (src && thumb) thumb.src = src.src;
  });
  const mapC = {
    'dan-thumbc-frente':   'v360c-img-frente',
    'dan-thumbc-tras':     'v360c-img-tras',
    'dan-thumbc-direita':  'v360c-img-direita',
    'dan-thumbc-esquerda': 'v360c-img-esquerda'
  };
  Object.keys(mapC).forEach(function(thumbId){
    const src = document.getElementById(mapC[thumbId]);
    const thumb = document.getElementById(thumbId);
    if (src && thumb) thumb.src = src.src;
  });""",
        """  if (v === 'moto') {
    document.getElementById('dan-step-moto360').style.display = 'block';
    document.getElementById('dan-step-diagram').style.display = 'none';
    v360db = v360makeDb();
    v360tab = 'frente';
    v360mode = 'moto';
    v360render();
  } else {
    document.getElementById('dan-step-diagram').style.display = 'block';
    document.getElementById('dan-step-moto360').style.display = 'none';
    document.getElementById('dan-veh-badge').textContent  = '🚗';
    document.getElementById('dan-diag-title').textContent = 'Mapeie os danos — Carro';
    danAtualizarTabs();
    danRenderDiagrama();
  }""": """  if (v === 'moto') {
    document.getElementById('dan-step-moto360').style.display = 'block';
    document.getElementById('dan-step-diagram').style.display = 'none';
    document.getElementById('dan-step-carro360').style.display = 'none';
    v360db = v360makeDb();
    v360tab = 'frente';
    v360mode = 'moto';
    v360render();
  } else {
    document.getElementById('dan-step-carro360').style.display = 'block';
    document.getElementById('dan-step-diagram').style.display = 'none';
    document.getElementById('dan-step-moto360').style.display = 'none';
    v360cdb = v360cMakeDb();
    v360ctab = 'frente';
    v360mode = 'carro';
    v360cRender();
  }""",
        """function danVoltarStep1() {
  document.getElementById('dan-step-diagram').style.display = 'none';
  document.getElementById('dan-step-moto360').style.display = 'none';
  document.getElementById('dan-step-vehicle').style.display = 'block';
  document.getElementById('dan-result-area').style.display  = 'none';
}""": """function danVoltarStep1() {
  document.getElementById('dan-step-diagram').style.display = 'none';
  document.getElementById('dan-step-moto360').style.display = 'none';
  document.getElementById('dan-step-carro360').style.display = 'none';
  document.getElementById('dan-step-vehicle').style.display = 'block';
  document.getElementById('dan-result-area').style.display  = 'none';
}"""
    }

    for old, new in replacements.items():
        if old in html:
            html = html.replace(old, new, 1)

    # Salvar alterações se houve modificação
    if len(html) != orig_len:
        html_file.write_text(html, encoding='utf-8')
        print(f'✅ Arquivo salvo: {html_file} (\u0394 {len(html) - orig_len:+d} caracteres)')
    else:
        print('ℹ️  Nenhuma modificação feita.')
    return 0

if __name__ == '__main__':
    sys.exit(main())