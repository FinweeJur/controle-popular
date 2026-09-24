import type { Metadata } from "next";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * `/imprensa` — sala de imprensa do Controle Popular, na RAIZ do domínio.
 *
 * Facilita a apuração de redações, jornalistas e pesquisadores cívicos:
 * - Números-chave auditados com a página-fonte e link oficial direto.
 * - Metodologia de dupla verificação e princípio do interesse social.
 * - Esclarecimento editorial sobre o que o portal é (e não é).
 * - Sugestões de pauta fundamentadas em dados públicos.
 * - Canal de contato institucional.
 *
 * Estática e rápida: não depende de banco em runtime.
 */
export const metadata: Metadata = metadataEditavel("/imprensa", {
  title: "Sala de Imprensa & Dados Consolidados — Controle Popular",
  description:
    "Material para jornalistas e pesquisadores: números-chave auditados, 206+ rotas públicas, 42+ fontes oficiais e contatos institucionais.",
});

const NUMEROS_CHAVE: Array<{
  numero: string;
  oQue: string;
  pagina: string;
  href: string;
}> = [
  {
    numero: "206+ rotas",
    oQue: "páginas públicas estruturadas no App Router com dados, tabelas e microresumos auditados",
    pagina: "Índice Geral do Portal",
    href: "/indice",
  },
  {
    numero: "42+ fontes",
    oQue: "bases oficiais integradas (Diários Oficiais, PNCP, SICAR, SIGBM, SICONFI, TCU, TCE-MG, IBGE)",
    pagina: "Sobre & Metodologia",
    href: "/sobre",
  },
  {
    numero: "1,16 milhão",
    oQue: "imóveis rurais cadastrados e analisados no Cadastro Ambiental Rural (CAR/IEF-MG) em 14 regionais",
    pagina: "Cadastro Ambiental Rural (CAR)",
    href: "/ambiental/car",
  },
  {
    numero: "14 órgãos",
    oQue: "ambientais e patrimoniais com série histórica decenal (2016–2026) de servidores, orçamento e sobrecarga",
    pagina: "Capacidade Institucional",
    href: "/ambiental/capacidade-institucional",
  },
  {
    numero: "16.601",
    oQue: "atos oficiais catalogados e classificados por tema no acervo histórico do diário de Betim/MG",
    pagina: "Diário Oficial (Betim)",
    href: "/betim/prefeitura/diario",
  },
  {
    numero: "199 cidades",
    oQue: "polos estratégicos monitorados no PNCP e todos os 853 municípios de MG com dados compactados",
    pagina: "Cidades Estratégicas",
    href: "/cidades",
  },
  {
    numero: "R$ 5,48 bi",
    oQue: "execução do Acordo Judicial de Brumadinho auditados pela FGV (26 municípios, 73,8% pago)",
    pagina: "Paraopeba · Execução do Acordo",
    href: "/paraopeba/execucao",
  },
  {
    numero: "R$ 171 bi",
    oQue: "repactuação histórica do Acordo de Mariana para reparação socioambiental da Bacia do Rio Doce",
    pagina: "Acordo de Mariana (Rio Doce)",
    href: "/ambiental/mariana",
  },
  {
    numero: "387",
    oQue: "Unidades de Conservação federais e estaduais (CNUC/MMA) mapeadas no globo 3D fundiário",
    pagina: "Função Social da Terra · Mapa 3D",
    href: "/funcaosocialterra/mapa",
  },
  {
    numero: "27 estados",
    oQue: "ecossistema regulatório nacional com todas as OEMAs, agências federais e concessionárias de água e luz",
    pagina: "Ecossistema Regulatório",
    href: "/ambiental/ecossistema",
  },
];

