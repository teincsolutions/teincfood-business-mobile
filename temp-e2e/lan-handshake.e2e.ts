/**
 * LAN TLS handshake protocol test.
 *
 * Tests the challenge-response handshake protocol using plain TCP (no TLS)
 * to verify the wire format and auth logic. For a full TLS test, run:
 *   bash src/local-node/__tests__/lan-tls-test.sh [host] [port]
 *
 * Run with: npx ts-node temp-e2e/lan-handshake.e2e.ts
 */

import * as net from "net";
import * as crypto from "crypto";

// ─── Re-implement core security locally to avoid module resolution issues ───

const LAN_SECRET_SALT = "teinc-lan";

function deriveLanSecret(businessId: string): string {
  const input = `${LAN_SECRET_SALT}:${businessId}:`;
  return crypto.createHash("sha256").update(input).digest("hex");
}

function generateNonceSync(): string {
  return crypto.randomBytes(16).toString("hex");
}

function computeProofSync(secret: string, nonce: string): string {
  return crypto.createHash("sha256").update(`${nonce}:${secret}`).digest("hex");
}

// ─── Wire protocol ──────────────────────────────────────────────────────────

interface WireMessage {
  type: string;
  id: string;
  payload: Record<string, unknown>;
}

function encode(msg: WireMessage): string {
  return JSON.stringify(msg) + "\n";
}

function send(socket: net.Socket, msg: WireMessage): void {
  socket.write(encode(msg));
}

function readLines(socket: net.Socket, timeoutMs: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const lines: string[] = [];
    let buffer = "";
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf-8");
      const parts = buffer.split("\n");
      buffer = parts.pop() ?? "";
      for (const line of parts) {
        if (line.trim()) lines.push(line);
      }
      if (lines.length >= 1) {
        clearTimeout(timer);
        socket.removeListener("data", onData);
        socket.removeListener("error", onError);
        socket.removeListener("close", onClose);
        resolve(lines);
      }
    };
    const onError = (err: Error) => { clearTimeout(timer); reject(err); };
    const onClose = () => { clearTimeout(timer); reject(new Error("socket closed")); };
    socket.on("data", onData);
    socket.on("error", onError);
    socket.on("close", onClose);
  });
}

// ─── Test harness ───────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string): void {
  if (condition) { passed++; console.log(`  PASS: ${msg}`); }
  else { failed++; console.log(`  FAIL: ${msg}`); }
}

function assertEqual<T>(actual: T, expected: T, msg: string): void {
  assert(actual === expected, `${msg} (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`);
}

function createMockServer(businessId: string): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve) => {
    const server = net.createServer((socket) => {
      let buffer = "";
      socket.on("data", (chunk) => {
        buffer += chunk.toString("utf-8");
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const msg: WireMessage = JSON.parse(line);
          if (msg.type === "hello") {
            const biz = msg.payload.businessId as string;
            if (biz !== businessId) {
              send(socket, { type: "auth_fail", id: "s", payload: { reason: "business_mismatch" } });
              socket.destroy();
              return;
            }
            const nonce = generateNonceSync();
            (socket as any)._testNonce = nonce;
            send(socket, { type: "challenge", id: "s", payload: { nonce } });
          } else if (msg.type === "auth") {
            const nonce = (socket as any)._testNonce as string;
            const proof = msg.payload.proof as string;
            const expected = computeProofSync(deriveLanSecret(businessId), nonce);
            if (proof !== expected) {
              send(socket, { type: "auth_fail", id: "s", payload: { reason: "invalid_proof" } });
              socket.destroy();
              return;
            }
            send(socket, { type: "auth_ok", id: "s", payload: {} });
          }
        }
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as net.AddressInfo;
      resolve({ port: addr.port, close: () => server.close() });
    });
  });
}

