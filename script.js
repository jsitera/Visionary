import {GestureRecognizer,FilesetResolver,DrawingUtils} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
// define constants
const video = document.getElementById("webcam");
const gestureOutput = document.getElementById("gestureOutput");
const outputCanvas = document.getElementById("outputCanvas");
const canvas = outputCanvas.getContext("2d");
// define variables
let recognizer;
let button;
let webcam;
let lastTime;
// get url parameters
const parameters = new URLSearchParams(window.location.search);
const url = parameters.get("url")
const port = parameters.get("port")
const topic = parameters.get("topic")
if (url === null || port === null || topic === null) {
  alert("Critical error: Malformed URL. Missing required parameters!")
}
// load model
const createGestureRecognizer = async () => {
  recognizer = await GestureRecognizer.createFromOptions(await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"), {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 27
  });
};
createGestureRecognizer();
// check camera access support
if (!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
  button = document.getElementById("button");
  button.addEventListener("click",enableWebcam);
}
// enable webcam
function enableWebcam() {
  // handle button text
  if (webcam === true) {
    webcam = false;
    button.innerText = "UNPAUSE VISIONARY GESTURE RECOGNITION";
  } else {
    webcam = true;
    button.innerText = "PAUSE VISIONARY GESTURE RECOGNITION";
  }
  // get webcam stream
  navigator.mediaDevices.getUserMedia({video: true}).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener("loadeddata",predictWebcam);
  });
}
const client = mqtt.connect("wss://" + url + ":" + port + "/mqtt", {clean: true, connectTimeout: 4000, clientId: crypto.randomUUID(), username: "", password: "",})
client.subscribe(topic)
async function predictWebcam() {
  let results;
  if (video.currentTime !== lastTime) {
    lastTime = video.currentTime;
    results = recognizer.recognizeForVideo(video, Date.now());
  }
  canvas.save();
  canvas.clearRect(0,0,outputCanvas.width,outputCanvas.height);
  // set canvas size
  outputCanvas.style.height = "720px";
  outputCanvas.style.width = "960px";
  // draw hand landmarks
  if (results.landmarks) {
    const utils = new DrawingUtils(canvas);
    for (const landmarks of results.landmarks) {
      utils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
        color: "#ffd0b0",
        lineWidth: 10
      });
      utils.drawLandmarks(landmarks, {
        color: "#ff8000",
        lineWidth: 4
      });
    }
  }
  canvas.restore();
  // display output
  const gestureResult = results.gestures;
  if (gestureResult.length > 0) {
    gestureOutput.style.display = "block";
    gestureOutput.style.width = outputCanvas.width;
    // hands
    let handBuilder = []
    for (const handedness of results.handednesses) {
      handBuilder.push(handedness[0].displayName === "Left" ? "Right" : "Left");
    }
    let hands = handBuilder.join(", ");
    // gestures
    let gestureBuilder = []
    let confidenceBuilder = []
    for (const gesture of gestureResult) {
      const currentGesture = gesture[0];
      gestureBuilder.push(currentGesture.categoryName);
      confidenceBuilder.push((parseFloat(currentGesture.score) * 100.0).toFixed(2));
      //if (lastSent !== Date.now()) {
      //  client.publish("test",gesture)
      //  console.log("detected");
      //}
      //lastSent = Date.now();
    }
    let gestures = gestureBuilder.join(", ");
    let confidences = confidenceBuilder.join(", ");
    gestureOutput.innerText = "Hand: " + hands + "\nGesture: " + gestures + "\n Confidence: " + confidences;
  } else {
    gestureOutput.style.display = "none";
  }
  // keep animating over webcam
  if (webcam === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
