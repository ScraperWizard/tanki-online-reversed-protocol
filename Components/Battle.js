const BattleInstances = {};

class Battle {
  constructor(mapId) {
    if (BattleInstances[mapId]) return BattleInstances[mapId];
    BattleInstances[mapId] = this;
    this.Id = mapId;
    this.server = null;
    this.rankRange = null;
    this.fund = null;
    this.name = null;
    this.mode = null;
    this.map = null;
    this.players = {};
    this.state = null;
    this.maxPlayers = null;
    this.listeners = [];
  }

  clearPlayers() {
    this.players = {};
    this.maxPlayers = 0;
  }

  addPlayer(playerId, side) {
    if (!this.players[playerId]) this.players[playerId] = {};

    this.players[playerId] = { side };
  }

  removePlayer(playerId) {
    const player = this.players[playerId];
    if (!player) return;

    delete this.players[playerId];
    this.emitFreeSpot(player.side, playerId);
  }

  emitFreeSpot(side, playerId) {
    this.listeners.forEach((listener) => listener(side, playerId));
  }
  
  onFreeSpot(listener) {
    this.listeners.push(listener);
  }

  removeFreeSpotListener(listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  isFreeSide(side) {
    const playersInSide = Object.values(this.players).filter((player) => player.side === side);
    return playersInSide.length < this.maxPlayers;
  }

  print() {
    console.log(
      `Battle Information: ID: ${this.Id}, Server: ${this.server}, Rank Range: ${this.rankRange}, Fund: ${this.fund}, Name: ${this.name}, Mode: ${this.mode}, Map: ${
        this.map
      }, Players: ${JSON.stringify(this.players)}, State: ${this.state}, Max Players: ${this.maxPlayers}`
    );
  }
}

export default Battle;
