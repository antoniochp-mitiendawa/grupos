// ============================================
// MÓDULO: OBTENER GRUPOS DE WHATSAPP
// ============================================

const { guardarLogLocal } = require('./logs');
const { store, groupCache } = require('../config');

// ============================================
// OBTENER METADATOS DE GRUPO CON CACHÉ
// ============================================
async function obtenerMetadataGrupoConCache(sock, groupId) {
    try {
        if (groupCache.has(groupId)) {
            const cached = groupCache.get(groupId);
            guardarLogLocal(`   📦 Usando nombre desde caché: ${cached.subject || 'Sin nombre'}`);
            return cached;
        }
        
        guardarLogLocal(`   🌐 Consultando a WhatsApp (puede tomar unos segundos): ${groupId}`);
        const metadata = await sock.groupMetadata(groupId);
        
        if (metadata) {
            groupCache.set(groupId, metadata);
            guardarLogLocal(`   ✅ Guardado en caché: ${metadata.subject || 'Sin nombre'}`);
        }
        
        return metadata;
    } catch (error) {
        guardarLogLocal(`   ❌ Error consultando grupo: ${error.message}`);
        
        if (error.message.includes('rate-overlimit')) {
            guardarLogLocal(`   ⚠️ Rate limit detectado. Se reintentará automáticamente en la próxima sincronización.`);
        }
        return null;
    }
}

// ============================================
// OBTENER GRUPOS CON ESPERA (eventos)
// ============================================
async function obtenerGruposConEspera(sock) {
    return new Promise((resolve) => {
        try {
            guardarLogLocal('⏳ Iniciando espera de 30 segundos para capturar TODOS los grupos...');
            const gruposIds = new Set();
            let timeoutCompletado = false;
            
            const manejarGroupsUpdate = (updates) => {
                if (timeoutCompletado) return;
                updates.forEach(update => {
                    if (update.id && update.id.endsWith('@g.us')) {
                        if (!gruposIds.has(update.id)) {
                            gruposIds.add(update.id);
                            guardarLogLocal(`   ➕ Grupo detectado por evento: ${update.id}`);
                        }
                    }
                });
            };
            
            sock.ev.on('groups.update', manejarGroupsUpdate);
            
            setTimeout(() => {
                timeoutCompletado = true;
                sock.ev.off('groups.update', manejarGroupsUpdate);
                guardarLogLocal(`✅ Espera completada. Se detectaron ${gruposIds.size} grupos por eventos.`);
                resolve(Array.from(gruposIds));
            }, 30000);
            
        } catch (error) {
            guardarLogLocal(`❌ Error en espera de grupos: ${error.message}`);
            resolve([]);
        }
    });
}

// ============================================
// CONSULTA MASIVA DE GRUPOS (UNA SOLA VEZ)
// ============================================
async function obtenerTodosLosGruposWhatsApp(sock) {
    try {
        guardarLogLocal('🔍 Ejecutando consulta MASIVA de grupos (UNA SOLA VEZ)...');
        if (typeof sock.groupFetchAllParticipatingGroups !== 'function') {
            guardarLogLocal('⚠️ Función no disponible, usando método alternativo');
            return null;
        }
        const gruposDict = await sock.groupFetchAllParticipatingGroups();
        if (!gruposDict || typeof gruposDict !== 'object') {
            guardarLogLocal('⚠️ No se obtuvieron grupos');
            return null;
        }
        const gruposArray = Object.entries(gruposDict).map(([id, info]) => ({ id: id, info: info }));
        guardarLogLocal(`✅ Consulta masiva exitosa: ${gruposArray.length} grupos obtenidos en UNA SOLA LLAMADA`);
        return gruposArray;
    } catch (error) {
        guardarLogLocal(`❌ Error en consulta masiva: ${error.message}`);
        return null;
    }
}

