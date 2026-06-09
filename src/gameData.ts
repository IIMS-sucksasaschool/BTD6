import { GameMap, TowerStats, PersistentUpgrade, HeroConfig, Achievement, BloonType, TowerType } from './types';

// Normalized grid is 1000 x 1000 for track plotting. Responsive scaled coordinates are calculated during rendering.
export const MAPS: GameMap[] = [
  {
    id: 'monkey_meadow',
    name: 'Monkey Meadow',
    description: 'A classic winding pathway through fresh green grass. Perfect for beginners.',
    theme: 'grass',
    trackWidth: 32,
    bgColor: '#4ade80', // green-400
    trackColor: '#e0a96d', // sandy
    borderColor: '#b45309', // amber-700
    track: [
      { x: 0, y: 150 },
      { x: 250, y: 150 },
      { x: 250, y: 450 },
      { x: 120, y: 450 },
      { x: 120, y: 750 },
      { x: 450, y: 750 },
      { x: 450, y: 450 },
      { x: 650, y: 450 },
      { x: 650, y: 150 },
      { x: 850, y: 150 },
      { x: 850, y: 800 },
      { x: 1000, y: 800 }
    ],
    decorations: [
      { type: 'tree', x: 100, y: 300, size: 40 },
      { type: 'tree', x: 500, y: 200, size: 55 },
      { type: 'tree', x: 750, y: 300, size: 45 },
      { type: 'tree', x: 350, y: 600, size: 50 },
      { type: 'tree', x: 950, y: 450, size: 40 },
      { type: 'rock', x: 50, y: 550, size: 25 },
      { type: 'rock', x: 780, y: 650, size: 30 }
    ]
  },
  {
    id: 'in_the_loop',
    name: 'In the Loop',
    description: 'A sandy loop-the-loop track where Bloons circle back near your active defenses.',
    theme: 'desert',
    trackWidth: 30,
    bgColor: '#fde047', // yellow-300
    trackColor: '#fbbf24', // amber-400
    borderColor: '#92400e', // amber-800
    track: [
      { x: 500, y: 0 },
      { x: 500, y: 250 },
      // Loop begins
      { x: 300, y: 250 },
      { x: 300, y: 550 },
      { x: 700, y: 550 },
      { x: 700, y: 250 },
      { x: 500, y: 250 },
      // Loop ends, continue down
      { x: 500, y: 750 },
      { x: 150, y: 750 },
      { x: 150, y: 1000 }
    ],
    decorations: [
      { type: 'cactus', x: 150, y: 150, size: 30 },
      { type: 'cactus', x: 800, y: 150, size: 35 },
      { type: 'cactus', x: 850, y: 650, size: 30 },
      { type: 'rock', x: 500, y: 400, size: 40 }, // in center of loop
      { type: 'rock', x: 320, y: 850, size: 25 }
    ]
  },
  {
    id: 'cubism',
    name: 'Cubism',
    description: 'A chaotic, geometric layout crossing paths in deep space with multiple intersections.',
    theme: 'space',
    trackWidth: 26,
    bgColor: '#1e1b4b', // indigo-950
    trackColor: '#312e81', // indigo-900
    borderColor: '#6366f1', // indigo-500
    track: [
      { x: 100, y: 0 },
      { x: 100, y: 800 },
      { x: 900, y: 800 },
      { x: 900, y: 200 },
      { x: 300, y: 200 },
      { x: 300, y: 500 },
      { x: 700, y: 500 },
      { x: 700, y: 650 },
      { x: 0, y: 650 },
      { x: 0, y: 1000 }
    ],
    decorations: [
      { type: 'star', x: 200, y: 100, size: 8 },
      { type: 'star', x: 500, y: 80, size: 12 },
      { type: 'star', x: 750, y: 110, size: 6 },
      { type: 'star', x: 850, y: 600, size: 10 },
      { type: 'star', x: 150, y: 920, size: 7 },
      { type: 'crater', x: 500, y: 350, size: 45 },
      { type: 'crater', x: 800, y: 900, size: 35 },
      { type: 'crater', x: 150, y: 500, size: 40 }
    ]
  },
  {
    id: 'logs',
    name: 'Logs',
    description: 'A woodsy forest wetland track weaving under hollow trunks. Extremely long length.',
    theme: 'water',
    trackWidth: 32,
    bgColor: '#064e3b', // emerald-950
    trackColor: '#27272a', // zinc-800
    borderColor: '#10b981', // emerald-500
    track: [
      { x: 0, y: 900 },
      { x: 900, y: 900 },
      { x: 900, y: 500 },
      { x: 100, y: 500 },
      { x: 100, y: 100 },
      { x: 800, y: 100 },
      { x: 800, y: 300 },
      { x: 300, y: 300 },
      { x: 300, y: 700 },
      { x: 1000, y: 700 }
    ],
    decorations: [
      { type: 'water', x: 500, y: 600, size: 90 },
      { type: 'tree', x: 50, y: 300, size: 40 },
      { type: 'tree', x: 950, y: 100, size: 45 },
      { type: 'tree', x: 600, y: 200, size: 50 },
      { type: 'rock', x: 450, y: 400, size: 30 }
    ]
  },
  {
    id: 'scorched_crater',
    name: 'Scorched Crater',
    description: 'A brutal volcanic trench with active lava flows and shorter shortcuts. The ultimate layout challenge.',
    theme: 'volcano',
    trackWidth: 34,
    bgColor: '#1c1917', // stone-900
    trackColor: '#451a03', // orange-950 (scorched bridge)
    borderColor: '#ea580c', // orange-600
    track: [
      { x: 0, y: 500 },
      { x: 300, y: 500 },
      { x: 300, y: 150 },
      { x: 700, y: 150 },
      { x: 700, y: 500 },
      { x: 1000, y: 500 }
    ],
    decorations: [
      { type: 'lava', x: 500, y: 500, size: 80 },
      { type: 'lava', x: 150, y: 200, size: 50 },
      { type: 'crater', x: 850, y: 300, size: 40 },
      { type: 'rock', x: 80, y: 800, size: 30 },
      { type: 'rock', x: 900, y: 800, size: 30 },
      { type: 'cactus', x: 500, y: 80, size: 25 }
    ]
  }
];

