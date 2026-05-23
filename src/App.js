import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [peerId, setPeerId] = useState("");
  const [myId] = useState("user-" + Math.floor(1000 + Math.random() * 9000));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const peerRef = useRef(null);
  const callRef = useRef(null);
  const connRef = useRef(null);
  const localStreamRef = useRef(null);

  const myVideo = useRef();
  const remoteVideo = useRef();

  const login = (u, p) => {
    if (u === "Arun" && p === "Arun@Videoapp") {
      setLoggedIn(true);
    } else {
      alert("Invalid login");
    }
  };

  useEffect(() => {
    if (!loggedIn) return;

    const peer = new Peer(myId, {
      host: "peerjs.com",
      secure: true,
      port: 443,
    });

    peerRef.current = peer;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        myVideo.current.srcObject = stream;
      });

    peer.on("call", (call) => {
      call.answer(localStreamRef.current);
      call.on("stream", (stream) => {
        remoteVideo.current.srcObject = stream;
      });
      callRef.current = call;
    });

    peer.on("connection", (conn) => {
      connRef.current = conn;
      conn.on("data", (data) => {
        setMessages((prev) => [...prev, "Peer: " + data]);
      });
    });

    return () => peer.destroy();
  }, [loggedIn, myId]);

  const startCall = () => {
    const call = peerRef.current.call(peerId, localStreamRef.current);
    call.on("stream", (stream) => {
      remoteVideo.current.srcObject = stream;
    });
    callRef.current = call;

    const conn = peerRef.current.connect(peerId);
    conn.on("data", (data) => {
      setMessages((prev) => [...prev, "Peer: " + data]);
    });
    connRef.current = conn;
  };

  const sendMessage = () => {
    if (connRef.current && input) {
      connRef.current.send(input);
      setMessages((prev) => [...prev, "You: " + input]);
      setInput("");
    }
  };

  const endCall = () => {
    callRef.current?.close();
    connRef.current?.close();
    remoteVideo.current.srcObject = null;
  };

  if (!loggedIn) {
    return (
      <div className="login">
        <h2>Login</h2>
        <input id="u" placeholder="Username" />
        <input id="p" type="password" placeholder="Password" />
        <button
          onClick={() =>
            login(
              document.getElementById("u").value,
              document.getElementById("p").value
            )
          }
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <h2>WebRTC React App</h2>

      <p>Your ID: {myId}</p>

      <input
        placeholder="Enter peer ID"
        value={peerId}
        onChange={(e) => setPeerId(e.target.value)}
      />

      <button onClick={startCall}>Call</button>
      <button onClick={endCall}>End</button>

      <div className="videos">
        <video ref={myVideo} autoPlay muted />
        <video ref={remoteVideo} autoPlay />
      </div>

      <div className="chat">
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i}>{m}</div>
          ))}
        </div>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}