# Análisis forense: alumnos Excel sin match en BD

Clasificación de los 197 "sin match" del reporte anterior:
- **A) Typo probable**: hay un candidato BD casi idéntico (error de tipeo en Excel)
- **C) Requiere revisión**: candidato BD parecido pero no conclusivo
- **B) No existe**: ningún candidato razonable → alumno que ya no está en BD

## Resumen

| Categoría | # alumnos | # asistencias | Acción sugerida |
|---|---|---|---|
| A — Typo fuerte (≥85% fuzzy) | 6 | 123 | Aceptar match automáticamente |
| A — Typo apellidos | 2 | 16 | Aceptar match |
| A — Typo overlap | 0 | 0 | Aceptar match |
| C — Revisar | 10 | 114 | Decisión humana caso por caso |
| B — No existe en BD | 179 | 2115 | Crear en BD como inactivo o ignorar |


## A.1 — Typo fuerte (fuzzy ≥85%)

6 alumnos.

| # asist | Nombre Excel | → Mejor candidato BD | Fuzzy full | Fuzzy apell | Comunes |
|---|---|---|---|---|---|
| 47 | `CAMILA VALENTINA GÓMEZ GUAMAN` | #169 Camila Valentina Gómez Huamán (Inactivo) | 0.97 | 0.92 | CAMILA,GOMEZ,VALENTINA |
| 37 | `ALMA ISABELA CASTILLO MENDOZA` | #50 Alma Isabel Castillo Mendoza (Activo) | 0.98 | 1.00 | ALMA,CASTILLO,MENDOZA |
| 34 | `PIERO VALENTINO GONZALES NUÑEZ` | #124 Piero Valentino Flores Núñez (Activo) | 0.86 | 0.69 | NUNEZ,PIERO,VALENTINO |
| 2 | `LIA SALAZAR CASTILLA` | #166 Lia Salazar Castillo (Inactivo) | 0.95 | 0.94 | LIA,SALAZAR |
| 2 | `SANTIAGO FERNÁNDEZ DÍAZ` | #176 Santiago Alonso Fernández Díaz (Inactivo) | 0.87 | 1.00 | DIAZ,FERNANDEZ,SANTIAGO |
| 1 | `LUCIANA VARGAS RAMIREZ` | #214 LUCIANA CAMILA VARGAS RAMÍREZ  (Activo) | 0.86 | 1.00 | LUCIANA,RAMIREZ,VARGAS |

## A.2 — Typo por apellidos (apellidos ≥90%, full ≥70%)

2 alumnos.

| # asist | Nombre Excel | → Mejor candidato BD | Fuzzy full | Fuzzy apell | Comunes |
|---|---|---|---|---|---|
| 15 | `CAMILA GOMEZ HUAMAN` | #169 Camila Valentina Gómez Huamán (Inactivo) | 0.79 | 1.00 | CAMILA,GOMEZ,HUAMAN |
| 1 | `ALEJANDRO MARCO VARGAS RAMIREZ` | #214 LUCIANA CAMILA VARGAS RAMÍREZ  (Activo) | 0.71 | 1.00 | RAMIREZ,VARGAS |

## C — Requiere decisión humana

10 alumnos.

| # asist | Nombre Excel | → Mejor candidato BD | Fuzzy full | Fuzzy apell | Comunes |
|---|---|---|---|---|---|
| 24 | `MARÍA FERNANDA POMA ROMERO` | #105 María Fernanda Elera Rey (Activo) | 0.76 | 0.40 | FERNANDA,MARIA |
| 17 | `EIDRIAN FABIAN FLORES NUÑEZ` | #124 Piero Valentino Flores Núñez (Activo) | 0.58 | 1.00 | FLORES,NUNEZ |
| 15 | `DIEGO PALOMINO LAOS` | #126 Rodrigo Alejandro Palomio Campos (Activo) | 0.63 | 0.81 |  |
| 15 | `ROMAN MALQUI HUAMAN` | #215 SANTIAGO MAYU MAITA HUAMAN  (Activo) | 0.62 | 0.80 | HUAMAN |
| 12 | `NOAH CASTILLO` | #120 Noha Castillo Prado (Activo) | 0.75 | 0.59 | CASTILLO |
| 9 | `MILAN BALDEON GUEVARA` | #179 Julieta Zoe Maldonado Guevara (Inactivo) | 0.56 | 0.81 | GUEVARA |
| 8 | `ALBERTO HUARSUCA RAMIREZ` | #54 Arthur Matheo Chauca Ramírez (Activo) | 0.69 | 0.87 | RAMIREZ |
| 7 | `SOFIA QUISPE` | #158 Sophfia Quispe Gómez (Inactivo) | 0.75 | 0.50 | QUISPE |
| 4 | `MARIA FERNANDA CALDERON` | #105 María Fernanda Elera Rey (Activo) | 0.77 | 0.39 | FERNANDA,MARIA |
| 3 | `FERNANDA ALEXA SOLES GUTIERREZ` | #33 Matt Jesús Aures Gutiérrez (Activo) | 0.54 | 0.80 | GUTIERREZ |

