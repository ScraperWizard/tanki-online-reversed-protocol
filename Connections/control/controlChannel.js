import CL_HashRequest from "../../Commands/controlCommands/hashRequest.js";
import WebSocket from "ws";
import { hstab, bufToHex } from "../space-utils/PacketHelper.js";
import Logger from "../../Logger/Logger.js";
import { HttpsProxyAgent } from "https-proxy-agent";
const serverScores = {
  "c1.eu.tankionline.com": { score: 100, totalConnections: 0, reconnectMaps: [] },
  "c2.eu.tankionline.com": { score: 100, totalConnections: 0, reconnectMaps: [] },
  "c3.eu.tankionline.com": { score: 100, totalConnections: 0, reconnectMaps: [] },
  "c4.eu.tankionline.com": { score: 100, totalConnections: 0, reconnectMaps: [] },
  "c5.eu.tankionline.com": { score: 100, totalConnections: 0, reconnectMaps: [] },
  "c6.eu.tankionline.com": { score: 100, totalConnections: 0, reconnectMaps: [] },
  "c7.eu.tankionline.com": { score: 100, totalConnections: 0, reconnectMaps: [] },
  "c8.eu.tankionline.com": { score: 100, totalConnections: 0, reconnectMaps: [] },
};
const servers = {
  "c1.eu.tankionline.com": "9090",
  "c2.eu.tankionline.com": "19090",
  "c3.eu.tankionline.com": "9090",
  "c4.eu.tankionline.com": "19090",
  "c5.eu.tankionline.com": "9090",
  "c6.eu.tankionline.com": "19090",
  "c7.eu.tankionline.com": "9090",
  "c8.eu.tankionline.com": "19090",
};

let captchaMaps = {};
let allMaps = {};

class ControlChannel {
  constructor(Map, Account, reconnectModel = false, forceConnectServer, proxyUrl) {
    this.hash = null;
    this.normalHash = null;
    this.socket = null;
    this.map = Map;
    this.reconnectModel = reconnectModel;
    this.logger = new Logger(Account);
    this.spaceIdObject = {
      "Space Two": false,
      "Space Three": false,
      "Space Four": false,
      "Space Five": false,
      "Space Six": false,
      "Space Seven": false,
      "Space Eight": false,
    };
    this.connectionServerString = null;
    this.Account = Account;
    this.connectionString = forceConnectServer == null ? this.generateConnectionString() : `wss://c${forceConnectServer}.eu.tankionline.com:${servers[`c${forceConnectServer}.eu.tankionline.com`]}`;
    this.proxyUrl = proxyUrl;
    allMaps[this.map] = {};
  }

