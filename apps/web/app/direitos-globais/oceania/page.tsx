import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Anchor, TreePine, CheckCircle } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import DataColeta from "@/app/components/DataColeta";
import { PAISES_OCEANIA } from "@/lib/direitos-globais/oceania/paises";
import { getDispositivosOceania } from "@/lib/direitos-globais/oceania/dispositivos";
import TabelaOceaniaInterativa from "../componentes/TabelaOceaniaInterativa";
import { ListaDispositivos } from "../componentes/Dispositivos";

export const metadata: Metadata = {
  title: "Oceania e Ilhas do Pacífico | Direitos Globais | Controle Popular",
  description:
    "Comparação dos 14 países da Oceania, direitos dos povos originários, terras consuetudinárias tradicionais e soberania permanente face à emergência climática.",
};

function ResumoOceania() {
  const totalPaises = PAISES_OCEANIA.length;
  const dispositivos = getDispositivosOceania();
  const comDispositivos = new Set(
    dispositivos.filter((d) => !d.em_coleta && d.citacao !== "nao_encontrado").map((d) => d.pais)
  ).size;

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Shield className="h-5 w-5" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            Países Catalogados
          </h3>
        </div>
        <p className="text-2xl font-bold text-text">{totalPaises} Estados</p>
        <p className="mt-1 text-xs text-text-soft">4 sub-regiões do Pacífico Sul e Central</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-5 w-5" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            Dispositivos Reais
          </h3>
        </div>
        <p className="text-2xl font-bold text-text">{comDispositivos} países</p>
        <p className="mt-1 text-xs text-text-soft">Artigos constitucionais transcritos</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <TreePine className="h-5 w-5" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            Terras Consuetudinárias
          </h3>
        </div>
        <p className="text-2xl font-bold text-text">Inalienabilidade</p>
        <p className="mt-1 text-xs text-text-soft">Proteção fundiária em Vanuatu e PNG</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Anchor className="h-5 w-5" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            Emergência Climática
          </h3>
        </div>
        <p className="text-2xl font-bold text-text">Soberania Estatal</p>
        <p className="mt-1 text-xs text-text-soft">Emenda de Tuvalu (2023) contra o mar</p>
      </div>
    </div>
  );
}

function DispositivosOceania() {
  const todosDispositivos = getDispositivosOceania();
  const paises = [...new Set(todosDispositivos.map((d) => d.pais))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  return (
    <section className="mb-12">
      <header className="mb-6">
        <h2 className="text-xl font-bold text-text">
          Dispositivos Constitucionais e Situação Documental por País
        </h2>
        <p className="mt-1 text-sm text-text-soft">
          Artigos transcritos na íntegra de fontes canônicas (Constitute Project, PacLII e Waitangi
          Tribunal). Para os Estados sem ingestão concluída, a lacuna está expressamente declarada.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {paises.map((pais) => (
          <ListaDispositivos
            key={pais}
            pais={pais}
            dispositivos={todosDispositivos.filter((d) => d.pais === pais)}
          />
        ))}
      </div>
    </section>
  );
}

export default function PaginaOceania() {
  return (
    <main id="conteudo-principal" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:text-primary hover:underline">
          Início
        </Link>
        <span>/</span>
        <Link href="/direitos-globais" className="hover:text-primary hover:underline">
          Direitos Globais
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Oceania</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Oceania e Ilhas do Pacífico
        </h1>
        <p className="mt-3 text-base text-text-soft sm:text-lg">
          Comparação constitucional dos 14 Estados soberanos da Australásia, Melanésia, Micronésia e
          Polinésia, com foco nas cláusulas de terras tradicionais indígenas, salvaguarda de recursos
          marinhos e garantia perpétua de soberania diante do avanço do nível do mar.
        </p>
        <div className="mt-4">
          <DataColeta
            coletadoEm="2026-10-30"
            fonte="Constitute Project, PacLII e Waitangi Tribunal"
            competencia="Oceania (14 países)"
          />
        </div>
      </header>

      <ResumoOceania />

      <section className="mb-12">
        <header className="mb-4">
          <h2 className="text-xl font-bold text-text">Matriz dos 14 Países da Oceania</h2>
          <p className="text-xs text-text-soft">
            Explore a relação por sub-região ou status de catalogação com exportação em planilha CSV.
          </p>
        </header>

        <TabelaOceaniaInterativa paises={PAISES_OCEANIA} />
      </section>

      <DispositivosOceania />

      <FooterGlobal />
    </main>
  );
}
