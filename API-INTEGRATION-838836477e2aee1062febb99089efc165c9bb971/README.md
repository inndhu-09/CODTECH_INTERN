# API-INTEGRATION

**COMPANY**: CODTECH IT SOLUTIONS

**NAME**: KHIROD KHAGESHWAR BEHERA

**INTERN ID**: CTIS4005

**DOMAIN**: FULL STACK WEB DEVELOPMENT

**DURATION**: 4 WEEKS

**MENTOR**: NEELA SANTOSH KUMAR

---

## DESCRIPTION OF TASK PERFORMED

### Overview
For the first task of my Full Stack Web Development internship, I was responsible for building a responsive **Weather Dashboard** that integrates with a third-party public API. The objective was to demonstrate proficiency in asynchronous JavaScript, DOM manipulation, and modern CSS styling while handling real-time data fetching. I utilized the **OpenWeatherMap API** to retrieve live weather conditions for any city entered by the user.

### Technical Implementation
The core functionality of the application relies on the **JavaScript Fetch API**. In `script.js`, I implemented an asynchronous function `fetchWeather(city)` that constructs a dynamic URL request containing the user's input and my API key. I utilized `async/await` syntax to handle the promise-based response cleaner than traditional `.then()` chaining.
* **Data Parsing:** The app receives a JSON response containing complex nested objects (e.g., `main.temp` for temperature, `weather[0].description` for conditions, and `wind.speed` for wind velocity). I extracted these specific data points to populate the UI.
* **Error Handling:** To ensure a robust user experience, I implemented `try...catch` blocks. If the user enters an invalid city name, the API returns a 404 status. My code detects `!response.ok` and throws a custom error, which is then caught and displayed as a red error message in the UI, preventing the application from crashing.

### Dynamic User Interface (UI/UX)
For styling, I employed a hybrid approach using **Tailwind CSS (via CDN)** for layout and utility classes, alongside custom CSS in `style.css` for specific component aesthetics.
* **Responsive Design:** The layout is built using Flexbox (`flex`, `justify-center`, `items-center`), ensuring the dashboard remains centered and readable on both mobile devices and desktop screens.
* **Visual Feedback:** A key feature I implemented is the **Dynamic Background System**. Inside `script.js`, a `switch` statement analyzes the `weather[0].main` property (e.g., "Rain", "Clear", "Snow"). Based on the condition, it programmatically updates the CSS classes of the `<body>` tag, changing the background gradient to match the weather (e.g., a blue-to-white gradient for Snow, or a grey-to-blue gradient for Rain). This provides immediate visual context to the user.

### Key Learnings
This task significantly reinforced my understanding of **RESTful API integration**. I learned how to securely manage API keys (keeping them in variables), parse JSON data effectively, and manipulate the Document Object Model (DOM) in real-time without refreshing the page. Additionally, handling edge cases—such as empty inputs or network failures—taught me the importance of writing defensive code.

---

## OUTPUTS

<img width="1920" height="1020" alt="Image" src="https://github.com/user-attachments/assets/995e2dfd-8ef9-45cf-b0db-43f96462f2b0" />
---

## HOW TO RUN
1.  Download or clone this repository.
2.  Navigate to the `API-INTEGRATION` folder.
3.  Open `index.html` in any modern web browser (Chrome, Firefox, Edge).
    * *Note: An active internet connection is required for the OpenWeatherMap API and Tailwind CSS CDN to function.*
4.  Enter a valid city name (e.g., "Pune", "London", "New York") in the search bar and press "Search".
