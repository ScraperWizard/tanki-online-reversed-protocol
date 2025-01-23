const packets = {
  "5c1751a36545ca4b": {
    name: "BattleDMInfoModelBase_updateUserScore",
    description: "Update user score in DM maps",
    methodID: "5c1751a36545ca4b",
    mode: "simple",
    objectID: 16,
    arguments: {
      playerId: 16,
      score: 8,
    },
  },
  "3e805b47cccdc5e3": {
    name: "BattleModelBase_updateCrystalFund",
    description: "Update crystal fund in battle",
    methodID: "3e805b47cccdc5e3",
    mode: "simple",
    objectID: 16,
    arguments: {
      crystals: 8,
    },
  },

  // Battle info
  "5f1941dc5b10e242": {
    name: "BattleInfoModelBase_roundStarted",
    description: "A round has started",
    mode: "simple",
    methodID: "5f1941dc5b10e242",
    objectID: 16,
    arguments: {
      time: 8,
    },
  },
  "7bf106a66f98a92f": {
    name: "BattleInfoModelBase_roundFinished",
    description: "A round has finished",
    mode: "simple",
    methodID: "7bf106a66f98a92f",
    objectID: 16,
    arguments: {},
  },
  "153e805b47cccdc5": {
    name: "BattleInfoModelBase_timestamp",
    description: "Timestamp",
    methodID: "505bb327ba261455",
    mode: "simple",
    objectID: 16,
    arguments: {
      timestamp: 10,
    },
  },

  // Team battle info
  "148b85fd1734f695": {
    name: "TeamBattleInfoModelBase_updateUserScore",
    description: "Updates the user score in Team battle maps",
    methodID: "148b85fd1734f695",
    mode: "simple",
    objectID: 16,
    arguments: {
      playerId: 16,
      score: 8,
    },
  },
  "4087be97c5a2e3b9": {
    name: "TeamBattleInfoModelBase_addUser",
    description: "Adds user to the team battle map (A player joined)",
    methodID: "4087be97c5a2e3b9",
    mode: "simple",
    objectID: 16,
    arguments: {
      clanId: 16,
      padding: 12,
      playerId: 16,
      side: 8,
    },
  },
  "148b871e35eb01e7": {
    name: "TeamBattleInfoModelBase_updateTeamScore",
    description: "Updates the whole score of teams",
    methodID: "148b871e35eb01e7",
    mode: "simple",
    objectID: 16,
    arguments: {
      sideA: 8,
      sideB: 8,
    },
  },
  "74be19b0ff26f7a2": {
    name: "TeamBattleInfoModelBase_removeUser",
    description: "Remove user from team map",
    methodID: "74be19b0ff26f7a2",
    mode: "simple",
    objectID: 16,
    arguments: {
      playerId: 16,
    },
  },
  "3d92862c98aa1850": {
    name: "TeamBattleInfoModelBase_swapTeams",
    description: "Swap teams (Round ended)",
    methodID: "3d92862c98aa1850",
    mode: "simple",
    objectID: 16,
    arguments: {},
  },

  // DM battle info
  "4c55b9ecf6237b67": {
    name: "BattleDMInfoModelBase_addUser",
    description: "Adds user to the DM map (A player joined)",
    methodID: "4c55b9ecf6237b67",
    mode: "simple",
    objectID: 16,
    arguments: {
      unknown: 28,
      playerId: 16,
    },
  },
  "2c0dc4a69290d53e": {
    name: "BattleDMInfoModelBase_removeUser",
    description: "Remove user from DM map",
    methodID: "2c0dc4a69290d53e",
    mode: "simple",
    objectID: 16,
    arguments: {
      playerId: 16,
    },
  },
  "6a09fce46efe601a": {
    name: "DispatcherModelBase_loadObjectsData",
    description: "Load objects data",
    methodID: "6a09fce46efe601a",
    mode: "simple",
    objectID: 16,
    arguments: {
      mapLength: 8,
      map: 16,
      unknown: 16,
      unknown: 24,
      map2: 16,
      methodID2: 16,
    },
  },

  // Battle notifier (Space four)
  "75d5570af3271b05": {
    name: "BattleNotifierModelBase_leaveBattle",
    description: "Leave battle",
    methodID: "75d5570af3271b05",
    mode: "simple",
    objectID: 16,
    arguments: {
      playerId: 16,
    },
  },

  // Unknown packets
  "505bb327ba261455": {
    name: "battle_unknown_1",
    description: "Unknown packet 1",
    methodID: "505bb327ba261455",
    mode: "simple",
    objectID: 16,
    arguments: {},
  },
};

