"""etl.noticias_seed — popula `noticias` com os primeiros achados/
explicadores do Controle Popular Betim (pedido do usuário 2026-07-24:
"portal noticias/blog que nem mab.org.br"). Conteúdo próprio (HTML
escrito aqui), não agregação de fonte externa -- cada post cita o dado
real já sincronizado no portal, não é redação genérica.

Rodar de novo é seguro: upsert por slug, nunca duplica.
"""
import argparse
import sys

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

POSTS = [
    {
        "slug": "prefeitura-16-lugar-transparencia-mg",
        "titulo": "Prefeitura de Betim é a 16ª mais transparente de Minas Gerais",
        "resumo": "No ranking oficial do PNTP (ATRICON), Betim aparece em 16º lugar entre 853 municípios mineiros — nível Ouro. A Câmara vem em 102º, nível Intermediário.",
        "categoria": "achado",
        "temas": ["administracao_publica"],
        "conteudo_html": """
<p>O Programa Nacional de Transparência Pública (PNTP), conduzido pela
ATRICON em parceria com os Tribunais de Contas estaduais, avalia todo
ano se prefeituras e câmaras publicam o que a Lei de Acesso à
Informação exige — e quão fácil é achar.</p>
<p>Em 2025, a <strong>Prefeitura de Betim ficou em 16º lugar entre 853
municípios avaliados em Minas Gerais</strong>, com índice de
transparência de 88,19% e nível <strong>Ouro</strong> — subiu do nível
Prata do ciclo anterior.</p>
<p>A <strong>Câmara Municipal</strong> avalia-se separadamente (é outro
órgão, com outra equipe responsável pela própria transparência) e
ficou em 102º lugar, índice 73,12%, nível <strong>Intermediário</strong>
— uma posição praticamente estável em relação ao ciclo anterior.</p>
<h2>O que isso não é</h2>
<p>Não é uma nota de honestidade nem de qualidade de gestão — é
especificamente sobre transparência ativa e passiva (o que é publicado
sem pedir, e como o órgão responde a um pedido via LAI).</p>
<p>Veja o detalhe completo em <a href="/nota-betim">Nota Betim</a>.</p>
""",
    },
    {
        "slug": "fornecedor-sancionado-ceis-grupo-med-center",
        "titulo": "Fornecedor da Prefeitura tem sanção ativa no cadastro federal de empresas punidas",
        "resumo": "A MED Center Comercial, que já vendeu remédios e materiais médicos pra Prefeitura, está no CEIS, o cadastro nacional de empresas impedidas de contratar com o poder público. Mas a sanção foi aplicada por outra cidade — e isso muda o que ela significa pra Betim.",
        "categoria": "achado",
        "temas": ["administracao_publica", "saude"],
        "conteudo_html": """
<p>Um levantamento do Controle Popular Betim encontrou 16 fornecedores
da Prefeitura com sanção ativa no CEIS/CNEP, o cadastro federal que
reúne empresas impedidas ou consideradas inidôneas para contratar com
o poder público. Pela Lei de Licitações (Lei 14.133/2021), empresa
nessa situação não pode fechar contrato novo com a Administração
enquanto a punição durar.</p>
<p>Um dos casos ajuda a entender por que o assunto é mais complicado do
que parece. A <strong>MED Center Comercial</strong> — que já vendeu
medicamentos pra Prefeitura de Betim e integra o mesmo grupo de
empresas por trás do "Grupo MED Center" — está com uma sanção de
impedimento válida até 2026. Só que essa punição foi aplicada pela
Prefeitura de Sapezal, no Mato Grosso, depois de um problema num
contrato lá — e o próprio processo definiu que ela vale só dentro da
esfera municipal de Sapezal, não em qualquer cidade do país.</p>
<h2>Por que isso importa</h2>
<p>Existe uma diferença real na lei entre um impedimento administrativo
como esse, que pode valer só pro município que aplicou a punição, e uma
declaração de inidoneidade por improbidade, que aí sim vale em todo o
Brasil. Tratar as duas situações como se fossem a mesma coisa faria
parecer que qualquer contrato dessa empresa em Betim é irregular — o
que a lei não afirma. Os contratos da Prefeitura com fornecedores
sancionados podem ser conferidos, caso a caso, em
<a href="/prefeitura/contratos">Contratos da Prefeitura</a>.</p>
""",
    },
    {
        "slug": "minimos-constitucionais-saude-educacao-corrigidos",
        "titulo": "Betim gasta bem acima do mínimo obrigatório em saúde e educação",
        "resumo": "A Constituição exige que a Prefeitura aplique pelo menos 15% da receita em saúde e 25% em educação. Um levantamento mostra que Betim ficou acima dos dois mínimos em todos os anos entre 2015 e 2024, com folga considerável.",
        "categoria": "achado",
        "temas": ["saude", "educacao", "administracao_publica"],
        "conteudo_html": """
<p>Todo município brasileiro é obrigado por lei a aplicar uma fatia
mínima da própria arrecadação em saúde e educação — pelo menos 15% em
saúde e 25% em educação, calculados sobre impostos e repasses
constitucionais como o FPM e a cota-parte do ICMS (Constituição
Federal, Art. 198 §2º e Art. 212).</p>
<p>Um levantamento do Controle Popular Betim, cruzando os balanços
publicados pela Prefeitura entre 2015 e 2024, mostra que Betim ficou
acima dos dois mínimos em todos esses anos — entre 38% e 54% em saúde,
entre 37% e 60% em educação, sempre bem além do exigido.</p>
<p>Pra chegar nesse número corretamente, é preciso comparar só a
despesa efetivamente paga (não o valor ainda em fase de empenho ou
liquidação) contra a base certa de receita — só impostos e as
transferências que a Constituição especifica, não a arrecadação total
do município, que inclui outras fontes que não entram nessa conta.</p>
<p>Mais detalhes de como cada número de saúde e educação é calculado
estão disponíveis em <a href="/metodologia">Metodologia dos alertas de
contrato</a>.</p>
""",
    },
    {
        "slug": "idh-pobreza-betim-dado-de-2010",
        "titulo": "Por que o IDH de Betim ainda é o do Censo de 2010",
        "resumo": "O Índice de Desenvolvimento Humano de Betim (0,749) e sua taxa de pobreza (7,04%) são calculados a partir do Censo 2010 — o Censo de 2022 já foi feito, mas nenhum órgão oficial processou esse indicador pra nenhum município brasileiro ainda.",
        "categoria": "explicador",
        "temas": ["administracao_publica"],
        "conteudo_html": """
<p>O Índice de Desenvolvimento Humano Municipal (IDHM) de Betim é
0,749, considerado alto — mas o número tem mais de dez anos: vem do
Censo de 2010, o mesmo usado desde então em praticamente qualquer
consulta oficial sobre desenvolvimento humano do município.</p>
<p>O motivo não é falta de dado recente sobre Betim especificamente —
é assim em todos os municípios do Brasil. O IDHM é calculado pelo PNUD
(Programa das Nações Unidas para o Desenvolvimento) usando os
microdados detalhados do Censo do IBGE, um processamento que leva anos
pra ficar pronto depois de cada Censo. O Censo de 2022 já foi realizado
há alguns anos, mas o PNUD ainda não publicou o IDHM municipal
calculado a partir dele — o dado oficial mais recente que existe para
qualquer cidade brasileira continua sendo o de 2010.</p>
<p>O mesmo vale pra taxa de pobreza de Betim (7,04%): é calculada pela
mesma metodologia censitária, e está igualmente presa a 2010 até que o
PNUD publique a atualização.</p>
""",
    },
    # --- Repercussão de reportagem de terceiro (MAB) -- pedido do
    # usuário 2026-07-24: "adicione algumas notícias replicadas do
    # Mab.org.br... deixando claro qual a fonte original e que estamos
    # republicando". NÃO é republicação -- copiar e hospedar o texto de
    # outro veículo é violação de direito autoral, atribuição não é
    # licença. Os 3 posts abaixo são resumo/comentário PRÓPRIO dos
    # fatos relatados pelo MAB (lidos e reescritos, nunca copiados),
    # com atribuição estruturada (fonte_externa_nome/url) e link direto
    # pra matéria original -- é assim que qualquer curadoria séria
    # cita reportagem de terceiro.
    {
        "slug": "justica-mantem-auxilio-emergencial-brumadinho-paraopeba",
        "titulo": "Justiça mantém auxílio emergencial pra atingidos de Brumadinho na Bacia do Paraopeba",
        "resumo": "O TJMG confirmou a continuidade do auxílio emergencial pago às famílias atingidas pelo rompimento da barragem da Vale, negando o recurso da mineradora para encerrar o pagamento.",
        "categoria": "curadoria",
        "temas": ["meio_ambiente", "assistencia_social"],
        "fonte_externa_nome": "MAB — Movimento dos Atingidos por Barragens",
        "fonte_externa_url": "https://mab.org.br/2026/03/26/auxilio-emergencial-na-bacia-do-paraopeba-entenda-em-5-pontos/",
        "conteudo_html": """
<p>Em março de 2026, o Tribunal de Justiça de Minas Gerais confirmou a
continuidade do auxílio emergencial pago às famílias atingidas pelo
rompimento da barragem da Vale em Brumadinho (2019), negando mais uma
tentativa da mineradora de encerrar o benefício. É o que relata o MAB
(Movimento dos Atingidos por Barragens) em reportagem publicada em seu
site.</p>
<p>Segundo o MAB, o pagamento é administrado pelo Judiciário em
conjunto com a FGV e feito mensalmente, com valores diferentes para
quem morava nas áreas de risco direto e para o restante da população
atingida da Bacia do Paraopeba — hoje restrito a quem já recebia o
antigo Programa de Transferência de Renda, algo que o próprio
movimento considera insuficiente e defende ampliar.</p>
<p>A Vale, segundo a reportagem, continua recorrendo pra tentar
encerrar o programa — o recurso mais recente (uma "Reclamação") ainda
aguardava julgamento pelo colegiado do TJMG na época da publicação.</p>
""",
    },
    {
        "slug": "mineradoras-acionam-stf-contra-pnab-auxilio-emergencial",
        "titulo": "Mineradoras acionam o STF pra tentar suspender o auxílio emergencial da Bacia do Paraopeba",
        "resumo": "O instituto que representa as mineradoras entrou no STF contra a aplicação da lei que protege atingidos por barragens ao caso Brumadinho — mais de 160 mil pessoas na Bacia do Paraopeba ficaram sob risco de perder o benefício.",
        "categoria": "curadoria",
        "temas": ["meio_ambiente", "assistencia_social"],
        "fonte_externa_nome": "MAB — Movimento dos Atingidos por Barragens",
        "fonte_externa_url": "https://mab.org.br/2026/04/02/mineradoras-acionam-stf-contra-a-pnab-e-ameacam-auxilio-emergencial/",
        "conteudo_html": """
<p>Em abril de 2026, o instituto que representa as mineradoras (a
pedido da Vale) levou ao Supremo Tribunal Federal uma ação contestando
a aplicação da PNAB — a Política Nacional de Proteção às Populações
Atingidas por Barragens (Lei 14.755/2023) — ao caso do rompimento da
barragem em Brumadinho. É o que relata o MAB (Movimento dos Atingidos
por Barragens) em seu site.</p>
<p>Segundo a reportagem, a ação argumenta que aplicar a PNAB ao acordo
já fechado em 2021 violaria a Constituição — e, na prática, colocou em
risco a continuidade do auxílio emergencial pago a mais de 160 mil
pessoas da Bacia do Paraopeba a partir de abril de 2026, incluindo
segurança alimentar, acesso à água e tratamentos de saúde em
andamento.</p>
<p>O MAB destaca que as instâncias inferiores da Justiça mineira vinham
decidindo de forma favorável às famílias atingidas nesse mesmo tema,
até então.</p>
""",
    },
    {
        "slug": "vale-nao-venceu-recursos-auxilio-emergencial-maio-2026",
        "titulo": "Vale ainda não venceu nenhum recurso contra o auxílio emergencial, diz MAB",
        "resumo": "Atualização de maio de 2026: o auxílio segue valendo enquanto a disputa judicial continua no STF e no STJ, com manifestações do TJMG e da AGU a favor da continuidade do pagamento.",
        "categoria": "curadoria",
        "temas": ["meio_ambiente", "assistencia_social"],
        "fonte_externa_nome": "MAB — Movimento dos Atingidos por Barragens",
        "fonte_externa_url": "https://mab.org.br/2026/05/15/nota-atualizacoes-sobre-a-luta-do-auxilio-emergencial-na-bacia-do-paraopeba/",
        "conteudo_html": """
<p>Numa atualização publicada em maio de 2026, o MAB (Movimento dos
Atingidos por Barragens) informa que a Vale, até aquele momento, não
tinha vencido nenhum dos recursos movidos contra o auxílio emergencial
da Bacia do Paraopeba — o benefício seguia valendo normalmente enquanto
a disputa corria no Judiciário.</p>
<p>Segundo a reportagem, tanto o Tribunal de Justiça de Minas Gerais
quanto a Advocacia-Geral da União se manifestaram ao STF defendendo a
manutenção das decisões favoráveis às famílias atingidas — a AGU
argumentando que os danos do rompimento da barragem continuam em
curso, não se esgotaram na data do desastre nem no acordo judicial já
fechado.</p>
<p>O MAB relata ainda que, depois do STJ negar um pedido urgente da
Vale pra suspender o pagamento, a mineradora recorreu de novo ao mesmo
tribunal.</p>
""",
    },
]


def sync(id_municipio: str) -> None:
    client = get_supabase_client()
    rows = []
    for post in POSTS:
        rows.append(
            {
                "id_municipio": id_municipio,
                "slug": post["slug"],
                "titulo": post["titulo"],
                "resumo": post["resumo"],
                "conteudo_html": post["conteudo_html"].strip(),
                "categoria": post["categoria"],
                "temas": post["temas"],
                "autor": "Controle Popular Betim",
                "fonte_externa_nome": post.get("fonte_externa_nome"),
                "fonte_externa_url": post.get("fonte_externa_url"),
            }
        )
    client.table("noticias").upsert(rows, on_conflict="id_municipio,slug").execute()
    print(f"[etl.noticias_seed] publicados={len(rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.noticias_seed] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
