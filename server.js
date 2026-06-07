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

// NUEVA RUTA: Exclusiva para que tu interfaz web (view.html) lea el código limpio
app.get("/web/raw/:id", (req, res) => {
    const code = scripts[req.params.id];

    if (!code) {
        return res.status(404).send("Not Found");
    }

    // Devuelve siempre el script Lua limpio para tu editor
    res.setHeader('Content-Type', 'text/plain');
    return res.send(code);
});

// Mantiene la protección original intacta para el resto del mundo
app.get("/raw/:id", (req, res) => {
    const code = scripts[req.params.id];

    if (!code) {
        return res.status(404).send("Not Found");
    }

    const userAgent = req.headers['user-agent'] || '';

    const esExecutor = userAgent.includes('Roblox') || 
                       userAgent.includes('Protocol') || 
                       userAgent.includes('Executor') ||
                       userAgent === '';

    if (esExecutor) {
        res.setHeader('Content-Type', 'text/plain');
        return res.send(code);
    } else {
        return res.send(`
            <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeVault — Protected Script</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: #050505;
            color: #ffffff;
            font-family: 'Space Grotesk', sans-serif;
            height: 100vh;
            overflow: hidden;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Vídeo de fondo */
        #bg-video {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            object-fit: cover;
            z-index: 1;
            filter: brightness(0.6) contrast(1.1);
        }

        /* Capa oscura para que el texto resalte */
        .overlay {
            position: absolute;
            inset: 0;
            background: rgba(5, 5, 5, 0.75);
            z-index: 2;
        }

        .particles {
            position: absolute;
            inset: 0;
            z-index: 3;
            pointer-events: none;
            background-image: 
                radial-gradient(circle at 20% 30%, rgba(255,255,255,0.03) 1px, transparent 1px),
                radial-gradient(circle at 75% 15%, rgba(255,255,255,0.02) 2px, transparent 2px),
                radial-gradient(circle at 40% 70%, rgba(255,255,255,0.025) 1.5px, transparent 1px);
            background-size: 180px 180px;
            animation: floatBg 25s linear infinite;
        }

        @keyframes floatBg {
            0% { background-position: 0 0; }
            100% { background-position: 200px 200px; }
        }

        .gateway-card {
            background: rgba(11, 11, 11, 0.95);
            border: 1px solid #1f1f1f;
            padding: 45px 35px;
            border-radius: 16px;
            text-align: center;
            max-width: 440px;
            width: 90%;
            z-index: 4;
            box-shadow: 0 30px 80px rgba(0,0,0,0.9);
            backdrop-filter: blur(8px);
        }

        .badge {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid #2a2a2a;
            padding: 6px 14px;
            border-radius: 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #888;
            display: inline-block;
            margin-bottom: 24px;
            letter-spacing: 0.1em;
        }

        h1 {
            font-family: 'JetBrains Mono', monospace;
            font-size: 34px;
            font-weight: 700;
            margin: 0 0 14px 0;
            letter-spacing: -1.8px;
        }

        h1 span { color: #4a4a4a; }

        p {
            color: #aaa;
            font-size: 14.5px;
            line-height: 1.65;
            margin: 0 0 28px 0;
        }

        .info-box {
            background: #0a0a0a;
            border: 1px solid #1a1a1a;
            border-radius: 8px;
            padding: 16px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12.5px;
            color: #666;
            text-align: left;
            line-height: 1.65;
            margin-bottom: 32px;
        }

        .info-box span {
            color: #00ff9d;
            font-weight: 700;
        }

        .btn-cta {
            background: #ffffff;
            color: #050505;
            border: none;
            padding: 15px 24px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.25s ease;
            width: 100%;
            display: inline-block;
            text-decoration: none;
        }

        .btn-cta:hover {
            background: #e0e0e0;
            transform: translateY(-3px);
            box-shadow: 0 12px 30px rgba(255,255,255,0.12);
        }

        /* Responsivo */
        @media (max-width: 480px) {
            .gateway-card { padding: 35px 25px; }
            h1 { font-size: 28px; }
        }
    </style>
</head>
<body>
    <!-- Vídeo de fondo (reemplaza la URL con la tuya) -->
    <video id="bg-video" autoplay loop muted playsinline>
        <source src="https://freestockfootagearchive.com/wp-content/uploads/2020/10/Cyberpunk-Glitch-Motion-Background-Effect-Loop.mp4" type="video/mp4">
        <!-- Alternativa GIF si no quieres vídeo -->
        <!-- <img src="TU-GIF.gif" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:1; filter: brightness(0.6);" alt=""> -->
    </video>

    <div class="overlay"></div>
    <div class="particles"></div>

    <div class="gateway-card">
        <div class="badge">CODEVAULT SECURITY</div>
        <h1>Code<span>Vault</span></h1>
        <p>Este script se encuentra protegido legítimamente bajo el entorno de CodeVault. El acceso web al código plano está deshabilitado para evitar su filtración.</p>
        
        <div class="info-box">
            > STATUS: <span>CÓDIGO PROTEGIDO</span><br>
            > El ejecutor interpretará este enlace de manera correcta.
        </div>
        
        <a href="https://leeh10.github.io/CodeVault/index.html" class="btn-cta">
            ¿Quieres subir tus propios scripts? Dale aquí
        </a>
    </div>

    <script>
        // Fallback: si el vídeo falla, puedes poner un GIF aquí
        const video = document.getElementById('bg-video');
        video.addEventListener('error', () => {
            console.log('Vídeo no disponible. Usa un GIF como fallback.');
        });
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
