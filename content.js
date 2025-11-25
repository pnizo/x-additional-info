console.log("X Info Extension: Content script loaded");

// Check if extension context is valid
let contextInvalidated = false;
try {
  chrome.runtime.id;
} catch (e) {
  contextInvalidated = true;
  console.log("X Info: Extension context invalidated, stopping execution");
}

// Stop execution if context is invalid
if (contextInvalidated) {
  throw new Error("Extension context invalidated");
}

// Configuration
const CONFIG = {
  selectors: {
    profileHeader: '[data-testid="UserProfileHeader_Items"]',
    timelineTweet: '[data-testid="tweet"]',
    userName: '[data-testid="User-Name"]'
  },
  cacheExpiry: 24 * 60 * 60 * 1000,
  cacheVersion: 3
};

// API Configuration
const API_CONFIG = {
  queryId: 'zs_jFPFT78rBpXv9Z3U2YQ',
  bearerToken: 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'
};

// Clear old cache on load
try {
  chrome.storage.local.get(['cacheVersion'], (result) => {
    if (chrome.runtime.lastError) {
      console.log("X Info: Extension context invalidated");
      return;
    }
    if (result.cacheVersion !== CONFIG.cacheVersion) {
      console.log("X Info: Cache version mismatch, clearing all cache");
      chrome.storage.local.clear(() => {
        chrome.storage.local.set({ cacheVersion: CONFIG.cacheVersion });
        console.log("X Info: Cache cleared and version updated");
      });
    }
  });
} catch (e) {
  console.log("X Info: Extension context invalidated");
}

// State
const state = {
  observedTweets: new Set(),
  fetchingUsers: new Set(),
  injectedProfiles: new Set()
};

// --- API Helpers ---

function getAuthHeaders() {
  const headers = {
    'authorization': `Bearer ${API_CONFIG.bearerToken}`,
    'x-twitter-active-user': 'yes',
    'x-twitter-client-language': 'en'
  };

  const match = document.cookie.match(new RegExp('(^| )ct0=([^;]+)'));
  if (match) {
    headers['x-csrf-token'] = match[2];
  }

  return headers;
}

async function fetchTransparencyData(screenName) {
  const cleanScreenName = screenName.replace('@', '');

  const variables = {
    "screenName": cleanScreenName
  };

  const url = new URL(`https://x.com/i/api/graphql/${API_CONFIG.queryId}/AboutAccountQuery`);
  url.searchParams.append('variables', JSON.stringify(variables));

  try {
    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const json = await response.json();
    return parseTransparencyData(json, screenName);
  } catch (error) {
    console.error("X Info: Failed to fetch transparency data", error);
    return null;
  }
}

function parseTransparencyData(json, username) {
  try {
    const result = json.data?.user_result_by_screen_name?.result;
    if (!result) return null;

    const aboutProfile = result.about_profile || {};

    const location = aboutProfile.account_based_in || "Unknown";
    const isVpn = aboutProfile.location_accurate === false;
    const nameChangeCount = aboutProfile.username_changes?.count || "0";

    return {
      username: username,
      location: location,
      vpn: isVpn,
      nameChanges: nameChangeCount,
      timestamp: Date.now()
    };
  } catch (e) {
    console.error("X Info: Error parsing JSON", e);
    return null;
  }
}

// --- Main Logic ---

function getUsername() {
  const pathParts = window.location.pathname.split('/');
  if (pathParts.length >= 2 && pathParts[1]) {
    return '@' + pathParts[1];
  }
  const node = document.querySelector(CONFIG.selectors.userName);
  if (node) {
    const atText = node.textContent.split('@')[1];
    return atText ? '@' + atText : 'unknown';
  }
  return 'unknown';
}

function isCacheValid(data) {
  if (!data || !data.timestamp) return false;
  if (data.cacheVersion !== CONFIG.cacheVersion) return false;
  const now = Date.now();
  const age = now - data.timestamp;
  return age < CONFIG.cacheExpiry;
}

