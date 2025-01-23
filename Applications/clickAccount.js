import ControlChannel from "../Connections/control/controlChannel.js";
import SpaceTwo from "../Connections/space/spaceTwo.js";
import SpaceThree from "../Connections/space/spaceThree.js";
import SpaceFour from "../Connections/space/spaceFour.js";
import SpaceFive from "../Connections/space/spaceFive.js";
import SpaceSix from "../Connections/space/spaceSix.js";
import SpaceSeven from "../Connections/space/spaceSeven.js";
import { getCaptcha, pingCaptchaSolverPool } from "./CaptchaProvider/index.js";
import Logger from "../Logger/Logger.js";
import dotenv from "dotenv";
import leaveAccount from "./leaveAccount.js";
import { performance } from "perf_hooks";
import Battle from "../Components/Battle.js";
import { MAX_CLICKER_INTERVAL_TIMEOUT } from "../config.js";
dotenv.config({ path: "../.env" });
let lastPacketTime = 0;
let averagePer10Seconds = 0;
let averagePer10SecondsCounter = 0;

async function clickAccount(Nickname, Password, rank, Map, Side, io, tankiConfig, proxyUrl) {
  return new Promise(async (resolve) => {
    let spaceTwo = null;
    let spaceThree = null;
    let spaceFour = null;
    let spaceFive = null;
    let spaceSix = null;
    let spaceSeven = null;
    let hasGlitched = false;
    let hasBeenClosedByUser = false;
    let isClicking = false;
    let clickingInterval = null;
    let isAccountInMap = false;
    let startedClickInterval = false;
    let isDeadMap = false;
    let hashResponseHasNotArrived = false;
    let wrongPassOrBlock = false;
    let battleMapResetListener = () => {};
    let isPause = false;
    const logger = new Logger(Nickname);
    const accountState = { ID: "", Server: "", online: "", Rank: "", Map: "", Nickname: "", ReconnectServer: "", minRank: 0, maxRank: 0 };
    if (Map.includes("=")) Map = Map.split("=")[1];
    const start_time = performance.now();
    const BattleObject = new Battle(Map);

    const controlChannel = new ControlChannel(Map, Nickname, false, null, proxyUrl);
    const connectionString = controlChannel.getConnectionString();

    if (connectionString == null) {
      resolve(null);
      return null;
    }

    pingCaptchaSolverPool();

    // On user stop click account
    logger.loggerIoEvent(`stop-click-${Nickname}`, listener, io);
    logger.loggerIoEvent(`pause-account-${Nickname}`, pauseListener, io);

    // Keep UI updated

    function listener() {
      hasBeenClosedByUser = true;
      controlChannel.close();
    }

    function pauseListener() {
      logger.info(`[${Nickname} - Pause]`);
      if (!isClicking && isPause == false) {
        return;
      }

      if (isClicking && isPause == false) {
        isPause = true;
        isClicking = false;
        logger.loggerIoEmit("update-status", { account: Nickname, status: "Paused" }, io);
        logger.info(`[${Nickname} - Paused]`);
        return;
      }

      if (!isClicking && isPause == true) {
        isPause = false;
        isClicking = true;
        logger.loggerIoEmit("update-status", { account: Nickname, status: "Clicking" }, io);
        logger.info(`[${Nickname} - Clicking]`);
        return;
      }
    }

    // Connect to server
    try {
      await controlChannel.connectToServer();
    } catch (err) {
      logger.error("Err ", err);
      logger.loggerIoEmit("close-click-session", Nickname, io);
      logger.loggerIoEmit("new-message", { color: "red", message: `${Nickname} error` }, io);
      resolve();
    }

    // Set to loading
    logger.info(`[Connection - ${connectionString}]`);
    logger.loggerIoEmit("update-status", { account: Nickname, status: "Loading" }, io);

    // In case connection closes
    controlChannel
      .waitForClose()
      .then(async () => {
        // Default actions
        isClicking = false;
        closeAll();
        battleMapResetListener();
        clearInterval(clickingInterval);
        logger.loggerIoEventOff(`stop-click-${Nickname}`, listener, io);
        logger.loggerIoEventOff(`pause-account-${Nickname}`, pauseListener, io);
        controlChannel.endConnection();
        logger.info(
          `${Nickname} - [Control Channel - Closed Connection] hasGlitched=${hasGlitched}, isClicking=${isClicking}, isDeadMap=${isDeadMap}, hasBeenClosedByUser=${hasBeenClosedByUser}, isAccountInMap=${isAccountInMap}, hashResponseHasNotArrived=${hashResponseHasNotArrived}, startedClickInterval=${startedClickInterval}`
        );

        // If it has been closed by user
        if (hasBeenClosedByUser) {
          logger.loggerIoEmit("close-click-session", Nickname, io);
          logger.info(`[${Nickname} - has been closed by user]`);
          closeAll();
          resolve(`[${Nickname}]`);
          return;
        }

        if (wrongPassOrBlock) {
          resolve();
          return;
        }

        // If the account is inside a map already
        if (isAccountInMap) {
          logger.loggerIoEmit("update-status", { account: Nickname, status: "Glitched" }, io);
          logger.loggerIoEmit("new-message", { color: "red", message: `${Nickname} in map` }, io);
          if (Map !== accountState.Map) {
            logger.loggerIoEmit("update-map", { account: Nickname, map: Map }, io);
          }
          logger.info(`[${Nickname} - is in map - One of the spaces did not open]`);
          closeAll();
          resolve(`[${Nickname} - is in map]`);
          return;
        }

        // If hash response did not arrive
        if (hashResponseHasNotArrived) {
          logger.loggerIoEmit("new-message", { color: "red", message: `Error ${Nickname}` }, io);
          logger.loggerIoEmit("close-click-session", Nickname, io);
          logger.info(`[${Nickname} - Hash response did not arrive]`);
          controlChannel.badConnection(3);
          resolve(`[${Nickname} - Error]`);
          return;
        }

        // If the map is dead and account did not click nor glitch (This means close session wtihout restart)
        if (isDeadMap) {
          logger.loggerIoEmit("close-click-session", Nickname, io);
          logger.loggerIoEmit("new-message", { color: "red", message: `Dead battle` }, io);
          logger.info(`[${Nickname} - Dead Map]`);
          resolve(`[${Nickname} - Dead Map]`);
          return;
        }

        // If someone has logged in or error
        if (!hasGlitched && !isClicking && !isDeadMap) {
          // Points
          controlChannel.badConnection(3);

          logger.loggerIoEmit("new-message", { color: "red", message: `Error ${Nickname}` }, io);
          logger.loggerIoEmit("update-status", { account: Nickname, status: "Timeout" }, io);
          logger.info(`[${Nickname} - Error (Restart)]`);
          closeAll();
          setTimeout(async () => {
            await clickAccount(Nickname, Password, rank, Map, Side, io, tankiConfig, proxyUrl);
            resolve(`[${Nickname} - Error]`);
            return;
          }, 500);
        }

        // If it did not glitch and has reached clicking stage (This means it got an error and should restart)
        if (!hasGlitched && isClicking && !isDeadMap && !startedClickInterval) {
          // Points
          controlChannel.goodConnection(3);

          logger.loggerIoEmit("update-status", { account: Nickname, status: "Glitched" }, io);
          logger.info(`[${Nickname} - Glitched]`);
          closeAll();
          setTimeout(() => {
            if (!hasBeenClosedByUser) leaveAccount(Nickname, Password, false, null, io, tankiConfig, proxyUrl);
          }, 5000);
          resolve(`[${Nickname}`);
          return;
        }

        if (!hasGlitched && isClicking && !isDeadMap && startedClickInterval) {
          // Points
          controlChannel.goodConnection(3);

          logger.loggerIoEmit("update-status", { account: Nickname, status: "Timeout" }, io);
          logger.info(`[${Nickname} - Timeout (Should restart)]`);
          closeAll();
          setTimeout(async () => {
            await clickAccount(Nickname, Password, rank, Map, Side, io, tankiConfig, proxyUrl);
            resolve(`[${Nickname}`);
            return;
          }, 1000);
        }

        // If it did glitch and has reached clicking stage (This means the account successfully clicked)
        if (hasGlitched && isClicking && !isDeadMap) {
          // Points
          controlChannel.goodConnection(3);
          onGlitched();
          return;
        }

        resolve(`[${Nickname} - Error (No conditions met)]`);
        return;
      })
      .catch((err) => {
        // Default actions
        isClicking = false;
        closeAll();
        logger.loggerIoEventOff(`stop-click-${Nickname}`, listener, io);
        controlChannel.endConnection();

        logger.loggerIoEmit("new-message", { color: "red", message: `Error ${Nickname}` }, io);
        logger.loggerIoEmit("close-click-session", Nickname, io);
        logger.info(`[${Nickname} - Control channel could not connect]`);
        logger.error(`${Nickname} ${err}`);
        controlChannel.badConnection(3);
        resolve(`[${Nickname} - Error]`);
        return;
      });

    // Request hash
    controlChannel.sendPacket("CL_HashRequest", tankiConfig);
    const hash = await controlChannel.waitForPacket("SV_HashResponse").catch((err) => {
      // Response did not arrive then force to close
      hashResponseHasNotArrived = true;
      controlChannel.badConnection(5);
      controlChannel.close();
    });

    if (!hash) {
      logger.error("Proxy error");
      return;
    }

    const { Hash } = hash;

    // Space two opens
    spaceTwo = new SpaceTwo(Nickname, Hash, connectionString, proxyUrl);
    spaceTwo.waitForNPackets(1).then(async () => {
      await spaceTwo.sendPacket("CL_dependeciesLoaded");
    });

    await spaceTwo.connectToServer();

    // Registers login handler
    await spaceTwo.waitForPacket("SV_ReadyToLogin");
    await spaceTwo.sendPacket("CL_Collection_Messages");
    await spaceTwo.sendPacket("CL_loginByPassword", { nickname: Nickname, password: Password });

    const blockOrWrongPassHandler = async () => {
      logger.loggerIoEmit("close-click-session", Nickname, io);
      logger.info(`${Nickname} - Invalid credentials`);
      wrongPassOrBlock = true;
      logger.loggerIoEmit("new-message", { color: "red", message: `${Nickname} invalid credentials` }, io);
      controlChannel.close();
      spaceTwo.close();
      logger.loggerIoEmit("remove-account", Nickname, io);
      resolve();
    };

    // Registers login errors
    spaceTwo.registerPacket("LoginByHashModelBase_loginByHashFailed", blockOrWrongPassHandler);
    spaceTwo.registerPacket("BlockValidatorModelBase_youAreBlocked", blockOrWrongPassHandler);

    const spaceThreePromise = async () => {
      return controlChannel
        .waitForPacket("SV_OpenSpace", "Space Three")
        .then(async () => {
          // Open Space Three
          spaceThree = new SpaceThree(Nickname, Hash, connectionString, proxyUrl);
          await spaceThree.connectToServer();
          spaceThree.waitForClose().then(closeAll);

          // Handle Load Dependencies
          await spaceThree.waitForPacket("SV_loadDependencies");
          await spaceThree.sendPacket("CL_dependeciesLoaded");
        })
        .catch((err) => {
          logger.error(err);
        });
    };

    const spaceFourPromise = async () => {
      return controlChannel
        .waitForPacket("SV_OpenSpace", "Space Four")
        .then(async () => {
          let control = true;
          // Open Space Four
          spaceFour = new SpaceFour(Nickname, Hash, connectionString, proxyUrl);
          await spaceFour.connectToServer();
          spaceFour.waitForClose().then(closeAll);

          // Packet that arrives which contains the online status
          spaceFour.waitForPacket("OnlineNotifierModelBase_setOnline").then((data) => {
            if (!control) return;
            (accountState.ID = data.ID), (accountState.Server = data.Server), (accountState.online = data.online);
          });

          // Packet that arrives which contains the rank
          spaceFour.waitForPacket("RankNotifierModelBase_setRank").then((data) => {
            if (!control) return;
            if (accountState.ID == data.Uid) {
              accountState.Rank = data.Rank;

              if (data.Rank !== rank) {
                rank = data.Rank;
                logger.info(`${Nickname} - Rank changed to ${data.Rank}`);
                logger.loggerIoEmit("update-rank", { account: Nickname, rank: data.Rank }, io);
              }
            }
          });

          // Packet that arrives which contains the nickname
          spaceFour.waitForPacket("UidNotifierModelBase_setUid").then((data) => {
            if (!control) return;
            if (accountState.ID == data.Uid) {
              accountState.Nickname = data.Nickname;

              if (data.Nickname !== Nickname) {
                logger.info(`${Nickname} - Nickname changed to ${data.Nickname}`);
                logger.loggerIoEmit("update-nickname", { account: Nickname, nickname: data.Nickname }, io);
                Nickname = data.nickname;
              }
            }
          });

          // Packet that arrives when account is in a map (Only public maps)
          spaceFour.waitForPacket("BattleNotifierModelBase_setBattle").then((data) => {
            if (!control) return;
            if (accountState.ID == data.Id) accountState.Map = data.Map;
          });

          // Packet that arrives when map link is dead
          spaceFour.registerPacket("LinkActivatorModelBase_dead", deadMap);

          // Packet that arrives when account is in map and needs to be moved
          spaceFour.registerPacket("MoveUserToServerModelBase_move", (data) => {
            onGlitched();
            accountState.ReconnectServer = data.Server;
            controlChannel.setReconnectLink(parseInt(data.Server), Map);
          });

          // Packet that arrives when the account is in a map (This is equivilent to getting an error in the game)
          spaceFour.registerPacket("LobbyLayoutNotifyModelBase_cancelPredictedLayoutSwitch", (data) => {
            onGlitched();
          });

          // Packet that arrives when account is on the battle list
          spaceFour.waitForPacket("LobbyLayoutNotifyModelBase_endLayoutSwitch", async () => {
            await spaceFour.sendPacket("CL_changeScreen", "Pro Battle");
            await spaceSix.sendPacket("CL_changeChannel", "NO_FORMAT");
            await spaceFour.sendPacket("CL_showBattleSelect");
          });

          await spaceFour.waitForNPackets();
          await spaceFour.sendPacket("CL_gpuDetection");
          await spaceFour.waitForNPackets();
          await spaceFour.sendPacket("CL_dependeciesLoaded");

          // Wait for dependencies
          spaceFour.registerPacket("SV_loadDependencies", async () => {
            await spaceFour.sendPacket("CL_dependeciesLoaded");
          });
          // await spaceFour.waitForPacket("SV_loadDependencies")
          control = false;

          // Send trackers
          // await spaceFour.sendPacket("CL_gpuDetection")
          // await spaceFour.sendPacket("CL_logTrackers")
          // await spaceFour.sendPacket("CL_logGpuReport")
          await spaceFour.sendPacket("CL_premEnded");
        })
        .catch((err) => {
          logger.error(err);
        });
    };

    const spaceFivePromise = async () => {
      return controlChannel
        .waitForPacket("SV_OpenSpace", "Space Five")
        .then(async () => {
          // Open Space Five
          spaceFive = new SpaceFive(Nickname, Hash, connectionString, proxyUrl);
          await spaceFive.connectToServer();
          spaceFive.waitForClose().then(closeAll);

          spaceFive.registerPacket();
          await spaceFive.waitForNPackets();
          spaceFive.sendPacket("CL_dependeciesLoaded");
          await spaceFive.waitForNPackets();
          spaceFive.sendPacket("CL_dependeciesLoaded");
        })
        .catch((err) => {
          logger.error(err);
        });
    };

    const spaceSixPromise = async () => {
      return controlChannel
        .waitForPacket("SV_OpenSpace", "Space Six")
        .then(async () => {
          spaceSix = new SpaceSix(Nickname, Hash, connectionString, proxyUrl);
          await spaceSix.connectToServer();
          spaceSix.waitForClose().then(closeAll);

          // Space Six Dependencies
          // await spaceSix.waitForPacket("SV_loadDependencies");
          await spaceSix.waitForNPackets();
          await spaceSix.sendPacket("CL_dependeciesLoaded");
        })
        .catch((err) => {
          logger.error(err);
        });
    };

    Promise.all([spaceThreePromise(), spaceFourPromise(), spaceFivePromise(), spaceSixPromise()])
      .then(async () => {
        logger.info(`Activating ${Map}`);
        await spaceFour.sendPacket("CL_checkIfAlive", Map);
        await spaceFour.sendPacket("CL_activateLink", Map);
        logger.info(`Time taken to open battle list: ${(performance.now() - start_time) / 1000} seconds`);
      })
      .catch((err) => {
        // Set account in map then force it to close
        logger.error(err.message);
        // isAccountInMap = true;
        controlChannel.close();
      });

    controlChannel
      .waitForPacket("SV_OpenSpace", "Space Eight", false)
      .then(async (data) => {
        controlChannel.setReconnectLink(connectionString.split("c")[1].split(".")[0], data);
        onGlitched();
        closeAll();
      })
      .catch(() => {
        logger.info(`${Nickname} - Space eight did not open`);
      });

    await spaceTwo.waitForPacket("SV_loginFollowUp");
    await spaceTwo.sendPacket("CL_loginFollowUp");
    logger.info(`Time taken for login: ${(performance.now() - start_time) / 1000} seconds`);

    // If Space 2 closes, Success login
    await spaceTwo.waitForClose();

    // Increment score
    controlChannel.goodConnection();

    controlChannel
      .waitForPacket("SV_OpenSpace", "Space Seven", true, 15000)
      .then(async () => {
        // Open Space Seven
        spaceSeven = new SpaceSeven(Nickname, Hash, connectionString, proxyUrl);

        await spaceSeven.connectToServer();
        spaceSeven.waitForClose().then(closeAll);

        await spaceSeven.waitForNPackets();
        spaceSeven.sendPacket("CL_dependeciesLoaded");

        logger.loggerIoEmit("update-status", { account: Nickname, status: "Clicking" }, io);

        spaceSeven.registerPacket("BattleEntranceModelBase_enterToBattleFailed", onGlitched);
        spaceSeven.registerPacket("DispatcherModelBase_unloadObjects", (data) => {
          if (data) {
            if (data.battleMap === Map) {
              // Set to dead map then force to close
              isDeadMap = true;
              logger.info("Map has ended");
              controlChannel.close();
            }
          }
        });

        spaceSeven.registerPacket(Side !== "J" ? "TeamBattleInfoModelBase_addUser" : "", (data) => {
          const {
            objectId,
            argumentValues: { playerId, side },
          } = data;
          if (objectId !== Map) return;

          const stringSide = side === "00000000" ? "A" : "B";
          BattleObject.addPlayer(playerId, stringSide);

          if (playerId == accountState.ID) {
            onGlitched();
          }

          console.log(`Player ${playerId} joined the battle in side ${stringSide}`);
        });

        spaceSeven.registerPacket(Side !== "J" ? "TeamBattleInfoModelBase_removeUser" : "BattleDMInfoModelBase_removeUser", (data) => {
          const {
            objectId,
            argumentValues: { playerId },
          } = data;

          pingCaptchaSolverPool();

          if (objectId == Map) {
            BattleObject.removePlayer(playerId);
          }
        });

        spaceSeven.registerPacket("BattleInfoCC", async (data) => {
          for (const BattleMap of data) {
            if (BattleMap.MapID == Map) {
              BattleObject.clearPlayers();
              if (Side !== "J") {
                for (let i = 0; i < BattleMap.usersTeamA.length; i++) {
                  BattleObject.addPlayer(BattleMap.usersTeamA[i].PlayerId, "A");
                }

                for (let i = 0; i < BattleMap.usersTeamB.length; i++) {
                  BattleObject.addPlayer(BattleMap.usersTeamB[i].PlayerId, "B");
                }
              } else {
                for (let i = 0; i < BattleMap.usersTeamJ.length; i++) {
                  BattleObject.addPlayer(BattleMap.usersTeamJ[i].PlayerId, "J");
                }
              }

              BattleObject.maxPlayers = BattleMap.BattleParamsInfo.maxPeopleCount ?? 10;
            }
          }

          BattleObject.print();
        });

        logger.info(`[${Nickname} - Clicking]`);
        isClicking = true;
        startedClickInterval = true;

        const freeSpotListener = async (leaveSide, playerId) => {
          if (leaveSide !== Side) return;
          logger.info("Free spot found", leaveSide, playerId);
          clickPacket();

          setTimeout(() => {
            if (isClicking) {
              logger.info("Clicking again");
              clickPacket();
            }
          }, 500);
        };

        BattleObject.onFreeSpot(freeSpotListener);
        battleMapResetListener = () => BattleObject.removeFreeSpotListener(freeSpotListener);
        clickingInterval = createClickingInterval({ startImmediate: true });
        handleCaptchaSolving();

        logger.info(`Time taken to start clicking: ${(performance.now() - start_time) / 1000} seconds`);
        await spaceThree.waitForClose(); // Infinite wait dont exit early
      })
      .catch((err) => {
        logger.error(err.message);
        controlChannel.close();
      });

    let intervalSpeed = MAX_CLICKER_INTERVAL_TIMEOUT;

    function createClickingInterval({ startImmediate }) {
      if (clickingInterval) clearInterval(clickingInterval);
      if (startImmediate) clickPacket();
      return setInterval(clickPacket, intervalSpeed);
    }

    async function clickPacket(packets = 1) {
      await spaceSeven.sendPacket("CL_joinBattle", { mapLink: Map, side: Side, packets });

      const currentTime = new Date().getTime();
      const timeSinceLastPacket = currentTime - lastPacketTime;
      lastPacketTime = currentTime;

      averagePer10SecondsCounter++;
      if (!isNaN(timeSinceLastPacket)) {
        averagePer10Seconds += timeSinceLastPacket;
      }
    }

    let isCaptchaMap = false;

    async function sendCaptchaPacket() {
      if (!isCaptchaMap) return;
      const captchaSolution = await getCaptcha();
      await spaceFive.sendPacket("CaptchaModelServer_checkCaptcha", { captchaSolution, captchaPrefix: 6 });
      isCaptchaMap = false;
    }

    async function handleCaptchaSolving() {
      spaceFive.registerPacket("CaptchaModelBase_showCaptcha", async () => {
        isCaptchaMap = true;
        clearInterval(clickingInterval);
        await sendCaptchaPacket();
      });

      spaceFive.registerPacket("CaptchaModelBase_captchaCorrect", async () => {
        logger.info(`[${Nickname} - Captcha Correct]`);
      });

      spaceFive.registerPacket("CaptchaModelBase_captchaFailed", async () => {
        await sendCaptchaPacket();
      });
    }

    await controlChannel.waitForClose();

    async function closeAll() {
      spaceTwo !== null && spaceTwo.close();
      spaceThree !== null && spaceThree.close();
      spaceFour !== null && spaceFour.close();
      spaceFive !== null && spaceFive.close();
      spaceSix !== null && spaceSix.close();
      spaceSeven !== null && spaceSeven.close();
      controlChannel.close();
      resolve();
    }

    function deadMap() {
      isDeadMap = true;
    }

    function onGlitched() {
      logger.loggerIoEmit("update-status", { account: Nickname, status: "Glitched" }, io);
      isClicking = false;
      hasGlitched = true;
      logger.info(`[${Nickname} - Glitched]`);

      setTimeout(() => {
        if (!hasBeenClosedByUser) leaveAccount(Nickname, Password, false, null, io, tankiConfig, proxyUrl);
      }, 5000);

      resolve(`[${Nickname} - Glitched]`);
      closeAll();
    }
  });
}

setInterval(() => {
  averagePer10Seconds = averagePer10Seconds / averagePer10SecondsCounter;
  if (!isNaN(Math.floor(averagePer10Seconds))) {
    console.log(`The average click speed is `, Math.floor(averagePer10Seconds));
  }
  averagePer10SecondsCounter = 0;
  averagePer10Seconds = 0;
}, 5000);

export default clickAccount;
