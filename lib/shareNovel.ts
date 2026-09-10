import { Share } from 'react-native';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=cc.novesia.app';

export interface ShareNovelParams {
  title: string;
  author?: string | null;
  slug?: string;
  nu_slug?: string;
}

/**
 * Membagikan info novel ke aplikasi lain (WhatsApp, Telegram, medsos, dll)
 * menyertakan judul novel dan link unduh resmi di Google Play Store.
 */
export async function shareNovel(
  novel: ShareNovelParams,
  lang: 'id' | 'en' = 'id'
): Promise<void> {
  if (!novel || !novel.title) return;

  const isId = lang === 'id';
  const authorSuffix = novel.author ? (isId ? ` karya ${novel.author}` : ` by ${novel.author}`) : '';

  const message = isId
    ? `📖 Baca "${novel.title}"${authorSuffix} di aplikasi Novesia!\nNikmati ribuan novel terjemahan gratis dan update bab terbaru.\n\n📲 Unduh di Google Play Store:\n${PLAY_STORE_URL}`
    : `📖 Read "${novel.title}"${authorSuffix} on Novesia App!\nEnjoy thousands of free translated novels with daily chapter updates.\n\n📲 Download on Google Play Store:\n${PLAY_STORE_URL}`;

  try {
    await Share.share({
      title: novel.title,
      message,
      url: PLAY_STORE_URL,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[shareNovel] Gagal membagikan novel:', error);
    }
  }
}
