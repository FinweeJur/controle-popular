-- Canais de ação cidadã por cidade: e-SIC da Prefeitura, e-SIC da Câmara e
-- Ouvidoria (o destino do "Denunciar").
--
-- POR QUE ESTA MIGRATION EXISTE. A coluna "Ação cidadã" do rodapé apontava
-- para `href="#"` nos três itens. O comentário do componente explicava que
-- eram "intentional 404s for now, features not built yet" — e isso deixou de
-- ser verdade: o assistente de pedido de LAI (`PedidoLAI.tsx`) existe e
-- funciona há várias fases. O link nunca foi religado. Placeholder que
-- sobrevive ao recurso que ele esperava vira link quebrado em produção.
--
-- E UM LINK QUE EXISTIA MORREU. `sic_prefeitura` de BH apontava para
-- `prefeitura.pbh.gov.br/e-sic`, que hoje devolve **404** — conferido com
-- impressão digital de Chrome (`curl_cffi`), porque os portais da PBH
-- respondem 403 a cliente comum e um 403 seria confundido com bloqueio de
-- WAF. É 404 mesmo: a PBH moveu o serviço para `/lei-de-acesso-a-informacao`.
--
-- `sic_camara` estava NULO em BH e São Paulo, então o botão "Abrir portal de
-- LAI da Câmara" simplesmente não aparecia nessas duas cidades — some sem
-- avisar, que é o modo de falha mais difícil de notar.
--
-- Todas as sete URLs abaixo foram conferidas ao vivo em 2026-08-04 (HTTP 200
-- seguindo redirect). Duas notas de armadilha:
--   * a Ouvidoria de São Paulo responde em `prefeitura.sp.gov.br/w/servico/
--     ouvidoria`; `ouvidoria.prefeitura.sp.gov.br` NÃO resolve DNS.
--   * a Câmara de BH não tem página de e-SIC separada: o canal de LAI é a
--     própria Ouvidoria, em `/participe/fale-com-a-camara`, rotulada no site
--     como "Ouvidoria - Lei de Acesso à Informação".
update municipios
   set fontes = coalesce(fontes, '{}'::jsonb)
              || jsonb_build_object(
                   'sic_prefeitura', v.sic_prefeitura,
                   'sic_camara',     v.sic_camara,
                   'ouvidoria',      v.ouvidoria
                 )
  from (values
          ('3106705',
           'https://www.betim.mg.gov.br/portal/sic',
           'https://www.camarabetim.mg.gov.br/LAI/LeiAcesso',
           'https://www.betim.mg.gov.br/portal/ouvidoria'),
          ('3106200',
           'https://prefeitura.pbh.gov.br/lei-de-acesso-a-informacao',
           'https://www.cmbh.mg.gov.br/participe/fale-com-a-camara',
           'https://prefeitura.pbh.gov.br/ouvidoria'),
          ('3550308',
           'https://esic.prefeitura.sp.gov.br/',
           'https://www.saopaulo.sp.leg.br/transparencia/lei-de-acesso-informacao/',
           'https://prefeitura.sp.gov.br/w/servico/ouvidoria')
       ) as v(id, sic_prefeitura, sic_camara, ouvidoria)
 where municipios.id_municipio = v.id;
