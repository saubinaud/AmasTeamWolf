# Reporte de match: asistencias Excel ↔ alumnos BD

Generado automáticamente por `scripts/asistencia-import/`.
Este reporte debe revisarse **línea por línea** antes de importar asistencias.

## 1. Resumen ejecutivo

- **Total marcas en Excels (2025 + 2026)**: 6644
- **Marcas de asistencia (A o R)**: 6643
- **Alumnos únicos en Excels**: 416
- **Alumnos en BD**: 221

| Categoría | Alumnos | % | Asistencias cubiertas |
|---|---|---|---|
| ✅ Certeros (≥95%) | 149 | 35.8% | 3217 (48.4%) |
| 🟢 Probables (75-94%) | 32 | 7.7% | 474 (7.1%) |
| 🟡 Dudosos (ambiguos) | 38 | 9.1% | 584 (8.8%) |
| ❌ Sin match | 197 | 47.4% | 2368 (35.6%) |

## 2. Duplicados sospechosos en la BD

Alumnos en la BD con nombres muy similares — posiblemente el mismo alumno registrado 2 veces.
**Hay que consolidar estos antes de importar** para no generar asistencias ambiguas.

| # | Sim | BD #1 | BD #2 |
|---|---|---|---|
| 1.00 | 100% | #7 "Sofia Valderrama Sigueñas" (DNI , Activo) | #213 "Sofía Valderrama Sigueñas" (DNI , Activo) |
| 1.00 | 100% | #23 "Alessia Minerva Moreno Sánchez" (DNI 93701527, Activo) | #230 "Alessia minerva moreno Sánchez " (DNI 93701525, Activo) |
| 1.00 | 100% | #124 "Piero Valentino Flores Núñez" (DNI 93772219, Activo) | #207 "Piero Valentino Flores Nuñez" (DNI , Activo) |
| 1.00 | 100% | #167 "Pedro Darío Palli De La Cruz" (DNI 934738863, Inactivo) | #192 "Pedro Darío Palli De La Cruz" (DNI 93508391, Activo) |
| 1.00 | 100% | #172 "Mìa Victoria Barinotto Zavaleta" (DNI , Inactivo) | #191 "Mía Victoria Barinotto Zavaleta" (DNI 92974477, Activo) |
| 1.00 | 100% | #184 "Isao Nicolás Higa Farías" (DNI 937961478, Inactivo) | #205 "Isao Nicolás Higa Farías" (DNI , Activo) |
| 1.00 | 100% | #196 "Noah Alexander Castillo Prado" (DNI 93947710, Activo) | #210 "Noah Alexander Castillo Prado" (DNI , Activo) |
| 0.98 | 98% | #175 "Vasco Alejandro Quevedo Oroz" (DNI , Inactivo) | #190 "Vasco Alejando Quevedo Oroz" (DNI 93836270, Activo) |
| 0.98 | 98% | #64 "Dehlé Joaquim Salas Morales" (DNI , Activo) | #189 "Dhlé Joaquim Salas Morales" (DNI 79875272, Activo) |
| 0.98 | 97% | #102 "Luka Derek Huaman Casa" (DNI 93539149, Activo) | #208 "Luka Derek Huamán Casas" (DNI , Activo) |

## 3. Matches certeros (✅ importar sin revisar)

149 alumnos. Estos son matches exactos normalizados o con ≥95% confidence.

<details><summary>Ver lista completa</summary>

