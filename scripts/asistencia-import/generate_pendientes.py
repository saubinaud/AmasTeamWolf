#!/usr/bin/env python3
"""Genera lista de alumnos pendientes de revisión manual (probables + dudosos + sin match).

Output:
  docs/asistencia-pendientes.md  — markdown navegable
  docs/asistencia-pendientes.csv — CSV para Excel/Sheets
"""
import json
import csv
from pathlib import Path

SCRIPT_DIR = Path('/Users/sebastien/Documents/AmasTeamWolf/scripts/asistencia-import')
MD_OUT = Path('/Users/sebastien/Documents/AmasTeamWolf/docs/asistencia-pendientes.md')
CSV_OUT = Path('/Users/sebastien/Documents/AmasTeamWolf/docs/asistencia-pendientes.csv')


def main():
    with open(SCRIPT_DIR / 'matches_final.json') as f:
        data = json.load(f)

    pendientes = []

    for m in data['probables']:
        t = m['top_match']
        pendientes.append({
            'categoria': 'PROBABLE',
            'nombre_excel': m.get('excel_nombre', ''),
            'num_asistencias': m.get('num_asistencias', 0),
            'años': ','.join(str(y) for y in m.get('años', [])),
            'bd_sugerido_id': t.get('bd_id', ''),
            'bd_sugerido_nombre': t.get('bd_nombre', ''),
            'bd_sugerido_estado': t.get('bd_estado', ''),
            'confianza': t.get('confidence', 0),
            'detalle': t.get('detail', ''),
            'notas': '',
        })

    for m in data['dudosos']:
        t = m['top_match']
        otros = ' | '.join(
            f'#{c["bd_id"]} {c["bd_nombre"]} ({c["confidence"]}%)'
            for c in m.get('otros_candidatos', [])[:3]
        )
        pendientes.append({
            'categoria': 'DUDOSO',
            'nombre_excel': m.get('excel_nombre', ''),
            'num_asistencias': m.get('num_asistencias', 0),
            'años': ','.join(str(y) for y in m.get('años', [])),
            'bd_sugerido_id': t.get('bd_id', ''),
            'bd_sugerido_nombre': t.get('bd_nombre', ''),
            'bd_sugerido_estado': t.get('bd_estado', ''),
            'confianza': t.get('confidence', 0),
            'detalle': t.get('detail', ''),
            'notas': f'Otros candidatos: {otros}',
        })

    for m in data['sin_match']:
        pendientes.append({
            'categoria': 'SIN_MATCH',
            'nombre_excel': m.get('excel_nombre', ''),
            'num_asistencias': m.get('num_asistencias', 0),
            'años': ','.join(str(y) for y in m.get('años', [])),
            'bd_sugerido_id': '',
            'bd_sugerido_nombre': '',
            'bd_sugerido_estado': '',
            'confianza': '',
            'detalle': '',
            'notas': 'No existe en BD (probable alumno inactivo 2025)',
        })

    # Ordenar por categoría + asistencias descendentes
    orden = {'PROBABLE': 0, 'DUDOSO': 1, 'SIN_MATCH': 2}
    pendientes.sort(key=lambda x: (orden[x['categoria']], -x['num_asistencias']))

    # ── CSV ──
    fields = ['categoria', 'num_asistencias', 'años', 'nombre_excel',
              'bd_sugerido_id', 'bd_sugerido_nombre', 'bd_sugerido_estado',
              'confianza', 'detalle', 'notas']
    with open(CSV_OUT, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for p in pendientes:
            w.writerow(p)
    print(f'CSV: {CSV_OUT} ({len(pendientes)} filas)')

    # ── Markdown ──
    lines = []
    l = lines.append

    l('# Asistencias pendientes de revisión manual')
    l('')
    l('Después de importar los 3,326 matches certeros, quedan estos alumnos que requieren decisión humana.')
    l('')
    l('## Resumen')
    l('')
    counts = {'PROBABLE': 0, 'DUDOSO': 0, 'SIN_MATCH': 0}
    asist = {'PROBABLE': 0, 'DUDOSO': 0, 'SIN_MATCH': 0}
    for p in pendientes:
        counts[p['categoria']] += 1
        asist[p['categoria']] += p['num_asistencias']

    l('| Categoría | Alumnos | Asistencias | Qué hacer |')
    l('|---|---|---|---|')
    l(f'| 🟢 PROBABLE (75-94%) | {counts["PROBABLE"]} | {asist["PROBABLE"]} | Aprobar/rechazar el match sugerido |')
    l(f'| 🟡 DUDOSO | {counts["DUDOSO"]} | {asist["DUDOSO"]} | Elegir entre múltiples candidatos |')
    l(f'| ❌ SIN_MATCH | {counts["SIN_MATCH"]} | {asist["SIN_MATCH"]} | Crear nuevo alumno o ignorar |')
    l('')
    l('**Para registrar asistencias de estos alumnos**: usa el nuevo módulo **Space → Asistencia → Registrar pasadas** (una vez que elijas el ID BD correcto).')
    l('')

    # Sección PROBABLE
    l('## 🟢 Probables (revisar y aprobar)')
    l('')
    l(f'{counts["PROBABLE"]} alumnos. El matcher encontró UN candidato con confianza 75-94%. Revísalo y dime cuáles aprobar.')
    l('')
    l('| # asist | Años | Nombre Excel | → BD sugerido | Conf | Detalle |')
    l('|---|---|---|---|---|---|')
    for p in pendientes:
        if p['categoria'] != 'PROBABLE':
            continue
        l(f'| {p["num_asistencias"]} | {p["años"]} | `{p["nombre_excel"]}` | #{p["bd_sugerido_id"]} {p["bd_sugerido_nombre"]} ({p["bd_sugerido_estado"]}) | {p["confianza"]}% | {p["detalle"][:60]} |')
    l('')

    # Sección DUDOSO
    l('## 🟡 Dudosos (múltiples candidatos cercanos)')
    l('')
    l(f'{counts["DUDOSO"]} alumnos. Hay 2+ candidatos BD con confianza similar. Necesito que elijas.')
    l('')
    for p in pendientes:
        if p['categoria'] != 'DUDOSO':
            continue
        l(f'### `{p["nombre_excel"]}` — {p["num_asistencias"]} asist. ({p["años"]})')
        l(f'- **Sugerido #1**: #{p["bd_sugerido_id"]} {p["bd_sugerido_nombre"]} ({p["bd_sugerido_estado"]}) — {p["confianza"]}%')
        if p['notas']:
            l(f'- **Alternativas**: {p["notas"].replace("Otros candidatos: ", "")}')
        l('')

    # Sección SIN MATCH
    l('## ❌ Sin match (no existen en BD)')
    l('')
    l(f'{counts["SIN_MATCH"]} alumnos — {asist["SIN_MATCH"]} asistencias sin hogar.')
    l('')
    l('Son en su mayoría alumnos del 2025 que ya no están activos. Opciones:')
    l('- Crearlos en BD como `estado=Inactivo` para preservar el historial')
    l('- Ignorar completamente (no importar sus asistencias)')
    l('- Verificar si alguno sigue activo pero tiene typo severo')
    l('')
    l('| # asist | Años | Nombre Excel |')
    l('|---|---|---|')
    for p in pendientes:
        if p['categoria'] != 'SIN_MATCH':
            continue
        l(f'| {p["num_asistencias"]} | {p["años"]} | `{p["nombre_excel"]}` |')
    l('')

    MD_OUT.write_text('\n'.join(lines), encoding='utf-8')
    print(f'MD:  {MD_OUT}')


if __name__ == '__main__':
    main()
