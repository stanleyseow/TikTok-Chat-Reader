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
  parent: "game-container",
};

var player;
var platforms;

var game = new Phaser.Game(config);
window.myGame = game;
var score = 0;
var scoreText;
var joyStick;
var cursorKeys;
// Cache to track profile pictures that are being loaded or have been loaded
var profilePictureCache = {};
// Cache to track gift images
var giftImageCache = {};

// Function to preload a profile picture
function preloadProfilePicture(scene, userId, pictureUrl) {
  // Create a unique key for this profile picture
  const profileKey = "profile_" + userId;

  // If already in cache or already loaded in textures, don't reload
  if (profilePictureCache[profileKey] || scene.textures.exists(profileKey)) {
    return profileKey;
  }

  // Mark as being loaded in cache
  profilePictureCache[profileKey] = "loading";

  // Load the image
  return new Promise((resolve, reject) => {
    // Create an HTML Image element
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = function () {
      // Add the loaded image to Phaser's texture manager
      scene.textures.addImage(profileKey, img);
      profilePictureCache[profileKey] = "loaded";
      resolve(profileKey);
    };

    img.onerror = function () {
      console.warn("Error loading profile picture for", userId);
      profilePictureCache[profileKey] = "error";
      reject("Failed to load profile picture");
    };

    // Start loading the image
    img.src = pictureUrl;
  });
}

function preload() {
  this.load.image("sky", "assets/sky.png");
  this.load.image("ground", "assets/platform.png");
  this.load.image("star", "assets/star.png");
  this.load.image("bomb", "assets/bomb.png");
  this.load.spritesheet("dude", "assets/dude.png", { frameWidth: 32, frameHeight: 48 });

  this.load.spritesheet("gen", "assets/char-blank-64x64.png", {
    frameWidth: 64,
    frameHeight: 64,
  });

  this.load.spritesheet("char8", "assets/char8-52x72.png", {
    frameWidth: 52,
    frameHeight: 72,
  });

  this.load.audio("ding", "assets/ding.mp3");
  this.load.audio("ping", "assets/ping.mp3");

  var url =
    "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js";
  this.load.plugin("rexvirtualjoystickplugin", url, true);
}

