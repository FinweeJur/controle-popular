# Inconsistências de data na memória (triagem)

> Compara o dia/mês em que o verbete está guardado com as datas citadas no
> título (forte) e no resumo (contexto — pode ser falso positivo). Gerado por
> `scripts/memoria/checar-datas-mistica.mts`.

- Verbetes analisados: 539
- Título com data diferente do guardado: 20
- Só no resumo (triagem): 64

## Título × data guardada (forte)

| # | guardado | citado | chave |
|---|---|---|---|
| 4 | 01-03 | 03-07 | `01-03|1898|3 de janeiro: 1898: nascimento de luiz carlos pr` |
| 76 | 02-22 | 06-12 | `02-22|s/ano|1989: morte de olivio albani, lider sem-terra ol` |
| 77 | 02-23 | 03-08 | `02-23|1917|em 8 de marco de 1917 (dia 23 de fevereiro no ca` |
| 135 | 03-31 | 04-01 | `03-31|1964|apesar de o golpe ter sido deflagrado em 1º de a` |
| 136 | 03-31 | 10-07 | `03-31|1964|para o padre abdala jorge, paroco de timoteo, o ` |
| 165 | 04-21 | 12-12 | `04-21|1792|joaquim jose da silva xavier, conhecido como tir` |
| 181 | 04-30 | 05-07 | `04-30|s/ano|no dia 30 de abril, hitler se suicida, e, em 7 d` |
| 194 | 05-07 | 04-30 | `05-07|s/ano|no dia 30 de abril, hitler se suicida, e, em 7 d` |
| 221 | 05-25 | 08-06 | `05-25|1809|em 6 de agosto, a assembleia do alto peru decide` |
| 270 | 06-28 | 07-12 | `06-28|1997|durante 30 anos, seus restos mortais permanecera` |
| 286 | 07-12 | 06-28 | `07-12|1997|durante 30 anos, seus restos mortais permanecera` |
| 314 | 08-06 | 05-25 | `08-06|1826|em 6 de agosto, a assembleia do alto peru decide` |
| 359 | 09-09 | 09-14 | `09-09|s/ano|em 9 de setembro, tem seu primeiro encontro com ` |
| 360 | 09-10 | 09-24 | `09-10|1974|a independencia da guine-bissau foi proclamada e` |
| 366 | 09-14 | 09-09 | `09-14|s/ano|em 9 de setembro, tem seu primeiro encontro com ` |
| 378 | 09-24 | 09-10 | `09-24|1973|a independencia da guine-bissau foi proclamada e` |
| 395 | 10-07 | 03-31 | `10-07|1963|para o padre abdala jorge, paroco de timoteo, o ` |
| 434 | 11-07 | 10-25 | `11-07|1917|em 25 de outubro de 1917, no calendario russo (7` |
| 466 | 12-06 | 03-27 | `12-06|s/ano|1974: morto em combate miguel enriquez, secretar` |
| 473 | 12-12 | 04-21 | `12-12|1746|joaquim jose da silva xavier, conhecido como tir` |

## Só no resumo (contexto, revisar)

