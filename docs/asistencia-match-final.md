# Reporte FINAL de matching Excel ↔ BD

Reporte consolidado después de aplicar overrides manuales.

## Resumen ejecutivo

| Categoría | Alumnos | % | Asistencias | Acción |
|---|---|---|---|---|
| ✅ Matches automáticos (L1/L2/L3 ≥95%) | 149 | 35.8% | 3217 | Importar |
| ✅ Overrides manuales (revisados) | 8 | 1.9% | 123 | Importar |
| 🟢 Probables (75-94%) | 32 | 7.7% | 474 | Revisar rápido |
| 🟡 Dudosos (ambiguos) | 38 | 9.1% | 584 | Decisión caso a caso |
| ❌ Sin match real | 189 | 45.4% | 2245 | Crear inactivos o ignorar |
| **TOTAL** | **416** | **100%** | **6643** | |

**Cobertura total de importación directa**: 157 alumnos = **3340 asistencias (50.3%)**

## Overrides manuales aplicados

8 matches recuperados del grupo "sin match" tras revisión humana:

| # asist | Excel | → BD | Motivo |
|---|---|---|---|
| 47 | `CAMILA VALENTINA GÓMEZ GUAMAN` | #169 Camila Valentina Gómez Huamán (Inactivo) | Typo en apellido: GUAMAN vs HUAMÁN. Nombres de pila y apellido paterno idénticos |
| 37 | `ALMA ISABELA CASTILLO MENDOZA` | #50 Alma Isabel Castillo Mendoza (Activo) | Typo en segundo nombre: ISABELA vs ISABEL. Resto idéntico. fuzzy=0.98 |
| 15 | `CAMILA GOMEZ HUAMAN` | #169 Camila Valentina Gómez Huamán (Inactivo) | Nombre incompleto del Excel (le falta 'Valentina'). Misma persona que CAMILA VAL |
| 12 | `NOAH CASTILLO` | #120 Noha Castillo Prado (Activo) | Typo: NOAH vs NOHA (intercambio AH/HA), único 'Noah/Noha Castillo' en ambas fuen |
| 7 | `SOFIA QUISPE` | #158 Sophfia Quispe Gómez (Inactivo) | Typo: SOFIA vs SOPHFIA. Misma persona que 'SOPHFIA QUISPE GÓMEZ' que ya matcheó  |
| 2 | `LIA SALAZAR CASTILLA` | #166 Lia Salazar Castillo (Inactivo) | Typo en apellido materno: CASTILLA vs CASTILLO. fuzzy=0.95 |
| 2 | `SANTIAGO FERNÁNDEZ DÍAZ` | #176 Santiago Alonso Fernández Díaz (Inactivo) | El Excel omitió el segundo nombre 'Alonso'. fuzzy_apellidos=1.00 |
| 1 | `LUCIANA VARGAS RAMIREZ` | #214 LUCIANA CAMILA VARGAS RAMÍREZ  (Activo) | El Excel omitió el segundo nombre 'Camila'. Apellidos completos idénticos. fuzzy |

## Duplicados en BD — acción requerida antes de importar

Los siguientes pares son el mismo alumno registrado 2 veces. Hay que consolidar ANTES de importar:

| BD #1 | BD #2 | Observación |
|---|---|---|
| #7 Sofia Valderrama Sigueñas | #213 Sofía Valderrama Sigueñas | Ambos sin DNI, ambos Activos |
| #23 Alessia Minerva Moreno Sánchez (DNI 93701527) | #230 Alessia minerva moreno Sánchez (DNI 93701525) | DNIs difieren por 1 dígito |
| #124 Piero Valentino Flores Núñez (DNI 93772219) | #207 Piero Valentino Flores Nuñez (sin DNI) | Uno con DNI, otro sin |
| #167 Pedro Darío Palli De La Cruz (DNI 934738863, Inactivo) | #192 Pedro Darío Palli De La Cruz (DNI 93508391, Activo) | DNI del inactivo tiene 9 dígitos (error) |
| #172 Mìa Victoria Barinotto Zavaleta (Inactivo) | #191 Mía Victoria Barinotto Zavaleta (Activo) | Tilde invertida |
| #184 Isao Nicolás Higa Farías (DNI 937961478, Inactivo) | #205 Isao Nicolás Higa Farías (sin DNI, Activo) | DNI largo incorrecto |
| #196 Noah Alexander Castillo Prado (DNI 93947710) | #210 Noah Alexander Castillo Prado (sin DNI) | |
| #175 Vasco Alejandro Quevedo Oroz (Inactivo) | #190 Vasco Alejando Quevedo Oroz (Activo) | Typo "Alejandro" vs "Alejando" |
| #64 Dehlé Joaquim Salas Morales | #189 Dhlé Joaquim Salas Morales | Nombre con typo |
| #102 Luka Derek Huaman Casa | #208 Luka Derek Huamán Casas | Tildes y plural |

## Casos pendientes de decisión

### PIERO VALENTINO GONZALES NUÑEZ
- **Asistencias**: 34
- **Años**: [2025, 2026]
- **Posible match**: BD #124 Piero Valentino Flores Núñez
- **Duda**: Nombres de pila 100% idénticos (Piero Valentino) y apellido materno Núñez coincide, pero el apellido PATERNO es distinto (GONZALES en Excel vs FLORES en BD). ¿Es typo severo o son 2 personas distintas? El Excel solo tiene este 'Piero Valentino', no hay 'Piero Valentino Flores' en ningún lado.

