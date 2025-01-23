import ControlChannel from "../Connections/control/controlChannel.js";
import SpaceTwo from "../Connections/space/spaceTwo.js";
import SpaceThree from "../Connections/space/spaceThree.js";
import SpaceFour from "../Connections/space/spaceFour.js";
import SpaceFive from "../Connections/space/spaceFive.js";
import SpaceSix from "../Connections/space/spaceSix.js";
import SpaceEight from "../Connections/space/spaceEight.js";
import Logger from "../Logger/Logger.js";
const min_refresh_rate_ms = 50000;
const max_refresh_rate_ms = 60000;

async function leaveAccount(Nickname, Password, leave, reconnectServer = null, io, tankiConfig, proxyUrl) {
  return new Promise(async (resolve) => {
    let spaceTwo = null;
    let spaceThree = null;
    let spaceFour = null;
    let spaceFive = null;
    let spaceSix = null;
    let spaceSeven = null;
    let spaceEight = null;
    let hasLeft = false;
    const logger = new Logger(Nickname);
    let hasRefreshed = false;
    let hasSwitchedMode = false;
    let controlChannel;
    let hasBeenClosedByUser = false;
    let isControlOpen = true;
    let connectionString;
    const accountState = { ID: "", Server: 0, online: "", Rank: "", Map: "", Nickname: "", ReconnectServer: "" };

    try {
      // On user stop click account
      logger.loggerIoEvent(`stop-click-${Nickname}`, listener, io);
      logger.loggerIoEvent(`switch-refreshing-mode-${Nickname}`, listener2, io);

      controlChannel = new ControlChannel(Map, Nickname, true, reconnectServer, proxyUrl);
      connectionString = controlChannel.getConnectionString();
      accountState.Server = parseInt((accountState.Server = connectionString.split("c")[1].split(".")[0]));
      if (connectionString == null) return;
      await controlChannel.connectToServer();
      logger.info(`[${Nickname} - Connection opened}]`);
      if (!leave) logger.info(`[ { Account: ${Nickname}, Status: Refreshing } ]`);
      if (leave) logger.info(`[ { Account: ${Nickname}, Status: Leaving } ]`);
      if (!leave) logger.loggerIoEmit("update-status", { account: Nickname, status: "Refreshing" }, io);
      if (leave) logger.loggerIoEmit("update-status", { account: Nickname, status: "Unglitching" }, io);

      function listener() {
        logger.info(`[${Nickname} - Click stopped by user]`);
        hasBeenClosedByUser = true;
        controlChannel.close();
        resolve();
        closeAll();
        logger.loggerIoEventOff(`stop-click-${Nickname}`, listener, io);
      }

      function listener2() {
        logger.info(`[${Nickname} - Switched to leaving mode]`);
        leave = true;
        hasSwitchedMode = true;
        controlChannel.close();
        logger.loggerIoEmit("update-status", { account: Nickname, status: "Unglitching" }, io);
        resolve();
        closeAll();
        logger.loggerIoEventOff(`switch-refreshing-mode-${Nickname}`, listener2, io);
        leaveAccount(Nickname, Password, leave, accountState.Server, io, tankiConfig, proxyUrl);
      }

      // Request hash
      controlChannel.sendPacket("CL_HashRequest", tankiConfig);
      const hash = await controlChannel.waitForPacket("SV_HashResponse").catch((err) => {
        // Response did not arrive then force to close (very rare, but when happens connection is shit)
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

      // Handler for close of Control Channel
      controlChannel.waitForClose().then(() => {
        isControlOpen = false;
        logger.error(`[${Nickname} - Connection closed]`);
        closeAll();
        let delay = hasRefreshed ? Math.floor(Math.random() * (max_refresh_rate_ms - min_refresh_rate_ms + 1)) + min_refresh_rate_ms : 5000;
        if (hasSwitchedMode) delay = 1;
        if (hasLeft) delay = 1;

        setTimeout(async () => {
          if (hasBeenClosedByUser) return;
          // Temperorly disabled stop refresh if account not in map
          // if (!accountInMap) return;
          logger.loggerIoEventOff(`stop-click-${Nickname}`, listener, io);
          logger.loggerIoEventOff(`switch-refreshing-mode-${Nickname}`, listener2, io);
          if (hasSwitchedMode) return;
          if (hasLeft) {
            logger.loggerIoEmit("close-click-session", Nickname, io);
            logger.info("[Left Map - " + Nickname + "]");
            return;
          }
          if (accountState.ReconnectServer !== "") {
            leaveAccount(Nickname, Password, leave, accountState.ReconnectServer, io, tankiConfig, proxyUrl);
          } else if (!leave || (leave && !hasLeft)) {
            leaveAccount(Nickname, Password, leave, accountState.Server, io, tankiConfig, proxyUrl);
          } else {
            logger.loggerIoEmit("close-click-session", Nickname, io);
            logger.error(`[${Nickname} - Unknown error]`);
            resolve();
            return;
          }
        }, delay);
      });

      // Registers login handler
      await spaceTwo.waitForPacket("SV_ReadyToLogin");
      await spaceTwo.sendPacket("CL_Collection_Messages");
      await spaceTwo.sendPacket("CL_loginByPassword", { nickname: Nickname, password: Password });

      // Registers login errors
      spaceTwo.waitForPacket("Collection_SV_LoginErrors").then((errorPacket) => {
        const { packetName, errorMessage } = errorPacket;
        hasClicked = true;
        logger.error(`[${packetName} ${Nickname} - ${errorMessage}]`);
        loggerIoEmit("close-click-session", Nickname, io);
        loggerIoEmit("new-message", { color: "red", message: `${Nickname}${errorMessage}`, io });
        controlChannel.close();
        spaceTwo.close();
        loggerIoEmit("remove-account", Nickname, io);
        resolve();
      });

      // Wait for space Three to open
      const spaceThreePromise = () => {
        return controlChannel.waitForPacket("SV_OpenSpace", "Space Three").then(async () => {
          // Open Space Three
          spaceThree = new SpaceThree(Nickname, Hash, connectionString, proxyUrl);
          await spaceThree.connectToServer();
          spaceThree.waitForClose().then(closeAll);

          // Handle Load Dependencies
          await spaceThree.waitForPacket("SV_loadDependencies");
          await spaceThree.sendPacket("CL_dependeciesLoaded");
        });
      };

      const loginFollowUpPromise = () => {
        return new Promise(async (resolve, reject) => {
          await spaceTwo.waitForPacket("SV_loginFollowUp");
          await spaceTwo.sendPacket("CL_loginFollowUp");

          // If Space 2 closes, Success login
          await spaceTwo.waitForClose();
          resolve();
        });
      };

      const spaceFourPromise = () => {
        return controlChannel
          .waitForPacket("SV_OpenSpace", "Space Four", true, 15000)
          .then(async () => {
            // Open Space Four
            spaceFour = new SpaceFour(Nickname, Hash, connectionString, proxyUrl);
            await spaceFour.connectToServer();
            spaceFour.waitForClose().then(closeAll);

            spaceFour.waitForPacket("OnlineNotifierModelBase_setOnline").then((data) => {
              (accountState.ID = data.ID), (accountState.online = data.online);
            });

            spaceFour.waitForPacket("RankNotifierModelBase_setRank").then((data) => {
              if (accountState.ID == data.Uid) accountState.Rank = data.Rank;
            });

            spaceFour.waitForPacket("UidNotifierModelBase_setUid").then((data) => {
              if (accountState.ID == data.Uid) accountState.Nickname = data.Nickname;
            });

            spaceFour.waitForPacket("BattleNotifierModelBase_setBattle").then((data) => {
              if (accountState.ID == data.Uid) accountState.Map = data.Map;
            });

            spaceFour.waitForPacket("MoveUserToServerModelBase_move").then((data) => {
              accountState.ReconnectServer = data.Server;
              if (accountState.ReconnectServer !== "") {
                const reconnectServer = parseInt(accountState.ReconnectServer);
                if (accountState.Server !== reconnectServer) logger.info(`${Nickname} - Account must switch to server ${reconnectServer}`);
                controlChannel.setReconnectLink(reconnectServer, accountState.Map);
                closeAll();
                return;
              }
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

      const spaceFivePromise = () => {
        return controlChannel
          .waitForPacket("SV_OpenSpace", "Space Five", true, 12000)
          .then(async () => {
            // Open Space Five
            spaceFive = new SpaceFive(Nickname, Hash, connectionString, proxyUrl);
            await spaceFive.connectToServer();
            spaceFive.waitForClose().then(closeAll);

            // Space five dep
            await spaceFive.waitForNPackets();
            await spaceFive.sendPacket("CL_dependeciesLoaded");
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
          })
          .catch((err) => {
            if (err.message.includes("Timeout waiting for packet")) {
              logger.error(`${Nickname} - Space six did not open`);
            } else {
              logger.error(err);
            }
          });
      };

      const spaceEightPromise = () => {
        return controlChannel
          .waitForPacket("SV_OpenSpace", "Space Eight", true, 3000)
          .then(async (result) => {
            accountState.Map = result;
            hasRefreshed = true;
            controlChannel.setReconnectLink(connectionString.split("c")[1].split(".")[0], result);
            // Connect to space eight
            spaceEight = new SpaceEight(Nickname, Hash, connectionString, accountState.Map, proxyUrl);
            await spaceEight.connectToServer();
            spaceEight.waitForClose().then(closeAll);
            if (!leave) logger.success(`[ { Account: ${Nickname}, Status: Refreshed } ]`);
            if (!leave) logger.loggerIoEmit("update-status", { account: Nickname, status: "Glitched" }, io);
            // Set as re-connect link
            logger.success(`[${Nickname} [${connectionString} has been set as the reconnect link]`);

            let hasSentLeave = false;

            setTimeout(async () => {
              if (leave && !hasSentLeave && isControlOpen) {
                await spaceFour.sendPacket("CL_exitFromBattle");
                logger.success("[LEAVE1]", Nickname);
                hasLeft = true;
              }
            }, 500);

            await spaceEight.waitForNPackets();

            if (leave && isControlOpen) {
              await spaceFour.sendPacket("CL_exitFromBattle");
              hasSentLeave = true;
              hasLeft = true;
              logger.success("[LEAVE2]", Nickname);
              logger.loggerIoEmit("new-message", { color: "green", message: `${Nickname} left the map` }, io);
            }

            setTimeout(() => {
              closeAll();
            }, 3000);
          })
          .catch((err) => {
            logger.error(err);
          });
      };

      await Promise.all([loginFollowUpPromise(), spaceThreePromise(), spaceFourPromise()]).catch((err) => {
        logger.error(`${Nickname} - ${err.message}`);
      });

      const promiseArray = [spaceFivePromise, spaceSixPromise, spaceEightPromise];
      let resolvedPromises = 0;

      const waitUntilAccountLoads = async () => {
        return new Promise((resolve, reject) => {
          for (const promise of promiseArray) {
            promise()
              .then(() => {
                resolvedPromises++;

                if (resolvedPromises == 2) {
                  resolve("Promises resolved");
                }
              })
              .catch((err) => {
                resolve("Promises resolved");
                logger.error(`${Nickname} - ${err.message}`);
              });
          }
        });
      };

      await waitUntilAccountLoads();

      // Once the account has reconnected check the map
      if (accountState.Map == "") {
        logger.info(`${Nickname} - Account not in a map`);
        if (leave) {
          hasLeft = true;
          logger.loggerIoEmit("close-click-session", Nickname, io);
        }
        closeAll();
        resolve();
        return;
      }

      logger.info(`${Nickname} - Account is in ${accountState.Map}`);
      closeAll();

      await controlChannel.waitForClose();

      controlChannel.endConnection();

      async function closeAll() {
        spaceTwo !== null && spaceTwo.close();
        spaceThree !== null && spaceThree.close();
        spaceFour !== null && spaceFour.close();
        spaceFive !== null && spaceFive.close();
        spaceSix !== null && spaceSix.close();
        spaceSeven !== null && spaceSeven.close();
        spaceEight !== null && spaceEight.close();
        controlChannel.close();
      }
    } catch (err) {
      logger.error(`${Nickname} - ${err}`);
    }
  });
}

export default leaveAccount;
