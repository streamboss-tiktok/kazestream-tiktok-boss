console.log("TikTok Live Connector is running!");

// Prevent duplicate WebSocket declarations
if (!window.socket) {
    window.socket = new WebSocket("ws://localhost:21213/");

    window.socket.onopen = () => console.log("WebSocket connected!");
    window.socket.onmessage = (event) => console.log("Received data:", event.data);
    window.socket.onerror = (error) => console.log("WebSocket error:", error);
    window.socket.onclose = () => console.log("WebSocket disconnected.");
}

const socket = window.socket;

const boss = { name: "???", hp: 2000, maxHp: 2000, shield: 0, spriteIndex: 1 };
const leaderboard = {};
const bossSprites = 14;
const viewers = new Set();
let shieldCooldown = false;

function updateHP() {
    const hpBar = document.getElementById("hpBar");
    if (hpBar && boss.maxHp) {
        hpBar.style.width = `${(boss.hp / boss.maxHp) * 100}%`;
        hpBar.textContent = `HP: ${boss.hp}/${boss.maxHp}`;
    }
}

function updateShield() {
    const shieldBar = document.getElementById("shieldBar");
    if (shieldBar && boss.maxHp) {
        shieldBar.style.width = `${(boss.shield / boss.maxHp) * 100}%`;
        shieldBar.textContent = boss.shield > 0 ? `Shield: ${boss.shield}` : "";
        shieldBar.style.background = boss.shield > 0 ? "#3498db" : "transparent";
    }
}

function setBossName(name) {
    boss.name = name;
    document.getElementById("bossName").textContent = name ? `Boss: ${name}` : "Boss: ???";
}

function updateBossSprite() {
    const img = document.getElementById("bossSprite");
    img.src = `assets/images/Boss${boss.spriteIndex}.png`;
}

function bossHitEffect() {
    const img = document.getElementById("bossSprite");
    if (img) {
        img.style.filter = "brightness(2) drop-shadow(0 0 10px red)";
        setTimeout(() => img.style.filter = "", 200);
    }
}

function updateLeaderboard(user, damage) {
    if (user) leaderboard[user] = (leaderboard[user] || 0) + damage;
    const sortedUsers = Object.keys(leaderboard).sort((a, b) => leaderboard[b] - leaderboard[a]);
    const topUsers = sortedUsers.slice(0, 10);

    const leaderboardDiv = document.getElementById("leaderboard");
    leaderboardDiv.innerHTML = "<h2>Leaderboard</h2>";
    topUsers.forEach((user, index) => {
        const userDiv = document.createElement("div");
        userDiv.textContent = `${index + 1}. ${user}: ${leaderboard[user]}`;
        leaderboardDiv.appendChild(userDiv);
    });
}

function handleBossDamage(damage) {
    const actualDamage = Math.max(0, damage - boss.shield);
    boss.hp -= actualDamage;
    if (boss.shield > 0) {
        boss.shield = Math.max(0, boss.shield - damage);
        if (boss.shield === 0) {
            const shieldDepleted = document.getElementById("shieldDepletedSound");
            if (shieldDepleted) shieldDepleted.play();
            // Start shield cooldown when shield is depleted
            if (!shieldCooldown) {
                shieldCooldown = true;
                console.log("[BOSS SHIELD] Shield cooldown started (5 minutes).");
                setTimeout(() => {
                    shieldCooldown = false;
                    console.log("[BOSS SHIELD] Shield cooldown ended, boss can shield again.");
                }, 5 * 60 * 1000); // 5 minutes
            }
        }
    }
    const hitSound = document.getElementById("hitSound");
    if (hitSound) hitSound.play();
    updateHP();
    updateShield();
    bossHitEffect();

    if (boss.hp <= 0) {
        const killSound = document.getElementById("killSound");
        if (killSound) killSound.play();
        setTimeout(() => {
            boss.hp = boss.maxHp;
            boss.shield = 0;
            updateHP();
            updateShield();
        }, 3000);
    }
}

