"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A small video player in the site's pixel style. Plays the light web copy when there is one, offers the original
// as a download. Keys while it is open: space or k play/pause, j/l ten seconds back/forward, m mute, f fullscreen.

const GLYPHS: Record<string, string[]> = {
  play: ["x......", "xxx....", "xxxxx..", "xxxxxxx", "xxxxx..", "xxx....", "x......"],
  pause: ["xx..xx.", "xx..xx.", "xx..xx.", "xx..xx.", "xx..xx.", "xx..xx.", "xx..xx."],
  sound: ["...x...", "..xx.x.", "xxxx..x", "xxxx..x", "xxxx..x", "..xx.x.", "...x..."],
  mute: ["...x...", "..xx...", "xxxx.x.x", "xxxx..x.", "xxxx.x.x", "..xx...", "...x..."],
  full: ["xxx.xxx", "x.....x", "x.....x", ".......", "x.....x", "x.....x", "xxx.xxx"],
  exit: [".x...x.", "xx...xx", ".......", ".......", ".......", "xx...xx", ".x...x."],
  back: ["...x...", "..xx...", ".xxxxxx", "xxxxxxx", ".xxxxxx", "..xx...", "...x..."],
  fwd: ["...x...", "...xx..", "xxxxxx.", "xxxxxxx", "xxxxxx.", "...xx..", "...x..."],
};

