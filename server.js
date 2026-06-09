const express = require("express");
const cors = require("cors");
const { v4: uuid } = require("uuid");
const axios = require("axios");
const crypto = require("crypto");

const app = express();

app.use(cors());

app.use(express.json({
    limit: "100mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "100mb"
}));

const REALTIME_DB_URL = "https://codevault-9ca85-default-rtdb.firebaseio.com/scripts";

// Sistema de Rate Limit para evitar que saturen la API
const rateLimit = new Map();
function checkRateLimit(ip) {
    const now = Date.now();
    const window = 60000; // 1 minuto
    const limit = 10;     // Máximo 10 peticiones
    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, []);
    }
    const timestamps = rateLimit.get(ip).filter(t => now - t < window);
    if (timestamps.length >= limit) {
        return false;
    }
    timestamps.push(now);
    rateLimit.set(ip, timestamps);
    return true;
}

app.get("/", (req, res) => {
    res.send("API funcionando con Realtime Database y Axios Estable");
});

// RUTA PARA GUARDAR SCRIPTS NUEVOS (Guarda el código limpio e intacto)
app.post("/save", async (req, res) => {
    try {
        const id = uuid();
        const scriptCode = req.body.code;
        if (!scriptCode) {
            return res.status(400).json({ success: false, error: "No code provided" });
        }
        const payload = { code: scriptCode, createdAt: new Date().toISOString() };
        await axios.put(`${REALTIME_DB_URL}/${id}.json`, payload);
        res.json({ success: true, id });
    } catch (error) {
        console.error("Error al guardar:", error.message);
        res.status(500).json({ success: false, error: "Error interno" });
    }
});

// RUTA PARA ACTUALIZAR UN SCRIPT EXISTENTE
app.put("/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const scriptCode = req.body.code;
        if (!scriptCode) {
            return res.status(400).json({ success: false, error: "No code provided" });
        }
        const payload = { code: scriptCode, updatedAt: new Date().toISOString() };
        await axios.patch(`${REALTIME_DB_URL}/${id}.json`, payload);
        res.json({ success: true, id });
    } catch (error) {
        console.error("Error al actualizar:", error.message);
        res.status(500).json({ success: false, error: "Error interno" });
    }
});

// RUTA EXCLUSIVA WEB RAW (Para que tú los veas en texto plano si quieres)
app.get("/web/raw/:id", async (req, res) => {
    try {
        const response = await axios.get(`${REALTIME_DB_URL}/${req.params.id}.json`);
        if (!response.data || !response.data.code) return res.status(404).send("Not Found");
        res.setHeader('Content-Type', 'text/plain');
        return res.send(response.data.code);
    } catch (error) {
        return res.status(500).send("Error en la base de datos");
    }
});

// --- RUTA PRINCIPAL CON SISTEMA DE DESVÍO INTELIGENTE (HONEYPOT) ---
app.get("/raw/:id", async (req, res) => {
    try {
        const clientIp = req.ip || req.connection.remoteAddress;
        
        // Verificar abuso de peticiones
        if (!checkRateLimit(clientIp)) {
            return res.status(429).send("-- Acceso restringido temporalmente por exceso de peticiones.");
        }

        const userAgent = req.headers['user-agent'] || '';

        // 1. FILTRO DETECTOR DE BOTS COMUNES
        const esBot = /python|node|axios|requests|curl|wget|java|php|scrapy|perl|ruby|go|httpclient/i.test(userAgent);
        
        // 2. VERIFICACIÓN DE ENTORNO ESPERADO (Cargadores del juego / Exe)
        const esEntornoCorrecto = userAgent.includes('Roblox') || userAgent.includes('Protocol') || userAgent.includes('Executor') || userAgent === '';

        // --- EL DESVÍO: Si entra un navegador o un bot, van directos a la trampa ---
        if (esBot || !esEntornoCorrecto) {
            res.setHeader('Content-Type', 'text/plain');
            
            // Les devolvemos un script falso inofensivo que simula estar cargando algo eterno
            return res.send(`--[[
  [ CODEVAULT SYSTEM SECURE SHIELD ACTIVE ]
  [ STATUS: SIMULATION MODE ENGAGED ]
]]
print("Iniciando componentes del entorno...")
task.wait(2)
while true do
    print("Verificando firma de seguridad remota...")
    task.wait(10)
end`);
        }

        // --- FLUJO REAL: Si pasa los filtros, busca la ID en tu Firebase privada ---
        const response = await axios.get(`${REALTIME_DB_URL}/${req.params.id}.json`);
        
        // Si la ID no existe en tu base de datos
        if (!response.data || !response.data.code) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(404).send("-- CodeVault Error: El buffer ID solicitado no existe.");
        }

        // Si todo está bien, envía el script original limpio y sin alterar
        res.setHeader('Content-Type', 'text/plain');
        return res.send(response.data.code);

    } catch (error) {
        console.error("Error en el Core de desvío:", error.message);
        res.setHeader('Content-Type', 'text/plain');
        return res.status(500).send("-- Error interno del sistema Core.");
    }
});

