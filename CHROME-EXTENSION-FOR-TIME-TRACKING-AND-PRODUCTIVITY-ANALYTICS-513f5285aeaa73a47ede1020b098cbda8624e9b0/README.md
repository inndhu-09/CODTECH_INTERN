# CHROME-EXTENSION-FOR-TIME-TRACKING-AND-PRODUCTIVITY-ANALYTICS

**COMPANY**: CODTECH IT SOLUTIONS

**NAME**: KHIROD KHAGESHWAR BEHERA

**INTERN ID**: CTIS4005

**DOMAIN**: FULL STACK WEB DEVELOPMENT

**DURATION**: 4 WEEKS

**MENTOR**: NEELA SANTOSH

---

## DESCRIPTION OF TASK PERFORMED

### Overview
For the fourth task of my internship, I developed a **Productivity Timer & Tracker**, a custom Google Chrome Extension built using the latest **Manifest V3** architecture. The primary goal of this project was to create a browser-based tool that helps users monitor their web browsing habits, distinguishing between "Productive" work (e.g., coding documentation, educational sites) and "Unproductive" distractions (e.g., social media, entertainment).

### Technical Architecture (Manifest V3)
Unlike traditional web applications, Chrome Extensions operate in a unique sandboxed environment. I utilized **Manifest V3**, the modern standard for Chrome extensions, which replaces the persistent background pages of V2 with ephemeral **Service Workers**. This ensures the extension consumes minimal memory when not in use.

The core logic resides in `background.js`, a service worker that listens for specific browser events:
1.  **`chrome.tabs.onActivated`**: Triggers when the user switches to a different tab.
2.  **`chrome.tabs.onUpdated`**: Triggers when a user navigates to a new URL within the same tab.
3.  **`chrome.windows.onFocusChanged`**: Detects when the user switches browser windows or minimizes Chrome, ensuring time tracking stops when the browser is idle.

### Data Storage & Persistence
To maintain a record of browsing history even after the browser is closed, I implemented the `chrome.storage.local` API. Unlike `localStorage` in standard web apps, `chrome.storage` is asynchronous and optimized for storing user data across browser sessions. The extension creates a data object mapping domain names (e.g., "github.com") to the total time spent in seconds.

### User Interface (Popup)
The frontend of the extension is a lightweight **Popup** (`popup.html` and `popup.js`). When the user clicks the extension icon, it dynamically queries the background storage and renders a real-time dashboard.
* **Time Calculation:** It converts the raw seconds into a readable "HH:MM:SS" format.
* **Categorization Logic:** I implemented a classification algorithm that checks the current domain against a predefined list of keywords. If the URL contains "github", "stackoverflow", or "docs", it is flagged as **Productive**. If it contains "youtube" or "instagram", it is flagged as **Unproductive**.
* **Visual Feedback:** The popup uses color-coded badges (Green for Productive, Red for Distracting) to give the user immediate feedback on their current session.

### Challenges & Learnings
One of the main challenges was handling the asynchronous nature of Chrome's Service Workers. Since variables in a service worker do not persist when the worker goes dormant, I had to ensure that the "start time" state was constantly saved to storage. This project significantly improved my understanding of browser internal APIs, event-driven programming, and the constraints of building secure browser add-ons.

---

## OUTPUTS

<img width="1920" height="1020" alt="Image" src="https://github.com/user-attachments/assets/b21ce18f-cebd-4bc9-8b59-a0dac656856c" />

---

## HOW TO INSTALL
1.  Download or clone this repository.
2.  Open the Chrome browser and navigate to `chrome://extensions/`.
3.  Enable **Developer Mode** using the toggle switch in the top-right corner.
4.  Click the **Load unpacked** button.
5.  Select the folder containing this project (`CHROME-EXTENSION-FOR-TIME-TRACKING-AND-PRODUCTIVITY-ANALYTICS`).
6.  The extension icon will appear in your toolbar. Click it to view your browsing stats.
