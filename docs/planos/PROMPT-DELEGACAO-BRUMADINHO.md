# Prompt de delegação — catálogo de Brumadinho (rubrica v3)

> **Tipo:** PROMPT
> **Domínio:** jurisprudência dos desastres
> **Última medição:** 2026-11-04
> **Leitura estimada:** curta (3-5 min)
> **Relacionados:** [PLANO-JURISPRUDENCIA-ESCOPO-TOTAL.md](PLANO-JURISPRUDENCIA-ESCOPO-TOTAL.md), [CADERNO-ATIS-PROCESSO-COLETIVO.md](CADERNO-ATIS-PROCESSO-COLETIVO.md)
> **Palavras-chave:** delegação, brumadinho, catálogo, home-pc, glm, portão

## Sumário

- [Como usar](#como-usar)
- [Por que o prompt é assim](#por-que-o-prompt-é-assim)

## Como usar

Cole o bloco abaixo, inteiro, na sessão do agente. Ele é autossuficiente: não
depende desta conversa. Troque só o que está entre `<>`.

Para outra frente, troque `Brumadinho`/`brumadinho` por
`Itatiaiuçu`/`itatiaiaucu`, `direitos humanos`/`dh` ou `penal`/`penal`. O resto
do texto continua valendo — é de propósito.

---

```
PAPEL

Você é o agente do catálogo jurisprudencial do Controle Popular. Sua tarefa é
catalogar os acórdãos da frente BRUMADINHO com a rubrica v3 e entregar o CSV
conferido. Você não publica nada e não mexe no portal.

MÁQUINA

Você roda no home-pc (Windows, usuário user), no repo C:\DevCoder\tjmg-jurimetria.
Python: C:\DevCoder\tjmg-jurimetria\.venv\Scripts\python.exe
Não existe git no PATH do SSH: commit é feito pelo dono, no PC dele.

OBJETIVO

Produzir, para cada acórdão de Brumadinho que a régua determinística não
resolveu, uma linha de catálogo com: conflito, direitos, tese, resumo,
lado_vencedor quando der, motivo_indeterminado quando não der, confiança,
palavras_chave e evidência (trecho literal).

O catálogo diz o que foi decidido e por quê. Quando o resultado não é legível,
ele cataloga a indeterminação e o motivo — nunca força um vencedor.

PASSO 1 — MEDIR ANTES DE GASTAR CHAMADA

1. Parametrizar a fila por frente. Hoje scripts/lote_rotulagem.py tem
   `_do_caso` fixando `caso.get("frente") != "riodoce"` e `fila()` lendo
   `rio_doce_decisoes.csv`. Crie `fila(frente="riodoce")` e passe a ler
   `{frente}_decisoes.csv`, mantendo o comportamento atual como padrão.
2. Medir: quantos casos da frente brumadinho caem na fila, por estrato de fonte
   (inteiro teor / ementa longa / ementa curta). Grave em
   logs/fila-brumadinho.json.
3. Só siga se a fila for maior que zero e o estrato estiver declarado.

PASSO 2 — ESCOLHER O MODELO (cadeia, nesta ordem)

1. S5-free (Maritaca) — grátis, 1M de contexto. Precisa de MARITACA_API_KEY, que
   não está gravada neste host: confira antes; se não houver, pule.
2. glm-4.5-flash (Z.ai) — grátis, ZAI_API_KEY já gravada. Contexto curto: use o
   texto recortado, nunca inteiro teor inteiro.
3. deepseek/deepseek-v4.1-flash-free (OrcaRouter) — grátis, 32k de contexto.
4. S5 pago — NÃO use sem autorização escrita do dono. Se for necessário, pare e
   pergunte, com número de casos e valor.

Ao cair de degrau, registre no log: hora, de qual modelo para qual, e o motivo
(429, 5xx, JSON inválido, contexto estourado). Resposta sem JSON conta como
falha.

PASSO 3 — RODAR COM CHECKPOINT

- Rubrica: tabelas/rubrica-rotulo-v3.txt (leia e use como system prompt).
- Checkpoint: tabelas/lotes_rotulo/sync-brumadinho-<modelo>.csv — um arquivo por
  modelo. Nunca reaproveite o nome de outro modelo.
- Escreva a linha e dê flush imediatamente. Interromper não pode perder nada.
- Use a trava de instância (scripts/single_instance.py). Duas instâncias no mesmo
  checkpoint é corrupção.
- Pausa entre chamadas: 1,1 s (60 RPM).
- max_tokens 9000 e `reasoning_effort: none` para modelos S5. Com `low` o modelo
  gasta 9 mil tokens pensando e devolve vazio.
- Rode desanexado por WMI, não por Start-Process: o lote tem de sobreviver ao
  fechamento do SSH.

PASSO 4 — CONFERIR O QUE SAIU

Rode, nesta ordem, e guarde a saída:

1. contagem de linhas do checkpoint e conferência de que todo processo está no
   acervo;
2. distribuição de conflito, lado_vencedor, motivo_indeterminado e confiança;
3. amostra de 20 linhas sorteadas: leia a evidência e confira se ela sustenta a
   tese. Divergência aqui é erro do catálogo, não do acervo;
4. taxa de "sem JSON" — se passar de 5%, o modelo não serve para este volume.

REGRAS INEGOCIÁVEIS

- Nenhum captcha, em nenhuma etapa, por nenhum caminho.
- Nenhum gasto sem autorização prévia do dono.
- Modelo rotula e cita; não conta. Total, percentual e taxa saem de contagem em
  CSV, nunca de resposta de modelo.
- CPF não entra em prompt. Se aparecer no texto, mascare antes.
- Não sobrescreva o polo do acervo publicado com o rótulo do lote: a concordância
  medida é de 26%. Divergência é achado, não erro a corrigir.
- Não publique, não rode deploy, não altere apps/web.

ENTREGA

1. CSV do checkpoint em tabelas/lotes_rotulo/.
2. Relatório curto em relatorios/CATALOGO-BRUMADINHO.md com: casos catalogados,
   distribuição por conflito, motivos de indeterminação, taxa de "sem JSON",
   modelo usado e tempo.
3. logs/fila-brumadinho.json com a medição do passo 1.
4. Lista de arquivos para o dono copiar por scp.

Relate no Telegram ao terminar (ou se parar), em 3 linhas, com o comando:
`gh workflow run telegram-report.yml -R FinweeJur/controle-popular -f titulo="[Brumadinho]" -f mensagem="<texto>"`

CRITÉRIO DE PRONTO

- [ ] fila medida e declarada
- [ ] 100% da fila catalogada ou parada explicada caso a caso
- [ ] "sem JSON" abaixo de 5%
- [ ] amostra de 20 conferida à mão
- [ ] relatório escrito com números que saem do CSV
- [ ] nada publicado, nada gasto sem autorização

SE CAIR ENERGIA OU CONEXÃO

Volte do checkpoint: ele está no CSV. Não recomece do zero, não apague linha, não
rode duas instâncias. Antes de retomar, confira se ficou processo Python vivo.
```

---

## Por que o prompt é assim

- **Mede antes de gastar chamada.** Fila de Brumadinho nunca foi medida; começar
  a rodar sem saber o tamanho é como o episódio dos 3.656 do Rio Doce.
- **Um CSV por modelo.** Em 04/11 a segunda passada sobrescreveu a primeira por
  reutilizar nome de arquivo.
- **Evidência literal obrigatória.** Sem trecho transcrito, o catálogo vira
  opinião do modelo.
- **Portão na amostra.** 20 linhas lidas à mão pegam erro sistemático que
  contagem não pega.
- **Nada de deploy.** Quem publica é a esteira do PC local, depois do crítico.
