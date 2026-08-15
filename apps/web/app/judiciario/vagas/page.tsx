import type { Metadata } from "next";
import Link from "@/lib/judiciario/link";
import { proximasVacancias } from "@/lib/judiciario/tribunais";
import { rotuloCota } from "@/lib/judiciario/rotulos";
import FonteRodape, { FONTE_REGUA } from "@/app/judiciario/components/FonteRodape";

export const metadata: Metadata = {
  title: "Vagas — Controle Popular · Judiciário",
  description:
    "Quando cada ministro completa 75 anos e é obrigado a se aposentar, calculado a partir da data de nascimento — não uma estimativa.",
};

const fmtData = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export default async function Vagas() {
  const vacancias = await proximasVacancias(60);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Próximas vagas</h1>
        <p className="max-w-3xl opacity-80">
          A lei obriga todo ministro a se aposentar aos 75 anos (Lei Complementar 152/2015).
          As datas abaixo são o resultado direto dessa conta — nascimento mais 75 anos —,
          sem chute e sem opinião. Mas é o <strong>mínimo</strong> que falta: a cadeira pode
          vagar antes disso, se o ministro pedir para sair, morrer ou renunciar.
        </p>
      </header>

      {vacancias.length === 0 ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          As datas de aposentadoria ainda não estão disponíveis para nenhum tribunal — a
          composição de cada um está sendo conferida nome a nome antes de publicar. Volte em
          breve.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--cp-border)] text-left">
              <th className="py-1">Tribunal</th>
              <th className="py-1">Ministro(a)</th>
              <th className="py-1">Cota</th>
              <th className="py-1">Vacância projetada</th>
            </tr>
          </thead>
          <tbody>
            {vacancias.map((o) => (
              <tr key={o.ocupacao_id} className="border-b border-[var(--cp-border)]">
                <td className="py-1">
                  <Link href={`/tribunais/${o.tribunal_id}`} className="uppercase underline">
                    {o.tribunal_id}
                  </Link>
                </td>
                <td className="py-1">{o.magistrado_nome}</td>
                <td className="py-1 opacity-70">{rotuloCota(o.cota)}</td>
                <td className="py-1 font-tabular">{fmtData(o.vacancia_projetada)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* A data de nascimento — o único insumo da conta desta página — vem da
          curadoria de composição de cada tribunal, creditada com link na
          página do tribunal. Aqui a fonte é a regra que transforma nascimento
          em data de vacância, que é lei, não raspagem. */}
      <FonteRodape
        fontes={[FONTE_REGUA]}
        nota="A data de nascimento de cada ministro vem da composição publicada pelo próprio tribunal, creditada na página dele."
      />
    </div>
  );
}
