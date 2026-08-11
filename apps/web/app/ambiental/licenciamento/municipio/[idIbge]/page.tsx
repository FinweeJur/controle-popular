import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/lib/ambiental/link";
import { formatNumberBR } from "@/lib/betim/format";
import {
  listarLicencasPorMunicipio,
  listarMunicipiosComLicenciamento,
  nomeMunicipioMg,
} from "@/lib/db/queries/ambiental-licenciamento";
import FiltroLicencas from "./FiltroLicencas";

type Params = Promise<{ idIbge: string }>;

/**
 * Uma página por município com licença ambiental deferida — mesmo padrão
 * de `/ambiental/copam/municipio/[idIbge]`. O filtro por setor/modalidade/
 * classe mora aqui dentro (ver a docstring de `FiltroLicencas.tsx` sobre
 * por que isso não precisa do índice fatiado que `congresso/proposicoes`
 * usa).
 */
export async function generateStaticParams() {
  return (await listarMunicipiosComLicenciamento()).map((m) => ({ idIbge: m.idIbge }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { idIbge } = await params;
  const nome = await nomeMunicipioMg(idIbge);
  return {
    title: `Licenciamento ambiental em ${nome ?? idIbge} — Controle Popular · Ambiental`,
    description: `Todas as licenças ambientais deferidas pela Semad em ${nome ?? idIbge}/MG, por setor, modalidade e classe.`,
  };
}

export default async function MunicipioLicenciamentoPage({ params }: { params: Params }) {
  const { idIbge } = await params;
  const [licencas, nome] = await Promise.all([
    listarLicencasPorMunicipio(idIbge),
    nomeMunicipioMg(idIbge),
  ]);
  if (licencas.length === 0) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <nav className="text-sm">
        <Link href="/licenciamento" className="underline opacity-80 hover:opacity-100">
          ← licenciamento ambiental
        </Link>
      </nav>

      <header className="mt-4 space-y-2">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-tertiary)" }}
        >
          Licenciamento ambiental em Minas Gerais
        </p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{nome ?? idIbge}/MG</h1>
        <p className="max-w-xl text-sm opacity-75">
          {formatNumberBR(licencas.length)}{" "}
          {licencas.length === 1 ? "licença deferida" : "licenças deferidas"} coletadas da Semad
          (IDE-Sisema) para {nome ?? "este município"}.
        </p>
      </header>

      <div className="mt-8">
        <FiltroLicencas licencas={licencas} />
      </div>

      <p className="mt-10 max-w-xl text-xs opacity-60">
        Quando o titular é pessoa física, este portal não publica nome, documento nem
        coordenada — só que a licença existe, com o setor e o município. Este portal não afirma
        irregularidade: é a reprodução da licença como a Semad publica.
      </p>
    </div>
  );
}
