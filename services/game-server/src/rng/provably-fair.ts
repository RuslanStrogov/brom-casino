import { createHash, createHmac } from 'crypto';
import { RngService } from './rng.service';

/**
 * ProvablyFair — cryptographically verifiable RNG.
 *
 * Protocol:
 * 1. Server generates server_seed (32 random bytes)
 * 2. Server publishes server_hash = SHA256(server_seed)
 * 3. Client provides client_seed
 * 4. For each round: result = HMAC-SHA256(server_seed, client_seed + nonce)
 * 5. After session, server reveals server_seed for verification
 */
export class ProvablyFair {
  private serverSeed: string;
  private serverHash: string;
  private clientSeed: string;
  private nonce: number;

  constructor(
    private readonly rngService: RngService,
    clientSeed?: string,
  ) {
    const pair = this.rngService.generateServerSeedPair();
    this.serverSeed = pair.serverSeed;
    this.serverHash = pair.serverHash;
    this.clientSeed = clientSeed || this.rngService.generateSeed(16);
    this.nonce = 0;
  }

  /** Get the public server hash (shown to client BEFORE play) */
  getServerHash(): string {
    return this.serverHash;
  }

  /** Get the client seed */
  getClientSeed(): string {
    return this.clientSeed;
  }

  /** Set client seed (from client) */
  setClientSeed(seed: string): void {
    this.clientSeed = seed;
    this.nonce = 0;
  }

  /** Get current nonce */
  getNonce(): number {
    return this.nonce;
  }

  /** Generate next result in [0, 1) */
  next(): number {
    this.nonce++;
    const message = `${this.clientSeed}:${this.nonce}`;
    const hmac = this.rngService.hmac(this.serverSeed, message);
    return this.rngService.hmacToFloat(hmac);
  }

  /** Generate integer in [min, max] */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Reveal server seed after session for verification */
  reveal(): { serverSeed: string; clientSeed: string; nonce: number } {
    return {
      serverSeed: this.serverSeed,
      clientSeed: this.clientSeed,
      nonce: this.nonce,
    };
  }

  /** Verify a result against revealed seeds */
  static verify(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    expectedHash: string,
  ): { valid: boolean; result: number } {
    const serverHash = createHash('sha256').update(serverSeed).digest('hex');
    if (serverHash !== expectedHash) {
      return { valid: false, result: 0 };
    }

    const message = `${clientSeed}:${nonce}`;
    const hmac = createHmac('sha256', serverSeed).update(message).digest('hex');
    const value = parseInt(hmac.substring(0, 8), 16);
    return { valid: true, result: value / 0x100000000 };
  }
}
