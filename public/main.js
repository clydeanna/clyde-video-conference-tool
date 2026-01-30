const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startBtn = document.getElementById("startBtn");
const muteBtn = document.getElementById("muteBtn");
const cameraBtn = document.getElementById("cameraBtn");
const shareBtn = document.getElementById("shareBtn");
const localLabel = document.getElementById("localLabel");
const remoteLabel = document.getElementById("remoteLabel");

const params = new URLSearchParams(window.location.search);
const room = params.get("room");
const userName = params.get("name") || "You";
const userRole = params.get("role") || "Member";

localLabel.textContent = `${userName} (${userRole})`;

const socket = new WebSocket("ws://localhost:3000");

const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

let localStream;
let started = false;

// 🔴 ANDROID-SAFE CAMERA START
startBtn.onclick = async () => {
  if (started) return;
  started = true;

  localStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: true
  });

  localVideo.srcObject = localStream;
  await localVideo.play();

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  startBtn.style.display = "none";
};

// 🔗 REMOTE VIDEO
peerConnection.ontrack = e => {
  remoteVideo.srcObject = e.streams[0];
  remoteVideo.play();
};

// ICE
peerConnection.onicecandidate = e => {
  if (e.candidate) {
    socket.send(JSON.stringify({
      type: "ice",
      room,
      candidate: e.candidate
    }));
  }
};

// SIGNALING
socket.onopen = () => {
  socket.send(JSON.stringify({
    type: "join",
    room,
    name: userName,
    role: userRole
  }));
};

socket.onmessage = async msg => {
  const data = JSON.parse(msg.data);

  if (data.name) remoteLabel.textContent = `${data.name} (${data.role})`;

  if (data.type === "join") {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.send(JSON.stringify({ type: "offer", room, offer }));
  }

  if (data.type === "offer") {
    await peerConnection.setRemoteDescription(data.offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.send(JSON.stringify({ type: "answer", room, answer }));
  }

  if (data.type === "answer") {
    await peerConnection.setRemoteDescription(data.answer);
  }

  if (data.type === "ice") {
    await peerConnection.addIceCandidate(data.candidate);
  }
};

