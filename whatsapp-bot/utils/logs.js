// ============================================
// MÓDULO: GUARDAR LOGS
// ============================================

const fs = require('fs');
const path = require('path');
const { CONFIG } = require('../config');

// ============================================
// GUARDAR LOG LOCAL (CON COLORES EN CONSOLA)
// ============================================
function guardarLogLocal(texto) {
    const fecha = new Date().toISOString().split('T')[0];
    const logFile = path.join(CONFIG.carpeta_logs, `${fecha}.log`);
    const hora = new Date().toLocaleTimeString();
    const linea = `[${hora}] ${texto}`;
    
    fs.appendFileSync(logFile, linea + '\n');
    
    if (texto.includes('📩 MENSAJE RECIBIDO')) {
        console.log('\x1b[32m%s\x1b[0m', `📩 ${texto}`);
    } else if (texto.includes('⚡ PRIORITARIO')) {
        console.log('\x1b[33m%s\x1b[0m', `⚡ ${texto}`);
    } else if (texto.includes('✅') || texto.includes('✔️')) {
        console.log('\x1b[36m%s\x1b[0m', `✅ ${texto}`);
    } else if (texto.includes('❌') || texto.includes('⚠️')) {
        console.log('\x1b[31m%s\x1b[0m', `❌ ${texto}`);
    } else {
        console.log(`📝 ${texto}`);
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = { guardarLogLocal };
