import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import { getGruposEconomicos } from "@/lib/betim/grupos";
import { formatCNPJ, formatCurrencyBRL, formatDateBR, formatNumberBR } from "@/lib/betim/format";

export const metadata = {
  title: "Grupos econômicos — Controle Popular Betim",
  description:
    "Fornecedores da Prefeitura de Betim que compartilham sócios entre si, detectados a partir do quadro societário da Receita Federal.",
};

export default async function GruposEconomicosPage() {
  const { configured, ok, grupos, valorTotal, valorTotalMunicipio, totalEmpresas } =
    await getGruposEconomicos();

  const temDados = configured && ok && grupos.length > 0;

  // Toda frase de leitura desta página é derivada do dado, nunca escrita à
  // mão — regra do projeto, aprendida quando uma narrativa copiada de outro
  // portal ("as indicações dominam o volume") era simplesmente falsa aqui.
  const percentualDoTotal =
    valorTotalMunicipio > 0 ? (valorTotal / valorTotalMunicipio) * 100 : null;
  const maior = grupos[0] ?? null;
  const fatiaDoMaior =
    maior && valorTotal > 0 ? (maior.valorTotalContratos / valorTotal) * 100 : null;
  const detectadoEm = grupos.find((g) => g.detectadoEm)?.detectadoEm ?? null;
  const qtdMesmaEmpresa = grupos.filter((g) => g.mesmaEmpresa).length;
  const qtdEmpresasDistintas = grupos.length - qtdMesmaEmpresa;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/dados" className="hover:text-primary">
          Betim em Dados
        </Link>{" "}
        · <span className="text-text">Grupos econômicos</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Grupos econômicos
      </h1>
      <p className="mt-2 max-w-3xl text-[1.02em] text-text-soft">
        Empresas diferentes que fornecem para a Prefeitura e{" "}
        <strong className="font-semibold text-text">compartilham sócios entre si</strong>.
        Duas notas fiscais distintas podem estar, na prática, indo para as
        mesmas pessoas — e isso não aparece olhando contrato por contrato.
      </p>

      {!temDados ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-text-soft">
          {configured && ok
            ? "Nenhum grupo econômico detectado entre os fornecedores atuais. Esse é um resultado válido: significa que nenhum par de empresas contratadas divide sócio no quadro societário conhecido."
            : "Dados de grupos econômicos indisponíveis no momento."}
        </div>
      ) : (
        <>
          <div className="mt-8 mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DataCard
              title="Grupos detectados"
              source={{ label: "PNCP + CNPJ (Receita Federal)" }}
            >
              <p className="font-tabular text-2xl font-bold text-text">
                {formatNumberBR(grupos.length)}
              </p>
              <p className="mt-1 text-xs">
                envolvendo {formatNumberBR(totalEmpresas)} CNPJs ·{" "}
                {formatNumberBR(qtdEmpresasDistintas)} ligam empresas distintas,{" "}
                {formatNumberBR(qtdMesmaEmpresa)} são matriz e filial da mesma
              </p>
            </DataCard>
            <DataCard title="Valor contratado pelos grupos">
              <p className="font-tabular text-2xl font-bold text-text">
                {formatCurrencyBRL(valorTotal)}
              </p>
              {percentualDoTotal !== null && (
                <p className="mt-1 text-xs">
                  {percentualDoTotal.toFixed(1).replace(".", ",")}% de todo o valor
                  contratado pela Prefeitura
                </p>
              )}
            </DataCard>
            <DataCard title="Concentração">
              {fatiaDoMaior !== null && maior ? (
                <>
                  <p className="font-tabular text-2xl font-bold text-text">
                    {fatiaDoMaior.toFixed(0)}%
                  </p>
                  <p className="mt-1 text-xs">
                    do valor de todos os grupos está num só: {maior.nomeGrupo}
                  </p>
                </>
              ) : (
                <p className="text-xs">—</p>
              )}
            </DataCard>
          </div>

          <section className="mb-8 rounded-2xl border border-border bg-surface-2 px-6 py-5 text-sm text-text-soft">
            <h2 className="font-display text-base font-semibold text-text">
              Como isto é calculado — e o que NÃO significa
            </h2>
            <p className="mt-2">
              Partimos só das empresas que efetivamente ganharam contrato em
              Betim. Duas delas são ligadas quando aparece o{" "}
              <strong className="font-semibold text-text">mesmo nome de sócio</strong>{" "}
              no quadro societário das duas, segundo os dados públicos de CNPJ
              da Receita Federal. Empresas ligadas em cadeia formam um grupo.
            </p>
            <p className="mt-2">
              <strong className="font-semibold text-text">
                Compartilhar sócio é legal e comum.
              </strong>{" "}
              Grupo familiar, holding e sociedade entre médicos aparecem aqui
              do mesmo jeito que qualquer outro arranjo. Esta página é um mapa
              para conferir, não uma acusação: nada aqui indica irregularidade
              por si só.
            </p>
            <p className="mt-2">
              Parte dos casos é ainda mais simples:{" "}
              <strong className="font-semibold text-text">
                matriz e filial da mesma empresa
              </strong>{" "}
              dividem sócios por definição e caem no mesmo cálculo. Esses estão
              marcados como tal — dos {formatNumberBR(grupos.length)} detectados,{" "}
              {formatNumberBR(qtdMesmaEmpresa)}{" "}
              {qtdMesmaEmpresa === 1 ? "é desse tipo" : "são desse tipo"} e{" "}
              {formatNumberBR(qtdEmpresasDistintas)} ligam empresas de CNPJ raiz
              diferente.
            </p>
            <p className="mt-2">
              Duas limitações que valem saber. O cruzamento é feito por{" "}
              <strong className="font-semibold text-text">nome</strong> de sócio,
              então dois homônimos viram uma ligação falsa — sempre confira os
              CNPJs na fonte antes de concluir qualquer coisa. E só enxergamos
              sócios declarados no cadastro do CNPJ: participação indireta, por
              outra pessoa jurídica ou por procuração, não aparece.
            </p>
            {detectadoEm && (
              <p className="mt-2 text-xs">
                Última detecção: {formatDateBR(detectadoEm)}.
              </p>
            )}
          </section>

          <ol className="flex flex-col gap-5">
            {grupos.map((grupo, i) => (
              <li key={grupo.id}>
                <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border/60 pb-3">
                    <h2 className="font-display text-base font-semibold text-text">
                      <span className="font-tabular mr-2 text-text-soft">
                        {i + 1}.
                      </span>
                      {grupo.nomeGrupo}
                      {grupo.mesmaEmpresa && (
                        <span className="ml-2 rounded-full bg-surface-2 px-2.5 py-1 text-[.85em] font-medium text-text-soft">
                          mesma empresa · matriz e filial
                        </span>
                      )}
                    </h2>
                    <p className="font-tabular text-sm text-text-soft">
                      <strong className="font-semibold text-text">
                        {formatCurrencyBRL(grupo.valorTotalContratos)}
                      </strong>{" "}
                      em {formatNumberBR(grupo.qtdContratos)}{" "}
                      {grupo.qtdContratos === 1 ? "contrato" : "contratos"} ·{" "}
                      {grupo.empresas.length} empresas
                    </p>
                  </header>

                  <div className="grid grid-cols-1 gap-5 pt-4 md:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-[.82em] font-semibold tracking-wide text-text-soft uppercase">
                        Empresas do grupo
                      </h3>
                      <ul className="flex flex-col gap-2.5">
                        {grupo.empresas.map((e) => (
                          <li key={e.cnpj} className="text-sm">
                            <Link
                              href={`/prefeitura/contratos?q=${encodeURIComponent(
                                e.razaoSocial ?? e.cnpj
                              )}`}
                              className="font-medium text-primary hover:text-accent hover:underline"
                            >
                              {e.razaoSocial ?? formatCNPJ(e.cnpj)}
                            </Link>
                            <p className="font-tabular text-xs text-text-soft">
                              {formatCNPJ(e.cnpj)}
                              {e.sedeNoMunicipio === true
                                ? " · sede em Betim"
                                : e.sedeNoMunicipio === false
                                  ? ` · sede fora de Betim${e.ufSede ? ` (${e.ufSede})` : ""}`
                                  : ""}
                            </p>
                            {e.cnaeDescricao && (
                              <p className="text-xs text-text-soft">{e.cnaeDescricao}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-2 text-[.82em] font-semibold tracking-wide text-text-soft uppercase">
                        {grupo.sociosComuns.length === 1
                          ? "Sócio em comum"
                          : `Sócios em comum (${grupo.sociosComuns.length})`}
                      </h3>
                      <ul className="flex flex-wrap gap-1.5">
                        {grupo.sociosComuns.map((s) => (
                          <li
                            key={s}
                            className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                      {grupo.sociosComuns.length === 0 && (
                        <p className="text-sm text-text-soft">—</p>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent bg-accent/10 px-6 py-5">
            <div>
              <strong className="text-[1.05em]">Quer conferir na fonte?</strong>
              <p className="mt-1 text-sm text-text-soft">
                Cada empresa acima leva à lista de contratos dela no portal. Os
                contratos vêm do PNCP e o quadro societário, dos dados públicos
                de CNPJ da Receita Federal.
              </p>
            </div>
            <Link
              href="/prefeitura/contratos"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4.5 py-2.5 text-[.9em] font-semibold text-text"
            >
              Ver todos os contratos
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
