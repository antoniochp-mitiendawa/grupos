// ============================================
// MÓDULO: CONSULTAR GOOGLE SHEETS
// ============================================

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { CONFIG, productosCache, ultimaActualizacionProductos } = require('../config');
const { guardarLogLocal } = require('./logs');

// ============================================
// LEER URL DE GOOGLE SHEETS DESDE ARCHIVO
// ============================================
function leerURL() {
    try {
        let urlPath = CONFIG.archivo_url;
        if (!fs.existsSync(urlPath)) {
            urlPath = './url_sheets.txt';
        }
        const url = fs.readFileSync(urlPath, 'utf8').trim();
        console.log('✅ URL de Google Sheets cargada');
        return url;
    } catch (error) {
        console.error('❌ No se pudo leer la URL:', error.message);
        return null;
    }
}

// ============================================
// CONSULTAR TODOS LOS GRUPOS A GOOGLE SHEETS
// ============================================
async function consultarTodosLosGrupos(url) {
    try {
        console.log('🔄 Descargando TODOS los grupos desde Google Sheets...');
        const respuesta = await axios.get(url);
        const data = respuesta.data;
        
        if (data.config) {
            const delayStr = data.config.TIEMPO_ENTRE_MENSAJES;
            if (delayStr && typeof delayStr === 'string' && delayStr.includes('-')) {
                const partes = delayStr.split('-').map(p => parseInt(p.trim()));
                if (partes.length === 2 && !isNaN(partes[0]) && !isNaN(partes[1])) {
                    CONFIG.tiempo_entre_mensajes_min = partes[0];
                    CONFIG.tiempo_entre_mensajes_max = partes[1];
                    console.log(`⏱️  Delay configurado: ${CONFIG.tiempo_entre_mensajes_min}-${CONFIG.tiempo_entre_mensajes_max} segundos (formato min-max)`);
                } else {
                    console.log(`⚠️  Formato de delay inválido: ${delayStr}, usando valores por defecto`);
                }
            } else if (delayStr && !isNaN(parseInt(delayStr))) {
                const valor = parseInt(delayStr);
                CONFIG.tiempo_entre_mensajes_min = 1;
                CONFIG.tiempo_entre_mensajes_max = valor;
                console.log(`⏱️  Delay configurado: ${CONFIG.tiempo_entre_mensajes_min}-${CONFIG.tiempo_entre_mensajes_max} segundos (convertido desde valor único)`);
            }
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error al consultar Google Sheets:', error.message);
        return null;
    }
}

// ============================================
// ACTUALIZAR CACHÉ DE PRODUCTOS DESDE SHEETS
// ============================================
async function actualizarCacheProductos(url) {
    try {
        const ahora = Date.now();
        if (ahora - ultimaActualizacionProductos < 3600000 && productosCache.length > 0) {
            return productosCache;
        }
        
        const data = await consultarTodosLosGrupos(url);
        if (data && data.productos && Array.isArray(data.productos)) {
            productosCache = data.productos;
            ultimaActualizacionProductos = ahora;
            guardarLogLocal(`📦 Caché de productos actualizado: ${productosCache.length} productos`);
        }
        return productosCache;
        
    } catch (error) {
        guardarLogLocal(`❌ Error actualizando caché de productos: ${error.message}`);
        return productosCache;
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    leerURL,
    consultarTodosLosGrupos,
    actualizarCacheProductos
};
