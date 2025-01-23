class CaptchaModelServer_checkCaptcha {
  constructor({ captchaSolution, captchaPrefix }) {
    this.spaceId = 100072911n;
    this.methodId = 3312562673813486434n;
    this.captchaSolution = captchaSolution;
    this.captchaPrefix = captchaPrefix;
  }

  serialize() {
    const parameters = {
      spaceId: this.spaceId,
      methodId: this.methodId,
    };
    const values = Object.values(parameters);
    const buffer_length = this.captchaSolution.length + 2 + 8 + 8 + 4 + 1 + 2;
    const buffer = new ArrayBuffer(buffer_length);
    const view = new DataView(buffer);
    let pos = 0;
    view.setUint16(pos, buffer_length - 2); // Write the packet size
    pos += 2; // Shift position by 2 bytes since the packet size is a short
    view.setUint8(pos, 0); // Nullmap byte
    pos++;
    view.setBigInt64(pos, values[0]); // Space ID
    pos += 8;
    view.setBigInt64(pos, values[1]); // Method ID
    pos += 8;
    view.setUint32(pos, this.captchaPrefix); // constant
    pos += 4;
    view.setUint8(pos, 131);
    pos++;
    view.setUint8(pos, this.captchaSolution.length);
    pos++;

    for (let i = 0; i < this.captchaSolution.length; i++) {
      view.setUint8(pos, this.captchaSolution.charCodeAt(i));
      pos++;
    }

    return buffer;
  }
}

export default CaptchaModelServer_checkCaptcha;
