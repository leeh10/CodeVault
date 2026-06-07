const express = require("express");
const cors = require("cors");
const { v4: uuid } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const scripts = {};

app.get("/", (req, res) => {
    res.send("API funcionando");
});

app.post("/save", (req, res) => {
    const id = uuid();
    scripts[id] = req.body.code;
    res.json({
        success: true,
        id
    });
});

app.get("/raw/:id", (req, res) => {
    const code = scripts[req.params.id];

    if (!code) {
        return res.status(404).send("Not Found");
    }

    // Identificamos quién está solicitando el link
    const userAgent = req.headers['user-agent'] || '';

    // Filtro inteligente para detectar exploits de Roblox
    const esExecutor = userAgent.includes('Roblox') || 
                       userAgent.includes('Protocol') || 
                       userAgent.includes('Executor') ||
                       userAgent === '';

    if (esExecutor) {
        // Ejecutor de Roblox: Código Lua plano e instantáneo
        res.setHeader('Content-Type', 'text/plain');
        return res.send(code);
    } else {
        // Navegador Humano: Advertencia agresiva contra filtraciones (Cero acceso al código)
        return res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CodeVault — Access Denied</title>
                <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
                <style>
                    body {
                        background: #050505;
                        color: #f0f0f0;
                        font-family: 'Space Grotesk', sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        overflow: hidden;
                        position: relative;
                    }
                    /* Rejilla de fondo estética futurista cyberpunk */
                    body::before {
                        content: '';
                        position: absolute;
                        inset: 0;
                        background-image: linear-gradient(rgba(255, 0, 0, 0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 0, 0.01) 1px, transparent 1px);
                        background-size: 30px 30px;
                        z-index: 1;
                    }
                    /* Brillo ambiental rojo de advertencia de fondo */
                    body::after {
                        content: '';
                        position: absolute;
                        width: 300px;
                        height: 300px;
                        background: rgba(255, 0, 0, 0.04);
                        border-radius: 50%;
                        filter: blur(120px);
                        z-index: 1;
                    }
                    .gateway-card {
                        background: #0a0a0a;
                        border: 1px solid #1f1414;
                        padding: 50px 40px;
                        border-radius: 16px;
                        text-align: center;
                        max-width: 440px;
                        width: 90%;
                        z-index: 2;
                        box-shadow: 0 40px 80px rgba(0,0,0,0.8);
                        position: relative;
                        animation: flashBorder 4s infinite alternate;
                    }
                    @keyframes flashBorder {
                        0% { border-color: #1f1414; }
                        100% { border-color: #3d1414; }
                    }
                    .badge {
                        background: rgba(255, 68, 68, 0.04);
                        border: 1px solid rgba(255, 68, 68, 0.15);
                        padding: 6px 14px;
                        border-radius: 6px;
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 11px;
                        color: #ff4444;
                        display: inline-block;
                        margin-bottom: 28px;
                        letter-spacing: 0.1em;
                        font-weight: 700;
                    }
                    h1 {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 34px;
                        font-weight: 700;
                        margin: 0 0 16px 0;
                        letter-spacing: -1.5px;
                    }
                    h1 span { color: #333; }
                    p {
                        color: #777;
                        font-size: 14px;
                        line-height: 1.6;
                        margin: 0 0 32px 0;
                    }
                    .info-box {
                        background: #0f0f0f;
                        border: 1px solid #1a1a1a;
                        border-radius: 10px;
                        padding: 16px;
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 12px;
                        color: #aaa;
                        text-align: left;
                        line-height: 1.5;
                    }
                    .info-box span {
                        color: #ff4444;
                        font-weight: 700;
                    }
                </style>
            </head>
            <body>
                <div class="gateway-card">
                    <div class="badge">SECURE SYSTEM ALERT</div>
                    <h1>Code<span>Vault</span></h1>
                    <p>Has intentado acceder a un script protegido. Por motivos de seguridad y encriptación de credenciales, No lo intentes :)</p>
                    <div class="info-box">
                        > <span>ACCESO DENEGADO</span><br>
                        > Ejecuta el script usando el comando loadstring correspondiente en tu executor móvil o PC.
                    </div>
                </div>
            </body>
            </html>
        `);
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running");
});
