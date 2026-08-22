/**
 * Reduz as 43.444 decisões de licenciamento ambiental de MG ao que cabe no
 * repo — guardando **inteiras** as que importam.
 *
 * ═══ POR QUE ESTA FONTE EXISTE, E O QUE SÓ ELA MOSTRA ═══
 *
 * O WFS de licenças da IDE-Sisema mostra quem **recebeu** licença. Esta base
 * mostra a decisão, e por isso mostra o que some do outro lado: medido em
 * 21/08/2026, das 43.444 decisões, **4.293 são indeferidas, 3.763 arquivadas
 * e 1.489 canceladas** — 9.545 negativas (22%) que não aparecem num acervo de
 * licenças concedidas.
 *
 * Deferidas são 33.890. Ou seja: quem olha só o WFS vê 78% da história e
 * conclui que o licenciamento aprova quase tudo sem exceção. A recusa existe,
 * e é aqui.
 *
 * ═══ O CORTE: NEGATIVA INTEIRA, DEFERIDA AGREGADA ═══
 *
 * O JSON bruto tem **38 MB** — acima do que o repo comporta e três ordens de
 * grandeza acima do teto de 3 MiB gzip por rota do Worker.
 *
 * Mas cortar por igual seria perder o que a fonte tem de único. Então:
 * · as **9.545 negativas** (indeferida, arquivamento, cancelada, suspensa)
 *   vão INTEIRAS — são o achado, e são poucas o bastante para caber;
 * · as **33.890 deferidas** viram agregado (por ano, município, classe,
 *   modalidade, atividade). Quem quiser a linha da deferida vai na fonte pelo
 *   `link_ficha`, que vai preservado nas negativas.
 *
 * O bruto fica em `X:\DevCoder\_lote-ambiental\saida\decisoes.json`, fora do
 * versionamento, e este script é o caminho reproduzível bruto → publicável.
 *
 * ═══ O QUE NÃO SE FAZ AQUI ═══
 *
 * ⚠️ **Indeferimento não é irregularidade do empreendedor.** Pode ser projeto
 * incompleto, desistência, mudança de modalidade. A tela mostra a decisão como
 * o Estado a publicou; não afirma culpa.
 *
 * ⚠️ **Pessoa física não vai nominal — e a flag da fonte não basta.** 9.298 das
 * 43.444 decisões têm `eh_pessoa_fisica`. Mas 20 negativas trazem CPF válido
 * colado ao nome e vêm marcadas como CNPJ: a classificação da fonte erra. A
 * redação é por dígito verificador sobre o texto, não pela flag.
 *
 * ⚠️ **264 decisões estão sem município resolvido** (de 839 municípios
 * distintos). Vão num balde próprio, contadas e declaradas — nunca somadas a
 * um município real nem descartadas em silêncio.
 *
 * Uso: npx tsx scripts/agregar-decisoes-licenciamento.mts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BRUTO = "X:/DevCoder/_lote-ambiental/saida/decisoes.json";
const DESTINO = resolve(RAIZ, "etl/betim/dados/decisoes-licenciamento-mg.json");

/** As que o acervo de licenças concedidas não mostra. */
const NEGATIVAS = new Set(["Indeferida", "Arquivamento", "Cancelada", "Suspensa", "Licença Suspensa"]);

interface Decisao {
  id_fonte: string;
  regional: string | null;
  municipio_nome: string | null;
  municipio_id: string | null;
  nome_empreendimento: string | null;
  cnpj_raiz: string | null;
  eh_pessoa_fisica: string | boolean;
  numero_processo: string | null;
  modalidade: string | null;
  classe: string | null;
  atividade_codigo: string | null;
  atividade_descricao: string | null;
  ano: string | number | null;
  data_publicacao_iso: string | null;
  decisao: string | null;
  link_ficha: string | null;
}

function ehPessoaFisica(d: Decisao): boolean {
  return d.eh_pessoa_fisica === true || String(d.eh_pessoa_fisica).toLowerCase() === "true";
}

/** Dígito verificador de CPF. Formato não basta: `000.000.000-00` tem forma de
 *  CPF e não é ninguém; `04130157698` não tem pontuação e é uma pessoa real. */
function cpfValido(bruto: string): boolean {
  const c = bruto.replace(/\D/g, "");
  if (c.length !== 11) return false;
  // Onze dígitos iguais passam no mod-11 por acidente e não são CPF de
  // ninguém — barrar antes de calcular.
  if (c.split("").every((d) => d === c[0])) return false;
  for (const n of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(c[i]) * (n + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(c[n])) return false;
  }
  return true;
}

/**
 * Redige CPF de dentro do texto, por CHECKSUM.
 *
 * ⚠️ **A flag `eh_pessoa_fisica` da fonte MENTE.** Medido em 21/08: 20 decisões
 * negativas trazem CPF válido colado ao nome
 * ("BEATRIZ APARECIDA ... 04130157698") e **todas as 20 vêm marcadas como
 * `eh_pessoa_fisica: false` e `documento_classificacao: "cnpj"`.** Uma primeira
 * versão deste script confiou na flag, publicou os 20 num repositório PÚBLICO,
 * e só o teste `sem-cpf-no-repo.test.ts` pegou.
 *
 * Por isso a redação é por dígito verificador sobre TODO campo de texto, e não
 * por classificação declarada. Quando há CPF no nome, o nome inteiro sai: o
 * nome de pessoa física é dado pessoal por si só.
 */