// --- INTERFAZ DE PANEL WEB CYBERPUNK 2.0 (ULTRA-GLOW LUXURY STYLE) ---
app.get("/panel", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeVault — Secure Core</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            background-color: #030303; 
            color: #ffffff; 
            font-family: 'SF Pro Display', '-apple-system', 'Segoe UI', monospace; 
            display: grid; 
            place-items: center; 
            height: 100vh; 
            margin: 0;
            background-image: radial-gradient(circle at 50% 50%, #0a0e17 0%, #020202 100%);
        }
        .card { 
            width: 92%; 
            max-width: 440px; 
            background: rgba(5, 5, 8, 0.95); 
            border: 1px solid rgba(255, 255, 255, 0.04); 
            padding: 35px; 
            border-radius: 16px; 
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.8), 0 0 50px rgba(0, 110, 255, 0.02);
            backdrop-filter: blur(20px);
            position: relative;
            overflow: hidden;
        }
        .card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 2px;
            background: linear-gradient(90deg, transparent, #00ffaa, transparent);
        }
        .brand-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 25px;
        }
        .logo-text { 
            font-size: 28px; 
            font-weight: 900; 
            letter-spacing: 5px; 
            color: #ffffff;
            text-shadow: 0 0 20px rgba(255,255,255,0.1);
            font-family: monospace;
        }
        .logo-sub { 
            font-size: 9px; 
            color: #444854; 
            letter-spacing: 6px; 
            margin-top: 6px;
            font-weight: 700;
        }
        .status-box { 
            padding: 14px 18px; 
            background: rgba(255,255,255,0.01); 
            border: 1px solid rgba(255,255,255,0.03);
            border-left: 4px solid #00ffaa; 
            font-size: 11px; 
            font-family: monospace;
            border-radius: 8px;
            margin-bottom: 22px;
            line-height: 1.7;
        }
        .green { color: #00ffaa; text-shadow: 0 0 10px rgba(0,255,170,0.3); } 
        .red { color: #ff3366; text-shadow: 0 0 10px rgba(255,51,102,0.3); }
        .info-desc { 
            font-size: 12.5px; 
            color: #8a8f9e; 
            line-height: 1.6; 
            margin-bottom: 30px; 
            text-align: center;
            font-weight: 400;
        }
        .btn-action { 
            display: block; 
            background: #ffffff; 
            color: #000000; 
            text-align: center; 
            padding: 14px; 
            text-decoration: none; 
            font-size: 11px; 
            font-weight: 800; 
            letter-spacing: 2px; 
            border-radius: 8px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 15px rgba(255,255,255,0.05);
        }
        .btn-action:hover {
            background: #efefef;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(255,255,255,0.1);
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="brand-container">
            <div class="logo-text">CODEVAULT</div>
            <div class="logo-sub">ABSOLUTE PROTECTION SECURE</div>
        </div>
        <div class="status-box">
            <span style="color: #444854;">&gt; CORE_STATUS:</span> <span class="green">DESVIO_HONEYPOT_ACTIVE</span><br>
            <span style="color: #444854;">&gt; NET_ACCESS:</span> <span class="green">PRIVATE_DB_CONNECTED</span>
        </div>
        <p class="info-desc">
            El cortafuegos está desviando activamente las conexiones no verificadas. Los scripts almacenados se mantendrán en su formato de ejecución puro.
        </p>
        <a href="#" class="btn-action">SISTEMA CORRIENDO</a>
    </div>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Servidor levantado con desvío Honeypot Ultra-Estable en el puerto " + PORT);
});
