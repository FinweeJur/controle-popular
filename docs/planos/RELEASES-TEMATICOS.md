# Releases temáticos — jornalistas e público do ambiental

> **Tipo:** PLANO
> **Domínio:** divulgação
> **Última medição:** 2026-10-02
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [PLANO-DIVULGACAO-ZERO-CUSTO.md](PLANO-DIVULGACAO-ZERO-CUSTO.md), [RELEASE-DIVULGACAO-2026-09.md](RELEASE-DIVULGACAO-2026-09.md), [PRODUTO.md](../01-produto/PRODUTO.md), [DIVULGACAO-LOG.md](../relatorios-automacao/DIVULGACAO-LOG.md)
> **Palavras-chave:** release, jornalista, ambiental, publico-alvo, imprensa, divulgacao, advogado, biologo, atingidos

## Sumário

- [Como usar este arquivo](#como-usar-este-arquivo)
- [Régua comum aos dois releases](#régua-comum-aos-dois-releases)
- [Release A — Jornalistas (transversal, um gancho por eixo)](#release-a--jornalistas-transversal-um-gancho-por-eixo)
- [Release B — Ambiental: todas as profissões do tema](#release-b--ambiental-todas-as-profissões-do-tema)
- [Envio e medição](#envio-e-medição)

Dois releases prontos para copiar e enviar. O geral (público amplo) vive no
[RELEASE-DIVULGACAO-2026-09.md](RELEASE-DIVULGACAO-2026-09.md); estes dois
são os recortes por público-alvo, previstos na seção "Releases por
público-alvo" do [plano de divulgação](PLANO-DIVULGACAO-ZERO-CUSTO.md).

## Como usar este arquivo

1. Troque `[NOME]`, `[VEÍCULO]` e `[DATA]` — nada mais precisa mudar.
2. Todos os números vêm com data de medição; **não troque número sem medir
   de novo** (regra do portal: número errado é dano).
3. Cada envio é uma linha nova no
   [DIVULGACAO-LOG.md](../relatorios-automacao/DIVULGACAO-LOG.md), com o UTM
   do segmento.
4. URL interna conferida no repositório em 02/10/2026 — se a rota mudar,
   reconfira antes de enviar.

## Régua comum aos dois releases

1. **Um número medido na abertura**, com a data da medição ao lado.
2. **Três a quatro ganchos**, cada um com a página-fonte em link.
3. **Bloco "o que ainda não existe"** — lacuna declarada é o argumento.
4. **CTA do público** — o que essa pessoa específica pode fazer agora.
5. **Assinatura ONSA** e contato `contato@controlepopular.com.br`.
6. **UTM próprio por segmento** para medir quem responde.

## Release A — Jornalistas (transversal, um gancho por eixo)

**UTM:** `?utm_source=imprensa&utm_medium=email&utm_campaign=divulgacao-2026-10&utm_content=jornalista`

**Assunto:** Quatro ganchos de pauta prontos: 46.273 registros públicos, TACs
ambientais, orçamento da Justiça de MG e editais do dia — com fonte em cada número

**PARA PUBLICAÇÃO OU APROVEITAMENTO IMEDIATO — [DATA]**

Olá [Nome],

Sou [nome], do projeto independente **controlepopular.com.br**. O portal
reúne **274 bases com 46.273 registros** de fontes oficiais (medido em
30/09/2026) em quatro eixos temáticos, sempre com o link da fonte ao lado de
cada número. Separei quatro ganchos de pauta, um por eixo:

1. **Terra e Território — 203 cidades e 853 municípios de MG:** contratos do
   PNCP, diários oficiais minerados e repasses federais reunidos em
   40.016 registros municipais (medido em 30/09/2026). As cavas de mineração
   são mapeadas por satélite, com aviso quando a atividade não tem cadastro
   na ANM: https://controlepopular.com.br/cidades e
   https://controlepopular.com.br/mineracao/cavas

2. **Direitos em Movimento — saúde, educação e informação pública:** SUS
   (CNES), IDEB, CAGED, 710 conselhos de direitos e um diretório de 445
   portais oficiais de transparência, com modelo de pedido de LAI pronto:
   https://controlepopular.com.br/direitos-em-movimento

3. **Estado e Economia — quem fiscaliza a Justiça de MG:** sete instituições
   com orçamento aberto, inclusive TJMG (R$ 14,96 bi/ano) e MPMG
   (R$ 4,09 bi/ano), com diárias, alimentação e verbas indenizatórias à
   vista, além das recomendações do CNJ: https://controlepopular.com.br/judiciario/instituicoes

4. **Central ONSA e Ferramentas — editais, biblioteca e API:** radar diário
   de licitações do Diário Oficial de MG, biblioteca com mais de 24 mil
   documentos e API pública aberta, sem chave, para análise de dados:
   https://controlepopular.com.br/editais e https://controlepopular.com.br/api

O portal não é aplicativo governamental nem tem vínculo partidário. Quando o
dado não existe, a tela diz que não existe — lacuna declarada, não escondida.
Código aberto (AGPL), método auditável: https://controlepopular.com.br/sobre

Se fizer sentido, envio planilha com as fontes, release completo ou roteiro
de entrevista. Contato: contato@controlepopular.com.br (resposta em até 48 h).

Abraço,
[nome]

## Release B — Ambiental: todas as profissões do tema

**UTM base:** `?utm_source=email&utm_medium=email&utm_campaign=divulgacao-2026-10&utm_content=ambiental-[profissao]`
(profissao: `advogado`, `biologo`, `engenheiro`, `jornalista-ambiental`,
`atingidos`, `pesquisador`)

O mesmo texto serve as seis profissões; só o parágrafo de abertura e o CTA
final mudam. Use a tabela como guia de personalização:

| Profissão | Ângulo na abertura | Porta de entrada | CTA final |
|---|---|---|---|
| Advogado ambiental | TACs, crimes socioambientais, legislação anotada, decisões de LAI | `/ambiental/tac`, `/ambiental/crimes-socioambientais`, `/ambiental/legislacao` | "Baixe o CSV de cada tabela para sua petição" |
| Biólogo / ecólogo | barragens, cavas por satélite, CAR, clima | `/ambiental/barragens`, `/mineracao/cavas`, `/funcaosocialterra`, `/ambiental/clima-risco` | "Use os dados citados com a fonte oficial" |
| Engenheiro / técnico | condicionantes de barragem, licenciamento em 11 UFs, outorgas | `/ambiental/condicionantes`, `/ambiental/licenciamento`, `/ambiental/nossos-rios` | "Confira o processo na fonte oficial ao lado" |
| Jornalista ambiental | pauta pronta com número e fonte | `/ambiental` + `/imprensa` | "Peça a planilha: contato@controlepopular.com.br" |
| Atingidos e lideranças | execução do acordo mês a mês, alerta de barragem, pedido de LAI | `/paraopeba`, `/ambiental/mariana`, `/alertas` | "Acompanhe a sua bacia pelo celular, sem cadastro" |
| Pesquisador | API aberta, CSV com BOM, citação ABNT nas matérias | `/api`, `/noticias` | "Cite o portal com a metodologia em /sobre" |

**Assunto:** Meio ambiente em 47 páginas públicas: licenciamento, TACs,
barragens e execução de Mariana e Brumadinho — com fonte em cada número

**PARA PUBLICAÇÃO OU APROVEITAMENTO IMEDIATO — [DATA]**

Olá [Nome],

Sou [nome], do projeto independente **controlepopular.com.br**. O portal tem
**47 páginas públicas de meio ambiente** (medido em 02/10/2026), organizadas
para quem trabalha com o tema — do advogado ambiental ao atingido pela
barragem. Os números da abertura vêm de cada fonte oficial, com link ao lado:

- **Licenciamento ambiental em 11 UFs**, com processos e audiências
  públicas: https://controlepopular.com.br/ambiental/licenciamento
- **Termos de Ajustamento de Conduta (TAC)** do IBAMA e órgãos estaduais,
  com execução financeira: https://controlepopular.com.br/ambiental/tac
- **Crimes socioambientais e jurisprudência** (Tema 681 e Tema 1.204 do STJ)
  reunidos para uso em peça: https://controlepopular.com.br/ambiental/crimes-socioambientais
- **Legislação anotada**, com 8.570 normas federais do MMA e a estadual de
  MG na mesma tabela: https://controlepopular.com.br/ambiental/legislacao
- **Barragens e condicionantes**, com o cadastro da ANM e o monitoramento de
  estabilidade: https://controlepopular.com.br/ambiental/barragens
- **Cavas de mineração por satélite** — a atividade sem cadastro na ANM é
  apontada como lacuna, não escondida: https://controlepopular.com.br/mineracao/cavas
- **Execução dos acordos**: Mariana (repactuação de R$ 171 bilhões) e
  Brumadinho (acordo global de R$ 37,7 bilhões, com R$ 5,48 bilhões para os
  26 municípios do Paraopeba), acompanhadas mês a mês com documentos:
  https://controlepopular.com.br/ambiental/mariana e
  https://controlepopular.com.br/paraopeba/execucao

**O que ainda não existe, e a tela diz isso:** a outorga de água da ANM/IGAM
chegou sem registros legíveis na base de 30/09/2026; o cadastro de terras
devolutas do INCRA não é publicado pelo órgão — a ausência é o achado. O
portal declara lacuna em vez de preencher com estimativa.

[PARÁGRAFO PERSONALIZADO PELA PROFISSÃO — use a coluna "Ângulo" da tabela acima]

O portal é independente, sem vínculo com governo ou partido, gratuito e sem
cadastro. Todo número traz o link da fonte oficial; código aberto e
metodologia em https://controlepopular.com.br/sobre

Contato: contato@controlepopular.com.br (resposta em até 48 h).

Abraço,
[nome]

## Envio e medição

| Etapa | O que fazer |
|---|---|
| 1 | Personalize abertura e CTA pela tabela de profissões |
| 2 | Confira os links clicando neles (URLs conferidas em 02/10/2026) |
| 3 | Envie e registre a linha em [DIVULGACAO-LOG.md](../relatorios-automacao/DIVULGACAO-LOG.md) |
| 4 | Compare a taxa de resposta por `utm_content` a cada 7 dias |

Meta honesta da 1ª rodada (mesma régua do plano-mãe): 10% de resposta,
2 a 3 publicações ou menções no primeiro mês. Quem respondeu "manda a
planilha" ganha follow-up em 10 dias úteis — o log guarda a data.
