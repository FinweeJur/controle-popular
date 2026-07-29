/**
 * Apaga a Data Cache de `fetch` do Next antes de cada build.
 *
 * POR QUE ISSO EXISTE, com o caso que o obrigou:
 *
 * O driver HTTP do Neon faz cada consulta com `fetch`. O Next intercepta
 * `fetch` com a Data Cache dele, que fica em `.next/cache/fetch-cache` e
 * SOBREVIVE DE UM BUILD PARA O OUTRO.
 *
 * Ao ativar Belo Horizonte em `municipios` e rodar `next build` com o
 * cache do build anterior no disco, o resultado foi: as 42 rotas de BH
 * FORAM geradas — `generateStaticParams` leu a lista nova — e todas as 42
 * renderizaram 404. O layout, ao resolver a cidade pelo slug, recebeu a
 * resposta CACHEADA de antes da inserção, não achou BH e chamou
 * `notFound()`. E o build passou sem uma linha de erro, porque
 * `notFound()` é fluxo normal, não exceção. Com o cache apagado, o mesmo
 * build gerou as páginas certas.
 *
 * São dois estragos, e o segundo é pior que o primeiro:
 *  1. quebra a promessa do multi-cidade ("uma cidade nova é UMA LINHA no
 *     banco"): a cidade entra, as rotas nascem, e todas dão 404;
 *  2. ameaça a Fase 5, em que o site passa a ser atualizado por REBUILD
 *     AGENDADO. Uma cache que atravessa builds publicaria dado velho em
 *     silêncio — o build "verde" com o número do mês passado.
 *
 * A alternativa óbvia, `fetchOptions: { cache: "no-store" }` no driver,
 * NÃO serve: marca a requisição como `revalidate: 0` e o Next passa a
 * recusar o prerender de qualquer página que a use (medido:
 * `DYNAMIC_SERVER_USAGE` em `/[municipio]/meio-ambiente/paraopeba`). Isso
 * mataria a estaticização, que é justamente o que torna o Workers Free
 * viável. Ver o comentário em `lib/db/client.ts`.
 *
 * Apaga SÓ `fetch-cache`. O resto de `.next/cache` é cache de compilação,
 * e jogar fora deixaria todo build lento sem necessidade.
 */
import { rm, stat } from "node:fs/promises";

const CAMINHO = new URL("../.next/cache/fetch-cache", import.meta.url);

try {
  await stat(CAMINHO);
  await rm(CAMINHO, { recursive: true, force: true });
  console.log("fetch-cache do Next apagada (dado do banco será relido).");
} catch {
  // Primeiro build, ou cache já limpa — nada a fazer.
}
