const SHEET_API = "https://script.google.com/macros/s/AKfycbzAa-45b0V-rRjjhCSR-Y9PXYlUpU8tNxpKTtbk4kEqonAb20lXbNRko_Trc1yyeSku/exec";

// ---------------- PLAYERS ----------------
let players = [
{name:"Charlie Juliana", points:0, img:"charlieminigolf.png"},
{name:"Caleb Willner", points:0, img:"CalebRabbi.png"},
{name:"Devin Skinner", points:0, img:"SkinnerProfile.png"},
{name:"Isaac Baranski", points:0, img:"tuffAhhIsaac.png"},
{name:"Peter Merk", points:0, img:"PeterProfile.png"},
{name:"Avery Radom", points:0, img:"averyiszesty-1.png"},
{name:"Ryan Wright", points:0, img:"BigBoyRyan.png"}
];

let tournaments = [];

// ---------------- LOAD FROM GOOGLE SHEETS ----------------
async function loadFromSheet(){
  const res = await fetch(SHEET_API);
  const data = await res.json();

  if(data.length <= 1) return;

  tournaments = [];
  players.forEach(p => p.points = 0);

  let rows = data.slice(1);
  let grouped = {};

  rows.forEach(r => {
    const [name, date, location, holes, player, score, place] = r;

    if(!grouped[name]){
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
      score: parseInt(score),
      place: parseInt(place)
    });
  });

  tournaments = Object.values(grouped);

  // rebuild leaderboard
  tournaments.forEach(t => {
    let totalPlayers = t.results.length;

    t.results.forEach(r => {
      let p = players.find(x => x.name === r.name);
      if(p){
        p.points += (totalPlayers - r.place + 1);
      }
    });
  });
}

// ---------------- LEADERBOARD ----------------
function renderLeaderboard(){
  const div = document.getElementById("leaderboardList");
  if(!div) return;

  const sorted = [...players].sort((a,b)=>b.points-a.points);

  div.innerHTML = "";

  sorted.forEach((p,i)=>{
    const isLeader = i === 0;

    div.innerHTML += `
      <div class="card player" style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        border:${isLeader ? "2px solid gold" : "1px solid #14532d"};
      ">
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${p.img}" style="width:50px;height:50px;border-radius:50%;">
          <strong>#${i+1} ${p.name} ${isLeader ? "🏆" : ""}</strong>
        </div>

        <div style="
          font-size:24px;
          font-weight:bold;
          background:${isLeader ? "gold" : "#22c55e"};
          padding:8px 14px;
          border-radius:10px;
          color:black;
        ">
          ${p.points}
        </div>
      </div>
    `;
  });
}

// ---------------- PLAYERS ----------------
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

// ---------------- TOURNAMENTS ----------------
function renderTournaments(){
  const div = document.getElementById("tournamentList");
  if(!div) return;

  div.innerHTML = "";
  tournaments.forEach((t,i)=>{
    div.innerHTML += `
      <div class="card">
        <h3>${t.name}</h3>
        <p>${t.date} | ${t.location}</p>
      </div>
    `;
  });
}

// ---------------- ADMIN LOGIN ----------------
function unlock(){
  if(document.getElementById("password").value === "TheTour2026"){
    document.getElementById("adminPanel").style.display = "block";
    initScores();
  }
}

// ---------------- INIT SCORES ----------------
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

// ---------------- ADD TOURNAMENT ----------------
async function addTournament(){
  let results = [];

  players.forEach(p=>{
    let val = document.getElementById(`score-${p.name}`).value;
    if(val !== "") results.push({name:p.name, score:parseInt(val)});
  });

  results.sort((a,b)=>a.score-b.score);

  let places = [];
  let place = 1;

  for(let i=0;i<results.length;i++){
    if(i>0 && results[i].score === results[i-1].score){
      places[i] = places[i-1];
    } else {
      places[i] = place;
    }
    place++;
  }

  // SEND TO GOOGLE SHEETS
  for(let i=0;i<results.length;i++){
    let r = results[i];

    try {
      await fetch(SHEET_API, {
        method: "POST",
        body: JSON.stringify({
          name: document.getElementById("name").value,
          date: document.getElementById("date").value,
          location: document.getElementById("location").value,
          holes: document.getElementById("holes").value,
          player: r.name,
          score: r.score,
          place: places[i]
        })
      });
    } catch (err) {
      console.error("POST ERROR:", err);
      alert("Error sending to Google Sheets");
    }
  }

  alert("Tournament Added!");

  await loadFromSheet();
  renderLeaderboard();
  renderTournaments();
}

// ---------------- INIT ----------------
window.onload = async () => {
  await loadFromSheet();

  renderLeaderboard();
  renderPlayers();
  renderTournaments();
};
