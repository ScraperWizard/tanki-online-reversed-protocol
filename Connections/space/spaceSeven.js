import Space from "./SpaceClass.js";
import WebSocket from "ws";
import Cypher from "../../Encryption/cypher.js";
import methods from "../../Commands/spaceCommands/methodIds.js";
import { hstab, bufToHex } from "../space-utils/PacketHelper.js";
import Logger from "../../Logger/Logger.js";
import { CL_dependeciesLoadedTwo, joinBattle } from "../../Commands/spaceCommands/commands.js";
import { BattleInfoCC_Parser, packetsParser } from "../../Commands/spaceCommands/packetsParser.js";
import { HttpsProxyAgent } from "https-proxy-agent";
const spaceIdString = "100119070"; // Used for logs
const spaceIdInString = "0000000005f7b21e";
import uncompressZlib from "../space-utils/PacketslibCompression.js";

class SpaceSeven extends Space {
  constructor(Nickname, Hash, connectionString, proxyUrl) {
    super("Seven");
    this.spaceId = this.getSpaceId();
    this.connectionString = connectionString;
    this.socket = null;
    this.cypher = null;
    this.hash = Hash;
    this.normalHash = bufToHex(Hash);
    this.allComingPacketPromises = [];
    this.logger = new Logger(Nickname);
    this.allComingPacketListeners = {};
    this.proxyUrl = proxyUrl;
  }

  getSpaceId() {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigInt64(0, 100119070n);
    return buffer;
  }

  connectToServer() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.connectionString, { agent: this.proxyUrl == "" ? null : new HttpsProxyAgent(this.proxyUrl) });
      this.socket.binaryType = "arraybuffer";
      this.cypher = new Cypher(this.hash, this.spaceId);

      this.socket.onopen = (e) => {
        this.logger.info("[SpaceConnectionOpened] - 100119070");
        this.socket.send(new DataView(hstab(`002a0003${this.normalHash}0000000005f7b21e`), 0, 44));
        resolve(); // Resolve the promise once connected
      };

      this.socket.onmessage = async (event) => {
        let unencryptedData = Buffer.from(this.cypher.decrypt(event.data));
        if (event.data.byteLength == 3) return; // Ignore ping packets
        this.packetsCounter++;
        let originalDecryptedBuffer = unencryptedData.toString("hex");
        let splittedPacket = originalDecryptedBuffer.split(spaceIdInString);

        const packetLength = parseInt(originalDecryptedBuffer.slice(0, 4).toString("hex"), 16);
        const isPacketLengthCorrect = packetLength * 2 == originalDecryptedBuffer.length - 4;

        if (!isPacketLengthCorrect) {
          this.logger.info("Packet length is incorrect attempting to decompress using zlib...");

          try {
            originalDecryptedBuffer = await uncompressZlib(originalDecryptedBuffer);
            const battleInfoCC = BattleInfoCC_Parser(originalDecryptedBuffer);

            if (battleInfoCC.length > 0 && this.allComingPacketListeners["BattleInfoCC"] && this.allComingPacketListeners["BattleInfoCC"].length > 0) {
              this.allComingPacketListeners["BattleInfoCC"].forEach((listener) => {
                listener(battleInfoCC);
              });

              return;
            }
          } catch (err) {
            console.log(originalDecryptedBuffer, err);
            this.logger.error("Failed to decompress packet " + err);
            return;
          }
        }

        const parsedPacket = !originalDecryptedBuffer.includes(spaceIdInString) ? packetsParser(originalDecryptedBuffer) : { packetsData: [] };

        // This is to trigger all listeners
        for (const packet of parsedPacket.packetsData) {
          if (packet["packetName"] == "Unknown") continue;
          this.logger.incomingPackets(`[Space: ${spaceIdString} Packet Id: ${packet["methodId"]} (Hex) Packet Name: ${packet["packetName"]} Packetdata length: ${parsedPacket.packetsData.length}]`);

          const matchingPromises = this.allComingPacketListeners[packet["packetName"]];

          if (!matchingPromises) continue;

          matchingPromises.forEach((matchingPromise) => {
            matchingPromise(packet);
          });
        }

        if (parsedPacket.packetsData.length > 0) {
          return;
        }

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
                  if (field.regExFunction) {
                    match[field.regExMatch] = field.regExFunction(match[field.regExMatch]);
                  }
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
  }

  async packetHandler(packetId, packetHandlerId) {
    await this.waitForPacket(packetId);
    await this.sendPacket(packetHandlerId);
    this.packetHandler(packetId, packetHandlerId);
  }

  async registerPacket(packetName, handler) {
    if (this.allComingPacketListeners[packetName]) {
      console.log(this.allComingPacketListeners);
      this.allComingPacketListeners[packetName].push(handler);
    } else {
      this.allComingPacketListeners[packetName] = [handler];
    }
  }

  async unregisterPacket(packetName) {
    // delete this.allComingPacketListeners[packetName];
  }

  async sendPacket(packetName, payload) {
    const packet = this.cypher.encrypt(this.outgoingPacketHandler(packetName, payload));
    this.socket.send(packet);
    this.logger.basicOutgoingPackets(`[${spaceIdString} - ${packetName}]`);
  }

  outgoingPacketHandler(packetName, payload) {
    switch (packetName) {
      case "CL_dependeciesLoaded":
        return new CL_dependeciesLoadedTwo(100119070n, 1816792453857564692n, 1).serialize();
      case "CL_joinBattle":
        return new joinBattle(payload.mapLink, payload.side, payload.packets).serialize();
      default:
        return "Packet not handeled";
    }
  }
}

export default SpaceSeven;
