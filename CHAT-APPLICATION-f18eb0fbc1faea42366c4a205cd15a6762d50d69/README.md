# CHAT-APPLICATION

**COMPANY**: CODTECH IT SOLUTIONS

**NAME**: KHIROD KHAGESHWAR BEHERA

**INTERN ID**: CTIS4005

**DOMAIN**: FULL STACK WEB DEVELOPMENT

**DURATION**: 4 WEEKS

**MENTOR**: NEELA SANTOSH KUMAR

---

## DESCRIPTION OF TASK PERFORMED

### Overview
For the second task of my Full Stack Web Development internship, I developed a **CHAT-APPLICATION**. The primary objective was to move beyond standard stateless HTTP requests and implement a bi-directional communication system where data flows instantly between the client and server. This project demonstrates the practical application of **WebSockets** using the Node.js ecosystem to create a seamless messaging experience without the need for page refreshing.

### Backend Architecture (Node.js & Socket.io)
The core "engine" of the application is built using **Node.js** with the **Express** framework serving the static frontend files. However, the critical functionality is powered by **Socket.io**, a library that enables real-time, event-based communication.
* **Event-Driven Logic:** In `server.js`, I set up an event listener `io.on('connection')`. Unlike a standard REST API that waits for a request to send a response, this open connection allows the server to push data to clients actively.
* **User State Management:** I implemented an in-memory data structure using a JavaScript `Map()` to track connected users. When a specific socket ID connects, it is mapped to a username provided by the client. This ensures that even though WebSockets are persistent, we can identify *who* is sending a message.
* **Broadcasting:** A key feature I implemented is the distinction between `socket.emit` (sending to the sender only) and `socket.broadcast.emit` (sending to everyone *else*). This logic is used for "System Messages," such as notifying the group when a new user has joined or left the chat room.

### Frontend Implementation (Vanilla JS & Tailwind)
For the user interface, I prioritized speed and responsiveness. I used **Tailwind CSS (via CDN)** to construct a modern, mobile-friendly layout featuring a "Glassmorphism" aesthetic (using `backdrop-blur` and semi-transparent slate colors).
* **DOM Manipulation:** In `public/js/main.js`, I avoided heavy frontend frameworks to demonstrate raw DOM manipulation skills. Functions like `addChatMessage()` dynamically create HTML elements (`div`, `span`) and inject them into the chat container.
* **User Experience (UX):** I implemented a modal overlay (`usernameOverlay`) that forces users to identify themselves before entering. Once inside, the chat window includes an auto-scroll utility (`scrollToBottom`) that ensures the view always snaps to the latest message, mimicking professional chat apps like WhatsApp or Discord.
* **Emoji Integration:** To add a "human touch," I built a custom emoji picker using a hidden `div` grid. When an emoji is clicked, it appends the character to the input field programmatically, enhancing the interactivity of the application.

### Key Learnings & Challenges
The biggest challenge in this task was understanding the lifecycle of a WebSocket connection. Unlike HTTP, where a request ends after a response, a socket remains open. I had to learn how to handle "disconnect" events gracefully to prevent "ghost" users from remaining in the system. Additionally, formatting timestamps on the server side (`getTimeString`) before broadcasting ensured that all users saw the exact time a message was received by the server, synchronizing the conversation timeline across different time zones.

This project bridged the gap between my theoretical knowledge of networking protocols and practical full-stack implementation, providing a solid foundation for building more complex real-time tools like collaborative editors or multiplayer games.

---

## OUTPUTS

<img width="1920" height="1020" alt="Image" src="https://github.com/user-attachments/assets/9bca6bb7-f590-421f-9559-4fd05c7632fe" />

---

## HOW TO RUN
1.  **Install Node.js:** Ensure Node.js is installed on your machine.
2.  **Navigate to Folder:** Open your terminal and move to the project directory:
    ```bash
    cd CHAT-APPLICATION
    ```
3.  **Install Dependencies:** Run the following command to install Express and Socket.io:
    ```bash
    npm install
    ```
4.  **Start the Server:**
    ```bash
    npm start
    ```
5.  **Access the App:** Open your web browser and go to `http://localhost:3000`.
    * *Tip: Open the URL in two different browser tabs to test sending messages between two users.*
