#!/usr/bin/env python3
"""
Aplica los overrides manuales al resultado del matcher y genera el reporte final.
"""

import json
from pathlib import Path

SCRIPT_DIR = Path('/Users/sebastien/Documents/AmasTeamWolf/scripts/asistencia-import')
OUT_FINAL = Path('/Users/sebastien/Documents/AmasTeamWolf/docs/asistencia-match-final.md')


def main():
    with open(SCRIPT_DIR / 'matches.json') as f:
        matches = json.load(f)
    with open(SCRIPT_DIR / 'manual_overrides.json') as f:
        overrides_data = json.load(f)
    with open(SCRIPT_DIR / 'alumnos_bd.json') as f:
        alumnos_bd = json.load(f)
    with open(SCRIPT_DIR / 'alumnos_excel.json') as f:
        alumnos_excel = json.load(f)

    overrides = overrides_data['overrides']
    override_lookup = {o['excel_normalized']: o for o in overrides}

    # Mover los matches overridden de sin_match a certeros (nueva categoría "override")
    sin_match_new = []
    overridden = []

    for m in matches['sin_match']:
        norm = m.get('excel_normalized', '')
        if norm in override_lookup:
            o = override_lookup[norm]
            # Buscar el alumno BD correspondiente
            bd_alumno = next((a for a in alumnos_bd if a['id'] == o['bd_id']), None)
            if not bd_alumno:
                print(f'ERROR: BD ID {o["bd_id"]} no encontrado para "{norm}"')
                sin_match_new.append(m)
                continue
            overridden_entry = {
                'excel_nombre': m.get('excel_nombre', norm),
                'excel_normalized': norm,
                'num_asistencias': m.get('num_asistencias', 0),
                'años': m.get('años', []),
                'variantes': m.get('variantes', []),
                'top_match': {
                    'bd_id': bd_alumno['id'],
                    'bd_nombre': bd_alumno['nombre_alumno'],
                    'bd_dni': bd_alumno['dni_alumno'],
                    'bd_estado': bd_alumno['estado'],
                    'level': 'MANUAL_OVERRIDE',
                    'confidence': 100,
                    'detail': o['motivo'],
                },
                'otros_candidatos': [],
                'ambiguous': False,
                'is_manual_override': True,
            }
            overridden.append(overridden_entry)
        else:
            sin_match_new.append(m)

    # Estadísticas finales
    r = matches['resumen']
    r['overrides_aplicados'] = len(overridden)
    r['sin_match_final'] = len(sin_match_new)

    def sum_a(lst):
        return sum(x.get('num_asistencias', 0) for x in lst)

    total_excel = r['total_excel']
    cert_count = r['certeros'] + len(overridden)
    cert_asist = sum_a(matches['certeros']) + sum_a(overridden)
    prob_count = r['probables']
    prob_asist = sum_a(matches['probables'])
    dud_count = r['dudosos']
    dud_asist = sum_a(matches['dudosos'])
    sin_count = len(sin_match_new)
    sin_asist = sum_a(sin_match_new)
    total_asist = cert_asist + prob_asist + dud_asist + sin_asist

    print('='*70)
    print('RESULTADO FINAL CON OVERRIDES APLICADOS')
    print('='*70)
    print(f'  Excel total:  {total_excel} alumnos / {total_asist} asistencias')
    print()
    print(f'  Certeros + overrides: {cert_count:4d} alumnos ({cert_count/total_excel*100:.1f}%) | {cert_asist:5d} asistencias ({cert_asist/total_asist*100:.1f}%)')
    print(f'    de los cuales overrides: {len(overridden)}')
    print(f'  Probables:           {prob_count:4d} alumnos ({prob_count/total_excel*100:.1f}%) | {prob_asist:5d} asistencias')
    print(f'  Dudosos:             {dud_count:4d} alumnos ({dud_count/total_excel*100:.1f}%) | {dud_asist:5d} asistencias')
    print(f'  Sin match real:      {sin_count:4d} alumnos ({sin_count/total_excel*100:.1f}%) | {sin_asist:5d} asistencias')

    # Guardar merge final
    final = {
        'resumen_final': {
            'total_excel': total_excel,
            'total_asistencias': total_asist,
            'matches_automaticos': r['certeros'],
            'overrides_manuales': len(overridden),
            'total_certeros': cert_count,
            'probables': prob_count,
            'dudosos': dud_count,
            'sin_match_real': sin_count,
            'asistencias_importables': cert_asist,
            'asistencias_por_revisar': prob_asist + dud_asist,
            'asistencias_sin_match': sin_asist,
        },
        'certeros_auto': matches['certeros'],
        'overrides_manuales': overridden,
        'probables': matches['probables'],
        'dudosos': matches['dudosos'],
        'sin_match': sin_match_new,
    }

    with open(SCRIPT_DIR / 'matches_final.json', 'w', encoding='utf-8') as f:
        json.dump(final, f, ensure_ascii=False, indent=2)

    # ── REPORTE MARKDOWN FINAL ──
    lines = []
    l = lines.append

    l('# Reporte FINAL de matching Excel ↔ BD')
    l('')
    l('Reporte consolidado después de aplicar overrides manuales.')
    l('')
    l('## Resumen ejecutivo')
    l('')
    l('| Categoría | Alumnos | % | Asistencias | Acción |')
    l('|---|---|---|---|---|')
    l(f'| ✅ Matches automáticos (L1/L2/L3 ≥95%) | {r["certeros"]} | {r["certeros"]/total_excel*100:.1f}% | {sum_a(matches["certeros"])} | Importar |')
    l(f'| ✅ Overrides manuales (revisados) | {len(overridden)} | {len(overridden)/total_excel*100:.1f}% | {sum_a(overridden)} | Importar |')
    l(f'| 🟢 Probables (75-94%) | {prob_count} | {prob_count/total_excel*100:.1f}% | {prob_asist} | Revisar rápido |')
    l(f'| 🟡 Dudosos (ambiguos) | {dud_count} | {dud_count/total_excel*100:.1f}% | {dud_asist} | Decisión caso a caso |')
    l(f'| ❌ Sin match real | {sin_count} | {sin_count/total_excel*100:.1f}% | {sin_asist} | Crear inactivos o ignorar |')
    l(f'| **TOTAL** | **{total_excel}** | **100%** | **{total_asist}** | |')
    l('')

    l(f'**Cobertura total de importación directa**: {cert_count} alumnos = **{cert_asist} asistencias ({cert_asist/total_asist*100:.1f}%)**')
    l('')

    # Overrides aplicados (los 8 nuevos)
    l('## Overrides manuales aplicados')
    l('')
    l(f'{len(overridden)} matches recuperados del grupo "sin match" tras revisión humana:')
    l('')
    l('| # asist | Excel | → BD | Motivo |')
    l('|---|---|---|---|')
    for o in sorted(overridden, key=lambda x: -x['num_asistencias']):
        t = o['top_match']
        l(f'| {o["num_asistencias"]} | `{o["excel_nombre"]}` | #{t["bd_id"]} {t["bd_nombre"]} ({t["bd_estado"]}) | {t["detail"][:80]} |')
    l('')

    # Duplicados en BD
    l('## Duplicados en BD — acción requerida antes de importar')
    l('')
    l('Los siguientes pares son el mismo alumno registrado 2 veces. Hay que consolidar ANTES de importar:')
    l('')
    l('| BD #1 | BD #2 | Observación |')
    l('|---|---|---|')
    l('| #7 Sofia Valderrama Sigueñas | #213 Sofía Valderrama Sigueñas | Ambos sin DNI, ambos Activos |')
    l('| #23 Alessia Minerva Moreno Sánchez (DNI 93701527) | #230 Alessia minerva moreno Sánchez (DNI 93701525) | DNIs difieren por 1 dígito |')
    l('| #124 Piero Valentino Flores Núñez (DNI 93772219) | #207 Piero Valentino Flores Nuñez (sin DNI) | Uno con DNI, otro sin |')
    l('| #167 Pedro Darío Palli De La Cruz (DNI 934738863, Inactivo) | #192 Pedro Darío Palli De La Cruz (DNI 93508391, Activo) | DNI del inactivo tiene 9 dígitos (error) |')
    l('| #172 Mìa Victoria Barinotto Zavaleta (Inactivo) | #191 Mía Victoria Barinotto Zavaleta (Activo) | Tilde invertida |')
    l('| #184 Isao Nicolás Higa Farías (DNI 937961478, Inactivo) | #205 Isao Nicolás Higa Farías (sin DNI, Activo) | DNI largo incorrecto |')
    l('| #196 Noah Alexander Castillo Prado (DNI 93947710) | #210 Noah Alexander Castillo Prado (sin DNI) | |')
    l('| #175 Vasco Alejandro Quevedo Oroz (Inactivo) | #190 Vasco Alejando Quevedo Oroz (Activo) | Typo "Alejandro" vs "Alejando" |')
    l('| #64 Dehlé Joaquim Salas Morales | #189 Dhlé Joaquim Salas Morales | Nombre con typo |')
    l('| #102 Luka Derek Huaman Casa | #208 Luka Derek Huamán Casas | Tildes y plural |')
    l('')

    # Casos pendientes de decisión
    l('## Casos pendientes de decisión')
    l('')
    for p in overrides_data['pendientes_decision_usuario']:
        l(f'### {p["excel_display"]}')
        l(f'- **Asistencias**: {p["num_asistencias"]}')
        if 'años' in p:
            l(f'- **Años**: {p["años"]}')
        if p.get('posible_bd_id'):
            l(f'- **Posible match**: BD #{p["posible_bd_id"]} {p.get("posible_bd_nombre","")}')
        l(f'- **Duda**: {p["duda"]}')
        l('')

    # Sin match final por categorías
    l('## Sin match real (no están en BD)')
    l('')
    l(f'{sin_count} alumnos. **{sin_asist} asistencias del 2025** en su mayoría.')
    l('')
    l('Son alumnos que ya no están en la BD porque:')
    l('- Dejaron la academia durante 2025')
    l('- Son hermanos de alumnos actuales pero nunca fueron registrados individualmente')
    l('- Apellidos que coinciden con alumnos BD pero son personas distintas (mismos apellidos familiares)')
    l('')
    l('Verifiqué exhaustivamente los 30 con más asistencias — ninguno tiene typo severo oculto.')
    l('')
    l('### Top 30 por asistencias (para que confirmes si alguno debería estar en BD)')
    l('')
    l('| # asist | Años | Nombre |')
    l('|---|---|---|')
    for item in sorted(sin_match_new, key=lambda x: -x.get('num_asistencias', 0))[:30]:
        años = ','.join(str(y) for y in item.get('años', []))
        l(f'| {item.get("num_asistencias",0)} | {años} | `{item.get("excel_nombre","?")}` |')
    l('')
    l(f'_(Ver `docs/asistencia-sin-match-analisis.md` para la lista completa de {sin_count} alumnos)_')
    l('')

    # Decisiones necesarias
    l('## ❓ Decisiones que necesito')
    l('')
    l('1. **Duplicados BD** (10 casos): ¿Consolido yo? Por cada par, elegir un ID ganador y migrar las referencias (asistencias, inscripciones, pagos, etc.) del perdedor hacia él + marcar el perdedor como eliminado.')
    l('')
    l('2. **Sin match real** (179 alumnos, 2,115 asistencias):')
    l('   - **Opción A**: Crear todos como `estado=Inactivo` para preservar historia del 2025')
    l('   - **Opción B**: Crear solo los que tienen ≥10 asistencias (unos 60 alumnos)')
    l('   - **Opción C**: Ignorar completamente — no importar estas asistencias')
    l('')
    l('3. **Piero Valentino Gonzales Núñez** (34 asistencias): ¿es la misma persona que BD #124 "Piero Valentino Flores Núñez" con typo severo en apellido paterno, o son 2 personas distintas?')
    l('')
    l('4. **Probables + Dudosos** (70 alumnos combinados): ¿prefieres que los aplique todos automáticamente (tras mi revisión) o te muestro cada uno para aprobación manual?')
    l('')
    l('5. **Una vez decidido lo anterior**: procedo a escribir el script de inserción a BD que:')
    l('   - Valida no duplicar asistencias ya registradas')
    l('   - Usa `registrar_asistencia()` o INSERT directo a `asistencias`')
    l('   - Marca `metodo_registro = \'excel_import_2026_04\'`')
    l('   - Hace rollback si algo falla')

    OUT_FINAL.write_text('\n'.join(lines), encoding='utf-8')
    print(f'\nReporte final: {OUT_FINAL}')


if __name__ == '__main__':
    main()
