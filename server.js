const express = require("express");
const cors = require("cors");
const { v4: uuid } = require("uuid");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const REALTIME_DB_URL = "https://codevault-9ca85-default-rtdb.firebaseio.com/scripts";

app.get("/", (req, res) => {
    res.send("API funcionando con Realtime Database y Axios Estable");
});

// RUTA PARA GUARDAR SCRIPTS NUEVOS
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

// RUTA EXCLUSIVA WEB RAW
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

// --- MOTOR DE OFUSCACIÓN MILITAR CODEVAULT V9.5 (COMPATIBILIDAD GRÁFICA Y BLINDAJE ANTI-RAM) ---
function militaryObfuscate(code) {
    const xorKey = crypto.randomInt(30, 225);
    const shiftKey = crypto.randomInt(5, 17);
    
    // Mantenemos el código puro. Sin añadir "script = nil" para no romper referencias de las UIs nativas.
    const codeBuffer = Buffer.from(code, 'utf8');
    const protectedBuffer = Buffer.alloc(codeBuffer.length);
    
    // Algoritmo matemático simétrico posicional inverso
    for (let i = 0; i < codeBuffer.length; i++) {
        let processed = codeBuffer[i] ^ xorKey;
        processed = (processed + shiftKey) % 256; 
        protectedBuffer[i] = processed;
    }

    const hexData = protectedBuffer.toString('hex');
    const scrambledHex = hexData.split('').reverse().join('');

    // Matriz de ruido e inyección de datos basura para romper analizadores estáticos de firmas
    let junkCode = "";
    for(let i = 0; i < 40; i++) {
        const fakeHex = crypto.randomBytes(4).toString('hex');
        const fakeData = crypto.randomBytes(4).toString('hex');
        junkCode += `local _0xErr_${fakeHex} = "${fakeData}";\n`;
    }

    return {
        stream: scrambledHex,
        key1: xorKey,
        key2: shiftKey,
        junk: junkCode
    };
}

