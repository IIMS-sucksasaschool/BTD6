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
    // RENDER MOAB BLIMP
    // Draw Cyan oval with fins
    ctx.translate(rx, ry);
    
    // Add horizontal wobbling for animation effect
    const waveWobble = Math.sin(Date.now() * 0.01) * 0.05;
    ctx.rotate(waveWobble);

    // Blimp body
    const blimpLength = bSize * 2.1;
    const blimpWidth = bSize * 1.35;

    // Tail Fins
    ctx.fillStyle = '#ef4444'; // Red fins
    ctx.beginPath();
    ctx.moveTo(-blimpLength * 0.5, -blimpWidth * 0.3);
    ctx.lineTo(-blimpLength * 0.8, -blimpWidth * 0.8);
    ctx.lineTo(-blimpLength * 0.4, -blimpWidth * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-blimpLength * 0.5, blimpWidth * 0.3);
    ctx.lineTo(-blimpLength * 0.8, blimpWidth * 0.8);
    ctx.lineTo(-blimpLength * 0.4, blimpWidth * 0.2);
    ctx.closePath();
    ctx.fill();

    // Main Blimp Balloon
    const blimpGrad = ctx.createRadialGradient(
      blimpLength * 0.1, -blimpWidth * 0.2, blimpWidth * 0.2,
      0, 0, blimpLength * 0.6
    );
    blimpGrad.addColorStop(0, '#22d3ee'); // light cyan-400
    blimpGrad.addColorStop(0.7, '#0891b2'); // cyan-600
    blimpGrad.addColorStop(1, '#155e75'); // cyan-800
    
    ctx.fillStyle = blimpGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, blimpLength * 0.65, blimpWidth * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Shark Stripes or outlines characteristic to MOAB
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, blimpLength * 0.3, blimpWidth * 0.5, 0, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();

    // Draw eye window
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(blimpLength * 0.3, -blimpWidth * 0.1, bSize * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
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

    // Main balloon oval body
    const balloonGradient = ctx.createRadialGradient(
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

    ctx.fillStyle = balloonGradient;
    ctx.beginPath();
    ctx.ellipse(rx, ry, bSize * 0.85, bSize * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();

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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(rx - bSize * 0.32, ry - bSize * 0.42, bSize * 0.18, bSize * 0.12, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
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