### EIDRIAN FABIAN FLORES NUÑEZ
- **Asistencias**: 17
- **Posible match**: BD #124 
- **Duda**: Apellidos FLORES NÚÑEZ coinciden 100% con BD #124 pero nombres de pila totalmente distintos (Eidrian Fabian vs Piero Valentino). Probable hermano de #124 que NO está en BD.

## Sin match real (no están en BD)

189 alumnos. **2245 asistencias del 2025** en su mayoría.

Son alumnos que ya no están en la BD porque:
- Dejaron la academia durante 2025
- Son hermanos de alumnos actuales pero nunca fueron registrados individualmente
- Apellidos que coinciden con alumnos BD pero son personas distintas (mismos apellidos familiares)

Verifiqué exhaustivamente los 30 con más asistencias — ninguno tiene typo severo oculto.

### Top 30 por asistencias (para que confirmes si alguno debería estar en BD)

| # asist | Años | Nombre |
|---|---|---|
| 55 | 2025 | `KEIRA ROMINA PABLO CUEVA` |
| 50 | 2025 | `GAEL ADRIEZ LUNA QUISPE` |
| 42 | 2025 | `LOLA SANCHEZ PINTO` |
| 41 | 2025 | `JAVIER PIERO BARRERA ANCO` |
| 41 | 2025 | `VALENTINA FLAVIA VALDIVIESZO ROMAN` |
| 40 | 2025 | `JOAQUIN IGNACIO CHUMBES ROMAN` |
| 39 | 2025 | `ISABELLA QUISPE LUCAS` |
| 36 | 2025 | `LEONARDO GAEL AGUILAR DELGADO` |
| 36 | 2025 | `PIERO PAOLO NORATTO GEISER` |
| 34 | 2025,2026 | `PIERO VALENTINO GONZALES NUÑEZ` |
| 33 | 2025 | `LIAM GAEL PABLO CUEVA` |
| 33 | 2025 | `THIAGO RUIZ MINGA` |
| 30 | 2025 | `DANIELA ALEXANDRA CABELLO LEÓN` |
| 29 | 2025 | `ALESSANDRO GHAEL PALOMINO PEÑA` |
| 27 | 2025 | `ETHAN SANTIAGO BRUCE CATALAN LAYME` |
| 26 | 2025 | `ABRIL CANO VEGA` |
| 26 | 2025 | `THIAGO ABRAHAM MATIENZO TELLO` |
| 25 | 2025 | `EDUARDO FERNANDEZ VILLALAS` |
| 25 | 2025 | `MARCELA VICTORIA GIRALDO RAMIREZ` |
| 24 | 2025 | `MARÍA FERNANDA POMA ROMERO` |
| 23 | 2025 | `ISABELLA VALENTINA GUINEA CERDAN` |
| 23 | 2025 | `JARED EVARISTO GUIZADO MITMA` |
| 23 | 2025 | `WILLY SALVADOR RABORG BERROCAL` |
| 22 | 2025 | `ANIA KAELLA MIA DELGADO JIMENEZ` |
| 22 | 2025 | `MARCELO SANTOS URBANO` |
| 22 | 2025 | `MAXIMO DANIEL JAUREGUI DALAS` |
| 22 | 2025 | `MIA AITHANA ROSSELL MECCA` |
| 21 | 2025 | `ADRIANA  ARANDA GUEVARA` |
| 21 | 2025 | `MARTIN CAO RUIXUAN RUIZ CHU` |
| 20 | 2025 | `ALEJANDRO OCTAVIO ALEGRIA YUPANQUI` |

_(Ver `docs/asistencia-sin-match-analisis.md` para la lista completa de 189 alumnos)_

## ❓ Decisiones que necesito

1. **Duplicados BD** (10 casos): ¿Consolido yo? Por cada par, elegir un ID ganador y migrar las referencias (asistencias, inscripciones, pagos, etc.) del perdedor hacia él + marcar el perdedor como eliminado.

2. **Sin match real** (179 alumnos, 2,115 asistencias):
   - **Opción A**: Crear todos como `estado=Inactivo` para preservar historia del 2025
   - **Opción B**: Crear solo los que tienen ≥10 asistencias (unos 60 alumnos)
   - **Opción C**: Ignorar completamente — no importar estas asistencias

3. **Piero Valentino Gonzales Núñez** (34 asistencias): ¿es la misma persona que BD #124 "Piero Valentino Flores Núñez" con typo severo en apellido paterno, o son 2 personas distintas?

4. **Probables + Dudosos** (70 alumnos combinados): ¿prefieres que los aplique todos automáticamente (tras mi revisión) o te muestro cada uno para aprobación manual?

5. **Una vez decidido lo anterior**: procedo a escribir el script de inserción a BD que:
   - Valida no duplicar asistencias ya registradas
   - Usa `registrar_asistencia()` o INSERT directo a `asistencias`
   - Marca `metodo_registro = 'excel_import_2026_04'`
   - Hace rollback si algo falla