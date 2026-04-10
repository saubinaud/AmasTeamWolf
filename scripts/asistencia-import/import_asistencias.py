#!/usr/bin/env python3
"""
Importa asistencias del Excel a la tabla `asistencias`.

Uso:
    python3 import_asistencias.py --dry-run       # Solo muestra qué haría
    python3 import_asistencias.py --execute       # Ejecuta real (pide confirmación)

Solo importa asistencias de alumnos con match seguro (certeros + overrides manuales).
Dedup: si ya existe asistencia (alumno_id, fecha) → skip.
Marca: metodo_registro = 'excel_import_2026_04'
"""

import json
import sys
import subprocess
import re
from pathlib import Path
from collections import defaultdict

SCRIPT_DIR = Path('/Users/sebastien/Documents/AmasTeamWolf/scripts/asistencia-import')

DB_SSH = [
    'sshpass', '-p', 'Aubinaud919',
    'ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'PubkeyAuthentication=no',
    'root@95.111.254.27',
]


def run_sql(sql):
    """Ejecuta SQL en la BD PostgreSQL remota vía docker exec."""
    cmd = DB_SSH + [
        f'docker exec pallium_amas-db.1.$(docker service ps pallium_amas-db -q --no-trunc | head -1) '
        f'psql -U amas_user -d amas_database -A -F"|" -t -c "{sql}"'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        print(f'ERROR SQL: {result.stderr}')
        print(f'SQL: {sql}')
        sys.exit(1)
    return result.stdout.strip()


def derivar_turno(programa):
    """Deriva el turno (Mañana/Tarde) del nombre del programa."""
    p = programa.upper()
    if 'PM' in p:
        return 'Tarde'  # Si hay PM, es tarde (incluso si también tiene AM duplicado)
    if 'AM' in p:
        return 'Mañana'
    return 'Tarde'  # default


def derivar_hora(programa):
    """Extrae la primera hora del programa (ej. '3:00 PM' → '15:00')."""
    # Buscar patrones HH:MM AM/PM
    match = re.search(r'(\d{1,2}):?(\d{0,2})\s*(AM|PM)', programa.upper())
    if not match:
        return None
    h = int(match.group(1))
    m = int(match.group(2)) if match.group(2) else 0
    ampm = match.group(3)
    if ampm == 'PM' and h < 12:
        h += 12
    elif ampm == 'AM' and h == 12:
        h = 0
    return f'{h:02d}:{m:02d}:00'


def escape_sql(s):
    """Escapa string para SQL literal (comillas simples)."""
    if s is None:
        return 'NULL'
    return "'" + str(s).replace("'", "''") + "'"


def main():
    dry_run = '--execute' not in sys.argv
    execute = '--execute' in sys.argv

    if not dry_run and not execute:
        print('Usage: --dry-run (default) o --execute')
        sys.exit(1)

    print(f'{"="*70}')
    print(f'IMPORT ASISTENCIAS EXCEL → BD')
    print(f'Modo: {"DRY-RUN (no inserta)" if dry_run else "EXECUTE (insertará)"}')
    print(f'{"="*70}\n')

    # Cargar data
    with open(SCRIPT_DIR / 'matches_final.json') as f:
        matches = json.load(f)
    with open(SCRIPT_DIR / 'asistencias_excel.json') as f:
        all_asistencias = json.load(f)

    # Construir mapa normalized → bd_id de los matches SEGUROS (certeros + overrides)
    safe_map = {}  # normalized_name → bd_id
    seen_bd_ids = set()  # para detectar si múltiples Excel names → mismo bd_id

    # 1) Certeros automáticos
    for m in matches['certeros_auto']:
        norm = m['excel_normalized']
        bd_id = m['top_match']['bd_id']
        safe_map[norm] = bd_id
        seen_bd_ids.add(bd_id)

    # 2) Overrides manuales
    for m in matches['overrides_manuales']:
        norm = m['excel_normalized']
        bd_id = m['top_match']['bd_id']
        safe_map[norm] = bd_id

    print(f'Alumnos con match seguro: {len(safe_map)}')
    print(f'  · Certeros auto: {len(matches["certeros_auto"])}')
    print(f'  · Overrides manuales: {len(matches["overrides_manuales"])}')

    # Normalizar nombre del Excel (reusar lógica)
    import unicodedata
    def normalize(s):
        if not s:
            return ''
        s = s.strip().upper()
        s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
        s = s.replace('Ñ', 'N')
        s = re.sub(r'\s+', ' ', s)
        s = re.sub(r'[^A-Z0-9 ]', '', s)
        return s.strip()

    # Agrupar asistencias del Excel por alumno (normalizado) y filtrar solo los safe_map
    to_insert = []
    skipped_no_match = 0
    for a in all_asistencias:
        if a['tipo'] != 'A' and a['tipo'] != 'R':
            continue
        norm = normalize(a['nombre_original'])
        if norm not in safe_map:
            skipped_no_match += 1
            continue
        bd_id = safe_map[norm]
        to_insert.append({
            'alumno_id': bd_id,
            'fecha': a['fecha'],
            'turno': derivar_turno(a['programa']),
            'hora': derivar_hora(a['programa']),
            'programa_excel': a['programa'],
            'file': a['file'],
            'sheet': a['sheet'],
            'nombre_original': a['nombre_original'],
        })

    print(f'\nAsistencias a considerar (de matches seguros): {len(to_insert)}')
    print(f'Asistencias sin match seguro (skipped): {skipped_no_match}')

    # Dedup contra BD existente
    print('\nConsultando asistencias ya existentes en BD...')
    # Construir set de (alumno_id, fecha) que ya existen
    alumno_ids_touched = sorted(set(a['alumno_id'] for a in to_insert))
    id_list = ','.join(str(i) for i in alumno_ids_touched)
    sql_check = (
        f"SELECT alumno_id, fecha FROM asistencias "
        f"WHERE alumno_id IN ({id_list})"
    )
    out = run_sql(sql_check)
    existentes = set()
    for line in out.split('\n'):
        line = line.strip()
        if not line:
            continue
        parts = line.split('|')
        if len(parts) == 2:
            try:
                existentes.add((int(parts[0]), parts[1]))
            except ValueError:
                continue
    print(f'Asistencias ya existentes (cualquier método): {len(existentes)}')

    # Filtrar duplicados
    nuevas = []
    dup_por_alumno = defaultdict(int)
    for a in to_insert:
        key = (a['alumno_id'], a['fecha'])
        if key in existentes:
            dup_por_alumno[a['alumno_id']] += 1
            continue
        nuevas.append(a)

    total_dup = sum(dup_por_alumno.values())
    print(f'\nDedup:')
    print(f'  · Duplicadas (ya existen en BD, skipped): {total_dup}')
    print(f'  · Nuevas a insertar:                      {len(nuevas)}')

    # Dedup interno del Excel (mismo alumno + mismo día aparece 2 veces por error)
    seen_keys = set()
    nuevas_dedup = []
    dup_interno = 0
    for a in nuevas:
        key = (a['alumno_id'], a['fecha'])
        if key in seen_keys:
            dup_interno += 1
            continue
        seen_keys.add(key)
        nuevas_dedup.append(a)
    if dup_interno:
        print(f'  · Duplicados internos del Excel:          {dup_interno}')
    print(f'\nTOTAL A INSERTAR: {len(nuevas_dedup)} asistencias')

    # Stats por alumno
    por_alumno = defaultdict(int)
    for a in nuevas_dedup:
        por_alumno[a['alumno_id']] += 1
    print(f'Alumnos que recibirán asistencias: {len(por_alumno)}')

    # Distribución por año/mes
    por_mes = defaultdict(int)
    for a in nuevas_dedup:
        ym = a['fecha'][:7]
        por_mes[ym] += 1
    print('\nDistribución por mes:')
    for ym in sorted(por_mes):
        print(f'  {ym}: {por_mes[ym]:4d}')

    # Sample
    print('\nMuestra de 5 asistencias a insertar:')
    for a in nuevas_dedup[:5]:
        print(f'  alumno_id={a["alumno_id"]:3d}  fecha={a["fecha"]}  turno={a["turno"]}  hora={a["hora"]}  [{a["nombre_original"][:40]}]')

    if dry_run:
        print('\n✅ DRY-RUN completado. Nada se insertó.')
        print('Para ejecutar real: python3 import_asistencias.py --execute')
        return

    # ── EXECUTE ──
    print(f'\n⚠️  A PUNTO DE INSERTAR {len(nuevas_dedup)} asistencias en PRODUCCIÓN')
    if '--yes' not in sys.argv:
        respuesta = input('Escribe "SI IMPORTAR" para confirmar: ')
        if respuesta.strip() != 'SI IMPORTAR':
            print('Cancelado.')
            return

    # Generar script SQL con VALUES múltiples en lotes de 200
    batch_size = 200
    total_inserted = 0
    print(f'\nInsertando en lotes de {batch_size}...')
    for i in range(0, len(nuevas_dedup), batch_size):
        batch = nuevas_dedup[i:i+batch_size]
        values = []
        for a in batch:
            obs = f"Import Excel {a['file']} / {a['programa_excel'][:40]}"
            values.append(
                f"({a['alumno_id']}, "
                f"{escape_sql(a['fecha'])}, "
                f"{escape_sql(a['hora'])}, "
                f"{escape_sql(a['turno'])}, "
                f"'Sí', "
                f"{escape_sql(obs)}, "
                f"'excel_import_2026_04')"
            )
        sql = (
            "INSERT INTO asistencias (alumno_id, fecha, hora, turno, asistio, observaciones, metodo_registro) VALUES "
            + ', '.join(values)
        )
        # Escapar dollar signs y newlines para SSH
        sql_escaped = sql.replace('"', '\\"')
        cmd = DB_SSH + [
            f'docker exec pallium_amas-db.1.$(docker service ps pallium_amas-db -q --no-trunc | head -1) '
            f'psql -U amas_user -d amas_database -c "{sql_escaped}"'
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f'ERROR en batch {i}: {result.stderr}')
            print(f'Abortando. Asistencias insertadas antes del error: {total_inserted}')
            sys.exit(1)
        total_inserted += len(batch)
        print(f'  · Insertadas {total_inserted}/{len(nuevas_dedup)}')

    print(f'\n✅ IMPORT COMPLETADO: {total_inserted} asistencias insertadas')


if __name__ == '__main__':
    main()