| Conf | Nombre Excel | → Alumno BD | # asist | Años |
|---|---|---|---|---|
| 100% | `AARON ALESSANDRO INGA ARZAPALO` | #76 Aaron Alessandro Inga Arzapalo (Activo) | 10 | 2026 |
| 100% | `AARON RICHARD ADRIAN CANAVAL FLORIAN` | #66 Aaron Richard Adrian Canaval Florian (Activo) | 20 | 2025,2026 |
| 100% | `ABRAHAM RAFAEL KERIM YANTAS INOÑAN` | #8 Abraham Rafael Kerim Yantas Inoñan (Activo) | 10 | 2026 |
| 96% | `ADAEL GUTIERREZ URETA` | #35 Adael Jesús Gutiérrez Ureta (Activo) | 11 | 2026 |
| 100% | `ADRIANA CLAUDIA ALVARADO ALVAREZ` | #36 Adriana Claudia Alvarado Alvarez (Activo) | 25 | 2026 |
| 100% | `ADRIEL ANDREW PAREJA MONTES` | #37 Adriel Andrew Pareja Montes (Activo) | 81 | 2025,2026 |
| 100% | `ADRIEL RAZEK ALFARO HUAMANI` | #177 Adriel Razek Alfaro Huamani (Inactivo) | 7 | 2026 |
| 100% | `AITANA POLO MERCADO` | #39 Aitana Polo Mercado (Activo) | 10 | 2025,2026 |
| 100% | `AITANA SOSA QUIROZ` | #144 Aitana Sosa Quiroz (Inactivo) | 20 | 2025,2026 |
| 96% | `ALANA OSHIRO MATSUFUJI` | #146 Alana Sachie Oshiro Matsufuji (Inactivo) | 19 | 2025 |
| 100% | `ALBA CAYETANA YEPEZ VELIZ` | #178 Alba Cayetana Yepez Veliz (Inactivo) | 16 | 2025,2026 |
| 100% | `ALBA RAFAELLA MONTALVO CHIPEN` | #40 Alba Rafaella Montalvo Chipen (Activo) | 6 | 2025 |
| 100% | `ALEC REYES KROLL` | #41 Alec Reyes Kroll (Activo) | 65 | 2025,2026 |
| 100% | `ALEJANDRO JOAQUÍN TELLO SALAS` | #67 Alejandro Joaquín Tello Salas (Activo) | 23 | 2026 |
| 96% | `ALESSANDRO GALARZA CRISANTO` | #161 Alessandro Mathias Galarza Crisanto (Inactivo) | 11 | 2025 |
| 100% | `ALESSANDRO MATHIAS GALARZA CRISANTO` | #161 Alessandro Mathias Galarza Crisanto (Inactivo) | 4 | 2026 |
| 100% | `ALESSIA FÁTIMA LASAPONARA RUIZ` | #193 Alessia Fátima Lasaponara Ruiz (Activo) | 13 | 2026 |
| 100% | `ALESSIA VALENTINA ROJAS DÍAZ` | #45 Alessia Valentina Rojas Diaz (Activo) | 19 | 2026 |
| 100% | `ALESSIO VEGARA EZETA` | #141 Alessio Vegara Ezeta (Inactivo) | 63 | 2025 |
| 100% | `ALEXANDER ANDRE ROMERO ROJAS` | #139 Alexander Andre Romero Rojas (Inactivo) | 36 | 2025 |
| 100% | `ALEXANDRA GABRIELA BAUTISTA JUSTINIANO` | #13 Alexandra Gabriela Bautista Justiniano (Activo) | 35 | 2025,2026 |
| 100% | `ALEXANDRA ROJAS SICLLA` | #47 Alexandra Rojas Siclla (Activo) | 26 | 2025 |
| 100% | `ALHANNA ATHENEA HUAMANI CORTIJO` | #48 Alhanna Athenea Huamani Cortijo (Activo) | 12 | 2026 |
| 100% | `ALICE KYLIE RIVAS CHOQQUE` | #80 Alice Kylie Rivas Choqque (Activo) | 19 | 2026 |
| 100% | `ANGELO SANTIAGO SEGOVIA ULARTE` | #24 Angelo Santiago Segovia Ularte (Activo) | 17 | 2026 |
| 100% | `ANIA SILVA CHÁVEZ` | #52 Ania Silva Chávez (Activo) | 22 | 2026 |
| 100% | `ANTONELLA ESPERANZA OLANO CONTRERAS` | #53 Antonella Esperanza Olano Contreras (Activo) | 86 | 2025,2026 |
| 96% | `ARON CANAVAL FLORIAN` | #66 Aaron Richard Adrian Canaval Florian (Activo) | 14 | 2025 |
| 100% | `AURELIO  CHISTIANS TRISTAN ALEXANDRINO` | #55 Aurelio Chistians Tristan Alexandrino (Activo) | 38 | 2025,2026 |
| 98% | `AURELIO TRISTAN ALEXANDRINO CHISTIANS` | #55 Aurelio Chistians Tristan Alexandrino (Activo) | 26 | 2025 |
| 96% | `AZUL TENORIO MALCA` | #28 Azul Macarena Tenorio Malca (Activo) | 3 | 2026 |
| 100% | `BRUNO SEBASTIÁN VIGIL PAREDES` | #72 Bruno Sebastián Vigil Paredes (Activo) | 14 | 2026 |
| 100% | `CAMILA JARA PAREDES` | #42 Camila Jara Paredes (Activo) | 23 | 2025,2026 |
| 100% | `CAMILA MAUREEN GARCIA VEGA` | #34 Camila Maureen Garcia Vega (Activo) | 105 | 2025,2026 |
| 100% | `CAMILA SOFIA GONZALES ANAYA` | #58 Camila Sofía Gonzales Anaya (Activo) | 10 | 2026 |
| 100% | `CARLOS ALBERTO FERNÁNDEZ ABAD` | #59 Carlos Alberto Fernández Abad (Activo) | 14 | 2026 |
| 100% | `CATALINA MILAGROS SANDOVAL MÉNDEZ` | #181 Catalina Milagros Sandoval Méndez (Inactivo) | 1 | 2026 |
| 96% | `CATALINA SANDOVAL MENDEZ` | #181 Catalina Milagros Sandoval Méndez (Inactivo) | 4 | 2025 |
| 100% | `DAIKI NOAH OSHIRO LOPEZ` | #182 Daiki Noah Oshiro Lopez (Inactivo) | 3 | 2026 |
| 96% | `DANAE SANDOVAL CABRERA` | #29 Keira Danae Sandoval Cabrera (Activo) | 8 | 2026 |
| 100% | `DANIEL TOMAS FIGUEROA FERNÁNDEZ` | #60 Daniel Tomas Figueroa Fernández (Activo) | 10 | 2026 |
| 100% | `DARA CASSANA CIURLIZZA` | #81 Dara Cassana Ciurlizza (Activo) | 14 | 2026 |
| 100% | `DARIEL MATHIAS VALDEZ CAMPOS` | #180 Dariel Mathias Valdez Campos (Inactivo) | 25 | 2025,2026 |
| 100% | `DAVID ALONSO VELEZ FALCON` | #63 David Alonso Velez Falcón (Activo) | 6 | 2025 |
| 96% | `DEREK GALVEZ PACHAS` | #65 Derek Michael Gálvez Pachas (Activo) | 5 | 2026 |
| 100% | `DEREK MATEO ROMERO CARHUALLANQUI` | #152 Derek Mateo Romero Carhuallanqui (Inactivo) | 32 | 2025 |
| 100% | `DYLAN ESTEBAN CHACÓN RIVAS` | #84 Dylan Esteban Chacón Rivas (Activo) | 16 | 2026 |
| 95% | `DYLAN YANGARI QUISPE` | #204 Dylan Juan Zabdiel Yangari Quispe (Activo) | 2 | 2026 |
| 100% | `EITHAN MATHEO POLOMINO ORIUNDO` | #143 Eithan Matheo Polomino Oriundo (Inactivo) | 1 | 2025 |
| 100% | `EMANUEL DAVID RIVAS PAETAN` | #32 Emanuel David Rivas Paetan (Activo) | 42 | 2025,2026 |
| 96% | `EMILIA FONSECA SALAZAR` | #68 Emilia Marcela Fonseca Salazar (Activo) | 2 | 2025 |
| 100% | `EMILIA MARCELA FONSECA SALAZAR` | #68 Emilia Marcela Fonseca Salazar (Activo) | 15 | 2026 |
| 100% | `EMILIANO ALONSO CHIA ROMAN` | #69 Emiliano Alonso Chia Roman (Activo) | 92 | 2025 |
| 100% | `EMMA BIANCA MATOS PALOMINO` | #199 Emma Bianca Matos Palomino (Activo) | 2 | 2026 |
| 100% | `ESTEBAN NEYRA HERENCIA` | #142 Esteban Neyra Herencia (Inactivo) | 31 | 2025 |
| 96% | `ETHAN LIAM EDUARDO CHICCHON APAZA` | #15 Etham Liam Eduardo Chicchon Apaza (Activo) | 17 | 2026 |
| 100% | `FABRIZIO MIGUEL ASTORGA CASTRO` | #27 Fabrizio Miguel Astorga Castro (Activo) | 31 | 2025,2026 |
| 100% | `FABRIZZIO ISMAEL GUERRERO ÁLVAREZ` | #85 Fabrizzio Ismael Guerrero Álvarez (Activo) | 7 | 2026 |
| 100% | `FELIPE PASACHE GUILLEN` | #10 Felipe Pasache Guillen (Activo) | 26 | 2025,2026 |
| 100% | `GABRIEL ALBERTO MONTES DE OCA PUCUTAY` | #78 Gabriel Alberto Montes De Oca Pucutay (Activo) | 19 | 2026 |
| 100% | `GABRIEL ANDRÉS CASTAÑEDA CÁCERES` | #79 Gabriel Andrés Castañeda Cáceres (Activo) | 27 | 2025,2026 |
| 96% | `GABRIEL MONTES DE OCA PUCUTAY` | #78 Gabriel Alberto Montes De Oca Pucutay (Activo) | 13 | 2025 |
| 100% | `GABRIELA ISABELLA ROJAS LAZO` | #21 Gabriela Isabella Rojas Lazo (Activo) | 19 | 2026 |
| 100% | `GAIA EMMA MENACHO ALVAREZ` | #82 Gaia Emma Menacho Alvarez (Activo) | 6 | 2026 |
| 100% | `GIACOMO REM ROBLES ESCUDERO` | #86 Giacomo Rem Robles Escudero (Activo) | 17 | 2026 |
| 95% | `GIANIRELLA ZULEBY SAQUEIROS CANO` | #149 Gianirella Zuleby Sequeiros Cano (Inactivo) | 15 | 2025 |
| 96% | `HARRY LANDEO LUCAS` | #1 Harry Vincent Landeo Lucas (Activo) | 1 | 2025 |
| 100% | `HARRY VINCENT LANDEO LUCAS` | #1 Harry Vincent Landeo Lucas (Activo) | 8 | 2026 |
| 100% | `ISABELLA BELINDA MOSCOSO ESTRADA` | #87 Isabella Belinda Moscoso Estrada (Activo) | 8 | 2026 |
| 96% | `ISSAC DARITH ALVARADO OLIVARES` | #3 Isaac Farith Alvarado Olivares (Activo) | 12 | 2026 |
| 100% | `JADEN BASTIEN RIOS YOMOND` | #137 Jaden Bastien Rios Yomond (Inactivo) | 100 | 2025 |
| 100% | `JOAQUIN IGNACIO CARBAJAL ESPINOZA` | #89 Joaquín Ignacio Carbajal Espinoza (Activo) | 2 | 2026 |
| 100% | `JORGE FRANCISCO CASTRO ZAVALETA` | #14 Jorge Francisco Castro Zavaleta (Activo) | 16 | 2026 |
| 100% | `JOSE ANDRES VELIZ MAYTA` | #90 Jose Andres Veliz Mayta (Activo) | 1 | 2026 |
| 100% | `Julen Ezequiel goran ramirez maquera` | #186 Julen Ezequiel Goran Ramírez Maquera (Inactivo) | 2 | 2025 |
| 100% | `JULIAN BENJAMIN CUEVA LOAYZA` | #94 Julián Benjamin Cueva Loayza (Activo) | 18 | 2026 |
| 96% | `JULIETA MALDONADO GUEVARA` | #179 Julieta Zoe Maldonado Guevara (Inactivo) | 5 | 2026 |
| 100% | `JULIO LUCIANO PAUCAR MOLERO` | #96 Julio Luciano Paucar Molero (Activo) | 10 | 2026 |
| 100% | `LAIA THAIS JARA PAREDES` | #44 Laia Thais Jara Paredes (Activo) | 16 | 2025,2026 |
| 100% | `LARA VELEZ PEREZ` | #164 Lara Velez Perez (Inactivo) | 36 | 2025 |
| 96% | `LEAH GARCIA QUIÑONES` | #30 Leah Fernanda Garcia Quiñones (Activo) | 19 | 2026 |
| 100% | `LEANDRO GIOVANNI MONTERO CARCAMO` | #151 Leandro Giovanni Montero Carcamo (Inactivo) | 3 | 2026 |
| 100% | `LIAH IVANA JOYO CAMPOS` | #98 Liah Ivana Joyo Campos (Activo) | 18 | 2026 |
| 100% | `LOGAN ESTRADA OSORIO` | #165 Logan Estrada Osorio (Inactivo) | 2 | 2025 |
| 100% | `LUA ALONDRA ALLCCA LUNASCO` | #17 Lúa Alondra Allcca Lunasco (Activo) | 9 | 2026 |
| 100% | `LUA GIANELLA RODRIGUEZ CASTRO` | #99 Lua Gianella Rodríguez Castro (Activo) | 73 | 2025,2026 |
| 100% | `LUANA FE MUCHA REYES` | #145 Luana Fe Mucha Reyes (Inactivo) | 3 | 2026 |
| 96% | `LUCA OTOYA CUSTODIO` | #100 Luca Daniel Otoya Custodio (Activo) | 6 | 2026 |
| 100% | `LUCIANA CELESTE BERNIS SAMAME` | #101 Luciana Celeste Bernis Samame (Activo) | 17 | 2026 |
| 100% | `LUCIO VINCENZO MOSQUERA ANGELES` | #19 Lucio Vincenzo Mosquera Angeles (Activo) | 8 | 2026 |
| 100% | `LUKA DEREK HUAMAN CASAS` | #208 Luka Derek Huamán Casas (Activo) | 42 | 2025,2026 |
| 96% | `LUKA PAVIC CONTRERAS` | #103 Luka Sebastian Pavic Contreras (Activo) | 4 | 2025 |
| 100% | `LUKA SEBASTIAN PAVIC CONTRERAS` | #103 Luka Sebastian Pavic Contreras (Activo) | 79 | 2025,2026 |
| 96% | `MAIZA VELASQUEZ MACEDA` | #171 Maiza Ariana Velásquez Maceda (Inactivo) | 18 | 2026 |
| 100% | `MARCELO SUAREZ FLORES` | #104 Marcelo Suárez Flores (Activo) | 6 | 2026 |
| 100% | `MARCUS GONDORI BACA` | #155 Marcus Gondori Baca (Inactivo) | 20 | 2025,2026 |
| 100% | `MARÍA FERNANDA ELERA REY` | #105 María Fernanda Elera Rey (Activo) | 22 | 2025,2026 |
| 100% | `MARIA LUCIA LOZADA ROSALES` | #201 Maria Lucia Lozada Rosales (Activo) | 2 | 2026 |
| 100% | `MARIANA MONTEZA VALENTIN` | #106 Mariana Monteza Valentín (Activo) | 15 | 2025 |
| 100% | `MARTIN HOLGADO PAZ` | #4 Martin Holgado Paz (Activo) | 37 | 2025,2026 |
| 96% | `MATEO AUGUSTO RIVAS MERINO` | #110 Matteo Augusto Rivas Merino (Activo) | 33 | 2025 |
| 100% | `MATEO DAVID PORRAS OJEDA` | #46 Mateo David Porras Ojeda (Activo) | 5 | 2026 |
| 96% | `MATEO PORRAS OJEDA` | #46 Mateo David Porras Ojeda (Activo) | 7 | 2025 |
| 100% | `MATHIAS RODOLFO CARDENAS SULCARAY` | #108 Mathias Rodolfo Cardenas Sulcaray (Activo) | 10 | 2025,2026 |
| 100% | `MATIAS NICOLAS ROJAS VILLAR` | #159 Matias Nicolas Rojas Villar (Inactivo) | 18 | 2025 |
| 100% | `MATT JESÚS AURES GUTIÉRREZ` | #33 Matt Jesús Aures Gutiérrez (Activo) | 16 | 2026 |
| 100% | `MATTEO AUGUSTO RIVAS MERINO` | #110 Matteo Augusto Rivas Merino (Activo) | 23 | 2025,2026 |
| 100% | `MATTHEW GAEL ORTIZ OLAYA` | #154 Matthew Gael Ortiz Olaya (Inactivo) | 9 | 2026 |
| 100% | `MAURICIO STEFANO VILLANUEVA MONTAYA` | #112 Mauricio Stefano Villanueva Montaya (Activo) | 15 | 2025,2026 |
| 96% | `MAYKEL CURI YARASCA` | #113 Maykel Aziel Curi Yarasca (Activo) | 5 | 2026 |
| 96% | `MERLY OTOYA RAMOS` | #114 Merly Alondra Otoya Ramos (Activo) | 17 | 2026 |
| 96% | `MICAEL NUÑEZ MELENDEZ` | #150 Micael Benjamin Nuñez Melendez (Inactivo) | 12 | 2025 |
| 100% | `MICAELA CORDERO CHAVEZ` | #203 Micaela Cordero Chavez (Activo) | 2 | 2026 |
| 98% | `NICOLAS ANDER SANCHEZ PAUCAR` | #116 Nicolás Ander Paucar Sánchez (Activo) | 8 | 2025 |
| 100% | `NICOLAS ORDONEZ NORIEDA` | #117 Nicolas Ordonez Norieda (Activo) | 69 | 2025,2026 |
| 100% | `NOAH KROES` | #174 Noah Kroes (Inactivo) | 4 | 2026 |
| 100% | `NOHA CASTILLO PRADO` | #120 Noha Castillo Prado (Activo) | 19 | 2026 |
| 100% | `OLIVIA GOÑEZ SERNA` | #5 Olivia Goñez Serna (Activo) | 6 | 2025 |
| 100% | `ORLANDO GABRIEL BOCANEGRA RIVASPLATA` | #6 Orlando Gabriel Bocanegra Rivasplata (Activo) | 23 | 2025,2026 |
| 100% | `PABLO STEFANO MAZUELOS LUPACA` | #121 Pablo Stefano Mazuelos Lupaca (Activo) | 8 | 2026 |
| 100% | `PIERO STEVEN AGUIRRE UCHASARA` | #123 Piero Steven Aguirre Uchasara (Activo) | 59 | 2025,2026 |
| 100% | `RAFAEL ALEJANDRO LUYO ALVARADO` | #125 Rafael Alejandro Luyo Alvarado (Activo) | 51 | 2025,2026 |
| 100% | `RAFAEL ALESSANDRO ESPINOZA ROJAS` | #73 Rafael Alessandro Espinoza Rojas (Activo) | 15 | 2026 |
| 100% | `RAFAEL AYVAR CUEVA` | #140 Rafael Ayvar Cueva (Inactivo) | 57 | 2025 |
| 100% | `RAFAELA MIRANDA HUAMANCHA CAMONES` | #198 Rafaela Miranda Huamancha Camones (Activo) | 5 | 2026 |
| 100% | `RENZO ELÍAS RODRIGO JUSTINIANO` | #2 Renzo Elías Rodrigo Justiniano (Activo) | 33 | 2025,2026 |
| 100% | `RODRIGO ALEJANDRO PALOMIO CAMPOS` | #126 Rodrigo Alejandro Palomio Campos (Activo) | 105 | 2025,2026 |
| 100% | `RODRIGO CHRISTIAN MORALES TARAZONA` | #127 Rodrigo Christian Morales Tarazona (Activo) | 12 | 2026 |
| 95% | `ROMINA MENDIETA VALER` | #20 Sofía Romina Rhaenyra Mendieta Valer (Activo) | 18 | 2026 |
| 95% | `SALVADOR YARASCA` | #71 Estefano Salvador Yarasca Acosta (Activo) | 25 | 2026 |
| 100% | `SANTIAGO ALONSO FERNÁNDEZ DÍAZ` | #176 Santiago Alonso Fernández Díaz (Inactivo) | 20 | 2026 |
| 100% | `SANTIAGO IGNACIO DE JESUS ROJAS CUYUBAMBA` | #168 Santiago Ignacio De Jesus Rojas Cuyubamba (Inactivo) | 11 | 2025 |
| 100% | `SANTIAGO RAFAEL CHIOK HUAMÁN` | #129 Santiago Rafael Chiok Huamán (Activo) | 2 | 2026 |
| 100% | `SAORI DOMENICA OSHIRO LOPEZ` | #183 Saori Domenica Oshiro Lopez (Inactivo) | 3 | 2026 |
| 100% | `SERGIO JEREMY AGUIRRE MISIYAURI` | #130 Sergio Jeremy Aguirre Misiyauri (Activo) | 102 | 2025,2026 |
| 100% | `SOFÍA AMAIA ALARCÓN VILCHEZ` | #74 Sofía Amaia Alarcón Vilchez (Activo) | 24 | 2025,2026 |
| 100% | `SOPHFIA QUISPE GÓMEZ` | #158 Sophfia Quispe Gómez (Inactivo) | 1 | 2026 |
| 100% | `SOPHIA KAI DÁVILA GUZMÁN` | #156 Sophia Kai Dávila Guzmán (Inactivo) | 17 | 2025,2026 |
| 96% | `THOMAS MATHEY GALINDO` | #160 Thomas Alejandro Mathey Galindo (Inactivo) | 16 | 2025 |
| 100% | `ÚRSULA JULIETA DÍAZ ORTIZ` | #11 Úrsula Julieta Díaz Ortiz (Activo) | 6 | 2026 |
| 100% | `VASCO ÁLVAREZ CORREA` | #138 Vasco Alvarez Correa (Inactivo) | 4 | 2025 |
| 100% | `VASCO DIAZ TAPIA` | #133 Vasco Diaz Tapia (Activo) | 51 | 2025 |
| 100% | `VICTOR HAKIM RODRIGUEZ GOMEZ` | #134 Victor Hakim Rodriguez Gomez (Activo) | 77 | 2025,2026 |
| 100% | `VILMA GEORGINA PUMA ESTRADA` | #135 Vilma Georgina Puma Estrada (Activo) | 10 | 2026 |
| 96% | `VILMA GIORGINA PUMA ESTRADA` | #135 Vilma Georgina Puma Estrada (Activo) | 33 | 2025 |
| 96% | `YAREK DYLAN DÍAZ RIVERA arek` | #75 Yarek Dylan Díaz Rivera (Activo) | 11 | 2026 |
| 100% | `YUN HE DAVID ZHANG IZQUIERDO` | #62 Yun He David Zhang Izquierdo (Activo) | 10 | 2025,2026 |
| 100% | `YUSEF LEONARDO TAPIA FLORES` | #136 Yusef Leonardo Tapia Flores (Activo) | 3 | 2025 |
| 95% | `ZULEBY SEQUEIROS CANO` | #149 Gianirella Zuleby Sequeiros Cano (Inactivo) | 48 | 2025,2026 |

