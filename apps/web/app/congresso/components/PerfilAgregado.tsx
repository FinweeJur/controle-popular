import type { PerfilAgregado } from "@/lib/congresso/agregado";
import { lerAgregado } from "@/lib/congresso/agregado";
import { labelDoRotulo, type Rotulo } from "@/lib/congresso/rubrica";

/**
 * Perfil agregado de um grupo (comissão, bancada).
 *
 * A barra mostra a DISTRIBUIÇÃO de rótulos, não uma média — ver
 * `lib/agregado.ts` para por quê (modelos diferentes divergem na
 * intensidade do score, então somar misturaria réguas).
 *
 * A nota metodológica não é enfeite jurídico: um agregado descreve o
 * conjunto de proposições associadas ao grupo, e a associação de uma
 * comissão é "está parada aqui agora" — o que inclui matéria que a
 * comissão não pediu e talvez vá rejeitar. Deixar isso implícito
 * convidaria a ler o número como julgamento do grupo.
 */

const ORDEM: Rotulo[] = [
  "garantista_forte",
  "garantista",
  "misto",
  "neutro",
  "reducionista",
  "reducionista_forte",
];

const COR: Record<Rotulo, string> = {
  garantista_forte: "var(--cp-accent)",
  garantista: "var(--cp-accent)",
  misto: "var(--cp-ord-4)",
  neutro: "var(--cp-text-soft)",
  reducionista: "var(--cp-alert)",
  reducionista_forte: "var(--cp-alert)",
};

export default function PerfilAgregadoView({
  perfil,
  sujeito,
  nota,
}: {
  perfil: PerfilAgregado;
  sujeito: string;
  nota: string;
}) {
  const leitura = lerAgregado(perfil, sujeito);

  if (perfil.analisadas === 0) {
    return (
      <div className="rounded-lg border border-[var(--cp-border)] p-5">
        <p className="opacity-80">{leitura}</p>
      </div>
    );
  }

  const segmentos = ORDEM.filter((r) => perfil.contagem[r] > 0);

  return (
    <div className="space-y-3 rounded-lg border border-[var(--cp-border)] p-5">
      <p>{leitura}</p>

      <div
        className="flex h-6 w-full overflow-hidden rounded-md"
        role="img"
        aria-label={segmentos
          .map((r) => `${labelDoRotulo(r)}: ${perfil.contagem[r]}`)
          .join("; ")}
      >
        {segmentos.map((r) => {
          const largura = (perfil.contagem[r] / perfil.analisadas) * 100;
          return (
            <div
              key={r}
              style={{ width: `${largura}%`, backgroundColor: COR[r] }}
              // Sem cor sozinha carregando significado: o title dá o texto,
              // e a legenda abaixo repete tudo por extenso.
              title={`${labelDoRotulo(r)}: ${perfil.contagem[r]} de ${perfil.analisadas}`}
            />
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {segmentos.map((r) => (
          <li key={r} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: COR[r] }}
            />
            <span>
              {labelDoRotulo(r)}{" "}
              <span className="font-tabular opacity-70">{perfil.contagem[r]}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-sm opacity-70">
        {perfil.analisadas} de {perfil.total} proposições analisadas
        {perfil.cobertura < 1 ? (
          <>
            {" "}
            — as demais estão na fila. A fila é priorizada, então o que já foi analisado
            não é uma amostra aleatória.
          </>
        ) : null}
      </p>

      <p className="text-sm opacity-70">{nota}</p>
    </div>
  );
}
