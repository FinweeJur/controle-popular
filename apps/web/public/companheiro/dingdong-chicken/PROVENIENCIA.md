# Procedência da arte — galinha do companheiro

Arte de terceiros usada no bichinho flutuante do portal.

| | |
|---|---|
| Mascote | `dingdong-chicken` ("叮咚鸡", galinha de pescoço longo) |
| Registro | Petdex (`petdex.dev`), entrada nº 3759 |
| Autor | `hydrogen2o` (https://github.com/hydrogen2o) |
| Fonte original | https://petdex.dev/pets/dingdong-chicken |
| Atlas | https://assets.petdex.dev/pets/dingdong-chicken-4e6ba3f9603d/sprite.webp |
| Formato | 8 colunas × 11 linhas de 192×208 px |
| Baixado em | 2026-10-02 |
| Arquivo usado | `estados.webp` (linhas 0–8, reduzido a 0,4 da escala; 99 KB) |

## Estados (linhas do atlas)

O atlas do ChatGPT/Petdex tem **9 estados** (linhas), cada um com uma
quantidade de quadros (colunas):

| # | Estado | Quadros | Uso no site |
|---|---|---|---|
| 0 | `idle` | 7 | parada (padrão) |
| 1 | `running-right` | 8 | correndo ao arrastar para a direita |
| 2 | `running-left` | 8 | correndo ao arrastar para a esquerda |
| 3 | `waving` | 4 | acena no hover/foco |
| 4 | `jumping` | 5 | pula ao trocar de página |
| 5 | `failed` | 8 | sem internet |
| 6 | `waiting` | 6 | ao abrir o Seu Nonô (pensando) |
| 7 | `running` | 6 | (reserva) |
| 8 | `review` | 6 | quebra de idle de vez em quando |

As linhas 9 e 10 existem no atlas original mas **não têm nome documentado** —
ficaram de fora. O `estados.webp` recorta só as 9 primeiras e reduz para 0,4
(768×936 → 614×749), cortando o peso de 1,2 MB para 99 KB.

## Licença — PENDENTE

A página do Petdex diz: *"Pets are user-submitted fan art. Petdex does not
claim rights to any underlying IP."* — ou seja, **não há licença por asset**
para redistribuição. O código da plataforma Petdex é MIT, mas isso não cobre
a arte enviada por usuário.

**Decisão do dono (02/10/2026):** usar a arte agora e **contatar o autor
(`hydrogen2o`) depois** para confirmar a permissão. Se a permissão não vier,
trocar por arte própria ou remover este diretório e o uso em
`app/components/CompanheiroFlutuante.tsx`.
