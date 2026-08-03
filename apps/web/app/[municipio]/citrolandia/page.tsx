import { notFound } from "next/navigation";
import { temFonte } from "@/lib/db/queries/municipios";
import Link from "@/lib/betim/link";
import { fetchZapEstabelecimentos } from "@/lib/betim/zap";
import { fetchPostosAnp } from "@/lib/betim/postos";
import ZapCard from "@/app/[municipio]/zap/ZapCard";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

export const generateMetadata = metadataDaCidade(
  (c) => `Citrolândia — ${c.nome} | ${nomePortal(c)}`,
  (c) => `Bairros da Regional Citrolândia em ${c.nome}-${c.uf} e negócios locais cadastrados no Zap ${c.nome}.`
);

// Lista completa (44/44) confirmada ao vivo na página oficial da
// Prefeitura (regionais.betim.digital/regional/citrolandia, botão "Ver
// todos os bairros (44)") em 2026-07-24 -- antes só os 12 primeiros
// (antes do botão) estavam aqui. Acentuação/preposições minúsculas
// normalizadas pra Português padrão (a fonte renderiza tudo em Title
// Case bruto via CSS, ex. "Fazenda Do Capao", "Monte Calvario") --
// mesmo tratamento já usado nos 12 originais.
const BAIRROS_CONFIRMADOS = [
  "Citrolândia",
  "Alto Boa Vista",
  "Aroeira, Lemos e Arranchados",
  "Bandeirinha de Baixo",
  "Chácaras Cinco Ilhas",
  "Chácaras Santa Filomena",
  "Charneca",
  "Colônia Santa Izabel",
  "Conjunto Habitacional Dicalino Cabral",
  "Distrito Industrial Joaquim Celestino Tavares",
  "Fazenda Arranjador Lima",
  "Fazenda da Porteira",
  "Fazenda do Capão",
  "Fazenda dos Limas",
  "Fazenda Gorduras",
  "Fazenda Mota e Lima",
  "Fazenda Serrinha",
  "Fernão Dias",
  "Fernão Dias - 2ª Seção",
  "Gleba Vargem do Português",
  "Gorduras",
  "Granja Bandeirantes",
  "Granja Nove de Julho",
  "Jardim Paulista",
  "Limas",
  "Limas Dois",
  "Lucílio Luiz de Menezes",
  "Monte Calvário",
  "Paquetá",
  "Parque das Videiras",
  "Parque Industrial de Betim",
  "Parque Ipiranga",
  "Porções e Vargem dos Pirias",
  "Quintas das Aroeiras",
  "São Jorge",
  "São José",
  "São Marcos",
  "São Salvador",
  "Sítio Regina",
  "Vila Cruzeiro",
  "Vila Navegantes",
  "Vila Nova",
  "Vila Rica",
  "Vila Sol Nascente",
];

export default async function CitrolandiaPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  // Citrolândia é uma regional de Betim. Sem esta porta, BH e São Paulo
  // ganhariam `/bh/citrolandia` com a lista de bairros de outra cidade.
  if (!temFonte(cidade, "citrolandia")) notFound();
  const [{ rows, configured }, { rows: postos }] = await Promise.all([
    fetchZapEstabelecimentos(cidade.id_municipio, { bairros: BAIRROS_CONFIRMADOS }),
    fetchPostosAnp(cidade.id_municipio, undefined, BAIRROS_CONFIRMADOS),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Citrolândia
      </h1>
      <p className="mt-2 max-w-[65ch] text-text-soft">
        Citrolândia é uma das 10 regionais administrativas de {cidade.nome}, com 44
        bairros ao todo. Aqui reunimos os negócios locais cadastrados no{" "}
        <Link href="/zap" className="font-medium text-accent hover:underline">
          Zap {cidade.nome}
        </Link>{" "}
        que informaram um desses bairros.
      </p>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-text">
          Bairros da região
        </h2>
        <div className="flex flex-wrap gap-2">
          {BAIRROS_CONFIRMADOS.map((b) => (
            <span
              key={b}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text-soft"
            >
              {b}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-text-soft">
          Lista completa (44/44), confirmada na{" "}
          <a
            href="https://regionais.betim.digital/regional/citrolandia"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Prefeitura de {cidade.nome} ↗
          </a>
          .
        </p>
      </section>

      {postos.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 font-display text-lg font-semibold text-text">
            Postos de combustível da região
          </h2>
          <p className="mb-4 text-xs text-text-soft">
            Registro público da ANP (Agência Nacional do Petróleo) — nota de
            conformidade e infrações, quando houver.{" "}
            <Link href="/postos-combustivel" className="font-medium text-accent hover:underline">
              Ver todos os postos de {cidade.nome} →
            </Link>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {postos.map((p) => (
              <div key={p.cnpj} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <p className="font-display font-semibold text-text">{p.razao_social ?? "—"}</p>
                <p className="mt-1 text-sm text-text-soft">
                  {p.endereco ?? "—"}
                  {p.bairro ? ` — ${p.bairro}` : ""}
                </p>
                {p.bandeira && <p className="mt-1 text-xs text-text-soft">Bandeira: {p.bandeira}</p>}
                {p.interditado && (
                  <p className="mt-1 text-xs font-medium text-alert">Posto interditado pela ANP</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 font-display text-lg font-semibold text-text">
          Negócios da região no Zap {cidade.nome}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.length > 0 ? (
            rows.map((item) => <ZapCard key={item.id} item={item} />)
          ) : (
            <p className="col-span-full text-sm text-text-soft">
              {configured
                ? "Nenhum negócio dessa região cadastrado ainda. Seja o primeiro:"
                : "Nenhum dado disponível no momento."}{" "}
              {configured ? (
                <Link href="/zap" className="font-medium text-accent hover:underline">
                  cadastre seu negócio →
                </Link>
              ) : null}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
