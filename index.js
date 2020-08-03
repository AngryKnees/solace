import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.117/build/three.module.js";

import { AudioElementAnalyzer } from "./AudioAnalyzer.js";
import { AudioVisualizer } from "./AudioVisualizer.js";


const BUFFER_SIZE = 2048;

let analyzer;
let visualizer;
let frequencyBuffer;
let audioElement;
let playSymbol;

let isPlaying = false;

async function setup() {
  // grab the needed elements
  const canvas = document.querySelector("#audio-canvas");
  playSymbol = document.querySelector("#play-symbol");
  audioElement = document.querySelector("#audio-source");

  // fetch the shaders as strings
  const [ fragmentShader, vertexShader ] = await Promise.all([
    fetch("./music-noise.frag").then(x => x.text()),
    fetch("./music-noise.vert").then(x => x.text())
  ]);

  // initialize the analyser
  analyzer = new AudioElementAnalyzer({
    sourceElement: audioElement,
    outputSize: BUFFER_SIZE
  });

  // initialize the visualizer
  visualizer = new AudioVisualizer({
    canvas,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    //pixelRatio: window.devicePixelRatio,
    vertexShader,
    fragmentShader
  });

  // initilize the buffere to be used to store the frequency data
  frequencyBuffer = new Uint8Array(BUFFER_SIZE);

  // create a 1D, one unsigned byte per texel, texture from the frequnecy buffer
  const texture = new THREE.DataTexture(
    frequencyBuffer, // data
    BUFFER_SIZE, // width
    1, // height
    THREE.AlphaFormat, // format
    THREE.UnsignedByteType // type
  );

  // provide the visualizer the frequncy texture
  visualizer.audioTexture = texture;

  // set up the pause events
  document.body.addEventListener("click", togglePause);
  audioElement.addEventListener("ended", togglePause);
  togglePause();

  //  attach the mouse positioning to the document
  document.addEventListener("mousemove", e => {
    visualizer.moveMouseTo(e.pageX, e.pageY);
  });
  
  //  resize the visualizer when the window resizes, to the size of the body
  window.addEventListener("resize", e => {
    visualizer.resize(document.body.clientWidth, document.body.clientHeight);
  });
  
  // start the animation loops
  requestAnimationFrame(draw);
}

function draw() {
  // fill the frequency buffer from the analyzer
  analyzer.getByteFrequencyData(frequencyBuffer);

  // let Three know that the texture needs to the updated
  visualizer.audioTexture.needsUpdate = true;

  // render the next frame based off the current time of the audio element
  visualizer.render(audioElement.currentTime); // provide it time in seconds

  // queue up the next step in the loop
  requestAnimationFrame(draw);
}

function togglePause() {
  // toggle the state
  isPlaying = !isPlaying;

  // start or stop the music depending on the state
  if (isPlaying) {
    audioElement.play();
  } else {
    audioElement.pause();
  }

  // cooerce from boolean to number
  const state = Number(isPlaying);

  // create an expression for getting a value from the dataset from our current 
  // state
  const getStateFor = name => {
    return playSymbol.dataset[name].split(";")[state];
  }

  // mutate the element based off the current state
  playSymbol.src = getStateFor("srcOpts");
  playSymbol.alt = getStateFor("altOpts");
  playSymbol.className = getStateFor("classOpts");
}

window.onload = () => {
  // create a one-time lister to set up the app
  document.body.addEventListener("click", setup, { once: true });
};