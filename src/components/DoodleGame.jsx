import { useRef, useEffect, useState, useCallback } from 'react';

// ─── CONFIG ───
const GRAVITY = 0.22;
const JUMP_FORCE = -10;
const MOVE_SPEED = 7;
const PLAYER_W = 26;
const PLAYER_H = 26;
const PLAT_W = 100;
const PLAT_H = 12;
const PLAT_GAP_MIN = 18;
const PLAT_GAP_MAX = 35;
const BREAK_PLAT_CHANCE = 0;
const MOVE_PLAT_CHANCE = 0;
const LEADERBOARD_KEY = 'luisgaertner_doodle_lb';

// ─── COLORS (terminal theme) ───
const C = {
  bg: '#1a1b26',
  player: '#7dcfff',
  playerEye: '#1a1b26',
  platNormal: '#9ece6a',
  platMove: '#7aa2f7',
  platBreak: '#f7768e',
  platBreakCrack: '#ff9e64',
  text: '#c0caf5',
  dim: '#565f89',
  score: '#e0af68',
  cyan: '#7dcfff',
  green: '#9ece6a',
  red: '#f7768e',
  purple: '#bb9af7',
  stars: '#565f89',
};

function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
  } catch { return []; }
}

function saveLeaderboard(lb) {
  try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(lb)); } catch {}
}

