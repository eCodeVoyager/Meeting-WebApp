// src/components/MeetingRoom.jsx
import { useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { io } from "socket.io-client";

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const location = useLocation();
  const { username } = location.state;
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io("http://localhost:5000");

    socket.current.emit("join:room", { username, meetingId });

    peerRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.stunprotocol.org" }],
    });

    const peer = peerRef.current;

    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteVideoRef.current.srcObject = remoteStream;
    };

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.current.emit("ice-candidate", {
              candidate: event.candidate,
              room: meetingId,
            });
          }
        };

        socket.current.on("user:joined", async ({ id }) => {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.current.emit("outgoing:call", { fromOffer: offer, to: id });
        });

        socket.current.on("incoming:call", async ({ from, offer }) => {
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.current.emit("call:accepted", { answer, to: from });
        });

        socket.current.on("incoming:answer", async ({ offer }) => {
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
        });

        socket.current.on("ice-candidate", async ({ candidate }) => {
          try {
            await peer.addIceCandidate(candidate);
          } catch (e) {
            console.error("Error adding received ice candidate", e);
          }
        });
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });

    return () => {
      peer.close();
      socket.current.disconnect();
    };
  }, [meetingId, username]);

  return (
    <div className="container mx-auto">
      <h2 className="text-xl font-bold my-4">Meeting Room: {meetingId}</h2>
      <div>
        <video ref={localVideoRef} autoPlay muted className="w-1/2"></video>
        <video ref={remoteVideoRef} autoPlay className="w-1/2"></video>
      </div>
    </div>
  );
};

export default MeetingRoom;
