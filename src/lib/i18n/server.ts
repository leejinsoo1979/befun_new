import type { Metadata } from 'next';
import { translate } from './messages';
import { cookies } from 'next/headers';
import { REGION_COOKIE, regionById, type Region } from './regions';

/** Explicit saved selection only. Browser/VPN locale must not change the site language. */
export async function currentRegion(): Promise<Region> {
  const saved = (await cookies()).get(REGION_COOKIE)?.value;
  return regionById(saved);
}

export async function localizedMetadata(metadata: Metadata): Promise<Metadata> {
  const { locale } = await currentRegion();
  return {
    ...metadata,
    title: typeof metadata.title === 'string' ? translate(locale, metadata.title) : metadata.title,
    description: metadata.description ? translate(locale, metadata.description) : metadata.description,
  };
}
