import type { Metadata } from "next";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * `/imprensa` — página de imprensa do Controle Popular, na RAIZ do domínio.
 *
 * Existe para encurtar o caminho entre quem cobre transparência e o dado que
 * já está publicado: números-chave com a página-fonte ao lado, o que o portal
 * é (e não é), e o canal de contato único. Mesmo princípio do resto do portal:
 * todo número aqui aponta para a tela onde ele pode ser conferido; nada de
 * número solto sem origem.
 *
 * Estática de propósito: não consulta banco, não depende de build no home-pc
 * com dados. Se um número mudar, muda aqui junto com a tela de origem — a
 * medição de cada um está registrada em `docs/02-estado/ESTADO.md`.
 */
export const metadata: Metadata = metadataEditavel("/imprensa", {
  title: "Imprensa — Controle Popular",
  description:
    "Material para jornalistas: o que é o portal, números-chave com fonte, o que o portal não é, e o canal de contato.",
});

const NUMEROS_CHAVE: Array<{
  numero: string;
  oQue: string;
  pagina: string;
  href: string;
}> = [
  {
    numero: "16.601",
    oQue: "atos de diário oficial de Betim (jan/2020 → jul/2026) classificados por tema",
    pagina: "Diário oficial (Betim)",
    href: "/betim/prefeitura/diario",
  },
  {
    numero: "6 cidades",
    oQue: "com contratos, licitações, diários oficiais, repasses federais e finanças publicados",
    pagina: "Home do portal",
    href: "/",
  },
  {
    numero: "R$ 5,48 bi",
    oQue: "execução do Acordo de Brumadinho (26 municípios, 73,8% pago)",
    pagina: "Paraopeba · execução do Acordo",
    href: "/paraopeba/execucao",
  },
  {
    numero: "R$ 1,65 bi",
    oQue: "repasses aos municípios da bacia do Paraopeba, com os documentos do processo",
    pagina: "Paraopeba",
    href: "/paraopeba",
  },
  {
    numero: "R$ 677 mi",
    oQue: "destinados a Minas Gerais pelo Acordo de Mariana",
    pagina: "Ambiental",
    href: "/ambiental",
  },
  {
    numero: "387",
    oQue: "Unidades de Conservação (CNUC/MMA) no mapa 3D de função social da terra",
    pagina: "Função Social da Terra",
    href: "/funcaosocialterra",
  },
];

