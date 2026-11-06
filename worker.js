import {GIFEncoder, quantize, applyPalette} from './vendor/gifenc.js';
import {draw, dimensions} from './render.js';
onmessage = ({data: {image, settings}}) => {
  try {
    const [w,h] = dimensions(image, settings.size), canvas = new OffscreenCanvas(w,h), ctx = canvas.getContext('2d', {willReadFrequently:true}), gif = GIFEncoder();
    const total = 2000 / settings.speed, n = Math.min(settings.frames, Math.floor(total / 20));
    for (let i=0;i<n;i++) {
      draw(ctx,image,i/n,settings);
      const rgba=ctx.getImageData(0,0,w,h).data;
      const palette=quantize(rgba,255), index=applyPalette(rgba,palette);
      const transparentIndex=palette.length; palette.push([0,0,0]);
      for(let j=0;j<index.length;j++) if(rgba[j*4+3]<128) index[j]=transparentIndex;
      const delay=(Math.round((i+1)*total/n/10)-Math.round(i*total/n/10))*10;
      gif.writeFrame(index,w,h,{palette,delay,repeat:0,transparent:true,transparentIndex,dispose:2});
      postMessage({progress:Math.round((i+1)/n*100)});
    }
    gif.finish(); image.close(); const bytes=gif.bytes(); postMessage({bytes,w,h},[bytes.buffer]);
  } catch(error) {postMessage({error:error.message});}
};
