// ====================================================================
// VoiceRecorder - تسجيل رسالة صوتية بـ MediaRecorder API
// ====================================================================
// يدعم التسجيل/الإيقاف/الإلغاء + يعرض المؤقت + يرجّع Blob جاهز للرفع.
// ====================================================================

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";

interface Props {
  onSend: (blob: Blob, durationSec: number) => Promise<void>;
  disabled?: boolean;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function VoiceRecorder({ onSend, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [sending, setSending] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => () => {
    cleanupStream();
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // اختيار صيغة مدعومة
      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
      const mime = preferred.find((m) => MediaRecorder.isTypeSupported(m)) || "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setBlob(b);
        cleanupStream();
      };
      mr.start();
      setRecording(true);
      setSeconds(0);
      setBlob(null);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      alert("يجب السماح بالوصول إلى الميكروفون");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  const cancel = () => {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
    }
    if (timerRef.current) window.clearInterval(timerRef.current);
    setBlob(null);
    setSeconds(0);
    cleanupStream();
  };

  const send = async () => {
    if (!blob) return;
    setSending(true);
    try {
      await onSend(blob, seconds);
      setBlob(null);
      setSeconds(0);
    } finally {
      setSending(false);
    }
  };

  // الحالة 1: لا يوجد تسجيل ولا blob => زر مايكروفون فقط
  if (!recording && !blob) {
    return (
      <button
        type="button"
        onClick={start}
        disabled={disabled}
        className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center disabled:opacity-50 active:scale-95 transition"
        aria-label="تسجيل رسالة صوتية"
      >
        <Mic className="w-5 h-5" />
      </button>
    );
  }

  // الحالة 2: جاري التسجيل
  if (recording) {
    return (
      <div className="flex items-center gap-2 flex-1 bg-destructive/10 border border-destructive/30 rounded-2xl px-3 h-12">
        <span className="w-2.5 h-2.5 rounded-full bg-destructive live-pulse" />
        <span className="text-sm font-mono text-destructive flex-1">{fmt(seconds)}</span>
        <button onClick={cancel} className="p-2" aria-label="إلغاء">
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
        <button onClick={stop} className="p-2 bg-destructive text-destructive-foreground rounded-xl" aria-label="إيقاف">
          <Square className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // الحالة 3: تم التسجيل، بانتظار الإرسال
  return (
    <div className="flex items-center gap-2 flex-1 bg-primary/20 rounded-2xl px-3 h-12">
      <button onClick={cancel} className="p-2" aria-label="حذف">
        <Trash2 className="w-4 h-4 text-destructive" />
      </button>
      <span className="text-sm font-mono flex-1">{fmt(seconds)} • مسجّل</span>
      <button
        onClick={send}
        disabled={sending}
        className="p-2 bg-foreground text-background rounded-xl disabled:opacity-50"
        aria-label="إرسال"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </div>
  );
}
