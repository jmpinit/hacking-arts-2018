const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const Jimp = require('jimp');
const WebSocket = require('ws');
const repl = require('repl');
const uuid4 = require('uuid4');
const { EventEmitter } = require('events');

const PORT = 3000;

let clients = {};

class Audience extends EventEmitter {
  constructor() {
    super();
    this.members = {};
  }

  add(socket, position) {
    const id = uuid4();

    const memberInfo = {
      id,
      socket,
      position,
    };

    this.members[id] = memberInfo;

    this.emit('newMember', memberInfo);

    console.log(`Added audience member with ID ${id}`);
  }
}

const audience = new Audience();

const app = express();

app.use(express.static('client/html'));
app.use(express.static('client/build'));
app.use(express.static('client/samples'));

// Collect image data
app.use(bodyParser.raw({
  limit: 100e6,
  type: 'image/*',
}));

app.post('/position-image', async (req, res) => {
  const imageType = req.header('Content-Type');

  if (imageType !== 'image/png' && imageType !== 'image/jpeg') {
    // FIXME https://gitlab.com/artmatr/x-print/issues/24
    res.status(500).send('Expected content type to be a supported image type (PNG, JPEG).');
  }

  const inputImage = await Jimp.read(req.body);

  console.log('Got image');

  res.send();
});

function send(client, message) {
  const str = JSON.stringify(message);
  client.send(str);
}

function sendAll(wss, message) {
  wss.clients.forEach(client => send(client, message));
}

async function getSampleUrls() {
  return new Promise((fulfill, reject) => {
    fs.readdir(path.join(__dirname, '../../client/samples/audio'), (err, files) => {
      if (err) {
        reject(err);
        return;
      }

      const urls = files.map(filename => `/audio/${filename}`);

      fulfill(urls);
    });
  });
}

async function main() {
  const urls = await getSampleUrls();

  app.listen(PORT, () => {
    console.log(`Visit app at http://localhost:${PORT}`);
  });

  const wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', (client) => {
    urls.forEach(url => send(client, {
      command: 'load',
      name: path.basename(url, '.wav'),
      url,
    }));

    client.on('message', (message) => {
      console.log('received: %s', message);
    });

    audience.add(client, { x: 0, y: 0 });
  });

  // Update visualizations

  const wssVisualize = new WebSocket.Server({ port: 8081 });

  wssVisualize.on('connection', (client) => {
    console.log('Visualizer connected!');
  });

  audience.on('newMember', (memberInfo) => {
    wssVisualize.clients.forEach((client) => {
      const str = JSON.stringify({
        command: 'newMember',
        info: memberInfo,
      });

      client.send(str);
    });
  });

  const replServer = repl.start({ prompt: 'chorus> ' });

  replServer.context.playAll = () => sendAll(wss, {
    command: 'play',
    name: 'test_03',
  });
}

main();
