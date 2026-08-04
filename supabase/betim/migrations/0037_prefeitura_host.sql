-- `fontes.prefeitura_host` — o site oficial da Prefeitura de cada cidade.
--
-- Existe porque `https://www.betim.mg.gov.br` estava escrito à mão em quatro
-- telas do eixo Cidades, inclusive numa em que o RÓTULO já era dinâmico
-- ("Prefeitura de Belo Horizonte") e só a URL era fixa. Rótulo certo sobre
-- link errado é pior que os dois errados: dá credibilidade ao destino.
--
-- Sem esta chave, `hostDaPrefeitura()` cai no Diário Oficial — que responde,
-- mas não é o site da Prefeitura, e um card de servidores creditado ao DOM
-- manda o leitor para o lugar errado por outro motivo.
--
-- As três URLs foram conferidas ao vivo em 2026-08-03 (HTTP 200 seguindo
-- redirect). Note que São Paulo NÃO usa `prefeitura.sp.gov.br` como endereço
-- principal: o portal do cidadão é `capital.sp.gov.br`.
update municipios
   set fontes = coalesce(fontes, '{}'::jsonb)
              || jsonb_build_object('prefeitura_host', v.host)
  from (values
          ('3106705', 'https://www.betim.mg.gov.br'),
          ('3106200', 'https://prefeitura.pbh.gov.br'),
          ('3550308', 'https://capital.sp.gov.br')
       ) as v(id, host)
 where municipios.id_municipio = v.id;
