# Prompt para o Claude in Chrome — pendências do Portal Ecosistemas

> Cole o texto abaixo no painel lateral do Claude in Chrome, com a aba já
> aberta e logada em `https://ecosistemas.meioambiente.mg.gov.br/`. O
> resultado (a resposta que ele te der) é o que deve ser colado de volta nesta
> conversa — é a partir dele que o coletor/integração no site continua.
>
> Este arquivo é só o rascunho do prompt (não faz parte do código do projeto);
> não precisa entrar no commit.

---

```
Estou logado em https://ecosistemas.meioambiente.mg.gov.br/ (Portal
Ecosistemas da SEMAD, Minas Gerais). Preciso que você investigue 4 sistemas
dentro desse portal, como consulta de dados — sem alterar nada, sem enviar
formulário nenhum que grave ou envie algo (nada de "Fale Conosco", "Enviar",
"Protocolar" etc.), só leitura e exportação de consulta.

REGRA DE PARADA, sem exceção: se em qualquer momento aparecer uma tela pedindo
login/senha (a sessão pode ter expirado), OU um desafio de CAPTCHA que bloqueie
seguir em frente, PARE nesse sistema, registre exatamente onde parou, e passe
para o próximo item da lista. Não tente logar de novo, não tente resolver o
CAPTCHA, não peça pra mim credencial nenhuma.

Para cada um dos 4 sistemas abaixo, meu objetivo final é o mesmo em todos:
descobrir se dá pra consultar dado real filtrado por MUNICÍPIO (queria saber
por Betim-MG, código IBGE 3106705, mas visão geral de Minas Gerais também
serve), e se sim, capturar a FORMA dos dados: quais colunas/campos existem,
alguns exemplos reais de linha, quantos registros no total ou pelo menos uma
ordem de grandeza, e se existe uma forma de exportar (Excel/CSV) ou uma URL de
API por trás da tela (abra o DevTools/Network do navegador e veja se alguma
chamada XHR/fetch te dá o dado direto em JSON — isso é mais valioso do que só
ler a tabela na tela).

1. SIGIBAR — Gestão de Barragens
   Link "Gestão de Barragens" na home, ou
   https://ecosistemas.meioambiente.mg.gov.br/sigibar-ui/#/acessoExterno
   Vai aparecer uma pergunta "Bem vindo... Deseja prosseguir?" com Sim/Não.
   Clique Sim. Se passar direto para uma listagem de barragens, ótimo — quero
   saber se dá pra filtrar por município e quantas barragens aparecem pra
   Minas Gerais no total (comparar com os números 249/259/320 já vistos em
   outras fontes seria o ideal, mas só se aparecer natural). Se em vez disso
   aparecer um desafio de CAPTCHA, aplique a regra de parada acima e vá pro
   próximo item.

2. CAP — Consulta Geral de Autos de Infração e Arrecadação
   Link "Consulta Geral de Autos de Infração e Arrecadação" na home, ou
   https://ecosistemas.meioambiente.mg.gov.br/consulta-ai
   Selecione em "DADOS EXIBIDOS" a opção "Dados da Infração", depois em
   "MUNICÍPIO" selecione Betim (ou, se não achar Betim na lista, qualquer
   município grande de MG). Clique "Consultar". Me diga: quantos resultados
   voltaram, quais colunas a tabela de resultado tem, e cole 2-3 linhas de
   exemplo. Tente também o botão "Exportar pesquisa" e me diga se ele baixa um
   arquivo (Excel) — não precisa abrir o arquivo, só confirmar que baixou e
   qual o nome/tamanho aproximado. Se o DevTools mostrar uma chamada de rede
   (Network tab) disparada pelo botão "Consultar", me copie a URL completa e o
   corpo da requisição (o "Payload"/"Request body") — isso é o item mais
   importante desta consulta.

3. PECMA — Programa Estadual de Conversão de Multas
   Procure na home ou no menu do portal por "PECMA" ou "Conversão de Multas".
   Se não achar um link direto, tente
   https://ecosistemas.meioambiente.mg.gov.br/pecma (pode não existir — se der
   404 ou página não encontrada, me diga isso e pule). Uma pesquisa anterior
   (de julho) achou que esse sistema exige login pra ver detalhe de processo
   individual — como agora você ESTÁ logado, veja se dá pra abrir uma consulta
   e, se sim, se ela filtra por município. Quero saber se existe alguma lista
   ou busca de processos (não precisa ser de Betim especificamente — qualquer
   processo real serve de exemplo), quais campos aparecem, e se há algum
   agregado por município.

4. Sistemas do IGAM ainda não verificados: DAURH, MIRA, SGBH, SIGMA
   Esses nomes vieram de uma lista de "Serviços Digitais do Sisema" que ainda
   não foi conferida individualmente:
   - IGAMDAURH — Declaração Anual de Uso de Recursos Hídricos
   - IGAMMIRA — Monitoramento Remoto Integrado das Águas
   - IGAMSGBH — Gestão de Bacias Hidrográficas
   - IGAMSIGMA — Gestão do Monitoramento das Águas
   Procure esses nomes no menu/busca do portal (ou em igam.mg.gov.br, que é
   onde a maioria dos sistemas do IGAM está linkada). Para CADA um que achar:
   é só um formulário de cadastro/petição (não serve pra nós), ou tem alguma
   CONSULTA PÚBLICA de dado já cadastrado? Se tiver consulta, mesma pergunta
   de sempre: filtra por município, quantos registros, quais colunas, dá pra
   exportar. Se um nome não aparecer em lugar nenhum depois de uma busca
   razoável, apenas diga "não encontrado" e siga pro próximo — não precisa
   virar uma investigação longa por item.

Quando terminar os 4 itens (ou parar em algum por login/CAPTCHA), me dê um
resumo organizado por item, nesse formato pra cada um:

  ### <nome do sistema>
  Status: <consegui acessar / parei por login / parei por CAPTCHA / não encontrado>
  URL usada: <...>
  Filtra por município: <sim/não, como>
  Registros: <número ou ordem de grandeza>
  Colunas/campos vistos: <lista>
  Exemplo de linha real: <...>
  API por trás (se achou via Network tab): <URL + método + payload>
  Exportação: <sim/não, formato>
  Observações: <qualquer coisa estranha que valha registrar>

Não precisa ser bonito — é pra eu colar esse resumo numa outra conversa que
vai usar isso pra decidir se vale escrever um coletor de dados. Prefiro um
"não sei" ou "não achei" honesto do que um palpite.
```
