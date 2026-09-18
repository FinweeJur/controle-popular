import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obterCidadePorSlug, temFonte, type Cidade } from "@/lib/db/queries/municipios";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";

/**
 * Hub de índice de uma cidade: `/betim/índice`, `/bh/índice`, etc.
 *
 * Padrao wiki para o eixo Cidades. Lista os tópicos disponiveis na cidade,
 * filtrando por `temFonte` para nao linkar paginas que nao existem. Cada
 * card leva a uma pagina interna e sugere, pela descricao, o que se encontra
 * la.
 */

interface Grupo {
  id: string;
  titulo: string;
  tópicos: Topico[];
}

function incluir(condicao: boolean, topico: Topico): Topico | null {
  return condicao ? topico : null;
}

function tópicosDaCidade(cidade: Cidade): Grupo[] {
  const grupos: Grupo[] = [
    {
      id: "prefeitura",
      titulo: "Prefeitura",
      tópicos: [
        {
          href: "/prefeitura",
          titulo: "Visão geral",
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
          descricao: "Quem vende para a Prefeitura e em quais licitações.",
        },
        {
          href: "/prefeitura/licitações",
          titulo: "Licitacoes",
          descricao: "Processos de compra da Prefeitura por modalidade.",
        },
        {
          href: "/prefeitura/despesas",
          titulo: "Despesas",
          descricao: "Empenhos, liquidações e pagamentos.",
        },
        {
          href: "/prefeitura/servidores",
          titulo: "Servidores",
          descricao: "Folha de pessoal, cargos e remuneração.",
        },
        {
          href: "/prefeitura/obras",
          titulo: "Obras",
          descricao: "Obras públicas em andamento e concluídas.",
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
      titulo: "Câmara Municipal",
      tópicos: [
        {
          href: "/camara",
          titulo: "Vereadores",
          descricao: "Lista de vereadores, presencas e atuação.",
        },
        incluir(temFonte(cidade, "camara_proposições"), {
          href: "/camara/proposições",
          titulo: "Proposições",
          descricao: "Projetos de lei, requerimentos e indicações.",
        }),
        {
          href: "/camara/comissões",
          titulo: "Comissões",
          descricao: "Composicao e pautas das comissões.",
        },
        {
          href: "/camara/legislação",
          titulo: "Legislação",
          descricao: "Leis, decretos e normas municipais.",
        },
        {
          href: "/legislação/alertas",
          titulo: "Legislação · Alertas",
          descricao: "Normas sinalizadas por possível violacao de direitos.",
        },
        {
          href: "/legislação/bons-exemplos",
          titulo: "Legislação · Bons exemplos",
          descricao: "Normas que ampliam direitos ou transparência.",
        },
      ].filter((t): t is Topico => t !== null),
    },
    {
      id: "servicos",
      titulo: "Serviços e cidade",
      tópicos: [
        { href: "/servicos", titulo: "Servicos", descricao: "Telefones úteis e canais da cidade." },
        { href: "/saude", titulo: "Saúde", descricao: "Saúde pública municipal." },
        { href: "/educacao", titulo: "Educacao", descricao: "Escolas, matrículas e investimentos." },
        { href: "/economia", titulo: "Economia", descricao: "Dados econômicos do município." },
        { href: "/meio-ambiente", titulo: "Meio ambiente", descricao: "Autuacoes, barragens e licenciamento." },
        { href: "/clima", titulo: "Clima", descricao: "Riscos climáticos e alertas." },
        { href: "/coleta-lixo", titulo: "Coleta de lixo", descricao: "Dias e rotas de coleta." },
        { href: "/plantao-farmacias", titulo: "Plantão de farmácias", descricao: "Farmácias de plantão." },
        { href: "/postos-combustível", titulo: "Postos de combustível", descricao: "Preços e postos monitorados." },
        { href: "/seguranca", titulo: "Segurança", descricao: "Dados de segurança pública." },
      ],
    },
    {
      id: "territorio",
      titulo: "Territorio",
      tópicos: [
        incluir(temFonte(cidade, "terras"), {
          href: "/terras",
          titulo: "Terras",
          descricao: "Cadastro, CAR e ocupação do território.",
        }),
        incluir(temFonte(cidade, "terras"), {
          href: "/terras/cruzamentos",
          titulo: "Cruzamentos territoriais",
          descricao: "Sobreposição de camadas geográficas.",
        }),
        {
          href: "/mineracao",
          titulo: "Mineração",
          descricao: "Mineradoras, minérios e impactos.",
        },
        incluir(temFonte(cidade, "citrolandia"), {
          href: "/citrolandia",
          titulo: "Citrolandia",
          descricao: "Dados específicos do bairro Citrolandia.",
        }),
      ].filter((t): t is Topico => t !== null),
    },
    {
      id: "transparência",
      titulo: "Transparência e participação",
      tópicos: [
        { href: "/painel-do-cidadao", titulo: "Painel do cidadão", descricao: "Indicadores de transparência." },
        { href: "/nota-transparência", titulo: "Nota de transparência", descricao: "Avaliação do acesso à informação." },
        { href: "/dados", titulo: "Dados abertos", descricao: "Conjuntos de dados disponíveis." },
        { href: "/noticias", titulo: "Noticias", descricao: "Radar de notícias sobre a cidade." },
        { href: "/assistente", titulo: "Assistente", descricao: "Pergunte aos dados da cidade." },
        { href: "/metodologia", titulo: "Metodologia", descricao: "Como os dados são coletados e apresentados." },
        { href: "/sobre", titulo: "Sobre", descricao: "O que é o Controle Popular." },
      ],
    },
  ];

  return grupos.filter((g) => g.tópicos.length > 0);
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
    title: `Índice — ${cidade.nome}-${cidade.uf}`,
    description: `Navegue por todos os tópicos de ${cidade.nome}-${cidade.uf} no Controle Popular.`,
  };
}

export default async function ÍndiceDaCidade({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) notFound();

  const grupos = tópicosDaCidade(cidade);
  const itensIndice = grupos.map((g) => ({ id: g.id, titulo: g.titulo }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Índice — {cidade.nome}</h1>
        <p className="max-w-2xl text-text-soft">
          Navegue por todos os tópicos disponiveis sobre {cidade.nome}-{cidade.uf}.
        </p>
        <p className="text-[.95em]">
          <a href="/índice" className="font-medium text-primary hover:underline">
            Ver índice geral do portal →
          </a>
        </p>
      </header>

      <IndiceWiki itens={itensIndice} />

      {grupos.map((grupo) => (
        <section key={grupo.id} id={grupo.id} className="mt-10 scroll-mt-20">
          <h2 className="font-display text-xl font-semibold">{grupo.titulo}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grupo.tópicos.map((topico) => (
              <CartaoTopico key={topico.href} topico={topico} />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-12 border-t border-border pt-6">
        <h2 className="font-display text-lg font-semibold">Outras frentes</h2>
        <p className="mt-2 text-text-soft">
          Além desta cidade, o Controle Popular acompanha o Congresso Nacional, o Judiciário,
          o meio ambiente de Minas, a reparação de Brumadinho e a função social da terra.
        </p>
        <p className="mt-3">
          <a href="/índice" className="font-medium text-primary hover:underline">
            Ver índice geral →
          </a>
        </p>
      </section>
    </div>
  );
}
