import decodeJpeg from '../_shared/vendor/jpeg-js/decoder.mjs';
import {paymentBytes} from './body.ts';

const MAX_PIXELS = 16 * 1024 * 1024;
const MAX_DECODED_BYTES = 64 * 1024 * 1024;
const crcTable = Uint32Array.from({length:256},(_,index)=>{
  let value = index; for (let bit=0;bit<8;bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1; return value >>> 0;
});
function requireImage(value: unknown): asserts value { if (!value) throw new Error('invalid_image'); }
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff; for (const value of bytes) crc = crcTable[(crc ^ value) & 255] ^ (crc >>> 8); return (crc ^ 0xffffffff) >>> 0;
}
async function png(bytes: Uint8Array): Promise<void> {
  requireImage(bytes.length >= 45 && [137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value));
  const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength), compressed: Uint8Array[] = [];
  let offset=8,width=0,height=0,depth=0,color=0,interlace=0,headers=0,ended=false,palette=false;
  while (offset+12 <= bytes.length) {
    const length=view.getUint32(offset),end=offset+12+length; requireImage(end<=bytes.length);
    const kind=String.fromCharCode(...bytes.subarray(offset+4,offset+8)),data=bytes.subarray(offset+8,offset+8+length);
    requireImage(/^[A-Za-z]{4}$/.test(kind) && crc32(bytes.subarray(offset+4,offset+8+length))===view.getUint32(offset+8+length));
    if (kind==='IHDR') {
      requireImage(offset===8 && length===13 && ++headers===1);
      width=view.getUint32(offset+8);height=view.getUint32(offset+12);depth=data[8];color=data[9];interlace=data[12];
      const depths: Record<number,number[]>={0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]};
      requireImage(width>0 && height>0 && width<=8192 && height<=8192 && width*height<=MAX_PIXELS && depths[color]?.includes(depth) && data[10]===0 && data[11]===0 && interlace<=1);
    } else {
      requireImage(headers===1);
      if (kind==='IDAT') compressed.push(data);
      else if (kind==='PLTE') { requireImage(!palette && compressed.length===0 && length>0 && length<=768 && length%3===0);palette=true; }
      else if (kind==='IEND') { requireImage(length===0 && end===bytes.length && compressed.length>0); ended=true;offset=end;break; }
      else requireImage(kind[0]===kind[0].toLowerCase());
    }
    offset=end;
  }
  requireImage(ended && offset===bytes.length && (color!==3 || palette));
  const channels: Record<number,number>={0:1,2:3,3:1,4:2,6:4};
  const passes=interlace===0?[[0,0,1,1]]:[[0,0,8,8],[4,0,8,8],[0,4,4,8],[2,0,4,4],[0,2,2,4],[1,0,2,2],[0,1,1,2]];
  const rows=passes.map(([x,y,dx,dy])=>{
    const columns=Math.max(0,Math.ceil((width-x)/dx)),count=Math.max(0,Math.ceil((height-y)/dy));
    return {count:columns===0?0:count,size:Math.ceil(columns*channels[color]*depth/8)+1};
  });
  const expected=rows.reduce((sum,row)=>sum+row.count*row.size,0);requireImage(expected>0 && expected<=MAX_DECODED_BYTES);
  const stream=new ReadableStream<BufferSource>({start(controller){for(const chunk of compressed)controller.enqueue(new Uint8Array(chunk));controller.close();}});
  const decoded=await paymentBytes(stream.pipeThrough(new DecompressionStream('deflate')),expected);requireImage(decoded.length===expected);
  let rowOffset=0;for(const row of rows)for(let i=0;i<row.count;i++){requireImage(decoded[rowOffset]<=4);rowOffset+=row.size;}
}
/** Decode bounded PNG/JPEG data; no OCR, model calls, pixel persistence or logging. */
export async function validatePaymentImage(bytes: Uint8Array, contentType: string): Promise<void> {
  if (contentType==='image/png') return png(bytes);
  requireImage(contentType==='image/jpeg' && bytes.length>=16 && bytes[0]===255 && bytes[1]===216 && bytes[bytes.length-2]===255 && bytes[bytes.length-1]===217);
  const decoded=decodeJpeg(bytes,{useTArray:true,formatAsRGBA:true,tolerantDecoding:false,maxResolutionInMP:16,maxMemoryUsageInMB:128});
  requireImage(decoded.width>0 && decoded.height>0 && decoded.width<=8192 && decoded.height<=8192 && decoded.width*decoded.height<=MAX_PIXELS && decoded.data.length===decoded.width*decoded.height*4);
}
