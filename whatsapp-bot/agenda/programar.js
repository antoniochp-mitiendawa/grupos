// ============================================
// MÓDULO: PROGRAMAR ENVÍOS CON SETTIMEOUT
// ============================================

const { timersEnvios } = require('../config');
const { guardarLogLocal } = require('../utils/logs');
const { cargarAgendaLocal } = require('./guardar');
const { verificarMensajesLocales } = require('./verificar'); // lo crearemos después

// ============================================
// CALCULAR TIEMPO HASTA PRÓXIMO HORARIO
// ============================================
function calcularTiempoHastaHorario(horario) {
    const ahora = new Date();
    const [horas, minutos] = horario.split(':').map(Number);
    
    const proximo = new Date(ahora);
    proximo.setHours(horas, minutos, 0, 0);
    
    if (proximo <= ahora) {
        proximo.setDate(proximo.getDate() + 1);
    }
    
    return proximo - ahora;
}

// ============================================
// PROGRAMAR UN HORARIO ESPECÍFICO
// ============================================
function programarHorario(horario, sock) {
    const tiempoEspera = calcularTiempoHastaHorario(horario);
    const fechaEjecucion = new Date(Date.now() + tiempoEspera);
    
    guardarLogLocal(`   📅 Programado: ${horario} (en ${Math.round(tiempoEspera/60000)} minutos - ${fechaEjecucion.toLocaleString()})`);
    
    const timer = setTimeout(async () => {
        guardarLogLocal(`⏰ EJECUTANDO HORARIO PROGRAMADO: ${horario}`);
        await verificarMensajesLocales(sock);
        programarHorario(horario, sock);
    }, tiempoEspera);
    
    timersEnvios.push(timer);
    return timer;
}

// ============================================
// CANCELAR TODOS LOS TIMERS ACTIVOS
// ============================================
function cancelarTodosLosTimers() {
    if (timersEnvios.length > 0) {
        guardarLogLocal(`🔄 Cancelando ${timersEnvios.length} timers activos...`);
        timersEnvios.forEach(timer => clearTimeout(timer));
        timersEnvios = [];
    }
}

// ============================================
// REPROGRAMAR TODOS LOS ENVÍOS SEGÚN LA AGENDA ACTUAL
// ============================================
function reprogramarTodosLosEnvios(sock) {
    cancelarTodosLosTimers();
    const agenda = cargarAgendaLocal();
    const horariosUnicos = new Set();
    if (agenda.pestanas) {
        Object.values(agenda.pestanas).forEach(pestana => {
            if (pestana.horario) {
                horariosUnicos.add(pestana.horario);
            }
        });
    }
    guardarLogLocal(`🔄 Reprogramando ${horariosUnicos.size} horarios de envío...`);
    horariosUnicos.forEach(horario => {
        programarHorario(horario, sock);
    });
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    calcularTiempoHastaHorario,
    programarHorario,
    cancelarTodosLosTimers,
    reprogramarTodosLosEnvios
};
