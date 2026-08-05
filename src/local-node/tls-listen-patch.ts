/**
 * Fixes react-native-tcp-socket v6.4.1 iOS server TLS.
 *
 * `TLSServer.listen()` attaches the TLS settings to its options
 * (`newOptions["tls"] = this._options`), but `Server.listen()` rebuilds the
 * options object passed to the native module and drops `tls`. As a result the
 * native `listen` never sees `options[@"tls"]`, `setSecureContext` is never
 * called, and the server listens in plaintext while callers believe it is
 * TLS. A TLS client then sends a ClientHello and receives no ServerHello —
 * the handshake hangs (timeouts / `errSSLClosedAbort`).
 *
 * This patch forwards `tls` through to `Sockets.listen`. Applied once at
 * module load; non-TLS servers are unaffected.
 */

import { NativeModules } from "react-native";
import TcpSocket from "react-native-tcp-socket";

export function patchTLSServerListen(): void {
  const Server = (TcpSocket as unknown as { Server?: unknown }).Server;
  if (!Server || typeof Server !== "function") return;

  const serverClass = Server as { prototype?: unknown };
  if (!serverClass.prototype) return;
  const proto = serverClass.prototype as Record<string, unknown>;
  if (proto.__tlsListenPatched) return;

  const originalListen = proto.listen as unknown as (...args: unknown[]) => unknown;
  const Sockets = NativeModules.TcpSockets;

  proto.listen = function (
    options: Record<string, unknown> | number,
    callbackOrHost?: unknown,
    callback?: unknown,
  ) {
    if (options && typeof options === "object" && options.tls) {
      const self = this as Record<string, unknown>;
      const cb =
        typeof callbackOrHost === "function" ? callbackOrHost : callback;
      const nativeOptions = {
        port: (options as Record<string, unknown>).port,
        host: (options as Record<string, unknown>).host || "0.0.0.0",
        // Allow a stale socket from a previous JS bundle (reload/restart) in
        // TIME_WAIT to be rebound instead of failing with EADDRINUSE.
        reuseAddress: true,
        tls: (options as Record<string, unknown>).tls,
      };
      if (typeof cb === "function") {
        (self.once as (event: string, fn: (...a: unknown[]) => void) => void)(
          "listening",
          cb as (...a: unknown[]) => void,
        );
      }
      (self.once as (event: string, fn: (...a: unknown[]) => void) => void)(
        "listening",
        () => {
          self.listening = true;
        },
      );
      (Sockets as { listen?: (id: unknown, opts: unknown) => unknown }).listen?.(
        self._id,
        nativeOptions,
      );
      return self;
    }
    return originalListen?.call(this, options, callbackOrHost, callback);
  };

  proto.__tlsListenPatched = true;
}
