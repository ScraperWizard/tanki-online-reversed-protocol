class CL_dependeciesLoaded {
    constructor(spaceId, methodId, callbackId){
        this.spaceId = spaceId
        this.methodId = methodId
        this.callbackId = callbackId
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId,
            callbackId: this.callbackId,
        };
        const keys = Object.keys(parameters);
        const values = Object.values(parameters);
        const buffer_length = 23
        const buffer = new ArrayBuffer(buffer_length);
        const view = new DataView(buffer);
        let pos = 0;

        view.setUint16(pos, buffer_length - 2); // Write the packet size
        pos += 2; // Shift position by 2 bytes since the packet size is a short
        view.setUint8(pos, 0); // Nullmap byte
        pos+=5;
        view.setUint32(pos, values[0])
        pos+=4;
        view.setBigInt64(pos, values[1]); // Method ID
        pos+=8;
        view.setUint32(pos, 1);

        return buffer;
    }
}

export default CL_dependeciesLoaded;