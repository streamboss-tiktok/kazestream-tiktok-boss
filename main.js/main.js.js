const socket = new WebSocket('ws://localhost:8080');

const boss = {
  name: '???',
  hp: 2000,
  maxHp: 2000,
  shield: 0,
  cooldown: false
};

const damageBy = { coin: 1, like: 1, share: 10 };
const healBy = { coin: 2, like: 2, share: 20 };

let topDamage = JSON.parse(localStorage.getItem('topDamage') || '{}');
const buddyColors = ['red', 'blue', 'orange', 'purple', 'lime', 'cyan'];

const hpBar = document.getElementById('hpBar');
const shieldBar = document.getElementById('shieldBar');
const bossName = document.getElementById('bossName');
const streamBuddy = document.getElementById('streamBuddy');
const leaderboard = document.getElementById('leaderboard');
const hitSound = document.getElementById('hitSound');
const killSound = document.getElementById('killSound');

function updateHP() {
  hpBar.style.width = `${(boss.hp / boss.maxHp) * 100}%`;
  hpBar.style.background = boss.hp < 600 ? 'red' : boss.hp < 1200 ? 'orange' : 'green';
  shieldBar.style.width = `${(boss.shield / boss.maxHp) * 100}%`;
}

function updateLeaderboard() {
  leaderboard.innerHTML = '<div>Top Damage:</div>';
  const top = Object.entries(topDamage).sort((a, b) => b[1] - a[1]).slice(0, 3);
  leaderboard.innerHTML += '<ol>' + top.map(([u, d]) => `<li>${u}: ${d}</li>`).join('') + '</ol>';
  localStorage.setItem('topDamage', JSON.stringify(topDamage));
}

function setBuddyColor() {
  streamBuddy.style.background = buddyColors[Math.floor(Math.random() * buddyColors.length)];
}

function handleEvent({ user, type, amount }) {
  const isBoss = user === boss.name;
  const val = isBoss ? healBy[type] : damageBy[type];
  const total = val * amount;

  if (type === 'coin' && amount >= 499 && !boss.cooldown && !boss.shield) {
    boss.shield = boss.maxHp;
    boss.cooldown = true;
    setTimeout(() => boss.cooldown = false, 5 * 60 * 1000);
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
    hitSound.play();
  }

  if (boss.hp <= 0) {
    killSound.play();
    boss.name = user;
    boss.hp = boss.maxHp;
    boss.shield = 0;
    topDamage = {};
    setBuddyColor();
  }

  render();
}

function render() {
  bossName.textContent = boss.name;
  hpBar.classList.remove('hit-effect');
  requestAnimationFrame(() => hpBar.classList.add('hit-effect'));
  updateHP();
  updateLeaderboard();
}

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    if (['coin', 'like', 'share'].includes(data.type)) {
      handleEvent({
        user: data.user || 'Viewer',
        type: data.type,
        amount: data.amount || 1
      });
    }
  } catch (e) {
    console.error('Invalid event', e);
  }
};

window.onload = () => {
  setBuddyColor();
  updateHP();
  updateLeaderboard();
};