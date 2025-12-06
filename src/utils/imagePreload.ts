const PIECES = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'] as const;
const DIRS = ['pieces', 'pieces_w'] as const;

function loadAndDecode(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    // Ensure we resolve either after decode or on error to avoid hanging
    const done = () => resolve();
    // Prefer decode() if supported to pre-decode into the image cache
    if ('decode' in img && typeof (img as any).decode === 'function') {
      (img as any).decode().then(done).catch(done);
    } else {
      img.onload = done;
      img.onerror = done;
    }
  });
}

export async function preloadPieces(): Promise<void> {
  try {
    await Promise.all(
      DIRS.flatMap((dir) => PIECES.map((p) => loadAndDecode(`/${dir}/${p}.png`)))
    );
  } catch {
    // Best-effort; ignore failures
  }
}

export { PIECES, DIRS };

