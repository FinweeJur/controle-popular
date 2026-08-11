-- Itinga declara o coletor de câmara `simplesystem` (etl/camaras/simplesystem.py)
-- e corrige `camara_proposicoes`, que a 0043 tinha marcado `false` por engano.
--
-- ═══ O ACHADO DESTA SESSÃO: A CÂMARA TEM MÓDULO DE PROPOSIÇÕES, SIM ═══
--
-- A 0043 registrou `camara_proposicoes: false` com o comentário "a Câmara de
-- Itinga não tem módulo de proposições nenhum" — medição feita em cima do
-- link "Documentos Públicos" do menu principal do site, que devolve HTTP 500
-- (controller PHP ausente). O que não tinha sido achado é que a seção real
-- de publicações do site, `/publicacao`, FUNCIONA e roda o CMS de um
-- fornecedor à parte ("Desenvolvido por Simple System", PDFs hospedados em
-- `pub.simpless.com.br`) com 27 categorias — a mesma câmara que a 0043 media
-- como vazia tem, medido hoje, 500 Indicações, 83 Projetos de Leis/Emendas,
-- 64 Requerimentos, 27 Portarias, 6 Decretos, 6 Resoluções, 3 Moções e mais
-- 10 categorias sem tabela correspondente ainda (Licitações, Editais,
-- Reuniões, Prestação de Contas, Convênios, LDO/LOA/PPA, Regimento Interno,
-- Documentos Oficiais, Pedidos de Providências — ver docstring do coletor
-- para a lista completa e por que cada uma ficou de fora desta rodada).
--
-- `camara_proposicoes` vira `true`: a página deixa de estar permanentemente
-- vazia porque agora tem o que mostrar.
--
-- ═══ `camara_simplesystem_categorias` — o mapa completo das 27 categorias ═══
--
-- Os ids (595, 597, 600...) são de INSTALAÇÃO desta câmara — não são fixos
-- por fornecedor como os endpoints do SysSolution. O coletor busca
-- `listarCategoria/` a cada rodada e casa por NOME, então esta chave não é
-- lida em runtime — é o registro de auditoria pedido nesta tarefa: prova de
-- que as 27 categorias foram enumeradas (não só as 3 confirmadas
-- manualmente antes de escrever o coletor) e de qual id era qual no momento
-- desta migration, caso o fornecedor troque nome de categoria e a busca por
-- nome pare de casar.
update municipios
   set fontes = coalesce(fontes, '{}'::jsonb) || jsonb_build_object(
         'camara_coletor', 'simplesystem',
         'camara_sistema', 'Simple System',
         'camara_proposicoes', true,
         'legislacao_fonte', 'camara_simplesystem',
         'camara_simplesystem_categorias', jsonb_build_object(
           'CONVÊNIO ESTADUAL', 588,
           'CONVÊNIO FEDERAL', 589,
           'CONVÊNIOS', 580,
           'DECRETOS', 574,
           'DOCUMENTOS OFICIAIS', 594,
           'EDITAIS', 592,
           'EMENTA DA LEI ORGANICA', 584,
           'INDICAÇÕES', 595,
           'LEI 12.527/2011', 590,
           'LEI 14.129/2021', 591,
           'LEI DE DIRETRIZES ORÇAMENTÁRIAS', 593,
           'LEI ORGÂNICA', 578,
           'LEIS', 581,
           'LEIS COMPLEMENTARES', 577,
           'LEIS ORÇAMENTARIAS ANUAIS', 582,
           'LICITAÇOES', 572,
           'MOÇÕES', 586,
           'PEDIDOS DE PROVIDÊNCIAS', 596,
           'PLANO PLURIANUAL', 583,
           'PORTARIAS', 573,
           'PRESTAÇÃO DE CONTAS', 579,
           'PROJETOS DE LEIS', 600,
           'PROPOSIÇÕES', 597,
           'REGIMENTO INTERNO', 587,
           'REQUERIMENTOS', 585,
           'RESOLUÇÕES', 575,
           'REUNIÕES', 601
         )
       )
 where id_municipio = '3134004';