function handleProfilePage() {
  const username = getUsername();
  if (username === 'unknown') return;

  if (state.injectedProfiles.has(username)) return;

  const profileHeader = document.querySelector(CONFIG.selectors.profileHeader);
  if (!profileHeader) return;

  if (profileHeader.querySelector('.x-info-badge-container')) {
    state.injectedProfiles.add(username);
    return;
  }

  const key = `x-info-${username}`;
  try {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) return;

      if (profileHeader.querySelector('.x-info-badge-container')) {
        state.injectedProfiles.add(username);
        return;
      }

      const cachedData = result[key];

      if (cachedData && isCacheValid(cachedData)) {
        injectProfileBadges(profileHeader, cachedData);
        state.injectedProfiles.add(username);
      } else {
        if (state.fetchingUsers.has(username)) return;

        state.fetchingUsers.add(username);

        fetchTransparencyData(username).then(data => {
          state.fetchingUsers.delete(username);

          if (profileHeader.querySelector('.x-info-badge-container')) {
            state.injectedProfiles.add(username);
            return;
          }

          if (data) {
            injectProfileBadges(profileHeader, data);
            saveProfileData(data);
            state.injectedProfiles.add(username);
          } else {
            const fallbackData = {
              username: username,
              location: "Unknown",
              vpn: false,
              nameChanges: "Unknown",
              timestamp: Date.now()
            };
            injectProfileBadges(profileHeader, fallbackData);
            state.injectedProfiles.add(username);
          }
        }).catch(error => {
          state.fetchingUsers.delete(username);
          console.error("X Info: Error:", error);
        });
      }
    });
  } catch (e) {
    // Extension context invalidated
  }
}

function injectProfileBadges(container, data) {
  if (container.querySelector('.x-info-badge-container')) return;

  const badgeContainer = document.createElement('div');
  badgeContainer.className = 'x-info-badge-container';

  const locBadge = createBadge('📍', data.location);
  badgeContainer.appendChild(locBadge);

  const vpnText = data.vpn ? 'Proxy/VPN' : 'Direct';
  const vpnBadge = createBadge(data.vpn ? '🛡️' : '🌐', vpnText);
  if (data.vpn) vpnBadge.style.color = '#e0245e';
  badgeContainer.appendChild(vpnBadge);

  const nameBadge = createBadge('📝', `Changes: ${data.nameChanges}`);
  badgeContainer.appendChild(nameBadge);

  container.appendChild(badgeContainer);
}

function createBadge(icon, text) {
  const badge = document.createElement('div');
  badge.className = 'x-info-badge';

  const iconSpan = document.createElement('span');
  iconSpan.className = 'x-info-icon';
  iconSpan.textContent = icon;

  const labelSpan = document.createElement('span');
  labelSpan.className = 'x-info-label';
  labelSpan.textContent = text;

  badge.appendChild(iconSpan);
  badge.appendChild(labelSpan);
  return badge;
}

function saveProfileData(data) {
  if (!data.username || data.username === 'unknown') return;
  const key = `x-info-${data.username}`;
  const dataWithVersion = {
    ...data,
    cacheVersion: CONFIG.cacheVersion
  };
  try {
    chrome.storage.local.set({ [key]: dataWithVersion }, () => {
      if (chrome.runtime.lastError) {
        // Silently fail
      }
    });
  } catch (e) {
    // Extension context invalidated
  }
}

function handleTimeline() {
  try {
    chrome.storage.sync.get(['timelineEnabled'], (result) => {
      if (chrome.runtime.lastError) return;

      const timelineEnabled = result.timelineEnabled !== undefined ? result.timelineEnabled : true;

      if (!timelineEnabled) return;

      const tweets = document.querySelectorAll(CONFIG.selectors.timelineTweet);
      tweets.forEach(tweet => {
        // Find all User-Name elements within this tweet (includes main tweet and quoted tweets)
        const userNameElements = tweet.querySelectorAll(CONFIG.selectors.userName);

        userNameElements.forEach((userNameElement, index) => {
          // Create a unique key for this specific user name element
          const elementId = `user-${index}`;

          if (userNameElement.dataset.xInfoProcessed === elementId) return;

          // Find the username link within this User-Name element
          const userLink = userNameElement.querySelector('a[href^="/"][role="link"]');
          if (!userLink) return;

          const href = userLink.getAttribute('href');

          // Skip non-user links (status, lists, etc.)
          if (!href || href.includes('/status/') || href.includes('/i/') || href.includes('/lists/')) {
            return;
          }

          const username = '@' + href.replace('/', '').split('/')[0]; // Get just the username part

          if (username && username !== '@') {
            userNameElement.dataset.xInfoProcessed = elementId;

            // Determine if this is a quoted tweet by checking if it's not the first User-Name
            const isQuoted = index > 0;

            if (isQuoted) {
              console.log('X Info: Processing quoted tweet user:', username);
            }

            processUserForTimeline(userNameElement, username);
          }
        });
      });
    });
  } catch (e) {
    // Extension context invalidated
  }
}

