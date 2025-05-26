/**
 * Creates a new WebSocket connection to the specified server endpoint.
 *
 * @type {WebSocket}
 * @constant
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebSocket}
 * @description
 * Establishes a WebSocket connection to "ws://localhost:21213/" for real-time communication.
 */
const socket = io("http://localhost:21213");

// Example boss state and hit handler
const boss = {
  name: "???",
  hp: 2000,
  maxHp: 2000,
  shield: 0,
  cooldown: false,
};

const damageBy = { coin: 1, like: 1, share: 10 };
const healBy = { coin: 2, like: 2, share: 20 };

let topDamage = JSON.parse(localStorage.getItem("topDamage") || "{}");
const BossColors = ["red", "blue", "orange", "purple", "lime", "cyan"];
const BossNames = Array.from({ length: 14 }, (_, i) => `Boss${i + 1}`);

const hpBar = document.getElementById("hpBar");
const shieldBar = document.getElementById("shieldBar");
const bossName = document.getElementById("bossName");
const streamBoss = document.getElementById("streamBoss");
const leaderboard = document.getElementById("leaderboard");
const hitSound = document.getElementById("hitSound");
const killSound = document.getElementById("killSound");

let bossShield = 0; // percent (0-100)
let leaderboardData = {};
let hitCount = 0;

function updateHP() {
  hpBar.style.width = `${(boss.hp / boss.maxHp) * 100}%`;
  hpBar.style.background =
    boss.hp < 600 ? "red" : boss.hp < 1200 ? "orange" : "green";
  shieldBar.style.width = `${(boss.shield / boss.maxHp) * 100}%`;
}

function updateShieldBar(shieldPercent) {
  shieldBar.style.width = shieldPercent + "%";
  document.getElementById(
    "shield-text"
  ).textContent = `Shield: ${shieldPercent}%`;
}

function updateLeaderboard() {
  leaderboard.innerHTML = "<div>Top Damage:</div>";
  const top = Object.entries(topDamage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  leaderboard.innerHTML +=
    "<ol>" + top.map(([u, d]) => `<li>${u}: ${d}</li>`).join("") + "</ol>";
  localStorage.setItem("topDamage", JSON.stringify(topDamage));
}

function setBossColor() {
  streamBoss.style.background =
    BossColors[Math.floor(Math.random() * BossColors.length)];
}

/**
 * Updates the boss sprite and displays the boss username below the sprite.
 *
 * @param {number} index - The index of the boss in the BossNames array.
 */
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
  bossNameDiv.innerHTML = `<span class="boss-username">Boss-${boss.name}</span>`;
}

function handleEvent({ user, type, amount }) {
  const isBoss = user === boss.name;
  const val = isBoss ? healBy[type] : damageBy[type];
  const total = val * amount;

  if (type === "coin" && amount >= 499 && !boss.cooldown && !boss.shield) {
    boss.shield = boss.maxHp;
    boss.cooldown = true;
    setTimeout(() => (boss.cooldown = false), 5 * 60 * 1000);
  }

  if (isBoss) {
    boss.hp = Math.min(boss.maxHp, boss.hp + total);
  } else {
    let remaining = total;
    if (boss.shield > 0) {
      const absorbed = Math.min(boss.shield, remaining);
      boss.shield -= absorbed;
      remaining -= absorbed;
    }
    boss.hp -= remaining;
    topDamage[user] = (topDamage[user] || 0) + total;
    if (hitSound) hitSound.play();
  }

  if (boss.hp <= 0) {
    if (killSound) killSound.play();
    boss.name = user;
    boss.hp = boss.maxHp;
    boss.shield = 0;
    topDamage = {};
    setBossColor();
    // Show defeat stats and respawn logic handled elsewhere
  }

  render();
}

function render() {
  bossName.textContent = boss.name;
  hpBar.classList.remove("hit-effect");
  requestAnimationFrame(() => hpBar.classList.add("hit-effect"));
  updateHP();
  updateShieldBar(boss.shield);
  updateLeaderboard();
}

// Call this function when the boss is hit
function triggerBossHitEffect() {
  const bossImg = document.querySelector(".boss-sprite");
  if (!bossImg) return;
  bossImg.classList.remove("boss-hit"); // Reset if already animating
  void bossImg.offsetWidth; // Force reflow to restart animation
  bossImg.classList.add("boss-hit");
}

function onBossHit() {
  hitCount++;
  if (hitCount % 5 === 0) {
    // React every 5 hits
    triggerBossHitEffect();
  }
}

function showHowToPlay(text, duration = 5000) {
  const howToPlay = document.getElementById("how-to-play");
  howToPlay.innerHTML = text;
  howToPlay.style.display = "block";
  clearTimeout(showHowToPlay._timeout);
  showHowToPlay._timeout = setTimeout(() => {
    howToPlay.style.display = "none";
  }, duration);
}

