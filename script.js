let players = JSON.parse(localStorage.getItem('mg_players')) || [
{name:"Charlie Juliana", points:0, img:"charlieminigolf.png"},
{name:"Caleb Willner", points:0, img:"CalebRabbi.png"},
{name:"Devin Skinner", points:0, img:"SkinnerProfile.png"},
{name:"Isaac Baranski", points:0, img:"tuffAhhIsaac.png"},
{name:"Peter Merk", points:0, img:"PeterProfile.png"},
{name:"Avery Radom", points:0, img:"averyiszesty-1.png"},
{name:"Ryan Wright", points:0, img:"BigBoyRyan.png"}
];

let tournaments = JSON.parse(localStorage.getItem('mg_tournaments')) || [];

let lastRankings = JSON.parse(localStorage.getItem('mg_last_rankings')) || {};

/* ---------------- SAVE ---------------- */
function saveData(){
  localStorage.setItem('mg_players', JSON.stringify(players));
  localStorage.setItem('mg_tournaments', JSON.stringify(tournaments));
}

/* ---------------- SAVE RANK SNAPSHOT ---------------- */
function saveRankSnapshot(sortedPlayers){
  let snapshot = {};

  sortedPlayers.forEach((p, i) => {
    snapshot[p.name] = i + 1;
  });

  localStorage.setItem('mg_last_rankings', JSON.stringify(snapshot));
}

/* ---------------- LEADERBOARD ---------------- */
function renderLeaderboard(){
  const div = document.getElementById("leaderboardList");
  if(!div) return;

  const sorted = [...players].sort((a,b)=>b.points-a.points);

  let currentRanks = {};

  sorted.forEach((p,i)=>{
    currentRanks[p.name] = i + 1;
  });

  const prev = JSON.parse(localStorage.getItem('mg_last_rankings')) || {};

  div.innerHTML = "";

  sorted.forEach((p,i)=>{

    const isLeader = i === 0;

    let movement = "";
    if(prev[p.name]){
      if(prev[p.name] > currentRanks[p.name]){
        movement = "⬆";
      } else if(prev[p.name] < currentRanks[p.name]){
        movement = "⬇";
      } else {
        movement = "→";
      }
    } else {
      movement = "🆕";
    }

    div.innerHTML += `
      <div class="card player" style="
        align-items:center;
        justify-content:space-between;
        border: ${isLeader ? "2px solid gold" : "1px solid #1f2937"};
        background: ${isLeader ? "rgba(234,179,8,0.10)" : "rgba(5, 46, 22, 0.85)"};
        box-shadow: ${isLeader ? "0 0 18px rgba(234,179,8,0.35)" : "none"};
      ">

        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${p.img}" style="
            border: ${isLeader ? "2px solid gold" : "2px solid #22c55e"};
          ">

          <div>
            <div style="font-size:16px; font-weight:bold;">
              #${i+1} ${p.name} ${isLeader ? "🏆" : ""} 
              <span style="margin-left:8px;">${movement}</span>
            </div>
          </div>
        </div>

        <div style="
          font-size:26px;
          font-weight:900;
          background: ${isLeader 
            ? "linear-gradient(135deg,gold,#fbbf24)" 
            : "linear-gradient(135deg,#22c55e,#16a34a)"};
          color:black;
          padding:10px 16px;
          border-radius:12px;
          min-width:90px;
          text-align:center;
          box-shadow:0 0 10px rgba(34,197,94,0.4);
        ">
          ${p.points} pts
        </div>

      </div>
    `;
  });

  saveRankSnapshot(sorted);
}

/* ---------------- PLAYERS ---------------- */
function renderPlayers(){
  const div = document.getElementById("playersList");
  if(!div) return;

  div.innerHTML = "";
  players.forEach(p=>{
    div.innerHTML += `
      <div class="card player">
        <img src="${p.img}">
        <span>${p.name}</span>
      </div>
    `;
  });
}

/* ---------------- TOURNAMENTS ---------------- */
function renderTournaments(){
  const div = document.getElementById("tournamentList");
  if(!div) return;

  div.innerHTML = "";
  tournaments.forEach((t,i)=>{
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

/* ---------------- TOURNAMENT PAGE ---------------- */
function loadTournamentPage(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if(id === null) return;

  const t = tournaments[id];

  document.getElementById("detailTitle").innerText = t.name;
  document.getElementById("detailInfo").innerText =
    `${t.date} | ${t.location} | ${t.holes} holes`;

  const table = document.getElementById("detailTable");
  table.innerHTML = "";

  t.results.forEach(r=>{
    table.innerHTML += `
      <tr>
        <td>${r.place}</td>
        <td>${r.name}</td>
        <td>${r.score}</td>
      </tr>
    `;
  });
}

/* ---------------- ADMIN ---------------- */
function unlock(){
  if(document.getElementById("password").value === "TheTour2026"){
    document.getElementById("adminPanel").style.display = "block";
    initScores();
  }
}

function initScores(){
  const div = document.getElementById("scores");
  div.innerHTML = "";
  players.forEach(p=>{
    div.innerHTML += `
      ${p.name}: <input type="number" id="score-${p.name}">
      <br>
    `;
  });
}

/* ---------------- ADD TOURNAMENT ---------------- */
function addTournament(){
  let results = [];

  // collect scores (only players who played)
  players.forEach(p=>{
    let val = document.getElementById(`score-${p.name}`).value;
    if(val !== "") results.push({name:p.name, score:parseInt(val)});
  });

  // sort by score (lower is better)
  results.sort((a,b)=>a.score-b.score);

  let places = [];
  let place = 1;

  // assign places WITH ties
  for(let i=0;i<results.length;i++){
    if(i>0 && results[i].score === results[i-1].score){
      places[i] = places[i-1]; // same place for tie
    } else {
      places[i] = place;
    }
    place++;
  }

  // TOTAL PLAYERS WHO PLAYED
  let totalPlayers = results.length;

  // dynamic scoring function
  function getPoints(place){
    return totalPlayers - place + 1;
  }

  // assign points
  results.forEach((r,i)=>{
    let pts = getPoints(places[i]);
    let player = players.find(x=>x.name===r.name);
    player.points += pts;
  });

  // save tournament
  tournaments.push({
    name: document.getElementById("name").value,
    date: document.getElementById("date").value,
    location: document.getElementById("location").value,
    holes: document.getElementById("holes").value,
    results: results.map((r,i)=>({...r, place: places[i]}))
  });

  saveData();
  alert("Tournament Added");
}
