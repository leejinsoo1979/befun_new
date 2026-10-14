'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useId, useState } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { Dialog, ReferenceImage } from './StorefrontUI';
import { defaultGalleryMaterial, galleryMaterials, modernGalleryMaterials, matchingGalleryMaterial, productMaterialPhotos, supportsMaterialPhotos } from './galleryMaterials';
import { useMaterialStore } from '@/stores/useMaterialStore';
import layout from './product-details.module.css';
import shared from './storefront.module.css';
import styles from './material-gallery.module.css';

// Remounted by source: a failed/late request cannot leak into the next material.
function MaterialPhoto({ source, alt, sizes }: { source: string; alt: string; sizes: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  return <>
    {status !== 'error' && <Image src={source} alt={alt} fill unoptimized sizes={sizes}
      className={styles.photo} data-loaded={status === 'ready'}
      onLoad={() => setStatus('ready')} onError={() => setStatus('error')} />}
    {status === 'loading' && <span className={styles.loading} aria-hidden="true" />}
    {status === 'error' && <span className={styles.error} role="status">사진을 불러오지 못했습니다.</span>}
  </>;
}

export function ProductMaterialGallery({ images, title, fallback }: {
  images: readonly string[];
  title: string;
  fallback: string;
}) {
  const groupName = useId();
  const colour = useMaterialStore(state => state.currentColor);
  const category = useMaterialStore(state => state.colorCategory);
  const [selection, setSelection] = useState<{ colour: string; id: string } | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const enabled = supportsMaterialPhotos(images);
  const choices = category === 'classic' || category === 'natural' ? galleryMaterials : modernGalleryMaterials;
  const selected = selection?.colour === colour ? choices.find(item => item.id === selection.id) : undefined;
  const matched = matchingGalleryMaterial(colour);
  const material = enabled ? selected ?? matched : undefined;
  const gallery = productMaterialPhotos(images, material ?? defaultGalleryMaterial);
  const materialName = material?.label ?? '';
  const materialId = material?.id;
  const photo = (source: string, index: number, enlarged = false) => {
    const alt = `${title} ${materialName} 상세 사진 ${index + 1}`;
    const sizes = enlarged ? '90vw' : '(max-width:767px) 95vw, 60vw';
    return enabled
      ? <MaterialPhoto key={source} source={source} alt={alt} sizes={sizes} />
      : <ReferenceImage key={source} source={source} fallback={fallback} alt={alt} sizes={sizes} />;
  };
  const imageButton = (source: string, index: number) => <button type="button" key={index}
    className={styles.tile} data-gallery-photo={index + 1}
    onClick={() => setZoom(index)} aria-label={`${materialName} 상세 사진 ${index + 1} 크게 보기`}>
    {photo(source, index)}
  </button>;

  return <section id="design-gallery" className={`${layout.section} ${styles.section}`} aria-label="제품 사진 갤러리">
    {enabled && <>
      <div className={styles.toolbar} role="radiogroup" aria-label="상세 사진 재질">
        {choices.map(item => <label key={item.id} className={styles.swatch} title={item.label}>
          <input type="radio" name={groupName} value={item.id} checked={materialId === item.id}
            aria-label={item.label} onChange={() => setSelection({ colour, id: item.id })} />
          <span className={styles.swatchCircle}><Image src={item.swatch} alt="" width={24} height={24} unoptimized /></span>
        </label>)}
      </div>
      <span className={styles.srOnly} role="status">{materialName} 상세 사진</span>
    </>}
    {gallery.length === 8 ? <>
      <div className={layout.galleryTop}>{gallery.slice(0, 3).map(imageButton)}</div>
      <div className={layout.galleryBottom}>{gallery.slice(3).map((source, index) => imageButton(source, index + 3))}</div>
    </> : <div className={layout.galleryRegular}>{gallery.map(imageButton)}</div>}
    <p className={layout.caption}>디자인 예시 · 선택한 Befun 구성은 위의 3D 화면에서 확인하세요.</p>
    <Link href="/furniture-c" className={layout.textLink}>다른 디자인 보기 <FiArrowRight /></Link>
    {zoom !== null && gallery[zoom] && <Dialog title={`${materialName} 디자인 레퍼런스`} close={() => setZoom(null)}>
      <div className={shared.detailImage}>{photo(gallery[zoom], zoom, true)}</div>
    </Dialog>}
  </section>;
}
