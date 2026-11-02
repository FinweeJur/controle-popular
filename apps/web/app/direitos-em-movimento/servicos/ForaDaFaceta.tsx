import Link from "next/link";

/**
 * @file Seção "o que não é recorte deste painel".
 *
 * POR QUE EXISTE: quando três rotas viram uma, o leitor precisa saber para onde
 * foram as que ficaram de fora — senão conclui que o conteúdo sumiu. A lista é
 * curta e nomeada, e cada item aponta para a rota real (nenhuma delas foi
 * fundida por engano).
 *
 * Está separada da página só para o CodeScene medir a rota e este bloco
 * separadamente: a rota ficou com a composição, o texto mora aqui.
 */

const FORA = [
  { href: "/direitos-em-movimento/seguranca-publica", rotulo: "Segurança pública (Sinesp VDE)" },
  { href: "/direitos-em-movimento/ajuda", rotulo: "Onde buscar ajuda" },
  { href: "/direitos-em-movimento/informacao", rotulo: "Como pedir informação" },
  { href: "/direitos-em-movimento/conselhos", rotulo: "Conselhos de direitos" },
  { href: "/direitos-em-movimento/denuncia", rotulo: "Como denunciar" },
  {
    href: "/direitos-em-movimento/trabalho-e-renda/cadastro-empregadores",
    rotulo: "Cadastro de Empregadores",
  },
];

export default function ForaDaFaceta() {
  return (
    <section aria-labelledby="titulo-fora-da-faceta" className="space-y-3">
      <h2 id="titulo-fora-da-faceta" className="font-display text-xl font-semibold">
        O que não é recorte deste painel
      </h2>
      <p className="text-sm text-text-soft">
        Estes assuntos têm conteúdo próprio e continuam em endereço próprio — juntá-los por
        prefixo teria criado uma página que não é irmã das outras:
      </p>
      <ul className="flex flex-wrap gap-2 text-sm">
        {FORA.map((item) => (
          <li key={item.href}>
            <Link className="underline" href={item.href}>
              {item.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
