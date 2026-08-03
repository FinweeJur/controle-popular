interface PaginaEmBreveProps {
  titulo: string;
  descricao: string;
  motivo: string;
}

/**
 * Estado padrão pras páginas temáticas do F9 sem ETL ainda (social,
 * segurança, meio ambiente, agro, emendas, nota-transparencia) — mesma filosofia
 * do resto do site (ver /sobre): mostrar "em breve" com o motivo real em
 * vez de inventar números.
 */
export default function PaginaEmBreve({ titulo, descricao, motivo }: PaginaEmBreveProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">{titulo}</h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">{descricao}</p>

      <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
        <p className="font-medium text-text">Em breve</p>
        <p className="mt-2">{motivo}</p>
      </div>
    </main>
  );
}
