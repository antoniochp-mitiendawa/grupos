// ============================================
// CONFIGURACIÓN Y CONSTANTES DEL BOT
// ============================================

const path = require('path');
const pino = require('pino');
const { makeInMemoryStore } = require('@rodrigogs/baileys-store');

// ============================================
// CONFIGURACIÓN PRINCIPAL
// ============================================
const CONFIG = {
    carpeta_sesion: './sesion_whatsapp',
    archivo_url: '../url_sheets.txt',
    archivo_agenda: './agenda.json',
    archivo_store: './baileys_store.json',
    tiempo_entre_mensajes_min: 1,
    tiempo_entre_mensajes_max: 5,
    tiempo_typing: 3000,
    carpeta_logs: './logs',
    carpeta_cache: './cache',
    numero_telefono: '',
    horarios_actualizacion: ['06:00'],
    dias_retencion_store: 30,
    carpeta_multimedia: '/storage/emulated/0/',
    tiempo_espera_grupos: 30000,
    delay_entre_archivos: 3,
    textos_por_tipo: {
        imagen: '',
        video: '🎬 Te comparto un video de *[PRODUCTO]*',
        audio: '🔊 Escucha más información sobre *[PRODUCTO]*',
        documento: '📄 Aquí tienes más información de *[PRODUCTO]*'
    },
    textos_sinonimos: {
        saludos: ["¡Hola! 👋", "¡Buen día! ☀️", "¡Hola, gracias por contactarnos! 😊", "¡Un gusto saludarte! 🤝", "¡Gracias por comunicarte! ✨"],
        agradecimientos: ["¡Gracias! 🙏", "Te lo agradecemos ✨", "¡Gracias por tu interés! 🌟", "Agradecemos tu mensaje 💫", "¡Gracias por escribirnos!"],
        ofertas: ["¿Te interesa? 🤔", "¿Te gustaría adquirir uno? 🛍️", "¿Quieres obtener más información? 📋", "¿Te gustaría conocer más detalles? ✨", "Estamos a tus órdenes para lo que necesites 🤝"],
        contacto: ["Estamos a tus órdenes 🤝", "Aquí estamos para ayudarte 👋", "Puedes escribirnos cuando quieras 📱", "Para cualquier duda, aquí estamos 💬", "Cuenta con nosotros para lo que necesites 🌟"],
        despedidas: ["¡Hasta luego! 👋", "¡Que tengas buen día! ☀️", "¡Quedamos atentos! ✨", "¡Cuidate mucho! 🙏", "¡Para cualquier cosa, aquí estamos!"]
    },
    respuestas_reacciones: {
        "👍": [
            "👋 ¡Gracias por tu interés en *[PRODUCTO]*! Está disponible. ¿Te gustaría adquirir uno?",
            "👍 ¡Gracias por el like! *[PRODUCTO]* es un producto excelente. ¿Quieres más información?",
            "🙌 Agradecemos tu interés en *[PRODUCTO]*. Estamos a tus órdenes",
            "✨ ¡Gracias por tu atención! *[PRODUCTO]* es uno de los más solicitados. ¿Te gustaría conocer más?",
            "👏 Apreciamos tu interés en *[PRODUCTO]*. Para cualquier duda, aquí estamos"
        ],
        "❤️": [
            "❤️ ¡Gracias por tu interés en *[PRODUCTO]*! Nos da gusto que te guste",
            "💖 ¡Qué bonito! *[PRODUCTO]* es especial. ¿Quieres más información?",
            "💝 ¡Gracias por el corazón! ¿Te gustaría adquirir *[PRODUCTO]*?",
            "💗 Agradecemos tu interés en *[PRODUCTO]*. Estamos aquí para ayudarte",
            "💕 ¡Gracias! *[PRODUCTO]* tiene excelentes comentarios. ¿Te gustaría conocer más detalles?"
        ],
        "😮": [
            "😮 ¿Sorprendido con *[PRODUCTO]*? Es realmente increíble, ¿quieres conocer más?",
            "😲 ¡Vaya! *[PRODUCTO]* impacta a primera vista. ¿Te gustaría saber más?",
            "🤯 Increíble, ¿verdad? *[PRODUCTO]* tiene características únicas. ¿Te interesa?",
            "😱 ¡Nos encanta tu reacción! *[PRODUCTO]* es único. ¿Te gustaría adquirirlo?",
            "🌟 Así es, *[PRODUCTO]* es sorprendente. ¿Quieres más información?"
        ],
        "🙏": [
            "🙏 ¡Gracias a ti! Para cualquier duda sobre *[PRODUCTO]*, aquí estamos",
            "🤝 Apreciamos tu mensaje. ¿Necesitas información adicional de *[PRODUCTO]*?",
            "✨ Gracias por comunicarte. ¿Te podemos ayudar con algo más de *[PRODUCTO]*?",
            "💫 ¡Un placer! Estamos aquí para lo que necesites sobre *[PRODUCTO]*",
            "🌟 Gracias por tu interés. ¿Te gustaría conocer más de *[PRODUCTO]*?"
        ],
        "😂": [
            "😂 Nos alegra que te cause interés *[PRODUCTO]*. ¿Quieres ver más productos similares?",
            "😄 ¡Qué bien! ¿Te gustaría conocer otros productos de nuestra línea?",
            "🤣 Gracias por tu mensaje. ¿Te interesa *[PRODUCTO]* o algún otro producto?",
            "😆 ¡Buenísimo! Si quieres más información de *[PRODUCTO]*, aquí estamos",
            "🎉 Nos da gusto tu interés. ¿Te contamos más de *[PRODUCTO]*?"
        ]
    },
    respuestas_consultas: {
        generica: [
            "👕 *[PRODUCTO]* - [DESCRIPCION]. Precio: 💵 [PRECIO]",
            "✨ *[PRODUCTO]*: [DESCRIPCION]. Valor: 💵 [PRECIO]",
            "📦 *[PRODUCTO]* disponible. [DESCRIPCION] - 💵 [PRECIO]",
            "🎁 *[PRODUCTO]*: [DESCRIPCION]. Precio: 💵 [PRECIO]",
            "🌟 *[PRODUCTO]* - [DESCRIPCION] - 💵 [PRECIO]. ¿Te gustaría conocer más?"
        ],
        precio: [
            "*[PRODUCTO]* tiene un precio de 💵 [PRECIO]. ¿Te gustaría adquirir uno?",
            "💰 Valor de *[PRODUCTO]*: 💵 [PRECIO]. ¿Te interesa?",
            "💵 *[PRODUCTO]*: 💵 [PRECIO]. ¿Quieres más información?",
            "El precio de *[PRODUCTO]* es 💵 [PRECIO]. Estamos a tus órdenes",
            "💲 *[PRODUCTO]*: 💵 [PRECIO]. ¿Te gustaría obtener uno?"
        ],
        descripcion: [
            "📝 *[PRODUCTO]*: [DESCRIPCION]. Precio: 💵 [PRECIO]",
            "✨ Características de *[PRODUCTO]*: [DESCRIPCION]. Valor: 💵 [PRECIO]",
            "🔍 *[PRODUCTO]*: [DESCRIPCION]. ¿Te gustaría adquirirlo?",
            "📋 *[PRODUCTO]*: [DESCRIPCION]. Precio: 💵 [PRECIO]",
            "🎯 *[PRODUCTO]*: [DESCRIPCION]. ¿Quieres más información?"
        ]
    },
    palabras_clave_respondibles: {
        precio: ["precio", "cuesta", "valor", "$$", "💰", "💵", "costó", "precio?", "cuánto", "cuanto", "costo", "vale", "valor?", "precio", "costo"],
        info: ["info", "información", "características", "descripción", "qué es", "detalles", "descripcion", "caracteristicas", "como es", "que tiene", "especificaciones"],
        generica: ["más", "info", "información", "quiero saber", "dime", "mas", "informacion", "saber", "conocer", "interesa", "me interesa", "quisiera saber"]
    },
    palabras_clave_negocio: {
        horario: ["horario", "atienden", "abren", "cierran", "hora", "horarios", "atencion", "atención", "a qué hora", "cuándo abren", "cuándo cierran", "días de atención"],
        domicilio: ["domicilio", "ubicación", "ubicacion", "dirección", "direccion", "dónde están", "donde estan", "en dónde", "donde quedan", "como llegar", "cómo llegar", "mapa"],
        telefono: ["teléfono", "telefono", "whatsapp", "contacto", "número", "numero", "celular", "llamar", "comunicarme", "hablar"]
    },
    delay_respuesta_min: 1,
    delay_respuesta_max: 3
};

// ============================================
// VARIABLES GLOBALES
// ============================================
let timersEnvios = [];
let configNegocio = {};
let productosCache = [];
let ultimaActualizacionProductos = 0;
let agendaEnMemoria = null;
const mensajesEnProcesamiento = new Set();

// ============================================
// DATA STORE
// ============================================
const store = makeInMemoryStore({
    logger: pino({ level: 'silent' }).child({ stream: 'store' })
});

// ============================================
// EXPORTAR TODO
// ============================================
module.exports = {
    CONFIG,
    timersEnvios,
    configNegocio,
    productosCache,
    ultimaActualizacionProductos,
    agendaEnMemoria,
    mensajesEnProcesamiento,
    store,
    groupCache: new Map(),
    imagenesUsadasEnLote: new Set()
};
