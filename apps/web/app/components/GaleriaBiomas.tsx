/**
 * @file GaleriaBiomas.tsx
 * @description Cinco aquarelas de biomas com a fauna típica, para páginas e
 * subfrentes de Meio ambiente.
 *
 * Origem das artes: `public/images/eixos/` (Pantanal, Caatinga, Mata
 * Atlântica, Amazônia e Pampa), no mesmo traço das capas dos eixos.
 * Pedido do dono (08/11/2026): usar a coleção em páginas e subfrentes.
 *
 * É decoração com função de orientação: o nome do bioma e a fauna aparecem
 * em texto (nunca só na imagem). No celular vira uma coluna; no tablet,
 * duas.
 */

interface Bioma {
  nome: string;
  src: string;
  alt: string;
  fauna: string;
}

const BIOMAS: Bioma[] = [
  {
    nome: "Pantanal",
    src: "/images/eixos/pantanal-onca-tuiuiu.jpg",
    alt: "Onça-pintada descansando à beira do rio, entre vitórias-régias, com um tuiuiú ao fundo — aquarela",
    fauna: "Onça-pintada e tuiuiú",
  },
  {
    nome: "Caatinga",
    src: "/images/eixos/caatinga-tatu-mandacaru.jpg",
    alt: "Tatu-bola no semiárido entre mandacarus floridos, com ararinha-azul em voo — aquarela",
    fauna: "Tatu-bola e ararinha-azul",
  },
  {
    nome: "Mata Atlântica",
    src: "/images/eixos/mata-atlantica-mico-leao-bromelias.jpg",
    alt: "Mico-leão-dourado em galhos cobertos de musgo, com bromélias e névoa de serra — aquarela",
    fauna: "Mico-leão-dourado e bromélias",
  },
  {
    nome: "Amazônia",
    src: "/images/eixos/amazonia-boto-vitoria-regia.jpg",
    alt: "Boto-cor-de-rosa emergindo num igarapé com vitórias-régias e raízes de sumaúma — aquarela",
    fauna: "Boto-cor-de-rosa e sumaúma",
  },
  {
    nome: "Pampa",
    src: "/images/eixos/pampa-veado-campeiro-coxilhas.jpg",
    alt: "Veado-campeiro em coxilhas douradas com quero-quero e butiazeiros ao entardecer — aquarela",
    fauna: "Veado-campeiro e quero-quero",
  },
];

export default function GaleriaBiomas({ className = "" }: { className?: string }) {
  return (
    <section aria-label="Biomas e fauna típica" className={`mb-12 ${className}`}>
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
          Biomas e fauna típica
        </h2>
        <p className="mt-1 text-sm text-muted">
          Cinco biomas, cinco aquarelas: as espécies que o portal acompanha.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BIOMAS.map((bioma) => (
          <li
            key={bioma.nome}
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bioma.src}
              alt={bioma.alt}
              width={1376}
              height={768}
              loading="lazy"
              className="aspect-video w-full object-cover"
            />
            <div className="p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {bioma.nome}
              </p>
              <p className="mt-1 text-sm text-text">{bioma.fauna}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
