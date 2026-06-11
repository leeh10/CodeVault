const express = require("express");
const cors = require("cors");
const { v4: uuid } = require("uuid");
const axios = require("axios");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

const REALTIME_DB_URL = "https://codevault-9ca85-default-rtdb.firebaseio.com/scripts";

app.get("/", (req, res) => {
    res.send("CodeVault API Publica — Proteccion Dinamica Activa");
});

/* =========================================================================
   GUARDAR / ACTUALIZAR SCRIPTS
   ========================================================================= */
app.post("/save", async (req, res) => {
    try {
        const id = uuid();
        const scriptCode = req.body.code;
        if (!scriptCode) return res.status(400).json({ success: false, error: "No code provided" });
        await axios.put(`${REALTIME_DB_URL}/${id}.json`, { code: scriptCode, createdAt: new Date().toISOString() });
        res.json({ success: true, id });
    } catch (error) {
        console.error("Error al guardar:", error.message);
        res.status(500).json({ success: false, error: "Error interno" });
    }
});

app.put("/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const scriptCode = req.body.code;
        if (!scriptCode) return res.status(400).json({ success: false, error: "No code provided" });
        await axios.patch(`${REALTIME_DB_URL}/${id}.json`, { code: scriptCode, updatedAt: new Date().toISOString() });
        res.json({ success: true, id });
    } catch (error) {
        console.error("Error al actualizar:", error.message);
        res.status(500).json({ success: false, error: "Error interno" });
    }
});

/* =========================================================================
   UTILIDADES DE POLIMORFISMO
   Genera nombres aleatorios por peticion para que ningun bot tenga firmas.
   ========================================================================= */
const LUA_ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randName() {
    let n = "_";
    const len = crypto.randomInt(6, 12);
    for (let i = 0; i < len; i++) {
        if (i === 0) n += LUA_ALPHA[crypto.randomInt(0, LUA_ALPHA.length)];
        else {
            const pool = LUA_ALPHA + "0123456789";
            n += pool[crypto.randomInt(0, pool.length)];
        }
    }
    return n;
}

// Genera un set de nombres unicos para los roles internos del loader.
function buildNames(roles) {
    const used = new Set();
    const out = {};
    for (const r of roles) {
        let nm;
        do { nm = randName(); } while (used.has(nm));
        used.add(nm);
        out[r] = nm;
    }
    return out;
}

