-- Completa `municipios.fontes.sic_prefeitura` / `sic_camara` para Araçuaí,
-- Itinga e Diamantina — as três cidades do Vale do Jequitinhonha semeadas em
-- `0043_seed_vales_jequitinhonha.sql` nunca receberam essas chaves, então
-- `PedidoLAI.tsx` (que lê exatamente `fontes.sic_prefeitura`/`sic_camara`,
-- ver o componente) não mostrava o botão "Abrir portal de LAI" pra nenhuma
-- das três — o rascunho de pedido aparecia, mas sem link pro canal oficial.
--
-- URLs conferidas ao vivo em 2026-08-13 e documentadas em
-- `docs/LAI-PORTAIS.md` (worktree `worktree/lai-portais`), mesmo método de
-- `0040_canais_de_acao_cidada.sql`: WebFetch, HTTP 200, conteúdo confirma o
-- formulário/fluxo de e-SIC.
--
-- ═══ O QUE NÃO ENTRA AQUI, DE PROPÓSITO ═══
--
-- Câmara de Araçuaí: nenhum canal de e-SIC/LAI foi encontrado no site
-- institucional (SAPL) — só um e-mail de "Fale Conosco" não confirmado como
-- canal formal. Gravar isso em `sic_camara` faria `PedidoLAI.tsx` oferecer um
-- botão pra um endereço que não é, comprovadamente, o canal de LAI da Casa.
-- Ausência da chave é o que já faz o botão não aparecer — comportamento
-- correto aqui, não uma lacuna a preencher com palpite.
--
-- Câmara de Diamantina: `cmdiamantina.mg.gov.br` devolve HTTP 403 a acesso
-- automatizado e `camaradiamantina.cam.mg.gov.br` tem certificado TLS que não
-- bate com o host — nenhum dos dois foi possível abrir e confirmar. Mesmo
-- motivo: melhor nenhum botão que um botão pra um site que não confirmamos
-- ser o canal oficial.
--
-- Prefeitura de Diamantina: o link direto pro e-SIC
-- (`portaltransp.com.br/contato-e-sic`) mostrou o aviso "Referência a
-- Prefeitura perdida" quando aberto fora do fluxo normal do site — não é um
-- link estável pra gravar como "o" portal. Em vez disso, `sic_prefeitura`
-- aqui aponta pro portal institucional (`diamantina.mg.gov.br/portal/`), de
-- onde o link "Portal da Transparência" → "Contato e-SIC" FUNCIONA — é o
-- caminho que o documento de pesquisa recomenda para não entregar link
-- quebrado.
update municipios
   set fontes = coalesce(fontes, '{}'::jsonb)
              || jsonb_build_object('sic_prefeitura', v.sic_prefeitura)
              || case
                   when v.sic_camara is not null
                     then jsonb_build_object('sic_camara', v.sic_camara)
                   else '{}'::jsonb
                 end
  from (values
          ('3103405', 'https://www.aracuai.mg.gov.br/transparencia/e-sic', null),
          ('3134004', 'https://www.itinga.mg.gov.br/esic', 'https://www.camaraitinga.mg.gov.br/esic'),
          ('3121605', 'https://www.diamantina.mg.gov.br/portal/', null)
       ) as v(id, sic_prefeitura, sic_camara)
 where municipios.id_municipio = v.id;
