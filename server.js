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
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --bg: #000000;
            --surface: rgba(10,10,10,0.9);
            --border: rgba(255,255,255,0.07);
            --border-hover: rgba(255,255,255,0.15);
            --text: #ffffff;
            --text-muted: rgba(255,255,255,0.35);
            --text-dim: rgba(255,255,255,0.55);
            --accent: #ffffff;
            --red: #ff3b3b;
            --green: #00ff88;
        }

        html, body {
            height: 100%;
            background: var(--bg);
            color: var(--text);
            font-family: 'JetBrains Mono', monospace;
            overflow: hidden;
        }

        /* ── CANVAS ── */
        #bg-canvas {
            position: fixed;
            inset: 0;
            z-index: 0;
            opacity: 0.6;
        }

        /* ── SCAN LINE OVERLAY ── */
        .scanlines {
            position: fixed;
            inset: 0;
            z-index: 1;
            background: repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0,0,0,0.03) 2px,
                rgba(0,0,0,0.03) 4px
            );
            pointer-events: none;
        }

        /* ── VIGNETTE ── */
        .vignette {
            position: fixed;
            inset: 0;
            z-index: 2;
            background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%);
            pointer-events: none;
        }

        /* ── LAYOUT ── */
        .scene {
            position: relative;
            z-index: 10;
            height: 100vh;
            display: grid;
            place-items: center;
            padding: 20px;
        }

        /* ── CARD ── */
        .card {
            width: min(520px, 100%);
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 2px;
            padding: 0;
            overflow: hidden;
            backdrop-filter: blur(24px);
            box-shadow:
                0 0 0 1px rgba(255,255,255,0.03) inset,
                0 80px 160px rgba(0,0,0,0.98),
                0 0 120px rgba(255,255,255,0.015);
            animation: cardIn 0.9s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes cardIn {
            from { opacity: 0; transform: translateY(40px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        /* ── CARD TOP BAR ── */
        .card-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 18px;
            border-bottom: 1px solid var(--border);
            background: rgba(255,255,255,0.02);
        }

        .topbar-dots {
            display: flex;
            gap: 6px;
        }

        .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(255,255,255,0.08);
        }

        .topbar-tag {
            font-size: 9px;
            letter-spacing: 0.2em;
            color: var(--text-muted);
            text-transform: uppercase;
        }

        .topbar-status {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 9px;
            letter-spacing: 0.12em;
            color: var(--red);
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--red);
            animation: pulse-red 1.4s ease-in-out infinite;
        }

        @keyframes pulse-red {
            0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255,59,59,0.5); }
            50%       { opacity: 0.6; box-shadow: 0 0 0 5px rgba(255,59,59,0); }
        }

        /* ── CARD BODY ── */
        .card-body {
            padding: 44px 40px 40px;
        }

        /* ── EYEBROW ── */
        .eyebrow {
            font-size: 9px;
            letter-spacing: 0.3em;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-bottom: 16px;
            animation: fadeUp 0.8s 0.15s both;
        }

        /* ── TITLE ── */
        .title {
            font-family: 'Bebas Neue', sans-serif;
            font-size: clamp(56px, 12vw, 72px);
            letter-spacing: 3px;
            line-height: 0.92;
            color: var(--text);
            margin-bottom: 6px;
            animation: fadeUp 0.8s 0.2s both;
        }

        .title-sub {
            font-family: 'Bebas Neue', sans-serif;
            font-size: clamp(18px, 4vw, 22px);
            letter-spacing: 6px;
            color: var(--text-muted);
            margin-bottom: 32px;
            animation: fadeUp 0.8s 0.25s both;
        }

        /* ── DIVIDER ── */
        .divider {
            height: 1px;
            background: var(--border);
            margin-bottom: 28px;
            animation: expandLine 0.8s 0.3s both;
            transform-origin: left;
        }

        @keyframes expandLine {
            from { transform: scaleX(0); opacity: 0; }
            to   { transform: scaleX(1); opacity: 1; }
        }

        /* ── TERMINAL BOX ── */
        .terminal {
            background: #000;
            border: 1px solid var(--border);
            border-radius: 2px;
            padding: 16px 18px;
            font-size: 11px;
            line-height: 2;
            margin-bottom: 28px;
            animation: fadeUp 0.8s 0.35s both;
            position: relative;
            overflow: hidden;
        }

        .terminal::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
        }

        .t-line {
            display: flex;
            gap: 10px;
        }

        .t-prompt {
            color: var(--text-muted);
            user-select: none;
        }

        .t-key {
            color: var(--text-muted);
        }

        .t-val {
            color: var(--text);
            font-weight: 700;
        }

        .t-val.danger {
            color: var(--red);
        }

        .t-val.ok {
            color: var(--green);
        }

        /* ── DESC ── */
        .desc {
            font-size: 11.5px;
            color: var(--text-muted);
            line-height: 1.9;
            margin-bottom: 32px;
            animation: fadeUp 0.8s 0.4s both;
        }

        /* ── CTA ── */
        .cta {
            display: block;
            width: 100%;
            padding: 15px 20px;
            background: var(--accent);
            color: #000;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            text-decoration: none;
            text-align: center;
            border-radius: 2px;
            border: none;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
            animation: fadeUp 0.8s 0.45s both;
            position: relative;
            overflow: hidden;
        }

        .cta::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
            transform: translateX(-100%);
            transition: transform 0.5s ease;
        }

        .cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(255,255,255,0.18);
        }

        .cta:hover::after {
            transform: translateX(100%);
        }

        .cta:active {
            transform: translateY(0);
        }

        /* ── FOOTER ── */
        .card-footer {
            padding: 14px 40px;
            border-top: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(255,255,255,0.01);
            animation: fadeUp 0.8s 0.5s both;
        }

        .footer-text {
            font-size: 9px;
            letter-spacing: 0.12em;
            color: rgba(255,255,255,0.18);
        }

        .footer-id {
            font-size: 9px;
            color: rgba(255,255,255,0.12);
            font-style: italic;
        }

        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>

