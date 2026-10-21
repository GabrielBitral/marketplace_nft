import type { Socket } from "socket.io-client";
import type { NftUpdatedEvent, OrderUpdatedEvent } from "./contracts";

let socketPromise: Promise<Socket> | undefined;

const getActiveScenario = () => typeof window === "undefined" ? undefined : window.localStorage.getItem("kurio-scenario") ?? window.sessionStorage.getItem("kurio-scenario") ?? undefined;

const getSocket = () => socketPromise ??= import("socket.io-client").then(({ io }) => io("wss://api.kurio.local", {
  autoConnect: false,
  path: "/socket.io",
  transports: ["websocket"],
}));

type RealtimeSubscription = { onReconnect?: () => void; };

const subscribeToReconnect = (socket: Socket, { onReconnect }: RealtimeSubscription) => {
  let connectedOnce = socket.connected;
  const onConnect = () => {
    if (connectedOnce) onReconnect?.();
    connectedOnce = true;
  };
  socket.on("connect", onConnect);
  return () => { socket.off("connect", onConnect); };
};

export const subscribeToNftUpdates = (onUpdate: (update: NftUpdatedEvent) => void, options: RealtimeSubscription = {}) => {
  let active = true;
  let unsubscribeReconnect: () => void = () => undefined;
  void getSocket().then((socket) => {
    if (!active) return;
    socket.connect();
    socket.emit("catalog.subscribe", { scenario: getActiveScenario() });
    socket.on("nft.updated", onUpdate);
    unsubscribeReconnect = subscribeToReconnect(socket, options);
  });

  return () => {
    active = false;
    void getSocket().then((socket) => { socket.off("nft.updated", onUpdate); });
    unsubscribeReconnect();
  };
};

export const createRealtimeOrder = (id: string) => {
  void getSocket().then((socket) => {
    const emitOrder = () => {
      socket.emit("order.create", { id });
      if (getActiveScenario() !== "connection-interrupted") return;
      window.setTimeout(() => {
        socket.disconnect();
        window.setTimeout(() => socket.connect(), 250);
      }, 50);
    };
    if (socket.connected) {
      emitOrder();
      return;
    }
    socket.once("connect", emitOrder);
    socket.connect();
  });
};

export const subscribeToOrderUpdates = (onUpdate: (update: OrderUpdatedEvent) => void, options: RealtimeSubscription = {}) => {
  let active = true;
  let unsubscribeReconnect: () => void = () => undefined;
  void getSocket().then((socket) => {
    if (!active) return;
    socket.connect();
    socket.on("order.updated", onUpdate);
    unsubscribeReconnect = subscribeToReconnect(socket, options);
  });
  return () => {
    active = false;
    void getSocket().then((socket) => { socket.off("order.updated", onUpdate); });
    unsubscribeReconnect();
  };
};
