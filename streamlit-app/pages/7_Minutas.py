"""
📝 Gerenciador de Minutas
========================

FASE 1: MVP com editor simples (st.text_area)
Próximos passos: Substituir por streamlit-quill para editor WYSIWYG
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

import streamlit as st
from lib.backend_client import BackendClient

# ===========================
# CONSTANTES
# ===========================

TIPOS_MINUTA = ["peticao", "contrato", "parecer", "recurso", "procuracao", "outro"]
STATUS_MINUTA = [
    "rascunho",
    "em-revisao",
    "pendente-revisao",
    "finalizada",
    "arquivada",
]
MSG_EDITOR_VAZIO = "⚠️ O editor está vazio."

# ===========================
# FUNÇÕES AUXILIARES
# ===========================


def buscar_minutas() -> List[Dict[str, Any]]:
    """Busca minutas do backend"""
    try:
        backend = BackendClient()
        return backend.get("/minutas")
    except Exception as e:
        st.error(f"⚠️ Erro ao buscar minutas: {str(e)}")
        return []


def salvar_minuta(minuta: Dict[str, Any]) -> bool:
    """Salva minuta no backend"""
    try:
        backend = BackendClient()
        if minuta.get("id"):
            # Atualizar existente
            backend.put(f"/minutas/{minuta['id']}", minuta)
        else:
            # Criar nova
            backend.post("/minutas", minuta)
        return True
    except Exception as e:
        st.error(f"Erro ao salvar: {str(e)}")
        return False


def deletar_minuta(minuta_id: str) -> bool:
    """Deleta minuta do backend"""
    try:
        response = requests.delete(f"{BACKEND_URL}/api/minutas/{minuta_id}", timeout=5)
        response.raise_for_status()
        return True
    except Exception as e:
        st.error(f"⚠️ Erro ao deletar minuta: {str(e)}")
        return False


def filtrar_minutas(
    minutas: List[Dict[str, Any]],
    status: Optional[str] = None,
    tipo: Optional[str] = None,
    busca: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Aplica filtros às minutas"""
    resultado = minutas.copy()

    if status and status != "Todos":
        resultado = [m for m in resultado if m.get("status") == status]

    if tipo and tipo != "Todos":
        resultado = [m for m in resultado if m.get("tipo") == tipo]

    if busca:
        busca_lower = busca.lower()
        resultado = [
            m
            for m in resultado
            if busca_lower in m.get("titulo", "").lower()
            or busca_lower in m.get("conteudo", "").lower()
            or busca_lower in m.get("autor", "").lower()
        ]

    # Ordenar por data de atualização (mais recente primeiro)
    resultado.sort(
        key=lambda m: m.get("atualizadoEm", m.get("criadoEm", "")), reverse=True
    )

    return resultado


def get_status_badge(status: str) -> str:
    """Retorna emoji para o status"""
    badges = {
        "rascunho": "📝",
        "em-revisao": "👁️",
        "pendente-revisao": "⏳",
        "finalizada": "✅",
        "arquivada": "📦",
    }
    return badges.get(status, "📄")


def get_tipo_icon(tipo: str) -> str:
    """Retorna emoji para o tipo"""
    icons = {
        "peticao": "⚖️",
        "contrato": "📜",
        "parecer": "💼",
        "recurso": "🔄",
        "procuracao": "🤝",
        "outro": "📄",
    }
    return icons.get(tipo, "📄")


# ===========================
# STATE MANAGEMENT
# ===========================

# Inicializar session state
if "editing_minuta" not in st.session_state:
    st.session_state.editing_minuta = None

if "refresh_trigger" not in st.session_state:
    st.session_state.refresh_trigger = 0


# ===========================
# TÍTULO E HEADER
# ===========================

st.title("📝 Gerenciador de Minutas")
st.caption("Criação e edição de documentos jurídicos com auxílio de IA")

st.divider()

