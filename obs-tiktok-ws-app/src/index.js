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

function showBoss(BossNumber = 1) {
  const container = document.getElementById("boss-container") || document.body;
  let BossImg = document.getElementById("Boss-img");
  if (!BossImg) {
    BossImg = document.createElement("img");
    BossImg.id = "Boss-img";
    BossImg.alt = "Boss";
    container.appendChild(buddyImg);
  }
  BossImg.src = `assets/images/Boss${BossNumber}.png`;
}

// Make sure this runs after the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  showBoss(1); // Show Boss1.png on load
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
function showCurrentBossandBoss() {
  // Show Boss sprite on canvas
  showBossOnCanvas(currentBuddy);
  // Only show the boss username below the sprite, no Boss name or buddy image
  document.getElementById("Boss-name").innerHTML = `
    <span class="boss-username">${bossName}</span>
  `;
  document.getElementById("boss-name").textContent = `Boss: ${bossName}`;
}

function setBossSprite(index) {
  const bossesDiv = document.getElementById("boss-bosses");
  bossesDiv.innerHTML = "";
  const name = BossNames[index];
  const img = document.createElement("img");
  img.src = `assets/images/${name}.png`;
  img.alt = "Boss Sprite";
  img.className = "boss-sprite";
  img.id = `boss-${name}`;
  bossesDiv.appendChild(img);

  // Show only the boss username below the sprite
  let bossNameDiv = document.getElementById("boss-name");
  if (!bossNameDiv) {
    bossNameDiv = document.createElement("div");
    bossNameDiv.id = "boss-name";
    bossesDiv.parentNode.insertBefore(bossNameDiv, bossesDiv.nextSibling);
  }
  bossNameDiv.innerHTML = `<span class="boss-username">${bossName}</span>`;
}

const BossNames = Array.from({ length: 14 }, (_, i) => `Boss${i + 1}`);
// ...and so on
