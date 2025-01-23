class CL_buyForCrystalById {
    constructor() {
        this.spaceId = 100072911n
        this.methodId = 7718056566748184322n
        this.itemId = 10007257n
        this.quantity = 1099511627775
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId,
            itemId: this.itemId,
        };
        const values = Object.values(parameters);
        const buffer_length = 35
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
        pos+=8
        view.setInt32(pos, this.quantity);
        pos++;
        console.log(buffer)
        return buffer;
    }
}

export default CL_buyForCrystalById;