# ===========================
# SIDEBAR: FILTROS
# ===========================

with st.sidebar:
    st.header("🔍 Filtros")

    status_filter = st.selectbox(
        "Status", ["Todos"] + STATUS_MINUTA, key="status_filter"
    )

    tipo_filter = st.selectbox("Tipo", ["Todos"] + TIPOS_MINUTA, key="tipo_filter")

    search_query = st.text_input(
        "Buscar", placeholder="Título, conteúdo, autor...", key="search_query"
    )

    st.divider()

    # Botão de atualizar
    if st.button("🔄 Atualizar Lista", use_container_width=True):
        st.session_state.refresh_trigger += 1
        st.rerun()

# ===========================
# BUSCAR E FILTRAR MINUTAS
# ===========================

minutas = buscar_minutas()
minutas_filtradas = filtrar_minutas(
    minutas, status=status_filter, tipo=tipo_filter, busca=search_query
)

# ===========================
# LAYOUT MASTER-DETAIL
# ===========================

col_lista, col_editor = st.columns([1, 2])

# ===========================
# COLUNA 1: LISTA DE MINUTAS
# ===========================

with col_lista:
    st.subheader(f"Minutas ({len(minutas_filtradas)})")

    # Botão Nova Minuta
    if st.button("➕ Nova Minuta", type="primary", use_container_width=True):
        nova_minuta = {
            "id": None,  # Backend vai gerar o ID
            "titulo": "Nova minuta",
            "tipo": "peticao",
            "conteudo": "",
            "status": "rascunho",
            "autor": "Usuário",
            "criadoEm": datetime.now().isoformat(),
            "atualizadoEm": datetime.now().isoformat(),
            "criadoPorAgente": False,
        }
        st.session_state.editing_minuta = nova_minuta
        st.rerun()

    st.divider()

    # Lista de minutas
    if not minutas_filtradas:
        st.info("📭 Nenhuma minuta encontrada com os filtros aplicados.")
    else:
        for minuta in minutas_filtradas:
            with st.container():
                # Header da minuta
                col_icon, col_content = st.columns([1, 8])

                with col_icon:
                    st.markdown(
                        f"<div style='font-size: 2em; text-align: center;'>"
                        f"{get_tipo_icon(minuta.get('tipo', 'outro'))}</div>",
                        unsafe_allow_html=True,
                    )

                with col_content:
                    st.markdown(f"**{minuta.get('titulo', 'Sem título')}**")

                    # Badges
                    badge_status = get_status_badge(minuta.get("status", "rascunho"))
                    st.caption(
                        f"{badge_status} {minuta.get('status', 'rascunho')} • "
                        f"{get_tipo_icon(minuta.get('tipo', 'outro'))} {minuta.get('tipo', 'outro')}"
                    )

                    # Se foi criada por agente
                    if minuta.get("criadoPorAgente"):
                        st.caption(f"🤖 Criada por: {minuta.get('agenteId', 'IA')}")
                    else:
                        st.caption(f"👤 Autor: {minuta.get('autor', 'Desconhecido')}")

                # Botões de ação
                col_edit, col_delete = st.columns(2)

                with col_edit:
                    if st.button(
                        "✏️ Editar",
                        key=f"edit_{minuta.get('id')}",
                        use_container_width=True,
                    ):
                        st.session_state.editing_minuta = minuta
                        st.rerun()

                with col_delete:
                    if st.button(
                        "🗑️ Excluir",
                        key=f"delete_{minuta.get('id')}",
                        use_container_width=True,
                    ):
                        result = deletar_minuta(minuta["id"])
                        if result:
                            st.success("✅ Minuta excluída!")
                            st.session_state.refresh_trigger += 1
                            st.rerun()

                st.divider()

# ===========================
# COLUNA 2: EDITOR
# ===========================

