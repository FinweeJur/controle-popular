import TextoComLinks from "./TextoComLinks";
import TabelaInterativa from "./TabelaInterativa";
import type { TabelaNoticia } from "@/lib/noticias/portal";

/**
 * @file Tabelas do post — uma ou várias, no mesmo componente.
 *
 * `tabelas` é a lista nova (ex.: vagas por área). `tabela` é o campo legado
 * de tabela única, mantido para não quebrar posts antigos. As duas entram na
 * mesma renderização, com legenda acessível (`<caption>` sr-only), cabeçalho
 * com `scope="col"` e rolagem horizontal só dentro do quadro (regra 5.14).
 *
 * O título visível fica no `<h3>`; o `<caption>` existe para leitor de tela,
 * que precisa ouvir o nome da tabela sem depender do heading anterior.
 */
export default function SecaoTabelas({
  tabela,
  tabelas,
}: {
  tabela?: TabelaNoticia;
  tabelas?: TabelaNoticia[];
}) {
  const lista = [...(tabelas ?? []), ...(tabela ? [tabela] : [])];
  if (!lista.length) return null;

  return (
    <>
      {lista.map((t, indice) => (
        <section key={`${t.titulo}-${indice}`} aria-label={t.titulo} className="my-8">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
            {t.titulo}
          </h3>
          <TabelaInterativa titulo={t.titulo} colunas={t.colunas} linhas={t.linhas} />
          {t.nota && (
            <p className="mt-2 text-xs text-muted">
              <TextoComLinks texto={t.nota} />
            </p>
          )}
          {t.fonte && (
            <p className="mt-1 text-xs text-muted">
              Fonte:{" "}
              <a
                href={t.fonte.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t.fonte.nome} ↗
              </a>
            </p>
          )}
        </section>
      ))}
    </>
  );
}
