# Facilitador de denúncia de violação de direitos humanos — plano

> Escrito em 13/08/2026, a pedido do dono. Este documento é o plano — não há
> código de feature nele. Números marcados como "medido" foram checados agora;
> o resto é decisão a defender ou pesquisa com fonte citada.

## O pedido, em uma frase

Um facilitador guiado — pergunta por pergunta, não formulário — que ajuda
alguém a registrar uma violação de direitos humanos, sugere prova e para onde
mandar, e entrega um **.docx que nunca é salvo em lugar nenhum que não seja o
computador da própria pessoa**.

## O requisito que decide a arquitetura inteira

"Um docx que não será salvo" não é detalhe — é a coisa mais importante deste
plano, e o motivo é físico: quem denuncia violação de direitos humanos pode
estar em risco. Um rascunho em servidor é prova contra a pessoa, obtível por
intimação, vazamento ou apreensão. Se a denúncia é contra agente do Estado, o
servidor de um portal de transparência **é exatamente o tipo de lugar que
esse agente saberia pedir para investigar**.

**O projeto já resolveu este problema uma vez**, em
`apps/web/lib/congresso/oficio/render-binario.ts`: o ofício ao Congresso gera
DOCX e PDF **no navegador**, via `await import()` de `docx` e `pdf-lib` — chunk
separado, baixado só quando a pessoa clica em "baixar". O comentário do
arquivo é explícito sobre o motivo original (tamanho do bundle do Worker,
teto de CPU do Free) — motivo técnico, não motivo de privacidade. Aqui o
motivo de privacidade **é o principal**, e o técnico vem de brinde: gerar
DOCX/PDF no servidor exigiria a rota aceitar o texto da denúncia como corpo
de requisição, e nesse instante ela já passou pelo Worker e está nos logs.
Reusar o caminho de `render-binario.ts` não é conveniência de código — é a
única forma de a garantia ("nunca sai do navegador") ser verdade em vez de
prometida. O plano usa a mesma dupla de bibliotecas e o mesmo padrão de
`await import()`.

**Consequência de design que decorre disso, direto**: nenhuma rota
`route.din.ts` recebe o texto da denúncia. O facilitador não tem "enviar" —
tem "baixar". Isso também descarta de saída qualquer necessidade do binding
`ratelimit` (`wrangler.jsonc`) que protege `zap`/`classificados`/`pageview`: não
existe escrita pública aqui para limitar, porque não existe escrita.

### O rascunho enquanto a pessoa preenche — escolha e defesa

A pergunta do dono: o rascunho pode ficar em `localStorage` enquanto a pessoa
preenche? Isso ajuda (não perde entrevista de 20 minutos se o navegador
fechar) e atrapalha (fica gravado no aparelho, que pode ser apreendido).

**Escolha: opt-in, não padrão.** Ao abrir o facilitador, nada é salvo. Existe
uma opção visível, mas **desmarcada por padrão** — "salvar rascunho neste
aparelho para continuar depois" — com o aviso ao lado, sem letra miúda: *"isto
grava o que você escreve NESTE computador ou celular. Se alguém tiver acesso
a ele — inclusive por apreensão — pode ler o rascunho. Só marque se este
aparelho for seu e for seguro."* Quem decide é a pessoa, porque só ela sabe se
o aparelho é dela, se é de uma lan house, de um telecentro, de um parente.
Um formulário não tem como adivinhar isso — só pode ou assumir o risco por
ela (padrão ligado) ou devolver a decisão (padrão desligado, que é o que se
propõe).

Quando ligado: expira sozinho (24h, `Date.now()` gravado junto) e tem um botão
**sempre visível**, não escondido em menu — "apagar tudo agora" — que roda
`localStorage.removeItem` e recarrega a tela em branco. Nenhuma tecla de
atalho, nenhuma confirmação de duas etapas: apreensão de aparelho não dá tempo
para isso.

### O que o servidor sabe mesmo sem receber a denúncia

