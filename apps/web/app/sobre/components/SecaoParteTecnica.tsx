/**
 * SecaoParteTecnica — seção "A parte técnica" da página /sobre.
 *
 * Extraída do `SobrePage` em 08/10/2026 (hotspots CodeScene, saúde 7,26).
 */
export function SecaoParteTecnica() {
  return (
    <section className="space-y-5">
      <h2 className="font-display text-2xl font-semibold">A parte técnica</h2>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-semibold">O site é pré-renderizado</h3>
        <p className="text-text-soft">
          Uma visita ao site não consulta banco nenhum. O comando de build lê o Postgres
          (hoje no Guara Cloud, num datacenter em São Paulo) uma única vez e transforma tudo
          em HTML pré-renderizado. A vantagem é dupla: sem consulta ao banco em cada visita
          não há custo por acesso nem indisponibilidade por sobrecarga; a contrapartida é
          que o site só muda quando alguém reconstrói, o que roda numa rotina agendada
          (coleta → build → trava de contagem de páginas → publicação), que recusa publicar
          se a contagem de páginas cair abaixo de um piso ou encolher demais em relação à
          publicação anterior — o sinal de que a coleta precisa de revisão antes de virar
          número na tela.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-[.85em]">
          <tbody>
            {[
              ["Aplicação web", "Next.js (App Router), React"],
              ["Acesso a dados", "Drizzle ORM sobre PostgreSQL"],
              ["Publicação", "Guara Cloud (principal) e Cloudflare Workers (fallback)"],
              ["Coleta", "Python 3.12, ~150 arquivos em três pacotes de ETL"],
              ["Esquema do banco", "migrations SQL numeradas, em quatro pacotes"],
              ["Testes automatizados", "biblioteca TypeScript + suíte do globo 3D"],
              ["Publicação alternativa", "export estático para GitHub Pages, sem servidor"],
              ["Código", "AGPL-3.0-or-later, repositório público"],
            ].map(([k, v]) => (
              <tr key={k} className="border-t border-border first:border-t-0">
                <td className="px-3 py-2 font-medium text-text">{k}</td>
                <td className="px-3 py-2 text-text-soft">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-text-soft">
        O dado é público; o código que o organiza também —{" "}
        <a
          href="https://github.com/FinweeJur/controle-popular"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary hover:text-accent"
        >
          github.com/FinweeJur/controle-popular
        </a>
        .
      </p>
    </section>
  );
}