// RUTA CENTRAL CON FILTROS ANTI-BOT Y CARGA ULTRA-ESTABLE
app.get("/raw/:id", async (req, res) => {
    try {
        const userAgent = req.headers['user-agent'] || '';
        if (userAgent.includes('python') || userAgent.includes('node') || userAgent.includes('axios') || userAgent.includes('requests')) {
            return res.status(403).send("Forbidden: Security Violation.");
        }

        let code = undefined;
        try {
            const response = await axios.get(`${REALTIME_DB_URL}/${req.params.id}.json`);
            if (response.data && response.data.code) code = response.data.code;
        } catch (e) { code = undefined; }
        
        const esExecutor = userAgent.includes('Roblox') || userAgent.includes('Protocol') || userAgent.includes('Executor') || userAgent === '';

        if (esExecutor) {
            if (!code) {
                res.setHeader('Content-Type', 'text/plain');
                return res.status(404).send("-- CodeVault Error: Script no encontrado.");
            }

            const obf = militaryObfuscate(code);

            const secureLuaPayload = `--[[
    ▄▀█ ▄▄▀█▄▄ █▀█ ▄▄▀█▄▄ █░█ ▄▄▀█▄▄ █░█ █░░ ▀█▀
    █▀█ █▄█▄▄█ █▄█ █▄█▄▄█ ▀▄▀ █▀█▀▄█ █▄█ █▄▄ ░█░
   
   [ PREMIUM MILITARY SHIELD V9.5 — BRANDING: CODEVAULT ]
   [ ANTI-RAM MEMORY EVAPORATION & UI COMPATIBILITY LAYER ]
]]

${obf.junk}

-- Resguardo blindado de llamadas nativas de bajo nivel
local _r_gsub = string.gsub
local _r_reverse = string.reverse
local _r_char = string.char
local _r_tonumber = tonumber
local _r_pcall = pcall
local _r_bxor = (bit32 and bit32.bxor)

local _0xStreamContainer = "${obf.stream}"
local _0xXorKey = ${obf.key1}
local _0xShiftKey = ${obf.key2}

-- Validación de entorno ágil
local isGameEnv = _r_pcall(function() return game:IsA("DataModel") end)
if not isGameEnv then
    while true do end
end

-- Ejecución aislada dentro de un entorno controlado
local executionSuccess, loaderFunction = _r_pcall(function()
    local normalHex = _r_reverse(_0xStreamContainer)
    local cleanBytes = {}
    local index = 1
    
    _r_gsub(normalHex, "..", function(byte)
        local rawByte = _r_tonumber(byte, 16)
        local unshifted = (rawByte - _0xShiftKey) % 256
        if unshifted < 0 then unshifted = unshifted + 256 end
        
        local decryptedByte
        if _r_bxor then
            decryptedByte = _r_bxor(unshifted, _0xXorKey)
        else
            local p, c = 1, 0
            local a, b = unshifted, _0xXorKey
            while a > 0 or b > 0 do
                local ra, rb = a % 2, b % 2
                if ra ~= rb then c = c + p end
                a, b, p = (a - ra) / 2, (b - rb) / 2, p * 2
            end
            decryptedByte = c
        end
        
        cleanBytes[index] = _r_char(decryptedByte)
        index = index + 1
    end)
    
    local rawString = table.concat(cleanBytes)
    local compiled, err = loadstring(rawString)
    
    -- BLINDAJE RADICAL ANTI-RAM INTERNO: Sobrescribimos el string plano con bytes nulos antes de recolectar
    rawString = string.rep("\\0", #rawString)
    rawString = nil
    cleanBytes = nil
    normalHex = nil
    _0xStreamContainer = nil
    
    if not compiled then error(err or "Failed to compile bytecode source.") end
    return compiled
end)

-- Purga de variables globales del cargador criptográfico para liberar la RAM por completo
_0xStreamContainer = nil
_0xXorKey = nil
_0xShiftKey = nil

if executionSuccess and loaderFunction then
    -- Forzamos la recolección total de basura antes de iniciar el código original
    collectgarbage("collect")
    
    -- Lanzamiento asíncrono seguro para prevenir congelamiento de hilos y cargar interfaces fluidas
    if task and task.defer then
        task.defer(function()
            local success, runError = _r_pcall(loaderFunction)
            if not success then
                warn("[CODEVAULT]: Runtime warning: " .. tostring(runError))
            end
            loaderFunction = nil
            collectgarbage("collect")
        end)
    else
        local success, runError = _r_pcall(loaderFunction)
        if not success then
            warn("[CODEVAULT]: Runtime warning: " .. tostring(runError))
        end
        loaderFunction = nil
        collectgarbage("collect")
    end
else
    warn("[CODEVAULT]: Shield protection active. Environment blocked or corrupted.")
end`;

            res.setHeader('Content-Type', 'text/plain');
            return res.send(secureLuaPayload);
        } 
        
        // --- INTERFAZ DE BLOQUEO WEB CYBERPUNK ---
        return res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeVault — Protected</title>
    <style>
        body { background: #0a0a0a; color: #fff; font-family: monospace; display: grid; place-items: center; height: 100vh; margin: 0; }
        .card { width: 90%; max-width: 450px; background: #000; border: 1px solid #222; padding: 30px; border-radius: 4px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
        .title { font-size: 24px; font-weight: bold; letter-spacing: 2px; margin-bottom: 5px; color: #fff; }
        .subtitle { font-size: 10px; color: #555; letter-spacing: 4px; margin-bottom: 20px; }
        .status { padding: 10px; background: #111; border-left: 3px solid ${code ? '#00ff88' : '#ff3b3b'}; font-size: 12px; margin-bottom: 20px; }
        .green { color: #00ff88; } .red { color: #ff3b3b; }
        .desc { font-size: 12px; color: #888; line-height: 1.6; margin-bottom: 25px; }
        .btn { display: block; background: #fff; color: #000; text-align: center; padding: 12px; text-decoration: none; font-size: 11px; font-weight: bold; letter-spacing: 1px; border-radius: 2px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="title">CODEVAULT</div>
        <div class="subtitle">SECURITY INTERFACE</div>
        <div class="status">> STATUS: <span class="${code ? 'green' : 'red'}">${code ? "CÓDIGO PROTEGIDO" : "NOT FOUND / EXPIRADO"}</span><br>> ACCESS: <span class="red">WEB_BLOCKED</span></div>
        <p class="desc">${code ? "Este script se encuentra protegido legítimamente bajo el entorno de CodeVault. El acceso web al código plano está deshabilitado para evitar su filtración." : "El identificador de script solicitado no existe."}</p>
        <a href="https://leeh10.github.io/CodeVault/index.html" class="btn">IR AL PANEL PRINCIPAL</a>
    </div>
</body>
</html>
        `);
    } catch (error) {
        return res.status(500).send("Security Shield Error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running perfectly with Realtime DB REST API");
});
