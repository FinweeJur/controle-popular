import type { ReactElement } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  LICENCAS_COBERTURA,
  REGISTROS_LICENCAS,
  type CoberturaLicencas,
  type LinhaLicencaUnificada,
} from "@/lib/ambiental/licencas-unificada";
import TabelaLicencas from "./TabelaLicencas";

export const metadata: Metadata = {
  title: "Licenças e outorgas ambientais — Brasil e estados | Controle Popular",
  description:
    "Licenças do IBAMA, outorgas de água da ANA e de MG (IGAM), licenças e autos de infração da SEMA-MT. Filtro por estado, ano, órgão, empresa e período, com CSV.",
};

const LABEL_CATEGORIA: Record<string, string> = {
  licenca: "Licença",
  outorga: "Outorga",
  auto_infracao: "Auto de infração",
  embargo: "Embargo",
};

function Cartao({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe: string }) {
  return (
    <div className="rounded-xl border border-[var(--cp-border)] p-4">
      <p className="text-xs uppercase tracking-wider opacity-70">{titulo}</p>
      <p className="font-tabular mt-1 text-2xl font-bold">{valor}</p>
      <p className="mt-1 text-xs opacity-80">{detalhe}</p>
    </div>
  );
}

/** Gráfico por ano: barras SVG inline, sem biblioteca (teto do Worker). */
function GraficoAno({ porAno }: { porAno: Record<string, number> }): ReactElement {
  const anos = Object.entries(porAno)
    .filter(([ano, n]) => /^\d{4}$/.test(ano) && n > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  const max = Math.max(1, ...anos.map(([, n]) => n));
  const largura = Math.min(960, Math.max(320, anos.length * 34));
  return (
    <figure className="rounded-xl border border-[var(--cp-border)] p-4">
      <figcaption className="mb-2 text-sm font-semibold">
        Licenças e outorgas por ano de início
        <span className="ml-2 text-xs font-normal opacity-70">
          cadastro por origem — órgãos não se somam
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${largura} 120`} role="img" aria-label="Quantidade de registros por ano, em barras" className="w-full">
        {anos.map(([ano, n], i) => {
          const h = (n / max) * 90;
          return (
            <g key={ano} transform={`translate(${i * 34}, 0)`}>
              <rect x={4} y={100 - h} width={24} height={h} fill="var(--cp-primary)" opacity={0.85}>
                <title>{`${ano}: ${n}`}</title>
              </rect>
              <text x={16} y={112} textAnchor="middle" fontSize="9" opacity={0.7}>
                {ano.slice(2)}
              </text>
              <text x={16} y={96 - h} textAnchor="middle" fontSize="8" opacity={0.8}>
                {n}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-xs opacity-70">
        Barras descritas: {anos.map(([ano, n]) => `${ano} ${n}`).join(" · ") || "sem datas"}
      </p>
    </figure>
  );
}

export default function PaginaLicencas(): ReactElement {
  const cobertura: CoberturaLicencas = LICENCAS_COBERTURA;
  const registros: LinhaLicencaUnificada[] = REGISTROS_LICENCAS;
  const orgaos = Object.entries(cobertura.por_orgao);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Licenças e outorgas ambientais</h1>
        <p className="max-w-3xl opacity-80">
          Feed unificado: IBAMA (licenças DILIC), ANA (outorgas de água), IGAM
          (outorga de MG) e SEMA-MT (licenças, autos de infração e embargos).
          <Link href="/ambiental" className="ml-2 underline">
            volta ao Meio Ambiente
          </Link>
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          titulo="Registros na tela"
          valor={String(cobertura.total)}
          detalhe={`gerado em ${cobertura.gerado_em || "—"} · fonte das amostras`}
        />
        <Cartao titulo="Órgãos de origem" valor={String(orgaos.length)} detalhe={orgaos.map(([o, n]) => `${o} ${n}`).join(" · ") || "—"} />
        <Cartao titulo="Estados (UF)" valor={String(Object.keys(cobertura.por_uf).filter((k) => k !== "—").length)} detalhe={Object.keys(cobertura.por_uf).filter((k) => k !== "—").slice(0, 8).join(", ") || "IBAMA sem UF na amostra"} />
        <Cartao titulo="Categorias" valor={String(Object.keys(cobertura.por_categoria).map((k) => LABEL_CATEGORIA[k] ?? k).join(" · "))} detalhe={`licenças, outorgas e autos — cada órgão com cadastro próprio`} />
      </div>

      <GraficoAno porAno={cobertura.por_ano} />

      {cobertura.truncado ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-4 text-sm">
          ⚠️ Amostra truncada: este feed mostra uma porção do acervo completo.
          A rotina agendada (<code>rotina-ambiental.mts</code> na máquina que
          publica) atualiza e traz o conjunto inteiro por fonte. Números de
          tela não são o total nacional.
        </p>
      ) : null}

      {cobertura.ressalvas.length > 0 ? (
        <p className="text-xs opacity-70">
          Ressalvas das fontes: {cobertura.ressalvas.join(" ")}
        </p>
      ) : null}

      <TabelaLicencas linhas={registros} />
    </div>
  );
}
