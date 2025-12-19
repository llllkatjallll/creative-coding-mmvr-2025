/* CONTROLS */

let maxLampTime = 100000;
let maxLampAmount = 8;

let video;
let handPose;
let hands = [];
let laternen = []; // Array für alle Laternen
let punktestand = 0;
let spread = 1000;
let handOpenedOnce = true;
let timeAcitve = 6000;

//bilder
let myBackground;
let laterneAn, laterneAus, laterne2An, laterne2Aus;
let handZu, handAuf;
let flamme1, shine;
let scoreImage;
let flames = [];
let resizedBackground; // Cache resized background
let resizedScoreImage; // Cache resized score image

//hand movement
let prevHandOpen = true;
let darkness = 210;

// feuerwerk
let fireworks = [];

//trace
let snowflakes = [];

//laternen
let latMaxSize = 230;
let latMinSize = 80;
let activationSounds = [];
let backgroundMusic;

function preload() {
  // HandPose Modell laden
  handPose = ml5.handPose({ flipped: true });
  myBackground = loadImage("background.png");
  laterneAn = loadImage("laterneAn.png");
  laterneAus = loadImage("laterneAus.png");
  laterne2An = loadImage("laterne2An.png");
  laterne2Aus = loadImage("laterne2Aus.png");
  handAuf = loadImage("handAuf_tr.png");
  handZu = loadImage("handZu.png");
  flamme1 = loadImage("images/flamme1.png"); myFont = loadFont('fonts/Oldenburg-Regular.ttf');
  scoreImage = loadImage("pointsScroll.png");
  shine = loadImage("images/shine.png");
  // Load activation sounds into array
  activationSounds.push(loadSound("sounds/holy-spell-cast-450460.mp3"));
  activationSounds.push(loadSound("sounds/fx-light-90387.mp3"));
  activationSounds.push(loadSound("sounds/natural-light-138426.mp3"));
  activationSounds.push(loadSound("sounds/WeK_UI_item-place-tree_v1_chimes_01.mp3"));
  activationSounds.push(loadSound("sounds/WeK_UI_item-place-tree_v1_chimes_02.mp3"));
  activationSounds.push(loadSound("sounds/WeK_UI_item-place-tree_v1_chimes_03.mp3"));

  // Load background music
  backgroundMusic = loadSound("sounds/background_music.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(myFont);
  frameRate(20);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();
  handPose.detectStart(video, gotHands);
  // Start background music with volume 0.5
  backgroundMusic.setVolume(0.5);
  backgroundMusic.loop(); // Loop the music continuously

  // Resize images once during setup instead of every frame
  resizedBackground = myBackground.get();
  resizedBackground.resize(0, height);
  resizedScoreImage = scoreImage.get();
  resizedScoreImage.resize(0, 170);

  // Wir erstellen 5 zufällige Laternen zum Start
  for (let i = 0; i < maxLampAmount; i++) {
    laternen.push(new Laterne(random(50, width - 50), random(50, height - 100), random(latMinSize, latMaxSize)));
  }

  for (let i = 0; i < 3; i++) {
    flames.push(new Flame(0, 0));
  }


}

function draw() {

  // Use pre-resized background image
  image(resizedBackground, 0, 0);
  background(0, darkness - punktestand * ((210 - 50) / laternen.length));


  // 1. Alle Laternen anzeigen und bewegen
  for (let i = 0; i < laternen.length; i++) {
    laternen[i].update();
    laternen[i].display();
  }

  // 2. Hand-Logik

  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    calculateHandPositions(hand, flames[i]);
    flames[i].display();
    checkCollisions(flames[i].position.x, flames[i].position.y);
  }


  // Alle Feuerwerke updaten
  /*   for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update();
      fireworks[i].show();
      if (fireworks[i].done()) {
        fireworks.splice(i, 1);
      }
    } */


  flames[0].display();


  push();
  tint(255, 200);
  image(resizedScoreImage, 10, 10);
  pop();
  // Punktestand anzeigen
  // fill dark brown
  fill(101, 67, 33);
  textSize(24);
  textAlign(LEFT, TOP);
  textSize(70);
  text(punktestand + "/" + laternen.length, 110, 30);
  textSize(28);
  text("Laternen ", 120, 115);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Resize background images when window is resized
  resizedBackground = myBackground.get();
  resizedBackground.resize(0, height);
}

