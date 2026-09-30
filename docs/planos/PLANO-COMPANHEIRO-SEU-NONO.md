# Plano do companheiro Seu Nonô (bichinho-preguiça no cursor)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-30
> **Leitura estimada:** média (5 a 15 min)
> **Relacionados:** [PLANO-RAG-COMPLETO.md](PLANO-RAG-COMPLETO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** companheiro, bichinho, preguica, desktop, cursor, rag, seu nono, galhos, deepseek, sabia, maritaca, ollama, acessibilidade

## Sumário

- [Propósito](#propósito)
- [A ideia em uma frase](#a-ideia-em-uma-frase)
- [Decisões travadas com o dono](#decisões-travadas-com-o-dono)
- [Arquitetura](#arquitetura)
- [Contrato `/api/companheiro`](#contrato-apicompanheiro)
- [Fases](#fases)
- [Repositórios e espelho](#repositórios-e-espelho)
- [Segurança](#segurança)
- [Como verificar](#como-verificar)
- [Riscos](#riscos)

## Propósito

O portal atende gente sob estresse: denúncia, remoção, barragem. Achar a
informação certa no meio de 397 pedaços de acervo é a barreira real. Este
plano leva o Seu Nonô para fora do navegador: um companheiro de desktop
(bichinho-preguiça) que fica ao lado do cursor, ouve a pergunta, lê a tela e
**guia a pessoa até a página que responde**.

O companheiro é a **boca e o olho**. O portal é o **cérebro**: guarda o RAG,
o catálogo e a escada determinística. A ponte entre os dois é o endpoint
`/api/companheiro`, descrito abaixo.

## A ideia em uma frase

Pergunta falada → RAG do Seu Nonô → resposta falada em PT-BR + rota aberta +
fontes listadas. O bichinho se **balança de galho em galho**, e cada galho é
um dado real do portal (título de fonte, rota do catálogo). Nada é inventado.

## Decisões travadas com o dono

| Tema | Decisão |
|---|---|
| Corpo do app | fork do `Bitshank-2338/clicky-windows` (Python + PyQt6, MIT) |
| Mascote | bichinho-preguiça pixel-art, 72 px (meio termo entre 48 e 96) |
| Papel de Picoclaw/Hermes | modo agente opcional, desligado por padrão |
| Contexto da página | só o título da janela ativa |
| MVP | abrir rota + falar + listar fontes |
| Proteção da rota | `COMPANHEIRO_TOKEN` opcional em env |
| Repositórios | `companion/` no monorepo **espelha** o fork, com script de sync |

## Arquitetura

```
[Companheiro Windows]                      [controle-popular]
  voz + tela + bichinho        POST        /api/companheiro
  overlay + TTS pt-BR     ───────────▶     escada determinista
  abre a rota no navegador   ◀─────────    RAG (responderComRag)
                                           galhos + fala + fontes
```

🔒 **A imagem nunca sai da máquina.** Só texto vai ao portal. Visão local
(Ollama) só aponta na tela; o RAG do portal recebe apenas a pergunta.

## Contrato `/api/companheiro`

**Pede** (`apps/web/lib/companheiro/contrato.ts`):

```json
{ "pergunta": "onde vejo as licencas de Betim?", "titulo": "Licenciamento - Controle Popular" }
```

**Devolve:**

```json
{
  "resposta": "As licencas de Betim ficam nessa pagina [1].",
  "fala": "As licencas de Betim ficam nessa pagina. Fonte: Licenciamento Ambiental.",
  "galhos": [{ "indice": 1, "rotulo": "Licenciamento Ambiental", "rota": "/ambiental/licenciamento" }],
  "atalhos": [{ "rotulo": "Abrir Licenciamento Ambiental", "href": "/ambiental/licenciamento", "principal": true }],
  "modelo": "DeepSeek", "data": "2026-09-30",
  "ressalva": true, "verificacao": "ok", "abstencao": false
}
```

- `fala` sai sem marcadores `[n]` (o som de "colchete um" é ruído) e cita a
  fonte pelo título que veio do dado. O modelo só embrulha.
- `galhos` são os pontos de apoio do bichinho, em ordem de citação.
- `ressalva` é sempre `true`: toda resposta de IA se declara, com modelo e data.

## Fases

| Fase | O que | Estado |
|---|---|---|
| **I0** | Contrato + responder + rota no portal, com testes | ✅ feito 30/09/2026 |
| **I1** | Provedor `portalProvider` no fork + painel de fontes | pendente |
| **I2** | Espelho `companion/` + script `sync-companion.mts` | pendente |
| **I3** | Identidade Seu Nonô (avatar, voz pt-BR, temas, cursor) | parcial |
| **I4** | Pacote Windows + página explicativa no portal | pendente |

O app (fases 1–5 do fork) já tem: arte do bichinho com critério de
similaridade, tema preguiça/triângulo, trilha de galhos no overlay, menu
**Bichinho** no tray e botões **DeepSeek** e **Sabiá (Maritaca)**.

## Repositórios e espelho

- Fork canônico: `FinweeJur/clicky-ptbr` (app PyQt6, builds do `.exe`).
- No monorepo: `companion/` é **espelho somente-leitura** do fork; um script
  copia só arquivos versionados (sem `.env`) e grava um manifesto com o commit
  e a data. Ninguém edita `companion/` à mão — o script sobrescreve.

## Segurança

- `COMPANHEIRO_TOKEN` opcional; sem ela, a rota é pública como `/api/chatbot`,
  só com limite de taxa por IP (30/min).
- IP lido de `CF-Connecting-IP` (`ipDoCliente`), nunca de `x-forwarded-for` cru.
- Entrada passa por `sanitizarEntradaUsuario` (blindagem de prompt).
- ⛔ Sem chave e sem dado pessoal no repo nem no espelho.
- Log só de contagem, nunca do texto da pergunta.

## Como verificar

```bash
# no worktree, dentro de apps/web
npx vitest run lib/companheiro/responder.test.ts
npx tsc --noEmit
```

O caminho determinístico é testado sem rede; o RAG depende de
`AI_API_KEY_*`/`EMBED_API_KEY` (existem no Guara) ou do Ollama local.

## Riscos

- Título de janela ≠ rota: o `boost` de rota do RAG fica mais fraco. Mitigação
  futura: ponte localhost ou extensão (fases posteriores).
- DeepSeek e Sabiá não aceitam imagem: apontar na tela só com modelo de visão
  local (Ollama `qwen2.5vl`).
- Rota é Node: não existe no alvo estático (GitHub Pages).