export const TOWER_STATS: Record<Exclude<TowerType, 'hero'>, TowerStats> = {
  dart: {
    cost: 200,
    baseRange: 130,
    baseCooldown: 50,
    description: 'Shoots a single straight dart with minor piercing power. Cheap and versatile.',
    upgrades: [
      [
        { id: 'dart_t1_long', name: 'Long Range Darts', cost: 90, description: 'Increases targeting range significantly.', effects: { range: 25 } },
        { id: 'dart_t2_enhanced', name: 'Enhanced Eyesight', cost: 120, description: 'Further boosts range and grants camo vision.', effects: { range: 35, canSeeCamo: true } },
        { id: 'dart_t3_spike', name: 'Spike-o-pult', cost: 300, description: 'Fires heavy spiked balls, increasing damage and pierce.', effects: { pierce: 4, damage: 1 } },
        { id: 'dart_t4_jugger', name: 'Juggernaut', cost: 1000, description: 'Crushes ceramic bloons with great force.', effects: { pierce: 8, damage: 3 } },
        { id: 'dart_t5_ultra', name: 'Ultra-Juggernaut', cost: 3500, description: 'Gigantic spiked balls that split on impact.', effects: { pierce: 15, damage: 8 } }
      ],
      [
        { id: 'dart_m1_quick', name: 'Quick Shots', cost: 100, description: 'Increases attack rate of the monkey.', effects: { cooldownMult: 0.8 } },
        { id: 'dart_m2_very_quick', name: 'Very Quick Shots', cost: 190, description: 'Rapid reloading speed for quick defense.', effects: { cooldownMult: 0.65 } },
        { id: 'dart_m3_triple', name: 'Triple Shots', cost: 400, description: 'Three darts at once, increasing pierce.', effects: { pierce: 1, cooldownMult: 0.8 } },
        { id: 'dart_m4_fan', name: 'Monkey Fan Club', cost: 1800, description: 'Drastically increases basic speed and damage.', effects: { cooldownMult: 0.4, damage: 1 } },
        { id: 'dart_m5_plasma', name: 'Plasma Fan Club Master', cost: 6050, description: 'An elite force firing actual plasma streams.', effects: { cooldownMult: 0.25, damage: 2, pierce: 3 } }
      ],
      [
        { id: 'dart_b1_sharp', name: 'Sharp Shots', cost: 140, description: 'Darts pierce through more bloons.', effects: { pierce: 1 } },
        { id: 'dart_b2_razor', name: 'Razor Sharp Shots', cost: 210, description: 'Slices through groups of bloons easily.', effects: { pierce: 2 } },
        { id: 'dart_b3_crossbow', name: 'Crossbow', cost: 625, description: 'Long range bow with higher damage.', effects: { range: 35, pierce: 2, damage: 1 } },
        { id: 'dart_b4_sharpshooter', name: 'Sharp Shooter', cost: 2000, description: 'High precision and high critical damage.', effects: { range: 50, damage: 3 } },
        { id: 'dart_b5_master', name: 'Crossbow Master', cost: 7500, description: 'Absolute master of archery and speed.', effects: { range: 75, damage: 7, pierce: 5, cooldownMult: 0.5 } }
      ]
    ]
  },
  tack: {
    cost: 280,
    baseRange: 85,
    baseCooldown: 70,
    description: 'Shoots a burst of 8 sharp tacks in circular directions. Best placed in curves.',
    upgrades: [
      [
        { id: 'tack_t1_fast', name: 'Faster Shooting', cost: 150, description: 'Fires tacks at an increased velocity.', effects: { cooldownMult: 0.75 } },
        { id: 'tack_t2_even_fast', name: 'Even Faster Shooting', cost: 300, description: 'Takes attack speed to high levels.', effects: { cooldownMult: 0.55 } },
        { id: 'tack_t3_hot', name: 'Hot Shots', cost: 600, description: 'Shoots fiery hot tacks dealing more damage.', effects: { damage: 1 } },
        { id: 'tack_t4_ring', name: 'Ring of Fire', cost: 2500, description: 'Constantly emits intense heat rings.', effects: { damage: 2, range: 15 } },
        { id: 'tack_t5_inferno', name: 'Inferno Ring', cost: 9500, description: 'An extremely powerful, melt-everything ring.', effects: { damage: 6, range: 30, cooldownMult: 0.4 } }
      ],
      [
        { id: 'tack_m1_long', name: 'Long Range Tacks', cost: 100, description: 'Launches tacks further outwards.', effects: { range: 15 } },
        { id: 'tack_m2_super', name: 'Super Range Tacks', cost: 225, description: 'Vastly amplifies tack shooter reach.', effects: { range: 25 } },
        { id: 'tack_m3_blade', name: 'Blade Shooter', cost: 550, description: 'Converts tacks into razor blades with more pierce.', effects: { pierce: 2, bulletSpeed: 2 } },
        { id: 'tack_m4_mael', name: 'Blade Maelstrom', cost: 2700, description: 'Dramatically increases blade-reloading speeds.', effects: { cooldownMult: 0.5, pierce: 4 } },
        { id: 'tack_m5_super_mael', name: 'Super Maelstrom', cost: 8500, description: 'Extremely fast blade shredding power.', effects: { cooldownMult: 0.3, pierce: 8, damage: 1 } }
      ],
      [
        { id: 'tack_b1_more', name: 'More Tacks', cost: 100, description: 'Packs extra needles per shot.', effects: { pierce: 1 } },
        { id: 'tack_b2_even_more', name: 'Even More Tacks', cost: 225, description: 'Further increases the shot density.', effects: { pierce: 2 } },
        { id: 'tack_b3_sprayer', name: 'Tack Sprayer', cost: 450, description: 'Accelerates tack count and frequency.', effects: { cooldownMult: 0.8 } },
        { id: 'tack_b4_overdrive', name: 'Overdrive', cost: 3200, description: 'Incredibly rapid tack defense.', effects: { cooldownMult: 0.4, pierce: 1 } },
        { id: 'tack_b5_zone', name: 'The Tack Zone', cost: 12000, description: 'Covers the local area in countless tacks.', effects: { cooldownMult: 0.2, pierce: 4, range: 20 } }
      ]
    ]
  },
  sniper: {
    cost: 350,
    baseRange: 9999,
    baseCooldown: 120,
    description: 'Deals massive single-target damage to ANY bloon on screen instantly.',
    upgrades: [
      [
        { id: 'sniper_t1_hardened', name: 'Hardened Darts', cost: 200, description: 'Deals extra damage per shot.', effects: { damage: 1 } },
        { id: 'sniper_t2_fmj', name: 'Full Metal Jacket', cost: 350, description: 'Bullets punch through heavy armor classes.', effects: { damage: 4 } },
        { id: 'sniper_t3_prec', name: 'Deadly Precision', cost: 1200, description: 'High precision shots designed to eliminate bloon layers.', effects: { damage: 8 } },
        { id: 'sniper_t4_maim', name: 'Maim MOAB', cost: 4200, description: 'High-caliber rounds slow down MOABs on hit.', effects: { damage: 15, bulletType: 'cripple' } },
        { id: 'sniper_t5_cripple', name: 'Cripple MOAB', cost: 15000, description: 'Heavy bombardment absolutely disables MOAB structures.', effects: { damage: 40, bulletType: 'cripple' } }
      ],
      [
        { id: 'sniper_m1_night', name: 'Night Vision', cost: 150, description: 'Grants camo-bloon detection ability.', effects: { range: 40, canSeeCamo: true } },
        { id: 'sniper_m2_shrap', name: 'Shrapnel Shot', cost: 450, description: 'Fires shrapnel fragments on hit.', effects: { pierce: 1 } },
        { id: 'sniper_m3_bounce', name: 'Bouncing Bullets', cost: 1500, description: 'Bullets bounce from bloon to bloon.', effects: { damage: 2, pierce: 2 } },
        { id: 'sniper_m4_supply', name: 'Supply Drop Sniper', cost: 5000, description: 'Upgraded payload with faster combat firing.', effects: { cooldownMult: 0.5, damage: 3 } },
        { id: 'sniper_m5_elite', name: 'Elite Sniper', cost: 14500, description: 'Commanding speed and devastating tactical targeting.', effects: { cooldownMult: 0.3, damage: 10, pierce: 3 } }
      ],
      [
        { id: 'sniper_b1_fast', name: 'Fast Firing', cost: 150, description: 'Reduces reload latency.', effects: { cooldownMult: 0.7 } },
        { id: 'sniper_b2_even_fast', name: 'Even Faster Firing', cost: 400, description: 'Dramatically improves rate of fire.', effects: { cooldownMult: 0.5 } },
        { id: 'sniper_b3_semi', name: 'Semi-Automatic', cost: 2200, description: 'Converts rifle to semi-automatic.', effects: { cooldownMult: 0.3 } },
        { id: 'sniper_b4_full_auto', name: 'Full Auto Rifle', cost: 6000, description: 'Constant rain of rapid-fire bullets.', effects: { cooldownMult: 0.15, damage: 1 } },
        { id: 'sniper_b5_defender', name: 'Elite Defender', cost: 17500, description: 'Fires bullets at unmatched, hyper-sonic speeds.', effects: { cooldownMult: 0.06, damage: 2 } }
      ]
    ]
  },
  bomb: {
    cost: 525,
    baseRange: 110,
    baseCooldown: 90,
    description: 'Fires slow explosive bombs that deal area-of-effect splash damage nearby.',
    upgrades: [
      [
        { id: 'bomb_t1_bigger', name: 'Bigger Bombs', cost: 250, description: 'Increases explosion blast radius.', effects: { splashRadius: 20 } },
        { id: 'bomb_t2_heavy', name: 'Heavy Ordnance', cost: 350, description: 'Increases explosion damage.', effects: { damage: 2, splashRadius: 15 } },
        { id: 'bomb_t3_really', name: 'Really Big Bombs', cost: 1200, description: 'Massive blast radius pops large clusters.', effects: { damage: 4, splashRadius: 35 } },
        { id: 'bomb_t4_impact', name: 'Bloon Impact', cost: 3200, description: 'Direct impacts freeze/shock bloons temporarily.', effects: { damage: 6, splashRadius: 50 } },
        { id: 'bomb_t5_crush', name: 'Bloon Crush', cost: 15000, description: 'Absolute devastation crushes any bloon group.', effects: { damage: 18, splashRadius: 80, cooldownMult: 0.7 } }
      ],
      [
        { id: 'bomb_m1_reload', name: 'Faster Reload', cost: 200, description: 'Fires bombs with shorter downtime.', effects: { cooldownMult: 0.75 } },
        { id: 'bomb_m2_missile', name: 'Missile Launcher', cost: 400, description: 'Converts bombs to high velocity missiles.', effects: { cooldownMult: 0.6, range: 20 } },
        { id: 'bomb_m3_mauler', name: 'MOAB Mauler', cost: 900, description: 'Heavily increased damage targeting MOABs.', effects: { damage: 5, range: 25 } },
        { id: 'bomb_m4_assassin', name: 'MOAB Assassin', cost: 3500, description: 'Devastating targeted missile payloads.', effects: { damage: 15, range: 35 } },
        { id: 'bomb_m5_eliminator', name: 'MOAB Eliminator', cost: 18000, description: 'Decimates MOAB class blimps effortlessly.', effects: { damage: 50, range: 55, cooldownMult: 0.45 } }
      ],
      [
        { id: 'bomb_b1_range', name: 'Extra Range', cost: 150, description: 'Fires projectiles further.', effects: { range: 15 } },
        { id: 'bomb_b2_frag', name: 'Frag Bombs', cost: 300, description: 'Launches fragments upon detonation.', effects: { pierce: 1 } },
        { id: 'bomb_b3_cluster', name: 'Cluster Bombs', cost: 800, description: 'Splits on impact into smaller bombs.', effects: { pierce: 3 } },
        { id: 'bomb_b4_recur', name: 'Recursive Cluster', cost: 2800, description: 'Launches waves of secondary explosions.', effects: { pierce: 6, cooldownMult: 0.8 } },
        { id: 'bomb_b5_blitz', name: 'Bomb Blitz', cost: 16500, description: 'Unleashes massive recursive destruction.', effects: { pierce: 12, damage: 10, cooldownMult: 0.5 } }
      ]
    ]
  },
  ice: {
    cost: 300,
    baseRange: 80,
    baseCooldown: 80,
    description: 'Emits a freezing blast that completely freezes nearby bloons in place.',
    upgrades: [
      [
        { id: 'ice_t1_perma', name: 'Permafrost', cost: 150, description: 'Keeps bloons slowed even after thawing.', effects: { freezeTime: 15 } },
        { id: 'ice_t2_snap', name: 'Cold Snap', cost: 350, description: 'Allows freezing of tougher bloons.', effects: { range: 10, freezeTime: 15 } },
        { id: 'ice_t3_shards', name: 'Ice Shards', cost: 1200, description: 'Frozen bloons release sharp ice shards when popped.', effects: { range: 20, damage: 1 } },
        { id: 'ice_t4_embrit', name: 'Embrittlement', cost: 3000, description: 'Weakens bloons so they take more damage.', effects: { range: 30, damage: 3 } },
        { id: 'ice_t5_brittle', name: 'Super Brittle', cost: 14000, description: 'Utterly breaks structure of target groups.', effects: { range: 50, damage: 10, freezeTime: 50 } }
      ],
      [
        { id: 'ice_m1_enhanced', name: 'Enhanced Freeze', cost: 200, description: 'Increases freezing effect radius.', effects: { range: 15 } },
        { id: 'ice_m2_deep', name: 'Deep Freeze', cost: 350, description: 'Holds freezing status for twice as long.', effects: { freezeTime: 35 } },
        { id: 'ice_m3_wind', name: 'Arctic Wind', cost: 1800, description: 'An aura of cold slows down bloons within range.', effects: { range: 30 } },
        { id: 'ice_m4_snow', name: 'Snowstorm', cost: 4000, description: 'Periodically freezes everything nearby.', effects: { range: 55, damage: 1 } },
        { id: 'ice_m5_zero', name: 'Absolute Zero', cost: 16000, description: 'Total freeze lockdown with high damage.', effects: { range: 90, damage: 5, cooldownMult: 0.6 } }
      ],
      [
        { id: 'ice_b1_cryo', name: 'Cryo Blast', cost: 150, description: 'Extremely cold short range burst.', effects: { range: 10 } },
        { id: 'ice_b2_aura', name: 'Freeze Aura', cost: 400, description: 'Constant field of ice drops temperatures.', effects: { range: 20 } },
        { id: 'ice_b3_icicles', name: 'Icicles', cost: 1350, description: 'Sprouts sharp icicles on frozen targets.', effects: { damage: 1, range: 25 } },
        { id: 'ice_b4_impale', name: 'Icicle Impale', cost: 4200, description: 'Icicle spikes deal high pierce damage.', effects: { damage: 6, range: 40, freezeTime: 20 } },
        { id: 'ice_b5_glacier', name: 'Absolute Glacier', cost: 18000, description: 'Giant icicles block whole trails.', effects: { damage: 20, range: 70, freezeTime: 45 } }
      ]
    ]
  },
  super: {
    cost: 2500,
    baseRange: 150,
    baseCooldown: 12,
    description: 'Shoots a rapid stream of energy darts. Extremely expensive but elite.',
    upgrades: [
      [
        { id: 'super_t1_laser', name: 'Laser Blaster', cost: 1250, description: 'Fires high-energy laser beams.', effects: { damage: 1, pierce: 1, bulletType: 'beam' } },
        { id: 'super_t2_plasma', name: 'Plasma Blaster', cost: 2200, description: 'Plasma cut-through speeds up shots.', effects: { damage: 2, pierce: 2, bulletType: 'beam' } },
        { id: 'super_t3_avatar', name: 'Sun Avatar', cost: 8000, description: 'Fires golden energy arcs with massive pierce.', effects: { damage: 4, pierce: 4 } },
        { id: 'super_t4_temple', name: 'Temple of the Sun', cost: 45000, description: 'Unleashes devastating divine blasts.', effects: { damage: 12, pierce: 8, range: 30 } },
        { id: 'super_t5_god', name: 'True Sun God', cost: 150000, description: 'Absolute, final form of popping power.', effects: { damage: 45, pierce: 15, range: 60, cooldownMult: 0.5 } }
      ],
      [
        { id: 'super_m1_range', name: 'Super Range', cost: 1000, description: 'Expands range of darts.', effects: { range: 40 } },
        { id: 'super_m2_epic', name: 'Epic Range', cost: 1500, description: 'Extreme shooting radius.', effects: { range: 80 } },
        { id: 'super_m3_robo', name: 'Robo-Monkey', cost: 7500, description: 'Cybernetic implants double firing speed.', effects: { cooldownMult: 0.5, pierce: 2 } },
        { id: 'super_m4_terror', name: 'Tech Terror', cost: 18000, description: 'Upgraded targeting processors and damage.', effects: { cooldownMult: 0.35, damage: 2 } },
        { id: 'super_m5_annihil', name: 'The Anti-Bloon', cost: 60000, description: 'Anti-matter lasers shred whatever remains.', effects: { cooldownMult: 0.18, damage: 12, pierce: 5 } }
      ],
      [
        { id: 'super_b1_night', name: 'Night Vision', cost: 800, description: 'Grants camo vision and slight range boost.', effects: { range: 20, canSeeCamo: true } },
        { id: 'super_b2_ultravision', name: 'Ultravision Plasma', cost: 1600, description: 'Reveals and vaporizes shielded bloons.', effects: { range: 35, pierce: 1 } },
        { id: 'super_b3_knight', name: 'Dark Knight', cost: 5500, description: 'Throws shadowy blades that slow MOABs.', effects: { damage: 2, pierce: 2 } },
        { id: 'super_b4_champ', name: 'Dark Champion', cost: 19500, description: 'Channels shadows to deal massive damage.', effects: { damage: 8, pierce: 5, range: 45 } },
        { id: 'super_b5_legend', name: 'Legend of the Night', cost: 75000, description: 'He who blocks leaks and commands night sweeps.', effects: { damage: 25, pierce: 10, range: 70, cooldownMult: 0.6 } }
      ]
    ]
  }
};