</details>

## 4. Matches probables (🟢 revisar rápido)

32 alumnos. Confidence 75-94%. **Aprobar o rechazar uno por uno**.

| Conf | Nivel | Nombre Excel | → Alumno BD | # asist | Años | Detalle |
|---|---|---|---|---|---|---|
| 93% | L3_APELLIDO_UNICO | `EMANUEL DAVID RIVAS PEATAN` | #32 Emanuel David Rivas Paetan (Activo) | 23 | 2025 | apellidos únicos: ['RIVAS'] · tokens únicos: ['EMANUEL', 'RIVAS'] · fuzzy=0.96 |
| 93% | L3_APELLIDO_UNICO | `GALA GUTTIERREZ FIMETTi` | #163 Gala Guttierrez Finetti (Inactivo) | 34 | 2025 | apellidos únicos: ['GUTTIERREZ'] · tokens únicos: ['GALA', 'GUTTIERREZ'] · fuzzy |
| 93% | L3_APELLIDO_UNICO | `JOSE ANDRES VELIZ HAYTA` | #90 Jose Andres Veliz Mayta (Activo) | 31 | 2025 | apellidos únicos: ['VELIZ'] · tokens únicos: ['ANDRES', 'VELIZ'] · fuzzy=0.96 |
| 93% | L3_APELLIDO_UNICO | `LUANA CORNEJO PUCHEN` | #153 Luana Cornejo Pichen (Inactivo) | 2 | 2026 | apellidos únicos: ['CORNEJO'] · tokens únicos: ['CORNEJO', 'LUANA'] · fuzzy=0.95 |
| 93% | L3_APELLIDO_UNICO | `RODRIGO CHISTIAN MORALES TARAZONA` | #127 Rodrigo Christian Morales Tarazona (Activo) | 23 | 2025 | apellidos únicos: ['TARAZONA'] · tokens únicos: ['RODRIGO', 'TARAZONA'] · fuzzy= |
| 93% | L3_APELLIDO_UNICO | `SALVADOR LARCO VERGAS` | #185 Salvador Larco Vargas (Inactivo) | 8 | 2026 | apellidos únicos: ['LARCO'] · tokens únicos: ['LARCO', 'SALVADOR'] · fuzzy=0.95 |
| 93% | L3_APELLIDO_UNICO | `SOFÍA NICOLLE LUCENA COMPOS` | #131 Sofía Nicolle Lucena Campo (Activo) | 5 | 2026 | apellidos únicos: ['LUCENA'] · tokens únicos: ['LUCENA', 'NICOLLE'] · fuzzy=0.94 |
| 90% | L3_APELLIDO_UNICO | `FRANCO SALSARRIAGA EZETA` | #18 Franco Saldarriaga Ezeta (Activo) | 19 | 2026 | apellidos únicos: ['EZETA'] · tokens únicos: ['EZETA'] · fuzzy=0.96 |
| 90% | L3_APELLIDO_UNICO | `GETZENN VELIT AYALA` | #83 Getzenn Asher Garcia Velit (Activo) | 15 | 2026 | apellidos únicos: ['VELIT'] · tokens únicos: ['GETZENN', 'VELIT'] · fuzzy=0.58 |
| 90% | L3_APELLIDO_UNICO | `MARIANA MONTEZA VALENTINA` | #106 Mariana Monteza Valentín (Activo) | 12 | 2026 | apellidos únicos: ['MONTEZA'] · tokens únicos: ['MONTEZA'] · fuzzy=0.98 |
| 90% | L3_APELLIDO_UNICO | `NAKHARY CRUZ SARMIENTO` | #9 Nakhay Cruz Sarmiento (Activo) | 5 | 2025,2026 | apellidos únicos: ['SARMIENTO'] · tokens únicos: ['SARMIENTO'] · fuzzy=0.98 |
| 90% | L3_APELLIDO_UNICO | `OLIVIA GOÑES SERNA` | #5 Olivia Goñez Serna (Activo) | 13 | 2026 | apellidos únicos: ['SERNA'] · tokens únicos: ['SERNA'] · fuzzy=0.94 |
| 90% | L3_APELLIDO_UNICO | `SANTIAGO ALVA MACCIAVELLO` | #95 Santiago Alva Macchiavello (Activo) | 33 | 2026 | apellidos únicos: ['ALVA'] · tokens únicos: ['ALVA'] · fuzzy=0.98 |
| 89% | L3_CONTAINED | `ALEJANDRO VALENCIA GARCIA` | #43 Alejandro Sebastian Valencia Garcia (Activo) | 21 | 2025 | lado corto 100% contenido · únicos=['VALENCIA'] · fuzzy=0.83 |
| 89% | L3_CONTAINED | `ALMA CASTILLO MENDOZA` | #50 Alma Isabel Castillo Mendoza (Activo) | 18 | 2025 | lado corto 100% contenido · únicos=['ALMA'] · fuzzy=0.86 |
| 89% | L3_CONTAINED | `BENJAMIN QUISPE HUAPAYA` | #57 Benjamin Derek Quispe Huapaya (Activo) | 22 | 2026 | lado corto 100% contenido · únicos=['HUAPAYA'] · fuzzy=0.88 |
| 89% | L3_CONTAINED | `GABRIEL SANCHEZ CABELLO` | #77 Gabriel Adolfo Sánchez Cabello (Activo) | 12 | 2026 | lado corto 100% contenido · únicos=['CABELLO'] · fuzzy=0.87 |
| 89% | L3_CONTAINED | `GAEL LOAYZA SANCHEZ` | #16 Gael Eduardo Loayza Sánchez (Activo) | 17 | 2026 | lado corto 100% contenido · únicos=['LOAYZA'] · fuzzy=0.83 |
| 89% | L3_CONTAINED | `JOAQUIN CARBAJAL ESPINOZA` | #89 Joaquín Ignacio Carbajal Espinoza (Activo) | 3 | 2026 | lado corto 100% contenido · únicos=['CARBAJAL'] · fuzzy=0.86 |
| 89% | L3_APELLIDO_UNICO | `LARA REYES KROLL` | #41 Alec Reyes Kroll (Activo) | 12 | 2025 | apellidos únicos: ['KROLL'] · tokens únicos: ['KROLL'] · fuzzy=0.81 |
| 89% | L3_CONTAINED | `LEONARDO HIDALGO VASQUEZ` | #97 Leonardo Matías Hidalgo Vasquez (Activo) | 11 | 2026 | lado corto 100% contenido · únicos=['HIDALGO'] · fuzzy=0.87 |
| 89% | L3_CONTAINED | `MATIAS MORENO VARGAS` | #109 Matias Javier Moreno Vargas (Activo) | 20 | 2025 | lado corto 100% contenido · únicos=['MORENO'] · fuzzy=0.85 |
| 89% | L3_CONTAINED | `NOAH GONZALES ROMERO` | #119 Noah Rafael Gonzales Romero (Activo) | 7 | 2025 | lado corto 100% contenido · únicos=['GONZALES'] · fuzzy=0.85 |
| 88% | L3_CONTAINED | `BENJAMIN MERA` | #224 Benjamin Mera Magaraci  (Activo) | 1 | 2026 | lado corto 100% contenido · únicos=['MERA'] · fuzzy=0.74 |
| 88% | L3_CONTAINED | `CAMILO ROSARIO` | #38 Camilo Rosario Cabrera (Activo) | 26 | 2025 | lado corto 100% contenido · únicos=['ROSARIO'] · fuzzy=0.78 |
| 88% | L3_TOKENS_UNICOS | `JULEN EZEQUIEL GORAN RAMÍREZ MAQUERS` | #186 Julen Ezequiel Goran Ramírez Maquera (Inactivo) | 22 | 2026 | tokens únicos: ['EZEQUIEL', 'GORAN', 'JULEN'] · fuzzy=0.97 |
| 88% | L3_CONTAINED | `MATEO CASTAÑEDA` | #107 Mateo Fabian Castañeda Alvarado (Activo) | 28 | 2025,2026 | lado corto 100% contenido · únicos=['CASTANEDA'] · fuzzy=0.65 |
| 88% | L3_APELLIDO_UNICO | `NICOLAS ANDRE SANCHEZ PAUCAR` | #116 Nicolás Ander Paucar Sánchez (Activo) | 7 | 2026 | apellidos únicos: ['PAUCAR'] · tokens únicos: ['PAUCAR'] · fuzzy=0.71 |
| 88% | L3_CONTAINED | `SEBASTIAN VERASTEGUI` | #31 Eithan Sebastián Verastegui Neyra (Activo) | 12 | 2026 | lado corto 100% contenido · únicos=['VERASTEGUI'] · fuzzy=0.75 |
| 86% | L3_CONTAINED | `DANAE` | #29 Keira Danae Sandoval Cabrera (Activo) | 3 | 2026 | lado corto 100% contenido · únicos=['DANAE'] · fuzzy=0.30 |
| 85% | L3_TOKENS_UNICOS | `AIXA DAPHNE MARTINEZ VALLE` | #22 Aixa Daphne Martínez Valles (Activo) | 6 | 2026 | tokens únicos: ['AIXA', 'DAPHNE'] · fuzzy=0.98 |
| 80% | L3_APELLIDO_UNICO | `IVANNA SOFIA ALVARADO GONZALES` | #3 Isaac Farith Alvarado Olivares (Activo) | 3 | 2025 | apellidos únicos: ['ALVARADO'] · tokens únicos: ['ALVARADO'] · fuzzy=0.67 |

