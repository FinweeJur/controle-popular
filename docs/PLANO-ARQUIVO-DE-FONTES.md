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

1. ~~**`ambiental_legislacao` não guarda URL de fonte.**~~ **Errado — corrigido
   em 2026-08-15.** A coluna `link_pdf` está na migration 0065 desde o
   princípio, e é o campo que os coletores gravam. A linha da tabela acima
   dizia "nenhuma" porque a sondagem procurou por `link_fonte`, o nome usado
   nas OUTRAS tabelas. Medido nos arquivos exportados:

   | acervo | com `link_pdf` |
   |---|---:|
   | MMA (federal) | 8.345 / 8.570 — **97,4%** |
   | CNDH (federal) | 370 / 370 — **100%** |

   O item que era "o primeiro a investigar, e talvez o mais barato" não
   existe: não há nada a consertar no coletor.
2. O grosso arquivável hoje são as ~23,6 mil linhas de `proposicoes` +
   `atos_oficiais`, mais **7.138 URLs distintas** do acervo federal de
   legislação (8.940 linhas apontam para 7.138 endereços — várias normas
   compartilham a mesma página de diário oficial, e contar por linha inflaria
   o acervo com cópias do mesmo objeto).

## Medição de 2026-08-15 — e por que o primeiro número estava errado

Feita por `etl/betim/scripts/medir_links_fonte.py`, amostra sistemática de 100
das 7.138 URLs federais, **só HEAD, sem baixar corpo**.

**A primeira leitura deu 68% de links sem resposta. Estava errada**, e o modo
de errar vale mais que o número: `planalto.gov.br` **derruba a conexão** do
User-Agent identificável do projeto e responde **200** ao mesmo pedido com UA
de Chrome. Contado como quebra, isso colocaria as 577 URLs do Planalto na
lista de acervo perdido. É a mesma armadilha já registrada para
`conama.mma.gov.br`. Com reteste por UA de navegador, o número real é **25%**.

| resultado | de 100 |
|---|---:|
| 200 | 42 |
| inconclusivo (recusa HEAD, serve GET) | 24 |
| 502 | 22 |
| só responde a UA de navegador | 9 |
| 404 / erro de conexão / timeout | 3 |

**Tamanho projetado: 0,37 GiB** para as 7.138 URLs (média 54 KiB, mediana
17 KiB, medidos nos 13 `Content-Length` da amostra). É custo desprezível em
R2 — o obstáculo do arquivamento nunca foi o preço.

**`pesquisa.in.gov.br` é intermitente, e isso muda o método.** Duas execuções
da mesma amostra, com minutos de intervalo, deram 56 e depois 22 falhas. Não é
rajada nossa (sonda lenta, com 4 s entre pedidos, manteve o 502 em URLs
específicas), mas também não é serviço morto. São 3.298 das 7.138 — 46% do
acervo federal — dependendo de um host que responde às vezes.

Consequência: **uma execução só não mede link morto, mede o humor do servidor
naquele minuto.** Rodar duas ou três vezes e só considerar quebrado o que
falhar em todas. Sem isso, o arquivamento sai atrás de ~2.000 URLs que estavam
apenas de mau humor, e a conta de custo infla na mesma proporção.

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

## Atualização — 2026-08-14: item 1 da ordem sugerida já não se aplica

**`ambiental_legislacao` JÁ TEM `link_pdf`, desde a migration `0065` (o
mesmo dia em que este plano foi escrito) — 6.378/6.378 linhas preenchidas,
100%.** A frase acima ("não guarda URL de fonte... sem endereço de origem
registrado") estava desatualizada no momento em que foi escrita, não é uma
regressão: a migration 0065 e este plano nasceram no mesmo dia, e o plano
não conferiu a coluna que a migration já tinha adicionado. O "primeiro item
a investigar, pode ser o mais barato de todos" não precisa de investigação
nenhuma — já está feito. Conferido com `SELECT count(*), count(link_pdf)
FROM ambiental_legislacao` contra o Postgres local em 2026-08-14.

Consequência boa: as 1.183 normas de `serras` (180) + `recursos_hidricos`
(1.003) — o recorte de maior prioridade pedido pelo dono — já tinham fonte
citável o tempo todo, e por isso entraram na varredura e na amostra de
captura desta rodada (ver `docs/auditoria-2026-08-14-normas-protecao.md`).

## Atualização — 2026-08-14: item 2 (medir antes de baixar), medido de verdade

Amostra de 30 documentos de `ambiental_legislacao` (temas `serras` +
`recursos_hidricos`, sorteio aleatório, `scripts/arquivar-fontes.mjs`):

| Métrica | Valor medido |
|---|---:|
| Tentativas | 30 |
| Sucesso na captura | 30/30 (100%) |
| Com CPF no texto extraído (barrado) | 0 |
| Tamanho médio | 112,7 KiB |
| Total da amostra | 3,30 MiB |
| **Projeção para as 1.183 normas de serras+recursos_hídricos** | **≈ 130 MiB** |
| Projeção para os 25.729 links do universo total do portal (mesma média) | ≈ 2,8 GiB |

Ambos os números cabem folgados na franquia gratuita do R2 (10 GB/mês).
Custo não é motivo para conter escopo aqui — a única coisa que falta é a
credencial de R2 configurada nesta máquina (não inventada por este
trabalho, ver "O que falta" abaixo).

**Achado colateral da amostra**: uma URL fora da amostra (`idNorma=51241`)
respondeu `200` com `Content-Type: text/html` em vez de PDF — confirma ao
vivo o que o comentário da migration 0065 já registrava ("Semad/Siam às
vezes servem HTML sob uma URL de nome `download.pdf`"). Não é link
quebrado: o conteúdo é um documento Word exportado como página web (marcas
`mso-style` no HTML), extraído normalmente como texto pelo capturador.
Tratar pelo Content-Type real, nunca pelo nome da URL, é o que
`scripts/arquivar-fontes.mjs` faz.

## O que falta para publicar cópias de verdade

1. **Credencial de R2** nesta máquina (bucket + token). Sem isso, o
   capturador grava em `apps/web/.arquivo-local/` (fora de `public/`,
   gitignored) e a linha em `arquivo_fontes` fica com
   `modo_armazenamento='local'` — correto e seguro, mas **inacessível ao
   Worker publicado**: o Worker roda na borda da Cloudflare, nunca no disco
   desta máquina de build. Sem upload para R2, a cópia não pode aparecer
   ao lado do link na tela nenhuma — não é feature faltando, é
   impossibilidade física da arquitetura atual.
2. **Decisão** (já registrada como não decidida acima): bucket público ou
   Worker com autenticação.
3. Só depois disso faz sentido integrar a UI ("cópia arquivada em
   DD/MM/AAAA" ao lado do link) — construir o badge sem R2 mostraria um
   selo sem link nenhum por trás, o mesmo tipo de promessa vazia que este
   plano existe para evitar.
