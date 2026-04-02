// ============================================
// MÓDULO: COMANDOS PRIORITARIOS (actualizar, listagrupos, status)
// ============================================

const { guardarLogLocal } = require('../utils/logs');
const { actualizarAgenda } = require('../agenda/actualizar'); // lo crearemos después
const { obtenerGruposDesdeStore } = require('../utils/grupos');
const { enviarGruposASheets, enviarCSVporWhatsApp } = require('../utils/sheets'); // lo crearemos después

let procesandoComandoPrioritario = false;

// ============================================
// PROCESAR COMANDOS PRIORITARIOS
// ============================================
async function procesarComandoPrioritario(sock, cmd, remitente, url_sheets) {
    try {
        procesandoComandoPrioritario = true;
        guardarLogLocal(`   ⚡ PRIORITARIO: Procesando comando "${cmd}" inmediatamente`);
        
        if (cmd === 'actualizar' || cmd === 'update') {
            guardarLogLocal(`   Procesando comando prioritario: actualizar`);
            const resultado = await actualizarAgenda(sock, url_sheets, 'remoto');
            if (resultado) {
                await sock.sendMessage(remitente, { text: '✅ Agenda actualizada correctamente' });
            } else {
                await sock.sendMessage(remitente, { text: '❌ Error al actualizar agenda' });
            }
        }
        else if (cmd === 'listagrupos' || cmd === 'grupos') {
            guardarLogLocal(`   Procesando comando prioritario: listagrupos`);
            
            await sock.sendMessage(remitente, { text: '🔄 Procesando lista de grupos (prioritario)...' });
            
            const grupos = await obtenerGruposDesdeStore(sock, true);
            
            if (grupos.length === 0) {
                await sock.sendMessage(remitente, { text: '❌ No se encontraron grupos.' });
                procesandoComandoPrioritario = false;
                return;
            }
            
            const sheetsResult = await enviarGruposASheets(sock, url_sheets, grupos);
            const csvResult = await enviarCSVporWhatsApp(sock, remitente, grupos);
            
            let confirmacion = '✅ *PROCESO COMPLETADO (PRIORITARIO)*\n\n';
            confirmacion += `📊 Total de grupos: ${grupos.length}\n`;
            confirmacion += sheetsResult ? '✅ Guardado en Google Sheets (LISTA_GRUPOS)\n' : '❌ Error en Google Sheets\n';
            confirmacion += csvResult ? '✅ CSV enviado por WhatsApp\n' : '❌ Error enviando CSV\n';
            confirmacion += `📚 Fuente: Consulta MASIVA (UNA SOLA LLAMADA)`;
            
            await sock.sendMessage(remitente, { text: confirmacion });
        }
        
        guardarLogLocal(`   ✅ Comando prioritario completado`);
        procesandoComandoPrioritario = false;
        
    } catch (error) {
        guardarLogLocal(`   ❌ Error en comando prioritario: ${error.message}`);
        procesandoComandoPrioritario = false;
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    procesandoComandoPrioritario,
    procesarComandoPrioritario
};
