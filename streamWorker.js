const BATCH_FLUSH_INTERVAL = 50;
const MAX_BUFFER_ITEMS = 20000;

let socket = null;
let socketUrl = null;
let buffer = [];
let bufferStart = 0;
let flushTimer = null;
let reconnectTimer = null;
let stopped = true;

function flushBuffer() {
  if (bufferStart >= buffer.length) return;

  self.postMessage({
    type: "BATCH_UPDATE",
    payload: buffer.slice(bufferStart),
  });
  buffer = [];
  bufferStart = 0;
}

function scheduleReconnect() {
  if (stopped || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 3000);
}

function connect() {
  if (stopped || !socketUrl) return;
  self.postMessage({ type: "STATUS", data: "CONNECTING" });
  socket = new WebSocket(socketUrl);

  socket.onopen = () => self.postMessage({ type: "STATUS", data: "CONNECTED" });
  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (!payload || typeof payload !== "object") return;
      buffer.push(payload);
      if (buffer.length - bufferStart > MAX_BUFFER_ITEMS) bufferStart += 1;
    } catch {
      self.postMessage({ type: "STATUS", data: "ERROR" });
    }
  };
  socket.onerror = () => self.postMessage({ type: "STATUS", data: "ERROR" });
  socket.onclose = () => {
    socket = null;
    self.postMessage({ type: "STATUS", data: "DISCONNECTED" });
    scheduleReconnect();
  };
}

self.onmessage = (event) => {
  const { action, url } = event.data;
  if (action === "CONNECT") {
    socketUrl = url;
    stopped = false;
    if (!flushTimer) flushTimer = setInterval(flushBuffer, BATCH_FLUSH_INTERVAL);
    connect();
  }

  if (action === "DISCONNECT") {
    stopped = true;
    clearInterval(flushTimer);
    clearTimeout(reconnectTimer);
    flushTimer = null;
    reconnectTimer = null;
    socketUrl = null;
    socket?.close();
    socket = null;
    buffer = [];
    bufferStart = 0;
  }
};