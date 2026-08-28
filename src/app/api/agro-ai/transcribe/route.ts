import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error:
          "Falta OPENAI_API_KEY no servidor. Coloca a chave no .env.local e reinicia o Next.",
      },
      { status: 501 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Áudio em falta." }, { status: 400 });
  }

  const whisper = new FormData();
  whisper.append("file", file, file.name || "audio.webm");
  whisper.append("model", "whisper-1");
  whisper.append("language", "pt");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: whisper,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(errText);
    return NextResponse.json(
      { error: "Não deu para transcrever o áudio." },
      { status: 502 },
    );
  }

  const data = (await res.json()) as { text?: string };
  return NextResponse.json({ text: (data.text ?? "").trim() });
}
