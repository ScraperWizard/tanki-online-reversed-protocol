class CL_paymentAction {
    constructor() {
        this.spaceId = 100072911n
        this.methodId = 3470401807971059073n
        this.callbackId = 11
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId,
            callbackId: this.callbackId,
        };
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
        pos += 8;
        view.setBigInt64(pos, values[1]); // Method ID
        pos += 11;
        view.setUint8(pos, this.callbackId); // Nullmap byte
        pos++;
        return buffer;
    }
}

export default CL_paymentAction;

// 0015000000000005F6FDCF3029580EAFFD0581:00 00 00 0B