export const HEROES: HeroConfig[] = [
  {
    id: 'quincy',
    name: 'Quincy',
    description: 'A proud, rapid archer who targets first-bloons with complete precision.',
    quote: '"Nothing gets past my bow!"',
    primaryColor: '#f97316', // orange-500
    baseCost: 500,
    perks: [
      { level: 1, desc: 'Base fast ranged single-target physical arrows' },
      { level: 3, desc: 'Rapid Shot: Fires 2x speed arrows dynamically' },
      { level: 7, desc: 'Arrow Pierce: Arrows pop 2 bloons simultaneously' },
      { level: 15, desc: 'MOAB Slayer: x3 damage multiplier vs MOABs' }
    ]
  },
  {
    id: 'gwendolin',
    name: 'Gwendolin',
    description: 'A pyrotechnic scientist who blasts rows of fire and burns entire clusters.',
    quote: '"Is it hot in here, or is it just me?"',
    primaryColor: '#ef4444', // red-500
    baseCost: 750,
    perks: [
      { level: 1, desc: 'Shoots fireballs dealing modest area splash damage' },
      { level: 4, desc: 'Heat Waves: Ignites popped bloons to burn nearby ones' },
      { level: 8, desc: 'Fire Ring: Periodically shoots fireballs in all directions' },
      { level: 15, desc: 'Supernova Blast: Explodes nearby bloons on pop' }
    ]
  },
  {
    id: 'obyn',
    name: 'Obyn Greenfoot',
    description: 'A quiet nature guardian who plants explosive thorns and slows down fast bloons.',
    quote: '"The spirits of the forest guide us."',
    primaryColor: '#10b981', // emerald-500
    baseCost: 650,
    perks: [
      { level: 1, desc: 'Shoots nature spirits which pop multiple targets' },
      { level: 5, desc: 'Nature Shield: Slows down Yellow and Pink bloons by 20% in passive range' },
      { level: 10, desc: 'Wall of Brambles: Seeds spikes on the track to pop 15 bloons automatically' },
      { level: 15, desc: 'Magic Buff: Grants nearby magical/ice towers +25% range' }
    ]
  }
];

