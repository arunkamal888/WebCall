let peer, localStream, currentCall, conn;
let audioEnabled = true, videoEnabled = true, screenStream = null;

const myUserId = 'user-' + Math.floor(1000 + Math.random() * 9000);
document.getElementById('my-user-id').innerText = myUserId;

function login() {
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  if (u === "Arun" && p === "Arun@Videoapp") {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-section').style.display = 'block';
    initializeApp();
  } else {
    alert("Invalid username or password");
  }
}

function initializeApp() {
  peer = new Peer(myUserId);

  peer.on('open', () => {
    console.log('Connected with ID:', myUserId);
  });

  peer.on('call', call => {
    currentCall = call;
    call.answer(localStream);
    call.on('stream', stream => {
      document.getElementById('remote-video').srcObject = stream;
      showToast("🔗 Connected to " + call.peer);
      document.getElementById('bell-sound').play();
    });
    call.on('close', () => showToast("🔌 Disconnected from " + call.peer));
  });

  peer.on('connection', connection => {
    conn = connection;
    conn.on('data', data => appendMessage("👤 Peer: " + data));
  });

  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localStream = stream;
      document.getElementById('my-video').srcObject = stream;
    })
    .catch(err => alert("Media error: " + err));

  // Click for fullscreen
  document.getElementById('my-video').addEventListener('click', () => requestFullscreen('my-video'));
  document.getElementById('remote-video').addEventListener('click', () => requestFullscreen('remote-video'));
}

function startCall() {
  const peerId = document.getElementById('peer-id').value;
  if (!peerId || !localStream) return;

  currentCall = peer.call(peerId, localStream);
  currentCall.on('stream', stream => {
    document.getElementById('remote-video').srcObject = stream;
    showToast("🔗 Connected to " + peerId);
    document.getElementById('bell-sound').play();
  });
  currentCall.on('close', () => showToast("🔌 Disconnected from " + peerId));

  conn = peer.connect(peerId);
  conn.on('data', data => appendMessage("👤 Peer: " + data));
}

function endCall() {
  if (currentCall) currentCall.close();
  if (conn) conn.close();
  document.getElementById('remote-video').srcObject = null;
  showToast("❌ Call ended");
}

function toggleMute() {
  audioEnabled = !audioEnabled;
  localStream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
  document.getElementById('muteBtn').innerText = audioEnabled ? "🎤 Mute" : "🔇 Unmute";
}

function toggleVideo() {
  videoEnabled = !videoEnabled;
  localStream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
  document.getElementById('videoBtn').innerText = videoEnabled ? "📷 Stop Video" : "📷 Start Video";
}

function startScreenShare() {
  navigator.mediaDevices.getDisplayMedia({ video: true })
    .then(screen => {
      screenStream = screen;
      const videoTrack = screen.getVideoTracks()[0];
      const sender = currentCall.peerConnection.getSenders().find(s => s.track.kind === 'video');
      sender.replaceTrack(videoTrack);

      videoTrack.onended = stopScreenShare;
    });
}

function stopScreenShare() {
  if (screenStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    const sender = currentCall.peerConnection.getSenders().find(s => s.track.kind === 'video');
    sender.replaceTrack(videoTrack);
    screenStream.getTracks().forEach(track => track.stop());
    screenStream = null;
  }
}

function sendMessage() {
  const msg = document.getElementById('chat-input').value;
  if (msg && conn && conn.open) {
    conn.send(msg);
    appendMessage("🧍 You: " + msg);
    document.getElementById('chat-input').value = "";
  }
}

function appendMessage(msg) {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.textContent = msg;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function copyId() {
  navigator.clipboard.writeText(myUserId)
    .then(() => alert("Copied: " + myUserId))
    .catch(err => alert("Copy failed: " + err));
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function requestFullscreen(videoId) {
  const video = document.getElementById(videoId);
  if (video.requestFullscreen) video.requestFullscreen();
  else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
  else if (video.msRequestFullscreen) video.msRequestFullscreen();
}
