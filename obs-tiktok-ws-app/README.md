# OBS TikTok WebSocket Application

A Node.js client for connecting to TikFinity's WebSocket endpoint and handling TikTok Live events for use in overlays—**especially TikTok overlays in OBS, TikTok Live Studio, streamer.bot, or browser sources**.

This project helps you bring TikTok chat, gifts, likes, and follows into your custom overlay, with real-time updates via WebSocket or HTTP polling.

## Project Structure

```plaintext
obs-tiktok-ws-app/
├── src/
│   ├── index.js         # Entry point: connects and logs TikTok events
│   └── wsClient.js      # WebSocket client class for TikFinity events
├── package.json         # NPM configuration file
└── README.md            # Project documentation
```

## Setup Instructions

1. **Clone the repository:**

   ```sh
   git clone <repository-url>
   cd obs-tiktok-ws-app
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Run the application:**

   ```sh
   npm start
   ```

## Usage

The main entry point is `src/index.js`. It connects to the TikFinity WebSocket and logs TikTok Live events:

```javascript
import WebSocketClient from "./wsClient.js";

const wsClient = new WebSocketClient(
  "ws://localhost:21213",
  (chat) => console.log(`[Chat] ${chat.username}: ${chat.text}`),
  (gift) => console.log(`[Gift] ${gift.username} sent a gift!`),
  (like) => console.log(`[Like] ${like.username} liked the stream!`),
  (follow) => console.log(`[Follow] ${follow.username} followed!`)
);

wsClient.connect();
```

You can replace the callback functions to integrate with your overlay or custom logic.

## Features

- Connects to TikFinity's WebSocket endpoint (`ws://localhost:21213`)
- Handles and logs TikTok Live events: chat, gift, like, follow
- Modular and easy to extend for additional event types

## Using the HTTP Proxy (Optional)

If you are running the optional Node.js HTTP proxy (see `ws-proxy.js`), you can fetch events from your frontend or overlay like this:

```javascript
fetch("http://localhost:3000/events")
  .then((response) => response.json())
  .then((data) => console.log("Received events:", data.events))
  .catch((error) => console.error("Error fetching events:", error));
```

This allows your overlay to receive TikTok events even if it cannot connect directly to the WebSocket.

## Direct WebSocket Integration Example

If your **TikTok overlay** (for OBS, TikTok Live Studio, streamer.bot, or any browser source) can connect directly to the TikFinity WebSocket, use the following pattern:

```javascript
const ws = new WebSocket("ws://localhost:21213");

ws.onopen = () => console.log("Connected to Tikfinity WebSocket");
ws.onmessage = (event) => {
  const eventData = JSON.parse(event.data);
  updateWidgetUI(eventData); // Function to handle updates
};

ws.onerror = (error) => console.error("WebSocket error:", error);
ws.onclose = () => {
  document.body.classList.add("disconnected");
  // Show a message or overlay
};

function updateWidgetUI(data) {
  // Process incoming TikFinity events & display them in the widget
  console.log("Received event:", data);
}
```

This approach lets your overlay or automation tool (including streamer.bot) respond to TikTok events in real time without needing an HTTP proxy, and works in OBS, TikTok Live Studio, streamer.bot, and browser sources.

## Overlay Event Integration

To make your overlay interactive, connect it to TikTok events using either the direct WebSocket or the HTTP proxy. Here’s a simple example for a browser-based overlay:

### 1. Using Direct WebSocket

```javascript
const ws = new WebSocket("ws://localhost:21213");

ws.onopen = () => console.log("Connected to TikFinity WebSocket");
ws.onmessage = (event) => {
  const eventData = JSON.parse(event.data);
  handleTikTokEvent(eventData);
};

function handleTikTokEvent(event) {
  // Update your overlay UI based on event type
  if (event.event === "chat") {
    showChatMessage(event.data.username, event.data.text);
  } else if (event.event === "gift") {
    showGift(event.data.username, event.data.giftName);
  } else if (event.event === "like") {
    showLike(event.data.username);
  } else if (event.event === "follow") {
    showFollow(event.data.username);
  }
}

function showChatMessage(user, text) {
  // Update your overlay DOM with the chat message
  console.log(`[Chat] ${user}: ${text}`);
}
function showGift(user, gift) {
  console.log(`[Gift] ${user} sent ${gift}`);
}
function showLike(user) {
  console.log(`[Like] ${user} liked the stream!`);
}
function showFollow(user) {
  console.log(`[Follow] ${user} followed!`);
}
```

### 2. Using the HTTP Proxy

If your overlay cannot connect directly to the WebSocket, poll the HTTP proxy for new events:

```javascript
setInterval(() => {
  fetch("http://localhost:3000/events")
    .then((response) => response.json())
    .then((data) => {
      data.events.forEach(handleTikTokEvent);
    });
}, 1000); // Poll every second
```