export const PERSISTENT_UPGRADES: PersistentUpgrade[] = [
  {
    id: 'extra_starting_cash',
    name: 'Wealthy Beginnings',
    description: 'Start every campaign with +$150 additional starting cash.',
    cost: 150,
    purchased: false,
    category: 'Economy',
    effect: { startingCashBonus: 150 }
  },
  {
    id: 'btd_discount',
    name: 'Military Trade deals',
    description: 'Get an automatic 8% discount on placing monkeys of all tiers.',
    cost: 250,
    purchased: false,
    category: 'Monkeys',
    effect: { discountMonkeysPercent: 8 }
  },
  {
    id: 'extra_lives',
    name: 'Sturdy Shields',
    description: 'Boost starting shields/lives by +30 points to handle fast leakage.',
    cost: 120,
    purchased: false,
    category: 'Economy',
    effect: { extraLivesBonus: 30 }
  },
  {
    id: 'hero_mentorship',
    name: 'Hero Guild Mentorship',
    description: 'Heroes accumulate experience points 30% quicker, leveling up in no time.',
    cost: 220,
    purchased: false,
    category: 'Hero',
    effect: { heroXpRateBonus: 1.3 }
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'pop_1000',
    title: 'First Blood',
    description: 'Pop a total of 1,000 Bloons across any number of games.',
    isUnlocked: false,
    progress: 0,
    maxProgress: 1000,
    rewardValue: 100
  },
  {
    id: 'pop_10000',
    title: 'Balloon Massacre',
    description: 'Pop a total of 10,000 Bloons! Unlocks elite visual prestige.',
    isUnlocked: false,
    progress: 0,
    maxProgress: 10000,
    rewardValue: 250
  },
  {
    id: 'round_40',
    title: 'Wave Survivor',
    description: 'Successfully conquer Round 40 and survive the first MOAB.',
    isUnlocked: false,
    progress: 0,
    maxProgress: 40,
    rewardValue: 200
  },
  {
    id: 'buy_super',
    title: 'Elite Sponsor',
    description: 'Acquire and place a highly prestigious Sun Disc Super Monkey.',
    isUnlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardValue: 150
  },
  {
    id: 'unlock_all_maps',
    title: 'Global Explorer',
    description: 'Conquer at least 3 maps on any difficulty levels.',
    isUnlocked: false,
    progress: 0,
    maxProgress: 3,
    rewardValue: 300
  }
];