Se a pessoa nunca envia dado, o servidor não sabe **o que ela escreveu** — mas
sabe que ela **visitou a página**: `CF-Connecting-IP`, data/hora, o caminho
acessado, ficam nos logs de observability do Worker (`wrangler.jsonc` →
`observability.enabled: true`), pela mesma arquitetura que hoje já registra
toda navegação do portal via `pageview`. Isso **precisa estar dito na tela**,
em uma frase, antes da primeira pergunta: *"o texto que você escreve fica só
no seu aparelho. O fato de você ter visitado esta página, com data e hora,
fica registrado como qualquer visita a este site."* Não é alarmismo — é a
mesma disciplina de "número na tela vem com a margem de erro" (seção 9 de
`docs/APRESENTACAO.md`) aplicada a privacidade: a garantia que o código
cumpre é dita, e a que não cumpre também.

### Retomar depois, ou levar a um advogado

Sem servidor guardando nada, "retomar depois" só existe de duas formas, e o
plano adota as duas: (1) o rascunho local com opt-in acima, dentro da janela
de 24h; (2) a pessoa já tem o `.docx` baixado — não precisa "importar" de
volta ao facilitador, porque o documento pronto **já é** o artefato que se
leva à Defensoria, ao advogado, ao NAJUP. Não há recurso de reabrir um
`.docx` salvo dentro do facilitador: implementar isso exigiria ler o arquivo
de volta no navegador (viável) mas soma complexidade sem necessidade real — o
documento pronto já cumpre esse papel sozinho.

## O roteiro — entrevista, não formulário

Pensado para quem está com medo, com raiva ou exausto, não para quem tem
tempo. Cada pergunta vem com ajuda em linguagem comum, nunca em campo mudo.

| Ordem | Pergunta | Por que aqui, e como perguntar |
|---|---|---|
| 0 | (tela de abertura) aviso de privacidade + opção de rascunho local | vem antes de qualquer pergunta, não depois — decisão informada não pode vir depois do dado já ter sido digitado |
| 1 | Quando começou? | Aceita resposta aproximada — **"mais ou menos quando? Pode ser só o mês, ou 'faz uns 2 anos', não precisa de data exata"**. Data é o que mais decide prazo (inclusive o prazo de 6 meses da CIDH, abaixo) e o que a pessoa lembra pior sob estresse — exigir precisão que ela não tem trava a entrevista no primeiro campo |
| 2 | Continua acontecendo? | Sim / Não / Não sei — muda tudo, ver abaixo |
| 3 | Onde foi? | Cidade (lista dos municípios do portal, com campo livre se não estiver na lista) — decide competência (delegacia, comarca, promotoria) junto com a data |
| 4 | Quais são as forças/pessoas/entidades em conflito? | Não se responde sem exemplo: **"pode ser uma pessoa (um vizinho, um chefe), uma empresa, ou um agente do Estado (policial, fiscal, funcionário público). Marque quantas se aplicarem."** — checkboxes, não campo livre, porque é a resposta que mais alimenta o roteamento de destino |
| 5 | O que aconteceu? | Campo livre, mas com perguntas de apoio ao lado, não substituindo: o que foi feito, quem sofreu, quem mais viu |
| 6 | Tem alguma prova? | Ver seção de provas abaixo |
| 7 | (calculado) Sugestão de para onde enviar | Ver seção de destino abaixo — só aparece depois das perguntas 2–4, porque é delas que a sugestão nasce |
| 8 | Gerar o documento | Botão "baixar .docx" — nada de "enviar" |

**"Continua acontecendo?" muda a orientação inteira.** Violação em curso pede
**medida cautelar** — canal de urgência (delegacia, disque 190/181/100,
plantão da Defensoria), porque o próximo dia pode ainda causar dano. Violação
encerrada pede reunir prova e histórico primeiro, porque o que resta a
proteger não é a integridade física imediata, é a prova que se deteriora com
o tempo (memória, vestígio físico, disponibilidade de testemunha). O
facilitador muda o texto de orientação — não só a lista de destino — conforme
essa resposta.

## Provas — a parte mais útil e a mais perigosa

