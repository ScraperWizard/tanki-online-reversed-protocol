class CL_hasNoUniqueUserId {
    constructor(){
        this.spaceId = 100072911n
        this.methodId = 735819020173389993n
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId,
            callbackId: this.callbackId,
        };
        const keys = Object.keys(parameters);
        const values = Object.values(parameters);
        const buffer_length = 19
        const buffer = new ArrayBuffer(buffer_length);
        const view = new DataView(buffer);
        let pos = 0;

        view.setUint16(pos, buffer_length - 2); // Write the packet size
        pos += 2; // Shift position by 2 bytes since the packet size is a short
        view.setUint8(pos, 0); // Nullmap byte
        pos++;
        view.setBigInt64(pos, values[0]) // Space ID
        pos+=8;
        view.setBigInt64(pos, values[1]); // Method ID

        return buffer;
    }
}

// 00 11 00 00 00 00 00 05 f6 fd cf 0a 36 27 80 14 69 30 a9
export default CL_hasNoUniqueUserId;