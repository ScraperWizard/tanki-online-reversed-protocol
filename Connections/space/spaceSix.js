import Space from "./SpaceClass.js";
import WebSocket from "ws";
import Cypher from "../../Encryption/cypher.js";
import Logger from "../../Logger/Logger.js";
import { hstab, bufToHex } from "../space-utils/PacketHelper.js";
import methods from "../../Commands/spaceCommands/methodIds.js";
import { CL_dependeciesLoadedTwo, CL_changeChannel } from "../../Commands/spaceCommands/commands.js";
import { HttpsProxyAgent } from "https-proxy-agent";

const spaceIdString = "100045720"; // Used for logs
const spaceIdInString = "0000000005f69398";

class SpaceSix extends Space {
  constructor(Nickname, Hash, connectionString, proxyUrl) {
    super("Six");
    this.spaceId = this.getSpaceId();
    this.connectionString = connectionString;
    this.hash = Hash;
    this.normalHash = bufToHex(Hash);
    this.socket = null;
    this.cypher = null;
    this.logger = new Logger(Nickname);
    this.allComingPacketPromises = [];
    this.proxyUrl = proxyUrl;
  }

  getSpaceId() {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigInt64(0, 100045720n);
    return buffer;
  }

  connectToServer() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.connectionString, { agent: this.proxyUrl == "" ? null : new HttpsProxyAgent(this.proxyUrl) });
      this.socket.binaryType = "arraybuffer";
      this.cypher = new Cypher(this.hash, this.spaceId);

      this.socket.onopen = (e) => {
        this.logger.info("[SpaceConnectionOpened] - 100045720");
        this.socket.send(new DataView(hstab(`002a0003${this.normalHash}0000000005f69398`), 0, 44));
        resolve(); // Resolve the promise once connected
      };

      this.socket.onmessage = (event) => {
        const unencryptedData = Buffer.from(this.cypher.decrypt(event.data));
        if (event.data.byteLength == 3) return; // Ignore ping packets
        this.packetsCounter++;
        let orginialunencryptedBuffer = unencryptedData.toString("hex");

        if (event.data.byteLength > 800) {
          // orginialunencryptedBuffer = uncompressZlib(unencryptedData)
          this.logger.info(`[${spaceIdString} - Compressed Packet]`);
        }

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
                let match = unencryptedBuffer.match(field.regEx);
                if (match.length > 0) {
                  if (field.regExFunction) {
                    if (field.regExMatch === null) {
                      const allMatches = match;
                      returnObject[field.key] = field.regExFunction(allMatches);
                    } else {
                      match[field.regExMatch] = field.regExFunction(match[field.regExMatch]);
                      returnObject[field.key] = match[field.regExMatch];
                    }
                  } else {
                    returnObject[field.key] = match[field.regExMatch];
                  }
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

  async sendPacket(packetName, payload) {
    const packet = this.cypher.encrypt(this.outgoingPacketHandler(packetName, payload));
    this.socket.send(packet);
    this.logger.basicOutgoingPackets(`[${spaceIdString} - ${packetName}]`);
  }

  outgoingPacketHandler(packetName, payload) {
    switch (packetName) {
      case "CL_dependeciesLoaded":
        return new CL_dependeciesLoadedTwo(100045720n, 1816792453857564692n, 1).serialize();
      case "CL_changeChannel":
        return new CL_changeChannel(payload).serialize();
      default:
        return "Packet not handeled";
    }
  }
}

export default SpaceSix;