## 5. Matches dudosos (🟡 decidir caso por caso)

38 alumnos. El #1 y el #2 candidatos están muy cerca en confidence.

### `JOSE ANGEL SECO ANGULO` — 56 asistencias, años 2025,2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #91 José Angel Seco Angulo (Activo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #88 Jesús Adrian Seco Angulo (Activo) | apellidos únicos: ['ANGULO', 'SECO'] · tokens únicos: ['ANGU |

### `ENRICO JOSE SAVOCA PONTIGGIA` — 33 asistencias, años 2025,2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #70 Enrico Jose Savoca Pontiggia (Activo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #132 Speranza Altea Savoca Pontiggia (Activo) | apellidos únicos: ['PONTIGGIA', 'SAVOCA'] · tokens únicos: [ |

### `SPERANZA ALTEA SAVOCA PONTIGGIA` — 33 asistencias, años 2025,2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #132 Speranza Altea Savoca Pontiggia (Activo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #70 Enrico Jose Savoca Pontiggia (Activo) | apellidos únicos: ['PONTIGGIA', 'SAVOCA'] · tokens únicos: [ |

### `JULIAN GUTTIERREZ FIMETTi` — 32 asistencias, años 2025

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 90% | L3_APELLIDO_UNICO | #162 Julian Guttierrez Finetti (Inactivo) | apellidos únicos: ['GUTTIERREZ'] · tokens únicos: ['GUTTIERR |
| 2 | 81% | L3_APELLIDO_UNICO | #163 Gala Guttierrez Finetti (Inactivo) | apellidos únicos: ['GUTTIERREZ'] · tokens únicos: ['GUTTIERR |

