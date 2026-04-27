// Cost-Anomaly-Detection für KI-Token-Burn.
// Heuristik: Heutige Tokens > FACTOR × Median(7-Tage-Vorgeschichte)
// UND Heutige Tokens > MIN_TOKENS (verhindert Fehlalarm bei Mini-Volumen).

export interface DailyPoint {
  day: string;
  tokens_sum: number;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  todayTokens: number;
  baselineMedian: number;
  factor: number;
}

const FACTOR_THRESHOLD = 3;
const MIN_TODAY_TOKENS = 50_000; // unterhalb 50k → Volumen zu klein für Alarm

const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export const detectAnomaly = (rows: DailyPoint[]): AnomalyResult => {
  if (rows.length < 8) {
    return { isAnomaly: false, todayTokens: 0, baselineMedian: 0, factor: 0 };
  }
  const today = rows[rows.length - 1];
  const baseline = rows.slice(-8, -1); // letzte 7 Tage vor heute
  const baselineMedian = median(baseline.map((r) => r.tokens_sum));
  const factor = baselineMedian === 0 ? 0 : today.tokens_sum / baselineMedian;
  const isAnomaly =
    today.tokens_sum >= MIN_TODAY_TOKENS &&
    factor >= FACTOR_THRESHOLD;
  return {
    isAnomaly,
    todayTokens: today.tokens_sum,
    baselineMedian,
    factor,
  };
};
