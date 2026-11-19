# TAC e acordos ambientais do MPPA (Pará) — reconhecimento de fonte

> **Tipo:** HISTORICO
> **Domínio:** ambiental / Pará
> **Última medição:** 17/11/2026
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [FONTES.md](../../06-fontes/FONTES.md), [COLETA-ETICA.md](../../06-fontes/COLETA-ETICA.md), [betim-ambiental-pecma-research.md](./betim-ambiental-pecma-research.md)
> **Palavras-chave:** mppa, pará, tac, termo de ajustamento de conduta, semas, transparência

Sondagem ao vivo em 17/11/2026, com User-Agent `finweejur/github artur colito`, 1,6–1,8 s entre requisições ao mesmo host. Nada gravado no banco. Nada commitado.

## Veredito curto

**Baixo** para raspar o TAC do MPPA: HTML estático, sem login, sem CAPTCHA, sem API, sem paginação.
**Médio** para virar dado por município: não existe campo de município nem de tema, e o texto do acordo só está no PDF.
Diferente do GTAC-MG, **não existe busca em endpoint** — é uma tabela por ano.

## 1. O MPPA publica TAC em consulta pública? Sim.

| URL | Status | Corpo |
|---|---|---|
| `https://www.mppa.mp.br/tacs.htm` | 200 | 101.186 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2026.htm` | 200 | 119.373 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2025.htm` | 200 | 118.751 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2024.htm` | 200 | 148.897 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2023.htm` | 200 | 107.898 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2022.htm` | 200 | 114.005 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2021.htm` | 200 | 109.073 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2020.htm` | 200 | 110.963 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2019.htm` | **404** | 788 B (erro Lumis) |
| `https://www.mppa.mp.br/areas/institucional/conselho/tacs-2019.htm` | 200 | 159.666 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2018.htm` | 200 | 148.059 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2017.htm` | 200 | 99.042 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2016.htm` | 200 | 98.691 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2015.htm` | 200 | 95.255 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2014.htm` | 200 | 103.277 B |
| `https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-2013.htm` | 200 | 94.177 B |

Base legal declarada na página: Resolução nº 002/2018 do Conselho Superior do MPPA. O acervo é o enviado ao Conselho Superior — cópia integral **e** extrato.

⚠️ O ano de 2019 só está em `tacs-2019.htm` (sem `de-`), no host `www`, não no `www2`. O link da página-mãe é um `hyperlink.jsp?lumParams=…` opaco; o alvo real é esse.

## 2. Quantos termos devolve

Contagem por linhas de tabela com link de documento, medida em 17/11/2026:

| Ano | Linhas | Linhas com promotoria ambiental |
|---|---|---|
| 2013 | 1 | 0 |
| 2014 | 11 | 1 |
| 2015 | 2 | 0 |
| 2016 | 6 | 0 |
| 2017 | 7 | 0 |
| 2018 | 67 | 7 |
| 2019 | 90 | 5 |
| 2020 | 22 | 6 |
| 2021 | 20 | 5 |
| 2022 | 33 | 1 |
| 2023 | 21 | 5 |
| 2024 | 65 | 27 |
| 2025 | 39 | 20 |
| 2026 | 30 | 12 |
| **Total** | **414** | **89** |

- 414 linhas de tabela; ~391 termos com link "Íntegra" (a diferença são linhas com aditivo ou só extrato).
- 89 linhas (21%) citam "Meio Ambiente"/"Ambiental" no texto — é o recorte ambiental bruto, por nome da promotoria. Não é campo, é texto.
- 2026 vai até 18/08/2026 (medido em 17/11/2026): há defasagem de ~3 meses na publicação.

## 3. Campos disponíveis

Tabela HTML de 4 colunas, por página de ano:

| Coluna | Conteúdo | Observação |
|---|---|---|
| Número | `SIMP n.º 000067-111/2022`, `Protocolo n.º 16583-2022`, `IC n.º 001132-025/2019`, `SAJ n.º 02.2026.00052968-1` | quatro padrões de numeração, sem campo separado |
| Links | "Íntegra" e "Extrato" (PDF) | às vezes "Íntegra + 1 aditivo" |
| Data do TAC | `18/08/2026` | data de assinatura |
| Órgão de Execução | `1ª Promotoria de Justiça do Meio Ambiente, Patrimônio Cultural, Habitação e Urbanismo de Belém` | **único lugar onde aparece o município** |
| Partes | `- Ministério Público do Estado do Pará` + compromitente | ⚠️ traz nome de pessoa física e CNPJ |

Ausentes: tema/objeto estruturado, município como coluna, valor de obrigação, status de cumprimento, data de publicação.

O PDF de **extrato** traz o objeto em texto corrido ("Objeto", partes, CNPJ, endereço). Texto extraível com decodificação simples (fonte com deslocamento de 29 no encoding).

PDF medido:
- Íntegra: `https://www2.mppa.mp.br/data/files/B2/77/F9/62/585978104C99BE68180808FF/TAC%20-%20SIP%20n.%204446-2023.pdf` → 200, **1.843.177 B**, `application/pdf`, magic `%PDF`.
- Extrato: `…/data/files/5B/F0/9C/DE/802FF910B60703D918238204/Extrato%20SAJ%20n.%2002.2026.00052968-1.pdf` → 200, 71.068 B.

