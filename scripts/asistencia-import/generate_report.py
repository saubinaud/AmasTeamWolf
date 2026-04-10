#!/usr/bin/env python3
"""
Genera un reporte markdown legible con TODO el matching para revisión humana.
Output: docs/asistencia-match-report.md

Secciones:
  1. Resumen ejecutivo
  2. Duplicados detectados en BD (alumnos con nombre casi igual)
  3. Matches certeros (L1/L2 exact) — listos para importar directo
  4. Matches probables (75-94%) — revisión rápida
  5. Matches dudosos (ambiguos) — decisión caso por caso
  6. Sin match (alumnos en Excel que NO están en BD) — decidir crear o ignorar
"""

import json
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

SCRIPT_DIR = Path('/Users/sebastien/Documents/AmasTeamWolf/scripts/asistencia-import')
OUT_FILE = Path('/Users/sebastien/Documents/AmasTeamWolf/docs/asistencia-match-report.md')


def normalize(s):
    if not s:
        return ''
    s = s.strip().upper()
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    s = s.replace('Ñ', 'N')
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'[^A-Z0-9 ]', '', s)
    return s.strip()


def fuzzy(a, b):
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()


def main():
    with open(SCRIPT_DIR / 'matches.json') as f:
        data = json.load(f)
    with open(SCRIPT_DIR / 'alumnos_bd.json') as f:
        alumnos_bd = json.load(f)
    with open(SCRIPT_DIR / 'stats_excel.json') as f:
        stats = json.load(f)

    lines = []
    l = lines.append

    r = data['resumen']

    # ── HEADER ──
    l('# Reporte de match: asistencias Excel ↔ alumnos BD')
    l('')
    l('Generado automáticamente por `scripts/asistencia-import/`.')
    l('Este reporte debe revisarse **línea por línea** antes de importar asistencias.')
    l('')

    # ── 1. RESUMEN ──
    l('## 1. Resumen ejecutivo')
    l('')
    l(f'- **Total marcas en Excels (2025 + 2026)**: {stats["total_marcas"]}')
    l(f'- **Marcas de asistencia (A o R)**: {stats["total_asistio"]}')
    l(f'- **Alumnos únicos en Excels**: {r["total_excel"]}')
    l(f'- **Alumnos en BD**: {r["total_bd"]}')
    l('')
    l('| Categoría | Alumnos | % | Asistencias cubiertas |')
    l('|---|---|---|---|')
    total_asist = sum(a['num_asistencias'] for a in data['certeros'] + data['probables'] + data['dudosos'] + data['sin_match'] if 'num_asistencias' in a)

    def _sum_a(lst):
        return sum(x.get('num_asistencias', 0) for x in lst)

    cert_a = _sum_a(data['certeros'])
    prob_a = _sum_a(data['probables'])
    dud_a = _sum_a(data['dudosos'])
    sin_a = _sum_a(data['sin_match'])

    l(f'| ✅ Certeros (≥95%) | {r["certeros"]} | {r["certeros"]/r["total_excel"]*100:.1f}% | {cert_a} ({cert_a/total_asist*100:.1f}%) |')
    l(f'| 🟢 Probables (75-94%) | {r["probables"]} | {r["probables"]/r["total_excel"]*100:.1f}% | {prob_a} ({prob_a/total_asist*100:.1f}%) |')
    l(f'| 🟡 Dudosos (ambiguos) | {r["dudosos"]} | {r["dudosos"]/r["total_excel"]*100:.1f}% | {dud_a} ({dud_a/total_asist*100:.1f}%) |')
    l(f'| ❌ Sin match | {r["sin_match"]} | {r["sin_match"]/r["total_excel"]*100:.1f}% | {sin_a} ({sin_a/total_asist*100:.1f}%) |')
    l('')

    # ── 2. DUPLICADOS EN BD ──
    l('## 2. Duplicados sospechosos en la BD')
    l('')
    l('Alumnos en la BD con nombres muy similares — posiblemente el mismo alumno registrado 2 veces.')
    l('**Hay que consolidar estos antes de importar** para no generar asistencias ambiguas.')
    l('')

    dupes = []
    bd_list = [a for a in alumnos_bd]
    for i, a in enumerate(bd_list):
        for b in bd_list[i+1:]:
            if a['id'] == b['id']:
                continue
            ratio = fuzzy(a['nombre_alumno'], b['nombre_alumno'])
            if ratio >= 0.88:
                dupes.append((ratio, a, b))

    dupes.sort(key=lambda x: -x[0])

    if not dupes:
        l('_Ninguno detectado con similitud ≥88%._')
    else:
        l('| # | Sim | BD #1 | BD #2 |')
        l('|---|---|---|---|')
        for ratio, a, b in dupes:
            l(f'| {ratio:.2f} | {int(ratio*100)}% | #{a["id"]} "{a["nombre_alumno"]}" (DNI {a["dni_alumno"]}, {a["estado"]}) | #{b["id"]} "{b["nombre_alumno"]}" (DNI {b["dni_alumno"]}, {b["estado"]}) |')
    l('')

    # ── 3. CERTEROS ──
    l('## 3. Matches certeros (✅ importar sin revisar)')
    l('')
    l(f'{len(data["certeros"])} alumnos. Estos son matches exactos normalizados o con ≥95% confidence.')
    l('')
    l('<details><summary>Ver lista completa</summary>')
    l('')
    l('| Conf | Nombre Excel | → Alumno BD | # asist | Años |')
    l('|---|---|---|---|---|')
    for m in sorted(data['certeros'], key=lambda x: x['excel_normalized']):
        t = m['top_match']
        años = ','.join(str(y) for y in m['años'])
        l(f'| {t["confidence"]}% | `{m["excel_nombre"]}` | #{t["bd_id"]} {t["bd_nombre"]} ({t["bd_estado"]}) | {m["num_asistencias"]} | {años} |')
    l('')
    l('</details>')
    l('')

    # ── 4. PROBABLES ──
    l('## 4. Matches probables (🟢 revisar rápido)')
    l('')
    l(f'{len(data["probables"])} alumnos. Confidence 75-94%. **Aprobar o rechazar uno por uno**.')
    l('')
    l('| Conf | Nivel | Nombre Excel | → Alumno BD | # asist | Años | Detalle |')
    l('|---|---|---|---|---|---|---|')
    for m in sorted(data['probables'], key=lambda x: -x['top_match']['confidence']):
        t = m['top_match']
        años = ','.join(str(y) for y in m['años'])
        detail = t['detail'].replace('|', '\\|')[:80]
        l(f'| {t["confidence"]}% | {t["level"]} | `{m["excel_nombre"]}` | #{t["bd_id"]} {t["bd_nombre"]} ({t["bd_estado"]}) | {m["num_asistencias"]} | {años} | {detail} |')
    l('')

    # ── 5. DUDOSOS ──
    l('## 5. Matches dudosos (🟡 decidir caso por caso)')
    l('')
    l(f'{len(data["dudosos"])} alumnos. El #1 y el #2 candidatos están muy cerca en confidence.')
    l('')
    for m in sorted(data['dudosos'], key=lambda x: -x['num_asistencias']):
        años = ','.join(str(y) for y in m['años'])
        l(f'### `{m["excel_nombre"]}` — {m["num_asistencias"]} asistencias, años {años}')
        l('')
        l('| # | Conf | Nivel | BD | Detalle |')
        l('|---|---|---|---|---|')
        for idx, c in enumerate([m['top_match']] + m['otros_candidatos'], 1):
            detail = c['detail'].replace('|', '\\|')[:60]
            l(f'| {idx} | {c["confidence"]}% | {c["level"]} | #{c["bd_id"]} {c["bd_nombre"]} ({c["bd_estado"]}) | {detail} |')
        l('')

    # ── 6. SIN MATCH ──
    l('## 6. Sin match (❌ no están en la BD)')
    l('')
    l(f'{len(data["sin_match"])} alumnos. Probablemente:')
    l('- Alumnos del 2025 que ya no están activos y no fueron migrados a la BD')
    l('- Alumnos del 2026 que aún no fueron registrados')
    l('- Errores de spelling en el Excel que no pudieron matchearse')
    l('')
    l('**Decidir**: crear automáticamente en BD, crear solo los que tienen muchas asistencias, o ignorar por completo.')
    l('')
    l('| Nombre Excel | # asist | Años |')
    l('|---|---|---|')
    for m in sorted(data['sin_match'], key=lambda x: -x.get('num_asistencias', 0)):
        años = ','.join(str(y) for y in m.get('años', []))
        name = m.get('excel_nombre', m.get('excel_normalized', '?'))
        reason = m.get('reason', '')
        extra = f' _{reason}_' if reason else ''
        l(f'| `{name}`{extra} | {m.get("num_asistencias", 0)} | {años} |')
    l('')

    # Guardar
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text('\n'.join(lines), encoding='utf-8')
    print(f'Reporte generado: {OUT_FILE}')
    print(f'Tamaño: {OUT_FILE.stat().st_size / 1024:.1f} KB')


if __name__ == '__main__':
    main()
