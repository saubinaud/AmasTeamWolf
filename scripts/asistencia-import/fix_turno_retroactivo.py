#!/usr/bin/env python3
"""
Fix retroactivo: las 3326 asistencias importadas del Excel tienen turno='Tarde'
pero deberían tener el NOMBRE DE LA CLASE real (Súper Baby Wolf, Baby Wolf,
Little Wolf, Junior Wolf, Adolescentes Wolf).

Estrategia:
  1. Para cada alumno_id con asistencias metodo_registro='excel_import_2026_04',
     identificar cuál fue SU programa en el Excel (la moda/más frecuente).
  2. Derivar la clase del nombre del programa.
  3. UPDATE todas sus asistencias de ese import con la clase derivada.

NOTA: algunas asistencias podrían venir de múltiples bloques (alumno cambió
de clase). En ese caso se usa la clase más frecuente por alumno.
"""

import json
import re
import unicodedata
import subprocess
import sys
from collections import defaultdict, Counter
from pathlib import Path

SCRIPT_DIR = Path('/Users/sebastien/Documents/AmasTeamWolf/scripts/asistencia-import')

DB_SSH = [
    'sshpass', '-p', 'Aubinaud919',
    'ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'PubkeyAuthentication=no',
    'root@95.111.254.27',
]


def run_sql(sql):
    cmd = DB_SSH + [
        f'docker exec pallium_amas-db.1.$(docker service ps pallium_amas-db -q --no-trunc | head -1) '
        f'psql -U amas_user -d amas_database -c "{sql}"'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        print(f'SQL error: {result.stderr}')
        sys.exit(1)
    return result.stdout.strip()


def normalize(s):
    if not s:
        return ''
    s = s.strip().upper()
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    s = s.replace('Ñ', 'N')
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'[^A-Z0-9 ]', '', s)
    return s.strip()


def derivar_clase(programa):
    """
    Extrae el nombre de la clase del programa del Excel.
    Ejemplos:
      'SUPER BABY WOLF 3:00 PM'           → 'Súper Baby Wolf'
      'MEGA SUPER BABY WOLF 3:00 PM/9:00' → 'Súper Baby Wolf'
      'BABY WOLF 3:30 PM'                 → 'Baby Wolf'
      'LITTLE WOLF 5:00 PM'               → 'Little Wolf'
      'LITLLE WOLF 5:00 PM'               → 'Little Wolf' (typo)
      'JUNIOR WOLF 6:00 PM'               → 'Junior Wolf'
      'ADOLECENTES WOLF 6:30/1:30 PM'     → 'Adolescentes Wolf'
      'WOLF 6:30 PM'                      → 'Adolescentes Wolf' (solo en contexto adolescentes/adultos)
    """
    p = programa.upper()
    # Orden importa: más específico primero (Mega Super > Super, etc.)
    if 'SUPER BABY' in p or 'SÚPER BABY' in p:
        return 'Súper Baby Wolf'
    if 'BABY WOLF' in p:
        return 'Baby Wolf'
    if 'LITTLE WOLF' in p or 'LITLLE WOLF' in p or 'LITEL' in p or 'LITLE' in p:
        return 'Little Wolf'
    if 'JUNIOR' in p:
        return 'Junior Wolf'
    if 'ADOLEC' in p or 'ADOLES' in p:
        return 'Adolescentes Wolf'
    # Fallback
    if 'WOLF' in p:
        return 'Adolescentes Wolf'
    return None


def main():
    dry_run = '--execute' not in sys.argv

    # Cargar matches finales (para saber alumno_id de cada nombre Excel)
    with open(SCRIPT_DIR / 'matches_final.json') as f:
        matches = json.load(f)
    with open(SCRIPT_DIR / 'asistencias_excel.json') as f:
        asist_excel = json.load(f)

    # Mapa normalized → bd_id (certeros + overrides)
    safe_map = {}
    for m in matches['certeros_auto']:
        safe_map[m['excel_normalized']] = m['top_match']['bd_id']
    for m in matches['overrides_manuales']:
        safe_map[m['excel_normalized']] = m['top_match']['bd_id']

    # Para cada (alumno_id, fecha) → programa original del Excel
    por_alumno_fecha = {}
    for a in asist_excel:
        if a['tipo'] != 'A' and a['tipo'] != 'R':
            continue
        norm = normalize(a['nombre_original'])
        if norm not in safe_map:
            continue
        bd_id = safe_map[norm]
        key = (bd_id, a['fecha'])
        por_alumno_fecha[key] = a['programa']

    # Estadística de clases derivadas
    clases_stats = Counter()
    sin_clase = []
    for (bd_id, fecha), programa in por_alumno_fecha.items():
        clase = derivar_clase(programa)
        if clase:
            clases_stats[clase] += 1
        else:
            sin_clase.append((bd_id, fecha, programa))

    print(f'Total (alumno_id, fecha) keys: {len(por_alumno_fecha)}')
    print(f'\nDistribución de clases derivadas:')
    for clase, count in clases_stats.most_common():
        print(f'  {clase:25s}: {count}')
    if sin_clase:
        print(f'\nSin clase derivada ({len(sin_clase)}):')
        for bd_id, fecha, prog in sin_clase[:10]:
            print(f'  alumno={bd_id}  fecha={fecha}  programa={prog!r}')

    # Agrupar por clase para UPDATE en batch
    por_clase = defaultdict(list)  # clase → [(bd_id, fecha), ...]
    for (bd_id, fecha), programa in por_alumno_fecha.items():
        clase = derivar_clase(programa)
        if clase:
            por_clase[clase].append((bd_id, fecha))

    if dry_run:
        print(f'\n✅ DRY-RUN completado. Nada modificado.')
        print(f'Para ejecutar real: python3 fix_turno_retroactivo.py --execute')
        return

    # ── EXECUTE ──
    print(f'\n⚠️  Aplicando UPDATEs...')
    total_updated = 0
    for clase, pairs in por_clase.items():
        print(f'\nClase "{clase}": {len(pairs)} registros')
        # Procesar en batches de 500
        batch_size = 500
        for i in range(0, len(pairs), batch_size):
            batch = pairs[i:i+batch_size]
            # Construir una cláusula WHERE con múltiples OR
            # (alumno_id=X AND fecha='Y') OR (alumno_id=X AND fecha='Y')
            # Más eficiente: IN con tupla de (alumno_id, fecha)
            where_parts = []
            for bd_id, fecha in batch:
                where_parts.append(f"(alumno_id = {bd_id} AND fecha = '{fecha}')")
            where = ' OR '.join(where_parts)
            sql = (
                f"UPDATE asistencias SET turno = '{clase}' "
                f"WHERE metodo_registro = 'excel_import_2026_04' AND ({where})"
            )
            # Evitar comillas en el sql escapando las internas
            sql_escaped = sql.replace('"', '\\"')
            cmd = DB_SSH + [
                f'docker exec pallium_amas-db.1.$(docker service ps pallium_amas-db -q --no-trunc | head -1) '
                f'psql -U amas_user -d amas_database -c "{sql_escaped}"'
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                print(f'  ERROR batch {i}: {result.stderr}')
                sys.exit(1)
            # psql devuelve "UPDATE N"
            out = result.stdout.strip()
            updated = 0
            for line in out.split('\n'):
                if line.startswith('UPDATE '):
                    try:
                        updated = int(line.split()[1])
                    except (ValueError, IndexError):
                        pass
            total_updated += updated
            print(f'  batch {i//batch_size + 1}: actualizadas {updated}')

    print(f'\n✅ Total actualizadas: {total_updated}')


if __name__ == '__main__':
    main()