function gotHands(results) {
  hands = results;
}

// Funktion zum Prüfen der Treffer
function checkCollisions(handX, handY) {
  const collisionRadius = 50;
  const collisionRadiusSq = collisionRadius * collisionRadius; // Use squared distance to avoid sqrt

  for (let l of laternen) {
    // Nur prüfen, wenn Laterne noch NICHT an ist
    if (!l.activated) {
      // Quick bounding box check first (cheaper than distance calculation)
      if (abs(handX - l.position.x) < collisionRadius && abs(handY - l.position.y) < collisionRadius) {
        // Now do the actual distance check using squared distance
        let dx = handX - l.position.x;
        let dy = handY - l.position.y;
        let distSq = dx * dx + dy * dy;

        if (distSq < collisionRadiusSq) {
          l.activate(); // Laterne anzünden!
          punktestand++;
        }
      }
    }
  }
}

function calculateHandPositions(hand, flame) {
  let rawThumb = hand.thumb_tip;
  let rawPinky = hand.pinky_finger_tip;

  // Jetzt mappen wir die Koordinaten auf die Canvas-Größe
  // Syntax: map(wert, videoMin, videoMax, canvasMin, canvasMax)

  let thumb = {
    x: map(rawThumb.x, 0, video.width, 0, width),
    y: map(rawThumb.y, 0, video.height, 0, height)
  };

  let pinky = {
    x: map(rawPinky.x, 0, video.width, 0, width),
    y: map(rawPinky.y, 0, video.height, 0, height)
  };

  let center = {
    x: (thumb.x + pinky.x) / 2,
    y: (thumb.y + pinky.y) / 2
  };

  // is hand open
  spread = dist(thumb.x, thumb.y, pinky.x, pinky.y);
  flame.isHandOpen = spread > 60;
  if (!flame.prevHandOpen && flame.isHandOpen) {
    // Hand was closed and is now open
    // --> Trigger your event here!
    flame.size = 150;
    console.log("Hand was closed and opened again!");
  }
  flame.prevHandOpen = flame.isHandOpen;


  flame.position.x = center.x;
  flame.position.y = center.y;

    flame.prevPosition = flame.position.copy();


}


class Flame {
  constructor(x, y) {
    this.position = new p5.Vector(x, y);
    this.prevPosition = this.position.copy();
    this.size = 150;
    this.prevHandOpen = true;
    this.isHandOpen = true;
    this.saturation = 255;
    this.wobbleOffset = random(1000);
  }

  display() {
    //flame size decrease till 20
    // the saturation of the flame image could also decrease with size
    if (this.size > 60) {
      this.saturation = map(this.size, 60, 150, 30, 180);
      this.size -= 0.2;
    }
    push();
    imageMode(CENTER);
    fill(255, 150, 0, this.saturation / 2);
    /*     circle(this.position.x,this.position.y,this.size + sin(millis() / 100 + this.wobbleOffset) * 5.15); */
    image(shine, this.position.x, this.position.y, this.size + sin(millis() / 100 + this.wobbleOffset) * 5.15, this.size + sin(millis() / 100 + this.wobbleOffset) * 5.15);
    tint(255, this.saturation);
    image(flamme1, this.position.x, this.position.y, this.size, this.size);

    pop();
  }
}

// --- KLASSE LATERNE ---
class Laterne {
  constructor(x, y, size) {
    this.position = new p5.Vector(x, y);
    this.size = size;
    this.design = floor(random(0, 2)); // 0 oder 1

    this.speed = map(size, latMinSize, latMaxSize, 0.4, 1.3);
    this.activated = false;
    this.hidden = false;
    this.activatedTimer = 0;
    this.wobbleOffset = random(1000); // Damit sie nicht alle gleich wackeln
    this.color = color(random(200, 255), random(100, 200), 50); // Zufällige warme Farbe

    // Timing properties
    this.activationTime = 0;
    this.stayOnDuration = maxLampTime; // 20 seconds in milliseconds
    this.fadeDuration = 2000; // 8 seconds in milliseconds
    this.fadeProgress = 0; // 0 = fully on, 1 = fully faded
  }
  activate() {
    this.activated = true;
    this.activationTime = millis(); // Store when lamp was activated

    // Pick a random sound from the array
    let randomSound = random(activationSounds);
    randomSound.setVolume(random(0.7, 1.0));
    randomSound.play();
  }

