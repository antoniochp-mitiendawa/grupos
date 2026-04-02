// ============================================
// BOT DE WHATSAPP PARA TERMUX - VERSIÓN MODULAR 1.1
// ARCHIVO PRINCIPAL (ORQUESTADOR) CON WAKE LOCK
// ============================================

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const pino = require('pino');
const { execSync } = require('child_process');

// ============================================
// ACTIVAR WAKE LOCK (evita que Termux se duerma)
// ============================================
try {
    execSync('termux-wake-lock', { stdio: 'ignore' });
    console.log('🔋 Wake lock activado (el bot no se dormirá con la pantalla apagada)');
} catch (error) {
    console.log('⚠️ No se pudo activar wake lock');
    console.log('   Instala termux-api con: pkg install termux-api');
    console.log('   Luego reinicia el bot\n');
}

// ============================================
// IMPORTAR MÓDULOS
// ============================================
const { CONFIG, store, groupCache, imagenesUsadasEnLote, mensajesEnProcesamiento } = require('./config');
const { guardarLogLocal } = require('./utils/logs');
const { leerURL, actualizarCacheProductos } = require('./utils/sheets');
const { simularTyping } = require('./utils/typing');
const { botEsMencionado, esRespuestaABot } = require('./utils/detectar');
const { procesarReaccion, extraerTextoDeMensaje } = require('./respuestas/reacciones');
const { clasificarConsultaNegocio, generarRespuestaNegocio } = require('./respuestas/negocio');
const { clasificarConsulta, obtenerDatosProducto, generarRespuestaAutomatica, buscarProductoEnTexto, obtenerProductoDesdeMensajeCitado } = require('./respuestas/consultas');
const { actualizarAgenda } = require('./agenda/actualizar');
const { cargarAgendaLocal, recargarAgenda } = require('./agenda/guardar');
const { reprogramarTodosLosEnvios } = require('./agenda/programar');
const { sincronizarGruposConSheets } = require('./agenda/sincronizar');
const { limpiarStoreAntiguo } = require('./agenda/limpieza');
const { procesarComandoPrioritario, procesandoComandoPrioritario } = require('./comandos/prioridad');
const { enviarAlertaAdmin, generarEnlaceWaMe } = require('./utils/alertas');
const { pedirNumeroSilencioso } = require('./utils/pedir_numero');

// ============================================
// CREAR CARPETAS NECESARIAS
// ============================================
if (!fs.existsSync(CONFIG.carpeta_logs)) fs.mkdirSync(CONFIG.carpeta_logs);
if (!fs.existsSync(CONFIG.carpeta_sesion)) fs.mkdirSync(CONFIG.carpeta_sesion);
if (!fs.existsSync(CONFIG.carpeta_cache)) fs.mkdirSync(CONFIG.carpeta_cache);
if (!fs.existsSync(CONFIG.carpeta_multimedia)) {
    try {
        fs.mkdirSync(CONFIG.carpeta_multimedia, { recursive: true });
        console.log('📁 Carpeta multimedia (raíz del teléfono):', CONFIG.carpeta_multimedia);
    } catch (error) {
        console.error('❌ Error creando referencia a carpeta multimedia:', error.message);
    }
}

