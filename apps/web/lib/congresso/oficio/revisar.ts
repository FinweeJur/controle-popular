import { gerarTexto, identificacaoModelo, LLMIndisponivel } from "@/lib/congresso/llm/cliente";
import { montarFonte, verificar, type Suspeita } from "@/lib/congresso/oficio/verificador";
import type { Bloco, Oficio } from "@/lib/congresso/oficio/compor";
import type { AnaliseItem } from "@/lib/congresso/rubrica";
import { ancorasDoDireito } from "@/lib/congresso/rubrica";

/**
 * Revisão do ofício por LLM, no arranjo do agente jurídico do Vaire.
 *
 * O desenho é de três camadas, e a ordem importa:
 *
 *   1. COMPOSIÇÃO DETERMINÍSTICA (`compor.ts`) produz um ofício completo e
 *      formalmente correto, com toda afirmação jurídica vinda de um item
 *      de análise já validado. Este é o piso: existe com o LLM desligado.
 *   2. REVISÃO PELO LLM, com a persona restritiva abaixo. O modelo NÃO
 *      escreve o ofício — ele reescreve um texto que já existe, e é
 *      proibido de acrescentar fato, lei ou número.
 *   3. VERIFICADOR DETERMINÍSTICO (`verificador.ts`) roda sobre a saída do
 *      modelo e marca o que não existe na fonte.
 *
 * Por que não confiar só na camada 2: a instrução "não invente" é uma
 * pressão estatística, não uma garantia. O Vaire aprendeu isso com o
 * agente de comunicação alucinando datas mesmo instruído a não fazê-lo —
 * daí o verificador ter sido escrito. A camada 3 é o que transforma a
 * instrução em algo checável.
 *
 * Por que não pular a camada 2: o texto determinístico é correto e
 * rígido. Alguém que vai assinar e enviar quer um documento que soe
 * escrito por uma pessoa.
 *
 * E acima de tudo isso continua valendo o gate humano do Vaire: o texto
 * revisado é PROPOSTA, mostrada lado a lado com o determinístico. Nada sai
 * do app sem alguém apertar o botão depois de ler.
 */

const PERSONA = `Você é um revisor de texto jurídico que prepara ofícios de \
cidadãos e coletivos dirigidos a parlamentares federais.

Sua tarefa é REESCREVER um ofício que já existe, deixando-o mais fluido, \
coeso e natural em português formal brasileiro — sem alterar o conteúdo.

Regras absolutas, nesta ordem de prioridade:
1. NUNCA acrescente lei, artigo, súmula, precedente, data, valor, prazo, \
percentual ou número que não esteja no texto original. Se o texto original \
não cita um dispositivo, o seu também não cita.
2. NUNCA remova uma citação legal que está no original, nem altere o número \
dela. Os dispositivos citados foram verificados; você não tem como verificar \
nada.
3. NUNCA transforme incerteza em certeza. Se o original diz "pode restringir", \
não escreva "restringe". Sinalizar risco é melhor que mascará-lo.
4. Preserve integralmente as citações entre aspas — elas são transcrições \
literais do projeto de lei e não podem ser parafraseadas.
5. Mantenha a estrutura: mesma quantidade de parágrafos, na mesma ordem, com \
o mesmo papel. Você melhora a redação de cada parágrafo, não reorganiza o \
documento.
6. Escreva em português claro. Traduza juridiquês desnecessário, mas mantenha \
o registro formal de correspondência oficial e o tratamento em terceira pessoa \
("Vossa Excelência").
7. Não use adjetivo de indignação nem linguagem de militância. O documento \
convence pelo argumento, não pelo tom.

Responda APENAS com o texto reescrito dos parágrafos, um por linha, na mesma \
ordem, sem numeração, sem comentário e sem preâmbulo.`;

export interface ResultadoRevisao {
  /** Blocos revisados, prontos para render. */
  blocos: Bloco[];
  /** Fatos que o modelo trouxe e não estão na fonte. Vazio = revisão limpa. */
  suspeitas: Suspeita[];
  /** Identificação do modelo, para registro no documento. */
  modelo: string;
  /**
   * true quando a revisão foi DESCARTADA e o determinístico foi mantido.
   * Acontece quando o LLM está fora, quando devolve número errado de
   * parágrafos, ou quando inventa citação legal.
   */
  descartada: boolean;
  motivoDescarte?: string;
}