// On initial load
showHowToPlay(`
  <b>How to Play:</b><br />
  Insert rose/heart me to activate tap/like or roses plus to attack the boss.<br />
  Boss can self heal or add shield.<br />
`);

function showBossDefeatStats(topAttackers, topBossesOfWeek) {
  const statsDiv = document.getElementById("boss-defeat-stats");
  let html = "<b>Boss Defeated!</b><br><br>";
  html += "<u>Top 3 Attackers</u><br>";
  html += "<ol style='text-align:left;'>";
  topAttackers.forEach((attacker) => {
    html += `<li>${attacker.name}: ${attacker.hits} hits</li>`;
  });
  html += "</ol>";
  html += "<u>Top 3 Bosses of the Week</u><br>";
  html += "<ol style='text-align:left;'>";
  topBossesOfWeek.forEach((boss) => {
    html += `<li>${boss.name}: ${boss.minutes} min</li>`;
  });
  html += "</ol>";
  statsDiv.innerHTML = html;
  statsDiv.style.display = "block";
  setTimeout(() => {
    statsDiv.style.display = "none";
  }, 5000);
}

// Example usage when boss is defeated:
function handleBossDefeat(topAttackers, topBossesOfWeek, spawnNewBossCallback) {
  showBossDefeatStats(topAttackers, topBossesOfWeek);
  showHowToPlay(
    `
    <b>How to Play:</b><br />
    Insert rose/heart me to activate tap/like or roses plus to attack the boss.<br />
    Boss can self heal or add shield.<br />
  `,
    5000
  );
  setTimeout(() => {
    document.getElementById("boss-defeat-stats").style.display = "none";
    if (typeof spawnNewBossCallback === "function") spawnNewBossCallback();
  }, 5000);
}

// Listen for events from the server
socket.on("bossReset", ({ newBossIndex, newBossUsername }) => {
  boss.name = newBossUsername;
  setBossSprite(newBossIndex);
  boss.hp = boss.maxHp;
  boss.shield = 0;
  showHowToPlay(`
    <b>How to Play:</b><br />
    Insert rose/heart me to activate tap/like or roses plus to attack the boss.<br />
    Boss can self heal or add shield.<br />
  `);
  render();
});

socket.on("updateShield", ({ shieldPercent }) => {
  bossShield = shieldPercent;
  updateShieldBar(bossShield);
});

socket.on("updateLeaderboard", (data) => {
  leaderboardData = data;
  updateLeaderboard();
});

socket.on("giftReceived", (data) => {
  // Update UI, animate boss, etc.
  console.log("Gift received on overlay:", data);
  onBossHit();
  // Optionally call handleEvent(data) if you want to update boss state
});

// Initialize UI on load
window.onload = () => {
  setBossColor();
  setBossSprite(0);
  updateHP();
  updateShieldBar(bossShield);
  updateLeaderboard();
};
function showHowToPlay(text, duration = 5000) {
  const howToPlay = document.getElementById("how-to-play");
  howToPlay.innerHTML = text;
  howToPlay.style.display = "block";
  clearTimeout(showHowToPlay._timeout);
  showHowToPlay._timeout = setTimeout(() => {
    howToPlay.style.display = "none";
  }, duration);
}

// On initial load
showHowToPlay(`
  <b>How to Play:</b><br />
  Insert rose/heart me to activate tap/like or roses plus to attack the boss.<br />
  Boss can self heal or add shield.<br />
`);

function showBossDefeatStats(topAttackers, topBossesOfWeek) {
  const statsDiv = document.getElementById("boss-defeat-stats");
  let html = "<b>Boss Defeated!</b><br><br>";
  html += "<u>Top 3 Attackers</u><br>";
  html += "<ol style='text-align:left;'>";
  topAttackers.forEach((attacker) => {
    html += `<li>${attacker.name}: ${attacker.hits} hits</li>`;
  });
  html += "</ol>";
  html += "<u>Top 3 Bosses of the Week</u><br>";
  html += "<ol style='text-align:left;'>";
  topBossesOfWeek.forEach((boss) => {
    html += `<li>${boss.name}: ${boss.minutes} min</li>`;
  });
  html += "</ol>";
  statsDiv.innerHTML = html;
  statsDiv.style.display = "block";
  setTimeout(() => {
    statsDiv.style.display = "none";
  }, 5000);
}

showBossDefeatStats(topAttackers, topBossesOfWeek);
showHowToPlay(
  `
  <b>How to Play:</b><br />
  Insert rose/heart me to activate tap/like or roses plus to attack the boss.<br />
  Boss can self heal or add shield.<br />
`,
  5000
);
// After 5 seconds, spawn new boss (in your logic)
setTimeout(() => {
  // Spawn new boss logic here
  setBossSprite(newBossIndex);
  updateBossHealthBar(100);
}, 5000);