export default function ImprensaPage() {
  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl space-y-14 px-4 py-12 sm:py-16">
      <nav aria-label="Navegação estrutural" className="text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <span className="text-text font-medium">Imprensa</span>
      </nav>

      <header className="space-y-4">
        <p className="font-display text-[1.1em] font-bold text-text">
          controlepopular<span className="text-primary">.com.br</span> · para jornalistas e pesquisadores
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Sala de Imprensa & Dados Consolidados
        </h1>
        <p className="max-w-3xl text-[1.05em] text-text-soft leading-relaxed">
          Portal independente de transparência pública e inteligência cívica.
          Reunimos dados oficiais dispersos em dezenas de sistemas governamentais
          e os organizamos por território e tema em linguagem acessível.
          Cada número publicado possui link canônico para a fonte primária,
          metodologia auditada e dupla verificação obrigatória.
        </p>
      </header>

      {/* Números-chave */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl font-semibold">Números-chave Auditados</h2>
          <span className="text-xs font-mono text-text-soft bg-surface-2 px-2.5 py-1 rounded-md border border-border self-start sm:self-auto">
            Metodologia ABNT · Atualizado 2026
          </span>
        </div>
        <p className="text-text-soft text-sm">
          Todos os indicadores são conferíveis na tela de origem (clique no link para abrir a auditoria completa):
        </p>
        <div className="overflow-x-auto rounded-xl border border-border shadow-xs">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-text">
                <th className="px-4 py-3 font-semibold w-36">Métrica</th>
                <th className="px-4 py-3 font-semibold">O que representa</th>
                <th className="px-4 py-3 font-semibold w-48">Página de Auditoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {NUMEROS_CHAVE.map((n) => (
                <tr key={n.numero} className="hover:bg-surface-2/40 transition-colors">
                  <td className="px-4 py-2.5 font-mono font-bold text-text whitespace-nowrap">
                    {n.numero}
                  </td>
                  <td className="px-4 py-2.5 text-text-soft leading-snug">
                    {n.oQue}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <Link href={n.href} className="text-primary hover:underline font-medium">
                      {n.pagina} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-soft">
          Para detalhes de metodologia, dicionários de variáveis e arquitetura de dados:{" "}
          <Link href="/sobre" className="text-primary hover:underline">
            /sobre
          </Link>{" "}
          e{" "}
          <Link href="/indice" className="text-primary hover:underline">
            /indice
          </Link>
          .
        </p>
      </section>

      {/* O que o portal NÃO é */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">O que o portal não é</h2>
        <ul className="list-disc space-y-2 pl-5 text-text-soft text-sm leading-relaxed">
          <li>
            <strong className="text-text">Não é site governamental</strong> e não possui qualquer
            vínculo com prefeituras, governos estaduais, órgãos federais ou partidos políticos.
            Trata-se de uma iniciativa cívica autônoma com código-fonte aberto (licença AGPL-3.0) no{" "}
            <a
              href="https://github.com/FinweeJur/controle-popular"
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:underline font-medium"
            >
              GitHub oficial
            </a>
            .
          </li>
          <li>
            <strong className="text-text">Não é fonte primária.</strong> O portal processa, audita e
            republica dados oficiais de fontes públicas (Diários Oficiais, PNCP, SICAR, SIGBM, SICONFI, TCU, TCE-MG).
            A fonte oficial referenciada em cada tela é a autoridade máxima do registro.
          </li>
          <li>
            <strong className="text-text">Não utiliza cálculos gerados por IA.</strong> Adotamos o
            princípio &ldquo;o modelo extrai, o código calcula&rdquo;: inteligência artificial é empregada
            apenas para leitura e extração estruturada de documentos, enquanto toda totalização,
            porcentagem e cruzamento é executado por código determinístico com dupla verificação.
          </li>
          <li>
            <strong className="text-text">Não publica dados pessoais.</strong> CPFs de pessoas físicas
            são anonimizados ou validados por algoritmo de mod-11 para bloqueio prévio. O repositório
            possui esteiras automatizadas que impedem a inclusão de dados sensíveis protegidos pela LGPD.
          </li>
        </ul>
      </section>

      {/* Sugestões de pauta */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">Três ganchos de pauta fundamentados</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-2/40 p-4 space-y-2">
            <span className="text-xs font-semibold text-alert uppercase tracking-wider">
              1. Rompimentos & Reparações
            </span>
            <h3 className="font-semibold text-text text-sm">
              Acordos de Brumadinho e Mariana
            </h3>
            <p className="text-xs text-text-soft leading-relaxed">
              Auditoria de R$ 5,48 bi executados pela FGV na Bacia do Paraopeba e repactuação de R$ 171 bi no Rio Doce, com acompanhamento de 30 barragens com método a montante em Minas Gerais.
            </p>
            <div className="pt-2">
              <Link href="/paraopeba/execucao" className="text-xs text-primary font-medium hover:underline">
                Ver auditoria do Paraopeba →
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-2/40 p-4 space-y-2">
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
              2. Gargalo Ambiental & Terras
            </span>
            <h3 className="font-semibold text-text text-sm">
              Fila do CAR e Queda de Servidores
            </h3>
            <p className="text-xs text-text-soft leading-relaxed">
              1,16 milhão de imóveis no CAR sob gestão do IEF/MG com tempo médio de análise de 4,3 anos, somados à perda decenal de 31,4% dos servidores nos órgãos ambientais reguladores.
            </p>
            <div className="pt-2">
              <Link href="/ambiental/car" className="text-xs text-primary font-medium hover:underline">
                Ver painel do CAR 2.0 →
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-2/40 p-4 space-y-2">
            <span className="text-xs font-semibold text-sky-500 uppercase tracking-wider">
              3. Compras Públicas & Cidades
            </span>
            <h3 className="font-semibold text-text text-sm">
              199 Polos no PNCP e Atos Oficiais
            </h3>
            <p className="text-xs text-text-soft leading-relaxed">
              16.601 atos catalogados por tema em Betim, monitoramento contínuo de contratações no PNCP em 199 cidades estratégicas e R$ 139 bi de transferências da União para MG.
            </p>
            <div className="pt-2">
              <Link href="/cidades" className="text-xs text-primary font-medium hover:underline">
                Ver catálogo de cidades →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Regras de uso */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Uso editorial e citação</h2>
        <p className="text-text-soft text-sm leading-relaxed">
          Tabelas, gráficos e recortes do portal podem ser livremente reproduzidos por veículos de comunicação,
          observatórios e pesquisadores com o crédito &ldquo;Controle Popular (controlepopular.com.br)&rdquo;.
          Ao divulgar números específicos, recomendamos citar conjuntamente o órgão oficial de origem
          identificado em tela. Desenvolvedores e analistas podem consumir nossos conjuntos de dados
          estruturados via{" "}
          <Link href="/dados/populares" className="text-primary hover:underline font-medium">
            Catálogo de Dados Abertos
          </Link>
          .
        </p>
      </section>

      {/* Contato */}
      <section className="rounded-2xl border border-border bg-surface-2 p-5 sm:p-6 space-y-2">
        <h2 className="font-display text-xl font-semibold">Atendimento a Jornalistas e Pesquisadores</h2>
        <p className="text-text-soft text-sm leading-relaxed">
          Para esclarecimentos metodológicos, agendamento de entrevistas, envio de sugestões de pauta ou
          solicitação de cruzamentos de dados:
        </p>
        <p className="pt-1">
          <a
            href="mailto:contato@controlepopular.com.br"
            className="text-base font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            ✉️ contato@controlepopular.com.br
          </a>
        </p>
        <p className="text-xs text-text-soft/80">
          Retorno em até 48 horas úteis. Não solicitamos nem armazenamos informações sob sigilo de fonte.
        </p>
      </section>

      <FooterGlobal />
    </main>
  );
}
