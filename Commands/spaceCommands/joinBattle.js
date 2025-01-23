class joinBattle {
  constructor(mapLink, side, packets = 2) {
    this.mapLink = mapLink;
    this.side = side;
    this.methodId = 7272171964896889145n;
    this.packets = packets;
  }

  serialize() {
    const parameters = {
      mapLink: this.mapLink,
      side: this.side,
      methodId: this.methodId,
    };
    const values = Object.values(parameters);
    const fixed_size = 2 + 1;
    const buffer_length = fixed_size + (8 + 8 + 4) * this.packets;
    const buffer = new ArrayBuffer(buffer_length);
    const view = new DataView(buffer);
    let pos = 0;

    view.setUint16(pos, buffer_length - 2); // Write the packet size
    pos += 2; // Shift position by 2 bytes since the packet size is a short
    view.setUint8(pos, 0); // Nullmap byte
    pos++;
    for (let i = 0; i < this.packets; i++) {
      view.setBigInt64(pos, hexToDecimal(values[0])); // Space ID
      pos += 8;
      view.setBigInt64(pos, values[2]); // Method ID
      let checkValue = values[1] == "A" ? 0 : values[1] == "B" ? 1 : 2;
      pos += 11;
      view.setUint8(pos, checkValue);
      pos++;
    }

    function hexToDecimal(s) {
      function add(x, y) {
        var c = 0,
          r = [];
        var x = x.split("").map(Number);
        var y = y.split("").map(Number);
        while (x.length || y.length) {
          var s = (x.pop() || 0) + (y.pop() || 0) + c;
          r.unshift(s < 10 ? s : s - 10);
          c = s < 10 ? 0 : 1;
        }
        if (c) r.unshift(c);
        return r.join("");
      }

      var dec = "0";
      s.split("").forEach(function (chr) {
        var n = parseInt(chr, 16);
        for (var t = 8; t; t >>= 1) {
          dec = add(dec, dec);
          if (n & t) dec = add(dec, "1");
        }
      });
      return dec;
    }

    return buffer;
  }
}
// --> Reference: A side with #/battle=2aaaaabaf6050844 I 0015:00:2aaabaf6050844:64ebf1df593bc939:00000000
// --> Reference B side with #/battle=2aaaaabaf6050844 I 0015:00:2aaabaf6050844:64ebf1df593bc939:00000001
// --> Reference A side with #/battle=2aaaaabaf6052f17 I 0015:00:2aaaaabaf6052f17:64ebf1df593bc939:00000000

export default joinBattle;
