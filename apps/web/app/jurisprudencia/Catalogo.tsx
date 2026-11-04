import Link from "next/link";
import frentesJson from "@/data/catalogo-frentes.json";

/**
 * @file Catálogo dos acórdãos, em números, por frente.
 *
 * O QUE É: a contagem do catálogo (rubrica própria de cada frente) sobre os
 * acórdãos em que a régua determinística não conseguiu dizer quem venceu. Diz
 * quais conflitos se repetem, por que o resultado não é decidível, quais direitos
 * são citados e onde o Tribunal decide diferente.
 *
 * POR QUE ASSIM: número só de contagem. O modelo rotula e cita; quem conta é
 * `agregar_catalogo.py`, sobre o CSV. A cobertura aparece em cada bloco porque
 * painel que mostra 25% sem dizer que é 25% engana o leitor.
 *
 * O JSON é gerado no repo da jurimetria e copiado para `data/` pela esteira.
 */

type Par = [string, number];

type Divergencia = {
  conflito: string;
  casos: number;
  lados: Record<string, number>;
  teses_distintas: number;
  exemplos: { processo: string; lado: string; tese: string }[];
};

type Catalogo = {
  geradoEm: string;
  frente: string;
  total: number;
  fila: number;
  cobertura: number;
  lados: Record<string, number>;
  conflitos: Par[];
  direitos: Par[];
  motivos: Par[];
  confianca: Record<string, number>;
  palavras_chave: Par[];
  divergencias: Divergencia[];
};

const FRENTES = frentesJson as unknown as Catalogo[];

const TITULO_FRENTE: Record<string, string> = {
  riodoce: "Rio Doce (Fundão, Mariana)",
  brumadinho: "Brumadinho (Córrego do Feijão)",
  dh: "Direitos humanos",
  penal: "Penal",
  itatiaiaucu: "Itatiaiuçu (Serra Azul)",
};

const NOMES_CONFLITO: Record<string, string> = {
  materiaestranhaaodesastre: "Matéria estranha ao desastre",
  materiaalheia: "Matéria alheia ao direito humano",
  prescricao: "Prescrição",
  provaepericia: "Prova e perícia",
  sobrestamentotema: "Sobrestamento por tema repetitivo",
  gratuidadejustica: "Gratuidade de justiça",
  acordoindenizacao: "Acordo e indenização",
  honorarioscustas: "Honorários e custas",
  coisajulgadaacordo: "Coisa julgada e acordo",
  danomoral: "Dano moral",
  danomaterial: "Dano material",
  auxilioemergencialptr: "Auxílio emergencial (PTR)",
  legitimidade: "Legitimidade",
  saude: "Saúde",
  educacao: "Educação",
  moradia: "Moradia",
  previdenciaassistencia: "Previdência e assistência",
  trabalho: "Trabalho",
  meioambientesadio: "Meio ambiente sadio",
  liberdadeseguranca: "Liberdade e segurança",
  igualdadenadiscriminacao: "Igualdade e não discriminação",
  criancaadolescente: "Criança e adolescente",
  pessoaidosapcd: "Pessoa idosa e pessoa com deficiência",
  povoscomunidadestradicionais: "Povos e comunidades tradicionais",
  processoadministrativodisciplinar: "Processo administrativo disciplinar",
  outro: "Outro",
};

