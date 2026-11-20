const K = [0x75, 0x6c, 0x65, 0x70, 0x2d, 0x39, 0x30, 0x32, 0x2d, 0x6b, 0x37, 0x78];

function deriveSeed(iv: Uint8Array): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < K.length; i++) {
    h ^= K[i];
    h = Math.imul(h, 0x01000193);
  }
  for (let i = 0; i < iv.length; i++) {
    h ^= iv[i];
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function nextKeyByte(state: { s: number }): number {
  let t = (state.s += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) & 0xff;
}

export function decodePayload<T = string>(encoded: string): T {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const iv = bytes.subarray(0, 8);
  const cipher = bytes.subarray(8);
  const out = new Uint8Array(cipher.length);
  const state = { s: deriveSeed(iv) };
  for (let i = 0; i < cipher.length; i++) {
    out[i] = cipher[i] ^ nextKeyByte(state);
  }
  const json = new TextDecoder().decode(out);
  return JSON.parse(json) as T;
}
