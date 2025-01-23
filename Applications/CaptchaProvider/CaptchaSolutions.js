import { EventEmitter } from "events";

const CAPTCHA_MAX_AGE_MILLISECONDS = 2 * 60 * 1000;

class CaptchaSolutions extends EventEmitter {
  captchaSolutions = [];

  add(solution) {
    const existingSolution = this.captchaSolutions.find((captcha) => captcha.data === solution);

    if (existingSolution) console.log("[WARNING] Captcha solution already exists:", solution);
    this.captchaSolutions.push({ data: solution, timestamp: Date.now() });

    setTimeout(() => {
      const isExpired = this.remove(solution);

      if (isExpired) {
        console.log("Captcha solution expired", solution);
      }
    }, CAPTCHA_MAX_AGE_MILLISECONDS);
  }

  remove(solution) {
    const index = this.captchaSolutions.findIndex((captcha) => captcha.data === solution);
    if (index !== -1) {
      this.captchaSolutions.splice(index, 1);
      this.emit("solution-removed", solution);
    }

    return index !== -1;
  }

  getSolution() {
    const solution = this.captchaSolutions.shift();
    if (solution) {
      this.emit("solution-removed", solution);
      return solution;
    }

    return null;
  }

  size() {
    return this.captchaSolutions.length;
  }
}

const captchaSolutions = new CaptchaSolutions();

export { captchaSolutions };
