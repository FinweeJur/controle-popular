<!-- PROVENIÊNCIA — bloco acrescentado em 15/08/2026 ao guardar este documento no
     repositório. Tudo abaixo é o levantamento como foi entregue, sem edição:
     é ele que registra de onde o acervo saiu.

     · Coletor: `scripts/coletor_auditoria.py` (exige cookie de sessão).
     · O que saiu daqui: `apps/web/lib/paraopeba/auditoria-ajri.ts` — 467
       documentos, gerado por `scripts/extrair-auditoria-ajri.mts` — e a rota
       `/paraopeba/auditoria`.
     · O que NÃO saiu: nenhum PDF. A §7 abaixo é a razão; a fase 2 está
       planejada em `docs/PLANO-ESPELHO-PDF-AJRI.md`.
     · Conferido contra o catálogo em 15/08/2026: os 467 documentos, os 7
       instrumentos jurídicos, os 391 Relatórios + 76 Notas Técnicas e o
       período 28/02/2019–31/07/2026 batem com a §4. Duas divergências
       medidas: os projetos são QUATRO (a §4 lista três — falta `60670454`,
       com 22 documentos), e a §3 lista 27 temas "ativos" que são 27 FACETAS
       do portal, reduzidas a 25 temas depois de fundir as duplicatas. -->

# Spec de integração — Portal da Auditoria Socioambiental (AJRI / Brumadinho)

`https://portal.auditoriasocioambiental.com.br`

Auditoria independente conduzida pela **AECOM** sobre o Acordo Judicial para Reparação Integral (04/02/2021), relativo ao rompimento das barragens B-I, B-IV e B-IV_A da mina Córrego do Feijão, Brumadinho/MG.

---

## 1. Stack e autenticação

| Item | Detalhe |
|---|---|
| Framework | Ruby on Rails (Turbo + Stimulus + Tailwind) |
| Auth | Devise — sessão por cookie (`/users/sign_out`), cadastro validado contra a Receita Federal |
| CSRF | `<meta name="csrf-token">` — necessário só para POST |
| i18n | `/locale/{pt-BR,en,es}?return_to=` — portal trilíngue |
| `robots.txt` | default do Rails, vazio — sem `Disallow` |
| API pública | **não existe**. Tudo é HTML renderizado no servidor. Nenhum endpoint `.json`. |

Toda a área de documentos exige sessão autenticada. Coleta = HTTP com cookie de sessão.

---

## 2. Mapa de rotas

