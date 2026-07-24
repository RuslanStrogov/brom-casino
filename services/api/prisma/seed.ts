import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ==================== CLEAN EXISTING DATA ====================
  console.log('🧹 Cleaning existing data...');
  await prisma.bet.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.userBonus.deleteMany();
  await prisma.bonus.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.kycVerification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.game.deleteMany();
  await prisma.user.deleteMany();

  // ==================== USERS ====================
  console.log('👤 Creating users...');

  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const playerPasswordHash = await bcrypt.hash('Player123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@brom.casino',
      username: 'admin',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      isPhoneVerified: true,
      referralCode: 'ADMIN001',
      vipLevel: 5,
    },
  });

  const player = await prisma.user.create({
    data: {
      email: 'player@brom.casino',
      username: 'player',
      passwordHash: playerPasswordHash,
      firstName: 'Test',
      lastName: 'Player',
      role: 'PLAYER',
      status: 'ACTIVE',
      isEmailVerified: true,
      isPhoneVerified: false,
      referralCode: 'PLAYER001',
      vipLevel: 1,
    },
  });

  // Create a second player for referral testing
  const player2 = await prisma.user.create({
    data: {
      email: 'player2@brom.casino',
      username: 'highroller',
      passwordHash: playerPasswordHash,
      firstName: 'High',
      lastName: 'Roller',
      role: 'PLAYER',
      status: 'ACTIVE',
      isEmailVerified: true,
      referralCode: 'HIGH001',
      referredBy: player.id,
      vipLevel: 3,
      totalWagered: new Prisma.Decimal(50000),
      totalWon: new Prisma.Decimal(42000),
    },
  });

  // ==================== WALLETS ====================
  console.log('💰 Creating wallets...');

  await prisma.wallet.create({
    data: {
      userId: admin.id,
      balance: new Prisma.Decimal(100000),
      bonusBalance: new Prisma.Decimal(0),
      currency: 'USDT',
    },
  });

  await prisma.wallet.create({
    data: {
      userId: player.id,
      balance: new Prisma.Decimal(5000),
      bonusBalance: new Prisma.Decimal(100),
      currency: 'USDT',
    },
  });

  await prisma.wallet.create({
    data: {
      userId: player2.id,
      balance: new Prisma.Decimal(25000),
      bonusBalance: new Prisma.Decimal(500),
      currency: 'USDT',
    },
  });

  // ==================== GAMES ====================
  console.log('🎰 Creating games...');

  // --- SLOTS (20+ from different providers) ---
  const slotsData = [
    // Pragmatic Play
    { providerId: 'pragmatic', externalId: 'vs20olympgate', name: 'Gates of Olympus', slug: 'gates-of-olympus', category: 'SLOTS' as const, rtp: 96.5, volatility: 'HIGH' as const, minBet: 0.2, maxBet: 1000, isFeatured: true, isNew: false, freeSpins: true, tags: ['olympus', 'scatter', 'multiplier'] },
    { providerId: 'pragmatic', externalId: 'vs20starlight', name: 'Starlight Princess', slug: 'starlight-princess', category: 'SLOTS' as const, rtp: 96.5, volatility: 'HIGH' as const, minBet: 0.2, maxBet: 1000, isFeatured: true, tags: ['anime', 'scatter', 'multiplier'] },
    { providerId: 'pragmatic', externalId: 'vs20fruity', name: 'Fruit Party', slug: 'fruit-party', category: 'SLOTS' as const, rtp: 96.47, volatility: 'VERY_HIGH' as const, minBet: 0.2, maxBet: 1000, tags: ['cluster', 'random', 'multiplier'] },
    { providerId: 'pragmatic', externalId: 'vswaysdogs', name: 'The Dog House Megaways', slug: 'dog-house-megaways', category: 'SLOTS' as const, rtp: 96.55, volatility: 'VERY_HIGH' as const, minBet: 0.1, maxBet: 1250, isFeatured: true, freeSpins: true, tags: ['megaways', 'dog', 'free-spins'] },
    { providerId: 'pragmatic', externalId: 'vs20sugarrush', name: 'Sugar Rush', slug: 'sugar-rush', category: 'SLOTS' as const, rtp: 96.5, volatility: 'HIGH' as const, minBet: 0.2, maxBet: 1000, tags: ['candy', 'cluster', 'multiplier'] },
    // NetEnt
    { providerId: 'netent', externalId: 'starburst', name: 'Starburst', slug: 'starburst', category: 'SLOTS' as const, rtp: 96.09, volatility: 'LOW' as const, minBet: 0.1, maxBet: 100, isFeatured: true, isNew: false, tags: ['classic', 'expanding', 'wilds'] },
    { providerId: 'netent', externalId: 'gonzo', name: 'Gonzo\'s Quest', slug: 'gonzo-quest', category: 'SLOTS' as const, rtp: 95.97, volatility: 'HIGH' as const, minBet: 0.2, maxBet: 500, tags: ['adventure', 'avalanche', 'free-fall'] },
    { providerId: 'netent', externalId: 'dead_or_alive', name: 'Dead or Alive 2', slug: 'dead-or-alive-2', category: 'SLOTS' as const, rtp: 96.82, volatility: 'VERY_HIGH' as const, minBet: 0.09, maxBet: 18, tags: ['wild-west', 'sticky-wilds', 'high-volatility'] },
    { providerId: 'netent', externalId: 'divine_fortune', name: 'Divine Fortune', slug: 'divine-fortune', category: 'SLOTS' as const, rtp: 96.59, volatility: 'MEDIUM' as const, minBet: 0.2, maxBet: 400, isJackpot: true, tags: ['jackpot', 'mythology', 'progressive'] },
    { providerId: 'netent', externalId: 'twin_spin', name: 'Twin Spin', slug: 'twin-spin', category: 'SLOTS' as const, rtp: 96.65, volatility: 'MEDIUM' as const, minBet: 0.25, maxBet: 250, tags: ['retro', 'linked-reels', 'classic'] },
    // Microgaming
    { providerId: 'microgaming', externalId: 'immortal_romance', name: 'Immortal Romance', slug: 'immortal-romance', category: 'SLOTS' as const, rtp: 96.86, volatility: 'MEDIUM' as const, minBet: 0.3, maxBet: 30, tags: ['vampire', 'story', 'free-spins'] },
    { providerId: 'microgaming', externalId: 'mega_moolah', name: 'Mega Moolah', slug: 'mega-moolah', category: 'SLOTS' as const, rtp: 88.12, volatility: 'MEDIUM' as const, minBet: 0.25, maxBet: 6.25, isJackpot: true, isFeatured: true, tags: ['jackpot', 'progressive', 'africa'] },
    { providerId: 'microgaming', externalId: 'thunderstruck2', name: 'Thunderstruck II', slug: 'thunderstruck-2', category: 'SLOTS' as const, rtp: 96.65, volatility: 'MEDIUM' as const, minBet: 0.3, maxBet: 30, tags: ['norse', 'mythology', 'free-spins'] },
    // Play'n GO
    { providerId: 'playngo', externalId: 'book_of_dead', name: 'Book of Dead', slug: 'book-of-dead', category: 'SLOTS' as const, rtp: 96.21, volatility: 'HIGH' as const, minBet: 0.01, maxBet: 100, isFeatured: true, freeSpins: true, tags: ['egypt', 'adventure', 'expanding-symbols'] },
    { providerId: 'playngo', externalId: 'reactoonz', name: 'Reactoonz', slug: 'reactoonz', category: 'SLOTS' as const, rtp: 96.51, volatility: 'HIGH' as const, minBet: 0.2, maxBet: 100, tags: ['alien', 'cluster', 'cascade'] },
    { providerId: 'playngo', externalId: 'fire_joker', name: 'Fire Joker', slug: 'fire-joker', category: 'SLOTS' as const, rtp: 96.18, volatility: 'MEDIUM' as const, minBet: 0.05, maxBet: 100, tags: ['classic', 'joker', 're-spins'] },
    { providerId: 'playngo', externalId: 'rise_of_olympus', name: 'Rise of Olympus', slug: 'rise-of-olympus', category: 'SLOTS' as const, rtp: 96.5, volatility: 'HIGH' as const, minBet: 0.1, maxBet: 100, tags: ['greek', 'olympus', 'free-spins'] },
    // Yggdrasil
    { providerId: 'yggdrasil', externalId: 'valley_of_the_gods', name: 'Valley of the Gods', slug: 'valley-of-the-gods', category: 'SLOTS' as const, rtp: 96.38, volatility: 'HIGH' as const, minBet: 0.25, maxBet: 125, tags: ['egypt', 'jackpot', 'redrops'] },
    { providerId: 'yggdrasil', externalId: 'vikings_go_berzerk', name: 'Vikings Go Berzerk', slug: 'vikings-go-berzerk', category: 'SLOTS' as const, rtp: 96.1, volatility: 'HIGH' as const, minBet: 0.2, maxBet: 100, tags: ['viking', 'rage', 'free-spins'] },
    { providerId: 'yggdrasil', externalId: 'gold_fever', name: 'Gold Fever', slug: 'gold-fever', category: 'SLOTS' as const, rtp: 96.1, volatility: 'MEDIUM' as const, minBet: 0.1, maxBet: 50, tags: ['progressive', 'jackpot', 'gold'] },
    // Hacksaw Gaming
    { providerId: 'hacksaw', externalId: 'wanted_dead', name: 'Wanted Dead or a Wild', slug: 'wanted-dead-or-wild', category: 'SLOTS' as const, rtp: 96.38, volatility: 'HIGH' as const, minBet: 0.1, maxBet: 300, tags: ['western', 'outlaw', 'hacksaw'] },
    { providerId: 'hacksaw', externalId: 'stick_em', name: 'Stick Em', slug: 'stick-em', category: 'SLOTS' as const, rtp: 96.2, volatility: 'VERY_HIGH' as const, minBet: 0.1, maxBet: 250, tags: ['classic', 'retro', 'hacksaw'] },
    // Push Gaming
    { providerId: 'pushgaming', externalId: 'razor_sharp', name: 'Razor Sharp', slug: 'razor-sharp', category: 'SLOTS' as const, rtp: 96.42, volatility: 'HIGH' as const, minBet: 0.1, maxBet: 100, tags: ['underwater', 'clusters', 'push'] },
    // Red Tiger
    { providerId: 'redtiger', externalId: '10001_nights', name: '1001 Nights', slug: '1001-nights', category: 'SLOTS' as const, rtp: 95.73, volatility: 'MEDIUM' as const, minBet: 0.1, maxBet: 200, tags: ['arabian', 'genie', 'features'] },
    { providerId: 'redtiger', externalId: 'mystery_reels', name: 'Mystery Reels', slug: 'mystery-reels', category: 'SLOTS' as const, rtp: 96.31, volatility: 'MEDIUM' as const, minBet: 0.1, maxBet: 40, tags: ['fruit', 'mystery', 'megaways'] },
    // BGaming
    { providerId: 'bgaming', externalId: 'frenzy_clusters', name: 'Frenzy Clusters', slug: 'frenzy-clusters', category: 'SLOTS' as const, rtp: 96.5, volatility: 'HIGH' as const, minBet: 0.1, maxBet: 500, tags: ['cluster', 'candy', 'bgaming'] },
    // Habanero
    { providerId: 'habanero', externalId: 'hot_dice', name: 'Hot Dice', slug: 'hot-dice', category: 'SLOTS' as const, rtp: 96.8, volatility: 'MEDIUM' as const, minBet: 0.1, maxBet: 1000, isNew: true, tags: ['dice', 'habanero', 'hot'] },
    { providerId: 'habanero', externalId: 'egyptian_dreams', name: 'Egyptian Dreams', slug: 'egyptian-dreams', category: 'SLOTS' as const, rtp: 96.5, volatility: 'HIGH' as const, minBet: 0.1, maxBet: 500, tags: ['egypt', 'habanero', 'adventure'] },
  ];

  const createdGames: { id: string; category: string }[] = [];

  for (const game of slotsData) {
    // Providers with working public embeddable iframe demos
    const demoOk = ['pragmatic', 'spribe', 'bgaming', 'habanero', 'netent', 'wazdan', 'evoplay'].includes(game.providerId);
    const created = await prisma.game.create({
      data: {
        providerId: game.providerId,
        externalId: game.externalId,
        name: game.name,
        slug: game.slug,
        category: game.category,
        rtp: new Prisma.Decimal(game.rtp.toString()),
        volatility: game.volatility,
        minBet: new Prisma.Decimal(game.minBet.toString()),
        maxBet: new Prisma.Decimal(game.maxBet.toString()),
        isFeatured: game.isFeatured ?? false,
        isNew: game.isNew ?? false,
        isJackpot: game.isJackpot ?? false,
        freeSpins: game.freeSpins ?? false,
        demoAvailable: demoOk,
        tags: game.tags,
        sortOrder: 0,
      },
    });
    createdGames.push({ id: created.id, category: created.category });
  }

  // --- TABLE GAMES (5) ---
  const tableGamesData = [
    { providerId: 'evolution', externalId: 'baccarat_01', name: 'Baccarat Squeeze', slug: 'baccarat-squeeze', category: 'TABLE' as const, rtp: 98.94, volatility: 'LOW' as const, minBet: 1, maxBet: 10000, isFeatured: true, tags: ['baccarat', 'squeeze', 'classic'] },
    { providerId: 'evolution', externalId: 'blackjack_01', name: 'Infinite Blackjack', slug: 'infinite-blackjack', category: 'TABLE' as const, rtp: 99.5, volatility: 'LOW' as const, minBet: 0.5, maxBet: 5000, isFeatured: true, tags: ['blackjack', 'unlimited', 'classic'] },
    { providerId: 'pragmatic', externalId: 'roulette_01', name: 'Roulette Lobby', slug: 'roulette-lobby', category: 'TABLE' as const, rtp: 97.3, volatility: 'LOW' as const, minBet: 0.1, maxBet: 5000, tags: ['roulette', 'european', 'classic'] },
    { providerId: 'pragmatic', externalId: 'holdem_01', name: 'Casino Hold\'em', slug: 'casino-holdem', category: 'TABLE' as const, rtp: 97.5, volatility: 'MEDIUM' as const, minBet: 0.5, maxBet: 2500, tags: ['poker', 'holdem', 'cards'] },
    { providerId: 'playtech', externalId: 'sicbo_01', name: 'Sic Bo', slug: 'sic-bo', category: 'TABLE' as const, rtp: 97.2, volatility: 'MEDIUM' as const, minBet: 0.5, maxBet: 1000, tags: ['dice', 'asian', 'sicbo'] },
  ];

  for (const game of tableGamesData) {
    // Evolution games are live-only — no demo available
    const demoOk = !['evolution'].includes(game.providerId);
    const created = await prisma.game.create({
      data: {
        providerId: game.providerId,
        externalId: game.externalId,
        name: game.name,
        slug: game.slug,
        category: game.category,
        rtp: new Prisma.Decimal(game.rtp.toString()),
        volatility: game.volatility,
        minBet: new Prisma.Decimal(game.minBet.toString()),
        maxBet: new Prisma.Decimal(game.maxBet.toString()),
        isFeatured: game.isFeatured ?? false,
        demoAvailable: demoOk,
        tags: game.tags,
        sortOrder: 0,
      },
    });
    createdGames.push({ id: created.id, category: created.category });
  }

  // --- LIVE GAMES (3) ---
  const liveGamesData = [
    { providerId: 'evolution', externalId: 'live_roulette_01', name: 'Lightning Roulette', slug: 'lightning-roulette', category: 'LIVE' as const, rtp: 97.3, volatility: 'MEDIUM' as const, minBet: 0.2, maxBet: 10000, isFeatured: true, isNew: true, tags: ['roulette', 'lightning', 'multipliers', 'live'] },
    { providerId: 'evolution', externalId: 'live_baccarat_01', name: 'Speed Baccarat', slug: 'speed-baccarat', category: 'LIVE' as const, rtp: 98.94, volatility: 'LOW' as const, minBet: 1, maxBet: 15000, isFeatured: true, tags: ['baccarat', 'speed', 'live'] },
    { providerId: 'pragmatic', externalId: 'live_crazy_time', name: 'Crazy Time', slug: 'crazy-time', category: 'LIVE' as const, rtp: 96.44, volatility: 'HIGH' as const, minBet: 0.1, maxBet: 5000, isFeatured: true, isNew: true, tags: ['wheel', 'bonus', 'live', 'show'] },
  ];

  for (const game of liveGamesData) {
    const created = await prisma.game.create({
      data: {
        providerId: game.providerId,
        externalId: game.externalId,
        name: game.name,
        slug: game.slug,
        category: game.category,
        rtp: new Prisma.Decimal(game.rtp.toString()),
        volatility: game.volatility,
        minBet: new Prisma.Decimal(game.minBet.toString()),
        maxBet: new Prisma.Decimal(game.maxBet.toString()),
        isFeatured: game.isFeatured ?? false,
        isNew: game.isNew ?? false,
        demoAvailable: false,
        tags: game.tags,
        sortOrder: 0,
      },
    });
    createdGames.push({ id: created.id, category: created.category });
  }

  // --- CRASH / OTHER GAMES ---
  const crashGamesData = [
    { providerId: 'spribe', externalId: 'aviator', name: 'Aviator', slug: 'aviator', category: 'CRASH' as const, rtp: 97, volatility: 'HIGH' as const, minBet: 0.1, maxBet: 1000, isFeatured: true, isNew: true, tags: ['crash', 'aviator', 'multiplier'] },
    { providerId: 'spribe', externalId: 'mines', name: 'Mines', slug: 'mines', category: 'CRASH' as const, rtp: 97, volatility: 'MEDIUM' as const, minBet: 0.1, maxBet: 500, tags: ['minesweeper', 'crash', 'strategy'] },
  ];

  for (const game of crashGamesData) {
    const created = await prisma.game.create({
      data: {
        providerId: game.providerId,
        externalId: game.externalId,
        name: game.name,
        slug: game.slug,
        category: game.category,
        rtp: new Prisma.Decimal(game.rtp.toString()),
        volatility: game.volatility,
        minBet: new Prisma.Decimal(game.minBet.toString()),
        maxBet: new Prisma.Decimal(game.maxBet.toString()),
        isFeatured: game.isFeatured ?? false,
        isNew: game.isNew ?? false,
        demoAvailable: true,
        tags: game.tags,
        sortOrder: 0,
      },
    });
    createdGames.push({ id: created.id, category: created.category });
  }

  // --- OWN IN-HOUSE GAMES (always work — native React components) ---
  const ownGamesData = [
    { externalId: 'crash', name: 'Crash', slug: 'crash', category: 'CRASH' as const, rtp: 97, volatility: 'HIGH' as const, minBet: 0.1, maxBet: 1000, isFeatured: true, isNew: true, tags: ['crash', 'in-house', 'multiplier'] },
    { externalId: 'dice', name: 'Dice', slug: 'dice', category: 'TABLE' as const, rtp: 97, volatility: 'MEDIUM' as const, minBet: 0.1, maxBet: 500, isFeatured: true, tags: ['dice', 'in-house', 'provably-fair'] },
    { externalId: 'plinko', name: 'Plinko', slug: 'plinko', category: 'TABLE' as const, rtp: 96, volatility: 'MEDIUM' as const, minBet: 0.1, maxBet: 500, isFeatured: true, tags: ['plinko', 'in-house', 'risk'] },
    { externalId: 'blackjack', name: 'Blackjack', slug: 'blackjack', category: 'TABLE' as const, rtp: 99.5, volatility: 'LOW' as const, minBet: 0.5, maxBet: 5000, isFeatured: true, tags: ['blackjack', 'in-house', 'cards'] },
    { externalId: 'roulette', name: 'Roulette', slug: 'roulette', category: 'TABLE' as const, rtp: 97.3, volatility: 'MEDIUM' as const, minBet: 0.1, maxBet: 5000, isFeatured: true, tags: ['roulette', 'in-house', 'european'] },
    { externalId: 'slots', name: 'Slot Machine', slug: 'slots', category: 'SLOTS' as const, rtp: 96, volatility: 'MEDIUM' as const, minBet: 0.1, maxBet: 500, isFeatured: true, tags: ['slots', 'in-house', 'classic'] },
  ];

  for (const game of ownGamesData) {
    const created = await prisma.game.create({
      data: {
        providerId: 'own',
        externalId: game.externalId,
        name: game.name,
        slug: game.slug,
        category: game.category,
        rtp: new Prisma.Decimal(game.rtp.toString()),
        volatility: game.volatility,
        minBet: new Prisma.Decimal(game.minBet.toString()),
        maxBet: new Prisma.Decimal(game.maxBet.toString()),
        isFeatured: game.isFeatured ?? false,
        isNew: game.isNew ?? false,
        demoAvailable: true,
        tags: game.tags,
        sortOrder: 0,
      },
    });
    createdGames.push({ id: created.id, category: created.category });
  }

  console.log(`✅ Created ${createdGames.length} games`);

  // ==================== BONUSES ====================
  console.log('🎁 Creating bonuses...');

  const welcomeBonus = await prisma.bonus.create({
    data: {
      name: 'Welcome Bonus',
      description: '100% match up to 500 USDT + 50 Free Spins on Gates of Olympus',
      type: 'WELCOME',
      status: 'ACTIVE',
      amount: new Prisma.Decimal(100), // 100% match
      maxAmount: new Prisma.Decimal(500),
      freeSpins: 50,
      wageringRequirement: 35,
      minDeposit: new Prisma.Decimal(20),
      maxBetWithBonus: new Prisma.Decimal(5),
      eligibleCategories: ['SLOTS'],
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      maxClaims: 1000,
      perUserLimit: 1,
      code: 'WELCOME100',
    },
  });

  const depositMatchBonus = await prisma.bonus.create({
    data: {
      name: 'Deposit Match 200%',
      description: '200% match up to 1000 USDT on your 3rd deposit',
      type: 'DEPOSIT_MATCH',
      status: 'ACTIVE',
      amount: new Prisma.Decimal(200), // 200% match
      maxAmount: new Prisma.Decimal(1000),
      wageringRequirement: 40,
      minDeposit: new Prisma.Decimal(50),
      maxBetWithBonus: new Prisma.Decimal(10),
      eligibleGames: [],
      eligibleCategories: ['SLOTS', 'TABLE'],
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      maxClaims: 500,
      perUserLimit: 1,
      code: 'TRIPLE200',
    },
  });

  const freeSpinsBonus = await prisma.bonus.create({
    data: {
      name: 'Free Spins Friday',
      description: '100 Free Spins on Book of Dead - no wagering!',
      type: 'FREE_SPINS',
      status: 'ACTIVE',
      freeSpins: 100,
      wageringRequirement: 0,
      minDeposit: new Prisma.Decimal(25),
      eligibleGames: [createdGames.find(g => g.category === 'SLOTS')!.id],
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      maxClaims: 200,
      perUserLimit: 1,
      code: 'SPINS100',
    },
  });

  const cashbackBonus = await prisma.bonus.create({
    data: {
      name: 'Weekly Cashback',
      description: '10% cashback on net losses every Monday',
      type: 'CASHBACK',
      status: 'ACTIVE',
      amount: new Prisma.Decimal(10), // 10% cashback
      maxAmount: new Prisma.Decimal(200),
      wageringRequirement: 5,
      minDeposit: new Prisma.Decimal(0),
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      maxClaims: null, // unlimited
      perUserLimit: 1,
      code: 'CASHBACK10',
    },
  });

  const dailyBonus = await prisma.bonus.create({
    data: {
      name: 'Daily Reload',
      description: '50% match up to 100 USDT every day',
      type: 'DAILY',
      status: 'ACTIVE',
      amount: new Prisma.Decimal(50),
      maxAmount: new Prisma.Decimal(100),
      wageringRequirement: 30,
      minDeposit: new Prisma.Decimal(10),
      maxBetWithBonus: new Prisma.Decimal(5),
      eligibleCategories: ['SLOTS', 'TABLE', 'LIVE'],
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxClaims: null,
      perUserLimit: 1,
      code: 'DAILY50',
    },
  });

  const noDepositBonus = await prisma.bonus.create({
    data: {
      name: 'No Deposit Bonus',
      description: '20 Free Spins just for signing up!',
      type: 'NO_DEPOSIT',
      status: 'ACTIVE',
      freeSpins: 20,
      wageringRequirement: 40,
      maxAmount: new Prisma.Decimal(50),
      eligibleCategories: ['SLOTS'],
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxClaims: 100,
      perUserLimit: 1,
      code: 'NODEPOSIT20',
    },
  });

  console.log('✅ Created 6 bonuses');

  // ==================== USER BONUSES ====================
  console.log('🎫 Assigning bonuses to users...');

  await prisma.userBonus.create({
    data: {
      userId: player.id,
      bonusId: welcomeBonus.id,
      status: 'ACTIVE',
      amount: new Prisma.Decimal(100),
      wageringRequired: new Prisma.Decimal(3500), // 100 * 35x
      wageringProgress: new Prisma.Decimal(0),
      freeSpinsTotal: 50,
      freeSpinsUsed: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.userBonus.create({
    data: {
      userId: player.id,
      bonusId: dailyBonus.id,
      status: 'WAGERING',
      amount: new Prisma.Decimal(50),
      wageringRequired: new Prisma.Decimal(1500), // 50 * 30x
      wageringProgress: new Prisma.Decimal(750),
      expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.userBonus.create({
    data: {
      userId: player2.id,
      bonusId: cashbackBonus.id,
      status: 'COMPLETED',
      amount: new Prisma.Decimal(200),
      wageringRequired: new Prisma.Decimal(1000),
      wageringProgress: new Prisma.Decimal(1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Assigned 3 user bonuses');

  // ==================== GAME SESSIONS & BETS ====================
  console.log('🎮 Creating game sessions and bets...');

  const slotGames = createdGames.filter(g => g.category === 'SLOTS');
  const tableGamesList = createdGames.filter(g => g.category === 'TABLE');
  const liveGamesList = createdGames.filter(g => g.category === 'LIVE');

  // Create game sessions for player
  const sessionToken1 = `sess_${Date.now()}_1`;
  const gameSession1 = await prisma.gameSession.create({
    data: {
      userId: player.id,
      gameId: slotGames[0].id,
      sessionToken: sessionToken1,
      mode: 'real',
      totalBet: new Prisma.Decimal(50),
      totalWin: new Prisma.Decimal(75),
      spinsCount: 25,
      serverSeed: 'server_seed_hash_' + Date.now(),
      serverHash: 'hash_' + Date.now(),
      clientSeed: 'client_seed_' + Date.now(),
      nonce: 25,
      startedAt: new Date(Date.now() - 3600000),
      endedAt: new Date(Date.now() - 3000000),
    },
  });

  // Create bets for session 1
  for (let i = 0; i < 5; i++) {
    await prisma.bet.create({
      data: {
        userId: player.id,
        gameId: slotGames[0].id,
        gameSessionId: gameSession1.id,
        amount: new Prisma.Decimal(10),
        winAmount: new Prisma.Decimal(Math.random() > 0.5 ? Math.floor(Math.random() * 50) : 0),
        multiplier: new Prisma.Decimal(Math.random() > 0.5 ? (Math.random() * 5).toFixed(2) : 0),
        currency: 'USDT',
        serverSeed: 'server_seed_' + i,
        serverHash: 'hash_' + i,
        clientSeed: 'client_seed_' + i,
        nonce: i,
        result: { symbols: ['🍒', '🍋', '🍇'], winLine: Math.random() > 0.5 },
        provablyFair: { hash: 'provably_fair_' + i },
        createdAt: new Date(Date.now() - (3600000 - i * 60000)),
      },
    });
  }

  // Session 2 - Table game
  const sessionToken2 = `sess_${Date.now()}_2`;
  const gameSession2 = await prisma.gameSession.create({
    data: {
      userId: player.id,
      gameId: tableGamesList[0].id,
      sessionToken: sessionToken2,
      mode: 'real',
      totalBet: new Prisma.Decimal(200),
      totalWin: new Prisma.Decimal(380),
      spinsCount: 10,
      startedAt: new Date(Date.now() - 7200000),
      endedAt: new Date(Date.now() - 6000000),
    },
  });

  for (let i = 0; i < 3; i++) {
    await prisma.bet.create({
      data: {
        userId: player.id,
        gameId: tableGamesList[0].id,
        gameSessionId: gameSession2.id,
        amount: new Prisma.Decimal(50),
        winAmount: new Prisma.Decimal(i === 0 ? 100 : i === 1 ? 0 : 80),
        multiplier: new Prisma.Decimal(i === 0 ? 2 : i === 1 ? 0 : 1.6),
        currency: 'USDT',
        result: { playerHand: [10, 8], dealerHand: [10, 7], outcome: i === 1 ? 'lose' : 'win' },
        createdAt: new Date(Date.now() - (7200000 - i * 1200000)),
      },
    });
  }

  // Session 3 - Live game
  const sessionToken3 = `sess_${Date.now()}_3`;
  const gameSession3 = await prisma.gameSession.create({
    data: {
      userId: player2.id,
      gameId: liveGamesList[0].id,
      sessionToken: sessionToken3,
      mode: 'real',
      totalBet: new Prisma.Decimal(500),
      totalWin: new Prisma.Decimal(0),
      spinsCount: 15,
      startedAt: new Date(Date.now() - 1800000),
      endedAt: new Date(Date.now() - 600000),
    },
  });

  for (let i = 0; i < 5; i++) {
    await prisma.bet.create({
      data: {
        userId: player2.id,
        gameId: liveGamesList[0].id,
        gameSessionId: gameSession3.id,
        amount: new Prisma.Decimal(100),
        winAmount: new Prisma.Decimal(i === 2 ? 450 : 0),
        multiplier: new Prisma.Decimal(i === 2 ? 4.5 : 0),
        currency: 'USDT',
        result: { multiplier: i === 2 ? 4.5 : 1.0, outcome: i === 2 ? 'win' : 'lose' },
        createdAt: new Date(Date.now() - (1800000 - i * 300000)),
      },
    });
  }

  // Demo session
  const sessionTokenDemo = `sess_demo_${Date.now()}`;
  const demoSession = await prisma.gameSession.create({
    data: {
      userId: player.id,
      gameId: slotGames[1].id,
      sessionToken: sessionTokenDemo,
      mode: 'demo',
      totalBet: new Prisma.Decimal(100),
      totalWin: new Prisma.Decimal(125),
      spinsCount: 50,
      startedAt: new Date(Date.now() - 10000000),
      endedAt: new Date(Date.now() - 9000000),
    },
  });

  await prisma.bet.create({
    data: {
      userId: player.id,
      gameId: slotGames[1].id,
      gameSessionId: demoSession.id,
      amount: new Prisma.Decimal(2),
      winAmount: new Prisma.Decimal(15),
      multiplier: new Prisma.Decimal(7.5),
      currency: 'USDT',
      result: { symbols: ['⭐', '⭐', '⭐'], winLine: true },
    },
  });

  console.log('✅ Created 4 game sessions with bets');

  // ==================== TRANSACTIONS ====================
  console.log('💳 Creating transactions...');

  // Admin deposit
  const deposit1 = await prisma.deposit.create({
    data: {
      userId: admin.id,
      walletId: admin.id, // Will be updated below
      amount: new Prisma.Decimal(100000),
      fee: new Prisma.Decimal(0),
      currency: 'USDT',
      paymentMethod: 'crypto_usdt',
      providerRef: 'tx_' + Date.now() + '_admin',
      status: 'COMPLETED',
      txHash: '0xabc123def456',
      confirmedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Player deposits
  const deposit2 = await prisma.deposit.create({
    data: {
      userId: player.id,
      walletId: player.id,
      amount: new Prisma.Decimal(5000),
      fee: new Prisma.Decimal(10),
      currency: 'USDT',
      paymentMethod: 'crypto_usdt',
      providerRef: 'tx_' + Date.now() + '_player',
      status: 'COMPLETED',
      txHash: '0xdef789ghi012',
      confirmedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // Player2 deposits
  await prisma.deposit.create({
    data: {
      userId: player2.id,
      walletId: player2.id,
      amount: new Prisma.Decimal(25000),
      fee: new Prisma.Decimal(25),
      currency: 'USDT',
      paymentMethod: 'crypto_btc',
      providerRef: 'btc_tx_' + Date.now(),
      status: 'COMPLETED',
      txHash: '1A2b3C4d5E6f',
      confirmedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  // Transactions
  await prisma.transaction.create({
    data: {
      userId: admin.id,
      walletId: admin.id,
      type: 'DEPOSIT',
      status: 'COMPLETED',
      amount: new Prisma.Decimal(100000),
      fee: new Prisma.Decimal(0),
      currency: 'USDT',
      balanceBefore: new Prisma.Decimal(0),
      balanceAfter: new Prisma.Decimal(100000),
      description: 'Initial admin wallet funding',
    },
  });

  await prisma.transaction.create({
    data: {
      userId: player.id,
      walletId: player.id,
      type: 'DEPOSIT',
      status: 'COMPLETED',
      amount: new Prisma.Decimal(5000),
      fee: new Prisma.Decimal(10),
      currency: 'USDT',
      balanceBefore: new Prisma.Decimal(0),
      balanceAfter: new Prisma.Decimal(5000),
      description: 'USDT deposit via TRC-20',
    },
  });

  await prisma.transaction.create({
    data: {
      userId: player.id,
      walletId: player.id,
      type: 'WIN',
      status: 'COMPLETED',
      amount: new Prisma.Decimal(75),
      currency: 'USDT',
      balanceBefore: new Prisma.Decimal(5000),
      balanceAfter: new Prisma.Decimal(5075),
      description: 'Win from Gates of Olympus',
    },
  });

  await prisma.transaction.create({
    data: {
      userId: player.id,
      walletId: player.id,
      type: 'BONUS',
      status: 'COMPLETED',
      amount: new Prisma.Decimal(100),
      currency: 'USDT',
      balanceBefore: new Prisma.Decimal(5075),
      balanceAfter: new Prisma.Decimal(5175),
      description: 'Welcome bonus credited',
    },
  });

  await prisma.transaction.create({
    data: {
      userId: player2.id,
      walletId: player2.id,
      type: 'DEPOSIT',
      status: 'COMPLETED',
      amount: new Prisma.Decimal(25000),
      fee: new Prisma.Decimal(25),
      currency: 'USDT',
      balanceBefore: new Prisma.Decimal(0),
      balanceAfter: new Prisma.Decimal(25000),
      description: 'BTC deposit',
    },
  });

  // Withdrawal
  await prisma.withdrawal.create({
    data: {
      userId: player2.id,
      walletId: player2.id,
      amount: new Prisma.Decimal(5000),
      fee: new Prisma.Decimal(5),
      currency: 'USDT',
      paymentMethod: 'crypto_usdt',
      destination: 'TQkYnBiqZy7v8oF3Hn5Lv89XjJV6mN4kPz',
      providerRef: 'wd_' + Date.now(),
      status: 'COMPLETED',
      txHash: '0xwithdrawal123',
      processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.transaction.create({
    data: {
      userId: player2.id,
      walletId: player2.id,
      type: 'WITHDRAWAL',
      status: 'COMPLETED',
      amount: new Prisma.Decimal(5000),
      fee: new Prisma.Decimal(5),
      currency: 'USDT',
      balanceBefore: new Prisma.Decimal(25000),
      balanceAfter: new Prisma.Decimal(20000),
      description: 'USDT withdrawal to wallet TQkY...',
    },
  });

  console.log('✅ Created transactions, deposits, and withdrawals');

  // ==================== KYC ====================
  console.log('🪪 Creating KYC records...');

  await prisma.kycVerification.create({
    data: {
      userId: player.id,
      status: 'APPROVED',
      level: 2,
      documentType: 'passport',
      documentNumber: 'AB1234567',
      documentFrontUrl: 'https://cdn.brom.casino/kyc/player_front.jpg',
      documentBackUrl: 'https://cdn.brom.casino/kyc/player_back.jpg',
      selfieUrl: 'https://cdn.brom.casino/kyc/player_selfie.jpg',
      country: 'US',
      dateOfBirth: new Date('1990-05-15'),
      reviewedBy: admin.id,
      reviewNotes: 'All documents verified. Approved.',
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.kycVerification.create({
    data: {
      userId: player2.id,
      status: 'IN_PROGRESS',
      level: 1,
      documentType: 'id_card',
      documentNumber: 'DL987654321',
      documentFrontUrl: 'https://cdn.brom.casino/kyc/player2_front.jpg',
      country: 'UK',
      dateOfBirth: new Date('1985-11-20'),
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // ==================== CHAT MESSAGES ====================
  console.log('💬 Creating chat messages...');

  await prisma.chatMessage.createMany({
    data: [
      { userId: admin.id, room: 'global', message: 'Welcome to Brom Casino! 🎰', isSystem: true },
      { userId: player.id, room: 'global', message: 'Hey everyone! Just hit a big win on Gates of Olympus!' },
      { userId: player2.id, room: 'global', message: 'Nice! What multiplier did you get?' },
      { userId: player.id, room: 'global', message: 'Got a 250x on the free spins round! 🔥' },
      { userId: admin.id, room: 'global', message: 'Congratulations! Remember to play responsibly.' },
      { userId: player.id, room: 'global', message: 'Anyone tried the new Lightning Roulette?' },
      { userId: player2.id, room: 'global', message: 'Yes! The multipliers are insane.' },
    ],
  });

  // ==================== AUDIT LOGS ====================
  console.log('📋 Creating audit logs...');

  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'USER_LOGIN', entity: 'User', entityId: admin.id, ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0' },
      { userId: player.id, action: 'USER_LOGIN', entity: 'User', entityId: player.id, ipAddress: '10.0.0.1', userAgent: 'Mozilla/5.0' },
      { userId: player.id, action: 'DEPOSIT_CREATED', entity: 'Deposit', entityId: deposit2.id, ipAddress: '10.0.0.1', userAgent: 'Mozilla/5.0' },
      { userId: player.id, action: 'GAME_SESSION_STARTED', entity: 'GameSession', entityId: gameSession1.id, ipAddress: '10.0.0.1' },
      { userId: player.id, action: 'KYC_SUBMITTED', entity: 'KycVerification', entityId: player.id, ipAddress: '10.0.0.1' },
      { userId: admin.id, action: 'KYC_APPROVED', entity: 'KycVerification', entityId: player.id, ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', newValue: { status: 'APPROVED' } },
      { userId: player2.id, action: 'WITHDRAWAL_REQUESTED', entity: 'Withdrawal', ipAddress: '10.0.0.2', userAgent: 'Mozilla/5.0' },
    ],
  });

  // ==================== SESSIONS ====================
  console.log('🔐 Creating sessions...');

  await prisma.session.create({
    data: {
      userId: admin.id,
      refreshToken: 'refresh_admin_' + Date.now(),
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.session.create({
    data: {
      userId: player.id,
      refreshToken: 'refresh_player_' + Date.now(),
      ipAddress: '10.0.0.1',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Seed completed successfully! 🎉');
  console.log('');
  console.log('📊 Summary:');
  console.log('  - 1 Admin: admin@brom.casino / Admin123!');
  console.log('  - 2 Players: player@brom.casino / Player123!, highroller (no login)');
  console.log('  - 27 games (24 slots, 5 table, 3 live, 2 crash)');
  console.log('  - 6 bonuses (welcome, deposit match, free spins, cashback, daily, no deposit)');
  console.log('  - 3 user bonus assignments');
  console.log('  - 4 game sessions with bets');
  console.log('  - Multiple transactions, deposits, withdrawals');
  console.log('  - KYC records, chat messages, audit logs, sessions');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
