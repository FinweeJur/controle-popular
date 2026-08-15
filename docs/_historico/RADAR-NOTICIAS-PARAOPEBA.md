# Radar de notícias do Paraopeba — coleta diária

> Escrito em 15/08/2026. Números medidos na execução, não estimados.

## O que é, e o que não é

`scripts/coletar-noticias-paraopeba.py` varre feeds públicos uma vez por dia e
grava `apps/web/data/noticias-paraopeba.json`, lido no **build** por
`apps/web/lib/paraopeba/radar.ts`.

Guarda **título, veículo, data e link**. Nunca o texto da matéria: reproduzir
reportagem é uso de obra de terceiro, e este portal publica material que vira
anexo de ofício. Título e link são citação; o corpo, não.

**Não substitui o clipping.** `lib/paraopeba/clipping.ts` é acervo histórico e
curado, com resumo de autoria de quem montou o painel-fonte, fechado num
período. O radar é varredura automática, sem curadoria. Os dois respondem
perguntas diferentes — "o que aconteceu no caso" e "o que saiu esta semana" — e
misturá-los apagaria a autoria de um e daria falsa curadoria ao outro.

## As fontes, e por que estas

| Fonte | O que traz | Por que está aqui |
|---|---|---|
| MAB | a voz de quem foi atingido | é parte no caso, e noticia o que não vira pauta |
| Agência Brasil | imprensa pública federal | licença aberta, cobre decisão judicial |
| Google Notícias (busca) | agregação ampla | é o que dá cobertura regional |

### A lacuna, que aparece na tela

**TJMG e MPMG ficaram de fora, e não por escolha:** os endereços de RSS dos
dois respondem **HTTP 404** (conferido em 14/08/2026 em
`tjmg.jus.br/rss/noticias.xml` e `mpmg.mp.br/rss`). São justamente as fontes
que publicariam a decisão em primeira mão. Enquanto não se achar o feed atual,
o alerta sobre ato judicial chega pela imprensa, com o atraso dela.

## Armadilhas medidas

1. **Todo feed é filtrado — inclusive o do MAB, e isso foi uma correção.** A
   primeira versão deixava o MAB passar inteiro, com o argumento de que ele
   "fala do assunto o tempo todo". A execução seca desmentiu: das 10 matérias
   da janela, a maioria era a pauta nacional do movimento (Pará, Tocantins,
   Amazônia, eleição). Um argumento plausível sobre o conteúdo de um feed vale
   menos que uma leitura dele.
2. **O filtro exige termo de LUGAR**, não de tema. "Barragem" e "atingidos"
   sozinhos deixam entrar rompimento de outro estado — notícia legítima, caso
   diferente. Com o filtro de lugar, a janela caiu de 22 para 11 itens, todos
   do caso.
3. **A busca do Google devolve o link do agregador, não o do veículo.** O
   `<source>` de cada item traz o nome real; sem ele, tudo apareceria como
   "news.google.com" e a tela mentiria sobre a origem.
4. **Data de RSS vem em formato de e-mail** (RFC 822), não ISO. Ordenar as
   strings sem converter põe agosto antes de julho, porque "A" < "J".
5. **Coleta vazia não sobrescreve o arquivo bom.** Um dia de rede ruim não pode
   esvaziar a tela — e "hoje não achei nada" é indistinguível de "hoje a rede
   caiu" para quem só olha o resultado.

## Rodar

```
python scripts/coletar-noticias-paraopeba.py            # coleta e grava
python scripts/coletar-noticias-paraopeba.py --seco     # mostra, não grava
python scripts/coletar-noticias-paraopeba.py --dias 30  # janela de retenção
```

Execução de 15/08/2026: **14 itens** na janela de 45 dias, 5 com sinal de ato
de autoridade.

## Agendar no servidor (`home-pc`)

O radar só chega ao site quando o site é reconstruído — então o lugar natural
dele é **antes do build**, na mesma rotina que já publica. Duas formas:

### Junto da rotina de publicação (preferido)

Acrescentar a chamada no início de `scripts/rotina-local.mts`. Vantagem: uma
coisa só roda, e nunca existe radar coletado que não foi publicado.

### Tarefa agendada própria

Se a publicação não for diária, uma tarefa do Agendador do Windows que só
coleta (o dado espera o próximo build):

```powershell
schtasks /create /tn "Radar Paraopeba" /tr "python X:\DevCoder\controle-popular\scripts\coletar-noticias-paraopeba.py" /sc daily /st 06:30
```

⚠️ **A data da coleta tem de aparecer na tela.** Como o radar é lido no build,
um site publicado há uma semana mostra notícia de uma semana atrás — e sem o
carimbo de data isso vira falsa impressão de tempo real. `gerado_em` existe
para isso.
