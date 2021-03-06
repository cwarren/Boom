Game.DATASTORE.MAP = {};

Game.Map = function (mapTileSetName) {

  //console.log("setting up new map using "+mapTileSetName+" tile set");

  this._tiles = Game.MapTileSets[mapTileSetName].getMapTiles();
  console.dir(this._tiles);
  this.attr = {
    _id: Game.util.randomString(32),
    _mapTileSetName: mapTileSetName,
    _width: this._tiles.length,
    _height: this._tiles[0].length,
    _entitiesByLocation: {},
    _locationsByEntity: {},
    _itemsByLocation: {},
    _bombsByLocation: {},
    _locationsByBomb: {},
    _teleportPos: {}
  };

  Game.DATASTORE.MAP[this.attr._id] = this;
};

Game.Map.prototype.getId = function () {
  return this.attr._id;
};

Game.Map.prototype.getWidth = function () {
  return this.attr._width;
};

Game.Map.prototype.getHeight = function () {
  return this.attr._height;
};

Game.Map.prototype.getTile = function (x_or_pos,y) {
  var useX = x_or_pos,useY=y;
  if (typeof x_or_pos == 'object') {
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  if ((useX < 0) || (useX >= this.attr._width) || (useY<0) || (useY >= this.attr._height)) {
    return Game.Tile.nullTile;
  }
  return this._tiles[useX][useY] || Game.Tile.nullTile;
};
Game.Map.prototype.setTile = function (tile, x_or_pos,y) {
  var useX = x_or_pos, useY=y;
  if (typeof x_or_pos == 'object') {
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  this._tiles[useX][useY] = tile;
}
Game.Map.prototype.clearFire = function (){
  for (var a = 0; a < this.attr._width; a ++) {
    for (var b =0 ;  b< this.attr._height; b++) {
      if (this.getTile(a,b)  == Game.Tile.fireTile) {
        this._tiles[a][b] = Game.Tile.floorTile;
      }
    }
  }
}
Game.Map.prototype.clearWater = function (){
  for (var a = 0; a < this.attr._width; a ++) {
    for (var b =0 ;  b< this.attr._height; b++) {
      if (this.getTile(a,b)  == Game.Tile.waterTile) {
        this._tiles[a][b] = Game.Tile.floorTile;
      }
    }
  }
}

Game.Map.prototype.addEntity = function (ent,pos) {
  this.attr._entitiesByLocation[pos.x+","+pos.y] = ent.getId();
  this.attr._locationsByEntity[ent.getId()] = pos.x+","+pos.y;
  ent.setMap(this);
  ent.setPos(pos);
};

Game.Map.prototype.addItem = function (itm,pos) {
    if (! this.attr._itemsByLocation[pos]) {
      this.attr._itemsByLocation[pos] = itm;
    }
};

Game.Map.prototype.addBomb = function (bomb,pos) {

    var loc = pos.x+","+pos.y;
    if (! this.attr._bombsByLocation[loc]) {
      this.attr._bombsByLocation[loc] = bomb;
      this.attr._locationsByBomb[bomb.getId()] = loc;
    }
    // this.attr._bombsByLocation[loc].push(bomb);
    // this.attr._locationsByBomb[bomb]=loc;
};


Game.Map.prototype.updateEntityLocation = function (ent) {
  //console.log('updating position of '+ent.getName()+' ('+ent.getId()+')');
  var origLoc = this.attr._locationsByEntity[ent.getId()];
  if (origLoc) {
    this.attr._entitiesByLocation[origLoc] = undefined;
  }
  var pos = ent.getPos();
  this.attr._entitiesByLocation[pos.x+","+pos.y] = ent.getId();
  this.attr._locationsByEntity[ent.getId()] = pos.x+","+pos.y;
};
Game.Map.prototype.getEntity = function (x_or_pos,y) {
  var useX = x_or_pos,useY=y;
  if (typeof x_or_pos == 'object') {
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  var entId = this.attr._entitiesByLocation[useX+','+useY];
  if (entId) { return Game.DATASTORE.ENTITY[entId]; }
  return  false;
};

Game.Map.prototype.getBombs = function (x_or_pos,y) {
  var useX = x_or_pos,useY=y;
  if (typeof x_or_pos == 'object') {
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  var bombIds = this.attr._bombsByLocation[useX+','+useY];
  if (bombIds) { return bombIds; }
  return  false;
};

Game.Map.prototype.getItems = function (x_or_pos,y) {
  var useX = x_or_pos,useY=y;
  if (typeof x_or_pos == 'object') {
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  var itemIds = this.attr._itemsByLocation[useX+','+useY];
  if (itemIds) { return itemIds;; }
  return  false;
};

Game.Map.prototype.getRandomLocation = function(filter_func) {
  if (filter_func === undefined) {
    filter_func = function(tile) { return true; };
  }
  var tX,tY,t;
  do {
    tX = Game.util.randomInt(0,this.attr._width - 1);
    tY = Game.util.randomInt(0,this.attr._height - 1);
    t = this.getTile(tX,tY);
  } while (! filter_func(t));
  return {x:tX,y:tY};
};
Game.Map.prototype.extractEntity = function (ent) {
  this.attr._entitiesByLocation[ent.getX()+","+ent.getY()] = undefined;
  this.attr._locationsByEntity[ent.getId()] = undefined;
  return ent;
};
Game.Map.prototype.extractEntityAt = function (x_or_pos,y) {
  var ent = this.getEntity(x_or_pos,y);
  if (ent) {
    this.attr._entitiesByLocation[ent.getX()+","+ent.getY()] = undefined;
    this.attr._locationsByEntity[ent.getId()] = undefined;
  }
  return ent;
};
Game.Map.prototype.getRandomWalkableLocation = function() {
  return this.getRandomLocation(function(t){ return t.isWalkable(); });
};
Game.Map.prototype.getRandomNonWalkableLocation = function() {
  return this.getRandomLocation(function(t){ return !t.isWalkable(); });
};


Game.Map.prototype.renderOn = function (display,camX,camY) {
  // console.log("display is ");
  // console.dir(display);
  var dispW = display._options.width;
  var dispH = display._options.height;
  // var xStart = camX-Math.round(dispW/2);
  // var yStart = camY-Math.round(dispH/2);
  for (var x = 0; x < dispW; x++) {
    for (var y = 0; y < dispH; y++) {
      // Fetch the glyph for the tile and render it to the screen - sub in wall tiles for nullTiles / out-of-bounds
      var mapPos = {x:x,y:y};
      var tile = this.getTile(mapPos);
      if (tile.getName() == 'nullTile') {
        tile = Game.Tile.wallTile;
      }
      tile.draw(display,x,y);

      var bomb = this.getBombs(mapPos);
      if (bomb) {
        bomb.draw(display,x,y);
      }
      var item = this.getItems(mapPos);
      if (item) {
        item.draw(display,x,y);
      }
      var ent = this.getEntity(mapPos);
      if (ent) {
        ent.draw(display,x,y);
      }
    }
  }
};
