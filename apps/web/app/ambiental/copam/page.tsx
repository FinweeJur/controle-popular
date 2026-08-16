import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import {
  contarReunioesCopam,
  listarMunicipiosComItensCopam,
  listarReunioesCopamRecentes,
} from "@/lib/db/queries/copam";
import BuscaMunicipio from "./BuscaMunicipio";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/ambiental/copam", {
  title: "Reuniões do COPAM — Controle Popular · Ambiental",
  description:
    "A pauta de cada reunião do Conselho Estadual de Política Ambiental de Minas Gerais, item a item, com o município que cada processo trata — antes da decisão sair.",
});

/**
 * `/ambiental/copam` — a F3 do plano de execução. Método de coleta e as
 * armadilhas medidas estão em `etl/betim/etl/apis/copam_reunioes.py` e em
 * `docs/ambiental/F0-discovery.md` §14; esta página só lê o resultado.
 *
 * Estadual, sem `[municipio]` — mesmo raciocínio de `/funcaosocialterra`:
 * o COPAM delibera para o estado inteiro, a cidade é um atributo do ITEM
 * de pauta, não da tela.
 */
const SITUACAO_ROTULO: Record<string, string> = {
  concluida: "Decisão publicada",
  aguardando_decisao: "Aguardando decisão",
  agendada: "Agendada",
};

const SITUACAO_COR: Record<string, string> = {
  concluida: "var(--cp-tertiary)",
  aguardando_decisao: "var(--cp-accent)",
  agendada: "var(--cp-primary)",
};

export default async function CopamIndex() {
  const [{ reunioes, itens, itensComMunicipio }, recentes, municipios] = await Promise.all([
    contarReunioesCopam(),
    listarReunioesCopamRecentes(30),
    listarMunicipiosComItensCopam(),
  ]);
  const taxaMunicipio = itens > 0 ? Math.round((itensComMunicipio / itens) * 1000) / 10 : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide" style={{ color: "var(--cp-tertiary)" }}>
          Ambiental · Estadual · COPAM
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          O que o COPAM vai decidir sobre a sua cidade
        </h1>
        <p className="max-w-2xl text-[1.05em] opacity-85">
          O Conselho Estadual de Política Ambiental publica a pauta de cada reunião com
          antecedência — inclusive as que ainda vão acontecer. Aqui está o que essa pauta diz,
          item a item, com o município de cada processo já identificado.
        </p>

        {reunioes === 0 ? (
          <p className="max-w-2xl rounded-lg border border-dashed border-[var(--cp-border)] px-4 py-3 text-[.95em] opacity-80">
            Nenhuma reunião coletada ainda. O coletor
            (<code className="font-mono text-[.85em]">etl.apis.copam_reunioes</code>) ainda não
            rodou contra este banco.
          </p>
        ) : (
          <p className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]" style={{ borderColor: "var(--cp-tertiary)" }}>
            <strong className="font-tabular">{formatNumberBR(reunioes)}</strong> reuniões
            coletadas, com <strong className="font-tabular">{formatNumberBR(itens)}</strong>{" "}
            itens de pauta substantivos —{" "}
            <strong className="font-tabular">{formatNumberBR(itensComMunicipio)}</strong>{" "}
            deles (<strong className="font-tabular">{taxaMunicipio.toFixed(1)}%</strong>) já
            com o município identificado. O método está documentado no rodapé desta página.
          </p>
        )}
      </header>

      {municipios.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Ver a pauta por município</h2>
          <p className="mt-1 text-sm opacity-75">
            {formatNumberBR(municipios.length)} municípios de Minas Gerais têm pelo menos um
            item de pauta do COPAM coletado.
          </p>
          <div className="mt-4">
            <BuscaMunicipio municipios={municipios} />
          </div>
        </section>
      ) : null}

      {recentes.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">Reuniões mais recentes</h2>
          <ul className="mt-4 space-y-3">
            {recentes.map((r) => (
              <li key={r.idFonte}>
                <Link
                  href={`/copam/reuniao/${r.idFonte}`}
                  className="block rounded-lg border border-[var(--cp-border)] p-4 hover:border-[var(--cp-tertiary)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{r.titulo}</p>
                      <p className="mt-1 text-sm opacity-70">
                        {formatDateBR(r.data)}
                        {r.camaraTecnica ? ` · ${r.camaraTecnica}` : ""}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium"
                      style={{ borderColor: SITUACAO_COR[r.situacao] ?? "var(--cp-border)" }}
                    >
                      {SITUACAO_ROTULO[r.situacao] ?? r.situacao}
                    </span>
                  </div>
                  <p className="mt-2 font-tabular text-sm opacity-80">
                    {formatNumberBR(r.qtdItensPauta)}{" "}
                    {r.qtdItensPauta === 1 ? "item de pauta" : "itens de pauta"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12 border-t border-[var(--cp-border)] pt-8">
        <h2 className="font-display text-xl font-semibold">Como o município é identificado</h2>
        <p className="mt-2 max-w-2xl text-[.95em] opacity-80">
          A própria página de detalhe da reunião traz, para a maioria dos anexos, um campo
          estruturado com o nome do município — não é leitura de texto livre. Nas reuniões em
          que esse campo vem vazio, o PDF da pauta consolidada traz o padrão
          &quot;&lt;Município&gt;/MG&quot; perto de cada item, e o município só é aceito quando
          bate com um dos 853 nomes oficiais de Minas Gerais — nunca um palpite. Um item pode
          citar mais de um município (obra ou linha de transmissão que passa por várias
          cidades); todos entram.
        </p>
        <p className="mt-3 max-w-2xl text-[.95em] opacity-80">
          <strong>Isto não é acusação de irregularidade.</strong> É a reprodução da pauta como
          o Copam publica, com link para o PDF oficial de cada reunião.
        </p>
      </section>
    </div>
  );
}
