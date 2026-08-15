# Handoff — 15/08/2026, noite

> Escrito para quem retoma noutra ferramenta ou noutra máquina. **Diz o que
> ficou por fazer e o que está travado em decisão** — não repete o que já está
> em `docs/LEIA-PRIMEIRO.md` e no `AGENTS.md` da raiz.
>
> Estado ao fechar: `origin/main` em **`f6ab225`**, 15 commits publicados no
> dia, suíte em **601 testes (vitest) + 121 (globo 3D)**, site no ar.

## O que entrou hoje, em uma linha cada

| Commit | Entrega |
|---|---|
| `6350bb3` | Execução do Acordo na bacia — 26 municípios da FGV, R$ 5,48 bi, 73,8% pago |
| `0071368` | Ficha legível dos 467 documentos da auditoria AJRI, **sem modelo nenhum** |
| `f54e5ca` | `[municipio]/camara/legislacao` para índice fatiado (resolve BH e Diamantina juntos) |
| `341f6ac` | Assistente assume que não tem IA, em vez de acusar a rede |
| `4732b1a` | Judiciário: grafo e link de fonte |
| `d5d6cc5` | Rouanet no repo: **215 CPFs colados ao nome**, e 7,9 MB → 2,4 MB |
| `52d2973` | Repasse de Brumadinho: 1.214 de 1.214 linhas casadas, R$ 1,65 bi |
| `bec7f51` | Termo LGPD ganha canal de contato e a divisão entre os dois canais |
| `1d394f3` | Testes do globo voltam a rodar no Windows |
| `eac9eb8` · `f6ab225` | Documentação alinhada ao que foi medido |

## 🔴 Travado em decisão do dono — nada anda sem isso

| # | O que | Por que trava |
|---|---|---|
| 1 | **Protocolo da LAI do INCRA no Fala.BR** | ⏰ **`data_limite: 2026-08-18`**, situação `aguardando`, `protocolo_status: "desconhecido"` em `docs/LAI-PROTOCOLOS.json`. **Sem o número não há recurso**, e o prazo de recurso começa quando o de resposta acaba. É a única tarefa da lista que fica *impossível* se atrasar, em vez de só ficar mais tarde |
| 2 | **`AJRI_COOKIE`** (sessão autenticada do portal da auditoria) | sem ele a fase B não começa: baixar os 467 PDFs, extrair, **varrer dado pessoal**, e só então resumir. Plano em `docs/PLANO-ESPELHO-PDF-AJRI.md` §6 |
| 3 | **Renovar `DADOS_GOV_BR_API_TOKEN`** em `etl/betim/.env` | é JWT e expirou (401 nos três formatos de header). Destrava o incentivo fiscal ao esporte inteiro |
| 4 | **CPF ainda no histórico do git** (commit `e510f4e`) | o arquivo foi corrigido, o histórico não. Reescrever histórico exige `--force`, que o projeto proíbe — logo é decisão, não tarefa |
| 5 | **Credenciamento CNPJ/CEP no Conecta gov.br** | confirmar se pessoa jurídica de direito privado pode se credenciar, ou se "público" ali quer dizer "os três níveis de governo" |
| 6 | **`www18.fgv.br` responde `Disallow: /`** | o dado foi ingerido mesmo assim, com escopo reduzido (2 requisições, manual, UA honesto, fora da CI) e o raciocínio no cabeçalho do coletor. Se a decisão mudar, a página sai fácil — o dado está num arquivo só |

## 🟢 Pronto para pegar, sem bloqueio nenhum

### 7. Documentos e notícias relacionadas no fim da ficha — **pedido explícito, nunca construído**

O dono pediu: *"algumas notícias têm a ver com o tema de um documento; seria
importante que ao final da página de visualização detalhada apontasse para
documentos e notícias relacionadas, como das ATIs, MAB, MPMG"*.

**Não foi feito.** O acervo para cruzar já está todo publicado:
`clipping-ati.ts` (46), `clipping-ij.ts` (59), `clipping.ts` (149), a biblioteca
(597) e a auditoria (467). O caminho barato é *join* determinístico por **tema e
data**, reusando os slugs de tema que já existem — não por modelo.

### 8. Tela do SALIC/Rouanet — adiada de propósito, com motivo

Dois catálogos lado a lado fariam o leitor concluir que aquele `total_doado`
foi para aqueles projetos. **A trilha doação→projeto não existe** (`_links.doacoes`
deu 404 em 9 de 9). Se for fazer, a ressalva viaja colada ao número.

### 9. Degrau 2 do assistente — composição determinística

Degraus 0 (navegação, 0,35 ms) e 1 (busca no índice, sob demanda) estão no ar.
Falta o 2: "compare Betim e Contagem", "o que falta em mulheres aqui" — **regra
escrita sobre os dados, sem modelo**. O degrau 3 (LLM) é o último e é opcional
por decisão: sem chave, o portal continua inteiro.

