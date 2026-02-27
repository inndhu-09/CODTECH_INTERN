// server.js
// Simple real-time chat server using Node.js, Express, and Socket.io

const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static frontend assets from root
app.use(express.static(__dirname));

// In-memory store for connected users (socket.id -> username)
const users = new Map();

/**
 * Helper to get a human-readable time string like "10:30 AM"
 */
function getTimeString() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Very simple rule-based chatbot responses.
 * For this internship-ready demo we keep logic small and readable.
 * - Special greetings when user says "hi" / "hello" / "hey"
 * - Special answers when user asks for the bot's name
 * - Emoji detection with appropriate responses
 * - Fallback echoes what the user said
 */

/**
 * Helper function to detect if a string contains emojis
 * Uses Unicode ranges for common emoji characters
 */
function containsEmoji(str) {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/u;
  return emojiRegex.test(str);
}

/**
 * Extract emojis from text and return appropriate bot response
 */
function getEmojiResponse(userText) {
  // Happy/positive emojis (😀😁😂🤣😊😍😎🤓🤩🥳)
  if (/[\u{1F600}-\u{1F64F}]/u.test(userText) || userText.includes('😀') || userText.includes('😁') || userText.includes('😂') || userText.includes('🤣') || userText.includes('😊') || userText.includes('😍') || userText.includes('😎') || userText.includes('🤓') || userText.includes('🤩') || userText.includes('🥳')) {
    const happyReplies = [
      "I love your positive energy! 😊",
      "You're in a great mood today! 😄",
      "That's awesome! Keep smiling! 😁",
      "Your happiness is contagious! 😃",
      "I'm glad you're happy! 😊",
      "That emoji says it all! 😄",
      "You're making me smile too! 😊"
    ];
    return happyReplies[Math.floor(Math.random() * happyReplies.length)];
  }

  // Thumbs up / approval (👍🙌)
  if (userText.includes('👍') || userText.includes('🙌')) {
    const approvalReplies = [
      "Thanks for the thumbs up! 👍",
      "I appreciate that! 🙌",
      "Right back at you! 👍",
      "Awesome! Glad you agree! 👍",
      "You got it! 👍"
    ];
    return approvalReplies[Math.floor(Math.random() * approvalReplies.length)];
  }

  // Fire / hot / amazing (🔥)
  if (userText.includes('🔥')) {
    const fireReplies = [
      "That's fire! 🔥",
      "You're on fire today! 🔥",
      "Absolutely lit! 🔥",
      "That's hot! 🔥",
      "You're burning it up! 🔥"
    ];
    return fireReplies[Math.floor(Math.random() * fireReplies.length)];
  }

  // Rocket / launch (🚀)
  if (userText.includes('🚀')) {
    const rocketReplies = [
      "Let's launch this project! 🚀",
      "To the moon! 🚀",
      "Blast off! 🚀",
      "Ready for takeoff! 🚀",
      "You're going places! 🚀"
    ];
    return rocketReplies[Math.floor(Math.random() * rocketReplies.length)];
  }

  // Lightbulb / idea (💡)
  if (userText.includes('💡')) {
    const ideaReplies = [
      "Great idea! 💡",
      "That's a bright thought! 💡",
      "I see what you did there! 💡",
      "Brilliant! 💡",
      "That's illuminating! 💡"
    ];
    return ideaReplies[Math.floor(Math.random() * ideaReplies.length)];
  }

  // Coffee (☕)
  if (userText.includes('☕')) {
    const coffeeReplies = [
      "Coffee time! ☕ Perfect for coding!",
      "I could use a cup too! ☕",
      "Nothing like a good coffee break! ☕",
      "Coffee and code, the perfect combo! ☕",
      "Stay caffeinated! ☕"
    ];
    return coffeeReplies[Math.floor(Math.random() * coffeeReplies.length)];
  }

  // Pizza (🍕)
  if (userText.includes('🍕')) {
    const pizzaReplies = [
      "Pizza! My favorite! 🍕",
      "Now I'm hungry! 🍕",
      "Pizza and coding go well together! 🍕",
      "That looks delicious! 🍕",
      "Can't go wrong with pizza! 🍕"
    ];
    return pizzaReplies[Math.floor(Math.random() * pizzaReplies.length)];
  }

  // Eyes / watching (👀)
  if (userText.includes('👀')) {
    const eyesReplies = [
      "I see you! 👀",
      "Keeping an eye on things! 👀",
      "I'm watching too! 👀",
      "Eyes on the prize! 👀",
      "I see what you mean! 👀"
    ];
    return eyesReplies[Math.floor(Math.random() * eyesReplies.length)];
  }

  // Brain / thinking (🧠)
  if (userText.includes('🧠')) {
    const brainReplies = [
      "Using that big brain! 🧠",
      "Smart thinking! 🧠",
      "That's some brain power! 🧠",
      "Mind over matter! 🧠",
      "You're a genius! 🧠"
    ];
    return brainReplies[Math.floor(Math.random() * brainReplies.length)];
  }

  // Checkmark / done (✅)
  if (userText.includes('✅')) {
    const checkReplies = [
      "Task completed! ✅",
      "Nice work! ✅",
      "You nailed it! ✅",
      "Perfect! ✅",
      "All set! ✅"
    ];
    return checkReplies[Math.floor(Math.random() * checkReplies.length)];
  }

  // 100 / perfect (💯)
  if (userText.includes('💯')) {
    const perfectReplies = [
      "That's 100% awesome! 💯",
      "Perfect score! 💯",
      "You're 100% right! 💯",
      "Absolutely perfect! 💯",
      "Full marks! 💯"
    ];
    return perfectReplies[Math.floor(Math.random() * perfectReplies.length)];
  }

  // Wave / hello (👋)
  if (userText.includes('👋')) {
    const waveReplies = [
      "Hello there! 👋",
      "Hey! 👋",
      "Waving back at you! 👋",
      "Hi! Nice to see you! 👋",
      "Hello! 👋"
    ];
    return waveReplies[Math.floor(Math.random() * waveReplies.length)];
  }

  // Any other emoji - generic response
  if (containsEmoji(userText)) {
    const genericEmojiReplies = [
      "I see you're expressive! 😊",
      "Nice emoji! 👍",
      "I like your style! 😄",
      "That's a cool emoji! 😎",
      "Emojis make everything better! 😊"
    ];
    return genericEmojiReplies[Math.floor(Math.random() * genericEmojiReplies.length)];
  }

  return null; // No emoji detected
}

