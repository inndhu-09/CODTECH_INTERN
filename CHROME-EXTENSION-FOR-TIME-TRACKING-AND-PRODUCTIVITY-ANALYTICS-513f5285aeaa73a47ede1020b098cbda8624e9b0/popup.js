// popup.js
// -------------------------------------------------------------------
// RESPONSIBILITIES
// - Request today's productivity stats from background service worker
// - Render summary tiles (productive / unproductive / neutral)
// - Render a pie chart of today's time distribution using Chart.js
// - Render a small list of top domains for today
// - Provide a "Refresh" button for manual data reload
// -------------------------------------------------------------------

let productivityChartInstance = null;

/**
 * Utility: format seconds into "Xh Ym" for display.
 *
 * @param {number} seconds
 * @returns {string}
 */
function formatSecondsToHoursMinutes(seconds) {
  if (!seconds || seconds <= 0) {
    return "0h 00m";
  }
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

/**
 * Convert seconds to minutes (rounded) to use for chart display.
 *
 * @param {number} seconds
 * @returns {number}
 */
function secondsToMinutes(seconds) {
  if (!seconds || seconds <= 0) return 0;
  return Math.round(seconds / 60);
}

/**
 * Render summary tiles: total time for each category.
 *
 * @param {object} categories
 */
function renderSummaryTiles(categories) {
  const productiveEl = document.getElementById("productiveTime");
  const unproductiveEl = document.getElementById("unproductiveTime");
  const neutralEl = document.getElementById("neutralTime");

  const productiveSeconds = categories.Productive || 0;
  const unproductiveSeconds = categories.Unproductive || 0;
  const neutralSeconds = categories.Neutral || 0;

  productiveEl.textContent = formatSecondsToHoursMinutes(productiveSeconds);
  unproductiveEl.textContent = formatSecondsToHoursMinutes(unproductiveSeconds);
  neutralEl.textContent = formatSecondsToHoursMinutes(neutralSeconds);
}

/**
 * Render / update the Chart.js pie chart for today's distribution.
 *
 * @param {object} categories
 */
function renderChart(categories) {
  const ctx = document.getElementById("productivityChart");
  if (!ctx) return;

  // Prepare data in minutes for readability
  const data = [
    secondsToMinutes(categories.Productive || 0),
    secondsToMinutes(categories.Unproductive || 0),
    secondsToMinutes(categories.Neutral || 0)
  ];

  const labels = ["Productive", "Unproductive", "Neutral"];
  const backgroundColors = ["#22c55e", "#ef4444", "#f97316"];

  if (productivityChartInstance) {
    // If chart already exists, update its data instead of re-creating
    productivityChartInstance.data.labels = labels;
    productivityChartInstance.data.datasets[0].data = data;
    productivityChartInstance.update();
    return;
  }

  productivityChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: "#020617",
          borderWidth: 2
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: "#e5e7eb",
            font: {
              size: 10
            }
          }
        }
      }
    }
  });
}

/**
 * Render the "Top Domains" list for today.
 *
 * @param {object} domains - Mapping from hostname to seconds.
 */
function renderDomainList(domains) {
  const listEl = document.getElementById("domainList");
  if (!listEl) return;

  listEl.innerHTML = "";

  const entries = Object.entries(domains || {});

  if (entries.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No activity recorded yet.";
    emptyItem.className = "domain-item";
    listEl.appendChild(emptyItem);
    return;
  }

  // Sort by time descending
  entries.sort((a, b) => b[1] - a[1]);

  // Take top 6 domains for display
  const topEntries = entries.slice(0, 6);

  topEntries.forEach(([domain, seconds]) => {
    const li = document.createElement("li");
    li.className = "domain-item";

    const nameSpan = document.createElement("span");
    nameSpan.className = "domain-name";
    nameSpan.textContent = domain;

    const timeSpan = document.createElement("span");
    timeSpan.className = "domain-time";
    timeSpan.textContent = formatSecondsToHoursMinutes(seconds);

    li.appendChild(nameSpan);
    li.appendChild(timeSpan);

    listEl.appendChild(li);
  });
}

/**
 * Request today's stats from the background script via message passing.
 * The background service worker responds with an object like:
 * {
 *   date: "2026-02-05",
 *   domains: {...},
 *   categories: { Productive: 0, Unproductive: 0, Neutral: 0 }
 * }
 */
function loadTodayStats() {
  chrome.runtime.sendMessage({ type: "GET_TODAY_STATS" }, response => {
    if (!response) {
      // This likely means the service worker is still waking up.
      // Show a simple fallback message.
      document.getElementById("dateLabel").textContent =
        "Unable to load stats (service worker not ready).";
      return;
    }

    const { date, domains, categories } = response;

    // Update date label
    const dateLabel = document.getElementById("dateLabel");
    dateLabel.textContent = `Today • ${date}`;

    // Render UI pieces
    renderSummaryTiles(categories || {});
    renderChart(categories || {});
    renderDomainList(domains || {});
  });
}

/**
 * Attach event listeners and load initial data when popup opens.
 */
document.addEventListener("DOMContentLoaded", () => {
  const refreshButton = document.getElementById("refreshButton");
  refreshButton.addEventListener("click", () => {
    loadTodayStats();
  });

  // Initial load when popup is opened
  loadTodayStats();
});

