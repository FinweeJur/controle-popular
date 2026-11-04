import catalogoJson from "@/data/catalogo-indeterminados.json";

/**
 * @file Catálogo dos acórdãos indeterminados, em números.
 *
 * O QUE É: a contagem do catálogo (rubrica v3) sobre os acórdãos em que a régua
 * NACAB não conseguiu dizer quem venceu. Diz quais conflitos se repetem, por que
 * o resultado não é decidível, quais direitos são citados e onde o Judiciário
 * decide diferente sobre o mesmo conflito.
 *
 * POR QUE ASSIM: número só de contagem. O modelo rotula e cita; quem conta é
 * `agregar_catalogo.py`, sobre o CSV. A cobertura aparece no topo porque painel
 * que mostra 24% sem dizer que é 24% engana o leitor.
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

const CATALOGO = catalogoJson as unknown as Catalogo;

const NOMES_CONFLITO: Record<string, string> = {
  materiaestranhaaodesastre: "Matéria estranha ao desastre",
  prescricao: "Prescrição",
  provaepericia: "Prova e perícia",
  sobrestamentotema: "Sobrestamento por tema repetitivo",
  gratuidadejustica: "Gratuidade de justiça",
  acordoindenizacao: "Acordo e indenização",
  honorarioscustas: "Honorários e custas",
  coisajulgadaacordo: "Coisa julgada e acordo",
  danomoral: "Dano moral",
  auxilioemergencialptr: "Auxílio emergencial (PTR)",
  legitimidade: "Legitimidade",
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
};

const NOMES_MOTIVO: Record<string, string> = {
  "(não informado)": "Não informado",
  materiaestranha: "Matéria estranha ao desastre",
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
};

const numero = (valor: number) => valor.toLocaleString("pt-BR");
const nome = (mapa: Record<string, string>, chave: string) => mapa[chave] ?? chave;

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
      <h3 className="font-display text-base font-semibold">{titulo}</h3>
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
                <td className="py-2 text-right tabular-nums">
                  {total ? ((100 * valor) / total).toFixed(1).replace(".", ",") : "0"}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CatalogoIndeterminados() {
  const declarados =
    (CATALOGO.lados.atingido ?? 0) + (CATALOGO.lados.empresa ?? 0) + (CATALOGO.lados.parcial ?? 0);
  const cartoes = [
    { rotulo: "Acórdãos catalogados", valor: numero(CATALOGO.total) },
    {
      rotulo: "Cobertura da fila",
      valor: `${String(CATALOGO.cobertura).replace(".", ",")}%`,
    },
    { rotulo: "Com lado vencedor declarado", valor: numero(declarados) },
  ];
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <h2 className="font-display text-xl font-semibold">O que os acórdãos decidem</h2>
        <p className="max-w-3xl text-sm opacity-80">
          Quando a régua não diz quem venceu, o acórdão é lido e catalogado: conflito, direito
          citado, tese e o motivo de não haver vencedor claro. O catálogo cobre{" "}
          <strong>{numero(CATALOGO.total)}</strong> de{" "}
          <strong>{numero(CATALOGO.fila)}</strong> acórdãos dessa fila — o restante ainda não foi
          lido, e a página diz isso em vez de fingir cobertura total.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {cartoes.map((cartao) => (
          <div
            key={cartao.rotulo}
            className="rounded-lg border border-[var(--cp-border)] p-4"
          >
            <p className="text-xs uppercase tracking-wide opacity-60">{cartao.rotulo}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{cartao.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TabelaContagem
          titulo="Conflitos que mais aparecem"
          pares={CATALOGO.conflitos}
          total={CATALOGO.total}
          tradutor={(chave) => nome(NOMES_CONFLITO, chave)}
        />
        <TabelaContagem
          titulo="Por que o resultado é indeterminado"
          pares={CATALOGO.motivos}
          total={CATALOGO.total}
          tradutor={(chave) => nome(NOMES_MOTIVO, chave)}
        />
      </div>

      <p className="max-w-3xl text-sm opacity-80">
        “Matéria estranha ao desastre” não é erro de contagem: são acórdãos que entraram na coleta
        por citar a Fundação Renova ou o desastre, mas decidem outra coisa — plano de saúde,
        inventário, partilha de bens. Aparecem aqui porque o acervo os tem, e o leitor precisa saber
        que eles existem antes de ler qualquer taxa.
      </p>

      <TabelaContagem
        titulo="Direitos citados nos acórdãos"
        pares={CATALOGO.direitos}
        total={CATALOGO.total}
        tradutor={(chave) => nome(NOMES_DIREITO, chave)}
      />

      {CATALOGO.divergencias.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-base font-semibold">Onde o Tribunal decide diferente</h3>
          <p className="max-w-3xl text-sm opacity-80">
            Mesmo conflito, teses e resultados diferentes. Fica registrado como divergência do
            Judiciário — a página não escolhe vencedor.
          </p>
          <ul className="space-y-3">
            {CATALOGO.divergencias.map((divergencia) => (
              <li
                key={divergencia.conflito}
                className="rounded-lg border border-[var(--cp-border)] p-4"
              >
                <p className="text-sm font-semibold">
                  {nome(NOMES_CONFLITO, divergencia.conflito)} ·{" "}
                  {numero(divergencia.casos)} casos ·{" "}
                  {numero(divergencia.teses_distintas)} teses distintas
                </p>
                <p className="mt-1 text-xs opacity-70">
                  Lados:{" "}
                  {Object.entries(divergencia.lados)
                    .sort((a, b) => b[1] - a[1])
                    .map(([lado, quantidade]) => `${nome(NOMES_LADO, lado)}: ${numero(quantidade)}`)
                    .join(" · ")}
                </p>
                <ul className="mt-2 space-y-1">
                  {divergencia.exemplos.map((exemplo) => (
                    <li key={exemplo.processo} className="text-xs opacity-80">
                      <span className="font-mono">{exemplo.processo}</span>
                      {exemplo.lado ? ` (${nome(NOMES_LADO, exemplo.lado)})` : ""} — {exemplo.tese}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs opacity-60">
        Catálogo gerado em {CATALOGO.geradoEm.slice(0, 10)}. Contagem sobre o CSV de rótulos, um
        caso por linha; o percentual é sobre o total catalogado, não sobre o acervo inteiro.
        Divergência de lado com o acervo publicado é medida pelo crítico acadêmico e não é
        sobrescrita.
      </p>
    </section>
  );
}
