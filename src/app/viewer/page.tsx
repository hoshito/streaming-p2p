"use client";

import { useEffect, useRef, useState } from "react";
import { socket, initializePeerConnection, waitForIceGathering } from "@/app/lib/webrtc";

export default function Viewer() {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const pc = initializePeerConnection();
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    socket.emit("request_offer");

    socket.on("offer", async (offer) => {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer(offer);
      await pc.setLocalDescription(answer);
      await waitForIceGathering(pc);
      socket.emit("answer", pc.localDescription);
    });

    return () => {
      pc.close();
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <h1>Viewer</h1>
      <video ref={videoRef} autoPlay playsInline controls />
    </>
  );
}
