const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") sendMessage();
});

// Add message in UI
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (message === "") return;

  addMessage(message, "user");
  userInput.value = "";

  // Temporary bot typing indication
  addMessage("Typing...", "bot");
  const typingElement = chatBox.lastChild;

  try {
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, userId: "user1" }) // ensure userId sent for session
    });

    const data = await res.json();
    typingElement.remove(); // remove typing indicator

    // Add bot reply
    addMessage(data.reply, "bot");

    // If link exists, show clickable redirect
    if (data.link) {
      const linkBtn = document.createElement("a");
      linkBtn.href = data.link;
      linkBtn.target = "_blank"; // open in new tab
      linkBtn.innerText = "Go to Section";
      linkBtn.classList.add("chat-link");
      chatBox.appendChild(linkBtn);
      chatBox.scrollTop = chatBox.scrollHeight;
    }

  } catch (err) {
    typingElement.remove();
    addMessage("Error: Backend not connected.", "bot");
  }
}
