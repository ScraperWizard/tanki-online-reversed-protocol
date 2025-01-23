class CL_getPaymentUrl {
    constructor() {
        this.spaceId = 920009600850n
        this.methodId = 4655104222383612536n
        this.itemId = 1931009801105n
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId,
            itemId: this.itemId,
        };
        const values = Object.values(parameters);
        const buffer_length = 27
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
        pos += 8;
        view.setBigInt64(pos, this.itemId); // Nullmap byte
        pos++;
        return buffer;
    }
}

// console.log(new CL_getPaymentUrl().serialize())
export default CL_getPaymentUrl;

// 0019:00:000000D634D86F52:409A40A05F98A278:000001C199273B91