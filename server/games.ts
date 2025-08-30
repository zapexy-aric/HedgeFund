import crypto from 'crypto';
import { db } from './db';
import { storage } from './storage';
import { minesGames, InsertMinesGame, users, transactions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// --- Provably Fair Logic ---

const HASH_ALGORITHM = 'sha256';
const HMAC_ALGORITHM = 'sha512';

/**
 * Generates a cryptographically secure random server seed.
 */
export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes a server seed to be shown to the user.
 * @param serverSeed The seed to hash.
 */
export function hashServerSeed(serverSeed: string): string {
  return crypto.createHash(HASH_ALGORITHM).update(serverSeed).digest('hex');
}

/**
 * Generates the locations of the mines based on the seeds and nonce.
 * @param serverSeed The secret server seed.
 * @param clientSeed The user-provided client seed.
 * @param nonce The number of bets made with this seed pair.
 * @param grid_size The total number of tiles in the grid.
 * @param mine_count The number of mines to place.
 * @returns An array of numbers representing the mine locations.
 */
export function generateMineLocations(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  grid_size: number,
  mine_count: number,
): number[] {
  const hmac = crypto.createHmac(HMAC_ALGORITHM, serverSeed);
  hmac.update(`${clientSeed}:${nonce}`);
  const buffer = hmac.digest();

  const numbers = [];
  for (let i = 0; i < grid_size; i++) {
    numbers.push(i);
  }

  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(buffer[i % buffer.length] / 256 * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  return numbers.slice(0, mine_count).sort((a, b) => a - b);
}


// --- Mines Game Logic ---

interface MinesBetPayload {
  betAmount: number;
  mineCount: number;
  clientSeed: string;
}

/**
 * Creates a new Mines game.
 */
export async function createMinesGame(userId: string, payload: MinesBetPayload) {
  // 1. Validate payload
  if (payload.betAmount <= 0) {
    throw new Error("Invalid bet amount.");
  }
  if (payload.mineCount < 1 || payload.mineCount > 24) {
    throw new Error("Mine count must be between 1 and 24.");
  }

  const createdGame = await db.transaction(async (tx) => {
    // 2. Get user and check balance
    const [user] = await tx.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new Error("User not found.");
    }

    const currentBalance = parseFloat(user.depositBalance || "0");
    if (currentBalance < payload.betAmount) {
      throw new Error("Insufficient balance.");
    }

    const newBalance = currentBalance - payload.betAmount;
    await tx.update(users).set({ depositBalance: newBalance.toFixed(2) }).where(eq(users.id, userId));

    // Create a transaction record for the bet
    await tx.insert(transactions).values({
        userId: userId,
        type: "game_bet",
        amount: `-${payload.betAmount.toFixed(2)}`,
        status: "completed",
        remarks: `Mines bet, ${payload.mineCount} mines`,
    });

    // 3. Provably Fair setup
    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const nonce = 1; // TODO: This should be incremented for each bet with the same clientSeed

    const GRID_SIZE = 25; // 5x5 grid
    const mineLocations = generateMineLocations(
      serverSeed,
      payload.clientSeed,
      nonce,
      GRID_SIZE,
      payload.mineCount
    );

    // 4. Create game record in DB
    const newGameData: InsertMinesGame = {
      userId,
      betAmount: payload.betAmount.toString(),
      mineCount: payload.mineCount,
      clientSeed: payload.clientSeed,
      serverSeed,
      serverSeedHash,
      nonce,
      mineLocations: mineLocations,
      revealedTiles: [],
      status: 'active',
    };

    const [newGame] = await tx.insert(minesGames).values(newGameData).returning();
    return newGame;
  });

  // 5. Return a safe version of the game state to the client
  const { serverSeed: _, mineLocations: _, ...safeGame } = createdGame;
  return safeGame;
}

function combinations(n: number, k: number): number {
  if (k < 0 || k > n) {
    return 0;
  }
  if (k === 0 || k === n) {
    return 1;
  }
  if (k > n / 2) {
    k = n - k;
  }
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

function calculateMinesMultiplier(revealedCount: number, mineCount: number): number {
    const gridSize = 25;
    // Multiplier calculation using combinations. We give a 1% house edge.
    const multiplier = 0.99 * combinations(gridSize, revealedCount) / combinations(gridSize - mineCount, revealedCount);
    return multiplier;
}

/**
 * Reveals a tile in an existing Mines game.
 */
export async function revealMinesTile(userId: string, gameId: string, tileIndex: number) {
  const [game] = await db.select().from(minesGames).where(eq(minesGames.id, gameId));

  if (!game || game.userId !== userId) {
    throw new Error("Game not found or access denied.");
  }
  if (game.status !== 'active') {
    throw new Error("Game is not active.");
  }
  if ((game.revealedTiles as number[]).includes(tileIndex)) {
    throw new Error("Tile already revealed.");
  }

  const mineLocations = game.mineLocations as number[];
  const revealedTiles = game.revealedTiles as number[];

  if (mineLocations.includes(tileIndex)) {
    // Busted!
    const [bustedGame] = await db.update(minesGames)
      .set({ status: 'busted' })
      .where(eq(minesGames.id, gameId))
      .returning();
    return bustedGame;
  } else {
    // Safe tile
    const newRevealedTiles = [...revealedTiles, tileIndex];
    const newMultiplier = calculateMinesMultiplier(newRevealedTiles.length, game.mineCount);

    const [updatedGame] = await db.update(minesGames)
      .set({
        revealedTiles: newRevealedTiles,
        payoutMultiplier: newMultiplier.toFixed(4)
      })
      .where(eq(minesGames.id, gameId))
      .returning();

    const { serverSeed: _, mineLocations: _, ...safeGame } = updatedGame;
    return safeGame;
  }
}

/**
 * Cashes out the current winnings from an active Mines game.
 */
export async function cashoutMinesGame(userId: string, gameId: string) {
  const finalGame = await db.transaction(async (tx) => {
    const [game] = await tx.select().from(minesGames).where(eq(minesGames.id, gameId));

    if (!game || game.userId !== userId) {
      throw new Error("Game not found or access denied.");
    }
    if (game.status !== 'active') {
      throw new Error("Game is not active.");
    }
    const revealedTiles = game.revealedTiles as number[];
    if (revealedTiles.length === 0) {
      throw new Error("Cannot cash out before revealing any tiles.");
    }

    const betAmount = parseFloat(game.betAmount);
    const multiplier = parseFloat(game.payoutMultiplier);
    const winnings = betAmount * multiplier;

    // Add winnings to user's balance
    const [user] = await tx.select().from(users).where(eq(users.id, userId));
    const currentBalance = parseFloat(user.depositBalance || "0");
    const newBalance = currentBalance + winnings;
    await tx.update(users).set({ depositBalance: newBalance.toFixed(2) }).where(eq(users.id, userId));

    // Create a transaction record for the win
    await tx.insert(transactions).values({
        userId: userId,
        type: "game_win",
        amount: `+${winnings.toFixed(2)}`,
        status: "completed",
        remarks: `Mines win, cashed out at ${multiplier.toFixed(2)}x`,
    });

    // Update the game status
    const [updatedGame] = await tx.update(minesGames)
      .set({
        status: 'cashed_out',
        cashedOutAmount: winnings.toFixed(2)
      })
      .where(eq(minesGames.id, gameId))
      .returning();

    return updatedGame;
  });

  return finalGame;
}
