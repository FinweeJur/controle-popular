/**
 * Estatísticas dos contatos judiciários a partir do agregado pré-computado
 * (data/judiciario-contatos-stats.json).
 *
 * Por quê separado: a página /judiciario/contatos deixou de passar as 990
 * unidades como props (payload RSC de ~800 KB) e o catálogo completo agora
 * mora no bundle do componente cliente. Estes números vêm do agregado medido
 * com data — nunca digitados à mão (regra do repositório).
 */

import statsJson from "@/data/judiciario-contatos-stats.json";
import type { ResumoEstatisticasContatos } from "./contatos-tipos";

const STATS = statsJson as {
  totalUnidades: number;
  porTipo: Record<string, number>;
  porRamo: Record<string, number>;
  totalVaras?: number;
  totalGabinetes?: number;
  totalSecretarias?: number;
  totalComarcas?: number;
  ufsAtendidas?: number;
  totalBalcoesVirtuais?: number;
};

export function obterEstatisticasContatos(): ResumoEstatisticasContatos {
  const porTipo = STATS.porTipo;
  const porRamo = STATS.porRamo;
  return {
    totalUnidades: STATS.totalUnidades,
    totalVaras: STATS.totalVaras ?? (porTipo["Vara"] + porTipo["Juizado Especial"]),
    totalGabinetes: STATS.totalGabinetes ?? porTipo["Gabinete"],
    totalSecretarias: STATS.totalSecretarias ?? porTipo["Secretaria"],
    totalComarcas: STATS.totalComarcas ?? 0,
    ufsAtendidas: STATS.ufsAtendidas ?? 0,
    totalBalcoesVirtuais: STATS.totalBalcoesVirtuais ?? 0,
    porRamo: {
      estadual: porRamo["Estadual"],
      federal: porRamo["Federal"],
      trabalho: porRamo["Trabalho"],
    },
  };
}
