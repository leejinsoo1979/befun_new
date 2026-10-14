"""Local-only foreground extraction into an RGB+alpha side-by-side H.264 video."""
import argparse, subprocess, pathlib, json
import numpy as np
import onnxruntime as ort
from PIL import Image
from rembg import new_session

parser=argparse.ArgumentParser()
parser.add_argument('source'); parser.add_argument('output'); args=parser.parse_args()
ort.disable_telemetry_events()
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,r_frame_rate','-of','json',args.source]))['streams'][0]
w,h=meta['width'],meta['height']; fps=meta['r_frame_rate']
pathlib.Path(args.output).parent.mkdir(parents=True,exist_ok=True)
session=new_session('u2net',providers=['CPUExecutionProvider'])
dec=subprocess.Popen(['ffmpeg','-v','error','-i',args.source,'-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w*2}x{h}','-r',fps,'-i','-','-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',args.output],stdin=subprocess.PIPE)
count=0
try:
 while True:
  raw=dec.stdout.read(w*h*3)
  if not raw:break
  if len(raw)!=w*h*3:raise RuntimeError('Incomplete frame')
  rgb=np.frombuffer(raw,dtype=np.uint8).reshape(h,w,3)
  mask=np.array(session.predict(Image.fromarray(rgb))[0])
  # Retain soft antialiased hair edges; discard only near-zero background noise.
  mask=np.clip((mask.astype(np.float32)-4)*255/247,0,255).astype(np.uint8)
  packed=np.concatenate([rgb,np.repeat(mask[:,:,None],3,axis=2)],axis=1)
  enc.stdin.write(packed.tobytes());count+=1
  if count%30==0:print(f'{count} frames',flush=True)
finally:
 dec.stdout.close();enc.stdin.close()
if dec.wait()!=0 or enc.wait()!=0:raise RuntimeError('Video conversion failed')
print(f'Completed {count} frames',flush=True)
