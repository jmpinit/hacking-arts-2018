const context = new AudioContext();

const samples = {};
const activeSources = {};

let connection;

async function loadSample(name, url) {
  const request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  return new Promise((fulfill, reject) => {
    request.onload = () => {
      context.decodeAudioData(request.response, (buffer) => {
        samples[name] = buffer;
      }, err => reject(err));
    };

    request.send();
  });
}

function playSample(name) {
  if (!(name in samples)) {
    throw new Error('Cannot play sample. Unknown sample name:', name);
  }

  const source = context.createBufferSource();
  source.buffer = samples[name];
  source.connect(context.destination);
  source.start(0);

  activeSources[name] = source;
}

function stopSample(name) {
  if (!(name in activeSources)) {
    throw new Error('Cannot stop sample. Unknown sample name:', name);
  }

  activeSources[name].stop();
  delete activeSources[name];
}

function connect() {
  const address = `ws://${window.location.hostname}:8080`;
  connection = new WebSocket(address);

  connection.onopen = () => console.log('Connection open');
  connection.onmessage = ({ data }) => {
    let message;

    try {
      message = JSON.parse(data);
    } catch (e) {
      console.error(e);
    }

    if (message === undefined) {
      return;
    }

    switch (message.command) {
      case 'load':
        loadSample(message.name, `http://${location.host}${message.url}`);
        console.log('Loaded sample:', message.name);
        break;
      case 'delete':
        // deleteSample(message.name);
        break;
      case 'play':
        playSample(message.name);
        console.log('Playing sample:', message.name);
        break;
      case 'stop':
        stopSample(message.name);
        console.log('Stopped playing sample:', message.name);
        break;
      default:
        console.log('Unrecognized command:', message);
    }
  };
}

connect();

// Picture-taking

const fileInput = document.getElementById('input-image');

fileInput.addEventListener('change', event => fetch('/position-image', {
  method: 'POST',
  body: event.target.files[0],
}));
