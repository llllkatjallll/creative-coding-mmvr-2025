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
let laterneAn, laterneAus;
let handZu, handAuf;
let flamme1;
let flames = [];

//hand movement
let prevHandOpen = true;
let darkness = 210;

// feuerwerk
let fireworks = [];

//laternen
let latMaxSize = 350;
let latMinSize = 80;

function preload() {
  // HandPose Modell laden
  handPose = ml5.handPose({ flipped: true });
  myBackground = loadImage("background.png");
  laterneAn = loadImage("laterneAn.png");
  laterneAus = loadImage("laterneAus.png");
  handAuf = loadImage("handAuf_tr.png");
  handZu = loadImage("handZu.png");
  flamme1 = loadImage("images/flamme1.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  video = createCapture(VIDEO, { flipped: true });
  video.hide();
  handPose.detectStart(video, gotHands);

  // Wir erstellen 5 zufällige Laternen zum Start
  for (let i = 0; i < 9; i++) {
    laternen.push(new Laterne(random(50, width - 50), random(50, height - 100), random ( latMinSize, latMaxSize)));
  }

  for (let i = 0; i < 5; i++) {
    flames.push(new Flame(0, 0));
  }
}

function draw() {


  myBackground.resize(0, height);
  image(myBackground, 0, 0);
  background(0, darkness-punktestand*((210-50)/laternen.length));


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

  // Punktestand anzeigen
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Licht an: " + punktestand, 20, 20);
}

function gotHands(results) {
  hands = results;
}

// Funktion zum Prüfen der Treffer
function checkCollisions(handX, handY) {
  for (let l of laternen) {
    // Nur prüfen, wenn Laterne noch NICHT an ist
    if (!l.activated) {
      let d = dist(handX, handY, l.position.x, l.position.y);
      // Wenn Hand nah genug an Laterne ist (50px Radius)
      if (d < 50) {
        l.activate(); // Laterne anzünden!
        punktestand++;
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

}


class Flame {
  constructor(x, y) {
    this.position = new p5.Vector(x, y);
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
    fill(255, 150, 0, this.saturation/2);
    circle(this.position.x,this.position.y,this.size + sin(millis() / 100 + this.wobbleOffset) * 5.15);
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

    this.speed = map(size, latMinSize, latMaxSize, 0.4, 1.3);
    this.activated = false;
    this.hidden = false;
    this.activatedTimer = 0;
    this.wobbleOffset = random(1000); // Damit sie nicht alle gleich wackeln
    this.color = color(random(200, 255), random(100, 200), 50); // Zufällige warme Farbe
  }

  activate() {
    this.activated = true;
    // Hier könnte man noch einen Sound abspielen
  }

  update() {
    // Wenn aktiviert, steigen sie schnell nach oben (Himmel)
    if (this.activated) {
      //this.position.y -= 1; // Steiggeschwindigkeit
      if (this.hidden == false) {
        
        //this.activatedTimer = this.activatedTimer + 1;

       /*  if (this.activatedTimer > timeAcitve) {
          this.hidden = true;
        } */
      }

      this.position.y += sin(millis() / 500 + this.wobbleOffset) * 0.15;

    } else {
      // Wenn aus, schweben sie nur leicht auf und ab (Wobble)
      //this.position.y += sin(millis() / 500 + this.wobbleOffset) * 0.25;

      this.position.y -= this.speed;
    }

   /*  if (this.hidden) {
      this.size = 0;
    } */

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
      // AN: Leuchtender Kreis + Schein
      // Schein (Glow)
      fill(red(this.color), green(this.color), blue(this.color), 100);
      circle(this.position.x, this.position.y, this.size);
      // Kern
      fill(this.color);
      if (handOpenedOnce) {
        //fireworks.push(new Firework(thumb.x, thumb.y));
        handOpenedOnce = false;
      }
      push();
      imageMode(CENTER);
      image(laterneAn, this.position.x, this.position.y, this.size, this.size);
      pop();
      //circle(this.position.x, this.position.y, 30);
    } else {
      // AUS: Dunkler Papier-Look
      fill(50, 40, 60, 200); // Dunkelviolett/Grau
      push();
      imageMode(CENTER);
      //rect(this.position.x, this.position.y, 30, 40, 5);
      image(laterneAus, this.position.x, this.position.y, this.size, this.size);
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

class Particle {
  constructor(x, y, hue, isBig) {
    this.pos = createVector(x, y);
    this.hue = hue;
    this.lifespan = 255;
    this.isBig = isBig; // Speichern, ob groß oder klein

    this.vel = p5.Vector.random2D();

    // UNTERSCHIED GROSS vs KLEIN
    if (this.isBig) {
      // Große Punkte: Langsam (bleiben im Zentrum)
      this.vel.mult(random(1, 4));
      this.size = random(8, 15);
    } else {
      // Kleine Punkte: Schnell (fliegen weit weg)
      this.vel.mult(random(5, 15));
      this.size = random(2, 5);
    }
  }

  update() {
    this.vel.mult(0.95); // Luftwiderstand (bremst ab)
    this.pos.add(this.vel);
    this.lifespan -= 4; // Wie schnell sie verblassen
  }

  done() {
    return this.lifespan < 0;
  }

  show() {
    // Farbe variiert leicht für Glitzer-Effekt
    stroke((this.hue + random(-20, 20) + 360) % 360, 255, 255, this.lifespan);
    strokeWeight(this.size);
    point(this.pos.x, this.pos.y);
  }
}