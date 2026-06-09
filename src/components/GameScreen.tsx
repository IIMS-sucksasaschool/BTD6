import React, { useEffect, useRef, useState } from 'react';
import { GameMap, Tower, Bloon, Projectile, Part, FloatingText, Difficulty, TowerType, TargetMode } from '../types';
import { MAPS, TOWER_STATS, HEROES, getBloonStyle, getChildBloonType, getChildCount, generateWave } from '../gameData';
import {
  drawMap,
  drawBloon,
  drawTower,
  drawProjectile,
  drawParticle,
  drawFloatingText,
  drawRangeIndicator,
} from '../canvasDrawer';
import {
  playPop,
  playShoot,
  playSniperShoot,
  playExplosion,
  playIceFreeze,
  playLaserZap,
  playLevelUp,
  resumeAudio,
  toggleMute,
  getMuted,
} from '../audio';
import {
  Heart,
  Coins,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  ChevronUp,
  X,
  Clock,
  Settings,
  HelpCircle,
  TrendingUp,
  Sliders,
  DollarSign,
  Flame,
  Trophy,
} from 'lucide-react';

interface GameScreenProps {
  mapId: string;
  heroType: string;
  difficulty: Difficulty;
  gameMode: 'campaign' | 'endless';
  startingCashBonus: number;
  discountPercent: number;
  extraLivesBonus: number;
  heroXpRateBonus: number;
  onGameOver: (roundsCompleted: number, monkeyMoneyEarned: number, totalPopped: number) => void;
  onNavigateHome: () => void;
}

// Math Utility: Calculate shortest distance from point (px, py) to line segment (ax, ay) -> (bx, by)
function getDistanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) {
    return Math.hypot(px - ax, py - ay);
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  const nearestX = ax + t * dx;
  const nearestY = ay + t * dy;
  return Math.hypot(px - nearestX, py - nearestY);
}