export default function ImprensaPage() {
  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-3xl space-y-14 px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <span className="text-text">Imprensa</span>
      </nav>

      <header className="space-y-4">
        <p className="font-display text-[1.1em] font-bold text-text">
          controlepopular<span className="text-primary">.br</span> · para jornalistas
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Imprensa</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Portal independente de transparência pública. Junta dado oficial que já é público
          — espalhado por dezenas de sistemas — e o publica numa tela só, por cidade e por
          tema, em português comum. Cada número tem a fonte ao lado; estimativa vem com a
          taxa de erro publicada; lacuna é declarada, não escondida.
        </p>
      </header>

      {/* Números-chave */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">Números-chave</h2>
        <p className="text-text-soft">
          Todos conferíveis na tela de origem (clique no nome da página para abrir):
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-[.88em]">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-text">
                <th className="px-3 py-2 font-semibold">Número</th>
                <th className="px-3 py-2 font-semibold">O que é</th>
                <th className="px-3 py-2 font-semibold">Fonte na tela</th>
              </tr>
            </thead>
            <tbody>
              {NUMEROS_CHAVE.map((n) => (
                <tr key={n.numero} className="border-t border-border first:border-t-0">
                  <td className="px-3 py-2 font-mono font-semibold text-text">{n.numero}</td>
                  <td className="px-3 py-2 text-text-soft">{n.oQue}</td>
                  <td className="px-3 py-2">
                    <Link href={n.href} className="text-primary hover:text-accent">
                      {n.pagina}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[.85em] text-text-soft">
          Mais números, medidos no banco a cada build:{" "}
          <Link href="/sobre" className="text-primary hover:text-accent">
            /sobre
          </Link>
          .
        </p>
      </section>

      {/* O que o portal NÃO é */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">O que o portal não é</h2>
        <ul className="list-disc space-y-2 pl-5 text-text-soft">
          <li>
            <strong className="text-text">Não é site de governo</strong> e não tem vínculo com
            prefeitura, estado, MP ou Judiciário. É um projeto independente; o código é aberto
            (AGPL-3.0) em{" "}
            <a
              href="https://github.com/FinweeJur/controle-popular"
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:text-accent"
            >
              github.com/FinweeJur/controle-popular
            </a>
            .
          </li>
          <li>
            <strong className="text-text">Não é fonte primária.</strong> O portal republica o
            que órgãos oficiais já publicaram; a fonte oficial linkada em cada tela é a
            autoridade do número.
          </li>
          <li>
            <strong className="text-text">Não é isento de revisão — e diz isso.</strong> O
            portal usa IA na coleta e está permanentemente em revisão. A regra é "o modelo
            extrai, o código calcula": o modelo de linguagem preenche um formulário com a
            citação do dispositivo legal; o rótulo final é aritmética de código. Item com
            confiança baixa fica marcado como "requer revisão humana" na tela. Detalhe em{" "}
            <Link href="/sobre" className="text-primary hover:text-accent">
              /sobre
            </Link>
            .
          </li>
          <li>
            <strong className="text-text">Não publica dado pessoal.</strong> CPF de pessoa
            física é redigido por dígito verificador (mod-11) antes de qualquer persistência;
            duas guardas automáticas barram o commit de dado pessoal no repositório.
          </li>
        </ul>
      </section>

      {/* Sugestões de pauta */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Três ganchos de pauta</h2>
        <ol className="list-decimal space-y-2 pl-5 text-text-soft">
          <li>
            <strong className="text-text">Betim e região:</strong> 16.601 atos de diário
            oficial classificados por tema — dá para achar concentração de fornecedor e
            contrato com alerta de risco em segundos.{" "}
            <Link href="/betim" className="text-primary hover:text-accent">
              /betim
            </Link>
          </li>
          <li>
            <strong className="text-text">Reparação de Brumadinho:</strong> execução do Acordo
            e repasse mês a mês, com os documentos do processo que citam cada município da
            bacia —{" "}
            <Link href="/paraopeba" className="text-primary hover:text-accent">
              /paraopeba
            </Link>
          </li>
          <li>
            <strong className="text-text">Mariana e o Observatório Vale:</strong> o acordo de
            R$ 677 mi para MG e a série da Vale (B3/CVM) sob a mesma régua de fonte —{" "}
            <Link href="/ambiental" className="text-primary hover:text-accent">
              /ambiental
            </Link>
          </li>
        </ol>
      </section>

      {/* Regras de uso */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Uso em matéria</h2>
        <p className="text-text-soft">
          Prints e capturas do portal são livres para uso editorial, com crédito
          "Controle Popular (controlepopular.com.br)". Ao citar número, mantenha a fonte
          oficial que aparece ao lado dele na tela. Não há restrição de republicação dos
          dados: são dados públicos; a API aberta (sem chave) está em{" "}
          <Link href="/api" className="text-primary hover:text-accent">
            /api
          </Link>
          .
        </p>
      </section>

      {/* Contato */}
      <section className="rounded-2xl border border-border bg-surface-2 p-5 sm:p-6">
        <h2 className="font-display text-2xl font-semibold">Contato</h2>
        <p className="mt-2 text-text-soft">
          Resposta em até 48 h úteis. Pautas, pedidos de entrevista, correções e pedidos de
          dado não publicado:{" "}
          <a
            href="mailto:contato@controlepopular.com.br"
            className="text-primary hover:text-accent"
          >
            contato@controlepopular.com.br
          </a>
          .
        </p>
      </section>

      <FooterGlobal />
    </main>
  );
}
