#!/usr/bin/env python3
"""
Análisis forense de los "sin match" para clasificar en:

  A) PROBABLE TYPO — hay un candidato BD muy cercano pero mi matcher
     lo rechazó por reglas conservadoras (ej. Isabela vs Isabel).
     → El alumno SÍ existe en BD, solo hay que aceptar el match manualmente.

  B) PROBABLE INACTIVO NO MIGRADO — ningún candidato razonable en BD.
     → El alumno ya no está en la BD, hay que decidir si crearlo inactivo.

Estrategia:
  Para cada sin_match, calcular TODOS los scores con la BD y devolver
  los top 3 candidatos SIN importar el umbral. Luego clasificar en A/B
  según el fuzzy ratio del mejor candidato.
"""

import json
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

SCRIPT_DIR = Path('/Users/sebastien/Documents/AmasTeamWolf/scripts/asistencia-import')
OUT_REPORT = Path('/Users/sebastien/Documents/AmasTeamWolf/docs/asistencia-sin-match-analisis.md')


def normalize(s):
    if not s:
        return ''
    s = s.strip().upper()
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    s = s.replace('Ñ', 'N')
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'[^A-Z0-9 ]', '', s)
    return s.strip()


def tokens(s):
    return [t for t in normalize(s).split() if t]


def fuzzy_ratio(a, b):
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()


def ultimo_apellido(s):
    """Último token (probable apellido materno/paterno)."""
    t = tokens(s)
    return t[-1] if t else ''


def primer_apellido(s):
    """Penúltimo token (probable apellido paterno) o el último si hay solo uno."""
    t = tokens(s)
    if len(t) >= 2:
        return t[-2]
    return t[-1] if t else ''


def first_name(s):
    t = tokens(s)
    return t[0] if t else ''


def best_candidates(excel_name, alumnos_bd, top_n=3):
    """Devuelve los mejores N candidatos sin filtrar por umbral."""
    tok_e = set(tokens(excel_name))
    ape1_e = primer_apellido(excel_name)
    ape2_e = ultimo_apellido(excel_name)
    first_e = first_name(excel_name)

    scored = []
    for bd in alumnos_bd:
        bd_name = bd['nombre_alumno']
        tok_b = set(tokens(bd_name))
        ape1_b = primer_apellido(bd_name)
        ape2_b = ultimo_apellido(bd_name)
        first_b = first_name(bd_name)

        # Múltiples señales
        fuzzy_full = fuzzy_ratio(excel_name, bd_name)

        # Fuzzy de apellidos (últimos 2 tokens concatenados)
        apellidos_e = ' '.join(tokens(excel_name)[-2:])
        apellidos_b = ' '.join(tokens(bd_name)[-2:])
        fuzzy_ape = fuzzy_ratio(apellidos_e, apellidos_b)

        # Fuzzy de nombres (primeros 2 tokens)
        noms_e = ' '.join(tokens(excel_name)[:2])
        noms_b = ' '.join(tokens(bd_name)[:2])
        fuzzy_nom = fuzzy_ratio(noms_e, noms_b)

        # Bonus por token overlap
        common = tok_e & tok_b
        overlap_ratio = len(common) / max(len(tok_e), len(tok_b), 1)

        # Fuzzy del primer apellido (paterno) — muy distintivo
        fuzzy_ape1 = fuzzy_ratio(ape1_e, ape1_b) if ape1_e and ape1_b else 0
        fuzzy_ape2 = fuzzy_ratio(ape2_e, ape2_b) if ape2_e and ape2_b else 0

        # Score combinado (heurístico)
        score = (
            fuzzy_full * 0.4 +
            fuzzy_ape * 0.35 +
            fuzzy_nom * 0.1 +
            overlap_ratio * 0.15
        )

        scored.append({
            'bd_id': bd['id'],
            'bd_nombre': bd_name,
            'bd_dni': bd.get('dni_alumno', ''),
            'bd_estado': bd.get('estado', ''),
            'score': round(score, 3),
            'fuzzy_full': round(fuzzy_full, 3),
            'fuzzy_apellidos': round(fuzzy_ape, 3),
            'fuzzy_nombres': round(fuzzy_nom, 3),
            'fuzzy_ape_paterno': round(fuzzy_ape1, 3),
            'fuzzy_ape_materno': round(fuzzy_ape2, 3),
            'tokens_comunes': sorted(common),
            'overlap_ratio': round(overlap_ratio, 2),
        })

    scored.sort(key=lambda x: -x['score'])
    return scored[:top_n]


