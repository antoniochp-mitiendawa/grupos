// ============================================
// MÓDULO: ENVIAR MENSAJES (PROCESAMIENTO DE SPIN Y PRODUCTOS)
// ============================================

const { guardarLogLocal } = require('../utils/logs');
const { buscarArchivosPorProducto, enviarMultiplesArchivos } = require('../utils/archivos');

// ============================================
// EXTRAER NOMBRE DEL PRODUCTO DEL TEXTO
// ============================================
function extraerNombreProducto(texto) {
    if (!texto) return null;
    const matches = [...texto.matchAll(/\*([^*]+)\*/g)];
    if (matches.length > 0) {
        const ultimo = matches[matches.length - 1];
        return ultimo[1].trim();
    }
    return null;
}

// ============================================
// PROCESAR SPINTEX Y SPINEMOJI
// ============================================
function procesarSpinEnMensaje(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    
    let textoProcesado = texto;
    let modificado = false;
    
    const spinTexRegex = /\{spin\|(.*?)\}/gi;
    let match;
    
    while ((match = spinTexRegex.exec(texto)) !== null) {
        const contenido = match[1];
        const opciones = contenido.split('|').map(op => op.trim()).filter(op => op !== '');
        
        if (opciones.length > 0) {
            const opcionAleatoria = opciones[Math.floor(Math.random() * opciones.length)];
            textoProcesado = textoProcesado.replace(match[0], opcionAleatoria);
            modificado = true;
            guardarLogLocal(`   🎲 SpinTex: elegida "${opcionAleatoria}" de [${opciones.join(', ')}]`);
        }
    }
    
    const spinEmojiRegex = /\{([^}]+)\}/g;
    
    while ((match = spinEmojiRegex.exec(texto)) !== null) {
        if (match[0].startsWith('{spin|')) continue;
        
        const contenido = match[1];
        const opciones = contenido.split('|').map(op => op.trim()).filter(op => op !== '');
        
        if (opciones.length > 0) {
            const opcionAleatoria = opciones[Math.floor(Math.random() * opciones.length)];
            textoProcesado = textoProcesado.replace(match[0], opcionAleatoria);
            modificado = true;
            guardarLogLocal(`   🎲 SpinEmoji: elegido "${opcionAleatoria}" de [${opciones.join(', ')}]`);
        }
    }
    
    if (modificado) {
        guardarLogLocal(`   📝 Mensaje después de spin: "${textoProcesado}"`);
    }
    
    return textoProcesado;
}

// ============================================
// ENVIAR MENSAJE (CON MÚLTIPLES ARCHIVOS)
// ============================================
async function enviarMensaje(sock, id_grupo, mensajeOriginal) {
    try {
        if (!id_grupo || !id_grupo.includes('@g.us')) {
            return { resultado: 'ERROR: ID inválido', tiempo: 0 };
        }
        
        const inicioEnvio = Date.now();
        
        const mensajeProcesado = procesarSpinEnMensaje(mensajeOriginal);
        const mensajeFinal = String(mensajeProcesado);
        const nombreProducto = extraerNombreProducto(mensajeFinal);
        
        if (nombreProducto) {
            guardarLogLocal(`   🔍 Producto detectado en mensaje: "${nombreProducto}"`);
            const archivos = buscarArchivosPorProducto(nombreProducto);
            
            if (archivos.length > 0) {
                guardarLogLocal(`   📦 Encontrados ${archivos.length} archivos para enviar`);
                const textoLimpio = mensajeFinal.replace(/\([^)]+\)/g, '').trim();
                const tiempoEnvio = await enviarMultiplesArchivos(sock, id_grupo, archivos, textoLimpio, nombreProducto);
                
                return {
                    resultado: `MÚLTIPLES ARCHIVOS (${archivos.length})`,
                    tiempo: (Date.now() - inicioEnvio) / 1000
                };
            } else {
                guardarLogLocal(`   ⚠️ No se encontraron archivos para "${nombreProducto}"`);
            }
        }
        
        await sock.sendMessage(id_grupo, { text: mensajeFinal });
        return {
            resultado: 'TEXTO ENVIADO',
            tiempo: (Date.now() - inicioEnvio) / 1000
        };
        
    } catch (error) {
        guardarLogLocal(`   ❌ Error en envío: ${error.message}`);
        return {
            resultado: 'ERROR: ' + error.message.substring(0, 50),
            tiempo: 0
        };
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    extraerNombreProducto,
    procesarSpinEnMensaje,
    enviarMensaje
};
