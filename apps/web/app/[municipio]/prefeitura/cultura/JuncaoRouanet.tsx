import DataCard from "@/app/[municipio]/components/DataCard";
import Moeda from "@/app/components/Moeda";
import { formatNumberBR } from "@/lib/betim/format";
import {
  AFIRMACAO_DA_JUNCAO,
  RESSALVA_TOTAL_DOADO,
  SEM_TRILHA_DE_DOACAO,
  type EmpresaNosDoisAcervos,
  type EstatisticasDeChave,
} from "@/lib/cultura/juncao-fornecedor";
import { empresasNosDoisAcervos } from "@/lib/cultura/juncao-banco";

interface JuncaoRouanetProps {
  municipioNome: string;
}

export default async function JuncaoRouanet({ municipioNome }: JuncaoRouanetProps) {
  const resultado = await empresasNosDoisAcervos();

  if (resultado.estado === "sem-acervo") {
    return null;
  }

  const estatisticas: EstatisticasDeChave = resultado.estatisticas;
  const empresas: EmpresaNosDoisAcervos[] =
    resultado.estado === "ok" ? resultado.empresas : [];

  return (
    <section className="mt-8">
      <DataCard
        title="Incentivadores da Lei Rouanet × Fornecedores Públicos"
        source={{
          label: "SALIC / MinC e PNCP",
          url: "https://salic.cultura.gov.br/",
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-text-soft">
            Cruzamento cadastral entre os{" "}
            <strong className="font-semibold text-text">
              {formatNumberBR(estatisticas.comCnpj)} incentivadores com CNPJ
            </strong>{" "}
            da Lei Rouanet em Minas Gerais e os registros de fornecedores da administração
            pública municipal.
          </p>

          <div className="rounded-xl border border-border bg-surface p-4 text-xs text-text-soft">
            <p className="font-semibold text-text">⚠️ Ressalvas editoriais obrigatórias:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4">
              <li>{AFIRMACAO_DA_JUNCAO}</li>
              <li>{RESSALVA_TOTAL_DOADO}</li>
              <li>{SEM_TRILHA_DE_DOACAO}</li>
            </ul>
          </div>

          {resultado.estado === "sem-banco" ? (
            <div className="rounded-xl border border-dashed border-border bg-surface-2 p-6 text-center text-xs text-text-soft">
              A contagem de empresas que coincidem nos dois acervos requer consulta ao banco de dados,
              indisponível nesta cópia do portal. O cruzamento exato será calculated na compilação em produção.
            </div>
          ) : empresas.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface-2 p-6 text-center text-xs text-text-soft">
              Nenhuma empresa incentivadora da Lei Rouanet identificada nos contratos públicos de {municipioNome}.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-text">
                {empresas.length} {empresas.length === 1 ? "empresa encontrada" : "empresas encontradas"} nos dois acervos:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border text-text-soft">
                    <tr>
                      <th className="py-2 pr-3 font-semibold">Empresa / Razão Social</th>
                      <th className="py-2 pr-3 font-semibold">CNPJ</th>
                      <th className="py-2 pr-3 font-semibold">Município</th>
                      <th className="py-2 text-right font-semibold">Total Doado (Nacional)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {empresas.map((e) => (
                      <tr key={e.cnpj}>
                        <td className="py-2 pr-3 font-medium text-text">{e.incentivador.nome}</td>
                        <td className="py-2 pr-3 font-tabular text-text-soft">{e.cnpj}</td>
                        <td className="py-2 pr-3 text-text-soft">{e.incentivador.municipio ?? "—"}</td>
                        <td className="py-2 text-right font-tabular font-medium text-text">
                          <Moeda value={e.incentivador.total_doado_brasil} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DataCard>
    </section>
  );
}