const NOMES_DIREITO: Record<string, string> = {
  agua_abastecimento: "Água e abastecimento",
  perda_renda_trabalho: "Perda de renda e trabalho",
  perda_areas_pesca: "Perda de áreas de pesca",
  outros_pnab_peab: "Outros danos PNAB/PEAB",
  mudanca_habitos_psicossociais: "Mudança de hábitos psicossociais",
  perda_capacidade_produtiva: "Perda de capacidade produtiva",
  perda_propriedade: "Perda de propriedade",
  desvalorizacao_imoveis: "Desvalorização de imóveis",
  atividades_produtivas_locais: "Atividades produtivas locais",
  deslocamento_compulsorio: "Deslocamento compulsório",
  pessoa_negra: "Pessoa negra",
  mulher: "Mulher",
  crianca: "Criança",
  adolescente: "Adolescente",
  pessoa_idosa: "Pessoa idosa",
  pessoa_com_deficiencia: "Pessoa com deficiência",
  quilombola: "Quilombola",
  indigena: "Indígena",
  povoado_tradicional: "Povoado tradicional",
  migrante: "Migrante",
  populacao_rural: "População rural",
  privado_de_liberdade: "Privado de liberdade",
};

const NOMES_MOTIVO: Record<string, string> = {
  "(não informado)": "Não informado",
  materiaestranha: "Matéria estranha ao desastre",
  materia_alheia: "Matéria alheia ao direito humano",
  materiaalheia: "Matéria alheia ao direito humano",
  sobrestamento: "Sobrestamento",
  textoinsuficiente: "Texto insuficiente",
  preliminar: "Decisão preliminar",
  acordo: "Acordo",
  semdispositivo: "Sem dispositivo legível",
  outro: "Outro",
};

const NOMES_LADO: Record<string, string> = {
  atingido: "Atingido",
  empresa: "Empresa",
  parcial: "Parcial",
  indeterminado: "Indeterminado",
  titular: "Titular do direito",
  entepublico: "Ente público",
};

const numero = (valor: number) => valor.toLocaleString("pt-BR");
const nome = (mapa: Record<string, string>, chave: string) => mapa[chave] ?? chave;
const percentual = (parte: number, total: number) =>
  total ? `${((100 * parte) / total).toFixed(1).replace(".", ",")}%` : "0%";

