import { Server } from "socket.io";
import clickAccount from "./Applications/clickAccount.js";
import leaveAccount from "./Applications/leaveAccount.js";

let client;
const maxConcurrency = 50;
let activeRequests = 0;
const queue = [];

const io = new Server(3006, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

console.log("Server started on port 3006");

io.on("connection", async (socket) => {
  client = socket;
  console.log("New server connection");

  socket.onAny((event, ...args) => {
    console.log(event, args);
  });

  socket.on("click", async (data) => {
    let { account, password, rank, battleLink, side, tankiConfig, proxyUrl } = data;
    side = side == "Alpha" ? "A" : side == "Bravo" ? "B" : "J";
    queue.push({ account, password, rank, battleLink, side, socket, tankiConfig: JSON.parse(tankiConfig), proxyUrl });
    socket.emit("update-status", { account: account, status: "Queue" });
    processQueue();
  });

  socket.on("unglitch-account", async (data) => {
    const { account, password, tankiConfig, proxyUrl } = data;
    socket.emit("update-status", { account: account, status: "Unglitching" });
    leaveAccount(account, password, true, null, socket, JSON.parse(tankiConfig), proxyUrl);
  });

  socket.on("restart-clicker", async (data) => {
    // Restarts pm2
    socket.emit("new-message", { color: "green", message: `Clicker ${data} was restarted.` });
    process.exit();
  });
});

async function processQueue() {
  if (activeRequests >= maxConcurrency || queue.length === 0) {
    return;
  }

  const batchCount = Math.min(maxConcurrency - activeRequests, queue.length);
  const batch = queue.splice(0, batchCount);
  activeRequests += batchCount;

  await (async () => {
    await Promise.all(
      batch.map(async ({ account, password, rank, battleLink, side, socket, tankiConfig, proxyUrl }) => {
        try {
          console.log(`Processing account: ${account}`);
          await clickAccount(account, password, rank, battleLink, side, socket, tankiConfig, proxyUrl);
          console.log(`Successfully processed account: ${account}`);
        } catch (error) {
          console.log(`Error processing account: ${account}`);
          console.error(error);
        } finally {
          activeRequests--;
        }
      })
    );
  })();

  processQueue(); // Call processQueue after the batch has been processed
}

function updateStatus(account, status) {
  client.emit("update-status", { account: account, status: status });
}

export default updateStatus;
