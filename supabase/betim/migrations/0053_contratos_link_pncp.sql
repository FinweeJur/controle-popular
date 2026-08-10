-- Todo contrato passa a ter para onde apontar.
--
-- ═══ O DEFEITO, MEDIDO ═══
--
-- `contratos.link_fonte` estava NULO em **1.268 de 1.268** linhas — 100%. O
-- coletor lia `urlContrato` e `linkSistemaOrigem` da API do PNCP, e os dois
-- vêm vazios em contrato municipal. Efeito na tela: a lista mostrava objeto,
-- fornecedor, valor e ALERTA, e não oferecia nenhum jeito de conferir. Um
-- portal que acusa e não deixa verificar pede confiança — que é o contrário
-- do que este projeto existe para fazer.
--
-- (`licitacoes` não tinha o problema: 1.126 de 1.133 já trazem
-- `link_sistema_origem`. Era só de contratos.)
--
-- ═══ A CORREÇÃO NÃO PRECISA DE COLETA NOVA ═══
--
-- O endereço é função do número de controle, que toda linha já tem:
--
--     18715391000196-2-000048/2025
--     └── CNPJ ──┘ │ └ seq ┘ └ano┘
--                  └ tipo (2 = contrato)
--
--     -> https://pncp.gov.br/app/contratos/18715391000196/2025/000048
--
-- Conferido no navegador, e não por código HTTP: o PNCP é uma SPA e devolve
-- **200 para qualquer caminho**, inclusive inventado — testar com `curl` daria
-- verde para uma URL errada. A verificação que vale é abrir e ler: esta URL
-- renderiza o contrato ADM0049/2025 de Betim, R$ 22.225.169,94, fornecedor
-- OBJETIVA PROJETOS, batendo com a linha do banco.
--
-- OS ZEROS À ESQUERDA FICAM. `000048` é o que a rota espera.
--
-- ═══ POR QUE O `where` TEM A REGEX ═══
--
-- Número fora do formato não vira link torto: fica nulo. Um botão "ver no
-- PNCP" que abre 404 é pior que a ausência do botão — promete conferência e
-- entrega beco sem saída, e o usuário conclui que o dado é inventado.
--
-- Novas linhas já nascem com o link (`etl/pncp/contratos.py::link_do_contrato`).
-- Este update é só para as que já estavam gravadas.

update contratos
   set link_fonte = 'https://pncp.gov.br/app/contratos/'
                 || split_part(numero_controle_pncp, '-', 1) || '/'
                 || split_part(numero_controle_pncp, '/', 2) || '/'
                 || split_part(split_part(numero_controle_pncp, '/', 1), '-', 3)
 where link_fonte is null
   and numero_controle_pncp ~ '^\d{14}-\d+-\d+/\d{4}$';
