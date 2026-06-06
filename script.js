async function saveScript(){

    const code = document.getElementById("code").value;

    if(!code.trim()){
        alert("Write a script first.");
        return;
    }

    const response = await fetch(
        "https://codevault-gvyn.onrender.com/save",
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                code:code
            })
        }
    );

    const data = await response.json();

    // Enlace para ver en la web
    const url = "https://leeh10.github.io/CodeVault/view.html?id=" + data.id;
    
    // Enlace RAW directo al backend para el loadstring
    const rawUrl = "https://codevault-gvyn.onrender.com/raw/" + data.id;
    
    // El comando ejecutable para Roblox
    const loadstringCommand = `loadstring(game:HttpGet("${rawUrl}"))()`;

    const result = document.getElementById("result");
    result.style.display = "block";

    // Mostramos ambos en la interfaz
    result.innerHTML = `
        <b>Script Saved Successfully!</b>
        <br><br>
        <span style="color:#888;">Web Link:</span><br>
        <span class="link">${url}</span>
        <br><br>
        <span style="color:#888;">Roblox Loadstring:</span><br>
        <span class="link" id="loadstring-text" style="color:#ff0055; font-size:12px;">${loadstringCommand}</span>
        <br><br>
        <button onclick="copyLoadstring('${loadstringCommand}')" style="padding: 6px 12px; font-size: 12px; background: #ff0055; color: white;">
            Copy Loadstring
        </button>
    `;
}

// Nueva función auxiliar para copiar el loadstring rápidamente
function copyLoadstring(text) {
    navigator.clipboard.writeText(text);
    alert("Loadstring copied to clipboard!");
}
