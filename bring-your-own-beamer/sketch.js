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
let laterneAn, laterneAus,laterne2An, laterne2Aus;
let handZu, handAuf;
let flamme1,shine;
let scoreImage;
let flames = [];

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
let activationSound,secondActivationSound;

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
  flamme1 = loadImage("images/flamme1.png");
  myFont = loadFont('fonts/Oldenburg-Regular.ttf');
  scoreImage = loadImage("pointsScroll.png");
  shine = loadImage("images/shine.png");
    activationSound = loadSound("sounds/holy-spell-cast-450460.mp3");
    secondActivationSound = loadSound("sounds/fx-light-90387.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(myFont);

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

    // Iterate through the particle array
  // We loop backwards because we are removing items from the array
  for (let i = snowflakes.length - 1; i >= 0; i--) {
    let p = snowflakes[i];
    p.update();
    p.show();

    // Remove particle if it becomes invisible (alpha <= 0)
    if (p.finished()) {
      snowflakes.splice(i, 1);
    }
  }  

  flames[0].display();


push();
 scoreImage.resize(0, 170);
 tint(255, 200);

  image(scoreImage, 10, 10, );
pop();

  // Punktestand anzeigen
  // fill dark brown
  fill(101, 67, 33);
  textSize(24);
  textAlign(LEFT, TOP);
 textSize(70);
  text( punktestand + "/" + laternen.length, 110, 30);
    textSize(28);
  text("Laternen ", 120, 115);
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

/*   if (flame.position.x !== flame.prevPosition.x || flame.position.y !== flame.prevPosition.y) {
    for (let i = 0; i < 10; i++) {
      snowflakes.push(new Particle(flame.position.x + random(-10, 10), flame.position.y + random(-10, 10)));
    }
  }
  flame.prevPosition = flame.position.copy(); */


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
    fill(255, 150, 0, this.saturation/2);
/*     circle(this.position.x,this.position.y,this.size + sin(millis() / 100 + this.wobbleOffset) * 5.15); */
    image(shine, this.position.x, this.position.y, this.size+ sin(millis() / 100 + this.wobbleOffset) * 5.15, this.size+ sin(millis() / 100 + this.wobbleOffset) * 5.15);
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
    this.design = floor(random(0,2)); // 0 oder 1

    this.speed = map(size, latMinSize, latMaxSize, 0.4, 1.3);
    this.activated = false;
    this.hidden = false;
    this.activatedTimer = 0;
    this.wobbleOffset = random(1000); // Damit sie nicht alle gleich wackeln
    this.color = color(random(200, 255), random(100, 200), 50); // Zufällige warme Farbe
    
    // Timing properties
    this.activationTime = 0;
    this.stayOnDuration = 20000; // 20 seconds in milliseconds
    this.fadeDuration = 2000; // 8 seconds in milliseconds
    this.fadeProgress = 0; // 0 = fully on, 1 = fully faded
  }

  activate() {
    this.activated = true;
    this.activationTime = millis(); // Store when lamp was activated
    let soundChoice = random(1);
    if (soundChoice < 0.5) {
      secondActivationSound.setVolume(random(0.7, 1.0));
      secondActivationSound.play(); 
      return;
    }
   
    activationSound.setVolume(random(0.7, 1.0));
    activationSound.play(); 
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
        stroke(255, 214, 99,120); // Yellow contour
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
      if(this.design == 0){
        image(laterneAn, this.position.x, this.position.y, this.size, this.size);
      }else{
        image(laterne2An, this.position.x, this.position.y, this.size, this.size);
      }
      pop();
      //circle(this.position.x, this.position.y, 30);
    } else {
      // AUS: Dunkler Papier-Look
      fill(50, 40, 60, 200); // Dunkelviolett/Grau
      push();
      imageMode(CENTER);
      if(this.design == 0){
        image(laterneAus, this.position.x, this.position.y, this.size, this.size);
      }else{
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

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    
    // Give the particle a random initial velocity (explosion effect)
    this.vx = random(-0.4, 0.4); 
    this.vy = random(-0.4, 0.4); 
    
    this.alpha = 100; // Opacity
    this.size = random(4, 6);
    
    // Set color based on frameCount to cycle through rainbow colors
    this.hue = frameCount % 20; 
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Physics: Apply Gravity
    this.vy += 0.05; 
    
    // Decrease lifespan (fade out)
    this.alpha -= 1.5; 
  }

  finished() {
    return this.alpha < 0;
  }

  show() {
    fill(255, 255, 255, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
}

/* class Particle {
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
} */