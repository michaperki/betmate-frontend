/**
 * Simple cache for storing move scores to ensure consistency across UI components
 */

interface MoveScoreEntry {
  move: string;
  fen: string;
  score: number;
  timestamp: number;
}

class MoveScoreCache {
  private cache: Map<string, MoveScoreEntry> = new Map();

  private readonly MAX_SIZE = 100; // Maximum number of entries to store

  private readonly EXPIRY_TIME = 1000 * 60 * 5; // 5 minutes

  /**
   * Generate a key from FEN and move
   */
  private getKey(fen: string, move: string): string {
    return `${fen}|${move}`;
  }

  /**
   * Store a score for a move in a specific position
   */
  set(fen: string, move: string, score: number): void {
    // Clean up if cache is getting too large
    if (this.cache.size >= this.MAX_SIZE) {
      this.prune();
    }

    const key = this.getKey(fen, move);
    this.cache.set(key, {
      move,
      fen,
      score,
      timestamp: Date.now(),
    });
  }

  /**
   * Get a cached score for a move in a specific position
   * Returns null if not found or expired
   */
  get(fen: string, move: string): number | null {
    const key = this.getKey(fen, move);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.EXPIRY_TIME) {
      this.cache.delete(key);
      return null;
    }

    return entry.score;
  }

  /**
   * Check if a score exists for a move in a specific position
   */
  has(fen: string, move: string): boolean {
    return this.get(fen, move) !== null;
  }

  /**
   * Remove old entries when cache gets too large
   */
  private prune(): void {
    const now = Date.now();

    // First, remove expired entries
    // Convert to array first to avoid iterator compatibility issues
    const allEntries = Array.from(this.cache.keys());
    for (const key of allEntries) {
      const entry = this.cache.get(key);
      if (entry && now - entry.timestamp > this.EXPIRY_TIME) {
        this.cache.delete(key);
      }
    }

    // If still too large, remove oldest entries
    if (this.cache.size >= this.MAX_SIZE) {
      const entries: [string, MoveScoreEntry][] = [];
      // Manually build the entries array to avoid compatibility issues
      allEntries.forEach((key) => {
        const entry = this.cache.get(key);
        if (entry) {
          entries.push([key, entry]);
        }
      });

      // Sort by timestamp
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest 20% of entries
      const toRemove = Math.max(1, Math.floor(this.MAX_SIZE * 0.2));
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export a singleton instance
export const moveScoreCache = new MoveScoreCache();
