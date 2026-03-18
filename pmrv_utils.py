"""
Utilitários para manipulação de códigos de sinistro e formatação de itens de relatório.

Este módulo define funções auxiliares para:
  * Gerar a combinação de tipo e subtipo no formato "X+Y" a partir de um valor
    de subtipo como "X.Y".
  * Limpar descrições de itens de dano retirando índices numéricos iniciais e
    emojis de alerta (por exemplo, "⚠️").

Exemplo de uso:

    from pmrv_utils import compute_code, format_damage_item
    codigo = compute_code('2.1')  # retorna '2+2.1'
    texto  = format_damage_item('01 - Farol: ⚠️ Quebrado')
    print(codigo, texto)  # imprime '2+2.1 Farol: Quebrado'
"""

import re
from typing import Optional

def compute_code(subtype: Optional[str]) -> Optional[str]:
    """Gera a combinação tipo+subtipo.

    Recebe uma string no formato "X.Y" (ex.: "2.1") e retorna
    "X+X.Y" (ex.: "2+2.1").  Caso o subtipo esteja vazio ou seja inválido,
    retorna o valor original.

    :param subtype: subtipo no formato "X.Y" ou None.
    :return: código completo "X+X.Y" ou o subtipo original se inválido.
    """
    if not subtype or not isinstance(subtype, str):
        return subtype
    if '.' not in subtype:
        return subtype
    group, _ = subtype.split('.', 1)
    return f"{group}+{subtype}"


def format_damage_item(text: Optional[str]) -> Optional[str]:
    """Remove prefixo numérico e emojis de alerta de um item de relatório.

    Dado um texto como "01 - Farol: ⚠️ Quebrado", remove a numeração
    inicial (ex.: "01 - ") e o emoji de alerta "⚠️" (com ou sem
    variação de seletor) para produzir "Farol: Quebrado".

    :param text: texto do item de dano (pode ser None).
    :return: texto sem índice e emojis, ou o valor original se não for string.
    """
    if text is None or not isinstance(text, str):
        return text
    cleaned = text
    # Remove prefixos como "01 - " ou "1. " (números seguidos de hífen ou ponto)
    cleaned = re.sub(r'^\s*\d+\s*[-\.]*\s*', '', cleaned)
    # Remove o emoji de alerta U+26A0 (⚠) com opcional variation selector-16 (U+FE0F)
    cleaned = re.sub(r'\u26A0\uFE0F?', '', cleaned)
    # Remove qualquer outro emoji genérico nas faixas Unicode de símbolos variados
    # Esta expressão elimina caracteres no bloco Misc Symbols & Pictographs, etc.
    cleaned = re.sub(r'[\U0001F300-\U0001FAFF]', '', cleaned)
    # Remove caracteres de controle que possam ter sido deixados para trás
    cleaned = re.sub(r'[\u0000-\u001F\u007F]', '', cleaned)
    return cleaned.strip()


if __name__ == '__main__':
    # Exemplo de uso quando executado diretamente
    examples = [
        ('2.1', '01 - Farol: ⚠️ Quebrado'),
        ('5.3', '02. Parachoque: Amassado'),
        ('', 'Sem índice'),
    ]
    for subtype, text in examples:
        print('compute_code:', compute_code(subtype))
        print('format_damage_item:', format_damage_item(text))