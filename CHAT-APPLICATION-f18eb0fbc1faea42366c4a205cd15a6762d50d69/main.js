// public/js/main.js
// Frontend logic for the real-time chat app using vanilla JavaScript and Socket.io

// Connect to the Socket.io server
const socket = io();

// DOM elements
const messagesEl = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

const usernameOverlay = document.getElementById("usernameOverlay");
const usernameForm = document.getElementById("usernameForm");
const usernameInput = document.getElementById("usernameInput");

const emojiToggle = document.getElementById("emojiToggle");
const emojiPanel = document.getElementById("emojiPanel");

/**
 * Utility: Auto-scroll the messages container to the bottom whenever a new
 * message is added so the latest content is always visible.
 */
function scrollToBottom() {
  if (!messagesEl) return;
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/**
 * Render a normal chat message.
 * @param {{ username: string, text: string, timestamp: string }} payload
 */
function addChatMessage(payload) {
  const wrapper = document.createElement("div");
  wrapper.className = "flex flex-col gap-0.5";

  const meta = document.createElement("div");
  meta.className = "flex items-baseline gap-2 text-xs";

  const nameEl = document.createElement("span");
  nameEl.className = "font-semibold text-emerald-300";
  nameEl.textContent = payload.username || "Anonymous";

  const timeEl = document.createElement("span");
  timeEl.className = "text-[11px] text-slate-500";
  timeEl.textContent = payload.timestamp || "";

  meta.appendChild(nameEl);
  meta.appendChild(timeEl);

  const bubble = document.createElement("div");
  bubble.className =
    "inline-block max-w-[80%] rounded-2xl bg-slate-700/80 px-3 py-1.5 text-sm text-slate-50 shadow-sm";
  bubble.textContent = payload.text;

  wrapper.appendChild(meta);
  wrapper.appendChild(bubble);

  messagesEl.appendChild(wrapper);
  scrollToBottom();
}

/**
 * Render a system message like "user joined" or "user left".
 * @param {{ text: string, timestamp: string }} payload
 */
function addSystemMessage(payload) {
  const wrapper = document.createElement("div");
  wrapper.className = "flex items-center justify-center my-1";

  const pill = document.createElement("div");
  pill.className =
    "inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-slate-600 px-3 py-1 text-[11px] text-slate-300";

  const textEl = document.createElement("span");
  textEl.textContent = payload.text || "";

  const timeEl = document.createElement("span");
  timeEl.className = "text-[10px] text-slate-500";
  timeEl.textContent = payload.timestamp || "";

  pill.appendChild(textEl);
  pill.appendChild(timeEl);
  wrapper.appendChild(pill);

  messagesEl.appendChild(wrapper);
  scrollToBottom();
}

// Handle username selection
usernameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) {
    usernameInput.focus();
    return;
  }

  // Send username to server
  socket.emit("join", username);

  // Hide overlay
  usernameOverlay.classList.add("hidden");
});

// Send message
messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) {
    messageInput.focus();
    return;
  }

  socket.emit("chatMessage", text);
  messageInput.value = "";
  messageInput.focus();
});

// Allow sending message with Enter + prevent newline (Shift+Enter for newline)
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    messageForm.dispatchEvent(new Event("submit"));
  }
});

// Emoji picker toggle
emojiToggle.addEventListener("click", () => {
  const isHidden = emojiPanel.classList.contains("hidden");
  if (isHidden) {
    emojiPanel.classList.remove("hidden");
  } else {
    emojiPanel.classList.add("hidden");
  }
});

// Close emoji panel when clicking outside
document.addEventListener("click", (event) => {
  if (
    !emojiPanel.contains(event.target) &&
    event.target !== emojiToggle &&
    !emojiToggle.contains(event.target)
  ) {
    emojiPanel.classList.add("hidden");
  }
});

// Append emoji to input when clicked
emojiPanel.querySelectorAll(".emoji-btn").forEach((btn) => {
  btn.classList.add(
    "w-8",
    "h-8",
    "flex",
    "items-center",
    "justify-center",
    "rounded-lg",
    "hover:bg-slate-700",
    "cursor-pointer"
  );
  btn.addEventListener("click", () => {
    const emoji = btn.textContent || "";
    messageInput.value += emoji;
    messageInput.focus();
  });
});

// Socket.io event handlers
socket.on("chatMessage", (payload) => {
  addChatMessage(payload);
});

socket.on("systemMessage", (payload) => {
  addSystemMessage(payload);
});

