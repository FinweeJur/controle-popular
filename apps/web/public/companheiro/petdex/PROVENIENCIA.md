# Procedência da arte — pets do companheiro (Petdex)

Arte de terceiros usada no bichinho flutuante do portal, selecionável
pelo leitor (clique direito no bichinho, botão ao lado do Seu Nonô ou o
cartão de opções no chat).

| | |
|---|---|
| Fonte | Petdex — https://petdex.dev |
| Instalação | `npx petdex install <slug>` (02/10/2026 — 1ª leva de 13 + 2ª leva de 9) |
| Atlas | folha padrão ChatGPT/Petdex: 8 colunas × 9 linhas de 192×208 px |
| Processamento | `apps/web/scripts/processar-pets-petdex.mts` — só as 9 linhas de estado, reduzida a 0,4 |
| Medidas | bbox e quadros por linha MEDIDOS no pixel pelo script — nunca digitados |
| Arquivo por pet | `estados.webp` + `meta.json` (medidas e crédito) |
| Registro no site | `apps/web/app/components/companheiroPets.ts` (gerado pelo script) |
| Vários na tela | o leitor pode marcar mais de um — todos andam juntos (pedido do dono, 02/10/2026) |

## Pets e autores

| Slug | Nome | Autor | Página |
|---|---|---|---|
| qiaowei (padrão) | Qiaowei (Oriental Magpie-Robin 鹊鸲小鸟) | 摸 鱼. | https://petdex.dev/pets/qiaowei |
| dingdong-chicken | Galinha 叮咚鸡 | hydrogen2o | https://petdex.dev/pets/dingdong-chicken |
| capvolt | Pikachu | zlss g. | https://petdex.dev/pets/capvolt |
| daodun | DaoDun | vinjn | https://petdex.dev/pets/daodun |
| nightleaf | Xiao Hei | 国东 闵. | https://petdex.dev/pets/nightleaf |
| bubu-3 | Bubu | je1zzz | https://petdex.dev/pets/bubu-3 |
| theveller | TheVeller | theveller | https://petdex.dev/pets/theveller |
| clippy | Clippy | victorpfreitas | https://petdex.dev/pets/clippy |
| capy | Capy | yjcys | https://petdex.dev/pets/capy |
| totoro | Totoro | vincentngo | https://petdex.dev/pets/totoro |
| gabumon | Gabumon | Weizhong J. | https://petdex.dev/pets/gabumon |
| maodie-2 | 耄耋 | zonglin-he | https://petdex.dev/pets/maodie-2 |
| chedarini | Chedarini | railly | https://petdex.dev/pets/chedarini |
| round-maodie-c63864e8 | 圆头耄耋 | Ne1ther | https://petdex.dev/pets/round-maodie-c63864e8 |
| wangcai | Wangcai | boxu-openai | https://petdex.dev/pets/wangcai |
| meiqiu | 煤球 | diao j. | https://petdex.dev/pets/meiqiu |
| sprig | Sprig | magitekapps | https://petdex.dev/pets/sprig |
| saga | Saga | katymyk | https://petdex.dev/pets/saga |
| bolt | Bolt | flmalte | https://petdex.dev/pets/bolt |
| casey-cassette | Casey Cassette | Apipa169 | https://petdex.dev/pets/casey-cassette |
| chompers | Chompers | James D. | https://petdex.dev/pets/chompers |
| kyle-kun | カイルくん | 成美 如. | https://petdex.dev/pets/kyle-kun |
| whaledou | whaledou | isdou | https://petdex.dev/pets/whaledou |

A procedência da galinha, com o histórico da instalação, vive em
`../dingdong-chicken/PROVENIENCIA.md`.

## Licença — PENDENTE (mesma da galinha)

A página do Petdex diz: *"Pets are user-submitted fan art. Petdex does
not claim rights to any underlying IP."* — **não há licença por asset**
para redistribuição. O código da plataforma Petdex é MIT, mas isso não
cobre a arte enviada por usuário.

**Decisão do dono (02/10/2026):** instalar e usar a arte agora,
creditando o autor em cada `meta.json` e nesta lista. Se um autor pedir
remoção, apagar o diretório do pet e a entrada dele em
`companheiroPets.ts`.

Alguns pets são fan art de personagens de terceiros (Pikachu, Totoro,
Gabumon, Clippy). O Petdex revisa na submissão; qualquer reclamação de
direito autor al segue o mesmo caminho: remover o pet da lista.