### 10. Indexar os acervos novos no índice estático

ComunicaBR **por município** (nunca inteiro), Rouanet, repasse. A ressalva de
cada acervo viaja junto — ComunicaBR tem 61% dos itens vazios, e um índice que
guarde só o que tem valor faz o assistente responder com falsa completude.

### 11. As três ATIs como fonte do radar (`TODO` §9)

Três entradas na lista `FONTES` de `scripts/coletar-noticias-paraopeba.py`, sem
mudança de esquema. ⚠️ **Antes**, uma regra nova na triagem: o feed do Guaicuy
traz "Nota de pesar: \<nome completo\>", e `triagem.ts` não pega nome por
extenso — só CPF, iniciais e contato.

### 12. Unificar as duas implementações de compactação

`lib/comunicabr/arquivo.ts` e `lib/estatico/compactar.ts` fazem a mesma coisa
(esqueleto + rótulos internados), escritas por sessões que não se viram. A
segunda nasceu porque o agente olhou a árvore **antes** do rebase e concluiu que
a primeira não existia.

### 13. Pró-Brumadinho: as outras duas páginas

Obrigações de pagar da Vale (previsto R$ 11,48 bi × arrecadado R$ 16,38 bi até
31/07/2026) e as 99 publicações de legislação. Planos em
`docs/FONTES-PRO-BRUMADINHO-E-FGV.md` §5.2–5.5.
⚠️ `/pro-brumadinho/noticias` responde **302 com redirect de período eleitoral**
e depois **200** dizendo que está indisponível — validar conteúdo, não status.

## 🟡 Precisa da máquina de build (`home-pc`), não desta

| # | O que | Por quê |
|---|---|---|
| 14 | Carregar as **8.940 normas federais** | código pronto e testado; sem a carga, `/ambiental/legislacao` mostra 0 nacionais |
| 15 | Migration `0071` na Neon | bloqueada até 01/09 (HTTP 402). Enquanto não roda, os 6 ETLs reintroduzem convênio duplicado |
| 16 | Medir `.cache` das rotas migradas **de ponta a ponta** | as migrações de `sp/educacao` e `camara/legislacao` foram medidas por custo/linha, **não** por build real. Os 11 MiB e 9,5 MiB citados são do build de 15/08, não pós-migração |
| 17 | O número da junção incentivador × fornecedor | 2.261 CNPJs de empresa (de 20.784 incentivadores) para cruzar com `contratos.fornecedor_cnpj`. **Quantos casam só se sabe com banco** |

## 🔵 Dívida técnica aberta

- **`scripts/checar-dado-pessoal.py` varre código, não acervo** (`TODO` §1).
  Hoje isso foi atacado pelas bordas — o guarda da Rouanet passou a varrer todo
  campo de texto de todo registro —, mas a trava geral continua cega ao dado
  ingerido.
- **13 territórios quilombolas** do INCRA e **103 barragens sem mancha** fora
  das camadas publicadas (`TODO` §4). A primeira lacuna desse tipo já mudou um
  alerta de zero para seis.
- **Regressão conhecida e aceita**: no cartão "Áreas legisladas", o clique no
  gráfico deixou de aplicar o filtro sozinho (navegação suave não remonta o
  componente). Link colado e página recarregada continuam funcionando, e a área
  virou também um `<select>` para o filtro seguir alcançável.
- **Três diretórios órfãos** em `.claude/worktrees/` (`cp-ajri`,
  `cp-sp-educacao`, `compassionate-lamport-b5dd4c`) resistiram à remoção por
  estarem travados por processo vivo. Estão vazios de trabalho — conferido que
  **nenhum arquivo existe só neles**. Saem quando os processos morrerem.

## 🚧 Em voo ao fechar este handoff

**Junção incentivador × fornecedor** (worktree `cp-junta-cnpj`, porta 3040).
Medido antes de lançar: dos 20.784 incentivadores de MG, **2.261 têm CNPJ de 14
dígitos** (todos distintos) e 18.523 são pessoa física mascarada na fonte. O
gancho já existia: `fornecedoresPorCnpj()` em `lib/db/queries/betim.ts:1047`.
Se o worktree ainda estiver lá e sem commit, o trabalho não chegou a publicar.

## Uma coisa que se repetiu três vezes hoje, e vale vigiar

**Duas sessões escrevendo a mesma coisa**: `RadarSecao.tsx` × `RadarRecente.tsx`;
um branch com `clipping-ij.ts` **byte a byte idêntico** ao já publicado; e as
duas implementações de compactação do item 12.

Antes de publicar branch parado, confira se o trabalho já não está lá:

```bash
git cat-file -e origin/main:<arquivo> && echo "JA EXISTE"
diff <(git show <commit>:<arquivo>) <(git show origin/main:<arquivo>) | wc -l
```

Zero de diferença quer dizer **não publique** — e o branch pode sair sem perda.
