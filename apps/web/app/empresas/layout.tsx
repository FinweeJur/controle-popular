export default function EmpresasLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main id="conteudo-principal" tabIndex={-1} className="min-h-screen">
      {children}
    </main>
  );
}
