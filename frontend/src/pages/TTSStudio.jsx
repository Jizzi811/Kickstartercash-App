import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Volume2, Loader2, Download, Play } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";
import { Textarea } from "@/components/ui/textarea";

// grok-tts is OpenAI-compatible; "Standard" sends no voice and lets the model pick.
const VOICES = ["Standard", "alloy", "echo", "fable", "onyx", "nova", "shimmer"];
const MAX = 5000;

export default function TTSStudio() {
  const { lang } = useApp();
  const L = (de, en) => (lang === "DE" ? de : en);
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("Standard");
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState(null);

  const generate = async () => {
    if (!text.trim()) { toast.error(L("Bitte gib einen Text ein.", "Please enter some text.")); return; }
    setLoading(true); setAudio(null);
    try {
      const res = await axios.post(`${API}/audio/speech`, {
        text: text.trim(),
        voice: voice === "Standard" ? null : voice,
      });
      if (res.data?.audio) setAudio(res.data.audio);
      else toast.error(L("Keine Audiodaten erhalten.", "No audio received."));
    } catch (e) {
      toast.error(e?.response?.data?.detail || L("Sprachausgabe fehlgeschlagen.", "Speech generation failed."));
    } finally { setLoading(false); }
  };

  const download = () => {
    if (!audio) return;
    const a = document.createElement("a");
    a.href = audio;
    a.download = `brandmind-voice-${Date.now()}.mp3`;
    a.click();
  };

  return (
    <div>
      <PageTitle
        title={L("TTS Studio", "TTS Studio")}
        subtitle={L("Text eingeben, vertonen lassen und als Audio herunterladen.", "Enter text, turn it into speech and download the audio.")}
        icon={Volume2}
      />

      <div className="bg-[#0A0A0A] border border-[#7C3AED]/30 rounded-md p-6 md:p-7 space-y-5 gold-glow">
        <div className="space-y-1.5">
          <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{L("Text", "Text")}</label>
          <Textarea
            data-testid="tts-text-input"
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder={L("Schreibe oder füge den Text ein, der vorgelesen werden soll…", "Write or paste the text you want read aloud…")}
            className="bg-black/40 border-white/10 focus:border-[#7C3AED] focus-visible:ring-[#7C3AED]/40 text-white"
          />
          <div className="text-right text-[11px] text-zinc-600">{text.length} / {MAX}</div>
        </div>

        <div>
          <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{L("Stimme", "Voice")}</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {VOICES.map((v) => (
              <button
                key={v}
                data-testid={`tts-voice-${v}`}
                onClick={() => setVoice(v)}
                className={`px-3.5 py-1.5 rounded-sm text-sm border transition-all capitalize ${voice === v ? "bg-[#7C3AED] text-white border-[#7C3AED] font-semibold" : "border-white/10 text-zinc-400 hover:border-[#7C3AED]/40"}`}
              >
                {v === "Standard" ? L("Standard", "Default") : v}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-zinc-600 mt-2">
            {L("Falls eine Stimme nicht funktioniert, wähle „Standard“.", "If a voice doesn't work, choose „Default“.")}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs text-zinc-500">FreeTheAi · Grok TTS</span>
          <button
            data-testid="tts-generate-btn"
            disabled={loading}
            onClick={generate}
            className="inline-flex items-center gap-2 bg-[#7C3AED] text-white px-7 py-2.5 rounded-sm font-bold hover:bg-[#C4B5FD] transition-colors disabled:opacity-60"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> {L("Wird vertont…", "Generating…")}</> : <><Play size={16} /> {L("Vertonen", "Generate")}</>}
          </button>
        </div>
      </div>

      {audio && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0A0A0A] border border-white/10 rounded-md p-5 mt-6 space-y-4"
          data-testid="tts-result"
        >
          <div className="text-xs tracking-[0.12em] uppercase text-[#7C3AED] flex items-center gap-1.5">
            <Volume2 size={13} /> {L("Ergebnis", "Result")}
          </div>
          <audio data-testid="tts-audio" controls autoPlay src={audio} className="w-full" />
          <button
            data-testid="tts-download-btn"
            onClick={download}
            className="inline-flex items-center justify-center gap-2 border border-[#7C3AED]/50 text-[#7C3AED] py-2.5 px-5 rounded-sm hover:bg-[#7C3AED]/10 transition-colors"
          >
            <Download size={16} /> {L("Audio herunterladen (MP3)", "Download audio (MP3)")}
          </button>
        </motion.div>
      )}

      {!audio && !loading && (
        <p className="text-center text-zinc-600 text-sm py-10">
          {L("Dein vertonter Text erscheint hier als abspielbares Audio.", "Your generated speech will appear here as playable audio.")}
        </p>
      )}
    </div>
  );
}