// ============================================
// INICIALIZAR DATA STORE
// ============================================
console.log('📚 Inicializando Data Store...');
if (fs.existsSync(CONFIG.archivo_store)) {
    store.readFromFile(CONFIG.archivo_store);
    console.log('📚 Data Store cargado desde archivo.');
}
setInterval(() => store.writeToFile(CONFIG.archivo_store), 10000);

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function iniciarWhatsApp() {
    console.log('====================================');
    console.log('🤖 BOT WHATSAPP - VERSIÓN MODULAR 1.1');
    console.log('====================================\n');
    console.log('⏰ Actualización de agenda: 6:00 AM');
    console.log('✍️  Typing adaptativo activado (máx 5 segundos)');
    console.log('📁 Carpeta de archivos: ' + CONFIG.carpeta_multimedia);
    console.log('🏢 RESPUESTAS DE NEGOCIO: Horario, Domicilio, Teléfono\n');

    const url_sheets = leerURL();
    if (!url_sheets) {
        console.log('❌ No hay URL');
        return;
    }

    try {
        await actualizarCacheProductos(url_sheets);
        
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`📦 Baileys versión: ${version.join('.')} ${isLatest ? '(última)' : ''}`);
        
        const logger = pino({ level: 'silent' });
        const { state, saveCreds } = await useMultiFileAuthState(CONFIG.carpeta_sesion);
        const existeSesion = fs.existsSync(path.join(CONFIG.carpeta_sesion, 'creds.json'));
        
        let browserConfig;
        if (!existeSesion) {
            browserConfig = ["Ubuntu", "Chrome", "20.0.04"];
            console.log('🌐 Browser: Ubuntu/Chrome (primera vez)');
        } else {
            browserConfig = Browsers.macOS("Desktop");
            console.log('🌐 Browser: macOS/Desktop (sesión existente)');
        }

        const sock = makeWASocket({
            version,
            auth: state,
            logger: logger,
            printQRInTerminal: false,
            browser: browserConfig,
            syncFullHistory: false,
            markOnlineOnConnect: true,
            defaultQueryTimeoutMs: 60000,
            shouldSyncHistoryMessage: () => false,
            generateHighQualityLinkPreview: true,
            cachedGroupMetadata: async (jid) => groupCache.get(jid),
            keepAliveIntervalMs: 25000
        });

        store.bind(sock.ev);

        sock.ev.on('groups.update', async (updates) => {
            for (const update of updates) {
                try {
                    const metadata = await sock.groupMetadata(update.id);
                    groupCache.set(update.id, metadata);
                } catch (e) {}
            }
        });

        sock.ev.on('group-participants.update', async (update) => {
            try {
                const metadata = await sock.groupMetadata(update.id);
                groupCache.set(update.id, metadata);
            } catch (e) {}
        });

        if (!sock.authState.creds.registered) {
            console.log('📱 PRIMERA CONFIGURACIÓN\n');
            const numero = await pedirNumeroSilencioso();
            console.log(`\n🔄 Solicitando código...`);
            setTimeout(async () => {
                try {
                    const codigo = await sock.requestPairingCode(numero);
                    console.log('\n====================================');
                    console.log('🔐 CÓDIGO:', codigo);
                    console.log('====================================');
                    console.log('1. Abre WhatsApp');
                    console.log('2. 3 puntos → Dispositivos vinculados');
                    console.log('3. Vincular con número');
                    console.log('4. Ingresa el código\n');
                } catch (error) {
                    console.log('❌ Error al generar código');
                }
            }, 2000);
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                console.log('\n✅ CONECTADO A WHATSAPP\n');
                guardarLogLocal('CONEXIÓN EXITOSA');
                limpiarStoreAntiguo();
                
                const agenda = cargarAgendaLocal();
                if (agenda.grupos.length === 0) {
                    guardarLogLocal('📥 Primera ejecución - descargando agenda completa...');
                    await actualizarAgenda(sock, url_sheets, 'primera vez');
                }
                
                await actualizarCacheProductos(url_sheets);
                guardarLogLocal('🔄 Ejecutando sincronización inicial de grupos...');
                await sincronizarGruposConSheets(sock, url_sheets);
                reprogramarTodosLosEnvios(sock);
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output.statusCode : 500;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    guardarLogLocal('🔄 Reconectando...');
                    setTimeout(() => iniciarWhatsApp(), 5000);
                } else {
                    guardarLogLocal('🚫 Sesión cerrada. Borra carpeta sesion_whatsapp');
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        cron.schedule('0 3 * * *', async () => {
            guardarLogLocal('⏰ Ejecutando limpieza programada del Data Store (3 AM)');
            limpiarStoreAntiguo();
        });

        cron.schedule('0 6 * * *', async () => {
            if (procesandoComandoPrioritario) {
                guardarLogLocal('⏰ Actualización de 6am pospuesta');
                return;
            }
            guardarLogLocal('⏰ ACTUALIZACIÓN AUTOMÁTICA DE AGENDA (6:00 AM)');
            await actualizarAgenda(sock, url_sheets, 'automático 6am');
        });

        // ============================================
        // EVENTO DE MENSAJES
        // ============================================
        sock.ev.on('messages.upsert', async (m) => {
            const mensaje = m.messages[0];
            if (!mensaje.key || mensaje.key.fromMe || !mensaje.message) return;

            const remitente = mensaje.key.remoteJid;
            if (remitente === 'status@broadcast') return;
            
            const esGrupo = remitente.includes('@g.us');
            const mensajeId = mensaje.key.id;
            const usuarioId = mensaje.key.participant || remitente;

            // Verificar duplicados
            if (mensajesEnProcesamiento.has(mensajeId)) {
                guardarLogLocal(`   ⏭️ Mensaje ${mensajeId} ya en procesamiento`);
                return;
            }
            mensajesEnProcesamiento.add(mensajeId);
            setTimeout(() => mensajesEnProcesamiento.delete(mensajeId), 30000);

            // Reacciones
            if (mensaje.message?.reactionMessage) {
                setImmediate(() => procesarReaccion(sock, mensaje));
                return;
            }

            // Verificar si debemos procesar
            let debeProcesar = false;
            if (esGrupo) {
                const esMencion = botEsMencionado(mensaje.message, sock.user.id);
                const esRespuesta = esRespuestaABot(mensaje, sock.user.id);
                if (esMencion || esRespuesta) debeProcesar = true;
            } else {
                debeProcesar = true;
            }
            if (!debeProcesar) return;

            const texto = extraerTextoDeMensaje(mensaje.message);
            if (!texto || texto.trim() === '') return;

            console.log('\n═══════════════════════════════════════════════');
            console.log(`📩 MENSAJE RECIBIDO de ${remitente.split('@')[0]}: "${texto.substring(0, 50)}${texto.length > 50 ? '...' : ''}"`);
            console.log('═══════════════════════════════════════════════\n');
            guardarLogLocal(`📩 Mensaje de ${remitente.split('@')[0]}: "${texto.substring(0, 100)}"`);

            // Comandos prioritarios (solo privado)
            if (!esGrupo) {
                const cmd = texto.toLowerCase().trim();
                if (cmd === 'actualizar' || cmd === 'update' || cmd === 'listagrupos' || cmd === 'grupos') {
                    setImmediate(() => procesarComandoPrioritario(sock, cmd, remitente, url_sheets));
                    return;
                }
                if (cmd === 'status' || cmd === 'estado') {
                    setImmediate(async () => {
                        const agenda = cargarAgendaLocal();
                        const total = agenda.grupos?.length || 0;
                        const pestanas = Object.keys(agenda.pestanas || {}).length;
                        const activos = agenda.grupos?.filter(g => g.activo === 'SI').length || 0;
                        const horarios = new Set();
                        if (agenda.pestanas) {
                            Object.values(agenda.pestanas).forEach(p => {
                                if (p.horario) horarios.add(p.horario);
                            });
                        }
                        let mensaje = `📊 *ESTADO DEL BOT*\n\n` +
                                      `📅 Última actualización: ${agenda.ultima_actualizacion || 'N/A'}\n` +
                                      `📋 Grupos totales: ${total}\n` +
                                      `✅ Grupos activos: ${activos}\n` +
                                      `📌 Pestañas: ${pestanas}\n` +
                                      `⏱️ Horarios: ${Array.from(horarios).join(', ') || 'Ninguno'}\n` +
                                      `🏢 Config negocio: ${configNegocio.RAZON_SOCIAL || 'No configurado'}`;
                        await sock.sendMessage(remitente, { text: mensaje });
                    });
                    return;
                }
            }

            // Consulta de negocio
            const tipoNegocio = clasificarConsultaNegocio(texto);
            if (tipoNegocio) {
                const respuestaNegocio = generarRespuestaNegocio(tipoNegocio);
                const mensajeConMencion = `@${usuarioId.split('@')[0]} ${respuestaNegocio}`;
                const delayTyping = Math.floor(Math.random() * (CONFIG.delay_respuesta_max - CONFIG.delay_respuesta_min + 1) + CONFIG.delay_respuesta_min);
                await simularTyping(sock, remitente, delayTyping);
                await sock.sendMessage(remitente, { text: mensajeConMencion, mentions: [usuarioId] });
                guardarLogLocal(`   ✅ Respuesta de negocio enviada (${tipoNegocio})`);
                return;
            }

            // Procesar consulta de producto
            setImmediate(async () => {
                try {
                    let nombreProducto = await obtenerProductoDesdeMensajeCitado(sock, mensaje);
                    if (!nombreProducto && !esGrupo) {
                        nombreProducto = buscarProductoEnTexto(texto);
                        if (nombreProducto) guardarLogLocal(`   🔍 Producto detectado en texto: "${nombreProducto}"`);
                    }
                    if (!nombreProducto) return;

                    const datosProducto = obtenerDatosProducto(nombreProducto);
                    if (!datosProducto) return;

                    const tipoConsulta = clasificarConsulta(texto);
                    if (tipoConsulta !== 'no_respondible') {
                        const respuesta = generarRespuestaAutomatica(tipoConsulta, nombreProducto, datosProducto);
                        if (respuesta) {
                            const mensajeConMencion = `@${usuarioId.split('@')[0]} ${respuesta}`;
                            const delayTyping = Math.floor(Math.random() * (CONFIG.delay_respuesta_max - CONFIG.delay_respuesta_min + 1) + CONFIG.delay_respuesta_min);
                            await simularTyping(sock, remitente, delayTyping);
                            await sock.sendMessage(remitente, { text: mensajeConMencion, mentions: [usuarioId] });
                            guardarLogLocal(`   ✅ Respuesta automática enviada (${tipoConsulta})`);
                        }
                    } else {
                        const clienteNumero = remitente.split('@')[0];
                        const lugar = esGrupo ? `Grupo` : `Chat privado`;
                        const enlace = generarEnlaceWaMe(remitente, nombreProducto, texto);
                        await enviarAlertaAdmin(sock, sock.user.id, {
                            producto: nombreProducto,
                            clienteNombre: clienteNumero,
                            clienteNumero: clienteNumero,
                            pregunta: texto,
                            lugar: lugar,
                            tiempo: 'ahora mismo',
                            enlace: enlace
                        });
                    }
                } catch (error) {
                    guardarLogLocal(`   ❌ Error procesando interacción: ${error.message}`);
                }
            });
        });

        console.log('\n📝 Comandos disponibles:');
        console.log('   - "actualizar" - ⚡ PRIORITARIO');
        console.log('   - "listagrupos" - ⚡ PRIORITARIO');
        console.log('   - "status" - Ver estado del bot\n');

    } catch (error) {
        guardarLogLocal(`❌ ERROR FATAL: ${error.message}`);
        setTimeout(() => iniciarWhatsApp(), 30000);
    }
}

process.on('SIGINT', () => {
    console.log('\n\n👋 Cerrando bot...');
    guardarLogLocal('BOT CERRADO MANUALMENTE');
    process.exit(0);
});

console.log('====================================');
console.log('🚀 SISTEMA DE MENSAJES MULTI-PESTAÑA');
console.log('====================================\n');

iniciarWhatsApp().catch(error => {
    console.log('❌ Error fatal:', error);
});
