/**
 * Síntese de "situação atual" da subfrente.
 *
 * Separa o que está confirmado, o que está em aberto e o que é lacuna:
 * o leitor sob estresse não pode confundir sentença de responsabilidade
 * com indenização fixada, nem notícia com decisão oficial.
 */
import { DATA_ACESSO } from "@/lib/europa-litigios";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";

const CONFIRMADO = [
  "Em 14/11/2025, a High Court (TCC) responsabilizou a BHP na primeira etapa, como poluidora e por culpa.",
  "A sentença não fixou indenização; a quantificação ficou para a segunda fase, prevista para 2027.",
  "A permissão de recurso da BHP foi negada pela Court of Appeal em 06/05/2026 e pela Supreme Court no contempt em 29/06/2026.",
  "Em 24/07/2024, a Braskem S.A. foi responsabilizada em Roterdã pelo afundamento de Maceió.",
  "A ADPF 1178, relatada por Flávio Dino, limitou a eficácia de decisões estrangeiras e esclareceu o acordo de Mariana.",
];

const EM_ABERTO = [
  "Valor final da indenização e alcance da segunda fase em Londres.",
  "Decisão de competência da Justiça holandesa no caso Rio Doce Claims.",
  "Apelação da Braskem em Roterdã, sem decisão localizada até a coleta.",
  "Julgamento de mérito da ADPF 1178.",
];

const LACUNAS = [
  "Não foi localizado litígio europeu confirmado sobre Brumadinho nesta coleta.",
  "O número do processo holandês do Rio Doce não foi localizado.",
  "O arquivo em web.archive.org não foi confirmado para todos os itens de clipping.",
];

export default function SituacaoAtual() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div>
        <h3 className="text-sm font-semibold text-text">Confirmado</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-soft">
          {CONFIRMADO.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text">Em aberto</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-soft">
          {EM_ABERTO.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text">Lacunas declaradas</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-soft">
          {LACUNAS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <p className="text-sm text-text-soft md:col-span-3">
        Data da coleta:{" "}
        <time dateTime={DATA_ACESSO}>{formatarDataBR(DATA_ACESSO)}</time>.
        O que não foi conferido em fonte oficial não é apresentado como fato.
      </p>
    </div>
  );
}
