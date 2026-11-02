# Conformidade e responsividade mobile

> **Tipo:** GUIA
> **Domínio:** global (interface, responsividade, acessibilidade, 390 px)
> **Última medição:** 2026-11-02
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [REGRAS-DURAS.md](REGRAS-DURAS.md), [VERIFICACAO-E-ENTREGA.md](VERIFICACAO-E-ENTREGA.md), [PADRAO-PAGINA-WIKI.md](PADRAO-PAGINA-WIKI.md), [auditar-mobile.mjs](/scripts/auditar-mobile.mjs)
> **Palavras-chave:** mobile, responsividade, 390px, overflow, tabela, fonte, acessibilidade, auditoria, aria-label, checklist

## Sumário

- [O que é a régua](#o-que-é-a-régua)
- [O que o script cobre](#o-que-o-script-cobre)
- [O que só o olho humano vê](#o-que-só-o-olho-humano-vê)
- [Checklist por família de página](#checklist-por-família-de-página)
- [Como registrar exceção](#como-registrar-exceção)
- [Pendências conhecidas](#pendências-conhecidas)

## O que é a régua

**390 px de largura, sem rolagem lateral.** É a largura do iPhone 14/15 em
CSS pixels e o piso prático do parque brasileiro. A regra dura é a §5.14 do
[AGENTS.md](/AGENTS.md): o celular é a régua, e responsividade é qualidade
do dado — tabela cortada faz o leitor achar que o número não existe.

A medição objetiva é uma linha, no console do navegador com o aparelho
simulado em 390 px:

```js
document.documentElement.scrollWidth === window.innerWidth
```

`true` significa que a página não transborda. `false` significa rolagem
lateral falsa: quase sempre uma largura fixa, uma tabela sem invólucro ou
uma imagem sem `max-width`. Para achar o culpado:

```js
[...document.querySelectorAll("*")]
  .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
  .slice(0, 20)
  .forEach((el) => console.log(el, el.className));
```

O teste é feito em cada rota, com o menu aberto e fechado, e também em
200% de zoom. `overflow-x-auto` **localizado** é permitido: a tabela rola
dentro do próprio bloco, o corpo da página não.

## O que o script cobre

`scripts/auditar-mobile.mjs` varre todo `apps/web/app/**/page.tsx` sem
dependência nova e sem navegador. Ele lê as tags TSX, monta a pilha de
ancestrais e reporta cinco regras:

| Regra | O que acusa | Correção esperada |
|---|---|---|
| 1 | `text-[9px]`, `text-[10px]`, `text-[11px]` | subir para `text-xs` (12 px) ou maior (§5.16) |
| 2 | `w-[…]`/`min-w-[…]` acima de 360 px sem `overflow-x-auto` | envolver o bloco rolável ou trocar por largura fluida |
| 3 | `<table>` sem `overflow-x-auto` em ancestral | `<div className="overflow-x-auto">` em volta |
| 4 | `<img>`/`<Image>` sem `sizes`, `width` ou `height` | declarar dimensão intrínseca ou `sizes` no `next/image` |
| 5 | `<button>`/`<a>`/`<Link>` só com ícone e sem `aria-label` | `aria-label` com a ação, não com o desenho |

Comando e códigos de saída:

```bash
node scripts/auditar-mobile.mjs                  # 346 rotas (page.tsx)
node scripts/auditar-mobile.mjs --resumo         # só o placar por regra
node scripts/auditar-mobile.mjs --escopo=app     # 814 .tsx (triagem de componentes)
npm run auditar:mobile
```

Saída `0` = nenhum achado; `1` = achado. Serve de porteiro local e de
gatilho para CI futura. `--escopo=app` é **triagem**, não porteiro: a
detecção de ícone-only é heurística e ainda confunde texto vindo de
expressão (`{copiado ? ... : ...}`) com ícone.

**O que o script não vê:** componentes importados quando roda no escopo
padrão (só `page.tsx`), largura definida em CSS/`style`, conteúdo montado no
cliente, menu aberto, teclado virtual, 200% de zoom. Por isso a seção
seguinte existe.

### Medição de 02/11/2026

346 rotas varridas, 13 achados mecânicos antes das correções, 1 depois:

| Regra | Antes | Depois | Observação |
|---|---|---|---|
| 1 · fonte < 12 px | 0 | 0 | nenhuma ocorrência em `page.tsx` |
| 2 · largura fixa | 1 | 0 | era `min-w-[34rem]` dentro de `TabelaScroll`, que já rola |
| 3 · tabela sem rolagem | 7 | 0 | seis tabelas ganharam invólucro; uma estava em `TabelaScroll` |
| 4 · imagem sem dimensão | 3 | 1 | dois gráficos do Paraopeba ganharam dimensão; banner de anúncio fica pendente |
| 5 · ícone sem rótulo | 2 | 0 | eram links com texto em `{expressão}`, falso positivo do leitor |

Correções aplicadas nesta medição: seis invólucros `overflow-x-auto` em
`[municipio]/saude`, `ambiental/judiciario`, `judiciario/composicao` e
`judiciario/tribunais/[sigla]`; dimensões intrínsecas dos quatro PNGs de
`paraopeba/auditoria`; `aria-label` em três botões só de ícone fora das
páginas (`america-latina`, `consumo-corporativo`).

## O que só o olho humano vê

O script é a rede de baixo custo. Estes itens exigem aparelho, teclado ou
leitor de tela:

- **Contraste:** texto normal ≥ 4,5:1; texto grande (≥ 24 px ou ≥ 19 px
  negrito) ≥ 3:1. `text-text-soft` sobre `bg-surface-2` é o par mais usado
  do portal — conferir com o conta-gotas do DevTools, não a olho.
- **Alvo de toque:** mínimo 44 × 44 px, com 8 px de folga entre alvos.
  Link de tabela e botão de fechar são os suspeitos de sempre.
- **Foco:** ordem segue a leitura, foco visível em fundo claro e escuro,
  nada preso atrás de `overflow-hidden`. Testar só com Tab.
- **Texto sobre imagem:** legenda de gráfico, capa de notícia e banner de
  anúncio precisam de véu ou fundo sólido; branco sobre cinza claro reprova.
- **Zoom de 200%:** o layout pode mudar, o conteúdo não pode sumir nem
  exigir rolagem nos dois eixos.
- **Conteúdo dinâmico:** nome de cidade longo, razão social com 80
  caracteres, valor em bilhões. Testar com o pior dado real, não com
  "Município de Exemplo".
- **Estados vazios e de erro:** mensagem curta, sem tabela fantasma e sem
  botão fora da tela.
- **Movimento:** gráfico e globo respeitam `prefers-reduced-motion`.
- **Leitor de tela:** um leitor (TalkBack/VoiceOver/NVDA) por família de
  página; imagem sem `alt` útil e tabela sem cabeçalho aparecem aqui.

## Checklist por família de página

Marque no papel ou no PR; o script cobre só a coluna mecânica.

### Home e páginas de entrada

- [ ] 390 px sem rolagem lateral; `scrollWidth === innerWidth`.
- [ ] Busca e atalhos com alvo ≥ 44 px.
- [ ] Card de destaque não corta título nem valor.
- [ ] Menu abre, fecha e devolve o foco ao gatilho.

### Cidade (`/[municipio]` e subrotas)

- [ ] Nome longo do município quebra linha, não empurra a coluna.
- [ ] Tabela de vereadores/contratos rola **dentro** do bloco.
- [ ] Gráfico SVG cabe na largura e mantém rótulo legível.
- [ ] Link para a câmara e para a prefeitura tem alvo de 44 px.

### Painel temático (ambiental, judiciário, direitos, economia)

- [ ] Filtros empilham; nenhum `select` maior que a tela.
- [ ] Cartão de indicador não usa fonte < 12 px.
- [ ] Série temporal longa não força largura fixa.
- [ ] Estado "sem dado" é visível sem rolagem.

### Página de detalhe (perfil, notícia, decisão, empresa)

- [ ] Título e subtítulo não estouram; `line-clamp` tem texto completo.
- [ ] Imagem de capa tem dimensão ou `sizes` e `alt` útil.
- [ ] Links externos abrem com `rel="noopener noreferrer"`.
- [ ] Botão só de ícone (fechar, copiar, compartilhar) tem `aria-label`.

### Consulta e tabela

- [ ] `<table>` dentro de `overflow-x-auto` ou `TabelaScroll`.
- [ ] Cabeçalho de coluna permanece legível ao rolar.
- [ ] Paginação e "carregar mais" alcançáveis com o polegar.
- [ ] Nenhuma célula com largura fixa > 360 px.

### Formulário, busca e assistente

- [ ] Campo e botão ocupam a largura útil, sem zoom automático do iOS
      (fonte do input ≥ 16 px).
- [ ] Erro aparece ao lado do campo, não só no topo.
- [ ] Teclado virtual não cobre o botão de enviar.
- [ ] Resultado vazio explica o que fazer.

### Documento e relatório

- [ ] PDF/planilha abre em nova aba ou baixa, sem matar a navegação.
- [ ] Bloco de citação e nota de rodapé não estouram a margem.
- [ ] Sumário interno navega por âncora no celular.

## Como registrar exceção

Exceção é decisão, não esquecimento. Toda exceção entra na tabela abaixo,
com data, rota, regra e motivo — e volta a ser revisada na próxima medição.

| Data | Rota/arquivo | Regra | Motivo | Dono | Revisar em |
|---|---|---|---|---|---|
| 2026-11-02 | `apps/web/app/[municipio]/page.tsx` (banner) | 4 | `banner_url` vem do admin sem dimensão; corrigir exige guardar largura/altura no cadastro | produto | 2027-01-02 |

Regras da exceção:

1. **Só o dono aprova.** Achado que exige mudar layout editorial, dado ou
   cadastro não vira correção silenciosa.
2. **Escopo mínimo.** A exceção vale para a rota e a regra anotadas; não
   vale para a família inteira.
3. **Prazo.** Toda linha tem `Revisar em`; sem prazo, a exceção não vale.
4. **Registro no código, quando fizer sentido.** Um comentário curto ao
   lado do trecho explica por que ali é diferente. Não use comentário para
   esconder um defeito comum.
5. **Wrapper novo de rolagem** entra em `WRAPPERS_ROLAGEM` no script, com
   o mesmo critério: o componente precisa realmente aplicar
   `overflow-x-auto`.

Exceção não é lugar para fonte < 12 px (§5.16) nem para alvo de toque
abaixo de 44 px: esses dois são piso de legibilidade, não preferência.

## Pendências conhecidas

- **Banner de anúncio da cidade** (`[municipio]/page.tsx`): imagem externa
  cadastrada no admin, sem largura/altura. Precisa de coluna de dimensão no
  cadastro ou de recorte fixo com `next/image`.
- **Falso positivo de ícone-only com texto em expressão:** o leitor marca
  `{copiado ? <>…</> : …}` como ícone. No escopo `page.tsx` a medição está
  limpa; no escopo `app` ainda há dois casos conhecidos
  (`alertas/CentralAlertasClient.tsx` e `components/BotaoAlertaContextual.tsx`).
- **Componentes fora de `page.tsx`:** a varredura padrão não os cobre. A
  triagem `--escopo=app` é o caminho até eles, com revisão humana.
