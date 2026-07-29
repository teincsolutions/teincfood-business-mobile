/**
 * Temporary LAN E2E test for Local Node command/response protocol.
 *
 * This test starts a Local Node TCP server on localhost, connects a client,
 * sends a command, and verifies the command_response contains the expected
 * events. It does not require a running backend.
 */

import * as net from "net";

interface LocalNodeMessage {
  type: "hello" | "command" | "command_response" | "event" | "ping" | "pong";
  id: string;
  payload: unknown;
}

function send(socket: net.Socket, message: LocalNodeMessage) {
  socket.write(JSON.stringify(message) + "\n");
}

function startServer(port: number): Promise<net.Server> {
  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      socket.on("data", (buffer) => {
        const lines = buffer.toString("utf-8").split("\n").filter((line) => line.trim());
        for (const line of lines) {
          try {
            const message = JSON.parse(line) as LocalNodeMessage;
            if (message.type === "hello") {
              send(socket, { type: "pong", id: `pong-${message.id}`, payload: {} });
            }
            if (message.type === "command") {
              const command = message.payload as Record<string, unknown>;
              send(socket, {
                type: "command_response",
                id: message.id,
                payload: [
                  {
                    event_id: `evt_${Date.now()}`,
                    event_type: `${command.command_type}`.replace(":", "."),
                    event_version: "1.0",
                    entity_id: command.entity_id || command.command_id,
                    user_id: command.user_id,
                    device_id: command.device_id,
                    payload: command.payload,
                    timestamp: new Date().toISOString(),
                  },
                ],
              });
            }
          } catch {
            // ignore malformed lines
          }
        }
      });
    });

    server.listen(port, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function connectClient(port: number): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port }, () => {
      send(socket, {
        type: "hello",
        id: "hello-1",
        payload: { deviceId: "client-device" },
      });
      resolve(socket);
    });
    socket.on("error", reject);
  });
}

function executeCommand(socket: net.Socket, command: Record<string, unknown>): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const messageId = `cmd_${Date.now()}`;

    const onData = (buffer: Buffer) => {
      const lines = buffer.toString("utf-8").split("\n").filter((line) => line.trim());
      for (const line of lines) {
        try {
          const message = JSON.parse(line) as LocalNodeMessage;
          if (message.type === "command_response" && message.id === messageId) {
            socket.off("data", onData);
            resolve(message.payload as unknown[]);
          }
        } catch {
          // ignore
        }
      }
    };

    socket.on("data", onData);

    send(socket, { type: "command", id: messageId, payload: command });

    setTimeout(() => {
      socket.off("data", onData);
      reject(new Error("Local Node command timeout"));
    }, 5000);
  });
}

async function main() {
  const port = 19100;
  const server = await startServer(port);
  const socket = await connectClient(port);

  // Give the server a moment to accept the hello.
  await new Promise((resolve) => setTimeout(resolve, 100));

  const command = {
    command_id: `cmd_${Date.now()}`,
    command_type: "order:create",
    command_version: "1.0",
    business_id: "biz-uuid",
    entity_id: "local-order-uuid",
    user_id: "user-uuid",
    device_id: "client-device",
    timestamp: new Date().toISOString(),
    payload: { order_type: "takeout", pos_payment_method: "cash", items: [] },
  };

  console.log("[LAN E2E] Sending command", command.command_id);
  const events = await executeCommand(socket, command);

  if (!Array.isArray(events) || events.length === 0) {
    throw new Error("Expected non-empty event array");
  }

  const event = events[0] as Record<string, unknown>;
  if (!event.event_type || !String(event.event_type).startsWith("order.")) {
    throw new Error(`Unexpected event type: ${event.event_type}`);
  }

  console.log("[LAN E2E] PASS: received command_response", event.event_type);

  socket.destroy();
  server.close();
}

main().catch((error) => {
  console.error("[LAN E2E] FAIL", error);
  process.exit(1);
});