function Glyph({ name, size = 14 }: { name: keyof typeof GLYPHS; size?: number }) {
  const g = GLYPHS[name];
  const w = Math.max(...g.map((r) => r.length));
  return (
    <svg viewBox={`0 0 ${w} ${g.length}`} width={(size * w) / g.length} height={size} shapeRendering="crispEdges" aria-hidden>
      {g.flatMap((row, y) => [...row].map((c, x) => (c === "x" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" /> : null)))}
    </svg>
  );
}

const clock = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};

type Props = { src: string; original: string; poster: string | null; converting: boolean; label: string };

export function VideoPlayer({ src, original, poster, converting, label }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [waiting, setWaiting] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [full, setFull] = useState(false);
  const [error, setError] = useState(false);
  const [idle, setIdle] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toggle = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => setPlaying(false));
    else v.pause();
  }, []);
  const skip = useCallback((by: number) => {
    const v = video.current;
    if (v) v.currentTime = Math.min(Math.max(0, v.currentTime + by), v.duration || v.currentTime + by);
  }, []);
  const toggleMute = useCallback(() => {
    const v = video.current;
    if (v) v.muted = !v.muted;
  }, []);
  const toggleFull = useCallback(() => {
    const el = box.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    const v = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (el?.requestFullscreen) void el.requestFullscreen().catch(() => v?.webkitEnterFullscreen?.());
    else v?.webkitEnterFullscreen?.(); // iphone safari only does fullscreen on the video itself
  }, []);

  // controls fade out after a moment of no mouse movement while playing
  const wake = useCallback(() => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2500);
  }, []);
  useEffect(() => () => clearTimeout(idleTimer.current), []);

  useEffect(() => {
    const onFull = () => setFull(document.fullscreenElement === box.current);
    document.addEventListener("fullscreenchange", onFull);
    return () => document.removeEventListener("fullscreenchange", onFull);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "k") {
        e.preventDefault();
        toggle();
      } else if (k === "j") skip(-10);
      else if (k === "l") skip(10);
      else if (k === "m") toggleMute();
      else if (k === "f") toggleFull();
      else return;
      wake();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, skip, toggleMute, toggleFull, wake]);

  const seekTo = (clientX: number) => {
    const v = video.current;
    const r = track.current?.getBoundingClientRect();
    if (!v || !r || !duration) return;
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    v.currentTime = f * duration;
    setTime(f * duration);
  };

  const onBuffer = () => {
    const v = video.current;
    if (!v || !v.buffered.length) return;
    // the buffered range around the playhead
    for (let i = 0; i < v.buffered.length; i++) {
      if (v.buffered.start(i) <= v.currentTime + 0.5) setBuffered(v.buffered.end(i));
    }
  };

  const pct = (n: number) => (duration ? `${Math.min(100, (100 * n) / duration)}%` : "0%");
  const showControls = !playing || !idle || seeking || error;

  return (
    <div ref={box} className={`vp ${full ? "vp-full" : ""} ${showControls ? "" : "vp-idle"}`} onMouseMove={wake} onTouchStart={wake} data-playing={playing || undefined}>
      <video
        ref={video}
        key={src}
        src={src}
        poster={poster ?? undefined}
        autoPlay
        playsInline
        preload="metadata"
        className="vp-video"
        aria-label={label}
        onClick={toggle}
        onDoubleClick={toggleFull}
        onPlay={() => {
          setPlaying(true);
          wake();
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => !seeking && setTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onProgress={onBuffer}
        onWaiting={() => setWaiting(true)}
        onCanPlay={() => setWaiting(false)}
        onPlaying={() => setWaiting(false)}
        onVolumeChange={(e) => {
          setMuted(e.currentTarget.muted);
          setVolume(e.currentTarget.volume);
        }}
        onError={() => {
          setError(true);
          setWaiting(false);
        }}
      />

      {waiting && !error && (
        <div className="vp-center" aria-hidden>
          <span className="vp-spinner">
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
      )}
      {!playing && !waiting && !error && (
        <button type="button" className="vp-center vp-big" onClick={toggle} aria-label="play">
          <span>
            <Glyph name="play" size={28} />
          </span>
        </button>
      )}
      {error && (
        <div className="vp-center vp-error">
          <div className="win win-dashed text-[11px] p-3 max-w-[320px] text-center grid gap-2">
            <span>{converting ? "this video is still being made web-friendly. try again in a bit, or grab the original." : "your browser can't play this one (iphone videos sometimes do that)."}</span>
            <a href={original} download className="btn text-[11px] justify-self-center">
              ↓ download original
            </a>
          </div>
        </div>
      )}

      <div className="vp-bar" onClick={(e) => e.stopPropagation()}>
        <div
          ref={track}
          className="vp-track"
          role="slider"
          aria-label="seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${clock(time)} of ${clock(duration)}`}
          tabIndex={0}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setSeeking(true);
            seekTo(e.clientX);
          }}
          onPointerMove={(e) => seeking && seekTo(e.clientX)}
          onPointerUp={() => setSeeking(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.stopPropagation();
              e.preventDefault();
              skip(e.key === "ArrowLeft" ? -5 : 5);
            }
          }}
        >
          <i className="vp-buffered" style={{ width: pct(buffered) }} />
          <i className="vp-played" style={{ width: pct(time) }} />
          <i className="vp-head" style={{ left: pct(time) }} />
        </div>
        <div className="vp-row">
          <button type="button" onClick={toggle} className="vp-btn" aria-label={playing ? "pause" : "play"} title={playing ? "pause (k)" : "play (k)"}>
            <Glyph name={playing ? "pause" : "play"} />
          </button>
          <button type="button" onClick={() => skip(-10)} className="vp-btn" aria-label="back 10 seconds" title="back 10s (j)">
            <Glyph name="back" />
          </button>
          <button type="button" onClick={() => skip(10)} className="vp-btn" aria-label="forward 10 seconds" title="forward 10s (l)">
            <Glyph name="fwd" />
          </button>
          <span className="vp-time">
            {clock(time)} / {clock(duration)}
          </span>
          <span className="flex-1" />
          <button type="button" onClick={toggleMute} className="vp-btn" aria-label={muted || volume === 0 ? "unmute" : "mute"} title="mute (m)">
            <Glyph name={muted || volume === 0 ? "mute" : "sound"} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const v = video.current;
              if (!v) return;
              v.volume = Number(e.target.value);
              v.muted = v.volume === 0;
            }}
            className="vp-volume"
            aria-label="volume"
          />
          <a href={original} download className="vp-btn vp-dl" title="download the original file" aria-label="download original">
            ↓
          </a>
          <button type="button" onClick={toggleFull} className="vp-btn" aria-label={full ? "exit fullscreen" : "fullscreen"} title="fullscreen (f)">
            <Glyph name={full ? "exit" : "full"} />
          </button>
        </div>
      </div>
    </div>
  );
}
