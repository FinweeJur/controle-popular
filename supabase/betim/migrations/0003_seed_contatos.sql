-- Betim.ai — seed: contatos úteis (plan F1.3)
-- Números nacionais + números locais confirmados via busca em 2026-07-20
-- (www.betim.mg.gov.br/portal/telefones/, camarabetim.mg.gov.br/utilidadepublica)

insert into contatos_uteis (id_municipio, nome, telefone, categoria, ordem) values
('3106705', 'Polícia Militar', '190', 'emergencia', 1),
('3106705', 'Corpo de Bombeiros', '193', 'emergencia', 2),
('3106705', 'SAMU', '192', 'emergencia', 3),
('3106705', 'Guarda Municipal de Betim (emergência)', '153', 'emergencia', 4),
('3106705', 'Guarda Municipal de Betim (central)', '(31) 3592-1327', 'emergencia', 5),
('3106705', 'Prefeitura Municipal de Betim (central 0800)', '0800 256 3236', 'prefeitura', 6),
('3106705', 'Secretaria Municipal de Segurança Pública de Betim', '(31) 3512-3041', 'prefeitura', 7),
('3106705', 'Câmara Municipal de Betim', '(31) 2010-3400', 'camara', 8);

-- [VERIFY em F5] confirmar se há mais números oficiais em
-- https://www.betim.mg.gov.br/portal/telefones/ e https://www.camarabetim.mg.gov.br/utilidadepublica/index
