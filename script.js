async function sendMessage() {
    const input = document.getElementById("user-input");
    const chatBox = document.getElementById("chat-box");
    const userText = input.value;
    
    if (!userText) return;

    chatBox.innerHTML += `<div class="msg user">${userText}</div>`;
    input.value = "";

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt + "\n" + userText }] }]
            })
        });

        const data = await response.json();
        const botMsg = data.candidates[0].content.parts[0].text;
        chatBox.innerHTML += `<div class="msg if">${botMsg}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) {
        chatBox.innerHTML += `<div class="msg if">aduh, ada error nih: ${e.message} 🗿</div>`;
    }
}
