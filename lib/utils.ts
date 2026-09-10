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

export function timeAgo(dateString: string | null | undefined, lang: 'id' | 'en' = 'id'): string {
  if (!dateString) return lang === 'id' ? 'Baru saja' : 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return lang === 'id' ? 'Baru saja' : 'Just now';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return lang === 'id' ? `${diffInMinutes}m lalu` : `${diffInMinutes}m ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return lang === 'id' ? `${diffInHours}j lalu` : `${diffInHours}h ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return lang === 'id' ? `${diffInDays}h lalu` : `${diffInDays}d ago`;
  }
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return lang === 'id' ? `${diffInMonths} bln lalu` : `${diffInMonths} mo ago`;
  }
  const diffInYears = Math.floor(diffInDays / 365);
  return lang === 'id' ? `${diffInYears} thn lalu` : `${diffInYears}y ago`;
}
