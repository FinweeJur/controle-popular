/**
 * @file apps/web/app/universidades/BlocosInstituicao.tsx
 * @description Blocos de apoio da página de instituição, extraídos para
 * manter a página principal curta e legível.
 *
 * Sem estado e sem "use client": são componentes de servidor. Os links são
 * externos (site, Instagram, telefone, e-mail) e por isso usam `<a>` comum,
 * não `next/link` — a regra 5.13 vale para rota interna.
 */

import {
  AtSign,
  ExternalLink,
  Globe,
  Mail,
  Phone,
} from "lucide-react";
import type { Instituicao, Unidade } from "@/lib/universidades/tipos";

/** Caixa de contato e portais oficiais da instituição. */
export function ContatosInstituicao({ instituicao }: { instituicao: Instituicao }) {
  const contato = instituicao.contatos;
  return (
    <div className="mt-4 rounded-xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-text">Contato e portais oficiais</h2>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {contato?.site && (
          <a
            href={contato.site}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Globe className="h-4 w-4" aria-hidden="true" /> Site
          </a>
        )}
        {contato?.instagram && (
          <a
            href={contato.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <AtSign className="h-4 w-4" aria-hidden="true" /> Instagram
          </a>
        )}
        {contato?.telefone && (
          <a
            href={`tel:${contato.telefone.replace(/[^\d+]/g, "")}`}
            className="inline-flex items-center gap-1 text-text-soft hover:text-primary"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {contato.telefone}
          </a>
        )}
        {contato?.email && (
          <a
            href={`mailto:${contato.email}`}
            className="inline-flex items-center gap-1 text-text-soft hover:text-primary"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            {contato.email}
          </a>
        )}
      </div>

      <ul className="mt-3 grid gap-1 sm:grid-cols-2">
        {instituicao.links.map((l) => (
          <li key={l.url}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-text hover:text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              {l.rotulo}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Lista das unidades acadêmicas, com campus e site quando houver. */
export function ListaUnidades({ unidades }: { unidades: Unidade[] }) {
  return (
    <section aria-label="Unidades acadêmicas" className="mb-6">
      <h2 className="mb-2 text-lg font-bold text-text">Unidades acadêmicas</h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {unidades.map((u) => (
          <li
            key={u.sigla}
            className="rounded-lg border border-border bg-surface p-3"
          >
            <p className="text-sm font-semibold text-text">{u.nome}</p>
            <p className="text-xs text-text-soft">
              {u.sigla}
              {u.campus ? ` · ${u.campus}` : ""}
            </p>
            {u.site && (
              <a
                href={u.site}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Site da unidade
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
