/* - - MediaPipe Body tracking - - */

/*

Which tracking points can I use?
https://developers.google.com/static/mediapipe/images/solutions/pose_landmarks_index.png

We have a total of 33 points on the body:
(our points are mirrored, so left and right are switched)

0 = nose
12 = right shoulder
11 = left shoulder
26 = right knee
25 = left knee
32 = right foot
31 = left foot
20 = right hand
19 = left hand

Full documentation
https://developers.google.com/mediapipe/solutions/vision/pose_landmarker/index

What we do in this example:
- lerp the landmarks to make them smoother
- baased on https://github.com/amcc/easydetect by Alistair McClymont

*/


/* - - Variables - - */

// webcam variables
let capture; // our webcam
let captureEvent; // callback when webcam is ready

// lerping (i.e. smoothing the landmarks)
let lerpRate = 0.2; // smaller = smoother, but slower to react
let madeClone = false;
let lerpLandmarks;

// styling
let ellipseSize = 20; // size of the ellipses
let letterSize = 20; // size of the letter

// beute erstellen
let beute1;
let beute2;


// wasserlevel

let wasserlevel = 0;
let waterHeight;

let houses = [];

/* - - Setup - - */
function setup() {

  createCanvas(windowWidth, windowHeight);
  captureWebcam(); // launch webcam

  // styling
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(20);
  fill('white');

  waterHeight = map(wasserlevel, 0, 100, height-200, 0);

  //create 4 houses on top of each other
  for (let i = 0; i < 6; i++) {
    let randomWidth = random(100, 350);
    let house = new House(width/2-randomWidth/2, i * 200 +10, randomWidth, 200, false);
    houses.push(house);
  }
}


/* - - Draw - - */
function draw() {

  background(250);


  /* WEBCAM */
/*   push();
  centerOurStuff(); // center the webcam
  scale(-1, 1); // mirror webcam
  image(capture, -capture.scaledWidth, 0, capture.scaledWidth, capture.scaledHeight); // draw webcam
  scale(-1, 1); // unset mirror
  pop(); */


  /* TRACKING */
  if (mediaPipe.landmarks[0]) { // is hand tracking ready?

    // clone the landmarks array for lerping
    if (!madeClone) {
      lerpLandmarks = JSON.parse(JSON.stringify(mediaPipe.landmarks));
      madeClone = true;
    }

    // lerp the landmarks
    for (let i = 0; i < mediaPipe.landmarks[0].length; i++) {
      lerpLandmarks[0][i].x = lerp(lerpLandmarks[0][i].x, mediaPipe.landmarks[0][i].x, lerpRate);
      lerpLandmarks[0][i].y = lerp(lerpLandmarks[0][i].y, mediaPipe.landmarks[0][i].y, lerpRate);
    }

    //console.log("we have a total of " + mediaPipe.landmarks[0].length + " points");

    // nose
    let noseX = map(lerpLandmarks[0][0].x, 1, 0, 0, capture.scaledWidth);
    let noseY = map(lerpLandmarks[0][0].y, 0, 1, 0, capture.scaledHeight);

    // left shoulder
    let leftShoulderX = map(lerpLandmarks[0][12].x, 1, 0, 0, capture.scaledWidth);
    let leftShoulderY = map(lerpLandmarks[0][12].y, 0, 1, 0, capture.scaledHeight);

    // right shoulder
    let rightShoulderX = map(lerpLandmarks[0][11].x, 1, 0, 0, capture.scaledWidth);
    let rightShoulderY = map(lerpLandmarks[0][11].y, 0, 1, 0, capture.scaledHeight);

    // left hand
    let leftHandX = map(lerpLandmarks[0][19].x, 1, 0, 0, capture.scaledWidth);
    let leftHandY = map(lerpLandmarks[0][19].y, 0, 1, 0, capture.scaledHeight);

    // right hand
    let rightHandX = map(lerpLandmarks[0][20].x, 1, 0, 0, capture.scaledWidth);
    let rightHandY = map(lerpLandmarks[0][20].y, 0, 1, 0, capture.scaledHeight);


    //right eye
    let rightEyeX = map(lerpLandmarks[0][2].x, 1, 0, 0, capture.scaledWidth);
    let rightEyeY = map(lerpLandmarks[0][2].y, 0, 1, 0, capture.scaledHeight);

    push();
    centerOurStuff();

    // draw points
    fill('white');
    ellipse(noseX, noseY, ellipseSize, ellipseSize); // nose


    //ellipse(leftShoulderX, leftShoulderY, ellipseSize, ellipseSize); // left shoulder
    //ellipse(rightShoulderX, rightShoulderY, ellipseSize, ellipseSize); // right shoulder
    //ellipse(leftHandX, leftHandY, ellipseSize, ellipseSize); // left hand
    //ellipse(rightHandX, rightHandY, ellipseSize, ellipseSize); // right hand
    //fill(255,0,0);
    //ellipse(rightEyeX, rightEyeY, ellipseSize, ellipseSize);

    // draw labels
   /*  fill('blue');
    textSize(letterSize);
    text("nose", noseX + 20, noseY); // nose
    text("left shoulder", leftShoulderX + 20, leftShoulderY); // left shoulder
    text("right shoulder", rightShoulderX + 20, rightShoulderY); // right shoulder
    text("left hand", leftHandX + 20, leftHandY); // left hand
    text("right hand", rightHandX + 20, rightHandY); // right hand */

  // wenn linke hand na genug  an der rechter hand ist
  //dann schreibe einen text "boom"

   /*  let distance = dist(leftHandX, leftHandY, rightHandX, rightHandY);

    if (distance < 120){
      textSize(50);
      text("BOOM", leftHandX, leftHandY);
    }

    let leftHand = createVector(leftHandX, leftHandY);
    let rightHand = createVector(rightHandX, rightHandY);

    let centerPoint = p5.Vector.add(leftHand, rightHand).div(2); 
    
     fill(255,255,0);
    ellipse(centerPoint.x, centerPoint.y, 40,40);*/




    pop();

  }

  // draw houses
  for (let i = 0; i < houses.length; i++) {
    houses[i].display();
  }

      // wasserlevel


        // if mouse is moving, reduce water level
        //compare between the previous and current mouse position
        let mouseSpeed = dist(pmouseX, pmouseY, mouseX, mouseY);
        wasserlevel += mouseSpeed*0.01;
        wasserlevel = constrain(wasserlevel, 0, 100);
        console.log(wasserlevel);
        waterHeight = map(wasserlevel, 0, 100, height-200, 0);

        fill(0, 0, 255);
        rect(0, height-waterHeight, width, waterHeight);

        if (wasserlevel === 100) {
          fill(255, 0, 0);
          textSize(50);
          text("DIE STADT IST GERETTET", width/2, height/2);
        }



      

}


