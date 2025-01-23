class CL_requestIdle {
    constructor(spaceId, methodId, callbackId){
        this.spaceId = 3074457415313108871n
        this.methodId = 8735842896504496068n
        this.callbackId = 4294967295
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
        pos++;
        view.setBigInt64(pos, values[0]) // Space ID
        pos+=8;
        view.setBigInt64(pos, values[1]); // Method ID
        pos+=8;
        view.setInt8(pos, values[2]); // Callback id
        pos++;
        view.setInt8(pos, values[2]); // Callback id
        pos++;
        view.setInt8(pos, values[2]); // Callback id
        pos++;
        view.setInt8(pos, values[2]); // Callback id

        return buffer;
    }
}
export default CL_requestIdle;


// 00 15 00 2A AA AA BA E4 CD AF 87 79 3B F2 D4 73 C5 1F C4 FF FF FF FF 
// 00 15 00 2a aa aa ba e4 cd af 87 79 3b f2 d4 73 c5 1f c4 ff ff ff ff