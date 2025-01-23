import WebSocket from "ws";
import IncomingPackets from "../IncomingPackets.js";

class Space {
    constructor(space) {
        this.space = space
        this.packetsCounter = 0
    }

    async registerPacket(packetId, handler) {
        const data = await this.waitForPacket(packetId)
        handler(data)
        this.registerPacket(packetId, handler)
    }

    async waitForClose() {
        return new Promise((resolve, reject) => {
            if (this.socket.readyState === WebSocket.CLOSED) {
                // Socket is already closed
                resolve();
            } else {
                this.socket.onclose = function (event) {
                    resolve();
                };

                this.socket.onerror = function (error) {
                    console.log(error);
                    reject(error);
                };
            }
        });
    }

    incomingPacketHandler(packetName) {
        for (let i = 0; i < IncomingPackets.length; i++) {
            let spaceBoolean = IncomingPackets[i].space !== undefined ? this.space == IncomingPackets[i].space : true
            if (IncomingPackets[i].name == packetName && spaceBoolean) {
                return [IncomingPackets[i]]
            }
        }
        return "Packet not registered"
    }

    async waitForNPackets(n = 1) {
        const currentPackets = this.packetsCounter
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (this.packetsCounter >= currentPackets + n) {
                    clearInterval(interval)
                    resolve()
                }
            }, 100)
        })
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

export default Space;