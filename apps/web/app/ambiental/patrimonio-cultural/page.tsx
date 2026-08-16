import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import { listarPatrimonioTombado } from "@/lib/db/queries/patrimonio-tombado";
import BuscaPatrimonioTombado from "./BuscaPatrimonioTombado";
import Link from "@/lib/ambiental/link";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/ambiental/patrimonio-cultural", {
  title: "Patrimônio cultural tombado — Controle Popular · Ambiental",
  description:
    "Os bens culturais materiais tombados pelo Estado de Minas Gerais — imóveis, conjuntos paisagísticos e centros históricos protegidos pelo IEPHA-MG, filtráveis por município e categoria.",
});

/**
 * `/ambiental/patrimonio-cultural` — Tarefa 2b da unificação de legislação
 * (pedido do dono, 2026-08-13): "isso hoje NÃO está no portal — o acervo é
 * ambiental [...] tombamento restringe o que pode ser feito com um
 * território, exatamente como área protegida ambiental".
 *
 * ═══ POR QUE PÁGINA PRÓPRIA, NÃO DENTRO DE `/ambiental/legislacao` ═══
 *
 * Cada linha aqui é um BEM tombado, não uma norma — mais parecido com
 * `ambiental_licenciamento` (um registro administrativo com efeito sobre um
 * lugar) do que com `ambiental_legislacao`/`direito_critico_*` (texto de
 * lei ou decisão). Forçar os 153 bens dentro do filtro de tema da
 * legislação inflaria aquele painel com um tipo de dado que ele não foi
 * desenhado pra mostrar (um bem não tem "artigo" nem "ementa"). A ligação
 * entre os dois continua feita por TEXTO — ver a seção "de onde vem cada
 * item" de `/ambiental/legislacao`, que linka pra cá.
 *
 * ═══ FONTE E LACUNA DECLARADA (medido em 2026-08-13) ═══
 *
 * Dataset "Patrimônio Cultural Tombado" do IEPHA-MG, CKAN de dados abertos
 * de MG, licença CC-BY-4.0 — 153 bens tombados (migration `0072`, ingestor
 * `etl/betim/etl/apis/patrimonio_tombado_iepha.py`). O QUE NÃO ENTROU:
 * geometria (existe, camada `ide_2017_mg_tombamento_iepha_pto` no
 * IDE-Sisema, mas integrar ao mapa 3D é outra frente) e busca por número de
 * processo (o IEPHA não publica nenhuma — orientação oficial é ida
 * presencial à biblioteca do instituto).
 */
export default async function PatrimonioCulturalIndex() {
  const linhas = await listarPatrimonioTombado();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-tertiary)" }}
        >
          Ambiental · Estadual · Patrimônio cultural
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          O patrimônio cultural tombado por Minas Gerais
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Tombamento restringe o que pode ser feito com um imóvel ou território — o mesmo tipo de
          proteção que uma unidade de conservação ambiental impõe, só que pelo valor histórico,
          artístico ou paisagístico do bem, não pelo valor ecológico. Uma serra tombada e uma serra
          com lavra autorizada em cima é o mesmo conflito que{" "}
          <Link href="/legislacao" className="text-accent hover:underline">
            legislação e precedentes de proteção
          </Link>{" "}
          já mapeiam — este acervo cobre a outra metade.
        </p>

        {linhas.length === 0 ? (
          <p className="max-w-2xl rounded-lg border border-dashed border-border px-4 py-3 text-[.95em] text-text-soft">
            Nada coletado ainda. O ingestor (
            <code className="font-mono text-[.85em]">etl.apis.patrimonio_tombado_iepha</code>) ainda
            não rodou contra este banco.
          </p>
        ) : (
          <p
            className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]"
            style={{ borderColor: "var(--cp-tertiary)" }}
          >
            <strong className="font-tabular">{formatNumberBR(linhas.length)}</strong> bens culturais
            tombados pelo Estado — imóveis, conjuntos paisagísticos, centros históricos e bens
            móveis, em {formatNumberBR(new Set(linhas.map((l) => l.municipio)).size)} municípios.
          </p>
        )}
      </header>

      <section className="mt-10">
        <BuscaPatrimonioTombado linhas={linhas} />
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
        <p className="mt-3 text-[.92em] text-text-soft">
          Dataset &quot;Patrimônio Cultural Tombado&quot;, publicado pelo próprio IEPHA-MG
          (Instituto Estadual do Patrimônio Histórico e Artístico de Minas Gerais) no CKAN de dados
          abertos do estado, com curadoria da Controladoria-Geral do Estado. Licença CC-BY-4.0,
          declarada no schema oficial do dataset — a mesma abertura que já vale para as outras
          fontes do portal. O tombamento em si é regido pela Lei Delegada nº 170/2007 (cria o
          Conselho Estadual do Patrimônio Cultural — CONEP-MG) e pelo Decreto nº 44.785/2008, com
          base no Decreto-Lei federal nº 25/1937.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          Duas lacunas declaradas, não escondidas: (1) o IEPHA publica geometria dos bens tombados
          (camada de ponto no IDE-Sisema, acesso livre) que este acervo NÃO integra — colocar essa
          camada no mapa 3D é trabalho de outra frente do projeto; (2) o IEPHA não tem busca pública
          por número de processo nem API própria — a orientação oficial pra consultar um processo é
          ida presencial à biblioteca do instituto, medido nesta investigação, não uma limitação
          deste ingestor.
        </p>
      </section>
    </div>
  );
}
