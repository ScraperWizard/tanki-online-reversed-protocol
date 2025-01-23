function hstab(hs) {
    return new Uint8Array(hs.match(/[\dA-F]{2}/gi).map((s) => parseInt(s, 16)))
        .buffer;
}

function arrayBufferTHexString(ab) {
    return new Uint8Array(ab)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

function bufToHex(buffer) { // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

function hexToAscii(hexString) {
    let asciiString = '';
    for (let i = 0; i < hexString.length; i += 2) {
        const hexChar = hexString.substr(i, 2);
        const charCode = parseInt(hexChar, 16);
        asciiString += String.fromCharCode(charCode);
    }
    return asciiString;
}

function extractClanTag(str) {
    let clanNameLength;
    let clanTagLength;
    let clanTag;
    const regex = /2aaaaab(\w{4})/;
    const match = str.match(regex);
    if (match) {
        const startIndex = match.index + match[0].length + 9;
        const endIndex = startIndex + 2;
        const chars = str.substring(startIndex, endIndex);
        clanNameLength = parseInt(chars, 16);
    } else {
        return null;
    }
    str = str.substring(str.indexOf("2aaaaab"));
    clanTagLength = parseInt(str.substring(24 + clanNameLength * 2, 24 + clanNameLength * 2 + 2), 16);
    clanTag = str.substring(24 + clanNameLength * 2 + 2, 24 + clanNameLength * 2 + 2 + clanTagLength * 2)

    return hexToAscii(clanTag);
}

function getHighestConstantValue(idsArray) {
    if (!Array.isArray(idsArray) || idsArray.length === 0) {
        return null; // Return null for an empty array or invalid input
    }

    let highestValue = idsArray[0];

    for (let i = 1; i < idsArray.length; i++) {
        if (idsArray[i] > highestValue) {
            highestValue = idsArray[i];
        }
    }

    return highestValue;
}

function extractNickname(str) {
    const hexLength = parseInt(str.substr(32, 2), 16);
    const startIndex = 34; // Skip the first two characters (the length) and the next two characters (which are always "00")
    const endIndex = startIndex + (hexLength * 2); // Multiply the hex length by 2 to get the number of characters in the substring
    const dynamicValue = str.substring(startIndex, endIndex); // Extract the dynamic substring "46656f"
    return hexToAscii(dynamicValue)
}

function regExFunction(input) {
    let currentIndex = 0;
    let output = ""

    // Step 1: Read the first two characters and convert to decimal
    const firstLengthHex = input.substr(currentIndex, 2);
    const firstLengthDecimal = parseInt(firstLengthHex, 16);
    currentIndex += firstLengthDecimal * 2;

    // Step 2: Read the next "length" characters and add them to the output
    const secondLengthHex = input.substr(currentIndex, currentIndex)
    currentIndex += 2;
    const dataChunk = input.substr(currentIndex, parseInt(secondLengthHex, 16) * 2);
    output += dataChunk;

    return hexToAscii(output);
}

function convertToRank(input) {
    return parseInt(input, 16)
}

function extractRanks(input) {
    let str = input.input.substring(input.input.length - 32, input.input.length - 16)
    const middle = str.length / 2;
    let left = str.substr(0, middle);
    let right = str.substr(middle);
    if (left < right) {
        [left, right] = [right, left];
    }
    const minValue = parseInt(right, 16);
    const maxValue = parseInt(left, 16);
    return { min: minValue, max: maxValue };
}

export { extractClanTag, getHighestConstantValue, extractNickname, regExFunction, convertToRank, extractRanks };
export { hstab, arrayBufferTHexString, bufToHex, hexToAscii };