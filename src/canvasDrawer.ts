import { Bloon, Tower, Projectile, Part, FloatingText, GameMap, TargetMode } from './types';
import { getBloonStyle } from './gameData';

// Draw a map background, track path, and static decorations
export function drawMap(
  ctx: CanvasRenderingContext2D,
  map: GameMap,
  width: number,
  height: number
) {
  // 1. Draw overall ground background
  ctx.fillStyle = map.bgColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw static decorations (trees, lava pools, stars)
  map.decorations.forEach((dec) => {
    const rx = (dec.x / 1000) * width;
    const ry = (dec.y / 1000) * height;
    const rsize = (dec.size / 1000) * Math.min(width, height);

    ctx.save();
    if (dec.type === 'tree') {
      // Trunk
      ctx.fillStyle = '#78350f'; // brown-900
      ctx.fillRect(rx - rsize * 0.15, ry, rsize * 0.3, rsize * 0.8);
      // Leaves
      ctx.fillStyle = '#15803d'; // green-700
      ctx.beginPath();
      ctx.arc(rx, ry, rsize * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16a34a'; // green-600 (highlight)
      ctx.beginPath();
      ctx.arc(rx - rsize * 0.15, ry - rsize * 0.15, rsize * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (dec.type === 'cactus') {
      ctx.fillStyle = '#166534'; // green-800
      // Main body
      ctx.fillRect(rx - rsize * 0.2, ry - rsize, rsize * 0.4, rsize * 1.2);
      // Left arm
      ctx.fillRect(rx - rsize * 0.7, ry - rsize * 0.7, rsize * 0.5, rsize * 0.25);
      ctx.fillRect(rx - rsize * 0.7, ry - rsize * 1.0, rsize * 0.25, rsize * 0.4);
      // Right arm
      ctx.fillRect(rx + rsize * 0.2, ry - rsize * 0.5, rsize * 0.5, rsize * 0.25);
      ctx.fillRect(rx + rsize * 0.45, ry - rsize * 0.8, rsize * 0.25, rsize * 0.4);
    } else if (dec.type === 'rock') {
      ctx.fillStyle = '#78716c'; // stone-500
      ctx.beginPath();
      ctx.moveTo(rx - rsize, ry + rsize * 0.5);
      ctx.lineTo(rx - rsize * 0.5, ry - rsize * 0.5);
      ctx.lineTo(rx + rsize * 0.6, ry - rsize * 0.3);
      ctx.lineTo(rx + rsize, ry + rsize * 0.5);
      ctx.closePath();
      ctx.fill();
      // Rock highlight
      ctx.fillStyle = '#a8a29e';
      ctx.beginPath();
      ctx.moveTo(rx - rsize * 0.5, ry - rsize * 0.5);
      ctx.lineTo(rx + rsize * 0.1, ry - rsize * 0.4);
      ctx.lineTo(rx, ry);
      ctx.closePath();
      ctx.fill();
    } else if (dec.type === 'water') {
      ctx.fillStyle = '#0284c7'; // sky-600
      ctx.beginPath();
      ctx.arc(rx, ry, rsize, 0, Math.PI * 2);
      ctx.fill();
      // Wave lines
      ctx.strokeStyle = '#38bdf8'; // sky-400
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rx, ry, rsize * 0.7, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else if (dec.type === 'lava') {
      ctx.fillStyle = '#dc2626'; // red-600
      ctx.beginPath();
      ctx.arc(rx, ry, rsize, 0, Math.PI * 2);
      ctx.fill();
      // Glowing inner rings
      const glow = ctx.createRadialGradient(rx, ry, rsize * 0.2, rx, ry, rsize);
      glow.addColorStop(0, '#f97316'); // orange
      glow.addColorStop(0.6, '#dc2626'); // red
      glow.addColorStop(1, '#7c2d12'); // orange-900
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(rx, ry, rsize * 0.9, 0, Math.PI * 2);
      ctx.fill();
    } else if (dec.type === 'star') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rx, ry, rsize, 0, Math.PI * 2);
      ctx.fill();
    } else if (dec.type === 'crater') {
      ctx.fillStyle = '#312e81'; // dark crater indent
      ctx.beginPath();
      ctx.arc(rx, ry, rsize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4338ca'; // indigo border
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  });

  // 3. Draw Track (Curved visual paths looking stylish)
  const realTrackWidth = (map.trackWidth / 1000) * Math.min(width, height);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw track outer Border
  ctx.strokeStyle = map.borderColor;
  ctx.lineWidth = realTrackWidth + 8;
  ctx.beginPath();
  map.track.forEach((pt, idx) => {
    const rx = (pt.x / 1000) * width;
    const ry = (pt.y / 1000) * height;
    if (idx === 0) ctx.moveTo(rx, ry);
    else ctx.lineTo(rx, ry);
  });
  ctx.stroke();

  // Draw inner active track
  ctx.strokeStyle = map.trackColor;
  ctx.lineWidth = realTrackWidth;
  ctx.beginPath();
  map.track.forEach((pt, idx) => {
    const rx = (pt.x / 1000) * width;
    const ry = (pt.y / 1000) * height;
    if (idx === 0) ctx.moveTo(rx, ry);
    else ctx.lineTo(rx, ry);
  });
  ctx.stroke();

  // Draw decorative central dotted path lines (guiding visually)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  map.track.forEach((pt, idx) => {
    const rx = (pt.x / 1000) * width;
    const ry = (pt.y / 1000) * height;
    if (idx === 0) ctx.moveTo(rx, ry);
    else ctx.lineTo(rx, ry);
  });
  ctx.stroke();

  ctx.restore();
}

// Draw a single Bloon with correct offset scaling and speed indicators
export function drawBloon(
  ctx: CanvasRenderingContext2D,
  bloon: Bloon,
  canvasWidth: number,
  canvasHeight: number
) {
  const rx = (bloon.x / 1000) * canvasWidth;
  const ry = (bloon.y / 1000) * canvasHeight;
  const sizeMult = Math.min(canvasWidth, canvasHeight) / 1000;
  const bSize = bloon.size * sizeMult * 1.4;

  ctx.save();

  if (bloon.isMoab) {
    // RENDER MOAB CLASS SPECIAL HIGH-FIDELITY BLIMPS
    ctx.translate(rx, ry);
    
    // Wobble animation effect for flying blimps
    const waveWobble = Math.sin(Date.now() * 0.008) * 0.04;
    ctx.rotate(waveWobble);

    let blimpLength = bSize * 2.1;
    let blimpWidth = bSize * 1.35;
    let mainColor = '#0891b2'; // cyan-600
    let altColor = '#22d3ee'; // cyan-400
    let darkColor = '#155e75'; // cyan-800
    let finColor = '#ef4444'; // default red
    const type = bloon.type;

    if (type === 'BFB') {
      blimpLength = bSize * 2.3;
      blimpWidth = bSize * 1.48;
      mainColor = '#dc2626'; // Red body
      altColor = '#f87171';
      darkColor = '#7f1d1d';
      finColor = '#f59e0b'; // Gold fins
    } else if (type === 'ZOMG') {
      blimpLength = bSize * 2.65;
      blimpWidth = bSize * 1.68;
      mainColor = '#1e293b'; // Black/Slate body
      altColor = '#475569';
      darkColor = '#0f172a';
      finColor = '#22c55e'; // Green fins
    } else if (type === 'DDT') {
      blimpLength = bSize * 2.15;
      blimpWidth = bSize * 1.28;
      mainColor = '#1e293b'; // Charcoal body
      altColor = '#334155';
      darkColor = '#090d16';
      finColor = '#475569'; // Grey fins
    } else if (type === 'BAD') {
      blimpLength = bSize * 2.92;
      blimpWidth = bSize * 1.88;
      mainColor = '#7e22ce'; // Purple-rich body
      altColor = '#a855f7';
      darkColor = '#4c1d95';
      finColor = '#ec4899'; // Magenta/pink fins
    }

    // Tail Fins
    ctx.fillStyle = finColor;
    ctx.beginPath();
    ctx.moveTo(-blimpLength * 0.5, -blimpWidth * 0.35);
    ctx.lineTo(-blimpLength * 0.85, -blimpWidth * 0.82);
    ctx.lineTo(-blimpLength * 0.42, -blimpWidth * 0.22);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-blimpLength * 0.5, blimpWidth * 0.35);
    ctx.lineTo(-blimpLength * 0.85, blimpWidth * 0.82);
    ctx.lineTo(-blimpLength * 0.42, blimpWidth * 0.22);
    ctx.closePath();
    ctx.fill();

    // Main Balloon body
    const blimpGrad = ctx.createRadialGradient(
      blimpLength * 0.1, -blimpWidth * 0.2, blimpWidth * 0.2,
      0, 0, blimpLength * 0.65
    );
    blimpGrad.addColorStop(0, altColor);
    blimpGrad.addColorStop(0.65, mainColor);
    blimpGrad.addColorStop(1, darkColor);
    
    ctx.fillStyle = blimpGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, blimpLength * 0.65, blimpWidth * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Custom blimp specific graphics overlays
    if (type === 'ZOMG') {
      // Bold glowing green 'Z'
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-blimpLength * 0.2, -blimpWidth * 0.25);
      ctx.lineTo(blimpLength * 0.2, -blimpWidth * 0.25);
      ctx.lineTo(-blimpLength * 0.2, blimpWidth * 0.25);
      ctx.lineTo(blimpLength * 0.2, blimpWidth * 0.25);
      ctx.stroke();
    } else if (type === 'DDT') {
      // Tribal glowing cyber tech lines
      ctx.strokeStyle = '#38bdf8'; // sky blue glowing cyber lines
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, blimpLength * 0.35, blimpWidth * 0.22, 0, 0, Math.PI);
      ctx.stroke();
    } else if (type === 'BAD') {
      // Hot pink massive segmented iron bands
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, blimpLength * 0.38, blimpWidth * 0.48, 0, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, blimpLength * 0.18, blimpWidth * 0.48, 0, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
    } else {
      // Classic MOAB shark teeth lines / white belt
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, blimpLength * 0.3, blimpWidth * 0.5, 0, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
    }

    // Fortified heavy iron armor plating cage on blimps
    if (bloon.isFortified) {
      ctx.strokeStyle = '#78716c'; // cold stone/iron grey
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, blimpLength * 0.48, blimpWidth * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      // armor rivets
      ctx.fillStyle = '#cbd5e1';
      for (let i = 0; i < 8; i++) {
        const theta = (i * Math.PI) / 4;
        const bx = Math.cos(theta) * (blimpLength * 0.48);
        const by = Math.sin(theta) * (blimpWidth * 0.42);
        ctx.beginPath();
        ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Camo Stealth details on blimps
    if (bloon.isCamo || type === 'DDT') {
      ctx.strokeStyle = '#15803d'; // army tactical camo bands
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, blimpLength * 0.25, blimpWidth * 0.35, Math.PI / 4, 0, Math.PI);
      ctx.stroke();
    }

    // Pilot cockpit eye window
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(blimpLength * 0.3, -blimpWidth * 0.1, bSize * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = (type === 'DDT' || type === 'ZOMG') ? '#22c55e' : '#1e293b'; // green tech dashboard cockpit
    ctx.beginPath();
    ctx.arc(blimpLength * 0.32, -blimpWidth * 0.1, bSize * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Draw HP bar if hit
    if (bloon.hp < bloon.maxHp) {
      const barW = bSize * 2.2;
      const barH = 5;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-barW / 2, -blimpWidth * 0.8, barW, barH);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-barW / 2, -blimpWidth * 0.8, barW * (bloon.hp / bloon.maxHp), barH);
    }

  } else {
    // RENDER REGULAR BALLOON
    // Draw string knot dangling at bottom
    ctx.fillStyle = bloon.color;
    ctx.strokeStyle = bloon.color;
    ctx.lineWidth = 1.5;

    // Squiggly string line
    ctx.beginPath();
    ctx.moveTo(rx, ry + bSize);
    ctx.bezierCurveTo(rx - 5, ry + bSize + 8, rx + 5, ry + bSize + 14, rx, ry + bSize + 22);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();

    // Balloon triangle knot
    ctx.beginPath();
    ctx.moveTo(rx, ry + bSize * 0.8);
    ctx.lineTo(rx - bSize * 0.25, ry + bSize * 1.15);
    ctx.lineTo(rx + bSize * 0.25, ry + bSize * 1.15);
    ctx.closePath();
    ctx.fillStyle = bloon.color;
    ctx.fill();

    // Main balloon oval body shaders
    let balloonGradient: CanvasGradient;

    if (bloon.type === 'Zebra') {
      balloonGradient = ctx.createLinearGradient(rx - bSize, ry, rx + bSize, ry);
      balloonGradient.addColorStop(0, '#111827'); // dark black
      balloonGradient.addColorStop(0.18, '#111827');
      balloonGradient.addColorStop(0.2, '#ffffff'); // bright silver stripe
      balloonGradient.addColorStop(0.38, '#ffffff');
      balloonGradient.addColorStop(0.4, '#111827');
      balloonGradient.addColorStop(0.58, '#111827');
      balloonGradient.addColorStop(0.6, '#ffffff');
      balloonGradient.addColorStop(0.78, '#ffffff');
      balloonGradient.addColorStop(0.8, '#111827');
      balloonGradient.addColorStop(1.0, '#ffffff');
    } else if (bloon.type === 'Rainbow') {
      balloonGradient = ctx.createLinearGradient(rx, ry - bSize, rx, ry + bSize);
      balloonGradient.addColorStop(0.0, '#ef4444'); // red arc
      balloonGradient.addColorStop(0.22, '#f97316'); // orange arc
      balloonGradient.addColorStop(0.42, '#eab308'); // yellow arc
      balloonGradient.addColorStop(0.62, '#22c55e'); // green arc
      balloonGradient.addColorStop(0.82, '#3b82f6'); // blue arc
      balloonGradient.addColorStop(1.0, '#a855f7'); // purple arc
    } else if (bloon.type === 'Lead') {
      // Sleek iron gradient
      balloonGradient = ctx.createLinearGradient(rx - bSize, ry - bSize, rx + bSize, ry + bSize);
      balloonGradient.addColorStop(0, '#cbd5e1'); // silver glare highlight
      balloonGradient.addColorStop(0.25, '#64748b'); // cold gunmetal
      balloonGradient.addColorStop(0.5, '#cbd5e1'); // silver sheen
      balloonGradient.addColorStop(0.8, '#334155'); // iron core
      balloonGradient.addColorStop(1, '#0f172a');
    } else {
      balloonGradient = ctx.createRadialGradient(
        rx - bSize * 0.25,
        ry - bSize * 0.25,
        bSize * 0.1,
        rx,
        ry,
        bSize
      );
      balloonGradient.addColorStop(0, '#ffffff'); // bright shine point
      balloonGradient.addColorStop(0.2, bloon.color);
      // Darken edge for depth
      balloonGradient.addColorStop(1, adjustColorBrightness(bloon.color, -40));
    }

    ctx.fillStyle = balloonGradient;
    ctx.beginPath();
    ctx.ellipse(rx, ry, bSize * 0.85, bSize * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Camo military diagonal stripes on balloon if isCamo
    if (bloon.isCamo) {
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.75)'; // camouflage brown
      ctx.lineWidth = bSize * 0.2;
      ctx.beginPath();
      ctx.moveTo(rx - bSize * 0.5, ry + bSize * 0.3);
      ctx.lineTo(rx + bSize * 0.5, ry - bSize * 0.6);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(21, 128, 61, 0.75)'; // camouflage green
      ctx.lineWidth = bSize * 0.2;
      ctx.beginPath();
      ctx.moveTo(rx - bSize * 0.5, ry - bSize * 0.1);
      ctx.lineTo(rx + bSize * 0.5, ry + bSize * 0.8);
      ctx.stroke();
    }

    // Fortified heavy iron cage guard modifier on regular balloons
    if (bloon.isFortified) {
      ctx.strokeStyle = '#4b5563'; // real-grade iron gray cage
      ctx.lineWidth = 3.0;
      // horizontal rib
      ctx.beginPath();
      ctx.arc(rx, ry, bSize * 0.9, 0, Math.PI, true);
      ctx.stroke();
      // vertical rib
      ctx.beginPath();
      ctx.arc(rx, ry, bSize * 0.9, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      // metal bracket bolts
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(rx, ry - bSize * 0.9, 1.8, 0, Math.PI * 2);
      ctx.arc(rx, ry + bSize * 0.9, 1.8, 0, Math.PI * 2);
      ctx.arc(rx - bSize * 0.88, ry, 1.8, 0, Math.PI * 2);
      ctx.arc(rx + bSize * 0.88, ry, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Regrow vine foliage symbol heart inside regular balloons
    if (bloon.isRegrow) {
      ctx.fillStyle = '#22c55e'; // Vibrant regrow green heart symbol
      ctx.beginPath();
      const hx = rx;
      const hy = ry + bSize * 0.05;
      const d = bSize * 0.32;
      ctx.moveTo(hx, hy + d * 0.5);
      ctx.bezierCurveTo(hx - d, hy - d * 0.5, hx - d, hy - d * 1.5, hx, hy - d * 0.5);
      ctx.bezierCurveTo(hx + d, hy - d * 1.5, hx + d, hy - d * 0.5, hx, hy + d * 0.5);
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (bloon.isCeramic) {
      // Draw clay / stone mask on Ceramic bloons
      ctx.fillStyle = 'rgba(115, 115, 115, 0.85)'; // clay gray
      ctx.beginPath();
      ctx.ellipse(rx, ry, bSize * 0.65, bSize * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Crack lines
      ctx.strokeStyle = '#262626';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx - bSize * 0.4, ry - bSize * 0.2);
      ctx.lineTo(rx + bSize * 0.3, ry + bSize * 0.4);
      ctx.moveTo(rx - bSize * 0.2, ry + bSize * 0.3);
      ctx.lineTo(rx - bSize * 0.1, ry - bSize * 0.4);
      ctx.stroke();

      // Show Ceramic health bar
      if (bloon.hp < bloon.maxHp) {
        const barW = bSize * 1.5;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(rx - barW / 2, ry - bSize * 1.4, barW, 4);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(rx - barW / 2, ry - bSize * 1.4, barW * (bloon.hp / bloon.maxHp), 4);
      }
    }

    // High Gloss reflection spot (gives gorgeous BTD 3D arcade touch)
    if (bloon.type !== 'Lead' && bloon.type !== 'Zebra' && bloon.type !== 'Rainbow') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(rx - bSize * 0.32, ry - bSize * 0.42, bSize * 0.18, bSize * 0.12, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ice overlay freeze display
  if (bloon.isFrozen) {
    ctx.fillStyle = 'rgba(186, 230, 253, 0.55)'; // light transparent ice blue
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(rx, ry, bSize * 1.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw crack star
    ctx.beginPath();
    ctx.moveTo(rx - bSize * 0.8, ry);
    ctx.lineTo(rx + bSize * 0.8, ry);
    ctx.moveTo(rx, ry - bSize * 0.8);
    ctx.lineTo(rx, ry + bSize * 0.8);
    ctx.stroke();
  } else if (bloon.isSlowed) {
    // Draw sticky muddy drop trailing
    ctx.fillStyle = 'rgba(16, 185, 129, 0.4)'; // green goo
    ctx.beginPath();
    ctx.arc(rx, ry + bSize * 0.7, bSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Helper to darken colors for canvas painting
function adjustColorBrightness(hex: string, percent: number): string {
  // If not standard hex, return as is
  if (!hex.startsWith('#')) return hex;
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = Math.max(0, Math.min(255, R + percent));
  G = Math.max(0, Math.min(255, G + percent));
  B = Math.max(0, Math.min(255, B + percent));

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

// Draw Monkey Towers, target directions, and upgrades
export function drawTower(
  ctx: CanvasRenderingContext2D,
  tower: Tower,
  canvasWidth: number,
  canvasHeight: number,
  targetBloon?: Bloon
) {
  const rx = (tower.x / 1000) * canvasWidth;
  const ry = (tower.y / 1000) * canvasHeight;
  const minDim = Math.min(canvasWidth, canvasHeight);
  const sizeMult = minDim / 1000;
  const tSize = 18 * sizeMult * 1.35; // Size of monkey body

  ctx.save();

  // Find targeting angle
  let angle = 0;
  if (targetBloon) {
    const bx = (targetBloon.x / 1000) * canvasWidth;
    const by = (targetBloon.y / 1000) * canvasHeight;
    angle = Math.atan2(by - ry, bx - rx);
    tower.lastAngle = angle;
  } else if (tower.lastAngle !== undefined) {
    angle = tower.lastAngle;
  }

  // Draw Range ring if hovered/selected (implemented externally, but can draw accessories)
  ctx.translate(rx, ry);

  // 1. Draw monkey Base Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(0, tSize * 0.6, tSize * 1.1, tSize * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw Specific Monkey Spriting details
  if (tower.type === 'dart') {
    // Dart Monkey (Brown fur, green headband)
    ctx.rotate(angle);

    // Cute ears
    ctx.fillStyle = '#b45309'; // brown-700
    ctx.beginPath();
    ctx.arc(-tSize * 0.9, -tSize * 0.4, tSize * 0.35, 0, Math.PI * 2);
    ctx.arc(-tSize * 0.9, tSize * 0.4, tSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fca5a5'; // pink ear inner
    ctx.beginPath();
    ctx.arc(-tSize * 0.9, -tSize * 0.4, tSize * 0.18, 0, Math.PI * 2);
    ctx.arc(-tSize * 0.9, tSize * 0.4, tSize * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Body/fur
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(-tSize * 0.35, 0, tSize * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Monkey Face oval
    ctx.fillStyle = '#fecdd3'; // peach rose face skin
    ctx.beginPath();
    ctx.ellipse(tSize * 0.1, 0, tSize * 0.65, tSize * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tSize * 0.18, -tSize * 0.15, tSize * 0.14, 0, Math.PI * 2);
    ctx.arc(tSize * 0.18, tSize * 0.15, tSize * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(tSize * 0.22, -tSize * 0.15, tSize * 0.07, 0, Math.PI * 2);
    ctx.arc(tSize * 0.22, tSize * 0.15, tSize * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // Green Headband
    const upgCount = tower.upgradeLevels ? (tower.upgradeLevels[0] + tower.upgradeLevels[1] + tower.upgradeLevels[2]) : tower.upgradesPurchased;
    ctx.strokeStyle = upgCount >= 2 ? '#a855f7' : '#22c55e'; // purple/green depending on upgrades
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-tSize * 0.35, 0, tSize * 0.92, -Math.PI * 0.3, Math.PI * 0.3);
    ctx.stroke();

    // Hand holding Dart
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(tSize * 0.5, tSize * 0.6, tSize * 0.25, 0, Math.PI * 2);
    ctx.fill();
    // Tiny Dart vector
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tSize * 0.4, tSize * 0.6);
    ctx.lineTo(tSize * 0.9, tSize * 0.8);
    ctx.lineTo(tSize * 0.75, tSize * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  } else if (tower.type === 'tack') {
    // Tack shooter: Pink mechanical multi-launcher dome
    ctx.rotate(angle);
    ctx.fillStyle = '#ec4899'; // pink-500 dome
    ctx.beginPath();
    ctx.arc(0, 0, tSize * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#be185d'; // pink-700
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Center nozzle crystal structure
    ctx.fillStyle = '#fce7f3';
    ctx.beginPath();
    ctx.rect(-tSize * 0.3, -tSize * 0.3, tSize * 0.6, tSize * 0.6);
    ctx.fill();
    ctx.stroke();

    // Draw 8 tack launch ports around perimeter
    ctx.fillStyle = '#475569'; // steel color
    for (let i = 0; i < 8; i++) {
      const portAngle = (i * Math.PI) / 4;
      ctx.save();
      ctx.rotate(portAngle);
      ctx.fillRect(tSize * 0.95, -tSize * 0.15, tSize * 0.3, tSize * 0.3);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(tSize * 0.95, -tSize * 0.15, tSize * 0.3, tSize * 0.3);
      ctx.restore();
    }

  } else if (tower.type === 'sniper') {
    // Sniper Monkey (Camo headband or cap, long metallic rifle)
    ctx.rotate(angle);

    // Ears
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(-tSize * 0.8, -tSize * 0.4, tSize * 0.3, 0, Math.PI * 2);
    ctx.arc(-tSize * 0.8, tSize * 0.4, tSize * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Fur
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(-tSize * 0.3, 0, tSize * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Camouflage headband wrap
    ctx.fillStyle = '#15803d'; // forest green
    ctx.beginPath();
    ctx.arc(-tSize * 0.3, 0, tSize * 0.88, -0.6, 0.6);
    ctx.lineTo(-tSize * 0.2, 0);
    ctx.closePath();
    ctx.fill();

    // Monkey Face
    ctx.fillStyle = '#fecdd3';
    ctx.beginPath();
    ctx.ellipse(tSize * 0.05, 0, tSize * 0.6, tSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sniper Camo eyes goggles
    ctx.fillStyle = '#1e293b'; // dark shades
    ctx.fillRect(tSize * 0.05, -tSize * 0.32, tSize * 0.38, tSize * 0.22);
    ctx.fillRect(tSize * 0.05, tSize * 0.1, tSize * 0.38, tSize * 0.22);

    // LONG METALLIC SNIPER BARREL
    ctx.fillStyle = '#334155'; // gunmetal steel
    ctx.fillRect(tSize * 0.4, -tSize * 0.12, tSize * 1.6, tSize * 0.24);
    // Scope attachment
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tSize * 0.6, -tSize * 0.26, tSize * 0.5, tSize * 0.14);

  } else if (tower.type === 'bomb') {
    // Bomb shooter: Dark heavy mechanical cannon barrel, rotating
    ctx.rotate(angle);

    ctx.fillStyle = '#374151'; // dark carbon
    // Base platform rotating mount
    ctx.beginPath();
    ctx.arc(0, 0, tSize * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Heavy main cannon muzzle cylinder
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-tSize * 0.5, -tSize * 0.45, tSize * 1.5, tSize * 0.9);
    ctx.strokeRect(-tSize * 0.5, -tSize * 0.45, tSize * 1.5, tSize * 0.9);

    // Tip ring
    ctx.fillStyle = '#dc2626'; // bright red hazard rim
    ctx.fillRect(tSize * 0.95, -tSize * 0.48, tSize * 0.15, tSize * 0.96);

  } else if (tower.type === 'ice') {
    // Ice monkey: Cute light blue sparkly ice crown monkey
    // Face doesn't strictly need rotation angle since ice blast sweeps 360% in radius! Let's rotate gently with time
    const hoverWobble = Math.sin(Date.now() * 0.005) * 0.1;
    ctx.rotate(hoverWobble);

    // White furry body
    ctx.fillStyle = '#e0f2fe'; // sky-100 sparkly fur
    ctx.beginPath();
    ctx.arc(0, 0, tSize * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7dd3fc'; // sky-300
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Spiky icicles on head (Crown)
    ctx.fillStyle = '#38bdf8'; // blue ice spikes
    ctx.beginPath();
    ctx.moveTo(-tSize * 0.5, -tSize * 0.85);
    ctx.lineTo(-tSize * 0.2, -tSize * 1.3);
    ctx.lineTo(0, -tSize * 0.8);
    ctx.lineTo(tSize * 0.2, -tSize * 1.3);
    ctx.lineTo(tSize * 0.5, -tSize * 0.85);
    ctx.closePath();
    ctx.fill();

    // Face skin
    ctx.fillStyle = '#bfdbfe'; // icy blue skin
    ctx.beginPath();
    ctx.ellipse(0, tSize * 0.1, tSize * 0.65, tSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing frozen eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-tSize * 0.2, -tSize * 0.05, tSize * 0.12, 0, Math.PI * 2);
    ctx.arc(tSize * 0.2, -tSize * 0.05, tSize * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0284c7'; // deep ice blue pup
    ctx.beginPath();
    ctx.arc(-tSize * 0.2, -tSize * 0.05, tSize * 0.06, 0, Math.PI * 2);
    ctx.arc(tSize * 0.2, -tSize * 0.05, tSize * 0.06, 0, Math.PI * 2);
    ctx.fill();

  } else if (tower.type === 'super') {
    // Super monkey: Glowing yellow mask, grand red cape
    ctx.rotate(angle);

    // Render Cape pointing backwards
    ctx.fillStyle = '#dc2626'; // Imperial Red Cape
    ctx.beginPath();
    ctx.moveTo(-tSize * 0.5, -tSize * 0.3);
    ctx.lineTo(-tSize * 2.1, -tSize * 0.85);
    ctx.lineTo(-tSize * 1.7, 0);
    ctx.lineTo(-tSize * 2.1, tSize * 0.85);
    ctx.lineTo(-tSize * 0.5, tSize * 0.3);
    ctx.closePath();
    ctx.fill();

    // Dark brown/purple fur
    ctx.fillStyle = '#4c1d95'; // violet-900 fur
    ctx.beginPath();
    ctx.arc(-tSize * 0.3, 0, tSize * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // Super Hero Mask
    ctx.fillStyle = '#eab308'; // glowing gold super-hero mask
    ctx.beginPath();
    ctx.ellipse(tSize * 0.1, 0, tSize * 0.72, tSize * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing white energy eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tSize * 0.22, -tSize * 0.15, tSize * 0.15, 0, Math.PI * 2);
    ctx.arc(tSize * 0.22, tSize * 0.15, tSize * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Blue laser lines floating out of eyes
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tSize * 0.3, -tSize * 0.15);
    ctx.lineTo(tSize * 0.6, -tSize * 0.12);
    ctx.moveTo(tSize * 0.3, tSize * 0.15);
    ctx.lineTo(tSize * 0.6, tSize * 0.12);
    ctx.stroke();

  } else if (tower.type === 'hero') {
    // HERO TOWER GRAPHICS
    ctx.rotate(angle);

    // Base hero features
    if (tower.id.startsWith('hero_quincy') || tower.cost === 500) {
      // Quincy (Archer, Orange bow and hood)
      ctx.fillStyle = '#ca8a04'; // yellow-600 hood
      ctx.beginPath();
      ctx.arc(-tSize * 0.22, 0, tSize * 1.05, 0, Math.PI * 2);
      ctx.fill();

      // Face skin
      ctx.fillStyle = '#fdba74';
      ctx.beginPath();
      ctx.ellipse(tSize * 0.1, 0, tSize * 0.65, tSize * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye band
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(tSize * 0.08, -tSize * 0.35, tSize * 0.3, tSize * 0.7);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tSize * 0.2, -tSize * 0.1, tSize * 0.1, 0, Math.PI * 2);
      ctx.arc(tSize * 0.2, tSize * 0.1, tSize * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Giant Archer Bow pulled
      ctx.strokeStyle = '#ea580c'; // fiery orange wooden bow
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(tSize * 0.6, 0, tSize * 0.85, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();

      // String line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tSize * 0.26, -tSize * 0.75);
      ctx.lineTo(tSize * 0.25, tSize * 0.75);
      ctx.stroke();

    } else if (tower.id.startsWith('hero_gwendolin') || tower.cost === 750) {
      // Gwendolin (Fire mage, red-hot band, scientific flame gun)
      ctx.fillStyle = '#dc2626'; // red-600
      ctx.beginPath();
      ctx.arc(-tSize * 0.2, 0, tSize * 1.05, 0, Math.PI * 2);
      ctx.fill();

      // Fire yellow glow hair
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-tSize * 0.8, -tSize * 0.7);
      ctx.lineTo(-tSize * 1.25, 0);
      ctx.lineTo(-tSize * 0.8, tSize * 0.7);
      ctx.closePath();
      ctx.fill();

      // Face
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.ellipse(tSize * 0.1, 0, tSize * 0.65, tSize * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Fire sparkles in target direction
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(tSize * 0.85, -tSize * 0.15, tSize * 0.2, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // Obyn Greenfoot (Green woods aura, leafy cape)
      ctx.fillStyle = '#065f46'; // emerald-800 robe base
      ctx.beginPath();
      ctx.arc(-tSize * 0.2, 0, tSize * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Wooden mask details
      ctx.fillStyle = '#78350f'; // wood bark mask
      ctx.beginPath();
      ctx.ellipse(tSize * 0.1, 0, tSize * 0.7, tSize * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing mystical green eyes
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(tSize * 0.22, -tSize * 0.15, tSize * 0.12, 0, Math.PI * 2);
      ctx.arc(tSize * 0.22, tSize * 0.15, tSize * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (tower.type === 'boomerang') {
    // Boomerang Monkey (Cyan clothing, holding a curved boomerang)
    ctx.rotate(angle);
    ctx.fillStyle = '#b45309'; // Fur
    ctx.beginPath();
    ctx.arc(-tSize * 0.35, 0, tSize * 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#06b6d4'; // Cyan vest
    ctx.beginPath();
    ctx.arc(-tSize * 0.35, 0, tSize * 0.92, -0.5, 0.5);
    ctx.lineTo(-tSize * 0.3, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fecdd3'; // Peach Face
    ctx.beginPath();
    ctx.ellipse(tSize * 0.1, 0, tSize * 0.65, tSize * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blue headband
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(-tSize * 0.35, 0, tSize * 0.91, -Math.PI * 0.25, Math.PI * 0.25);
    ctx.stroke();

    // Hand holding a white boomerang
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(tSize * 0.35, tSize * 0.4);
    ctx.quadraticCurveTo(tSize * 0.8, tSize * 0.8, tSize * 0.9, tSize * 0.2);
    ctx.quadraticCurveTo(tSize * 0.7, tSize * 0.6, tSize * 0.35, tSize * 0.6);
    ctx.closePath();
    ctx.fill();

  } else if (tower.type === 'ninja') {
    // Ninja Monkey (Dark slate gray robes, red headband)
    ctx.rotate(angle);
    ctx.fillStyle = '#1e293b'; // Slate dark robes
    ctx.beginPath();
    ctx.arc(-tSize * 0.3, 0, tSize * 0.88, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444'; // Red headband tails behind it
    ctx.beginPath();
    ctx.moveTo(-tSize * 1.1, -tSize * 0.2);
    ctx.lineTo(-tSize * 1.5, -tSize * 0.4);
    ctx.lineTo(-tSize * 1.2, 0);
    ctx.lineTo(-tSize * 1.5, tSize * 0.4);
    ctx.lineTo(-tSize * 1.1, tSize * 0.2);
    ctx.closePath();
    ctx.fill();

    // Face cut-out mask
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-tSize * 0.2, -tSize * 0.4, tSize * 0.8, tSize * 0.8);
    ctx.fillStyle = '#fdba74'; // Peach skin eye strip
    ctx.fillRect(tSize * 0.1, -tSize * 0.2, tSize * 0.4, tSize * 0.4);

    // Glowing white eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tSize * 0.25, -tSize * 0.08, tSize * 0.08, 0, Math.PI * 2);
    ctx.arc(tSize * 0.25, tSize * 0.08, tSize * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Double/Bloonjitsu gives golden shuriken in hand
    const lv = tower.upgradeLevels || [0, 0, 0];
    if (lv[0] >= 3) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(tSize * 0.5, tSize * 0.5, tSize * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (tower.type === 'glue') {
    // Glue Gunner (Yellow protective hazmat suit/hood)
    ctx.rotate(angle);
    ctx.fillStyle = '#eab308'; // Bright yellow safety suit
    ctx.beginPath();
    ctx.arc(-tSize * 0.1, 0, tSize * 1.0, 0, Math.PI * 2);
    ctx.fill();

    // Glass visor
    ctx.fillStyle = '#38bdf8'; // Blue glass
    ctx.beginPath();
    ctx.ellipse(tSize * 0.28, 0, tSize * 0.4, tSize * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Glue hose weapon (Green nozzle)
    ctx.fillStyle = '#475569';
    ctx.fillRect(tSize * 0.4, tSize * 0.2, tSize * 0.7, tSize * 0.3);
    ctx.fillStyle = '#22c55e'; // Green lime glue tip
    ctx.fillRect(tSize * 1.05, tSize * 0.18, tSize * 0.15, tSize * 0.34);

  } else if (tower.type === 'wizard') {
    // Monkey Wizard (Arcane purple robes, gold star hat)
    ctx.rotate(angle);
    ctx.fillStyle = '#6d28d9'; // Arcane Purple robe
    ctx.beginPath();
    ctx.arc(-tSize * 0.2, 0, tSize * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // Gold star on robe
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-tSize * 0.2, tSize * 0.5, tSize * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Face skin
    ctx.fillStyle = '#fecdd3';
    ctx.beginPath();
    ctx.ellipse(tSize * 0.1, 0, tSize * 0.6, tSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Star pointed hat drawing
    ctx.fillStyle = '#4c1d95'; // Deep violet hat
    ctx.beginPath();
    ctx.moveTo(-tSize * 0.6, -tSize * 0.6);
    ctx.lineTo(-tSize * 1.45, 0); // pointing backwards
    ctx.lineTo(-tSize * 0.6, tSize * 0.6);
    ctx.closePath();
    ctx.fill();

    // Glowing magic aura hands
    ctx.fillStyle = '#60a5fa'; // Blue mana
    ctx.beginPath();
    ctx.arc(tSize * 0.52, -tSize * 0.35, tSize * 0.25, 0, Math.PI * 2);
    ctx.arc(tSize * 0.52, tSize * 0.35, tSize * 0.25, 0, Math.PI * 2);
    ctx.fill();

  } else if (tower.type === 'alchemist') {
    // Alchemist (Purple wizard-like coat, throwing beaker flask)
    ctx.rotate(angle);
    ctx.fillStyle = '#1e1b4b'; // Indigo coat
    ctx.beginPath();
    ctx.arc(-tSize * 0.2, 0, tSize * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // Face skin with gold glasses!
    ctx.fillStyle = '#fdba74';
    ctx.beginPath();
    ctx.ellipse(tSize * 0.08, 0, tSize * 0.65, tSize * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gold glasses frame
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(tSize * 0.25, -tSize * 0.18, tSize * 0.16, 0, Math.PI * 2);
    ctx.arc(tSize * 0.25, tSize * 0.18, tSize * 0.16, 0, Math.PI * 2);
    ctx.stroke();

    // Beaker potion flask in hand
    ctx.fillStyle = '#22c55e'; // bubbling lime green acid
    ctx.beginPath();
    ctx.arc(tSize * 0.55, tSize * 0.45, tSize * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff'; // glass neck
    ctx.fillRect(tSize * 0.45, tSize * 0.18, tSize * 0.2, tSize * 0.12);

  } else if (tower.type === 'druid') {
    // Druid (Brown fur, green leafy crown cloak, glowing nature yellow eyes)
    ctx.rotate(angle);
    ctx.fillStyle = '#15803d'; // Green foliage crown
    ctx.beginPath();
    ctx.arc(-tSize * 0.2, 0, tSize * 1.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350f'; // Dark woodsy fur
    ctx.beginPath();
    ctx.arc(-tSize * 0.3, 0, tSize * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Face skin
    ctx.fillStyle = '#fdba74';
    ctx.beginPath();
    ctx.ellipse(tSize * 0.05, 0, tSize * 0.6, tSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing nature yellow eyes
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(tSize * 0.18, -tSize * 0.12, tSize * 0.1, 0, Math.PI * 2);
    ctx.arc(tSize * 0.18, tSize * 0.12, tSize * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Branch thorn in hand
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tSize * 0.3, tSize * 0.4);
    ctx.lineTo(tSize * 0.75, tSize * 0.7);
    ctx.stroke();

  } else if (tower.type === 'farm') {
    // Banana Farm: A cute wooden Cabin/Barn with a yellow bunch of Bananas on top
    const wobble = Math.sin(Date.now() * 0.003) * 0.035;
    ctx.rotate(wobble);

    // Barn roof/structure
    ctx.fillStyle = '#b45309'; // brown wood walls
    ctx.fillRect(-tSize * 1.1, -tSize * 1.1, tSize * 2.2, tSize * 1.9);

    ctx.fillStyle = '#dc2626'; // cute red barn roof
    ctx.beginPath();
    ctx.moveTo(-tSize * 1.3, -tSize * 1.1);
    ctx.lineTo(0, -tSize * 1.85);
    ctx.lineTo(tSize * 1.3, -tSize * 1.1);
    ctx.closePath();
    ctx.fill();

    // Cute green tree shrub details around it
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(-tSize * 1.0, tSize * 0.6, tSize * 0.5, 0, Math.PI * 2);
    ctx.arc(tSize * 1.0, tSize * 0.6, tSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Sweet Banana bunch sign inside!
    ctx.fillStyle = '#facc15'; // banana bunch gold
    ctx.beginPath();
    ctx.arc(0, -tSize * 0.2, tSize * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

  } else if (tower.type === 'sub') {
    // Submarine: sleek yellow/blue capsule hull, a rotating periscope
    ctx.rotate(angle);
    ctx.fillStyle = '#0284c7'; // Sea blue water capsule
    ctx.beginPath();
    ctx.ellipse(0, 0, tSize * 1.6, tSize * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Sub hatch/window dome
    ctx.fillStyle = '#38bdf8'; // glossy sky-400 glass window
    ctx.beginPath();
    ctx.arc(tSize * 0.2, 0, tSize * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Sonar antenna/Periscope pointing towards target
    ctx.fillStyle = '#ef4444'; // red tip
    ctx.fillRect(-tSize * 0.6, -tSize * 0.15, tSize * 0.35, tSize * 0.3);

  } else if (tower.type === 'buccaneer') {
    // Buccaneer Ship: brown catamaran hull, white piracy sails, grape cannons
    ctx.rotate(angle);
    ctx.fillStyle = '#78350f'; // Dark ship deck wood
    ctx.beginPath();
    ctx.moveTo(-tSize * 1.6, -tSize * 0.85);
    ctx.lineTo(tSize * 1.5, 0); // Pointy bow
    ctx.lineTo(-tSize * 1.6, tSize * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // White Sail in the center
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(-tSize * 0.25, 0, tSize * 0.38, tSize * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pirate skull detail logo
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${Math.round(tSize * 0.4)}px sans-serif`;
    ctx.fillText('☠', -tSize * 0.25, 0);

  } else if (tower.type === 'pool') {
    // Portable Water Pool: a beautifully tiled blue circle filled with peaceful animated water ripples
    const pulseRadius = tSize * 1.6 + Math.sin(Date.now() * 0.003) * 2;
    ctx.fillStyle = '#0284c7'; // pool blue ocean water depth
    ctx.beginPath();
    ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Solid concrete gray tiled rim
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = tSize * 0.22;
    ctx.stroke();

    // Light blue water flow rings inside pool
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, pulseRadius * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, pulseRadius * 0.35, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Visual Level / Tier badge details in the corner of physical placement
  ctx.restore();
  ctx.save();
  ctx.translate(rx, ry);

  if (tower.type === 'hero') {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(tSize * 0.7, -tSize * 0.75, tSize * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(tSize * 0.55)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`H${tower.level}`, tSize * 0.7, -tSize * 0.75);
  } else {
    // Pill shape for 0-0-0 style text
    const lvls = tower.upgradeLevels || [0, 0, 0];
    const text = `${lvls[0]}-${lvls[1]}-${lvls[2]}`;
    ctx.fillStyle = '#1e293b';
    
    // Draw rounded rect
    const px = tSize * 0.25;
    const py = -tSize * 1.05;
    const pw = tSize * 1.1;
    const ph = tSize * 0.5;
    const radius = tSize * 0.15;
    
    ctx.beginPath();
    ctx.moveTo(px + radius, py);
    ctx.lineTo(px + pw - radius, py);
    ctx.quadraticCurveTo(px + pw, py, px + pw, py + radius);
    ctx.lineTo(px + pw, py + ph - radius);
    ctx.quadraticCurveTo(px + pw, py + ph, px + pw - radius, py + ph);
    ctx.lineTo(px + radius, py + ph);
    ctx.quadraticCurveTo(px, py + ph, px, py + ph - radius);
    ctx.lineTo(px, py + radius);
    ctx.quadraticCurveTo(px, py, px + radius, py);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#38bdf8'; // light blue border accent
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(tSize * 0.32)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, px + pw / 2, py + ph / 2);
  }

  ctx.restore();
}

// Draw bullets, darts and bomb animations
export function drawProjectile(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  canvasWidth: number,
  canvasHeight: number
) {
  const rx = (proj.x / 1000) * canvasWidth;
  const ry = (proj.y / 1000) * canvasHeight;
  const minDim = Math.min(canvasWidth, canvasHeight);
  const sizeMult = minDim / 1000;

  ctx.save();
  ctx.translate(rx, ry);

  // Rotate projectile facing velocity direction
  const angle = Math.atan2(proj.vy, proj.vx);
  ctx.rotate(angle);

  if (proj.type === 'dart') {
    // Wooden classic Dart with Red fletchings
    ctx.fillStyle = '#d97706'; // Wood shaft
    ctx.fillRect(-8, -1.5, 14, 3);
    // Red tail feathers
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-11, -3.5);
    ctx.lineTo(-5, -1.5);
    ctx.lineTo(-11, 0);
    ctx.lineTo(-5, 1.5);
    ctx.lineTo(-11, 3.5);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    // Silver tip
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(6, -2);
    ctx.lineTo(13, 0);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.fill();

  } else if (proj.type === 'tack') {
    // Silver pointed small metal tack
    ctx.fillStyle = '#94a3b8'; // silver gray
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo(8, 0);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    // Head of tack
    ctx.fillStyle = '#db2777';
    ctx.fillRect(-6, -3, 2, 6);

  } else if (proj.type === 'bomb') {
    // Matte-black circular cannonball with sparkling fuse trailing sparks
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fuse cord
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-3, -3);
    ctx.bezierCurveTo(-9, -9, -4, -14, -8, -18);
    ctx.stroke();

    // Little fuse sparkler
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-8, -18, 3, 0, Math.PI * 2);
    ctx.fill();

  } else if (proj.type === 'bullet') {
    // Ultra-fast golden metallic sniper round bullet
    ctx.fillStyle = '#fbbf24'; // gold slug
    ctx.fillRect(-10, -1.5, 16, 3);
    // Back glow wind-trail
    ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.fillRect(-22, -1, 12, 2);

  } else if (proj.type === 'beam') {
    // Super Monkey light rays plasma
    ctx.fillStyle = '#22d3ee'; // bright cyan plasma tube
    ctx.fillRect(-14, -3, 22, 6);
    ctx.fillStyle = '#ffffff'; // hot center
    ctx.fillRect(-10, -1.5, 15, 3);
    
    // Electric sparks around
    ctx.strokeStyle = '#a5f3fc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(12, -2);
    ctx.lineTo(6, 2);
    ctx.stroke();
  } else if (proj.type === 'boomerang') {
    // Rotating boomerang shape
    const rotTime = (Date.now() / 120);
    ctx.rotate(rotTime);
    ctx.strokeStyle = '#fca5a5'; // reddish wood
    ctx.fillStyle = '#f87171';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, -5);
    ctx.quadraticCurveTo(0, -14, 12, -4);
    ctx.quadraticCurveTo(0, -2, -10, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  } else if (proj.type === 'shuriken') {
    // Sharp rotating ninja star
    const rotTime = (Date.now() / 45);
    ctx.rotate(rotTime);
    ctx.fillStyle = '#94a3b8'; // silver
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.lineTo(0, -9);
      ctx.lineTo(2.5, -2.5);
    }
    ctx.closePath();
    ctx.fill();
    // Center point
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

  } else if (proj.type === 'glue') {
    // Gooey yellow acid glob
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.arc(-3, 1, 3, 0, Math.PI * 2);
    ctx.arc(2.5, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

  } else if (proj.type === 'magic') {
    // Glowing mystic mana ray
    ctx.fillStyle = '#a78bfa'; // violet
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e9d5ff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

  } else if (proj.type === 'potion') {
    // Bubble potion beaker
    ctx.fillStyle = '#a855f7'; // purple glass
    ctx.fillRect(-3, -7, 6, 4);
    ctx.fillStyle = '#22c55e'; // green liquid
    ctx.beginPath();
    ctx.arc(0, 2, 7, 0, Math.PI * 2);
    ctx.fill();

  } else if (proj.type === 'thorn') {
    // Wooden spike needle
    ctx.strokeStyle = '#854d0e'; // dark yellow wood
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();

  } else if (proj.type === 'grape') {
    // Purplish cluster shotgun grape pellet
    ctx.fillStyle = '#818cf8'; // indigo-purple grape
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    // Tiny white highlight dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-1.5, -1.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Particle system renderer for action packing
export function drawParticle(ctx: CanvasRenderingContext2D, part: Part, canvasWidth: number, canvasHeight: number) {
  const rx = (part.x / 1000) * canvasWidth;
  const ry = (part.y / 1000) * canvasHeight;
  const lifeRatio = part.life / part.maxLife;

  ctx.save();
  ctx.globalAlpha = lifeRatio;

  if (part.type === 'pop') {
    // Multi pointed direct popping blast vector
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.arc(rx, ry, part.size * (1 - lifeRatio + 0.3), 0, Math.PI * 2);
    ctx.fill();
  } else if (part.type === 'spark') {
    // Fiery burning orange ember particles
    ctx.fillStyle = part.color;
    ctx.fillRect(rx - part.size / 2, ry - part.size / 2, part.size, part.size);
  } else if (part.type === 'smoke') {
    // Expanding charcoal heavy explosive puff rings
    ctx.fillStyle = 'rgba(100, 116, 139, 0.7)'; // gray smoke
    ctx.beginPath();
    ctx.arc(rx, ry, part.size * (2 - lifeRatio), 0, Math.PI * 2);
    ctx.fill();
  } else if (part.type === 'ice') {
    // Glinting white diamond polygon frost shards
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, ry - part.size);
    ctx.lineTo(rx + part.size * 0.7, ry + part.size * 0.5);
    ctx.lineTo(rx - part.size * 0.7, ry + part.size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

// Floating cash displays and text indicators (+1, etc.)
export function drawFloatingText(ctx: CanvasRenderingContext2D, ft: FloatingText, canvasWidth: number, canvasHeight: number) {
  const rx = (ft.x / 1000) * canvasWidth;
  const ry = (ft.y / 1000) * canvasHeight;

  ctx.save();
  // Fade text based on remaining life ratio (max life 45 frames)
  ctx.globalAlpha = ft.life / 45;
  ctx.fillStyle = ft.color;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Apply dark text offset outline shadow for perfect pop readability
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 3.5;
  ctx.strokeText(ft.text, rx, ry);
  ctx.fillText(ft.text, rx, ry);

  ctx.restore();
}

// Highlight range indicator circles for placement security
export function drawRangeIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  range: number,
  isValid: boolean,
  canvasWidth: number,
  canvasHeight: number
) {
  const rx = (x / 1000) * canvasWidth;
  const ry = (y / 1000) * canvasHeight;
  const rMin = Math.min(canvasWidth, canvasHeight);
  const rRad = (range / 1000) * rMin;

  ctx.save();
  // Semi translucent circle
  ctx.fillStyle = isValid ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.25)';
  ctx.strokeStyle = isValid ? 'rgb(14, 165, 233)' : 'rgb(220, 38, 38)';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(rx, ry, rRad, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Add subtle outer rotating dashed grid borders for professional UI appearance
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  ctx.arc(rx, ry, rRad, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
