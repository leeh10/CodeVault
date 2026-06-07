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
        // Navegador Humano: Pasarela personalizada estilo Jnkie
        return res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CodeVault — Secure Gateway</title>
                <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
                <style>
                    body {
                        background: #080808;
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
                    body::before {
                        content: '';
                        position: absolute;
                        inset: 0;
                        background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
                        background-size: 24px 24px;
                        z-index: 1;
                    }
                    .gateway-card {
                        background: #0f0f0f;
                        border: 1px solid #242424;
                        padding: 40px 30px;
                        border-radius: 16px;
                        text-align: center;
                        max-width: 420px;
                        width: 90%;
                        z-index: 2;
                        box-shadow: 0 30px 60px rgba(0,0,0,0.6);
                    }
                    .badge {
                        background: rgba(255,255,255,0.03);
                        border: 1px solid #242424;
                        padding: 6px 14px;
                        border-radius: 30px;
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 11px;
                        color: #555;
                        display: inline-block;
                        margin-bottom: 24px;
                        letter-spacing: 0.05em;
                    }
                    h1 {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 32px;
                        font-weight: 700;
                        margin: 0 0 12px 0;
                        letter-spacing: -1px;
                    }
                    h1 span { color: #555; }
                    p {
                        color: #666;
                        font-size: 13.5px;
                        line-height: 1.6;
                        margin: 0 0 32px 0;
                    }
                    .btn-copy {
                        background: #ffffff;
                        color: #080808;
                        border: none;
                        padding: 14px;
                        font-weight: 600;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 13.5px;
                        transition: all 0.2s cubic-bezier(.16,1,.3,1);
                        width: 100%;
                    }
                    .btn-copy:hover {
                        background: #c8c8c8;
                        transform: translateY(-2px);
                    }
                </style>
            </head>
            <body>
                <div class="gateway-card">
                    <div class="badge">PROTECTED BY CODEVAULT</div>
                    <h1>Code<span>Vault</span></h1>
                    <p>Este script se encuentra protegido legítimamente para evitar su copia o filtración directa sin autorización.</p>
                    <button class="btn-copy" onclick="copyToClipboard()">Copy Script Code</button>
                </div>
                <script>
                    function copyToClipboard() {
                        const scriptCode = \`${code.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;
                        navigator.clipboard.writeText(scriptCode).then(() => {
                            const btn = document.querySelector('.btn-copy');
                            btn.textContent = 'Copied Successfully!';
                            btn.style.background = '#1c3d29';
                            btn.style.color = '#4caf50';
                            setTimeout(() => {
                                btn.textContent = 'Copy Script Code';
                                btn.style.background = '#ffffff';
                                btn.style.color = '#080808';
                            }, 2000);
                        });
                    }
                </script>
            </body>
            </html>
        `);
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running");
});
