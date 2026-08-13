"use client";

import Link from "@/lib/betim/link";
import type { ZapEstabelecimento } from "@/lib/betim/zap";
import { useCaminhoDaCidade } from "@/lib/betim/basePath";
import { useListaAoVivo } from "@/lib/betim/lista-ao-vivo";
import ZapCard from "@/app/[municipio]/zap/ZapCard";

/**
 * Os negócios da regional, com a mesma correção de `/zap`: o HTML estático
 * traz a lista do último build, e cadastro e moderação gravam em D1 (ver
 * `lib/betim/lista-ao-vivo.ts`). Sem isto, esta seção mostraria a lista de
 * antes de ontem enquanto a de `/zap` já mostrasse a de agora — divergência
 * entre duas telas do mesmo dado, que é pior que atraso nas duas.
 *
 * `?bairros=` vai na query e NÃO é refiltrado aqui, ao contrário de
 * categoria e busca em `ListaZap`: aquilo é recorte que o visitante escolhe
 * e muda a cada clique; este é a definição da página, uma constante de
 * build (`BAIRROS_CONFIRMADOS`). Mandar para o SQL evita trazer a cidade
 * inteira para mostrar uma regional.
 */
export default function ZapDaRegiao({
  inicial,
  configured,
  bairros,
}: {
  inicial: ZapEstabelecimento[];
  configured: boolean;
  bairros: readonly string[];
}) {
  const caminho = useCaminhoDaCidade();
  const rows = useListaAoVivo<ZapEstabelecimento>(
    caminho(`/api/zap?bairros=${encodeURIComponent(bairros.join(","))}`),
    inicial
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.length > 0 ? (
        rows.map((item) => <ZapCard key={item.id} item={item} />)
      ) : (
        <p className="col-span-full text-sm text-text-soft">
          {configured
            ? "Nenhum negócio dessa região cadastrado ainda. Seja o primeiro:"
            : "Nenhum dado disponível no momento."}{" "}
          {configured ? (
            <Link href="/zap" className="font-medium text-accent hover:underline">
              cadastre seu negócio →
            </Link>
          ) : null}
        </p>
      )}
    </div>
  );
}