// ============================================
// OBTENER TODOS LOS GRUPOS DESDE STORE
// ============================================
async function obtenerGruposDesdeStore(sock, usarEspera = false) {
    try {
        guardarLogLocal('🔍 Obteniendo grupos...');
        const gruposMasivos = await obtenerTodosLosGruposWhatsApp(sock);
        
        if (gruposMasivos && gruposMasivos.length > 0) {
            guardarLogLocal(`   Procesando ${gruposMasivos.length} grupos desde consulta masiva...`);
            const listaGrupos = [];
            for (const grupo of gruposMasivos) {
                let nombreGrupo = 'Sin nombre';
                const info = grupo.info;
                if (info.name && info.name !== 'Sin nombre' && info.name.trim() !== '') {
                    nombreGrupo = info.name;
                }
                else if (info.subject && info.subject !== 'Sin nombre' && info.subject.trim() !== '') {
                    nombreGrupo = info.subject;
                }
                else if (info.metadata && info.metadata.subject) {
                    nombreGrupo = info.metadata.subject;
                }
                else if (info.metadata && info.metadata.name) {
                    nombreGrupo = info.metadata.name;
                }
                else if (info.title) {
                    nombreGrupo = info.title;
                }
                if (!groupCache.has(grupo.id)) {
                    groupCache.set(grupo.id, info);
                }
                listaGrupos.push({ id: grupo.id, nombre: nombreGrupo });
            }
            guardarLogLocal(`✅ ${listaGrupos.length} grupos procesados desde consulta masiva`);
            return listaGrupos;
        }
        
        guardarLogLocal('⚠️ Usando método alternativo (grupo por grupo)...');
        let gruposIdsAdicionales = [];
        if (usarEspera) {
            gruposIdsAdicionales = await obtenerGruposConEspera(sock);
        }
        
        if (!store || !store.chats) {
            guardarLogLocal('❌ Data Store no disponible');
            return [];
        }
        
        const todosLosChats = store.chats.all() || [];
        guardarLogLocal(`   Total de chats en store: ${todosLosChats.length}`);
        const grupos = todosLosChats.filter(chat => chat.id && chat.id.endsWith('@g.us'));
        guardarLogLocal(`   Chats del store filtrados como grupos: ${grupos.length}`);
        
        if (gruposIdsAdicionales.length > 0) {
            guardarLogLocal(`   Grupos adicionales por eventos: ${gruposIdsAdicionales.length}`);
        }
        
        const listaGrupos = [];
        const gruposProcesados = new Set();
        
        for (const chat of grupos) {
            let nombreGrupo = 'Sin nombre';
            let metadata = null;
            
            if (chat.name && chat.name !== 'Sin nombre' && chat.name.trim() !== '') {
                nombreGrupo = chat.name;
            }
            else if (chat.subject && chat.subject !== 'Sin nombre' && chat.subject.trim() !== '') {
                nombreGrupo = chat.subject;
            }
            else if (chat.metadata && chat.metadata.subject) {
                nombreGrupo = chat.metadata.subject;
            }
            else if (chat.metadata && chat.metadata.name) {
                nombreGrupo = chat.metadata.name;
            }
            else if (chat.title) {
                nombreGrupo = chat.title;
            }
            
            if (nombreGrupo === 'Sin nombre') {
                if (groupCache.has(chat.id)) {
                    metadata = groupCache.get(chat.id);
                    if (metadata && metadata.subject) {
                        nombreGrupo = metadata.subject;
                        guardarLogLocal(`   📦 Nombre obtenido del CACHÉ: ${nombreGrupo}`);
                    }
                }
            }
            
            if (nombreGrupo === 'Sin nombre' && sock) {
                guardarLogLocal(`   ⚠️ Grupo sin nombre, consultando a WhatsApp con CACHÉ: ${chat.id}`);
                metadata = await obtenerMetadataGrupoConCache(sock, chat.id);
                if (metadata && metadata.subject) {
                    nombreGrupo = metadata.subject;
                }
            }
            
            listaGrupos.push({ id: chat.id, nombre: nombreGrupo });
            gruposProcesados.add(chat.id);
        }
        
        for (const id of gruposIdsAdicionales) {
            if (!gruposProcesados.has(id) && sock) {
                guardarLogLocal(`   🔄 Procesando grupo adicional de evento: ${id}`);
                let nombreGrupo = 'Sin nombre';
                if (groupCache.has(id)) {
                    const metadata = groupCache.get(id);
                    if (metadata && metadata.subject) {
                        nombreGrupo = metadata.subject;
                        guardarLogLocal(`   📦 Nombre obtenido del CACHÉ (evento): ${nombreGrupo}`);
                    }
                }
                if (nombreGrupo === 'Sin nombre') {
                    const metadata = await obtenerMetadataGrupoConCache(sock, id);
                    if (metadata && metadata.subject) {
                        nombreGrupo = metadata.subject;
                    }
                }
                listaGrupos.push({ id: id, nombre: nombreGrupo });
            }
        }
        
        guardarLogLocal(`✅ Total de grupos procesados: ${listaGrupos.length}`);
        return listaGrupos;
        
    } catch (error) {
        guardarLogLocal(`❌ Error obteniendo grupos: ${error.message}`);
        return [];
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    obtenerMetadataGrupoConCache,
    obtenerGruposConEspera,
    obtenerTodosLosGruposWhatsApp,
    obtenerGruposDesdeStore
};
