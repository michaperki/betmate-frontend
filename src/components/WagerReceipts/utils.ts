import {
  FeedWager, Wager, WagerStatus,
} from 'types/resources/wager';

// Process wagers to create a consolidated list of wager feed items
// Each wager appears only once, with the most up-to-date status
export const processWagers = (wagers: Wager[]): FeedWager[] => {
  // Create a map of wagers by ID to combine duplicates
  const wagerMap = new Map<string, FeedWager>();

  // First sort wagers by creation time (oldest first) and then by update time (newest first)
  // This ensures we process the original wager first, then any updates to it
  const sortedWagers = [...wagers].sort((a, b) => {
    // If these are the same wager (same ID), sort by updated_at (newest first)
    if (a._id === b._id) {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
    // Otherwise sort by created_at (oldest first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Process each wager
  sortedWagers.forEach(wager => {
    // Create a feed wager with the current status
    const feedWager: FeedWager = {
      ...wager,
      // Always show the creation time as the display time for consistency,
      // even though we'll use the most recent state of the wager
      time: wager.created_at,
      status: wager.status,
      type: 'wager',
      // Ensure required fields have fallback values
      data: wager.data || 'Unknown bet',
      amount: wager.amount ?? 0,
      odds: wager.wdl ? (wager.odds ?? 1) : (wager.winning_pool_share ?? 1),
    };

    // Check if we already have this wager in our map
    const existingWager = wagerMap.get(wager._id);

    // Determine if we should use this wager based on its status
    const shouldUseThisWager =
      // If we don't have this wager yet, always use it
      !existingWager ||
      // If this is a resolved wager and the existing one isn't, use this one
      (wager.resolved && !existingWager.resolved) ||
      // If both are resolved but this one is newer, use this one
      (wager.resolved && existingWager.resolved &&
       new Date(wager.updated_at).getTime() > new Date(existingWager.updated_at).getTime());

    if (shouldUseThisWager) {
      // Use this wager, but preserve the original creation time for display consistency
      wagerMap.set(wager._id, {
        ...feedWager,
        // If we already have a wager with this ID, keep its time for consistency
        time: existingWager ? existingWager.time : feedWager.time
      });
    }
  });

  // Convert map back to array and sort by time (newest first)
  return Array.from(wagerMap.values()).sort((a, b) =>
    new Date(b.time).getTime() - new Date(a.time).getTime()
  );
};