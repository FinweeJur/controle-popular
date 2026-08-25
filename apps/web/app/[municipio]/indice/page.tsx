import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obterCidadePorSlug, temFonte, type Cidade } from "@/lib/db/queries/municipios";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";

/**
 * Hub de indice de uma cidade: `/betim/indice`, `/bh/indice`, etc.
 *
 * Padrao wiki para o eixo Cidades. Lista os topicos disponiveis na cidade,
 * filtrando por `temFonte` para nao linkar paginas que nao existem. Cada
 * card leva a uma pagina interna e sugere, pela descricao, o que se encontra
 * la.
 */

interface Grupo {
  id: string;
  titulo: string;
  topicos: Topico[];
}

function incluir(condicao: boolean, topico: Topico): Topico | null {
  return condicao ? topico : null;
}

function topicosDaCidade(cidade: Cidade): Grupo[] {
  const grupos: Grupo[] = [
    {
      id: "prefeitura",
      titulo: "Prefeitura",
      topicos: [
        {
          href: "/prefeitura",
          titulo: "Visao geral",
          descricao: "Contratos, despesas e panorama financeiro da Prefeitura.",
        },
        {
          href: "/prefeitura/contratos",
          titulo: "Contratos",
          descricao: "Contratos municipais com alertas de risco e valor.",
        },
        {
          href: "/prefeitura/fornecedores",
          titulo: "Fornecedores",
          descricao: "Quem vende para a Prefeitura e em quais licitacoes.",
        },
        {
          href: "/prefeitura/licitacoes",
          titulo: "Licitacoes",
          descricao: "Processos de compra da Prefeitura por modalidade.",
        },
        {
          href: "/prefeitura/despesas",
          titulo: "Despesas",
          descricao: "Empenhos, liquidacoes e pagamentos.",
        },
        {
          href: "/prefeitura/servidores",
          titulo: "Servidores",
          descricao: "Folha de pessoal, cargos e remuneracao.",
        },
        {
          href: "/prefeitura/obras",
          titulo: "Obras",
          descricao: "Obras publicas em andamento e concluidas.",
        },
        incluir(temFonte(cidade, "cultura"), {
          href: "/prefeitura/cultura",
          titulo: "Cultura",
          descricao: "Investimentos e projetos culturais.",
        }),
      ].filter((t): t is Topico => t !== null),
    },
    {
      id: "camara",
      titulo: "Camara Municipal",
      topicos: [
        {
          href: "/camara",
          titulo: "Vereadores",
          descricao: "Lista de vereadores, presencas e atuacao.",
        },
        incluir(temFonte(cidade, "camara_proposicoes"), {
          href: "/camara/proposicoes",
          titulo: "Proposicoes",
          descricao: "Projetos de lei, requerimentos e indicacoes.",
        }),
        {
          href: "/camara/comissoes",
          titulo: "Comissoes",
          descricao: "Composicao e pautas das comissoes.",
        },
        {
          href: "/camara/legislacao",
          titulo: "Legislacao",
          descricao: "Leis, decretos e normas municipais.",
        },
        {
          href: "/legislacao/alertas",
          titulo: "Legislacao · Alertas",
          descricao: "Normas sinalizadas por possivel violacao de direitos.",
        },
        {
          href: "/legislacao/bons-exemplos",
          titulo: "Legislacao · Bons exemplos",
          descricao: "Normas que ampliam direitos ou transparencia.",
        },
      ].filter((t): t is Topico => t !== null),
    },
    {
      id: "servicos",
      titulo: "Servicos e cidade",
      topicos: [
        { href: "/servicos", titulo: "Servicos", descricao: "Telefones uteis e canais da cidade." },
        { href: "/saude", titulo: "Saude", descricao: "Saude publica municipal." },
        { href: "/educacao", titulo: "Educacao", descricao: "Escolas, matriculas e investimentos." },
        { href: "/economia", titulo: "Economia", descricao: "Dados economicos do municipio." },
        { href: "/meio-ambiente", titulo: "Meio ambiente", descricao: "Autuacoes, barragens e licenciamento." },
        { href: "/clima", titulo: "Clima", descricao: "Riscos climaticos e alertas." },
        { href: "/coleta-lixo", titulo: "Coleta de lixo", descricao: "Dias e rotas de coleta." },
        { href: "/plantao-farmacias", titulo: "Plantao de farmacias", descricao: "Farmacias de plantao." },
        { href: "/postos-combustivel", titulo: "Postos de combustivel", descricao: "Precos e postos monitorados." },
        { href: "/seguranca", titulo: "Seguranca", descricao: "Dados de seguranca publica." },
      ],
    },
    {
      id: "territorio",
      titulo: "Territorio",
      topicos: [
        incluir(temFonte(cidade, "terras"), {
          href: "/terras",
          titulo: "Terras",
          descricao: "Cadastro, CAR e ocupacao do territorio.",
        }),
        incluir(temFonte(cidade, "terras"), {
          href: "/terras/cruzamentos",
          titulo: "Cruzamentos territoriais",
          descricao: "Sobreposicao de camadas geograficas.",
        }),
        {
          href: "/mineracao",
          titulo: "Mineracao",
          descricao: "Mineradoras, minerios e impactos.",
        },
        incluir(temFonte(cidade, "citrolandia"), {
          href: "/citrolandia",
          titulo: "Citrolandia",
          descricao: "Dados especificos do bairro Citrolandia.",
        }),
      ].filter((t): t is Topico => t !== null),
    },
    {
      id: "transparencia",
      titulo: "Transparencia e participacao",
      topicos: [
        { href: "/painel-do-cidadao", titulo: "Painel do cidadao", descricao: "Indicadores de transparencia." },
        { href: "/nota-transparencia", titulo: "Nota de transparencia", descricao: "Avaliacao do acesso a informacao." },
        { href: "/dados", titulo: "Dados abertos", descricao: "Conjuntos de dados disponiveis." },
        { href: "/noticias", titulo: "Noticias", descricao: "Radar de noticias sobre a cidade." },
        { href: "/assistente", titulo: "Assistente", descricao: "Pergunte aos dados da cidade." },
        { href: "/metodologia", titulo: "Metodologia", descricao: "Como os dados sao coletados e apresentados." },
        { href: "/sobre", titulo: "Sobre", descricao: "O que e o Controle Popular." },
      ],
    },
  ];

  return grupos.filter((g) => g.topicos.length > 0);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipio: string }>;
}): Promise<Metadata> {
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return {};
  return {
    title: `Indice — ${cidade.nome}-${cidade.uf}`,
    description: `Navegue por todos os topicos de ${cidade.nome}-${cidade.uf} no Controle Popular.`,
  };
}