---

**Tip:**  
Replace the `console.log` calls with your own DOM manipulation or animation code to make your overlay visually interactive for viewers!

---

This approach works in OBS, TikTok Live Studio, streamer.bot, and any browser source that supports JavaScript.

## Custom Overlay UI Example

To make your overlay visually interactive, replace the `console.log` calls in the event handlers with real DOM updates, animations, or sound effects.  
Below is a simple example that displays chat messages and gifts in the overlay:

```html
<!-- overlay.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>TikTok Overlay Example</title>
    <style>
      body {
        background: transparent;
        color: #fff;
        font-family: sans-serif;
      }
      #chat,
      #gifts {
        margin: 10px 0;
      }
      .msg {
        margin-bottom: 4px;
      }
      .gift {
        color: #ffd700;
      }

      @media (max-width: 600px) {
        #chat,
        #gifts {
          font-size: 12px;
        }
      }
    </style>
  </head>
  <body>
    <div id="chat" aria-live="polite"></div>
    <div id="gifts"></div>
    <script>
      const chatDiv = document.getElementById("chat");
      const giftsDiv = document.getElementById("gifts");

      const ws = new WebSocket("ws://localhost:21213");
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === "chat") {
          showChatMessage(data.data.username, data.data.text);
        } else if (data.event === "gift") {
          showGift(data.data.username, data.data.giftName);
        }
      };

      function showChatMessage(user, text) {
        const el = document.createElement("div");
        el.className = "msg";
        el.textContent = `${user}: ${text}`;
        chatDiv.appendChild(el);
        if (chatDiv.children.length > 10)
          chatDiv.removeChild(chatDiv.firstChild);
      }

      function showGift(user, gift) {
        const el = document.createElement("div");
        el.className = "gift";
        el.textContent = `🎁 ${user} sent ${gift}`;
        giftsDiv.appendChild(el);
        setTimeout(() => giftsDiv.removeChild(el), 5000);
      }
    </script>
  </body>
</html>
```

**How to use:**

1. Serve this HTML file (e.g., as `overlay.html`) from your web server.
2. Enter the URL (e.g., `http://localhost:3000/overlay.html`) in your OBS, TikTok Live Studio, or streamer.bot browser source.
3. Your overlay will now display chat and gift events in real time!

**Tip:**  
You can expand this example to show likes, follows, boss health bars, animations, or play sounds for special events.

---

## Serving Your Overlay

