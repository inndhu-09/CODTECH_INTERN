// background.js (Manifest V3 service worker)
// -------------------------------------------------------------
// RESPONSIBILITIES
// - Track active tab every minute using chrome.alarms
// - Classify URLs into Productive / Unproductive / Neutral
// - Aggregate time per domain and per category in chrome.storage.local
// - Expose simple message API for popup to retrieve today's stats
// - Periodically send summarized data to backend Node.js server
// -------------------------------------------------------------

// Name of the repeating alarm used for time tracking (1-minute resolution)
const TRACKING_ALARM_NAME = "productivity-tracking-alarm";

// How often (in minutes) we record time
const TRACKING_INTERVAL_MINUTES = 1;

// Backend configuration (Node.js server)
const BACKEND_BASE_URL = "http://localhost:4000";

// -------------------------------------------------------------
// URL CLASSIFICATION LOGIC
// -------------------------------------------------------------

/**
 * Classify a given URL into a productivity category.
 *
 * Productive examples:
 *  - github.com
 *  - stackoverflow.com
 *
 * Unproductive examples:
 *  - facebook.com, instagram.com, twitter.com, reddit.com, youtube.com
 *
 * All other sites are treated as "Neutral".
 *
 * @param {string} url - The full URL of the tab.
 * @returns {"Productive" | "Unproductive" | "Neutral"}
 */
function classifyUrl(url) {
  if (!url || typeof url !== "string") {
    return "Neutral";
  }

  let hostname;
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname;
  } catch (e) {
    // If URL parsing fails, treat as Neutral
    return "Neutral";
  }

  const lowerHost = hostname.toLowerCase();

  // Productive domains
  const productiveDomains = [
    "github.com",
    "gist.github.com",
    "stackoverflow.com",
    "stackexchange.com",
    "superuser.com",
    "serverfault.com"
  ];

  // Unproductive / social media / entertainment domains
  const unproductiveDomains = [
    "facebook.com",
    "www.facebook.com",
    "instagram.com",
    "www.instagram.com",
    "twitter.com",
    "x.com",
    "www.twitter.com",
    "www.x.com",
    "reddit.com",
    "www.reddit.com",
    "youtube.com",
    "www.youtube.com",
    "tiktok.com",
    "www.tiktok.com",
    "netflix.com",
    "www.netflix.com"
  ];

  if (productiveDomains.some(domain => lowerHost.endsWith(domain))) {
    return "Productive";
  }

  if (unproductiveDomains.some(domain => lowerHost.endsWith(domain))) {
    return "Unproductive";
  }

  return "Neutral";
}

// -------------------------------------------------------------
// STORAGE HELPER FUNCTIONS
// -------------------------------------------------------------

/**
 * Returns a date key for "today" in YYYY-MM-DD format.
 */
function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Load today's stats from chrome.storage.local.
 *
 * Shape:
 * {
 *   [dateKey]: {
 *      domains: { [domain: string]: number }, // seconds
 *      categories: { Productive: number, Unproductive: number, Neutral: number }
 *   }
 * }
 *
 * @returns {Promise<object>}
 */
function loadAllStats() {
  return new Promise(resolve => {
    chrome.storage.local.get(["productivityStats"], result => {
      resolve(result.productivityStats || {});
    });
  });
}

/**
 * Persist the entire stats object back into storage.
 *
 * @param {object} stats
 * @returns {Promise<void>}
 */
function saveAllStats(stats) {
  return new Promise(resolve => {
    chrome.storage.local.set({ productivityStats: stats }, () => resolve());
  });
}

/**
 * Record a duration (in seconds) for the given URL into today's stats.
 *
 * @param {string} url
 * @param {number} seconds
 */
async function recordTimeForUrl(url, seconds) {
  if (!url || typeof seconds !== "number" || seconds <= 0) {
    return;
  }

  let hostname;
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname || "unknown";
  } catch (e) {
    hostname = "unknown";
  }

  const category = classifyUrl(url);
  const todayKey = getTodayKey();

  const allStats = await loadAllStats();
  const todayStats = allStats[todayKey] || {
    domains: {},
    categories: {
      Productive: 0,
      Unproductive: 0,
      Neutral: 0
    }
  };

  // Update per-domain time
  todayStats.domains[hostname] = (todayStats.domains[hostname] || 0) + seconds;

  // Update per-category time
  todayStats.categories[category] =
    (todayStats.categories[category] || 0) + seconds;

  allStats[todayKey] = todayStats;
  await saveAllStats(allStats);
}

