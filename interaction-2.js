// Load the course's Faust sci-fi sound.
let dspNode = null;

const triggerAddress = "/torpedo/trigger";
const volumeAddress = "/torpedo/volume";
const torpedo = new FaustWasm2ScriptProcessor("torpedo");

torpedo.createDSP(audioContext, 1024)
    .then(node => {
        if (!node) {
            return;
        }

        node.setParamValue(volumeAddress, 0.2);
        node.connect(audioContext.destination);
        dspNode = node;
    })
    .catch(error => console.error("Could not load the sci-fi sound:", error));

const degreesPerStep = 45;
const minimumTriggerInterval = 250;
const triggerDuration = 100;

let previousAngle = null;
let accumulatedAngle = 0;
let lastTriggerTime = -Infinity;

function rotationChange(_rotationX, _rotationY, rotationZ) {
    if (!dspNode || audioContext.state !== "running" || !Number.isFinite(rotationZ)) {
        previousAngle = null;
        accumulatedAngle = 0;
        return;
    }

    if (previousAngle === null) {
        previousAngle = rotationZ;
        return;
    }

    // Use the shortest angle change when the sensor wraps around.
    const delta = ((rotationZ - previousAngle + 540) % 360) - 180;
    previousAngle = rotationZ;
    accumulatedAngle += delta;

    if (Math.abs(accumulatedAngle) >= degreesPerStep) {
        if (playTorpedo()) {
            accumulatedAngle %= degreesPerStep;
        } else {
            // Discard this step during cooldown so it does not play later.
            accumulatedAngle = 0;
        }
    }
}

function playTorpedo() {
    const now = millis();

    if (!dspNode || audioContext.state !== "running" ||
        now - lastTriggerTime < minimumTriggerInterval) {
        return false;
    }

    lastTriggerTime = now;
    dspNode.setParamValue(triggerAddress, 1);

    setTimeout(() => {
        dspNode.setParamValue(triggerAddress, 0);
    }, triggerDuration);

    return true;
}

// Click the canvas to test the sound on a computer.
function mousePressed() {
    playTorpedo();
}

// Callbacks used by the course's sketch.js.
function accelerationChange() {}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}

function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
}