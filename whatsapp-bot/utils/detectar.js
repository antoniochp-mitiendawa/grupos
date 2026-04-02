// ============================================
// MÓDULO: DETECTAR MENCIONES Y RESPUESTAS
// ============================================

const { guardarLogLocal } = require('./logs');

// ============================================
// VERIFICAR SI EL BOT ES MENCIONADO
// ============================================
function botEsMencionado(mensaje, botId) {
    if (!mensaje || !botId) return false;
    
    const botIdNormalizado = botId.split(':')[0];
    
    const mentionedJid = mensaje?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (mentionedJid) {
        for (const jid of mentionedJid) {
            if (jid.split(':')[0] === botIdNormalizado) return true;
        }
    }
    
    const captionMentioned = mensaje?.imageMessage?.contextInfo?.mentionedJid ||
                            mensaje?.videoMessage?.contextInfo?.mentionedJid ||
                            mensaje?.documentMessage?.contextInfo?.mentionedJid;
    
    if (captionMentioned) {
        for (const jid of captionMentioned) {
            if (jid.split(':')[0] === botIdNormalizado) return true;
        }
    }
    
    return false;
}

// ============================================
// VERIFICAR SI ES RESPUESTA A UN MENSAJE DEL BOT
// ============================================
function esRespuestaABot(mensaje, botId) {
    try {
        const contextInfo = mensaje?.extendedTextMessage?.contextInfo || 
                           mensaje?.imageMessage?.contextInfo ||
                           mensaje?.videoMessage?.contextInfo;
        
        if (!contextInfo?.quotedMessage) return false;
        
        const botIdNormalizado = botId.split(':')[0];
        const participant = contextInfo.participant ? contextInfo.participant.split(':')[0] : null;
        const quotedParticipant = contextInfo.quotedParticipant ? contextInfo.quotedParticipant.split(':')[0] : null;
        
        return participant === botIdNormalizado || quotedParticipant === botIdNormalizado;
    } catch (error) {
        return false;
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    botEsMencionado,
    esRespuestaABot
};