| # | guardado | citado | trecho |
|---|---|---|---|
| 18 | 01-12 | 05-08 | Vladimir era o quarto filho de oito irmãos, dos quais dois morreram ainda pequenos. Alexandre, o mais velho, foi executado em 8 de maio de 1887, com 21 anos de  |
| 27 | 01-17 | 01-16 | Alagoano, Fiel Filho fora operário metalúrgico por quase duas décadas, isso depois de chegar em São Paulo já maior de idade e ter trabalhado como padeiro e cobr |
| 31 | 01-20 | 09-24 | Quero-te quando contemplo o nosso mundo, um mundo de misérias, de dor, e de ilusões … … e penso, e creio e tenho a máxima Certeza de que o romper da aurora do “ |
| 31 | 01-20 | 09-10 | Quero-te quando contemplo o nosso mundo, um mundo de misérias, de dor, e de ilusões … … e penso, e creio e tenho a máxima Certeza de que o romper da aurora do “ |
| 36 | 01-22 | 02-01 | Foi assassinado num pelotão de fuzilamento por forças militares organizadas pelos Estados Unidos da América no dia 1º de fevereiro de 1932, na cidade de San Sal |
| 49 | 01-31 | 01-28 | Irrompe na cidade do Porto a primeira grande revolta popular que buscava alterar o regime político do país para uma República. Sequenciada pelo “golpe do elevad |
| 49 | 01-31 | 10-05 | Irrompe na cidade do Porto a primeira grande revolta popular que buscava alterar o regime político do país para uma República. Sequenciada pelo “golpe do elevad |
| 56 | 02-06 | 11-20 | Zumbi é ferido, mas consegue escapar do massacre, adentrando no interior do estado. A caça ao líder quilombola prossegue, e em 20 de novembro de 1695 ele é capt |
| 68 | 02-16 | 10-23 | Em 1966, por insistência de Fidel, regressa a Cuba, onde, incógnito, se prepara junto a um grupo de companheiros e parte depois, em 23 de outubro do mesmo ano,  |
| 133 | 03-31 | 06-19 | Em 19 de junho de 1843 casa-se com Jenny Von Westphalen. Redige os manuscritos que viriam a ser conhecidos como Crítica da filosofia do direito de Hegel. |
| 149 | 04-10 | 01-12 | Após a morte de Alexandre, a família, também já sem o pai (que havia falecido em 12 de janeiro de 1886), mudou-se para Kazan, onde Vladimir entrou para a faculd |
| 167 | 04-22 | 04-30 | No dia 30 de abril, Hitler se suicida, e, em 7 de maio, a Alemanha declara a rendição. A ação soviética foi fundamental para a derrota do nazifascismo. |
| 167 | 04-22 | 05-07 | No dia 30 de abril, Hitler se suicida, e, em 7 de maio, a Alemanha declara a rendição. A ação soviética foi fundamental para a derrota do nazifascismo. |
| 179 | 04-30 | 07-02 | Em torno do meio-dia, a bandeira da Frente Nacional de Libertação tremulava no que havia sido a embaixada dos EUA. O Vietnã foi reunificado em 2 de julho de 197 |
| 181 | 04-30 | 04-22 | Como passo importante para o final da Segunda Guerra Mundial, as tropas do Exército soviético tomaram a capital da Alemanha, Berlim, no dia 22 de abril de 1945, |
| 194 | 05-07 | 04-22 | Como passo importante para o final da Segunda Guerra Mundial, as tropas do Exército soviético tomaram a capital da Alemanha, Berlim, no dia 22 de abril de 1945, |
| 195 | 05-08 | 12-17 | Falece em 17 de dezembro de 1830, em Santa Marta, capital da República da Colômbia. Hoje, os processos populares em curso na América Latina retomaram as ideias  |
| 230 | 05-31 | 06-03 | De seu lado, os trabalhadores da categoria de todo o país aprovam a suspensão da greve, indicada pela FUP. Em 3 de junho de 1995, a greve dos petroleiros termin |
| 246 | 06-12 | 09-16 | No dia 16 de setembro, a UDR e a Polícia Militar preparam o despejo das famílias, que se defenderam. No enfrentamento, vários acampados foram feridos, quatro de |
| 258 | 06-18 | 06-27 | Conforme as tropas invasoras avançavam, as comunidades leais ao governo democrático eram massacradas. Sem o apoio do próprio Exército guatemalteco, Árbenz Guzmá |
| 269 | 06-27 | 06-18 | Com o argumento de que era preciso derrubar o presidente para impedir o avanço do comunismo internacional, o governo dos Estados Unidos treinou e financiou a fo |
| 270 | 06-28 | 10-17 | Posteriormente, as províncias de Ciudad de La Habana, La Habana, Matanzas e Villa Clara, representando o povo de Cuba, prestaram-lhe homenagem póstuma, e, em 17 |
| 276 | 07-04 | 09-11 | Na prisão, acorrentado às grades de uma janela, sofreu várias agressões de policiais, que resultaram num traumatismo craniano. Biko morreu no dia 11 de setembro |
| 278 | 07-05 | 01-20 | Em 20 de janeiro de 1973, os projetos de Cabral foram interrompidos com seu assassinato em Conacri. Após sua morte, a luta armada se intensificou. |
| 288 | 07-14 | 08-26 | Liberdade, Igualdade e Fraternidade . Em 26 de agosto de 1789, foi promulgada a Declaração Universal dos Direitos do Homem e do Cidadão. |
| 297 | 07-23 | 12-17 | As lutas seguem na parte setentrional da América do Sul, enquanto que, mais ao sul, o general San Martí também segue na luta pela independência da Argentina e d |
| 299 | 07-24 | 02-09 | Padre Ezequiel Ramin nasceu em Pádua, Itália, em 9 de fevereiro de 1953. Oriundo de uma família pobre, foi ordenado padre em 1980. |
| 305 | 07-28 | 03-08 | Maria Gomes de Oliveira, mais conhecida pelo apelido de Maria Bonita, foi integrante de um grupo de cangaceiros liderado por Lampião. Maria Bonita nasceu no sít |
| 306 | 07-29 | 01-01 | No dia 1º de janeiro de 1994, o Nafta entrou em vigor e, no mesmo dia, o mundo foi surpreendido por um levante armado de camponeses e indígenas de Chiapas, um d |
| 309 | 08-01 | 07-31 | Na virada do dia 31 de julho para o dia 1o de agosto – dia da Pachamama -, explodiu na região de Wollongong, Austrália, a mina de carvão do Monte Klemba. |
| 314 | 08-06 | 12-09 | Em 1824 são travadas as batalhas finais em Junín e Lima. No dia 9 de dezembro, o general Sucre, seu aliado, vence a batalha de Ayacucho, que marca a liberdade d |
| 328 | 08-13 | 11-09 | O muro tornou-se símbolo tanto da nova divisão política mundial, entre as potências soviéticas e estadunidenses, quanto da Guerra Fria. Depois de 28 anos, em 9  |
| 330 | 08-15 | 07-23 | Sua primeira experiência de guerra foi em 23 de julho de 1811, ainda sob as ordens de Francisco Miranda. Em 24 de dezembro de 1812, Bolívar inicia sua campanha  |
| 330 | 08-15 | 12-24 | Sua primeira experiência de guerra foi em 23 de julho de 1811, ainda sob as ordens de Francisco Miranda. Em 24 de dezembro de 1812, Bolívar inicia sua campanha  |
| 348 | 08-31 | 10-16 | A coluna chega à região montanhosa de Las Villas em 16 de outubro, começando assim a histórica Campanha de Las Villas. São tomadas suas principais cidades, fina |
| 348 | 08-31 | 01-01 | A coluna chega à região montanhosa de Las Villas em 16 de outubro, começando assim a histórica Campanha de Las Villas. São tomadas suas principais cidades, fina |
| 353 | 09-04 | 07-26 | Ao sair da prisão em 1954, entra na clandestinidade e adota o pseudônimo Maria. Em Santiago de Cuba, se tornou uma das integrantes da direção nacional do Movime |
| 360 | 09-10 | 07-05 | Cabo Verde se tornou independente em 5 de julho de 1975. |
| 368 | 09-16 | 09-11 | O golpe militar de 11 de setembro de 1973 o surpreende na universidade, onde é preso e conduzido ao Estádio Chile, que havia sido transformado em prisão. No est |
| 380 | 09-25 | 05-08 | Em 8 de maio de 1830, depois de assistir ao desmembramento dos países, sai de Bogotá com o intuito de se exilar, já sofrendo com a tuberculose. |
| 403 | 10-14 | 06-16 | Em 16 de junho de 1822, Bolívar entra vitorioso em Quito. |
| 407 | 10-16 | 01-01 | São tomadas suas principais cidades, finalizando com a Batalha de Santa Clara e a rendição das tropas inimigas em 1º de janeiro de 1959. |
| 409 | 10-17 | 06-28 | Durante 30 anos, seus restos mortais permaneceram naquela localidade, até a data de sua descoberta, em 28 de junho de 1997, e seu traslado a Cuba, em 12 de julh |
| 409 | 10-17 | 07-12 | Durante 30 anos, seus restos mortais permaneceram naquela localidade, até a data de sua descoberta, em 28 de junho de 1997, e seu traslado a Cuba, em 12 de julh |
| 431 | 11-04 | 12-10 | Ele foi perseguido como a caça mais cobiçada e condenado à morte cívica, à eliminação da memória coletiva. Só em 10 de dezembro de 1979, quando seus restos mort |
| 433 | 11-06 | 01-07 | Por Waldson Silva – Cabano paraense Fonte: NPC – Livro Agenda 2013 A data de 7 de janeiro de 1835 é considerada pela maioria dos historiadores como o início do  |
| 442 | 11-14 | 11-22 | Almirante Negro Assim, no dia 22 de novembro, os marujos tomaram os couraçados Minas Gerais, São Paulo e Deodoro, e o scout Bahia, aportaram na Baía de Guanabar |
| 444 | 11-16 | 02-07 | Em 1750, o tratado de Madri entre Portugal e a Espanha modificou as fronteiras das terras sob o domínio dos Impérios. Com isso ganharam tempo para buscar reforç |
| 447 | 11-19 | 03-15 | No dia 15 de março de 1789, o Movimento pela Independência foi delatado. Os delatores tiveram suas dívidas perdoadas e anos mais tarde receberam o título de fid |
| 452 | 11-22 | 11-27 | O desfecho da revolta só ocorreria cinco dias depois, em 27 de novembro de 1910, quando o presidente Hermes da Fonseca atendeu às reivindicações dos revoltosos. |
| 462 | 12-02 | 08-20 | No dia 20 de agosto de 1940, Leon Trotsky é assassinado com uma picareta, em sua casa, na Cidade do México. |
| 464 | 12-04 | 01-13 | Faleceu em Itu (SP) em 13 de janeiro de 1999. |
| 474 | 12-13 | 05-01 | A história do 1º de Maio mostra, portanto, que se trata de um dia de luto e de luta, não só pela redução da jornada de trabalho, mas também pela conquista de to |
| 478 | 12-17 | 06-16 | Em 16 de junho de 1822, Bolívar entra vitorioso em Quito. Nessa cidade, conheceria Manuela Sáenz, sua grande companheira. |
| 483 | 12-21 | 08-27 | Faleceu em Recife no dia 27 de agosto de 1999. |
| 486 | 12-24 | 10-14 | Em 14 de outubro de 1813, depois de uma entrada triunfal em Caracas, Venezuela, o Conselho de Caracas, em assembleia pública, aclama Bolívar como general e libe |
| 494 | 04-19 | 04-21 | De 19 a 21 de abril, em Goiânia, o I Encontro Nacional de Trabalhadores Atingidos por Barragens reuniu, em quatro etapas regionais, quem resistia à construção d |
| 498 | 12-10 | 12-13 | Entre 10 e 13 de dezembro, em São Paulo, o III Congresso Nacional do MAB debateu as linhas gerais de ação, o trabalho de base, a política de alianças e a posiçã |
| 505 | 10-01 | 10-07 | De 1 a 7 de outubro, em Temacapulín (México), o III Encontro Internacional reuniu 320 delegados de 60 países e fortaleceu a luta contra a barragem de El Zapotil |
| 507 | 09-01 | 09-05 | De 1 a 5 de setembro, em Cotia (SP), 2.500 atingidos definiram priorizar a luta contra grandes barragens, principalmente na Amazônia, e avançar na construção do |
| 508 | 09-19 | 09-23 | Entre 19 e 23 de setembro, em Chapecó (SC), foi fundado o Movimiento de Afectados por Represas (MAR), com organizações de 12 países que lutam contra barragens n |
| 509 | 10-01 | 10-05 | De 1 a 5 de outubro, no Rio de Janeiro, mais de 3.500 atingidos e delegações de 19 países definiram os rumos do Projeto Energético Popular; a marcha final reuni |
| 510 | 11-04 | 11-07 | De 4 a 7 de novembro, mais de 2.500 atingidos de 20 estados foram a Brasília exigir reparação e políticas de proteção social — e a aprovação da Política Naciona |
| 512 | 11-06 | 11-11 | Em Belém (PA), de 6 a 11 de novembro, durante a COP 30, mais de 200 delegados de 45 países fundaram o Movimento Internacional de Atingidos por Barragens, Crimes |
