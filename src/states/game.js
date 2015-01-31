var Player = require('../sprites/player.js');
var MovingPlatform = require('../sprites/movingplatform.js');

module.exports = {
    // state variables
    groundSpeed: 150,
    speedMultiplier: 2,
    speedEnabled: false,
    autoJumpEnabled: false,
    playerSpawn: null,
    playerDeaths: 0,
    levelComplete: false,
    timeCurrent: 0,
    timeLevelStart: 0,
    levelKey: null,
    map: null,
    
    timerText: null,
    pauseText: null, 
    deathSubText: null,
    deathText: null,
    keyText: null,
    lvlWinText: null,
    lvlWinSubText: null,

    deathTextTween: null,
    deathSubTextTween: null,

    keyUIEmpty: null,
    keyUIFull: null,
    // state methods
    create: function () {
        console.log('create: in game state');

        var i; // for later loops.
        if (game.currentLevel === 1) {
            console.log('loading level 1');
            // add background image
            game.add.sprite(0, 0, 'background');

            // add tilemap & associated tilesets
            this.map = game.add.tilemap('level1');
            this.map.addTilesetImage('Tileset');
        }
        else if (game.currentLevel === 2) {
            console.log('loading level 2');

            game.add.sprite(0, 0, 'background');

            this.map = game.add.tilemap('level2');
            this.map.addTilesetImage('Tileset');
        }

        // create shared level ccomponents
        // TODO: better way of setting all of these collisions
        this.map.setCollisionBetween(122, 126);
        this.map.setCollisionBetween(152, 166);
        this.map.setCollisionBetween(362, 365);
        this.map.setCollisionBetween(391, 395);
        platformLayer = this.map.createLayer('Platforms');
        platformLayer.resizeWorld();
        // define some tiles to have certain actions on collision
        this.map.setTileIndexCallback(137, this.completeLevel, this);

        // create some UI elements
        this.timerText = game.add.text(32,
                                       32,
                                       'Time: --:--',
                                       { font: "20px Arial",
                                         fill: '#000',
                                         keys: null,
                                         align: 'left'});
        this.pauseText = game.add.text(0,
                                       game.world.centerY,
                                       'PAUSED',
                                       { font: "65px Arial",
                                         fill: '#000',
                                         align: 'center'});
        this.pauseText.x = game.world.centerX - (this.pauseText.width / 2);
        this.pauseText.alpha = 0;
        this.deathText = game.add.text(0,
                                       game.world.centerY - 65,
                                       'DIED',
                                       { font: "65px Arial",
                                         fill: '#000',
                                         keys: null,
                                         align: 'center'});
        this.deathText.alpha = 0;
        this.deathText.x = game.world.centerX - (this.deathText.width / 2);
        this.deathSubText = game.add.text(0,
                                          game.world.centerY + 10,
                                          'You died X times.',
                                          { font: "20px Arial",
                                            fill: '#000',
                                            align: 'center'});
        this.deathSubText.alpha = 0;
        this.lvlWinText = game.add.text(0,
                                        game.world.centerY / 2,
                                        'LEVEL COMPLETE!',
                                        { font: "65px Arial",
                                          fill: '#000',
                                          align: 'center'});
        this.lvlWinSubText = game.add.text(0,
                                           game.world.centerY,
                                           'placeholder',
                                           { font: "45px Arial",
                                             fill: '#000',
                                             align: 'left'});
        
        this.lvlWinText.x = (game.world.centerX - (this.lvlWinText.width / 2));
        this.lvlWinText.alpha = 0;
        this.lvlWinSubText.alpha = 0;
        this.lvlWinText.addColor('red', 6);
        this.lvlWinText.addColor('orange', 7);
        this.lvlWinText.addColor('yellow', 8);
        this.lvlWinText.addColor('green', 9);
        this.lvlWinText.addColor('blue', 10);
        this.lvlWinText.addColor('indigo', 11);
        this.lvlWinText.addColor('violet', 12);
        this.lvlWinText.addColor('red', 13);


        this.keyUIEmpty = game.add.image(32, 55, 'Player', 407);
        this.keyUIFull = game.add.image(32, 55, 'Player', 403);
        this.keyUIFull.alpha = 0; // hide this image at first

        // initialize world physics
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.physics.arcade.gravity.y = 300;
        // the following line populates game.time.fps variables
        game.time.advancedTiming = true; // TODO: put behind debug flag

        // create player 
        this.playerSpawn = this.map.objects.Triggers[0]; // TODO: un-hardcore index of player spawn
        // issue with tiled object layers require offsetting all
        // object tiles by Y-1 units. See
        // https://github.com/bjorn/tiled/issues/91 for more details
        player = new Player(game, this.playerSpawn.x, (this.playerSpawn.y - this.map.tileWidth));
        // define some player actions, like what happens on death
        player.events.onKilled.add(this.onDeath, this);

        // create world objects
        var keys = this.map.objects.Keys;
        this.levelKey = game.add.sprite(keys[0].x, keys[0].y - 21, 'Player', keys[0].gid - 1);
        game.physics.enable(this.levelKey);
        // spikes from tiles
        topSpikesGroup = game.add.group();
        topSpikesGroup.enableBody = true;
        topSpikesGroup.physicsBodyType = Phaser.Physics.ARCADE;
        bottomSpikesGroup = game.add.group();
        bottomSpikesGroup.enableBody = true;
        bottomSpikesGroup.physicsBodyType = Phaser.Physics.ARCADE;
        this.map.createFromTiles([571, 572, 573], null, 'Player', undefined, topSpikesGroup, { alpha: 0 });
        this.map.createFromTiles([574, 575, 576], null, 'Player', undefined, bottomSpikesGroup, { alpha: 0 });
        // need to iterate through each sprite and disable gravity, as well as fix hitbox size
        for (i = 0; i < topSpikesGroup.children.length; i++) {
            topSpikesGroup.children[i].body.setSize(21, 11, 0, 0);
            topSpikesGroup.children[i].body.allowGravity = false;
        }
        for (i = 0; i < bottomSpikesGroup.children.length; i++) {
            bottomSpikesGroup.children[i].body.setSize(21, 11, 0, 10);
            bottomSpikesGroup.children[i].body.allowGravity = false;
        }
        // cheap way to have the key a 'physical body' yet not be
        // affected by gravity.
        this.levelKey.body.allowGravity = false;
        // these 2 lines prevent phaser from separating objects when
        // they collide.  all we want to know is that a collision
        // happened, we don't want the bodies to react realistically
        // here
        this.levelKey.body.customSeparateX = true;
        this.levelKey.body.customSeparateY = true;

        // create the moving platform from tiled mapdata
        var platforms = null;
        if (this.map.objects.Platforms) {
            platforms = this.map.objects.Platforms;
        }
        platformsGroup = game.add.group();
        for(i = 0; i < platforms.length; i++) {
            platformsGroup.add(new MovingPlatform(game,
                                                  platforms[i].x,
                                                  platforms[i].y,
                                                  platforms[i].properties.startingDir,
                                                  +platforms[i].properties.speed,
                                                  +platforms[i].properties.distance
                                                 )
                              );
        }

        // initializ input references
        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        jumpKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        pauseKey = game.input.keyboard.addKey(Phaser.Keyboard.P);
        speedKey = game.input.keyboard.addKey(Phaser.Keyboard.Z);
        autoJumpToggleKey = game.input.keyboard.addKey(Phaser.Keyboard.F);
        // prevent pausing from resetting the input states
        Phaser.Input.resetLocked = true; // TODO: not working???
        // callbacks for input that isn't necessary for movement
        // the 'onDown' signal is only triggered once per key down
        // TODO: put this behind a dev flag
        autoJumpToggleKey.onDown.add(function (key) {
            this.autoJumpEnabled = !this.autoJumpEnabled;
        }, this);
        pauseKey.onDown.add(function (key) {
            if (game.paused) {
                this.pauseText.alpha = 0;
                game.paused = false;
            }
            else {
                this.pauseText.alpha = 1;
                game.paused = true;
            }
        }, this);
        
        // initialize timer
        this.timeLevelStart = game.time.now;
    },
    handlePlayerMovingPlatformCollision: function (player, platform) {
        if (player.body.touching.down) {
            player.body.blocked.down = true;
        }
    },
    update: function () {
        // update ui timer while the level is incomplete
        if (!this.levelComplete) {
            this.updateTimer();
        }

        // check for collisions
        game.physics.arcade.collide(player, platformLayer);
        game.physics.arcade.collide(player, platformsGroup, this.handlePlayerMovingPlatformCollision, null, this);

        game.physics.arcade.collide(player, this.levelKey, this.collectKey, null, this);
        if (game.physics.arcade.overlap(player, bottomSpikesGroup) || game.physics.arcade.overlap(player, topSpikesGroup)) {
            this.killPlayer(player);
        }

        // reset player movement
        player.body.velocity.x = 0;

        // move left/right
        if (leftKey.isDown) {
            player.body.velocity.x = -this.groundSpeed;

            if (this.facing != 'left') {
                player.animations.play('left');
                player.scale.x *= -1;
                this.facing = 'left';
            }
        }
        else if (rightKey.isDown) {
            player.body.velocity.x = this.groundSpeed;
            
            if (this.facing != 'right') {
                if (this.facing === 'left') {
                    player.scale.x *= -1;
                }
                player.animations.play('left');
                this.facing = 'right';
            }
        }
        else {
            if (this.facing != 'idle') {
                if (this.facing === 'left') {
                    player.scale.x *= -1;
                }
                player.animations.play('idle');
                this.facing = 'idle';
            }
        }

        // use speed key to run!
        if (speedKey.isDown) {
            this.speedEnabled = true;
            player.body.velocity.x *= this.speedMultiplier;
        }
        else {
            if (this.speedEnabled) {
                this.speedEnabled = false;
            }
        }

        // jumping
        if (jumpKey.isDown && player.body.onFloor() ||
            this.autoJumpEnabled && player.body.onFloor()) {
            /// number achieved via playtesting
            player.body.velocity.y = -player.body.maxVelocity.y;
        }
    },
    render: function () {
        // DEBUG STUFF - turn off for production
        game.debug.text('fps: ' + game.time.fps || '--', 1200, 24);
        //game.debug.body(player); // draw AABB box for player
        //game.debug.bodyInfo(player, 16, 24);
        // END DEBUG STUFF
    },
    shutdown: function () {
        console.log('shutting down state');
        this.map = null;
        platformLayer = null;
        this.playerSpawn = null;
        this.levelKey = null;
        // destroy platforms
    },
    updateTimer: function () {
        this.timeCurrent = (game.time.now - this.timeLevelStart) / 1000;
        this.timerText.setText('Time: ' + this.timeCurrent.toFixed(2));
        
    },
    killPlayer: function (player, spikesLayer) {
        if (player.alive) {
            player.kill();
        }
    },
    collectKey: function (player, key) {
        key.alpha = 0;
        key.body.enabled = false;
        this.keyUIFull.alpha = 1; // display keyUIFull in UI
        this.openDoor();
    },
    openDoor: function () {
        this.map.replace(167, 137, 0, 0, 50, 34);
        this.map.replace(168, 138, 0, 0, 50, 34);
    },
    closeDoor: function () {
        this.map.replace(137, 167, 0, 0, 50, 34);
        this.map.replace(138, 168, 0, 0, 50, 34);
    },
    completeLevel: function (player, doorExit) {
        game.input.enabled = false;
        player.body.enable = false;
        player.animations.stop();
        game.timeOverall += this.timeCurrent;
        this.lvlWinSubText.setText('Level time: ' + this.timeCurrent.toFixed(2) + ' seconds\nTotal time: ' + game.timeOverall.toFixed(2) + ' seconds');
        // reset text x since content has been changed
        this.lvlWinSubText.x = (game.world.centerX - (this.lvlWinSubText.width / 2));
        this.lvlWinText.alpha = 1;
        this.lvlWinSubText.alpha = 1;
        this.levelComplete = true;
        game.time.events.add(Phaser.Timer.SECOND * 3, this.loadNextLevel, this);
    },
    loadNextLevel: function () {
        // re-enable stuff we just disabled
        game.input.enabled = true;
        player.body.enable = true;
        // i have no idea why the following variable doesnt reset
        // itself upon loading the new state but it doesnt.. although
        // most other things seem to... perhaps the world is not being
        // destroyed properly. TODO: look into this.
        this.levelComplete = false;
        // increment level counter
        game.currentLevel++;
        game.state.start('game');
        // TODO: if level === 6, load end screen. otheriwse, increment
        // and load next level
    },
    onDeath: function (player) {
        this.playerDeaths += 1;
        this.showDeathText();
        this.resetLevel();
        this.respawnPlayer(player);
    },
    showDeathText: function () {
        if (this.deathTextTween &&
            this.deathTextTween.isRunning) {
            this.deathTextTween.stop();
            this.deathSubTextTween.stop();
        }
        this.deathSubText.setText('You died ' + this.playerDeaths + ((this.playerDeaths === 1) ? ' time.' : ' times.'));
        this.deathSubText.x = game.world.centerX - (this.deathSubText.width / 2);
        this.deathText.alpha = 1;
        this.deathSubText.alpha = 1;
        this.deathTextTween = game.add.tween(this.deathText).to({alpha: 0}, 1000).start();
        this.deathSubTextTween = game.add.tween(this.deathSubText).to({alpha: 0}, 1000).start();
    },
    resetLevel: function () {
        this.closeDoor();
        this.keyUIFull.alpha = 0;
        this.levelKey.body.enabled = true;
        this.levelKey.alpha = 1;
    },
    respawnPlayer: function (player) {
        player.reset(this.playerSpawn.x, (this.playerSpawn.y - 20));
    }
};
