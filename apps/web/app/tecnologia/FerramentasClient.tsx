"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Calculator,
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  Ruler,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  NOME_DOCUMENTO,
  type TipoDocumento,
  verificarDocumento,
} from "@/lib/utilitarios/documentos";
import {
  formatarMoedaBR,
  formatarNumeroBR,
  perCapita,
  percentualDe,
  quantoRepresenta,
  regraDeTres,
} from "@/lib/utilitarios/calculos";
import { FUSOS, formatarDataFuso, formatarHoraFuso } from "@/lib/utilitarios/fusos";
import {
  diasEntre,
  formatarDataBR,
  normalizarData,
  prazoRespostaLAI,
} from "@/lib/utilitarios/datas";
import {
  type Categoria,
  NOME_CATEGORIA,
  converter,
  unidadesPorCategoria,
} from "@/lib/utilitarios/medidas";

/**
 * Ferramentas utilitárias client-side da página `/tecnologia`.
 *
 * ═══ O QUE É ═══
 *
 * Três utilidades que rodam inteiras no navegador: horário mundial, calculadora
 * cívica e verificador de dígito. Nenhuma chama servidor, banco ou IA.
 *
 * ═══ POR QUE CLIENT-SIDE ═══
 *
 * É o que mantém a promessa "grátis e sem cadastro": o cálculo custa zero de
 * servidor, funciona offline e não obriga ninguém a entregar o dado digitado.
 * Em especial, o verificador de CPF não pode enviar o número para lugar nenhum
 * (regra de privacidade do AGENTS.md § 5.8) — por isso a conta é local.
 *
 * ═══ REGRA EDITORIAL ═══
 *
 * A calculadora opera sobre o número que a pessoa digita; ela não afirma nada
 * sobre o portal. Quando a conta é impossível, a tela diz que não dá para
 * calcular, em vez de mostrar um zero enganoso.
 */

/** Converte texto de campo em número; vazio vira NaN (tratado como inválido). */
function paraNumero(valor: string): number {
  const limpo = valor.trim().replace(",", ".");
  if (limpo === "") return Number.NaN;
  return Number(limpo);
}

/** Cartão padrão das três ferramentas. */
function CartaoFerramenta({
  titulo,
  descricao,
  icone,
  children,
}: {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-xs">
      <header className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icone}
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">{titulo}</h3>
          <p className="text-sm text-muted leading-relaxed">{descricao}</p>
        </div>
      </header>
      {children}
    </article>
  );
}

