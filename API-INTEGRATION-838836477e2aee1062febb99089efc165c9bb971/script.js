// NOTE: Replace 'YOUR_API_KEY' below with your actual OpenWeatherMap API key (string, in quotes)
const apiKey = 'YOUR_API_KEY_HERE';

/**
 * Fetches weather data for the specified city from OpenWeatherMap API.
 * @param {string} city - City name (you can add ',country_code' for accuracy).
 * @returns {Promise<object>} - Parsed weather data or error object.
 */
async function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API Error');
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Updates the dashboard UI with weather info or error.
 * Also changes background according to the main weather type.
 * @param {object|null} data - Weather data from the API.
 * @param {string|null} error - Error message to display (if any).
 */
function updateUI(data, error = null) {
  const resultDiv = document.getElementById('weatherResult');
  const errorDiv = document.getElementById('errorMsg');
  if (error) {
    resultDiv.innerHTML = '';
    errorDiv.textContent = error;
    setDynamicBackground('Default');
    return;
  }
  errorDiv.textContent = '';
  if (!data) {
    resultDiv.innerHTML = '';
    setDynamicBackground('Default');
    return;
  }
  const { name, sys, weather, main, wind } = data;
  const mainWeather = weather[0].main;
  resultDiv.innerHTML = `
    <div class="text-2xl font-semibold">${name}, ${sys.country}</div>
    <div class="text-4xl font-bold">${Math.round(main.temp)}°C</div>
    <div class="capitalize">${weather[0].description}</div>
    <div>
      <span class="font-medium">Humidity:</span> ${main.humidity}%
      | <span class="font-medium">Wind:</span> ${wind.speed} m/s
    </div>
  `;
  setDynamicBackground(mainWeather);
}

/**
 * Changes the background based on weather type.
 * @param {string} weatherType
 */
function setDynamicBackground(weatherType) {
  const body = document.getElementById('mainBg');
  switch (weatherType) {
    case 'Rain':
      body.className = 'min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-400 via-blue-400 to-blue-900 transition-all duration-500';
      break;
    case 'Clear':
      body.className = 'min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-300 via-blue-200 to-blue-500 transition-all duration-500';
      break;
    case 'Clouds':
      body.className = 'min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 transition-all duration-500';
      break;
    case 'Snow':
      body.className = 'min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-300 transition-all duration-500';
      break;
    case 'Mist':
    case 'Fog':
      body.className = 'min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-300 via-gray-200 to-gray-500 transition-all duration-500';
      break;
    case 'Thunderstorm':
      body.className = 'min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-gray-700 to-yellow-100 transition-all duration-500';
      break;
    default:
      body.className = 'min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-300 transition-all duration-500';
  }
}

// MAIN LOGIC - handle form submit, modularity and error handling
// --------------------------------------------------------------

document.getElementById('weatherForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const city = document.getElementById('cityInput').value.trim();
  if (!city) return updateUI(null, 'Please enter a city name.');
  updateUI(null); // Clear previous data
  try {
    const data = await fetchWeather(city);
    updateUI(data, null);
  } catch (err) {
    updateUI(null, err.message || 'An error occurred while fetching weather.');
  }
});
