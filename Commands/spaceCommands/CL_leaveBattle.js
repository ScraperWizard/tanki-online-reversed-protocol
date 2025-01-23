class CL_leaveBattle {
    constructor() {
        this.spaceId = 100119080
        this.methodId = 5959324075159807966n
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId,
        };
        const keys = Object.keys(parameters);
        const values = Object.values(parameters);
        const buffer_length = 23
        const buffer = new ArrayBuffer(buffer_length);
        const view = new DataView(buffer);
        let pos = 0;
        view.setUint16(pos, buffer_length - 2); // Write the packet size
        pos += 2; // Shift position by 2 bytes since the packet size is a short
        view.setInt8(pos, 0)
        pos+= 5
        view.setUint32(pos, parameters.spaceId)
        pos+= 4
        view.setBigUint64(pos, parameters.methodId)
        return buffer;
    }
}


export default CL_leaveBattle;