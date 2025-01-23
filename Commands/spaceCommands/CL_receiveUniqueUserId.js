class CL_receiveUniqueUserId {
    constructor(spaceId, methodId, callbackId){
        this.spaceId = 100072911n
        this.methodId = 8477726141190698081n
        this.callbackId = 3074457408618983658n
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId,
            callbackId: this.callbackId,
        };
        const keys = Object.keys(parameters);
        const values = Object.values(parameters);
        const buffer_length = 2 + 1 + 8 + 8 + 8
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
        view.setBigInt64(pos, values[2]); // Callback id

        return buffer;
    }
}
// 3. 0019:00:000000000005f6fdcf:75a6ef022cb6f461:2aaaab955cd70ea
export default CL_receiveUniqueUserId;