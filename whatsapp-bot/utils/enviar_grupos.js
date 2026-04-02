// ============================================
// MÓDULO: ENVIAR GRUPOS A GOOGLE SHEETS Y GENERAR CSV
// ============================================

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { CONFIG } = require('../config');
const { guardarLogLocal } = require('./logs');

// ============================================
// ENVIAR GRUPOS A GOOGLE SHEETS (POST)
// ============================================
async function enviarGruposASheets(sock, url_sheets, grupos) {
    try {
        guardarLogLocal('📤 Enviando grupos a Google Sheets...');
        
        const respuesta = await axios.post(url_sheets, {
            grupos: grupos
        });
        
        if (respuesta.data && respuesta.data.success) {
            guardarLogLocal(`✅ ${respuesta.data.mensaje}`);
            return true;
        } else {
            guardarLogLocal(`⚠️ Respuesta de Sheets: ${JSON.stringify(respuesta.data)}`);
            return false;
        }
    } catch (error) {
        guardarLogLocal(`❌ Error enviando a Sheets: ${error.message}`);
        return false;
    }
}

// ============================================
// GENERAR Y ENVIAR CSV POR WHATSAPP
// ============================================
async function enviarCSVporWhatsApp(sock, remitente, grupos) {
    try {
        let csvContent = 'ID_GRUPO,NOMBRE_GRUPO\n';
        grupos.forEach(g => {
            const nombreEscapado = g.nombre.includes(',') ? `"${g.nombre}"` : g.nombre;
            csvContent += `${g.id},${nombreEscapado}\n`;
        });
        
        const csvPath = path.join(CONFIG.carpeta_logs, 'grupos_exportados.csv');
        fs.writeFileSync(csvPath, csvContent);
        
        await sock.sendMessage(remitente, {
            document: fs.readFileSync(csvPath),
            fileName: 'grupos_exportados.csv',
            mimetype: 'text/csv',
            caption: '📎 Archivo con la lista de grupos'
        });
        
        guardarLogLocal('✅ CSV enviado por WhatsApp');
        return true;
    } catch (error) {
        guardarLogLocal(`❌ Error enviando CSV: ${error.message}`);
        return false;
    }
}

// ============================================
// EXPORTAR
// ============================================
module.exports = {
    enviarGruposASheets,
    enviarCSVporWhatsApp
};
