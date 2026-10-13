// Each path and index was read from the corresponding public product page.
const base = 'https://media.tylko.com/cloudinary/pdp/';
const updated = (path: string, indices = [1, 2, 3, 4, 5, 6, 7, 8]) => indices.map(index => `${base}gallery/updated/${path}/${index}/D.webp`);
export const productGalleries: Record<string, string[]> = {
  'wall-green': [1, 2, 3].map(index => `${base}tone/gallery/wallstorage/${index}/pistachio-green/D.webp`),
  'bookcase-brown': updated('bookcase/original-classic/01p-clay-brown-plywood'),
  'sideboard-brown': updated('chest/cplus/original-modern/02-dark-brown'),
  'sideboard-terra': updated('sideboard/cplus/original-modern/02-terracotta'),
  'bookcase-plum': updated('bookcase/edge/13-deep-plum', [1, 2, 3, 5, 6, 7, 8]),
  'tv-brown': updated('tvstand/cplus/original-modern/02-dark-brown'),
};
