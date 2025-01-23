// An instance of this class would be created and stored in each space connection object

class Cypher {
  constructor(hash, spaceID) {  // Uint8Array(32), Uint8Array(8)
    this.CL_Seq = new Uint8Array(8);
    this.SV_Seq = new Uint8Array(8);
    this.CL_SeqSel = 0;
    this.SV_SeqSel = 0;

    let hDV = new DataView(hash);
    let idDV = new DataView(spaceID);

    let s = 0;
    let idL = idDV.getUint32(0);
    let idH = idDV.getUint32(4);

    for (let i = 0; i < 32; i++) {
      s = (s ^ hDV.getUint8(i)) % 256;
    }

    for (let i = 0; i < 4; i++) {
      let b = (idH >> (24 - 8 * i)) & 0xff;
      s = (s ^ b) % 256;
    }

    for (let i = 0; i < 4; i++) {
      let b = (idL >> (24 - 8 * i)) & 0xff;
      s = (s ^ b) % 256;
    }

    if (s < 0) s += 256;

    for (let i = 0; i < 8; i++) {
      this.SV_Seq[i] = (s ^ (i << 3)) % 256;
      this.CL_Seq[i] = (s ^ (i << 3) ^ 87) % 256;
    }
  }

  encrypt(data) {  // Uint8Array
    let dv = new DataView(data);
    let enc = new Uint8Array(data.byteLength);

    for (let i = 0; i < data.byteLength; i++) {
      let b = dv.getUint8(i);

      enc[i] = b ^ this.CL_Seq[this.CL_SeqSel];
      this.CL_Seq[this.CL_SeqSel] = b;
      this.CL_SeqSel = this.CL_SeqSel ^ (7 & b);
    }

    return enc;
  }

  decrypt(data) {  // Uint8Array
    let dv = new DataView(data);
    let dec = new Uint8Array(data.byteLength);

    for (let i = 0; i < data.byteLength; i++) {
      let b = dv.getUint8(i);

      this.SV_Seq[this.SV_SeqSel] = b ^ this.SV_Seq[this.SV_SeqSel];
      dec[i] = this.SV_Seq[this.SV_SeqSel];
      this.SV_SeqSel ^= this.SV_Seq[this.SV_SeqSel] & 7;
    }

    return dec;
  }
}

export default Cypher;