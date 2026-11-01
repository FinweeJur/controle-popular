"use client";

import { useState, useMemo } from "react";
import { 
  compararEstados, 
  carregarDadosEstados, 
  configuracao,
  formatarNumero, 
  formatarMoeda, 
  formatarPercentual 
} from "@/lib/direitos-comparados/dados";
import { TipoIndicador, UF, DadosEstado, ComparacaoEstados } from "@/lib/direitos-comparados/tipos";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";

/**
 * Componente cliente para o comparador de indicadores de direitos fundamentais.
 *
 * ═══ FUNCIONALIDADES ═══
 *
 * - Seleção de estados para comparação
 * - Seleção de tipos de indicadores
 * - Exibição de resultados em tabela
 * - Formatação adequada para cada tipo de dado
 * - Destaque visual para valores maiores
 */

interface ComparadorIndicadoresProps {
  className?: string;
}

export default function ComparadorIndicadores({ className }: ComparadorIndicadoresProps) {
  // Estados selecionados para comparação
  const [ufsSelecionadas, setUfsSelecionadas] = useState<UF[]>(["MG", "SP"]);
  const [periodo, setPeriodo] = useState({ ano: 2023 });
  
  // Tipos de indicadores selecionados
  const [tiposIndicadores, setTiposIndicadores] = useState<TipoIndicador[]>([
    "desenvolvimento", 
    "educacao", 
    "saude", 
    "justica", 
    "trabalho", 
    "financas"
  ]);
  
  // Estado de carregamento e resultados
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<ComparacaoEstados | null>(null);
  
  // Estados disponíveis
  const ufsDisponiveis: UF[] = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];
  
  // Nomes dos estados
  const nomesEstados: Record<UF, string> = {
    AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
    CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
    MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
    PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
    RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
    RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
    SE: "Sergipe", TO: "Tocantins"
  };
  
  // Períodos disponíveis
  const periodosDisponiveis = configuracao.periodos_disponiveis;
  
  // Realizar comparação quando os filtros mudarem
  const realizarComparacao = async () => {
    setCarregando(true);
    try {
      const resultadoComparacao = await compararEstados(periodo, ufsSelecionadas, tiposIndicadores);
      setResultado(resultadoComparacao);
    } catch (error) {
      console.error("Erro na comparação:", error);
    } finally {
      setCarregando(false);
    }
  };
  
  // Efeito para realizar comparação inicial
  useMemo(() => {
    realizarComparacao();
  }, []);
  
  // Toggle tipo de indicador
  const toggleTipoIndicador = (tipo: TipoIndicador) => {
    if (tiposIndicadores.includes(tipo)) {
      setTiposIndicadores(tiposIndicadores.filter(t => t !== tipo));
    } else {
      setTiposIndicadores([...tiposIndicadores, tipo]);
    }
  };
  
  // Adicionar estado à seleção
  const adicionarEstado = (uf: UF) => {
    if (!ufsSelecionadas.includes(uf) && ufsSelecionadas.length < configuracao.limites.max_estados) {
      setUfsSelecionadas([...ufsSelecionadas, uf]);
    }
  };
  
  // Remover estado da seleção
  const removerEstado = (uf: UF) => {
    setUfsSelecionadas(ufsSelecionadas.filter(u => u !== uf));
  };
  
  // Trocar posição dos estados
  const trocarEstados = (index1: number, index2: number) => {
    const novosEstados = [...ufsSelecionadas];
    [novosEstados[index1], novosEstados[index2]] = [novosEstados[index2], novosEstados[index1]];
    setUfsSelecionadas(novosEstados);
  };
  
  // Formatar valor conforme o tipo
  const formatarValor = (valor: number, unidade: string): string => {
    if (unidade.includes("R$")) {
      return formatarMoeda(valor);
    } else if (unidade.includes("%")) {
      return formatarPercentual(valor);
    } else if (unidade.includes("índice")) {
      return valor.toFixed(3);
    } else if (unidade.includes("coeficiente")) {
      return valor.toFixed(3);
    } else if (unidade.includes("/")) {
      return formatarNumero(valor, 1);
    } else {
      return formatarNumero(valor, unidade.includes(".") ? 1 : 0);
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* CONTROLES DE SELEÇÃO */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Comparação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção de período */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium w-24">Período:</label>
            <Select 
              value={periodo.ano.toString()} 
              onValueChange={(ano) => setPeriodo({ ano: parseInt(ano) })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodosDisponiveis.map(p => (
                  <SelectItem key={p.ano} value={p.ano.toString()}>
                    {p.ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Seleção de estados */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Estados:</label>
            <div className="flex flex-wrap gap-2">
              {ufsSelecionadas.map((uf, index) => (
                <div key={uf} className="flex items-center gap-1 bg-primary/10 rounded-md px-3 py-1">
                  <span className="text-sm font-medium">{nomesEstados[uf]}</span>
                  <button
                    onClick={() => removerEstado(uf)}
                    className="text-xs text-muted hover:text-destructive"
                  >
                    ×
                  </button>
                  {index > 0 && (
                    <button
                      onClick={() => trocarEstados(index, index - 1)}
                      className="text-xs text-muted hover:text-primary"
                    >
                      ↑
                    </button>
                  )}
                </div>
              ))}
              {ufsSelecionadas.length < configuracao.limites.max_estados && (
                <Select onValueChange={adicionarEstado}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Adicionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ufsDisponiveis
                      .filter(uf => !ufsSelecionadas.includes(uf))
                      .map(uf => (
                        <SelectItem key={uf} value={uf}>
                          {nomesEstados[uf]}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          
          {/* Seleção de tipos de indicadores */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Indicadores:</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(configuracao.indicadores_disponiveis).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => toggleTipoIndicador(tipo as TipoIndicador)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    tiposIndicadores.includes(tipo as TipoIndicador)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {tipo === "desenvolvimento" && "Desenvolvimento"}
                  {tipo === "educacao" && "Educação"}
                  {tipo === "saude" && "Saúde"}
                  {tipo === "justica" && "Justiça"}
                  {tipo === "trabalho" && "Trabalho"}
                  {tipo === "financas" && "Finanças"}
                </button>
              ))}
            </div>
          </div>
          
          {/* Botão de comparação */}
          <div className="flex justify-end">
            <Button 
              onClick={realizarComparacao}
              disabled={carregando || ufsSelecionadas.length < 2}
            >
              {carregando ? "Comparando..." : "Comparar Agora"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* RESULTADOS DA COMPARAÇÃO */}
      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Comparação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Indicador</th>
                    {ufsSelecionadas.map(uf => (
                      <th key={uf} className="text-right p-2">
                        {nomesEstados[uf]}
                      </th>
                    ))}
                    <th className="text-right p-2">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Agrupar resultados por indicador
                    const agrupados = resultado.resultados.reduce((acc, resultado) => {
                      const key = resultado.indicador;
                      if (!acc[key]) {
                        acc[key] = [];
                      }
                      acc[key].push(resultado);
                      return acc;
                    }, {} as Record<string, typeof resultado.resultados>);
                    
                    return Object.entries(agrupados).map(([indicador, indicadorResultados]) => (
                      <tr key={indicador} className="border-b">
                        <td className="p-2 font-medium">
                          <div>{indicador}</div>
                          <div className="text-xs text-muted">
                            {resultado.indicadores.find(i => i.rotulo === indicador)?.unidade}
                          </div>
                        </td>
                        {ufsSelecionadas.map(uf => {
                          const resultadoEstado = indicadorResultados.find(r => 
                            r.estado_a === nomesEstados[uf] || r.estado_b === nomesEstados[uf]
                          );
                          const valor = resultadoEstado?.valor_a || resultadoEstado?.valor_b || 0;
                          
                          return (
                            <td key={uf} className="text-right p-2 font-mono">
                              {resultadoEstado && formatarValor(valor, resultado.indicadores.find(i => i.rotulo === indicador)?.unidade || "")}
                            </td>
                          );
                        })}
                        <td className="text-right p-2">
                          {indicadorResultados[0] && (
                            <div className="font-mono">
                              {formatarValor(indicadorResultados[0].diferenca, resultado.indicadores.find(i => i.rotulo === indicador)?.unidade || "")}
                            </div>
                          )}
                          {ufsSelecionadas.length === 2 && indicadorResultados[0] && (
                            <div className="text-xs text-muted">
                              {formatarPercentual(indicadorResultados[0].percentual)}
                            </div>
                          )}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            
            {/* Legenda */}
            <div className="mt-4 text-xs text-muted">
              <p>• Valores em negrito indicam o maior valor para cada indicador</p>
              <p>• Diferença calculada como valor absoluto</p>
              <p>• Percentual calculado em relação ao segundo estado da comparação</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* ESTADO VAZIO */}
      {!resultado && !carregando && (
        <Card>
          <CardContent className="py-8 text-center text-muted">
            <p>Configure os filtros acima e clique em "Comparar Agora" para ver os resultados</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}