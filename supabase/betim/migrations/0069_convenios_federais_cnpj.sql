-- Grava o CNPJ do convenente em `convenios_federais` — o dado já chega na
-- resposta da API do Portal da Transparência e `_map_row()` (em
-- `etl/betim/etl/apis/transparencia_gov.py`) o descartava, gravando só
-- `convenente_nome`. Achado medido ao vivo em 2026-08-13
-- (docs/FONTES-FLUXO-FINANCEIRO.md §1.3): o JSON de cada convênio já traz
--
--   "convenente": {
--     "cpfFormatado": "",
--     "cnpjFormatado": "22.733.919/0001-27",
--     "nome": "..."
--   }
--
-- É o que destrava o cruzamento cnpj_raiz × dinheiro público para convênio,
-- do mesmo jeito que `contratos.fornecedor_cnpj` já destrava para PNCP.
--
-- ═══ POR QUE NÃO HÁ COLUNA DE CPF, NEM MASCARADO ═══
--
-- Convênio de pessoa física (testado ao vivo em Belo Horizonte) vem com
-- `cpfFormatado` JÁ MASCARADO pela própria fonte federal
-- (`***.918.086-**`) — a API do governo entrega pronto para publicação, sem
-- trabalho de redação do nosso lado. Mesmo assim, esta migration NÃO abre
-- coluna para ele. O repositório é PÚBLICO e já vazou seis CPF reais de
-- pessoa física por comentário de código em 13/08/2026 (ver o cabeçalho de
-- `scripts/checar-dado-pessoal.py`) — a regra deste projeto depois disso é
-- não gravar CPF em lugar nenhum, mascarado ou não, para não abrir mais uma
-- coluna que alguém preencha com o dado inteiro por engano no futuro. CNPJ
-- de pessoa jurídica não é dado pessoal (LGPD art. 5º, I — "pessoa natural
-- identificada"), e vem SEM máscara na fonte: pode ser gravado inteiro.
--
-- `cnpj_convenente`: o CNPJ formatado como a fonte publica, só para PJ.
-- `cnpj_raiz`: os 8 primeiros dígitos, mesma convenção de
-- `ambiental_licenciamento.cnpj_raiz` (migration 0064) — é a chave que liga
-- convênio a licença ambiental sem distinguir matriz de filial.
alter table convenios_federais
  add column if not exists cnpj_convenente text,
  add column if not exists cnpj_raiz char(8);

create index if not exists convenios_federais_cnpj_raiz_idx
  on convenios_federais (cnpj_raiz) where cnpj_raiz is not null;