### `SEBASTIAN MONTENEGRO ALVAREZ` — 25 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 89% | L3_CONTAINED | #26 Sebastián André Montenegro Alvarez (Activo) | lado corto 100% contenido · únicos=['MONTENEGRO'] · fuzzy=0. |
| 2 | 88% | L3_APELLIDO_UNICO | #25 Piero Gabriel Montenegro Alvarez (Activo) | apellidos únicos: ['MONTENEGRO'] · tokens únicos: ['MONTENEG |

### `PIERO MONTENEGRO ALVAREZ` — 24 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 89% | L3_CONTAINED | #25 Piero Gabriel Montenegro Alvarez (Activo) | lado corto 100% contenido · únicos=['MONTENEGRO'] · fuzzy=0. |
| 2 | 88% | L3_APELLIDO_UNICO | #26 Sebastián André Montenegro Alvarez (Activo) | apellidos únicos: ['MONTENEGRO'] · tokens únicos: ['MONTENEG |

### `DEHLÉ JOAQUIM SALAS MORALES` — 23 asistencias, años 2025,2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #64 Dehlé Joaquim Salas Morales (Activo) | normalized equal |
| 2 | 93% | L3_APELLIDO_UNICO | #189 Dhlé Joaquim Salas Morales (Activo) | apellidos únicos: ['SALAS'] · tokens únicos: ['JOAQUIM', 'SA |
| 3 | 53% | L5_APELLIDO_SOLO | #67 Alejandro Joaquín Tello Salas (Activo) | solo apellido común (['SALAS']) · nombres distintos · fuzzy= |

### `ISAAC` — 22 asistencias, años 2025,2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 86% | L3_CONTAINED | #3 Isaac Farith Alvarado Olivares (Activo) | lado corto 100% contenido · únicos=['ISAAC'] · fuzzy=0.29 |
| 2 | 86% | L3_CONTAINED | #170 Isaac Emerson Rengifo Maceda (Inactivo) | lado corto 100% contenido · únicos=['ISAAC'] · fuzzy=0.30 |

### `MÌA VICTORIA BARINOTTO ZAVALETA` — 21 asistencias, años 2025,2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #172 Mìa Victoria Barinotto Zavaleta (Inactivo) | normalized equal |
| 2 | 100% | L1_EXACT | #191 Mía Victoria Barinotto Zavaleta (Activo) | normalized equal |
| 3 | 52% | L5_APELLIDO_SOLO | #14 Jorge Francisco Castro Zavaleta (Activo) | solo apellido común (['ZAVALETA']) · nombres distintos · fuz |

### `VALENTINA ROSARIO CABRERA` — 21 asistencias, años 2025

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 96% | L3_CONTAINED | #12 Valentina Alexandra Rosario Cabrera (Activo) | lado corto 100% contenido · únicos=['CABRERA', 'ROSARIO'] ·  |
| 2 | 96% | L3_APELLIDO_UNICO | #38 Camilo Rosario Cabrera (Activo) | apellidos únicos: ['CABRERA', 'ROSARIO'] · tokens únicos: [' |
| 3 | 51% | L5_APELLIDO_SOLO | #29 Keira Danae Sandoval Cabrera (Activo) | solo apellido común (['CABRERA']) · nombres distintos · fuzz |

### `SOLINO DOMINIC BERMUDEZ ALARCON` — 19 asistencias, años 2025,2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #148 Solino Dominic Bermudez Alarcon (Inactivo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #147 Amely Laura Bermudez Alarcon (Inactivo) | apellidos únicos: ['ALARCON', 'BERMUDEZ'] · tokens únicos: [ |
| 3 | 52% | L5_APELLIDO_SOLO | #74 Sofía Amaia Alarcón Vilchez (Activo) | solo apellido común (['ALARCON']) · nombres distintos · fuzz |

### `ANIBAL JAEL AGUSTIN SILENCIO` — 18 asistencias, años 2025,2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #188 Aníbal Jael Agustín Silencio (Activo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #187 Santhiago Alexander Agustín Silencio (Activo) | apellidos únicos: ['AGUSTIN', 'SILENCIO'] · tokens únicos: [ |

### `SOFIA VALDERRAMA SIGUEÑAS` — 18 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #7 Sofia Valderrama Sigueñas (Activo) | normalized equal |
| 2 | 100% | L1_EXACT | #213 Sofía Valderrama Sigueñas (Activo) | normalized equal |
| 3 | 89% | L3_APELLIDO_UNICO | #209 Sofía Valderrama Salazar (Activo) | apellidos únicos: ['VALDERRAMA'] · tokens únicos: ['VALDERRA |

### `AMELY LAURA BERMUDEZ ALARCON` — 16 asistencias, años 2025,2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #147 Amely Laura Bermudez Alarcon (Inactivo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #148 Solino Dominic Bermudez Alarcon (Inactivo) | apellidos únicos: ['ALARCON', 'BERMUDEZ'] · tokens únicos: [ |
| 3 | 51% | L5_APELLIDO_SOLO | #74 Sofía Amaia Alarcón Vilchez (Activo) | solo apellido común (['ALARCON']) · nombres distintos · fuzz |

### `ALESSIA MORENO` — 15 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 88% | L3_CONTAINED | #23 Alessia Minerva Moreno Sánchez (Activo) | lado corto 100% contenido · únicos=['MORENO'] · fuzzy=0.64 |
| 2 | 88% | L3_CONTAINED | #230 Alessia minerva moreno Sánchez  (Activo) | lado corto 100% contenido · únicos=['MORENO'] · fuzzy=0.64 |
| 3 | 52% | L5_APELLIDO_SOLO | #109 Matias Javier Moreno Vargas (Activo) | solo apellido común (['MORENO']) · nombres distintos · fuzzy |

### `PAURICK HECTOR JESÚS ERAZO LIMO` — 15 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #122 Paurick Hector Jesús Erazo Limo (Activo) | normalized equal |
| 2 | 95% | L3_CONTAINED | #206 Paurick Erazo Limo (Activo) | lado corto 100% contenido · únicos=['ERAZO', 'LIMO', 'PAURIC |

### `SANTHIAGO ALEXANDEE AGUSTÍN SILENCIO` — 15 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 96% | L3_APELLIDO_UNICO | #187 Santhiago Alexander Agustín Silencio (Activo) | apellidos únicos: ['AGUSTIN', 'SILENCIO'] · tokens únicos: [ |
| 2 | 96% | L3_APELLIDO_UNICO | #188 Aníbal Jael Agustín Silencio (Activo) | apellidos únicos: ['AGUSTIN', 'SILENCIO'] · tokens únicos: [ |

### `SOFIA VALDERRAMA` — 15 asistencias, años 2025

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 89% | L3_CONTAINED | #209 Sofía Valderrama Salazar (Activo) | lado corto 100% contenido · únicos=['VALDERRAMA'] · fuzzy=0. |
| 2 | 88% | L3_CONTAINED | #7 Sofia Valderrama Sigueñas (Activo) | lado corto 100% contenido · únicos=['VALDERRAMA'] · fuzzy=0. |
| 3 | 88% | L3_CONTAINED | #213 Sofía Valderrama Sigueñas (Activo) | lado corto 100% contenido · únicos=['VALDERRAMA'] · fuzzy=0. |

