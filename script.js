import {GestureRecognizer,FilesetResolver,DrawingUtils} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

let recognizer;
let button;
let webcam;
let results;
let lastTime;

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");
const height = "720px";
const width = "960px";
const createGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
  recognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 20
  });
};

// load gesture recognizer model
createGestureRecognizer();

// check camera access support
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// check webcam button
if (hasGetUserMedia()) {
  button = document.getElementById("button");
  button.addEventListener("click",enableWebcam);
}

function enableWebcam() {
  if (webcam === true) {
    webcam = false;
    button.innerText = "UNPAUSE VISIONARY GESTURE RECOGNITION";
  } else {
    webcam = true;
    button.innerText = "PAUSE VISIONARY GESTURE RECOGNITION";
  }

  // parameters for "getUserMedia"
  const constraints = {
    video: true
  };

  // get webcam stream
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

const url = ''
const options = {
  // Clean session
  clean: true,
  connectTimeout: 4000,
  // Authentication
  clientId: 'test1',
  username: '',
  password: '',
}
const client = mqtt.connect(url, options)
client.subscribe('test')

async function predictWebcam() {
  const webcamElement = document.getElementById("webcam");

  if (video.currentTime !== lastTime) {
    lastTime = video.currentTime;
    results = recognizer.recognizeForVideo(video, Date.now());
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const drawingUtils = new DrawingUtils(canvasCtx);

  canvasElement.style.height = height;
  canvasElement.style.width = width;

  webcamElement.style.height = height;
  webcamElement.style.width = width;

  // draw hand landmarks
  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
        color: "#ffd0b0",
        lineWidth: 10
      });
      drawingUtils.drawLandmarks(landmarks, {
        color: "#ff8000",
        lineWidth: 4
      });
    }
  }
  canvasCtx.restore();

  // display output
  if (results.gestures.length > 0) {
    gestureOutput.style.display = "block";
    gestureOutput.style.width = width;
    // hands
    let handBuilder = []
    for (const handedness of results.handednesses) {
      handBuilder.push(handedness[0].displayName === "Left" ? "Right" : "Left");
    }
    let hands = handBuilder.join(", ");
    // gestures
    let gestureBuilder = []
    for (const gesture of results.gestures) {
      gestureBuilder.push(gesture[0].categoryName);

      //if (lastSent !== Date.now()) {
      //  client.publish('test',gesture)
      //  console.log("detected");
      //}
      //lastSent = Date.now();

    }
    let gestures = gestureBuilder.join(", ");
    // confidences
    let confidenceBuilder = []
    for (const confidence of results.gestures) {
      confidenceBuilder.push((parseFloat(confidence[0].score) * 100.0).toFixed(2));
    }
    let confidences = confidenceBuilder.join(", ");

    gestureOutput.innerText = `Hand: ${hands}\nGesture: ${gestures}\n Confidence: ${confidences}`;

  } else {
    gestureOutput.style.display = "none";
  }

  // keep animating over webcam
  if (webcam === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
