import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import {
  parseAndSegmentMultilingualText,
  detectSegmentLanguage,
} from "./src/utils/languageDetector";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fetch authentic native speech audio buffer for any sentence (French, Arabic, English, etc.)
async function fetchNativeTTSAudio(text: string, lang: string): Promise<Buffer | null> {
  const clean = text.trim();
  if (!clean) return null;
  const tl = lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en";
  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      clean
    )}&tl=${tl}&client=tw-ob`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    }
  } catch (_e) {
    // Handled below
  }
  return null;
}

// 1. Endpoint: Analyze and Segment text
app.post("/api/analyze-text", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Use our high-speed, deterministic, linguistically accurate parser
    const parsedResult = parseAndSegmentMultilingualText(text);

    return res.json({
      success: true,
      originalText: text,
      detectedPairType: parsedResult.detectedPairType,
      segments: parsedResult.segments,
    });
  } catch (_error) {
    const fallback = parseAndSegmentMultilingualText(req.body?.text || "");
    return res.json({
      success: true,
      originalText: req.body?.text || "",
      detectedPairType: fallback.detectedPairType,
      segments: fallback.segments,
    });
  }
});

// 2. Endpoint: Synthesize Speech using Fast Native Audio Engine
app.post("/api/synthesize-speech", async (req, res) => {
  try {
    const { segments } = req.body;

    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return res.status(400).json({ error: "Segments array is required" });
    }

    const segmentsAudio: Record<string, string> = {};
    const audioBuffers: Array<{ index: number; buffer: Buffer }> = [];

    // Concurrency pool to process even 100+ sentences rapidly
    let nextIdx = 0;
    async function worker() {
      while (nextIdx < segments.length) {
        const idx = nextIdx++;
        const seg = segments[idx];
        const segText = (seg.vocalizedText || seg.text || "").trim();
        if (!segText) continue;

        const buf = await fetchNativeTTSAudio(segText, seg.lang || "fr");
        if (buf && buf.length > 0) {
          segmentsAudio[seg.id] = buf.toString("base64");
          audioBuffers.push({ index: idx, buffer: buf });
        }
      }
    }

    const workerCount = Math.min(6, Math.max(2, Math.ceil(segments.length / 4)));
    const workers = Array.from({ length: workerCount }, () => worker());
    await Promise.all(workers);

    // Sort buffers by original order
    audioBuffers.sort((a, b) => a.index - b.index);

    if (audioBuffers.length === 0) {
      return res.status(503).json({
        success: false,
        fallbackToClient: true,
        error: "الخدمة الصوتية تحت ضغط مؤقت، يمكنك الاستماع عبر المتصفح أو المحاولة بعد لحظات.",
      });
    }

    // Concatenate all segment MP3 buffers into one continuous audio track
    const combinedBuf = Buffer.concat(audioBuffers.map((b) => b.buffer));
    // Estimate duration: ~32kbps (4000 bytes/sec)
    const durationSeconds = Math.round((combinedBuf.length / 4000) * 10) / 10;

    return res.json({
      success: true,
      audioWavBase64: combinedBuf.toString("base64"),
      durationSeconds,
      format: "mp3",
      segmentsAudio,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      fallbackToClient: true,
      error: "تعذر توليد المقطع الصوتي حالياً، يرجى المحاولة بعد لحظات.",
    });
  }
});

// Single Direct Speech Generation (for immediate preview / single sentence)
app.post("/api/tts-single", async (req, res) => {
  try {
    const { text, lang } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const buf = await fetchNativeTTSAudio(text, lang || "fr");
    if (buf && buf.length > 0) {
      return res.json({
        success: true,
        audioWavBase64: buf.toString("base64"),
        durationSeconds: Math.round((buf.length / 4000) * 10) / 10,
        format: "mp3",
      });
    }

    return res.status(503).json({
      success: false,
      fallbackToBrowser: true,
      error: "تعذر توليد النطق الفردي عبر السحابة حالياً، يتم استخدام صوت المتصفح.",
    });
  } catch (_error) {
    return res.status(503).json({
      success: false,
      fallbackToBrowser: true,
      error: "تعذر توليد النطق الفردي عبر السحابة حالياً، يتم استخدام صوت المتصفح.",
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
