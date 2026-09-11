/** Sons curtos do AGRO AI via Web Audio — sem ficheiros. */

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  try {
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

function blip(
  ac: AudioContext,
  {
    freq,
    start,
    dur,
    gain = 0.07,
    type = "sine",
    slide,
  }: {
    freq: number;
    start: number;
    dur: number;
    gain?: number;
    type?: OscillatorType;
    slide?: number;
  },
) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slide != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), start + dur);
  }
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

/** Pop de envio, estilo mensagem que saiu. */
export function playAgroSend() {
  const ac = audioCtx();
  if (!ac) return;
  const t = ac.currentTime;
  blip(ac, { freq: 880, start: t, dur: 0.055, gain: 0.07, type: "sine" });
  blip(ac, {
    freq: 1180,
    start: t + 0.038,
    dur: 0.08,
    gain: 0.055,
    type: "triangle",
    slide: 760,
  });
}

/** Toque simples quando o card aparece. */
export function playAgroCard() {
  const ac = audioCtx();
  if (!ac) return;
  const t = ac.currentTime;
  blip(ac, { freq: 520, start: t, dur: 0.09, gain: 0.045, type: "triangle" });
}

/** Ding de conquista quando o lançamento entra. */
export function playAgroSuccess() {
  const ac = audioCtx();
  if (!ac) return;
  const t = ac.currentTime;
  blip(ac, { freq: 523.25, start: t, dur: 0.12, gain: 0.055, type: "sine" });
  blip(ac, { freq: 659.25, start: t + 0.08, dur: 0.13, gain: 0.06, type: "sine" });
  blip(ac, {
    freq: 783.99,
    start: t + 0.16,
    dur: 0.28,
    gain: 0.07,
    type: "triangle",
  });
  blip(ac, {
    freq: 1046.5,
    start: t + 0.22,
    dur: 0.18,
    gain: 0.03,
    type: "sine",
  });
}
