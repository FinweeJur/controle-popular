import type { Metadata } from "next";
import { listarCidades } from "@/lib/db/queries/municipios";
import SeletorRedeGeral from "../components/SeletorRedeGeral";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/direitos-em-movimento/ajuda` — porta "Onde buscar ajuda", 2 de 4.
 *
 * Reusa `lib/betim/redeProtecao.ts` inteiro (mesma fonte de
 * `/[municipio]/rede-de-protecao`) através de `SeletorRedeGeral`, que só
 * decide QUANDO perguntar a cidade — depois da necessidade, nunca antes
 * (decisão do dono, `docs/PLANO-DIREITOS-EM-MOVIMENTO.md`).
 *
 * `listarCidades()` aqui, no servidor: o seletor precisa da `Cidade`
 * INTEIRA (com `fontes`) pra chamar `montarItensPainel(cidade)` no
 * cliente sem outra ida ao banco — são poucas dezenas de linhas, o mesmo
 * raciocínio de `listarCidades()` em `app/page.tsx` e `app/sobre/page.tsx`.
 */
export const metadata: Metadata = metadataEditavel("/direitos-em-movimento/ajuda", {
  title: "Onde buscar ajuda — Direitos em Movimento | Controle Popular",
  description:
    "Defensoria, Ministério Público, delegacias especializadas, assistência social, redes populares e clínicas jurídicas gratuitas — por necessidade, depois por cidade.",
});

export default async function AjudaPage() {
  const cidades = await listarCidades();

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <a href="/" className="hover:text-primary">
          Início
        </a>{" "}
        ·{" "}
        <a href="/direitos-em-movimento" className="hover:text-primary">
          Direitos em Movimento
        </a>{" "}
        · <span className="text-text">Onde buscar ajuda</span>
      </nav>

      <header className="mt-4 space-y-3">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Onde buscar ajuda</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Defesa jurídica gratuita, denúncia, proteção de criança, violência contra a mulher e
          mais. Diga primeiro o que você precisa — o estadual e o federal aparecem na hora,
          sem depender de onde você está. A cidade só entra depois, para achar o que é
          municipal perto de você.
        </p>
      </header>

      {/* Banner de acesso ao Guia de Varas */}
      <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div>
          <span className="font-semibold text-text">Procurando a Vara Judicial ou Balcão Virtual da sua Comarca?</span>
          <p className="text-text-soft">Consulte e-mails, telefones com DDD, endereços com CEP e juízes titulares de 990 unidades em todas as 298 comarcas de MG e polos do Brasil.</p>
        </div>
        <a
          href="/judiciario/contatos"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-bold text-white hover:bg-primary/90 transition-colors"
        >
          Consultar Varas e Juizados →
        </a>
      </div>

      <section className="mt-8">
        <SeletorRedeGeral cidades={cidades} />
      </section>
    </main>
  );
}
