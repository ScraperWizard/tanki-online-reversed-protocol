class CL_loginFollowUp{
    constructor(){
        this.spaceId = 100045260
        this.methodId = 3553092084033962840n
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId
        };
        const buffer_length = 17
        const buffer = new ArrayBuffer(buffer_length + 2);
        const view = new DataView(buffer);
        let pos = 0;
        view.setInt16(pos, buffer_length)
        pos+=2
        view.setInt8(pos, 0)
        pos+=5
        view.setUint32(pos, parameters.spaceId); // Space ID
        pos+=4
        view.setBigInt64(pos, parameters.methodId); // Method ID
        pos+=8;
        return buffer;
    }
}

export default CL_loginFollowUp;