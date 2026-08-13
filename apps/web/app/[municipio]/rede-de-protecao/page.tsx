import { paramsDasCidades } from "@/lib/betim/staticParams";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { temFonte } from "@/lib/db/queries/municipios";
import { montarItensPainel, NAO_VERIFICADO } from "@/lib/betim/redeProtecao";
import BuscaRedeProtecao from "./BuscaRedeProtecao";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Onde Pedir Informação e Onde Buscar Ajuda — ${c.nome} | ${nomePortal(c)}`,
  (c) =>
    `LAI municipal, estadual e federal, e a rede de proteção de direitos de ${c.nome}-${c.uf}: Defensoria, Ministério Público, delegacias, assistência social e clínicas jurídicas gratuitas.`
);

export default async function RedeDeProtecaoPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const itens = montarItensPainel(cidade);
  const cidadeEhMG = temFonte(cidade, "links_uteis_mg");
  const cidadeEhBH = cidade.slug === "bh";

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Onde Pedir Informação e Onde Buscar Ajuda
      </h1>
      <p className="mt-2 max-w-[65ch] text-text-soft">
        Duas perguntas de quem precisa: <strong className="text-text">onde eu peço essa
        informação?</strong> (Lei de Acesso à Informação — qualquer cidadão pode pedir, é
        gratuito) e <strong className="text-text">onde eu busco ajuda?</strong> (defesa
        jurídica gratuita, denúncia, proteção de criança, violência contra a mulher e mais).
        Busque pelo que você precisa, não pela sigla do órgão.
      </p>

      <section className="mt-8">
        <BuscaRedeProtecao
          itens={itens}
          cidadeNome={cidade.nome}
          cidadeEhMG={cidadeEhMG}
          cidadeEhBH={cidadeEhBH}
        />
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-lg font-semibold text-text">
          Não verificado — não confie sem religar antes
        </h2>
        <p className="mt-2 max-w-[65ch] text-sm text-text-soft">
          Estes canais foram pesquisados, mas não foi possível confirmar que funcionam
          hoje (site fora do ar, bloqueio de acesso automatizado, ou nenhum contato
          formal encontrado). Ficam aqui como pista de pesquisa, isolados do restante —
          não use como endereço definitivo sem confirmar antes.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {NAO_VERIFICADO.map((n) => (
            <li key={n.titulo} className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm">
              <p className="font-medium text-text">{n.titulo}</p>
              <p className="mt-1 text-text-soft">{n.nota}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
