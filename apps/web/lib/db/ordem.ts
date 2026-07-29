import { sql, type AnyColumn } from "drizzle-orm";

/**
 * Ordena uma coluna de texto em português.
 *
 * O BANCO DO NEON FOI CRIADO COM COLLATION `C.UTF-8`, que é ordem de BYTE,
 * não ordem linguística. O Supabase usa uma collation linguística. Os dois
 * bancos têm os mesmos dados e devolvem `ORDER BY nome` em ordens
 * DIFERENTES — sem erro, sem log, só a lista embaralhada na tela.
 *
 * Medido, não deduzido:
 *   comissoes.nome  — diverge na 9ª linha de 24: em `C`, "Direitos Humanos"
 *                     vem antes de "Direitos da Mulher" (o 'H' maiúsculo
 *                     tem byte menor que o 'd' minúsculo), e "Ética" cai
 *                     no FIM da lista, depois de "Transportes", porque o
 *                     'É' começa com o byte 0xC3.
 *   servidores.nome — diverge na linha 1.158 de 9.803: "ANTÔNIO" vai para
 *                     depois de todos os "ANTONIO". É uma lista PAGINADA
 *                     de 50 em 50, então isso muda quem aparece em qual
 *                     página.
 *   escolas.nome e postos_anp.razao_social bateram por sorte — não têm
 *   acento na parte que decide a ordem.
 *
 * `pt-BR-x-icu` (ICU, disponível no PG 17 do Neon) reproduz a ordem do
 * Supabase EXATAMENTE nas quatro tabelas testadas, e é idêntica ao
 * `localeCompare("pt-BR")` que o app já usa no JS para os conjuntos
 * pequenos. É a mesma decisão do eixo Congresso — lá a ordenação por nome
 * ficou no JS de propósito, "porque a collation do Postgres não reproduz o
 * Intl"; aqui a collation certa reproduz, e ficar no SQL é obrigatório
 * onde há paginação.
 *
 * Custo: um índice criado na collation padrão não serve para este
 * `ORDER BY`, então o Postgres ordena em memória. Nos volumes daqui
 * (9.803 servidores é o maior) isso é irrelevante.
 *
 * Não usar em coluna que não é texto humano — slug, código, competência
 * "2024-01". Nessas, byte e ICU dão o mesmo resultado e o `COLLATE` só
 * atrapalha a leitura.
 */
export function ptBr(coluna: AnyColumn) {
  return sql`${coluna} collate "pt-BR-x-icu"`;
}