### `AIDAN LIAM ANTONIO SEGURA IBARRA` — 14 asistencias, años 2025,2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #49 Aidan Liam Antonio Segura Ibarra (Activo) | normalized equal |
| 2 | 95% | L3_CONTAINED | #211 Aidan Segura Ibarra (Activo) | lado corto 100% contenido · únicos=['AIDAN', 'IBARRA', 'SEGU |

### `ISAO NICOLÁS HIGA FARÍAS` — 12 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #184 Isao Nicolás Higa Farías (Inactivo) | normalized equal |
| 2 | 100% | L1_EXACT | #205 Isao Nicolás Higa Farías (Activo) | normalized equal |

### `JOSE JOAQUIN LEE VILLALTA` — 12 asistencias, años 2025

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #92 Jose Joaquin Lee Villalta (Activo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #93 Juan Gabriel Lee Villalta (Activo) | apellidos únicos: ['LEE', 'VILLALTA'] · tokens únicos: ['LEE |

### `JUAN GABRIEL LEE VILLALTA` — 12 asistencias, años 2025

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #93 Juan Gabriel Lee Villalta (Activo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #92 Jose Joaquin Lee Villalta (Activo) | apellidos únicos: ['LEE', 'VILLALTA'] · tokens únicos: ['LEE |

### `RODRIGO  THIAGO HUAROTO DE LA TORRE` — 12 asistencias, años 2025

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 82% | L3_APELLIDO_UNICO | #167 Pedro Darío Palli De La Cruz (Inactivo) | apellidos únicos: ['LA'] · tokens únicos: ['DE', 'LA'] · fuz |
| 2 | 82% | L3_APELLIDO_UNICO | #192 Pedro Darío Palli De La Cruz (Activo) | apellidos únicos: ['LA'] · tokens únicos: ['DE', 'LA'] · fuz |

### `VALENTINA ALEXANDRA ROSARIO CABRERA` — 12 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #12 Valentina Alexandra Rosario Cabrera (Activo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #38 Camilo Rosario Cabrera (Activo) | apellidos únicos: ['CABRERA', 'ROSARIO'] · tokens únicos: [' |
| 3 | 50% | L5_APELLIDO_SOLO | #29 Keira Danae Sandoval Cabrera (Activo) | solo apellido común (['CABRERA']) · nombres distintos · fuzz |

### `CAMILO ROSARIO CABRERA` — 11 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #38 Camilo Rosario Cabrera (Activo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #12 Valentina Alexandra Rosario Cabrera (Activo) | apellidos únicos: ['CABRERA', 'ROSARIO'] · tokens únicos: [' |
| 3 | 52% | L5_APELLIDO_SOLO | #29 Keira Danae Sandoval Cabrera (Activo) | solo apellido común (['CABRERA']) · nombres distintos · fuzz |

### `NEYTHAN AGUILERA LUYO` — 11 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 96% | L3_CONTAINED | #115 Neythan Stephano Aguilera Luyo (Activo) | lado corto 100% contenido · únicos=['AGUILERA', 'LUYO', 'NEY |
| 2 | 96% | L3_APELLIDO_UNICO | #118 Noah Alessandro Aguilera Luyo (Activo) | apellidos únicos: ['AGUILERA', 'LUYO'] · tokens únicos: ['AG |
| 3 | 50% | L5_APELLIDO_SOLO | #125 Rafael Alejandro Luyo Alvarado (Activo) | solo apellido común (['LUYO']) · nombres distintos · fuzzy=0 |

### `NOAH AGUILERA LUYO` — 11 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 96% | L3_APELLIDO_UNICO | #115 Neythan Stephano Aguilera Luyo (Activo) | apellidos únicos: ['AGUILERA', 'LUYO'] · tokens únicos: ['AG |
| 2 | 95% | L3_CONTAINED | #118 Noah Alessandro Aguilera Luyo (Activo) | lado corto 100% contenido · únicos=['AGUILERA', 'LUYO'] · fu |
| 3 | 51% | L5_APELLIDO_SOLO | #125 Rafael Alejandro Luyo Alvarado (Activo) | solo apellido común (['LUYO']) · nombres distintos · fuzzy=0 |

### `PAURICK ERAZO LIMO` — 10 asistencias, años 2025

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #206 Paurick Erazo Limo (Activo) | normalized equal |
| 2 | 95% | L3_CONTAINED | #122 Paurick Hector Jesús Erazo Limo (Activo) | lado corto 100% contenido · únicos=['ERAZO', 'LIMO', 'PAURIC |

### `SEBASTIAN CONTRERAS` — 10 asistencias, años 2025

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 89% | L3_APELLIDO_UNICO | #157 Sebatian Contreras Rios (Inactivo) | apellidos únicos: ['CONTRERAS'] · tokens únicos: ['CONTRERAS |
| 2 | 88% | L3_CONTAINED | #103 Luka Sebastian Pavic Contreras (Activo) | lado corto 100% contenido · únicos=['CONTRERAS'] · fuzzy=0.7 |
| 3 | 51% | L5_APELLIDO_SOLO | #53 Antonella Esperanza Olano Contreras (Activo) | solo apellido común (['CONTRERAS']) · nombres distintos · fu |

### `VASCO ALEJANDRO QUEVEDO OROZ` — 10 asistencias, años 2025,2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #175 Vasco Alejandro Quevedo Oroz (Inactivo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #190 Vasco Alejando Quevedo Oroz (Activo) | apellidos únicos: ['OROZ', 'QUEVEDO'] · tokens únicos: ['ORO |

### `ANDREA DANIELA REYNOSO BARAHONA` — 7 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #51 Andrea Daniela Reynoso Barahona (Activo) | normalized equal |
| 2 | 96% | L3_CONTAINED | #61 Daniela Reynoso Barahona (Activo) | lado corto 100% contenido · únicos=['BARAHONA', 'REYNOSO'] · |

### `JESUS ADRIAN SECO ANGULO` — 5 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #88 Jesús Adrian Seco Angulo (Activo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #91 José Angel Seco Angulo (Activo) | apellidos únicos: ['ANGULO', 'SECO'] · tokens únicos: ['ANGU |

### `DARIO` — 4 asistencias, años 2025

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 86% | L3_CONTAINED | #167 Pedro Darío Palli De La Cruz (Inactivo) | lado corto 100% contenido · únicos=['DARIO'] · fuzzy=0.30 |
| 2 | 86% | L3_CONTAINED | #192 Pedro Darío Palli De La Cruz (Activo) | lado corto 100% contenido · únicos=['DARIO'] · fuzzy=0.30 |

### `GALA GUTTIERREZ FINETTI` — 3 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #163 Gala Guttierrez Finetti (Inactivo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #162 Julian Guttierrez Finetti (Inactivo) | apellidos únicos: ['FINETTI', 'GUTTIERREZ'] · tokens únicos: |

### `JULIAN GUTTIERREZ FINETTI` — 3 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 100% | L1_EXACT | #162 Julian Guttierrez Finetti (Inactivo) | normalized equal |
| 2 | 96% | L3_APELLIDO_UNICO | #163 Gala Guttierrez Finetti (Inactivo) | apellidos únicos: ['FINETTI', 'GUTTIERREZ'] · tokens únicos: |

### `SANTHIAGO AGUSTIN SILENCIO` — 2 asistencias, años 2025

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 96% | L3_CONTAINED | #187 Santhiago Alexander Agustín Silencio (Activo) | lado corto 100% contenido · únicos=['AGUSTIN', 'SANTHIAGO',  |
| 2 | 96% | L3_APELLIDO_UNICO | #188 Aníbal Jael Agustín Silencio (Activo) | apellidos únicos: ['AGUSTIN', 'SILENCIO'] · tokens únicos: [ |

### `AARON RENGIFO MACEDA` — 1 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 96% | L3_APELLIDO_UNICO | #170 Isaac Emerson Rengifo Maceda (Inactivo) | apellidos únicos: ['MACEDA', 'RENGIFO'] · tokens únicos: ['M |
| 2 | 96% | L3_CONTAINED | #173 Aaron Jeremias Rengifo Maceda (Inactivo) | lado corto 100% contenido · únicos=['MACEDA', 'RENGIFO'] · f |
| 3 | 52% | L5_APELLIDO_SOLO | #171 Maiza Ariana Velásquez Maceda (Inactivo) | solo apellido común (['MACEDA']) · nombres distintos · fuzzy |

### `SEBASTÍAN CONTRERAS RIOS` — 1 asistencias, años 2026

| # | Conf | Nivel | BD | Detalle |
|---|---|---|---|---|
| 1 | 96% | L3_APELLIDO_UNICO | #157 Sebatian Contreras Rios (Inactivo) | apellidos únicos: ['CONTRERAS', 'RIOS'] · tokens únicos: ['C |
| 2 | 88% | L3_APELLIDO_UNICO | #103 Luka Sebastian Pavic Contreras (Activo) | apellidos únicos: ['CONTRERAS'] · tokens únicos: ['CONTRERAS |
| 3 | 52% | L5_APELLIDO_SOLO | #137 Jaden Bastien Rios Yomond (Inactivo) | solo apellido común (['RIOS']) · nombres distintos · fuzzy=0 |
| 4 | 51% | L5_APELLIDO_SOLO | #53 Antonella Esperanza Olano Contreras (Activo) | solo apellido común (['CONTRERAS']) · nombres distintos · fu |

