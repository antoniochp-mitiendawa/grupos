// ============================================
// MÓDULO: ALERTAS AL ADMIN Y ENLACES WA.ME
// ============================================

const { guardarLogLocal } = require('./logs');

// ============================================
// GENERAR ENLACE WA.ME PARA RESPUESTA RÁPIDA
// ============================================
function generarEnlaceWaMe(numeroCliente, nombreProducto, preguntaCliente) {
    const numeroLimpio = numeroCliente.split('@')[0].replace(/[^0-9]/g, '');
    const textoRespuesta = `Hola, sobre *${nombreProducto}*: ${preguntaCliente}`;
    const textoCodificado = encodeURIComponent(textoRespuesta);
    return `wa.me/${numeroLimpio}?text=${textoCodificado}`;
}

// ============================================
// ENVIAR ALERTA AL ADMIN
// ============================================
async function enviarAlertaAdmin(sock, remitenteAdmin, datosAlerta) {
    try {
        const mensajeAlerta = `━━━━━━━━━━━━━━━━━━━━━━
🔔 CONSULTA PENDIENTE

📦 PRODUCTO: *${datosAlerta.producto}*
👤 CLIENTE: ${datosAlerta.clienteNombre} (${datosAlerta.clienteNumero})
💬 PREGUNTA: "${datosAlerta.pregunta}"
📍 LUGAR: ${datosAlerta.lugar}
⏱️ Hace ${datosAlerta.tiempo}

👉 RESPUESTA RÁPIDA:
${datosAlerta.enlace}

━━━━━━━━━━━━━━━━━━━━━━`;

        await sock.sendMessage(remitenteAdmin, { text: mensajeAlerta });
        guardarLogLocal(`   ✅ Alerta enviada al admin para producto: ${datosAlerta.producto}`);
        return true;
    } catch (error) {
        guardarLogLocal(`   ❌ Error enviando alerta al admin: ${error.message}`);
        return false;
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    generarEnlaceWaMe,
    enviarAlertaAdmin
};
