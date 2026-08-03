"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Entry point: the card shown on the dashboard (same slot/size as    */
/*  the old "I love you, always" banner) + the modal it opens.         */
/* ------------------------------------------------------------------ */

export function MiniGamesCard() {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Show a "tap to play" hint under the controller emoji every time the
  // app/dashboard loads, then auto-hide it after 10 seconds.
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="app-love-card flex w-full flex-col items-center justify-center gap-1 p-5 text-center transition-transform active:scale-[0.98]"
      >
        <span className="text-4xl leading-none">🎮</span>
        {showHint && (
          <span className="text-xs font-bold" style={{ color: "var(--app-muted)" }}>
            Tap to play
          </span>
        )}
      </button>

      <AnimatePresence>{open && <MiniGamesModal onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

type GameId = "runner" | "basketball" | "dice" | "reaction";

const GAMES: { id: GameId; label: string; emoji: string }[] = [
  { id: "runner", label: "Runner", emoji: "🏃" },
  { id: "basketball", label: "Hoops", emoji: "🏀" },
  { id: "dice", label: "Dice", emoji: "🎲" },
  { id: "reaction", label: "Reflex", emoji: "⚡" },
];

function MiniGamesModal({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState<GameId>("runner");

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <motion.div
        onClick={(event) => event.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-sm rounded-t-3xl p-4 sm:rounded-3xl"
        style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--app-text)" }}>
            Mini Games
          </h2>
          <button type="button" onClick={onClose} className="app-icon-button" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="app-segmented mb-4 grid grid-cols-4 gap-1 text-[11px]">
          {GAMES.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => setActive(game.id)}
              aria-pressed={active === game.id}
              className="flex flex-col items-center gap-0.5 py-1"
            >
              <span>{game.emoji}</span>
              <span>{game.label}</span>
            </button>
          ))}
        </div>

        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: "var(--app-overlay)", border: "1px solid var(--app-border)" }}
        >
          {active === "runner" && <EndlessRunner />}
          {active === "basketball" && <TapBasketball />}
          {active === "dice" && <LuckyDice />}
          {active === "reaction" && <ReactionTest />}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Endless Runner — original tap-to-jump canvas game (CK Space glyph   */
/*  hopping over pink obstacle blocks). Not affiliated with any        */
/*  existing runner game; all shapes/assets drawn here are original.   */
/* ------------------------------------------------------------------ */

function EndlessRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);

  const state = useRef({
    playerY: 0,
    velocity: 0,
    obstacleX: 300,
    frame: 0,
    speed: 4,
  });

  const reset = useCallback(() => {
    state.current = { playerY: 0, velocity: 0, obstacleX: 300, frame: 0, speed: 4 };
    setScore(0);
    setGameOver(false);
    setRunning(true);
  }, []);

  const jump = useCallback(() => {
    if (!running) {
      reset();
      return;
    }
    if (gameOver) {
      reset();
      return;
    }
    if (state.current.playerY === 0) {
      state.current.velocity = 9;
    }
  }, [running, gameOver, reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !running) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const groundY = H - 24;
    const playerX = 30;
    let raf: number;

    const loop = () => {
      const s = state.current;
      s.frame += 1;

      // physics
      s.velocity -= 0.6;
      s.playerY = Math.max(0, s.playerY + s.velocity);
      if (s.playerY < 0) s.playerY = 0;

      // obstacle
      s.obstacleX -= s.speed;
      if (s.obstacleX < -20) {
        s.obstacleX = W + Math.random() * 120;
        setScore((prev) => prev + 1);
        s.speed = Math.min(9, s.speed + 0.25);
      }

      // collision
      const playerTop = groundY - 18 - s.playerY;
      const collide =
        s.obstacleX < playerX + 18 &&
        s.obstacleX + 14 > playerX &&
        playerTop + 18 > groundY - 20;

      // draw
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(244,166,193,0.15)";
      ctx.fillRect(0, groundY, W, 2);

      // player (rounded square glyph)
      ctx.fillStyle = "#d9467f";
      ctx.beginPath();
      ctx.roundRect(playerX, playerTop, 18, 18, 5);
      ctx.fill();

      // obstacle
      ctx.fillStyle = "#f4a6c1";
      ctx.beginPath();
      ctx.roundRect(s.obstacleX, groundY - 20, 14, 20, 3);
      ctx.fill();

      if (collide) {
        setGameOver(true);
        setRunning(false);
        setBest((b) => Math.max(b, score));
        return;
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div className="p-3 text-center" onClick={jump}>
      <canvas
        ref={canvasRef}
        width={280}
        height={120}
        className="mx-auto w-full max-w-[280px] rounded-xl"
        style={{ background: "var(--app-card)", touchAction: "manipulation" }}
      />
      <p className="mt-2 text-xs font-bold" style={{ color: "var(--app-muted)" }}>
        Score {score} · Best {best}
      </p>
      <p className="mt-1 text-[11px]" style={{ color: "var(--app-dimmed)" }}>
        {!running && !gameOver && "Tap to start · tap to jump"}
        {gameOver && "Game over — tap to retry"}
        {running && !gameOver && "Tap to jump"}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  One Tap Basketball — timing-based tap game. A marker sweeps across  */
/*  a target zone; tap while it's inside the pink zone to score.        */
/* ------------------------------------------------------------------ */

function TapBasketball() {
  const [markerX, setMarkerX] = useState(0);
  const [direction, setDirection] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"hit" | "miss" | null>(null);
  const rafRef = useRef<number>(0);

  const zoneStart = 42;
  const zoneEnd = 58;

  useEffect(() => {
    let x = 0;
    let dir = 1;
    const speed = 1.6;

    const loop = () => {
      x += dir * speed;
      if (x >= 100) {
        x = 100;
        dir = -1;
      } else if (x <= 0) {
        x = 0;
        dir = 1;
      }
      setMarkerX(x);
      setDirection(dir);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const shoot = () => {
    const hit = markerX >= zoneStart && markerX <= zoneEnd;
    setFeedback(hit ? "hit" : "miss");
    if (hit) setScore((s) => s + 1);
    setTimeout(() => setFeedback(null), 400);
  };

  return (
    <div className="p-4 text-center">
      <div className="mb-1 text-3xl">🏀</div>
      <div
        className="relative mx-auto h-8 max-w-[260px] rounded-full"
        style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
      >
        <div
          className="absolute top-0 h-full rounded-full"
          style={{ left: `${zoneStart}%`, width: `${zoneEnd - zoneStart}%`, background: "var(--app-pink-surface)" }}
        />
        <div
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full shadow"
          style={{ left: `calc(${markerX}% - 10px)`, background: "var(--app-pink)" }}
        />
      </div>
      <button type="button" onClick={shoot} className="app-primary-button mt-4 w-full max-w-[200px]">
        Shoot 🏀
      </button>
      <p className="mt-3 text-xs font-bold" style={{ color: "var(--app-muted)" }}>
        Score {score}
      </p>
      {feedback && (
        <p className="mt-1 text-sm font-bold" style={{ color: feedback === "hit" ? "var(--app-pink)" : "var(--app-dimmed)" }}>
          {feedback === "hit" ? "Swish! 🎉" : "Missed — try again"}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lucky Dice — tap to roll, tracks rolls and best streak.             */
/* ------------------------------------------------------------------ */

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function LuckyDice() {
  const [face, setFace] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [rolls, setRolls] = useState(0);
  const [best, setBest] = useState(0);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    let ticks = 0;
    const spin = setInterval(() => {
      setFace(Math.floor(Math.random() * 6));
      ticks += 1;
      if (ticks > 8) {
        clearInterval(spin);
        const result = Math.floor(Math.random() * 6);
        setFace(result);
        setRolling(false);
        setRolls((r) => r + 1);
        setBest((b) => Math.max(b, result + 1));
      }
    }, 60);
  };

  return (
    <div className="p-4 text-center">
      <motion.div
        key={face}
        initial={{ scale: 0.7, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.15 }}
        className="mx-auto mb-3 text-6xl"
        style={{ color: "var(--app-pink)" }}
      >
        {DICE_FACES[face]}
      </motion.div>
      <button type="button" onClick={roll} disabled={rolling} className="app-primary-button w-full max-w-[200px]">
        {rolling ? "Rolling..." : "Roll the dice 🎲"}
      </button>
      <p className="mt-3 text-xs font-bold" style={{ color: "var(--app-muted)" }}>
        Rolls {rolls} · Best {best}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reaction Test — wait for the panel to turn green, then tap fast.    */
/* ------------------------------------------------------------------ */

function ReactionTest() {
  const [status, setStatus] = useState<"idle" | "waiting" | "go" | "early" | "result">("idle");
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goAtRef = useRef(0);

  const start = () => {
    setStatus("waiting");
    setReactionMs(null);
    const delay = 1000 + Math.random() * 2000;
    timerRef.current = setTimeout(() => {
      goAtRef.current = performance.now();
      setStatus("go");
    }, delay);
  };

  const handleTap = () => {
    if (status === "idle" || status === "result" || status === "early") {
      start();
      return;
    }
    if (status === "waiting") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus("early");
      return;
    }
    if (status === "go") {
      const ms = Math.round(performance.now() - goAtRef.current);
      setReactionMs(ms);
      setBest((b) => (b === null ? ms : Math.min(b, ms)));
      setStatus("result");
    }
  };

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const bg =
    status === "go"
      ? "#34c759"
      : status === "early"
      ? "var(--app-danger)"
      : status === "waiting"
      ? "var(--app-card-alt)"
      : "var(--app-pink-surface)";

  const label =
    status === "idle"
      ? "Tap to start"
      : status === "waiting"
      ? "Wait for green..."
      : status === "go"
      ? "TAP NOW!"
      : status === "early"
      ? "Too soon! Tap to retry"
      : `${reactionMs} ms — tap to retry`;

  return (
    <div className="p-4 text-center">
      <button
        type="button"
        onClick={handleTap}
        className="mx-auto flex h-32 w-full max-w-[260px] items-center justify-center rounded-2xl text-sm font-extrabold transition-colors"
        style={{ background: bg, color: status === "go" ? "#ffffff" : "var(--app-text)" }}
      >
        {label}
      </button>
      {best !== null && (
        <p className="mt-3 text-xs font-bold" style={{ color: "var(--app-muted)" }}>
          Best reaction: {best} ms
        </p>
      )}
    </div>
  );
}
