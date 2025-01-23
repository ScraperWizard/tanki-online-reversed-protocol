import zlib from "zlib";
import Cypher from "./cypher.js";

function hstab(hs) {
  return new Uint8Array(hs.match(/[\dA-F]{2}/gi).map((s) => parseInt(s, 16)))
    .buffer;
}

function abths(ab) {
  return new Uint8Array(ab)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function outgoingPacket(packet, expectedOutcome, cypher) {
  console.log("Unencrypted packet:", abths(packet));

  const eO = abths(expectedOutcome);
  const aO = abths(cypher.encrypt(packet));

  console.log("Expected outcome:", eO);
  console.log(
    `Actual outcome ${eO == aO ? "[Working correctly]" : "[Not working correctly]"
    }:`,
    aO
  );
}

function incomingPacket(packet, expectedOutcome, cypher) {
  console.log("Encrypted packet:", abths(packet));

  const eO = abths(expectedOutcome);
  const aO = cypher.decrypt(packet);

  // console.log("Expected outcome:", eO);
  // console.log(
  //   `Actual outcome ${
  //     eO == aO ? "[Working correctly]" : "[Not working correctly]"
  //   }:`,
  //   aO
  // );
}

const hash = hstab(
  "018e6ab5964ce0a645bb0477369a7c130b62a9bf672146f8592eacf9741606b8"
);

const spaceID = hstab("0000000005f7b228");

const incomingPacket1 = hstab(
  "d612cbe4a0ffc62f97c95935c60471cf1444f31d299f102a4f387a3f8d5183255687b08f378c98f2d72e91c66889a4460000800eb95073e39b3cf256146c174a0113700f1d8d5a965bb4efc56c2ad8544632f80b3938224b73d5f303dd4c90c8947c5233a0951410b8a003d4cd2723788beb989935c72ca7847747ddf800d9e090191bb4847fdab718b51830b3122225cb14648a5d2d11685479634d5c1d5f2a06a0640632a8ce1a0d6c1903b71b1911541074973d654b2f3970097484da5511b4316ea55e3c567eb0e35e73c18239210122b08fe35e6ea85b11e0c79e751c20307574dcca8daaf6ac09c9102659a0b06aaa41a53fa62d5acb591be832f2209d240f821c34f982987e4aad3a9c668043ae465baf11014ed04847d2f22dbe1dc0a68e5b80bfe990ad60bed629abc3f3ab6e776866c065e4314a57888ad0cd90fdbd41849cb38a952362ca1335792b54754b5066159c94f60ad3f031e2c5ce5d27f522ec94bd432983417db12f3d2ab62098451626193cf42750a899c3fbe17e616da2f6af9ac4a98219c6a6ac6eb7efd8a801d242abcbae79fad7b8186c49dd0e4b8b8dd52a64accf9f46b8bb5d74e66d0953bf0d9fe5811e1292f6ba72e93dd3caf01a9dc420667c2145c6e08b9864f452e5ec141bc9e736fc270a186aaccc7a78d444fface7fe727ce7480ec0e3634a8305343ae6f755da88cec7dd7586beeff2fac78c04c2316a9f1fb6116071926900decf47bd1e01adb2ee9520ff4d647918d4dab0ff352718494aa6046126ae32159018602b052c551db1997bc8b470fade20b05544a1db861e67f7c6379395637db33614105dee77758682d6a65607ed190ad4203c44ff54a4f131819937fe33b133a86da0915df262f545af723f1014d98206f4b6f5826109fbe18f022d58b3bde8fc5661cad18429b7fb4da450b2230b0620086d1863a475e1d31169ab6f87a96af0eccaa3cddd0781af09dcb174842b30718e4e1427b3b23ce58ae78182226a00237ebf6ae1ef0b79d43c455186732292c28bc84c7742f3f2d50924e3a91cd05cb96e862356cf119a25ccca33755313412d1520ad92eeafc6dae5c371b43fbf3946dc5a4d208739198d380de9c9ef3df20c1ae128efaf9e6da2a0f75bc5d64efcb832ad9616347d4e840ab8e5c7f418fa64e804902f4b8ef80fefc17c8aa0aab4c68e78718972b23a7d64df1b50ba0299bfc6a370274e5548dcecafc3e614b0fbb2e6fd29877efbba2fa6f28ee63c2fb88c41e741e40070e71fd477c7299be8767ef78ca9e812a10dbb3fe025e4c96f97ed85283322f141ea6a813cb5587fe8b978fe928abaa5c269571eacb7bbe4b5efc781901f3920e27dcb95895bff63bb0cbaa7d1daed10fb8b4b85c63eb295e10ff1c4021e638fb061a3e1286b3db55f805af9dd99e164a8e170a20a6580e9bdfc273e6444930072a4ab4479a7a5ce5532dd5605c8fc44cb719046df3389705988ce1d4decfa054c6d9ba61b791425b9bcc9cfdee4d26d39275464503c7656ba262000e0ec01843882e3b11ef5114a28f0a345eb70a31314282b43960fdcbcbc6947559f212a55c4e4746326d4c0ed1501191ca6b05263d6c6a11e9d794b37144aaa98d22146acdde7c8629c1b1949be707e8c0964aadfcb46ca3017b08bc590202f66dcf05272b27e5a8d63253274b16c6d37fae4f66d769065c954e981b5e5e35e92de8e27d28739ec1b1cf5453680ced2a2da87647c6425af1198c38a715e2a9499a5b7c52620fe446be1e48f1386fa9f81bdd2ca545d22890a62c76f186d21f00740f48f89e90ea2a20fad5865f3dbec226a3b9b7cce2f0f9e619888f41e2d7365545184b2c118b5a8d253f2dfcf48797dd135470bf708ac60f3a45b7a73ac34adb6b447a15802dbd5275f44b84d2ffc2911d827e7807251b6a4eb5c37672efb9e7ad0a19139938e90a16209fed6af8fb65bd8a6665518428ce538ae13340379ec68ed770ee84ccb4ceab3f2f76fcc67f15e111622fc8cd2f8a0b3cff88e46904b58007fd3a81032"
);

const expectedIncomingPacket1 = hstab(
  "0027000000000005f7b2286c2f3763e7b6455f01000000000000000000000000002aaaaabae4cdaf87"
);


// 
// 4d15789c8d990b58cee71bc74b4ebdafc88498cc716c
// 

const c = new Cypher(hash, spaceID);
console.log(bufToHex(c.decrypt(incomingPacket1)));


function bufToHex(buffer) { // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

// Decrypt the incoming packet

// Your specified header in hex
const hexHeader = '020007070504030302000000000000060400';


// Step 1: Decrypt the incoming packet
const expectedDeflated = "789c8d990b58cee71bc74b4ebdafc88498cc716c"
const options = {
  level: zlib.constants.Z_DEFAULT_MEMLEVEL,
  memLevel: 4,
  strategy: zlib.constants.Z_DEFAULT_STRATEGY,
};
zlib.deflate("0000000005f7b21e2ca2091458b7bc9300000001", options, (err, buffer) => {
  if (!err) {
    const hexString = buffer.toString('hex');

    console.log('Expected deflated hex:', expectedDeflated)
    console.log('Deflated Hex:', hexString);


    // Use zlib.inflateSync for synchronous inflation
    const inflatedBuffer = zlib.inflateSync(Buffer.from(hexString, 'hex'));

    console.log('Inflated Data:', inflatedBuffer.toString());
  } else {
    console.error('Error deflating data:', err);
  }
});


// const zlibHeaderLength = 2; // Length of the zlib header

// const compressedHexString = "4d15789c8d990b58cee71bc74b4ebdafc88498cc716c";
// const compressedData = new Uint8Array(compressedHexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))).buffer;

// // Create a new Uint8Array with the zlib header
// const compressedWithHeader = new Uint8Array(zlibHeaderLength + compressedData.byteLength);
// compressedWithHeader.set(new Uint8Array(compressedData), zlibHeaderLength);

// const decompressedData = pako.inflate(compressedWithHeader, { to: 'string' });
// console.log('Decompressed Data:', decompressedData);



// const decompressedData = pako.deflate(c.decrypt(incomingPacket1), { to: 'string' });
// console.log("Decompressed Data:", bufToHex(decompressedData));
// incomingPacket(incomingPacket1, expectedIncomingPacket1, c);
