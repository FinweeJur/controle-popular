import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

interface Municipio {
  [key: string]: unknown;
  id: string;
  nome: string;
  microrregiao: string;
  mesorregiao: string;
  regiao_imediata: string;
  regiao_intermediaria: string;
}

const COLUNAS: ColunaTabela<Municipio>[] = [
  { chave: "nome", rotulo: "Município", ordenavel: true, tipoOrdenacao: "texto", largura: "min-w-[180px]" },
  { chave: "microrregiao", rotulo: "Microrregião", ordenavel: true, tipoOrdenacao: "texto", largura: "min-w-[140px]" },
  { chave: "mesorregiao", rotulo: "Mesorregião", ordenavel: true, tipoOrdenacao: "texto", largura: "min-w-[140px]" },
  { chave: "regiao_imediata", rotulo: "Região Imediata", ordenavel: true, tipoOrdenacao: "texto", largura: "min-w-[140px]" },
];

export default async function PageCidadesSP() {
  // Verifica se os dados foram publicados via build (public/municipios/sp/)
  const publicDir = path.join(process.cwd(), "apps/web/public/municipios/sp");
  let base = "/municipios/sp";
  let total = 0;

  if (fs.existsSync(path.join(publicDir, "manifesto.json"))) {
    const manifesto = JSON.parse(fs.readFileSync(path.join(publicDir, "manifesto.json"), "utf-8"));
    total = manifesto.total;
  } else {
    // Fallback: tenta ler dados diretamente (next dev)
    const dataDir = path.join(process.cwd(), "apps/web/data", "municipios-sp.json");
    if (fs.existsSync(dataDir)) {
      const dados = JSON.parse(fs.readFileSync(dataDir, "utf-8"));
      total = dados.length;
    }
  }

  const cartao = {
    titulo: "Municípios de SP",
    valor: total.toLocaleString("pt-BR"),
    descricao: "Cidades em Minas Gerais mapeadas pelo IBGE",
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <nav aria-label="Você está em" className="text-sm text-text_soft">
          <Link href="/">Controle Popular</Link> {" > "} <span>Cidades</span> {" > "} <span>SP</span>
        </nav>
        <h1 className="mt-2 text-3xl font-bold">Municípios de Minas Gerais</h1>
        <p className="mt-3 text-text_soft">
          Todos os 645 municípios de Minas Gerais mapeados via API do IBGE. Dados atualizados
          no build — <a href="https://servicodados.ibge.gov.br/api/v1/localidades/estados/35/municipios" target="_blank" rel="noopener noreferrer">Fonte</a>.
        </p>
      </header>

      <section className="mb-6 rounded-lg border border-[var(--cp-border)] bg-surface p-5">
        <h2 className="text-lg font-semibold">{cartao.titulo}</h2>
        <p className="text-3xl font-bold text-[var(--cp-accent)]">{cartao.valor}</p>
        <p className="text-sm text-text_soft">{cartao.descricao}</p>
      </section>

      <TabelaEstatica<Municipio>
        base={base}
        colunas={COLUNAS}
        camposBusca={["nome", "microrregiao", "mesorregiao", "regiao_imediata"]}
        porPagina={50}
        vazio="Nenhum município encontrado nesta busca."
      />

      <footer className="mt-8 border-t border-[var(--cp-border)] pt-4 text-sm text-text_soft">
        <p>⚠️ Esta página usa dados estáticos do build. Para dados em tempo real, o Neon precisa estar ativo.</p>
      </footer>
    </article>
  );
}