with col_editor:
    if st.session_state.editing_minuta:
        minuta = st.session_state.editing_minuta

        st.subheader("✏️ Editor")

        # Tabs: Editor | Preview | IA | Variáveis | Google Docs
        tab_editor, tab_preview, tab_ai, tab_vars, tab_gdocs = st.tabs(
            [
                "📝 Editor",
                "👁️ Preview",
                "🤖 Comandos IA",
                "🔧 Variáveis",
                "📄 Google Docs",
            ]
        )

        with tab_editor:
            # Formulário
            titulo = st.text_input(
                "Título *", value=minuta.get("titulo", ""), key="edit_titulo"
            )

            col_tipo, col_status = st.columns(2)

            with col_tipo:
                tipo = st.selectbox(
                    "Tipo *",
                    TIPOS_MINUTA,
                    index=TIPOS_MINUTA.index(minuta.get("tipo", "peticao")),
                    key="edit_tipo",
                )

            with col_status:
                status = st.selectbox(
                    "Status *",
                    STATUS_MINUTA,
                    index=STATUS_MINUTA.index(minuta.get("status", "rascunho")),
                    key="edit_status",
                )

            # Badges de Colaboração (Simulado)
            if minuta.get("criadoPorAgente"):
                st.info(
                    "🤖 **Colaboração:** Esta minuta foi iniciada por um Agente de IA."
                )
            else:
                st.info("👤 **Colaboração:** Esta minuta foi iniciada por um Humano.")

            # Editor de conteúdo
            st.markdown("**Conteúdo da Minuta**")

            # Importar streamlit-quill
            try:
                from streamlit_quill import st_quill

                # Configuração da toolbar
                toolbar_config = [
                    ["bold", "italic", "underline", "strike"],
                    ["blockquote", "code-block"],
                    [{"header": 1}, {"header": 2}],
                    [{"list": "ordered"}, {"list": "bullet"}],
                    [{"script": "sub"}, {"script": "super"}],
                    [{"indent": "-1"}, {"indent": "+1"}],
                    [{"direction": "rtl"}],
                    [{"size": ["small", False, "large", "huge"]}],
                    [{"header": [1, 2, 3, 4, 5, 6, False]}],
                    [{"color": []}, {"background": []}],
                    [{"font": []}],
                    [{"align": []}],
                    ["clean"],
                ]

                conteudo = st_quill(
                    value=minuta.get("conteudo", ""),
                    html=True,
                    key="quill_editor",
                    toolbar=toolbar_config,
                    placeholder="Digite o conteúdo da minuta aqui...",
                )
            except ImportError:
                st.warning(
                    "⚠️ Biblioteca streamlit-quill não encontrada. Usando editor simples."
                )
                conteudo = st.text_area(
                    "Conteúdo",
                    value=minuta.get("conteudo", ""),
                    height=400,
                    key="edit_conteudo",
                    label_visibility="collapsed",
                )

            # Info sobre editor
            st.caption("💡 Editor WYSIWYG (Rich Text) ativado via streamlit-quill")

            # Contadores
            palavras = len(conteudo.split())
            caracteres = len(conteudo)
            st.caption(f"📊 {palavras} palavras • {caracteres} caracteres")

        with tab_preview:
            st.markdown("### Preview do Documento")
            st.divider()

            # Preview simples
            st.markdown(f"**{titulo}**")
            st.caption(f"Tipo: {tipo} | Status: {status}")
            st.divider()
            st.markdown(conteudo)

        with tab_ai:
            st.markdown("### 🤖 Comandos de IA")
            st.caption("Use a IA para gerar, melhorar ou formatar o texto da minuta.")

            # Importar comandos de IA
            try:
                import asyncio

                from lib.ai_commands import AIMinutaCommands

                # Inicializar IA (cacheado na sessão se possível, mas aqui instanciamos direto)
                ai_commands = AIMinutaCommands()

                # Área de resultado da IA
                if "ai_result" not in st.session_state:
                    st.session_state.ai_result = ""

                col_cmd1, col_cmd2 = st.columns(2)

                async def run_ai_command(command_type: str, text: str):
                    """Executa comando de IA com streaming"""
                    placeholder = st.empty()
                    full_response = ""

                    try:
                        if command_type == "continuar":
                            stream = ai_commands.continuar(text)
                        elif command_type == "expandir":
                            stream = ai_commands.expandir(text)
                        elif command_type == "revisar":
                            stream = ai_commands.revisar(text)
                        elif command_type == "formalizar":
                            stream = ai_commands.formalizar(text)
                        else:
                            return

                        async for chunk in stream:
                            full_response += chunk
                            placeholder.markdown(f"**Gerando...**\n\n{full_response}▌")

                        placeholder.markdown(f"**✅ Resultado:**\n\n{full_response}")
                        st.session_state.ai_result = full_response

                    except Exception as e:
                        st.error(f"Erro na IA: {str(e)}")

                with col_cmd1:
                    if st.button(
                        "⚡ Continuar Texto",
                        use_container_width=True,
                        help="Continua escrevendo a partir do final",
                    ):
                        if not conteudo:
                            st.warning(
                                "⚠️ O editor está vazio. Digite algo para continuar."
                            )
                        else:
                            asyncio.run(run_ai_command("continuar", conteudo))

                    if st.button(
                        "📝 Expandir Conteúdo",
                        use_container_width=True,
                        help="Desenvolve e detalha o texto",
                    ):
                        if not conteudo:
                            st.warning(MSG_EDITOR_VAZIO)
                        else:
                            asyncio.run(run_ai_command("expandir", conteudo))

                with col_cmd2:
                    if st.button(
                        "✨ Revisar Texto",
                        use_container_width=True,
                        help="Melhora gramática e coesão",
                    ):
                        if not conteudo:
                            st.warning(MSG_EDITOR_VAZIO)
                        else:
                            asyncio.run(run_ai_command("revisar", conteudo))

                    if st.button(
                        "🎩 Formalizar (Jurídico)",
                        use_container_width=True,
                        help="Reescreve em linguagem formal",
                    ):
                        if not conteudo:
                            st.warning(MSG_EDITOR_VAZIO)
                        else:
                            asyncio.run(run_ai_command("formalizar", conteudo))

                # Exibir resultado e botão de aplicar
                if st.session_state.ai_result:
                    st.divider()
                    st.markdown("#### 📋 Resultado da IA")
                    st.info(
                        "Copie o texto abaixo e cole no editor, ou use o botão para substituir tudo."
                    )
                    st.code(st.session_state.ai_result, language="html")

                    if st.button("📥 Substituir Conteúdo do Editor", type="primary"):
                        # Atualizar minuta no state
                        minuta["conteudo"] = st.session_state.ai_result
                        st.session_state.ai_result = ""  # Limpar resultado
                        st.success(
                            "Conteúdo atualizado! Vá para a aba 'Editor' para ver."
                        )
                        st.rerun()

            except ImportError:
                st.error("⚠️ Módulo lib.ai_commands não encontrado.")
            except Exception as e:
                st.error(f"⚠️ Erro ao carregar IA: {str(e)}")

        with tab_vars:
            st.markdown("### 🔧 Variáveis Dinâmicas")
            st.caption("Variáveis detectadas no texto (formato {{variavel}})")

            import re

            # Detectar variáveis
            variaveis = list(set(re.findall(r"\{\{(.*?)\}\}", conteudo)))

            if not variaveis:
                st.info("Nenhuma variável detectada no texto.")
            else:
                st.write(f"**{len(variaveis)} variáveis encontradas:**")

                # Simular preenchimento
                valores = {}
                for var in variaveis:
                    valores[var] = st.text_input(f"Valor para {var}", key=f"var_{var}")

                if st.button("👁️ Visualizar com Valores"):
                    texto_preenchido = conteudo
                    for var, val in valores.items():
                        if val:
                            texto_preenchido = texto_preenchido.replace(
                                f"{{{{{var}}}}}", val
                            )

                    st.markdown("#### Preview Preenchido")
                    st.markdown(texto_preenchido)

        with tab_gdocs:
            st.markdown("### 📄 Google Docs Integration")
            st.caption("Cole o link de um documento Google Docs para visualizar aqui.")

            gdoc_url = st.text_input(
                "URL do Google Docs",
                placeholder="https://docs.google.com/document/d/...",
            )

            if gdoc_url:
                if "docs.google.com" in gdoc_url:
                    st.components.v1.iframe(gdoc_url, height=600, scrolling=True)
                else:
                    st.error(
                        "URL inválida. Certifique-se de que é um link do Google Docs."
                    )
            else:
                st.info("Cole a URL acima para carregar o documento.")

        st.divider()

        # Aviso de alterações não salvas (Simples comparação)
        if minuta.get("conteudo") != conteudo:
            st.warning("⚠️ **Atenção:** Existem alterações não salvas no conteúdo!")

        # Botões de ação
        col_save, col_cancel, col_duplicate = st.columns(3)

        with col_save:
            if st.button("💾 Salvar", type="primary", use_container_width=True):
                # Validação
                if not titulo.strip():
                    st.error("❌ Título é obrigatório!")
                else:
                    # Atualizar dados
                    minuta_atualizada = minuta.copy()
                    minuta_atualizada["titulo"] = titulo
                    minuta_atualizada["tipo"] = tipo
                    minuta_atualizada["status"] = status
                    minuta_atualizada["conteudo"] = conteudo
                    minuta_atualizada["atualizadoEm"] = datetime.now().isoformat()

                    # Salvar
                    if salvar_minuta(minuta_atualizada):
                        st.success("✅ Minuta salva com sucesso!")
                        st.session_state.editing_minuta = None
                        st.session_state.refresh_trigger += 1
                        st.rerun()

        with col_cancel:
            if st.button("❌ Cancelar", use_container_width=True):
                st.session_state.editing_minuta = None
                st.rerun()

        with col_duplicate:
            if st.button("📋 Duplicar", use_container_width=True):
                minuta_duplicada = minuta.copy()
                minuta_duplicada["id"] = None  # Novo ID
                minuta_duplicada["titulo"] = f"Cópia de {minuta['titulo']}"
                minuta_duplicada["criadoEm"] = datetime.now().isoformat()
                minuta_duplicada["atualizadoEm"] = datetime.now().isoformat()

                st.session_state.editing_minuta = minuta_duplicada
                st.rerun()

    else:
        # Nenhuma minuta selecionada
        st.info("👈 Selecione uma minuta na lista ao lado ou crie uma nova")

        # Estatísticas
        st.divider()
        st.subheader("📊 Estatísticas")

        if minutas:
            # Métricas
            col_m1, col_m2, col_m3 = st.columns(3)

            with col_m1:
                st.metric("Total de Minutas", len(minutas))

            with col_m2:
                rascunhos = len([m for m in minutas if m.get("status") == "rascunho"])
                st.metric("Rascunhos", rascunhos)

            with col_m3:
                criadas_ia = len([m for m in minutas if m.get("criadoPorAgente")])
                st.metric("Criadas por IA", criadas_ia)

            # Gráfico de status
            import pandas as pd

            df_status = pd.DataFrame(
                [
                    {
                        "Status": s,
                        "Quantidade": len([m for m in minutas if m.get("status") == s]),
                    }
                    for s in STATUS_MINUTA
                ]
            )

            st.bar_chart(df_status.set_index("Status"))

# ===========================
# FOOTER
# ===========================

st.divider()
st.caption(
    "💡 **Dica:** Use os comandos de IA (próxima fase) para gerar, "
    "continuar e melhorar seus documentos automaticamente."
)
