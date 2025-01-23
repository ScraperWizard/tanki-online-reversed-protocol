import ky from "ky";
import { captchaSolutions } from "./CaptchaSolutions.js";
import { EventEmitter } from "events";
import { CAPTCHA_POOL_SIZE, CAPSOLVER_API_KEY } from "../../config.js";
import { getPendingCaptchaSolvers } from "./index.js";

const BASE_API_URL = "https://api.capsolver.com";
const API_KEY = CAPSOLVER_API_KEY;
const GOOGLE_KEY = "6LflfpsUAAAAAD3sDm84JaHZagkLEp9Cf7E6_pOB";
const PAGE_URL = "https://tankionline.com/play/";
const CAPSOLVER_TASK_CHECK_INTERVAL = 0; // Interval for rechecking captcha solution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CapSolver extends EventEmitter {
  taskId = null;
  isSolving = false;

  async createTask() {
    if (this.getIsSolving()) {
      console.log("A captcha solver is already solving a task");
      return;
    }

    if (captchaSolutions.size() >= CAPTCHA_POOL_SIZE || captchaSolutions.size() + getPendingCaptchaSolvers().length >= CAPTCHA_POOL_SIZE) {
      console.log(
        `Captcha solutions pool reached its maximum size\n Current size: ${captchaSolutions.size()}\n Pending captcha solvers: ${
          getPendingCaptchaSolvers().length
        }\n CAPTCHA_POOL_SIZE: ${CAPTCHA_POOL_SIZE}`
      );
      return;
    }

    this.setIsSolving(true);

    try {
      const data = await ky
        .post(
          `${BASE_API_URL}/createTask`,
          {
            json: {
              clientKey: API_KEY,
              task: {
                type: "RecaptchaV2TaskProxyless",
                websiteURL: PAGE_URL,
                websiteKey: GOOGLE_KEY,
              },
            },
          },
          {
            retry: {
              limit: 3,
            },
          }
        )
        .json();

      if (data.errorId === 0) {
        this.taskId = data.taskId;
        this.emit("taskCreated", this.taskId);

        this.getTaskResult();
      } else {
        this.emit("taskFailed", data);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      this.emit("taskFailed", error);
    }
  }

  async getTaskResult() {
    while (true) {
      let data;
      try {
        data = await ky
          .post(
            `${BASE_API_URL}/getTaskResult`,
            {
              json: {
                clientKey: API_KEY,
                taskId: this.taskId,
              },
            },
            {
              retry: {
                limit: 3,
              },
            }
          )
          .json();
      } catch (error) {
        console.error("Error getting task result:", error);
        continue;
      }

      this.emit("taskCheck", data);

      if (data.errorId !== 0) {
        this.setIsSolving(false);
        this.emit("taskFailed", data);
        break;
      }

      if (data.status === "ready") {
        this.setIsSolving(false);
        this.emit("taskSolved", data);
        break;
      }

      await sleep(CAPSOLVER_TASK_CHECK_INTERVAL);
    }
  }

  getIsSolving() {
    return this.isSolving;
  }

  setIsSolving(value) {
    this.isSolving = value;
  }
}

export default CapSolver;
