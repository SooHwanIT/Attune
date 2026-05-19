type CounselSocketSession = {
  clientId: string;
  socket: WebSocket;
  createdAt: number;
};

let activeCounselSocketSession: CounselSocketSession | null = null;

export function setActiveCounselSocket(socket: WebSocket, clientId: string) {
  if (activeCounselSocketSession?.socket && activeCounselSocketSession.socket !== socket) {
    try {
      activeCounselSocketSession.socket.close();
    } catch {
      // no-op
    }
  }

  activeCounselSocketSession = {
    clientId,
    socket,
    createdAt: Date.now(),
  };
}

export function getActiveCounselSocket() {
  return activeCounselSocketSession;
}

export function clearActiveCounselSocket(closeSocket = true) {
  if (closeSocket && activeCounselSocketSession?.socket) {
    try {
      activeCounselSocketSession.socket.close();
    } catch {
      // no-op
    }
  }
  activeCounselSocketSession = null;
}

export function isActiveCounselSocketOpen() {
  return activeCounselSocketSession?.socket.readyState === WebSocket.OPEN;
}
