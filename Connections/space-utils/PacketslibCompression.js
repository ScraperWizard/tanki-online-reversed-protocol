import zlib from "node:zlib";

function hstab(hs) {
  return new Uint8Array(hs.match(/[\dA-F]{2}/gi).map((s) => parseInt(s, 16)));
}

function bufToHex(buffer) {
  let hexString = "";
  let uint8Array = new Uint8Array(buffer);
  for (let i = 0; i < uint8Array.length; i++) {
    hexString += uint8Array[i].toString(16).padStart(2, "0");
  }
  hexString = hexString.replace(/0+$/, "");
  return hexString;
}

async function uncompressZlib(inputData) {
  const isCompressed = inputData.startsWith("78");
  if (!isCompressed) {
    const compressedHeaderIndex = inputData.indexOf("78");
    inputData = inputData.slice(compressedHeaderIndex);
  }
  
  return new Promise((resolve, reject) => {
    zlib.unzip(hstab(inputData), (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(bufToHex(buffer));
      }
    });
  });
}

export default uncompressZlib;
