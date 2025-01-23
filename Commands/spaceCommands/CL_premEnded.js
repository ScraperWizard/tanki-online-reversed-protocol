class CL_premEnded {
    constructor(){
        this.spaceId = 100119080
        this.methodId = 4685032941451085293n
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId,
        };
        const keys = Object.keys(parameters);
        const values = Object.values(parameters);
        const buffer_length = 2 + 1 + 8 + 8
        const buffer = new ArrayBuffer(buffer_length);
        const view = new DataView(buffer);
        let pos = 0;

        view.setUint16(pos, buffer_length - 2); // Write the packet size
        pos += 2; // Shift position by 2 bytes since the packet size is a short
        view.setUint8(pos, 0); // Nullmap byte
        pos+=5;
        view.setUint32(pos, parameters.spaceId); // Space ID
        pos+=4;
        view.setBigInt64(pos, parameters.methodId); // Method ID
        pos+=8;
        return buffer;
    }
}
// 0011:00:00000005f7b228:410494a34c3205ed
export default CL_premEnded;