const socket = io();

document.getElementById("join").addEventListener("click", () => {
  const username = document.getElementById("username").value;
  if (username) {
    socket.emit("joinGame", username);
    document.getElementById("login").style.display = "none";
    document.getElementById("time-selection").style.display = "block";
  }
});

document.getElementById("start").addEventListener("click", () => {
  const selectedTime = document.getElementById("time").value;
  if (selectedTime) {
    socket.emit("startGame", selectedTime);
    document.getElementById("time-selection").style.display = "none";
    document.getElementById("game").style.display = "block";
  }
});

document.getElementById("submit").addEventListener("click", () => {
  const answer = document.getElementById("answer").value;
  socket.emit("submitAnswer", answer);
});

document.getElementById("restart").addEventListener("click", () => {
  location.reload();
});

socket.on("newQuestion", (question) => {
  document.getElementById("question").innerText = question;
  document.getElementById("answer").value = "";
  document.getElementById("result").innerText = "";
  document.getElementById("status").innerText = "";
  document.getElementById("question-card").classList.remove("wrong");
});

socket.on("result", (result) => {
  document.getElementById("result").innerText = result ? "Correct!" : "Wrong!";
  if (!result) {
    document.getElementById("question-card").classList.add("wrong");
  }
});

socket.on("opponentResult", (result) => {
  if (!result) {
    document.getElementById("question-card").classList.add("wrong");
  }
});

socket.on("waiting", (message) => {
  document.getElementById("status").innerText = message;
});

socket.on("usernames", ({ you, opponent }) => {
  document.getElementById("your-username").innerText = you;
  document.getElementById("opponent-username").innerText = opponent;
});

socket.on("scoreUpdate", ({ yourScore, opponentScore }) => {
  document.getElementById("your-score").innerText = yourScore;
  document.getElementById("opponent-score").innerText = opponentScore;
});

socket.on("timeUpdate", (remainingTime) => {
  document.getElementById("time-remaining").innerText = remainingTime;
});

socket.on("gameOver", ({ winner }) => {
  document.getElementById("game").style.display = "none";
  document.getElementById("game-over").style.display = "block";
  document.getElementById("winner").innerText = `Winner: ${winner}`;
});

socket.on("selectTime", () => {
  document.getElementById("login").style.display = "none";
  document.getElementById("time-selection").style.display = "block";
});