function TabelaContagem({
  titulo,
  pares,
  total,
  tradutor,
}: {
  titulo: string;
  pares: Par[];
  total: number;
  tradutor: (chave: string) => string;
}) {
  return (
    <div className="space-y-2">
      <h4 className="font-display text-sm font-semibold">{titulo}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--cp-border)] text-left">
              <th className="py-2 pr-3 font-medium">Item</th>
              <th className="py-2 pr-3 text-right font-medium">Casos</th>
              <th className="py-2 text-right font-medium">% do catálogo</th>
            </tr>
          </thead>
          <tbody>
            {pares.map(([chave, valor]) => (
              <tr key={chave} className="border-b border-[var(--cp-border)]/50">
                <td className="py-2 pr-3">{tradutor(chave)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{numero(valor)}</td>
                <td className="py-2 text-right tabular-nums">{percentual(valor, total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BlocoFrente({ dados }: { dados: Catalogo }) {
  const declarados = Object.entries(dados.lados)
    .filter(([lado]) => lado !== "indeterminado")
    .reduce((soma, [, quantidade]) => soma + quantidade, 0);
  const cartoes = [
    { rotulo: "Acórdãos catalogados", valor: numero(dados.total) },
    { rotulo: "Cobertura da fila", valor: percentual(dados.total, dados.fila) },
    { rotulo: "Com lado vencedor declarado", valor: numero(declarados) },
  ];
  return (
    <article className="space-y-5 rounded-xl border border-[var(--cp-border)] p-4 sm:p-6">
      <header className="space-y-2">
        <h3 className="font-display text-lg font-semibold">
          {TITULO_FRENTE[dados.frente] ?? dados.frente}
        </h3>
        <p className="max-w-3xl text-sm opacity-80">
          <strong>{numero(dados.total)}</strong> de <strong>{numero(dados.fila)}</strong>{" "}
          acórdãos da fila desta frente catalogados. O restante ainda não foi lido — a página
          diz isso em vez de fingir cobertura total.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {cartoes.map((cartao) => (
          <div key={cartao.rotulo} className="rounded-lg border border-[var(--cp-border)] p-4">
            <p className="text-xs uppercase tracking-wide opacity-60">{cartao.rotulo}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{cartao.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TabelaContagem
          titulo="Conflitos que mais aparecem"
          pares={dados.conflitos}
          total={dados.total}
          tradutor={(chave) => nome(NOMES_CONFLITO, chave)}
        />
        <TabelaContagem
          titulo="Por que o resultado é indeterminado"
          pares={dados.motivos}
          total={dados.total}
          tradutor={(chave) => nome(NOMES_MOTIVO, chave)}
        />
      </div>

      {dados.frente === "riodoce" && (
        <p className="max-w-3xl text-sm opacity-80">
          “Matéria estranha ao desastre” não é erro de contagem: são acórdãos que entraram na
          coleta por citar a Fundação Renova ou o desastre, mas decidem outra coisa — plano de
          saúde, inventário, partilha de bens. Aparecem aqui porque o acervo os tem.
        </p>
      )}

      <TabelaContagem
        titulo={dados.frente === "dh" ? "Quem aparece como titular" : "Direitos citados nos acórdãos"}
        pares={dados.direitos}
        total={dados.total}
        tradutor={(chave) => nome(NOMES_DIREITO, chave)}
      />

      {dados.divergencias.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-display text-sm font-semibold">
            Onde o Tribunal decide diferente
          </h4>
          <ul className="space-y-3">
            {dados.divergencias.map((divergencia) => (
              <li
                key={divergencia.conflito}
                className="rounded-lg border border-[var(--cp-border)] p-4"
              >
                <p className="text-sm font-semibold">
                  {nome(NOMES_CONFLITO, divergencia.conflito)} ·{" "}
                  {numero(divergencia.casos)} casos · {numero(divergencia.teses_distintas)} teses
                  distintas
                </p>
                <p className="mt-1 text-xs opacity-70">
                  Lados:{" "}
                  {Object.entries(divergencia.lados)
                    .sort((a, b) => b[1] - a[1])
                    .map(([lado, quantidade]) => `${nome(NOMES_LADO, lado)}: ${numero(quantidade)}`)
                    .join(" · ")}
                </p>
                <p className="mt-2 text-xs opacity-60">
                  Clique no número do processo para abrir o caso no acervo, com ementa e inteiro
                  teor.
                </p>
                <ul className="mt-2 space-y-1">
                  {divergencia.exemplos.map((exemplo) => (
                    <li key={exemplo.processo} className="text-xs opacity-80">
                      <Link
                        className="font-mono underline"
                        href={`/jurisprudencia?q=${encodeURIComponent(exemplo.processo)}#lista`}
                      >
                        {exemplo.processo}
                      </Link>
                      {exemplo.lado ? ` (${nome(NOMES_LADO, exemplo.lado)})` : ""} — {exemplo.tese}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export function CatalogoIndeterminados() {
  if (FRENTES.length === 0) {
    return null;
  }
  return (
    <section className="space-y-6" id="catalogo">
      <header className="space-y-3">
        <h2 className="font-display text-xl font-semibold">O que os acórdãos decidem</h2>
        <p className="max-w-3xl text-sm opacity-80">
          Quando a régua não diz quem venceu, o acórdão é lido e catalogado: conflito, direito
          citado, tese e o motivo de não haver vencedor claro. Cada frente tem a sua rubrica —
          desastre e direitos humanos não se medem com a mesma régua.
        </p>
      </header>

      {FRENTES.map((dados) => (
        <BlocoFrente key={dados.frente} dados={dados} />
      ))}

      <p className="text-xs opacity-60">
        Catálogo atualizado em {FRENTES[0]?.geradoEm.slice(0, 10)}. Contagem sobre o CSV de
        rótulos, um caso por linha; o percentual é sobre o total catalogado, não sobre o acervo
        inteiro. Divergência de lado com o acervo publicado é medida pelo crítico acadêmico e
        não é sobrescrita.
      </p>
    </section>
  );
}
