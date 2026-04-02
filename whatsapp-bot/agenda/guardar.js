// ============================================
// MÓDULO: GUARDAR AGENDA LOCAL EN JSON
// ============================================

const fs = require('fs');
const { CONFIG, agendaEnMemoria } = require('../config');
const { guardarLogLocal } = require('../utils/logs');

// ============================================
// GUARDAR AGENDA LOCAL (desde datos de Sheets)
// ============================================
function guardarAgendaLocal(data) {
    try {
        const grupos = data.grupos || [];
        
        const agenda = {
            ultima_actualizacion: new Date().toISOString(),
            config: {
                min: CONFIG.tiempo_entre_mensajes_min,
                max: CONFIG.tiempo_entre_mensajes_max
            },
            pestanas: {},
            grupos: grupos,
            total: grupos.length
        };
        
        grupos.forEach(grupo => {
            if (!agenda.pestanas[grupo.pestana]) {
                agenda.pestanas[grupo.pestana] = {
                    horario: grupo.horario_rector,
                    grupos: []
                };
            }
            agenda.pestanas[grupo.pestana].grupos.push(grupo);
        });
        
        fs.writeFileSync(CONFIG.archivo_agenda, JSON.stringify(agenda, null, 2));
        
        console.log(`✅ Agenda guardada localmente (${grupos.length} grupos en ${Object.keys(agenda.pestanas).length} pestañas)`);
        Object.keys(agenda.pestanas).forEach(pestana => {
            console.log(`   📌 ${pestana}: ${agenda.pestanas[pestana].grupos.length} grupos - Horario: ${agenda.pestanas[pestana].horario || 'N/A'}`);
        });
        
        return true;
    } catch (error) {
        console.error('❌ Error guardando agenda:', error.message);
        return false;
    }
}

// ============================================
// CARGAR AGENDA LOCAL DESDE JSON
// ============================================
function cargarAgendaLocal() {
    try {
        if (agendaEnMemoria) {
            return agendaEnMemoria;
        }
        
        if (!fs.existsSync(CONFIG.archivo_agenda)) {
            console.log('📁 No hay agenda local (primera vez)');
            // CORREGIDO: agendaEnMemoria viene como let desde config.js
            agendaEnMemoria = { grupos: [], pestanas: {}, total: 0 };
            return agendaEnMemoria;
        }
        const agenda = JSON.parse(fs.readFileSync(CONFIG.archivo_agenda, 'utf8'));
        
        if (agenda.config) {
            CONFIG.tiempo_entre_mensajes_min = agenda.config.min || 1;
            CONFIG.tiempo_entre_mensajes_max = agenda.config.max || 5;
        }
        
        agendaEnMemoria = agenda;
        console.log(`📋 Agenda cargada (${agenda.grupos?.length || 0} grupos)`);
        return agendaEnMemoria;
    } catch (error) {
        console.error('❌ Error cargando agenda:', error.message);
        agendaEnMemoria = { grupos: [], pestanas: {}, total: 0 };
        return agendaEnMemoria;
    }
}

// ============================================
// FORZAR RECARGA DE AGENDA
// ============================================
function recargarAgenda() {
    agendaEnMemoria = null;
    return cargarAgendaLocal();
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    guardarAgendaLocal,
    cargarAgendaLocal,
    recargarAgenda
};
