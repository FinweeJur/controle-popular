#!/usr/bin/env python3
"""
Validador de dados de universidades e grupos de pesquisa.
Verifica integridade, consistência e qualidade dos dados coletados.

Uso: python -m validador_universidades --diretorio apps/web/lib/universidades

Autor: Subagente de Expansão de Universidades
Data: 2026-10-30
"""

import argparse
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Set
from datetime import datetime


class ValidadorUniversidades:
    """Validador de dados de universidades e grupos de pesquisa."""
    
    def __init__(self):
        self.erros = []
        self.alertas = []
        self.estados_validados = 0
        
        # Padrões de validação
        self.padroes = {
            'sigla': r'^[A-Z]{2,10}$',
            'cpf': r'^\d{11}$',
            'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
            'telefone': r'^\(\d{2}\)\s?\d{4,5}-\d{4}$',
            'codigo_ibge': r'^\d{7}$'
        }
        
        # Estados brasileiros válidos
        self.estados_validos = {
            'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
            'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
            'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
        }
        
        # Áreas do conhecimento válidas (exemplo)
        self.areas_validas = {
            '40700104': 'Física da Matéria Condensada',
            '40700103': 'Biofísica',
            '40700102': 'Agronomia',
            '40700105': 'Ciência da Computação',
            '40700106': 'Engenharia de Energia',
            '40700107': 'Educação',
            '40700108': 'Ciências Ambientais',
            '40700109': 'Ecologia'
        }
    
    def validar_estado(self, uf: str, dados: Dict[str, Any]) -> bool:
        """Valida dados de um estado específico."""
        valido = True
        
        print(f"Validando dados para {uf}...")
        
        # Validar campos obrigatórios
        if 'uf' not in dados:
            self.erros.append(f"{uf}: Campo 'uf' obrigatório ausente")
            valido = False
        
        if 'instituicoes' not in dados:
            self.erros.append(f"{uf}: Campo 'instituicoes' obrigatório ausente")
            valido = False
        else:
            for i, inst in enumerate(dados['instituicoes']):
                if not self.validar_instituicao(uf, i, inst):
                    valido = False
        
        if 'grupos' not in dados:
            self.erros.append(f"{uf}: Campo 'grupos' obrigatório ausente")
            valido = False
        else:
            for i, grupo in enumerate(dados['grupos']):
                if not self.validar_grupo(uf, i, grupo):
                    valido = False
        
        if 'projetos' not in dados:
            self.erros.append(f"{uf}: Campo 'projetos' obrigatório ausente")
            valido = False
        else:
            for i, projeto in enumerate(dados['projetos']):
                if not self.validar_projeto(uf, i, projeto):
                    valido = False
        
        if 'fontesUsadas' not in dados:
            self.alertas.append(f"{uf}: Campo 'fontesUsadas' ausente (opcional)")
        else:
            for i, fonte in enumerate(dados['fontesUsadas']):
                if not self.validar_fonte(uf, i, fonte):
                    valido = False
        
        if 'lacunas' not in dados:
            self.alertas.append(f"{uf}: Campo 'lacunas' ausente (opcional)")
        
        if valido:
            print(f"✓ {uf}: Validação concluída com sucesso")
        else:
            print(f"✗ {uf}: Validação falhou")
        
        self.estados_validados += 1
        return valido
    
    def validar_instituicao(self, uf: str, index: int, inst: Dict[str, Any]) -> bool:
        """Valida dados de uma instituição."""
        valido = True
        
        campos_obrigatorios = ['sigla', 'nome', 'tipo', 'uf', 'municipios', 'contatos', 'links', 'fonteUrl', 'dataAcesso']
        
        for campo in campos_obrigatorios:
            if campo not in inst:
                self.erros.append(f"{uf}: Instituição[{index}]: Campo obrigatório '{campo}' ausente")
                valido = False
        
        # Validar tipo
        tipos_validos = ['Universidade', 'Instituto Federal', 'Centro Universitário', 'Faculdade', 'Instituto de Ensino Superior']
        if 'tipo' in inst and inst['tipo'] not in tipos_validos:
            self.erros.append(f"{uf}: Instituição[{index}]: Tipo '{inst['tipo']}' inválido")
            valido = False
        
        # Validar formato da sigla
        if 'sigla' in inst and not re.match(self.padroes['sigla'], inst['sigla']):
            self.erros.append(f"{uf}: Instituição[{index}]: Sigla '{inst['sigla']}' inválida")
            valido = False
        
        # Validar UF
        if 'uf' in inst and inst['uf'] not in self.estados_validos:
            self.erros.append(f"{uf}: Instituição[{index}]: UF '{inst['uf']}' inválida")
            valido = False
        
        # Validar contatos
        if 'contatos' in inst:
            contatos = inst['contatos']
            if 'email' in contatos and not re.match(self.padroes['email'], contatos['email']):
                self.alertas.append(f"{uf}: Instituição[{index}]: Email '{contatos['email']}' parece inválido")
            
            if 'telefone' in contatos and not re.match(self.padroes['telefone'], contatos['telefone']):
                self.alertas.append(f"{uf}: Instituição[{index}]: Telefone '{contatos['telefone']}' parece inválido")
        
        # Validar links
        if 'links' in inst:
            links = inst['links']
            if 'site' in links and not links['site'].startswith('http'):
                self.alertas.append(f"{uf}: Instituição[{index}]: Site '{links['site']}' parece inválido")
            
            if 'lattes' in links and 'lattes.cnpq.br' not in links['lattes']:
                self.alertas.append(f"{uf}: Instituição[{index}]: Lattes '{links['lattes']}' parece inválido")
        
        # Validar data de acesso
        if 'dataAcesso' in inst:
            try:
                datetime.strptime(inst['dataAcesso'], '%Y-%m-%d')
            except ValueError:
                self.erros.append(f"{uf}: Instituição[{index}]: Data de acesso '{inst['dataAcesso']}' inválida")
                valido = False
        
        return valido
    
    def validar_grupo(self, uf: str, index: int, grupo: Dict[str, Any]) -> bool:
        """Valida dados de um grupo de pesquisa."""
        valido = True
        
        campos_obrigatorios = ['id', 'sigla', 'nome', 'areaConhecimento', 'grandeArea', 'instituicao', 'unidade', 'coordenadores', 'projetos', 'fonteUrl']
        
        for campo in campos_obrigatorios:
            if campo not in grupo:
                self.erros.append(f"{uf}: Grupo[{index}]: Campo obrigatório '{campo}' ausente")
                valido = False
        
        # Validar ID
        if 'id' in grupo and not re.match(r'^[A-Z]{2,10}\d+$', grupo['id']):
            self.erros.append(f"{uf}: Grupo[{index}]: ID '{grupo['id']}' inválido")
            valido = False
        
        # Validar área do conhecimento
        if 'areaConhecimento' in grupo:
            area = grupo['areaConhecimento']
            if 'codigo' in area and area['codigo'] not in self.areas_validas:
                self.alertas.append(f"{uf}: Grupo[{index}]: Código de área '{area['codigo']}' não encontrado na lista padrão")
            
            if 'grandeArea' in area and area['grandeArea'] != grupo['grandeArea']:
                self.erros.append(f"{uf}: Grupo[{index}]: Grande área inconsistente entre grupo e área do conhecimento")
                valido = False
        
        # Validar coordenadores
        if 'coordenadores' in grupo:
            for i, coord in enumerate(grupo['coordenadores']):
                if not self.validar_coordenador(uf, f"Grupo[{index}]", i, coord):
                    valido = False
        
        # Validar projetos vinculados
        if 'projetos' in grupo:
            projetos = grupo['projetos']
            if not isinstance(projetos, list):
                self.erros.append(f"{uf}: Grupo[{index}]: Projetos deve ser uma lista")
                valido = False
        
        return valido
    
    def validar_projeto(self, uf: str, index: int, projeto: Dict[str, Any]) -> bool:
        """Valida dados de um projeto de extensão."""
        valido = True
        
        campos_obrigatorios = ['id', 'sigla', 'nome', 'areaConhecimento', 'grandeArea', 'instituicao', 'unidade', 'coordenadores', 'fonteUrl']
        
        for campo in campos_obrigatorios:
            if campo not in projeto:
                self.erros.append(f"{uf}: Projeto[{index}]: Campo obrigatório '{campo}' ausente")
                valido = False
        
        # Validar ID
        if 'id' in projeto and not re.match(r'^[A-Z]{2,10}\d+$', projeto['id']):
            self.erros.append(f"{uf}: Projeto[{index}]: ID '{projeto['id']}' inválido")
            valido = False
        
        # Validar grupo vinculado
        if 'grupo' in projeto:
            grupo_id = projeto['grupo']
            if not re.match(r'^[A-Z]{2,10}\d+$', grupo_id):
                self.erros.append(f"{uf}: Projeto[{index}]: ID de grupo '{grupo_id}' inválido")
                valido = False
        
        # Validar coordenadores
        if 'coordenadores' in projeto:
            for i, coord in enumerate(projeto['coordenadores']):
                if not self.validar_coordenador(uf, f"Projeto[{index}]", i, coord):
                    valido = False
        
        return valido
    
    def validar_coordenador(self, uf: str, contexto: str, index: int, coord: Dict[str, Any]) -> bool:
        """Valida dados de um coordenador."""
        valido = True
        
        campos_obrigatorios = ['nome']
        
        for campo in campos_obrigatorios:
            if campo not in coord:
                self.erros.append(f"{uf}: {contexto}[{index}]: Campo obrigatório '{campo}' ausente")
                valido = False
        
        # Validar CPF
        if 'cpf' in coord:
            if not re.match(self.padroes['cpf'], coord['cpf']):
                self.erros.append(f"{uf}: {contexto}[{index}]: CPF '{coord['cpf']}' inválido")
                valido = False
        
        # Validar email
        if 'email' in coord and not re.match(self.padroes['email'], coord['email']):
            self.alertas.append(f"{uf}: {contexto}[{index}]: Email '{coord['email']}' parece inválido")
        
        return valido
    
    def validar_fonte(self, uf: str, index: int, fonte: Dict[str, Any]) -> bool:
        """Valida dados de uma fonte."""
        valido = True
        
        campos_obrigatorios = ['nome', 'url', 'tipo']
        
        for campo in campos_obrigatorios:
            if campo not in fonte:
                self.erros.append(f"{uf}: Fonte[{index}]: Campo obrigatório '{campo}' ausente")
                valido = False
        
        # Validar tipo
        tipos_validos = ['cnpq', 'capes', 'portal', 'ministerio']
        if 'tipo' in fonte and fonte['tipo'] not in tipos_validos:
            self.erros.append(f"{uf}: Fonte[{index}]: Tipo '{fonte['tipo']}' inválido")
            valido = False
        
        # Validar URL
        if 'url' in fonte and not fonte['url'].startswith('http'):
            self.erros.append(f"{uf}: Fonte[{index}]: URL '{fonte['url']}' inválida")
            valido = False
        
        return valido
    
    def validar_arquivos(self, diretorio: Path) -> bool:
        """Valida todos os arquivos de dados no diretório."""
        print(f"Validando arquivos em {diretorio}...")
        
        arquivos_ts = list(diretorio.glob('dados-*.ts'))
        
        if not arquivos_ts:
            print("Nenhum arquivo de dados encontrado")
            return False
        
        valido_global = True
        
        for arquivo_ts in arquivos_ts:
            try:
                # Extrair UF do nome do arquivo
                uf = arquivo_ts.stem.replace('dados-', '').upper()
                
                # Ler arquivo TypeScript (simulação - em produção, seria necessário parser)
                with open(arquivo_ts, 'r', encoding='utf-8') as f:
                    conteudo = f.read()
                
                # Validação simplificada - verificar se o arquivo tem a estrutura básica
                if 'export default' in conteudo and 'DADOS_' in conteudo:
                    # Verificar se tem a estrutura básica de um arquivo de dados
                    if 'uf:' in conteudo and 'instituicoes:' in conteudo:
                        # Carregar dados de forma simplificada
                        try:
                            # Extrair o objeto JSON manualmente
                            inicio = conteudo.find('const DADOS_')
                            if inicio != -1:
                                inicio = conteudo.find('{', inicio)
                                fim = conteudo.rfind('};')
                                
                                if inicio != -1 and fim != -1:
                                    json_str = conteudo[inicio:fim+1]
                                    # Substituir aspas simples por duplas para JSON válido
                                    # Substituir aspas simples por duplas e corrigir outros problemas
                                    json_str = json_str.replace("'", '"')
                                    json_str = json_str.replace('True', 'true')
                                    json_str = json_str.replace('False', 'false')
                                    json_str = json_str.replace('None', 'null')
                                    
                                    # Tentar parsear o JSON
                                    try:
                                        dados = json.loads(json_str)
                                    except json.JSONDecodeError as e:
                                        # Se falhar, tentar uma abordagem mais robusta
                                        print(f"Erro ao parsear JSON para {uf}: {e}")
                                        dados = None
                                    
                                    if not self.validar_estado(uf, dados):
                                        valido_global = False
                        except Exception as e:
                            self.erros.append(f"{uf}: Erro ao processar arquivo: {e}")
                            valido_global = False
                    else:
                        self.erros.append(f"{uf}: Arquivo não tem estrutura esperada")
                        valido_global = False
                
            except Exception as e:
                self.erros.append(f"Erro ao processar arquivo {arquivo_ts}: {e}")
                valido_global = False
        
        return valido_global
    
    def gerar_relatorio(self):
        """Gera relatório de validação."""
        print("\n" + "="*60)
        print("RELATÓRIO DE VALIDAÇÃO")
        print("="*60)
        
        print(f"\nEstados validados: {self.estados_validados}")
        print(f"Erros encontrados: {len(self.erros)}")
        print(f"Alertas: {len(self.alertas)}")
        
        if self.erros:
            print("\nERROS:")
            for erro in self.erros:
                print(f"  [ERRO] {erro}")
        
        if self.alertas:
            print("\nALERTAS:")
            for alerta in self.alertas:
                print(f"  [ALERTA] {alerta}")
        
        if not self.erros:
            print("\n[OK] Validação concluída com sucesso!")
        else:
            print("\n[FALHA] Validação falhou. Corrija os erros antes de prosseguir.")


def main():
    parser = argparse.ArgumentParser(description='Validador de dados de universidades')
    parser.add_argument('--diretorio', type=str, default='apps/web/lib/universidades', 
                       help='Diretório com os arquivos de dados')
    
    args = parser.parse_args()
    
    validador = ValidadorUniversidades()
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