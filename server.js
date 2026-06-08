const express = require("express");
const cors = require("cors");
const { v4: uuid } = require("uuid");
const axios = require("axios"); // Sistema ultra-estable para Render

const app = express();

app.use(cors());
app.use(express.json());

// Tu URL oficial de Realtime Database pública
const REALTIME_DB_URL = "https://codevault-9ca85-default-rtdb.firebaseio.com/scripts";

app.get("/", (req, res) => {
    res.send("API funcionando con Realtime Database y Axios Estable");
});

// RUTA PARA GUARDAR SCRIPTS
app.post("/save", async (req, res) => {
    try {
        const id = uuid();
        const scriptCode = req.body.code;

        if (!scriptCode) {
            return res.status(400).json({ success: false, error: "No code provided" });
        }

        const payload = {
            code: scriptCode,
            createdAt: new Date().toISOString()
        };

        // Guardado directo usando el método PUT de Axios hacia Firebase
        await axios.put(`${REALTIME_DB_URL}/${id}.json`, payload);

        res.json({ success: true, id });
    } catch (error) {
        console.error("Error al guardar en Realtime DB:", error.message);
        res.status(500).json({ success: false, error: "Error interno del servidor" });
    }
});

// RUTA EXCLUSIVA WEB RAW
app.get("/web/raw/:id", async (req, res) => {
    try {
        const response = await axios.get(`${REALTIME_DB_URL}/${req.params.id}.json`);
        const data = response.data;
        
        if (!data || !data.code) return res.status(404).send("Not Found");

        res.setHeader('Content-Type', 'text/plain');
        return res.send(data.code);
    } catch (error) {
        return res.status(500).send("Error al consultar la base de datos");
    }
});