/* - - Helper functions - - */

// function: launch webcam
function captureWebcam() {
  capture = createCapture(
    {
      audio: false,
      video: {
        facingMode: "user",
      },
    },
    function (e) {
      captureEvent = e;
      console.log(captureEvent.getTracks()[0].getSettings());
      // do things when video ready
      // until then, the video element will have no dimensions, or default 640x480
      capture.srcObject = e;

      setCameraDimensions(capture);
      mediaPipe.predictWebcam(capture);
      //mediaPipe.predictWebcam(parentDiv);
    }
  );
  capture.elt.setAttribute("playsinline", "");
  capture.hide();
}

// function: resize webcam depending on orientation
function setCameraDimensions(video) {

  const vidAspectRatio = video.width / video.height; // aspect ratio of the video
  const canvasAspectRatio = width / height; // aspect ratio of the canvas

  if (vidAspectRatio > canvasAspectRatio) {
    // Image is wider than canvas aspect ratio
    video.scaledHeight = height;
    video.scaledWidth = video.scaledHeight * vidAspectRatio;
  } else {
    // Image is taller than canvas aspect ratio
    video.scaledWidth = width;
    video.scaledHeight = video.scaledWidth / vidAspectRatio;
  }
}


// function: center our stuff
function centerOurStuff() {
  translate(width / 2 - capture.scaledWidth / 2, height / 2 - capture.scaledHeight / 2); // center the webcam
}

// function: window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setCameraDimensions(capture);
}


class House {
  constructor(x, y, w, h, underWater) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.underWater = underWater;
  }

  display() {
    fill(130,80,150);
    rect(this.x, this.y, this.w, this.h);

    //check if lower house point is under water
    let lowerHousePoint = this.y + this.h;
    if (lowerHousePoint > height - waterHeight) {
      this.underWater = true;
    } else {
      this.underWater = false;
    }
    // if house is under water, change color
    if (this.underWater) {
      fill(0, 0, 255, 100);
      rect(this.x, this.y, this.w, this.h);
  }
}
}
