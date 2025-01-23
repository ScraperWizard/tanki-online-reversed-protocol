import util from 'util';

class CL_logTrackers {
    constructor() {
        this.spaceId = 100119080
        this.methodId = 8295410842997943338n
    }

    serialize() {
        const parameters = {
            spaceId: this.spaceId,
            methodId: this.methodId,
            callbackId: this.callbackId,
        };
        const keys = Object.keys(parameters);
        const values = Object.values(parameters);
        const buffer_length = 139
        const buffer = new ArrayBuffer(buffer_length);
        const view = new DataView(buffer);
        let pos = 0;

        view.setUint16(pos, 137); // Write the packet size
        pos += 2; // Shift position by 2 bytes since the packet size is a short
        view.setUint8(pos, 0); // Nullmap byte
        pos+=5;
        view.setUint32(pos, values[0]) // Space ID
        pos += 4;
        view.setBigInt64(pos, values[1]); // Method ID
        pos += 8;
        view.setUint8(pos, 1);
        const hexString = "775F67613D4741312E312E3639353932343833302E313638383036393935342C205F67615F4D4B39364334365057453D4753312E312E313638383036393935332E312E302E313638383036393935332E302E302E302C205F6662703D66622E312E313638383036393935343230332E313837343136333835";
        const hexBytes = hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16));

        const originalBufferSize = buffer.byteLength;
        const requiredBufferSize = originalBufferSize + hexBytes.length;

        // Create a new buffer with the required size
        const newBuffer = new ArrayBuffer(requiredBufferSize);

        // Copy the existing buffer contents into the new buffer
        const originalView = new Uint8Array(buffer);
        const newView = new Uint8Array(newBuffer);
        newView.set(originalView);

        // Use the new buffer for further operations

        // Set the hex values in the new buffer
        for (const byte of hexBytes) {
            view.setUint8(pos, byte);
            pos++;
        }


        return buffer;
    }
}
export default CL_logTrackers;