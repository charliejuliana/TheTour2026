import { getAuth, signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
const auth = getAuth(app);

// 🔥 FIREBASE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// 🔑 PASTE YOUR FIREBASE CONFIG HERE
const firebaseConfig = {
  apiKey: "PASTE_HERE",
  authDomain: "PASTE_HERE",
  databaseURL: "PASTE_HERE",
  projectId: "PASTE_HERE",
  storageBucket: "PASTE_HERE",
  messagingSenderId: "PASTE_HERE",
  appId: "PASTE_HERE"
};

// INIT FIREBASE
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------------- DATA ----------------
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

function login(){
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Logged in!");
      document.getElementById("adminPanel").style.display = "block";
    })
    .catch(() => {
      alert("Login failed");
    });
}

// ---------------- SAVE TO FIREBASE ----------------
function saveData(){
  set(ref(db, 'tourData'), {
    players: players,
    tournaments: tournaments
  });
}

// ---------------- LOAD FROM FIREBASE ----------------
async function loadData(){
  const snapshot = await get(ref(db, 'tourData'));

  if(snapshot.exists()){
    const data = snapshot.val();
    players = data.players || players;
    tournaments = data.tournaments || [];
  }
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
          font-size:26px;
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
        <a href="tournament.html?id=${i}">
          <button>View</button>
        </a>
      </div>
    `;
  });
}

// ---------------- ADD TOURNAMENT ----------------
function addTournament(){
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

  let totalPlayers = results.length;

  function getPoints(place){
    return totalPlayers - place + 1;
  }

  results.forEach((r,i)=>{
    let player = players.find(x=>x.name===r.name);
    player.points += getPoints(places[i]);
  });

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

// ---------------- INIT ----------------
window.onload = async () => {
  await loadData();

  renderLeaderboard();
  renderPlayers();
  renderTournaments();
};
