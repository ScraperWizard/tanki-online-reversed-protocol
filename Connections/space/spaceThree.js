import Space from "./SpaceClass.js";
import WebSocket from "ws";
import Cypher from "../../Encryption/cypher.js";
import Logger from "../../Logger/Logger.js";
import methods from "../../Commands/spaceCommands/methodIds.js";
import { hstab, bufToHex } from "../space-utils/PacketHelper.js";
import { CL_dependeciesLoadedTwo } from "../../Commands/spaceCommands/commands.js";
import { HttpsProxyAgent } from "https-proxy-agent";

const spaceIdString = "920007382011"; // Used for logs
const spaceIdInString = "000000d634b693fb";

class SpaceThree extends Space {
  constructor(Nickname, Hash, connectionString, proxyUrl) {
    super("Three");
    this.spaceId = this.getSpaceId();
    this.connectionString = connectionString;
    this.socket = null;
    this.hash = Hash;
    this.normalHash = bufToHex(Hash);
    this.cypher = null;
    this.logger = new Logger(Nickname);
    this.allComingPacketPromises = [];
    this.proxyUrl = proxyUrl;
  }

  getSpaceId() {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigInt64(0, 920007382011n);
    return buffer;
  }

  bufToHex(buffer) {
    // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }

  connectToServer() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.connectionString, { agent: this.proxyUrl == "" ? null : new HttpsProxyAgent(this.proxyUrl) });
      this.cypher = new Cypher(this.hash, this.spaceId);
      this.socket.binaryType = "arraybuffer";

      this.socket.onopen = (e) => {
        this.logger.info("[SpaceConnectionOpened] - 920007382011");
        this.socket.send(new DataView(hstab(`002a0003${this.normalHash}000000d634b693fb`), 0, 44));
        resolve(); // Resolve the promise once connected
      };

      this.socket.onmessage = (event) => {
        const unencryptedData = Buffer.from(this.cypher.decrypt(event.data));
        if (event.data.byteLength == 3) return; // Ignore ping packets
        this.packetsCounter++;
        const orginialunencryptedBuffer = unencryptedData.toString("hex");
        let splittedPacket = orginialunencryptedBuffer.split(spaceIdInString);

        for (let i = 0; i < splittedPacket.length; i++) {
          let unencryptedBuffer = `${spaceIdInString}${splittedPacket[i]}`;
          const regex = new RegExp(`${spaceIdInString}(.{16})`);
          const match = unencryptedBuffer.match(regex);
          let incomingPacketMethodID = match ? match[1] : "Undefined";
          let packetInDecimal;
          let length = unencryptedBuffer.length;
          let packetName;

          try {
            packetInDecimal = BigInt(`0x${incomingPacketMethodID}`).toString();
          } catch (error) {
            packetInDecimal = "Undefined";
          }

          if (packetInDecimal in methods) {
            packetName = methods[packetInDecimal];
          } else {
            packetName = "Undefined";
          }

          this.logger.incomingPackets(`[Space: ${spaceIdString} Packet Length: ${length} Packet Id: ${incomingPacketMethodID} (Hex) Packet Name: ${packetName}]`);
          // Find the matching packets
          const matchingPromises = this.allComingPacketPromises.filter((promise) => promise.packetName === incomingPacketMethodID);

          // Resolve and remove all matching promises
          matchingPromises.forEach((matchingPromise) => {
            const promise = matchingPromise.promise;
            if (matchingPromise.fields) {
              const returnObject = {};
              matchingPromise.fields.forEach((field) => {
                const match = unencryptedBuffer.match(field.regEx);
                if (match.length > 0) {
                  returnObject[field.key] = match[field.regExMatch];
                } else {
                  returnObject[field.key] = "Undefined";
                }
              });
              promise(returnObject);
            } else {
              promise("Resolve value here");
            }
            const promiseIndex = this.allComingPacketPromises.indexOf(matchingPromise);
            this.allComingPacketPromises.splice(promiseIndex, 1);
          });
        }
      };

      const closeListener = (event) => {
        this.logger.error(`[${spaceIdString} - Closed Connection]`);
      };

      this.socket.addEventListener("close", closeListener);

      // Handle any connection errors
      this.socket.onerror = (error) => {
        reject(error); // Reject the promise if there is an error
      };
    });
  }

  async registerPacket(packetId, handler) {
    await this.waitForPacket(packetId);
    handler();
    this.registerPacket(packetId, handler);
  }

  async waitForPacket(packetId) {
    return new Promise((resolve, reject) => {
      const waitForPacket = this.incomingPacketHandler(packetId);

      for (let i = 0; i < waitForPacket.length; i++) {
        let resolveFunction;
        const promise = new Promise((resolve, reject) => {
          resolveFunction = resolve;
        });
        const promiseObject = { packetName: waitForPacket[i].packetId, promise: resolveFunction, fields: waitForPacket[i].fields };
        this.allComingPacketPromises.push(promiseObject);

        promise.then((result) => {
          this.logger.basicIncomingPackets(`[${spaceIdString} - ${packetId}]`);
          resolve(result);
        });
      }
    });

    // Note:
    // if (packetId == "SV_loadDependencies" && counter == 2) {
    //     resolve()
    // }
  }

  async sendPacket(packetName) {
    const packet = this.cypher.encrypt(this.outgoingPacketHandler(packetName));
    this.socket.send(packet);
    this.logger.basicOutgoingPackets(`[${spaceIdString} - ${packetName}]`);
  }

  outgoingPacketHandler(packetName, payload) {
    switch (packetName) {
      case "CL_dependeciesLoaded":
        return new CL_dependeciesLoadedTwo(920007382011n, 1816792453857564692n).serialize();
      default:
        return "Packet not handeled";
    }
  }
}

export default SpaceThree;