const readString = (input, startIndex, endIndex) => {
  let output = "";

  for (let i = startIndex; i < endIndex; i++) {
    output += input[i];
  }

  return output;
};

function packetsParser(hexPacketString) {
  const packetsData = [];
  let currentPosition = 0;

  const nonPaddingPattern = "2aaaaab";
  const startIndex = hexPacketString.indexOf(nonPaddingPattern);

  if (startIndex !== -1) {
    currentPosition = startIndex;
  } else {
    console.log("Pattern '2aaaaab' not found, cannot proceed");
    return { packetsData: [] };
  }

  while (currentPosition < hexPacketString.length) {
    const objectId = readString(hexPacketString, currentPosition, currentPosition + 16);
    currentPosition += 16;

    const methodId = readString(hexPacketString, currentPosition, currentPosition + 16);
    currentPosition += 16;

    const packetName = packets[methodId] ? packets[methodId].name : "Unknown";

    if (packetName == "Unknown") {
      console.log(`Failed parse packet methodId: ${methodId}`, hexPacketString);
      break;
    }

    let argumentValues = {};

    const { arguments: argMap } = packets[methodId];
    if (argMap === undefined) {
      continue;
    }

    for (const [argName, argLength] of Object.entries(argMap)) {
      const argValueHex = readString(hexPacketString, currentPosition, currentPosition + argLength);
      argumentValues[argName] = argValueHex;
      currentPosition += argLength;
    }

    packetsData.push({ objectId, packetName, methodId, argumentValues });
  }

  return {
    packetsData,
  };
}

