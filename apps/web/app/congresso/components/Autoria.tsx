import type { AutoriaResumo } from "@/lib/db/queries/congresso";

/**
 * Autoria da proposição, na LISTA — não só na página de detalhe.
 *
 * Por que isto importa: um card que diz "este projeto restringe o devido
 * processo legal" sem dizer de quem é o projeto obriga quem lê a abrir a
 * página para saber a quem cobrar. A autoria é o dado que transforma
 * leitura em ação, e é a primeira coisa que alguém pergunta.
 *
 * Mostra no máximo 2 nomes e conta o resto: `PEC 3/2026` tem 224 autores, e
 * imprimir 224 nomes num card destruiria a lista. Quem quiser todos abre o
 * detalhe.
 *
 * `institucional` (Poder Executivo, comissão, Senado, Judiciário) sai SEM
 * tratamento de pessoa — escrever "Dep. Poder Executivo" seria absurdo, e é
 * exatamente o que aconteceria se o componente presumisse que todo autor é
 * parlamentar. 1.117 das 5.562 proposições deste banco têm autoria
 * institucional.
 */

function prefixo(tipo: string | null): string {
  const t = (tipo ?? "").toLowerCase();
  if (t.startsWith("deputad")) return "Dep. ";
  if (t.startsWith("senador")) return "Sen. ";
  return "";
}

function Nome({ a }: { a: AutoriaResumo["autores"][number] }) {
  const sigla = [a.partido, a.uf].filter(Boolean).join("-");
  return (
    <span>
      <span className="font-medium">
        {a.institucional ? a.nome : `${prefixo(a.tipo)}${a.nome}`}
      </span>
      {sigla ? <span className="opacity-70"> ({sigla})</span> : null}
    </span>
  );
}

export default function Autoria({
  autoria,
  className = "",
}: {
  autoria: AutoriaResumo | undefined;
  /** A lista e os cards usam tipografias diferentes; quem chama decide. */
  className?: string;
}) {
  // Ausência é estado legítimo (proposição sincronizada antes do ETL de
  // autoria rodar). Silêncio é melhor que "autor desconhecido", que soa
  // como falha da fonte quando é só fila de sincronização.
  if (!autoria || autoria.autores.length === 0) return null;

  const restantes = autoria.total - autoria.autores.length;

  return (
    <p className={className}>
      <span className="opacity-70">Autoria: </span>
      {autoria.autores.map((a, i) => (
        <span key={a.nome}>
          {i > 0 ? <span className="opacity-70">{restantes > 0 ? ", " : " e "}</span> : null}
          <Nome a={a} />
        </span>
      ))}
      {restantes > 0 ? (
        <span className="opacity-70">
          {" "}
          + {restantes} {restantes === 1 ? "coautor" : "coautores"}
        </span>
      ) : null}
    </p>
  );
}
