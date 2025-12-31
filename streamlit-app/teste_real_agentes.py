#!/usr/bin/env python3
"""
TESTES REAIS DOS AGENTES - SEM ENROLAÇÃO
==========================================
Teste de execução REAL de cada agente com casos reais.
Mostra o que FUNCIONA e o que NÃO FUNCIONA.
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent / "lib"))

print("\n" + "=" * 70)
print("🔥 TESTES REAIS DOS AGENTES - EXECUÇÃO COMPLETA")
print("=" * 70)
print(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 70)

# ============================================
# TESTE REAL: Tools Individuais
# ============================================

def testar_tool_real(nome_tool, tool_func, input_data, categoria="Geral"):
    """Testa uma tool com input real e verifica output."""
    print(f"\n{'='*70}")
    print(f"🧪 TESTANDO: {nome_tool}")
    print(f"   Categoria: {categoria}")
    print(f"{'='*70}")

    print(f"\n📥 INPUT:")
    if isinstance(input_data, dict):
        for k, v in input_data.items():
            if isinstance(v, str) and len(v) > 60:
                print(f"   {k}: {v[:60]}...")
            else:
                print(f"   {k}: {v}")
    else:
        if len(str(input_data)) > 100:
            print(f"   {str(input_data)[:100]}...")
        else:
            print(f"   {input_data}")

    try:
        # Executar tool
        print(f"\n⚙️  Executando...")

        if isinstance(input_data, dict):
            resultado = tool_func.invoke(input_data)
        else:
            resultado = tool_func.invoke(input_data)

        # Verificar resultado
        if resultado and len(str(resultado)) > 0:
            print(f"\n📤 OUTPUT:")

            resultado_str = str(resultado)

            # Mostrar preview
            if len(resultado_str) > 300:
                print(f"   {resultado_str[:300]}...")
                print(f"\n   (Total: {len(resultado_str)} caracteres)")
            else:
                print(f"   {resultado_str}")

            # Verificar qualidade
            tem_erro = any(x in resultado_str.lower() for x in ['erro', 'error', 'falhou', 'failed', 'exception'])
            tem_conteudo = len(resultado_str) > 50

            if tem_erro:
                print(f"\n❌ FALHOU - Retornou erro")
                return False
            elif not tem_conteudo:
                print(f"\n⚠️  QUESTIONÁVEL - Resposta muito curta")
                return False
            else:
                print(f"\n✅ FUNCIONOU - Resposta válida gerada")
                return True
        else:
            print(f"\n❌ FALHOU - Sem output")
            return False

    except Exception as e:
        erro_msg = str(e)
        print(f"\n❌ ERRO DE EXECUÇÃO:")
        print(f"   {erro_msg[:200]}")
        return False


# ============================================
# EXECUTAR TESTES REAIS
# ============================================

print("\n\n" + "🔥" * 35)
print("INICIANDO BATERIAS DE TESTES REAIS")
print("🔥" * 35)

resultados = {}

# ============================================
# TESTE 1: Harvey Estrategista
# ============================================
print("\n\n" + "="*70)
print("CATEGORIA: ESTRATÉGIA E ANÁLISE")
print("="*70)

try:
    from lib.langgraph_agents_tools import harvey_estrategista

    resultado_harvey = testar_tool_real(
        "harvey_estrategista",
        harvey_estrategista,
        "Cliente recebeu intimação para contestar ação trabalhista no valor de R$ 80.000 por horas extras não pagas. Qual a melhor estratégia?",
        "Estratégia"
    )
    resultados['harvey_estrategista'] = resultado_harvey
except Exception as e:
    print(f"\n❌ Erro ao importar/testar: {e}")
    resultados['harvey_estrategista'] = False


# ============================================
# TESTE 2: Justine - Intimações
# ============================================
try:
    from lib.langgraph_agents_tools import justine_analise_intimacoes

    resultado_justine = testar_tool_real(
        "justine_analise_intimacoes",
        justine_analise_intimacoes,
        """
        INTIMAÇÃO - PROCESSO Nº 1234567-89.2024.8.00.0000
        Tribunal de Justiça do Estado

        Fica a parte RÉ intimada para apresentar CONTESTAÇÃO no prazo de 15 dias,
        sob pena de revelia e presunção de veracidade dos fatos alegados pela parte autora.

        Valor da causa: R$ 50.000,00
        Data da intimação: 15/01/2025
        """,
        "Análise"
    )
    resultados['justine_analise_intimacoes'] = resultado_justine
except Exception as e:
    print(f"\n❌ Erro ao importar/testar: {e}")
    resultados['justine_analise_intimacoes'] = False


# ============================================
# TESTE 3: Calcular Prazos
# ============================================
print("\n\n" + "="*70)
print("CATEGORIA: GESTÃO DE PRAZOS")
print("="*70)

try:
    from lib.langgraph_agents_tools import calcular_prazos

    resultado_prazos = testar_tool_real(
        "calcular_prazos",
        calcular_prazos,
        {
            "tipo_prazo": "contestacao",
            "data_intimacao": "2025-01-15",
            "dias_corridos": 15
        },
        "Prazos"
    )
    resultados['calcular_prazos'] = resultado_prazos
except Exception as e:
    print(f"\n❌ Erro ao importar/testar: {e}")
    resultados['calcular_prazos'] = False


# ============================================
# TESTE 4: Análise de Risco
# ============================================
print("\n\n" + "="*70)
print("CATEGORIA: ANÁLISE DE RISCO")
print("="*70)

try:
    from lib.langgraph_agents_tools import analisar_risco_caso

    resultado_risco = testar_tool_real(
        "analisar_risco_caso",
        analisar_risco_caso,
        {
            "caso": "Ação trabalhista alegando vínculo empregatício. Reclamante trabalhou como motorista por 3 anos sem registro. Empresa alega prestação de serviços autônoma.",
            "valor_causa": 120000.0
        },
        "Risco"
    )
    resultados['analisar_risco_caso'] = resultado_risco
except Exception as e:
    print(f"\n❌ Erro ao importar/testar: {e}")
    resultados['analisar_risco_caso'] = False


# ============================================
# TESTE 5: Redigir Petição
# ============================================
print("\n\n" + "="*70)
print("CATEGORIA: GERAÇÃO DE DOCUMENTOS")
print("="*70)

try:
    from lib.langgraph_agents_tools import redigir_peticao

    resultado_peticao = testar_tool_real(
        "redigir_peticao",
        redigir_peticao,
        {
            "tipo": "contestacao",
            "contexto": "Contestar ação de cobrança indevida. Autor alega dívida de R$ 10.000, mas valor já foi pago em 2023 via PIX.",
            "dados_processo": {
                "numero": "1234567-89.2024.8.00.0000",
                "parte_autora": "João da Silva",
                "parte_re": "Maria Santos"
            }
        },
        "Documentos"
    )
    resultados['redigir_peticao'] = resultado_peticao
except Exception as e:
    print(f"\n❌ Erro ao importar/testar: {e}")
    resultados['redigir_peticao'] = False


# ============================================
# TESTE 6: Pesquisar Jurisprudência
# ============================================
print("\n\n" + "="*70)
print("CATEGORIA: PESQUISA")
print("="*70)

try:
    from lib.langgraph_agents_tools import pesquisar_jurisprudencia

    resultado_juris = testar_tool_real(
        "pesquisar_jurisprudencia",
        pesquisar_jurisprudencia,
        {
            "tema": "horas extras",
            "tribunal": "TST",
            "palavras_chave": ["banco de horas", "acordo coletivo"]
        },
        "Pesquisa"
    )
    resultados['pesquisar_jurisprudencia'] = resultado_juris
except Exception as e:
    print(f"\n❌ Erro ao importar/testar: {e}")
    resultados['pesquisar_jurisprudencia'] = False


# ============================================
# TESTE 7: Análise de Documento
# ============================================
try:
    from lib.langgraph_agents_tools import analise_documento

    resultado_doc = testar_tool_real(
        "analise_documento",
        analise_documento,
        {
            "documento": """
            CONTRATO DE PRESTAÇÃO DE SERVIÇOS

            Entre CONTRATANTE (CNPJ 12.345.678/0001-90) e CONTRATADO (CPF 123.456.789-00)

            Cláusula 1: O contratado prestará serviços de consultoria por 12 meses.
            Cláusula 2: Pagamento de R$ 5.000 mensais.
            Cláusula 3: Rescisão a qualquer momento com aviso prévio de 30 dias.
            Cláusula 4: Multa de 20% sobre valor total em caso de rescisão antecipada.
            """,
            "tipo": "contrato"
        },
        "Análise"
    )
    resultados['analise_documento'] = resultado_doc
except Exception as e:
    print(f"\n❌ Erro ao importar/testar: {e}")
    resultados['analise_documento'] = False


# ============================================
# TESTE 8: Monitor DJEN
# ============================================
try:
    from lib.langgraph_agents_tools import monitor_djen_publicacoes

    resultado_djen = testar_tool_real(
        "monitor_djen_publicacoes",
        monitor_djen_publicacoes,
        "Silva Santos",
        "Monitoramento"
    )
    resultados['monitor_djen_publicacoes'] = resultado_djen
except Exception as e:
    print(f"\n❌ Erro ao importar/testar: {e}")
    resultados['monitor_djen_publicacoes'] = False


# ============================================
# RESUMO FINAL HONESTO
# ============================================
print("\n\n" + "=" * 70)
print("📊 RESUMO FINAL - RESULTADOS REAIS")
print("=" * 70)

funcionando = sum(1 for v in resultados.values() if v)
total = len(resultados)
taxa_sucesso = (funcionando / total * 100) if total > 0 else 0

print(f"\n{'='*70}")
print(f"ESTATÍSTICAS:")
print(f"{'='*70}")
print(f"  Total de tools testadas: {total}")
print(f"  ✅ Funcionando: {funcionando}")
print(f"  ❌ Com problemas: {total - funcionando}")
print(f"  📊 Taxa de sucesso: {taxa_sucesso:.1f}%")
print(f"{'='*70}")

print(f"\n{'='*70}")
print(f"DETALHAMENTO POR TOOL:")
print(f"{'='*70}")

categorias = {
    "harvey_estrategista": "🎯 Estratégia",
    "justine_analise_intimacoes": "📋 Intimações",
    "calcular_prazos": "📅 Prazos",
    "analisar_risco_caso": "⚠️ Risco",
    "redigir_peticao": "✍️ Documentos",
    "pesquisar_jurisprudencia": "🔍 Pesquisa",
    "analise_documento": "📄 Análise",
    "monitor_djen_publicacoes": "📰 DJEN",
}

for tool_name, funcionou in resultados.items():
    status = "✅ FUNCIONA" if funcionou else "❌ NÃO FUNCIONA"
    categoria = categorias.get(tool_name, "❓")
    print(f"  {status:20} {categoria:20} {tool_name}")

print(f"{'='*70}")

# Recomendações
print(f"\n{'='*70}")
print(f"💡 RECOMENDAÇÕES:")
print(f"{'='*70}")

if taxa_sucesso >= 70:
    print("  ✅ Boa parte dos agentes está funcional")
    print("  ✅ Pode usar no app com confiança")
    print("  ⚠️  Evite os agentes que falharam nos testes")
elif taxa_sucesso >= 40:
    print("  ⚠️  Alguns agentes funcionam, outros não")
    print("  💡 Use apenas os que passaram nos testes")
    print("  🔧 Precisa implementar/corrigir os que falharam")
else:
    print("  ❌ Maioria dos agentes não está funcional")
    print("  🔧 Precisa de trabalho significativo de implementação")
    print("  💡 Foque primeiro nos que já funcionam")

print(f"{'='*70}")

print(f"\n{'='*70}")
print(f"🎯 AGENTES RECOMENDADOS PARA USO:")
print(f"{'='*70}")

funcionando_list = [nome for nome, func in resultados.items() if func]
if funcionando_list:
    for agente in funcionando_list:
        print(f"  ✅ {categorias.get(agente, '❓')} {agente}")
else:
    print("  ⚠️  Nenhum agente passou em todos os testes")
    print("  🔧 Recomenda-se revisar implementações")

print(f"{'='*70}")

# Resultado final
if taxa_sucesso >= 50:
    print("\n✅ Sistema PARCIALMENTE funcional - Use com cuidado")
    exit_code = 0
else:
    print("\n⚠️  Sistema NECESSITA ATENÇÃO - Muitos componentes não funcionam")
    exit_code = 1

print("=" * 70)

sys.exit(exit_code)
