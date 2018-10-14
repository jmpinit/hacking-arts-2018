//const player = document.getElementById('player');

const recordEl = document.getElementById('button-record');
const stopEl = document.getElementById('button-stop');

function handleSuccess(stream) {
  const mediaRecorder = new MediaRecorder(stream);

  recordEl.onclick = () => {
    mediaRecorder.start();
    console.log(mediaRecorder.state);
    console.log('recorder started');

    recordEl.style.background = 'red';
    recordEl.style.color = 'black';
  };

  let chunks = [];

  mediaRecorder.ondataavailable = e => chunks.push(e.data);

  stopEl.onclick = () => {
    mediaRecorder.stop();

    console.log(mediaRecorder.state);
    console.log('recorder stopped');

    recordEl.style.background = '';
    recordEl.style.color = '';
  };

  mediaRecorder.onstop = (e) => {
    console.log('recorder stopped');

    const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
    chunks = [];
    const audioURL = window.URL.createObjectURL(blob);

    const audioEl = document.getElementById('player');
    audioEl.src = audioURL;
  };
}

navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  .then(handleSuccess);
