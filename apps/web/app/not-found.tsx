import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-text mb-4">Página não encontrada</h1>
      <p className="text-text-soft mb-8 max-w-md">
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
    </main>
  );
}
