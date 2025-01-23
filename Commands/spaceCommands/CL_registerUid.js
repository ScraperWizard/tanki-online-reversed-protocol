class CL_registerUid {
    constructor(Uid, password){
        this.Uid = Uid
        this.password = password
        this.spaceId = 100045260
        this.methodId = 1968866752316155064n
    }

    serialize() {
        const parameters = {
            Uid: this.Uid,
            password: this.password,
            spaceId: this.spaceId,
            methodId: this.methodId,
            text: "tankionline.com",
        };
        const keys = Object.keys(parameters);
        const values = Object.values(parameters);
        const buffer_length = 2 + 1 + 8 + 8 + 1 + parameters.Uid.length + 1 + parameters.password.length + 1 + parameters.text.length + 3
        const buffer = new ArrayBuffer(buffer_length);
        const view = new DataView(buffer);
        let pos = 0;

        view.setUint16(pos, buffer_length - 2); // Write the packet size
        pos += 2; // Shift position by 2 bytes since the packet size is a short
        view.setUint8(pos, 16); // Nullmap byte
        pos+=5;
        view.setUint32(pos, parameters.spaceId); // Space ID
        pos+=4;
        view.setBigInt64(pos, parameters.methodId); // Method ID
        pos+=8;
        view.setUint8(pos, parameters.Uid.length);
        pos++
        let username = parameters.Uid
        for(let i = 0; i < username.length; i++){
            view.setUint8(pos, username.charCodeAt(i))
            pos++
        }
        view.setUint8(pos, parameters.password.length);
        pos++
        let password = parameters.password
        for(let i = 0; i < password.length; i++){
            view.setUint8(pos, password.charCodeAt(i))
            pos++
        }
        view.setUint8(pos, parameters.text.length)
        pos++
        let text = parameters.text
        for(let i = 0; i < text.length; i++){
            view.setUint8(pos, text.charCodeAt(i))
            pos++
        }
        view.setUint8(pos, 1)
        return buffer;
    }
}

// 0040:10:0000000005f691cc:1b52d1e135e1a4b8:0c:4265616b735f74616e6b6572:0e:4265616b735f74616e6b65723132:0f:7461
export default CL_registerUid;