def classify(excel_name, candidates):
    """Clasifica un sin_match en A (typo), B (no existe), o C (revisar)."""
    if not candidates:
        return 'B_NO_EXISTE', 'Sin candidatos BD'

    top = candidates[0]
    fuzzy_full = top['fuzzy_full']
    fuzzy_ape = top['fuzzy_apellidos']
    overlap = top['overlap_ratio']

    # A) Very strong typo: fuzzy completo muy alto
    if fuzzy_full >= 0.85:
        return 'A_TYPO_FUERTE', f'fuzzy_full={fuzzy_full}'

    # A) Strong: apellidos ≥0.90 Y fuzzy_full ≥0.70
    if fuzzy_ape >= 0.90 and fuzzy_full >= 0.70:
        return 'A_TYPO_APELLIDOS', f'apellidos={fuzzy_ape} full={fuzzy_full}'

    # A) Strong: overlap ≥70% (casi todos los tokens comparten)
    if overlap >= 0.70 and fuzzy_full >= 0.70:
        return 'A_TYPO_OVERLAP', f'overlap={overlap} full={fuzzy_full}'

    # C) Revisar: algún indicador medio
    if fuzzy_ape >= 0.80 or fuzzy_full >= 0.75:
        return 'C_REVISAR', f'full={fuzzy_full} ape={fuzzy_ape}'

    # B) No existe realmente
    return 'B_NO_EXISTE', f'ningún candidato cercano (best={fuzzy_full})'


