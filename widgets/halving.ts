// Bitcoin halving countdown, ported from the site's HalvingCountdown component
// (crypto-wiki/layouts/components/HalvingCountdown.js). Same constants, same
// arithmetic, so the widget and /tools/bitcoin-halving-countdown never disagree.
//
// Unlike the other widgets this one needs no Cloud Function: the only input is
// the current block height, which mempool.space serves without a key, and
// everything else is arithmetic.

const HALVING_INTERVAL = 210000;
const TARGET_BLOCK_MINUTES = 10;

// Block 840,000 was mined on 2024-04-20 UTC, the fourth halving.
const KNOWN_HALVING_HEIGHT = 840000;
const KNOWN_HALVING_TS = Date.parse("2024-04-20T00:09:00Z");

const TIP_HEIGHT_URL = "https://mempool.space/api/blocks/tip/height";

export interface HalvingData {
  height: number;
  nextHeight: number;
  blocksRemaining: number;
  /** Whole days until the estimated halving, floored. */
  days: number;
  hours: number;
  /** Estimated halving date. */
  eta: Date;
  /** How far through the current epoch, 0-100. */
  progress: number;
  currentSubsidy: number;
  nextSubsidy: number;
  /** True when the height is a clock estimate rather than a fetched tip. */
  estimated: boolean;
}

const subsidyAtHeight = (height: number) =>
  50 / Math.pow(2, Math.floor(height / HALVING_INTERVAL));

/**
 * Height from the block clock, for when the network cannot be reached.
 *
 * Ten-minute blocks are a target, not a guarantee, so this drifts - which is
 * why anything built on it is flagged as an estimate.
 */
const estimateHeightFromClock = () =>
  KNOWN_HALVING_HEIGHT +
  Math.floor(
    (Date.now() - KNOWN_HALVING_TS) / (TARGET_BLOCK_MINUTES * 60 * 1000)
  );

/** The endpoint answers with a bare integer, not JSON. */
async function fetchTipHeight(): Promise<number | null> {
  try {
    const response = await fetch(TIP_HEIGHT_URL);
    if (!response.ok) return null;
    const height = parseInt((await response.text()).trim(), 10);
    return Number.isFinite(height) ? height : null;
  } catch {
    return null;
  }
}

export function halvingFromHeight(
  height: number,
  estimated: boolean
): HalvingData {
  const nextHeight =
    (Math.floor(height / HALVING_INTERVAL) + 1) * HALVING_INTERVAL;
  const blocksRemaining = nextHeight - height;
  const msRemaining = blocksRemaining * TARGET_BLOCK_MINUTES * 60 * 1000;
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const epochStart = nextHeight - HALVING_INTERVAL;

  return {
    height,
    nextHeight,
    blocksRemaining,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    eta: new Date(Date.now() + msRemaining),
    progress: ((height - epochStart) / HALVING_INTERVAL) * 100,
    currentSubsidy: subsidyAtHeight(height),
    nextSubsidy: subsidyAtHeight(nextHeight),
    estimated,
  };
}

/** Never returns null: a failed fetch falls back to the clock estimate. */
export async function getHalvingData(): Promise<HalvingData> {
  const height = await fetchTipHeight();
  return height === null
    ? halvingFromHeight(estimateHeightFromClock(), true)
    : halvingFromHeight(height, false);
}

export const formatHalvingEta = (eta: Date) =>
  eta.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const formatBlocks = (blocks: number) =>
  blocks.toLocaleString("en-US");
