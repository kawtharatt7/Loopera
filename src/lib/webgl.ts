/** True when the browser can create a WebGL context. Safe to call only in the browser. */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return ctx !== null;
  } catch {
    return false;
  }
}
