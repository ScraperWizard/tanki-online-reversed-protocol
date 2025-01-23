class CL_subscribe {
    constructor(userId) {
        this.mapLink = userId
        this.spaceId = 100119080n
        this.methodId = 5429494051830592977n
    }

    serialize() {
        const parameters = {
            mapLink: this.mapLink,
            spaceId: this.spaceId,
            methodId: this.methodId,
        };
        const keys = Object.keys(parameters);
        const values = Object.values(parameters);
        const buffer_length = 2 + 1 + 8 + 8 + 8
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
        view.setBigInt64(pos, hexToDecimal(values[0])); // Battle link

        function hexToDecimal(s) {

            function add(x, y) {
                var c = 0, r = [];
                var x = x.split('').map(Number);
                var y = y.split('').map(Number);
                while(x.length || y.length) {
                    var s = (x.pop() || 0) + (y.pop() || 0) + c;
                    r.unshift(s < 10 ? s : s - 10); 
                    c = s < 10 ? 0 : 1;
                }
                if(c) r.unshift(c);
                return r.join('');
            }
        
            var dec = '0';
            s.split('').forEach(function(chr) {
                var n = parseInt(chr, 16);
                for(var t = 8; t; t >>= 1) {
                    dec = add(dec, dec);
                    if(n & t) dec = add(dec, '1');
                }
            });
            return dec;
        }
        return buffer;
    }
}

export default CL_subscribe;