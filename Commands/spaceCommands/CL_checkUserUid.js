class CL_checkUserUid {
    constructor(Uid){
        this.Uid = Uid
        this.spaceId = 100045260
        this.methodId = 1968867162405923123n
    }

    serialize() {
        const parameters = {
            Uid: this.Uid,
            spaceId: this.spaceId,
            methodId: this.methodId,
        };
        const keys = Object.keys(parameters);
        const values = Object.values(parameters);
        const buffer_length = 2 + 1 + 8 + 8 + 1 + values[0].length
        const buffer = new ArrayBuffer(buffer_length);
        const view = new DataView(buffer);
        let pos = 0;

        view.setUint16(pos, buffer_length - 2); // Write the packet size
        pos += 2; // Shift position by 2 bytes since the packet size is a short
        view.setUint8(pos, 0); // Nullmap byte
        pos+=5;
        view.setUint32(pos, values[1]); // Space ID
        pos+=4;
        view.setBigInt64(pos, values[2]); // Method ID
        pos+=8;
        view.setUint8(pos, values[0].length);
        pos++
        let username = values[0]
        for(let i = 0; i < username.length; i++){
            view.setUint8(pos, username.charCodeAt(i))
            pos++
        }
        return buffer;
    }
}
// For reference -> "Packet: 0017:00:0000000005f691cc:1B52D240B122E933:05:6265616b73"

export default CL_checkUserUid;