function processUserForTimeline(container, username) {
  const key = `x-info-${username}`;
  try {
    chrome.storage.local.get([key], (cacheResult) => {
      if (chrome.runtime.lastError) return;

      const cachedData = cacheResult[key];

      if (cachedData && isCacheValid(cachedData)) {
        injectTimelineIcons(container, username);
      } else {
        if (!state.fetchingUsers.has(username)) {
          state.fetchingUsers.add(username);

          fetchTransparencyData(username).then(data => {
            state.fetchingUsers.delete(username);

            if (data) {
              saveProfileData(data);
              injectTimelineIcons(container, username);
            }
          }).catch(error => {
            state.fetchingUsers.delete(username);
          });
        }

        injectTimelineIcons(container, username);
      }
    });
  } catch (e) {
    // Extension context invalidated
  }
}

function getCountryFlag(countryName) {
  const countryFlags = {
    'Japan': '🇯🇵',
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Brazil': '🇧🇷',
    'Mexico': '🇲🇽',
    'Argentina': '🇦🇷',
    'China': '🇨🇳',
    'Korea': '🇰🇷',
    'South Korea': '🇰🇷',
    'India': '🇮🇳',
    'Russia': '🇷🇺',
    'Netherlands': '🇳🇱',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Finland': '🇫🇮',
    'Poland': '🇵🇱',
    'Turkey': '🇹🇷',
    'Saudi Arabia': '🇸🇦',
    'UAE': '🇦🇪',
    'Singapore': '🇸🇬',
    'Thailand': '🇹🇭',
    'Vietnam': '🇻🇳',
    'Philippines': '🇵🇭',
    'Indonesia': '🇮🇩',
    'Malaysia': '🇲🇾',
    'Taiwan': '🇹🇼',
    'Hong Kong': '🇭🇰',
    'New Zealand': '🇳🇿',
    'South Africa': '🇿🇦',
    'Egypt': '🇪🇬',
    'Israel': '🇮🇱',
    'Switzerland': '🇨🇭',
    'Austria': '🇦🇹',
    'Belgium': '🇧🇪',
    'Portugal': '🇵🇹',
    'Greece': '🇬🇷',
    'Ireland': '🇮🇪',
    'Czech Republic': '🇨🇿',
    'Hungary': '🇭🇺',
    'Romania': '🇷🇴',
    'Ukraine': '🇺🇦',
    'Chile': '🇨🇱',
    'Colombia': '🇨🇴',
    'Peru': '🇵🇪',
    'Venezuela': '🇻🇪'
  };

  return countryFlags[countryName] || '❓';
}

function injectTimelineIcons(userNameElement, username) {
  const key = `x-info-${username}`;
  try {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) return;

      const data = result[key];
      if (!userNameElement) return;

      const usernameSpan = Array.from(userNameElement.querySelectorAll('span')).find(
        span => span.textContent.startsWith('@')
      );

      if (!usernameSpan) return;

      if (usernameSpan.previousElementSibling?.classList.contains('x-info-timeline-icon')) {
        return;
      }

      const iconContainer = document.createElement('span');
      iconContainer.className = 'x-info-timeline-icon';
      iconContainer.style.marginRight = '4px';

      if (data && isCacheValid(data)) {
        const flag = getCountryFlag(data.location);
        const flagIcon = document.createElement('span');
        flagIcon.textContent = flag;
        flagIcon.title = data.location;
        flagIcon.style.marginRight = '2px';
        iconContainer.appendChild(flagIcon);

        if (data.vpn) {
          const vpnIcon = document.createElement('span');
          vpnIcon.textContent = '🛡️';
          vpnIcon.title = 'Proxy/VPN Detected';
          vpnIcon.style.marginRight = '2px';
          iconContainer.appendChild(vpnIcon);
        }
      }

      if (iconContainer.children.length > 0) {
        usernameSpan.parentNode.insertBefore(iconContainer, usernameSpan);
      }
    });
  } catch (e) {
    // Extension context invalidated
  }
}

// Main Observer
const observer = new MutationObserver((mutations) => {
  let shouldScanProfile = false;
  let shouldScanTimeline = false;

  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      const path = window.location.pathname;

      if (path.includes('/status/') === false && !path.endsWith('/about') && document.querySelector(CONFIG.selectors.profileHeader)) {
        shouldScanProfile = true;
      }

      if (mutation.target.closest && mutation.target.closest(CONFIG.selectors.timelineTweet)) {
        shouldScanTimeline = true;
      }
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.matches && node.matches(CONFIG.selectors.timelineTweet)) {
            shouldScanTimeline = true;
          }
          if (node.querySelector && node.querySelector(CONFIG.selectors.timelineTweet)) {
            shouldScanTimeline = true;
          }
        }
      });
    }
  }

  if (shouldScanProfile) {
    handleProfilePage();
  }
  if (shouldScanTimeline) {
    handleTimeline();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
