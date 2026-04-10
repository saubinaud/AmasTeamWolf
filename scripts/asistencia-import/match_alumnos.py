#!/usr/bin/env python3
"""
Matching ultra-detallado de alumnos Excel ↔ BD.

Estrategia multi-nivel (por orden de confianza):

  L1 — Match exacto normalizado        → confidence 100
       Normalización = upper + sin tildes + sin puntuación + sin dobles espacios

  L2 — Match por tokens ordenados      → confidence 98
       Permite distinto orden: "Jose Angel Seco" == "Angel Jose Seco"

  L3 — Match por subset de tokens      → confidence 80-95
       Al menos 2 tokens comunes y comparten apellidos principales

  L4 — Fuzzy Levenshtein ratio         → confidence = ratio * 100 (min 80)
       difflib.SequenceMatcher sobre normalizado

  L5 — Sin match                       → requiere revisión o creación

Ambigüedades:
  Si un nombre Excel coincide con >1 alumno BD, se marca como AMBIGUO y
  se incluyen todos los candidatos en el reporte.

El match es MUY conservador: preferimos pedir revisión humana antes que
meter una asistencia al alumno equivocado.
"""

import json
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

OUT_DIR = Path('/Users/sebastien/Documents/AmasTeamWolf/scripts/asistencia-import')


def normalize(s):
    if not s:
        return ''
    s = s.strip().upper()
    s = ''.join(c for c in unicodedata.normalize('NFD', s)
                if unicodedata.category(c) != 'Mn')
    s = s.replace('Ñ', 'N')
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'[^A-Z0-9 ]', '', s)
    return s.strip()


def tokens(s):
    n = normalize(s)
    return [t for t in n.split() if t]


def tokens_sorted_key(s):
    return ' '.join(sorted(tokens(s)))


def token_overlap(tokens_a, tokens_b):
    """Devuelve cantidad de tokens comunes + ratio."""
    set_a = set(tokens_a)
    set_b = set(tokens_b)
    common = set_a & set_b
    union = set_a | set_b
    return {
        'common': sorted(common),
        'common_count': len(common),
        'ratio': len(common) / len(union) if union else 0,
        'a_coverage': len(common) / len(set_a) if set_a else 0,
        'b_coverage': len(common) / len(set_b) if set_b else 0,
    }


def fuzzy_ratio(a, b):
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()


# Nombres de pila comunes — deprioritizar si solo matchean estos
NOMBRES_COMUNES = {
    'MARIA', 'JOSE', 'JUAN', 'LUIS', 'CARLOS', 'JESUS', 'ANGEL', 'MIGUEL',
    'FERNANDO', 'ALEJANDRO', 'SOFIA', 'FERNANDA', 'GABRIEL', 'GABRIELA',
    'ANDRE', 'DANIEL', 'DANIELA', 'VALENTINA', 'VALENTINO', 'ISABELLA',
    'ISABEL', 'EMILIANO', 'ALESSIA', 'ALESSANDRO', 'GAEL', 'MATEO',
    'MATTHEW', 'MATIAS', 'LUCIANA', 'CAMILA', 'SANTIAGO', 'BENJAMIN',
    'JOAQUIN', 'IGNACIO', 'LEONARDO', 'RAFAEL', 'JULIAN', 'FRANCO',
    'SEBASTIAN', 'NICOLAS', 'MARTIN', 'EMILIO', 'ADRIANA', 'ADRIAN',
    'LIAM', 'AARON', 'VICTORIA', 'VALERIA', 'EMMA', 'EMILY', 'JADEN',
    'ELIAS', 'NOAH', 'MAXIMO', 'LUCAS', 'THIAGO', 'MATIAS', 'PIERO',
    'PABLO', 'FELIPE', 'ALEXANDER', 'ANTONIO', 'CRISTIAN', 'DAVID',
    'DIEGO', 'EDUARDO', 'HUGO', 'JAVIER', 'MANUEL', 'MARCO', 'PEDRO',
    'RICARDO', 'ROBERTO', 'SERGIO', 'TOMAS', 'ANA', 'CLARA', 'ELENA',
    'LAURA', 'LUCIA', 'LUNA', 'MARIANA', 'MARINA', 'OLIVIA', 'PAULA',
    'SARA', 'XIMENA', 'ZOE', 'MAR', 'NICOLE', 'CAMILO', 'ARIA',
}

