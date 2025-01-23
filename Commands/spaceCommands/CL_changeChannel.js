class CL_changeChannel {
    constructor(text){
        this.text = text
        this.spaceId = 100045720
        this.methodId = 6683616035809206555n
    }

    serialize() {
        const parameters = {
            text: this.text,
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
        let text = values[0]
        for(let i = 0; i < text.length; i++){
            view.setUint8(pos, text.charCodeAt(i))
            pos++
        }
        return buffer;
    }
}

// 0019:0000000005f69398:5cc0f95f8d83211b:07:47454e4552414c
export default CL_changeChannel;

// 00 19 00 00 00 00 00 05 F6 93 98 5C C0 F9 5F 8D 83 21 1B 07 47 45 4E 45 52 41 4c
// 00 19 00 00 00 00 00 05 f6 93 98 5c c0 f9 5f 8d 83 21 1b 07 47 45 4e 45 52 41 4c