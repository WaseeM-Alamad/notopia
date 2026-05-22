import { EventEmitter } from "events";

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export function registerClient(userId, controller) {
  const encoder = new TextEncoder();
  const handler = (payload) => {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify([payload])}\n\n`),
    );
  };
  emitter.on(userId.toString(), handler);

  // Return cleanup function
  return () => emitter.off(userId.toString(), handler);
}

export function emitToUser(userId, payload) {
  emitter.emit(userId.toString(), payload);
}
