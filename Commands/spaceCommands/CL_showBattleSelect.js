class CL_showBattleSelect {
    constructor(spaceId, methodId, callbackId){
        this.spaceId = 100119080n
        this.methodId = 4685032941451085293n
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
        const buffer_length = 2 + 1 + 8 + 8
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
// 0011:00:0000000005f7b228:43224e9c90a6f8f1
export default CL_showBattleSelect;