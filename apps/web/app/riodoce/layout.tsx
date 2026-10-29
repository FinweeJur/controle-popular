import type { Metadata } from "next";
import NextLink from "next/link";
import BuscaUniversal from "@/app/components/BuscaUniversal";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * Zona /riodoce — a Plataforma Rio Doce: hub do caso do rompimento da
 * barragem de Fundão (Samarco/Vale/BHP, 05/11/2015) e da repactuação do
 * Acordo de Mariana. Irmã do /paraopeba (Brumadinho): cada desastre vira
 * uma zona (decisão do dono, 12/10/2026 — `docs/planos/PLANO-PLATAFORMA-
 * RIO-DOCE.md`, decisão 1).
 *
 * ═══ COMPLETO, E NÃO ENXUTO ═══
 *
 * O /paraopeba é enxuto de propósito (decisão de 22/08, registrado no
 * cabeçalho do `paraopeba/layout.tsx`): cresceu sem layout e cada página
 * resolve o próprio rodapé. O /riodoce NASCE com layout — então ele monta
 * aqui o cabeçalho, a barra de busca da zona e o rodapé padrão, no molde do
 * `/judiciario/layout.tsx` (decisão 6 do plano, proposta do dev em 12/10,
 * aberta ao veto do dono). As páginas da zona NÃO devem renderizar outro
 * `<FooterGlobal />` nem outro `<main id="conteudo-principal">` — os dois
 * já vêm daqui, e duplicar geraria rodapé dobrado e `id` repetido no
 * alvo do skip-link (a mesma armadilha registrada no /paraopeba).
 *
 * O `<html>`, as fontes e o ThemeProvider continuam vindo do layout raiz.
 */
export const metadata: Metadata = {
  title: "Controle Popular — Plataforma Rio Doce · Mariana, Fundão e a repactuação",
  description:
    "Hub do caso do Rio Doce: execução do Acordo de Mariana em MG, processos consultados ao vivo no DataJud do CNJ e dados espaciais da bacia. Portal independente.",
};

// Rotas de PRIMEIRO nível desta zona e as portas do tema. Hoje existem o
// hub, /processos e /indice; a jurisprudência do caso vive na página
// geral /jurisprudencia (recorte por frente e tribunal via query string).
// Busca da zona (/riodoce/busca), dados espaciais, biblioteca e linha do
// tempo entram nas fases seguintes do plano (F2–F5) e aparecem aqui quando
// tiverem página de verdade — um link no nav para rota que ainda não existe
// é 404 na tela do leitor.
const NAV = [
  { href: "/riodoce", label: "Visão geral" },
  { href: "/riodoce/processos", label: "Processos" },
  { href: "/riodoce/indice", label: "Índice do tema" },
  // Execução financeira do Acordo em MG continua em /ambiental/mariana —
  // mesma régua de "um número, uma fonte" do plano: o hub só linka, não
  // duplica o acervo do CKAN MG.
  { href: "/ambiental/mariana", label: "Execução do Acordo (MG)" },
  // A página geral cobre Mariana (TJES), Brumadinho (TJMG) e súmulas;
  // aqui ela entra com o recorte do Rio Doce já aplicado.
  { href: "/jurisprudencia?frente=riodoce#lista", label: "Jurisprudência" },
];

export default function RioDoceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="border-b border-[var(--cp-border)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4">
          {/* Wordmark da zona como next/link puro: o <Link> de zona
              (`lib/link-zona.tsx`) prefixaria e geraria
              /riodoce/riodoce — a classe de bug que os comentários do
              next.config.ts registram já ter acontecido três vezes. */}
          <NextLink href="/riodoce" className="font-display text-lg font-bold">
            Plataforma Rio Doce
          </NextLink>
          <nav className="flex flex-1 flex-wrap gap-4 text-sm" aria-label="Seções da Plataforma Rio Doce">
            {NAV.map((item) => (
              <NextLink key={item.href} href={item.href} className="hover:underline">
                {item.label}
              </NextLink>
            ))}
          </nav>
        </div>
        {/* Barra de busca/assistente da zona, em faixa própria (mesma
            decisão do /congresso e do /judiciario: fora do <nav>, largura
            inteira). ═══ endpoints ainda não existem ═══
            `endpointSugestoes`/`endpointChat` apontam para as rotas
            `/riodoce/api/busca` e `/riodoce/api/chat`, que entram junto com
            a busca da zona (`/riodoce/busca`, mesma Fase 1 do plano). Até
            lá, o fetch recebe 404 e o BuscaUniversal cai no modo
            "semRotas" de `lib/rota-ausente.ts`: o painel aponta para /busca
            e /assistente, que FUNCIONAM em qualquer cópia do site — em vez
            de fingir "falha de conexão". Ao criar as rotas, trocar nada
            aqui: os endereços já são os certos. */}
        <div className="mx-auto max-w-5xl px-4 pb-4">
          <BuscaUniversal
            endpointSugestoes="/riodoce/api/busca"
            endpointChat="/riodoce/api/chat"
            placeholder="Buscar processo, município, iniciativa — ou perguntar ao assistente"
            exemplos={[
              "O que está previsto no Acordo do Rio Doce?",
              "Como consultar os processos da reparação?",
              "Quanto já foi empenhado em MG pelo Acordo?",
            ]}
            aviso="O assistente responde a partir dos dados já reunidos no portal e pode errar. Confira sempre na página e na fonte oficial."
          />
        </div>
      </header>

      <main id="conteudo-principal" tabIndex={-1} className="flex-1">
        {children}
      </main>

      <footer className="mt-16 border-t border-[var(--cp-border)] py-8 text-sm">
        <div className="mx-auto max-w-5xl space-y-2 px-4 opacity-80">
          <p>
            Portal independente, sem vínculo com a Vale, a Samarco, a BHP, a
            Fundação Renova ou qualquer partido. Dados públicos das fontes
            oficiais — CKAN de Minas Gerais, WFS da SEMAD e API pública do
            DataJud (CNJ).
          </p>
          <p>
            O portal <strong>não arquiva nem republica autos de processo</strong>:
            a consulta ao DataJud é sempre ao vivo (Termo de Uso da API
            Pública, cláusulas 3.8/3.9). Ver{" "}
            <NextLink href="/sobre#metodologia" className="underline">
              Metodologia
            </NextLink>
            .
          </p>

          {/* Rodapé padrão do portal — ver `FooterGlobal.tsx`. */}
          <FooterGlobal />
        </div>
      </footer>
    </>
  );
}