// RUTA CON ESCUDO DE SEGURIDAD CYBERPUNK
app.get("/raw/:id", async (req, res) => {
    try {
        let code = undefined;
        
        try {
            const response = await axios.get(`${REALTIME_DB_URL}/${req.params.id}.json`);
            if (response.data && response.data.code) {
                code = response.data.code;
            }
        } catch (dbErr) {
            code = undefined;
        }
        
        const userAgent = req.headers['user-agent'] || '';
        const esExecutor = userAgent.includes('Roblox') || 
                           userAgent.includes('Protocol') || 
                           userAgent.includes('Executor') ||
                           userAgent === '';

        if (esExecutor) {
            if (!code) {
                res.setHeader('Content-Type', 'text/plain');
                return res.status(404).send("-- CodeVault Error: Script no encontrado.");
            }
            res.setHeader('Content-Type', 'text/plain');
            return res.send(code);
        } 
        
        const statusText = code ? "CÓDIGO PROTEGIDO" : "NOT FOUND / EXPIRADO";
        const statusClass = code ? "ok" : "danger";
        const descText = code 
            ? `Este script se encuentra protegido legítimamente bajo el entorno de CodeVault. El acceso web al código plano está deshabilitado para evitar su filtración.`
            : `El identificador de script solicitado no existe en la base de datos de Firebase.<br>Verifica que el ID en la URL sea correcto o genera un nuevo enlace desde el panel principal.`;

        return res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeVault — Protected Script</title>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:ital,wght=0,300;0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --bg: #000000;
            --surface: rgba(10,10,10,0.9);
            --border: rgba(255,255,255,0.07);
            --text: #ffffff;
            --text-muted: rgba(255,255,255,0.35);
            --accent: #ffffff;
            --red: #ff3b3b;
            --green: #00ff88;
        }
        html, body { height: 100%; background: var(--bg); color: var(--text); font-family: 'JetBrains Mono', monospace; overflow: hidden; }
        #bg-canvas { position: fixed; inset: 0; z-index: 0; opacity: 0.6; }
        .scanlines { position: fixed; inset: 0; z-index: 1; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px); pointer-events: none; }
        .vignette { position: fixed; inset: 0; z-index: 2; background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%); pointer-events: none; }
        .scene { position: relative; z-index: 10; height: 100vh; display: grid; place-items: center; padding: 20px; }
        .card { width: min(520px, 100%); background: var(--surface); border: 1px solid var(--border); border-radius: 2px; padding: 0; overflow: hidden; backdrop-filter: blur(24px); box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset, 0 80px 160px rgba(0,0,0,0.98); animation: cardIn 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes cardIn { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .card-topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02); }
        .topbar-dots { display: flex; gap: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.08); }
        .topbar-tag { font-size: 9px; letter-spacing: 0.2em; color: var(--text-muted); text-transform: uppercase; }
        .topbar-status { display: flex; align-items: center; gap: 6px; font-size: 9px; letter-spacing: 0.12em; color: ${code ? 'var(--green)' : 'var(--red)'}; }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: ${code ? 'var(--green)' : 'var(--red)'}; animation: pulse-status 1.4s ease-in-out infinite; }
        @keyframes pulse-status { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 ${code ? 'rgba(0,255,136,0.5)' : 'rgba(255,59,59,0.5)'}; } 50% { opacity: 0.6; box-shadow: 0 0 0 5px rgba(0,0,0,0); } }
        .card-body { padding: 44px 40px 40px; }
        .eyebrow { font-size: 9px; letter-spacing: 0.3em; color: var(--text-muted); text-transform: uppercase; margin-bottom: 16px; }
        .title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(56px, 12vw, 72px); letter-spacing: 3px; line-height: 0.92; color: var(--text); margin-bottom: 6px; }
        .title-sub { font-family: 'Bebas Neue', sans-serif; font-size: clamp(18px, 4vw, 22px); letter-spacing: 6px; color: var(--text-muted); margin-bottom: 32px; }
        .divider { height: 1px; background: var(--border); margin-bottom: 28px; }
        .terminal { background: #000; border: 1px solid var(--border); border-radius: 2px; padding: 16px 18px; font-size: 11px; line-height: 2; margin-bottom: 28px; position: relative; }
        .t-line { display: flex; gap: 10px; }
        .t-prompt { color: var(--text-muted); user-select: none; }
        .t-key { color: var(--text-muted); }
        .t-val { color: var(--text); font-weight: 700; }
        .t-val.danger { color: var(--red); }
        .t-val.ok { color: var(--green); }
        .desc { font-size: 11.5px; color: var(--text-muted); line-height: 1.9; margin-bottom: 32px; }
        .cta { display: block; width: 100%; padding: 15px 20px; background: var(--accent); color: #000; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none; text-align: center; border-radius: 2px; border: none; cursor: pointer; transition: all 0.25s cubic-bezier(0.16,1,0.3,1); }
        .cta:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(255,255,255,0.18); }
        .card-footer { padding: 14px 40px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.01); }
        .footer-text { font-size: 9px; letter-spacing: 0.12em; color: rgba(255,255,255,0.18); }
        .footer-id { font-size: 9px; color: rgba(255,255,255,0.12); font-style: italic; }
    </style>
</head>
<body>
<canvas id="bg-canvas"></canvas>
<div class="scanlines"></div>
<div class="vignette"></div>
<div class="scene">
    <div class="card">
        <div class="card-topbar">
            <div class="topbar-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
            <span class="topbar-tag">codevault.security</span>
            <div class="topbar-status"><div class="status-dot"></div>${code ? 'ACCESS DENIED' : 'VALIDATION FAILED'}</div>
        </div>
        <div class="card-body">
            <div class="eyebrow">// codevault security</div>
            <div class="title">Code</div>
            <div class="title-sub">V A U L T</div>
            <div class="divider"></div>
            <div class="terminal">
                <div class="t-line"><span class="t-prompt">&gt;</span><span class="t-key">STATUS</span><span class="t-val ${statusClass}">${statusText}</span></div>
                <div class="t-line"><span class="t-prompt">&gt;</span><span class="t-key">ACCESS</span><span class="t-val danger">WEB_BLOCKED</span></div>
                <div class="t-line"><span class="t-
