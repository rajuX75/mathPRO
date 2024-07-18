const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

const generateQuestion = () => {
  const operations = ["+", "-", "*", "/"];
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operation = operations[Math.floor(Math.random() * operations.length)];
  let question = `${num1} ${operation} ${num2}`;
  let answer = eval(question);

  // Ensure no floating-point issues with division
  if (operation === "/") {
    answer = (Math.round(answer * 100) / 100).toFixed(2);
    question += " (rounded to 2 decimal places)";
  } else {
    answer = answer.toFixed(2);
  }

  return { question, answer };
};

let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.score = 0;

  socket.on("joinGame", (username) => {
    socket.username = username;
    socket.emit("selectTime"); // Ask the user to select the game time
  });

  socket.on("startGame", (selectedTime) => {
    if (waitingPlayer) {
      const opponent = waitingPlayer;
      waitingPlayer = null;

      // Start the game for both players
      socket.opponent = opponent;
      opponent.opponent = socket;

      // Send usernames to both players
      socket.emit("usernames", {
        you: socket.username,
        opponent: opponent.username,
      });
      opponent.emit("usernames", {
        you: opponent.username,
        opponent: socket.username,
      });

      const sendNewQuestion = () => {
        const { question, answer } = generateQuestion();
        socket.question = question;
        socket.answer = answer;
        opponent.question = question;
        opponent.answer = answer;
        io.to(socket.id).emit("newQuestion", question);
        io.to(opponent.id).emit("newQuestion", question);
      };

      sendNewQuestion();

      const handleAnswer = (playerSocket, answer) => {
        const result = parseFloat(answer) === parseFloat(playerSocket.answer);
        if (result) {
          playerSocket.score++;
        }
        playerSocket.emit("result", result);
        playerSocket.opponent.emit("opponentResult", result);
        io.to(playerSocket.id).emit("scoreUpdate", {
          yourScore: playerSocket.score,
          opponentScore: playerSocket.opponent.score,
        });
        io.to(playerSocket.opponent.id).emit("scoreUpdate", {
          yourScore: playerSocket.opponent.score,
          opponentScore: playerSocket.score,
        });
        sendNewQuestion();
      };

      socket.on("submitAnswer", (answer) => handleAnswer(socket, answer));
      opponent.on("submitAnswer", (answer) => handleAnswer(opponent, answer));

      // Start the game timer
      const gameTime = selectedTime * 1000; // Convert to milliseconds
      const startTime = Date.now();
      const gameInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= gameTime) {
          clearInterval(gameInterval);

          // Determine and announce the winner
          let winner;
          if (socket.score > opponent.score) {
            winner = socket.username;
          } else if (socket.score < opponent.score) {
            winner = opponent.username;
          } else {
            winner = "It's a tie!";
          }
          io.to(socket.id).emit("gameOver", { winner });
          io.to(opponent.id).emit("gameOver", { winner });
        } else {
          const remainingTime = Math.round((gameTime - elapsed) / 1000);
          io.to(socket.id).emit("timeUpdate", remainingTime);
          io.to(opponent.id).emit("timeUpdate", remainingTime);
        }
      }, 1000);
    } else {
      waitingPlayer = socket;
      socket.emit("waiting", "Waiting for an opponent...");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
