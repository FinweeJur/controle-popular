-- 0090_fila_coleta.sql
-- Fila de tarefas da Fase 1 "coletar na nuvem, digerir no PC".
--
-- ═══ PAPEL NO PROJETO ═══
--
-- Uma única fila no Postgres do Guara liga as duas pontas da fase:
--   * a NUVEM (cron worker do Guara) SEMENTEIA trabalho — insere linhas
--     `pendente` com o alvo a coletar/analisar (`/api/fila/semear`);
--   * o PC de casa (home-pc) PUXA as linhas, roda o modelo LOCAL
--     (`Ollama` em 127.0.0.1:11434) e devolve `concluido`/`erro` com o
--     `resultado` (scripts/fila-coleta-puller.mts).
--
-- O banco é só o quadro de recados entre os dois. O dado bruto NÃO mora
-- aqui: `payload` guarda o pedido, `resultado` guarda a resposta já
-- digerida. Assim a nuvem não precisa de um coletor dedicado (a cota de
-- build do Guara está estourada) e o PC não precisa ser alcançável.
--
-- ═══ POR QUE `alvo` É TEXTO E NÃO UMA FK ═══
--
-- O alvo pode ser uma URL oficial, um código de município (IBGE) ou um
-- identificador de lote — o grão muda por `tipo`. Por isso texto livre, e
-- a validação de URL (quando houver) é feita na BORDA, na rota, contra
-- uma allowlist de hosts (apps/web/lib/fila/allowlist.ts). Nunca tratar
-- esta tabela como um proxy SSRF genérico: a rota recusa host fora da
-- allowlist e NÃO busca o alvo — só o enfileira.
--
-- ═══ STATUS COMO VOCABULÁRIO FECHADO ═══
--
-- `pendente` → `processando` → `concluido` | `erro`. O CHECK impede
-- gravação de status inventado e é o que a rota e o puller podem confiar.
-- `tentativas` é separado do status de propósito: uma linha pode voltar a
-- `pendente` depois de uma falha transitória e o contador preservar a
-- história (o puller desiste ao chegar no teto).
--
-- ═══ IDEMPOTÊNCIA DO SEMEIO (SEM INUNDAR A FILA) ═══
--
-- O cron bate de 15 em 15 minutos. Sem proteção, cada batida repetiria os
-- mesmos alvos. O índice único PARCIAL abaixo só considera o que ainda vai
-- rodar (`pendente`/`processando`): semear de novo um alvo já na fila cai
-- no `ON CONFLICT DO NOTHING` e não duplica; o mesmo alvo JÁ processado
-- pode voltar depois (recoleta futura), porque `concluido`/`erro` ficam
-- fora do índice.

create table if not exists fila_coleta (
  id            uuid primary key default gen_random_uuid(),
  -- O que fazer com o alvo. Fechado em CHECK: a nuvem e o PC precisam
  -- concordar sobre o verbo, e verbo novo exige migration (decisão
  -- consciente, não acidente).
  tipo          text not null
                  check (tipo in (
                    'coletar',       -- buscar o dado na fonte oficial
                    'resumir',       -- microresumo cívico do conteúdo
                    'classificar',   -- encaixar em tema/tag
                    'extrair',       -- retirar campo estruturado do texto
                    'triar'          -- separar o que interessa do ruído
                  )),
  -- URL oficial, código IBGE ou identificador de lote. Ver a nota do
  -- cabeçalho: a validação de host vive na rota, não aqui.
  alvo          text not null,
  -- Pedido em JSON (ex.: {"uf":"MG","ano":2025}). NUNCA segredo:
  -- o puller remove campos sensíveis antes de montar o prompt (AGENTS §5.8).
  payload       jsonb not null default '{}'::jsonb,
  status        text not null default 'pendente'
                  check (status in ('pendente', 'processando', 'concluido', 'erro')),
  -- Resposta já digerida (resumo, classificação, confiança). Nulo enquanto
  -- não processado. Erro guarda o motivo aqui também, para auditoria.
  resultado     jsonb,
  tentativas    integer not null default 0,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table fila_coleta is
  'Fila "coletar na nuvem, digerir no PC": a nuvem semeia (POST /api/fila/semear), '
  'o home-pc puxa e roda Ollama local. O banco é o quadro de recados; dado bruto não mora aqui.';
comment on column fila_coleta.tipo is
  'Verbo da tarefa: coletar | resumir | classificar | extrair | triar. Fechado em CHECK.';
comment on column fila_coleta.alvo is
  'URL oficial, código IBGE ou id de lote. Host validado na rota contra allowlist — nunca proxy SSRF.';
comment on column fila_coleta.resultado is
  'Resposta digerida do modelo. Sugestão de máquina: não substitui o dado, só embrulha (AGENTS §7).';
comment on column fila_coleta.tentativas is
  'Contador de falhas. O puller devolve a linha para pendente até o teto e então marca erro.';

-- O puller busca sempre "os mais antigos pendentes": índice que casa com
-- `where status = 'pendente' order by criado_em`.
create index if not exists fila_coleta_status_criado_idx
  on fila_coleta (status, criado_em);

-- "quantas tarefas de cada verbo" no painel de acompanhamento.
create index if not exists fila_coleta_tipo_idx
  on fila_coleta (tipo);

-- Idempotência do semeio: um alvo NÃO pode aparecer duas vezes enquanto
-- ainda está na fila. Processado (concluido/erro) fica fora e pode voltar.
create unique index if not exists fila_coleta_pendente_unico_idx
  on fila_coleta (tipo, alvo)
  where status in ('pendente', 'processando');

-- Sem GRANT para `anon`/`authenticated` de propósito: a fila é canal
-- INTERNO entre a nuvem e o PC. Expor ao PostgREST significaria deixar
-- qualquer leitor ver os alvos e resultados em trânsito. O acesso é só
-- pelo pool do app (mesmo usuário dono) e pelo puller.
