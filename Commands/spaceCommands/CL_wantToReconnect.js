class CL_wantToReconnect {
    constructor(spaceId, methodId, callbackId){
        this.spaceId = spaceId
        this.methodId = methodId
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId,
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

export default CL_wantToReconnect;