// ============================================
// MÓDULO: PROCESAR REACCIONES A MENSAJES (EMOJIS)
// ============================================

const { CONFIG, store } = require('../config');
const { guardarLogLocal } = require('../utils/logs');
const { simularTyping } = require('../utils/typing');
const { extraerNombreProducto } = require('../agenda/enviar');

// ============================================
// OBTENER TEXTO ALEATORIO DE UN ARRAY
// ============================================
function obtenerTextoAleatorio(arrayTextos) {
    if (!arrayTextos || arrayTextos.length === 0) return '';
    const indice = Math.floor(Math.random() * arrayTextos.length);
    return arrayTextos[indice];
}

// ============================================
// EXTRAER TEXTO DE CUALQUIER TIPO DE MENSAJE
// ============================================
function extraerTextoDeMensaje(mensaje) {
    if (!mensaje) return '';
    if (mensaje.conversation) return mensaje.conversation;
    if (mensaje.extendedTextMessage?.text) return mensaje.extendedTextMessage.text;
    if (mensaje.imageMessage?.caption) return mensaje.imageMessage.caption;
    if (mensaje.videoMessage?.caption) return mensaje.videoMessage.caption;
    if (mensaje.documentMessage?.caption) return mensaje.documentMessage.caption;
    if (mensaje.audioMessage?.caption) return mensaje.audioMessage?.caption || '';
    return '';
}

// ============================================
// PROCESAR REACCIÓN A MENSAJE (👍❤️😮🙏😂)
// ============================================
async function procesarReaccion(sock, mensaje) {
    try {
        if (!mensaje.message?.reactionMessage) return false;
        
        const reaccion = mensaje.message.reactionMessage;
        const emoji = reaccion.text;
        const keyOriginal = reaccion.key;
        const usuarioId = mensaje.key.participant || mensaje.key.remoteJid;
        
        if (!keyOriginal?.fromMe) return false;
        
        const respuestasReaccion = CONFIG.respuestas_reacciones[emoji];
        if (!respuestasReaccion) return false;
        
        let textoOriginal = '';
        try {
            const mensajeOriginal = await store.loadMessage(keyOriginal.remoteJid, keyOriginal.id);
            if (mensajeOriginal) {
                textoOriginal = extraerTextoDeMensaje(mensajeOriginal.message);
            }
        } catch (e) {}
        
        const nombreProducto = extraerNombreProducto(textoOriginal) || 'producto';
        
        let respuesta = obtenerTextoAleatorio(respuestasReaccion);
        respuesta = respuesta.replace('[PRODUCTO]', nombreProducto);
        
        const mensajeConMencion = `@${usuarioId.split('@')[0]} ${respuesta}`;
        
        const delayTyping = Math.floor(Math.random() * (CONFIG.delay_respuesta_max - CONFIG.delay_respuesta_min + 1) + CONFIG.delay_respuesta_min);
        await simularTyping(sock, keyOriginal.remoteJid, delayTyping);
        
        await sock.sendMessage(keyOriginal.remoteJid, { 
            text: mensajeConMencion,
            mentions: [usuarioId]
        });
        guardarLogLocal(`   ✅ Respuesta a reacción ${emoji} para producto: ${nombreProducto} (con mención a @${usuarioId.split('@')[0]})`);
        
        return true;
    } catch (error) {
        guardarLogLocal(`   ❌ Error procesando reacción: ${error.message}`);
        return false;
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    obtenerTextoAleatorio,
    extraerTextoDeMensaje,
    procesarReaccion
};
