import { DataTexture, RGBAFormat, UnsignedByteType, SRGBColorSpace, RepeatWrapping, LinearMipmapLinearFilter } from 'three';

/** Small deterministic linear-data textures, shared by the whole accessory collection. */
export function createSurfaceTextures() {
  const size=256;
  function texture(sample:(x:number,y:number)=>number[],color=false) {
    const bytes=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
      const values=sample(x,y),offset=(y*size+x)*4;
      for(let c=0;c<3;c++) bytes[offset+c]=Math.round(Math.max(0,Math.min(255,values[c]??values[0])));
      bytes[offset+3]=255;
    }
    const t=new DataTexture(bytes,size,size,RGBAFormat,UnsignedByteType);
    if(color)t.colorSpace=SRGBColorSpace;
    t.wrapS=t.wrapT=RepeatWrapping;t.generateMipmaps=true;t.minFilter=LinearMipmapLinearFilter;t.anisotropy=4;t.needsUpdate=true;
    return t;
  }
  const noise=(x:number,y:number)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
  const weave=texture((x,y)=>[110+Math.sin(x*Math.PI/2)*22+Math.sin(y*Math.PI/2)*22+noise(x,y)*30]);
  weave.repeat.set(5,5);
  const pores=texture((x,y)=>[140+noise(x,y)*65+Math.sin(x*.25)*5]);pores.repeat.set(3,3);
  const roughness=texture((x,y)=>[195+noise(Math.floor(x/3),Math.floor(y/3))*55]);
  const paper=texture((x,y)=>[120+Math.sin(y*Math.PI)*20+Math.sin(y*2.13)*38+noise(x,y)*10]);
  const leaf=texture((x,y)=>{
    const u=x/255,v=y/255,edge=Math.abs(u-.5)*2;
    const midrib=Math.exp(-Math.pow((u-.5)*95,2));
    const veins=Math.pow(Math.max(0,Math.cos((v-edge*.18)*Math.PI*24)),24)*(1-edge);
    const light=1-edge*.19+midrib*.2+veins*.07+(noise(x,y)-.5)*.035;
    return [155*light,186*light,129*light];
  },true);
  return {weave,pores,roughness,paper,leaf,dispose(){[weave,pores,roughness,paper,leaf].forEach(t=>t.dispose());}};
}
