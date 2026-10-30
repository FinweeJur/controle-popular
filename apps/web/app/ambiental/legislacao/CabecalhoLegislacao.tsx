import Link from "@/lib/ambiental/link";
import { formatNumberBR } from "@/lib/betim/format";

/**
 * Cabeçalho do painel de legislação.
 *
 * Extraído de `LegislacaoAmbientalIndex` para reduzir a função principal
 * (CodeScene) e abrir espaço para o eixo "Direito internacional".
 */
export interface ContagemFonte {
  porFonte: { almg: number; semad: number; siam: number; mma: number; cndh: number };
}

export default function CabecalhoLegislacao({
  totalGeral,
  contagem,
  criticas,
  precedentes,
  cobertura,
}: {
  totalGeral: number;
  contagem: ContagemFonte;
  criticas: number;
  precedentes: number;
  cobertura: { total: number; comTema: number };
}) {
  return (
    <header className="space-y-4">
      <p
        className="text-[.82em] font-semibold uppercase tracking-wide"
        style={{ color: "var(--cp-tertiary)" }}
      >
        Ambiental · Estadual, federal e internacional · Legislação e precedentes
      </p>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        A legislação e os precedentes de proteção, numa busca só
      </h1>
      <p className="max-w-2xl text-[1.05em] text-text-soft">
        Leis, decretos, deliberações e portarias ambientais de Minas Gerais ao lado da legislação
        federal (MMA, Ibama, ICMBio e Conama), das resoluções do CNDH, de tratados e de decisões
        de tribunais nacionais e internacionais — numa busca só, filtrável por esfera e tema.
        Para responsabilizar transnacionais, use o eixo{" "}
        <Link href="/europa/legislacao-transnacionais" className="font-semibold text-primary hover:underline">
          Direito internacional
        </Link>
        .
      </p>

      {totalGeral === 0 ? (
        <p className="max-w-2xl rounded-lg border border-dashed border-border px-4 py-3 text-[.95em] text-text-soft">
          Nada coletado ainda. Os coletores (
          <code className="font-mono text-[.85em]">etl.apis.legislacao_almg</code>,{" "}
          <code className="font-mono text-[.85em]">legislacao_semad</code>,{" "}
          <code className="font-mono text-[.85em]">legislacao_siam</code>,{" "}
          <code className="font-mono text-[.85em]">legislacao_mma</code>,{" "}
          <code className="font-mono text-[.85em]">legislacao_cndh</code>,{" "}
          <code className="font-mono text-[.85em]">direito_critico_popular</code>) ainda não
          rodaram contra este banco.
        </p>
      ) : (
        <p
          className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]"
          style={{ borderColor: "var(--cp-tertiary)" }}
        >
          <strong className="font-tabular">{formatNumberBR(totalGeral)}</strong> itens ao todo:{" "}
          <strong className="font-tabular">
            {formatNumberBR(contagem.porFonte.almg + contagem.porFonte.semad + contagem.porFonte.siam)}
          </strong>{" "}
          normas estaduais de Minas (
          <strong className="font-tabular">{formatNumberBR(contagem.porFonte.almg)}</strong> ALMG,{" "}
          <strong className="font-tabular">{formatNumberBR(contagem.porFonte.semad)}</strong> Semad,{" "}
          <strong className="font-tabular">{formatNumberBR(contagem.porFonte.siam)}</strong> Siam),{" "}
          <strong className="font-tabular">
            {formatNumberBR(contagem.porFonte.mma + contagem.porFonte.cndh)}
          </strong>{" "}
          normas federais (
          <strong className="font-tabular">{formatNumberBR(contagem.porFonte.mma)}</strong> MMA/Conama,{" "}
          <strong className="font-tabular">{formatNumberBR(contagem.porFonte.cndh)}</strong> CNDH),{" "}
          <strong className="font-tabular">{formatNumberBR(criticas)}</strong> instrumentos
          nacionais/internacionais curados e{" "}
          <strong className="font-tabular">{formatNumberBR(precedentes)}</strong> precedentes
          judiciais. As três fontes estaduais se sobrepõem em parte — a mesma Lei/Decreto pode
          estar em mais de uma, e o card avisa quando isso acontece.
        </p>
      )}

      {cobertura.total > 0 && (
        <p className="max-w-2xl rounded-lg border border-dashed border-border px-4 py-3 text-[.88em] text-text-soft">
          Das normas ambientais coletadas em massa (as estaduais e as federais),{" "}
          <strong className="font-tabular text-text">{formatNumberBR(cobertura.comTema)}</strong> de{" "}
          <strong className="font-tabular text-text">{formatNumberBR(cobertura.total)}</strong> (
          {((100 * cobertura.comTema) / cobertura.total).toFixed(1).replace(".", ",")}%)
          receberam pelo menos um tema — as demais ficam &quot;sem tema atribuído&quot;, não
          empurradas pra um tema qualquer. As 45 linhas de legislação/precedente
          nacional/internacional têm 100% de cobertura (curadoria dedicada, ver seção abaixo).
        </p>
      )}
    </header>
  );
}
