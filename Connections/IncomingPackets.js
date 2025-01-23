// This file contains all the incoming packets that the client can receive from the server
// The name is a human readable name
// Each packet has an id, and a meaningful description
// Some packets may have error codes which indicate critical errors
// If a packet does not contain a key of space means it can be received in any space almost.

import { extractClanTag, getHighestConstantValue, extractNickname, regExFunction, convertToRank, extractRanks, hexToAscii } from "../Connections/space-utils/PacketHelper.js";

const IncomingPackets = [
  {
    name: "SV_loadDependencies",
    description: "Load dependencies packet, this packet is usually large, contains all the data needed to load the game",
    packetId: "2ca2091458b7bc93",
  },
  {
    name: "DispatcherModelBase_loadObjectsData",
    description: "Loads objects, usually an object is a battle map, friend list etc just a big feature in the game",
    packetId: "6a09fce46efe601a",
    space: "Two",
  },
  {
    name: "LoginByHashModelBase_rememberAccount",
    description: "Remember account packet, this packet is sent when the user wants to remember the account",
    packetId: "6d7b86f43acf54bd",
    space: "Two",
    fields: [{ key: "hashKey", regEx: /[\s\S]{1,128}$/, regExFunction: hexToAscii, regExMatch: 0 }],
  },
  {
    name: "LoginByHashModelBase_rememberUsersHash",
    description: "Remember account packet, this packet is sent when the user wants to remember the account",
    packetId: "034a7519bddbb2cc",
    space: "Two",
    fields: [{ key: "hashKey", regEx: /[\s\S]{1,128}$/, regExFunction: hexToAscii, regExMatch: 0 }],
  },
  {
    name: "Unknown871",
    description: "Unknown packet",
    packetId: "46d2789ced577d4c",
    space: "Four",
  },
  {
    name: "RegistrationModelBase_enteredUidIsBusy",
    description: "Entered UID is busy packet, this packet is sent when the UID is busy",
    packetId: "114edf6488168f19",
    space: "Two",
  },
  {
    name: "SV_ReadyToLogin",
    description: "Ready to login packet, this packet is sent after the dependencies are loaded and the client is ready to login",
    packetId: "6a09fce46efe601a",
    space: "Two",
  },
  {
    name: "SV_loginFollowUp",
    description: "Login follow-up packet, this packet is sent after the login packet is sent (indicating successful login)",
    packetId: "1c1d64bee176be15",
    space: "Two",
  },
  {
    name: "LoginByHashModelBase_loginByHashFailed",
    description: "Login by hash failed packet, this packet is sent when the hash key is wrong",
    packetId: "78c29b6d1e163fb2",
    errorMessage: "failed",
    space: "Two",
    errorCode: 1,
  },
  {
    name: "BlockValidatorModelBase_youAreBlocked",
    description: "You are blocked packet, this packet is sent when the account is blocked",
    packetId: "18f26fbe504b771a",
    errorMessage: "blocked",
    space: "Two",
    errorCode: 2,
  },
  {
    name: "SV_youWereKicked",
    description: "You were kicked packet, this packet is sent when the account is kicked by an admin out of the map",
    packetId: "18f4770a10667468",
    errorMessage: "kicked",
    space: "Two",
    errorCode: 3,
  },
  {
    name: "LoginModelBase_wrongPassword",
    description: "Wrong password packet, this packet is sent when the password is wrong",
    packetId: "557ff96e2fdbe2c1",
    space: "Two",
    errorCode: 4,
  },
  {
    name: "LinkActivatorModelBase_dead",
    description: "Dead map, this packet is sent when the map is dead",
    packetId: "39c77ae5ab25aa86",
    space: "Four",
  },
  {
    name: "MoveUserToServerModelBase_move",
    description: "Move server packet, sent when the server wants you to move to another server",
    packetId: "5e6f2ac28ce6258d",
    space: "Four",
    fields: [{ key: "Server", regEx: /(\d)$/, regExMatch: 1 }],
  },
  {
    name: "LobbyLayoutNotifyModelBase_cancelPredictedLayoutSwitch",
    description: "Cancel predicted layout switch packet, usually happens when you glitch into a map or some weird action",
    packetId: "1f6fe9ff9dd36166",
    space: "Four",
  },
  {
    name: "LobbyLayoutNotifyModelBase_endLayoutSwitch",
    description: "End layout switch packet, this packet is sent at the end of a layout switch (Opening maps or leaving or joining)",
    packetId: "7e7ef0afa90578e9",
    space: "Four",
  },
  {
    name: "DispatcherModelBase_loadObjectsData",
    description: "Loads objects data packet, this packet is used to load objects such as battle maps and friend lists",
    packetId: "6a09fce46efe601a",
    space: "Four",
    fields: [{ key: "spaceFriendList", regEx: /ffffffff(\w{8})/g, regExFunction: getHighestConstantValue, regExMatch: null }],
  },
  {
    name: "LobbyLayoutNotifyModelBase_beginLayoutSwitch",
    description: "Begin layout switch packet, this packet is sent at the beginning of a layout switch",
    packetId: "6bde6cf328643d9b",
    space: "Four",
  },
  {
    name: "OnlineNotifierModelBase_setOnline",
    description: "update the online status of a user",
    packetId: "6c2f3763e7b6455f",
    space: "Four",
    fields: [
      { key: "ID", regEx: /[0-9a-fA-F]{16}$/, regExMatch: 0 },
      { key: "Server", regEx: /^.{42}(.{2})/, regExMatch: 1 },
      { key: "online", regEx: /^.{40}(.{2})/, regExMatch: 1 },
    ],
  },
  {
    name: "ClanNotifierModelBase_sendData",
    description: "packet is used to send clan-related information",
    packetId: "7a551c6ae17f4171",
    space: "Four",
    fields: [
      { key: "ID", regEx: /[0-9a-fA-F]{16}$/, regExMatch: 0 },
      { key: "ClanTag", regEx: /^.*$/, regExFunction: extractClanTag, regExMatch: 0 },
    ],
  },
  {
    name: "BattleNotifierModelBase_leaveBattle",
    description: "Leave battle packet, this packet is sent when a user leaves a battle",
    packetId: "75d5570af3271b05",
    space: "Four",
    fields: [{ key: "ID", regEx: /[0-9a-fA-F]{16}$/, regExMatch: 0 }],
  },
  {
    name: "BattleNotifierModelBase_leaveGroup",
    description: "Leave group packet, this packet is sent when a user leaves a group",
    packetId: "24d5556372e4b224",
    space: "Four",
    fields: [{ key: "ID", regEx: /[0-9a-fA-F]{16}$/, regExMatch: 0 }],
  },
  {
    name: "BattleNotifierModelBase_setBattle",
    description: "when a user (Other users not us, its for the friend list) joins a battle",
    packetId: "1fd81b76aee4e166",
    space: "Four",
    fields: [
      { key: "ID", regEx: /[0-9a-fA-F]{16}$/, regExMatch: 0 },
      { key: "Map", regEx: /^.{34}(.{16})/, regExMatch: 1 },
      { key: "Ranks", regeEx: /(?<=.{16})(.{16})(?=.{16}$)/, regExFunction: extractRanks, regExMatch: null },
    ],
  },
  {
    name: "FriendsModelBase_alreadyInOutgoingFriends",
    description: "user is already in the outgoing friends list",
    packetId: "1a813a297018a46b",
    space: "Four",
    fields: [
      { key: "ID", regEx: /[0-9a-fA-F]{16}$/, regExMatch: 0 },
      { key: "Nickname", regEx: /^.*$/, regExFunction: extractNickname, regExMatch: 0 },
    ],
  },
  {
    name: "FriendsModelBase_friendRequestSent",
    description: "friend request is sent to another user",
    packetId: "28b920ab1b731cea",
    space: "Four",
    fields: [
      { key: "ID", regEx: /[0-9a-fA-F]{16}$/, regExMatch: 0 },
      { key: "Nickname", regEx: /^.*$/, regExFunction: extractNickname, regExMatch: 0 },
    ],
  },
  {
    name: "FriendsModelBase_alreadyInAcceptedFriends",
    description: "user is already in the accepted friends list",
    packetId: "1293e3a2646b0fd0",
    space: "Four",
    fields: [
      { key: "ID", regEx: /[0-9a-fA-F]{16}$/, regExMatch: 0 },
      { key: "Nickname", regEx: /^.*$/, regExFunction: extractNickname, regExMatch: 0 },
    ],
  },
  {
    name: "ReconnectModelBase_setSingleEntranceHash",
    description: "Set the single entrance hash (Received once you send reconnect packet)",
    packetId: "5f0de844a23970d2",
    space: "Four",
    fields: [{ key: "singleEntranceHash", regEx: /40(.{128})/ }],
  },
  {
    name: "UidNotifierModelBase_setUid",
    description: "set the UID for a user",
    packetId: "114b1195046cf89e",
    space: "Four",
    fields: [
      { key: "Nickname", regEx: /^.{32}(.*)/, regExFunction: regExFunction, regExMatch: 1 },
      { key: "Uid", regEx: /[0-9a-fA-F]{16}$/, regExMatch: 0 },
    ],
  },
  {
    name: "RankNotifierModelBase_setRank",
    description: "set the rank for a user",
    packetId: "4cef4e3486bb115a",
    space: "Four",
    fields: [
      { key: "Rank", regEx: /^.{34}(.{8})/, regExFunction: convertToRank, regExMatch: 1 },
      { key: "Uid", regEx: /[0-9a-fA-F]{16}$/, regExMatch: 0 },
    ],
  },
  {
    name: "BattleEntranceModelBase_enterToBattleFailed",
    description: "Could be either wrong rank or wrong join packet or you joined but error",
    packetId: "55138d0df28d1527",
    space: "Seven",
  },
  {
    name: "DispatcherModelBase_unloadObjects",
    description: "Unload objects packet, this packet is used to unload objects such as battle maps and friend lists",
    packetId: "7d701d63033cf397",
    fields: [{ key: "battleMap", regEx: /.{16}$/ }],
    space: "Seven",
  },
  {
    name: "BattleSelectModelBase_battleItemsPacketJoinSuccess",
    description: "Join success packet, this packet is sent when the user joins a battle successfully",
    packetId: "63b89396a7f145e6",
    space: "Seven",
  },
  {
    name: "TeamBattleInfoModelBase_updateUserScore",
    description: "Update user score packet, this packet is sent when the user score is updated",
    packetId: "148b85fd1734f695",
    space: "Seven",
  },
  {
    name: "BattleModelBase_updateCrystalFund",
    description: "Update crystal fund in battle",
    packetId: "3e805b47cccdc5e3",
    space: "Seven",
  },
  {
    name: "BattleDMInfoModelBase_updateUserScore",
    description: "Update user score packet, this packet is sent when the user score is updated",
    packetId: "5c1751a36545ca4b",
    space: "Seven",
  },
  {
    name: "CaptchaModelBase_showCaptcha",
    description: "Show captcha packet, this packet is sent when the server wants the client to show a captcha",
    packetId: "53b7950af0feb087",
    fields: [
      {
        key: "captchaPrefix",
        regEx: /(\d{10})$/,
        regExFunction: (captchaPrefix) => parseInt(captchaPrefix.slice(0, -2)),
        regExMatch: 1,
      },
    ],
    space: "Five",
  },
  {
    name: "CaptchaCC",
    description: "Captcha packet, contains info about captcha client",
    packetId: "1d417d595b3e5011",
    space: "Two",
  },
  {
    name: "CaptchaModelBase_captchaCorrect",
    description: "Captcha correct packet, this packet is sent when the captcha is correct",
    packetId: "455e191344eba054",
    space: "Five",
  },
  {
    name: "CaptchaModelBase_captchaFailed",
    description: "Captcha failed packet, this packet is sent when the captcha is wrong",
    packetId: "0a7ee808e585f713",
    space: "Five",
  },
];

export default IncomingPackets;