<canvas id="bg-canvas"></canvas>
<div class="scanlines"></div>
<div class="vignette"></div>

<div class="scene">
    <div class="card">

        <!-- TOP BAR -->
        <div class="card-topbar">
            <div class="topbar-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
            <span class="topbar-tag">codevault.security</span>
            <div class="topbar-status">
                <div class="status-dot"></div>
                ACCESS DENIED
            </div>
        </div>

        <!-- BODY -->
        <div class="card-body">
            <div class="eyebrow">// script protected</div>
            <div class="title">Code</div>
            <div class="title-sub">V A U L T</div>

            <div class="divider"></div>

            <div class="terminal">
                <div class="t-line">
                    <span class="t-prompt">&gt;</span>
                    <span class="t-key">STATUS</span>
                    <span class="t-val danger">PROTECTED</span>
                </div>
                <div class="t-line">
                    <span class="t-prompt">&gt;</span>
                    <span class="t-key">ACCESS</span>
                    <span class="t-val danger">WEB_BLOCKED</span>
                </div>
                <div class="t-line">
                    <span class="t-prompt">&gt;</span>
                    <span class="t-key">EXECUTOR</span>
                    <span class="t-val ok">AUTHORIZED ✓</span>
                </div>
                <div class="t-line">
                    <span class="t-prompt">&gt;</span>
                    <span class="t-key">PROTOCOL</span>
                    <span class="t-val">CODEVAULT/2.0</span>
                </div>
            </div>

            <p class="desc">
                Este script está cifrado y custodiado por CodeVault.<br>
                El acceso directo desde navegador está bloqueado.<br>
                Úsalo desde tu executor — el enlace funciona correctamente.
            </p>

            <a href="https://leeh10.github.io/CodeVault/index.html" class="cta">
                → Subir tus propios scripts
            </a>
        </div>

        <!-- FOOTER -->
        <div class="card-footer">
            <span class="footer-text">© 2025 CODEVAULT — ALL RIGHTS RESERVED</span>
            <span class="footer-id">enc://cv-secure</span>
        </div>

    </div>
</div>

<script>
// ── CANVAS NETWORK ──
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');
let W, H, nodes = [];
const COUNT    = 80;
const MAX_DIST = 130;

function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
}

class Node {
    constructor() { this.reset(true); }
    reset(rand) {
        this.x  = rand ? Math.random() * W : (Math.random() < 0.5 ? 0 : W);
        this.y  = rand ? Math.random() * H : Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.r  = Math.random() * 1.4 + 0.4;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > W) this.vx *= -1;
        if (this.y < 0 || this.y > H) this.vy *= -1;
    }
}

resize();
for (let i = 0; i < COUNT; i++) nodes.push(new Node());
window.addEventListener('resize', resize);

function draw() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < nodes.length; i++) {
        nodes[i].update();
        for (let j = i + 1; j < nodes.length; j++) {
            const dx   = nodes[i].x - nodes[j].x;
            const dy   = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MAX_DIST) {
                const a = (1 - dist / MAX_DIST) * 0.14;
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.strokeStyle = `rgba(255,255,255,${a})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }

    for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fill();
    }

    requestAnimationFrame(draw);
}

draw();
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
