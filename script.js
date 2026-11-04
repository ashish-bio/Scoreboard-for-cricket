// GPK Cricket Live Scoreboard
// Add your Firebase web app configuration in the firebaseConfig object below.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBSEgM3lh0bPyJdcBin1trKnmC0ntWOf4Q",
  authDomain: "gpk-cricket.firebaseapp.com",
  projectId: "gpk-cricket",
  storageBucket: "gpk-cricket.firebasestorage.app",
  messagingSenderId: "1095579929817",
  appId: "1:1095579929817:web:b957ac1eba24a5331f42c8",
  measurementId: "G-57YZ1SX6QL"
};

const $ = (id) => document.getElementById(id);
const authBtn = $("authBtn");
const statusEl = $("connectionStatus");
const scorePath = "matches/gpk-live-score";

let app, db, auth, isScorer = false, isApplyingRemote = false;
let state = {
  runs: 0, wickets: 0, legalBalls: 0, extras: 0,
  balls: [], history: [],
  teamName: "TEAM A", opponentName: "TEAM B"
};
let snapshots = [];
let toastTimer, nameSaveTimer;

function firebaseConfigured() {
  return firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY" &&
         firebaseConfig.databaseURL !== "PASTE_YOUR_DATABASE_URL";
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}
function setConnection(text, online=false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("online", online);
}
function updateAccess() {
  document.querySelectorAll("[data-action], #undoBtn, #resetBtn, #teamName, #opponentName")
    .forEach(el => {
      el.disabled = !isScorer;
      el.style.opacity = isScorer ? "1" : ".62";
      el.style.cursor = isScorer ? "pointer" : "not-allowed";
    });
  authBtn.textContent = isScorer ? "SCORER LOGOUT" : "SCORER LOGIN";
}
function saveCloud() {
  if (!isScorer || !db) return;
  const payload = {
    runs: state.runs, wickets: state.wickets, legalBalls: state.legalBalls,
    extras: state.extras, balls: state.balls, history: state.history,
    teamName: state.teamName, opponentName: state.opponentName,
    updatedAt: Date.now()
  };
  set(ref(db, scorePath), payload).catch(err => {
    console.error(err);
    showToast("Could not save to cloud. Check Firebase rules and connection.");
  });
}
function startFirebase() {
  if (!firebaseConfigured()) {
    setConnection("SETUP REQUIRED");
    showToast("Add your Firebase config to script.js to enable live sharing.");
    updateAccess();
    return;
  }
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    auth = getAuth(app);
    onValue(ref(db, scorePath), snapshot => {
      const data = snapshot.val();
      if (data) {
        isApplyingRemote = true;
        state = {
          runs: Number(data.runs || 0),
          wickets: Number(data.wickets || 0),
          legalBalls: Number(data.legalBalls || 0),
          extras: Number(data.extras || 0),
          balls: Array.isArray(data.balls) ? data.balls : [],
          history: Array.isArray(data.history) ? data.history : [],
          teamName: data.teamName || "TEAM A",
          opponentName: data.opponentName || "TEAM B"
        };
        snapshots = [];
        $("teamName").value = state.teamName;
        $("opponentName").value = state.opponentName;
        render();
        isApplyingRemote = false;
      } else {
        setConnection("CONNECTED · NO SCORE", true);
        if (isScorer) saveCloud();
      }
      setConnection("LIVE · SYNCED", true);
    }, error => {
      console.error(error);
      setConnection("DATABASE ERROR");
      showToast("Database access error. Check your Realtime Database rules.");
    });
    onAuthStateChanged(auth, user => {
      isScorer = !!user;
      updateAccess();
      if (user) {
        setConnection("SCORER CONNECTED", true);
        showToast("Scorer mode enabled. Your updates are shared live.");
      } else {
        setConnection("LIVE VIEWER", true);
      }
    });
  } catch (err) {
    console.error(err);
    setConnection("CONFIG ERROR");
  }
}

async function toggleLogin() {
  if (!auth) return showToast("Firebase setup is required first.");
  if (auth.currentUser) {
    await signOut(auth);
    showToast("Logged out. This device is now in viewer mode.");
    return;
  }
  const email = prompt("Enter scorer email:");
  if (!email) return;
  const password = prompt("Enter scorer password:");
  if (!password) return;
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (err) {
    console.error(err);
    showToast("Login failed. Check your scorer email and password.");
  }
}
authBtn.addEventListener("click", toggleLogin);

