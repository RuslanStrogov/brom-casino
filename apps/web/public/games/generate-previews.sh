#!/bin/bash
# Generate SVG preview images for all games
# Each SVG has a neon gradient background, game name, and provider

OUTPUT_DIR="$(dirname "$0")"

# Color palette per provider
declare -A PROVIDER_COLORS
PROVIDER_COLORS[pragmatic]="#ff2d95,#ff6b35"
PROVIDER_COLORS[spribe]="#00ff88,#00ccff"
PROVIDER_COLORS[netent]="#7b2ff7,#c471ed"
PROVIDER_COLORS[playngo]="#ff6b35,#ff2d95"
PROVIDER_COLORS[evolution]="#00d4ff,#7b2ff7"
PROVIDER_COLORS[playtech]="#ff2d95,#7b2ff7"
PROVIDER_COLORS[pushgaming]="#00ff88,#00d4ff"
PROVIDER_COLORS[hacksaw]="#ff6b35,#ff2d95"
PROVIDER_COLORS[redtiger]="#c471ed,#00d4ff"
PROVIDER_COLORS[yggdrasil]="#00ccff,#00ff88"
PROVIDER_COLORS[microgaming]="#7b2ff7,#ff2d95"
PROVIDER_COLORS[relaxgaming]="#00ff88,#ff6b35"
PROVIDER_COLORS[truelab]="#c471ed,#ff2d95"
PROVIDER_COLORS[elkstudios]="#00d4ff,#7b2ff7"
PROVIDER_COLORS[thunderkick]="#ff6b35,#00ff88"
PROVIDER_COLORS[nolimitcity]="#ff2d95,#00d4ff"
PROVIDER_COLORS[slotmill]="#7b2ff7,#00ff88"
PROVIDER_COLORS[bgaming]="#00ccff,#ff6b35"

# Provider display names
declare -A PROVIDER_NAMES
PROVIDER_NAMES[pragmatic]="Pragmatic Play"
PROVIDER_NAMES[spribe]="Spribe"
PROVIDER_NAMES[netent]="NetEnt"
PROVIDER_NAMES[playngo]="Play'n GO"
PROVIDER_NAMES[evolution]="Evolution"
PROVIDER_NAMES[playtech]="Playtech"
PROVIDER_NAMES[pushgaming]="Push Gaming"
PROVIDER_NAMES[hacksaw]="Hacksaw Gaming"
PROVIDER_NAMES[redtiger]="Red Tiger"
PROVIDER_NAMES[yggdrasil]="Yggdrasil"
PROVIDER_NAMES[microgaming]="Microgaming"
PROVIDER_NAMES[relaxgaming]="Relax Gaming"
PROVIDER_NAMES[truelab]="TrueLab"
PROVIDER_NAMES[elkstudios]="ELK Studios"
PROVIDER_NAMES[thunderkick]="Thunderkick"
PROVIDER_NAMES[nolimitcity]="NoLimit City"
PROVIDER_NAMES[slotmill]="Slotmill"
PROVIDER_NAMES[bgaming]="BGaming"

