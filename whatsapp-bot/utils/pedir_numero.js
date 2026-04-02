// ============================================
// MÓDULO: PEDIR NÚMERO DE TELÉFONO AL USUARIO
// ============================================

const readline = require('readline');

// ============================================
// PEDIR NÚMERO DE TELÉFONO PARA EMPAREJAMIENTO
// ============================================
function pedirNumeroSilencioso() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('📱 Introduce tu número (sin +): ', (numero) => {
            rl.close();
            resolve(numero.trim());
        });
    });
}

// ============================================
// EXPORTAR
// ============================================
module.exports = { pedirNumeroSilencioso };
