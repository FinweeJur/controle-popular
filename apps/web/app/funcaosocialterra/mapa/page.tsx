import type { Metadata } from "next";
import Cabecalho from "../Cabecalho";
import GloboIframe from "./GloboIframe";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/funcaosocialterra/mapa` — o globo 3D de terras públicas, publicado como
 * arquivo estático dentro do portal (`apps/web/public/terras/globo/`).
 *
 * O globo é um app pronto e funcional (Three.js puro, sem build) que vivia
 * só em ambiente local, nunca publicado — ver a auditoria que trouxe os
 * arquivos para este portal. Ele já resolve o próprio layout interno (HUD
 * nos 4 cantos do CANVAS), então esta página só entra com o que ele não
 * tem: cabeçalho do portal e navegação para o resto da frente.
 *
 * Sem layout.tsx próprio: continua valendo, e agora por mais um motivo. Até
 * 22/08 a razão era só "criar layout de zona para esta única rota levaria
 * cabeçalho ao hub também, fora do que foi pedido". Hoje o hub TEM
 * cabeçalho (`<Cabecalho />`, decisão do dono em `docs/ESTADO.md`, decisão
 * 5) — mas via componente manual, não `layout.tsx`, porque um layout.tsx
 * de zona colaria nas três rotas por igual, inclusive nesta, e aqui ele
 * envolveria `<GloboIframe>` também. `Cabecalho.tsx` explica por que isso é
 * seguro mesmo assim: o HUD é `position: fixed` DENTRO do documento do
 * `<iframe>`, não do documento do portal — o cabeçalho do portal, deste
 * arquivo ou de um layout, nunca fica no mesmo viewport que o HUD.
 * `layout.tsx` continua fora de cogitação aqui pela razão ORIGINAL: uma
 * zona com só 3 rotas e navegação já resolvida manualmente nas 3 não ganha
 * nada com a indireção de um layout — é mecanismo novo para um problema que
 * o padrão manual já resolve (ver `outrasZonas()`/`lib/zonas.ts` sobre não
 * reinventar).
 *
 * `?camada=X&idx=N` abre direto na ficha daquela feature (usado pelo link
 * "Ver no mapa" da página da norma) — ver `GloboIframe.tsx`.
 */
export const metadata: Metadata = metadataEditavel("/funcaosocialterra/mapa", {
  title: "Mapa 3D — Função social da terra | Controle Popular",
  description:
    "Globo 3D interativo com vazio cadastral, terras públicas certificadas, assentamentos e territórios quilombolas em Minas Gerais, camada por camada.",
});

// `GloboIframe` lê `?camada=&idx=` com `useSearchParams()` (dentro de
// Suspense) para montar o deep-link do globo — mesma armadilha de
// `[municipio]/camara/legislacao/page.tsx`: sem `force-static`, `output:
// export` trata a rota como dinâmica.
export const dynamic = "force-static";

export default function MapaTerrasPage() {
  return (
    <div className="flex h-dvh flex-col">
      <Cabecalho />

      {/* <main> em vez do <iframe> solto: dá um alvo semântico à página
          (antes não tinha nenhum), embora não haja texto para o botão
          global de "Ouvir esta página" ler aqui -- o conteúdo é o globo
          3D dentro do iframe, opaco a extração de texto do documento pai.
          O botão detecta o <main> vazio e some sozinho nesta página. */}
      <main id="conteudo-principal" tabIndex={-1} className="flex flex-1 flex-col">
        <GloboIframe />
      </main>
    </div>
  );
}
