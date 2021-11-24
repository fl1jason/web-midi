const octaves = ['1', '2', '3', '4', '5'];
const notes = ['C', 'C#', 'D', 'D#','E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const MIDIStartCode = 24;
let notesPressed = [];
let notesOn = [];
const midiIn = [];
const midiOut = [];
const keys = [];

document.addEventListener('DOMContentLoaded', (event) => {

  const keyboard = document.getElementById('keyboard')

  const onNoteDown = (event) =>{    
    noteOn(event.target.dataset.note) 
    const midiCode = event.target.dataset.midi;
    event.stopPropagation();
    sendMidiMessage(midiCode, 65, 683526)
  }

  const noteOn = (note) =>{
    const key = keys[note];
    notesPressed.push(note)
    key.style.background = 'grey'
  }

  const noteOff = (note) =>{
    const key = keys[note];
    const isSharp = note.includes('#', 1);
    notesPressed = notesPressed.filter(item => item !== note)
    key.style.background = isSharp ? 'black' : 'white';
  }

  const onNoteUp = (event) =>{
    noteOff(event.target.dataset.note);
    event.stopPropagation();    
    //sendMidiMessage(57, 64, 100)
  }

  const createNote = (note, midiCode) =>{
    const isSharp = note.includes('#', 1);

    const key = document.createElement('div')
    key.classList.add(isSharp ? 'blacknote': 'whitenote')
    
    key.setAttribute('data-note', note);
    key.setAttribute('data-midi', midiCode);
    key.addEventListener('mousedown', onNoteDown);
    key.addEventListener('mouseup', onNoteUp);

    if (isSharp){      

      const keyKey = document.getElementById(note.replace('#', ''))
      keyKey.appendChild(key)
    }
    else
    {
      key.id = note;
      keyboard.appendChild(key)
    }
    keys[note] = key;
  }
  
  const createKeyboard = () =>{
    let midiCode = MIDIStartCode;
    for (let octave = 0; octave < octaves.length; octave++){
      for (let note = 0; note < notes.length; note++){
        createNote(`${notes[note]}${octaves[octave]}`, midiCode)
        midiCode++;
      }
    }
  }

  const onConnectMIDI = () =>{
    navigator.requestMIDIAccess()
    .then(
      (midi) => midiReady(midi),
      (err) => console.log('Something went wrong', err));
  }

  function initDevices(midi) {
    
    // MIDI devices that send you data.
    const inputs = midi.inputs.values();
    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
      midiIn.push(input.value);
    }
    
    // MIDI devices that you send data to.
    const outputs = midi.outputs.values();
    for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
      midiOut.push(output.value);
    }
    
    displayDevices();
    startListening();
  }

  const displayDevices = () =>{
    console.log(midiIn)
    console.log(midiOut)
  }
  
  // Start listening to MIDI messages.
  function startListening() {
    for (const input of midiIn) {
      input.addEventListener('midimessage', midiMessageReceived);
    }
  }
  
  function midiReady(midi) {
    // Also react to device changes.
    midi.addEventListener('statechange', (event) => initDevices(event.target));
    initDevices(midi); // see the next section!
  }

  function midiMessageReceived(event) {
    // MIDI commands we care about. See
    // http://webaudio.github.io/web-midi-api/#a-simple-monophonic-sine-wave-midi-synthesizer.
    const NOTE_ON = 9;
    const NOTE_OFF = 8;
  
    const cmd = event.data[0] >> 4;
    const pitch = event.data[1];
    const velocity = (event.data.length > 2) ? event.data[2] : 1;

    //const note = pitch.substring("C C#D D#E F F#G G#A A#B ", (pitch % 12) * 2, 2);
    //console.log(`The note just played was a ${note} in Octave ${octave}`)
    
    // You can use the timestamp to figure out the duration of each note.
    const timestamp = Date.now();
    
    // Note that not all MIDI controllers send a separate NOTE_OFF command for every NOTE_ON.
    if (cmd === NOTE_OFF || (cmd === NOTE_ON && velocity === 0)) {
      console.log(`🎧 from ${event.srcElement.name} note off: pitch:${pitch}, velocity: ${velocity} data ${event.data}`);

      const octave = parseInt(pitch / 12 - 1);
      const key = pitch % 12
      noteOff(`${notes[key]}${octave}`)
    
      // Complete the note!
      const note = notesOn[pitch];
      if (note) {
        console.log(`🎵 pitch:${pitch}, duration:${timestamp - note.timestamp} ms. data ${event.data}`);
        notesOn = notesOn.filter(item => item !== pitch)
      }
    } else if (cmd === NOTE_ON) {
      console.log(`🎧 from ${event.srcElement.name} note on: pitch:${pitch}, velocity: {velocity} data ${event.data}`);
      
      // One note can only be on at once.
      const newNote = {pitch : pitch, timestamp : timestamp }
      const octave = parseInt(pitch / 12 - 1);
      const key = pitch % 12
      console.log(`Key ${notes[key]} in octave ${octave}`)
      noteOn(`${notes[key]}${octave}`)
  
      notesOn.push(newNote)
    }
  }

  function sendMidiMessage(pitch, velocity, duration) {
    //const NOTE_ON = 0x90;
    const NOTE_ON = 0b10011101;
    const NOTE_OFF = 0b10001101;
    
    for (const output of midiOut) {
      
      // First send the note on;      
      const msgOn = [NOTE_ON, pitch, velocity];      
      console.log(msgOn)
      output.send(msgOn); 

      const msgOff = [NOTE_OFF, pitch, velocity];
      console.log(msgOff)
      output.send(msgOff, duration);              
    }
  }
  
  createKeyboard();
    
  onConnectMIDI();

  document.addEventListener('keyup', event => {
    if (event.code === 'Space') {

      // Start/Stop the game
      //onStartStopGame();
    }
  })
});


