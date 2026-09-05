export const formatViews = (views: number | undefined | null) => {
  if (!views) return '0';
  if (views >= 1000000) return (views / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return views.toString();
};

export function cleanChapterTitle(raw: string | null | undefined, chNum?: number): string {
  if (!raw) return chNum ? `Chapter ${chNum}` : '';
  let clean = raw.trim();
  if (clean.toLowerCase() === 'start reading' && chNum) {
    return `Chapter ${chNum}`;
  }
  clean = clean.replace(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}$/i, '');
  clean = clean.replace(/\s*\d{4}-\d{2}-\d{2}$/, '');
  clean = clean.replace(/\s*\(\s*\)$/, '');
  clean = clean.replace(/[\s·•\-—]+$/, '').trim();
  return clean || (chNum ? `Chapter ${chNum}` : raw);
}