def main():
    with open(SCRIPT_DIR / 'matches.json') as f:
        matches_data = json.load(f)
    with open(SCRIPT_DIR / 'alumnos_bd.json') as f:
        alumnos_bd = json.load(f)

    sin_match = matches_data['sin_match']
    print(f'Analizando {len(sin_match)} sin_match vs {len(alumnos_bd)} alumnos BD...')

    # Clasificar cada uno
    clasificados = {
        'A_TYPO_FUERTE': [],
        'A_TYPO_APELLIDOS': [],
        'A_TYPO_OVERLAP': [],
        'C_REVISAR': [],
        'B_NO_EXISTE': [],
    }

    for item in sin_match:
        nombre = item.get('excel_nombre', item.get('excel_normalized', '?'))
        candidates = best_candidates(nombre, alumnos_bd, top_n=3)
        category, reason = classify(nombre, candidates)
        item_enriched = {
            **item,
            'category': category,
            'reason': reason,
            'top_candidates': candidates,
        }
        clasificados[category].append(item_enriched)

    # Stats
    print()
    print('='*70)
    print('CLASIFICACIÓN DE SIN_MATCH')
    print('='*70)
    for cat, items in clasificados.items():
        total_asist = sum(i.get('num_asistencias', 0) for i in items)
        print(f'  {cat:25s}: {len(items):4d} alumnos  |  {total_asist:5d} asistencias')

    total_typos = sum(len(clasificados[c]) for c in ['A_TYPO_FUERTE', 'A_TYPO_APELLIDOS', 'A_TYPO_OVERLAP'])
    typos_asist = sum(sum(i.get('num_asistencias', 0) for i in clasificados[c])
                      for c in ['A_TYPO_FUERTE', 'A_TYPO_APELLIDOS', 'A_TYPO_OVERLAP'])
    no_existe = len(clasificados['B_NO_EXISTE'])
    no_existe_asist = sum(i.get('num_asistencias', 0) for i in clasificados['B_NO_EXISTE'])
    revisar = len(clasificados['C_REVISAR'])
    revisar_asist = sum(i.get('num_asistencias', 0) for i in clasificados['C_REVISAR'])

    print()
    print(f'  → Probable TYPO (A):      {total_typos:4d} alumnos  ({typos_asist} asistencias)')
    print(f'  → Requiere REVISIÓN (C):  {revisar:4d} alumnos  ({revisar_asist} asistencias)')
    print(f'  → No existe en BD (B):    {no_existe:4d} alumnos  ({no_existe_asist} asistencias)')

    # Guardar JSON
    with open(SCRIPT_DIR / 'sin_match_analizado.json', 'w', encoding='utf-8') as f:
        json.dump(clasificados, f, ensure_ascii=False, indent=2)

    # ── Generar markdown report ──
    lines = []
    l = lines.append

    l('# Análisis forense: alumnos Excel sin match en BD')
    l('')
    l('Clasificación de los 197 "sin match" del reporte anterior:')
    l('- **A) Typo probable**: hay un candidato BD casi idéntico (error de tipeo en Excel)')
    l('- **C) Requiere revisión**: candidato BD parecido pero no conclusivo')
    l('- **B) No existe**: ningún candidato razonable → alumno que ya no está en BD')
    l('')

    l('## Resumen')
    l('')
    l('| Categoría | # alumnos | # asistencias | Acción sugerida |')
    l('|---|---|---|---|')
    l(f'| A — Typo fuerte (≥85% fuzzy) | {len(clasificados["A_TYPO_FUERTE"])} | {sum(i.get("num_asistencias",0) for i in clasificados["A_TYPO_FUERTE"])} | Aceptar match automáticamente |')
    l(f'| A — Typo apellidos | {len(clasificados["A_TYPO_APELLIDOS"])} | {sum(i.get("num_asistencias",0) for i in clasificados["A_TYPO_APELLIDOS"])} | Aceptar match |')
    l(f'| A — Typo overlap | {len(clasificados["A_TYPO_OVERLAP"])} | {sum(i.get("num_asistencias",0) for i in clasificados["A_TYPO_OVERLAP"])} | Aceptar match |')
    l(f'| C — Revisar | {len(clasificados["C_REVISAR"])} | {sum(i.get("num_asistencias",0) for i in clasificados["C_REVISAR"])} | Decisión humana caso por caso |')
    l(f'| B — No existe en BD | {len(clasificados["B_NO_EXISTE"])} | {sum(i.get("num_asistencias",0) for i in clasificados["B_NO_EXISTE"])} | Crear en BD como inactivo o ignorar |')
    l('')

    # ── A) Typos fuertes ──
    for cat_key, cat_label in [
        ('A_TYPO_FUERTE', '## A.1 — Typo fuerte (fuzzy ≥85%)'),
        ('A_TYPO_APELLIDOS', '## A.2 — Typo por apellidos (apellidos ≥90%, full ≥70%)'),
        ('A_TYPO_OVERLAP', '## A.3 — Typo por overlap de tokens (overlap ≥70%)'),
        ('C_REVISAR', '## C — Requiere decisión humana'),
    ]:
        items = clasificados[cat_key]
        if not items:
            continue
        l('')
        l(cat_label)
        l('')
        l(f'{len(items)} alumnos.')
        l('')
        l('| # asist | Nombre Excel | → Mejor candidato BD | Fuzzy full | Fuzzy apell | Comunes |')
        l('|---|---|---|---|---|---|')
        for item in sorted(items, key=lambda x: -x.get('num_asistencias', 0)):
            top = item['top_candidates'][0]
            nombre = item.get('excel_nombre', '?')
            comunes = ','.join(top['tokens_comunes'][:4])
            l(f'| {item.get("num_asistencias",0)} | `{nombre}` | #{top["bd_id"]} {top["bd_nombre"]} ({top["bd_estado"]}) | {top["fuzzy_full"]:.2f} | {top["fuzzy_apellidos"]:.2f} | {comunes} |')

    # ── B) No existe ──
    l('')
    l('## B — No existe en BD (probables alumnos 2025 no migrados)')
    l('')
    items = clasificados['B_NO_EXISTE']
    l(f'{len(items)} alumnos. Ordenados por cantidad de asistencias.')
    l('')
    l('_Si reconoces algún nombre como alumno actual, búscalo manualmente en BD — es posible que tenga un typo muy severo que mi algoritmo no detectó._')
    l('')
    l('| # asist | Años | Nombre Excel | Mejor candidato (débil) | Score |')
    l('|---|---|---|---|---|')
    for item in sorted(items, key=lambda x: -x.get('num_asistencias', 0)):
        top = item['top_candidates'][0] if item['top_candidates'] else None
        nombre = item.get('excel_nombre', '?')
        años = ','.join(str(y) for y in item.get('años', []))
        if top:
            l(f'| {item.get("num_asistencias",0)} | {años} | `{nombre}` | #{top["bd_id"]} {top["bd_nombre"]} ({top["bd_estado"]}) | {top["score"]:.2f} |')
        else:
            l(f'| {item.get("num_asistencias",0)} | {años} | `{nombre}` | — | — |')

    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.write_text('\n'.join(lines), encoding='utf-8')
    print(f'\nReporte: {OUT_REPORT}')


if __name__ == '__main__':
    main()
