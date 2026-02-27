// background.js (MV3 service worker)
// -------------------------------------------------------------
// This script runs in the background and is responsible for:
// 1. Listening to tab and window changes.
// 2. Measuring how long each domain stays active.
// 3. Classifying domains as Productive / Unproductive / Neutral.
// 4. Persisting aggregated data in chrome.storage.
// 5. Periodically syncing summary data to the Node.js backend.
// -------------------------------------------------------------

// Simple, configurable classification rules based on domain name.
// You can extend this list as needed.
const PRODUCTIVE_DOMAINS = ["github.com", "stackoverflow.com"];
const UNPRODUCTIVE_DOMAINS = ["youtube.com", "facebook.com"];

// Backend endpoint where we send aggregated time data.
// Make sure your Node.js server is running on this URL.
const backendUrl = "http://localhost:3001/track";

// In-memory state used by the service worker while it is alive.
let currentActiveTabId = null;
let currentActiveDomain = null;
let currentStartTime = null; // Timestamp in ms when the current domain became active

// Helper: extract a hostname (domain) from a full URL string.
function getDomainFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace(/^www\./, "");
  } catch (error) {
    return null;
  }
}

// Helper: determine the category for a given domain.
function getCategoryForDomain(domain) {
  if (!domain) return "neutral";

  if (PRODUCTIVE_DOMAINS.some((d) => domain.endsWith(d))) {
    return "productive";
  }
  if (UNPRODUCTIVE_DOMAINS.some((d) => domain.endsWith(d))) {
    return "unproductive";
  }
  return "neutral";
}

// Helper: safely update our aggregate tracking data in chrome.storage.local.
// We store:
// - timeByDomain: { [domain]: totalTimeMs }
// - timeByCategory: { productive, unproductive, neutral }
// - lastSyncedAt: ISO string of last backend sync
function addElapsedTimeToStorage(domain, elapsedMs) {
  if (!domain || !elapsedMs || elapsedMs < 0) return;

  const domainCategory = getCategoryForDomain(domain);

  chrome.storage.local.get(
    ["timeByDomain", "timeByCategory"],
    (stored) => {
      const timeByDomain = stored.timeByDomain || {};
      const timeByCategory = stored.timeByCategory || {
        productive: 0,
        unproductive: 0,
        neutral: 0
      };

      timeByDomain[domain] = (timeByDomain[domain] || 0) + elapsedMs;
      timeByCategory[domainCategory] =
        (timeByCategory[domainCategory] || 0) + elapsedMs;

      chrome.storage.local.set(
        {
          timeByDomain,
          timeByCategory,
          lastUpdatedAt: new Date().toISOString()
        },
        () => {
          // Optional: you can inspect errors via chrome.runtime.lastError here.
        }
      );
    }
  );
}

// Core tracking function. Called whenever the active tab or its URL changes.
// It:
// 1. Calculates how long the previous domain was active.
// 2. Stores that time in chrome.storage.
// 3. Starts a new timer for the new active domain.
async function handleActiveTabChange(newTabId, newUrl) {
  const now = Date.now();

  // If we were tracking a previous domain, finalize its elapsed time.
  if (currentActiveDomain && currentStartTime != null) {
    const elapsedMs = now - currentStartTime;
    addElapsedTimeToStorage(currentActiveDomain, elapsedMs);
  }

  // Start tracking the new active domain.
  currentActiveTabId = newTabId;
  currentActiveDomain = getDomainFromUrl(newUrl);
  currentStartTime = now;
}

// Fetch the currently active tab (for startup or focus changes).
function updateTrackingForCurrentActiveTab() {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    const activeTab = tabs && tabs[0];
    if (!activeTab || !activeTab.id || !activeTab.url) {
      // If there's no valid active tab (e.g. Chrome UI pages), we still want
      // to stop tracking the old domain.
      if (currentActiveDomain && currentStartTime != null) {
        const now = Date.now();
        const elapsedMs = now - currentStartTime;
        addElapsedTimeToStorage(currentActiveDomain, elapsedMs);
      }
      currentActiveTabId = null;
      currentActiveDomain = null;
      currentStartTime = null;
      return;
    }

    handleActiveTabChange(activeTab.id, activeTab.url);
  });
}

// Periodically send a snapshot of the tracked data to the backend.
// The backend can then persist it to a database or file.
function syncDataToBackend() {
  chrome.storage.local.get(
    ["timeByDomain", "timeByCategory"],
    (stored) => {
      const payload = {
        timeByDomain: stored.timeByDomain || {},
        timeByCategory: stored.timeByCategory || {},
        syncedAt: new Date().toISOString()
      };

      // Use the Fetch API from the service worker environment.
      fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }).catch(() => {
        // Swallow network errors in the background to avoid noisy logs.
      });

      chrome.storage.local.set({
        lastSyncedAt: payload.syncedAt
      });
    }
  );
}

// -------------------------
// Event Wiring
// -------------------------

// When Chrome starts up or the extension is installed, initialize tracking
// based on the currently active tab.
chrome.runtime.onStartup.addListener(() => {
  updateTrackingForCurrentActiveTab();
});

chrome.runtime.onInstalled.addListener(() => {
  updateTrackingForCurrentActiveTab();
});

// When the user switches between tabs.
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (!tab || !tab.url) return;
    handleActiveTabChange(tab.id, tab.url);
  });
});

// When a tab's URL changes (e.g., navigation within the same tab).
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === currentActiveTabId && changeInfo.url) {
    handleActiveTabChange(tabId, changeInfo.url);
  }
});

// When the focused window changes, update our tracking to whichever
// window (and tab) is now active.
chrome.windows.onFocusChanged.addListener(() => {
  updateTrackingForCurrentActiveTab();
});

// Periodically sync data to the backend every 60 seconds.
setInterval(syncDataToBackend, 60 * 1000);

