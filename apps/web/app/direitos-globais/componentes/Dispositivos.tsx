import type { Dispositivo, TipoDireito } from "@/lib/direitos-globais/tipos";

/**
 * Lista de dispositivos legais de um país, com o texto integral.
 *
 * Regra de leitura: texto curto aparece inteiro; texto longo fica atrás de
 * "Ver mais". O leitor não deve precisar sair do portal para ler o artigo,
 * mas também não pode receber paráfrase no lugar da lei.
 *
 * `details/summary` é nativo: funciona sem JavaScript e é lido por leitor de
 * tela. Não troque por estado de cliente sem necessidade.
 */

const ROTULO: Record<TipoDireito, string> = {
  humanos: "Direitos humanos",
  ambiental: "Meio ambiente",
  mulheres: "Mulheres",
  natureza: "Natureza",
  politicos: "Políticos",
  criancas: "Crianças",
  indigenas: "Povos indígenas",
  quilombolas: "Quilombolas",
  campesinos: "Campesinos",
  coletivos: "Coletivos",
  atingidos_barragens: "Atingidos por barragens",
  atingidos_empreendimentos: "Atingidos por empreendimentos",
  povos: "Direitos dos povos",
  idosos: "Pessoas idosas",
  deficiencia: "Pessoas com deficiência",
  lgbtqia: "Pessoas LGBTQIA+",
  migrantes_refugiados: "Migrantes e refugiados",
  trabalho: "Trabalho",
  saude: "Saúde",
  educacao: "Educação",
  moradia: "Moradia",
  agua: "Água",
  terra_territorio: "Terra e território",
  memoria_verdade_justica: "Memória, verdade e justiça",
};

const LIMITE_CURTO = 320;

export function etiquetaDireito(tipo: TipoDireito): string {
  return ROTULO[tipo] ?? tipo;
}

export function ListaDispositivos({
  pais,
  dispositivos,
}: {
  pais: string;
  dispositivos: readonly Dispositivo[];
}) {
  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-text">{pais}</h3>
        <span className="text-xs text-text-soft">
          {dispositivos.length}{" "}
          {dispositivos.length === 1 ? "dispositivo" : "dispositivos"}
        </span>
      </header>
      <ul className="space-y-5">
        {dispositivos.map((d, idx) => (
          <li key={`${d.pais}-${d.citacao}-${idx}`}>
            <ItemDispositivo dispositivo={d} />
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ItemDispositivo({ dispositivo }: { dispositivo: Dispositivo }) {
  const curto = dispositivo.texto.length <= LIMITE_CURTO;
  const isLacuna = dispositivo.em_coleta || dispositivo.citacao === "nao_encontrado";

  return (
    <div className="border-l-2 border-primary/40 pl-4">
      <p className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {etiquetaDireito(dispositivo.tipo)}
        </span>
        <span className="text-sm font-bold text-text">{dispositivo.citacao}</span>
        {isLacuna && (
          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            Lacuna declarada
          </span>
        )}
      </p>
      {dispositivo.titulo ? (
        <p className="mb-2 text-sm font-medium text-text">{dispositivo.titulo}</p>
      ) : null}
      {curto ? (
        <TextoDispositivo texto={dispositivo.texto} />
      ) : (
        <details className="group">
          <summary className="cursor-pointer list-none text-sm font-semibold text-primary underline-offset-2 hover:underline">
            Ver mais
          </summary>
          <div className="mt-2">
            <TextoDispositivo texto={dispositivo.texto} />
          </div>
        </details>
      )}
      {dispositivo.traducao ? (
        <p className="mt-2 text-xs text-text-soft">{dispositivo.traducao}</p>
      ) : null}
      {dispositivo.lacuna ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
          Nota de lacuna: {dispositivo.lacuna}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-text-soft">
        Fonte:{" "}
        <a
          href={dispositivo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          {dispositivo.fonte}
        </a>
        {" · "}
        acesso em {dispositivo.dataAcesso}
      </p>
    </div>
  );
}

function TextoDispositivo({ texto }: { texto: string }) {
  return (
    <p className="whitespace-pre-line text-sm leading-relaxed text-text-soft">
      {texto}
    </p>
  );
}
