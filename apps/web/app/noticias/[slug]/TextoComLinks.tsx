import Link from "next/link";
import type { ReactNode } from "react";

/**
 * @file Renderiza texto com hiperlinks em sintaxe markdown `[rotulo](url)`.
 *
 * Link interno vai em `<Link>` (regra 5.13): `<a>` cru força reload e
 * desmonta a casca — áudio do rádio e estado do pet morrem no meio da
 * leitura. O `InterceptadorLinks` é a rede de segurança, mas a regra vale
 * desde a origem. Link externo abre em nova aba com `rel` seguro.
 *
 * Extraído da página do post para ser reusado por parágrafos, tabelas,
 * gráfico e recomendação sem duplicar o parser.
 */
export default function TextoComLinks({ texto }: { texto: string }) {
  const partes: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > lastIndex) {
      partes.push(texto.substring(lastIndex, match.index));
    }
    const rotulo = match[1];
    const url = match[2];
    const isExterno = url.startsWith("http");

    partes.push(
      isExterno ? (
        <a
          key={`${match.index}-${url}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline underline-offset-2"
        >
          {rotulo}
          <span className="text-xs ml-0.5">↗</span>
        </a>
      ) : (
        <Link
          key={`${match.index}-${url}`}
          href={url}
          className="font-medium text-primary hover:underline underline-offset-2"
        >
          {rotulo}
        </Link>
      )
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < texto.length) {
    partes.push(texto.substring(lastIndex));
  }

  return <>{partes}</>;
}
