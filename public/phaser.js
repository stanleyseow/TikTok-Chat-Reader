var config = {
  type: Phaser.AUTO,
  width: 400,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    // autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  parent: 'game-container',
};

var player;
var platforms;

var game = new Phaser.Game(config);
window.myGame = game;
var score = 0;
var scoreText;
var joyStick;
var cursorKeys;

function preload() {
  this.load.image("sky", "assets/sky.png");
  this.load.image("ground", "assets/platform.png");
  this.load.image("star", "assets/star.png");
  this.load.image("bomb", "assets/bomb.png");
  this.load.spritesheet("dude", "assets/dude.png", { frameWidth: 32, frameHeight: 48 });

  this.load.audio("ding", "assets/ding.mp3");
  this.load.audio("ping", "assets/ping.mp3");

  var url =
    "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js";
  this.load.plugin("rexvirtualjoystickplugin", url, true);
}

function create() {
  //this.add.image(400, 300, 'sky');

  pingSnd = this.sound.add("ping").setVolume(0.1)

  platforms = this.physics.add.staticGroup();

  platforms.create(400, 600, "ground").setScale(2).refreshBody();

  platforms.create(-50, 200, "ground");
  platforms.create(500, 300, "ground");
  platforms.create(0, 400, "ground");

  player = this.physics.add.sprite(220, 0, "dude");

  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });
  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 4 }],
    frameRate: 20,
  });
  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  scoreText = this.add.text(10, 10, "score: 0", { fontSize: "20px", fill: "#fff" });

  this.physics.add.collider(player, platforms);

  cursors = this.input.keyboard.createCursorKeys();

  // vJoystick
  joyStick = this.plugins
    .get("rexvirtualjoystickplugin")
    .add(this, {
      x: 200,
      y: 470,
      radius: 50,
      base: this.add.circle(0, 0, 50, 0x888888),
      thumb: this.add.circle(0, 0, 25, 0xcccccc),
      // dir: '8dir',   // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
      // forceMin: 16,
      // enable: true
    })
    .on("update", dumpJoyStickState, this);

  this.joyText = this.add.text(10, 500);
  dumpJoyStickState();
}

function update() {
  let speed = 200;

  if (cursors.left.isDown) {
    player.setVelocityX(-speed);
    player.anims.play("left", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(speed);
    player.anims.play("right", true);
  } else {
    player.setVelocityX(0);
    player.anims.play("turn");
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-500);
  }

  if (cursorKeys.left.isDown) {
    player.setVelocityX(-speed);
    player.anims.play("left", true);
  } else if (cursorKeys.right.isDown) {
    player.setVelocityX(speed);
    player.anims.play("right", true);
  }

  if (cursorKeys.up.isDown && player.body.touching.down) {
    player.setVelocityY(-500);
  }
}

function dumpJoyStickState() {
  cursorKeys = joyStick.createCursorKeys();
  var s = "Key down: ";
  for (var name in cursorKeys) {
    if (cursorKeys[name].isDown) {
      s += name + " ";
    }
  }

//   s += "\n";
//   s += "Force: " + Math.floor(joyStick.force * 100) / 100 + "\n";
//   s += "Angle: " + Math.floor(joyStick.angle * 100) / 100 + "\n";
//   scene.joyText.setText(s);
}

function collectStar(player, starContainer) {
  starContainer.destroy(true);
  starContainer.setVisible(false);

  pingSnd.play();

  score += 1;
  scoreText.setText("Score: " + score);
}

function addStar(msg) {
  console.log("Adding star ", msg);
  let scene = this.myGame.scene.getScene("default");

  const dingSnd = scene.sound.add("ding").setVolume(0.1)
  dingSnd.play();

  let nickname = msg.user.nickname;

  scene.star = starContainer = scene.add.container(Phaser.Math.Between(0, 800), 0);
  scene.physics.add.existing(starContainer);
  starContainer.body.setSize(24, 24);
  starContainer.body.setCollideWorldBounds(true); // Makes the container collide with the world bounds
  starContainer.body.setVelocity(50, 50); // Sets initial velocity
  starContainer.body.setBounce(0.7, 0.7);

  let nicknameObj = scene.add
    .text(0, 0 - 16, nickname.slice(0, 11), {
      fontSize: "12px",
      fill: "#ffffff",
      //align: "center",
      //backgroundColor: "#00000",
    })
    .setOrigin(0.5);
  let starObj = scene.add.image(0, 0, "star");

  starContainer.add([starObj, nicknameObj]);

  scene.physics.add.collider(scene.star, platforms);
  scene.physics.add.overlap(player, scene.star, collectStar, null, this);
}

function addBomb(data) {
  console.log("Adding bomb ", data);

  let scene = this.myGame.scene.getScene("default");

  const dingSnd = scene.sound.add("ding");
  dingSnd.play();

  scene.bomb = scene.physics.add.image(Phaser.Math.Between(0, 800), 0, "bomb");

  scene.physics.add.collider(scene.bomb, platforms);
}