| Rota | Método | Conteúdo |
|---|---|---|
| `/home` | GET | Landing |
| `/acordos` | GET | Texto e estrutura do Acordo Judicial |
| `/indicadores` | GET | Painel "Avanço das Iniciativas" (indicadores do Plano de Reparação) |
| `/documents` | GET | **Repositório principal** — busca facetada, 467 documentos |
| `/documents/:id/download_cover` | GET | PDF do documento (gerado sob demanda, com marca d'água) |
| `/access_user_risks` | GET | Estudos de Risco à Saúde Humana e Risco Ecológico (ERSHRE) |
| `/access_user_food_safety` | GET | Estudo da Produção Agropecuária |
| `/faq` | GET | Dúvidas frequentes |
| `/termos-de-uso` | GET | Termos e condições |
| `/clear_user` | GET | Formulário de exclusão de dados (LGPD) |

---

## 3. `/documents` — parâmetros de query

Formulário `GET /documents`. Todos os parâmetros são combináveis:

| Parâmetro | Tipo | Observação |
|---|---|---|
| `search` | string | busca por palavra-chave |
| `legal_instruments[]` | int (repetível) | instrumento jurídico |
| `themes[]` | int (repetível) | tema |
| `types[]` | int (repetível) | `41` = Nota Técnica, `7` = Relatório |
| `authors[]` | int (repetível) | `7` = AECOM (único autor) |
| `initial_date` / `end_date` | `dd/mm/aaaa` | faixa de datas |
| `order` | string | ordenação |
| `per_page` | int | `10 \| 20 \| 50 \| 100` |
| `page` | int | paginação |
| `selected_documents[]` | int (repetível) | download em lote (Stimulus `bulk-document-download`) |

**Exemplo:** `GET /documents?per_page=100&page=1&themes[]=232&types[]=7`

### IDs dos instrumentos jurídicos

| id | rótulo | docs |
|---|---|---|
| 7 | Ações Emergenciais | 87 |
| 13 | Acordo de Reparação | 93 |
| 48 | Águas e Segurança Hídrica | 84 |
| 49 | Estudo da Produção Agropecuária | 6 |
| 8 | Estudo de Risco | 82 |
| 9 | Monitoramento | 85 |
| 47 | Segurança das Estruturas | 30 |

### IDs dos temas (27 ativos)

`244` Água Potável · `237` Água Subterrânea · `254` Comunicação e Relacionamento · `269` Cronograma · `217` Dragagem · `240` Fauna · `258` Flora · `243` Frentes Emergenciais · `253` Licenciamento Ambiental · `231` Manejo de Rejeitos · `337` PEABP · `247` Patrimônio Cultural · `239` Plano de Reparação · `252` Programas de Compensação · `232` Qualidade da Água · `242` Qualidade do Ar · `250` Risco Ecológico · `251` Risco Meio Ambiente · `233` Risco Saúde Pública · `303` Risco Saúde Publica *(duplicata suja)* · `268` Segurança Hídrica · `248` Segurança das Estruturas Remanescentes · `249` Segurança do Alimento · `302` Segurança do Alimento *(duplicata suja)* · `267` Sistema de Abastecimento de Água · `228` Sistemas de Contenção · `257` Solos e Sedimentos

> ⚠️ Há duplicatas com grafias diferentes (`Risco Saúde Pública` / `Risco Saúde Publica`; `Segurança do Alimento` ×2). Normalize por *slug* sem acento no seu banco.

---

## 4. Estrutura do acervo (levantado em 15/08/2026)

- **467 documentos**, todos com autor AECOM
- **Período:** 28/02/2019 → 31/07/2026
- **Tipos:** 391 Relatórios, 76 Notas Técnicas
- **Última atualização do portal:** 12/08/2026 (cadência ~mensal)

### Nomenclatura do código

```
60612553 - ACM - DM - CO  - RP - PM - 0084 - 2026
projeto    orig. doc  disc. tipo  ?    seq.   ano
```

Projetos observados: `60612553`, `60622935`, `60725868` (fases contratuais da auditoria).
Disciplinas: `CO` (Copasa/segurança hídrica), `ZZ` (geral), `A2`, `SH`, `FS` (food safety), etc.

---

## 5. Schema sugerido (Postgres)

```sql
CREATE TABLE ajri_documento (
  id                    integer PRIMARY KEY,        -- id nativo do portal
  codigo                text UNIQUE NOT NULL,
  descricao             text,
  instrumento_juridico  text,
  tipo                  text,                       -- Relatório | Nota Técnica
  autor                 text DEFAULT 'AECOM',
  data_documento        date,
  projeto               text,
  disciplina            text,
  sequencial            text,
  ano                   integer,
  fonte_url             text NOT NULL,              -- link canônico p/ o portal
  download_url          text NOT NULL,
  arquivo_sha256        text,                       -- integridade do PDF baixado
  texto_extraido        tsvector,                   -- full-text (pdftotext)
  coletado_em           timestamptz DEFAULT now(),
  visto_pela_ultima_vez timestamptz
);

CREATE TABLE ajri_documento_tema (
  documento_id integer REFERENCES ajri_documento(id) ON DELETE CASCADE,
  tema_slug    text,
  PRIMARY KEY (documento_id, tema_slug)
);

CREATE INDEX ON ajri_documento USING gin (texto_extraido);
CREATE INDEX ON ajri_documento (data_documento DESC);
```

---

## 6. Estratégia de sincronização

1. **Detecção de novidade** — `GET /documents?per_page=10&order=recentes`; compare o maior `id` com o último salvo. IDs são sequenciais crescentes.
2. **Sync incremental** — só busque `download_cover` de ids não presentes no `manifest.json`.
3. **Cadência** — 1×/dia é mais que suficiente (portal atualiza ~1×/mês).
4. **Rate limit** — mínimo 2 s entre requisições. O PDF é gerado sob demanda com marca d'água: a resposta leva dezenas de segundos. Use `timeout=180` e backoff exponencial.
5. **Retomada** — grave `manifest.json` a cada arquivo; o processo é interrompível.
6. **Sessão** — o cookie Devise expira. Trate `401/403` como "renove o cookie", não como erro de rede.

---

## 7. Compliance (leia antes de publicar)

Os Termos de Uso (`/termos-de-uso`) dizem, textualmente, que o material é de propriedade da auditora e que **não é permitido modificar ou fazer uso comercial**; cópias para uso pessoal exigem manter os avisos de direito autoral intactos.

Se você vai republicar assumindo o risco como pesquisador, o mínimo defensável é:

- ✅ Publicar os PDFs **sem qualquer modificação**, com aviso de autoria da AECOM em cada ficha
- ✅ Link canônico visível para a fonte oficial em todo registro
- ✅ `robots.txt` do seu portal permitindo indexação do catálogo (interesse público)
- ✅ Página de política declarando finalidade acadêmica, não comercial, e canal de *takedown*
- ✅ Zero monetização — sem anúncios, paywall, ou uso em produto pago
- 🔴 **Redija a marca d'água antes de publicar.** Ela contém seu nome e CPF. Publicar 467 PDFs com seu CPF na internet aberta é risco de fraude de identidade, e o CPF exposto vira dado pessoal público sob a LGPD. Isso é separado da questão de direito autoral — e é o único ponto que eu recomendaria fortemente não ignorar.

Alternativa mais segura, se quiser: publique o **catálogo + link** (totalmente compatível com os Termos) e mantenha o espelho dos PDFs em acesso restrito, liberado sob solicitação para pesquisadores.
