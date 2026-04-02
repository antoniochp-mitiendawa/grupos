// ============================================
// MÓDULO: ACTUALIZAR AGENDA DESDE GOOGLE SHEETS
// ============================================

const { configNegocio, productosCache, ultimaActualizacionProductos } = require('../config');
const { guardarLogLocal } = require('../utils/logs');
const { consultarTodosLosGrupos } = require('../utils/sheets');
const { guardarAgendaLocal, recargarAgenda } = require('./guardar');
const { reprogramarTodosLosEnvios } = require('./programar');

// ============================================
// ACTUALIZAR AGENDA
// ============================================
async function actualizarAgenda(sock, url_sheets, origen = 'automático') {
    try {
        guardarLogLocal(`🔄 Actualizando agenda (${origen})...`);
        
        const data = await consultarTodosLosGrupos(url_sheets);
        
        if (!data) {
            guardarLogLocal('⚠️ No se pudo conectar con Google Sheets');
            return false;
        }
        
        if (data.error) {
            guardarLogLocal(`⚠️ Error en Sheets: ${data.error}`);
            return false;
        }
        
        if (data.config) {
            configNegocio = {
                RAZON_SOCIAL: data.config.RAZON_SOCIAL || '',
                HORARIO_ATENCION: data.config.HORARIO_ATENCION || '',
                UBICACION: data.config.UBICACION || '',
                TELEFONO_CONTACTO: data.config.TELEFONO_CONTACTO || '',
                EMAIL_CONTACTO: data.config.EMAIL_CONTACTO || '',
                SITIO_WEB: data.config.SITIO_WEB || '',
                MENSAJE_BIENVENIDA: data.config.MENSAJE_BIENVENIDA || ''
            };
            guardarLogLocal(`🏢 Configuración de negocio cargada: ${configNegocio.RAZON_SOCIAL || 'Sin nombre'}`);
        }
        
        if (guardarAgendaLocal(data)) {
            recargarAgenda();
            const total = data.grupos?.length || 0;
            const pestanas = data.pestanas?.length || 0;
            guardarLogLocal(`✅ Agenda actualizada: ${total} grupos en ${pestanas} pestañas`);
            
            if (data.productos && Array.isArray(data.productos)) {
                productosCache = data.productos;
                ultimaActualizacionProductos = Date.now();
                guardarLogLocal(`📦 Caché de productos actualizado desde Sheets: ${productosCache.length} productos`);
            }
            
            if (sock) {
                reprogramarTodosLosEnvios(sock);
            }
            
            return true;
        }
        return false;
    } catch (error) {
        guardarLogLocal(`❌ Error actualizando agenda: ${error.message}`);
        return false;
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = { actualizarAgenda };
