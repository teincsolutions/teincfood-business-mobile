declare module "react-native-zeroconf" {
  export interface ZeroconfService {
    name: string;
    type: string;
    domain: string;
    host: string | null;
    port: number;
    addresses: string[] | null;
    txt: Record<string, string>;
  }

  export default class Zeroconf {
    constructor();
    on(event: "resolved", listener: (service: ZeroconfService) => void): void;
    on(event: "remove", listener: (service: ZeroconfService) => void): void;
    on(event: "error", listener: (error: Error) => void): void;
    publishService(
      type: string,
      protocol: string,
      domain: string,
      name: string,
      port: number,
      txt?: Record<string, string>,
    ): void;
    unpublishService(name: string): void;
    scan(type: string, protocol: string, domain?: string): void;
    stop(): void;
  }
}
