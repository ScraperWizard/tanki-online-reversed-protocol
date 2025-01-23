class CL_login {
  constructor({ nickname, password }) {
    this.nickname = nickname;
    this.password = password;
    this.spaceId = 100045260;
    this.methodId = 108605496059850042n;
  }

  serialize() {
    const parameters = {
      nickname: this.nickname,
      password: this.password,
      spaceId: this.spaceId,
      methodId: this.methodId,
    };
    const keys = Object.keys(parameters);
    const values = Object.values(parameters);
    const buffer_length = parameters.nickname.length + parameters.password.length + 4 + 8 + 8;
    const buffer = new ArrayBuffer(buffer_length + 2);
    const view = new DataView(buffer);
    let pos = 0;
    view.setInt16(pos, buffer_length);
    pos += 2;
    view.setInt8(pos, 0);
    pos += 5;
    view.setUint32(pos, parameters.spaceId); // Space ID
    pos += 4;
    view.setBigInt64(pos, parameters.methodId); // Method ID
    pos += 8;
    view.setUint8(pos, parameters.nickname.length); // Write the packet size
    pos++;
    for (let i = 0; i < parameters.nickname.length; i++) {
      view.setUint8(pos, parameters.nickname.charCodeAt(i));
      pos++;
    }
    view.setUint8(pos, parameters.password.length);
    pos++;
    for (let i = 0; i < parameters.password.length; i++) {
      view.setUint8(pos, parameters.password.charCodeAt(i));
      pos++;
    }
    view.setUint8(pos, 1);
    return buffer;
  }
}

// console.log(new login("DeepOfTheOcean", "farkrai2003").serialize())

// For reference -> 002d:00:0000000005f691cc:0181d81f8d4d6d3a:0e:
export default CL_login;
