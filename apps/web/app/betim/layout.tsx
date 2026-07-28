import type { Metadata } from "next";
import Header from "@/app/betim/components/Header";
import Footer from "@/app/betim/components/Footer";

/**
 * Zona /betim. O `<html>`, as fontes e o ThemeProvider vêm do layout raiz;
 * aqui fica só o que é do eixo Cidades.
 */
export const metadata: Metadata = {
  title: "Controle Popular Betim — Portal independente de transparência de Betim-MG",
  description:
    "Dados públicos sobre contratos, finanças, câmara e serviços de Betim-MG, reunidos em um só lugar. Portal independente, sem vínculo com a Prefeitura ou a Câmara.",
};

export default function BetimLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
