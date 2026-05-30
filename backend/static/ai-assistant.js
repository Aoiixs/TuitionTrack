
// ================= AI Assistant Toggle =================

const aiToggle = document.getElementById("ai-toggle");
const chatbot = document.getElementById("ai-chatbot");
const overlay = document.getElementById("ai-overlay");

aiToggle.addEventListener("click", () => {

    if(chatbot.style.display === "flex"){

        chatbot.style.display = "none";
        overlay.style.display = "none";

    } else {

        chatbot.style.display = "flex";
        overlay.style.display = "block";
    }

});

overlay.addEventListener("click", () => {

    chatbot.style.display = "none";
    overlay.style.display = "none";

});


// ================= AI CHAT =================

const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("ai-input");
const chatBody = document.getElementById("chat-body");

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keypress", function(e){

    if(e.key === "Enter"){
        sendMessage();
    }

});


// ================= SEND MESSAGE =================

function sendMessage(){

    const message = input.value.trim();

    if(message === ""){
        return;
    }

    // ================= USER MESSAGE =================

    chatBody.innerHTML += `
        <div class="user-message">
            ${message}
        </div>
    `;

    input.value = "";

    chatBody.scrollTop = chatBody.scrollHeight;


    // ================= TYPING =================

    const typingDiv = document.createElement("div");

    typingDiv.classList.add("typing");

    typingDiv.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;

    chatBody.appendChild(typingDiv);

    chatBody.scrollTop = chatBody.scrollHeight;


    // ================= FETCH AI =================

    fetch("/ai-chat", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            message: message
        })

    })

    .then(response => response.json())
    .then(data => {

        // REMOVE TYPING
        typingDiv.remove();

        // ================= BOT MESSAGE =================

        chatBody.innerHTML += `
            <div class="bot-message">
                ${data.reply}
            </div>
        `;

        chatBody.scrollTop = chatBody.scrollHeight;

    })

    .catch(error => {

        typingDiv.remove();

        chatBody.innerHTML += `
            <div class="bot-message">
                Error connecting to AI server.
            </div>
        `;

    });

}

