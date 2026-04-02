// ============================================
// MÓDULO: UTILIDADES VARIAS
// ============================================

const crypto = require('crypto');
const axios = require('axios');
const { CONFIG, imagenesUsadasEnLote } = require('../config');
const { guardarLogLocal } = require('./logs');

// ============================================
// GENERAR HASH DE URL
// ============================================
function generarHashURL(url) {
    return crypto.createHash('md5').update(url).digest('hex');
}

// ============================================
// OBTENER SOLO LA URL DE LA IMAGEN DEL PREVIEW
// ============================================
async function obtenerUrlImagenPreview(url) {
    try {
        guardarLogLocal(`   🔍 Buscando imagen para: ${url}`);
        
        const previewData = await getLinkPreview(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            followRedirects: 'follow'
        });
        
        if (previewData.images && previewData.images.length > 0) {
            const imagenUrl = previewData.images[0];
            guardarLogLocal(`   🖼️ URL de imagen encontrada: ${imagenUrl.substring(0, 50)}...`);
            return imagenUrl;
        }
        
        guardarLogLocal('   ⚠️ No se encontraron imágenes');
        return null;
        
    } catch (error) {
        guardarLogLocal(`   ⚠️ Error obteniendo URL de imagen: ${error.message}`);
        return null;
    }
}

// ============================================
// OBTENER IMAGEN CON CACHÉ LOCAL
// ============================================
async function obtenerImagenConCache(url) {
    try {
        const hash = generarHashURL(url);
        const rutaImagen = path.join(CONFIG.carpeta_cache, `${hash}.jpg`);
        
        if (fs.existsSync(rutaImagen)) {
            guardarLogLocal(`   🖼️ Imagen encontrada en caché local`);
            return fs.readFileSync(rutaImagen);
        }
        
        guardarLogLocal(`   ⬇️ Descargando imagen a caché local...`);
        
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const buffer = Buffer.from(response.data);
        fs.writeFileSync(rutaImagen, buffer);
        imagenesUsadasEnLote.add(rutaImagen);
        
        guardarLogLocal(`   ✅ Imagen guardada en caché: ${hash}.jpg`);
        return buffer;
        
    } catch (error) {
        guardarLogLocal(`   ⚠️ Error con imagen: ${error.message}`);
        return null;
    }
}

// ============================================
// OBTENER EMOJI INTELIGENTE
// ============================================
function obtenerEmojiInteligente(producto) {
    if (!producto) return '🎁';
    
    const texto = producto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (texto.includes('vaso') || texto.includes('taza') || texto.includes('botella') || 
        texto.includes('agua') || texto.includes('bebida') || texto.includes('cafe') || 
        texto.includes('café') || texto.includes('termo')) {
        return '🥤';
    }
    
    if (texto.includes('comida') || texto.includes('hamburguesa') || texto.includes('pizza') || 
        texto.includes('sandwich') || texto.includes('pan') || texto.includes('comer')) {
        return '🍔';
    }
    
    if (texto.includes('gorra') || texto.includes('sombrero') || texto.includes('camisa') || 
        texto.includes('camiseta') || texto.includes('pantalon') || texto.includes('vestido') ||
        texto.includes('ropa')) {
        return '👕';
    }
    
    if (texto.includes('telefono') || texto.includes('celular') || texto.includes('computadora') || 
        texto.includes('tablet') || texto.includes('cargador') || texto.includes('audifono') ||
        texto.includes('electronica')) {
        return '📱';
    }
    
    if (texto.includes('pelota') || texto.includes('deporte') || texto.includes('bicicleta') || 
        texto.includes('gimnasio') || texto.includes('ejercicio')) {
        return '⚽';
    }
    
    if (texto.includes('mueble') || texto.includes('silla') || texto.includes('mesa') || 
        texto.includes('cama') || texto.includes('decoracion')) {
        return '🏠';
    }
    
    return '🎁';
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    generarHashURL,
    obtenerUrlImagenPreview,
    obtenerImagenConCache,
    obtenerEmojiInteligente
};
