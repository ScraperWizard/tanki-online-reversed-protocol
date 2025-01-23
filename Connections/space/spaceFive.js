import Space from "./SpaceClass.js";
import WebSocket from "ws";
import Cypher from "../../Encryption/cypher.js";
import { hstab, bufToHex } from "../space-utils/PacketHelper.js";
import Logger from "../../Logger/Logger.js";
import methods from "../../Commands/spaceCommands/methodIds.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import {
  CL_dependeciesLoadedTwo,
  CL_uploadClientSettings,
  CL_hasNoUniqueUserId,
  CL_requestIdle,
  CL_paymentAction,
  CL_getPaymentUrl,
  CL_buyForCrystalById,
  ProductPurchaseModelServer_buyForCoinById,
  CaptchaModelServer_getNewCaptcha,
  CaptchaModelServer_checkCaptcha,
} from "../../Commands/spaceCommands/commands.js";
const spaceIdString = "100072911"; // Used for logs
const spaceIdInString = "0000000005f6fdcf";

class SpaceFive extends Space {
  constructor(Nickname, Hash, connectionString, proxyUrl) {
    super("Five");
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
    view.setBigInt64(0, 100072911n);
    return buffer;
  }

  connectToServer() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.connectionString, { agent: this.proxyUrl == "" ? null : new HttpsProxyAgent(this.proxyUrl) });
      this.socket.binaryType = "arraybuffer";
      this.cypher = new Cypher(this.hash, this.spaceId);

      this.socket.onopen = (e) => {
        this.logger.info("[SpaceConnectionOpened] - 100072911");
        this.socket.send(new DataView(hstab(`002a0003${this.normalHash}0000000005f6fdcf`), 0, 44));
        resolve(); // Resolve the promise once connected
      };

      const closeListener = (event) => {
        this.logger.error(`[${spaceIdString} - Closed Connection]`);
      };

      this.socket.onmessage = (event) => {
        let unencryptedData = Buffer.from(this.cypher.decrypt(event.data));
        if (event.data.byteLength == 3) return; // Ignore ping packets
        this.packetsCounter++;
        let decryptedBuffer = unencryptedData.toString("hex");

        let splittedPacket = decryptedBuffer.split(spaceIdInString);

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
  }

  async sendPacket(packetName, payload) {
    const packet = this.cypher.encrypt(this.outgoingPacketHandler(packetName, payload));
    this.socket.send(packet);
    this.logger.basicOutgoingPackets(`[${spaceIdString} - ${packetName}]`);
  }

  outgoingPacketHandler(packetName, payload) {
    switch (packetName) {
      case "CL_dependeciesLoaded":
        return new CL_dependeciesLoadedTwo(100072911n, 1816792453857564692n, 1).serialize();
      case "CL_uploadClientSettings":
        return new CL_uploadClientSettings().serialize();
      case "CL_hasNotUniqueUserId":
        return new CL_hasNoUniqueUserId().serialize();
      case "CL_requestIdle":
        return new CL_requestIdle().serialize();
      case "CL_paymentAction":
        return new CL_paymentAction().serialize();
      case "CL_getPaymentUrl":
        return new CL_getPaymentUrl().serialize();
      case "CaptchaModelServer_getNewCaptcha":
        return new CaptchaModelServer_getNewCaptcha().serialize();
      case "CaptchaModelServer_checkCaptcha":
        return new CaptchaModelServer_checkCaptcha(payload).serialize();
      case "CL_buyForCrystalById":
        return new CL_buyForCrystalById().serialize();
      case "ProductPurchaseModelServer_buyForCoinById":
        return new ProductPurchaseModelServer_buyForCoinById().serialize();
      default:
        return "Packet not handeled";
    }
  }
}

export default SpaceFive;