function shuffleString(str) {
    const a = str.split("");
    for (let i = a.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a.join("");
}

/* =========================================================================
   MOTOR DE CIFRADO MULTI-CAPA (V10 — POLIMORFICO)
   Capa 1: XOR con clave dependiente de la POSICION (no estatica).
   Capa 2: desplazamiento rotatorio por posicion.
   Capa 3: codificacion con ALFABETO HEX ALEATORIO (rompe deteccion de hex).
   Capa 4: inversion del stream.
   Capa 5: checksum de integridad (anti-tamper).
   ========================================================================= */
function publicObfuscate(code) {
    const k1 = crypto.randomInt(25, 240);   // clave xor base
    const k2 = crypto.randomInt(3, 15);     // factor de desplazamiento
    const ROT = 17;                         // modulo de rotacion

    const buf = Buffer.from(code, "utf8");
    const out = Buffer.alloc(buf.length);

    for (let i = 0; i < buf.length; i++) {
        // clave que cambia byte a byte -> imposible fuerza bruta simple
        const k = (k1 + i * k2 + ((i * i) % 97)) & 0xff;
        let b = buf[i] ^ k;
        b = (b + (i % ROT)) & 0xff;
        out[i] = b;
    }

    // alfabeto hex aleatorio: cada byte = 2 simbolos de este set de 16
    const alphabet = shuffleString("0123456789abcdef");
    let encoded = "";
    for (const byte of out) {
        encoded += alphabet[byte >> 4] + alphabet[byte & 0x0f];
    }

    // inversion final
    const stream = encoded.split("").reverse().join("");

    // checksum sobre el stream transmitido (anti-tamper)
    let checksum = 0;
    for (let i = 0; i < stream.length; i++) {
        checksum = (checksum * 31 + stream.charCodeAt(i)) % 1000000007;
    }

    return { stream, alphabet, k1, k2, rot: ROT, checksum };
}

/* =========================================================================
   GENERADOR DE BASURA POLIMORFICA
   Ruido con nombres aleatorios y operaciones inutiles para inflar y
   confundir a los deobfuscadores basados en patrones.
   ========================================================================= */
function buildJunk(count) {
    let junk = "";
    for (let i = 0; i < count; i++) {
        const r = crypto.randomInt(0, 4);
        const nm = randName();
        if (r === 0) junk += `local ${nm} = ${crypto.randomInt(1000, 999999)} * ${crypto.randomInt(2, 9)};\n`;
        else if (r === 1) junk += `local ${nm} = "${crypto.randomBytes(4).toString("hex")}";\n`;
        else if (r === 2) junk += `local ${nm} = function() return ${crypto.randomInt(1, 999)} end;\n`;
        else junk += `local ${nm} = {${crypto.randomInt(1, 99)}, ${crypto.randomInt(1, 99)}, ${crypto.randomInt(1, 99)}};\n`;
    }
    return junk;
}

/* =========================================================================
   CONSTRUCTOR DEL LOADER LUA POLIMORFICO + ANTI-TAMPER + ANTI-DUMP
   ========================================================================= */
function buildLuaLoader(obf) {
    const N = buildNames([
        "stream", "alph", "k1", "k2", "rot", "csExpect",
        "gsub", "rev", "char", "byte", "sub", "tonum", "pcall", "concat", "bxor",
        "map", "decrypt", "bytes", "idx", "p", "cs", "i", "normal", "ch",
        "raw", "k", "unshift", "fin", "engine", "fn", "ok", "src", "guard", "mkmap", "a", "b"
    ]);

    const junk1 = buildJunk(crypto.randomInt(8, 16));
    const junk2 = buildJunk(crypto.randomInt(5, 10));

    return `--[[
   [ CODEVAULT PUBLIC SHIELD CORE V10 — POLYMORPHIC RUNTIME ]
   Cada entrega es unica. Cifrado por posicion + alfabeto aleatorio +
   integridad anti-tamper + limpieza anti-dump.
]]

${junk1}
local ${N.gsub}   = string.gsub
local ${N.rev}    = string.reverse
local ${N.char}   = string.char
local ${N.byte}   = string.byte
local ${N.sub}    = string.sub
local ${N.tonum}  = tonumber
local ${N.pcall}  = pcall
local ${N.concat} = table.concat
local ${N.bxor}   = (bit32 and bit32.bxor)

local ${N.stream}   = "${obf.stream}"
local ${N.alph}     = "${obf.alphabet}"
local ${N.k1}       = ${obf.k1}
local ${N.k2}       = ${obf.k2}
local ${N.rot}      = ${obf.rot}
local ${N.csExpect} = ${obf.checksum}

-- bxor de respaldo si el executor no expone bit32
local function ${N.bxor}_fb(${N.a}, ${N.b})
    local _p, _c = 1, 0
    while ${N.a} > 0 or ${N.b} > 0 do
        local _ra, _rb = ${N.a} % 2, ${N.b} % 2
        if _ra ~= _rb then _c = _c + _p end
        ${N.a}, ${N.b}, _p = (${N.a} - _ra) / 2, (${N.b} - _rb) / 2, _p * 2
    end
    return _c
end

-- ANTI-TAMPER: verifica integridad del stream antes de tocar nada
local ${N.cs} = 0
for ${N.i} = 1, #${N.stream} do
    ${N.cs} = (${N.cs} * 31 + ${N.byte}(${N.stream}, ${N.i})) % 1000000007
end
if ${N.cs} ~= ${N.csExpect} then
    return error("[CODEVAULT] integrity check failed")
end

${junk2}

-- mapa inverso del alfabeto aleatorio
local function ${N.mkmap}()
    local ${N.map} = {}
    for ${N.i} = 1, #${N.alph} do
        ${N.map}[${N.sub}(${N.alph}, ${N.i}, ${N.i})] = ${N.i} - 1
    end
    return ${N.map}
end

local function ${N.decrypt}()
    local ${N.map} = ${N.mkmap}()
    local ${N.normal} = ${N.rev}(${N.stream})
    local ${N.bytes} = {}
    local ${N.idx} = 0
    local ${N.bxor} = ${N.bxor} or ${N.bxor}_fb

    for ${N.i} = 1, #${N.normal}, 2 do
        local _hi = ${N.map}[${N.sub}(${N.normal}, ${N.i}, ${N.i})]
        local _lo = ${N.map}[${N.sub}(${N.normal}, ${N.i} + 1, ${N.i} + 1)]
        local ${N.raw} = _hi * 16 + _lo
        local ${N.p} = ${N.idx}

        -- revertir desplazamiento rotatorio
        local ${N.unshift} = (${N.raw} - (${N.p} % ${N.rot})) % 256
        -- revertir xor por posicion
        local ${N.k} = (${N.k1} + ${N.p} * ${N.k2} + ((${N.p} * ${N.p}) % 97)) % 256
        local ${N.fin} = ${N.bxor}(${N.unshift}, ${N.k})

        ${N.idx} = ${N.idx} + 1
        ${N.bytes}[${N.idx}] = ${N.char}(${N.fin})
    end

    return ${N.concat}(${N.bytes})
end

-- ruido de tiempo para despistar perfiladores estaticos
for ${N.i} = 1, 48 do local _ = math.sqrt(${N.i}) * math.sin(${N.i}) end

local ${N.ok}, ${N.src} = ${N.pcall}(${N.decrypt})

if ${N.ok} and ${N.src} and #${N.src} > 0 then
    local ${N.engine} = loadstring or load
    if type(${N.engine}) ~= "function" then
        return error("[CODEVAULT] no loader available")
    end
    local ${N.fn} = ${N.engine}(${N.src})
    if type(${N.fn}) ~= "function" then
        return error("[CODEVAULT] compile failed")
    end

    -- ANTI-DUMP: borra la fuente plana de memoria de inmediato
    ${N.src} = nil
    ${N.stream} = nil
    ${N.alph} = nil
    if collectgarbage then ${N.pcall}(collectgarbage, "collect") end

    ${N.fn}()

    -- segunda pasada de limpieza diferida
    if task and task.defer then
        task.defer(function()
            ${N.fn} = nil
            if collectgarbage then ${N.pcall}(collectgarbage, "collect") end
        end)
    else
        ${N.fn} = nil
    end
else
    return error("[CODEVAULT INTEGRITY ERROR]: Execution failed.")
end`;
}

/* =========================================================================
   RUTA PRINCIPAL DINAMICA
   ========================================================================= */
app.get("/raw/:id", async (req, res) => {
    try {
        let code = undefined;
        try {
            const response = await axios.get(`${REALTIME_DB_URL}/${req.params.id}.json`);
            if (response.data && response.data.code) code = response.data.code;
        } catch (e) { code = undefined; }

        const userAgent = req.headers["user-agent"] || "";
        const esExecutor =
            userAgent.includes("Roblox") ||
            userAgent.includes("Protocol") ||
            userAgent.includes("Executor") ||
            userAgent === "";

        // ---- FLUJO LUA ----
        if (esExecutor) {
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
            if (!code) return res.status(404).send("-- [CODEVAULT ERROR]: Script no registrado.");

            const obf = publicObfuscate(code);
            return res.send(buildLuaLoader(obf));
        }

        // ---- VISTA WEB (negro + barrido de luz plateada lento) ----
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(renderWebPage({
            title: "CodeVault — Secure Frame",
            heading: "CODEVAULT",
            sub: "SECURITY GATEWAY",
            statusLabel: "CONTENT",
            statusValue: code ? "PROTEGIDO EN CORES" : "NOT FOUND",
            statusOk: !!code,
            secondLabel: "BROWSER_ACCESS",
            secondValue: "BLOCKED_BY_POLICY",
            desc: code
                ? "El codigo plano de este script se encuentra encapsulado. El acceso directo via web esta restringido para prevenir fugas y rastreos de codigo."
                : "El identificador de recurso especificado no existe en la base de datos.",
            buttonText: "IR AL PANEL PRINCIPAL",
            buttonHref: "https://leeh10.github.io/CodeVault/index.html"
        }));
    } catch (error) {
        res.setHeader("Content-Type", "text/plain");
        return res.status(500).send("Security Gateway Error");
    }
});

/* =========================================================================
   PANEL WEB
   ========================================================================= */
app.get("/panel", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(renderWebPage({
        title: "CodeVault — Public Monitor",
        heading: "CODEVAULT",
        sub: "GLOBAL SYSTEM GATEWAY",
        statusLabel: "ENGINE_STATUS",
        statusValue: "PUBLIC_ROUTING_ONLINE",
        statusOk: true,
        secondLabel: "DISTRIBUTION",
        secondValue: "POLYMORPHIC_OBFUSCATION_V10",
        desc: "Servicio global activo. Los scripts solicitados desde entornos Lua se distribuyen en flujos cifrados polimorficos, unicos por peticion y con integridad anti-tamper.",
        buttonText: "SISTEMA OPERATIVO",
        buttonHref: "#"
    }));
});

