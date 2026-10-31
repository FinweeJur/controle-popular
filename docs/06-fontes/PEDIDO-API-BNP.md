# Pedido de acesso à API do Pangea/BNP

> Rascunho para envio ao CNJ / PDPJ-Br. Base: Resolução CNJ nº 444/2022,
> Portaria CNJ nº 116/2022, Lei nº 12.527/2011 (LAI), Lei nº 13.709/2018
> (LGPD) e Resolução CNJ nº 363/2021.
> Medições que sustentam o pedido: `FONTES-PENAL-DESASTRE.md` e este arquivo.

## Para quem

- CNJ — Departamento de Pesquisas Judiciárias / PDPJ-Br
- Cópia: Secretaria de Tecnologia da Informação do CNJ

## Assunto

Acesso técnico ao Banco Nacional de Precedentes (Pangea/BNP) para projeto de
transparência cívica.

## Texto

Prezados(as),

Sou responsável pelo **Controle Popular** (controlepopular.com.br), portal
cívico sem fins comerciais que reúne e traduz dados públicos do Judiciário
para a população atingida por grandes desastres — em especial o rompimento da
barragem de Fundão (Mariana, 2015) e a ruptura da barragem de Brumadinho
(2019).

Publicamos hoje, com link para a fonte oficial, acórdãos dos tribunais
estaduais e do STF, além das súmulas federais. O que falta é justamente o que o
BNP organiza: **precedentes qualificados** — repercussão geral, recursos
repetitivos, IRDR, IAC, PUIL, orientações jurisprudenciais e súmulas — com
**questão**, **tese**, **situação** e **suspensão**.

Para o cidadão atingido, isso significa saber, em linguagem simples, qual tese
vinculante o Judiciário já firmou sobre o seu caso.

### O que pedimos

1. Existe **endpoint público de consulta** ao BNP (`/api/v1/precedentes` e
   correlatos) com contrato documentado? Qual o formato do corpo da requisição,
   os filtros disponíveis e os limites de uso?
2. Existe **exportação periódica** da base (CSV, JSON ou similar), como já
   ocorre com outros conjuntos do CNJ? Com que frequência e por qual canal?
3. Havendo necessidade de credenciamento, **qual o procedimento** e a quem
   endereçar?

### O que fazemos com o dado

- Publicação apenas de **campos de precedente**: tribunal, espécie, questão,
  tese, situação, datas, suspensão e **link para o documento oficial**.
- **Sem redistribuição da base bruta**; sem revenda; sem treinamento de modelo
  para terceiros.
- **Sem dado pessoal**: não coletamos nome de parte, CPF ou endereço. O portal
  já mascara CPF por mod-11 antes de publicar qualquer texto.
- **Atribuição** explícita ao CNJ/BNP e ao tribunal de origem em cada registro.

### Compromissos técnicos

- `User-Agent` identificado: `finweejur/github artur colito`.
- No máximo **1 requisição por segundo**, com cache local e coleta fora de
  horário de pico.
- Respeito integral a `robots.txt`, limites de taxa e eventuais janelas de
  manutenção.
- Registro de logs de acesso, disponível se solicitado.

### Por que não seguimos pela interface

A interface pública atende consulta humana, mas não permite acompanhar
mudanças de tese nem alimentar um acervo comparável ao longo do tempo. Sem
contrato de API, qualquer automatização seria frágil e poderia gerar carga
desnecessária nos servidores do CNJ — o que queremos evitar.

Ficamos à disposição para assinar termo de uso, apresentar o código do coletor
e ajustar o ritmo ao que o CNJ definir.

Atenciosamente,

**Artur Colito**
Controle Popular — controlepopular.com.br
`[e-mail]` · `[telefone]`

## Versão curta para Fala.BR

> Solicito, com base na Lei 12.527/2011, informação sobre a existência de API
> pública documentada ou exportação periódica do Banco Nacional de Precedentes
> (Pangea/BNP), criado pela Resolução CNJ 444/2022. Interessa o conjunto de
> precedentes qualificados com tribunal, espécie, questão, tese, situação e
> link oficial, para publicação cívica em portal sem fins comerciais, com
> atribuição ao CNJ e sem dado pessoal. Se houver credenciamento, informar o
> procedimento.

## O que fazer com a resposta

| Resposta | Próximo passo |
|---|---|
| API documentada | criar `scripts/coletar_bnp.py` com 1 req/s e checkpoint |
| Exportação periódica | baixar o arquivo e versionar só o recorte do projeto |
| Só credenciamento | assinar o termo e repetir o pedido com o número do ACT |
| Negativa | registrar em `docs/06-fontes/FONTES.md` e seguir com STF + súmulas |
