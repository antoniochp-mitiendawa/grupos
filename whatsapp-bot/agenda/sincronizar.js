// ============================================
// MÓDULO: SINCRONIZAR GRUPOS CON GOOGLE SHEETS
// ============================================

const axios = require('axios');
const { guardarLogLocal } = require('../utils/logs');
const { obtenerGruposDesdeStore } = require('../utils/grupos');

// ============================================
// SINCRONIZAR GRUPOS CON GOOGLE SHEETS
// ============================================
async function sincronizarGruposConSheets(sock, url_sheets) {
    try {
        guardarLogLocal('🔄 Iniciando sincronización automática de grupos...');
        
        const grupos = await obtenerGruposDesdeStore(sock, false);
        
        if (grupos.length === 0) {
            guardarLogLocal('⚠️ No hay grupos para sincronizar');
            return false;
        }
        
        const respuesta = await axios.post(url_sheets, {
            grupos: grupos
        });
        
        if (respuesta.data && respuesta.data.success) {
            guardarLogLocal(`✅ Sincronización automática completada: ${grupos.length} grupos`);
            return true;
        } else {
            guardarLogLocal(`⚠️ Error en sincronización: ${JSON.stringify(respuesta.data)}`);
            return false;
        }
        
    } catch (error) {
        guardarLogLocal(`❌ Error en sincronización automática: ${error.message}`);
        return false;
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = { sincronizarGruposConSheets };