function sendTestGift() {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            user: "test_user",
            type: "gift",
            amount: 99
        }));
    } else {
        console.log("WebSocket is not open, cannot send message.");
    }
}

socket.addEventListener("open", () => {
    console.log("Connected to WebSocket server");
});

socket.addEventListener("message", (event) => {
    let msg;
    try {
        msg = JSON.parse(event.data);
    } catch (e) {
        console.log("Invalid JSON received:", event.data);
        return;
    }

    switch (msg.event) {
        case "chat":
            // Optional: handle chat messages
            console.log(`[CHAT] ${msg.data.uniqueId}: ${msg.data.comment}`);
            break;
        case "gift":
            if (msg.data.giftName && msg.data.diamondCount) {
                const totalDamage = msg.data.diamondCount * msg.data.repeatCount;
                console.log(`[GIFT] ${msg.data.uniqueId} sent ${msg.data.giftName} x${msg.data.repeatCount} (${msg.data.diamondCount} diamonds each)`);

                // If boss is still ???, first gift makes this user the boss
                if (boss.name === "???") {
                    setBossName(msg.data.uniqueId);
                    boss.hp = boss.maxHp;
                    boss.shield = 0;
                    updateHP();
                    updateShield();
                    console.log(`[FIRST BOSS] ${msg.data.uniqueId} is the first boss!`);
                    return; // Don't process as attack/heal on this gift
                }

                if (msg.data.uniqueId === boss.name) {
                    // Only the boss can heal or shield
                    if (totalDamage >= 299) {
                        if (boss.shield === 0 && !shieldCooldown) {
                            boss.shield = boss.maxHp;
                            updateShield();
                            console.log(`[BOSS SHIELD] Boss shield set to FULL by their own gift!`);
                            // Shield can only be refilled after it is depleted and cooldown ends
                        } else if (boss.shield > 0) {
                            console.log("[BOSS SHIELD] Shield is already active! Wait until it is depleted.");
                        } else if (shieldCooldown) {
                            console.log("[BOSS SHIELD] Shield is on cooldown! Wait before using again.");
                        }
                    } else {
                        boss.hp = Math.min(boss.maxHp, boss.hp + totalDamage);
                        updateHP();
                        console.log(`[BOSS HEAL] Boss healed ${totalDamage} HP by their own gift!`);
                    }
                } else {
                    // Attack boss
                    if (boss.hp > 0) {
                        handleBossDamage(totalDamage);
                        updateLeaderboard(msg.data.uniqueId, totalDamage);
                        // If boss is dead, new boss is the attacker
                        if (boss.hp <= 0) {
                            setBossName(msg.data.uniqueId);
                            boss.hp = boss.maxHp;
                            boss.shield = 0;
                            updateHP();
                            updateShield();
                            console.log(`[NEW BOSS] ${msg.data.uniqueId} is the new boss!`);
                        }
                    }
                }
            }
            break;
        case "like":
            if (msg.data.uniqueId && msg.data.likeCount) {
                // Only non-boss users can attack with likes
                if (msg.data.uniqueId !== boss.name && boss.hp > 0) {
                    const likeDamage = msg.data.likeCount;
                    handleBossDamage(likeDamage);
                    updateLeaderboard(msg.data.uniqueId, likeDamage);
                    console.log(`[LIKE] ${msg.data.uniqueId} sent ${msg.data.likeCount} likes (damage: ${likeDamage})`);
                    // If boss is dead, new boss is the attacker
                    if (boss.hp <= 0) {
                        setBossName(msg.data.uniqueId);
                        boss.hp = boss.maxHp;
                        boss.shield = 0;
                        updateHP();
                        updateShield();
                        console.log(`[NEW BOSS] ${msg.data.uniqueId} is the new boss!`);
                    }
                }
            }
            break;
        default:
            console.log("Unknown event type:", msg.event, msg.data);
    }
});

// Initialize UI on load
updateHP();
updateShield();
updateBossSprite();
setBossName(boss.name);

// Example usage: call sendTestGift() from the console or after the socket opens
// socket.onopen = () => {
//     console.log("WebSocket connected!");
//     sendTestGift();
// };