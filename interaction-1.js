//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

// Change here to ("tuono") depending on your wasm file name
const dspName = "karplus";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
instance.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // const exampleMinMaxParam = findByAddress(dspNodeParams, "/thunder/rumble");
        // // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
        // const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
        // console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    });


//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function accelerationChange(accx, accy, accz) {
    // playAudio()
}

function rotationChange(rotx, roty, rotz) {
}

function mousePressed() {
    playAudio()
    // Use this for debugging from the desktop!
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}
let lastShakeTime = -Infinity;

function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");

    const now = millis();
    if (now - lastShakeTime < 250) {
        return;
    }

    if (playAudio()) {
        lastShakeTime = now;
    }
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls 
//------------------------------------------------------------------------------------------
//
//==========================================================================================

// MIDI note numbers: 60 = C4, 62 = D4, 64 = E4, 65 = F4, 67 = G4, 69 = A4.
const melody = [
    60, 60, 67, 67, 69, 69, 67,
    65, 65, 64, 64, 62, 62, 60,
    67, 67, 65, 65, 64, 64, 62,
    67, 67, 65, 65, 64, 64, 62,
    60, 60, 67, 67, 69, 69, 67,
    65, 65, 64, 64, 62, 62, 60
];

let noteIndex = 0;
let pluckInProgress = false;

function playAudio() {
    if (!dspNode || audioContext.state !== "running" || pluckInProgress) {
        return false;
    }

    const params = dspNode.getParams();
    const freqAddress = params.find(address => address.endsWith("/freq"));
    const gateAddress = params.find(address => address.endsWith("/gate"));
    const gainAddress = params.find(address => address.endsWith("/gain"));

    if (!freqAddress || !gateAddress) {
        console.error("Missing freq or gate parameter in the plucked-string model:", params);
        return false;
    }

    const midiNote = melody[noteIndex];
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

    if (gainAddress) {
        dspNode.setParamValue(gainAddress, 0.2);
    }

    dspNode.setParamValue(freqAddress, frequency);
    dspNode.setParamValue(gateAddress, 1);
    pluckInProgress = true;

    setTimeout(() => {
        dspNode.setParamValue(gateAddress, 0);
        pluckInProgress = false;
    }, 60);

    console.log(`Played note ${noteIndex + 1} of ${melody.length}`);
    noteIndex = (noteIndex + 1) % melody.length;
    return true;
}

//==========================================================================================
// END
//==========================================================================================