import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.117/build/three.module.js";

import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.117/examples/jsm/postprocessing/UnrealBloomPass.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.117/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.117/examples/jsm/postprocessing/RenderPass.js";

const defaultUniforms = Object.freeze({
  u_time: { type: "f", value: 1.0 },
  u_resolution: { type: "v2", value: new THREE.Vector2() },
  u_mouse: { type: "v2", value: new THREE.Vector2() },
  textureAudioData: { type: "t", value: null }
});

export class AudioVisualizer {
  constructor({ canvas, width, height, pixelRatio = 1, vertexShader,
    fragmentShader }) {
    // create camera
    this.camera = new THREE.Camera;
    this.camera.position.z = 1;

    // create scene
    this.scene = new THREE.Scene;

    // create plane with it's size matching clipspace
    const geometry = new THREE.PlaneBufferGeometry(2, 2);

    // create a copy of the default uniforms for the shader uniforms
    this.uniforms = JSON.parse(JSON.stringify(defaultUniforms)); // hacky deep-copy

    // create the shader material
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader
    });

    // connect the shader material to the clipspace plane and add to the scene
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);

    // create a renderer for the canvas with antialiasing
    this.renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true
    });
    // set the pixel ratio to the configured pixel ratio and resize the renderer
    this.renderer.setPixelRatio(pixelRatio);
    this.resize(width, height);

    // attach a bloom pass to the front of the renderer
    const bloomStrength = 1;
    const bloomRadius = 1;
    const bloomThreshold = 0.45;
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(width, height),
      bloomStrength,
      bloomRadius,
      bloomThreshold
    ));
  }

  /**
   * Render the current frame
   * @param { number } time - the current time in seconds 
   */
  render(time) {
    this.uniforms.u_time.value = time;
    this.composer.render(this.scene, this.camera);
  }

  /**
   * resize the visulization to the given dimentions
   * @param { number } width 
   * @param { number } height 
   */
  resize(width, height) {
    this.renderer.setSize(width, height);
    this.uniforms.u_resolution.value.x = width;
    this.uniforms.u_resolution.value.y = height;
  }

  /**
   * change the position of the mouse, in screen pixels
   * @param { number } x 
   * @param { number } y 
   */
  moveMouseTo(x, y) {
    this.uniforms.u_mouse.value.x = x;
    this.uniforms.u_mouse.value.y = y;
  }

  set audioTexture(value) {
    this.uniforms.textureAudioData.value = value;
  }

  get audioTexture() {
    return this.uniforms.textureAudioData.value;
  }
}