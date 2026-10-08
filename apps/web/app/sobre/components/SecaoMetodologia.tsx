/**
 * SecaoMetodologia — seção "Metodologia" da página /sobre.
 *
 * Extraída do `SobrePage` em 08/10/2026 (hotspots CodeScene, saúde 7,26).
 * Recebe `stats` como props para as tabelas de cobertura.
 */
import TaxaDeErroTerras from "@/app/[municipio]/components/TaxaDeErroTerras";
import { formatNumberBR } from "@/lib/betim/format";
import type { EstatisticasPortal } from "@/lib/betim/estatisticas-portal";

export function SecaoMetodologia({ stats }: { stats: EstatisticasPortal | null }) {
  const N = formatNumberBR;

  return (
    <section id="metodologia" className="scroll-mt-6 space-y-8">
      <h2 className="font-display text-2xl font-semibold">Metodologia</h2>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-semibold">De onde vem o dado</h3>
        <p className="text-text-soft">
          Entre a fonte pública e a tela existe um conjunto de programas em Python que o
          projeto chama de <strong className="text-text">ETL</strong> — extrair da fonte,
          ajustar o formato, gravar no banco. Contratos e licitações vêm do PNCP; população,
          PIB e malha territorial, do IBGE; despesas e receitas municipais, do SICONFI;
          proposições e parlamentares, das APIs da Câmara dos Deputados e do Senado;
          licenciamento e autuação ambiental, da CAP/SEMAD-MG e do IBAMA; barragens, do
          SNISB (ANA) e da FEAM. Cada tabela do banco declara, no próprio coletor, a fonte
          exata que consulta.
        </p>
        <p className="text-text-soft">
          Uma prática que vale destacar: cada coletor documenta, no cabeçalho do próprio
          arquivo, não só a fonte e as armadilhas medidas nela, mas{" "}
          <strong className="text-text">o que ele deliberadamente não coleta</strong>
          {" "}— para que a ausência de um dado não seja lida como afirmação de que o fato não existe.
          &ldquo;Zero barragens da FEAM&rdquo; num município, por exemplo, não é &ldquo;nenhuma
          barragem no município&rdquo;: é só o recorte que aquele coletor cobre.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-semibold">
          A análise garantista: o modelo extrai, o programa calcula
        </h3>
        <p className="text-text-soft">
          O portal classifica leis e projetos de lei conforme os direitos que ampliam ou
          restringem — <strong className="text-text">garantista</strong> quando ampliam,{" "}
          <strong className="text-text">reducionista</strong> quando restringem. É uma
          escolha de valor, declarada como tal em vez de escondida atrás de uma aparência de
          imparcialidade.
        </p>
        <p className="text-text-soft">
          A régua que decide isso é um arquivo único, com 24 direitos e 17 mecanismos, cada
          direito com as suas âncoras legais. O mesmo arquivo é lido pelo programa que monta
          a instrução do modelo, pelo programa que valida a resposta e pela página que
          explica a metodologia — se a régua mudar, as três mudam juntas, porque um portal
          cujo argumento é a régua transparente não pode publicar uma metodologia diferente
          da que aplica.
        </p>
        <p className="text-text-soft">
          Item que não cita dispositivo legal válido é descartado antes de contar — a coluna
          do banco que guarda essa citação nem aceita valor vazio. Item com confiança abaixo
          de 0,5 continua sendo calculado e publicado, mas marca a análise como{" "}
          <strong className="text-text">&ldquo;requer revisão humana&rdquo;</strong> e sai
          dos rankings de alerta e de bom exemplo.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-semibold">
          Cobertura é amostra, não censo
        </h3>
        <p className="text-text-soft">
          O portal não analisou toda a legislação nem todo projeto de lei — analisou uma
          parte, e essa parte precisa aparecer sempre que um rótulo aparecer.
        </p>
        {stats && (
          <>
            <TabelaVolume
              titulo="Cobertura da análise garantista"
              linhas={[
                [
                  `Atos oficiais municipais analisados (universo ${N(stats.municipal.atosOficiais)})`,
                  stats.municipal.analisesDeAtos,
                ],
                [
                  `Proposições municipais analisadas (universo ${N(stats.municipal.proposicoes)})`,
                  stats.municipal.analisesDeProposicoes,
                ],
                [
                  `Proposições federais analisadas (universo ${N(stats.congresso.proposicoes)})`,
                  stats.congresso.analises,
                ],
              ]}
            />
            <p className="text-[.85em] text-text-soft">
              {N(stats.municipal.analises + stats.congresso.analises)} análises publicadas ao
              todo —{" "}
              {(
                ((stats.municipal.analises + stats.congresso.analises) /
                  (stats.municipal.atosOficiais +
                    stats.municipal.proposicoes +
                    stats.congresso.proposicoes)) *
                100
              ).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              % do universo combinado das três origens. A predominância de rótulos
              &ldquo;neutro&rdquo; entre os analisados tem explicação direta: boa parte da produção
              legislativa municipal é denominação de rua e ato administrativo, e a instrução
              do modelo manda devolver lista vazia nesses casos em vez de forçar uma
              classificação que não existe.
            </p>
          </>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-semibold">
          A análise de vício legislativo
        </h3>
        <p className="text-text-soft">
          Pergunta diferente da anterior: não <em>o que a norma faz com os direitos</em>, mas{" "}
          <em>se ela foi feita do jeito certo, por quem tinha competência para fazê-la</em>.
          Cinco categorias — vício de iniciativa, vício de competência, inconstitucionalidade
          material, vício formal, contrabando legislativo (&ldquo;jabuti&rdquo;, ainda
          documentado mas não aplicado por falta de dado de tramitação). A palavra{" "}
          <strong className="text-text">&ldquo;indício&rdquo;</strong>
          {" "}é obrigatória na
          própria régua: nada aqui pode virar veredito — controle de constitucionalidade é
          função do Judiciário, e a lista de rótulos possíveis nem contém a palavra
          &ldquo;inconstitucional&rdquo;. Cobertura hoje:{" "}
          {stats
            ? `${N(stats.municipal.vicios)} análises municipais e ${N(stats.congresso.vicios)} do Congresso`
            : "uma primeira leva de calibração"}{" "}
          — é calibração, não levantamento.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-semibold">
          A taxa de erro do mapa 3D de terras públicas
        </h3>
        <p className="text-text-soft">
          É a única frente do portal cujo número principal é estimativa de método próprio, e
          não leitura direta de fonte oficial — por isso é a única que publica a taxa de erro
          dentro do próprio cartão de apresentação. &ldquo;Vazio cadastral&rdquo; significa
          área que nenhum imóvel rural declarou no Cadastro Ambiental Rural; o CAR é
          autodeclaratório, então ausência de declaração não é ausência de titular, e muito
          menos prova de que a terra é pública.
        </p>
        <TaxaDeErroTerras />
      </div>
    </section>
  );
}

/** Tabela de volume de dados — auxiliar local da metodologia. */
function TabelaVolume({
  titulo,
  linhas,
}: {
  titulo: string;
  linhas: [string, number][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left">
        <caption className="border-b border-border bg-surface-2 px-3 py-2 text-left font-semibold text-text">
          {titulo}
        </caption>
        <tbody>
          {linhas.map(([label, valor]) => (
            <tr key={label} className="border-t border-border first:border-t-0">
              <td className="px-3 py-1.5 text-text-soft">{label}</td>
              <td className="px-3 py-1.5 text-right font-mono text-text">
                {formatNumberBR(valor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
