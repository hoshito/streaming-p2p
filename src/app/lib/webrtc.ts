import { io } from "socket.io-client";

export const socket = io();

export function initializePeerConnection() {
  // ローカル実行なので設定はとくに指定しない
  const peerConnection = new RTCPeerConnection();

  // トランシーバーを事前に追加
  peerConnection.addTransceiver("video", { direction: "sendrecv" });
  peerConnection.addTransceiver("audio", { direction: "sendrecv" });

  return peerConnection;
}

export function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  return Promise.race([
    new Promise<void>((resolve) => {
      let candidateCount = 0;
      const handleCandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          candidateCount++;
          if (candidateCount >= 2) {
            pc.removeEventListener("icecandidate", handleCandidate);
            resolve();
          }
        }
      };
      pc.addEventListener("icecandidate", handleCandidate);
    }),
    new Promise<void>((resolve) => setTimeout(resolve, 3000)),
  ]);
}
