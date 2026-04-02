// ============================================
// MÓDULO: RESPUESTAS A CONSULTAS DE NEGOCIO
// ============================================

const { CONFIG, configNegocio } = require('../config');

// ============================================
// CLASIFICAR CONSULTA DE NEGOCIO
// ============================================
function clasificarConsultaNegocio(texto) {
    const textoLower = texto.toLowerCase();
    
    for (const palabra of CONFIG.palabras_clave_negocio.horario) {
        if (textoLower.includes(palabra)) return 'horario';
    }
    
    for (const palabra of CONFIG.palabras_clave_negocio.domicilio) {
        if (textoLower.includes(palabra)) return 'domicilio';
    }
    
    for (const palabra of CONFIG.palabras_clave_negocio.telefono) {
        if (textoLower.includes(palabra)) return 'telefono';
    }
    
    return null;
}

// ============================================
// GENERAR RESPUESTA PARA CONSULTAS DE NEGOCIO
// ============================================
function generarRespuestaNegocio(tipoConsulta) {
    if (!configNegocio || Object.keys(configNegocio).length === 0) {
        return "Información de contacto no disponible. Por favor, intenta más tarde.";
    }
    
    switch(tipoConsulta) {
        case 'horario':
            return `🕒 *Nuestro horario de atención:*\n${configNegocio.HORARIO_ATENCION || 'No especificado'}`;
        case 'domicilio':
            return `📍 *Nuestra ubicación:*\n${configNegocio.UBICACION || 'No especificada'}`;
        case 'telefono':
            return `📞 *Teléfono de contacto:*\n${configNegocio.TELEFONO_CONTACTO || 'No especificado'}\n\n📱 *WhatsApp:*\nwa.me/${(configNegocio.TELEFONO_CONTACTO || '').replace(/[^0-9]/g, '')}`;
        default:
            return `🏢 *${configNegocio.RAZON_SOCIAL || 'Nuestro negocio'}*\n\n${configNegocio.MENSAJE_BIENVENIDA || 'Gracias por contactarnos'}`;
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    clasificarConsultaNegocio,
    generarRespuestaNegocio
};
