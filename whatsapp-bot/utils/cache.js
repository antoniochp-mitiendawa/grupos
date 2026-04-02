// ============================================
// MÓDULO: LIMPIAR CACHÉ DE IMÁGENES
// ============================================

const fs = require('fs');
const { imagenesUsadasEnLote } = require('../config');
const { guardarLogLocal } = require('./logs');

// ============================================
// LIMPIAR CACHÉ DE IMÁGENES USADAS EN EL LOTE
// ============================================
function limpiarCacheImagenes() {
    try {
        const cantidad = imagenesUsadasEnLote.size;
        if (cantidad === 0) return;
        
        guardarLogLocal(`🧹 Limpiando caché de imágenes (${cantidad} archivos)...`);
        
        for (const ruta of imagenesUsadasEnLote) {
            try {
                if (fs.existsSync(ruta)) {
                    fs.unlinkSync(ruta);
                }
            } catch (e) {}
        }
        
        imagenesUsadasEnLote.clear();
        guardarLogLocal('✅ Caché limpiado correctamente');
        
    } catch (error) {
        guardarLogLocal(`⚠️ Error limpiando caché: ${error.message}`);
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = { limpiarCacheImagenes };
