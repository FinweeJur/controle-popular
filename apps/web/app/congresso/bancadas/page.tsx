import type { Metadata } from "next";
import { Suspense } from "react";
import { listarBancadas } from "@/lib/congresso/bancadas";
import ListaBancadas, { ListaBancadasCompleta } from "./ListaBancadas";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/congresso/bancadas", {
  title: "Bancadas — Controle Popular · Congresso",
  description:
    "Frentes parlamentares, blocos, federações e partidos na Câmara dos Deputados, com quantos deputados cada um reúne.",
});

export default async function Bancadas() {
  // SEM o filtro de tipo: ele agora é do cliente (ver `ListaBancadas`).
  // Passar `?tipo=` para o SQL exigiria ler `searchParams` aqui, e é
  // exatamente isso que `output: 'export'` proíbe.
  //
  // Trocar `listarBancadas(filtro)` por `listarBancadas()` não muda o
  // universo: a consulta nunca teve LIMIT, o filtro só encurtava a lista.
  const bancadas = await listarBancadas();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Bancadas</h1>
        <p className="max-w-3xl opacity-80">
          Nem todo agrupamento que decide votação está no regimento. As{" "}
          <strong>frentes parlamentares</strong> são o que a imprensa chama de bancada
          ruralista, evangélica ou da segurança — não são órgãos oficiais, mas explicam por
          que parlamentares de partidos diferentes se movem juntos num tema.
        </p>
      </header>

      {/* O fallback é a lista COMPLETA, não um esqueleto: é o que o servidor
          tem para mostrar antes de o navegador ler a query, e é também
          exatamente o conteúdo certo para quem chega sem filtro. O
          `<Suspense>` não emite elemento, então o `space-y-8` do pai continua
          separando header, nav e seções como antes. */}
      <Suspense fallback={<ListaBancadasCompleta bancadas={bancadas} />}>
        <ListaBancadas bancadas={bancadas} />
      </Suspense>
    </div>
  );
}
