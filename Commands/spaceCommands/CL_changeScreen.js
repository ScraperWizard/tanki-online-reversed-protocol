class CL_changeScreen {
    constructor(callbackId) {
        this.spaceId = 100119080n
        this.methodId = 861194913719010141n
        this.callbackId = callbackId
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId,
            callbackId: this.callbackId,
        };
        const callBackMap = {
            "Initial": 11,
            "Pro Battle": 2826,
            "Parkour": 2570,
            "Battle": 0,
            "Map": 10,
        }
        this.callbackId = callBackMap[this.callbackId]
        const keys = Object.keys(parameters);
        const values = Object.values(parameters);
        let buffer_length;
        let nullMapByte = 26;
        if(this.callbackId == 11) {
            buffer_length = 2 + 1 + 8 + 8 + 4
        } else {
            buffer_length = 2 + 1 + 8 + 8 + 4 + 4
        }

        if(this.callbackId == 0) {
            buffer_length = 19
        }

        if(this.callbackId == 10) {
            buffer_length = 23;
            nullMapByte = 14;
        }

        if(this.callbackId == 2570) {
            nullMapByte = 10
        }
        const buffer = new ArrayBuffer(buffer_length);
        const view = new DataView(buffer);
        let pos = 0;
        if(this.callbackId == 2570) {
            view.setUint16(pos, buffer_length - 2); // Write the packet size
            pos += 2; // Shift position by 2 bytes since the packet size is a short
            view.setUint8(pos, nullMapByte); // Nullmap byte
            pos++;
            view.setBigInt64(pos, values[0]) // Space ID
            pos += 8;
            view.setBigInt64(pos, values[1]); // Method ID
            pos += 8; // Increment pos by 8 to reach the end
            pos += 6; // Increment pos by 8 to reach the end
            view.setUint8(pos, this.callbackId);
            pos++
            view.setUint8(pos, this.callbackId);
        } else if(this.callbackId == 2826) {
            nullMapByte = 10
            view.setUint16(pos, buffer_length - 2); // Write the packet size
            pos += 2; // Shift position by 2 bytes since the packet size is a short
            view.setUint8(pos, nullMapByte); // Nullmap byte
            pos++;
            view.setBigInt64(pos, values[0]) // Space ID
            pos += 8;
            view.setBigInt64(pos, values[1]); // Method ID
            pos += 8; // Increment pos by 8 to reach the end
            pos += 6; // Increment pos by 8 to reach the end
            view.setUint16(pos, this.callbackId);
        } else if(this.callbackId == 11){
            nullMapByte = 26
            view.setUint16(pos, buffer_length - 2); // Write the packet size
            pos += 2; // Shift position by 2 bytes since the packet size is a short
            view.setUint8(pos, nullMapByte); // Nullmap byte
            pos++;
            view.setBigInt64(pos, values[0]) // Space ID
            pos += 8;
            view.setBigInt64(pos, values[1]); // Method ID
            pos+=11
            view.setUint8(pos, this.callbackId);
        } else if(this.callbackId == 0){
            nullMapByte = 30
            view.setUint16(pos, buffer_length - 2); // Write the packet size
            pos += 2; // Shift position by 2 bytes since the packet size is a short
            view.setUint8(pos, nullMapByte); // Nullmap byte
            pos++;
            view.setBigInt64(pos, values[0]) // Space ID
            pos += 8;
            view.setBigInt64(pos, values[1]); // Method ID
        } else if(this.callbackId == 10){
            nullMapByte = 30
            view.setUint16(pos, buffer_length - 2); // Write the packet size
            pos += 2; // Shift position by 2 bytes since the packet size is a short
            view.setUint8(pos, nullMapByte); // Nullmap byte
            pos++;
            view.setBigInt64(pos, values[0]) // Space ID
            pos += 8;
            view.setBigInt64(pos, values[1]); // Method ID
            pos += 10; // Increment pos by 8 to reach the end
            view.setUint16(pos, this.callbackId);
        }

        return buffer;
    }
}

// Initial, Parkour, Pro Battle, Map
export default CL_changeScreen;