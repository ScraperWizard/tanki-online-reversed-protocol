class CL_loginByHash {
    constructor(hash, spaceId, methodId) {
        this.hash = hash
        this.spaceId = spaceId
        this.methodId = methodId
    }

    serialize() {
        const parameters = {
            hash: this.hash,
            spaceId: this.spaceId,
            methodId: this.methodId
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
        pos += 5;
        view.setUint32(pos, values[1]); // Space ID
        pos += 4;
        view.setBigInt64(pos, values[2]); // Method ID
        pos += 8;
        view.setUint8(pos, values[0].length);
        pos++
        let username = values[0]
        for (let i = 0; i < username.length; i++) {
            view.setUint8(pos, username.charCodeAt(i))
            pos++
        }
        return buffer;
    }
}

// For reference -> 0052:00:0000000005f691cc:6ec46e04f12f1029:40:35394C4A6D46655959777745675558516134376F7446505A6D4537557A6A687565766551536937664B59465837794A506F306B456349736A526F7535554C4737
export default CL_loginByHash;