function BattleInfoCC_Parser(input) {
  // Takes in the whole packet
  const TeamBattleInfoCC = "5c511ce6d6d53d1e";
  const BattleDMInfoCC = "0dce10d6689607c2";
  const BattleInfoCC = "286d416ec2071626";
  const BattleParamInfoCC = "572e822217b8bdb0";
  const battleInfoCCMethodIds = [TeamBattleInfoCC, BattleDMInfoCC];
  const regex = new RegExp(`(.{16}(${battleInfoCCMethodIds.join("|")}).*?)(?=.{16}(${battleInfoCCMethodIds.join("|")})|$)`, "gs");
  const splittedPacket = input.match(regex);
  const results = [];

  if (splittedPacket == null) return results;

  for (let i = 0; i < splittedPacket.length; i++) {
    let currentIndex = 0;

    const resultObject = {
      MapID: "",
      BattleInfo: {},
      BattleParamsInfo: {},
    };

    resultObject.MapID = splittedPacket[i].slice(currentIndex, currentIndex + 16);
    currentIndex += 16;

    const methodId = splittedPacket[i].slice(currentIndex, currentIndex + 16);
    currentIndex += 16;

    if (!battleInfoCCMethodIds.includes(methodId)) continue;

    if (methodId == BattleDMInfoCC) {
      let usersTeamJ = parseInt(splittedPacket[i].slice(currentIndex, currentIndex + 2), 16);
      currentIndex += 2;
      resultObject.usersTeamJ = [];

      currentIndex = BattleInfoCC_Parser_Helper_ReadUsers(splittedPacket[i], currentIndex, resultObject.usersTeamJ, usersTeamJ);
    } else {
      resultObject.scoreTeamA = 0;
      resultObject.scoreTeamB = 0;
      resultObject.usersTeamA = [];
      resultObject.usersTeamB = [];

      resultObject.scoreTeamA = parseInt(splittedPacket[i].slice(currentIndex, currentIndex + 8), 16);
      currentIndex += 8;

      resultObject.scoreTeamB = parseInt(splittedPacket[i].slice(currentIndex, currentIndex + 8), 16);
      currentIndex += 8;

      let usersTeamA = splittedPacket[i].slice(currentIndex, currentIndex + 2);
      currentIndex += 2;

      currentIndex = BattleInfoCC_Parser_Helper_ReadUsers(splittedPacket[i], currentIndex, resultObject.usersTeamA, parseInt(usersTeamA, 16));

      let usersTeamB = splittedPacket[i].slice(currentIndex, currentIndex + 2);
      currentIndex += 2;

      currentIndex = BattleInfoCC_Parser_Helper_ReadUsers(splittedPacket[i], currentIndex, resultObject.usersTeamB, parseInt(usersTeamB, 16));
    }

    const BattleInfoMethodId = splittedPacket[i].slice(currentIndex, currentIndex + 16);
    currentIndex += 16;

    if (BattleInfoMethodId !== BattleInfoCC) {
      resultObject.BattleInfo = null;
      results.push(resultObject);
      continue;
    }

    resultObject.BattleInfo.fund = parseInt(splittedPacket[i].slice(currentIndex, currentIndex + 8), 16);
    currentIndex += 8;

    resultObject.BattleInfo.roundStarted = parseInt(splittedPacket[i].slice(currentIndex, currentIndex + 2), 16);
    currentIndex += 2;

    resultObject.BattleInfo.suspicionLevel = parseInt(splittedPacket[i].slice(currentIndex, currentIndex + 8), 16);
    currentIndex += 8;

    resultObject.BattleInfo.timeLeftInSec = parseInt(splittedPacket[i].slice(currentIndex, currentIndex + 8), 16);
    currentIndex += 8;

    const BattleInfoParamsMethodId = splittedPacket[i].slice(currentIndex, currentIndex + 16);
    currentIndex += 16;

    if (BattleInfoParamsMethodId !== BattleParamInfoCC) {
      resultObject.BattleParamsInfo = null;
      results.push(resultObject);
      continue;
    }

    resultObject.BattleParamsInfo.creatorId = splittedPacket[i].slice(currentIndex, currentIndex + 16);
    currentIndex += 16;

    const map = splittedPacket[i].slice(currentIndex, currentIndex + 16);
    resultObject.BattleParamsInfo.map = map;
    currentIndex += 16;

    // Get Map mode
    resultObject.BattleParamsInfo.battleMode = parseInt(splittedPacket[i].slice(currentIndex, currentIndex + 8), 16);
    currentIndex += 8;

    // TODO: check this (SEEMS LIKE FOR MM ONLY)
    // resultObject.BattleParamsInfo.battleModeForMatchmaking = parseInt(splittedPacket[i].slice(currentIndex, currentIndex + 8), 16);
    // currentIndex += 8;

    const battleOptionsLength = parseInt(splittedPacket[i].slice(currentIndex, currentIndex + 2), 16) * 2;
    currentIndex += 2;
    currentIndex += battleOptionsLength * 4;

    const formatModeLength = parseInt(splittedPacket[i].slice(currentIndex, currentIndex + 2), 16) * 2;
    currentIndex += 2;
    resultObject.BattleParamsInfo.formatMode = Buffer.from(splittedPacket[i].slice(currentIndex, currentIndex + formatModeLength), "hex").toString("utf8");
    currentIndex += formatModeLength;

    resultObject.BattleParamsInfo.limits = splittedPacket[i].slice(currentIndex, currentIndex + 16);
    currentIndex += 16;

    resultObject.BattleParamsInfo.mapId = splittedPacket[i].slice(currentIndex, currentIndex + 16);
    currentIndex += 16;

    resultObject.BattleParamsInfo.maxPeopleCount = parseInt(splittedPacket[i].slice(currentIndex, currentIndex + 2), 16);
    currentIndex += 2;

    const mapNameLength = parseInt(splittedPacket[i].slice(currentIndex, currentIndex + 2), 16) * 2;
    currentIndex += 2;
    resultObject.BattleParamsInfo.name = Buffer.from(splittedPacket[i].slice(currentIndex, currentIndex + mapNameLength), "hex").toString("utf8");
    currentIndex += mapNameLength;

    resultObject.BattleParamsInfo.isProBattle = splittedPacket[i].slice(currentIndex, currentIndex + 2) == "01";
    currentIndex += 2;

    resultObject.BattleParamsInfo.rankRange = splittedPacket[i].slice(currentIndex, currentIndex + 16);
    currentIndex += 16;

    resultObject.BattleParamsInfo.theme = splittedPacket[i].slice(currentIndex, currentIndex + 8);
    currentIndex += 2;

    results.push(resultObject);
  }

  return results;
}

function BattleInfoCC_Parser_Helper_ReadUsers(input, startIndex, users, userCount) {
  let currentIndex = startIndex;

  for (let j = 0; j < userCount; j++) {
    const clanTag = input.slice(currentIndex, currentIndex + 16);
    currentIndex += 16;
    currentIndex += 12;
    const player = input.slice(currentIndex, currentIndex + 16);
    currentIndex += 16;

    if (clanTag !== "0000000000000000") {
      users.push({ PlayerId: player, ClanTag: clanTag });
    } else {
      users.push({ PlayerId: player });
    }
  }

  return currentIndex;
}

export { BattleInfoCC_Parser, packetsParser };
