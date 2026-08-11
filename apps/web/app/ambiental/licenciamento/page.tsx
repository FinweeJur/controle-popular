import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import { formatNumberBR } from "@/lib/betim/format";
import {
  contarLicenciamento,
  listarMunicipiosComLicenciamento,
} from "@/lib/db/queries/ambiental-licenciamento";
import BuscaMunicipioLicenciamento from "./BuscaMunicipioLicenciamento";

export const metadata: Metadata = {
  title: "Licenciamento ambiental — Controle Popular · Ambiental",
  description:
    "Todo empreendimento com licença ambiental deferida em Minas Gerais, por município, setor, modalidade e classe — do censo público da Semad (IDE-Sisema).",
};

/**
 * `/ambiental/licenciamento` — a F4 do plano de execução. Método de coleta
 * e as armadilhas medidas (dígito verificador do documento, `link`
 * duplicado na fonte, CPF colado no nome, setor sempre por `cod_atvpri`)
 * estão em `etl/betim/etl/apis/ambiental_licenciamento.py` e na migration
 * `0063_ambiental_licenciamento.sql` — esta página só lê o resultado.
 *
 * Estadual, com `/municipio/[idIbge]`, mesmo padrão estrutural de
 * `/ambiental/copam`: o filtro por setor/modalidade/classe mora DENTRO da
 * página de cada município (o volume por cidade — no máximo ~650 — cabe
 * inteiro no cliente sem o índice fatiado que `congresso/proposicoes`
 * precisa para 5.562 linhas/16 MiB); aqui, o filtro por MUNICÍPIO é a
 * busca abaixo.
 */
const SETOR_ORDEM = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default async function LicenciamentoIndex() {
  const [contagem, municipios] = await Promise.all([
    contarLicenciamento(),
    listarMunicipiosComLicenciamento(),
  ]);

  const porSetor = [...contagem.porSetor].sort(
    (a, b) => SETOR_ORDEM.indexOf(a.letra) - SETOR_ORDEM.indexOf(b.letra)
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-tertiary)" }}
        >
          Ambiental · Estadual · Licenciamento
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Toda licença ambiental deferida em Minas Gerais
        </h1>
        <p className="max-w-2xl text-[1.05em] opacity-85">
          A Semad decide qual empreendimento pode se instalar e sob que condições — mineração,
          indústria, agropecuária, energia, saneamento. Aqui está o censo completo do que já foi
          deferido, por município, setor oficial, modalidade e classe de risco.
        </p>

        {contagem.total === 0 ? (
          <p className="max-w-2xl rounded-lg border border-dashed border-[var(--cp-border)] px-4 py-3 text-[.95em] opacity-80">
            Nenhuma licença coletada ainda. O coletor
            (<code className="font-mono text-[.85em]">etl.apis.ambiental_licenciamento</code>)
            ainda não rodou contra este banco.
          </p>
        ) : (
          <p
            className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]"
            style={{ borderColor: "var(--cp-tertiary)" }}
          >
            <strong className="font-tabular">{formatNumberBR(contagem.total)}</strong> licenças
            deferidas coletadas, em{" "}
            <strong className="font-tabular">{formatNumberBR(municipios.length)}</strong>{" "}
            municípios de Minas Gerais. É o registro do que já foi decidido — não a fila em
            análise, que a fonte publica em outro sistema (o método está no rodapé desta página).
          </p>
        )}
      </header>

      {contagem.total > 0 ? (
        <>
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">Por setor oficial</h2>
            <p className="mt-1 text-sm opacity-75">
              A letra e o rótulo vêm da Deliberação Normativa Copam 217/2017 — o setor de cada
              licença, não uma classificação nossa.
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {porSetor.map((s) => (
                <li
                  key={s.letra}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--cp-border)] px-4 py-2.5 text-sm"
                >
                  <span>
                    <strong>{s.letra}</strong> — {s.rotulo}
                  </span>
                  <span className="shrink-0 font-tabular text-xs opacity-70">
                    {formatNumberBR(s.total)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-lg font-semibold">Por modalidade</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {contagem.porModalidade.map((m) => (
                  <li key={m.modalidade} className="flex items-center justify-between gap-3">
                    <span className="opacity-85">{m.modalidade}</span>
                    <span className="font-tabular text-xs opacity-70">
                      {formatNumberBR(m.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Por classe</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {contagem.porClasse.map((c) => (
                  <li
                    key={c.classe ?? "sem-classe"}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="opacity-85">
                      Classe {c.classe ?? "não informada"}
                    </span>
                    <span className="font-tabular text-xs opacity-70">
                      {formatNumberBR(c.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-xl font-semibold">Ver licenças por município</h2>
            <p className="mt-1 text-sm opacity-75">
              {formatNumberBR(municipios.length)} municípios de Minas Gerais têm pelo menos uma
              licença ambiental deferida coletada. Dentro de cada município dá para filtrar por
              setor, modalidade e classe.
            </p>
            <div className="mt-4">
              <BuscaMunicipioLicenciamento municipios={municipios} />
            </div>
          </section>
        </>
      ) : null}

      <section className="mt-12 border-t border-[var(--cp-border)] pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado, e o que ele não prova</h2>
        <p className="mt-2 max-w-2xl text-[.95em] opacity-80">
          Fonte: IDE-Sisema (Semad), o serviço de mapas públicos do estado — camada de
          empreendimentos licenciados, sem chave e sem login. É o registro do que já foi{" "}
          <strong>deferido</strong>: a fila ainda em análise vive em outro sistema da própria
          Semad, não coletado aqui.
        </p>
        <p className="mt-3 max-w-2xl text-[.95em] opacity-80">
          <strong>Privacidade.</strong> Quando o titular é pessoa física, este portal não publica
          nome, documento nem coordenada — só que existe uma licença daquele setor, naquele
          município. Quando é pessoa jurídica, o CNPJ aparece com a raiz (as 8 primeiras posições)
          e o restante mascarado — a fonte já redige a maioria dos CNPJ dessa forma, e este portal
          aplica a mesma regra aos que a fonte publicou inteiros.
        </p>
        <p className="mt-3 max-w-2xl text-[.95em] opacity-80">
          <strong>Este portal não afirma irregularidade.</strong> É a reprodução da licença como a
          Semad publica.
        </p>
      </section>
    </div>
  );
}