function redigirTexto(v: string | null): string | null {
  if (!v) return v;
  const achados = v.match(/(?<!\d)\d{11}(?!\d)|\d{3}\.\d{3}\.\d{3}-\d{2}/g) ?? [];
  return achados.some(cpfValido) ? null : v;
}

/** Pessoa física não vai nominal — nem no acervo publicado, nem no CSV. */
function semNomeDePessoa(d: Decisao) {
  const pf = ehPessoaFisica(d);
  const nome = pf ? null : redigirTexto(d.nome_empreendimento);
  return {
    ...d,
    // Se o nome caiu por conter CPF, a fonte classificou errado: marque isso
    // no dado, em vez de deixar `eh_pessoa_fisica: false` mentindo no arquivo.
    eh_pessoa_fisica: pf || (d.nome_empreendimento !== null && nome === null),
    nome_empreendimento: nome,
    cnpj_raiz: pf || nome === null ? null : d.cnpj_raiz,
  };
}

function contar(linhas: Decisao[], chave: (d: Decisao) => string | null, teto?: number) {
  const m = new Map<string, number>();
  for (const l of linhas) {
    const k = chave(l);
    if (k === null || k === "" || k === "None") continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  const lista = [...m.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"));
  return teto ? lista.slice(0, teto) : lista;
}

const bruto = JSON.parse(readFileSync(BRUTO, "utf8"));
const todas: Decisao[] = bruto.decisoes ?? [];

if (todas.length < 40_000) {
  throw new Error(`só ${todas.length} decisões — o bruto tinha 43.444. Abortando antes de gravar.`);
}

const negativas = todas.filter((d) => NEGATIVAS.has(String(d.decisao)));
const deferidas = todas.filter((d) => !NEGATIVAS.has(String(d.decisao)));

const porAno = (() => {
  const m = new Map<number, { deferidas: number; negativas: number }>();
  for (const d of todas) {
    const ano = Number(d.ano);
    if (!Number.isInteger(ano) || ano < 1990 || ano > 2030) continue;
    const atual = m.get(ano) ?? { deferidas: 0, negativas: 0 };
    if (NEGATIVAS.has(String(d.decisao))) atual.negativas += 1;
    else atual.deferidas += 1;
    m.set(ano, atual);
  }
  return [...m.entries()].map(([ano, v]) => ({ ano, ...v })).sort((a, b) => a.ano - b.ano);
})();

const semMunicipio = todas.filter((d) => !d.municipio_nome || d.municipio_nome === "None").length;

const agregado = {
  fonte: bruto.fonte ?? "sistemas.meioambiente.mg.gov.br/licenciamento — consulta de decisões",
  geradoEm: bruto.gerado_em ?? null,
  agregadoEm: new Date().toISOString().slice(0, 10),
  total: todas.length,
  observacao:
    "As negativas vão inteiras (são o achado); as deferidas viram agregado. O bruto (38 MB, 43.444 linhas) fica fora do repo.",
  avisoIndeferimento:
    "Indeferimento não é irregularidade do empreendedor: pode ser projeto incompleto, desistência ou mudança de modalidade. Esta é a decisão como o Estado a publicou.",
  avisoPessoaFisica:
    "Titular pessoa física não aparece nominalmente. Ficam município, atividade e decisão.",

  porDecisao: contar(todas, (d) => d.decisao),
  totalNegativas: negativas.length,
  totalDeferidas: deferidas.length,
  porAno,
  municipiosDistintos: new Set(todas.map((d) => d.municipio_nome).filter((m) => m && m !== "None")).size,
  semMunicipioResolvido: semMunicipio,
  pessoaFisica: todas.filter(ehPessoaFisica).length,

  /** Só das deferidas — as negativas vão inteiras logo abaixo. */
  deferidasPorMunicipio: contar(deferidas, (d) => d.municipio_nome, 200),
  deferidasPorClasse: contar(deferidas, (d) => d.classe),
  deferidasPorModalidade: contar(deferidas, (d) => d.modalidade),
  deferidasPorAtividade: contar(deferidas, (d) => d.atividade_descricao, 120),
  deferidasPorRegional: contar(deferidas, (d) => d.regional),

  /** O que o acervo de licenças concedidas não mostra. Inteiras. */
  negativas: negativas.map(semNomeDePessoa),
};

writeFileSync(DESTINO, JSON.stringify(agregado, null, 1), "utf-8");

console.log(`total:      ${todas.length.toLocaleString("pt-BR")}`);
console.log(`  deferidas:  ${deferidas.length.toLocaleString("pt-BR")}`);
console.log(`  negativas:  ${negativas.length.toLocaleString("pt-BR")} (inteiras no arquivo)`);
console.log(`municípios: ${agregado.municipiosDistintos} (+${semMunicipio} sem resolver)`);
console.log(`pessoa física: ${agregado.pessoaFisica.toLocaleString("pt-BR")} (sem nome no publicado)`);
console.log(`gravado: ${DESTINO}`);
