class CL_addByUid {
    constructor(obj){
        this.text = obj.name
        this.spaceId = BigInt('0x' + obj.space);
        this.methodId = 6022194843011994849n
    }

    serialize() {
        const parameters = {
            text: this.text,
            spaceId: this.spaceId,
            methodId: this.methodId,
        };
        const keys = Object.keys(parameters);
        const values = Object.values(parameters);
        const buffer_length = 2 + 1 + 8 + 8 + 1 + values[0].length;
        const buffer = new ArrayBuffer(buffer_length);
        const view = new DataView(buffer);
        let pos = 0;

        view.setUint16(pos, buffer_length - 2); // Write the packet size
        pos += 2; // Shift position by 2 bytes since the packet size is a short
        view.setUint8(pos, 0); // Nullmap byte
        pos++
        view.setBigInt64(pos, values[1]); // Space ID
        pos+=8;
        view.setBigInt64(pos, values[2]); // Method ID
        pos+=8;
        view.setUint8(pos, values[0].length);
        pos++
        let text = values[0]
        for(let i = 0; i < text.length; i++){
            view.setUint8(pos, text.charCodeAt(i))
            pos++
        }
        return buffer;
    }
}

export default CL_addByUid;