// -------------------------------------------------------------
// ACTIVE TAB TRACKING LOGIC
// -------------------------------------------------------------

/**
 * Returns the currently active tab in the focused window (if any).
 *
 * @returns {Promise<chrome.tabs.Tab | null>}
 */
function getCurrentActiveTab() {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs && tabs.length > 0) {
        resolve(tabs[0]);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Handle the tracking alarm: query active tab and record 60 seconds against it.
 */
async function handleTrackingAlarm() {
  const activeTab = await getCurrentActiveTab();

  if (!activeTab || !activeTab.url) {
    // No active tab (e.g., Chrome dev tools, new tab, or system UI)
    return;
  }

  // We assume the user spent the last minute on this active tab.
  const SECONDS_PER_TICK = TRACKING_INTERVAL_MINUTES * 60;
  await recordTimeForUrl(activeTab.url, SECONDS_PER_TICK);

  // Optionally, send a small summary to the backend for persistence
  sendTodaySummaryToBackend().catch(() => {
    // Fail silently; we don't want the extension to break if backend is down.
  });
}

// -------------------------------------------------------------
// BACKEND INTEGRATION
// -------------------------------------------------------------

/**
 * Compute today's summary from storage and send it to backend.
 * The backend can later be used to retrieve historical data.
 *
 * POST /summary
 * Body example:
 * {
 *   date: "2026-02-05",
 *   domains: { "github.com": 3600, "facebook.com": 600 },
 *   categories: { Productive: 3600, Unproductive: 600, Neutral: 0 }
 * }
 */
async function sendTodaySummaryToBackend() {
  const allStats = await loadAllStats();
  const todayKey = getTodayKey();
  const todayStats = allStats[todayKey];

  if (!todayStats) {
    // Nothing to send yet
    return;
  }

  const payload = {
    date: todayKey,
    domains: todayStats.domains || {},
    categories: todayStats.categories || {}
  };

  try {
    await fetch(`${BACKEND_BASE_URL}/summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    // Network errors are expected if backend is offline. We just ignore.
  }
}

// -------------------------------------------------------------
// MESSAGE HANDLER FOR POPUP
// -------------------------------------------------------------

/**
 * Handle messages from the popup (e.g., to get today's data).
 * Supported messages:
 * - { type: "GET_TODAY_STATS" }
 * - { type: "GET_ALL_STATS" }
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "GET_TODAY_STATS") {
    (async () => {
      const allStats = await loadAllStats();
      const todayKey = getTodayKey();
      const todayStats = allStats[todayKey] || {
        domains: {},
        categories: {
          Productive: 0,
          Unproductive: 0,
          Neutral: 0
        }
      };
      sendResponse({ date: todayKey, ...todayStats });
    })();
    // Indicate we will respond asynchronously
    return true;
  }

  if (message && message.type === "GET_ALL_STATS") {
    (async () => {
      const allStats = await loadAllStats();
      sendResponse({ statsByDate: allStats });
    })();
    return true;
  }

  // Return false for unsupported messages so response is ignored.
  return false;
});

// -------------------------------------------------------------
// ALARM SETUP & EVENT LISTENERS
// -------------------------------------------------------------

/**
 * Ensure our repeating tracking alarm exists.
 * This runs when the service worker starts up.
 */
function ensureTrackingAlarm() {
  chrome.alarms.get(TRACKING_ALARM_NAME, alarm => {
    if (!alarm) {
      chrome.alarms.create(TRACKING_ALARM_NAME, {
        periodInMinutes: TRACKING_INTERVAL_MINUTES
      });
    }
  });
}

// When an alarm fires, handle it if it's ours.
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm && alarm.name === TRACKING_ALARM_NAME) {
    handleTrackingAlarm();
  }
});

// On service worker startup, make sure the alarm exists.
ensureTrackingAlarm();