// Returns an array of bloon types representing the sequence of bloons to spawn for a given round
export function generateWave(round: number): { delay: number; type: BloonType }[] {
  const wave: { delay: number; type: BloonType }[] = [];

  // Pacing logic mimics Bloons TD 6 incremental build-up
  if (round === 1) {
    // Round 1: Just slow Red bloons
    for (let i = 0; i < 15; i++) {
      wave.push({ delay: 40 + Math.random() * 30, type: 'Red' });
    }
  } else if (round === 2) {
    for (let i = 0; i < 25; i++) {
      wave.push({ delay: 35 + Math.random() * 25, type: 'Red' });
    }
  } else if (round < 5) {
    // Round 3-4: Mix block of Reds and Blues
    const redCount = 20 + round * 5;
    const blueCount = 5 + round * 2;
    for (let i = 0; i < redCount; i++) wave.push({ delay: 30, type: 'Red' });
    for (let i = 0; i < blueCount; i++) wave.push({ delay: 40, type: 'Blue' });
  } else if (round < 10) {
    // Round 5-9: Introduced Green bloons
    const greenCount = round * 3;
    const blueCount = 15;
    const redCount = 20;
    for (let i = 0; i < redCount; i++) wave.push({ delay: 25, type: 'Red' });
    for (let i = 0; i < blueCount; i++) wave.push({ delay: 30, type: 'Blue' });
    for (let i = 0; i < greenCount; i++) wave.push({ delay: 45, type: 'Green' });
  } else if (round === 10) {
    // Target Boss Wave (Early test)
    for (let i = 0; i < 15; i++) wave.push({ delay: 20, type: 'Blue' });
    for (let i = 0; i < 15; i++) wave.push({ delay: 20, type: 'Green' });
    wave.push({ delay: 100, type: 'Yellow' }); // First glimpse of high speed
  } else if (round < 20) {
    // Introduce Yellows
    const yellowCount = (round - 10) * 4;
    const greenCount = 15;
    for (let i = 0; i < 10; i++) wave.push({ delay: 15, type: 'Blue' });
    for (let i = 0; i < greenCount; i++) wave.push({ delay: 25, type: 'Green' });
    for (let i = 0; i < yellowCount; i++) wave.push({ delay: 35, type: 'Yellow' });
  } else if (round === 20) {
    // Rush wave!
    for (let i = 0; i < 30; i++) wave.push({ delay: 10, type: 'Green' });
    for (let i = 0; i < 20; i++) wave.push({ delay: 15, type: 'Yellow' });
    wave.push({ delay: 80, type: 'Pink' }); // Fast Pink
  } else if (round < 30) {
    // Introduce Pink & Ceramic
    const pinkCount = (round - 20) * 5;
    const yellowCount = 15;
    for (let i = 0; i < yellowCount; i++) wave.push({ delay: 20, type: 'Yellow' });
    for (let i = 0; i < pinkCount; i++) wave.push({ delay: 15, type: 'Pink' });
    if (round >= 25) {
      wave.push({ delay: 120, type: 'Ceramic' }); // First heavy Ceramic target
    }
  } else if (round === 30) {
    // Hard Wave! Clusters of fast Pinks + Ceramic leading
    wave.push({ delay: 40, type: 'Ceramic' });
    for (let i = 0; i < 30; i++) wave.push({ delay: 8, type: 'Pink' });
    wave.push({ delay: 50, type: 'Ceramic' });
  } else if (round < 40) {
    // Intense preparation for MOAB
    const ceramicCount = (round - 30) * 2;
    const pinkCount = 20;
    for (let i = 0; i < ceramicCount; i++) wave.push({ delay: 60, type: 'Ceramic' });
    for (let i = 0; i < pinkCount; i++) wave.push({ delay: 10, type: 'Pink' });
    for (let i = 0; i < 25; i++) wave.push({ delay: 12, type: 'Yellow' });
  } else if (round === 40) {
    // The Famed MOAB Mother Of All Bloons Wave!
    for (let i = 0; i < 10; i++) wave.push({ delay: 20, type: 'Pink' });
    for (let i = 0; i < 4; i++) wave.push({ delay: 50, type: 'Ceramic' });
    wave.push({ delay: 200, type: 'MOAB' }); // Boss blimp!
  } else {
    // Post-round 40 madness (Infinite play Scaling)
    const multiplier = round - 40;
    wave.push({ delay: 100, type: 'MOAB' });
    if (multiplier % 5 === 0) {
      wave.push({ delay: 150, type: 'MOAB' });
    }
    const ceramicCount = Math.min(20, 4 + multiplier * 2);
    for (let i = 0; i < ceramicCount; i++) {
      wave.push({ delay: 40, type: 'Ceramic' });
    }
    for (let i = 0; i < 30; i++) {
      wave.push({ delay: 10, type: 'Pink' });
    }
  }

  // Shuffle delays slightly to make columns less mechanical
  return wave;
}

