"use client";

import { useEffect, useRef } from "react";
import { socket, initializePeerConnection, waitForIceGathering } from "@/app/lib/webrtc";

const addLiveGamerTracksToPeerConnection = (
  stream: MediaStream,
  peerConnection: RTCPeerConnection | null
) => {
  if (!peerConnection) return;

  const tracks = stream.getTracks();
  tracks.forEach((track) => {
    peerConnection.addTrack(track, stream);
  });
  console.log(`Added ${tracks.length} tracks to peer connection`);
};

const userMediaOptions = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    latency: 0.01,
  },
  video: {
    width: 1920,
    height: 1080,
    frameRate: { ideal: 30, max: 60 },
    latency: 0.01,
  },
};

export default function Streamer() {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = async (pc: RTCPeerConnection) => {
    const stream = await navigator.mediaDevices.getUserMedia(userMediaOptions);
    addLiveGamerTracksToPeerConnection(stream, pc);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  useEffect(() => {
    const pc = initializePeerConnection();
    peerConnectionRef.current = pc;

    startCamera(pc);

    socket.on("request_offer", async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);
      socket.emit("offer", pc.localDescription);
    });

    socket.on("answer", async (desc) => {
      await pc.setRemoteDescription(desc);
    });

    return () => {
      pc.close();
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <h1>Streamer</h1>
      <video ref={videoRef} autoPlay playsInline muted />
    </>
  );
}
