// ============================================
// MÓDULO: RESPUESTAS A CONSULTAS DE PRODUCTOS
// ============================================

const { CONFIG, productosCache } = require('../config');
const { obtenerTextoAleatorio } = require('./reacciones');

// ============================================
// CLASIFICAR CONSULTA DEL USUARIO
// ============================================
function clasificarConsulta(texto) {
    const textoLower = texto.toLowerCase();
    
    for (const palabra of CONFIG.palabras_clave_respondibles.precio) {
        if (textoLower.includes(palabra)) return 'precio';
    }
    
    for (const palabra of CONFIG.palabras_clave_respondibles.info) {
        if (textoLower.includes(palabra)) return 'descripcion';
    }
    
    for (const palabra of CONFIG.palabras_clave_respondibles.generica) {
        if (textoLower.includes(palabra)) return 'generica';
    }
    
    return 'no_respondible';
}

// ============================================
// OBTENER DATOS DEL PRODUCTO DESDE CACHÉ
// ============================================
function obtenerDatosProducto(nombreProducto) {
    if (!nombreProducto || productosCache.length === 0) return null;
    
    const producto = productosCache.find(p => 
        p.producto.toLowerCase() === nombreProducto.toLowerCase()
    );
    
    return producto;
}

// ============================================
// GENERAR RESPUESTA AUTOMÁTICA SEGÚN TIPO DE CONSULTA
// ============================================
function generarRespuestaAutomatica(tipoConsulta, nombreProducto, datosProducto) {
    if (!nombreProducto || !datosProducto) return null;
    
    const opcionesRespuesta = CONFIG.respuestas_consultas[tipoConsulta];
    if (!opcionesRespuesta || opcionesRespuesta.length === 0) return null;
    
    let respuesta = obtenerTextoAleatorio(opcionesRespuesta);
    
    let precioFormateado = datosProducto.precio || '';
    if (precioFormateado) {
        if (typeof precioFormateado === 'number') {
            precioFormateado = precioFormateado.toString();
        }
        if (!precioFormateado.includes('$') && !precioFormateado.includes('€') && !precioFormateado.includes('£')) {
            precioFormateado = '$' + precioFormateado;
        }
    } else {
        precioFormateado = '[PRECIO NO DISPONIBLE]';
    }
    
    respuesta = respuesta.replace('[PRODUCTO]', nombreProducto);
    respuesta = respuesta.replace('[DESCRIPCION]', datosProducto.descripcion || '');
    respuesta = respuesta.replace('[PRECIO]', precioFormateado);
    
    return respuesta;
}

// ============================================
// BUSCAR PRODUCTO EN EL TEXTO (SIN CITA)
// ============================================
function buscarProductoEnTexto(texto) {
    if (!texto || productosCache.length === 0) return null;
    
    const textoLower = texto.toLowerCase();
    
    for (const producto of productosCache) {
        if (textoLower.includes(producto.producto.toLowerCase())) {
            return producto.producto;
        }
    }
    
    return null;
}

// ============================================
// OBTENER PRODUCTO DESDE MENSAJE CITADO
// ============================================
async function obtenerProductoDesdeMensajeCitado(sock, mensaje) {
    try {
        const contextInfo = mensaje.message?.extendedTextMessage?.contextInfo || 
                           mensaje.message?.imageMessage?.contextInfo ||
                           mensaje.message?.videoMessage?.contextInfo;
        
        if (!contextInfo?.quotedMessage) return null;
        
        const quotedMsg = contextInfo.quotedMessage;
        let textoOriginal = '';
        
        if (quotedMsg.conversation) {
            textoOriginal = quotedMsg.conversation;
        } else if (quotedMsg.extendedTextMessage?.text) {
            textoOriginal = quotedMsg.extendedTextMessage.text;
        } else if (quotedMsg.imageMessage?.caption) {
            textoOriginal = quotedMsg.imageMessage.caption;
        } else if (quotedMsg.videoMessage?.caption) {
            textoOriginal = quotedMsg.videoMessage.caption;
        }
        
        const matches = [...textoOriginal.matchAll(/\*([^*]+)\*/g)];
        if (matches.length > 0) {
            const ultimo = matches[matches.length - 1];
            return ultimo[1].trim();
        }
        return null;
        
    } catch (error) {
        return null;
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    clasificarConsulta,
    obtenerDatosProducto,
    generarRespuestaAutomatica,
    buscarProductoEnTexto,
    obtenerProductoDesdeMensajeCitado
};
