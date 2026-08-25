import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { IndiceWiki, SecaoWiki, LinksRelacionados } from "@/app/components/wiki";

// `output: 'export'` exige a funcao DECLARADA aqui — re-export nao e
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Sobre — ${nomePortal(c)}`,
  (c) => `O que e o ${nomePortal(c)}, de onde vem os dados, quem mantem o projeto e como ele se relaciona (ou nao) com o poder publico.`
);

export default async function SobrePage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);

  const secoes = [
    { id: "o-que-e", titulo: "O que e" },
    { id: "fontes", titulo: "De onde vem os dados" },
    { id: "alertas", titulo: "Alertas e informacoes sensiveis" },
    { id: "faq", titulo: "Perguntas frequentes" },
    { id: "quem-mantem", titulo: "Quem mantem" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Inicio
        </Link>{" "}
        · <span className="text-text">Sobre</span>
      </nav>

      <h1 className="mb-2 font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Sobre o {nomePortal(cidade)}
      </h1>
      <p className="mb-6 max-w-2xl text-[1.02em] text-text-soft">
        O que e, de onde vem os dados, como tratamos sinalizacoes e quem mantem o projeto.
      </p>

      <IndiceWiki itens={secoes} />

      <SecaoWiki id="o-que-e" titulo="O que e">
        <p className="mb-3 text-sm leading-relaxed text-text-soft">
          O {nomePortal(cidade)} e um projeto <strong>independente e nao-governamental</strong>{" "}
          de transparencia publica. Nosso objetivo e reunir, em um so lugar
          e em linguagem simples, dados publicos oficiais sobre a
          administracao municipal de {cidade.nome}-{cidade.uf} — contratos, financas, atuacao
          da Camara, indicadores sociais e servicos uteis ao cidadao.
        </p>
        <p className="text-sm leading-relaxed text-text-soft">
          Nao somos um orgao publico, nao representamos a Prefeitura nem a
          Camara Municipal de {cidade.nome}, e nao recebemos recursos de nenhuma das
          duas instituicoes. Todo o conteudo e produzido a partir de dados
          ja publicados por fontes oficiais — nos apenas organizamos,
          cruzamos e explicamos.
        </p>
      </SecaoWiki>

      <SecaoWiki id="fontes" titulo="De onde vem os dados" href="/dados">
        <p className="mb-3 text-sm leading-relaxed text-text-soft">
          Cada dado exibido no site traz um link &quot;Ver fonte&quot; que
          aponta para a origem oficial. As principais fontes utilizadas sao:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-soft">
          <li>
            <strong>PNCP</strong> (Portal Nacional de Contratacoes Publicas) —
            contratos e licitacoes da Prefeitura de {cidade.nome}.
          </li>
          <li>
            <strong>Base dos Dados</strong> — repositorio publico que reune
            series do IBGE (populacao, PIB), INEP (IDEB, censo escolar),
            SICONFI/Tesouro Nacional (receitas e despesas municipais), RAIS/
            CAGED (emprego formal) e outras bases federais.
          </li>
          <li>
            <strong>Portal da Transparencia do Governo Federal</strong> —
            emendas parlamentares e beneficios sociais.
          </li>
          <li>
            <strong>Site da Camara Municipal de {cidade.nome}</strong> — proposicoes,
            pautas e atas legislativas.
          </li>
          <li>
            <strong>InfoDengue, Open-Meteo e demais APIs publicas</strong> —
            dados de saude e clima.
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-text-soft">
          Enquanto uma fonte de dados ainda nao foi conectada, a secao
          correspondente mostra &quot;em breve&quot; em vez de numeros
          inventados — preferimos um site honesto e incompleto a um site
          com dados ficticios.
        </p>
      </SecaoWiki>

      <SecaoWiki id="alertas" titulo="Alertas e informacoes sensiveis" href="/prefeitura/contratos">
        <p className="text-sm leading-relaxed text-text-soft">
          Quando o site sinaliza um contrato ou fornecedor com
          caracteristicas que podem merecer atencao adicional (por exemplo,
          valor muito acima da media, aditivos elevados ou fornecedor com
          restricoes cadastrais), isso e feito de forma automatica, com base
          em criterios objetivos e documentados — nunca como uma acusacao.
          Qualquer sinalizacao pode estar sujeita a erro de dados de origem
          e deve ser lida como um convite a verificacao, nao como uma
          conclusao.
        </p>
      </SecaoWiki>

      <SecaoWiki id="faq" titulo="Perguntas frequentes">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-text">
              O {nomePortal(cidade)} e um site oficial da Prefeitura ou da Camara?
            </p>
            <p className="text-sm text-text-soft">
              Nao. E um projeto civico independente, mantido fora da
              estrutura do poder publico municipal.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-text">
              Os dados podem estar desatualizados ou incorretos?
            </p>
            <p className="text-sm text-text-soft">
              Podem. Trabalhamos para manter a atualizacao automatica e
              frequente, mas erros de origem ou atrasos de publicacao das
              fontes oficiais podem se refletir aqui. Sempre indicamos a
              fonte para que qualquer dado possa ser conferido.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-text">
              Como o projeto se sustenta financeiramente?
            </p>
            <p className="text-sm text-text-soft">
              Por meio de anuncios locais de empresas de {cidade.nome}, exibidos de
              forma claramente identificada e sem influenciar o conteudo
              informativo do site.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-text">
              Encontrei um erro ou tenho uma sugestao. Como entro em contato?
            </p>
            <p className="text-sm text-text-soft">
              Envie uma mensagem para o e-mail de contato do projeto
              informado no rodape do site.
            </p>
          </div>
        </div>
      </SecaoWiki>

      <SecaoWiki id="quem-mantem" titulo="Quem mantem" href="/privacidade">
        <p className="text-sm leading-relaxed text-text-soft">
          O {nomePortal(cidade)} e desenvolvido e mantido de forma independente, sem
          fins politico-partidarios. Veja tambem nossa{" "}
          <Link
            href="/privacidade"
            className="font-medium text-accent hover:underline"
          >
            politica de privacidade
          </Link>
          .
        </p>
      </SecaoWiki>

      <LinksRelacionados
        links={[
          {
            href: "/metodologia",
            titulo: "Metodologia",
            descricao: "Como os dados sao coletados, tratados e apresentados.",
          },
          {
            href: "/prefeitura",
            titulo: "Prefeitura",
            descricao: "Visao geral dos dados da administracao municipal.",
          },
          {
            href: "/indice",
            titulo: "Indice do portal",
            descricao: "Navegue por todas as frentes e cidades do Controle Popular.",
          },
        ]}
      />
    </div>
  );
}
