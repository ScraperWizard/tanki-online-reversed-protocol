const messages = {
    firstPacket : arrayBufferTHexString("91228b00000000053c90ee07717c9dcf24ecf3473e82b398461d6a6f0508000e400f0a04"),
    secondPacket : arrayBufferTHexString("6f1963000000000598fe5d0421bef8e5214f189183801352e7259a"),
    thirdPacket : arrayBufferTHexString("1914f600000000055c5cc3d2ff70fbb677356916ec65"),
    fourthPacket: arrayBufferTHexString("2412e60000000005dd22de340788731cbd2c01f9")
}

function arrayBufferTHexString(ab) {
    return new Uint8Array(ab)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export default messages