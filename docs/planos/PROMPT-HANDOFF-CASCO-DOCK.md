# Prompt de handoff — fechar o casco (dock, topo, rastro, sitemap)

> **Tipo:** PROMPT
> **Domínio:** interface, acessibilidade e publicação
> **Última medição:** 2026-11-08
> **Leitura estimada:** curta (3-5 min)
> **Relacionados:** [PROMPT-ANIMACOES-CONTAGEM-BARRAS.md](PROMPT-ANIMACOES-CONTAGEM-BARRAS.md), [UNIFICACAO-POR-EIXO.md](UNIFICACAO-POR-EIXO.md)
> **Palavras-chave:** handoff, dock, rastro, sitemap, CodeScene, deploy

## Sumário

- [Como usar](#como-usar)
- [Por que este prompt existe](#por-que-este-prompt-existe)

## Como usar

Cole o bloco abaixo na sessão que vai fechar o casco. Ele é autossuficiente.

---

```
PAPEL

Você fecha o trabalho de interface do portal Controle Popular (Next.js 16, App
Router, Tailwind), no repositório X:\DevCoder\OpenCode\controle-popular.

ESTADO DO WORKING TREE (não commitado)

Há mudanças prontas em tsc, mas barradas pelos hooks de qualidade:
- DockFlutuante: dock à esquerda, ancorado no Seu Nonô (`[data-cp-nono-fab]`),
  itens aparecem na aproximação, no foco ou quando a função está ligada;
- DockItem: hover com intenção (1 s mostra explicação, 5 s executa o clique);
- SeuNono: FAB 56 -> 64 px e âncora `data-cp-nono-fab`; export `AvatarSeuNono`;
- BackToTop: só ícone, 70% de opacidade, "Voltar ao topo" expandindo no hover;
- FooterGlobal: `<BotaoRadio />` removido (rádio vive no dock);
- ExplicaSigla: SUS/IDEB/CAGED explicados na página, no hover;
- menu-portal: rótulos encurtados e sem sigla (LAI, COPAM, TSX, SEC, 12 Eyes,
  PPP, ESG, AdaptaBrasil), com a sigla preservada na dica;
- docs: `docs/historico/entrega-2026-11-08-mapa-navegacao.md`, README, AGENTS e
  UNIFICACAO-POR-EIXO atualizados;
- docs/planos/PROMPT-ANIMACOES-CONTAGEM-BARRAS.md (tarefa A, para outra sessão).

BLOQUEIOS A RESOLVER (nesta ordem)

1. CodeScene: `DockItem` com complexidade 16 (limite 10).
   → Extraia o hover intent para `app/components/dock/useHoverIntent.ts`
   (timers de 1 s e 5 s, cleanup) e deixe o componente só desenhar.
2. ESLint react-hooks: 5 erros em `DockFlutuante`
   ("Cannot modify local variables after render completes").
   → Tire do componente o efeito/refs que a regra reclama, movendo para um hook
   (`useExplicacaoDock`) com `setTexto` recebido por parâmetro; se a regra
   insistir, prefira callback por prop a evento global.
3. Rastro mágico com cor e alinhamento diferentes dos demais no dock.
   → Compare as classes dos três `DockItem`; o item do rastro deve usar
   exatamente as mesmas classes e o mesmo alinhamento (`items-start`,
   `flex-col-reverse`). Estado ativo não muda cor de fundo: usa ✓ + aria-pressed.
4. Subagente de sitemap/robots/busca pode ter deixado alterações pendentes.
   → Rode `git status`, revise, valide e inclua no commit certo.

VERIFICAÇÃO OBRIGATÓRIA

- `npx tsc --noEmit` (em apps/web)
- `npx eslint <arquivos alterados>` — zero erro
- `npx vitest run lib/navegacao lib/paraopeba`
- `python scripts/validar-documentacao.py` nos docs tocados (problemas
  pré-existentes de outros docs não contam)
- Conferir no preview local (`npx next dev -p 3011`): dock escondido até
  aproximar do Seu Nonô; botão ligado permanece visível; topo discreto;
  rastro igual aos demais.

COMMIT E PUBLICAÇÃO

- Commit por bloco, mensagem em arquivo, `git commit -F` e pathspec explícito
  (`git commit --only <arquivos>`). Nunca `-m`.
- Push quando o conjunto estiver validado. `git fetch` + `git merge origin/main
  -X ours` antes, se o remoto andou.
- Deploy só depois do push: `gh workflow run azure-mirror.yml --repo
  FinweeJur/controle-popular`. O push não publica.
- Depois do deploy, verificar no ar: `/`, `/indice`, `/riodoce`,
  `/paraopeba/linha-do-tempo`, `/direitos-em-movimento/servicos?subfrente=saude-publica`.

REGRAS DO PROJETO

- Nada de fonte abaixo de 12 px (o hook "Vigia de Tipografia" barra o commit).
- Link interno usa `next/link`; alvo de toque >= 44 px; foco visível.
- Cor nunca é o único sinal.
- Respeite `prefers-reduced-motion`.
- Não mexa em `/jurisprudencia` além do necessário: é página de dado.

ENTREGA

- Lista de arquivos e o que mudou em cada um.
- Saída de tsc, eslint e vitest.
- Link do run de deploy e o que foi verificado no ar.
- O que ficou pendente e por quê.
```

---

## Por que este prompt existe

O casco está funcional, mas preso em duas regras de qualidade: complexidade do
`DockItem` e a regra de hooks do React Compiler. Nada disso é produto novo — é
arrumar a casa para o commit e o deploy passarem. Deixar isso explícito evita
que a próxima sessão redesenhe o dock ou “conserte” o que já funciona.