export default async function IndiceDaCidade({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) notFound();

  const grupos = topicosDaCidade(cidade);
  const itensIndice = grupos.map((g) => ({ id: g.id, titulo: g.titulo }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Indice — {cidade.nome}</h1>
        <p className="max-w-2xl text-text-soft">
          Navegue por todos os topicos disponiveis sobre {cidade.nome}-{cidade.uf}.
        </p>
        <p className="text-[.95em]">
          <a href="/indice" className="font-medium text-primary hover:underline">
            Ver indice geral do portal →
          </a>
        </p>
      </header>

      <IndiceWiki itens={itensIndice} />

      {grupos.map((grupo) => (
        <section key={grupo.id} id={grupo.id} className="mt-10 scroll-mt-20">
          <h2 className="font-display text-xl font-semibold">{grupo.titulo}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grupo.topicos.map((topico) => (
              <CartaoTopico key={topico.href} topico={topico} />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-12 border-t border-border pt-6">
        <h2 className="font-display text-lg font-semibold">Outras frentes</h2>
        <p className="mt-2 text-text-soft">
          Alem desta cidade, o Controle Popular acompanha o Congresso Nacional, o Judiciario,
          o meio ambiente de Minas, a reparacao de Brumadinho e a funcao social da terra.
        </p>
        <p className="mt-3">
          <a href="/indice" className="font-medium text-primary hover:underline">
            Ver indice geral →
          </a>
        </p>
      </section>
    </div>
  );
}
