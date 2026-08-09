import { paramsDasCidades } from "@/lib/betim/staticParams";
import { Suspense } from "react";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import { getObras } from "@/lib/betim/obras";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import ListaObras, { ListaObrasCompleta } from "./ListaObras";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
// Filtro é do cliente (`useSearchParams()` no componente de lista). Sem
// `force-static`, `output: export` trata a rota como dinâmica e aborta com
// "missing generateStaticParams()" — mensagem que não descreve a causa.
export const dynamic = "force-static";

export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Obras públicas — Prefeitura de ${c.nome} — ${nomePortal(c)}`,
  (c) => `Obras públicas da Prefeitura de ${c.nome}: objeto, situação, valor e percentual de execução.`
);

interface ObrasPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function ObrasPage({ params }: ObrasPageProps) {
  const cidade = await cidadeDaRota(params);
  // SEM o filtro de situação: ele agora é do cliente (ver `ListaObras`).
  // Passar `?situacao=` para o `getObras` exigiria ler `searchParams` aqui, e é
  // exatamente isso que `output: 'export'` proíbe.
  const { obras, situacoesDisponiveis, total, valorTotal, comValor, ok } = await getObras(
    cidade.id_municipio
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Obras</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Obras públicas
      </h1>
      {/* O QUE A PAGINA COBRE SAI DO DADO, nao de um texto fixo. As 595
          obras de Belo Horizonte estao TODAS como "Concluido" — a SUDECAP so
          publica obra terminada —, enquanto Betim traz INICIADA, EM
          LICITACAO, PARALISADA. Uma pagina chamada "Obras publicas" que
          mostra so concluidas, sem dizer, sugere que a cidade nao tem obra em
          andamento. E tambem nao adianta prometer "valor" onde a fonte nao
          publica valor. */}
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Obras da Prefeitura de {cidade.nome} — objeto, situação
        {comValor > 0 && ", valor"} e quanto já foi executado.
        {situacoesDisponiveis.length === 1 && (
          <>
            {" "}
            <strong className="text-text">
              A fonte publica apenas obras com situação
              &quot;{situacoesDisponiveis[0]}&quot;
            </strong>
            , então esta lista não mostra o que está em andamento.
          </>
        )}
      </p>

      {!ok ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
          Nenhuma obra encontrada no momento.
        </div>
      ) : (
        <>
          <div className="mt-6 mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DataCard
              title="Obras cadastradas"
              source={{ label: `Prefeitura de ${cidade.nome}` }}
            >
              <p className="font-tabular text-2xl font-bold text-text">{formatNumberBR(total)}</p>
            </DataCard>
            {/* R$ 0,00 e uma AFIRMACAO — diz que as obras nao custaram nada.
                A SUDECAP publica situacao e percentual executado das 595
                obras de BH mas NAO publica valor, e somar nulos dava
                exatamente essa mentira. Quando nenhuma obra tem valor, o card
                diz que a fonte nao informa; quando so parte tem, diz sobre
                quantas o total fala. */}
            <DataCard title="Valor total das obras">
              {comValor === 0 ? (
                <>
                  <p className="text-lg font-semibold text-text-soft">não informado</p>
                  <p className="mt-1 text-xs text-text-soft">
                    A fonte de {cidade.nome} publica a situação e o andamento das
                    obras, mas não o valor.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-tabular text-2xl font-bold text-text">
                    {formatCurrencyBRL(valorTotal)}
                  </p>
                  {comValor < total && (
                    <p className="mt-1 text-xs text-text-soft">
                      Soma de {formatNumberBR(comValor)} das {formatNumberBR(total)} obras
                      — as demais não têm valor publicado.
                    </p>
                  )}
                </>
              )}
            </DataCard>
          </div>

          {/* O fallback é o formulário sem filtro e a lista COMPLETA, não um
              esqueleto: é o que o servidor tem para mostrar antes de o
              navegador ler a query, e é também exatamente o conteúdo certo
              para quem chega sem filtro. */}
          <Suspense
            fallback={
              <ListaObrasCompleta obras={obras} situacoesDisponiveis={situacoesDisponiveis} />
            }
          >
            <ListaObras obras={obras} situacoesDisponiveis={situacoesDisponiveis} />
          </Suspense>

          <p className="mt-6 text-xs text-text-soft">
            Fonte: portal de transparência da Prefeitura de {cidade.nome}.
            {comValor > 0 && " O valor é o valor total previsto da obra;"}{" "}
            &quot;% executado&quot; é o andamento informado pela própria
            Prefeitura.
          </p>
        </>
      )}
    </div>
  );
}
