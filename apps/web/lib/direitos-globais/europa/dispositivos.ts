/**
 * @file apps/web/lib/direitos-globais/europa/dispositivos.ts
 * @description Dispositivos constitucionais e marcos normativos fundamentais da Europa (Leva 1).
 *
 * Regra editorial do Controle Popular:
 * - O campo `texto` é a transcrição integral verbatim do preceito legal, sem resumo nem paráfrase.
 * - O campo `idiomaOriginal` indica a língua da fonte canônica e `traducao` oferece a versão em português.
 * - Fontes primárias públicas: Constitute Project (Comparative Constitutions Project) e Legislation.gov.uk (The National Archives).
 * - Acesso documentado em 2026-10-30.
 */

import type { Dispositivo, TipoDireito } from "../tipos";
import { PAISES_EUROPA } from "./paises";

export const DISPOSITIVOS_EUROPA: readonly Dispositivo[] = [
  // =========================================================================
  // 1. REINO UNIDO (UK / GB)
  // =========================================================================
  {
    pais: "Reino Unido",
    tipo: "humanos",
    citacao: "Section 6",
    titulo: "Acts of public authorities",
    texto:
      "(1) It is unlawful for a public authority to act in a way which is incompatible with a Convention right.\n" +
      "(2) Subsection (1) does not apply to an act if—\n" +
      "(a) as the result of one or more provisions of primary legislation, the authority could not have acted differently; or\n" +
      "(b) in the case of one or more provisions of, or made under, primary legislation which cannot be read or given effect in a way which is compatible with the Convention rights, the authority was acting so as to give effect to or enforce those provisions.\n" +
      "(3) In this section 'public authority' includes—\n" +
      "(a) a court or tribunal, and\n" +
      "(b) any person certain of whose functions are functions of a public nature,\n" +
      "but does not include either House of Parliament or a person exercising functions in connection with proceedings in Parliament.",
    fonte: "Legislation.gov.uk",
    url: "https://www.legislation.gov.uk/ukpga/1998/42/section/6",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao:
      "É ilegal para uma autoridade pública agir de forma incompatível com um direito da Convenção Europeia dos Direitos Humanos. O termo autoridade pública inclui tribunais e qualquer entidade cujas funções tenham natureza pública.",
  },
  {
    pais: "Reino Unido",
    tipo: "humanos",
    citacao: "Clauses 39 and 40 (Confirmatio Cartarum 1297 c. 29)",
    titulo: "Due process, lawful judgment and justice",
    texto:
      "No free man shall be seized or imprisoned, or stripped of his rights or possessions, or outlawed or exiled, or deprived of his standing in any way, nor will we proceed with force against him, or send others to do so, except by the lawful judgment of his equals or by the law of the land. To no one will we sell, to no one deny or delay right or justice.",
    fonte: "Legislation.gov.uk",
    url: "https://www.legislation.gov.uk/aep/Edw1cc1929/25/29/section/XXIX",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao:
      "Nenhum homem livre será detido ou aprisionado, privado de seus bens, colocado fora da lei ou exilado, nem de qualquer modo destruído, a não ser por julgamento legítimo de seus pares ou pela lei da terra. A ninguém venderemos, a ninguém recusaremos ou adiaremos direito ou justiça.",
  },
  {
    pais: "Reino Unido",
    tipo: "ambiental",
    citacao: "Section 1",
    titulo: "The target for 2050 (Net Zero target)",
    texto:
      "(1) It is the duty of the Secretary of State to ensure that the net UK carbon account for the year 2050 is at least 100% lower than the 1990 baseline.\n" +
      "(2) 'The 1990 baseline' means the aggregate of—\n" +
      "(a) net UK emissions of carbon dioxide for that year, and\n" +
      "(b) net UK emissions of each of the other targeted greenhouse gases for the year that is the base year for that gas.",
    fonte: "Legislation.gov.uk",
    url: "https://www.legislation.gov.uk/ukpga/2008/27/section/1",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao:
      "É dever legal do Secretário de Estado assegurar que as emissões líquidas de carbono do Reino Unido até o ano de 2050 sejam pelo menos 100% inferiores à linha de base de 1990 (meta vinculante de emissões líquidas zero).",
  },

  // =========================================================================
  // 2. FRANÇA (FR)
  // =========================================================================
  {
    pais: "França",
    tipo: "humanos",
    citacao: "Article 1er",
    titulo: "Principes de la République: indivisible, laïque, démocratique et sociale",
    texto:
      "La France est une République indivisible, laïque, démocratique et sociale. Elle assure l'égalité devant la loi de tous les citoyens sans distinction d'origine, de race ou de religion. Elle respecte toutes les croyances. Son organisation est décentralisée.\n" +
      "La loi favorise l'égal accès des femmes et des hommes aux mandats électoraux et fonctions électives, ainsi qu'aux responsabilités professionnelles et sociales.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/France_2008",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "fr",
    traducao:
      "A França é uma República indivisível, laica, democrática e social. Assegura a igualdade perante a lei de todos os cidadãos, sem distinção de origem, raça ou religião. Respeita todas as crenças. A lei favorece a igualdade de acesso de mulheres e homens aos mandatos e funções eletivas.",
  },
  {
    pais: "França",
    tipo: "ambiental",
    citacao: "Charte de l'environnement, Article 1er",
    titulo: "Droit de vivre dans un environnement équilibré et respectueux de la santé",
    texto: "Chacun a le droit de vivre dans un environnement équilibré et respectueux de la santé.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/France_2008",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "fr",
    traducao:
      "Cada pessoa tem o direito fundamental de viver em um meio ambiente equilibrado e favorável à saúde.",
  },
  {
    pais: "França",
    tipo: "ambiental",
    citacao: "Charte de l'environnement, Article 2",
    titulo: "Devoir de préservation et d'amélioration de l'environnement",
    texto: "Toute personne a le devoir de prendre part à la préservation et à l'amélioration de l'environnement.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/France_2008",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "fr",
    traducao:
      "Toda pessoa tem o dever coletivo e individual de participar da preservação e melhoria do meio ambiente.",
  },

  // =========================================================================
  // 3. ALEMANHA (DE)
  // =========================================================================
  {
    pais: "Alemanha",
    tipo: "humanos",
    citacao: "Artikel 1",
    titulo: "Schutz der Menschenwürde, Menschenrechte, Grundrechtsbindung",
    texto:
      "(1) Die Würde des Menschen ist unantastbar. Sie zu achten und zu schützen ist Verpflichtung aller staatlichen Gewalt.\n" +
      "(2) Das Deutsche Volk bekennt sich darum zu unverletzlichen und unveräußerlichen Menschenrechten als Grundlage jeder menschlichen Gemeinschaft, des Friedens und der Gerechtigkeit in der Welt.\n" +
      "(3) Die nachfolgenden Grundrechte binden Gesetzgebung, vollziehende Gewalt und Rechtsprechung als unmittelbar geltendes Recht.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/German_Federal_Republic_2014",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "de",
    traducao:
      "A dignidade da pessoa humana é inviolável. Respeitá-la e protegê-la é dever de todo o poder estatal. O povo alemão reconhece os direitos humanos invioláveis e inalienáveis como fundamento de toda comunidade humana, da paz e da justiça no mundo.",
  },
  {
    pais: "Alemanha",
    tipo: "ambiental",
    citacao: "Artikel 20a",
    titulo: "Schutz der natürlichen Lebensgrundlagen und der Tiere",
    texto:
      "Der Staat schützt auch in Verantwortung für die künftigen Generationen die natürlichen Lebensgrundlagen und die Tiere im Rahmen der verfassungsmäßigen Ordnung durch die Gesetzgebung und nach Maßgabe von Gesetz und Recht durch die vollziehende Gewalt und die Rechtsprechung.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/German_Federal_Republic_2014",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "de",
    traducao:
      "O Estado protege, também em responsabilidade para com as futuras gerações, os fundamentos naturais da vida e os animais, no âmbito da ordem constitucional, por meio da legislação e, na conformidade da lei e do direito, pelos poderes executivo e judiciário.",
  },

  // =========================================================================
  // 4. PAÍSES BAIXOS (NL)
  // =========================================================================
  {
    pais: "Países Baixos",
    tipo: "humanos",
    citacao: "Artikel 1",
    titulo: "Gelijke behandeling en discriminatieverbod",
    texto:
      "Allen die zich in Nederland bevinden, worden in gelijke gevallen gelijk behandeld. Discriminatie wegens godsdienst, levensovertuiging, politieke gezindheid, ras, geslacht, handicap, seksuele gerichtheid of op welke grond dan ook, is niet toegestaan.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Netherlands_2008",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "nl",
    traducao:
      "Todas as pessoas que se encontrem nos Países Baixos são tratadas de forma igual em casos iguais. A discriminação por motivo de religião, convicção pessoal, opinião política, raça, gênero, deficiência, orientação sexual ou por qualquer outro motivo não é permitida.",
  },
  {
    pais: "Países Baixos",
    tipo: "ambiental",
    citacao: "Artikel 21",
    titulo: "Bescherming van het leefmilieu",
    texto:
      "De zorg van de overheid is gericht op de bewoonbaarheid van het land en de bescherming en verbetering van het leefmilieu.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Netherlands_2008",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "nl",
    traducao:
      "O zelo dos poderes públicos tem por objetivo a habitabilidade do país e a proteção e melhoria do meio ambiente.",
  },

  // =========================================================================
  // 5. ESPANHA (ES)
  // =========================================================================
  {
    pais: "Espanha",
    tipo: "humanos",
    citacao: "Artículo 14",
    titulo: "Igualdad ante la ley",
    texto:
      "Los españoles son iguales ante la ley, sin que pueda prevalecer discriminación alguna por razón de nacimiento, raza, sexo, religión, opinión o cualquier otra condición o circunstancia personal o social.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Spain_2011",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "es",
    traducao:
      "Os espanhóis são iguais perante a lei, sem que possa prevalecer discriminação alguma por motivo de nascimento, raça, sexo, religião, opinião ou qualquer outra condição ou circunstância pessoal ou social.",
  },
  {
    pais: "Espanha",
    tipo: "ambiental",
    citacao: "Artículo 45",
    titulo: "Medio ambiente y calidad de vida",
    texto:
      "1. Todos tienen el derecho a disfrutar de un medio ambiente adecuado para el desarrollo de la persona, así como el deber de conservarlo.\n" +
      "2. Los poderes públicos velarán por la utilización racional de todos los recursos naturales, con el fin de proteger y mejorar la calidad de la vida y defender y restaurar el medio ambiente, apoyándose en la indispensable solidaridad colectiva.\n" +
      "3. Para quienes violen lo dispuesto en el apartado anterior, en los términos que la ley fije se establecerán sanciones penales o, en su caso, administrativas, así como la obligación de reparar el daño causado.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Spain_2011",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "es",
    traducao:
      "1. Todos têm o direito de desfrutar de um meio ambiente adequado para o desenvolvimento da pessoa, bem como o dever de conservá-lo. 2. Os poderes públicos zelarão pela utilização racional de todos os recursos naturais. 3. Estabelecer-se-ão sanções penais ou administrativas, além da obrigação de reparar o dano causado.",
  },

  // =========================================================================
  // 6. PORTUGAL (PT)
  // =========================================================================
  {
    pais: "Portugal",
    tipo: "politicos",
    citacao: "Artigo 9.º",
    titulo: "Tarefas fundamentais do Estado",
    texto:
      "São tarefas fundamentais do Estado:\n" +
      "a) Garantir a independência nacional e criar as condições políticas, econômicas, sociais e culturais que a promovam;\n" +
      "b) Garantir os direitos e liberdades fundamentais e o respeito pelos princípios do Estado de direito democrático;\n" +
      "c) Defender a democracia política, assegurar e incentivar a participação democrática dos cidadãos na resolução dos problemas nacionais;\n" +
      "d) Promover o bem-estar e a qualidade de vida do povo e a igualdade real entre os portugueses, bem como a efectivação dos direitos econômicos, sociais, culturais e ambientais, mediante a transformação e modernização das estruturas econômicas e sociais;\n" +
      "e) Proteger e valorizar o património cultural do povo português, defender a natureza e o ambiente, preservar os recursos naturais e assegurar um correcto ordenamento do território;\n" +
      "f) Assegurar o ensino e a valorização constante, defender o uso e promover a difusão internacional da língua portuguesa;\n" +
      "g) Promover o desenvolvimento harmonioso de todo o território nacional, tendo em conta, designadamente, o carácter ultraperiférico dos arquipélagos dos Açores e da Madeira;\n" +
      "h) Promover a igualdade entre homens e mulheres.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Portugal_2005",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "pt",
  },
  {
    pais: "Portugal",
    tipo: "humanos",
    citacao: "Artigo 13.º",
    titulo: "Princípio da igualdade",
    texto:
      "1. Todos os cidadãos têm a mesma dignidade social e são iguais perante a lei.\n" +
      "2. Ninguém pode ser privilegiado, beneficiado, prejudicado, privado de qualquer direito ou isento de qualquer dever em razão de ascendência, sexo, raça, língua, território de origem, religião, convicções políticas ou ideológicas, instrução, situação econômica, condição social ou orientação sexual.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Portugal_2005",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "pt",
  },
  {
    pais: "Portugal",
    tipo: "ambiental",
    citacao: "Artigo 66.º",
    titulo: "Ambiente e qualidade de vida",
    texto:
      "1. Todos têm direito a um ambiente de vida humano, sadio e ecologicamente equilibrado e o dever de o defender.\n" +
      "2. Para assegurar o direito ao ambiente, no quadro de um desenvolvimento sustentável, incumbe ao Estado, por meio de organismos próprios e com o envolvimento e a participação dos cidadãos:\n" +
      "a) Prevenir e controlar a poluição e os seus efeitos e as formas prejudiciais de erosão;\n" +
      "b) Ordenar e promover o ordenamento do território, tendo em vista uma correcta localização das actividades, um equilibrado desenvolvimento socioeconômico e a valorização da paisagem;\n" +
      "c) Criar e desenvolver reservas e parques naturais e de recreio, bem como classificar e proteger paisagens e sítios, de modo a garantir a conservação da natureza e a preservação de valores culturais de interesse turístico ou científico;\n" +
      "d) Promover o aproveitamento racional dos recursos naturais, salvaguardando a sua capacidade de renovação e a estabilidade ecológica, com respeito pelo princípio da solidariedade entre gerações;\n" +
      "e) Promover, em colaboração com as autarquias locais, a qualidade ambiental das povoações e da vida urbana, designadamente no plano arquitectónico e da protecção das zonas históricas;\n" +
      "f) Promover a integração de objectivos ambientais nas várias políticas de âmbito sectorial;\n" +
      "g) Promover a educação ambiental e o respeito pelos valores do ambiente;\n" +
      "h) Assegurar que a política fiscal compatibilize desenvolvimento com protecção do ambiente e qualidade de vida.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Portugal_2005",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "pt",
  },

  // =========================================================================
  // 7. ITÁLIA (IT)
  // =========================================================================
  {
    pais: "Itália",
    tipo: "humanos",
    citacao: "Articolo 3",
    titulo: "Pari dignità sociale e uguaglianza sostanziale",
    texto:
      "Tutti i cittadini hanno pari dignità sociale e sono eguali davanti alla legge, senza distinzione di sesso, di razza, di lingua, di religione, di opinioni politiche, di condizioni personali e sociali.\n" +
      "È compito della Repubblica rimuovere gli ostacoli di ordine economico e sociale, che, limitando di fatto la libertà e l'eguaglianza dei cittadini, impediscono il pieno sviluppo della persona umana e l'effettiva partecipazione di tutti i lavoratori all'organizzazione politica, economica e sociale del Paese.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Italy_2020",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "it",
    traducao:
      "Todos os cidadãos têm igual dignidade social e são iguais perante a lei, sem distinção de sexo, raça, língua, religião, opiniões políticas, condições pessoais e sociais. É dever da República remover os obstáculos de ordem econômica e social que impeçam o pleno desenvolvimento da pessoa humana.",
  },
  {
    pais: "Itália",
    tipo: "ambiental",
    citacao: "Articolo 9",
    titulo: "Tutela dell'ambiente, biodiversità ed ecosistemi",
    texto:
      "La Repubblica promuove lo sviluppo della cultura e la ricerca scientifica e tecnica.\n" +
      "Tutela il paesaggio e il patrimonio storico e artistico della Nazione.\n" +
      "Tutela l'ambiente, la biodiversità e gli ecosistemi, anche nell'interesse delle future generazioni. La legge dello Stato disciplina i modi e le forme di tutela degli animali.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Italy_2020",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "it",
    traducao:
      "A República promove o desenvolvimento da cultura e da pesquisa científica e técnica. Tutela a paisagem e o patrimônio histórico e artístico da Nação. Tutela o meio ambiente, a biodiversidade e os ecossistemas, inclusive no interesse das futuras gerações. A lei estatal disciplina os modos de proteção aos animais.",
  },

  // =========================================================================
  // 8. SUÍÇA (CH)
  // =========================================================================
  {
    pais: "Suíça",
    tipo: "humanos",
    citacao: "Artikel 8",
    titulo: "Rechtsgleichheit und Diskriminierungsverbot",
    texto:
      "1. Alle Menschen sind vor dem Gesetz gleich.\n" +
      "2. Niemand darf diskriminiert werden, namentlich nicht wegen der Herkunft, der Rasse, des Geschlechts, des Alters, der Sprache, der sozialen Stellung, der Lebensform, der religiösen, weltanschaulichen oder politischen Überzeugung oder wegen einer körperlichen, geistigen oder psychischen Behinderung.\n" +
      "3. Mann und Frau sind gleichberechtigt. Das Gesetz sorgt für ihre rechtliche und tatsächliche Gleichstellung, vor allem in Familie, Ausbildung und Arbeit. Mann und Frau haben Anspruch auf gleichen Lohn für gleichwertige Arbeit.\n" +
      "4. Das Gesetz sieht Massnahmen zur Beseitigung von Benachteiligungen der Behinderten vor.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Switzerland_2014",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "de",
    traducao:
      "1. Todos os seres humanos são iguais perante a lei. 2. Ninguém pode ser discriminado, nomeadamente por sua origem, raça, gênero, idade, língua, condição social, convicções religiosas ou políticas, ou por deficiência. 3. Homem e mulher têm direitos iguais e direito a salário igual para trabalho de igual valor.",
  },
  {
    pais: "Suíça",
    tipo: "ambiental",
    citacao: "Artikel 73",
    titulo: "Nachhaltigkeit",
    texto:
      "Bund und Kantone streben ein dauerhaft ausgewogenes Verhältnis zwischen der Natur und ihrer Erneuerungsfähigkeit einerseits und ihrer Beanspruchung durch den Menschen anderseits an.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Switzerland_2014",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "de",
    traducao:
      "A Confederação e os cantões buscam uma relação duradouramente equilibrada entre a natureza e a sua capacidade de regeneração, por um lado, e a sua utilização pelo ser humano, por outro.",
  },
  {
    pais: "Suíça",
    tipo: "ambiental",
    citacao: "Artikel 74",
    titulo: "Umweltschutz und Verursacherprinzip",
    texto:
      "1. Der Bund erlässt Vorschriften über den Schutz des Menschen und seiner natürlichen Umwelt vor schädlichen oder lästigen Einwirkungen.\n" +
      "2. Er sorgt dafür, dass solche Einwirkungen vermieden werden. Die Kosten der Vermeidung und Beseitigung tragen die Verursacher.\n" +
      "3. Für den Vollzug der Vorschriften sind die Kantone zuständig, soweit das Gesetz ihn nicht dem Bund vorbehält.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Switzerland_2014",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "de",
    traducao:
      "1. A Confederação legisla sobre a proteção do ser humano e do seu ambiente natural contra efeitos prejudiciais ou incómodos. 2. Os custos de prevenção e de eliminação são suportados pelos causadores (princípio do poluidor-pagador).",
  },

  // =========================================================================
  // 9. NORUEGA (NO)
  // =========================================================================
  {
    pais: "Noruega",
    tipo: "humanos",
    citacao: "Paragraf 92",
    titulo: "Menneskerettighetenes stilling",
    texto:
      "Statens myndigheter skal respektere og sikre menneskerettighetene slik de er nedfelt i denne grunnlov og i for Norge bindende traktater om menneskerettigheter.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Norway_2014",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "no",
    traducao:
      "As autoridades do Estado devem respeitar e assegurar os direitos humanos nos termos estabelecidos nesta Constituição e nos tratados de direitos humanos vinculantes para a Noruega.",
  },
  {
    pais: "Noruega",
    tipo: "ambiental",
    citacao: "Paragraf 112",
    titulo: "Rett til et helsefremmende miljø",
    texto:
      "Enhver har rett til et miljø som sikrer helsen, og til en natur der produksjonsevne og mangfold bevares. Naturens ressurser skal disponeres ut fra en langsiktig og allsidig betraktning som ivaretar denne rett også for etterslekten.\n" +
      "Borgerne har rett til kunnskap om naturmiljøets tilstand og om virkningene av planlagte og iverksatte inngrep i naturen, slik at de kan ivareta den rett de har etter foregående ledd.\n" +
      "Statens myndigheter skal iverksette tiltak som gjennomfører disse grunnsetninger.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Norway_2014",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "no",
    traducao:
      "Toda pessoa tem direito a um meio ambiente propício à saúde e a uma natureza cuja produtividade e diversidade sejam conservadas. Os recursos naturais devem ser geridos para salvaguardar esse direito também para a posteridade. Os cidadãos têm direito à informação sobre as intervenções ambientais planejadas.",
  },

  // =========================================================================
  // 10. SUÉCIA (SE)
  // =========================================================================
  {
    pais: "Suécia",
    tipo: "humanos",
    citacao: "1 kap. 2 §",
    titulo: "Målen för den offentliga verksamheten",
    texto:
      "Den offentliga makten ska utövas med respekt för alla människors lika värde och för den enskilda människans frihet och värdighet.\n" +
      "Den enskildes personliga, ekonomiska och kulturella välfärd ska vara grundläggande mål för den offentliga verksamheten. Särskilt ska det allmänna trygga rätten till arbete, bostad och utbildning samt verka för social omsorg och trygghet och för goda förutsättningar för hälsa.\n" +
      "Det allmänna ska främja en hållbar utveckling som leder till en god miljö för nuvarande och kommande generationer.\n" +
      "Det allmänna ska verka för att demokratins idéer blir vägledande inom samhällets alla områden samt värna den enskildes privatliv och familjeliv.\n" +
      "Det allmänna ska verka för att alla människor ska kunna uppnå delaktighet och jämlikhet i samhället och för att barns rätt tas till vara. Det allmänna ska motverka diskriminering av människor på grund av kön, hudfärg, nationellt eller etniskt ursprung, språklig eller religiös tillhörighet, funktionshinder, sexuell läggning, ålder eller andra omständigheter som gäller den enskilde som person.\n" +
      "Samiska folkets och etniska, språkliga och religiösa minoriteters möjligheter att behålla och utveckla ett eget kultur- och samhällsliv ska främjas.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Sweden_2012",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "sv",
    traducao:
      "O poder público deve ser exercido com respeito pelo valor igual de todos os seres humanos e pela dignidade do indivíduo. O Estado promoverá o desenvolvimento sustentável para um meio ambiente sadio às presentes e futuras gerações e combaterá a discriminação, assegurando os direitos dos povos indígenas Sámi e minorias.",
  },
  {
    pais: "Suécia",
    tipo: "politicos",
    citacao: "2 kap. 1 §",
    titulo: "Opinionsfriheter",
    texto:
      "Var och en är gentemot det allmänna tillförsäkrad:\n" +
      "1. yttrandefrihet: frihet att i tal, skrift eller bild eller på annat sätt meddela upplysningar samt uttrycka tankar, åsikter och känslor,\n" +
      "2. informationsfrihet: frihet att inhämta och ta emot upplysningar samt att i övrigt ta del av andras yttranden,\n" +
      "3. mötesfrihet: frihet att anordna och delta i sammankomster för upplysning, meningsyttring eller annat liknande syfte eller för framförande av konstnärligt verk,\n" +
      "4. demonstrationsfrihet: frihet att anordna och delta i demonstrationer på allmän plats,\n" +
      "5. föreningsfrihet: frihet att sammansluta sig med andra för allmänna eller enskilda syften, och\n" +
      "6. religionsfrihet: frihet att ensam eller tillsammans med andra utöva sin religion.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Sweden_2012",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "sv",
    traducao:
      "São asseguradas a todos perante o poder público: a liberdade de manifestação do pensamento, a liberdade de informação, a liberdade de reunião, a liberdade de manifestação em locais públicos, a liberdade de associação e a liberdade religiosa.",
  },

  // =========================================================================
  // 11. POLÔNIA (PL)
  // =========================================================================
  {
    pais: "Polônia",
    tipo: "ambiental",
    citacao: "Artykuł 5",
    titulo: "Rzeczpospolita chroni niepodległość, prawa człowieka i środowisko",
    texto:
      "Rzeczpospolita Polska strzeże niepodległości i nienaruszalności swojego terytorium, zapewnia wolności i prawa człowieka i obywatela oraz bezpieczeństwo obywateli, strzeże dziedzictwa narodowego oraz zapewnia ochronę środowiska, kierując się zasadą zrównoważonego rozwoju.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Poland_1997",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "pl",
    traducao:
      "A República da Polônia salvaguarda a independência e a integridade de seu território, assegura as liberdades e os direitos fundamentais do cidadão e a segurança pública, guarda o patrimônio nacional e assegura a proteção do meio ambiente, guiando-se pelo princípio do desenvolvimento sustentável.",
  },
  {
    pais: "Polônia",
    tipo: "ambiental",
    citacao: "Artykuł 74",
    titulo: "Bezpieczeństwo ekologiczne i ochrona środowiska",
    texto:
      "1. Władze publiczne prowadzą politykę zapewniającą bezpieczeństwo ekologiczne współczesnemu i przyszłym pokoleniom.\n" +
      "2. Ochrona środowiska jest obowiązkiem władz publicznych.\n" +
      "3. Każdy ma prawo do informacji o stanie i ochronie środowiska.\n" +
      "4. Władze publiczne wspierają działania obywateli na rzecz ochrony i poprawy stanu środowiska.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Poland_1997",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "pl",
    traducao:
      "1. Os poderes públicos conduzem políticas que asseguram a segurança ecológica às atuais e futuras gerações. 2. A proteção ambiental é dever do Estado. 3. Toda pessoa tem direito à informação sobre a situação e a conservação do meio ambiente. 4. O Estado apoia a ação dos cidadãos pela melhoria ecológica.",
  },

  // =========================================================================
  // 12. IRLANDA (IE)
  // =========================================================================
  {
    pais: "Irlanda",
    tipo: "humanos",
    citacao: "Article 40.1",
    titulo: "Equality before the law",
    texto:
      "All citizens shall, as human persons, be held equal before the law.\n" +
      "This shall not be held to mean that the State shall not in its enactments have due regard to differences of capacity, physical and moral, and of social function.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Ireland_2019",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao:
      "Todos os cidadãos devem, enquanto pessoas humanas, ser considerados iguais perante a lei. Isso não impede o Estado de levar em devida conta diferenças de capacidade física e moral e de função social nas leis.",
  },
  {
    pais: "Irlanda",
    tipo: "coletivos",
    citacao: "Article 45",
    titulo: "Directive Principles of Social Policy",
    texto:
      "The principles of social policy set forth in this Article are intended for the general guidance of the Oireachtas. The application of those principles in the making of laws shall be the care of the Oireachtas exclusively, and shall not be cognisable by any Court under any of the provisions of this Constitution.\n" +
      "1. The State shall strive to promote the welfare of the whole people by securing and protecting as effectively as it may a social order in which justice and charity shall inform all the institutions of the national life.\n" +
      "2. The State shall, in particular, direct its policy towards securing:\n" +
      "i. That the citizens (all of whom, men and women equally, have the right to an adequate means of livelihood) may through their occupations find the means of making reasonable provision for their domestic needs.\n" +
      "ii. That the ownership and control of the material resources of the community may be so distributed amongst private individuals and the various classes as best to subserve the common good.\n" +
      "iii. That especially the operation of free competition shall not be allowed so to develop as to result in the concentration of the ownership or control of essential commodities in a few individuals to the common detriment.\n" +
      "iv. That in what pertains to the control of credit the constant and predominant aim shall be the welfare of the people as a whole.\n" +
      "v. That there may be established on the land in economic security as many families as in the circumstances shall be practicable.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Ireland_2019",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao:
      "Princípios de política social que orientam o Parlamento para promoção da justiça social e do bem comum, exigindo que a distribuição dos recursos materiais comunitários sirva ao interesse coletivo e coibindo a concentração predatória da propriedade e de bens essenciais.",
  },
];

