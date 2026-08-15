/**
 * editar-pagina.mts — corrige título e descrição de uma página sem mexer em código.
 *
 *   npx tsx scripts/editar-pagina.mts --listar
 *   npx tsx scripts/editar-pagina.mts --rota /bh/saude --titulo "Saúde em BH" \
 *       --por "Artur" --motivo "faltava o nome da cidade"
 *   npx tsx scripts/editar-pagina.mts --rota /bh/saude --remover --por "Artur" --motivo "voltou ao padrão"
 *
 * Fase 1 de `docs/PLANO-PAINEL-EDICAO.md`, na linha de comando em vez de num
 * painel web — e isso é escolha, não atalho. Aquele documento dedica uma seção
 * inteira a por que o painel **não pode estar na internet**; um CLI na máquina
 * de build resolve o mesmo caso de uso com superfície de ataque zero. O painel
 * web fica para quando alguém que não usa terminal precisar editar.
 *
 * ## O que este script NÃO faz, de propósito
 *
 * Não publica. Editar grava o arquivo na hora; o site muda no **próximo
 * build**. É a assimetria que o plano faz questão de deixar à vista — "salvar"
 * e "publicar" são ações diferentes, e a mensagem final avisa quantas edições
 * estão à espera de publicação.
 *
 * Não apaga nem renomeia página: são as fases 2 e 3, e cada uma tem uma janela
 * de inconsistência própria que o plano descreve.
 *
 * ## Trilha
 *
 * O arquivo é versionado. `git log -p apps/web/data/edicoes.json` responde quem
 * mudou o quê e quando, e `git revert` desfaz. Por isso `--por` e `--motivo`
 * são obrigatórios: edição sem motivo é edição que ninguém audita depois.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARQUIVO = path.join(RAIZ, "apps", "web", "data", "edicoes.json");

interface Edicao {
  rota: string;
  titulo?: string;
  descricao?: string;
  por: string;
  em: string;
  motivo: string;
}

function ler(): Edicao[] {
  try {
    return (JSON.parse(readFileSync(ARQUIVO, "utf-8")).edicoes ?? []) as Edicao[];
  } catch {
    return [];
  }
}

function gravar(edicoes: Edicao[]) {
  mkdirSync(path.dirname(ARQUIVO), { recursive: true });
  edicoes.sort((a, b) => a.rota.localeCompare(b.rota));
  writeFileSync(ARQUIVO, JSON.stringify({ edicoes }, null, 2) + "\n", "utf-8");
}

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function normalizar(rota: string): string {
  const limpa = rota.trim().replace(/\/+$/, "");
  return limpa.startsWith("/") ? limpa : `/${limpa}`;
}

/**
 * Rejeita rota que não parece rota.
 *
 * A armadilha real desta máquina: no Git Bash, `--rota /paraopeba/entenda`
 * chega ao script como `/C:/Program Files/Git/paraopeba/entenda`. O MSYS
 * converte todo argumento que começa com `/` em caminho do Windows, sem avisar
 * ninguém. Sem esta checagem o script grava a rota deformada, imprime "gravada
 * com sucesso", e a edição nunca aparece no site — o pior desfecho possível,
 * porque parece que funcionou.
 */
function validar(rota: string) {
  if (/^\/[a-zA-Z]:\//.test(rota) || rota.includes("\\")) {
    console.error(
      `A rota chegou deformada: ${rota}\n` +
        "É o Git Bash convertendo argumento iniciado por '/' em caminho do Windows.\n" +
        "Rode pelo PowerShell, ou prefixe o comando com MSYS_NO_PATHCONV=1."
    );
    process.exit(2);
  }
  if (!/^\/[\w\-./[\]]*$/.test(rota)) {
    console.error(`Rota inválida: ${rota}\nEsperado algo como /bh/saude ou /paraopeba/clipping.`);
    process.exit(2);
  }
}

const edicoes = ler();

if (process.argv.includes("--listar")) {
  if (!edicoes.length) {
    console.log("Nenhuma edição gravada. O site mostra exatamente o que o código gera.");
  } else {
    for (const e of edicoes) {
      console.log(`${e.rota}`);
      if (e.titulo) console.log(`  título:    ${e.titulo}`);
      if (e.descricao) console.log(`  descrição: ${e.descricao}`);
      console.log(`  ${e.por}, ${e.em.slice(0, 10)} — ${e.motivo}`);
    }
    console.log(`\n${edicoes.length} edição(ões). Elas entram no ar no próximo build.`);
  }
  process.exit(0);
}

const rota = arg("rota");
const por = arg("por");
const motivo = arg("motivo");

if (!rota || !por || !motivo) {
  console.error(
    "Faltou --rota, --por ou --motivo.\n" +
      "Os três são obrigatórios: edição sem autor e sem motivo é edição que ninguém audita depois.\n" +
      "Use --listar para ver o que já está gravado."
  );
  process.exit(2);
}

const alvo = normalizar(rota);
validar(alvo);
const restantes = edicoes.filter((e) => normalizar(e.rota) !== alvo);

if (process.argv.includes("--remover")) {
  if (restantes.length === edicoes.length) {
    console.error(`Não havia edição para ${alvo}. Nada mudou.`);
    process.exit(1);
  }
  gravar(restantes);
  console.log(`Removida a edição de ${alvo}. A página volta ao que o código gera — no próximo build.`);
  process.exit(0);
}

const titulo = arg("titulo");
const descricao = arg("descricao");
if (!titulo && !descricao) {
  console.error("Nada a mudar: informe --titulo, --descricao, ou os dois.");
  process.exit(2);
}

// A data é a da EDIÇÃO, não a da publicação. As duas se separam por 15 a 20
// minutos de build, e confundi-las esconderia justamente o intervalo em que o
// site ainda mostra o texto antigo.
const nova: Edicao = {
  rota: alvo,
  ...(titulo ? { titulo } : {}),
  ...(descricao ? { descricao } : {}),
  por,
  em: new Date().toISOString(),
  motivo,
};

gravar([...restantes, nova]);
console.log(`Gravada a edição de ${alvo}.`);
console.log(
  `\n⚠️ Isto NÃO publicou. São ${restantes.length + 1} edição(ões) esperando o próximo build ` +
    `(\`npx tsx scripts/rotina-local.mts\` na máquina de build, 15 a 20 minutos).`
);
