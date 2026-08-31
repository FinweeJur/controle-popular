"use client";

import React, { useState } from "react";

/**
 * Dicionário em linguagem acessível (para leigos) das principais siglas
 * e termos técnicos/jurídicos utilizados no portal.
 */
export const GLOSSARIO_TERMOS: Record<string, { titulo: string; descricao: string }> = {
  TAC: {
    titulo: "Termo de Ajustamento de Conduta",
    descricao: "Acordo formal assinado por quem causou dano (como uma mineradora) para reparar o problema e pagar compensações financeiras sem precisar ir até o fim de um processo na Justiça.",
  },
  COPAM: {
    titulo: "Conselho Estadual de Política Ambiental (MG)",
    descricao: "Órgão do Governo de Minas Gerais que vota e decide se grandes empreendimentos (mineração, indústrias, rodovias) recebem licença para funcionar.",
  },
  FEAM: {
    titulo: "Fundação Estadual do Meio Ambiente (MG)",
    descricao: "Órgão de fiscalização ambiental de Minas Gerais, responsável por fiscalizar a poluição industrial e a segurança de barragens de rejeitos.",
  },
  SEMAD: {
    titulo: "Secretaria de Estado de Meio Ambiente e Desenvolvimento Sustentável",
    descricao: "Secretaria do Governo de MG que comanda a política de meio ambiente, licenciamento e fiscalização no estado.",
  },
  IEF: {
    titulo: "Instituto Estadual de Florestas (MG)",
    descricao: "Órgão de MG responsável por cuidar das florestas, parques estaduais, unidades de conservação e autorizar o corte de vegetação nativa.",
  },
  IGAM: {
    titulo: "Instituto Mineiro de Gestão das Águas (MG)",
    descricao: "Órgão de MG responsável pela gestão de rios, medição da qualidade da água e autorização (outorga) para uso de recursos hídricos.",
  },
  AJRI: {
    titulo: "Auditoria Jurídica da Reparação Integral",
    descricao: "Auditoria independente contratada para fiscalizar se a Vale está cumprindo as medidas prometidas após o rompimento de Brumadinho.",
  },
  ATI: {
    titulo: "Assessoria Técnica Independente",
    descricao: "Equipe técnica (como AEDAS, Guaicuy ou NACAB) escolhida e que assessora as pessoas atingidas pelo desastre para entender seus direitos e documentos.",
  },
  "EIA/RIMA": {
    titulo: "Estudo de Impacto Ambiental e Relatório de Impacto",
    descricao: "Estudo técnico obrigatório que uma empresa deve apresentar mostrando todos os impactos na natureza e nas pessoas antes de começar uma obra.",
  },
  CVM: {
    titulo: "Comissão de Valores Mobiliários",
    descricao: "Órgão do governo federal que fiscaliza empresas que têm ações na Bolsa de Valores (como a Vale), exigindo relatórios públicos sobre suas finanças e processos.",
  },
  DFP: {
    titulo: "Demonstrações Financeiras Padronizadas",
    descricao: "Relatório oficial anual onde uma empresa de capital aberto publica quanto faturou, lucrou e quanto reservou para pagar processos judiciais e desastres.",
  },
  FRE: {
    titulo: "Formulário de Referência",
    descricao: "Documento detalhado que a empresa entrega à Bolsa de Valores listando todos os riscos do seu negócio, acidentes, diretores e processos judiciais em andamento.",
  },
  SIRENEJud: {
    titulo: "Painel do Conselho Nacional de Justiça",
    descricao: "Base pública do Poder Judiciário que reúne todos os processos judiciais sobre crimes e danos ambientais em andamento no Brasil.",
  },
};

interface TermoExplicadoProps {
  termo: string;
  explicacao?: string;
  titulo?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Componente que adiciona um tooltip explicativo e acessível a siglas e termos técnicos.
 * Facilita a compreensão do leigo ao passar o mouse ou tocar na sigla no celular.
 */
export function TermoExplicado({
  termo,
  explicacao,
  titulo,
  children,
  className = "",
}: TermoExplicadoProps) {
  const [aberto, setAberto] = useState(false);
  const entrada = GLOSSARIO_TERMOS[termo.toUpperCase()] ?? {
    titulo: titulo ?? termo,
    descricao: explicacao ?? "",
  };

  const textoDescricao = explicacao ?? entrada.descricao;
  const textoTitulo = titulo ?? entrada.titulo;

  if (!textoDescricao) {
    return <span className={className}>{children ?? termo}</span>;
  }

  return (
    <span
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
    >
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        aria-expanded={aberto}
        aria-label={`${termo}: ${textoTitulo}`}
        className="inline-flex items-center border-b border-dotted border-primary font-medium text-inherit underline-offset-2 transition-colors hover:text-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {children ?? termo}
        <span aria-hidden="true" className="ml-0.5 text-[0.65em] opacity-70">
          ⓘ
        </span>
      </button>

      {aberto && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-surface p-3 text-xs text-text shadow-xl backdrop-blur"
        >
          <span className="block font-display font-semibold text-primary">
            {textoTitulo}
          </span>
          <span className="mt-1 block leading-relaxed text-text-soft">
            {textoDescricao}
          </span>
          <span
            aria-hidden="true"
            className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-border"
          />
        </span>
      )}
    </span>
  );
}