/**
 * Retorna os dispositivos constitucionais pertencentes a um determinado país.
 */
export function dispositivosEuropaPorPais(pais: string): Dispositivo[] {
  const normalizado = pais.trim().toLowerCase();
  return DISPOSITIVOS_EUROPA.filter((d) => d.pais.toLowerCase() === normalizado);
}

/**
 * Retorna os dispositivos constitucionais catalogados por tipo/tema de direito.
 */
export function dispositivosEuropaPorTipo(tipo: TipoDireito): Dispositivo[] {
  return DISPOSITIVOS_EUROPA.filter((d) => d.tipo === tipo);
}

const PAISES_COM_DISPOSITIVO = new Set(DISPOSITIVOS_EUROPA.map((d) => d.pais));

/**
 * Retorna todos os dispositivos e lacunas catalogados para os 44 países da Europa.
 */
export function getDispositivosEuropa(): readonly Dispositivo[] {
  const lista: Dispositivo[] = [...DISPOSITIVOS_EUROPA];

  for (const pais of PAISES_EUROPA) {
    if (!PAISES_COM_DISPOSITIVO.has(pais.nome)) {
      lista.push({
        pais: pais.nome,
        tipo: "humanos",
        citacao: "em_coleta",
        titulo: "Levantamento constitucional em andamento",
        texto: `O mapeamento detalhado dos dispositivos constitucionais de ${pais.nome} está registrado como lacuna para posterior auditoria documental.`,
        fonte: "Constitute Project / Diário Oficial",
        url: "https://www.constituteproject.org/",
        dataAcesso: "2026-10-30",
        em_coleta: true,
        lacuna: `Dispositivos constitucionais de ${pais.nome} em fase de ingestão primária.`,
      });
    }
  }

  return lista;
}
