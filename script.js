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
let selectedStatsPlayer = null;

// ---------------- HELPERS ----------------
function resetPlayersToBase() {
  players = basePlayers.map(p => ({ ...p }));
}

function safeId(name) {
  return name.replace(/\s+/g, "_");
}

function formatDate(dateValue) {
  if (!dateValue) return "";

  if (typeof dateValue === "string" && dateValue.includes("T")) {
    return dateValue.split("T")[0];
  }

  const d = new Date(dateValue);
  if (isNaN(d)) return dateValue;

  return d.toISOString().split("T")[0];
}

function compareTournamentPerformance(a, b) {
  if (a.score !== b.score) return a.score - b.score;
  return a.place - b.place;
}

function getPlayerStats(playerName) {
  const playerTournaments = [];

  tournaments.forEach(tournament => {
    const result = tournament.results.find(r => r.name === playerName);
    if (result) {
      const totalPlayers = tournament.results.length;
      playerTournaments.push({
        tournamentName: tournament.name,
        date: tournament.date,
        location: tournament.location,
        holes: tournament.holes,
        score: result.score,
        place: result.place,
        points: getPointsForPlace(result.place, totalPlayers)
      });
    }
  });

  const overallScore = playerTournaments.reduce((sum, t) => sum + t.score, 0);

  let bestTournament = null;
  let worstTournament = null;

  if (playerTournaments.length > 0) {
    bestTournament = [...playerTournaments].sort(compareTournamentPerformance)[0];
    worstTournament = [...playerTournaments].sort(compareTournamentPerformance).reverse()[0];
  }

  return {
    overallScore,
    tournamentsPlayed: playerTournaments.length,
    bestTournament,
    worstTournament,
    tournaments: playerTournaments
  };
}

function renderStatsTabs() {
  const tabsDiv = document.getElementById("statsTabs");
  if (!tabsDiv) return;

  if (!selectedStatsPlayer && players.length > 0) {
    selectedStatsPlayer = players[0].name;
  }

  tabsDiv.innerHTML = "";

  players.forEach(player => {
    const isSelected = player.name === selectedStatsPlayer;

    tabsDiv.innerHTML += `
      <button
        onclick="selectStatsPlayer('${player.name.replace(/'/g, "\\'")}')"
        style="
          background:${isSelected ? 'gold' : '#22c55e'};
          color:black;
          font-weight:bold;
        "
      >
        ${player.name}
      </button>
    `;
  });
}

function renderStatsContent() {
  const contentDiv = document.getElementById("statsContent");
  if (!contentDiv || !selectedStatsPlayer) return;

  const playerObj = players.find(p => p.name === selectedStatsPlayer);
  const stats = getPlayerStats(selectedStatsPlayer);

  const bestHtml = stats.bestTournament
    ? `
      <div class="card">
        <h3>Best Tournament</h3>
        <p><strong>${stats.bestTournament.tournamentName}</strong></p>
        <p>${formatDate(stats.bestTournament.date)} | ${stats.bestTournament.location}</p>
        <p>Score: ${stats.bestTournament.score}</p>
        <p>Place: ${stats.bestTournament.place}</p>
        <p>Points Earned: ${stats.bestTournament.points}</p>
      </div>
    `
    : `
      <div class="card">
        <h3>Best Tournament</h3>
        <p>No tournaments yet.</p>
      </div>
    `;

  const worstHtml = stats.worstTournament
    ? `
      <div class="card">
        <h3>Worst Tournament</h3>
        <p><strong>${stats.worstTournament.tournamentName}</strong></p>
        <p>${formatDate(stats.worstTournament.date)} | ${stats.worstTournament.location}</p>
        <p>Score: ${stats.worstTournament.score}</p>
        <p>Place: ${stats.worstTournament.place}</p>
        <p>Points Earned: ${stats.worstTournament.points}</p>
      </div>
    `
    : `
      <div class="card">
        <h3>Worst Tournament</h3>
        <p>No tournaments yet.</p>
      </div>
    `;

  let tournamentHistoryRows = "";
  if (stats.tournaments.length > 0) {
    const sortedHistory = [...stats.tournaments].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedHistory.forEach(t => {
      tournamentHistoryRows += `
        <tr>
          <td>${t.tournamentName}</td>
          <td>${formatDate(t.date)}</td>
          <td>${t.score}</td>
          <td>${t.place}</td>
          <td>${t.points}</td>
        </tr>
      `;
    });
  } else {
    tournamentHistoryRows = `
      <tr>
        <td colspan="5">No tournaments played yet.</td>
      </tr>
    `;
  }

  contentDiv.innerHTML = `
    <div class="card player" style="gap:15px;">
      <img src="${playerObj ? playerObj.img : ''}" alt="${selectedStatsPlayer}" style="width:70px;height:70px;border-radius:50%;">
      <div>
        <h2 style="margin:0;">${selectedStatsPlayer}</h2>
        <p style="margin:6px 0 0 0;">Tournaments Played: ${stats.tournamentsPlayed}</p>
      </div>
    </div>

    <div class="card">
      <h3>Overall Score</h3>
      <p style="font-size:28px;font-weight:bold;margin:0;">${stats.overallScore}</p>
    </div>

    ${bestHtml}
    ${worstHtml}

    <div class="card">
      <h3>Tournament History</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Tournament</th>
            <th>Date</th>
            <th>Score</th>
            <th>Place</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          ${tournamentHistoryRows}
        </tbody>
      </table>
    </div>
  `;
}

function renderStatsPage() {
  const tabsDiv = document.getElementById("statsTabs");
  const contentDiv = document.getElementById("statsContent");
  if (!tabsDiv || !contentDiv) return;

  renderStatsTabs();
  renderStatsContent();
}

function selectStatsPlayer(playerName) {
  selectedStatsPlayer = playerName;
  renderStatsPage();
}

window.selectStatsPlayer = selectStatsPlayer;

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
        <p>${formatDate(t.date)} | ${t.location}</p>
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
  info.innerText = `${formatDate(t.date)} | ${t.location} | ${t.holes} Holes`;

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
ocument.addEventListener("DOMContentLoaded", async () => {
  resetPlayersToBase();

  renderLeaderboard();
  renderPlayers();
  renderTournaments();
  renderStatsPage();

  try {
    await loadFromSheet();
  } catch (error) {
    console.error("Sheet sync failed:", error);
  }

  renderLeaderboard();
  renderPlayers();
  renderTournaments();
  renderStatsPage();
  loadTournamentPage();
});