function create() {
  //this.add.image(400, 300, 'sky');

  const totalChars = 8;
  const charsPerGroup = 4; // first 4 then next 4
  const groups = totalChars / charsPerGroup; // 2
  const directions = ["down", "left", "right", "up"];
  const framesPerAnim = 3; // <-- 3 frames per animation
  const directionsPerGroup = directions.length; // 4

  // Each group contains all directions for charsPerGroup characters.
  // So frames per direction-block = charsPerGroup * framesPerAnim
  // frames per full-group = directionsPerGroup * charsPerGroup * framesPerAnim

  for (let group = 0; group < groups; group++) {
    const groupOffset = group * (directionsPerGroup * charsPerGroup * framesPerAnim);

    for (let c = 0; c < charsPerGroup; c++) {
      const charIndex = group * charsPerGroup + c; // 0-based

      for (let d = 0; d < directionsPerGroup; d++) {
        // within a group, directions are laid out in this order:
        // down block, left block, right block, up block
        // each block contains charsPerGroup characters, each with framesPerAnim frames
        const directionOffset = d * (charsPerGroup * framesPerAnim);

        // start frame for this character's direction:
        const startFrame = groupOffset + directionOffset + c * framesPerAnim;
        const endFrame = startFrame + framesPerAnim - 1;

        this.anims.create({
          key: `char${charIndex + 1}-${directions[d]}`, // e.g. "char1-down"
          frames: this.anims.generateFrameNumbers("char8", {
            start: startFrame,
            end: endFrame,
          }),
          frameRate: 5,
          repeat: -1,
        });
      }
    }
  }

  pingSnd = this.sound.add("ping").setVolume(0.1);

  platforms = this.physics.add.staticGroup();

  platforms.create(400, 600, "ground").setScale(2).refreshBody();

  platforms.create(-50, 200, "ground");
  platforms.create(500, 300, "ground");
  platforms.create(0, 400, "ground");

  player = this.physics.add.sprite(220, 0, "dude");

  this.char1 = this.add.sprite(50 - 25, 100, "chars").play("char1-down");
  this.char2 = this.add.sprite(100 - 25, 100, "chars").play("char2-down");
  this.char3 = this.add.sprite(150 - 25, 100, "chars").play("char3-down");
  this.char4 = this.add.sprite(200 - 25, 100, "chars").play("char4-down");
  this.char5 = this.add.sprite(250 - 25, 100, "chars").play("char5-down");
  this.char6 = this.add.sprite(300 - 25, 100, "chars").play("char6-down");
  this.char7 = this.add.sprite(350 - 25, 100, "chars").play("char7-down");
  this.char8 = this.add.sprite(400 - 25, 100, "chars").play("char8-down");

  this.tweens.add({
    targets: this.char1,
    y: 500,
    flipY: false,
    yoyo: true,
    duration: 4000,
    repeat: -1,
    onYoyo: () => {
      this.char1.play("char1-up");
    },
    onRepeat: () => {
      this.char1.play("char1-down");
    },
  });

  this.tweens.add({
    targets: this.char2,
    y: 500,
    flipY: false,
    yoyo: true,
    duration: 4000,
    repeat: -1,
    onYoyo: () => {
      this.char2.play("char2-up");
    },
    onRepeat: () => {
      this.char2.play("char2-down");
    },
  });

  this.tweens.add({
    targets: this.char3,
    y: 500,
    flipY: false,
    yoyo: true,
    duration: 4000,
    repeat: -1,
    onYoyo: () => {
      this.char3.play("char3-up");
    },
    onRepeat: () => {
      this.char3.play("char3-down");
    },
  });

  this.tweens.add({
    targets: this.char4,
    y: 500,
    flipY: false,
    yoyo: true,
    duration: 4000,
    repeat: -1,
    onYoyo: () => {
      this.char4.play("char4-up");
    },
    onRepeat: () => {
      this.char4.play("char4-down");
    },
  });

  this.tweens.add({
    targets: this.char5,
    y: 500,
    flipY: false,
    yoyo: true,
    duration: 4000,
    repeat: -1,
    onYoyo: () => {
      this.char5.play("char5-up");
    },
    onRepeat: () => {
      this.char5.play("char5-down");
    },
  });

  this.tweens.add({
    targets: this.char6,
    y: 500,
    flipY: false,
    yoyo: true,
    duration: 4000,
    repeat: -1,
    onYoyo: () => {
      this.char6.play("char6-up");
    },
    onRepeat: () => {
      this.char6.play("char6-down");
    },
  });

  this.tweens.add({
    targets: this.char7,
    y: 500,
    flipY: false,
    yoyo: true,
    duration: 4000,
    repeat: -1,
    onYoyo: () => {
      this.char7.play("char7-up");
    },
    onRepeat: () => {
      this.char7.play("char7-down");
    },
  });

  this.tweens.add({
    targets: this.char8,
    y: 500,
    flipY: false,
    yoyo: true,
    duration: 4000,
    repeat: -1,
    onYoyo: () => {
      this.char8.play("char8-up");
    },
    onRepeat: () => {
      this.char8.play("char8-down");
    },
  });

  this.char1.setVisible(false);
  this.char2.setVisible(false);
  this.char3.setVisible(false);
  this.char4.setVisible(false);
  this.char5.setVisible(false);
  this.char6.setVisible(false);
  this.char7.setVisible(false);
  this.char8.setVisible(false);

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

function collectGift(player, container) {
  container.destroy(true);
  container.setVisible(false);

  pingSnd.play();

  //score += 1;
  //scoreText.setText("Score: " + score);
}

function addStar(msg) {
  //console.log("Adding star ", msg);
  let scene = this.myGame.scene.getScene("default");

  const dingSnd = scene.sound.add("ding").setVolume(0.1);
  dingSnd.play();

  let nickname = msg.user.nickname;

  // Handle profile picture which is an object with urls array
  let profilePictureUrl = null;
  if (
    msg.user.profilePicture &&
    msg.user.profilePicture.urls &&
    msg.user.profilePicture.urls.length > 0
  ) {
    // Get the first URL from the array (typically the smallest size)
    profilePictureUrl = msg.user.profilePicture.urls[0].replace(/['"]+/g, "").trim();
  }

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

  // Create a star object (default)
  let starObj = scene.add.image(0, 0, "star");

  // If profile picture URL exists, try to load it
  if (profilePictureUrl && msg.user.uniqueId) {
    const profileKey = "profile_" + msg.user.uniqueId;

    // Check if already in texture cache
    if (scene.textures.exists(profileKey)) {
      // Profile picture already loaded, use it directly
      starObj.destroy();
      starObj = scene.add.image(0, 0, profileKey).setDisplaySize(24, 24).setOrigin(0.5);
    } else {
      // Need to preload the profile picture
      preloadProfilePicture(scene, msg.user.uniqueId, profilePictureUrl)
        .then((textureKey) => {
          // Replace the star with the profile picture
          starObj.destroy();
          starObj = scene.add
            .image(0, 0, textureKey)
            .setDisplaySize(24, 24)
            .setOrigin(0.5);
          starContainer.add(starObj);
        })
        .catch((error) => {
          console.warn("Failed to load profile picture:", error);
          // Keep using the star image (already created)
        });
    }
  }

  // Add elements to container
  starContainer.add([starObj, nicknameObj]);

  scene.physics.add.collider(scene.star, platforms);
  scene.physics.add.overlap(player, scene.star, collectStar, null, this);
}

function addBomb(msg) {
  console.log("Adding bomb ", msg);

  let scene = this.myGame.scene.getScene("default");

  const dingSnd = scene.sound.add("ding").setVolume(0.1);
  dingSnd.play();

  // Extract nickname (fallback if missing)
  const nickname = msg?.user?.nickname || "Guest";

  // Create a physics-enabled container
  const bombContainer = scene.add.container(Phaser.Math.Between(0, 800), 0);
  scene.physics.add.existing(bombContainer);
  bombContainer.body.setSize(32, 32);
  bombContainer.body.setCollideWorldBounds(true);
  bombContainer.body.setVelocity(50, 50);
  bombContainer.body.setBounce(0.7, 0.7);

  // Add placeholder bomb image first
  let bombImage = scene.add.image(0, 0, "bomb").setOrigin(0.5).setDisplaySize(32, 32);

  // Add nickname text above the image
  const nicknameText = scene.add
    .text(0, -20, nickname.slice(0, 11), {
      fontSize: "12px",
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5);

  bombContainer.add([bombImage, nicknameText]);

  // Handle gift image replacement
  let giftUrl = null;
  try {
    if (msg.giftDetails?.giftImage?.giftPictureUrl) {
      giftUrl = String(msg.giftDetails.giftImage.giftPictureUrl)
        .replace(/[`'\"]/g, "")
        .trim();
    }
  } catch (_) {}

  if (giftUrl && msg.giftId) {
    const giftKey = "gift_" + msg.giftId;

    if (scene.textures.exists(giftKey)) {
      // Already loaded — replace immediately
      bombImage.setTexture(giftKey).setDisplaySize(32, 32);
    } else {
      // Load dynamically
      if (giftImageCache[giftKey] !== "loading") {
        giftImageCache[giftKey] = "loading";
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
          try {
            if (!scene.textures.exists(giftKey)) {
              scene.textures.addImage(giftKey, img);
            }
            giftImageCache[giftKey] = "loaded";
            bombImage.setTexture(giftKey).setDisplaySize(32, 32);
          } catch (e) {
            console.warn("Error applying gift texture", e);
            giftImageCache[giftKey] = "error";
          }
        };
        img.onerror = function () {
          console.warn("Failed to load gift image for giftId", msg.giftId);
          giftImageCache[giftKey] = "error";
        };
        img.src = giftUrl;
      }
    }
  }

  // Add collision with platforms
  scene.physics.add.collider(bombContainer, platforms);

  scene.physics.add.overlap(player, bombContainer, collectGift, null, this);
}

function addMembers(msg) {
  console.log("Adding member ", msg);

  let scene = this.myGame.scene.getScene("default");
  const nickname = msg?.user?.nickname || "Guest";
  const charContainer = scene.add.container(Phaser.Math.Between(25, 575), 50);

    const nicknameText = scene.add
    .text(0, -30, nickname.slice(0, 11), {
      fontSize: "12px",
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5);

  // Randomly select a character sprite from char1 to char8
  const randomCharNum = Phaser.Math.Between(1, 8);
  const charSprite = `char${randomCharNum}`;
  console.log("charSprite: ", charSprite);
  const charSpriteObj = scene.add.sprite(0, 0, charSprite).setOrigin(0.5).play(charSprite + "-down")
  charSpriteObj.setVisible(true);
  
  // Add nickname and character to container
  charContainer.add([nicknameText, charSpriteObj]);

    scene.tweens.add({
    targets: charContainer,
    y: 400,
    flipY: false,
    yoyo: true,
    duration: 4000,
    repeat: -1,
    onYoyo: () => {
      charSpriteObj.play(charSprite + "-up");
    },
    onRepeat: () => {
      charSpriteObj.play(charSprite + "-down");
    },
  });
}
