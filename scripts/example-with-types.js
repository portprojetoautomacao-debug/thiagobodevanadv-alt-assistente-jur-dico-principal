// @ts-check
/**
 * Script de exemplo com type checking completo
 * Demonstra as melhores práticas para JavaScript com tipos
 */

/**
 * @typedef {Object} ProcessInfo
 * @property {string} id - ID único do processo
 * @property {string} numero - Número do processo
 * @property {Date} dataAbertura - Data de abertura
 * @property {'ativo'|'arquivado'|'suspenso'} status - Status do processo
 */

/**
 * Busca um processo por ID
 * @param {string} processId - ID do processo
 * @returns {Promise<ProcessInfo | null>}
 */
async function getProcess(processId) {
  // Implementação simulada
  return {
    id: processId,
    numero: "0001234-56.2024.8.02.0001",
    dataAbertura: new Date(),
    status: "ativo",
  };
}

/**
 * Valida número de processo
 * @param {string} numero
 * @returns {boolean}
 */
function isValidProcessNumber(numero) {
  const pattern = /^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$/;
  return pattern.test(numero);
}

// Exportar para uso em outros módulos
module.exports = {
  getProcess,
  isValidProcessNumber,
};
