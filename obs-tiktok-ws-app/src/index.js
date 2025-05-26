import WebSocketClient, { WS_URL } from "./wsClient.js";

const wsClient = new WebSocketClient(
  WS_URL,
  (chat) => {
    console.log(`[Chat] ${chat.username}: ${chat.text}`);
    // e.g., forward to overlay, save to DB, etc.
  },
  (gift) => {
    console.log(`[Gift] ${gift.username} sent a gift!`);
  },
  (like) => {
    console.log(`[Like] ${like.username} liked the stream!`);
  },
  (follow) => {
    console.log(`[Follow] ${follow.username} followed!`);
  }
);

wsClient.onError = (err) => {
  console.error("WebSocket error:", err);
};

wsClient.onClose = () => {
  console.warn(
    "WebSocket connection closed. Attempting to reconnect in 5 seconds..."
  );
  setTimeout(() => wsClient.connect(), 5000);
};

wsClient.connect();

function showBuddy(buddyNumber = 1) {
  const container = document.getElementById("boss-container") || document.body;
  let buddyImg = document.getElementById("buddy-img");
  if (!buddyImg) {
    buddyImg = document.createElement("img");
    buddyImg.id = "buddy-img";
    buddyImg.alt = "Buddy";
    container.appendChild(buddyImg);
  }
  buddyImg.src = `assets/images/buddy${buddyNumber}.png`;
}

// Make sure this runs after the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  showBuddy(1); // Show buddy1.png on load
});

// Sound effects
const shieldOnSound = new Audio("assets/sounds/shield-on.mp3");
const shieldDepletedSound = new Audio("assets/sounds/shield-depleted.mp3");

// Example usage:
// shieldOnSound.play();

function updateBars() {
  document.getElementById("health-bar").style.width =
    (currentHealth / MAX_HEALTH) * 100 + "%";
  document.getElementById("shield-bar").style.width =
    (shield / MAX_HEALTH) * 100 + "%";
}
function showCurrentBuddyAndBoss() {
  // Show buddy sprite on canvas
  showBuddyOnCanvas(currentBuddy);
  // Only show the boss username below the sprite, no buddy name or buddy image
  document.getElementById("buddy-name").innerHTML = `
    <span class="boss-username">${bossName}</span>
  `;
  document.getElementById("boss-name").textContent = `Boss: ${bossName}`;
}

function setBuddySprite(index) {
  const buddiesDiv = document.getElementById("boss-buddies");
  buddiesDiv.innerHTML = "";
  const name = buddyNames[index];
  const img = document.createElement("img");
  img.src = `assets/images/${name}.png`;
  img.alt = "Boss Sprite";
  img.className = "buddy-sprite";
  img.id = `buddy-${name}`;
  buddiesDiv.appendChild(img);

  // Show only the boss username below the sprite
  let bossNameDiv = document.getElementById("boss-name");
  if (!bossNameDiv) {
    bossNameDiv = document.createElement("div");
    bossNameDiv.id = "boss-name";
    buddiesDiv.parentNode.insertBefore(bossNameDiv, buddiesDiv.nextSibling);
  }
  bossNameDiv.innerHTML = `<span class="boss-username">${bossName}</span>`;
}
