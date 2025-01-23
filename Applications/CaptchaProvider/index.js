import { CAPTCHA_THREADS } from "../../config.js";
import { captchaSolutions } from "./CaptchaSolutions.js";
import CapSolver from "./CaptchaSolver.js";

const captchaSolvers = [];
let CAPTCHA_POOL_LIFE_SECONDS = 10 * 60; // 10 minutes
let lastPingCaptchaSolverPool = Date.now();
let monitoringInterval = null;
let poolActive = false;

captchaSolutions.on("solution-removed", () => {
  if (!poolActive) {
    console.log("Pool is inactive. Skipping new task creation.");
    return;
  }

  console.log("A solution has been removed from the captcha solutions pool\n Pool Size: " + captchaSolutions.size());
  for (const captchaSolver of captchaSolvers) {
    if (!captchaSolver.getIsSolving()) {
      captchaSolver.createTask();
      break;
    }
  }
});

const getPendingCaptchaSolvers = () => captchaSolvers.filter((captchaSolver) => captchaSolver.getIsSolving());

async function startCaptchaSolversPool() {
  if (poolActive) {
    console.log("Captcha solvers pool already active.");
    return;
  }

  console.log("Starting captcha solvers pool...");
  poolActive = true;

  for (let i = 0; i < CAPTCHA_THREADS; i++) {
    const captchaSolver = new CapSolver();

    captchaSolver.on("taskFailed", (error) => {
      console.log("Captcha task failed:", error);
      if (poolActive) captchaSolver.createTask();
    });

    captchaSolver.on("taskSolved", async (data) => {
      console.log("Captcha solved:", data.taskId);
      captchaSolutions.add(data.solution.gRecaptchaResponse);
      if (poolActive) captchaSolver.createTask();
    });

    captchaSolvers.push(captchaSolver);
    captchaSolver.createTask();
  }
}

function deactivateCaptchaSolversPool() {
  console.log("Deactivating captcha solvers pool...");
  poolActive = false;
}

function pingCaptchaSolverPool() {
  console.log("Ping received. Updating pool activity.");
  lastPingCaptchaSolverPool = Date.now();

  if (!poolActive) {
    startCaptchaSolversPool();
  }

  if (!monitoringInterval) {
    monitoringInterval = setInterval(() => {
      const elapsedSeconds = (Date.now() - lastPingCaptchaSolverPool) / 1000;

      if (elapsedSeconds > CAPTCHA_POOL_LIFE_SECONDS) {
        deactivateCaptchaSolversPool();
        clearInterval(monitoringInterval);
        monitoringInterval = null;
      }
    }, 1000);
  }
}

function getCaptcha() {
  return new Promise((resolve) => {
    async function checkCaptcha() {
      const captchaSolution = captchaSolutions.getSolution();

      if (!captchaSolution) {
        setTimeout(checkCaptcha, 100);
        return;
      }

      resolve(captchaSolution.data);
    }

    checkCaptcha(); // Start the loop
  });
}

export { getCaptcha, startCaptchaSolversPool, getPendingCaptchaSolvers, pingCaptchaSolverPool };
