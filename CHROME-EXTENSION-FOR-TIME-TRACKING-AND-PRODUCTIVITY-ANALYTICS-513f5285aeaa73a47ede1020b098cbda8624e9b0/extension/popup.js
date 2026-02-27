// popup.js
// -------------------------------------------------------------
// This script runs inside the popup UI.
// It:
// 1. Reads the aggregated time data from chrome.storage.local.
// 2. Renders total session time and category breakdown.
// 3. Shows a simple chart for Productive vs Unproductive time.
// 4. Lists the top 3 most visited domains for today.
// -------------------------------------------------------------

const dateLabelElement = document.getElementById("dateLabel");
const sessionTimeElement = document.getElementById("sessionTime");
const productiveTimeElement = document.getElementById("productiveTime");
const unproductiveTimeElement = document.getElementById("unproductiveTime");
const percentageLabelElement = document.getElementById("percentageLabel");
const domainListElement = document.getElementById("domainList");
const refreshButtonElement = document.getElementById("refreshButton");

let chartInstance = null;

// Helper: convert milliseconds to a "Xh Ym" display string.
function formatDuration(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

// Helper: compute the current session time.
// For simplicity, we define "session" as "total time recorded in storage".
function getSessionDurationMs(timeByCategory) {
  if (!timeByCategory) return 0;
  const productive = timeByCategory.productive || 0;
  const unproductive = timeByCategory.unproductive || 0;
  const neutral = timeByCategory.neutral || 0;
  return productive + unproductive + neutral;
}

// Helper: render the donut chart for Productive vs Unproductive time.
function renderChart(productiveMs, unproductiveMs) {
  const ctx = document.getElementById("productivityChart");
  if (!ctx) return;

  const productiveMinutes = Math.round(productiveMs / 60000);
  const unproductiveMinutes = Math.round(unproductiveMs / 60000);

  const data = {
    labels: ["Productive", "Unproductive"],
    datasets: [
      {
        data: [productiveMinutes, unproductiveMinutes],
        backgroundColor: ["#22c55e", "#ef4444"],
        borderColor: ["#16a34a", "#b91c1c"],
        borderWidth: 1.5
      }
    ]
  };

  const options = {
    plugins: {
      legend: {
        labels: {
          color: "#e5e7eb",
          font: {
            size: 11
          }
        }
      }
    }
  };

  if (chartInstance) {
    chartInstance.data = data;
    chartInstance.options = options;
    chartInstance.update();
  } else {
    chartInstance = new Chart(ctx, {
      type: "doughnut",
      data,
      options
    });
  }
}

// Helper: render the top 3 domains list.
function renderTopDomains(timeByDomain) {
  domainListElement.innerHTML = "";

  const entries = Object.entries(timeByDomain || {});
  if (!entries.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "domain-list-item";
    emptyItem.textContent = "No browsing data tracked yet.";
    domainListElement.appendChild(emptyItem);
    return;
  }

  // Sort domains by total time descending and take the top 3.
  const sorted = entries
    .sort(([, aTime], [, bTime]) => bTime - aTime)
    .slice(0, 3);

  sorted.forEach(([domain, totalMs]) => {
    const listItem = document.createElement("li");
    listItem.className = "domain-list-item";

    const left = document.createElement("div");
    left.className = "domain-name";
    left.textContent = domain;

    const right = document.createElement("div");

    const categoryChip = document.createElement("span");
    const category = getCategoryForDomain(domain);
    categoryChip.className = `domain-chip ${category}`;
    categoryChip.textContent = category.charAt(0).toUpperCase() + category.slice(1);

    const timeLabel = document.createElement("span");
    timeLabel.className = "domain-time";
    timeLabel.textContent = formatDuration(totalMs);

    right.appendChild(timeLabel);
    right.appendChild(categoryChip);

    listItem.appendChild(left);
    listItem.appendChild(right);

    domainListElement.appendChild(listItem);
  });
}

// Helper: determine the category for a given domain.
// This mirrors the logic used in background.js.
function getCategoryForDomain(domain) {
  if (!domain) return "neutral";
  const normalized = domain.replace(/^www\./, "");

  if (normalized.endsWith("github.com") || normalized.endsWith("stackoverflow.com")) {
    return "productive";
  }
  if (normalized.endsWith("youtube.com") || normalized.endsWith("facebook.com")) {
    return "unproductive";
  }
  return "neutral";
}

// Main render function: pulls data from storage and updates the UI.
function renderDashboard() {
  const today = new Date();
  dateLabelElement.textContent = today.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  chrome.storage.local.get(
    ["timeByDomain", "timeByCategory"],
    (stored) => {
      const timeByDomain = stored.timeByDomain || {};
      const timeByCategory = stored.timeByCategory || {
        productive: 0,
        unproductive: 0,
        neutral: 0
      };

      const sessionDurationMs = getSessionDurationMs(timeByCategory);
      const productiveMs = timeByCategory.productive || 0;
      const unproductiveMs = timeByCategory.unproductive || 0;

      const totalForPercent = productiveMs + unproductiveMs;
      const productivePct = totalForPercent
        ? Math.round((productiveMs / totalForPercent) * 100)
        : 0;
      const unproductivePct = totalForPercent
        ? Math.round((unproductiveMs / totalForPercent) * 100)
        : 0;

      sessionTimeElement.textContent = formatDuration(sessionDurationMs);
      productiveTimeElement.textContent = formatDuration(productiveMs);
      unproductiveTimeElement.textContent = formatDuration(unproductiveMs);

      percentageLabelElement.textContent = `Productive ${productivePct}% • Unproductive ${unproductivePct}%`;

      renderChart(productiveMs, unproductiveMs);
      renderTopDomains(timeByDomain);
    }
  );
}

refreshButtonElement.addEventListener("click", () => {
  renderDashboard();
});

document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();
});