export const GameScreen: React.FC<GameScreenProps> = ({
  mapId,
  heroType,
  difficulty,
  gameMode,
  startingCashBonus,
  discountPercent,
  extraLivesBonus,
  heroXpRateBonus,
  onGameOver,
  onNavigateHome,
}) => {
  const selectedMap = MAPS.find((m) => m.id === mapId) || MAPS[0];
  const heroConfig = HEROES.find((h) => h.id === heroType) || HEROES[0];

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Core Game State Variables
  const maxRounds = difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 60 : difficulty === 'Hard' ? 80 : 100;
  const victoryRewardsValue = difficulty === 'Easy' ? 150 : difficulty === 'Medium' ? 250 : difficulty === 'Hard' ? 350 : 500;

  // Get active upgrade cost with discount and difficulty multiplier
  const getUpgradeCost = (baseCost: number): number => {
    const actualDiscountPercent = difficulty === 'CHIMPS' ? 0 : discountPercent;
    const discounted = baseCost * (1 - actualDiscountPercent / 100);
    let factor = 1.0;
    if (difficulty === 'Easy') factor = 0.85;
    if (difficulty === 'Hard' || difficulty === 'CHIMPS') factor = 1.2;
    return Math.round(discounted * factor);
  };

  const [cash, setCash] = useState<number>(() => {
    let base = 650;
    if (difficulty === 'Easy') base = 850; // Easy gets more starting cash!
    if (difficulty === 'Medium') base = 650;
    if (difficulty === 'Hard') base = 650; // CHIMPS & Hard matches standard $650 starting cash
    if (difficulty === 'CHIMPS') base = 650;
    const actualStartingCashBonus = difficulty === 'CHIMPS' ? 0 : startingCashBonus;
    return base + actualStartingCashBonus;
  });

  const [lives, setLives] = useState<number>(() => {
    if (difficulty === 'CHIMPS') return 1; // 1 HP only (No Hearts Lost)
    let base = 150;
    if (difficulty === 'Easy') base = 200; // Easy gets 200 lives!
    if (difficulty === 'Medium') base = 150; // Medium gets 150 lives!
    if (difficulty === 'Hard') base = 100; // Hard gets 100 lives!
    const actualExtraLivesBonus = difficulty === 'CHIMPS' ? 0 : extraLivesBonus;
    return base + actualExtraLivesBonus;
  });

  const [round, setRound] = useState<number>(1);
  const [roundInProgress, setRoundInProgress] = useState<boolean>(false);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  
  // Infinite play & victory milestones
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [freePlayActive, setFreePlayActive] = useState<boolean>(false);

  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(getMuted());
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // Fast Forward multiplier: 1, 2, 3
  const [totalPopCount, setTotalPopCount] = useState<number>(0);

  // Selection & Placement States
  const [selectedShopTower, setSelectedShopTower] = useState<TowerType | null>(null);
  const [selectedPlacementTowerCost, setSelectedPlacementTowerCost] = useState<number>(0);
  const [selectedPlacedTowerId, setSelectedPlacedTowerId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Live mutable entities refs (to prevent reactivation re-renders and jitter in high-frequency anims)
  const towersRef = useRef<Tower[]>([]);
  const bloonsRef = useRef<Bloon[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Part[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // Wave spawn queues
  const spawnQueueRef = useRef<{ delay: number; type: string }[]>([]);
  const spawnTimerRef = useRef<number>(0);

  // Monkey pop counter updates mapping (for active pop-count panels syncing)
  const [triggerPopCountUpdate, setTriggerPopCountUpdate] = useState<number>(0);

  // Game active state loop key
  const [isGameOverOrFinished, setIsGameOverOrFinished] = useState<boolean>(false);

  // Handle resizing accurately
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Get active tower cost with discount applied
  const getTowerCost = (type: TowerType): number => {
    if (type === 'hero') return heroConfig.baseCost;
    const base = TOWER_STATS[type].cost;
    const actualDiscountPercent = difficulty === 'CHIMPS' ? 0 : discountPercent;
    const discounted = base * (1 - actualDiscountPercent / 100);
    // Easy: 15% off, Medium: 1.0, Hard/CHIMPS: 1.2x
    let factor = 1.0;
    if (difficulty === 'Easy') factor = 0.85;
    if (difficulty === 'Hard' || difficulty === 'CHIMPS') factor = 1.2;
    return Math.round(discounted * factor);
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    window.addEventListener('resize', handleResize);
    // Trigger initially
    setTimeout(handleResize, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync volume controller
  const handleToggleMute = () => {
    const state = toggleMute();
    setIsAudioMuted(state);
  };

  // Check Placement legality (distance from track logic)
  const checkPlacementValidity = (x: number, y: number): boolean => {
    // 1. Boundaries check (out of normalized map space)
    if (x < 35 || x > 965 || y < 35 || y > 965) return false;

    // 2. Track Collision Check
    for (let i = 0; i < selectedMap.track.length - 1; i++) {
      const ax = selectedMap.track[i].x;
      const ay = selectedMap.track[i].y;
      const bx = selectedMap.track[i + 1].x;
      const by = selectedMap.track[i + 1].y;

      const trackDist = getDistanceToSegment(x, y, ax, ay, bx, by);
      // Track width margin check is track width + padding clearance
      if (trackDist < selectedMap.trackWidth + 18) {
        return false;
      }
    }

    // 3. Overlap with existing towers
    for (const t of towersRef.current) {
      const dist = Math.hypot(t.x - x, t.y - y);
      if (dist < 35) {
        return false;
      }
    }

    // 4. Decoration blockages
    for (const dec of selectedMap.decorations) {
      if (dec.type === 'lava' || dec.type === 'water') {
        const dist = Math.hypot(dec.x - x, dec.y - y);
        if (dist < dec.size + 15) {
          return false;
        }
      }
    }

    return true;
  };

  // Trigger Spawning round mechanism
  const startRound = () => {
    if (roundInProgress) return;
    resumeAudio();

    // Compile spawn sequences procedurally mimicking real rounds
    const seq = generateWave(round);
    spawnQueueRef.current = seq;
    spawnTimerRef.current = 0;

    setRoundInProgress(true);
  };

  // Place a Monkey
  const handlePlacementClick = () => {
    if (!selectedShopTower) return;
    if (!checkPlacementValidity(mousePos.x, mousePos.y)) return;

    const actualCost = getTowerCost(selectedShopTower);
    if (cash < actualCost) return;

    // If attempting hero placement, verify limit 1 hero per arena
    if (selectedShopTower === 'hero') {
      const alreadyHasHero = towersRef.current.some((t) => t.type === 'hero');
      if (alreadyHasHero) {
        alert('You can only deploy exactly one command Hero per match!');
        setSelectedShopTower(null);
        return;
      }
    }

    // Place tower
    const newTower: Tower = {
      id: `${selectedShopTower}_${Date.now()}`,
      type: selectedShopTower,
      x: mousePos.x,
      y: mousePos.y,
      range: selectedShopTower === 'hero' ? 140 : TOWER_STATS[selectedShopTower].baseRange,
      baseCooldown: selectedShopTower === 'hero' ? 45 : TOWER_STATS[selectedShopTower].baseCooldown,
      cooldown: 0,
      damage: 1,
      pierce: selectedShopTower === 'tack' ? 1 : 2,
      cost: actualCost,
      popCount: 0,
      targetMode: 'First',
      level: 1,
      upgradeLevels: [0, 0, 0],
      upgradeIndex: 0,
      upgradesPurchased: 0,
    };

    towersRef.current.push(newTower);
    setCash((prev) => prev - actualCost);
    setSelectedShopTower(null);
    playShoot(); // nice responsive validation sound!

    // Immediately select placed tower
    setSelectedPlacedTowerId(newTower.id);

    // Achievements evaluation: check super monkey placed
    if (selectedShopTower === 'super') {
      assessAchievementProgress('buy_super', 1);
    }
  };

  // Canvas Mouse trackers
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const computedX = ((e.clientX - rect.left) / rect.width) * 1000;
    const computedY = ((e.clientY - rect.top) / rect.height) * 1000;

    setMousePos({ x: Math.round(computedX), y: Math.round(computedY) });
  };

  const handleCanvasMouseLeave = () => {
    setMousePos({ x: -1000, y: -1000 });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If shop placement mode, buy
    if (selectedShopTower) {
      handlePlacementClick();
      return;
    }

    // Otherwise, check if clicking on any placed tower to inspect
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 1000;
    const cy = ((e.clientY - rect.top) / rect.height) * 1000;

    let clickedTowerId: string | null = null;
    for (const t of towersRef.current) {
      const dist = Math.hypot(t.x - cx, t.y - cy);
      if (dist < 32) {
        clickedTowerId = t.id;
        break;
      }
    }

    setSelectedPlacedTowerId(clickedTowerId);
  };

  // Achievements progression handler
  const assessAchievementProgress = (achId: string, increment: number) => {
    // Read from local storage
    try {
      const saved = localStorage.getItem('btd_achievements');
      if (saved) {
        const achs = JSON.parse(saved);
        const item = achs.find((a: any) => a.id === achId);
        if (item && !item.isUnlocked) {
          item.progress = Math.min(item.maxProgress, item.progress + increment);
          localStorage.setItem('btd_achievements', JSON.stringify(achs));
        }
      }
    } catch (e) {}
  };

  // Leveling up Heroes / Monkey upgrades triggered inside UI
  const upgradeTower = (tower: Tower, pathIndex?: number) => {
    if (tower.type === 'hero') {
      // Manual hero training leveling costs cash, boosts range and attack speeds
      const lvCost = Math.round(250 * tower.level * 1.2);
      if (cash < lvCost) return;

      setCash((prev) => prev - lvCost);
      tower.level += 1;
      tower.range += 12;
      tower.baseCooldown = Math.max(15, tower.baseCooldown * 0.92);
      tower.popCount += 0; // Trigger redraw

      // Dynamic perk descriptions matching perks definition
      playLevelUp();
      setTriggerPopCountUpdate((t) => t + 1);
      return;
    }

    if (pathIndex === undefined) return;

    // Standard monkey upgrades
    const spec = TOWER_STATS[tower.type];
    const lvls = tower.upgradeLevels || [0, 0, 0];
    const currentLvl = lvls[pathIndex];
    if (currentLvl >= 5) return; // already maxed this path

    // Check rules
    // Rule 1: max 2 paths can be non-zero
    const activePaths = lvls.filter((l) => l > 0).length;
    if (currentLvl === 0 && activePaths >= 2) {
      return; // third path locked
    }
    // Rule 2: only 1 path can go above level 2 (reach 3, 4, 5)
    if (currentLvl === 2) {
      const hasOtherPathAbove2 = lvls.some((l, idx) => idx !== pathIndex && l >= 3);
      if (hasOtherPathAbove2) {
        return; // capped at 2 because another path is primary
      }
    }

    const upg = spec.upgrades[pathIndex][currentLvl];
    if (!upg) return;

    const finalUpgradeCost = getUpgradeCost(upg.cost);
    if (cash < finalUpgradeCost) return;

    setCash((prev) => prev - finalUpgradeCost);
    
    // Update levels
    const nextLevels = [...lvls] as [number, number, number];
    nextLevels[pathIndex] += 1;
    tower.upgradeLevels = nextLevels;
    
    // Compute total upgrades purchased
    tower.upgradesPurchased = nextLevels[0] + nextLevels[1] + nextLevels[2];
    tower.cost += finalUpgradeCost; // Add to cost of the tower for sells

    // Apply upgrade effects
    if (upg.effects.range) tower.range += upg.effects.range;
    if (upg.effects.cooldownMult) tower.baseCooldown *= upg.effects.cooldownMult;
    if (upg.effects.damage) tower.damage += upg.effects.damage;
    if (upg.effects.pierce) tower.pierce += upg.effects.pierce;

    playLevelUp();
    setTriggerPopCountUpdate((t) => t + 1);
  };

  // Sell visual Tower
  const sellTower = (tower: Tower) => {
    if (difficulty === 'CHIMPS') return;
    const refundValue = Math.round(tower.cost * 0.72);
    setCash((prev) => prev + refundValue);
    towersRef.current = towersRef.current.filter((t) => t.id !== tower.id);
    setSelectedPlacedTowerId(null);
    playPop();
  };

  // Main Loop Handler using Canvas ticks
  useEffect(() => {
    let animationFrameId: number;
    let framesCounter = 0;

    const gameTick = () => {
      const canvas = canvasRef.current;
      if (!canvas || isGameOverOrFinished) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Ensure clear draw cycles
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Fast forward speed loops are computed by repeating update loops inside each single frames loop!
      // This increases performance without lag!
      const loopsRatio = speedMultiplier;

      for (let step = 0; step < loopsRatio; step++) {
        // --- SECTION A: SPAWNING BLOCKS ---
        if (roundInProgress) {
          if (spawnQueueRef.current.length > 0) {
            spawnTimerRef.current -= 1;
            if (spawnTimerRef.current <= 0) {
              const item = spawnQueueRef.current.shift();
              if (item) {
                // Instantiating a new Bloon setup on path segment coordinate index zero
                const spec = getBloonStyle(item.type as any);
                const pathStart = selectedMap.track[0];

                let speedMultiplierByDiff = 1.0;
                if (difficulty === 'Easy') speedMultiplierByDiff = 0.85;
                else if (difficulty === 'Hard' || difficulty === 'CHIMPS') speedMultiplierByDiff = 1.15;

                const inst: Bloon = {
                  id: `bloon_${Date.now()}_${Math.random()}`,
                  type: item.type as any,
                  x: pathStart.x,
                  y: pathStart.y,
                  speed: spec.speed * speedMultiplierByDiff,
                  hp: spec.hp,
                  maxHp: spec.hp,
                  size: spec.size,
                  color: spec.color,
                  reward: spec.reward,
                  distanceTraversed: 0,
                  pathSegmentIndex: 0,
                  segmentProgress: 0,
                  isFrozen: false,
                  freezeTimer: 0,
                  isSlowed: false,
                  slowTimer: 0,
                  isCeramic: item.type === 'Ceramic',
                  isMoab: item.type === 'MOAB',
                };

                bloonsRef.current.push(inst);
                spawnTimerRef.current = item.delay;
              }
            }
          } else {
            // Check if all bloons are dead to close the round successfully!
            if (bloonsRef.current.length === 0) {
              setRoundInProgress(false);
              // Give bonus Round end Cash!
              const bonus = difficulty === 'CHIMPS' ? 0 : 100 + round * 10;
              if (bonus > 0) {
                setCash((prev) => prev + bonus);
              }
              // Float text end round
              floatingTextsRef.current.push({
                id: `ft_end_${Date.now()}`,
                x: 500,
                y: 500,
                text: difficulty === 'CHIMPS' ? `Wave ${round} Complete!` : `Round Completed! Bonus +$${bonus}`,
                color: '#10b981', // Clean Emerald Green
                life: 60,
              });

              assessmentRoundCompletes(round);

              // Campaign ends at maxRounds; if completed, trigger victory dialog before transitioning to free play
              if (round === maxRounds && gameMode === 'campaign' && !freePlayActive) {
                setShowVictoryModal(true);
              } else {
                setRound((r) => r + 1);
              }
            }
          }
        }

        // --- SECTION B: UPDATE ACTIVE BLOONS ---
        for (let bIdx = bloonsRef.current.length - 1; bIdx >= 0; bIdx--) {
          const b = bloonsRef.current[bIdx];

          // Slow/freeze decrementers
          if (b.isFrozen) {
            b.freezeTimer -= 1;
            if (b.freezeTimer <= 0) {
              b.isFrozen = false;
            }
          }

          if (b.isSlowed) {
            b.slowTimer -= 1;
            if (b.slowTimer <= 0) {
              b.isSlowed = false;
            }
          }

          // Compute Speed mod
          let activeSpeed = b.speed;
          if (b.isFrozen) activeSpeed = 0.0;
          else if (b.isSlowed) activeSpeed *= 0.5;

          // Hero Obyn Greenfoot nature passive slowing card check (level 5 Obyn perk)
          const obynTower = towersRef.current.find((t) => t.type === 'hero' && t.level >= 5);
          if (obynTower && (b.type === 'Yellow' || b.type === 'Pink')) {
            const rangeDist = Math.hypot(b.x - obynTower.x, b.y - obynTower.y);
            if (rangeDist < obynTower.range) {
              activeSpeed *= 0.75; // slow fast guys down
            }
          }

          // Advance Bloon along the segments coordinate index path list
          const nextSegmentIdx = b.pathSegmentIndex + 1;
          if (nextSegmentIdx < selectedMap.track.length) {
            const startPt = selectedMap.track[b.pathSegmentIndex];
            const endPt = selectedMap.track[nextSegmentIdx];
            const segmentDist = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y);

            // Increment segment progress float
            const stepRatio = activeSpeed / segmentDist;
            b.segmentProgress += stepRatio;
            b.distanceTraversed += activeSpeed;

            if (b.segmentProgress >= 1.0) {
              b.pathSegmentIndex = nextSegmentIdx;
              b.segmentProgress = 0.0;
            } else {
              b.x = startPt.x + b.segmentProgress * (endPt.x - startPt.x);
              b.y = startPt.y + b.segmentProgress * (endPt.y - startPt.y);
            }
          } else {
            // Leakage! Bloon has fully traversed the track list and escaped
            const leakDamage = b.isMoab ? 40 : b.maxHp;
            setLives((curr) => {
              const remaining = curr - leakDamage;
              if (remaining <= 0) {
                // Defeat triggered!
                setIsGameOverOrFinished(true);
                assessAchievementProgress('round_40', round); // track round max on fail as progress
                onGameOver(round - 1, Math.min(600, round * 12), totalPopCount);
                return 0;
              }
              return remaining;
            });

            // Splat sound on leak
            playExplosion();

            // Screen leakage prompt text
            floatingTextsRef.current.push({
              id: `leak_${Date.now()}_${Math.random()}`,
              x: 500,
              y: 500,
              text: `-${leakDamage} Shield Leak!`,
              color: '#f87171',
              life: 45,
            });

            // Eliminate bloon from tracking list
            bloonsRef.current.splice(bIdx, 1);
          }
        }

        // --- SECTION C: PROJECTILES & TOWER SHOOTING TRACKS ---
        towersRef.current.forEach((t) => {
          if (t.cooldown > 0) {
            t.cooldown -= 1;
          }

          // Look for targets based on targeting configurations (Close, First, Last, Strong)
          const inRangeBloons = bloonsRef.current.filter((b) => {
            const dist = Math.hypot(b.x - t.x, b.y - t.y);
            return dist < t.range;
          });

          if (inRangeBloons.length === 0) return;

          // Perform targeting calculations
          let target: Bloon | undefined = undefined;
          if (t.targetMode === 'First') {
            // Sort by traversed distance descending
            inRangeBloons.sort((a, b) => b.distanceTraversed - a.distanceTraversed);
            target = inRangeBloons[0];
          } else if (t.targetMode === 'Last') {
            inRangeBloons.sort((a, b) => a.distanceTraversed - b.distanceTraversed);
            target = inRangeBloons[0];
          } else if (t.targetMode === 'Strong') {
            // HP descending, then distance traversed descending
            inRangeBloons.sort((a, b) => b.hp - a.hp || b.distanceTraversed - a.distanceTraversed);
            target = inRangeBloons[0];
          } else if (t.targetMode === 'Close') {
            // Distance to tower ascending
            inRangeBloons.sort((a, b) => {
              const dA = Math.hypot(a.x - t.x, a.y - t.y);
              const dB = Math.hypot(b.x - t.x, b.y - t.y);
              return dA - dB;
            });
            target = inRangeBloons[0];
          }

          if (!target) return;

          // Shoot projectile if cooldown clears!
          if (t.cooldown <= 0) {
            const targetX = target.x;
            const targetY = target.y;
            const dx = targetX - t.x;
            const dy = targetY - t.y;
            const angle = Math.atan2(dy, dx);

            // Special Sniper logic: Instantly hit target (no projectile delay!)
            if (t.type === 'sniper') {
              playSniperShoot();
              damageAndPopBloon(target, t.damage, t);
              // Cripple shot slow
              const upgL = t.upgradesPurchased;
              if (upgL >= 3) {
                target.isSlowed = true;
                target.slowTimer = 180; // 3 seconds freeze duration
              }
              t.cooldown = t.baseCooldown;
              return;
            }

            // Tack shooters emit 8 tacks outwards simultaneously!
            if (t.type === 'tack') {
              playShoot();
              for (let i = 0; i < 8; i++) {
                const tackAngle = (i * Math.PI) / 4;
                projectilesRef.current.push({
                  id: `tack_${Date.now()}_${Math.random()}`,
                  type: 'tack',
                  x: t.x,
                  y: t.y,
                  vx: Math.cos(tackAngle) * 5,
                  vy: Math.sin(tackAngle) * 5,
                  speed: 5,
                  damage: t.damage,
                  pierce: t.pierce,
                  rangeRemaining: t.range,
                });
              }
              t.cooldown = t.baseCooldown;
              return;
            }

            // Ice freeze creates an immediate 360% range freezing blast wave!
            if (t.type === 'ice') {
              playIceFreeze();
              inRangeBloons.forEach((b) => {
                b.isFrozen = true;
                const freezeBonus = t.upgradesPurchased >= 2 ? 80 : 45;
                b.freezeTimer = freezeBonus;
                // Deal tick damage if cryo-charged (T3 upgrade)
                if (t.upgradesPurchased >= 3) {
                  damageAndPopBloon(b, t.damage, t);
                }
              });

              // Create frost waves glowing particles expansion
              for (let angle = 0; angle < Math.PI * 2; angle += 0.45) {
                particlesRef.current.push({
                  x: t.x,
                  y: t.y,
                  vx: Math.cos(angle) * 3.5,
                  vy: Math.sin(angle) * 3.5,
                  color: '#e0f2fe',
                  life: 15,
                  maxLife: 15,
                  size: 4,
                  type: 'ice',
                });
              }

              t.cooldown = t.baseCooldown;
              return;
            }

            // Standard Bullet Dart, Bombs, or Super Energy beams
            let projectileType: 'dart' | 'bomb' | 'beam' = 'dart';
            let speed = 7.5;
            if (t.type === 'bomb') {
              projectileType = 'bomb';
              speed = 5;
            } else if (t.type === 'super') {
              projectileType = 'beam';
              speed = 10;
              playLaserZap();
            } else {
              playShoot();
            }

            // Hero Quincy bow projectile is dart, Obyn or Gwendolin customized
            if (t.type === 'hero' && heroConfig.id === 'gwendolin') {
              projectileType = 'bomb'; // fire explosion
              playShoot();
            }

            projectilesRef.current.push({
              id: `proj_${Date.now()}_${Math.random()}`,
              type: projectileType,
              x: t.x,
              y: t.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              speed,
              damage: t.damage,
              pierce: t.pierce,
              splashRadius: t.type === 'bomb' ? 65 : undefined,
              rangeRemaining: t.range,
            });

            t.cooldown = t.baseCooldown;
          }
        });

        // --- SECTION D: MOVE & COLLIDE ACTIVE PROJECTILES ---
        for (let pIdx = projectilesRef.current.length - 1; pIdx >= 0; pIdx--) {
          const p = projectilesRef.current[pIdx];

          // Advance projectile coordinate velocities
          p.x += p.vx;
          p.y += p.vy;
          p.rangeRemaining -= p.speed;

          // Eliminate if range limits exceeded
          if (p.rangeRemaining <= 0) {
            projectilesRef.current.splice(pIdx, 1);
            continue;
          }

          // Check direct hits with bloons
          let projectileHit = false;
          for (let bIdx = bloonsRef.current.length - 1; bIdx >= 0; bIdx--) {
            const b = bloonsRef.current[bIdx];
            const hitDist = Math.hypot(b.x - p.x, b.y - p.y);

            // Hit radius detection
            if (hitDist < b.size + 10) {
              projectileHit = true;

              if (p.type === 'bomb') {
                // Splash explosive trigger!
                playExplosion();
                triggerExplosionSplash(p.x, p.y, p.splashRadius || 50, p.damage);
                projectilesRef.current.splice(pIdx, 1);
                break;
              } else {
                // Simple pierce-reduction projectile hits
                const damageDealt = b.isFrozen && p.type === 'dart' ? 0 : p.damage; // frozen bloons are immune to default physical darts (BTD mechanic!)
                
                if (damageDealt > 0) {
                  damageAndPopBloon(b, damageDealt);
                } else {
                  // Text warning immune
                  floatingTextsRef.current.push({
                    id: `imm_${Date.now()}`,
                    x: b.x,
                    y: b.y,
                    text: 'Immune!',
                    color: '#94a3b8',
                    life: 25,
                  });
                }

                p.pierce -= 1;
                if (p.pierce <= 0) {
                  projectilesRef.current.splice(pIdx, 1);
                  break;
                }
              }
            }
          }
        }

        // --- SECTION E: ACCUMULATE DUST & SPARKLE PARTICLES PHYSICS ---
        for (let ptIdx = particlesRef.current.length - 1; ptIdx >= 0; ptIdx--) {
          const pt = particlesRef.current[ptIdx];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life -= 1;
          if (pt.life <= 0) {
            particlesRef.current.splice(ptIdx, 1);
          }
        }

        // --- SECTION F: FLOATING TEXT DECELERATORS ---
        for (let ftIdx = floatingTextsRef.current.length - 1; ftIdx >= 0; ftIdx--) {
          const ft = floatingTextsRef.current[ftIdx];
          ft.y -= 0.6; // rise upwards
          ft.life -= 1;
          if (ft.life <= 0) {
            floatingTextsRef.current.splice(ftIdx, 1);
          }
        }
      } // End speed multiplier steps loop

      // --- SECTION G: PAINT MAIN ELEMENT GRAPHICS ON HIGH-DPI CANVAS ---
      const minCanvasDim = Math.min(canvas.width, canvas.height);

      // Refresh background
      drawMap(ctx, selectedMap, canvas.width, canvas.height);

      // Render Projectiles
      projectilesRef.current.forEach((p) => {
        drawProjectile(ctx, p, canvas.width, canvas.height);
      });

      // Render Bloons
      bloonsRef.current.forEach((b) => {
        drawBloon(ctx, b, canvas.width, canvas.height);
      });

      // Render Towers
      towersRef.current.forEach((t) => {
        const matchingTarget = findActiveTargetForTower(t);
        drawTower(ctx, t, canvas.width, canvas.height, matchingTarget);
      });

      // Render Range Indicator preview hovered/selected
      if (selectedPlacedTowerId) {
        const activeTower = towersRef.current.find((t) => t.id === selectedPlacedTowerId);
        if (activeTower) {
          drawRangeIndicator(
            ctx,
            activeTower.x,
            activeTower.y,
            activeTower.range,
            true,
            canvas.width,
            canvas.height
          );
        }
      }

      // Render drag-and-drop placement phantom indicator
      if (selectedShopTower) {
        const mouseValidity = checkPlacementValidity(mousePos.x, mousePos.y);
        const range = selectedShopTower === 'hero' ? 140 : TOWER_STATS[selectedShopTower].baseRange;
        drawRangeIndicator(
          ctx,
          mousePos.x,
          mousePos.y,
          range,
          mouseValidity,
          canvas.width,
          canvas.height
        );
      }

      // Render Pop Particles
      particlesRef.current.forEach((pt) => {
        drawParticle(ctx, pt, canvas.width, canvas.height);
      });

      // Render Floating popped Cash overlays
      floatingTextsRef.current.forEach((ft) => {
        drawFloatingText(ctx, ft, canvas.width, canvas.height);
      });

      // Maintain Loop ticker
      framesCounter++;
      animationFrameId = requestAnimationFrame(gameTick);
    };

    animationFrameId = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions, round, roundInProgress, selectedShopTower, mousePos, speedMultiplier, isGameOverOrFinished, autoPlay, showVictoryModal, gameMode, freePlayActive]);

  // Autoplay handler to fix the "autoplay doesn't work" bug
  useEffect(() => {
    if (autoPlay && !roundInProgress && !isGameOverOrFinished && !showVictoryModal) {
      // Small 1.2 second delay represents natural round completion grace pacing
      const timer = setTimeout(() => {
        if (!roundInProgress && !isGameOverOrFinished && !showVictoryModal) {
          startRound();
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, roundInProgress, isGameOverOrFinished, round, showVictoryModal]);

  // Target matching routing helper inside painting tick
  const findActiveTargetForTower = (t: Tower): Bloon | undefined => {
    const inRange = bloonsRef.current.filter((b) => Math.hypot(b.x - t.x, b.y - t.y) < t.range);
    if (inRange.length === 0) return undefined;
    
    // Default First
    inRange.sort((a, b) => b.distanceTraversed - a.distanceTraversed);
    return inRange[0];
  };

  // Inflict damage, trigger splits or pop children
  const damageAndPopBloon = (b: Bloon, dmg: number, originTower?: Tower) => {
    b.hp -= dmg;

    if (b.hp <= 0) {
      // Bloon completely popped!
      playPop();
      setTotalPopCount((p) => {
        const incremented = p + 1;
        assessAchievementProgress('pop_1000', 1);
        assessAchievementProgress('pop_10000', 1);
        return incremented;
      });

      if (originTower) {
        originTower.popCount += 1;
        // Hero gains experience upon pops!
        if (originTower.type === 'hero' && originTower.level < 20) {
          const xpBonus = 1.0 * (difficulty === 'CHIMPS' ? 1.0 : heroXpRateBonus);
          originTower.heroXp = (originTower.heroXp || 0) + xpBonus;
          originTower.heroMaxXp = originTower.heroMaxXp || 100;
          if (originTower.heroXp >= originTower.heroMaxXp) {
            originTower.level += 1;
            originTower.heroXp -= originTower.heroMaxXp;
            originTower.heroMaxXp = Math.round(originTower.heroMaxXp * 1.5);
            // Floating level up text
            floatingTextsRef.current.push({
              id: `lvup_${Date.now()}`,
              x: originTower.x,
              y: originTower.y - 15,
              text: 'Level Up!',
              color: '#34d399', // Emerald, zero yellow
              life: 45,
            });
            playLevelUp();
          }
        }
      }

      // Give Cash reward
      setCash((c) => c + b.reward);

      // Create floating text cash
      floatingTextsRef.current.push({
        id: `c_${Date.now()}_${Math.random()}`,
        x: b.x,
        y: b.y,
        text: `+$${b.reward}`,
        color: '#22c55e',
        life: 30,
      });

      // Pop splash particles
      for (let i = 0; i < 4; i++) {
        particlesRef.current.push({
          x: b.x,
          y: b.y,
          vx: (Math.random() * 2 - 1) * 3,
          vy: (Math.random() * 2 - 1) * 3,
          color: b.color,
          life: 18,
          maxLife: 18,
          size: 3,
          type: 'pop',
        });
      }

      // Check Children release splits
      const childType = getChildBloonType(b.type);
      if (childType) {
        const splitsQuantity = getChildCount(b.type);
        for (let i = 0; i < splitsQuantity; i++) {
          const childStyle = getBloonStyle(childType);
          
          // Separate multiple siblings slightly along track to prevent overlapping stacks
          const separationOffset = (i * 12) + 5;

          let childSpeedByDiff = childStyle.speed;
          if (difficulty === 'Easy') childSpeedByDiff *= 0.85;
          else if (difficulty === 'Hard' || difficulty === 'CHIMPS') childSpeedByDiff *= 1.15;

          const child: Bloon = {
            id: `bloon_child_${Date.now()}_${Math.random()}`,
            type: childType,
            x: b.x,
            y: b.y,
            speed: childSpeedByDiff,
            hp: childStyle.hp,
            maxHp: childStyle.hp,
            size: childStyle.size,
            color: childStyle.color,
            reward: childStyle.reward,
            distanceTraversed: Math.max(0, b.distanceTraversed - separationOffset),
            pathSegmentIndex: b.pathSegmentIndex,
            segmentProgress: Math.max(0, b.segmentProgress - 0.015),
            isFrozen: false,
            freezeTimer: 0,
            isSlowed: false,
            slowTimer: 0,
            isCeramic: childType === 'Ceramic',
            isMoab: false,
          };

          bloonsRef.current.push(child);
        }
      }

      // Remove popped parent bloon
      bloonsRef.current = bloonsRef.current.filter((it) => it.id !== b.id);
    }
  };

  // Explosive bomb explosion damage sweep radius function
  const triggerExplosionSplash = (ex: number, ey: number, rad: number, dmg: number) => {
    // Spark & smoke particles
    for (let c = 0; c < 8; c++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      particlesRef.current.push({
        x: ex,
        y: ey,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#f97316', // orange spark
        life: 20,
        maxLife: 20,
        size: 3,
        type: 'spark',
      });
    }

    // Smoke puffer
    particlesRef.current.push({
      x: ex,
      y: ey,
      vx: 0,
      vy: -0.5,
      color: '#64748b',
      life: 30,
      maxLife: 30,
      size: 15,
      type: 'smoke',
    });

    // Inflict splash damage on close targets
    bloonsRef.current.forEach((b) => {
      const dist = Math.hypot(b.x - ex, b.y - ey);
      if (dist < rad) { // inside blast radius
        damageAndPopBloon(b, dmg);
      }
    });
  };

  // Achievements tracking - round completing
  const assessmentRoundCompletes = (completedRound: number) => {
    if (completedRound === 40) {
      assessAchievementProgress('round_40', 40);
    }

    // Unlocks next levels if necessary (handled by lobby unlock IDs)
    try {
      const conqueredArray = JSON.parse(localStorage.getItem('btd_conquered_maps') || '[]');
      if (!conqueredArray.includes(mapId)) {
        conqueredArray.push(mapId);
        localStorage.setItem('btd_conquered_maps', JSON.stringify(conqueredArray));
        assessAchievementProgress('unlock_all_maps', 1);
      }
    } catch (e) {}
  };

  // Highlight and inspect Selected Tower Card elements inside sidebars
  const activePlacedTower = towersRef.current.find((t) => t.id === selectedPlacedTowerId);

  return (
    <div className="flex flex-col h-screen bg-[var(--app-bg)] font-sans text-white overflow-hidden select-none">
      {/* HUD Top-bar Displays */}
      <div className="bg-[var(--app-header)] text-white border-b-4 border-black/20 px-6 py-2.5 flex justify-between items-center z-10 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            id="hud-home-btn"
            onClick={onNavigateHome}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 border-b-4 border-rose-800 text-white text-xs font-black uppercase transition-all flex items-center gap-1 cursor-pointer rounded-lg shadow"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Lobby
          </button>
          
          <div className="hidden sm:flex flex-col text-slate-100">
            <span className="text-[9px] uppercase font-black leading-none opacity-80">Battle Ground</span>
            <span className="text-xs font-black uppercase tracking-tight text-white">{selectedMap.name}</span>
          </div>

          <div className="px-2 py-0.5 bg-black/30 border border-white/20 rounded text-[9px] text-[var(--app-accent)] font-black uppercase tracking-wider hidden md:inline">
            {difficulty}
          </div>
        </div>

        {/* Live Metrics: Lives and Cash matching Design HTML */}
        <div className="flex items-center gap-6">
          {/* Lives indicator styled like the design HTML layout with red circle */}
          <div className="flex items-center gap-2 animate-pulse" title="Monkey Lives">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-white">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-black leading-none opacity-80">Lives</span>
              <span id="hud-lives" className="text-base font-black leading-none">{lives} HP</span>
            </div>
          </div>

           {/* Cash indicator styled like the design HTML layout with emerald dollar sign */}
          <div className="flex items-center gap-2" title="Current Combat Cash">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-white font-black">
              $
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-black leading-none opacity-80">Cash</span>
              <span id="hud-cash" className="text-base font-black leading-none">${cash}</span>
            </div>
          </div>

          {/* Wave/Round indicator styled like wave banner */}
          <div className="bg-black/30 px-6 py-1.5 rounded-full border-2 border-white/20" title="Battle Round">
            <span id="hud-round" className="text-base font-black uppercase text-white">
              WAVE <span className="text-emerald-305">{round}</span> / {maxRounds}
            </span>
          </div>
        </div>

        {/* Audio / Auto Settings */}
        <div className="flex items-center gap-2">
          <button
            id="btn-sound-toggle"
            onClick={handleToggleMute}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isAudioMuted
                ? 'bg-rose-600 border-rose-800 text-white shadow'
                : 'bg-[var(--app-button)] border-b-2 border-black/30 hover:brightness-110 text-white'
            }`}
            title={isAudioMuted ? 'Unmute game sounds' : 'Mute game sounds'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            id="btn-help-modal"
            onClick={() => setShowHelpModal(true)}
            className="p-2 bg-[var(--app-button)] border-b-2 border-black/30 hover:brightness-110 text-white rounded-lg cursor-pointer shadow"
            title="Read Rules"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Core Area: Left sidebar, Center Canvas Arena, Right sidebar shop cards */}
      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
        
        {/* Left Drawer / Selected Inspection detail bar */}
        <div className="w-full lg:w-72 bg-[var(--app-panel)] border-b lg:border-b-0 lg:border-r-4 border-black/20 p-4 flex flex-col gap-4 text-white shrink-0 overflow-y-auto">
          {activePlacedTower ? (
            <div className="flex flex-col gap-3.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-yellow-405 text-yellow-950 border border-white flex items-center justify-center font-black">
                    {activePlacedTower.type[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white capitalize tracking-tight">{activePlacedTower.type} Monkey</h3>
                    <p className="text-[10px] text-[var(--app-accent)] font-bold uppercase">Targeting Closest Trails</p>
                  </div>
                </div>
                <button
                  id="btn-close-inspect"
                  onClick={() => setSelectedPlacedTowerId(null)}
                  className="p-1 hover:bg-white/10 text-white/80 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stats card */}
              <div className="grid grid-cols-2 gap-2 bg-black/30 p-3 rounded-xl border border-white/10 shadow-inner">
                <div className="flex flex-col">
                  <span className="text-[9px] text-[var(--app-accent)] uppercase font-black">Combat Pops</span>
                  <span className="text-sm font-black text-emerald-400">{activePlacedTower.popCount} Pops</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-[var(--app-accent)] uppercase font-black">
                    {activePlacedTower.type === 'hero' ? 'Upgrade Rank' : 'Crosspath Code'}
                  </span>
                  <span className="text-sm font-black text-indigo-300">
                    {activePlacedTower.type === 'hero'
                      ? `Level ${activePlacedTower.level}`
                      : `${activePlacedTower.upgradeLevels ? activePlacedTower.upgradeLevels.join('-') : '0-0-0'}`}
                  </span>
                </div>
              </div>

              {/* Target Mode buttons */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-[var(--app-accent)] uppercase font-black tracking-wider">Target Priority Mode:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['First', 'Last', 'Strong', 'Close'] as TargetMode[]).map((mode) => {
                    const isMode = activePlacedTower.targetMode === mode;
                    return (
                      <button
                        key={mode}
                        id={`target-mode-${mode}`}
                        onClick={() => {
                          activePlacedTower.targetMode = mode;
                          setTriggerPopCountUpdate((t) => t + 1);
                        }}
                        className={`py-1.5 px-2 text-[10px] font-black rounded-lg border uppercase transition-all text-center cursor-pointer ${
                          isMode
                            ? 'bg-blue-500 border-b-2 border-blue-700 text-white font-black shadow'
                            : 'bg-[var(--app-subpanel)]/50 border border-black/20 hover:brightness-110 text-white/80'
                        }`}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upgrades panel */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                <span className="text-[10px] text-[var(--app-accent)] uppercase font-black tracking-wider">Ability Enhancements:</span>
                
                {activePlacedTower.type === 'hero' ? (
                   // Hero Leveling display
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1.5 font-bold">
                      <span className="text-emerald-450 uppercase">XP: {Math.floor(activePlacedTower.heroXp || 0)} / {activePlacedTower.heroMaxXp || 100}</span>
                      <span className="text-[var(--app-accent)]">MAX LV. 20</span>
                    </div>

                    <button
                      id="btn-inspect-upgrade-hero"
                      disabled={cash < Math.round(250 * activePlacedTower.level * 1.2)}
                      onClick={() => upgradeTower(activePlacedTower)}
                      className={`w-full py-2 px-3 text-xs font-black rounded-xl border-b-4 flex justify-between items-center transition-all uppercase ${
                        cash >= Math.round(250 * activePlacedTower.level * 1.2)
                          ? 'bg-yellow-400 hover:bg-yellow-300 border-yellow-700 text-yellow-950 cursor-pointer shadow'
                          : 'bg-[var(--app-subpanel)] text-white/40 border border-black/35 cursor-not-allowed'
                      }`}
                    >
                      <span className="flex flex-col text-left">
                        <span className="font-black text-[11px]">Hero Training</span>
                        <span className="text-[8px] text-yellow-950/70 lowercase font-bold leading-none">Instant Rank-up</span>
                      </span>
                      <span className="font-black text-sm">${Math.round(250 * activePlacedTower.level * 1.2)}</span>
                    </button>
                  </div>
                ) : (
                  // Normal Monkey Upgrades (3 Custom Paths!)
                  (() => {
                    const spec = TOWER_STATS[activePlacedTower.type];
                    const lvls = activePlacedTower.upgradeLevels || [0, 0, 0];
                    const pathLabels = ['Top Path (Damage/Range)', 'Middle Path (Speed/Abils)', 'Bottom Path (Utility/Pierce)'];

                    return (
                      <div className="flex flex-col gap-3">
                        {lvls.map((currentLvl, pIndex) => {
                          const pathLabel = pathLabels[pIndex];
                          const nextUpgrade = spec.upgrades[pIndex][currentLvl];
                          
                          // Rule evaluation
                          let isCompleted = currentLvl >= 5;
                          let isLocked = false;
                          let lockReason = "";

                          const activePathsCount = lvls.filter((l) => l > 0).length;
                          const isCurrentlyActive = currentLvl > 0;

                          if (!isCompleted && nextUpgrade) {
                            if (!isCurrentlyActive && activePathsCount >= 2) {
                              isLocked = true;
                              lockReason = "Locked (Max 2 Paths)";
                            } else if (currentLvl >= 2) {
                              const hasOtherPathAbove2 = lvls.some((l, idx) => idx !== pIndex && l >= 3);
                              if (hasOtherPathAbove2) {
                                isLocked = true;
                                lockReason = "Locked (Capped at T2)";
                              }
                            }
                          }

                          return (
                            <div key={pIndex} className="bg-[var(--app-subpanel)]/40 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1.5 shadow-sm">
                              {/* Path Title & Tier Dots */}
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-yellow-300 uppercase tracking-tight">{pathLabel}</span>
                                {/* Dots */}
                                <div className="flex gap-1 inline-flex items-center">
                                  {Array.from({ length: 5 }).map((_, dIdx) => {
                                    const dotNum = dIdx + 1;
                                    const isActive = dotNum <= currentLvl;
                                    const isDotLocked = dotNum > 2 && lvls.some((l, idx) => idx !== pIndex && l >= 3);
                                    
                                    return (
                                      <div
                                        key={dIdx}
                                        className={`w-2 h-2 rounded-full border transition-all ${
                                          isActive
                                            ? 'bg-emerald-450 border-emerald-300'
                                            : isDotLocked
                                            ? 'bg-rose-950/80 border-rose-800/40'
                                            : 'bg-black/40 border-white/10'
                                        }`}
                                        title={isActive ? `Tier ${dotNum} Active` : isDotLocked ? "Locked: Another path is primary" : `Tier ${dotNum}`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Action area */}
                              {isCompleted ? (
                                <div className="py-1 px-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-center rounded-lg text-[9px] font-black uppercase tracking-wide">
                                  🏆 Path Maxed (Tier 5)
                                </div>
                              ) : isLocked ? (
                                <div className="py-1 px-2 bg-slate-900 border border-rose-900/30 text-rose-350 text-center rounded-lg text-[9px] font-bold uppercase tracking-wide">
                                  🔒 {lockReason}
                                </div>
                              ) : nextUpgrade ? (
                                (() => {
                                  const canAfford = cash >= nextUpgrade.cost;
                                  return (
                                    <button
                                      id={`btn-upgrade-p${pIndex}-lvl${currentLvl}`}
                                      disabled={!canAfford}
                                      onClick={() => upgradeTower(activePlacedTower, pIndex)}
                                      className={`w-full py-1.5 px-2 text-[10px] font-black rounded-lg border-b-2 flex justify-between items-center transition-all uppercase cursor-pointer ${
                                        canAfford
                                          ? 'bg-blue-600 hover:bg-blue-500 border-blue-800 text-white shadow'
                                          : 'bg-[var(--app-subpanel)] border border-black/25 text-white/30 cursor-not-allowed'
                                      }`}
                                    >
                                      <span className="flex flex-col text-left max-w-[130px]">
                                        <span className="font-sans font-black text-[9.5px] text-white leading-tight line-clamp-1">{nextUpgrade.name}</span>
                                        <span className="text-[7px] font-bold text-white opacity-80 line-clamp-1 leading-none">{nextUpgrade.description}</span>
                                      </span>
                                      <span className="font-sans font-black text-[10.5px] text-yellow-300 shrink-0">${nextUpgrade.cost}</span>
                                    </button>
                                  );
                                })()
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Sell Button */}
              <button
                id="btn-sell-placed-tower"
                onClick={() => sellTower(activePlacedTower)}
                className="w-full mt-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl border-b-4 border-rose-800 transition-all uppercase cursor-pointer"
              >
                Assemble Sell for ${Math.round(activePlacedTower.cost * 0.72)} (72% refund)
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-white/70">
              <Sliders className="w-8 h-8 text-[var(--app-accent)] mb-3 animate-pulse" />
              <h3 className="text-xs font-black uppercase text-white tracking-tight">Inspector Terminal</h3>
              <p className="text-[11px] mt-1 text-white/50 max-w-[180px] leading-relaxed font-bold">
                Click any placed tower on the grid to inspect stats, upgrade tier abilities, change targeting modes, or sell.
              </p>
            </div>
          )}

          {/* Rules/Wave guide inside layout */}
          <div className="mt-auto hidden lg:flex flex-col p-3.5 bg-[var(--app-subpanel)] rounded-xl border border-white/5 text-[11px] text-white/75 gap-2 leading-relaxed">
            <span className="font-black text-white uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow" /> Wave Schedule Guide
            </span>
            <div className="flex flex-col gap-1 text-[10px] font-bold uppercase text-white/60">
              <div className="flex justify-between border-b border-white/5 pb-0.5"><span>Reds/Blues</span> <span className="text-white">Wave 1+</span></div>
              <div className="flex justify-between border-b border-white/5 pb-0.5"><span>Greens/Yellows</span> <span className="text-white">Wave 5+</span></div>
              <div className="flex justify-between border-b border-white/5 pb-0.5"><span>Pinks/Ceramics</span> <span className="text-white">Wave 20+</span></div>
              <div className="flex justify-between text-yellow-300 font-black"><span>★ MOAB BOSS blimp</span> <span className="text-yellow-405">Wave 40</span></div>
            </div>
          </div>
        </div>

        {/* Center Sandbox Canvas Game Stage */}
        <div id="game-stage-container" ref={containerRef} className="flex-1 bg-[var(--app-bg)]/85 relative flex items-center justify-center p-3 overflow-hidden">
          <canvas
            id="arena-canvas"
            ref={canvasRef}
            width={1000}
            height={1000}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            onClick={handleCanvasClick}
            className="w-full max-w-2xl aspect-square bg-slate-900 border-4 border-black/30 rounded-3xl cursor-crosshair shadow-2xl block"
          />

          {/* Speed settings overlay panel inside canvas boundaries bottom-right */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2.5 z-10 bg-[var(--app-panel)] border border-white/10 px-3.5 py-2 rounded-2xl shadow-xl">
            {/* Play Round Trigger */}
            <button
              id="active-round-trigger"
              disabled={roundInProgress}
              onClick={startRound}
              className={`px-4 py-2 font-black font-sans text-xs rounded-xl flex items-center gap-1 border-b-4 uppercase transition-all ${
                roundInProgress
                  ? 'bg-[var(--app-subpanel)] text-white/40 cursor-not-allowed border-black/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-700 hover:scale-103 cursor-pointer animate-pulse font-black'
              }`}
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span>{roundInProgress ? 'Defending...' : `START WAVE ${round}`}</span>
            </button>

            {/* Fast Forward Speed Factor */}
            <button
              id="btn-fast-forward"
              onClick={() => {
                const next = speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 3 : 1;
                setSpeedMultiplier(next);
              }}
              className="p-2 bg-blue-500 hover:bg-blue-400 border-b-2 border-blue-700 text-white text-xs font-black rounded-xl cursor-pointer uppercase font-sans whitespace-nowrap"
              title="Toggle speed multiplier"
            >
              {speedMultiplier}x FF
            </button>

            <label className="flex items-center gap-1.5 text-[10px] text-white/80 font-extrabold ml-2 cursor-pointer uppercase font-sans">
              <input
                id="check-autoplay"
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="rounded text-[var(--app-accent)] bg-black/45 border-white/10 focus:ring-0 cursor-pointer"
              />
              AUTOPLAY
            </label>
          </div>
        </div>

        {/* Right Monkey Store (Deploy options list) */}
        <div className="w-full lg:w-80 bg-[var(--app-panel)] border-t lg:border-t-0 lg:border-l border-slate-700/50 p-4 flex flex-col gap-4 text-white shrink-0 overflow-y-auto">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-indigo-400 animate-bounce" />
            Monkey Defense Arsenal
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-2.5">
            {/* Deploy Hero card (Limit 1!) */}
            {(() => {
              const actualCost = getTowerCost('hero');
              const canAfford = cash >= actualCost;
              const hasHeroOnGrid = towersRef.current.some((t) => t.type === 'hero');
              const isSelected = selectedShopTower === 'hero';

              return (
                <button
                  id="deploy-card-hero"
                  disabled={hasHeroOnGrid}
                  onClick={() => {
                    setSelectedShopTower(isSelected ? null : 'hero');
                  }}
                  className={`flex flex-col text-left p-3 rounded-2xl border transition-all cursor-pointer relative ${
                    hasHeroOnGrid
                      ? 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'border-[var(--app-accent)] bg-[var(--app-button)]/15 shadow-sm ring-2 ring-[var(--app-accent)]/25'
                      : canAfford
                      ? 'bg-slate-700 border-slate-600 hover:border-slate-500 hover:translate-y-[-1px] shadow-sm'
                      : 'bg-slate-750 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold text-xs">{heroConfig.name}</span>
                    <span className="text-[8px] bg-amber-500/20 border border-amber-500/40 text-amber-400 px-1.5 rounded-full font-bold">HERO</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mb-1 shadow-sm leading-relaxed text-[10px]">{heroConfig.description}</p>
                  
                  {hasHeroOnGrid ? (
                    <span className="text-[9px] text-rose-400 font-bold mt-auto">DEPLOYED</span>
                  ) : (
                    <span className="text-xs font-black text-amber-400 mt-auto flex items-center gap-0.5">
                      <DollarSign className="w-3.5 h-3.5 shrink-0" />
                      {actualCost}
                    </span>
                  )}
                </button>
              );
            })()}

            {/* Standard Towers */}
            {(Object.keys(TOWER_STATS) as TowerType[]).map((type) => {
              const actualCost = getTowerCost(type);
              const canAfford = cash >= actualCost;
              const isSelected = selectedShopTower === type;

              return (
                <button
                  key={type}
                  id={`deploy-card-${type}`}
                  onClick={() => {
                    setSelectedShopTower(isSelected ? null : type);
                  }}
                  className={`flex flex-col text-left p-3 rounded-2xl border-4 transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-[var(--app-accent)] bg-[var(--app-button)] shadow-md ring-2 ring-[var(--app-accent)]/20'
                      : canAfford
                      ? 'bg-[var(--app-button)] border-b-4 border-black/40 hover:brightness-110 hover:translate-y-[-1px] shadow-lg text-white'
                      : 'bg-[var(--app-subpanel)] opacity-60 border border-black/25 text-white/40 cursor-not-allowed'
                  }`}
                >
                  <span className="font-sans font-black text-xs capitalize leading-none mb-1 tracking-tight">{type}</span>
                  <p className="text-[9px] text-white/80 leading-normal line-clamp-2 mb-2 flex-1 font-bold">{TOWER_STATS[type].description}</p>
                  
                  <span className="text-xs font-black text-yellow-300 mt-auto flex items-center gap-0.5">
                    <DollarSign className="w-3.5 h-3.5 shrink-0 text-yellow-400" />
                    {actualCost}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick instructions details */}
          <div className="mt-auto bg-[var(--app-subpanel)] p-3.5 rounded-2xl border border-white/5 flex flex-col gap-1.5 text-[11px] leading-relaxed text-white/70 font-bold uppercase shadow-inner">
            <span className="font-sans font-black text-white">Deployment Protocol</span>
            <span>• Keep defenders close to curves to capitalize range.</span>
            <span>• Placement has obstacles! Avoid tracks or overlapping circles.</span>
          </div>
        </div>
      </div>
        {/* Rules Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--app-panel)] rounded-3xl border-4 border-black/20 max-w-md w-full text-white p-6 relative shadow-2xl">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black text-yellow-300 flex items-center gap-2 mb-3 uppercase italic">
              <Sliders className="w-5 h-5 text-yellow-400" />
              Bloons Defending Academy
            </h2>

            <div className="flex flex-col gap-3 text-xs leading-relaxed text-white/90 font-bold">
              <p>
                Welcome to the battlefield! Your task is to defend the pathways and prevent bloons from leaking. Here is what you need to know:
              </p>
              <div>
                <span className="font-sans font-black text-white uppercase tracking-wider text-[11px] block border-b border-white/10 pb-1 mb-1.5">🔥 Towers Strengths:</span>
                <ul className="list-disc pl-4 mt-1 flex flex-col gap-1">
                  <li><span className="text-white font-black">Dart Monkey:</span> Cheap basic single target piercer.</li>
                  <li><span className="text-white font-black">Tack Shooter:</span> Fires 8 circular spikes. Goldmine in bends!</li>
                  <li><span className="text-white font-black">Sniper Monkey:</span> Global range, perfect for heavy Ceramics.</li>
                  <li><span className="text-white font-black">Bomb Shooter:</span> Splashes damage. Pop groups at once.</li>
                  <li><span className="text-white font-black">Ice Monkey:</span> support freezes groups instantly.</li>
                  <li><span className="text-white font-black">Super Monkey:</span> Infinite firing plasma stream. Elite sponsor.</li>
                </ul>
              </div>

              <div>
                <span className="font-sans font-black text-white uppercase tracking-wider text-[11px] block border-b border-white/10 pb-1 mb-1.5">👑 Heroes:</span>
                <p className="mt-1">
                  Deploy your chosen command Hero! They gain experience points (XP) automatically for pops, leveling up and increasing stats with no extra cost.
                </p>
              </div>

              <div className="p-3 bg-[var(--app-subpanel)] border border-white/10 rounded-xl mt-1 text-[10px] text-white/70 shadow-inner">
                <span className="font-sans font-black text-white block mb-0.5">Note:</span>
                Survival is complete on Round 40. Keep upgrading towers and managing targeting priorities (First, Last, Close, Strong) to survive.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Victory Modal (Wave 40 Beaten!) */}
      {showVictoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-gradient-to-b from-[var(--app-panel)] to-[var(--app-subpanel)] rounded-3xl border-4 border-yellow-400 max-w-sm w-full text-white p-6 relative shadow-2xl text-center flex flex-col gap-4">
            <div className="mx-auto p-4 bg-yellow-400 text-yellow-950 rounded-full shadow-lg border-2 border-white animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>

            <h2 className="text-xl font-black text-yellow-300 uppercase tracking-tight italic font-sans">
              🏆 Wave 40 Beat!
            </h2>
            <p className="text-xs text-white/90 font-bold leading-relaxed">
              Incredible work! You popped the massive <span className="text-yellow-300 font-sans font-black">MOAB BOSS blimp</span> and successfully defended the landscape!
            </p>

            <div className="bg-black/30 p-3 rounded-2xl border border-white/10 text-[11px] font-bold text-white/80">
              <span className="text-[9px] text-yellow-400 uppercase font-black tracking-widest block mb-0.5">Defenders Bonus Reward</span>
              <span>• Earn +$250 MM Victory Cash!</span><br/>
              <span>• Unlocked Endless Free Play on this Arena!</span>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                id="btn-victory-claim"
                onClick={() => {
                  setShowVictoryModal(false);
                  onGameOver(40, 250, totalPopCount); // Returns to lobby with MM rewards
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700 text-white font-sans font-black text-xs tracking-wider rounded-xl uppercase transition-all cursor-pointer shadow-lg active:scale-98"
              >
                Claim Victory & Return
              </button>

              <button
                id="btn-victory-freeplay"
                onClick={() => {
                  setFreePlayActive(true);
                  setShowVictoryModal(false);
                  setRound((r) => r + 1); // transition to round 41!
                }}
                className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 border-b-4 border-yellow-600 text-yellow-950 font-sans font-black text-xs tracking-wider rounded-xl uppercase transition-all cursor-pointer shadow-md active:scale-98"
              >
                🌌 Continue in Free Play
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
