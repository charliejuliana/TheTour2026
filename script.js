const SHEET_API = "https://script.google.com/macros/s/AKfycbzc8XqMklln8ty5jpd6zkb9AwKwjlGeKgOTqLU1Cziyozfwt9mtUriwMiTjS5Bwsf92/exec";

// ---------------- BASE DATA ----------------
const basePlayers = [
  { name: "Charlie Juliana", points: 0, img: "charlieminigolf.png" },
  { name: "Caleb Willner", points: 0, img: "CalebRabbi.png" },
  { name: "Devin Skinner", points: 0, img: "SkinnerProfile.png" },
  { name: "Isaac Baranski", points: 0, img: "tuffAhhIsaac.png" },
  { name: "Peter Merk", points: 0, img: "PeterProfile.png" },
  { name: "Avery Radom", points: 0, img: "averyiszesty-1.png" },
  { name: "Ryan Wright", points: 0, img: "BigBoyRyan.png" }
];

let players = basePlayers.map(p => ({ ...p }));
let tournaments = [];

// ---------------- HELPERS ----------------
function resetPlayersToBase() {
  players = basePlayers.map(p => ({ ...p }));
}

function safeId(name) {
  return name.replace(/\s+/g, "_");
}

// ---------------- LOAD FROM GOOGLE SHEETS ----------------
async function loadFromSheet() {
  const res = await fetch(SHEET_API);
  const data = await res.json();

  if (!Array.isArray(data) || data.length <= 1) {
    tournaments = [];
    resetPlayersToBase();
    return;
  }

  tournaments = [];
  resetPlayersToBase();

  const rows = data.slice(1);
  const grouped = {};

  rows.forEach(row => {
    const [name, date, location, holes, player, score, place] = row;

    if (!grouped[name]) {
      grouped[name] = {
        name,
        date,
        location,
        holes,
        results: []
      };
    }

    grouped[name].results.push({
      name: player,
      score: Number(score),
      place: Number(place)
    });
  });

  tournaments = Object.values(grouped);

  // rebuild leaderboard points from tournament results
  tournaments.forEach(tournament => {
    const totalPlayers = tournament.results.length;

    tournament.results.forEach(result => {
      const p = players.find(player => player.name === result.name);
      if (p) {
        p.points += totalPlayers - result.place + 1;
      }
    });
  });
}

// ---------------- LEADERBOARD ----------------
function renderLeaderboard() {
  const div = document.getElementById("leaderboardList");
  if (!div) return;

  const sorted = [...players].sort((a, b) => b.points - a.points);

  div.innerHTML = "";

  sorted.forEach((p, i) => {
    const isLeader = i === 0;

    div.innerHTML += `
      <div class="card player" style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        border:${isLeader ? "2px solid gold" : "1px solid #14532d"};
      ">
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${p.img}" alt="${p.name}" style="width:50px;height:50px;border-radius:50%;">
          <strong>#${i + 1} ${p.name} ${isLeader ? "🏆" : ""}</strong>
        </div>

        <div style="
          font-size:24px;
          font-weight:bold;
          background:${isLeader ? "gold" : "#22c55e"};
          padding:8px 14px;
          border-radius:10px;
          color:black;
        ">
          ${p.points} pts
        </div>
      </div>
    `;
  });
}

// ---------------- PLAYERS ----------------
function renderPlayers() {
  const div = document.getElementById("playersList");
  if (!div) return;

  div.innerHTML = "";

  players.forEach(p => {
    div.innerHTML += `
      <div class="card player">
        <img src="${p.img}" alt="${p.name}">
        <span>${p.name}</span>
      </div>
    `;
  });
}

// ---------------- TOURNAMENTS ----------------
function renderTournaments() {
  const div = document.getElementById("tournamentList");
  if (!div) return;

  div.innerHTML = "";

  tournaments.forEach((t, i) => {
    div.innerHTML += `
      <div class="card">
        <h3>${t.name}</h3>
        <p>${t.date} | ${t.location}</p>
        <a href="tournament.html?id=${i}">
          <button>View Leaderboard</button>
        </a>
      </div>
    `;
  });
}

// ---------------- TOURNAMENT PAGE ----------------
function loadTournamentPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id === null) return;

  const t = tournaments[id];
  if (!t) return;

  const title = document.getElementById("detailTitle");
  const info = document.getElementById("detailInfo");
  const table = document.getElementById("detailTable");

  if (!title || !info || !table) return;

  title.innerText = t.name;
  info.innerText = `${t.date} | ${t.location} | ${t.holes} holes`;

  table.innerHTML = "";

  t.results.forEach(r => {
    table.innerHTML += `
      <tr>
        <td>${r.place}</td>
        <td>${r.name}</td>
        <td>${r.score}</td>
      </tr>
    `;
  });
}

// ---------------- ADMIN ----------------
function unlock() {
  const passwordInput = document.getElementById("password");
  const adminPanel = document.getElementById("adminPanel");

  if (!passwordInput || !adminPanel) return;

  if (passwordInput.value === "TheTour2026") {
    adminPanel.style.display = "block";
    initScores();
  } else {
    alert("Incorrect password");
  }
}

function initScores() {
  const div = document.getElementById("scores");
  if (!div) return;

  div.innerHTML = "";

  players.forEach(p => {
    div.innerHTML += `
      ${p.name}: <input type="number" id="score-${safeId(p.name)}">
      <br>
    `;
  });
}

// ---------------- ADD TOURNAMENT ----------------
async function addTournament() {
  try {
    const name = document.getElementById("name")?.value || "";
    const date = document.getElementById("date")?.value || "";
    const location = document.getElementById("location")?.value || "";
    const holes = document.getElementById("holes")?.value || "";

    let results = [];

    players.forEach(p => {
      const input = document.getElementById(`score-${safeId(p.name)}`);
      if (!input) return;

      const val = input.value;
      if (val !== "") {
        results.push({
          name: p.name,
          score: parseInt(val, 10)
        });
      }
    });

    if (results.length === 0) {
      alert("Enter at least one score.");
      return;
    }

    results.sort((a, b) => a.score - b.score);

    let places = [];
    let place = 1;

    for (let i = 0; i < results.length; i++) {
      if (i > 0 && results[i].score === results[i - 1].score) {
        places[i] = places[i - 1];
      } else {
        places[i] = place;
      }
      place++;
    }

    for (let i = 0; i < results.length; i++) {
      const r = results[i];

      await fetch(SHEET_API, {
        method: "POST",
        body: JSON.stringify({
          name,
          date,
          location,
          holes,
          player: r.name,
          score: r.score,
          place: places[i]
        })
      });
    }

    alert("Tournament submitted successfully!");

// optional: small delay so user sees alert clearly
setTimeout(() => {
  window.location.href = "tournaments.html"; 
}, 300);
  } catch (error) {
    console.error("Error adding tournament:", error);
    alert("There was an error adding the tournament. Check the console.");
  }
}

// ---------------- PAGE INIT ----------------
document.addEventListener("DOMContentLoaded", () => {
  // Render frontend immediately so the site never appears blank
  renderLeaderboard();
  renderPlayers();
  renderTournaments();
  loadTournamentPage();

  // Then try to sync from Sheets
  loadFromSheet()
    .then(() => {
      renderLeaderboard();
      renderPlayers();
      renderTournaments();
      loadTournamentPage();
    })
    .catch(error => {
      console.error("Sheet sync failed:", error);
    });
});