function snapshot() {
  snapshots.push({
    runs: state.runs, wickets: state.wickets, legalBalls: state.legalBalls,
    extras: state.extras, balls: [...state.balls], history: [...state.history],
    teamName: state.teamName, opponentName: state.opponentName
  });
}
function addDelivery(action) {
  if (!isScorer) return showToast("Only the scorer can update the match.");
  if (state.wickets >= 10) return showToast("All 10 wickets have fallen. Reset the innings to continue.");
  snapshot();
  let total = 0, extra = 0, legal = true, label = String(action), description = "";
  if (typeof action === "number") {
    total = action;
    description = action === 0 ? "Dot ball" : `${action} run${action === 1 ? "" : "s"}`;
  } else {
    switch (action) {
      case "W": state.wickets += 1; description = "Wicket"; break;
      case "WD": total = extra = 1; legal = false; description = "Wide · 1 extra"; break;
      case "NB": total = extra = 1; legal = false; description = "No ball · 1 extra"; break;
      case "B": total = extra = 1; description = "Bye · 1 extra"; break;
      case "LB": total = extra = 1; description = "Leg bye · 1 extra"; break;
    }
  }
  state.runs += total;
  state.extras += extra;
  if (legal) state.legalBalls += 1;
  const overBefore = Math.floor((state.legalBalls - (legal ? 1 : 0)) / 6);
  const ballNumber = legal ? ((state.legalBalls - 1) % 6) + 1 : (state.legalBalls % 6);
  const entry = { action: label, description, total, extra, legal, over: overBefore, ball: ballNumber, score: `${state.runs}/${state.wickets}` };
  state.history.unshift(entry);
  state.balls.push(entry);
  render();
  saveCloud();
  showToast(description + (total ? ` · +${total}` : ""));
}
function undo() {
  if (!isScorer) return showToast("Only the scorer can undo.");
  const previous = snapshots.pop();
  if (!previous) return showToast("Nothing to undo yet.");
  Object.assign(state, previous);
  render(); saveCloud(); showToast("Last delivery undone.");
}
function reset() {
  if (!isScorer) return showToast("Only the scorer can reset the innings.");
  if (state.history.length && !confirm("Reset this innings for everyone watching?")) return;
  state.runs = 0; state.wickets = 0; state.legalBalls = 0; state.extras = 0;
  state.balls = []; state.history = []; snapshots = [];
  render(); saveCloud(); showToast("Innings reset for all viewers.");
}
function oversText() { return `${Math.floor(state.legalBalls / 6)}.${state.legalBalls % 6}`; }
function rate() { return state.legalBalls ? (state.runs / (state.legalBalls / 6)).toFixed(2) : "0.00"; }
function chipClass(item) {
  if (item.action === "W") return "wicket";
  if (["WD", "NB", "B", "LB"].includes(item.action)) return "extra";
  if (item.action === "4" || item.action === "6") return "boundary";
  return "";
}
function render() {
  $("runs").textContent = state.runs;
  $("wickets").textContent = state.wickets;
  $("overs").textContent = oversText();
  $("runRate").textContent = rate();
  $("extras").textContent = state.extras;
  $("sideRunRate").textContent = rate();
  $("sideExtras").textContent = state.extras;
  $("wicketsLeft").textContent = 10 - state.wickets;
  $("legalBalls").textContent = state.legalBalls % 6;
  $("rateBar").style.width = `${Math.min(Number(rate()) / 15 * 100, 100)}%`;
  $("teamName").value = state.teamName || "TEAM A";
  $("opponentName").value = state.opponentName || "TEAM B";
  const dots = $("wicketDots");
  dots.innerHTML = "";
  for (let i = 0; i < 10; i++) {
    const dot = document.createElement("span");
    if (i < state.wickets) dot.className = "lost";
    dots.appendChild(dot);
  }
  const currentOverNumber = Math.floor(state.legalBalls / 6);
  let visibleBalls = state.balls.slice(-6);
  const sameOver = visibleBalls.filter(item => item.over === currentOverNumber);
  if (sameOver.length) visibleBalls = sameOver;
  $("thisOver").innerHTML = visibleBalls.length
    ? visibleBalls.map(item => `<span class="ball-chip ${chipClass(item)}">${item.action === "WD" ? "Wd" : item.action === "NB" ? "Nb" : item.action === "LB" ? "Lb" : item.action}</span>`).join("")
    : '<span class="empty-ball">—</span>';
  $("history").innerHTML = state.history.length
    ? state.history.slice(0, 12).map(item => {
        const result = item.action === "WD" ? "Wd" : item.action === "NB" ? "Nb" : item.action === "LB" ? "Lb" : item.action;
        return `<div class="history-item"><span class="history-over">${item.over}.${item.ball || "•"} ov</span><span class="history-result ${chipClass(item)}">${result}</span><span class="history-description">${item.description}</span><span class="history-total">${item.score}</span></div>`;
      }).join("")
    : '<div class="history-empty">No deliveries yet. Start scoring to see the ball-by-ball feed.</div>';
  $("undoBtn").disabled = !isScorer || !snapshots.length;
}
document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", () => {
    const value = button.dataset.action;
    addDelivery(["W", "WD", "NB", "B", "LB"].includes(value) ? value : Number(value));
  });
});
$("undoBtn").addEventListener("click", undo);
$("resetBtn").addEventListener("click", reset);
["teamName", "opponentName"].forEach(id => {
  $(id).addEventListener("input", event => {
    event.target.value = event.target.value.toUpperCase();
    state[id] = event.target.value;
    if (!isApplyingRemote && isScorer) {
      clearTimeout(nameSaveTimer);
      nameSaveTimer = setTimeout(saveCloud, 350);
    }
  });
});
render();
updateAccess();
startFirebase();
