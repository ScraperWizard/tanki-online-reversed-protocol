class ProductPurchaseModelServer_buyForCoinById {
    constructor() {
        this.spaceId = 100072911n
        this.methodId = 5980543527485052265n
        this.itemId = 920004881533n
        this.quantity = 1
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
        pos+=10
        view.setInt16(pos, this.quantity);
        pos+=4;
        view.setInt8(pos, this.quantity);
        return buffer;
    }
}

// 0021000000000005F6FDCF52FF28A6E7821569:000000D634906C7D:00 00 00 01 00 00 00 01 00
console.log(new ProductPurchaseModelServer_buyForCoinById().serialize())
export default ProductPurchaseModelServer_buyForCoinById;
