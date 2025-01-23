class CL_smMedia {
    constructor(Uid, password){
        this.spaceId = 100045260
        this.methodId = 2045663294076292n
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId,
        };
        const keys = Object.keys(parameters);
        const values = Object.values(parameters);
        const buffer_length = 2 + 1 + 8 + 8 +1
        const buffer = new ArrayBuffer(buffer_length);
        const view = new DataView(buffer);
        let pos = 0;

        view.setUint16(pos, 18); // Write the packet size
        pos += 2; // Shift position by 2 bytes since the packet size is a short
        view.setUint8(pos, 0); // Nullmap byte
        pos+=5;
        view.setUint32(pos, parameters.spaceId); // Space ID
        pos+=4;
        view.setBigInt64(pos, parameters.methodId); // Method ID
        pos+=8;
        view.setUint8(pos, 0);
        pos++
        return buffer;
    }
}
// 0012:00:0000000005f691cc:0007448519f93584:00:746573744265616b73:09:746573744265616b73
// // 0012:00:0000000005f691cc:0007448519f93584:00:74657374696e6754616e6b69:0e:74657374696e6754616e6b69
export default CL_smMedia;