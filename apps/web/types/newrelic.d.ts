/**
 * Declaracao de tipo minima do pacote `newrelic`.
 *
 * O portal so importa o pacote por EFEITO COLATERAL — carregar o agente APM em
 * `instrumentation.ts` — e nao usa nenhuma funcao da API dele. Sem esta
 * declaracao, o `tsc` falha com TS7016 ("Could not find a declaration file").
 * Declarar o modulo aqui evita instalar `@types/newrelic` inteiro so para um
 * `import` de efeito colateral.
 */
declare module "newrelic";
