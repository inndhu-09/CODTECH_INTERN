# REAL-TIME-COLLABORATIVE-DOCUMENT-EDITOR

**COMPANY**: CODTECH IT SOLUTIONS

**NAME**: KHIROD KHAGESHWAR BEHERA

**INTERN ID**: CTIS4005

**DOMAIN**: FULL STACK WEB DEVELOPMENT

**DURATION**: 4 WEEKS

**MENTOR**: NEELA SANTOSH KUMAR

---

## DESCRIPTION OF TASK PERFORMED

### Overview
For the third task of my Full Stack Web Development internship, I developed a **Real-Time Collaborative Document Editor**. This project is a sophisticated web application that allows multiple users to edit the same text document simultaneously, with changes reflecting across all connected screens instantly. The primary objective was to implement a complex synchronization system using **WebSockets** and **React.js**, simulating the core functionality of professional platforms like Google Docs. This project demonstrates a deep understanding of the MERN stack and real-time data handling.

### Technical Architecture & State Management
The application is built using a modern full-stack approach to ensure high performance and data persistence. 
* **Frontend (React & Quill.js)**: I utilized React for its efficient component-based architecture and state management capabilities. For the rich-text editing interface, I integrated **Quill.js**. Quill is essential for this task because it represents text changes as "Deltas"—small JSON objects that describe specific edits (e.g., "insert 'A' at index 5"). This is far more efficient than sending the entire document text over the network for every keystroke. Using React hooks like `useEffect`, I managed the lifecycle of the editor and the socket connection.
* **Backend (Node.js & Socket.io)**: The server acts as a central hub for all document traffic. Using **Socket.io**, I implemented a "Room" system where users join a specific room based on a unique Document ID. This ensures that edits in "Document A" do not leak into "Document B." The backend is built with Express.js to handle initial routing and provide a structure for the WebSocket server.



[Image of MERN stack architecture diagram]


### Real-Time Synchronization Logic
The most critical part of this task was handling the synchronization of data without causing conflicts. I implemented an event-driven workflow:
1. **Emit Changes**: When a user types, the React frontend captures the Quill Delta and emits a `send-changes` event via the WebSocket.
2. **Broadcast Changes**: The Node.js server receives this event and uses `socket.broadcast.to(roomID).emit('receive-changes', delta)` to send the edit only to other users in that specific document room.
3. **Apply Changes**: Receiving clients use the `updateContents(delta)` method to merge the incoming edit into their local editor without moving the user's cursor unexpectedly, maintaining a seamless user experience.

### Database Integration (MongoDB)
To ensure that work is not lost when the server restarts or the user refreshes the page, I integrated **MongoDB** using the **Mongoose ODM**. 
* **Schema Design**: I created a `Document` model that stores a unique string ID and the document data as an Object.
* **Auto-Save Feature**: I implemented a "Debounce" logic on the server that automatically saves the current state of the document to MongoDB every 2 seconds if changes are detected. When a user opens a document URL for the first time, the server fetches the latest version from the database and emits a `load-document` event to populate the editor.

### Challenges & Learnings
Building this project taught me the fundamental concepts of real-time conflict resolution. Handling race conditions—where two users type at the exact same millisecond—required a deep understanding of asynchronous programming and the event loop in Node.js. Additionally, configuring **CORS (Cross-Origin Resource Sharing)** to allow the React frontend to communicate with the Node.js backend was a vital lesson in web security. Mastering the implementation of WebSockets has provided me with a solid foundation for building interactive, multi-user web applications in the future.

---

## OUTPUTS

<img width="1920" height="1020" alt="Image" src="https://github.com/user-attachments/assets/bf44c601-ead8-4bb6-b671-7427cc64b76c" />

---

## HOW TO RUN
### 1. Prerequisites
* [Node.js](https://nodejs.org/) installed.
* [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally.

### 2. Setup the Server
```bash
cd server
npm install
npm start
```
### 3. Setup the Client
```bash
cd client
npm install
npm run dev
```
### 4. Access the Application
Open http://localhost:5173 in your browser. To test collaboration, copy the unique document URL and open it in a second tab or window.