# Apellidos muy comunes en Perú/Español — reducir su peso
APELLIDOS_COMUNES = {
    'GARCIA', 'RODRIGUEZ', 'MARTINEZ', 'HERNANDEZ', 'LOPEZ', 'GONZALEZ',
    'PEREZ', 'SANCHEZ', 'RAMIREZ', 'TORRES', 'FLORES', 'RIVERA', 'GOMEZ',
    'DIAZ', 'CRUZ', 'REYES', 'MORALES', 'JIMENEZ', 'ROJAS', 'VASQUEZ',
    'CASTILLO', 'ROMERO', 'ALVAREZ', 'HERRERA', 'RUIZ', 'VARGAS',
    'CASTRO', 'MENDOZA', 'SILVA', 'CHAVEZ', 'QUISPE', 'MAMANI', 'HUAMAN',
    'CONDORI', 'SOTO', 'SALAZAR', 'NUNEZ', 'PAREDES', 'ESPINOZA',
    'JARA', 'CARRILLO', 'AYALA', 'RAMOS', 'ORTIZ', 'GUERRERO',
    'FERNANDEZ', 'VEGA', 'CAMPOS',
}


def get_apellidos(name):
    """Asume que los últimos 2 tokens del nombre son los apellidos.
    Si el nombre tiene 3 tokens o menos, devuelve todos excepto el primero."""
    t = tokens(name)
    if len(t) <= 1:
        return []
    if len(t) == 2:
        return [t[-1]]  # 1 nombre + 1 apellido
    # 3+ tokens: asumimos los últimos 2 son apellidos (paterno + materno)
    # pero si hay muchos tokens (5+), pueden ser 2-3 nombres + 2 apellidos
    return t[-2:]


def is_generic_token(token):
    return token in NOMBRES_COMUNES or token in APELLIDOS_COMUNES


def score_candidate(excel_name, bd_name):
    """Score detallado con peso de apellidos + detección de tokens únicos."""
    norm_e = normalize(excel_name)
    norm_b = normalize(bd_name)
    tok_e = tokens(excel_name)
    tok_b = tokens(bd_name)

    if not tok_e or not tok_b:
        return None

    # L1: match exacto normalizado
    if norm_e == norm_b:
        return {'level': 'L1_EXACT', 'confidence': 100, 'detail': 'normalized equal'}

    # L2: tokens ordenados iguales
    if tokens_sorted_key(excel_name) == tokens_sorted_key(bd_name):
        return {'level': 'L2_TOKEN_REORDER', 'confidence': 98, 'detail': 'same tokens, different order'}

    ov = token_overlap(tok_e, tok_b)
    fuzzy = fuzzy_ratio(excel_name, bd_name)

    # Apellidos (últimos 2 tokens)
    ape_e = set(get_apellidos(excel_name))
    ape_b = set(get_apellidos(bd_name))
    apellidos_comunes_set = ape_e & ape_b

    # Tokens comunes clasificados
    tokens_comunes = set(ov['common'])
    tokens_unicos_comunes = {t for t in tokens_comunes if not is_generic_token(t)}
    apellidos_unicos_comunes = {t for t in apellidos_comunes_set if t not in APELLIDOS_COMUNES}

    # REGLA DURA #1: si no hay ningún token único compartido (no genérico), rechazar.
    # Esto elimina "MARIA FERNANDA X" vs "MARIA FERNANDA Y" y "X SANCHEZ" vs "Y SANCHEZ"
    if not tokens_unicos_comunes:
        return None

    # REGLA DURA #2: si el lado corto tiene ≤3 tokens y NO están todos en el lado largo,
    # es un match débil a menos que haya apellidos únicos comunes.
    shorter = tok_e if len(tok_e) <= len(tok_b) else tok_b
    longer = tok_b if len(tok_b) >= len(tok_e) else tok_e
    shorter_set = set(shorter)
    longer_set = set(longer)
    shorter_coverage = len(shorter_set & longer_set) / len(shorter_set) if shorter_set else 0

    # Sub-case A: el corto está 100% contenido en el largo → match fuerte
    if shorter_coverage >= 0.99 and len(tokens_unicos_comunes) >= 1:
        # ej. "BENJAMIN MERA" completamente dentro de "BENJAMIN MERA MAGARACI"
        base = 85
        if len(tokens_unicos_comunes) >= 2:
            base += 7
        base += int(fuzzy * 5)
        return {
            'level': 'L3_CONTAINED',
            'confidence': min(base, 96),
            'detail': f'lado corto 100% contenido · únicos={sorted(tokens_unicos_comunes)} · fuzzy={fuzzy:.2f}',
        }

    # Sub-case B: al menos 1 apellido único (no genérico) coincide
    if apellidos_unicos_comunes:
        # REGLA EXTRA: si SOLO hay 1 token común en total (o sea 1 apellido único)
        # y el nombre de pila difiere completamente (primer token distinto),
        # bajar la confidence drásticamente.
        primer_tok_e = tok_e[0] if tok_e else ''
        primer_tok_b = tok_b[0] if tok_b else ''
        nombre_pila_distinto = (
            primer_tok_e != primer_tok_b
            and primer_tok_e not in set(tok_b)
            and primer_tok_b not in set(tok_e)
        )

        # Caso débil: solo 1 apellido coincide Y nombre de pila totalmente distinto
        if len(tokens_unicos_comunes) == 1 and nombre_pila_distinto and fuzzy < 0.65:
            # Probablemente son hermanos o primos, no la misma persona
            return {
                'level': 'L5_APELLIDO_SOLO',
                'confidence': 45 + int(fuzzy * 15),
                'detail': f'solo apellido común ({sorted(apellidos_unicos_comunes)}) · nombres distintos · fuzzy={fuzzy:.2f}',
            }

        base = 80
        if len(apellidos_unicos_comunes) >= 2:
            base += 10
        base += min(8, len(tokens_unicos_comunes) * 3)
        base += int(fuzzy * 8)
        if ov['a_coverage'] < 0.5:
            base -= 8
        return {
            'level': 'L3_APELLIDO_UNICO',
            'confidence': min(base, 96),
            'detail': f'apellidos únicos: {sorted(apellidos_unicos_comunes)} · tokens únicos: {sorted(tokens_unicos_comunes)} · fuzzy={fuzzy:.2f}',
        }

    # Sub-case C: solo apellido común compartido, pero al menos 2 tokens únicos coinciden
    if len(tokens_unicos_comunes) >= 2:
        base = 70 + len(tokens_unicos_comunes) * 3 + int(fuzzy * 10)
        return {
            'level': 'L3_TOKENS_UNICOS',
            'confidence': min(base, 90),
            'detail': f'tokens únicos: {sorted(tokens_unicos_comunes)} · fuzzy={fuzzy:.2f}',
        }

    # Sub-case D: 1 solo token único común + fuzzy alto + apellido genérico coincide
    if len(tokens_unicos_comunes) == 1 and apellidos_comunes_set and fuzzy >= 0.65:
        base = 55 + int(fuzzy * 25)
        return {
            'level': 'L5_WEAK',
            'confidence': min(base, 72),
            'detail': f'solo 1 token único ({sorted(tokens_unicos_comunes)}) · fuzzy={fuzzy:.2f}',
        }

    # Fallback: fuzzy muy alto
    if fuzzy >= 0.92:
        return {'level': 'L4_FUZZY_HIGH', 'confidence': int(fuzzy * 100), 'detail': f'fuzzy {fuzzy:.3f}'}

    return None


