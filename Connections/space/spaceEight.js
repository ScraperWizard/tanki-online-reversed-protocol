import Space from "./SpaceClass.js";
import WebSocket from "ws";
import Cypher from "../../Encryption/cypher.js";
import { hstab, bufToHex } from "../space-utils/PacketHelper.js";
import Logger from "../../Logger/Logger.js";
import methods from "../../Commands/spaceCommands/methodIds.js";
import { CL_dependeciesLoaded } from "../../Commands/spaceCommands/commands.js";
import { HttpsProxyAgent } from "https-proxy-agent";

class SpaceEight extends Space {
  constructor(Nickname, Hash, connectionString, mapLink, proxyUrl) {
    super("Eight");
    this.mapLink = mapLink;
    this.spaceId = this.getSpaceId();
    this.hash = Hash;
    this.normalHash = bufToHex(Hash);
    this.connectionString = connectionString;
    this.socket = null;
    this.cypher = null;
    this.spaceIdInString = mapLink;
    this.allComingPacketPromises = [];
    this.logger = new Logger(Nickname);
    this.proxyUrl = proxyUrl;
  }

  getSpaceId() {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    const hexString = this.mapLink;

    // Convert the stripped hex string to a BigInt
    const bigIntValue = BigInt(`0x${this.mapLink}`);

    // Use the BigInt value as needed
    view.setBigInt64(0, bigIntValue);

    return buffer;
  }

  connectToServer() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.connectionString, { agent: this.proxyUrl == "" ? null : new HttpsProxyAgent(this.proxyUrl) });
      this.cypher = new Cypher(this.hash, this.spaceId);
      this.socket.binaryType = "arraybuffer";

      this.socket.onopen = (e) => {
        this.logger.info(`[SpaceConnectionOpened] - ${this.mapLink}`);
        this.socket.send(new DataView(hstab(`002a0003${this.normalHash}${this.mapLink}`), 0, 44));
        resolve(); // Resolve the promise once connected
      };

      this.socket.onmessage = (event) => {
        this.packetsCounter++;
        const unencryptedData = Buffer.from(this.cypher.decrypt(event.data));
        if (event.data.byteLength == 3) return; // Ignore ping packets
        const unencryptedBuffer = unencryptedData.toString("hex");
        const regex = new RegExp(`${this.spaceIdInString}(.{16})`);
        const match = unencryptedBuffer.match(regex);
        if (match) {
          let incomingPacketMethodID = match[1];
          let packetInDecimal = BigInt(`0x${incomingPacketMethodID}`).toString();
          let length = event.data.byteLength;
          let packetName = methods[packetInDecimal];
          this.logger.incomingPackets(`[Packet Length: ${length} Packet Id: ${incomingPacketMethodID} (Hex) Packet Name: ${packetName}]`);

          // Find the matching packets
          const matchingPromises = this.allComingPacketPromises.filter((promise) => promise.packetName === incomingPacketMethodID);

          // Resolve and remove all matching promises
          matchingPromises.forEach((matchingPromise) => {
            const promise = matchingPromise.promise;
            if (matchingPromise.fields) {
              const returnObject = {};
              matchingPromise.fields.forEach((field) => {
                const match = unencryptedBuffer.match(field.regEx);
                returnObject[field.key] = match[1];
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
        this.logger.error(`[${this.mapLink} - Closed Connection`);
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
          this.logger.basicIncomingPackets(`[${this.spaceIdInString} - ${packetId}]`);
          resolve(result);
        });
      }
    });
  }

  async sendPacket(packetName) {
    const packet = this.outgoingPacketHandler(packetName);
    if (Array.isArray(packet)) {
      packet.forEach((message) => this.socket.send(message));
    } else {
      this.socket.send(this.cypher.encrypt(packet));
    }
  }

  outgoingPacketHandler(packetName) {
    switch (packetName) {
      case "CL_dependeciesLoaded":
        return new CL_dependeciesLoaded(3074457415621528875n, 1816792453857564692n, 1).serialize();
      default:
        return "Packet not handeled";
    }
  }

  incomingPacketHandler(packetName) {
    switch (packetName) {
      case "SV_loadDependencies":
        return [{ packetId: "2ca2091458b7bc93" }];
      default:
        return "Packet not handeled";
    }
  }
}

export default SpaceEight;