/** Selo de resultado do verificador de dígito. */
function SeloResultado({ texto, ok }: { texto: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
        ok
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
      }`}
    >
      {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {texto}
    </span>
  );
}

/**
 * Relógio compartilhado, exposto ao React via `useSyncExternalStore`.
 *
 * Por que assim, e não com `useEffect` + `setState`: a hora é um sistema
 * externo ao React. O padrão recomendado é este — o servidor devolve uma
 * constante (época zero) e o cliente passa a ler o relógio real depois de
 * hidratar, sem divergência entre HTML do build e navegador. Um único
 * `setInterval` atende todos os componentes inscritos.
 */
const RELOGIO_ZERO = new Date(0);
let relogioAgora = RELOGIO_ZERO;
const relogioOuvintes = new Set<() => void>();
let relogioIntervalo: ReturnType<typeof setInterval> | null = null;

function inscreverRelogio(ouvinte: () => void): () => void {
  relogioOuvintes.add(ouvinte);
  if (relogioIntervalo === null) {
    relogioAgora = new Date();
    relogioIntervalo = setInterval(() => {
      relogioAgora = new Date();
      relogioOuvintes.forEach((o) => o());
    }, 1000);
  }
  return () => {
    relogioOuvintes.delete(ouvinte);
    if (relogioOuvintes.size === 0 && relogioIntervalo !== null) {
      clearInterval(relogioIntervalo);
      relogioIntervalo = null;
    }
  };
}

function lerRelogio(): Date {
  return relogioAgora;
}

function lerRelogioServidor(): Date {
  return RELOGIO_ZERO;
}

/** Horário mundial: hora e data de cada fuso, com busca. */
function HorarioMundial() {
  const agora = useSyncExternalStore(inscreverRelogio, lerRelogio, lerRelogioServidor);
  const [busca, setBusca] = useState("");

  // Época zero = ainda no SSR; evita mostrar 1970 antes de hidratar.
  const montado = agora.getTime() > 0;

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return FUSOS;
    return FUSOS.filter(
      (f) =>
        f.pais.toLowerCase().includes(termo) ||
        f.cidade.toLowerCase().includes(termo) ||
        f.regiao.toLowerCase().includes(termo),
    );
  }, [busca]);

  return (
    <CartaoFerramenta
      titulo="Horário mundial"
      descricao="A hora oficial de cada país, atualizada segundo a segundo. O navegador já traz os fusos e o horário de verão — nada é consultado na rede."
      icone={<Clock size={20} />}
    >
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar país, cidade ou região..."
          aria-label="Buscar fuso horário"
          className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <ul className="max-h-80 space-y-1 overflow-y-auto pr-1" aria-live="polite">
        {filtrados.map((f) => (
          <li
            key={f.fuso}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-surface-2/50 px-3 py-2"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {f.cidade}
              </span>
              <span className="block truncate text-xs text-muted">
                {f.pais} · {f.regiao}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-mono text-sm font-semibold text-foreground tabular-nums">
                {montado ? formatarHoraFuso(f.fuso, agora) : "--:--:--"}
              </span>
              <span className="block text-xs text-muted">
                {montado ? formatarDataFuso(f.fuso, agora) : "\u00A0"}
              </span>
            </span>
          </li>
        ))}
        {filtrados.length === 0 && (
          <li className="px-3 py-4 text-sm text-muted">Nenhum lugar encontrado.</li>
        )}
      </ul>
    </CartaoFerramenta>
  );
}

type ModoCalculo = "percentual" | "representa" | "percapita" | "regratres";

const MODOS: { id: ModoCalculo; label: string; ajuda: string }[] = [
  { id: "percentual", label: "X% de um valor", ajuda: "Quanto é um percentual de um valor total" },
  { id: "representa", label: "Parte do total", ajuda: "Que porcentagem uma parte representa do total" },
  { id: "percapita", label: "Por pessoa", ajuda: "Quanto cada pessoa recebe: total dividido pela população" },
  { id: "regratres", label: "Regra de três", ajuda: "Se A corresponde a B, quanto corresponde a C" },
];

/** Campo numérico rotulado, com sufixo opcional (ex.: %). */
function CampoNumero({
  id,
  rotulo,
  valor,
  onChange,
  sufixo,
  tipo = "number",
}: {
  id: string;
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  sufixo?: string;
  /** "number" (padrão) ou "date" — o campo de data usa o seletor nativo. */
  tipo?: "number" | "date";
}) {
  return (
    <label htmlFor={id} className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-muted">{rotulo}</span>
      <span className="relative flex items-center">
        <input
          id={id}
          type={tipo}
          inputMode={tipo === "number" ? "decimal" : undefined}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {sufixo && (
          <span className="pointer-events-none absolute right-3 text-xs text-muted">{sufixo}</span>
        )}
      </span>
    </label>
  );
}

/** Calculadora cívica: quatro contas do dia a dia da fiscalização. */
function CalculadoraCivica() {
  const [modo, setModo] = useState<ModoCalculo>("percapita");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");

  const resultado = useMemo<number | null>(() => {
    const na = paraNumero(a);
    const nb = paraNumero(b);
    const nc = paraNumero(c);
    if (modo === "percentual") return percentualDe(nb, na);
    if (modo === "representa") return quantoRepresenta(na, nb);
    if (modo === "percapita") return perCapita(na, nb);
    return regraDeTres(na, nb, nc);
  }, [modo, a, b, c]);

  const campos: Record<ModoCalculo, { key: "a" | "b" | "c"; rotulo: string; sufixo?: string }[]> = {
    percentual: [
      { key: "a", rotulo: "Percentual", sufixo: "%" },
      { key: "b", rotulo: "Valor total (R$)" },
    ],
    representa: [
      { key: "a", rotulo: "Parte (R$)" },
      { key: "b", rotulo: "Total (R$)" },
    ],
    percapita: [
      { key: "a", rotulo: "Valor total (R$)" },
      { key: "b", rotulo: "População" },
    ],
    regratres: [
      { key: "a", rotulo: "A" },
      { key: "b", rotulo: "corresponde a B" },
      { key: "c", rotulo: "quanto corresponde a C" },
    ],
  };

  const ajudaAtual = MODOS.find((m) => m.id === modo)?.ajuda ?? "";

  const formatarSaida = (): string => {
    if (resultado === null) return "--";
    if (modo === "representa") return `${formatarNumeroBR(resultado, 2)}%`;
    if (modo === "percentual") return formatarMoedaBR(resultado);
    return formatarMoedaBR(resultado);
  };

  return (
    <CartaoFerramenta
      titulo="Calculadora cívica"
      descricao="Faça a conta do dinheiro público você mesmo: percentual, fatia do orçamento, valor por pessoa. Os números são seus — o portal não afirma nada aqui."
      icone={<Calculator size={20} />}
    >
      <div className="mb-4 flex flex-wrap gap-1.5">
        {MODOS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setModo(m.id);
              setA("");
              setB("");
              setC("");
            }}
            aria-pressed={modo === m.id}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              modo === m.id
                ? "bg-primary text-white shadow-xs"
                : "bg-surface-2 text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="mb-3 flex items-start gap-1.5 text-xs text-muted">
        <Info size={13} className="mt-0.5 shrink-0" />
        {ajudaAtual}
      </p>

      <div className="space-y-3">
        {campos[modo].map((campo) => (
          <CampoNumero
            key={campo.key}
            id={`calc-${modo}-${campo.key}`}
            rotulo={campo.rotulo}
            sufixo={campo.sufixo}
            valor={campo.key === "a" ? a : campo.key === "b" ? b : c}
            onChange={campo.key === "a" ? setA : campo.key === "b" ? setB : setC}
          />
        ))}
      </div>

      <div
        role="status"
        aria-live="polite"
        className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3"
      >
        <span className="block text-xs font-medium text-muted">Resultado</span>
        <span className="block font-mono text-lg font-bold text-foreground tabular-nums">
          {resultado === null ? "Não dá para calcular — confira os valores." : formatarSaida()}
        </span>
      </div>
    </CartaoFerramenta>
  );
}

/** Verificador de dígito: CPF, CNPJ e código IBGE, tudo local. */
function VerificadorDigito() {
  const [tipo, setTipo] = useState<TipoDocumento>("cpf");
  const [valor, setValor] = useState("");

  const exemplos: Record<TipoDocumento, string> = {
    cpf: "000.000.000-00",
    cnpj: "00.000.000/0000-00",
    ibge: "7 dígitos, ex.: 3106200",
  };

  // Só avalia quando há algo digitado; assim a tela não grita antes da hora.
  const temValor = valor.trim() !== "";
  const valido = temValor ? verificarDocumento(tipo, valor) : false;

  return (
    <CartaoFerramenta
      titulo="Verificador de dígito"
      descricao="Confira se um CPF, CNPJ ou código de município do IBGE é bem-formado. A conta roda no seu aparelho: o número não sai do navegador."
      icone={<ShieldCheck size={20} />}
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(Object.keys(NOME_DOCUMENTO) as TipoDocumento[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTipo(t);
              setValor("");
            }}
            aria-pressed={tipo === t}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              tipo === t
                ? "bg-primary text-white shadow-xs"
                : "bg-surface-2 text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {NOME_DOCUMENTO[t]}
          </button>
        ))}
      </div>

      <label htmlFor="verificador-valor" className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-muted">
          {NOME_DOCUMENTO[tipo]}
        </span>
        <input
          id="verificador-valor"
          type="text"
          inputMode="numeric"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={exemplos[tipo]}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>

      <div role="status" aria-live="polite" className="mt-4">
        {!temValor ? (
          <p className="text-sm text-muted">Digite um número para conferir.</p>
        ) : valido ? (
          <SeloResultado texto="Dígito verificador confere" ok />
        ) : (
          <SeloResultado texto="Dígito não confere" ok={false} />
        )}
      </div>

      <p className="mt-3 text-xs text-muted leading-relaxed">
        O verificador diz se o número é bem-formado. Ele não confirma se a pessoa
        ou a empresa existe — para isso, consulte a fonte oficial.
      </p>
    </CartaoFerramenta>
  );
}

/** Datas e prazos: intervalo entre datas e prazo de resposta de um pedido de LAI. */
function DatasEPrazos() {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [protocolo, setProtocolo] = useState("");

  const dInicio = normalizarData(inicio);
  const dFim = normalizarData(fim);
  const dias = dInicio && dFim ? diasEntre(dInicio, dFim) : null;

  const dProtocolo = normalizarData(protocolo);
  const prazo = dProtocolo ? prazoRespostaLAI(dProtocolo) : null;

  return (
    <CartaoFerramenta
      titulo="Datas e prazos"
      descricao="Conte os dias entre duas datas e veja o prazo legal de resposta de um pedido de acesso à informação (LAI): 20 dias, prorrogáveis por mais 10."
      icone={<CalendarDays size={20} />}
    >
      <div className="space-y-3">
        <CampoNumero
          id="datas-inicio"
          rotulo="Data inicial"
          tipo="date"
          valor={inicio}
          onChange={setInicio}
        />
        <CampoNumero
          id="datas-fim"
          rotulo="Data final"
          tipo="date"
          valor={fim}
          onChange={setFim}
        />
      </div>

      <div
        role="status"
        aria-live="polite"
        className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3"
      >
        <span className="block text-xs font-medium text-muted">Intervalo</span>
        <span className="block font-mono text-lg font-bold text-foreground tabular-nums">
          {dias === null
            ? "Informe as duas datas."
            : dias === 0
              ? "Mesmo dia."
              : `${dias} dia${Math.abs(dias) === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="mt-4 border-t border-border/60 pt-4">
        <CampoNumero
          id="datas-lai"
          rotulo="Data do pedido de acesso à informação (LAI)"
          tipo="date"
          valor={protocolo}
          onChange={setProtocolo}
        />
        <p className="mt-2 text-sm text-muted leading-relaxed">
          {prazo ? (
            <>
              Resposta em até <strong className="text-foreground">20 dias</strong>: até{" "}
              <strong className="text-foreground">{formatarDataBR(prazo.limite)}</strong>.
              Prorrogável, com justificativa, até{" "}
              <strong className="text-foreground">{formatarDataBR(prazo.prorrogavelAte)}</strong>.
            </>
          ) : (
            "Informe a data do protocolo para ver o prazo (Lei 12.527/2011, art. 11)."
          )}
        </p>
      </div>
    </CartaoFerramenta>
  );
}