def match_one_excel_to_all_bd(excel_name, bd_list):
    """
    Para un nombre de Excel, devuelve los mejores candidatos BD ordenados
    por confidence descendente. Solo devuelve scores ≥ 40.
    """
    candidatos = []
    for bd in bd_list:
        score = score_candidate(excel_name, bd['nombre_alumno'])
        if score is None:
            continue
        candidatos.append({
            'bd_id': bd['id'],
            'bd_nombre': bd['nombre_alumno'],
            'bd_dni': bd['dni_alumno'],
            'bd_estado': bd['estado'],
            **score,
        })
    candidatos.sort(key=lambda c: -c['confidence'])
    return candidatos


def main():
    with open(OUT_DIR / 'alumnos_excel.json') as f:
        alumnos_excel = json.load(f)
    with open(OUT_DIR / 'alumnos_bd.json') as f:
        alumnos_bd = json.load(f)

    print(f'Excel: {len(alumnos_excel)} alumnos únicos')
    print(f'BD:    {len(alumnos_bd)} alumnos')
    print()

    # Hacer el match
    matches_certeros = []      # L1/L2 + L3 >= 90 sin ambigüedad
    matches_probables = []     # L3 80-89 o L4
    matches_dudosos = []       # múltiples candidatos cercanos
    sin_match = []             # no candidatos razonables

    for a in alumnos_excel:
        # Usar la primera variante original como display name
        display_name = a['variantes'][0] if a['variantes'] else a['normalized']
        candidatos = match_one_excel_to_all_bd(display_name, alumnos_bd)

        if not candidatos:
            sin_match.append({
                'excel_nombre': display_name,
                'excel_normalized': a['normalized'],
                'num_asistencias': a['num_asistencias'],
                'años': a['años'],
                'variantes': a['variantes'],
            })
            continue

        # Chequear ambigüedad: si el #1 y el #2 están muy cerca, es dudoso
        top = candidatos[0]
        second = candidatos[1] if len(candidatos) > 1 else None
        is_ambiguous = (
            second is not None
            and top['confidence'] - second['confidence'] < 10
            and second['confidence'] >= 70
        )

        entry = {
            'excel_nombre': display_name,
            'excel_normalized': a['normalized'],
            'num_asistencias': a['num_asistencias'],
            'años': a['años'],
            'variantes': a['variantes'],
            'top_match': top,
            'otros_candidatos': candidatos[1:5],  # hasta 4 alternativas
            'ambiguous': is_ambiguous,
        }

        if is_ambiguous:
            matches_dudosos.append(entry)
        elif top['confidence'] >= 95:
            matches_certeros.append(entry)
        elif top['confidence'] >= 75:
            matches_probables.append(entry)
        else:
            sin_match.append({
                **entry,
                'reason': f'Mejor score ({top["confidence"]}) insuficiente',
            })

    # Guardar resultados
    result = {
        'resumen': {
            'total_excel': len(alumnos_excel),
            'total_bd': len(alumnos_bd),
            'certeros': len(matches_certeros),
            'probables': len(matches_probables),
            'dudosos': len(matches_dudosos),
            'sin_match': len(sin_match),
        },
        'certeros': matches_certeros,
        'probables': matches_probables,
        'dudosos': matches_dudosos,
        'sin_match': sin_match,
    }

    with open(OUT_DIR / 'matches.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print('='*80)
    print('RESUMEN DEL MATCHING')
    print('='*80)
    print(f'  Matches certeros  (L1/L2 o ≥95%):   {len(matches_certeros):4d}  ({len(matches_certeros)/len(alumnos_excel)*100:.1f}%)')
    print(f'  Matches probables (75-94%):         {len(matches_probables):4d}  ({len(matches_probables)/len(alumnos_excel)*100:.1f}%)')
    print(f'  Matches DUDOSOS (ambiguos):         {len(matches_dudosos):4d}  ({len(matches_dudosos)/len(alumnos_excel)*100:.1f}%)')
    print(f'  SIN MATCH (no están en BD):         {len(sin_match):4d}  ({len(sin_match)/len(alumnos_excel)*100:.1f}%)')
    print()

    # Calcular asistencias por categoría
    def sum_asist(lst):
        return sum(x['num_asistencias'] for x in lst)

    print('Asistencias cubiertas por categoría:')
    total_asist = sum(a['num_asistencias'] for a in alumnos_excel)
    cert_a = sum_asist(matches_certeros)
    prob_a = sum_asist(matches_probables)
    dud_a = sum_asist(matches_dudosos)
    sin_a = sum_asist(sin_match)
    print(f'  Certeros: {cert_a:5d}/{total_asist} = {cert_a/total_asist*100:.1f}%')
    print(f'  Probables: {prob_a:5d}/{total_asist} = {prob_a/total_asist*100:.1f}%')
    print(f'  Dudosos:   {dud_a:5d}/{total_asist} = {dud_a/total_asist*100:.1f}%')
    print(f'  Sin match: {sin_a:5d}/{total_asist} = {sin_a/total_asist*100:.1f}%')
    print()

    # Mostrar muestra de cada categoría
    print('\n' + '='*80)
    print('MUESTRA: certeros (5 primeros)')
    print('='*80)
    for m in matches_certeros[:5]:
        t = m['top_match']
        print(f"  [{t['confidence']:3d}% {t['level']}] \"{m['excel_nombre']}\"")
        print(f"      → BD #{t['bd_id']}: \"{t['bd_nombre']}\" (DNI {t['bd_dni']}, {t['bd_estado']})")
        print(f"      {m['num_asistencias']} asistencias en años {m['años']}")

    print('\n' + '='*80)
    print('MUESTRA: probables (todos)')
    print('='*80)
    for m in matches_probables:
        t = m['top_match']
        print(f"  [{t['confidence']:3d}% {t['level']}] \"{m['excel_nombre']}\"")
        print(f"      → BD #{t['bd_id']}: \"{t['bd_nombre']}\" (DNI {t['bd_dni']}, {t['bd_estado']})")
        print(f"      detail: {t['detail']}")
        print(f"      {m['num_asistencias']} asistencias en años {m['años']}")

    print('\n' + '='*80)
    print('DUDOSOS (todos — requieren decisión humana)')
    print('='*80)
    for m in matches_dudosos:
        print(f'\n  "{m["excel_nombre"]}"  ({m["num_asistencias"]} asist., años {m["años"]})')
        for c in [m['top_match']] + m['otros_candidatos']:
            print(f"    [{c['confidence']:3d}% {c['level']:20s}] BD #{c['bd_id']}: \"{c['bd_nombre']}\"")

    print(f'\n\nTotal sin match: {len(sin_match)} alumnos / {sin_a} asistencias')
    print('Se guardó el reporte completo en matches.json')


if __name__ == '__main__':
    main()
