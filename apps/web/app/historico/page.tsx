import type { Metadata } from "next";
import Link from "next/link";
import LinhaDoTempo from "@/app/components/LinhaDoTempo";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/historico", {
  title: "Linha do Tempo — a história do Controle Popular",
  description:
    " O que o portal Controle Popular foi abrindo mês a mês: frentes, conteúdos e ferramentas para quem fiscaliza o dinheiro público.",
});

/*
 * Marcos do portal. A linha é desenhada pelo componente genérico
 * `LinhaDoTempo`, com a estrela que desce no trilho conforme o scroll.
 *
 * REGRA DA LISTA (reescrita a pedido do dono, 03/11/2026): contam primeiro
 * os CONTEÚDOS e as subfrentes abertas por mês — o que o leitor passou a
 * poder ver. Decisões de infraestrutura entram no máximo em 3 itens,
 * resumidos e explicados para leigos, sem siglas nem termos em inglês.
 * Cada marco carrega a data medida na fonte: `git log` da rota ou
 * `docs/02-estado/ESTADO.md` (entregas datadas). Número sem data não entra
 * (AGENTS). Critério de "frente nova": uma porta do menu que abriu.
 */
const MARCOS = [
  {
    data: "Julho 2026",
    titulo: "O que o Congresso faz, no ar",
    href: "/congresso",
    descricao:
      "As primeiras telas: o que deputadas e senadores propõem, discutem e votam — projetos, comissões, plenário e a verba do gabinete.",
  },
  {
    data: "Julho 2026",
    titulo: "Justiça: tribunais sob observação",
    href: "/judiciario",
    descricao:
      "Vagas, indicações, inspeções e correições — inclusive na Justiça do Trabalho — e o caminho para chegar à Defensoria.",
  },
  {
    data: "Julho 2026",
    titulo: "Meio ambiente: o que foi liberado na sua cidade",
    href: "/ambiental",
    descricao:
      "Licenças ambientais de Minas Gerais, barragens com sua situação de risco, clima e risco de enchente, e as respostas do poder público a pedidos de informação ambiental.",
  },
  {
    data: "Agosto 2026",
    titulo: "Betim, a primeira cidade",
    href: "/betim",
    descricao:
      "O dinheiro da prefeitura de Betim (MG) inteiro na tela: contratos, licitações, orçamento, leis municipais e licenças de obra. No mesmo mês entram Belo Horizonte, Araçuaí, Diamantina, Itinga e São Paulo.",
  },
  {
    data: "Agosto 2026",
    titulo: "Um assistente para achar o caminho",
    href: "/assistente",
    descricao:
      "O portal ganhou um guia que conversa: indica a página certa, responde em linguagem simples o que é cada área e explica de onde vem o dado, apontando a fonte oficial.",
  },
  {
    data: "Agosto 2026",
    titulo: "Brumadinho: a reparação sob vigilância",
    href: "/paraopeba",
    descricao:
      "Acompanhamento dos R$ 37,7 bilhões prometidos após o rompimento da barragem: o que já foi gasto, cidade por cidade da bacia do rio Paraopeba, os auxílios a atingidos e as datas do acordo.",
  },
  {
    data: "Agosto 2026",
    titulo: "Direitos em movimento, cidade por cidade",
    href: "/direitos-em-movimento",
    descricao:
      "Saúde, educação, saneamento, assistência social e serviços: o que cada município tem, quanto recebe e como usa — eixo inteiro dedicado aos direitos do dia a dia.",
  },
  {
    data: "Agosto 2026",
    titulo: "A terra e sua função social",
    href: "/funcaosocialterra",
    descricao:
      "A Constituição diz que a terra precisa cumprir uma função social. Aqui se consulta quem é dono de quê, assentamentos, reforma agrária e conflitos no campo.",
  },
  {
    data: "Agosto 2026",
    titulo: "Empresas sob observação",
    href: "/empresas",
    descricao:
      "Perfil público das grandes mineradoras que operam no Brasil — Vale, Sigma e outras — com contratos, multas ambientais, notícias e processos no país e fora dele.",
  },
  {
    data: "Setembro 2026",
    titulo: "Você pode pedir para avisar",
    href: "/alertas",
    descricao:
      "Central de alertas: escolha uma cidade ou um tema e o portal avisa quando algo novo acontecer — na tela, por e-mail ou por mensagem. Seguir temas virou rotina, não favor do destino.",
  },
  {
    data: "Setembro 2026",
    titulo: "Sala de imprensa e blog",
    href: "/imprensa",
    descricao:
      "Números prontos para jornalistas, movimentos sociais e qualquer cidadão que queira noticiar; blog com relatórios técnicos e novidades do portal em linguagem direta.",
  },
  {
    data: "Setembro 2026",
    titulo: "Quem manda em cada lugar — e se cumpriu o que prometeu",
    href: "/governo",
    descricao:
      "Governos e órgãos das três esferas com organograma, contatos e ouvidorias; e o registro das promessas de campanha: prometeu? cumpriu?",
  },
  {
    data: "Setembro 2026",
    titulo: "Biblioteca dos crimes socioambientais",
    href: "/biblioteca",
    descricao:
      "944 documentos das duas maiores tragédias mineiras — Mariana (2015) e Brumadinho (2019) — reunidos e pesquisáveis: laudos e decisões do Ministério Público, da Defensoria e das assessorias técnicas.",
  },
  {
    data: "Setembro 2026",
    titulo: "O dinheiro público, aqui e lá fora",
    href: "/estado-e-economia",
    descricao:
      "Painel nacional de indicadores, contas do país, e as maiores empresas e fundos dos Estados Unidos que operam no Brasil — com dados do mercado de capitais e do banco central.",
  },
  {
    data: "Setembro 2026",
    titulo: "Segurança: as vítimas, município por município",
    href: "/direitos-em-movimento/seguranca-publica",
    descricao:
      "572 mil registros de vítimas de crimes em Minas Gerais (2022–2026), recortados por cidade, natureza do fato e sexo — dado oficial que costuma ficar perdido em planilhas.",
  },
  {
    data: "Setembro 2026",
    titulo: "Editais: o que dá para pleitear",
    href: "/editais",
    descricao:
      "Chamamentos públicos abertos em Minas, com prazos, valores e como participar — porque política pública também se disputa no edital.",
  },
  {
    data: "Setembro 2026",
    titulo: "Assembleias: o que fazem os deputados estaduais",
    href: "/assembleias",
    descricao:
      "As 27 assembleias legislativas do país na tela: projetos, votações e a verba que cada deputado usa para exercer o mandato.",
  },
  {
    data: "Setembro 2026",
    titulo: "Laboratório cívico: o portal que estuda com você",
    href: "/laboratorio",
    descricao:
      "Um caderno inteligente: você escolhe documentos e recebe resumos e respostas com citações numeradas — processado no próprio computador, sem enviar nada para empresas de inteligência artificial.",
  },
  {
    data: "Setembro 2026",
    titulo: "O portal vai ao mundo",
    href: "/internacional",
    descricao:
      "Abriram as portas do multilateral (ONU e agências internacionais), dos Estados Unidos, do Canadá, da América Latina e da Europa — inclusive as ações judiciais de atingidos contra as estrangeiras Vale, BHP e TÜV no exterior.",
  },
  {
    data: "Setembro 2026",
    titulo: "Mineração vista do céu",
    href: "/mineracao/cavas",
    descricao:
      "Série histórica de imagens de satélite das cavas de mineração em Minas e um globo 3D do território com terras indígenas, quilombolas, mineração e barragens por cima do mapa.",
  },
  {
    data: "Setembro 2026",
    titulo: "Memória das lutas do povo brasileiro",
    href: "/memoria",
    descricao:
      "Mais de 540 fatos do século 14 aos dias de hoje — revoltas, greves, ocupações, mobilizações indígenas e quilombolas — cada um com sua citação, busca, filtros e um calendário dia a dia.",
  },
  {
    data: "Setembro 2026",
    titulo: "Rádio cívica dentro do portal",
    href: "/radio",
    descricao:
      "44 emissoras de 11 países — públicas, universitárias, comunitárias e do Sul Global — para ouvir em qualquer página do site, com transcrição ao vivo dos programas de fala.",
  },
  {
    data: "Setembro 2026",
    titulo: "Ferramentas de aprender e agir",
    href: "/aprender",
    descricao:
      "Glossário que explica as palavras difíceis do dinheiro público, comparação de cidades lado a lado, modelos prontos de pedido de informação e de defesa de direitos, guia de contatos oficiais e a página que mostra, exporta e apaga os seus dados.",
  },
  {
    data: "Setembro 2026",
    titulo: "Seu Nonô aprende o acervo e responde com fonte",
    href: "/assistente",
    descricao:
      "O assistente ganhou a biblioteca inteira do portal na memória: pergunta-se quanto a cidade recebeu, quantas licenças existem, o que houve com a barragem próxima — ele responde em linguagem simples e cita de onde tirou.",
  },
  {
    data: "Setembro 2026",
    titulo: "Inteligência artificial: onde usamos, onde não",
    href: "/politica-de-ia",
    descricao:
      "Regras publicadas sobre o uso de inteligência artificial no portal: o que a máquina faz, quem revisa, e o que só gente pode decidir.",
  },
  {
    data: "Outubro 2026",
    titulo: "Eleições 2026: o preço do voto",
    href: "/eleicoes/2026/gastos-campanha",
    descricao:
      "Gastos de campanha, publicidade e quanto cada candidato está pagando por voto — o dinheiro das eleições sob lupa antes das urnas.",
  },
  {
    data: "Outubro 2026",
    titulo: "Rio Doce ganha casa própria",
    href: "/riodoce",
    descricao:
      "A maior tragédia minerária do país (Mariana, 2015) virou plataforma com o acordo de reparação de R$ 171 bilhões: execução, processos, decisões e os mapas da bacia atingida.",
  },
  {
    data: "Outubro 2026",
    titulo: "Decisões da Justiça sobre as tragédias",
    href: "/jurisprudencia",
    descricao:
      "Os acórdãos dos tribunais de Minas (Brumadinho) e do Espírito Santo (Mariana) ficaram pesquisáveis: por tema, órgão julgador, ano e número do processo.",
  },
  {
    data: "Outubro 2026",
    titulo: "36 mil multas ambientais em um lugar",
    href: "/ambiental/autuacoes",
    descricao:
      "Os autos de infração do órgão ambiental de Minas (2024–2026) com valor, cidade e situação — R$ 1,9 bilhão em multas lavradas, sem nenhum nome ou documento pessoal publicado.",
  },
  {
    data: "Outubro 2026",
    titulo: "Universidades e direitos pelo mundo",
    href: "/universidades",
    descricao:
      "1.584 registros do mundo universitário — grupos de pesquisa e projetos de extensão com contatos — e as páginas que comparam direitos e políticas públicas entre países.",
  },
  {
    data: "Outubro 2026",
    titulo: "Casa nova para o site e para os dados",
    href: "/status",
    descricao:
      "Mudamos o portal e suas planilhas para máquinas mais firmes, com cópias de segurança diárias. Publicar virou ato manual e revisado: nada sai do laboratório para a rua sem gente conferir.",
  },
  {
    data: "Outubro 2026",
    titulo: "Vigia que conserta os links sozinho",
    href: "/documentacao",
    descricao:
      "Um programa percorre todo dia os endereços das fontes oficiais. Quando um órgão muda uma página de lugar, o portal procura o novo endereço, corrige e registra a correção — link morto não fica morto aqui.",
  },
  {
    data: "Novembro 2026",
    titulo: "Educação ganha uma casa grande",
    descricao:
      "Educação básica, universidades, pesquisa, intercâmbio, concursos públicos e revistas científicas foram reunidos num painel só, com filtros por tema, local e data.",
  },
  {
    data: "Novembro 2026",
    titulo: "A linha do tempo ganhou uma estrela",
    href: "/memoria",
    descricao:
      "Nas linhas do tempo do portal, uma estrela percorre o trilho conforme você rola a página e para em cada fato que está na sua frente — decoração que ajuda o olho, invisível para quem usa leitor de tela.",
  },
];

export default function HistoricoPage() {
  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <span className="text-text">Linha do Tempo</span>
      </nav>

      <header className="space-y-4">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Linha do Tempo
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          O que o Controle Popular foi abrindo mês a mês, desde julho de 2026:
          frentes de fiscalização, conteúdos e ferramentas para quem quer
          entender o dinheiro público. Poucos itens de casa — e explicados
          para qualquer pessoa.
        </p>
      </header>

      <LinhaDoTempo
        itens={MARCOS.map((marco) => ({
          marco: marco.data,
          titulo: marco.titulo,
          texto: marco.descricao,
          href: marco.href,
        }))}
      />
    </main>
  );
}
