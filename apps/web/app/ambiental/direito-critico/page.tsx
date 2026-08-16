import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/ambiental/direito-critico` — página-PONTE. O painel próprio (30 normas
 * nacionais/internacionais + 15 precedentes, migration `0067`) foi
 * unificado com `/ambiental/legislacao` em 13/08/2026 (decisão do dono: "é
 * melhor unificar os painéis... filtrável por temas"). Esta URL continua
 * existindo — link já compartilhado, indexado — só não serve mais o
 * conteúdo próprio, redireciona pro painel único.
 *
 * ═══ POR QUE ESTA PÁGINA EXISTE ALÉM DO `redirects()` DE `next.config.ts`
 *     — LEIA ANTES DE APAGAR UM DOS DOIS ═══
 *
 * `redirects()` cobre o alvo Cloudflare Workers (HTTP 301 antes de renderizar
 * nada) mas NÃO EXISTE no alvo `output: 'export'` (GitHub Pages) — sem
 * servidor, não há quem aplique o redirect, e o modo de falha é silencioso
 * (ver o comentário grande sobre isso em `next.config.ts`). Esta página é o
 * equivalente estático: `<meta http-equiv="refresh">`, que navegadores
 * tratam como 301 e buscadores consolidam no `canonical`. Mesmo padrão de
 * `app/[municipio]/components/PaginaPonte.tsx`, sem a dependência de
 * `Cidade` que aquele componente tem (esta rota não é por município).
 *
 * Nenhum coletor escreve mais nesta URL — `direito_critico_normas` e
 * `direito_critico_precedentes` continuam intocadas no banco, só migraram
 * de tela.
 */

const DESTINO = "/ambiental/legislacao";

export const metadata: Metadata = metadataEditavel("/ambiental/direito-critico", {
  title: "Legislação e precedentes por tema — Controle Popular · Ambiental",
  robots: { index: false, follow: true },
  alternates: { canonical: DESTINO },
});

export default function DireitoCriticoPonte() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${DESTINO}`} />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-text">
          Legislação e precedentes por tema
        </h1>
        <p className="mt-3 text-sm text-text-soft">
          Esta seção foi unificada com a legislação ambiental estadual num painel só, filtrável por
          esfera e por tema. O conteúdo continua todo lá — legislação nacional/internacional e
          precedentes judiciais incluídos.
        </p>
        <Link
          href="/legislacao"
          className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white"
        >
          Ir para a página nova →
        </Link>
      </div>
    </>
  );
}
