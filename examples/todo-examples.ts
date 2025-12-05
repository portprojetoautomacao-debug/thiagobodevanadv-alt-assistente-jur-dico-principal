/**
 * Exemplos de TODOs - Triggers Padrão
 * Este arquivo demonstra o uso dos 72 triggers disponíveis
 */

// ============================================
// CATEGORIA 1: PADRÃO (8 triggers)
// ============================================

// TODO: Implementar autenticação de dois fatores
export function loginUser(email: string, password: string) {
  // FIXME: Validação de email não está funcionando corretamente
  const isValid = validateEmail(email);

  // ISSUE: Senha sendo armazenada em texto plano
  const user = { email, password };

  // HACK: Workaround temporário para bug do IE11
  if (navigator.userAgent.includes("MSIE")) {
    return legacyLogin(user);
  }

  return user;
}

// ============================================
// CATEGORIA 2: PORTUGUÊS (14 triggers)
// ============================================

// PENDENTE: Adicionar testes unitários para esta função
export function calculateTotal(items: any[]) {
  // REVISAR: Lógica de desconto pode estar incorreta
  let total = 0;

  items.forEach((item) => {
    // CORRIGIR: Não está tratando valores nulos
    total += item.price * item.quantity;

    // VERIFICAR: Desconto sendo aplicado duas vezes
    if (item.discount) {
      total -= item.discount;
    }
  });

  // ATENÇÃO: Cálculo de impostos pode estar desatualizado
  const tax = total * 0.15;

  // URGENTE: Implementar limite de desconto antes do lançamento
  return total + tax;
}

// BUG: Função retorna undefined em alguns casos
export function getUserData(userId: string) {
  // ATENCAO: Falta validação de permissões
  return fetchUserFromDB(userId);
}

// ============================================
// CATEGORIA 3: JURÍDICO (14 triggers)
// ============================================

// JURIDICO: Verificar base legal para processamento de dados
export function processUserData(data: any) {
  // LGPD: Adicionar consentimento explícito antes de processar
  const consent = data.hasConsent;

  if (!consent) {
    // COMPLIANCE: Implementar processo de solicitação de consentimento
    throw new Error("Consentimento necessário");
  }

  // PRAZO: Responder solicitação do titular em até 15 dias
  const request = data.dataRequest;

  // INTIMACAO: Verificar prazos de resposta a autoridades
  if (data.authorityRequest) {
    // VALIDAR: Confirmar identidade do solicitante
    validateIdentity(data.requesterId);
  }

  // SEGURANCA: Criptografar dados sensíveis antes de armazenar
  return encryptData(data);
}

// ============================================
// CATEGORIA 4: TÉCNICOS AVANÇADOS (36 triggers)
// ============================================

// REFACTOR: Migrar para nova API REST
export function legacyApiCall(endpoint: string) {
  // DEPRECATED: Esta função será removida na v2.0
  console.warn("Use newApiCall() instead");

  // OPTIMIZE: Implementar cache para reduzir chamadas
  return fetch(`/api/v1/${endpoint}`);
}

// BREAKING: API antiga não suporta async/await
export function syncOperation() {
  // PERFORMANCE: Query N+1 detectado - otimizar
  const users = getAllUsers();

  users.forEach((user) => {
    // OPTIMIZE: Buscar permissões em lote ao invés de loop
    const permissions = getPermissions(user.id);
  });
}

// ACCESSIBILITY: Adicionar aria-labels em todos os botões
export function renderButton(label: string) {
  // A11Y: Implementar navegação por teclado
  return `<button>${label}</button>`;
}

// SECURITY: Implementar rate limiting neste endpoint
export function publicEndpoint(req: any) {
  // CRITICAL: Validação de entrada ausente - permite SQL injection
  const query = req.body.query;

  // WARNING: Dados sensíveis sendo logados
  console.log("User data:", req.user);

  return executeQuery(query);
}

// TEST: Adicionar testes de integração
export function complexCalculation(a: number, b: number) {
  // NOTE: Implementação baseada no algoritmo X
  const result = (a * b) / 2;

  // IDEA: Considerar usar memoization para performance
  return result;
}

// DOCS: Documentar parâmetros e retorno desta função
export function processPayment(amount: number, method: string) {
  // DOC: Adicionar exemplos de uso na documentação
  if (amount <= 0) {
    throw new Error("Valor inválido");
  }

  // ENHANCEMENT: Adicionar suporte para múltiplas moedas
  return { amount, method, currency: "BRL" };
}

// FEATURE: Implementar webhook para notificações
export function sendNotification(userId: string, message: string) {
  // QUESTION: Devemos permitir notificações silenciosas?
  const notification = { userId, message };

  // REVIEW: Validar se usuário optou por receber notificações
  return saveNotification(notification);
}

// DEBT: Código duplicado em 3 lugares - consolidar
export function duplicatedLogic() {
  // CLEANUP: Remover console.logs de debug
  console.log("Debug info");

  // WARNING: Função muito longa - considerar quebrar em funções menores
  return performOperation();
}

// Helper functions (stubs)
function validateEmail(email: string): boolean {
  return true;
}
function legacyLogin(user: any): any {
  return user;
}
function fetchUserFromDB(userId: string): any {
  return {};
}
function validateIdentity(id: string): boolean {
  return true;
}
function encryptData(data: any): any {
  return data;
}
function getAllUsers(): any[] {
  return [];
}
function getPermissions(userId: string): any[] {
  return [];
}
function executeQuery(query: string): any {
  return {};
}
function saveNotification(notification: any): any {
  return {};
}
function performOperation(): any {
  return {};
}
