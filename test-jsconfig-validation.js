// @ts-check
/**
 * Arquivo de teste para validar jsconfig.json
 * Se o type checking estiver funcionando, você verá erros marcados abaixo
 */

// ❌ TESTE 1: Erro de tipo básico
const message = "Hello World";
message.toUppercase(); // Deve mostrar erro: 'toUppercase' não existe, sugerir 'toUpperCase'

// ❌ TESTE 2: Atribuição de tipo errado
/** @type {string} */
let name = "João";
name = 123; // Deve mostrar erro: Type 'number' is not assignable to type 'string'

// ❌ TESTE 3: Propriedade inexistente
const obj = { firstName: "Maria", lastName: "Silva" };
console.log(obj.fullName); // Deve mostrar erro: Property 'fullName' does not exist

// ❌ TESTE 4: Função com parâmetros errados
/**
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function sum(a, b) {
  return a + b;
}
sum("10", "20"); // Deve mostrar erro: Argument of type 'string' is not assignable

// ✅ TESTE 5: IntelliSense funcionando
const fs = require("fs");
fs// ✅ TESTE 6: Node.js types // Coloque o cursor aqui e pressione Ctrl+Space - deve mostrar todos os métodos
.process.console // Deve ter autocomplete para env, cwd, exit, etc.
  .log("✅ Se você vê erros marcados acima, o type checking está FUNCIONANDO!");
console.log("✅ Se Ctrl+Space mostra autocomplete, o IntelliSense está ATIVO!");
