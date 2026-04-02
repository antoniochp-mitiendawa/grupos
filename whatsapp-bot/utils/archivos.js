// ============================================
// MÓDULO: BÚSQUEDA Y ENVÍO DE ARCHIVOS MULTIMEDIA
// ============================================

const fs = require('fs');
const path = require('path');
const { CONFIG } = require('../config');
const { guardarLogLocal } = require('./logs');

// ============================================
// OBTENER TIPO DE ARCHIVO POR EXTENSIÓN
// ============================================
function obtenerTipoArchivo(extension) {
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
        return 'imagen';
    }
    else if (['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(extension)) {
        return 'video';
    }
    else if (['.mp3', '.ogg', '.m4a', '.wav', '.aac', '.opus'].includes(extension)) {
        return 'audio';
    }
    else {
        return 'documento';
    }
}

// ============================================
// OBTENER TEXTO PERSONALIZADO POR TIPO DE ARCHIVO
// ============================================
function obtenerTextoPorTipo(tipo, nombreProducto) {
    let texto = CONFIG.textos_por_tipo[tipo] || '';
    return texto.replace('[PRODUCTO]', nombreProducto);
}

// ============================================
// BUSCAR TODOS LOS ARCHIVOS QUE COINCIDAN EXACTAMENTE CON UN NOMBRE
// ============================================
function buscarTodosLosArchivosMultimedia(nombreBase) {
    try {
        if (!nombreBase || nombreBase.trim() === '') {
            return [];
        }

        const nombreLimpio = nombreBase.trim().toLowerCase();
        guardarLogLocal(`   🔍 Buscando archivos que coincidan EXACTAMENTE con: "${nombreLimpio}"`);
        
        const archivosEncontrados = [];

        function buscarRecursivo(directorio) {
            try {
                const archivos = fs.readdirSync(directorio);
                
                for (const archivo of archivos) {
                    const rutaCompleta = path.join(directorio, archivo);
                    const estadistica = fs.statSync(rutaCompleta);
                    
                    if (estadistica.isDirectory()) {
                        buscarRecursivo(rutaCompleta);
                    } else {
                        const nombreSinExtension = path.parse(archivo).name.toLowerCase();
                        // COINCIDENCIA EXACTA, no includes
                        if (nombreSinExtension === nombreLimpio) {
                            archivosEncontrados.push({
                                ruta: rutaCompleta,
                                nombre: archivo,
                                nombreBase: path.parse(archivo).name,
                                extension: path.extname(archivo).toLowerCase()
                            });
                        }
                    }
                }
            } catch (error) {}
        }

        buscarRecursivo(CONFIG.carpeta_multimedia);
        
        const ordenPrioridad = {
            'imagen': 1,
            'video': 2,
            'audio': 3,
            'documento': 4
        };
        
        archivosEncontrados.sort((a, b) => {
            const tipoA = obtenerTipoArchivo(a.extension);
            const tipoB = obtenerTipoArchivo(b.extension);
            return (ordenPrioridad[tipoA] || 5) - (ordenPrioridad[tipoB] || 5);
        });
        
        guardarLogLocal(`   ✅ Encontrados ${archivosEncontrados.length} archivos para "${nombreLimpio}"`);
        archivosEncontrados.forEach((arch, idx) => {
            guardarLogLocal(`      ${idx+1}. ${arch.nombre} (${obtenerTipoArchivo(arch.extension)})`);
        });
        
        return archivosEncontrados;
        
    } catch (error) {
        guardarLogLocal(`   ⚠️ Error buscando archivos: ${error.message}`);
        return [];
    }
}

// ============================================
// ENVIAR MÚLTIPLES ARCHIVOS MULTIMEDIA
// ============================================
async function enviarMultiplesArchivos(sock, id_grupo, archivos, textoPrincipal, nombreProducto) {
    try {
        let tiempoTotalEnvio = 0;
        let primerArchivo = true;
        
        for (const archivo of archivos) {
            const tipo = obtenerTipoArchivo(archivo.extension);
            const buffer = fs.readFileSync(archivo.ruta);
            
            let textoEnvio = '';
            if (primerArchivo && tipo === 'imagen') {
                textoEnvio = textoPrincipal;
                guardarLogLocal(`   📝 Enviando texto principal con primera imagen`);
            } else {
                textoEnvio = obtenerTextoPorTipo(tipo, nombreProducto);
                guardarLogLocal(`   📝 Usando texto para ${tipo}: "${textoEnvio}"`);
            }
            
            const inicioEnvio = Date.now();
            
            if (tipo === 'imagen') {
                guardarLogLocal(`   🖼️ Enviando imagen: ${archivo.nombre}`);
                await sock.sendMessage(id_grupo, {
                    image: buffer,
                    caption: textoEnvio || ''
                });
            }
            else if (tipo === 'video') {
                guardarLogLocal(`   🎬 Enviando video: ${archivo.nombre}`);
                await sock.sendMessage(id_grupo, {
                    video: buffer,
                    caption: textoEnvio || ''
                });
            }
            else if (tipo === 'audio') {
                guardarLogLocal(`   🎵 Enviando audio: ${archivo.nombre}`);
                let mimetype = 'audio/mpeg';
                if (archivo.extension === '.ogg') mimetype = 'audio/ogg';
                if (archivo.extension === '.m4a') mimetype = 'audio/mp4';
                if (archivo.extension === '.wav') mimetype = 'audio/wav';
                
                await sock.sendMessage(id_grupo, {
                    audio: buffer,
                    mimetype: mimetype,
                    caption: textoEnvio || ''
                });
            }
            else {
                guardarLogLocal(`   📄 Enviando documento: ${archivo.nombre}`);
                await sock.sendMessage(id_grupo, {
                    document: buffer,
                    fileName: archivo.nombre,
                    mimetype: 'application/octet-stream',
                    caption: textoEnvio || ''
                });
            }
            
            const duracionEnvio = (Date.now() - inicioEnvio) / 1000;
            tiempoTotalEnvio += duracionEnvio;
            
            guardarLogLocal(`      ✅ Enviado (${duracionEnvio.toFixed(1)}s)`);
            
            if (archivos.indexOf(archivo) < archivos.length - 1) {
                guardarLogLocal(`   ⏱️ Esperando ${CONFIG.delay_entre_archivos}s antes del siguiente archivo...`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.delay_entre_archivos * 1000));
                tiempoTotalEnvio += CONFIG.delay_entre_archivos;
            }
            
            primerArchivo = false;
        }
        
        return tiempoTotalEnvio;
        
    } catch (error) {
        guardarLogLocal(`   ❌ Error enviando múltiples archivos: ${error.message}`);
        return 0;
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    obtenerTipoArchivo,
    obtenerTextoPorTipo,
    buscarTodosLosArchivosMultimedia,
    enviarMultiplesArchivos
};
