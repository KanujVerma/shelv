/** Existing public sample assets packaged by the application build. Accept only
 * these exact references; unknown images keep the shared neutral fallback. */
export const mayaImageFiles=['moisturizer.jpg','sunscreen.webp','makeup.jpg','remover.jpg','cleanser.jpg','azelaic.png','hydro.jpg','aveeno.jpg','balm.jpg','ha.png','niacinamide.png','glycolic.png'] as const;
const images=new Map<string,string>(mayaImageFiles.flatMap(file=>{
  const path=`/maya/assets/${file}`;
  const image=`assets/maya-${file}`;
  return [[image,image],[path,image],[`https://portal.goshelv.com${path}`,image]];
}));
export function localMayaImage(value:string|null):string|null {
  return value===null?null:images.get(value)??null;
}