# Game data: slug|provider|name
GAMES=(
  "mines|spribe|Mines"
  "aviator|spribe|Aviator"
  "crazy-time|pragmatic|Crazy Time"
  "speed-baccarat|evolution|Speed Baccarat"
  "lightning-roulette|evolution|Lightning Roulette"
  "sic-bo|playtech|Sic Bo"
  "casino-holdem|pragmatic|Casino Hold'em"
  "roulette-lobby|pragmatic|Roulette Lobby"
  "infinite-blackjack|evolution|Infinite Blackjack"
  "baccarat-squeeze|evolution|Baccarat Squeeze"
  "mystery-reels|redtiger|Mystery Reels"
  "1001-nights|redtiger|1001 Nights"
  "razor-sharp|pushgaming|Razor Sharp"
  "stick-em|hacksaw|Stick Em"
  "wanted-dead-or-wild|hacksaw|Wanted Dead or a Wild"
  "gold-fever|yggdrasil|Gold Fever"
  "vikings-go-berzerk|yggdrasil|Vikings Go Berzerk"
  "valley-of-the-gods|yggdrasil|Valley of the Gods"
  "rise-of-olympus|playngo|Rise of Olympus"
  "fire-joker|playngo|Fire Joker"
  "reactoonz|playngo|Reactoonz"
  "book-of-dead|playngo|Book of Dead"
  "thunderstruck-2|microgaming|Thunderstruck II"
  "mega-moolah|microgaming|Mega Moolah"
  "immortal-romance|microgaming|Immortal Romance"
  "twin-spin|netent|Twin Spin"
  "divine-fortune|netent|Divine Fortune"
  "dead-or-alive-2|netent|Dead or Alive 2"
  "gonzo-quest|netent|Gonzo's Quest"
  "starburst|netent|Starburst"
  "sugar-rush|pragmatic|Sugar Rush"
  "dog-house-megaways|pragmatic|The Dog House Megaways"
  "fruit-party|pragmatic|Fruit Party"
  "starlight-princess|pragmatic|Starlight Princess"
  "gates-of-olympus|pragmatic|Gates of Olympus"
  "smash-n-grab|relaxgaming|Smash 'N' Grab"
  "dr-rock-riff-reactor-2|truelab|Dr. Rock & the Riff Reactor 2"
  "boomberries|elkstudios|Boomberries"
  "temple-of-akhet|thunderkick|Temple of Akhet"
  "tanked-3-first-blood-2|nolimitcity|Tanked 3: First Blood 2"
  "wildhalla|slotmill|Wildhalla"
  "fury-of-anubis|pragmatic|Fury of Anubis"
  "frenzy-clusters|bgaming|Frenzy Clusters"
  "great-game-rockies|hacksaw|Great Game Rockies"
  "shark-feast|playngo|Shark Feast"
)

# Generate each game icon
for GAME_INFO in "${GAMES[@]}"; do
  SLUG="${GAME_INFO%%|*}"
  REST="${GAME_INFO#*|}"
  PROVIDER="${REST%%|*}"
  NAME="${REST#*|}"

  COLORS="${PROVIDER_COLORS[$PROVIDER]:-#ff2d95,#7b2ff7}"
  COLOR1="${COLORS%,*}"
  COLOR2="${COLORS#*,}"
  PNAME="${PROVIDER_NAMES[$PROVIDER]:-$PROVIDER}"

  # Get first letter of game name for the icon
  FIRST_LETTER="${NAME:0:1}"

  cat > "$OUTPUT_DIR/${SLUG}.svg" << SVGEOF
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${COLOR1};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${COLOR2};stop-opacity:0.15" />
    </linearGradient>
    <linearGradient id="bg2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${COLOR1};stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:${COLOR2};stop-opacity:0.05" />
    </linearGradient>
    <linearGradient id="border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${COLOR1}" />
      <stop offset="100%" style="stop-color:${COLOR2}" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="glowStrong">
      <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Dark background -->
  <rect width="400" height="300" rx="16" fill="#0a0a1a"/>
  <!-- Gradient overlay -->
  <rect width="400" height="300" rx="16" fill="url(#bg)"/>
  <rect width="400" height="300" rx="16" fill="url(#bg2)"/>
  <!-- Border -->
  <rect x="1" y="1" width="398" height="298" rx="15" fill="none" stroke="url(#border)" stroke-width="0.5" opacity="0.5"/>
  <!-- Decorative circles -->
  <circle cx="50" cy="250" r="120" fill="${COLOR1}" opacity="0.08"/>
  <circle cx="350" cy="50" r="100" fill="${COLOR2}" opacity="0.08"/>
  <!-- Game icon placeholder - big letter -->
  <text x="200" y="140" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="${COLOR1}" opacity="0.6" filter="url(#glowStrong)">${FIRST_LETTER}</text>
  <!-- Game name -->
  <text x="200" y="195" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" filter="url(#glow)">${NAME}</text>
  <!-- Provider badge -->
  <rect x="130" y="215" width="140" height="24" rx="12" fill="${COLOR1}" opacity="0.2"/>
  <text x="200" y="232" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="${COLOR1}">${PNAME}</text>
  <!-- Play button hint -->
  <circle cx="200" cy="265" r="16" fill="none" stroke="${COLOR1}" stroke-width="1.5" opacity="0.5"/>
  <polygon points="193,257 193,273 208,265" fill="${COLOR1}" opacity="0.5"/>
</svg>
SVGEOF

  echo "Generated: ${SLUG}.svg"
done

echo ""
echo "All game previews generated!"