/* =========================================================================
   PLANTILLA WEB — NEGRO CON BARRIDO DE LUZ PLATEADA LENTO
   ========================================================================= */
function renderWebPage(o) {
    const ok = o.statusOk;
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#050505">
<title>${o.title}</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
        --bg: #050505;
        --silver-1: #6e6e72;
        --silver-2: #cfd2d6;
        --silver-3: #f2f4f6;
        --line: rgba(207, 210, 214, 0.08);
    }
    body {
        background-color: var(--bg);
        color: #ffffff;
        font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
        display: grid;
        place-items: center;
        min-height: 100vh;
        overflow: hidden;
        position: relative;
    }
    /* Barrido de luz plateada que recorre lentamente toda la pantalla */
    body::before {
        content: '';
        position: fixed;
        inset: -50%;
        background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 38%,
            rgba(110, 110, 114, 0.06) 46%,
            rgba(207, 210, 214, 0.16) 50%,
            rgba(242, 244, 246, 0.22) 52%,
            rgba(207, 210, 214, 0.16) 54%,
            rgba(110, 110, 114, 0.06) 58%,
            transparent 66%,
            transparent 100%
        );
        background-size: 300% 300%;
        animation: sweep 14s linear infinite;
        pointer-events: none;
        z-index: 0;
    }
    /* Vineta sutil para profundidad */
    body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(circle at 50% 45%, transparent 0%, rgba(0,0,0,0.55) 100%);
        pointer-events: none;
        z-index: 0;
    }
    @keyframes sweep {
        0%   { background-position: 0% 0%; }
        100% { background-position: 200% 200%; }
    }
    .card {
        position: relative;
        z-index: 2;
        width: 92%;
        max-width: 460px;
        background: rgba(8, 8, 10, 0.92);
        border: 1px solid var(--line);
        padding: 42px 36px;
        border-radius: 16px;
        box-shadow: 0 40px 90px rgba(0,0,0,0.85), inset 0 1px 0 rgba(242,244,246,0.04);
        text-align: center;
        backdrop-filter: blur(6px);
        overflow: hidden;
    }
    /* Borde superior plateado animado */
    .card::before {
        content: '';
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 2px;
        background: linear-gradient(90deg, transparent, var(--silver-3), transparent);
        background-size: 200% 100%;
        animation: edge 6s linear infinite;
    }
    @keyframes edge {
        0%   { background-position: -100% 0; }
        100% { background-position: 200% 0; }
    }
    .title {
        font-size: 28px;
        font-weight: 900;
        letter-spacing: 6px;
        background: linear-gradient(90deg, var(--silver-1), var(--silver-3), var(--silver-1));
        background-size: 200% auto;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shine 5s linear infinite;
    }
    @keyframes shine {
        0%   { background-position: 0% center; }
        100% { background-position: 200% center; }
    }
    .subtitle {
        font-size: 9px;
        color: #54565c;
        letter-spacing: 6px;
        margin-top: 8px;
        font-weight: bold;
    }
    .status-box {
        padding: 14px 18px;
        background: rgba(207,210,214,0.02);
        border: 1px solid var(--line);
        border-left: 4px solid ${ok ? "var(--silver-2)" : "#dd3333"};
        font-size: 11px;
        text-align: left;
        margin: 26px 0;
        line-height: 1.8;
        border-radius: 6px;
    }
    .highlight {
        color: var(--silver-3);
        text-shadow: 0 0 12px rgba(207,210,214,0.35);
    }
    .muted { color: #dd3333; }
    .desc {
        font-size: 12.5px;
        color: #8a8f9e;
        line-height: 1.65;
        margin-bottom: 30px;
    }
    .btn-link {
        display: block;
        background: linear-gradient(90deg, var(--silver-2), var(--silver-3), var(--silver-2));
        background-size: 200% auto;
        color: #050505;
        text-align: center;
        padding: 14px;
        text-decoration: none;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 2px;
        border-radius: 8px;
        transition: transform 0.2s ease;
        animation: shine 5s linear infinite;
    }
    .btn-link:hover { transform: translateY(-1px); }
</style>
</head>
<body>
    <div class="card">
        <div class="title">${o.heading}</div>
        <div class="subtitle">${o.sub}</div>
        <div class="status-box">
            &gt; ${o.statusLabel}: <span class="${ok ? "highlight" : "muted"}">${o.statusValue}</span><br>
            &gt; ${o.secondLabel}: <span class="muted">${o.secondValue}</span>
        </div>
        <p class="desc">${o.desc}</p>
        <a href="${o.buttonHref}" class="btn-link">${o.buttonText}</a>
    </div>
</body>
</html>`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("CodeVault V10 polimorfico corriendo en el puerto " + PORT);
});
