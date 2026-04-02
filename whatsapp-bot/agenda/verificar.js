// ============================================
// MÓDULO: VERIFICAR Y ENVIAR MENSAJES PROGRAMADOS
// ============================================

const { CONFIG, imagenesUsadasEnLote } = require('../config');
const { guardarLogLocal } = require('../utils/logs');
const { simularTyping } = require('../utils/typing');
const { enviarMensaje } = require('./enviar'); // lo crearemos después
const { cargarAgendaLocal } = require('./guardar');
const { limpiarCacheImagenes } = require('../utils/cache'); // lo crearemos después

// ============================================
// OBTENER DELAY ALEATORIO
// ============================================
function obtenerDelayAleatorio() {
    const min = CONFIG.tiempo_entre_mensajes_min || 1;
    const max = CONFIG.tiempo_entre_mensajes_max || 5;
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    return delay;
}

// ============================================
// VERIFICAR MENSAJES PENDIENTES POR PESTAÑA
// ============================================
async function verificarMensajesLocales(sock) {
    try {
        const agenda = cargarAgendaLocal();
        
        if (!agenda.grupos || agenda.grupos.length === 0) {
            return;
        }

        const ahora = new Date();
        const horaActual = ahora.getHours().toString().padStart(2,'0') + ':' + 
                          ahora.getMinutes().toString().padStart(2,'0');
        const diaSemana = ['D','L','M','MI','J','V','S'][ahora.getDay()];

        const pestanasAHora = [];
        
        Object.keys(agenda.pestanas || {}).forEach(nombrePestana => {
            const pestana = agenda.pestanas[nombrePestana];
            if (pestana.horario === horaActual) {
                pestanasAHora.push({
                    nombre: nombrePestana,
                    horario: pestana.horario,
                    grupos: pestana.grupos.filter(g => g.activo === 'SI')
                });
            }
        });

        if (pestanasAHora.length === 0) {
            return;
        }

        guardarLogLocal(`⏰ HORA DE ENVÍO DETECTADA: ${horaActual} - Procesando ${pestanasAHora.length} pestañas`);
        imagenesUsadasEnLote.clear();

        const tiempoInicioLote = Date.now();
        let ultimoTiempoEnvio = 0;

        for (const pestana of pestanasAHora) {
            guardarLogLocal(`📊 Pestaña "${pestana.nombre}" - Enviando ${pestana.grupos.length} mensajes (horario: ${pestana.horario})`);

            for (const grupo of pestana.grupos) {
                const diasPermitidos = grupo.dias ? grupo.dias.split(',').map(d => d.trim()) : [];
                if (diasPermitidos.length > 0 && !diasPermitidos.includes(diaSemana)) {
                    guardarLogLocal(`   ⏭️  ${grupo.nombre || grupo.id} - no corresponde hoy (días: ${grupo.dias})`);
                    continue;
                }

                guardarLogLocal(`   📤 Enviando a: ${grupo.nombre || grupo.id}`);
                
                const delayMinimoSegundos = obtenerDelayAleatorio();
                const tiempoDesdeUltimoEnvio = (Date.now() - ultimoTiempoEnvio) / 1000;
                
                let tiempoEspera = 0;
                if (ultimoTiempoEnvio > 0 && tiempoDesdeUltimoEnvio < delayMinimoSegundos) {
                    tiempoEspera = delayMinimoSegundos - tiempoDesdeUltimoEnvio;
                    guardarLogLocal(`   ⏱️ Delay inteligente: esperando ${tiempoEspera.toFixed(1)}s adicionales para cumplir mínimo ${delayMinimoSegundos}s`);
                    await new Promise(resolve => setTimeout(resolve, tiempoEspera * 1000));
                }
                
                await simularTyping(sock, grupo.id, delayMinimoSegundos * 0.5);
                
                const resultado = await enviarMensaje(sock, grupo.id, grupo.mensaje);
                
                ultimoTiempoEnvio = Date.now();
                guardarLogLocal(`      Resultado: ${resultado.resultado} (${resultado.tiempo.toFixed(1)}s)`);
            }
            
            guardarLogLocal(`✅ Pestaña "${pestana.nombre}" completada`);
        }

        const tiempoTotalLote = (Date.now() - tiempoInicioLote) / 1000;
        guardarLogLocal(`✅ Lote completado en ${tiempoTotalLote.toFixed(1)} segundos`);
        
        limpiarCacheImagenes();

    } catch (error) {
        guardarLogLocal(`❌ ERROR: ${error.message}`);
        limpiarCacheImagenes();
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    obtenerDelayAleatorio,
    verificarMensajesLocales
};
