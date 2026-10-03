const chatBox = document.getElementById("chatBox");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatHome = document.getElementById("chatHome");

function addMessage(text, className) {
    const div = document.createElement("div");
    div.className = "message " + className;
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function quickPrompt(text) {
    input.value = text;
    sendMessage();
}

async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    chatHome.style.display = "none";

    addMessage(message, "user-msg");
    input.value = "";

    const typing = document.createElement("div");
    typing.className = "message bot-msg";
    typing.innerText = "Typing...";
    chatBox.appendChild(typing);

    try {
        const res = await fetch("http://localhost:5000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        const data = await res.json();

        typing.remove();

        // structured formatting
        addMessage(formatResponse(data.reply), "bot-msg");

    } catch (err) {
        typing.innerText = "Error connecting server";
    }
}

function formatResponse(text) {
    return text
        .replace(/\n/g, "\n\n") // spacing
        .replace(/•/g, "\n• "); // bullet alignment
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});