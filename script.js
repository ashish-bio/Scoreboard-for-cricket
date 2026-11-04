const state = {
  runs: 0, wickets: 0, legalBalls: 0, extras: 0,
  balls: [], history: [], snapshots: []
};

const $ = (id) => document.getElementById(id);
const runButtons = document.querySelectorAll("[data-action]");
let toastTimer;

function snapshot() {
  state.snapshots.push({
    runs: state.runs, wickets: state.wickets, legalBalls: state.legalBalls,
    extras: state.extras, balls: [...state.balls], history: [...state.history]
  });
}

function addDelivery(action) {
  if (state.wickets >= 10) {
    showToast("All 10 wickets have fallen. Reset the innings to continue.");
    return;
  }
  snapshot();
  let total = 0, extra = 0, legal = true, label = String(action), description = "";
  if (typeof action === "number") {
    total = action;
    description = action === 0 ? "Dot ball" : `${action} run${action === 1 ? "" : "s"}`;
  } else {
    switch (action) {
      case "W":
        state.wickets += 1;
        description = "Wicket";
        break;
      case "WD":
        total = extra = 1; legal = false; description = "Wide · 1 extra";
        break;
      case "NB":
        total = extra = 1; legal = false; description = "No ball · 1 extra";
        break;
      case "B":
        total = extra = 1; description = "Bye · 1 extra";
        break;
      case "LB":
        total = extra = 1; description = "Leg bye · 1 extra";
        break;
    }
  }
  state.runs += total;
  state.extras += extra;
  if (legal) state.legalBalls += 1;

  const overBefore = Math.floor((state.legalBalls - (legal ? 1 : 0)) / 6);
  const ballNumber = legal ? ((state.legalBalls - 1) % 6) + 1 : (state.legalBalls % 6);
  const entry = {
    action: label, description, total, extra, legal,
    over: overBefore, ball: ballNumber,
    score: `${state.runs}/${state.wickets}`
  };
  state.history.unshift(entry);
  state.balls.push(entry);
  render();
  showToast(description + (total ? ` · +${total}` : ""));
}

function undo() {
  const previous = state.snapshots.pop();
  if (!previous) return showToast("Nothing to undo yet.");
  Object.assign(state, previous);
  render();
  showToast("Last delivery undone.");
}

function reset() {
  if (state.history.length && !confirm("Reset this innings? The current score and ball history will be cleared.")) return;
  state.runs = 0; state.wickets = 0; state.legalBalls = 0; state.extras = 0;
  state.balls = []; state.history = []; state.snapshots = [];
  render();
  showToast("Innings reset.");
}

function oversText() {
  return `${Math.floor(state.legalBalls / 6)}.${state.legalBalls % 6}`;
}
function rate() {
  return state.legalBalls ? (state.runs / (state.legalBalls / 6)).toFixed(2) : "0.00";
}
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

  const dots = $("wicketDots");
  dots.innerHTML = "";
  for (let i = 0; i < 10; i++) {
    const dot = document.createElement("span");
    if (i < state.wickets) dot.className = "lost";
    dots.appendChild(dot);
  }

  const currentOver = state.balls.slice().reverse().filter(item => item.over === Math.floor(state.legalBalls / 6));
  // If the innings has just crossed an over boundary, show the six balls just completed.
  const visibleBalls = currentOver.length ? currentOver : state.balls.slice(-6);
  $("thisOver").innerHTML = visibleBalls.length
    ? visibleBalls.map(item => `<span class="ball-chip ${chipClass(item)}">${item.action === "WD" ? "Wd" : item.action === "NB" ? "Nb" : item.action === "LB" ? "Lb" : item.action}</span>`).join("")
    : '<span class="empty-ball">—</span>';

  const history = $("history");
  if (!state.history.length) {
    history.innerHTML = '<div class="history-empty">No deliveries yet. Start scoring to see the ball-by-ball feed.</div>';
  } else {
    history.innerHTML = state.history.slice(0, 12).map(item => {
      const overLabel = `${item.over}.${item.ball || "•"}`;
      const result = item.action === "WD" ? "Wd" : item.action === "NB" ? "Nb" : item.action === "LB" ? "Lb" : item.action;
      return `<div class="history-item"><span class="history-over">${overLabel} ov</span><span class="history-result ${chipClass(item)}">${result}</span><span class="history-description">${item.description}</span><span class="history-total">${item.score}</span></div>`;
    }).join("");
  }
  $("undoBtn").disabled = !state.snapshots.length;
  $("undoBtn").style.opacity = state.snapshots.length ? "1" : ".45";
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
}

runButtons.forEach(button => {
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
  });
});

render();