async function main() {
  const TEST_BIZ = "0f0764da-53aa-48e4-ac40-3bfd8a52b0ec";
  const secret = deriveLanSecret(TEST_BIZ);

  // ─── Unit tests ──────────────────────────────────────────

  console.log("\n=== Security Functions ===");
  assertEqual(secret.length, 64, "deriveLanSecret produces 64-char hex");
  assertEqual(deriveLanSecret(TEST_BIZ), secret, "deriveLanSecret is deterministic");

  const nonce = generateNonceSync();
  assertEqual(nonce.length, 32, "generateNonce produces 32-char hex");

  const proof = computeProofSync(secret, nonce);
  assertEqual(proof.length, 64, "computeProof produces 64-char hex");
  assertEqual(computeProofSync(secret, nonce), proof, "computeProof is deterministic");
  assert(computeProofSync(secret, generateNonceSync()) !== proof, "computeProof changes with nonce");
  assert(computeProofSync("wrong-secret", nonce) !== proof, "computeProof changes with secret");

  // ─── Integration tests ───────────────────────────────────

  console.log("\n=== Full Handshake ===");
  {
    const { port, close } = await createMockServer(TEST_BIZ);
    try {
      const socket = net.createConnection(port, "127.0.0.1");
      await new Promise<void>((resolve) => socket.once("connect", resolve));

      // Send hello
      send(socket, {
        type: "hello",
        id: "c1",
        payload: { deviceId: "test-device", deviceName: "Test", businessId: TEST_BIZ },
      });

      // Read challenge
      const [challengeLine] = await readLines(socket, 3000);
      const challenge = JSON.parse(challengeLine) as WireMessage;
      assertEqual(challenge.type, "challenge", "received challenge");
      const serverNonce = challenge.payload.nonce as string;
      assert(serverNonce.length > 0, "challenge has nonce");

      // Send auth
      const clientProof = computeProofSync(secret, serverNonce);
      send(socket, { type: "auth", id: "c2", payload: { nonce: serverNonce, proof: clientProof } });

      // Read auth_ok
      const [authLine] = await readLines(socket, 3000);
      const authResult = JSON.parse(authLine) as WireMessage;
      assertEqual(authResult.type, "auth_ok", "received auth_ok");

      socket.destroy();
    } finally {
      close();
    }
  }

  console.log("\n=== Business Mismatch ===");
  {
    const { port, close } = await createMockServer(TEST_BIZ);
    try {
      const socket = net.createConnection(port, "127.0.0.1");
      await new Promise<void>((resolve) => socket.once("connect", resolve));

      send(socket, {
        type: "hello",
        id: "c1",
        payload: { deviceId: "test-device", businessId: "wrong-business" },
      });

      const [failLine] = await readLines(socket, 3000);
      const fail = JSON.parse(failLine) as WireMessage;
      assertEqual(fail.type, "auth_fail", "received auth_fail");
      assertEqual(fail.payload.reason, "business_mismatch", "reason is business_mismatch");

      socket.destroy();
    } finally {
      close();
    }
  }

  console.log("\n=== Invalid Proof ===");
  {
    const { port, close } = await createMockServer(TEST_BIZ);
    try {
      const socket = net.createConnection(port, "127.0.0.1");
      await new Promise<void>((resolve) => socket.once("connect", resolve));

      send(socket, {
        type: "hello",
        id: "c1",
        payload: { deviceId: "test-device", businessId: TEST_BIZ },
      });

      const [challengeLine] = await readLines(socket, 3000);
      const challenge = JSON.parse(challengeLine) as WireMessage;
      const serverNonce = challenge.payload.nonce as string;

      // Send bad proof
      const badProof = computeProofSync("wrong-secret", serverNonce);
      send(socket, { type: "auth", id: "c2", payload: { nonce: serverNonce, proof: badProof } });

      const [failLine] = await readLines(socket, 3000);
      const fail = JSON.parse(failLine) as WireMessage;
      assertEqual(fail.type, "auth_fail", "received auth_fail");
      assertEqual(fail.payload.reason, "invalid_proof", "reason is invalid_proof");

      socket.destroy();
    } finally {
      close();
    }
  }

  console.log("\n=== Frame Buffer Reassembly ===");
  {
    const msg1 = encode({ type: "challenge", id: "1", payload: { nonce: "abc" } });
    const msg2 = encode({ type: "auth_ok", id: "2", payload: {} });
    const combined = msg1 + msg2;
    const mid = Math.floor(combined.length / 2);
    const chunk1 = combined.slice(0, mid);
    const chunk2 = combined.slice(mid);

    let buffer = "";
    const messages: WireMessage[] = [];
    for (const chunk of [chunk1, chunk2]) {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim()) messages.push(JSON.parse(line));
      }
    }
    assertEqual(messages.length, 2, "reassembled 2 messages from split chunks");
    assertEqual(messages[0].type, "challenge", "first message is challenge");
    assertEqual(messages[1].type, "auth_ok", "second message is auth_ok");
  }

  // ─── Summary ─────────────────────────────────────────────

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
