"use client";

import { useState } from "react";
import { useCidade } from "@/lib/betim/cidade-cliente";

/**
 * "Assistente de pedido LAI" (Ação cidadã, plan §10.1). Em vez de um
 * formulário genérico em branco, dá ao morador um rascunho pronto de
 * pedido de acesso à informação (Lei 12.527/2011) + o link direto pro
 * portal oficial de LAI do órgão certo — que são DIFERENTES pra
 * Prefeitura e Câmara (URLs confirmadas por descoberta 2026-07-24).
 *
 * O pedido de LAI é formalmente endereçado ao órgão, não ao portal: por
 * isso a peça só GERA o texto e leva o cidadão pro canal oficial; não
 * envia nada pelo site (não somos o destinatário legal do pedido).
 *
 * O nome do órgão e a URL do SIC vinham escritos à mão. É o texto de
 * "Betim" mais grave que havia no app: não é um título, é um DOCUMENTO
 * JURÍDICO que o morador copia e envia — endereçado à prefeitura errada,
 * ele não vale nada. O nome vem de `municipios.nome`; as duas URLs, que
 * não dão para derivar do nome, foram para `municipios.fontes`
 * (`sic_prefeitura`, `sic_camara`), ao lado das outras config de fonte.
 * Cidade que não declarar a URL não mostra o botão do portal — o rascunho
 * continua servindo para copiar.
 */
type Orgao = "prefeitura" | "camara";

function portalDoOrgao(
  orgao: Orgao,
  cidade: { nome: string; fontes: Record<string, unknown> | null }
): { nome: string; url: string | null; modelo: string } {
  const url = cidade.fontes?.[orgao === "prefeitura" ? "sic_prefeitura" : "sic_camara"];
  const base = {
    url: typeof url === "string" && url ? url : null,
  };
  if (orgao === "prefeitura") {
    return {
      ...base,
      nome: `Prefeitura de ${cidade.nome}`,
      modelo: `À Prefeitura Municipal de ${cidade.nome} — Serviço de Informação ao Cidadão (SIC),

Com base na Lei de Acesso à Informação (Lei nº 12.527/2011), solicito informações sobre o seguinte contrato administrativo:

• Objeto: (cole aqui o objeto do contrato)
• Fornecedor: (nome / CNPJ)
• Número do contrato ou identificação no PNCP: (número)

Especificamente, gostaria de saber:
(escreva aqui o que deseja detalhar — ex.: justificativa da contratação, medições e execução, eventuais aditivos)

Solicito a resposta no prazo legal. Atenciosamente,`,
    };
  }
  return {
    ...base,
    nome: `Câmara de ${cidade.nome}`,
    modelo: `À Câmara Municipal de ${cidade.nome} — Serviço de Informação ao Cidadão (SIC),

Com base na Lei de Acesso à Informação (Lei nº 12.527/2011), solicito informações sobre a seguinte proposição:

• Tipo, número e ano: (ex.: Projeto de Lei nº 000/2025)
• Autor(a): (vereador)

Especificamente, gostaria de saber:
(escreva aqui o que deseja detalhar — ex.: situação atual da tramitação, pareceres das comissões, texto integral)

Solicito a resposta no prazo legal. Atenciosamente,`,
  };
}

export default function PedidoLAI({ orgao }: { orgao: Orgao }) {
  const cidade = useCidade();
  const portal = portalDoOrgao(orgao, cidade);
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState(portal.modelo);
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // navigator.clipboard pode falhar (contexto não-seguro/permissão) —
      // seleciona o textarea como fallback pra o usuário copiar na mão.
      const el = document.getElementById(`lai-${orgao}`) as HTMLTextAreaElement | null;
      el?.select();
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-accent bg-accent/10 px-6 py-5">
      <strong className="text-[1.05em]">Quer cobrar mais informação?</strong>
      <p className="mt-1 max-w-2xl text-sm text-text-soft">
        Qualquer cidadão pode pedir detalhes por escrito pela Lei de Acesso à
        Informação (LAI). Monte um pedido pronto pra enviar ao canal oficial
        da {portal.nome} — é só preencher o que falta.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="cursor-pointer rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-ink hover:bg-primary/90"
        >
          {aberto ? "Ocultar rascunho" : "Gerar pedido de LAI"}
        </button>
        {portal.url && (
          <a
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-surface px-4 py-1.5 text-sm font-medium text-text hover:bg-surface-2"
          >
            Abrir portal de LAI da {portal.nome} ↗
          </a>
        )}
      </div>

      {aberto && (
        <div className="mt-4">
          <textarea
            id={`lai-${orgao}`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={12}
            className="w-full resize-y rounded-xl border border-border bg-bg p-3 font-mono text-[.85em] leading-relaxed text-text"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copiar}
              className="cursor-pointer rounded-lg border border-primary bg-primary px-4 py-1.5 text-sm font-semibold text-primary-ink"
            >
              {copiado ? "Copiado ✓" : "Copiar texto"}
            </button>
            <span className="text-xs text-text-soft">
              Depois de copiar, cole no portal de LAI da {portal.nome} (o
              pedido é gratuito; o órgão tem 20 dias pra responder).
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