Cada ferramenta abaixo foi checada agora (link, o que é, o que faz), **e o
que ela NÃO garante vem ao lado, nunca em rodapé à parte** — recomendar sem
ressalva é dar falsa segurança, e falsa segurança em denúncia de direitos
humanos custa caro.

| Situação | Ferramenta gratuita | O que garante | O que NÃO garante |
|---|---|---|---|
| Fotografar/filmar com metadado à prova de alteração | **ProofMode** (Guardian Project / WITNESS — Android e iOS, código aberto) — grava GPS, hora, dados de sensor e assina criptograficamente cada foto/vídeo no momento da captura ([site](https://proofmode.org/), [Guardian Project](https://guardianproject.info/apps/org.witness.proofmode/)) | Autenticidade técnica da captura — difícil de forjar depois | Não é laudo pericial. E o app **precisa estar instalado e ativo antes** do fato — não resgata foto já tirada pela câmera nativa |
| Documentar para uso eventual em processo, com cadeia de custódia | **eyeWitness to Atrocities** (International Bar Association — Android, gratuito) — embute metadado no instante da captura e envia a um repositório com registro de quem teve acesso ([LexisNexis Rule of Law Foundation](https://www.lexisnexisrolfoundation.org/projects/eyewitness.aspx?p=projects)) | Cadeia de custódia documentada — já usado como prova aceita em tribunal (RD Congo, 2018) | Envia o arquivo a um servidor de terceiros fora do Brasil — é o oposto do "não sai do aparelho" deste facilitador, e deve ser dito assim à pessoa |
| Preservar uma página da internet antes que ela saia do ar | **Wayback Machine — "Save Page Now"** (`web.archive.org`, Internet Archive, gratuito, sem cadastro) — gera um link permanente com data de captura | Prova de que o conteúdo existia naquela URL naquele momento | Não captura conteúdo atrás de login, nem tudo que é JavaScript dinâmico; o site pode bloquear o robô do Archive |
| Gravar áudio | Gravador nativo do celular + enviar cópia para um segundo lugar (e-mail próprio, ou WhatsApp "mensagem para mim mesmo") | Registro do som, com data/hora do sistema do aparelho | Data do sistema é **alterável no próprio aparelho** — não é carimbo de tempo confiável sozinho; some se o aparelho for apreendido e a cópia não foi feita |
| Print de tela | Print nativo | Rápido | **Frágil por si só**: sem metadado de captura, fácil de contestar como editado. Prefira "Save Page Now" para página da internet, e o print só como reforço |
| Foto de celular comum (sem ProofMode) | Câmera nativa | Registra a imagem | **Não é laudo**. Metadado (localização, hora) existe no arquivo original, mas **é removido pela maioria dos apps de mensagem ao compartilhar** (WhatsApp, Telegram) — envie o arquivo original por e-mail ou USB, nunca só por print da conversa |

**O oposto do que se espera: gravar prova também expõe quem grava.** Se a
pessoa filma um agente do Estado e o telefone é apreendido no local, o vídeo
vira prova contra ela mesma — de que ela estava lá, de que gravou, e o
próprio aparelho sai de sua posse. O facilitador precisa dizer isto de forma
direta, na mesma tela que sugere as ferramentas: *"gravar tem risco. Se for
seguro, envie a gravação para outro lugar (e-mail, nuvem) assim que puder,
antes de guardar só no aparelho. Avalie se é mais seguro registrar depois,
de memória, do que gravar no momento."* Não é o facilitador dizendo para não
gravar — é dizer que a decisão tem um custo, para que seja da pessoa e
informada.

## Para onde enviar — e o roteamento por resposta

O portal já tem o que este facilitador precisa **e não deve repesquisar**:

- `docs/REDE-PROTECAO-MG.md` / `apps/web/lib/betim/redeProtecao.ts` —
  Defensoria (109–110 comarcas), MPMG/CAODH, delegacias especializadas (DEAM,
  DECRIN, DEADI, DOPCAD), CNDH (Disque 100), OAB, RENAP, clínicas jurídicas
  (DAJ-UFMG, SAJ-PUC Minas)
- o microssistema `/ambiental` — 30 instrumentos normativos e 15 precedentes,
  quatro deles da Corte Interamericana (Lhaka Honhat, Escher, OC-23/17,
  OC-32/23 — confirmado em `docs/MICROSSISTEMA-LACUNAS.md`), para quando a
  violação é ambiental, quilombola, indígena ou de comunidade tradicional

**Regra de roteamento — determinística, a partir das respostas 2–4, nunca do
texto livre da pergunta 5** (mesma disciplina de "dado inventado não é
publicado" — não é um modelo de linguagem interpretando a denúncia e
inventando um destino):

| Resposta (perguntas 2–4) | Sugestão | Por quê |
|---|---|---|
| Envolve criança/adolescente | Conselho Tutelar do município + Disque 100 | plantão para casos urgentes, inclusive fora do horário comercial |
| Violência contra a mulher | DEAM + Disque 180 + Defensoria | única DEAM 24h fica em BH; nas demais cidades, delegacia comum + Defensoria |
| Um dos "em conflito" é agente do Estado (policial, fiscal, funcionário público) | MPMG/CAODH (controle da atividade policial) + Defensoria + registrar que **não é caso para resolver sozinho com a própria corporação do agente** | é o cenário descrito pelo dono como o de maior risco |
| Racismo, xenofobia, LGBTfobia | DECRIN + MPMG | delegacia especializada existe só para isso |
| Pessoa com deficiência ou idosa, vítima | DEADI + Defensoria | delegacia especializada |
| Quilombola, indígena, comunidade tradicional, ou dano ambiental | Defensoria + MPMG/CAOMA + link para `/ambiental` (instrumento e precedente pelo tema) | é onde o portal já tem profundidade jurídica própria |
| Nenhuma das anteriores, ou "não sei" | Defensoria (porta de entrada gratuita quase universal) + Ouvidoria do MPMG (127) + CNDH (Disque 100) | quando não há certeza, **sugerir mais de um e dizer por quê é melhor que fingir precisão** — é a instrução literal do dono, e é a atitude certa: mandar para o lugar errado gasta o único fôlego que a pessoa tinha |

Toda sugestão vem com o texto de `docs/REDE-PROTECAO-MG.md` (endereço,
telefone, gratuidade, data da última verificação) — nunca reescrita de
memória, para não divergir do documento que já foi checado fonte a fonte.

### Sobre a CIDH, especificamente

O dono pediu precisão aqui porque o erro mais caro é silencioso: mandar
petição à Comissão Interamericana sem ter passado pelas vias internas
**tem o caso inadmitido, e ninguém avisa a pessoa disso antes**.

Pesquisado agora (Regulamento da CIDH e material de referência — fontes ao
final):

- **Esgotamento dos recursos internos é regra**, não sugestão: a Comissão
  verifica se os recursos da jurisdição interna (delegacia, Ministério
  Público, Judiciário brasileiro) foram interpostos e esgotados antes de
  aceitar a petição.
- **Exceções existem**, e são três: não há devido processo legal interno
  disponível; a pessoa foi impedida de acessar os recursos internos; ou há
  atraso injustificado na decisão sobre esses recursos.
- **Prazo de 6 meses** a partir da notificação da decisão interna final —
  ou, quando cabe uma das três exceções, "prazo razoável" a critério da
  própria Comissão, contado da data da violação.
- **Quem pode peticionar**: qualquer pessoa, grupo de pessoas, ou entidade
  não-governamental legalmente reconhecida em Estado-membro da OEA — **não
  precisa ser a vítima**, o que importa para quem denuncia em nome de outra
  pessoa em risco.

O facilitador **não oferece a CIDH como primeiro destino em nenhum
cenário** — ela aparece só na tela de resultado, como informação, com este
texto fixo: *"a Comissão Interamericana normalmente não é o primeiro passo:
ela exige, salvo exceções, que você já tenha buscado a Justiça brasileira
antes. Isto não é aconselhamento jurídico — leve esta dúvida à Defensoria ou
a um advogado antes de enviar qualquer coisa à CIDH."*

## Fases de implementação

Ordem por valor entregue, não por dificuldade — e quase tudo cabe **sem
banco**, porque o documento nasce no navegador:

1. **Fase 1 — o facilitador em si.** Página client-side em rota nova (ex.:
   `/direitos-humanos/denuncia`), roteiro de perguntas, geração de `.docx`
   reusando o padrão de `renderDocx` (`render-binario.ts`), tela de aviso de
   privacidade antes da primeira pergunta, rascunho opt-in em `localStorage`
   com expiração e botão de apagar. Zero banco, zero rota `.din.ts` nova.
2. **Fase 2 — PDF junto**, reusando `renderPdf` do mesmo arquivo — mesma
   lógica de `await import()`, mesmo motivo (a pessoa pode preferir o
   formato que abre em qualquer celular).
3. **Fase 3 — roteamento por dado do próprio portal.** Hoje a sugestão de
   destino é estática por resposta; nesta fase ela pode ler, por município,
   o que o portal já tem (ex.: se existe delegacia especializada mapeada
   perto da cidade escolhida) — só depois de a Fase 1 provar o roteiro
   básico.
4. **Fora de escopo, por decisão, não por esquecimento**: qualquer contagem
   de uso que grave conteúdo. Se o dono quiser saber que o facilitador está
   sendo usado, o mecanismo de `pageview` já existente (sem dado pessoal, já
   auditado) cobre isso — não se cria coleta nova para medir engajamento de
   uma ferramenta de denúncia de risco.

## Riscos

- **O portal parecer dar orientação jurídica que não pode dar.** Toda tela de
  resultado leva o aviso "isto não é aconselhamento jurídico" — mesma
  disciplina do restante do portal (o Controle Popular publica dado e
  aponta caminho, não substitui advogado). Risco maior aqui que em qualquer
  outra tela do site, porque o assunto é sensível e a pessoa está sob
  estresse — reforçar o aviso onde a sugestão de destino aparece, não só no
  rodapé.
- **Roteamento errado gasta o único fôlego que a pessoa tinha.** Mitigado por
  desenho: nunca uma sugestão única quando a resposta é ambígua — sempre
  mais de uma opção com o porquê de cada uma, nunca fingindo certeza que a
  pergunta 4 (múltipla escolha, sem texto livre) não permite ter.
- **O rascunho local, mesmo opt-in, é risco físico real se a pessoa errar a
  decisão** (marcar em aparelho que não é seguro). Mitigado pelo aviso
  explícito no momento da escolha e pelo botão de apagar sempre visível —
  não elimina o risco, porque a decisão é dela e tem de continuar sendo.
- **`docs/REDE-PROTECAO-MG.md` tem lacunas already registradas** (seção "Não
  verificado" do próprio documento — delegacias fora de BH, comissões de DH
  de câmaras municipais, contato de OAB-MG). O facilitador herda essas
  lacunas: quando a sugestão cair numa delas, mostrar o mesmo aviso do
  documento-fonte ("confirme por telefone antes de se deslocar"), nunca
  apagar a incerteza para parecer mais pronto do que é.
- **O microssistema `/ambiental` tem lacunas próprias**, documentadas em
  `docs/MICROSSISTEMA-LACUNAS.md` (proteção de serras e de flora/fauna, por
  exemplo, não têm instrumento no acervo hoje). Rotear para lá é o caminho
  certo, mas o facilitador não deve prometer cobertura que o próprio acervo
  ainda não tem.

## Fontes consultadas nesta pesquisa

- Regulamento da CIDH: https://www.oas.org/pt/CIDH/jsForm/?File=%2Fpt%2Fcidh%2Fmandato%2Fbasicos%2Freglamentocidh.asp
- Folheto informativo — Sistema de Petições e Casos (CIDH):
  http://www.oas.org/es/cidh/docs/folleto/CIDHFolleto_port.pdf
- ProofMode: https://proofmode.org/ e https://guardianproject.info/apps/org.witness.proofmode/
- eyeWitness to Atrocities: https://www.lexisnexisrolfoundation.org/projects/eyewitness.aspx?p=projects
- Wayback Machine / Save Page Now: https://blog.archive.org/2019/10/23/the-wayback-machines-save-page-now-is-new-and-improved/
