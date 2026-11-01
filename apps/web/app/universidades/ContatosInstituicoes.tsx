/**
 * @file apps/web/app/universidades/ContatosInstituicoes.tsx
 * @description Lista de contatos institucionais do acervo universitário.
 *
 * Papel no portal: o leitor que quer falar com um grupo precisa do canal da
 * instituição. O DGP/CNPq não publica e-mail por grupo; quem publica é a
 * instituição. Este bloco reúne esses canais num lugar só, com telefone,
 * e-mail, site e Instagram — apenas o que a fonte oficial declara.
 *
 * Sem estado e sem "use client": é componente de servidor. Link interno usa
 * `next/link` (regra 5.13); link externo usa `<a>` comum.
 */

import Link from "next/link";
import { AtSign, Globe, Mail, Phone } from "lucide-react";
import type { Instituicao } from "@/lib/universidades/tipos";

export interface ContatosInstituicoesProps {
  instituicoes: Instituicao[];
}

/** Canais de uma instituição, na ordem em que o leitor procura. */
function Canais({ instituicao }: { instituicao: Instituicao }) {
  const contato = instituicao.contatos;
  if (!contato) {
    return (
      <p className="mt-1 text-xs text-text-soft">
        A fonte não publica contato direto — use o site da instituição.
      </p>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      {contato.telefone && (
        <a
          href={`tel:${contato.telefone.replace(/[^\d+]/g, "")}`}
          className="inline-flex items-center gap-1 text-text hover:text-primary"
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
          {contato.telefone}
        </a>
      )}
      {contato.email && (
        <a
          href={`mailto:${contato.email}`}
          className="inline-flex items-center gap-1 text-text hover:text-primary"
        >
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          {contato.email}
        </a>
      )}
      {contato.site && (
        <a
          href={contato.site}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
          Site
        </a>
      )}
      {contato.instagram && (
        <a
          href={contato.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <AtSign className="h-3.5 w-3.5" aria-hidden="true" />
          Instagram
        </a>
      )}
    </div>
  );
}

/** Um cartão por instituição, com link para a página própria. */
function CartaoInstituicao({ instituicao }: { instituicao: Instituicao }) {
  return (
    <li className="rounded-lg border border-border p-3">
      <p className="text-sm font-semibold text-text">
        <Link
          href={`/universidades/${instituicao.sigla.toLowerCase()}`}
          className="hover:text-primary hover:underline"
        >
          {instituicao.sigla}
        </Link>{" "}
        <span className="font-normal text-text-soft">· {instituicao.uf}</span>
      </p>
      <p className="text-xs text-text-soft">{instituicao.nome}</p>
      <Canais instituicao={instituicao} />
    </li>
  );
}

export default function ContatosInstituicoes({
  instituicoes,
}: ContatosInstituicoesProps) {
  const ordenadas = [...instituicoes].sort((a, b) =>
    a.sigla.localeCompare(b.sigla, "pt-BR"),
  );
  const comTelefone = ordenadas.filter((i) => i.contatos?.telefone).length;
  const comEmail = ordenadas.filter((i) => i.contatos?.email).length;

  return (
    <details className="mb-6 rounded-xl border border-border bg-surface p-4">
      <summary className="cursor-pointer text-sm font-semibold text-text">
        Contatos das instituições ({ordenadas.length})
        <span className="ml-2 font-normal text-text-soft">
          {comTelefone} com telefone · {comEmail} com e-mail
        </span>
      </summary>

      <p className="mt-2 text-xs text-text-soft">
        O canal é o da instituição: o cadastro oficial de grupos de pesquisa não
        publica e-mail por grupo. Onde a fonte não informa, o campo fica vazio —
        nada é deduzido do líder.
      </p>

      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {ordenadas.map((i) => (
          <CartaoInstituicao key={i.sigla} instituicao={i} />
        ))}
      </ul>
    </details>
  );
}