## B — No existe en BD (probables alumnos 2025 no migrados)

179 alumnos. Ordenados por cantidad de asistencias.

_Si reconoces algún nombre como alumno actual, búscalo manualmente en BD — es posible que tenga un typo muy severo que mi algoritmo no detectó._

| # asist | Años | Nombre Excel | Mejor candidato (débil) | Score |
|---|---|---|---|---|
| 55 | 2025 | `KEIRA ROMINA PABLO CUEVA` | #140 Rafael Ayvar Cueva (Inactivo) | 0.48 |
| 50 | 2025 | `GAEL ADRIEZ LUNA QUISPE` | #204 Dylan Juan Zabdiel Yangari Quispe (Activo) | 0.51 |
| 42 | 2025 | `LOLA SANCHEZ PINTO` | #223 Rogelio Sánchez  (Activo) | 0.54 |
| 41 | 2025 | `JAVIER PIERO BARRERA ANCO` | #229 Alanis Albania Torres Llanos  (Activo) | 0.41 |
| 41 | 2025 | `VALENTINA FLAVIA VALDIVIESZO ROMAN` | #12 Valentina Alexandra Rosario Cabrera (Activo) | 0.44 |
| 40 | 2025 | `JOAQUIN IGNACIO CHUMBES ROMAN` | #89 Joaquín Ignacio Carbajal Espinoza (Activo) | 0.60 |
| 39 | 2025 | `ISABELLA QUISPE LUCAS` | #57 Benjamin Derek Quispe Huapaya (Activo) | 0.52 |
| 36 | 2025 | `LEONARDO GAEL AGUILAR DELGADO` | #118 Noah Alessandro Aguilera Luyo (Activo) | 0.43 |
| 36 | 2025 | `PIERO PAOLO NORATTO GEISER` | #124 Piero Valentino Flores Núñez (Activo) | 0.40 |
| 33 | 2025 | `LIAM GAEL PABLO CUEVA` | #140 Rafael Ayvar Cueva (Inactivo) | 0.54 |
| 33 | 2025 | `THIAGO RUIZ MINGA` | #9 Nakhay Cruz Sarmiento (Activo) | 0.47 |
| 30 | 2025 | `DANIELA ALEXANDRA CABELLO LEÓN` | #196 Noah Alexander Castillo Prado (Activo) | 0.50 |
| 29 | 2025 | `ALESSANDRO GHAEL PALOMINO PEÑA` | #126 Rodrigo Alejandro Palomio Campos (Activo) | 0.51 |
| 27 | 2025 | `ETHAN SANTIAGO BRUCE CATALAN LAYME` | #215 SANTIAGO MAYU MAITA HUAMAN  (Activo) | 0.44 |
| 26 | 2025 | `ABRIL CANO VEGA` | #34 Camila Maureen Garcia Vega (Activo) | 0.55 |
| 26 | 2025 | `THIAGO ABRAHAM MATIENZO TELLO` | #95 Santiago Alva Macchiavello (Activo) | 0.45 |
| 25 | 2025 | `EDUARDO FERNANDEZ VILLALAS` | #59 Carlos Alberto Fernández Abad (Activo) | 0.57 |
| 25 | 2025 | `MARCELA VICTORIA GIRALDO RAMIREZ` | #214 LUCIANA CAMILA VARGAS RAMÍREZ  (Activo) | 0.50 |
| 23 | 2025 | `ISABELLA VALENTINA GUINEA CERDAN` | #169 Camila Valentina Gómez Huamán (Inactivo) | 0.50 |
| 23 | 2025 | `JARED EVARISTO GUIZADO MITMA` | #90 Jose Andres Veliz Mayta (Activo) | 0.40 |
| 23 | 2025 | `WILLY SALVADOR RABORG BERROCAL` | #185 Salvador Larco Vargas (Inactivo) | 0.44 |
| 22 | 2025 | `ANIA KAELLA MIA DELGADO JIMENEZ` | #181 Catalina Milagros Sandoval Méndez (Inactivo) | 0.47 |
| 22 | 2025 | `MARCELO SANTOS URBANO` | #104 Marcelo Suárez Flores (Activo) | 0.46 |
| 22 | 2025 | `MAXIMO DANIEL JAUREGUI DALAS` | #113 Maykel Aziel Curi Yarasca (Activo) | 0.47 |
| 22 | 2025 | `MIA AITHANA ROSSELL MECCA` | #39 Aitana Polo Mercado (Activo) | 0.51 |
| 21 | 2025 | `ADRIANA  ARANDA GUEVARA` | #179 Julieta Zoe Maldonado Guevara (Inactivo) | 0.47 |
| 21 | 2025 | `MARTIN CAO RUIXUAN RUIZ CHU` | #80 Alice Kylie Rivas Choqque (Activo) | 0.40 |
| 20 | 2025 | `ALEJANDRO OCTAVIO ALEGRIA YUPANQUI` | #43 Alejandro Sebastian Valencia Garcia (Activo) | 0.53 |
| 20 | 2025 | `DANNIA JULIETH SALAZAR ALFARO` | #166 Lia Salazar Castillo (Inactivo) | 0.56 |
| 20 | 2025 | `ELIAS LEONARDO AISPIN CAYCHO` | #136 Yusef Leonardo Tapia Flores (Activo) | 0.48 |
| 20 | 2025 | `LEANDRO HUACHALLANQUI MENDOZA` | #50 Alma Isabel Castillo Mendoza (Activo) | 0.45 |
| 19 | 2025 | `ALBA LUCIA CABALLERO SORIANO` | #66 Aaron Richard Adrian Canaval Florian (Activo) | 0.47 |
| 19 | 2025 | `ARIA DOMENICA CHONG SANCHEZ` | #23 Alessia Minerva Moreno Sánchez (Activo) | 0.57 |
| 19 | 2025 | `KEYLER AZAEL TOBAODA CORDOVA` | #100 Luca Daniel Otoya Custodio (Activo) | 0.44 |
| 19 | 2025 | `MARIA FERNANDA ORBEGOSO LOPEZ` | #183 Saori Domenica Oshiro Lopez (Inactivo) | 0.55 |
| 18 | 2025 | `ELIAS DAVIANGEN OROSCO MONTENEGRO` | #26 Sebastián André Montenegro Alvarez (Activo) | 0.50 |
| 18 | 2025 | `FERNANDA SOCA MEDRARO` | #144 Aitana Sosa Quiroz (Inactivo) | 0.45 |
| 18 | 2025 | `NOAH JOSIAS CHONG SANCHEZ` | #23 Alessia Minerva Moreno Sánchez (Activo) | 0.55 |
| 17 | 2025 | `LUCIANA` | #101 Luciana Celeste Bernis Samame (Activo) | 0.36 |
| 17 | 2025 | `NICOLAS SULLON ANDAGUA` | #117 Nicolas Ordonez Norieda (Activo) | 0.51 |
| 17 | 2025 | `SAID TACSI CANAHUIRI` | #220 David Carranza  (Activo) | 0.40 |
| 16 | 2026 | `BENJAMIN ROMERO` | #56 Benjamin Antonio Romero Camayo (Activo) | 0.56 |
| 16 | 2025 | `IAN JADIEZ LEZAMA OJANAMA` | #209 Sofía Valderrama Salazar (Activo) | 0.46 |
| 15 | 2025 | `DANIELA VERONICA TEJADA YATA` | #141 Alessio Vegara Ezeta (Inactivo) | 0.41 |
| 15 | 2025 | `GABRIEL CORNEJO SANDOVAL` | #153 Luana Cornejo Pichen (Inactivo) | 0.52 |
| 15 | 2025 | `JESUS ALEJANDRO MICHILOT JULCA` | #126 Rodrigo Alejandro Palomio Campos (Activo) | 0.47 |
| 15 | 2025 | `JULIAN CORNEJO SANDOVAL` | #153 Luana Cornejo Pichen (Inactivo) | 0.58 |
| 15 | 2025 | `MATHEWS MAXIMO ISMAEL PEREZ SAUÑE` | #23 Alessia Minerva Moreno Sánchez (Activo) | 0.43 |
| 15 | 2025 | `MIA CHOZO LOPEZ` | #182 Daiki Noah Oshiro Lopez (Inactivo) | 0.54 |
| 15 | 2025 | `MICAELA PORTOCARRERO BERNAOLA` | #203 Micaela Cordero Chavez (Activo) | 0.50 |
| 15 | 2025 | `SAMIR GABRIEL YAPUCHURA SUXO` | #78 Gabriel Alberto Montes De Oca Pucutay (Activo) | 0.41 |
| 15 | 2026 | `SANTIAGO ELESCANO` | #95 Santiago Alva Macchiavello (Activo) | 0.47 |
| 15 | 2025 | `SANTIAGO ROJAS` | #128 Santiago Alonso Rojas Villasante (Activo) | 0.51 |
| 14 | 2025 | `ARLETH SALAZAR` | #209 Sofía Valderrama Salazar (Activo) | 0.52 |
| 14 | 2025 | `CATALINA ARLETH TIJERO ALIAGA` | #200 Lucca Adriel Toro Vargas (Activo) | 0.46 |
| 14 | 2025 | `GERALD SALOME YAURI` | #43 Alejandro Sebastian Valencia Garcia (Activo) | 0.40 |
| 14 | 2025 | `JOAQUIN SANTIAGO CHANGRA CASTILLO` | #166 Lia Salazar Castillo (Inactivo) | 0.56 |
| 14 | 2025 | `LUCIANA ISABELLA LOZADA BERNALA` | #201 Maria Lucia Lozada Rosales (Activo) | 0.55 |
| 14 | 2025 | `MAR PORTOCARRERO BERNAOLA` | #38 Camilo Rosario Cabrera (Activo) | 0.37 |
| 14 | 2025 | `RODRIGO HUAROTO` | #2 Renzo Elías Rodrigo Justiniano (Activo) | 0.50 |
| 13 | 2025 | `GAEL FLORENTINO TRILLO` | #154 Matthew Gael Ortiz Olaya (Inactivo) | 0.41 |
| 13 | 2025 | `ISAU` | #144 Aitana Sosa Quiroz (Inactivo) | 0.33 |
| 12 | 2025 | `ARYAM VELASQUEZ MONTES` | #171 Maiza Ariana Velásquez Maceda (Inactivo) | 0.58 |
| 12 | 2025 | `CALLIE IVANNA CALLIE IVANNA` | #58 Camila Sofía Gonzales Anaya (Activo) | 0.37 |
| 12 | 2025 | `DAVE GERALD SALOME YAURI` | #177 Adriel Razek Alfaro Huamani (Inactivo) | 0.39 |
| 12 | 2025 | `DYLAN VELASQUEZ MONTES` | #171 Maiza Ariana Velásquez Maceda (Inactivo) | 0.56 |
| 12 | 2025 | `GUILLERMO CASTILLO CULQUI` | #120 Noha Castillo Prado (Activo) | 0.53 |
| 12 | 2025 | `JESUS MICHILOT` | #88 Jesús Adrian Seco Angulo (Activo) | 0.41 |
| 12 | 2025 | `LEONARDO GHAEL AGUILAR DELGADO` | #115 Neythan Stephano Aguilera Luyo (Activo) | 0.44 |
| 12 | 2025 | `TADEO BASTIAN REYES RAMIREZ` | #214 LUCIANA CAMILA VARGAS RAMÍREZ  (Activo) | 0.52 |
| 11 | 2025 | `ADRIANA` | #220 David Carranza  (Activo) | 0.49 |
| 11 | 2025 | `DANIELA AIATAMA CUEVA ZEVALLOS` | #94 Julián Benjamin Cueva Loayza (Activo) | 0.48 |
| 11 | 2025 | `EDU LASTRA MATA` | #14 Jorge Francisco Castro Zavaleta (Activo) | 0.42 |
| 11 | 2025 | `GABRIEL RUBIANES` | #79 Gabriel Andrés Castañeda Cáceres (Activo) | 0.44 |
| 11 | 2025 | `JACK ANDIA RUIZ` | #75 Yarek Dylan Díaz Rivera (Activo) | 0.48 |
| 11 | 2025 | `JULIAN CORNEJO` | #153 Luana Cornejo Pichen (Inactivo) | 0.56 |
| 11 | 2025 | `LEONARDO HERNANDEZ FLORIAN` | #176 Santiago Alonso Fernández Díaz (Inactivo) | 0.50 |
| 11 | 2025 | `LEONARDO RODRIGO NAVARRO VALVERDE` | #97 Leonardo Matías Hidalgo Vasquez (Activo) | 0.44 |
| 10 | 2025 | `ALESSANDRO EMILIO PEREZ MEDINA` | #176 Santiago Alonso Fernández Díaz (Inactivo) | 0.47 |
| 10 | 2025 | `CATALINA MARIA ROMERO MALPICA` | #56 Benjamin Antonio Romero Camayo (Activo) | 0.51 |
| 10 | 2025 | `DARIO DAVID FABIAN HERRERA` | #46 Mateo David Porras Ojeda (Activo) | 0.43 |
| 10 | 2025 | `EVAN ADRIAN CASTILLO VALER` | #196 Noah Alexander Castillo Prado (Activo) | 0.56 |
| 10 | 2025 | `EVAN SALVADOR AZULA TIPE` | #71 Estefano Salvador Yarasca Acosta (Activo) | 0.48 |
| 10 | 2025 | `FRANCISCO DAVID PORTELLA MUÑOS` | #229 Alanis Albania Torres Llanos  (Activo) | 0.52 |
| 10 | 2025 | `GABRIEL CORNEJO` | #153 Luana Cornejo Pichen (Inactivo) | 0.49 |
| 10 | 2025 | `KENSHIN GUILLERMO ALVA TAKAYAMA` | #95 Santiago Alva Macchiavello (Activo) | 0.40 |
| 10 | 2025 | `MATEO   VALENTINO VARGAS VASQUEZ` | #124 Piero Valentino Flores Núñez (Activo) | 0.54 |
| 10 | 2025 | `NIKOLAS JIN MENDOZA YANCE` | #23 Alessia Minerva Moreno Sánchez (Activo) | 0.49 |
| 9 | 2025 | `AMANDA VILLACORTA` | #93 Juan Gabriel Lee Villalta (Activo) | 0.44 |
| 9 | 2025 | `ANDRE CASTILLO VALER` | #120 Noha Castillo Prado (Activo) | 0.62 |
| 9 | 2025 | `BASTIAN ALESSIO GUTIERREZ CANCHO` | #35 Adael Jesús Gutiérrez Ureta (Activo) | 0.58 |
| 9 | 2025 | `ITALO ALESSANDRO CARRASSA FAZIO` | #76 Aaron Alessandro Inga Arzapalo (Activo) | 0.50 |
| 9 | 2025 | `LUCAS BOLAÑOS GUTIERREZ` | #33 Matt Jesús Aures Gutiérrez (Activo) | 0.56 |
| 9 | 2025 | `MAO VALENTINO JARA SICSHI` | #111 Matteo Jairo Micheel (Activo) | 0.47 |
| 9 | 2025 | `NICOLAS VILDOSO GARCIA` | #184 Isao Nicolás Higa Farías (Inactivo) | 0.50 |
| 8 | 2025 | `CAMILO ROSAMO` | #38 Camilo Rosario Cabrera (Activo) | 0.54 |
| 8 | 2025 | `CESAR ADRIAN` | #88 Jesús Adrian Seco Angulo (Activo) | 0.43 |
| 8 | 2025 | `DANIELA TEJADA YATA` | #61 Daniela Reynoso Barahona (Activo) | 0.44 |
| 8 | 2025 | `LUCAS AGUERO MESARES` | #200 Lucca Adriel Toro Vargas (Activo) | 0.46 |
| 8 | 2025 | `MABEL TOMAS PEDRAZA` | #60 Daniel Tomas Figueroa Fernández (Activo) | 0.46 |
| 8 | 2025 | `MATEO SOLLER PONCE` | #105 María Fernanda Elera Rey (Activo) | 0.38 |
| 8 | 2025 | `PIA TORERO MERINO` | #110 Matteo Augusto Rivas Merino (Activo) | 0.51 |
| 8 | 2025 | `SALVADOR EFRAIN BUSTAMANTE PEREZ` | #164 Lara Velez Perez (Inactivo) | 0.43 |
| 8 | 2025 | `VIOLETA MENDIETA LOZADA` | #20 Sofía Romina Rhaenyra Mendieta Valer (Activo) | 0.52 |
| 7 | 2025 | `ANDRE LEONARDO CARMELO POMA` | #69 Emiliano Alonso Chia Roman (Activo) | 0.45 |
| 7 | 2025 | `ANTONELLA VICTORIA ALDANA CARLOS` | #53 Antonella Esperanza Olano Contreras (Activo) | 0.52 |
| 7 | 2026 | `ANTONELLA ZEA ESPINOZA` | #89 Joaquín Ignacio Carbajal Espinoza (Activo) | 0.49 |
| 7 | 2025 | `BASTIAN MIJAEL MORALES JARAMILLO` | #127 Rodrigo Christian Morales Tarazona (Activo) | 0.54 |
| 7 | 2025 | `FACUNDO VALENTINO RIOS MEDINA` | #45 Alessia Valentina Rojas Diaz (Activo) | 0.55 |
| 7 | 2025 | `ITALA BRAÑEZ MOLERO` | #96 Julio Luciano Paucar Molero (Activo) | 0.48 |
| 7 | 2025 | `PIA VALENTINA TORERO MERINO` | #45 Alessia Valentina Rojas Diaz (Activo) | 0.49 |
| 7 | 2026 | `RAFAEL TERRIBLE` | #164 Lara Velez Perez (Inactivo) | 0.41 |
| 7 | 2025 | `SANTIAGO ANDRE GASTO MESCUA` | #168 Santiago Ignacio De Jesus Rojas Cuyubamba (Inactivo) | 0.47 |
| 7 | 2025 | `SOPHIE GABRIELLE VALENTINA ALBITES QUIROZ` | #144 Aitana Sosa Quiroz (Inactivo) | 0.45 |
| 6 | 2025 | `ADRIAN MOISES GARCIA CAHUANA` | #34 Camila Maureen Garcia Vega (Activo) | 0.53 |
| 6 | 2025 | `DARIUS ABEL ALEMAN SAVEDRA` | #75 Yarek Dylan Díaz Rivera (Activo) | 0.40 |
| 6 | 2025 | `EVAN DIAZ AUCCAPUCLLA` | #133 Vasco Diaz Tapia (Activo) | 0.58 |
| 6 | 2025 | `FABIAN FABRIZIO ABARCA ANGELES` | #44 Laia Thais Jara Paredes (Activo) | 0.49 |
| 6 | 2025 | `FERNANDA CATALINA SOCA MEDRANO` | #181 Catalina Milagros Sandoval Méndez (Inactivo) | 0.47 |
| 6 | 2026 | `FERNANDA SOLES` | #105 María Fernanda Elera Rey (Activo) | 0.48 |
| 6 | 2025 | `JOAQUIN CHANGRA CASTILLO` | #166 Lia Salazar Castillo (Inactivo) | 0.56 |
| 6 | 2025 | `JOAQUIN  MATEO GONZALES CABRERA` | #119 Noah Rafael Gonzales Romero (Activo) | 0.60 |
| 6 | 2025 | `LUIS EDUARDO VILDO RIOFIO` | #190 Vasco Alejando Quevedo Oroz (Activo) | 0.40 |
| 6 | 2025 | `LUZ CATALINA SALINAS CARRION` | #166 Lia Salazar Castillo (Inactivo) | 0.46 |
| 6 | 2026 | `MATEO CHAUCA` | #54 Arthur Matheo Chauca Ramírez (Activo) | 0.48 |
| 6 | 2025 | `MATEO JOSEPH HUATAY` | #152 Derek Mateo Romero Carhuallanqui (Inactivo) | 0.43 |
| 5 | 2026 | `ANTONELLA SALVADOR PILCO` | #166 Lia Salazar Castillo (Inactivo) | 0.48 |
| 5 | 2025 | `EDUARDO AQUINO PELLEGRIN` | #96 Julio Luciano Paucar Molero (Activo) | 0.36 |
| 5 | 2025 | `FELIPE PUÑO  NUÑEZ` | #124 Piero Valentino Flores Núñez (Activo) | 0.49 |
| 5 | 2025 | `GiANELLA NICOLE CALDERON AGUIRRE` | #203 Micaela Cordero Chavez (Activo) | 0.47 |
| 5 | 2025 | `IAN SCHMIDT MARIÑO` | #69 Emiliano Alonso Chia Roman (Activo) | 0.46 |
| 5 | 2025 | `KIANA CHAVEZ ESPARRAGA` | #65 Derek Michael Gálvez Pachas (Activo) | 0.44 |
| 4 | 2025 | `ADRIANO RIVERA ARIZA` | #211 Aidan Segura Ibarra (Activo) | 0.50 |
| 4 | 2025 | `AMANDA VILLACORTA HASHIMOTO` | #185 Salvador Larco Vargas (Inactivo) | 0.37 |
| 4 | 2025 | `ASTOR WARI` | #27 Fabrizio Miguel Astorga Castro (Activo) | 0.42 |
| 4 | 2025 | `IAN LEZAMA OJANAMA` | #209 Sofía Valderrama Salazar (Activo) | 0.49 |
| 4 | 2025 | `JULIETA BELLIDO HUAPAYA` | #179 Julieta Zoe Maldonado Guevara (Inactivo) | 0.51 |
| 4 | 2025 | `KAI VEHARA HAMADA` | #141 Alessio Vegara Ezeta (Inactivo) | 0.48 |
| 4 | 2025 | `KATHERINE CERDAN PALOMINO` | #199 Emma Bianca Matos Palomino (Activo) | 0.48 |
| 4 | 2025 | `LEONEL MONTOYA ANTIALAN` | #106 Mariana Monteza Valentín (Activo) | 0.51 |
| 4 | 2025 | `MOISES YAEL HARIMON PIRO` | #120 Noha Castillo Prado (Activo) | 0.38 |
| 4 | 2025 | `NAELAH SOLIS CORDEÑA` | #53 Antonella Esperanza Olano Contreras (Activo) | 0.44 |
| 4 | 2025 | `VALERIA MOSCOSO` | #87 Isabella Belinda Moscoso Estrada (Activo) | 0.45 |
| 4 | 2025 | `YEREMY YOSEF HARIMON PIRO` | #120 Noha Castillo Prado (Activo) | 0.37 |
| 3 | 2025 | `ARIAN AGOSTINO CHAVEZ ALAYO` | #63 David Alonso Velez Falcón (Activo) | 0.49 |
| 3 | 2025 | `CAMILO DAVILA ESPINOZA` | #89 Joaquín Ignacio Carbajal Espinoza (Activo) | 0.47 |
| 3 | 2025 | `DIEGO ALONSO SALAZAR ESCOBAR` | #166 Lia Salazar Castillo (Inactivo) | 0.52 |
| 3 | 2026 | `FACUNDO RIOS MEDINA` | #110 Matteo Augusto Rivas Merino (Activo) | 0.48 |
| 3 | 2025 | `GAEL ACURIO GARCIA` | #113 Maykel Aziel Curi Yarasca (Activo) | 0.56 |
| 3 | 2025 | `GAEL KHALEB ACURIO GARCIA` | #113 Maykel Aziel Curi Yarasca (Activo) | 0.56 |
| 3 | 2025 | `GALIA CHAVEZ ENRIQUEZ` | #202 Isabella Sofia Chavez Vicente (Activo) | 0.55 |
| 3 | 2025 | `ISABELLA PORTUGAL` | #189 Dhlé Joaquim Salas Morales (Activo) | 0.40 |
| 3 | 2025 | `JOAQUIN GAEL MOLINA IBAÑEZ` | #16 Gael Eduardo Loayza Sánchez (Activo) | 0.45 |
| 3 | 2025 | `JUAN SALVADOR VALAQNIA CEVEDOR` | #71 Estefano Salvador Yarasca Acosta (Activo) | 0.48 |
| 3 | 2025 | `LÍA GEORGIANA OBREGON GUTTIERREZ` | #33 Matt Jesús Aures Gutiérrez (Activo) | 0.50 |
| 3 | 2025 | `LYAM ABRAHAM AMADEO RUIZ FERNANDEZ` | #59 Carlos Alberto Fernández Abad (Activo) | 0.50 |
| 3 | 2025 | `MIA ROJAS LLANTOY` | #159 Matias Nicolas Rojas Villar (Inactivo) | 0.59 |
| 3 | 2025 | `PEDRO JACK XANDER ANDIA RUIZ` | #167 Pedro Darío Palli De La Cruz (Inactivo) | 0.54 |
| 3 | 2026 | `SRTA. PILCO` | #136 Yusef Leonardo Tapia Flores (Activo) | 0.39 |
| 3 | 2025 | `VALERIA CELESTE MOSCOSO DEL CARIO` | #121 Pablo Stefano Mazuelos Lupaca (Activo) | 0.37 |
| 2 | 2025 | `ELMER PABLO` | #63 David Alonso Velez Falcón (Activo) | 0.40 |
| 2 | 2025 | `MATEO DE GABRIEL` | #141 Alessio Vegara Ezeta (Inactivo) | 0.41 |
| 2 | 2025 | `SANTIAGO LESCANO JARA` | #176 Santiago Alonso Fernández Díaz (Inactivo) | 0.48 |
| 2 | 2025 | `SANTIAGO MEJIA CHANCO` | #215 SANTIAGO MAYU MAITA HUAMAN  (Activo) | 0.59 |
| 2 | 2025 | `SOPHIE ALBITES QUIROZ` | #144 Aitana Sosa Quiroz (Inactivo) | 0.50 |
| 2 | 2025 | `THIAGO ANDRE QUISPE FLORES` | #158 Sophfia Quispe Gómez (Inactivo) | 0.55 |
| 2 | 2025 | `THIAGO QUISPE FLORES` | #158 Sophfia Quispe Gómez (Inactivo) | 0.64 |
| 2 | 2025 | `VASCO EMMANUEL JR SOVERO GUILLEN` | #10 Felipe Pasache Guillen (Activo) | 0.48 |
| 2 | 2025 | `VICENTE SKOPLJAK BELLATIN` | #21 Gabriela Isabella Rojas Lazo (Activo) | 0.34 |
| 1 | 2025 | `DANNA GAELA BACA HUAMANI` | #177 Adriel Razek Alfaro Huamani (Inactivo) | 0.58 |
| 1 | 2025 | `FABIAN ALEJANDRO FLORES BOCANEGRA` | #124 Piero Valentino Flores Núñez (Activo) | 0.53 |
| 1 | 2025 | `LUCIANO MATEO GUIZADO LAURENTE` | #106 Mariana Monteza Valentín (Activo) | 0.41 |
| 1 | 2025 | `MARIA FERNANDA ANTIGUA` | #105 María Fernanda Elera Rey (Activo) | 0.56 |
| 1 | 2025 | `MARTIN RUIZ CHU` | #80 Alice Kylie Rivas Choqque (Activo) | 0.42 |
| 1 | 2025 | `MAXIMO DANIEL JAUREGUI DALAO` | #113 Maykel Aziel Curi Yarasca (Activo) | 0.43 |
| 1 | 2025 | `ROBERTO TITO CAMACHO` | #56 Benjamin Antonio Romero Camayo (Activo) | 0.41 |
| 1 | 2026 | `SANTIAGO MAJU` | #95 Santiago Alva Macchiavello (Activo) | 0.47 |
| 1 | 2025 | `TADEO EMILIO GOMEZ VASQUEZ` | #97 Leonardo Matías Hidalgo Vasquez (Activo) | 0.52 |
| 1 | 2025 | `TADEO GOMEZ VASQUEZ` | #97 Leonardo Matías Hidalgo Vasquez (Activo) | 0.53 |