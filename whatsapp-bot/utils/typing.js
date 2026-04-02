// ============================================
// MÓDULO: SIMULAR TYPING (QUE ESTÁ ESCRIBIENDO)
// ============================================

const { guardarLogLocal } = require('./logs');

// ============================================
// SIMULAR QUE ESTÁ ESCRIBIENDO
// ============================================
async function simularTyping(sock, id_destino, duracion) {
    try {
        // Limitar typing a máximo 5 segundos
        const duracionLimitada = Math.min(duracion, 5);
        await sock.sendPresenceUpdate('composing', id_destino);
        guardarLogLocal(`   ✍️ Typing por ${duracionLimitada} segundos...`);
        
        await new Promise(resolve => setTimeout(resolve, duracionLimitada * 1000));
        
        await sock.sendPresenceUpdate('paused', id_destino);
        await new Promise(resolve => setTimeout(resolve, 500));
        
    } catch (error) {
        guardarLogLocal(`   ⚠️ Error en typing: ${error.message}`);
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = { simularTyping };
