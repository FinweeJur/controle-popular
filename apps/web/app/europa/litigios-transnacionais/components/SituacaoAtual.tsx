/**
 * Síntese de "situação atual" da subfrente.
 *
 * Separa o que está confirmado do que está em aberto e do que é lacuna:
 * o leitor sob estresse não pode confundir sentença de responsabilidade
 * com indenização fixada, nem notícia com decisão oficial.
 */
import { DATA_ACESSO } from "@/lib/europa-litigios";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";

const CONFIRMADO = [
  "Em 14/11/2025, a High Court (TCC) responsabilizou a BHP na primeira etapa, como poluidora e por culpa.",
  "A sentença não fixou o valor da indenização; a segunda etapa e os temas consequentes seguem em aberto.",
  "A Suprema Corte do Reino Unido já havia firmado os precedentes Vedanta (2019) e Okpabi (2021) sobre dever de cuidado da matriz.",
];

const EM_ABERTO = [
  "Valor final da indenização e alcance da segunda etapa.",
  "Eventuais recursos e o cumprimento da decisão de responsabilidade.",
  "Número, partes e fase do caso Rio Doce Claims no Tribunal de Roterdã.",
  "Número e relator da eventual ADPF no STF.",
];

const LACUNAS = [
  "Não foi localizado litígio europeu confirmado sobre Brumadinho nesta coleta.",
  "O portal Rechtspraak recusou a consulta (HTTP 403); os dados holandeses vieram do acervo /europa e estão marcados como pendentes.",
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
        Data da coleta: <time dateTime={DATA_ACESSO}>{formatarDataBR(DATA_ACESSO)}</time>.
        O que não foi conferido em fonte oficial não é apresentado como fato.
      </p>
    </div>
  );
}