  update() {
    // Wenn aktiviert, steigen sie schnell nach oben (Himmel)
    if (this.activated) {
      let elapsedTime = millis() - this.activationTime;

      // After staying on for stayOnDuration, start fading
      if (elapsedTime > this.stayOnDuration) {
        let fadeTime = elapsedTime - this.stayOnDuration;
        this.fadeProgress = constrain(fadeTime / this.fadeDuration, 0, 1);

        // When fade is complete, deactivate the lamp
        if (this.fadeProgress >= 1) {
          this.activated = false;
          this.fadeProgress = 0;
          punktestand--; // Decrease score when lamp goes out
        }
      }

      this.position.y += sin(millis() / 500 + this.wobbleOffset) * 0.15;

    } else {
      // Wenn aus, schweben sie nur leicht auf und ab (Wobble)
      this.position.y -= this.speed;
    }

    // Wenn Laterne aus dem Bild fliegt, resetten wir sie unten (Endlos-Spiel)
    if (this.position.y < -200) {
      this.reset();
    }
  }

  reset() {
    this.position.y = height + 50;
    this.position.x = random(50, width - 50);
    this.activated = false;
    //this.hidden = false;
  }

  display() {
    noStroke();
    if (this.activated == true) {
      // Calculate fade effect (1 = full brightness, 0 = completely faded)
      let brightness = 1 - this.fadeProgress;
      //let currentSize = this.size * brightness;
      let glowSize = this.size * brightness;

      // AN: Leuchtender Kreis + Schein
      // Schein (Glow)
      fill(red(this.color), green(this.color), blue(this.color), 50 * brightness);
      circle(this.position.x, this.position.y, glowSize);

      // Progress indicator during stayOnDuration
      let elapsedTime = millis() - this.activationTime;
      if (elapsedTime <= this.stayOnDuration) {
        let progress = elapsedTime / this.stayOnDuration;
        let angle = (1 - progress) * TWO_PI; // Start full, decrease to 0

        push();
        stroke(255, 214, 99, 120); // Yellow contour
        strokeWeight(3);
        noFill();
        arc(this.position.x, this.position.y, this.size + 5, this.size + 5, -HALF_PI, -HALF_PI + angle);
        pop();
      }

      // Kern
      fill(this.color);
      if (handOpenedOnce) {
        //fireworks.push(new Firework(thumb.x, thumb.y));
        handOpenedOnce = false;
      }
      push();
      imageMode(CENTER);
      //tint(255, 255 * brightness); // Apply fade to lamp image
      if (this.design == 0) {
        image(laterneAn, this.position.x, this.position.y, this.size, this.size);
      } else {
        image(laterne2An, this.position.x, this.position.y, this.size, this.size);
      }
      pop();
      //circle(this.position.x, this.position.y, 30);
    } else {
      // AUS: Dunkler Papier-Look
      fill(50, 40, 60, 200); // Dunkelviolett/Grau
      push();
      imageMode(CENTER);
      if (this.design == 0) {
        image(laterneAus, this.position.x, this.position.y, this.size, this.size);
      } else {
        image(laterne2Aus, this.position.x, this.position.y, this.size, this.size);
      }
      pop();
    }
  }
}

class Firework {
  constructor(x, y) {
    this.particles = [];
    this.hue = random(360);

    // Erzeuge Partikel für die Explosion
    // 1. Die vielen kleinen, schnellen Partikel (Außen)
    for (let i = 0; i < 150; i++) {
      this.particles.push(new Particle(x, y, this.hue, false));
    }
    // 2. Die großen, langsamen Partikel (Zentrum)
    for (let i = 0; i < 30; i++) {
      this.particles.push(new Particle(x, y, this.hue, true));
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].done()) {
        this.particles.splice(i, 1);
      }
    }
  }

  done() {
    return this.particles.length === 0;
  }

  show() {
    for (let p of this.particles) {
      p.show();
    }
  }
}
