import { fornecedoresPorCnpj, gruposEconomicos, somaContratada } from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export interface EmpresaDoGrupo {
  cnpj: string;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  cnaeDescricao: string | null;
  /** `true` quando a sede fica no próprio município do portal. */
  sedeNoMunicipio: boolean | null;
  ufSede: string | null;
}

export interface GrupoEconomico {
  id: string;
  nomeGrupo: string;
  empresas: EmpresaDoGrupo[];
  sociosComuns: string[];
  valorTotalContratos: number;
  qtdContratos: number;
  detectadoEm: string | null;
  /**
   * Todos os CNPJs do grupo têm a mesma raiz (8 primeiros dígitos), ou
   * seja: é **uma empresa só**, com matriz e filiais, não empresas
   * distintas ligadas por sócio.
   *
   * Distinção que a página precisa fazer porque as duas coisas chegam aqui
   * pelo mesmo caminho — matriz e filial obviamente compartilham sócios —
   * e são leituras completamente diferentes. Chamar filial de "grupo
   * econômico" infla a lista com o caso trivial e enfraquece o caso que
   * de fato merece atenção.
   */
  mesmaEmpresa: boolean;
}

export interface GruposEconomicosResult {
  configured: boolean;
  ok: boolean;
  grupos: GrupoEconomico[];
  /** Soma contratada por todos os grupos juntos. */
  valorTotal: number;
  /** Soma contratada pela Prefeitura inteira — denominador da concentração. */
  valorTotalMunicipio: number;
  /** Nº de empresas distintas envolvidas em algum grupo. */
  totalEmpresas: number;
}

const VAZIO: GruposEconomicosResult = {
  configured: false,
  ok: false,
  grupos: [],
  valorTotal: 0,
  valorTotalMunicipio: 0,
  totalEmpresas: 0,
};

interface GrupoRow {
  id: string;
  nome_grupo: string | null;
  cnpjs: string[] | null;
  socios_comuns: string[] | null;
  valor_total_contratos: number | string | null;
  qtd_contratos: number | null;
  detectado_em: string | null;
}

interface FornecedorRow {
  cnpj: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnae_descricao: string | null;
  municipio_sede: string | null;
  uf_sede: string | null;
}

/**
 * Grupos econômicos entre fornecedores da Prefeitura — empresas distintas
 * que compartilham ao menos um sócio no quadro societário da Receita
 * Federal (`etl/grupos.py`, componentes conexas sobre sócios em comum).
 *
 * O valor do município vem de uma agregação separada porque é o
 * denominador da leitura de concentração ("os grupos representam X% do
 * contratado"): sem ele a página mostraria um número absoluto grande sem
 * escala, que não informa nada.
 *
 * Degrada em silêncio, como o resto de `lib/`: sem banco configurado ou
 * sem a tabela, devolve `configured/ok` falsos e a página mostra estado
 * vazio — nunca lança.
 */
export async function getGruposEconomicos(
  idMunicipio: IdMunicipio
): Promise<GruposEconomicosResult> {
  try {
    const data = await gruposEconomicos(idMunicipio);
    if (!data) return VAZIO;

    const rows = data as GrupoRow[];
    const cnpjs = [...new Set(rows.flatMap((r) => r.cnpjs ?? []))];

    // Razão social vive em `fornecedores`, não em `grupos_economicos` (que
    // guarda só os CNPJs). Sem esse join a página mostraria 14 dígitos
    // crus, que ninguém reconhece.
    const porCnpj = new Map<string, FornecedorRow>();
    for (const f of ((await fornecedoresPorCnpj(cnpjs)) ?? []) as FornecedorRow[]) {
      porCnpj.set(f.cnpj, f);
    }

    const grupos: GrupoEconomico[] = rows.map((r) => {
      const listaCnpjs = r.cnpjs ?? [];
      const raizes = new Set(listaCnpjs.map((c) => c.replace(/\D/g, "").slice(0, 8)));
      return {
        id: r.id,
        nomeGrupo: r.nome_grupo ?? "Grupo sem nome",
        empresas: listaCnpjs.map((cnpj) => {
          const f = porCnpj.get(cnpj);
          // `fornecedores.municipio_sede` guarda o CÓDIGO IBGE, não o nome
          // da cidade — e a tabela `municipios` só cobre as cidades da rede
          // Controle Popular, não os 5.570 do país. Em vez de exibir
          // "3106200/MG" (ilegível) ou de inventar o nome, reduzimos ao que
          // dá para afirmar com certeza: a sede é aqui ou é fora.
          const sede = f?.municipio_sede ?? null;
          return {
            cnpj,
            razaoSocial: f?.razao_social ?? null,
            nomeFantasia: f?.nome_fantasia ?? null,
            cnaeDescricao: f?.cnae_descricao ?? null,
            sedeNoMunicipio: sede ? sede === idMunicipio : null,
            ufSede: f?.uf_sede ?? null,
          };
        }),
        sociosComuns: r.socios_comuns ?? [],
        valorTotalContratos: Number(r.valor_total_contratos ?? 0),
        qtdContratos: r.qtd_contratos ?? 0,
        detectadoEm: r.detectado_em,
        mesmaEmpresa: listaCnpjs.length > 1 && raizes.size === 1,
      };
    });

    return {
      configured: true,
      ok: true,
      grupos,
      valorTotal: grupos.reduce((acc, g) => acc + g.valorTotalContratos, 0),
      // Denominador da concentração. Era um laço paginado de 1000 em 1000
      // porque o PostgREST truncava sem erro e a soma viria MENOR — o que
      // inflaria o percentual. Virou `sum()` no banco.
      valorTotalMunicipio: (await somaContratada(idMunicipio)) ?? 0,
      totalEmpresas: cnpjs.length,
    };
  } catch {
    return { ...VAZIO, configured: true };
  }
}
