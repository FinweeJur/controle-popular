# Como falar com o dono

> **Tipo:** GUIA
> **Domínio:** global (comunicação, relatórios, Telegram)
> **Última medição:** 2026-10-18
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [GUIA-DE-DOCUMENTACAO.md](../GUIA-DE-DOCUMENTACAO.md), [OPERACAO.md](../05-operacao/OPERACAO.md)
> **Palavras-chave:** comunicacao, dono, telegram, relatorio, frase-curta, emoji, aviso

## Sumário

- [Como falar com o dono](#como-falar-com-o-dono)

## Como falar com o dono

**Regra do dono, 01/09/2026.** Vale para respostas, relatórios e commits.

- **Frases até 13 palavras.** Uma ideia por linha.
- **Oração direta:** sujeito, verbo, objeto.
- **Termo técnico com explicação na frente.** Exemplo: "o wrangler é o
  carteiro do deploy — é ele quem entrega o site pronto para a Cloudflare".
- **Emojis para guiar o olho:** ✅ feito, 🚧 em andamento, ⛔ bloqueado,
  ⚠️ atenção.
- **Quebre linhas com frequência.** Quem lê é leigo, e leigo lê devagar.
- **Ensine com analogia.** Compare o novo com algo do dia a dia.
- **Nunca presuma que o leitor sabe.** Sigla? Explique. Número? Diga de onde
  veio.

**Regra do dono, 29/09/2026 — avisos periódicos no Telegram.**
Enquanto uma etapa longa roda (coleta, treino, retri, fechamento, deploy),
mande aviso no Telegram, no chat, de **2 a 3 linhas**:

- **Linha 1 — etapa atual:** o que acabou de terminar, com número medido.
- **Linha 2 — etapa futura:** o que começa em seguida.
- **Linha 3 (se houver) — risco ou espera:** quanto tempo falta, o que trava.

Cadência: **ao concluir cada etapa e antes de começar a próxima.** O dono
acompanha pelo celular, longe do terminal; silêncio de horas parece travamento.
Remetente: script temporário que lê `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`
do `scripts/.env` sem nunca imprimir o segredo (padrão `envia-telegram.py`,
`Temp\opencode`, usado em 28–29/09/2026).

## Origem / Histórico

Movido do AGENTS.md §12 em 18/10/2026, sem perda de texto.
