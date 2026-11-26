const SIGMA = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574] as const;

const S_A = [0x4c91f2a7, 0x8b23d15e] as const;
const S_B = [0x1f64c809, 0x9e37a4c2] as const;
const S_C = [0x6a09e667, 0xbb67ae85] as const;
const S_D = [0x3c6ef372, 0xa54ff53a] as const;
const MASK_W = [0x29a17c53, 0x7f4a19d0] as const;

function rotl32(v: number, n: number): number {
  return ((v << n) | (v >>> (32 - n))) >>> 0;
}

function quarterRound(s: Uint32Array, a: number, b: number, c: number, d: number): void {
  s[a] = (s[a] + s[b]) >>> 0;
  s[d] = rotl32(s[d] ^ s[a], 16);
  s[c] = (s[c] + s[d]) >>> 0;
  s[b] = rotl32(s[b] ^ s[c], 12);
  s[a] = (s[a] + s[b]) >>> 0;
  s[d] = rotl32(s[d] ^ s[a], 8);
  s[c] = (s[c] + s[d]) >>> 0;
  s[b] = rotl32(s[b] ^ s[c], 7);
}

function deriveKeyWords(): Uint32Array {
  const raw = [S_A[0], S_A[1], S_B[0], S_B[1], S_C[0], S_C[1], S_D[0], S_D[1]];
  const key = new Uint32Array(8);
  for (let i = 0; i < 8; i++) {
    const m = MASK_W[i & 1];
    const mixed = Math.imul(raw[i] ^ rotl32(m, (i * 5 + 3) & 31), 0x01000193) >>> 0;
    key[i] = (mixed ^ rotl32(raw[(i + 3) & 7], 11)) >>> 0;
  }
  return key;
}

function chacha20Block(key: Uint32Array, counter: number, nonce: Uint32Array): Uint8Array {
  const state = new Uint32Array(16);
  state[0] = SIGMA[0];
  state[1] = SIGMA[1];
  state[2] = SIGMA[2];
  state[3] = SIGMA[3];
  for (let i = 0; i < 8; i++) state[4 + i] = key[i];
  state[12] = counter >>> 0;
  state[13] = nonce[0];
  state[14] = nonce[1];
  state[15] = nonce[2];

  const working = new Uint32Array(state);
  for (let r = 0; r < 10; r++) {
    quarterRound(working, 0, 4, 8, 12);
    quarterRound(working, 1, 5, 9, 13);
    quarterRound(working, 2, 6, 10, 14);
    quarterRound(working, 3, 7, 11, 15);

    quarterRound(working, 0, 5, 10, 15);
    quarterRound(working, 1, 6, 11, 12);
    quarterRound(working, 2, 7, 8, 13);
    quarterRound(working, 3, 4, 9, 14);
  }

  const out = new Uint8Array(64);
  const view = new DataView(out.buffer);
  for (let i = 0; i < 16; i++) {
    view.setUint32(i * 4, (working[i] + state[i]) >>> 0, true);
  }
  return out;
}

function bytesToNonceWords(nonceBytes: Uint8Array): Uint32Array {
  const view = new DataView(nonceBytes.buffer, nonceBytes.byteOffset, 12);
  return new Uint32Array([
    view.getUint32(0, true),
    view.getUint32(4, true),
    view.getUint32(8, true)
  ]);
}

function computeTag(key: Uint32Array, nonceWords: Uint32Array, cipher: Uint8Array): Uint8Array {
  const macSeed = chacha20Block(key, 0, nonceWords);
  const acc = new Uint32Array(4);
  const seedView = new DataView(macSeed.buffer);
  for (let i = 0; i < 4; i++) acc[i] = seedView.getUint32(i * 4, true);

  for (let i = 0; i < cipher.length; i++) {
    const idx = i & 3;
    acc[idx] = Math.imul((acc[idx] ^ cipher[i]) >>> 0, 0x01000193) >>> 0;
    acc[(idx + 1) & 3] = (acc[(idx + 1) & 3] + rotl32(acc[idx], 13)) >>> 0;
  }

  acc[0] = (acc[0] ^ (cipher.length >>> 0)) >>> 0;
  for (let r = 0; r < 6; r++) {
    quarterRound(acc, 0, 1, 2, 3);
  }

  const tag = new Uint8Array(16);
  const tagView = new DataView(tag.buffer);
  for (let i = 0; i < 4; i++) {
    tagView.setUint32(i * 4, acc[i] ^ seedView.getUint32(16 + i * 4, true), true);
  }
  return tag;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function applyStream(key: Uint32Array, nonceWords: Uint32Array, input: Uint8Array): Uint8Array {
  const output = new Uint8Array(input.length);
  let counter = 1;
  for (let offset = 0; offset < input.length; offset += 64) {
    const block = chacha20Block(key, counter++, nonceWords);
    const limit = Math.min(64, input.length - offset);
    for (let j = 0; j < limit; j++) {
      output[offset + j] = input[offset + j] ^ block[j];
    }
  }
  return output;
}

function base64ToBytes(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function decodePayload<T = string>(encoded: string): T {
  const raw = base64ToBytes(encoded);
  if (raw.length < 28) {
    throw new Error('Invalid payload');
  }
  const nonceBytes = raw.subarray(0, 12);
  const expectedTag = raw.subarray(12, 28);
  const cipher = raw.subarray(28);

  const key = deriveKeyWords();
  const nonceWords = bytesToNonceWords(nonceBytes);
  const actualTag = computeTag(key, nonceWords, cipher);

  if (!constantTimeEqual(expectedTag, actualTag)) {
    throw new Error('Integrity check failed');
  }

  const plain = applyStream(key, nonceWords, cipher);
  const json = new TextDecoder().decode(plain);
  return JSON.parse(json) as T;
}
