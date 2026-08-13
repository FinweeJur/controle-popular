# Plano: guardar cópia dos documentos que o portal cita

> Pedido do dono em 13/08/2026: *"é possível baixar os PDFs / documentos que
> estamos referenciando nos links e guardar dentro do nosso servidor ou do
> Cloudflare? Assim, mesmo se o link quebrar, temos o documento — mas sem
> excluir o link, para também mostrar de onde veio a fonte oficial."*
>
> Este documento é o plano. Números marcados como medidos foram contados
> contra o Postgres local na data.

## Por que isto não é zelo excessivo

A auditoria de hiperlinks do mesmo dia bateu em 129 URLs externas e achou
**7 quebradas**, entre elas duas de fonte oficial que morreram por TLS e duas
subpáginas de órgão que simplesmente sumiram. E a amostra de 42 links de fonte
guardados no banco (universo de ~25,7 mil) achou 1 quebrado.

O caso que dá nome ao problema apareceu no mesmo dia. A **Lei Ordinária
726/2025 de Araçuaí** altera o zoneamento da APA da Chapada do Lagoão, e a
única prova pública dela, no portal, é um link para
`sapl.aracuai.mg.leg.br/norma/429`. Câmara municipal troca de sistema de
gestão legislativa com alguma frequência; quando trocar, aquele endereço
morre. E com ele morre a prova de que a área protegida foi mexida.

**O link é a autoridade. A cópia é a permanência. Não dá para escolher entre
as duas** — por isso o pedido é explícito em manter o link original visível.

## O universo, medido em 2026-08-13

| Tabela | Linhas | Coluna de URL |
|---|---:|---|
| `proposicoes` | 13.317 | `link_fonte`, `url_fonte`, `url_inteiro_teor` |
| `atos_oficiais` | 10.317 | `link_fonte` |
| `ambiental_legislacao` | 6.378 | **nenhuma** |
| `direito_critico_normas` | 30 | nenhuma |
| `direito_critico_precedentes` | 15 | nenhuma |

Duas conclusões que mudam o desenho:

1. **`ambiental_legislacao` não guarda URL de fonte.** São 6.378 normas
   ambientais estaduais sem endereço de origem registrado na tabela. Antes de
   arquivar qualquer coisa dali, é preciso descobrir se a URL existe no
   coletor e não está sendo gravada — que é exatamente o defeito já encontrado
   em `convenios_federais` (o CNPJ chegava da API e era descartado). **Este é
   o primeiro item a investigar, e pode ser o mais barato de todos.**
2. O grosso arquivável hoje são as ~23,6 mil linhas de `proposicoes` +
   `atos_oficiais`.

## Onde guardar: R2, não Static Assets

Isto não é preferência. Medido na documentação do Cloudflare no mesmo dia,
para resolver o bloqueio do SIGMINE:

- **Workers Static Assets**: teto de **25 MiB por arquivo** (igual no plano
  gratuito e no pago) e limite de **20.000 arquivos** no gratuito / 100.000 no
  pago. Um acervo de dezenas de milhares de PDFs estoura o limite de CONTAGEM
  antes de estourar qualquer outro.
- **R2**: objeto de até **5 TB**, sem limite prático de contagem, com range
  request. É o produto desenhado para isto.

Além disso, misturar acervo com o bundle do site significa que cada deploy
sobe o acervo de novo. Hoje o deploy já leva ~7 minutos com 4.475 arquivos.

## O desenho proposto

**Uma tabela nova de arquivo, não uma coluna nas tabelas existentes.** Cada
linha registra: a URL original, a chave no R2, o hash do conteúdo, o tamanho,
o tipo, a data da captura e o status HTTP daquela captura. Razões:

- Uma norma pode ter mais de um documento (texto original, texto compilado,
  anexo).
- A mesma URL pode ser citada por linhas de tabelas diferentes.
- **O histórico importa.** Capturar de novo daqui a um ano e ver que o hash
  mudou é informação de transparência por si só: quer dizer que o órgão
  alterou o documento no mesmo endereço.

**O hash é o coração da coisa.** Sem ele a cópia é só um arquivo; com ele é
prova de integridade — dá para afirmar que o documento exibido é byte a byte
o que foi baixado na data X.

## Regras que não se negociam

1. **O link original NUNCA sai da tela.** A cópia aparece ao lado, rotulada
   como cópia, com a data da captura. O leitor tem que saber que está vendo
   nosso arquivo e conseguir ir à fonte para conferir. Substituir o link pela
   cópia transformaria um portal de transparência em fonte primária de si
   mesmo, que é o oposto do que ele existe para ser.
2. **Rotular sempre**: "cópia arquivada em DD/MM/AAAA — o original está em
   `<domínio>`". Se a captura falhou, dizer que falhou, não esconder o botão.
3. **Respeitar quem não quer ser raspado.** `robots.txt`, `User-Agent`
   honesto identificando o projeto, e uma pausa entre requisições. Vários
   órgãos já devolvem 403 para bot (medido na auditoria) — esses simplesmente
   não entram, e a lacuna fica declarada.
4. **Nada de dado pessoal.** Documento público de órgão público. Se um PDF
   trouxer CPF, ele não pode ir para um bucket público de um repo público —
   ver `docs/ANTES-DO-PUSH.md`. A varredura de dado pessoal tem que rodar
   sobre o texto extraído ANTES de publicar a cópia.
5. **Custo declarado.** R2 tem franquia gratuita mensal; um acervo que cresce
   sem teto acaba passando dela. Medir o tamanho médio de um PDF de norma
   antes de decidir arquivar tudo, e definir o que entra por prioridade.

## Ordem sugerida — maior ganho, menor esforço primeiro

1. **Investigar se `ambiental_legislacao` já recebe URL do coletor e a
   descarta.** É a mesma classe de defeito do CNPJ dos convênios. Se for isso,
   são 6.378 normas ganhando fonte com uma correção pequena — e sem fonte não
   há o que arquivar.
2. **Medir antes de baixar**: sortear ~100 URLs do acervo, capturar, e medir
   taxa de sucesso, tamanho médio e quanto o acervo inteiro ocuparia. Decidir
   com número, não com estimativa.
3. **Começar pelo que é raro e frágil**: normas de área protegida, e as leis
   das cidades cadastradas. A Lei 726/2025 de Araçuaí é o caso de teste — se o
   plano funcionar para ela, funciona.
4. **Só então varredura ampla**, com fila e retomada, porque 23,6 mil
   downloads não cabem numa execução só.

## O que este plano NÃO decide

- Se o bucket é público ou servido por Worker com autenticação. Público é mais
  simples e combina com o propósito; Worker permite registrar quantas vezes um
  documento foi consultado. Fica para quando houver medição de custo.
- Retenção: por quanto tempo guardar versão antiga quando o hash muda.

---

*Universo medido em 2026-08-13 contra o Postgres local. Limites do Cloudflare
conferidos na documentação na mesma data.*
