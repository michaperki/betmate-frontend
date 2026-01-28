export function wdlLabel(code: string): string {
  switch (String(code)) {
    case 'white_win':
      return 'White Win';
    case 'black_win':
      return 'Black Win';
    case 'draw':
      return 'Draw';
    default:
      return String(code);
  }
}

export function readableBet(wdl: boolean | undefined, data: string | number): string {
  const d = String(data);
  return wdl ? wdlLabel(d) : `Move ${d}`;
}