⚠️ Armadilha de caminho: o HTML usa `href="../../../data/files/…"`. Resolver contra `/areas/institucional/conselho/` dá 404 de 790 B. O caminho certo é **raiz do host** + `data/files/…` (funciona igual em `www` e `www2`). Mesma lição do GTAC-MG: validar o corpo, não o status.

## 4. Filtro, paginação, export, API

- **Filtro por município: não existe.** Nenhum `<select>`, nenhum campo de busca na tabela. A única forma é filtrar a string do órgão de execução.
- **Paginação: não existe.** Uma página por ano, tabela completa, 94–159 KB.
- **Export (CSV/JSON/XLS): não existe.**
- **API: não existe** no MPPA. O iframe `https://www2.mppa.mp.br/simpacervo/explorer.jsf` (usado no `tacs.htm`) devolve **404**; `simpacervo/formPesquisa.jsf` também **404**. Esse iframe só serve para plantar cookie de sessão — não lista nada.
- Custo de coleta: 15 requisições de página + 1 por PDF. Lento, mas simples e estável.

## 5. Acordo de reparação (desastre, mineração, barragem)

- **MPPA: não há portal nem lista separada.** Não achei página de "acordo de reparação". O CAO Ambiental (`https://www.mppa.mp.br/areas/institucional/cao/meio-ambiente/`, 200, 96.765 B) é só navegação institucional: apresentação, equipe, convênios, notas técnicas. Nenhum acordo listado.
- **DOEMPPA publica extratos de TAC** como ato oficial: `https://www2.mppa.mp.br/doemppa/` (200, 35.654 B), edição 982 em 17/11/2026, download em `mppa.mp.br/doemppa/download/<id>`. Serve para achar acordo recente por data, não por município.
- **SEMAS-PA tem o dado estruturado.** O Portal da Transparência Ambiental (`https://portaldatransparencia.semas.pa.gov.br/`, SPA Angular, 5.904 B de casca) tem os módulos `licenciamentoTacTc` → **"TAC / TC"** (rota `/tac-tc/listar`) e `licenciamentoMonitoramentoTacTc` → **"Monitoramento TAC / TC"** (`/monitoramento-de-tac-tc/listar`), mais "Termo de Compromisso Ambiental Eletrônico".
  - Campos já vistos no bundle: `NumeroTermo`, `AnoTermo`, `AnoTermoSetor`, `DataTermo`.
  - API: `https://portaldatransparencia.semas.pa.gov.br/portal-da-transparencia-api/api/`. Responde JSON (`{"message": ""}`) nos três caminhos que tentei (`tac-tc`, `tac-tc/listar`, `termo-compromisso-ambiental`) — todos **404**. O caminho exato está no chunk carregado sob demanda; só sai abrindo a SPA e olhando o XHR.
  - Ou seja: o TAC estadual (licenciamento) existe e é estruturado, mas ainda **não é coletável sem navegador**.

