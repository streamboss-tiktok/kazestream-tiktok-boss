const socket = io("http://localhost:21213/");

// Example boss state and hit handler
const boss = {
  name: "???",
  hp: 2000,
  maxHp: 2000,
  shield: 0,
  cooldown: false,
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

function handleEvent({ user, type, amount }) {
  // Your logic to update boss state, leaderboard, etc.
  console.log(`Event: ${type} from ${user} (${amount})`);
}

/**
 * Handles the event when the boss is hit.
 * Triggers animation or UI update logic to reflect the boss being hit.
 */
function onBossHit() {
  // Your animation or UI update logic
  console.log("Boss was hit!");
}

socket.on("coin", (data) => {
  handleEvent({
    user: data.user || "Viewer",
    type: "coin",
    amount: data.amount || 1,
  });
  onBossHit();
});

socket.on("like", (data) => {
  handleEvent({
    user: data.user || "Viewer",
    type: "like",
    amount: data.amount || 1,
  });
  onBossHit();
});

socket.on("share", (data) => {
  handleEvent({
    user: data.user || "Viewer",
    type: "share",
    amount: data.amount || 1,
  });
  onBossHit();
});

socket.on("giftReceived", (data) => {
  console.log("Gift received on overlay:", data);
  onBossHit();
});

socket.on("bossDefeated", ({ topAttackers, topBossesOfWeek, newBossIndex }) => {
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
    setBossSprite(newBossIndex);
    updateBossHealthBar(100);
  }, 5000);
});

// Add more event handlers as needed
