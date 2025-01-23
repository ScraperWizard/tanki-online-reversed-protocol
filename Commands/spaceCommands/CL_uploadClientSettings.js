class CL_uploadClientSettings {
    constructor(spaceId, methodId, callbackId){
        this.spaceId = 100072911n
        this.methodId = 6896599104430193688n
        this.callbackId = 1
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId,
            callbackId: this.callbackId,
        };
        const keys = Object.keys(parameters);
        const values = Object.values(parameters);
        const buffer_length = 2 + 1 + 8 + 8 + 1
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
        pos+=8;
        view.setInt8(pos, values[2]); // Callback id

        return buffer;
    }
}

export default CL_uploadClientSettings;


// 00 12 00 00 00 00 00 05 F6 FD CF 5F B5 A4 58 81 D6 BC 18 01
// 00 12 00 00 00 00 00 05 f6 fd cf 5f b5 a4 58 81 d6 bc 18 01