function getBotReply(userText) {
  const text = String(userText || "").toLowerCase().trim();

  const greetingReplies = [
    "Hi there! How can I help you today?",
    "Hello! Great to see you here. What are you working on?",
    "Hey! 👋 How’s your day going?",
    "Hi! Ready to build something cool?",
    "Hello! Ask me anything about this chat app.",
    "Hey there! Need any help with your project?",
    "Hi! Nice to meet you. What would you like to talk about?",
    "Hello! I’m your friendly chat bot.",
    "Hey! Thanks for saying hi. 😊",
    "Hi! Let’s make this internship project awesome."
  ];

  const nameReplies = [
    "My name is ChatBot. Nice to meet you!",
    "I’m ChatBot, your friendly assistant in this chat.",
    "You can call me ChatBot. I live inside this project.",
    "My name is ChatBot, and I’m here to help with your internship app.",
    "I’m ChatBot – not human, but happy to chat!",
    "People here just call me ChatBot.",
    "The name’s ChatBot. What’s yours?",
    "I’m ChatBot, a tiny program running on your Node.js server.",
    "I go by ChatBot. Thanks for asking my name!",
    "ChatBot at your service. 😊"
  ];

  // Check for emojis first (highest priority)
  const emojiResponse = getEmojiResponse(userText);
  if (emojiResponse) {
    return emojiResponse;
  }

  if (
    text === "hi" ||
    text === "hello" ||
    text === "hey" ||
    text.startsWith("hi ") ||
    text.startsWith("hello ") ||
    text.startsWith("hey ")
  ) {
    const index = Math.floor(Math.random() * greetingReplies.length);
    return greetingReplies[index];
  }

  if (
    text.includes("your name") ||
    text === "what is your name" ||
    text === "who are you" ||
    text.includes("who are you") ||
    text.includes("name please")
  ) {
    const index = Math.floor(Math.random() * nameReplies.length);
    return nameReplies[index];
  }

  // Default: simple echo so the user always gets a response.
  return `You said: "${userText}"`;
}

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Handle when a user joins with a username
  socket.on("join", (username) => {
    const cleanName = String(username || "Anonymous").trim() || "Anonymous";
    users.set(socket.id, cleanName);

    // Notify this user with a welcome message
    socket.emit("systemMessage", {
      text: `Welcome to the chat, ${cleanName}!`,
      timestamp: getTimeString()
    });

    // Broadcast to others that a new user joined
    socket.broadcast.emit("systemMessage", {
      text: `${cleanName} joined the chat.`,
      timestamp: getTimeString()
    });
  });

  // Handle incoming chat messages
  socket.on("chatMessage", (messageText) => {
    const username = users.get(socket.id) || "Anonymous";
    const text = String(messageText || "").trim();
    if (!text) return;

    const payload = {
      username,
      text,
      timestamp: getTimeString()
    };

    // Emit user's message to all connected clients
    io.emit("chatMessage", payload);

    // Simple automatic reply so the user always gets a response.
    // In a real app this could call an API or implement more complex logic.
    const botReply = {
      username: "ChatBot",
      text: getBotReply(text),
      timestamp: getTimeString()
    };

    // Send the bot reply only to the sender for a more "direct reply" feeling.
    socket.emit("chatMessage", botReply);
  });

  // Handle client disconnect
  socket.on("disconnect", () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      io.emit("systemMessage", {
        text: `${username} left the chat.`,
        timestamp: getTimeString()
      });
    }
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