  connectToServer() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.connectionString, {
        agent: this.proxyUrl == "" ? null : new HttpsProxyAgent(this.proxyUrl),
      });

      this.socket.binaryType = "arraybuffer";

      this.socket.onopen = (e) => {
        this.logger.info(`[connectionOpened Connection established - ${this.connectionString}]`);
        resolve(this.socket); // Resolve the promise once connected
      };

      // Handle any connection errors
      this.socket.onerror = (error) => {
        this.logger.error(error.message);
        reject(error); // Reject the promise if there is an error
      };
    });
  }

  setConnectionString(connectionString) {
    this.connectionString = connectionString;
  }

  generateConnectionString() {
    const key = this.getHighestScoreConnectionString();
    if (key == null) return null;
    this.logger.info(`${this.Account} [Connection string generated - ${key}]`);
    const value = servers[key];
    this.connectionServerString = key;
    if (serverScores[key] && !this.reconnectModel) {
      serverScores[key].totalConnections++;
    }
    return `wss://${key}:${value}`;
  }

  getHighestScoreConnectionString() {
    // Variables
    const connections = Object.keys(serverScores); // Holds all connection strings
    let anyFreeConnection = false; // Boolean for any free connections
    let totalConnections = 0;

    if (this.reconnectModel) {
      // Check each connection for a matching reconnectMap
      for (const connection of connections) {
        if (serverScores[connection].reconnectMaps.includes(this.map)) {
          return connection;
        }
      }
    }

    // Sort connections by totalConnections and then score
    // Sort connections by totalConnections and then score
    const sortedConnections = connections
      .map((connection) => ({
        connection,
        score: serverScores[connection].score || 0,
        totalConnections: serverScores[connection].totalConnections || 0,
      }))
      .filter(({ totalConnections, score }) => score > 50 && totalConnections >= 0 && totalConnections < 8) // Discard connections with totalConnections >= 8 or < 0
      .sort((a, b) => {
        if (b.totalConnections === a.totalConnections) {
          return b.score - a.score;
        }
        return b.totalConnections - a.totalConnections;
      })
      .map(({ connection }) => connection);

    // If ALL connections are busy then return null (length will be 0, as the array holds all of the possible connections)
    if (sortedConnections.length === 0) {
      // No connections with total connections < 6
      return null;
    }

    // Choose a random connection from the highest score connections
    // (This is just in case there is more than 1 connection in the highest score array)
    const indexOfBestConnection = sortedConnections.length - 1;

    return sortedConnections[indexOfBestConnection];
  }

  getHasPlayerLeaveBeenHandled(map, playerId) {
    if (!allMaps[map]) {
      allMaps[map] = {};
      console.log(`Initialized map for ${map}`);
    }

    return allMaps[map][playerId] || false;
  }

  setHasPlayerLeaveBeenHandled(map, playerId, bool) {
    if (!allMaps[map]) {
      allMaps[map] = {};
      console.log(`Initialized map for ${map}`);
    }

    allMaps[map][playerId] = bool;
    console.log(`Set player leave status for ${playerId} in ${map} to ${bool}`);

    // Set a new timeout for this playerId
    setTimeout(() => {
      allMaps[map][playerId] = !bool;
      console.log(`Timeout expired, set player leave status for ${playerId} in ${map} to ${!bool}`);
    }, 5000);

    console.log(`Set timeout for ${playerId}`);
  }

  getIsCaptchaMap() {
    return captchaMaps[this.map] || false;
  }

  setIsCaptchaMap(bool) {
    captchaMaps[this.map] = bool;
  }

  async waitForPacket(packetId, packetSpaceId, timeout = true, timeoutInMs = 10000) {
    if (this.socket == null) return;
    return new Promise((resolve, reject) => {
      const listener = async (event) => {
        let waitForPacket = this.incomingPacketHandler(packetId, event.data);

        if (Array.isArray(waitForPacket)) {
          const Hash = hstab(bufToHex(event.data).slice(8, 72));
          resolve({ Hash: Hash, hasOpenSpace: event.data.byteLength == 46 });
          removeListener();
        } else if (typeof waitForPacket === "object") {
          if (event.data.byteLength > 20) {
            if (this.spaceIdObject[packetSpaceId] == true) {
              resolve();
              removeListener();
            }
            let splitData = Buffer.from(event.data).toString("hex").slice(6, 42);
            let firstSpace = this.incomingPacketHandler(packetId + "2", "000a002" + splitData.slice(1, 18));
            let secondSpace = this.incomingPacketHandler(packetId + "2", "000a002" + splitData.slice(19, 36));
            if (splitData.slice(2, 18).startsWith("2aaaa") || splitData.slice(20, 36).startsWith("2aaaa")) {
              let result = splitData.slice(20, 36).startsWith("2aaaa") ? splitData.slice(20, 36) : splitData.slice(2, 18);
              resolve(result);
              removeListener();
            }
            if (packetSpaceId == firstSpace.spaceId) {
              resolve(firstSpace);
              removeListener();
            } else if (packetSpaceId == secondSpace.spaceId) {
              resolve(secondSpace);
              removeListener();
            }
          } else {
            const dataBuffer = Buffer.from(event.data).toString("hex");
            if (dataBuffer.startsWith("000a00202aaaaa") && packetSpaceId == "Space Eight") {
              resolve(dataBuffer.split("000a0020")[1]);
              removeListener();
            }
          }

          if (!waitForPacket.packetLength || (event.data.byteLength === waitForPacket.packetLength && packetSpaceId == waitForPacket.spaceId)) {
            resolve(waitForPacket);
            removeListener();
          }
        }
      };

      const removeListener = () => {
        this.socket.removeEventListener("message", listener);
      };

      if (timeout) {
        setTimeout(() => {
          removeListener();
          reject(new Error(`Timeout waiting for packet: ${packetId} ${packetSpaceId}`));
        }, timeoutInMs); // Modify the timeout duration as needed
      }

      this.socket.addEventListener("message", listener);
    });
  }

  async sendPacket(packetName, payload) {
    if (this.socket == null) return;
    const packet = this.outgoingPacketHandler(packetName, payload);
    this.socket.send(packet);
  }

  goodConnection(n = 1) {
    let s = this.connectionString.split("//")[1].split(":")[0];
    serverScores[s].score += n;
    this.logger.info(`[${n} points was awarded to ${s}]`);
  }

  setReconnectLink(connection, map) {
    const connectionString = `c${connection}.eu.tankionline.com`;
    if (serverScores[connectionString] == null) return;
    if (!serverScores[connectionString].reconnectMaps.includes(map)) {
      if (map.length > 0) serverScores[connectionString].reconnectMaps.push(map);
    }
  }

  badConnection(n = 1) {
    let s = this.connectionString.split("//")[1].split(":")[0];
    serverScores[s].score -= n;
    this.logger.info(`[${n} points was removed from ${s}]`);
  }

  endConnection() {
    let s = this.connectionString.split("//")[1].split(":")[0];
    if (!this.reconnectModel) serverScores[s].totalConnections !== 0 ? serverScores[s].totalConnections-- : false;
  }

  outgoingPacketHandler(packetName, payload) {
    switch (packetName) {
      case "CL_HashRequest":
        return new CL_HashRequest(payload).serialize();
      default:
        return "Packet not handeled";
    }
  }

  incomingPacketHandler(packetName, packet) {
    const spaceObject = {
      "000a00200000000005f691cc": "Space Two",
      "000a0020000000d634b693fb": "Space Three",
      "000a00200000000005f7b228": "Space Four",
      "000a00200000000005f6fdcf": "Space Five",
      "000a00200000000005f69398": "Space Six",
      "000a00200000000005f7b21e": "Space Seven",
      "000a0020": "Space Eight",
    };

    switch (packetName) {
      case "SV_HashResponse":
        return [{ packetLength: 46, packetId: "02f96c462d0fba2c" }, { packetLength: 37 }];
      case "SV_OpenSpace":
        let spaceId = spaceObject[bufToHex(packet)];
        this.spaceIdObject[spaceId] = true;
        return { packetLength: 12, spaceId: spaceObject[bufToHex(packet)] };
      case "SV_OpenSpace2":
        this.spaceIdObject[spaceObject[packet]] = true;
        return { packetLength: 12, spaceId: spaceObject[packet] };
      case "SV_Ping":
        return { packetLength: 3 };
      default:
        return "Packet not handeled";
    }
  }

  getConnectionString() {
    return this.connectionString;
  }

  async waitForClose() {
    return new Promise((resolve, reject) => {
      if (this.socket.readyState === WebSocket.CLOSED) {
        // Socket is already closed
        resolve();
      } else {
        const closeListener = function (event) {
          resolve({ success: "Connection Closed" });
        };
        this.socket.addEventListener("close", closeListener);
        this.socket.onerror = function (error) {
          console.log(error);
          resolve(error);
        };
      }
    });
  }

  async waitForError() {
    return new Promise((resolve, reject) => {
      if (this.socket.readyState === WebSocket.CLOSED) {
        // Socket is already closed
        resolve();
      } else {
        const errorListener = function (event) {
          this.logger.error(event.message, "Connection Error");
          resolve({ success: "Connection Closed" });
        };

        this.socket.addEventListener("error", errorListener);
      }
    });
  }

  close() {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    } else {
      setTimeout(() => {
        this.close();
      }, 100);
    }
  }
}

export default ControlChannel;
