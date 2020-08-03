export class AudioElementAnalyzer 
  extends (window.AudioContext || window.webkitAudioContext) {

  constructor({ sourceElement, outputSize }) {
    super();

    // create and configure the Analyser
    this.analyser = this.createAnalyser();
    this.analyser.maxDecibels = 0;
    this.analyser.smoothingTimeConstant = 0.85;
    this.analyser.fftSize = outputSize * 2;
    
    // put the analyser in the middle of the audio input and output
    this.createMediaElementSource(sourceElement)
      .connect(this.analyser)
      .connect(this.destination);
  }

  /**
   * get the current frequnecy data from the audio
   * @param { UInt8Array } buffer - The buffer used to store the frequency data
   */
  getByteFrequencyData(buffer) {
    if (buffer.length !== this.analyser.frequencyBinCount) {
      console.warn(`expected to recieve a buffer of length ` +
      `${this.analyser.frequencyBinCount} but recieved one of length ` + 
      `${buffer.length}`);
    }

    this.analyser.getByteFrequencyData(buffer);
  }
}