import VejaMais from "./VejaMais";

/**
 * Secao padrao do formato wiki.
 *
 * Renderiza um h2 com id de ancora, opcionalmente acompanhado de um
 * link "veja +". Usado para converter paginas existentes no padrao wiki
 * sem reescrever toda a marcacao: basta envolver o conteudo da secao
 * com este componente.
 *
 * O id e obrigatorio porque alimenta o IndiceWiki no topo da pagina.
 */
export default function SecaoWiki({
  id,
  titulo,
  href,
  children,
}: {
  id: string;
  titulo: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-8 scroll-mt-20">
      <h2 className="flex flex-wrap items-center font-display text-xl font-semibold">
        {titulo}
        <VejaMais href={href} titulo={titulo} />
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
