const fs = require('fs');
const path = require('path');
const express = require('express');
const WebSocket = require('ws');
const repl = require('repl');

const PORT = 3000;

const app = express();

app.use(express.static('client/html'));
app.use(express.static('client/build'));
app.use(express.static('client/samples'));

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
    console.log('Client connected!');

    urls.forEach(url => send(client, {
      command: 'load',
      name: path.basename(url, '.wav'),
      url,
    }));

    client.on('message', (message) => {
      console.log('received: %s', message);
    });
  });

  const replServer = repl.start({ prompt: 'chorus> ' });

  replServer.context.playAll = () => sendAll(wss, {
    command: 'play',
    name: 'test_03',
  });
}

main();
