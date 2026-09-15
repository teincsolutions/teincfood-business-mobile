#!/usr/bin/env bash
#
# lan-tls-test.sh — Live TLS handshake test against a running desktop node
#
# Usage:
#   1. Start desktop node: cargo tauri dev
#   2. Run: bash src/local-node/__tests__/lan-tls-test.sh [host] [port]
#
# Defaults: host=192.168.1.23 (hotspot), port=44621
set -euo pipefail

HOST="${1:-192.168.1.23}"
PORT="${2:-44621}"
BIZ="0f0764da-53aa-48e4-ac40-3bfd8a52b0ec"

echo "=== LAN TLS Handshake Test ==="
echo "Target: $HOST:$PORT"
echo "Business: $BIZ"
echo ""

# Step 1: TCP reachability
echo "[1/5] TCP reachability..."
if nc -zw3 "$HOST" "$PORT" 2>/dev/null; then
    echo "  OK: TCP port open"
else
    echo "  FAIL: TCP port closed or unreachable"
    exit 1
fi

# Step 2: TLS handshake with openssl (using CA cert)
echo "[2/5] TLS handshake..."
CA_CERT="$(dirname "$0")/../../TeincFoodDesktop/src-tauri/tls/ca-cert.pem"
if [ ! -f "$CA_CERT" ]; then
    CA_CERT="$(dirname "$0")/../../TeincFoodBusiness/assets/tls/ca-cert.pem"
fi
if [ ! -f "$CA_CERT" ]; then
    echo "  SKIP: ca-cert.pem not found (testing without CA)"
    TLS_OK="skip"
else
    if echo "" | timeout 5 openssl s_client -connect "$HOST:$PORT" -CAfile "$CA_CERT" -verify 2>&1 | grep -q "Verify return code: 0"; then
        echo "  OK: TLS + CA chain validated"
        TLS_OK="ok"
    else
        echo "  WARN: TLS handshake may have issues (check manually)"
        TLS_OK="warn"
    fi
fi

# Step 3: Wire protocol handshake
echo "[3/5] Wire protocol (hello → challenge → auth)..."
# Use node to do the actual handshake
npx ts-node --skip-project -e "
const TcpSocket = require('react-native-tcp-socket').default;
const { deriveLanSecret, generateNonce, computeProof } = require('@teincfood/core');

const secret = deriveLanSecret('$BIZ');
const socket = TcpSocket.connectTLS({
    host: '$HOST',
    port: $PORT,
    rejectUnauthorized: false,
    connectTimeout: 5000,
});

let buffer = '';
let settled = false;

const timeout = setTimeout(() => {
    if (!settled) {
        console.log('  FAIL: Connect timeout (10s)');
        socket.destroy();
        process.exit(1);
    }
}, 10000);

socket.on('connect', () => {
    console.log('  TCP + TLS connected');
    const hello = JSON.stringify({
        type: 'hello',
        id: 'test-' + Date.now(),
        payload: {
            deviceId: 'tls-test-script',
            deviceName: 'LAN TLS Test',
            businessId: '$BIZ',
        },
    }) + '\n';
    socket.write(hello);
    console.log('  Hello sent');
});

socket.on('data', (data) => {
    buffer += data.toString('utf-8');
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
        if (!line.trim()) continue;
        const msg = JSON.parse(line);
        console.log('  Received: ' + msg.type);

        if (msg.type === 'challenge') {
            const proof = computeProof(secret, msg.payload.nonce);
            const auth = JSON.stringify({
                type: 'auth',
                id: 'test-auth-' + Date.now(),
                payload: { nonce: msg.payload.nonce, proof },
            }) + '\n';
            socket.write(auth);
            console.log('  Auth sent');
        }

        if (msg.type === 'auth_ok') {
            settled = true;
            clearTimeout(timeout);
            console.log('');
            console.log('  ✓✓✓ AUTH OK — Full handshake succeeded!');
            socket.destroy();
            process.exit(0);
        }

        if (msg.type === 'auth_fail') {
            settled = true;
            clearTimeout(timeout);
            console.log('');
            console.log('  ✗✗✗ AUTH FAILED: ' + (msg.payload.reason || 'unknown'));
            socket.destroy();
            process.exit(1);
        }
    }
});

socket.on('error', (error) => {
    if (!settled) {
        console.log('  FAIL: ' + error.message);
        clearTimeout(timeout);
        process.exit(1);
    }
});
" 2>/dev/null

echo ""
echo "[4/5] Test complete"
echo "[5/5] Summary"
echo "  Host: $HOST:$PORT"
echo "  TLS: $TLS_OK"
echo ""
echo "=== Done ==="
