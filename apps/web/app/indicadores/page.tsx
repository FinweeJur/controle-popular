import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { BarChart3, Building2, FileText, Users } from "lucide-react";

interface IndicadorUF {
  nome: string;
  nome_completo: string;
  total_municipios: number;
  total_conselhos: number;
  total_contratos: number;
}

interface IndicadorRegiao {
  ufs: string[];
  total_municipios: number;
  total_conselhos: number;
  total_contratos: number;
}

interface IndicadoresData {
  gerado_em: string;
  fonte: string;
  total_municipios_brasil: number;
  regioes: Record<string, IndicadorRegiao>;
  por_uf: Record<string, IndicadorUF>;
}

function carregarIndicadores(): IndicadoresData | null {
  try {
    const fp = path.join(process.cwd(), "apps/web/data/indicadores-regionais.json");
    return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch {
    return null;
  }
}

export default async function IndicadoresPage() {
  const dados = carregarIndicadores();
  if (!dados) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-8">
        <h1 className="font-display text-2xl font-bold">Indicadores Regionais</h1>
        <p className="mt-4 text-text_soft">Dados não disponíveis no momento. Tente novamente mais tarde.</p>
      </main>
    );
  }

  const regioes = Object.entries(dados.regioes);
  const ufs = Object.entries(dados.por_uf).sort((a, b) => a[1].nome.localeCompare(b[1].nome));

  const totalConselhos = Object.values(dados.por_uf).reduce((s, u) => s + u.total_conselhos, 0);
  const totalContratos = Object.values(dados.por_uf).reduce((s, u) => s + u.total_contratos, 0);

  return (
    <article className="mx-auto max-w-5xl px-4 py-12 sm:px-8">
      <header className="mb-10">
        <nav className="text-sm text-text_soft">
          <Link href="/">Controle Popular</Link> {" > "} <span>Indicadores</span>
        </nav>
        <h1 className="mt-2 font-display text-[clamp(1.8em,4vw,2.4em)] font-bold leading-tight">
          Indicadores Regionais — Brasil
        </h1>
        <p className="mt-3 max-w-2xl text-text_soft">
          Dados estáticos consolidados de <strong>{dados.total_municipios_brasil.toLocaleString("pt-BR")}</strong> municípios,
          coletados via API do IBGE e PNCP. Última atualização:{" "}
          <time dateTime={dados.gerado_em}>{new Date(dados.gerado_em).toLocaleDateString("pt-BR")}</time>.
        </p>
      </header>

      {/* Cards resumo */}
      <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-4 sm:gap-6">
        <Card titulo="Municípios" valor={dados.total_municipios_brasil.toLocaleString("pt-BR")} icone={Users} cor="text-accent" />
        <Card titulo="Estados/UFs" valor={Object.keys(dados.por_uf).length.toString()} icone={Building2} />
        <Card titulo="Conselhos" valor={totalConselhos.toLocaleString("pt-BR")} icone={FileText} />
        <Card titulo="Contratos PNCP" valor={totalContratos.toLocaleString("pt-BR")} icone={BarChart3} />
      </section>

      {/* Regiões */}
      <section className="mb-10">
        <h2 className="font-display mb-4 text-xl font-semibold">Por Região</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-text_soft">
                <th className="px-4 py-2 text-left">Região</th>
                <th className="px-4 py-2 text-right">Estados</th>
                <th className="px-4 py-2 text-right">Municípios</th>
                <th className="px-4 py-2 text-right">Conselhos</th>
                <th className="px-4 py-2 text-right">Contratos</th>
              </tr>
            </thead>
            <tbody>
              {regioes.map(([nome, r]) => (
                <tr key={nome} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold">{nome}</td>
                  <td className="px-4 py-3 text-right">{r.ufs.length}</td>
                  <td className="px-4 py-3 text-right font-tabular">{r.total_municipios.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right font-tabular">{r.total_conselhos.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right font-tabular">{r.total_contratos.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Todas as UFs */}
      <section>
        <h2 className="font-display mb-4 text-xl font-semibold">Detalhe por Estado</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-text_soft">
                <th className="px-4 py-2 text-left">UF</th>
                <th className="px-4 py-2 text-left">Estado</th>
                <th className="px-4 py-2 text-right">Municípios</th>
                <th className="px-4 py-2 text-right">Conselhos</th>
                <th className="px-4 py-2 text-right">Contratos</th>
                <th className="px-4 py-2 text-center">Link</th>
              </tr>
            </thead>
            <tbody>
              {ufs.map(([uf, u]) => (
                <tr key={uf} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-tabular">{uf}</td>
                  <td className="px-4 py-3">{u.nome_completo}</td>
                  <td className="px-4 py-3 text-right font-tabular">{u.total_municipios.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right font-tabular">{u.total_conselhos.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right font-tabular">{u.total_contratos.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/cidades/${uf}`} className="text-accent hover:underline">
                      Ver cidades
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-10 border-t border-border pt-6 text-sm text-text_soft">
        <p>⚠️ Dados estáticos gerados no build. Para dados em tempo real, o Neon precisa estar ativo.</p>
      </footer>
    </article>
  );
}

// Componente Card inline simples
import { ReactNode } from "react";
function Card({ titulo, valor, icone: Icon, cor = "text-text" }: {
  titulo: string; valor: string; icone: typeof Users; cor?: string;
}) {
  const IconEl = Icon;
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 text-text_soft">
        <IconEl className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">{titulo}</span>
      </div>
      <p className={`mt-1 font-tabular text-2xl font-bold ${cor}`}>{valor}</p>
    </div>
  );
}
