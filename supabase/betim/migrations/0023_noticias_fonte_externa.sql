-- Curadoria de matérias de terceiros (pedido do usuário 2026-07-24:
-- "adicione algumas notícias replicadas do Mab.org.br... deixando claro
-- qual a fonte original e que estamos republicando").
--
-- IMPORTANTE: isto NÃO é republicação do texto original -- copiar e
-- hospedar o texto integral de outro veículo é violação de direito
-- autoral, atribuição não é licença. O que este site faz é resumo/
-- comentário PRÓPRIO com no máximo uma frase citada entre aspas, +
-- atribuição estruturada e link direto pra matéria original -- prática
-- de curadoria jornalística padrão, não republicação.
alter table noticias add column if not exists fonte_externa_nome text;
alter table noticias add column if not exists fonte_externa_url text;