## 6. Sin match (❌ no están en la BD)

197 alumnos. Probablemente:
- Alumnos del 2025 que ya no están activos y no fueron migrados a la BD
- Alumnos del 2026 que aún no fueron registrados
- Errores de spelling en el Excel que no pudieron matchearse

**Decidir**: crear automáticamente en BD, crear solo los que tienen muchas asistencias, o ignorar por completo.

| Nombre Excel | # asist | Años |
|---|---|---|
| `KEIRA ROMINA PABLO CUEVA` _Mejor score (52) insuficiente_ | 55 | 2025 |
| `GAEL ADRIEZ LUNA QUISPE` | 50 | 2025 |
| `CAMILA VALENTINA GÓMEZ GUAMAN` | 47 | 2025 |
| `LOLA SANCHEZ PINTO` | 42 | 2025 |
| `JAVIER PIERO BARRERA ANCO` | 41 | 2025 |
| `VALENTINA FLAVIA VALDIVIESZO ROMAN` _Mejor score (51) insuficiente_ | 41 | 2025 |
| `JOAQUIN IGNACIO CHUMBES ROMAN` _Mejor score (52) insuficiente_ | 40 | 2025 |
| `ISABELLA QUISPE LUCAS` | 39 | 2025 |
| `ALMA ISABELA CASTILLO MENDOZA` _Mejor score (72) insuficiente_ | 37 | 2025 |
| `LEONARDO GAEL AGUILAR DELGADO` | 36 | 2025 |
| `PIERO PAOLO NORATTO GEISER` | 36 | 2025 |
| `PIERO VALENTINO GONZALES NUÑEZ` _Mejor score (52) insuficiente_ | 34 | 2025,2026 |
| `LIAM GAEL PABLO CUEVA` _Mejor score (54) insuficiente_ | 33 | 2025 |
| `THIAGO RUIZ MINGA` | 33 | 2025 |
| `DANIELA ALEXANDRA CABELLO LEÓN` _Mejor score (53) insuficiente_ | 30 | 2025 |
| `ALESSANDRO GHAEL PALOMINO PEÑA` _Mejor score (51) insuficiente_ | 29 | 2025 |
| `ETHAN SANTIAGO BRUCE CATALAN LAYME` | 27 | 2025 |
| `ABRIL CANO VEGA` _Mejor score (50) insuficiente_ | 26 | 2025 |
| `THIAGO ABRAHAM MATIENZO TELLO` _Mejor score (51) insuficiente_ | 26 | 2025 |
| `EDUARDO FERNANDEZ VILLALAS` | 25 | 2025 |
| `MARCELA VICTORIA GIRALDO RAMIREZ` | 25 | 2025 |
| `MARÍA FERNANDA POMA ROMERO` | 24 | 2025 |
| `ISABELLA VALENTINA GUINEA CERDAN` | 23 | 2025 |
| `JARED EVARISTO GUIZADO MITMA` | 23 | 2025 |
| `WILLY SALVADOR RABORG BERROCAL` | 23 | 2025 |
| `ANIA KAELLA MIA DELGADO JIMENEZ` | 22 | 2025 |
| `MARCELO SANTOS URBANO` | 22 | 2025 |
| `MAXIMO DANIEL JAUREGUI DALAS` | 22 | 2025 |
| `MIA AITHANA ROSSELL MECCA` | 22 | 2025 |
| `ADRIANA  ARANDA GUEVARA` _Mejor score (50) insuficiente_ | 21 | 2025 |
| `MARTIN CAO RUIXUAN RUIZ CHU` | 21 | 2025 |
| `ALEJANDRO OCTAVIO ALEGRIA YUPANQUI` | 20 | 2025 |
| `DANNIA JULIETH SALAZAR ALFARO` _Mejor score (51) insuficiente_ | 20 | 2025 |
| `ELIAS LEONARDO AISPIN CAYCHO` | 20 | 2025 |
| `LEANDRO HUACHALLANQUI MENDOZA` | 20 | 2025 |
| `ALBA LUCIA CABALLERO SORIANO` | 19 | 2025 |
| `ARIA DOMENICA CHONG SANCHEZ` | 19 | 2025 |
| `KEYLER AZAEL TOBAODA CORDOVA` | 19 | 2025 |
| `MARIA FERNANDA ORBEGOSO LOPEZ` _Mejor score (53) insuficiente_ | 19 | 2025 |
| `ELIAS DAVIANGEN OROSCO MONTENEGRO` _Mejor score (53) insuficiente_ | 18 | 2025 |
| `FERNANDA SOCA MEDRARO` | 18 | 2025 |
| `NOAH JOSIAS CHONG SANCHEZ` | 18 | 2025 |
| `EIDRIAN FABIAN FLORES NUÑEZ` | 17 | 2025 |
| `LUCIANA` | 17 | 2025 |
| `NICOLAS SULLON ANDAGUA` | 17 | 2025 |
| `SAID TACSI CANAHUIRI` | 17 | 2025 |
| `BENJAMIN ROMERO` | 16 | 2026 |
| `IAN JADIEZ LEZAMA OJANAMA` | 16 | 2025 |
| `CAMILA GOMEZ HUAMAN` | 15 | 2025 |
| `DANIELA VERONICA TEJADA YATA` | 15 | 2025 |
| `DIEGO PALOMINO LAOS` _Mejor score (52) insuficiente_ | 15 | 2025 |
| `GABRIEL CORNEJO SANDOVAL` _Mejor score (52) insuficiente_ | 15 | 2025 |
| `JESUS ALEJANDRO MICHILOT JULCA` | 15 | 2025 |
| `JULIAN CORNEJO SANDOVAL` _Mejor score (54) insuficiente_ | 15 | 2025 |
| `MATHEWS MAXIMO ISMAEL PEREZ SAUÑE` | 15 | 2025 |
| `MIA CHOZO LOPEZ` | 15 | 2025 |
| `MICAELA PORTOCARRERO BERNAOLA` | 15 | 2025 |
| `ROMAN MALQUI HUAMAN` | 15 | 2025 |
| `SAMIR GABRIEL YAPUCHURA SUXO` | 15 | 2025 |
| `SANTIAGO ELESCANO` | 15 | 2026 |
| `SANTIAGO ROJAS` | 15 | 2025 |
| `ARLETH SALAZAR` | 14 | 2025 |
| `CATALINA ARLETH TIJERO ALIAGA` | 14 | 2025 |
| `GERALD SALOME YAURI` | 14 | 2025 |
| `JOAQUIN SANTIAGO CHANGRA CASTILLO` | 14 | 2025 |
| `LUCIANA ISABELLA LOZADA BERNALA` _Mejor score (53) insuficiente_ | 14 | 2025 |
| `MAR PORTOCARRERO BERNAOLA` | 14 | 2025 |
| `RODRIGO HUAROTO` | 14 | 2025 |
| `GAEL FLORENTINO TRILLO` | 13 | 2025 |
| `ISAU` | 13 | 2025 |
| `ARYAM VELASQUEZ MONTES` _Mejor score (54) insuficiente_ | 12 | 2025 |
| `CALLIE IVANNA CALLIE IVANNA` | 12 | 2025 |
| `DAVE GERALD SALOME YAURI` | 12 | 2025 |
| `DYLAN VELASQUEZ MONTES` _Mejor score (53) insuficiente_ | 12 | 2025 |
| `GUILLERMO CASTILLO CULQUI` | 12 | 2025 |
| `JESUS MICHILOT` | 12 | 2025 |
| `LEONARDO GHAEL AGUILAR DELGADO` | 12 | 2025 |
| `NOAH CASTILLO` | 12 | 2025 |
| `TADEO BASTIAN REYES RAMIREZ` | 12 | 2025 |
| `ADRIANA` | 11 | 2025 |
| `DANIELA AIATAMA CUEVA ZEVALLOS` _Mejor score (52) insuficiente_ | 11 | 2025 |
| `EDU LASTRA MATA` | 11 | 2025 |
| `GABRIEL RUBIANES` | 11 | 2025 |
| `JACK ANDIA RUIZ` | 11 | 2025 |
| `JULIAN CORNEJO` _Mejor score (54) insuficiente_ | 11 | 2025 |
| `LEONARDO HERNANDEZ FLORIAN` _Mejor score (53) insuficiente_ | 11 | 2025 |
| `LEONARDO RODRIGO NAVARRO VALVERDE` | 11 | 2025 |
| `ALESSANDRO EMILIO PEREZ MEDINA` | 10 | 2025 |
| `CATALINA MARIA ROMERO MALPICA` | 10 | 2025 |
| `DARIO DAVID FABIAN HERRERA` | 10 | 2025 |
| `EVAN ADRIAN CASTILLO VALER` _Mejor score (50) insuficiente_ | 10 | 2025 |
| `EVAN SALVADOR AZULA TIPE` | 10 | 2025 |
| `FRANCISCO DAVID PORTELLA MUÑOS` | 10 | 2025 |
| `GABRIEL CORNEJO` _Mejor score (52) insuficiente_ | 10 | 2025 |
| `KENSHIN GUILLERMO ALVA TAKAYAMA` _Mejor score (51) insuficiente_ | 10 | 2025 |
| `MATEO   VALENTINO VARGAS VASQUEZ` | 10 | 2025 |
| `NIKOLAS JIN MENDOZA YANCE` | 10 | 2025 |
| `AMANDA VILLACORTA` | 9 | 2025 |
| `ANDRE CASTILLO VALER` _Mejor score (50) insuficiente_ | 9 | 2025 |
| `BASTIAN ALESSIO GUTIERREZ CANCHO` _Mejor score (54) insuficiente_ | 9 | 2025 |
| `ITALO ALESSANDRO CARRASSA FAZIO` | 9 | 2025 |
| `LUCAS BOLAÑOS GUTIERREZ` _Mejor score (54) insuficiente_ | 9 | 2025 |
| `MAO VALENTINO JARA SICSHI` | 9 | 2025 |
| `MILAN BALDEON GUEVARA` _Mejor score (53) insuficiente_ | 9 | 2025 |
| `NICOLAS VILDOSO GARCIA` | 9 | 2025 |
| `ALBERTO HUARSUCA RAMIREZ` | 8 | 2025 |
| `CAMILO ROSAMO` | 8 | 2025 |
| `CESAR ADRIAN` | 8 | 2025 |
| `DANIELA TEJADA YATA` | 8 | 2025 |
| `LUCAS AGUERO MESARES` | 8 | 2025 |
| `MABEL TOMAS PEDRAZA` | 8 | 2025 |
| `MATEO SOLLER PONCE` | 8 | 2025 |
| `PIA TORERO MERINO` _Mejor score (53) insuficiente_ | 8 | 2025 |
| `SALVADOR EFRAIN BUSTAMANTE PEREZ` | 8 | 2025 |
| `VIOLETA MENDIETA LOZADA` _Mejor score (52) insuficiente_ | 8 | 2025 |
| `ANDRE LEONARDO CARMELO POMA` | 7 | 2025 |
| `ANTONELLA VICTORIA ALDANA CARLOS` | 7 | 2025 |
| `ANTONELLA ZEA ESPINOZA` | 7 | 2026 |
| `BASTIAN MIJAEL MORALES JARAMILLO` | 7 | 2025 |
| `FACUNDO VALENTINO RIOS MEDINA` _Mejor score (53) insuficiente_ | 7 | 2025 |
| `ITALA BRAÑEZ MOLERO` _Mejor score (52) insuficiente_ | 7 | 2025 |
| `PIA VALENTINA TORERO MERINO` _Mejor score (50) insuficiente_ | 7 | 2025 |
| `RAFAEL TERRIBLE` | 7 | 2026 |
| `SANTIAGO ANDRE GASTO MESCUA` | 7 | 2025 |
| `SOFIA QUISPE` | 7 | 2025 |
| `SOPHIE GABRIELLE VALENTINA ALBITES QUIROZ` _Mejor score (51) insuficiente_ | 7 | 2025 |
| `ADRIAN MOISES GARCIA CAHUANA` | 6 | 2025 |
| `DARIUS ABEL ALEMAN SAVEDRA` | 6 | 2025 |
| `EVAN DIAZ AUCCAPUCLLA` | 6 | 2025 |
| `FABIAN FABRIZIO ABARCA ANGELES` _Mejor score (51) insuficiente_ | 6 | 2025 |
| `FERNANDA CATALINA SOCA MEDRANO` | 6 | 2025 |
| `FERNANDA SOLES` | 6 | 2026 |
| `JOAQUIN CHANGRA CASTILLO` | 6 | 2025 |
| `JOAQUIN  MATEO GONZALES CABRERA` _Mejor score (54) insuficiente_ | 6 | 2025 |
| `LUIS EDUARDO VILDO RIOFIO` | 6 | 2025 |
| `LUZ CATALINA SALINAS CARRION` | 6 | 2025 |
| `MATEO CHAUCA` _Mejor score (54) insuficiente_ | 6 | 2026 |
| `MATEO JOSEPH HUATAY` | 6 | 2025 |
| `ANTONELLA SALVADOR PILCO` | 5 | 2026 |
| `EDUARDO AQUINO PELLEGRIN` | 5 | 2025 |
| `FELIPE PUÑO  NUÑEZ` | 5 | 2025 |
| `GiANELLA NICOLE CALDERON AGUIRRE` _Mejor score (51) insuficiente_ | 5 | 2025 |
| `IAN SCHMIDT MARIÑO` | 5 | 2025 |
| `KIANA CHAVEZ ESPARRAGA` | 5 | 2025 |
| `ADRIANO RIVERA ARIZA` | 4 | 2025 |
| `AMANDA VILLACORTA HASHIMOTO` | 4 | 2025 |
| `ASTOR WARI` | 4 | 2025 |
| `IAN LEZAMA OJANAMA` | 4 | 2025 |
| `JULIETA BELLIDO HUAPAYA` _Mejor score (51) insuficiente_ | 4 | 2025 |
| `KAI VEHARA HAMADA` | 4 | 2025 |
| `KATHERINE CERDAN PALOMINO` _Mejor score (51) insuficiente_ | 4 | 2025 |
| `LEONEL MONTOYA ANTIALAN` | 4 | 2025 |
| `MARIA FERNANDA CALDERON` | 4 | 2025 |
| `MOISES YAEL HARIMON PIRO` | 4 | 2025 |
| `NAELAH SOLIS CORDEÑA` | 4 | 2025 |
| `VALERIA MOSCOSO` _Mejor score (53) insuficiente_ | 4 | 2025 |
| `YEREMY YOSEF HARIMON PIRO` | 4 | 2025 |
| `ARIAN AGOSTINO CHAVEZ ALAYO` | 3 | 2025 |
| `CAMILO DAVILA ESPINOZA` _Mejor score (52) insuficiente_ | 3 | 2025 |
| `DIEGO ALONSO SALAZAR ESCOBAR` | 3 | 2025 |
| `FACUNDO RIOS MEDINA` _Mejor score (51) insuficiente_ | 3 | 2026 |
| `FERNANDA ALEXA SOLES GUTIERREZ` _Mejor score (53) insuficiente_ | 3 | 2025 |
| `GAEL ACURIO GARCIA` | 3 | 2025 |
| `GAEL KHALEB ACURIO GARCIA` | 3 | 2025 |
| `GALIA CHAVEZ ENRIQUEZ` | 3 | 2025 |
| `ISABELLA PORTUGAL` | 3 | 2025 |
| `JOAQUIN GAEL MOLINA IBAÑEZ` | 3 | 2025 |
| `JUAN SALVADOR VALAQNIA CEVEDOR` | 3 | 2025 |
| `LÍA GEORGIANA OBREGON GUTTIERREZ` _Mejor score (52) insuficiente_ | 3 | 2025 |
| `LYAM ABRAHAM AMADEO RUIZ FERNANDEZ` | 3 | 2025 |
| `MIA ROJAS LLANTOY` | 3 | 2025 |
| `PEDRO JACK XANDER ANDIA RUIZ` | 3 | 2025 |
| `SRTA. PILCO` | 3 | 2026 |
| `VALERIA CELESTE MOSCOSO DEL CARIO` | 3 | 2025 |
| `ELMER PABLO` | 2 | 2025 |
| `LIA SALAZAR CASTILLA` _Mejor score (72) insuficiente_ | 2 | 2026 |
| `MATEO DE GABRIEL` | 2 | 2025 |
| `SANTIAGO FERNÁNDEZ DÍAZ` | 2 | 2025 |
| `SANTIAGO LESCANO JARA` | 2 | 2025 |
| `SANTIAGO MEJIA CHANCO` | 2 | 2025 |
| `SOPHIE ALBITES QUIROZ` _Mejor score (52) insuficiente_ | 2 | 2025 |
| `THIAGO ANDRE QUISPE FLORES` | 2 | 2025 |
| `THIAGO QUISPE FLORES` | 2 | 2025 |
| `VASCO EMMANUEL JR SOVERO GUILLEN` _Mejor score (51) insuficiente_ | 2 | 2025 |
| `VICENTE SKOPLJAK BELLATIN` | 2 | 2025 |
| `ALEJANDRO MARCO VARGAS RAMIREZ` | 1 | 2026 |
| `DANNA GAELA BACA HUAMANI` _Mejor score (53) insuficiente_ | 1 | 2025 |
| `FABIAN ALEJANDRO FLORES BOCANEGRA` _Mejor score (52) insuficiente_ | 1 | 2025 |
| `LUCIANA VARGAS RAMIREZ` | 1 | 2026 |
| `LUCIANO MATEO GUIZADO LAURENTE` | 1 | 2025 |
| `MARIA FERNANDA ANTIGUA` | 1 | 2025 |
| `MARTIN RUIZ CHU` | 1 | 2025 |
| `MAXIMO DANIEL JAUREGUI DALAO` | 1 | 2025 |
| `ROBERTO TITO CAMACHO` | 1 | 2025 |
| `SANTIAGO MAJU` | 1 | 2026 |
| `TADEO EMILIO GOMEZ VASQUEZ` | 1 | 2025 |
| `TADEO GOMEZ VASQUEZ` | 1 | 2025 |
