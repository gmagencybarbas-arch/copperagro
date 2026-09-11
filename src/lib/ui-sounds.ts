/** Toques de UI via Web Audio — sem ficheiros. */

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  try {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return null;
    }
    const C =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!ctx || ctx.state === "closed") ctx = new C();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Click silencioso da sidebar: tap curto, baixo, sem estalo. */
export function playSoftTap() {
  const ac = audioCtx();
  if (!ac) return;
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  const tone = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(210, t);
  osc.frequency.exponentialRampToValueAtTime(140, t + 0.055);
  tone.gain.setValueAtTime(0.0001, t);
  tone.gain.exponentialRampToValueAtTime(0.028, t + 0.008);
  tone.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  osc.connect(tone);
  tone.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.08);

  const tick = ac.createOscillator();
  const tickGain = ac.createGain();
  tick.type = "triangle";
  tick.frequency.setValueAtTime(620, t);
  tickGain.gain.setValueAtTime(0.0001, t);
  tickGain.gain.exponentialRampToValueAtTime(0.016, t + 0.004);
  tickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
  tick.connect(tickGain);
  tickGain.connect(ac.destination);
  tick.start(t);
  tick.stop(t + 0.04);
}