/** Conversor de unidades, com os alqueires separados por estado. */
function ConversorUnidades() {
  const [categoria, setCategoria] = useState<Categoria>("area");
  const [de, setDe] = useState("ha");
  const [para, setPara] = useState("m2");
  const [valor, setValor] = useState("");

  const unidades = useMemo(() => unidadesPorCategoria(categoria), [categoria]);

  const trocarCategoria = (nova: Categoria) => {
    const lista = unidadesPorCategoria(nova);
    setCategoria(nova);
    setDe(lista[0].id);
    setPara(lista[1]?.id ?? lista[0].id);
  };

  const resultado = converter(paraNumero(valor), de, para);
  const formatarMedida = (n: number) =>
    new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(n);

  return (
    <CartaoFerramenta
      titulo="Conversor de unidades"
      descricao="Converta área, volume, massa e comprimento. O alqueire tem valor por estado — mineiro, paulista e goiano vêm separados, porque não são a mesma medida."
      icone={<Ruler size={20} />}
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(Object.keys(NOME_CATEGORIA) as Categoria[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => trocarCategoria(c)}
            aria-pressed={categoria === c}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              categoria === c
                ? "bg-primary text-white shadow-xs"
                : "bg-surface-2 text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {NOME_CATEGORIA[c]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <CampoNumero
          id="medida-valor"
          rotulo="Valor"
          valor={valor}
          onChange={setValor}
        />

        <div className="grid grid-cols-2 gap-3">
          <label htmlFor="medida-de" className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted">De</span>
            <select
              id="medida-de"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-2 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.rotulo}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="medida-para" className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted">Para</span>
            <select
              id="medida-para"
              value={para}
              onChange={(e) => setPara(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-2 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.rotulo}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3"
      >
        <span className="block text-xs font-medium text-muted">Resultado</span>
        <span className="block font-mono text-lg font-bold text-foreground tabular-nums">
          {resultado === null ? "Informe um valor." : formatarMedida(resultado)}
        </span>
      </div>
    </CartaoFerramenta>
  );
}

/** Bloco completo das ferramentas utilitárias da página de tecnologia. */
export default function FerramentasClient() {
  return (
    <section aria-labelledby="ferramentas-titulo" className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <Calculator size={14} className="text-primary" />
          <span>Ferramentas do portal</span>
        </div>
        <h2
          id="ferramentas-titulo"
          className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground"
        >
          Ferramentas que você usa agora
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted leading-relaxed">
          Cinco utilidades prontas para usar, sem cadastro e sem custo. Tudo roda
          no seu navegador: nada é enviado, nada é guardado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <HorarioMundial />
        <CalculadoraCivica />
        <VerificadorDigito />
        <DatasEPrazos />
        <ConversorUnidades />
      </div>
    </section>
  );
}
