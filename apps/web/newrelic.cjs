/**
 * Configuracao do agente APM New Relic (New Relic Node.js agent v13).
 *
 * Lido em runtime por `instrumentation.ts` -> `import("newrelic")`. O caminho
 * ate este arquivo e entregue ao agente pela variavel NEW_RELIC_CONFIG_FILENAME,
 * definida no estagio runner do `Dockerfile` (o standalone do Next nao copia
 * arquivos de configuracao sozinho).
 *
 * DECISOES (todas para nao vazar dado de cidadao — AGENTS.md §5.8 e §5.2):
 * - `license_key` NAO fica aqui. Vem da env NEW_RELIC_LICENSE_KEY, que vive
 *   no painel do Guara (runtime, sem `-b`). Arquivo versionado nunca carrega
 *   segredo.
 * - `allow_all_headers: false` — nenhum header de requisicao e capturado por
 *   padrao (o agente so guarda uma lista segura). Header pode trazer cookie,
 *   IP e Authorization.
 * - `attributes.exclude: ["request.parameters.*"]` — descarta TODOS os
 *   parametros de requisicao (query string, corpo de formulario). No portal, a
 *   busca e a paleta de comandos aceitam texto livre: um cidadao pode digitar
 *   o proprio nome ou CPF ali. Esse valor nunca pode virar dado de analytics.
 * - `transaction_tracer.record_sql: "obfuscated"` — a query aparece sem os
 *   literais (parametros reais sumidos), so a forma. E o padrao do agente,
 *   repetido aqui de proposito para o proximo agente saber que foi decidido.
 * - `application_logging.forwarding.enabled: false` — o conteudo impresso no
 *   console NAO e repassado para o New Relic. O portal nao classifica o que
 *   loga; mandar console para fora arriscaria carregar dado pessoal.
 * - `browser_monitoring.enable: false` — sem injecao de script de RUM no HTML
 *   (o portal nao chama getBrowserTimingHeader). Mantem o peso da pagina sob
 *   controle e evita mais um dominio no CSP.
 * - `logging.filepath: "stdout"` — o log do PROPRIO agente vai para a saida
 *   do container (visivel em `guara logs`), e nao cria arquivo em disco.
 *
 * Sem `high_security: true` de proposito: o modo de alta seguranca exige
 * habilitacao correspondente na conta e, se desalinhado, o agente reclama no
 * log. As travas acima cobrem a mesma intencao sem acoplar ao painel.
 */
exports.config = {
  app_name: ["Controle Popular"],
  logging: {
    filepath: "stdout",
    level: "info",
  },
  allow_all_headers: false,
  attributes: {
    exclude: ["request.parameters.*"],
  },
  transaction_tracer: {
    record_sql: "obfuscated",
  },
  application_logging: {
    forwarding: {
      enabled: false,
    },
  },
  browser_monitoring: {
    enable: false,
  },
};
