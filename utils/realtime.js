const clients = new Map();

export function registerClient(userId, controller) {
  clients.set(userId.toString(), controller);
}

export async function emitToUser(userId, payload) {
  const controller = clients.get(userId.toString());
  if (!controller) return;

  controller.enqueue(
    new TextEncoder().encode(`data: ${JSON.stringify([payload])}\n\n`),
  );
}