You can use a simple static server to serve your `overlay.html` file. For example, with [http-server](https://www.npmjs.com/package/http-server):

```sh
npm install -g http-server
http-server . -p 3000
```

Then use `http://localhost:3000/overlay.html` as your browser source URL in OBS, TikTok Live Studio, or streamer.bot.

## Troubleshooting

- **CORS Issues:** Make sure your overlay and backend are served from the same host/port, or configure CORS headers.
- **Firewall/Network:** Ensure ports 21213 (WebSocket) and 3000 (HTTP proxy) are open and accessible.
- **WebSocket Not Connecting:** Confirm TikFinity is running and the WebSocket endpoint is correct.

## Advanced Customization

- Use CSS and JavaScript to animate chat messages, gifts, or boss actions.
- Play sound effects using the `<audio>` tag and JS.
- Add boss health bars, shield indicators, or leaderboards using DOM elements.

## Example: Boss Fight Logic Integration

```javascript
function handleTikTokEvent(event) {
  if (event.event === "chat") {
    attackBoss(event.data.username);
  } else if (event.event === "gift") {
    healBoss(event.data.username, event.data.giftValue);
  } else if (event.event === "like") {
    minorAttack(event.data.username);
  } else if (event.event === "follow") {
    showWelcome(event.data.username);
  }
}
```

---

With these additions, your README is a complete guide for setting up, customizing, and deploying a TikTok event-driven overlay for OBS, TikTok Live Studio, or streamer.bot.

---

test('handleTikTokEvent calls attackBoss on chat', () => {
const spy = jest.fn();
global.attackBoss = spy;
handleTikTokEvent({ event: "chat", data: { username: "user" } });
expect(spy).toHaveBeenCalledWith("user");
});

{
"themeColor": "#ff69b4",
"maxChatMessages": 10,
"showLeaderboard": true
}

let leaderboard = {};
function updateLeaderboard(user, points) {
leaderboard[user] = (leaderboard[user] || 0) + points;
// Update DOM to show leaderboard
}

````markdown
## Security Best Practices

If you deploy your overlay or backend (WebSocket/HTTP proxy) to the public internet, follow these recommendations:

- **Restrict Origins:**
  Only allow trusted domains to access your WebSocket/HTTP endpoints.
  Example for Express:

  ```js
  const cors = require("cors");
  app.use(cors({ origin: "https://yourdomain.com" }));
  ```

- **Use HTTPS:**
  Always use secure connections (HTTPS/WSS) in production to protect data in transit.

- **Authentication:**
  If exposing endpoints publicly, consider adding authentication (API keys, tokens, or OAuth) to prevent unauthorized access.

- **Environment Variables:**
  Store sensitive configuration (API keys, secrets) in environment variables, not in code or version control.

- **Firewall/Network Security:**
  Restrict access to backend ports (like 21213 and 3000) using firewall rules or security groups.

- **Regular Updates:**
  Keep all dependencies and your Node.js runtime up to date to avoid known vulnerabilities.

- **Monitor and Log:**
  Monitor access and log suspicious activity for your endpoints.

---

**Tip:**
If you only use your overlay locally (e.g., in OBS or TikTok Live Studio on your own machine), these steps are less critical.
For public or cloud deployments, always follow security best practices!

## Overlay Asset Management

To create a visually engaging overlay, you can include custom images, sound files, and CSS in your project. Here’s how to organize and use assets:

### 1. Organize Your Assets

Create an `assets` folder in your project root:

```
obs-tiktok-ws-app/
├── assets/
│   ├── images/
│   │   ├── boss.png
│   │   └── shield.png
│   ├── sounds/
│   │   ├── hit.wav
│   │   ├── shield.wav
│   │   └── defeat.wav
│   └── styles/
│       └── custom.css
```

### 2. Reference Assets in Your Overlay

In your `overlay.html`, reference images, sounds, and styles using relative paths:

```html
<img src="assets/images/boss.png" alt="Boss Sprite" />
<audio id="hit-sound" src="assets/sounds/hit.wav"></audio>
<link rel="stylesheet" href="assets/styles/custom.css" />
```

### 3. Use Assets in Your JavaScript

Play sounds or update images dynamically in your overlay code:

```javascript
function playHitSound() {
  const audio = document.getElementById("hit-sound");
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
}
```

### 4. Customizing Assets

- Replace the sample images and sounds in the `assets` folder with your own for a unique look and feel.
- Update your CSS in `assets/styles/custom.css` to match your branding or theme.

---

**Tip:**
When deploying your overlay, make sure the `assets` folder is included and paths are correct for your hosting environment.

## Robust Error Handling

To ensure your overlay remains reliable and user-friendly, add error handling for WebSocket and HTTP connections. This helps your overlay gracefully handle disconnects, backend issues, or network problems.

### Example: WebSocket Error Handling in Overlay

```javascript
const ws = new WebSocket("ws://localhost:21213");

ws.onopen = () => {
  console.log("Connected to TikFinity WebSocket");
  document.body.classList.remove("disconnected");
};

ws.onmessage = (event) => {
  // ...handle events as usual...
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
  showError("WebSocket error. Please check your connection.");
};

ws.onclose = () => {
  console.warn("WebSocket closed");
  document.body.classList.add("disconnected");
  showError("Connection lost. Trying to reconnect...");
  // Optional: Try to reconnect after a delay
  setTimeout(() => window.location.reload(), 5000);
};

function showError(message) {
  let el = document.getElementById("error-message");
  if (!el) {
    el = document.createElement("div");
    el.id = "error-message";
    el.style.position = "fixed";
    el.style.top = "10px";
    el.style.left = "50%";
    el.style.transform = "translateX(-50%)";
    el.style.background = "#e74c3c";
    el.style.color = "#fff";
    el.style.padding = "10px 20px";
    el.style.borderRadius = "6px";
    el.style.zIndex = 9999;
    document.body.appendChild(el);
  }
  el.textContent = message;
}
```

**Tips:**

- Add a `.disconnected` CSS class to visually indicate connection loss (e.g., dim the overlay or show a banner).
- For HTTP polling, handle `fetch` errors and show a similar message if polling fails.
- Optionally, implement exponential backoff or retry logic for reconnecting.

---

With robust error handling, your overlay will provide a better experience for both streamers and viewers, even if network issues occur!

## Configuration Options

To make your overlay easy to customize without editing code, you can use a configuration file (such as `config.json`) or add a simple UI for live adjustments.

### 1. Using a `config.json` File

Create a `config.json` file in your project or overlay directory:

```json
{
  "themeColor": "#ff69b4",
  "maxChatMessages": 10,
  "showLeaderboard": true,
  "bossName": "TikTok Boss",
  "soundVolume": 0.8
}
```

In your overlay JavaScript, load and use these settings:

```javascript
fetch("config.json")
  .then((res) => res.json())
  .then((config) => {
    document.body.style.setProperty("--theme-color", config.themeColor);
    // Use config.maxChatMessages, config.showLeaderboard, etc.
  });
```

In your CSS, use a CSS variable for theme color:

```css
body {
  --theme-color: #ff69b4;
  background: var(--theme-color);
}
```

### 2. Adding a Simple Configuration UI

You can add a basic settings panel to your overlay for live adjustments (great for testing):

```html
<div id="settings">
  <label>
    Theme Color:
    <input type="color" id="themeColorPicker" value="#ff69b4" />
  </label>
</div>
<script>
  document.getElementById("themeColorPicker").addEventListener("input", (e) => {
    document.body.style.setProperty("--theme-color", e.target.value);
    // Optionally, save to localStorage or send to backend
  });
</script>
```

---

**Tip:**

- For advanced users, you can combine both methods: load defaults from `config.json` and allow live overrides via the UI.
- Always document available config options and their effects in your README.

---

With configuration options, your overlay becomes much more flexible and user-friendly for streamers!

## Leaderboard/Stats UI

To boost engagement, you can display a leaderboard or stats panel in your overlay that tracks top contributors, most recent boss, or total damage dealt.

### 1. Add Leaderboard HTML

Add a container for the leaderboard in your `overlay.html`:

```html
<div id="leaderboard">
  <h3>Top Attackers</h3>
  <ol id="leaderboard-list"></ol>
</div>
```

### 2. Track and Update Leaderboard in JavaScript

Maintain a leaderboard object and update it as events come in:

```javascript
let leaderboard = {};

function updateLeaderboard(user, points) {
  leaderboard[user] = (leaderboard[user] || 0) + points;
  renderLeaderboard();
}

function renderLeaderboard() {
  const list = document.getElementById("leaderboard-list");
  // Convert leaderboard object to sorted array
  const sorted = Object.entries(leaderboard)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5
  list.innerHTML = "";
  for (const [user, points] of sorted) {
    const li = document.createElement("li");
    li.textContent = `${user}: ${points}`;
    list.appendChild(li);
  }
}

// Example: Call updateLeaderboard when an attack event occurs
function handleTikTokEvent(event) {
  if (event.event === "chat") {
    updateLeaderboard(event.data.username, 1);
    showChatMessage(event.data.username, event.data.text);
  } else if (event.event === "gift") {
    updateLeaderboard(event.data.username, event.data.giftValue || 10);
    showGift(event.data.username, event.data.giftName);
  }
  // ...handle other events...
}
```

### 3. Style the Leaderboard

Add some CSS for a clean look:

```css
#leaderboard {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(30, 30, 30, 0.8);
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 16px;
  min-width: 180px;
}
#leaderboard h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}
#leaderboard-list {
  margin: 0;
  padding: 0 0 0 20px;
}
#leaderboard-list li {
  margin-bottom: 4px;
}
```

---

**Tip:**  
You can expand the leaderboard to show other stats, such as most recent boss, total damage, or recent followers/gifters.

---

With a leaderboard, your overlay will be more interactive and rewarding for your viewers!

## Extensibility / Plugin System

To make your overlay future-proof and easy to extend, you can implement a simple plugin system. This allows users to add new event handlers, UI widgets, or integrations without changing the main overlay code.

### 1. Basic Plugin Architecture

Define a global `window.overlayPlugins` array. Plugins can push handler functions into this array:

```javascript
// In your overlay's main JS
window.overlayPlugins = window.overlayPlugins || [];

function handleTikTokEvent(event) {
  // Core event handling...
  // ...

  // Call all plugin handlers
  window.overlayPlugins.forEach((plugin) => {
    if (typeof plugin.onEvent === "function") {
      plugin.onEvent(event);
    }
  });
}
```

### 2. Writing a Plugin

A plugin is just a JS object with an `onEvent` method. Example:

```javascript
// myPlugin.js
window.overlayPlugins = window.overlayPlugins || [];
window.overlayPlugins.push({
  onEvent(event) {
    if (event.event === "gift" && event.data.giftName === "SuperGift") {
      alert("SuperGift received!");
      // Add custom UI, play sound, etc.
    }
  },
});
```

Include your plugin in `overlay.html`:

```html
<script src="myPlugin.js"></script>
```

### 3. Advanced: Plugin API

You can expose more API methods for plugins, such as registering UI components, adding settings, or subscribing to specific event types.

```javascript
window.registerOverlayPlugin = function (plugin) {
  window.overlayPlugins = window.overlayPlugins || [];
  window.overlayPlugins.push(plugin);
};

// In a plugin:
window.registerOverlayPlugin({
  onEvent(event) {
    /* ... */
  },
  onInit() {
    /* ... */
  },
});
```

---

**Tip:**

- Document your plugin API so others can easily build and share plugins.
- Consider loading plugins dynamically from a folder for even more flexibility.

---

With a plugin system, your overlay can grow and adapt to new TikTok events, custom widgets, or third-party integrations—without changing your core codebase!

const BossNames = Array.from({ length: 14 }, (\_, i) => `Boss${i + 1}`);
// ...and so on
````
