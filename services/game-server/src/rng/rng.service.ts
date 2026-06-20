import { Injectable } from '@nestjs/common';
import { createHash, createHmac, randomBytes } from 'crypto';

@Injectable()
export class RngService {
  /**
   * Generate a cryptographically secure random hex string.
   */
  generateSeed(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Hash a seed with SHA-256.
   */
  hashSeed(seed: string): string {
    return createHash('sha256').update(seed).digest('hex');
  }

  /**
   * Generate HMAC-SHA256 from server seed and message.
   */
  hmac(serverSeed: string, message: string): string {
    return createHmac('sha256', serverSeed).update(message).digest('hex');
  }

  /**
   * Derive a float in [0, 1) from an HMAC hex string.
   */
  hmacToFloat(hmacHex: string): number {
    const value = parseInt(hmacHex.substring(0, 8), 16);
    return value / 0x100000000;
  }

  /**
   * Generate a random integer in [min, max].
   */
  randomInt(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValid = Math.floor(0x100000000 / range) * range;

    let value: number;
    do {
      const buf = randomBytes(4);
      value = buf.readUInt32BE(0);
    } while (value >= maxValid);

    return min + (value % range);
  }

  /**
   * Generate a server seed and its hash pair.
   */
  generateServerSeedPair(): { serverSeed: string; serverHash: string } {
    const serverSeed = this.generateSeed(32);
    const serverHash = this.hashSeed(serverSeed);
    return { serverSeed, serverHash };
  }

  /**
   * Verify that a server seed matches a given hash.
   */
  verifyServerSeed(serverSeed: string, expectedHash: string): boolean {
    const actualHash = this.hashSeed(serverSeed);
    return actualHash === expectedHash;
  }
}