## 6. robots.txt e termos

| Host | `robots.txt` | Efeito |
|---|---|---|
| `www.mppa.mp.br` | 404 (794 B, página de erro Lumis) | nada declarado; nenhum `Disallow` |
| `www2.mppa.mp.br` | 404 (788 B, página de erro Lumis) | idem |
| `portaltransparencia.mppa.mp.br` | 400 (96.625 B, Qlik Sense) | idem; `robots.txt` nem é servido |
| `www.cnmp.mp.br` | 404 (208 B) | idem |
| `transparencia.cnmp.mp.br` | 404 (68 B) | idem |
| `www.semas.pa.gov.br` | 200 (2.701 B) | `User-agent: * / Allow: /`, `Content-Signal: search=yes, ai-train=no, use=reference` |

Não achei página de "termos de uso" do MPPA (`/termos-de-uso.htm` → 404, `/politica-de-privacidade.htm` → 404). O rodapé só tem acessibilidade, política de cookies e aceite de privacidade. **Nada proíbe a coleta**; uso é de referência cívica.

No SEMAS a sinalização pede `ai-train=no` e `use=reference` — respeitado: nada de treino, só leitura.

## 7. Login e CAPTCHA

**Nenhum.** As 15 páginas de TAC e os PDFs abriram sem cookie, sem sessão, sem token, sem CAPTCHA. Fora de alcance só o `portal-saj`, `pesquisasip` e `simpweb` (consulta processual), que não são necessários aqui.

## 8. CNMP como espelho nacional

- Busca geral funciona: `https://www.cnmp.mp.br/portal/busca-geral?hash=…&selecioneBusca=geral&q=termo+de+ajustamento+de+conduta` → 200, 102.652 B, **160 resultados**.
- Mas o resultado é notícia e licitação ("Seguro Automotivo", "Aquisição de eletrodomésticos"). **Não há base nacional de TAC consultável.** O CNMP publica a norma que obriga o MP a publicar, não o acervo.
- Não use o CNMP como fonte de TAC. Use o MPPA.

## 9. Privacidade — regra para o coletor

A coluna "Partes" traz **nome de pessoa física** junto do CNPJ da empresa (medi: `… LTDA (Maurício Paracampos Junior)`). O extrato repete o nome.

Regra do coletor: ler **número, data, órgão de execução e links**; descartar a coluna "Partes" inteira e não extrair nome/CNPJ do PDF. Publicar órgão + número do procedimento, nunca nome de gente.

## 10. Recomendação

1. Coletar as 15 páginas de ano (2013–2026), uma requisição cada, 2 s de intervalo. Mapear as colunas 1, 3 e 4; ignorar "Partes".
2. Derivar município do nome da Promotoria de Justiça (`… de Curuçá` → Curuçá). Onde o órgão é de Belém por atribuição temática (Meio Ambiente, Consumidor), marcar município = Belém e anotar que é atribuição, não sede do dano.
3. Recorte ambiental: linhas cujo órgão contenha "Meio Ambiente" ou "Ambiental" (~89 de 414). Tema real só sai do PDF do extrato, com extração de texto.
4. Baixar PDF só dos ambientais: 89 extratos (~70 KB cada) ≈ 6 MB. Íntegras (1–2 MB) sob demanda, para link.
5. Não tentar a API da SEMAS às cegas. Se o TAC estadual entrar no escopo, abrir a SPA uma vez e capturar o XHR de `/tac-tc/listar`.

## Origem / Histórico

- 17/11/2026 — sondagem inicial. 15 páginas de ano medidas, 2 PDFs validados por magic bytes, `robots.txt` de 6 hosts lidos, API da SEMAS localizada mas não resolvida.