/**
 * Tenta revisar. Nunca lança: em qualquer falha devolve os blocos
 * originais com `descartada: true`. O ofício sempre sai.
 */
export async function revisarOficio(
  oficio: Oficio,
  contexto: {
    ementa?: string | null;
    ementaDetalhada?: string | null;
    textoIntegral?: string | null;
    itens: AnaliseItem[];
  }
): Promise<ResultadoRevisao> {
  const modelo = identificacaoModelo();

  // Só parágrafos vão para o modelo. Vocativo, referência, fecho e
  // assinatura são estruturais e conferidos — não há o que "melhorar" em
  // "Respeitosamente," e deixá-los fora reduz a superfície de invenção.
  const indices = oficio.blocos
    .map((b, i) => (b.tipo === "paragrafo" ? i : -1))
    .filter((i) => i >= 0);

  if (indices.length === 0) {
    return { blocos: oficio.blocos, suspeitas: [], modelo, descartada: true, motivoDescarte: "nada a revisar" };
  }

  const original = indices.map((i) => oficio.blocos[i].texto);

  const fonte = montarFonte({
    ementa: contexto.ementa,
    ementaDetalhada: contexto.ementaDetalhada,
    textoIntegral: contexto.textoIntegral,
    dispositivos: contexto.itens.map((i) => i.dispositivo),
    ancoras: contexto.itens.flatMap((i) => ancorasDoDireito(i.direito)),
    trechos: contexto.itens.map((i) => i.trecho),
    // O próprio texto determinístico é fonte: tudo nele já foi verificado.
    extras: oficio.blocos.map((b) => b.texto),
  });

  let resposta: string;
  try {
    resposta = await gerarTexto(
      `Reescreva os parágrafos abaixo, um por linha, na mesma ordem.\n\n` +
        original.map((t, i) => `${i + 1}. ${t}`).join("\n\n"),
      { system: PERSONA, temperatura: 0.3 }
    );
  } catch (e) {
    return {
      blocos: oficio.blocos,
      suspeitas: [],
      modelo,
      descartada: true,
      motivoDescarte:
        e instanceof LLMIndisponivel
          ? `provedor de LLM indisponível (${e.message})`
          : "falha na revisão",
    };
  }

  const linhas = resposta
    .split("\n")
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);

  // Contagem diferente significa que o modelo fundiu, dividiu ou
  // reorganizou parágrafos — a regra 5 foi quebrada. Não tentamos casar
  // por similaridade: um alinhamento errado colocaria a fundamentação de
  // um direito debaixo de outro, que é pior que texto rígido.
  if (linhas.length !== original.length) {
    return {
      blocos: oficio.blocos,
      suspeitas: [],
      modelo,
      descartada: true,
      motivoDescarte: `o modelo devolveu ${linhas.length} parágrafos em vez de ${original.length}`,
    };
  }

  const { suspeitas } = verificar(linhas.join("\n"), fonte);

  // Citação legal inventada é o único tipo de suspeita que invalida a
  // revisão inteira: é o fato que mais importa aqui e o que mais
  // constrange quem assina. Data ou valor não confirmado é marcado no
  // texto e mostrado ao usuário, mas não descarta.
  const citacaoInventada = suspeitas.filter((s) => s.tipo === "citacao_legal");
  if (citacaoInventada.length > 0) {
    return {
      blocos: oficio.blocos,
      suspeitas,
      modelo,
      descartada: true,
      motivoDescarte:
        `o modelo citou dispositivo que não está na fonte: ` +
        citacaoInventada.map((s) => s.trecho).join(", "),
    };
  }

  const blocos = oficio.blocos.map((b, i) => {
    const pos = indices.indexOf(i);
    return pos >= 0 ? { ...b, texto: linhas[pos] } : b;
  });

  return { blocos, suspeitas, modelo, descartada: false };
}
