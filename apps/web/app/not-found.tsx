/**
 * @file not-found.tsx
 * @description Página 404 do portal, exibida quando o endereço não existe.
 *
 * Componente de SERVIDOR (padrão do App Router). Por atender gente sob
 * estresse, a página é visual e acolhedora: mostra o lobo-guará do eixo
 * Terra e Território antes do aviso, reforçando a identidade do portal e
 * suavizando o erro. A imagem já existe no repositório
 * (`public/images/eixos/terra-e-territorios-ipe-lobo.jpg`, 1024×576) e é
 * carregada com `next/image`, igual ao hero dos eixos (`EixoLayout.tsx`).
 *
 * Acessibilidade: o `alt` descreve a cena para quem usa leitor de tela. A
 * descrição abaixo do título nunca fica menor que `text-sm` (14px), conforme
 * a regra §5.10 do AGENTS.md. Os botões de recuperação (Início, Índice e
 * Cidades) continuam no fim, como caminho de saída.
 *
 * O aviso ao companheiro Seu Nonô é feito por `SinalizarErro404`, um cliente
 * mínimo que dispara o evento global em `lib/companheiro/eventos.ts`.
 */

import Image from "next/image";
import Link from "next/link";
import { SinalizarErro404 } from "./components/SinalizarErro404";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="w-full max-w-3xl">
        <Image
          src="/images/eixos/terra-e-territorios-ipe-lobo.jpg"
          alt="Lobo-guará caminhando ao lado de um ipê amarelo florido em escarpa rochosa do Cerrado"
          width={1024}
          height={576}
          priority
          className="mb-8 h-auto w-full rounded-2xl border border-border shadow-md"
        />

        {/* Sinal comportamental para o pet; não renderiza nada visível. */}
        <SinalizarErro404 />

        <h1 className="text-4xl font-bold text-text mb-4">Página não encontrada</h1>
        <p className="text-sm text-text-soft mb-8 max-w-md mx-auto">
          O endereço que você procura não existe ou foi movido.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast hover:opacity-90 transition"
          >
            Página Inicial
          </Link>
          <Link
            href="/indice"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-surface-2 transition"
          >
            Índice do Site
          </Link>
          <Link
            href="/cidades"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-surface-2 transition"
          >
            Cidades
          </Link>
        </div>
      </div>
    </main>
  );
}
