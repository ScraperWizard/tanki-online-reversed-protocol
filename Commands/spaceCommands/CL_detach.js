class CL_detach {
    constructor(spaceId, methodId, callbackId){
        this.spaceId = 4722366482867497745772n
        this.methodId = 2528403217084400809n
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
// 5. 0011:00:ffffffffff80003d6c:2316b154734544a9:01
export default CL_detach;