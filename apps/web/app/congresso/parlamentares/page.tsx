import type { Metadata } from "next";
import { Suspense } from "react";
import { listarParlamentares } from "@/lib/congresso/parlamentares";
import ListaParlamentares, { ListaParlamentaresCompleta } from "./ListaParlamentares";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/congresso/parlamentares", {
  title: "Parlamentares — Controle Popular · Congresso",
  description:
    "Todos os deputados federais em exercício, com presença em plenário, coerência de voto com direitos fundamentais e proposições de autoria. Filtre por casa, partido e UF.",
});

export default async function Parlamentares() {
  // SEM filtro no SQL: o mesmo motivo de `bancadas` — o recorte é do
  // cliente (ver `ListaParlamentares`), e a consulta nunca teve LIMIT.
  const parlamentares = await listarParlamentares();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Parlamentares</h1>
        <p className="max-w-3xl opacity-80">
          Quem ocupa uma cadeira na Câmara dos Deputados — presença em plenário,
          coerência entre voto e proposição, e o que cada um já propôs.
        </p>
      </header>

      {/* Mesmo padrão de `bancadas`: fallback é a lista COMPLETA, não um
          esqueleto, porque é o que o servidor tem antes de o navegador ler
          a query — e também o conteúdo certo para quem chega sem filtro. */}
      <Suspense fallback={<ListaParlamentaresCompleta parlamentares={parlamentares} />}>
        <ListaParlamentares parlamentares={parlamentares} />
      </Suspense>
    </div>
  );
}
