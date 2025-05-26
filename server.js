import {
  SignConfig,
  TikTokLiveConnection,
  ControlEvent,
  WebcastEvent,
} from "tiktok-live-connector";
import { Server } from "socket.io";
import http from "http";

// Set your EulerStream API key
SignConfig.apiKey = "your_api_key_here"; // Replace with your actual API key

const tiktokUsername = "officialgeilegisela";
const tikTokLiveConnection = new TikTokLiveConnection(tiktokUsername, {
  processInitialData: false,
  enableExtendedGiftInfo: true,
  requestPollingIntervalMs: 2000,
  webClientParams: {
    app_language: "en-US",
    device_platform: "web",
  },
});

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

// --- TikTok Event Forwarding for Overlay ---

// Gifts
tikTokLiveConnection.on(WebcastEvent.GIFT, (data) => {
  io.emit("gift", {
    user: data.uniqueId,
    gift: data.giftName,
    repeatCount: data.repeatCount,
    profilePic: data.user?.profilePictureUrl,
    isStreak: data.giftType === 1 && !data.repeatEnd,
  });
});

// Likes (screen taps)
tikTokLiveConnection.on(WebcastEvent.LIKE, (data) => {
  io.emit("like", {
    user: data.uniqueId,
    likeCount: data.likeCount,
    totalLikeCount: data.totalLikeCount,
    profilePic: data.user?.profilePictureUrl,
  });
});

// Shares
tikTokLiveConnection.on(WebcastEvent.SHARE, (data) => {
  io.emit("share", {
    user: data.uniqueId,
    profilePic: data.user?.profilePictureUrl,
  });
});

// --- Logging for Server Health ---
tikTokLiveConnection.on(WebcastEvent.CONNECTED, () => {
  console.log("Connected to TikTok LIVE!");
});
tikTokLiveConnection.on(ControlEvent.ERROR, (err) => {
  console.error("Error!", err);
});
tikTokLiveConnection.on(ControlEvent.DISCONNECTED, () => {
  console.log("Disconnected :(");
});

// --- Start connection and server ---
tikTokLiveConnection.connect();
server.listen(3000, () => {
  console.log("Socket.IO server running on port 3000");
});

function updateBars() {
  document.getElementById("health-bar").style.width =
    (currentHealth / MAX_HEALTH) * 100 + "%";
  document.getElementById("shield-bar").style.width =
    (shield / MAX_HEALTH) * 100 + "%";
}
function showCurrentBuddyAndBoss() {
  // ...show buddy sprite and boss name...
}

let bossActive = false;
let bossName = "???";
let currentBuddyIndex = 0;
let MAX_HEALTH = 100;
let currentHealth = MAX_HEALTH;
let shield = 0;
let leaderboard = {};

const BossNames = Array.from({ length: 14 }, (_, i) => `Boss${i + 1}`);

tikTokLiveConnection.on(WebcastEvent.GIFT, (msg) => {
  console.log("Gift received:", msg); // <-- You should see this in your terminal
  if (!bossActive) {
    bossActive = true;
    bossName = msg.user;
    currentHealth = MAX_HEALTH;
    shield = 0;
    leaderboard = {};
    io.emit("bossReset", {
      newBuddyIndex: currentBuddyIndex,
      newBossUsername: bossName,
    });
    io.emit("updateHealth", { health: currentHealth, shieldValue: shield });
    io.emit("updateLeaderboard", leaderboard);
  }
  io.emit("giftReceived", { username: msg.user });
  // ...rest of your gift logic...
});