export default function DoodleGame({ onExit, lang }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({ left: false, right: false });
  const [phase, setPhase] = useState('playing'); // 'playing' | 'gameover' | 'leaderboard'
  const [finalScore, setFinalScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState(getLeaderboard);
  const nameInputRef = useRef(null);

  // ─── GAME INIT ───
  const initGame = useCallback((canvas) => {
    const W = canvas.width;
    const H = canvas.height;

    // Generate background stars
    const stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 4,
      r: Math.random() * 1.5 + 0.5,
    }));

    const player = {
      x: W / 2 - PLAYER_W / 2,
      y: H - 100,
      vx: 0,
      vy: 0,
      w: PLAYER_W,
      h: PLAYER_H,
      dir: 1, // 1 = right, -1 = left
    };

    const platforms = [];
    // Starting platform right under the player
    platforms.push({
      x: W / 2 - PLAT_W / 2,
      y: H - 60,
      w: PLAT_W,
      h: PLAT_H,
      type: 'normal',
    });

    // Generate initial platforms upward
    let lastY = H - 60;
    while (lastY > -H) {
      lastY -= PLAT_GAP_MIN + Math.random() * (PLAT_GAP_MAX - PLAT_GAP_MIN);
      const type = Math.random() < BREAK_PLAT_CHANCE ? 'break'
        : Math.random() < MOVE_PLAT_CHANCE ? 'move' : 'normal';
      platforms.push({
        x: Math.random() * (W - PLAT_W),
        y: lastY,
        w: PLAT_W,
        h: PLAT_H,
        type,
        moveDir: type === 'move' ? (Math.random() < 0.5 ? 1 : -1) : 0,
        moveSpeed: type === 'move' ? 1 + Math.random() * 1.5 : 0,
        broken: false,
        breakTimer: 0,
      });
    }

    return {
      player,
      platforms,
      stars,
      camera: 0,
      score: 0,
      maxHeight: player.y,
      gameOver: false,
      W,
      H,
    };
  }, []);

  // ─── GAME LOOP ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Size canvas to parent
    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      if (!gameRef.current || gameRef.current.gameOver) {
        gameRef.current = initGame(canvas);
      }
    };
    resize();

    gameRef.current = initGame(canvas);
    let animId;

    const loop = () => {
      const g = gameRef.current;
      if (!g || g.gameOver) return;
      const { player: p, platforms, W, H } = g;

      // ── Input ──
      if (keysRef.current.left) { p.vx = -MOVE_SPEED; p.dir = -1; }
      else if (keysRef.current.right) { p.vx = MOVE_SPEED; p.dir = 1; }
      else { p.vx *= 0.85; if (Math.abs(p.vx) < 0.3) p.vx = 0; }

      // ── Physics ──
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;

      // Wrap horizontally
      if (p.x + p.w < 0) p.x = W;
      if (p.x > W) p.x = -p.w;

      // ── Platform collision (only when falling) ──
      if (p.vy > 0) {
        for (const plat of platforms) {
          if (plat.broken) continue;
          if (
            p.x + p.w > plat.x + 2 &&
            p.x < plat.x + plat.w - 2 &&
            p.y + p.h >= plat.y - 2 &&
            p.y + p.h <= plat.y + plat.h + p.vy + 4
          ) {
            if (plat.type === 'break') {
              plat.broken = true;
              plat.breakTimer = 12;
            } else {
              p.vy = JUMP_FORCE;
              p.y = plat.y - p.h;
            }
          }
        }
      }

      // ── Move platforms ──
      for (const plat of platforms) {
        if (plat.type === 'move' && !plat.broken) {
          plat.x += plat.moveDir * plat.moveSpeed;
          if (plat.x <= 0 || plat.x + plat.w >= W) plat.moveDir *= -1;
        }
        if (plat.broken && plat.breakTimer > 0) {
          plat.breakTimer--;
          plat.y += 3;
        }
      }

      // ── Camera — follow player upward, never scroll back down ──
      if (p.y < g.maxHeight) {
        g.maxHeight = p.y;
      }
      // Camera offset: how much to shift the world down so player stays at ~35% from top
      const desiredCamera = -(p.y - H * 0.35);
      if (desiredCamera > g.camera) {
        // Smooth follow upward
        g.camera += (desiredCamera - g.camera) * 0.15;
      }

      // Score
      g.score = Math.max(0, Math.floor(-g.maxHeight / 10));

      // ── Generate new platforms ──
      const topVisible = -g.camera - 200;
      const lowestGenerated = Math.min(...platforms.map(pl => pl.y));
      if (lowestGenerated > topVisible) {
        let y = lowestGenerated;
        while (y > topVisible - H) {
          // Difficulty ramps up slowly — first 300 pts are a cakewalk
          const raw = Math.max(0, g.score - 300);
          const difficulty = Math.min(raw / 3000, 0.6);
          const gap = PLAT_GAP_MIN + Math.random() * (PLAT_GAP_MAX - PLAT_GAP_MIN) + difficulty * 40;
          y -= gap;
          const breakChance = difficulty * 0.14;
          const moveChance = difficulty * 0.18;
          const type = Math.random() < breakChance ? 'break'
            : Math.random() < moveChance ? 'move' : 'normal';
          platforms.push({
            x: Math.random() * (W - PLAT_W),
            y,
            w: PLAT_W,
            h: PLAT_H,
            type,
            moveDir: type === 'move' ? (Math.random() < 0.5 ? 1 : -1) : 0,
            moveSpeed: type === 'move' ? 1 + Math.random() * 1.5 : 0,
            broken: false,
            breakTimer: 0,
          });
        }
      }

      // ── Cleanup far-below platforms ──
      const bottomLine = -g.camera + H + 200;
      g.platforms = platforms.filter(pl => pl.y < bottomLine);

      // ── Game over ──
      if (p.y > -g.camera + H + 50) {
        g.gameOver = true;
        setFinalScore(g.score);
        setPhase('gameover');
        return;
      }

      // ── RENDER ──
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // Stars parallax
      ctx.fillStyle = C.stars;
      for (const s of g.stars) {
        const sy = (s.y + g.camera * 0.3) % (H * 4);
        if (sy > -5 && sy < H + 5) {
          ctx.beginPath();
          ctx.arc(s.x, sy, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      ctx.translate(0, g.camera);

      // Platforms
      for (const plat of g.platforms) {
        if (plat.broken && plat.breakTimer <= 0) continue;
        const py = plat.y;
        if (py + g.camera < -20 || py + g.camera > H + 20) continue;

        ctx.fillStyle = plat.type === 'break' ? (plat.broken ? C.platBreakCrack : C.red)
          : plat.type === 'move' ? C.platMove
          : C.platNormal;

        // Rounded rectangle platform
        const r = 4;
        ctx.beginPath();
        ctx.moveTo(plat.x + r, plat.y);
        ctx.lineTo(plat.x + plat.w - r, plat.y);
        ctx.quadraticCurveTo(plat.x + plat.w, plat.y, plat.x + plat.w, plat.y + r);
        ctx.lineTo(plat.x + plat.w, plat.y + plat.h - r);
        ctx.quadraticCurveTo(plat.x + plat.w, plat.y + plat.h, plat.x + plat.w - r, plat.y + plat.h);
        ctx.lineTo(plat.x + r, plat.y + plat.h);
        ctx.quadraticCurveTo(plat.x, plat.y + plat.h, plat.x, plat.y + plat.h - r);
        ctx.lineTo(plat.x, plat.y + r);
        ctx.quadraticCurveTo(plat.x, plat.y, plat.x + r, plat.y);
        ctx.fill();

        // Cracks on break platforms
        if (plat.type === 'break' && !plat.broken) {
          ctx.strokeStyle = C.platBreakCrack;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(plat.x + plat.w * 0.3, plat.y + 2);
          ctx.lineTo(plat.x + plat.w * 0.4, plat.y + plat.h - 2);
          ctx.moveTo(plat.x + plat.w * 0.7, plat.y + 1);
          ctx.lineTo(plat.x + plat.w * 0.6, plat.y + plat.h - 1);
          ctx.stroke();
        }
      }

      // Player — cute doodle character
      const px = p.x;
      const py = p.y;

      // Body
      ctx.fillStyle = C.player;
      ctx.beginPath();
      ctx.ellipse(px + p.w / 2, py + p.h / 2, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      const eyeOffX = p.dir > 0 ? 4 : -4;
      ctx.fillStyle = C.playerEye;
      ctx.beginPath();
      ctx.arc(px + p.w / 2 + eyeOffX - 3, py + p.h * 0.38, 2.5, 0, Math.PI * 2);
      ctx.arc(px + p.w / 2 + eyeOffX + 3, py + p.h * 0.38, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Feet (when falling, stretch; when jumping, tuck)
      ctx.fillStyle = C.player;
      if (p.vy > 0) {
        // Falling — legs down
        ctx.fillRect(px + 5, py + p.h - 2, 4, 5);
        ctx.fillRect(px + p.w - 9, py + p.h - 2, 4, 5);
      }

      ctx.restore();

      // ── HUD ──
      ctx.font = 'bold 16px "JetBrains Mono", "Fira Code", monospace';
      ctx.fillStyle = C.score;
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${g.score}`, 14, 28);

      ctx.font = '11px "JetBrains Mono", "Fira Code", monospace';
      ctx.fillStyle = C.dim;
      ctx.textAlign = 'right';
      ctx.fillText('ESC → exit', W - 14, 24);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [initGame, phase]);

  // ─── KEY HANDLERS ───
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onExit?.();
        return;
      }
      if (phase === 'playing') {
        if (e.key === 'ArrowLeft') { keysRef.current.left = true; e.preventDefault(); }
        if (e.key === 'ArrowRight') { keysRef.current.right = true; e.preventDefault(); }
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'ArrowRight') keysRef.current.right = false;
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [phase, onExit]);

  // Focus name input on game over
  useEffect(() => {
    if (phase === 'gameover') {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [phase]);

  const submitScore = useCallback(() => {
    const name = playerName.trim() || 'Anonymous';
    const newEntry = { name, score: finalScore, date: new Date().toISOString().slice(0, 10) };
    const lb = [...getLeaderboard(), newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    saveLeaderboard(lb);
    setLeaderboard(lb);
    setPhase('leaderboard');
  }, [playerName, finalScore]);

  const restartGame = useCallback(() => {
    setPhase('playing');
    setPlayerName('');
    keysRef.current = { left: false, right: false };
    gameRef.current = null; // will re-init on next effect
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Game Canvas (always rendered for background) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {/* Game Over Overlay */}
      {phase === 'gameover' && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(26, 27, 38, 0.88)',
          zIndex: 10,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        }}>
          <div style={{ color: C.red, fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
            GAME OVER
          </div>
          <div style={{ color: C.score, fontSize: 20, marginBottom: 24 }}>
            Score: {finalScore}
          </div>
          <div style={{ color: C.dim, fontSize: 13, marginBottom: 8 }}>
            {lang === 'de' ? 'Name für Leaderboard:' : 'Name for leaderboard:'}
          </div>
          <input
            ref={nameInputRef}
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
            onKeyDown={(e) => { if (e.key === 'Enter') submitScore(); }}
            placeholder="visitor"
            maxLength={16}
            style={{
              background: 'transparent',
              border: `1px solid ${C.dim}`,
              borderRadius: 4,
              color: C.text,
              fontFamily: 'inherit',
              fontSize: 15,
              padding: '6px 14px',
              textAlign: 'center',
              outline: 'none',
              width: 200,
              marginBottom: 16,
              caretColor: C.green,
            }}
          />
          <button
            onClick={submitScore}
            style={{
              background: 'transparent',
              border: `1px solid ${C.green}`,
              borderRadius: 4,
              color: C.green,
              fontFamily: 'inherit',
              fontSize: 13,
              padding: '6px 20px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseOver={(e) => { e.target.style.background = 'rgba(158,206,106,0.12)'; }}
            onMouseOut={(e) => { e.target.style.background = 'transparent'; }}
          >
            {lang === 'de' ? 'Eintragen' : 'Submit'}
          </button>
        </div>
      )}

      {/* Leaderboard Overlay */}
      {phase === 'leaderboard' && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(26, 27, 38, 0.92)',
          zIndex: 10,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        }}>
          <div style={{ color: C.score, fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>
            {lang === 'de' ? '🏆 LEADERBOARD' : '🏆 LEADERBOARD'}
          </div>
          <div style={{
            width: 320,
            maxWidth: '90%',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: C.dim,
              fontSize: 11,
              marginBottom: 6,
              paddingBottom: 4,
              borderBottom: `1px solid ${C.dim}`,
            }}>
              <span style={{ width: 30 }}>#</span>
              <span style={{ flex: 1 }}>Name</span>
              <span style={{ width: 70, textAlign: 'right' }}>Score</span>
              <span style={{ width: 80, textAlign: 'right' }}>Date</span>
            </div>
            {leaderboard.length === 0 && (
              <div style={{ color: C.dim, fontSize: 12, textAlign: 'center', padding: 20 }}>
                {lang === 'de' ? 'Noch keine Einträge.' : 'No entries yet.'}
              </div>
            )}
            {leaderboard.map((entry, i) => {
              const isLatest = entry.score === finalScore && entry.name === (playerName.trim() || 'Anonymous');
              return (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  padding: '3px 0',
                  color: isLatest ? C.cyan : (i < 3 ? C.green : C.text),
                  background: isLatest ? 'rgba(125,207,255,0.06)' : 'transparent',
                  borderRadius: 3,
                }}>
                  <span style={{ width: 30, color: i < 3 ? C.score : C.dim }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ` ${i + 1}.`}
                  </span>
                  <span style={{ flex: 1 }}>{entry.name}</span>
                  <span style={{ width: 70, textAlign: 'right' }}>{entry.score}</span>
                  <span style={{ width: 80, textAlign: 'right', color: C.dim, fontSize: 11 }}>{entry.date}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              onClick={restartGame}
              style={{
                background: 'transparent',
                border: `1px solid ${C.green}`,
                borderRadius: 4,
                color: C.green,
                fontFamily: 'inherit',
                fontSize: 13,
                padding: '6px 20px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseOver={(e) => { e.target.style.background = 'rgba(158,206,106,0.12)'; }}
              onMouseOut={(e) => { e.target.style.background = 'transparent'; }}
            >
              {lang === 'de' ? 'Nochmal' : 'Play Again'}
            </button>
            <button
              onClick={() => onExit?.()}
              style={{
                background: 'transparent',
                border: `1px solid ${C.dim}`,
                borderRadius: 4,
                color: C.dim,
                fontFamily: 'inherit',
                fontSize: 13,
                padding: '6px 20px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseOver={(e) => { e.target.style.borderColor = C.red; e.target.style.color = C.red; }}
              onMouseOut={(e) => { e.target.style.borderColor = C.dim; e.target.style.color = C.dim; }}
            >
              ESC → Terminal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
