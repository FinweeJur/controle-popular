#!/usr/bin/env python3
"""
Validador simplificado de dados de universidades.
Verifica apenas a estrutura básica dos arquivos.

Uso: python -m validador_universidades_simplificado --diretorio apps/web/lib/universidades

Autor: Subagente de Expansão de Universidades
Data: 2026-10-30
"""

import argparse
import json
from pathlib import Path
from typing import List, Dict, Any


class ValidadorSimplificado:
    """Validador simplificado de dados de universidades."""
    
    def __init__(self):
        self.erros = []
        self.alertas = []
        self.estados_validados = 0
        
    def validar_arquivo(self, arquivo_ts: Path) -> bool:
        """Valida um arquivo de dados."""
        uf = arquivo_ts.stem.replace('dados-', '').upper()
        
        try:
            with open(arquivo_ts, 'r', encoding='utf-8') as f:
                conteudo = f.read()
            
            # Verificar estrutura básica
            checks = [
                ('import { DadosEstado }', 'Importação de tipos'),
                ('const DADOS_', 'Declaração de dados'),
                ('export default', 'Exportação padrão'),
                ('uf:', 'Campo UF'),
                ('instituicoes:', 'Campo instituições'),
                ('grupos:', 'Campo grupos'),
                ('projetos:', 'Campo projetos')
            ]
            
            for check, description in checks:
                if check not in conteudo:
                    self.erros.append(f"{uf}: {description} ausente")
                    return False
            
            # Verificar se tem dados
            if len(conteudo) < 1000:
                self.alertas.append(f"{uf}: Arquivo parece muito curto")
            
            print(f"[OK] {uf}: Validação básica concluída")
            self.estados_validados += 1
            return True
            
        except Exception as e:
            self.erros.append(f"{uf}: Erro ao processar arquivo: {e}")
            return False
    
    def validar_arquivos(self, diretorio: Path) -> bool:
        """Valida todos os arquivos de dados no diretório."""
        print(f"Validando arquivos em {diretorio}...")
        
        arquivos_ts = list(diretorio.glob('dados-*.ts'))
        
        if not arquivos_ts:
            print("Nenhum arquivo de dados encontrado")
            return False
        
        valido_global = True
        
        for arquivo_ts in arquivos_ts:
            if not self.validar_arquivo(arquivo_ts):
                valido_global = False
        
        return valido_global
    
    def gerar_relatorio(self):
        """Gera relatório de validação."""
        self._imprimir_cabecalho()
        self._imprimir_estatisticas()
        self._imprimir_erros()
        self._imprimir_alertas()
        self._imprimir_conclusao()
    
    def _imprimir_cabecalho(self):
        """Imprime o cabeçalho do relatório."""
        print("\n" + "="*60)
        print("RELATÓRIO DE VALIDAÇÃO (Simplificado)")
        print("="*60)
    
    def _imprimir_estatisticas(self):
        """Imprime estatísticas básicas."""
        print(f"\nEstados validados: {self.estados_validados}")
        print(f"Erros encontrados: {len(self.erros)}")
        print(f"Alertas: {len(self.alertas)}")
    
    def _imprimir_erros(self):
        """Imprime lista de erros."""
        if self.erros:
            print("\nERROS:")
            for erro in self.erros:
                print(f"  [ERRO] {erro}")
    
    def _imprimir_alertas(self):
        """Imprime lista de alertas."""
        if self.alertas:
            print("\nALERTAS:")
            for alerta in self.alertas:
                print(f"  [ALERTA] {alerta}")
    
    def _imprimir_conclusao(self):
        """Imprime conclusão do relatório."""
        if not self.erros:
            print("\n[OK] Validação básica concluída com sucesso!")
        else:
            print("\n[FALHA] Validação básica falhou. Verifique os erros.")


def main():
    parser = argparse.ArgumentParser(description='Validador simplificado de dados de universidades')
    parser.add_argument('--diretorio', type=str, default='apps/web/lib/universidades', 
                       help='Diretório com os arquivos de dados')
    
    args = parser.parse_args()
    
    validador = ValidadorSimplificado()
    diretorio = Path(args.diretorio)
    
    if not diretorio.exists():
        print(f"Diretório {diretorio} não encontrado")
        return 1
    
    if validador.validar_arquivos(diretorio):
        validador.gerar_relatorio()
        return 0
    else:
        validador.gerar_relatorio()
        return 1


if __name__ == '__main__':
    exit(main())