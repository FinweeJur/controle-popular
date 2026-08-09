import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Sobre — ${nomePortal(c)}`,
  (c) => `O que é o ${nomePortal(c)}, de onde vêm os dados, quem mantém o projeto e como ele se relaciona (ou não) com o poder público.`
);

export default async function SobrePage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <h1 className="mb-6 text-2xl font-display font-bold text-text">
        Sobre o {nomePortal(cidade)}
      </h1>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-display font-semibold text-text">
          O que é
        </h2>
        <p className="mb-3 text-sm leading-relaxed text-text-soft">
          O {nomePortal(cidade)} é um projeto <strong>independente e não-governamental</strong>{" "}
          de transparência pública. Nosso objetivo é reunir, em um só lugar
          e em linguagem simples, dados públicos oficiais sobre a
          administração municipal de {cidade.nome}-{cidade.uf} — contratos, finanças, atuação
          da Câmara, indicadores sociais e serviços úteis ao cidadão.
        </p>
        <p className="text-sm leading-relaxed text-text-soft">
          Não somos um órgão público, não representamos a Prefeitura nem a
          Câmara Municipal de {cidade.nome}, e não recebemos recursos de nenhuma das
          duas instituições. Todo o conteúdo é produzido a partir de dados
          já publicados por fontes oficiais — nós apenas organizamos,
          cruzamos e explicamos.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-display font-semibold text-text">
          De onde vêm os dados
        </h2>
        <p className="mb-3 text-sm leading-relaxed text-text-soft">
          Cada dado exibido no site traz um link &quot;Ver fonte&quot; que
          aponta para a origem oficial. As principais fontes utilizadas são:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-soft">
          <li>
            <strong>PNCP</strong> (Portal Nacional de Contratações Públicas) —
            contratos e licitações da Prefeitura de {cidade.nome}.
          </li>
          <li>
            <strong>Base dos Dados</strong> — repositório público que reúne
            séries do IBGE (população, PIB), INEP (IDEB, censo escolar),
            SICONFI/Tesouro Nacional (receitas e despesas municipais), RAIS/
            CAGED (emprego formal) e outras bases federais.
          </li>
          <li>
            <strong>Portal da Transparência do Governo Federal</strong> —
            emendas parlamentares e benefícios sociais.
          </li>
          <li>
            <strong>Site da Câmara Municipal de {cidade.nome}</strong> — proposições,
            pautas e atas legislativas.
          </li>
          <li>
            <strong>InfoDengue, Open-Meteo e demais APIs públicas</strong> —
            dados de saúde e clima.
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-text-soft">
          Enquanto uma fonte de dados ainda não foi conectada, a seção
          correspondente mostra &quot;em breve&quot; em vez de números
          inventados — preferimos um site honesto e incompleto a um site
          com dados fictícios.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-display font-semibold text-text">
          Como tratamos alertas e informações sensíveis
        </h2>
        <p className="text-sm leading-relaxed text-text-soft">
          Quando o site sinaliza um contrato ou fornecedor com
          características que podem merecer atenção adicional (por exemplo,
          valor muito acima da média, aditivos elevados ou fornecedor com
          restrições cadastrais), isso é feito de forma automática, com base
          em critérios objetivos e documentados — nunca como uma acusação.
          Qualquer sinalização pode estar sujeita a erro de dados de origem
          e deve ser lida como um convite à verificação, não como uma
          conclusão.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-display font-semibold text-text">
          Perguntas frequentes
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-text">
              O {nomePortal(cidade)} é um site oficial da Prefeitura ou da Câmara?
            </p>
            <p className="text-sm text-text-soft">
              Não. É um projeto cívico independente, mantido fora da
              estrutura do poder público municipal.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-text">
              Os dados podem estar desatualizados ou incorretos?
            </p>
            <p className="text-sm text-text-soft">
              Podem. Trabalhamos para manter a atualização automática e
              frequente, mas erros de origem ou atrasos de publicação das
              fontes oficiais podem se refletir aqui. Sempre indicamos a
              fonte para que qualquer dado possa ser conferido.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-text">
              Como o projeto se sustenta financeiramente?
            </p>
            <p className="text-sm text-text-soft">
              Por meio de anúncios locais de empresas de {cidade.nome}, exibidos de
              forma claramente identificada e sem influenciar o conteúdo
              informativo do site.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-text">
              Encontrei um erro ou tenho uma sugestão. Como entro em contato?
            </p>
            <p className="text-sm text-text-soft">
              Envie uma mensagem para o e-mail de contato do projeto
              informado no rodapé do site (a ser publicado no lançamento).
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-display font-semibold text-text">
          Quem mantém
        </h2>
        <p className="text-sm leading-relaxed text-text-soft">
          O {nomePortal(cidade)} é desenvolvido e mantido de forma independente, sem
          fins político-partidários. Veja também nossa{" "}
          <Link
            href="/privacidade"
            className="font-medium text-accent hover:underline"
          >
            política de privacidade
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