// Bloon specifications metadata helper
export function getBloonStyle(type: BloonType): {
  speed: number;
  hp: number;
  size: number;
  color: string;
  reward: number;
  label: string;
} {
  switch (type) {
    case 'Red':
      return { speed: 1.1, hp: 1, size: 10, color: '#ffffff', reward: 1, label: 'Red' };
    case 'Blue':
      return { speed: 1.4, hp: 1, size: 11, color: '#3b82f6', reward: 1, label: 'Blue' };
    case 'Green':
      return { speed: 1.8, hp: 1, size: 12, color: '#10b981', reward: 1, label: 'Green' };
    case 'Yellow':
      return { speed: 2.8, hp: 1, size: 13, color: '#facc15', reward: 1, label: 'Yellow' };
    case 'Pink':
      return { speed: 3.5, hp: 1, size: 13, color: '#ec4899', reward: 1, label: 'Pink' };
    case 'Ceramic':
      return { speed: 2.2, hp: 10, size: 15, color: '#a1a1aa', reward: 2, label: 'Ceramic' };
    case 'MOAB':
      return { speed: 0.7, hp: 200, size: 30, color: '#06b6d4', reward: 15, label: 'MOAB' };
  }
}

// Child Bloon Spawn definition
export function getChildBloonType(type: BloonType): BloonType | null {
  switch (type) {
    case 'MOAB': return 'Ceramic'; // Spawns ceramics
    case 'Ceramic': return 'Pink';
    case 'Pink': return 'Yellow';
    case 'Yellow': return 'Green';
    case 'Green': return 'Blue';
    case 'Blue': return 'Red';
    case 'Red': return null;
  }
}

// Get the quantity of child bloons when popped
export function getChildCount(type: BloonType): number {
  switch (type) {
    case 'MOAB': return 4; // BTD6 typical MOAB releases massive children
    case 'Ceramic': return 2;
    default: return 1;
  }
}
