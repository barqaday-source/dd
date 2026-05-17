// ====================================================================
// VoicePlayer - مشغّل صوت احترافي بشريط تقدّم
// ====================================================================

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface Props {
  src: string;
  duration?: number | null; // بالثواني (محفوظة في الرسالة)
  mine?: boolean;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function VoicePlayer({ src, duration, mine }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(duration || 0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onEnd = () => { setPlaying(false); setCurrent(0); };
    const onMeta = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) setTotal(a.duration);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    a.addEventListener("loadedmetadata", onMeta);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
    }
  };

  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;

  return (
    <div className={`flex items-center gap-3 min-w-[200px] ${mine ? "text-background" : ""}`}>
      <button
        onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          mine ? "bg-background/20" : "bg-foreground/10"
        }`}
        aria-label={playing ? "إيقاف" : "تشغيل"}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 mr-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`h-1 rounded-full ${mine ? "bg-background/20" : "bg-foreground/10"} overflow-hidden`}>
          <div
            className={`h-full transition-all ${mine ? "bg-background" : "bg-foreground"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-[10px] mt-1 opacity-70 font-mono">
          {fmt(current)} / {fmt(total)}
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
