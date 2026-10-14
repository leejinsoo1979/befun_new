import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Original shelf props inspired by the user's reference; dimensions in cm, not manufacturer CAD. */
export function createElectronicMaterials() {
  const cabinet=new THREE.MeshStandardMaterial({color:'#d2cec4',roughness:.62});
  const edge=new THREE.MeshStandardMaterial({color:'#202322',roughness:.48});
  const cone=new THREE.MeshStandardMaterial({color:'#444745',roughness:.78});
  const rubber=new THREE.MeshStandardMaterial({color:'#292c2b',roughness:.88});
  const metal=new THREE.MeshStandardMaterial({color:'#ada69b',metalness:.82,roughness:.29});
  const shade=new THREE.MeshPhysicalMaterial({color:'#82736a',metalness:.68,roughness:.28,clearcoat:.25});
  const diffuser=new THREE.MeshStandardMaterial({color:'#fff0d2',emissive:'#ffd092',emissiveIntensity:.7,roughness:.8,side:THREE.DoubleSide});
  return {cabinet,edge,cone,rubber,metal,shade,diffuser};
}
type Materials=ReturnType<typeof createElectronicMaterials>;
function add(root:THREE.Group,geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0){
  const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);root.add(m);return m;
}
/** Driver face points toward +Z; recessed cones, rolled surrounds, domes and mounting screws. */
export function createSpeaker(height:number,m:Materials){
  const root=new THREE.Group();root.name='Compact hi-fi speaker';
  const drivers=height>30?[{y:height-4.1,r:1.15},{y:height-11,r:3.25},{y:height-20,r:3.25},{y:height-29,r:2.7}]:[{y:height-4.5,r:1.35},{y:height-13,r:3.6}];
  for(const x of [-5.75,5.75])add(root,new RoundedBoxGeometry(.5,height-.4,13.5,3,.1),m.cabinet,x,height/2+.2,-.2);
  for(const y of [.65,height-.25])add(root,new RoundedBoxGeometry(11.5,.5,13.5,3,.1),m.cabinet,0,y,-.2);
  add(root,new RoundedBoxGeometry(11.5,height-.8,.4,2,.1),m.edge,0,height/2+.2,-6.7);
  // Actual openings keep the recessed diaphragms visible rather than hiding them inside a solid box.
  const face=new THREE.Shape();face.moveTo(-5.6,.8);face.lineTo(5.6,.8);face.lineTo(5.6,height-.4);face.lineTo(-5.6,height-.4);face.closePath();
  for(const {y,r} of drivers){const hole=new THREE.Path();hole.absarc(0,y,r*.91,0,Math.PI*2,true);face.holes.push(hole);}
  add(root,new THREE.ExtrudeGeometry(face,{depth:.16,bevelEnabled:false,curveSegments:48}),m.cabinet,0,0,6.64);
  for(const x of [-5.65,5.65])add(root,new THREE.BoxGeometry(.13,height-.8,.2),m.edge,x,height/2+.2,6.65);
  for(const y of [.78,height-.38])add(root,new THREE.BoxGeometry(11.4,.13,.2),m.edge,0,y,6.65);
  for(const x of [-4.4,4.4])for(const z of [-4.5,4.5])add(root,new THREE.CylinderGeometry(.6,.6,.4,12),m.rubber,x,.2,z);
  for(const {y,r} of drivers){
    // Lathe axis is Y; rotate to put the sculpted diaphragm into the front baffle.
    const profile=[[0,-.36],[r*.24,-.32],[r*.48,-.57],[r*.76,-.18],[r*.85,.03],[r*.94,.06],[r,0]];
    const driver=add(root,new THREE.LatheGeometry(profile.map(([a,b])=>new THREE.Vector2(a,b)).reverse(),48),m.cone,0,y,6.82);driver.rotation.x=Math.PI/2;
    add(root,new THREE.TorusGeometry(r*.88,r*.065,10,48),m.rubber,0,y,6.83);
    const dome=add(root,new THREE.SphereGeometry(r*.33,24,16),m.edge,0,y,6.75);dome.scale.z=.35;
    for(const a of [Math.PI/4,Math.PI*3/4,Math.PI*5/4,Math.PI*7/4]){
      add(root,new THREE.CircleGeometry(.08,8),m.metal,Math.cos(a)*r*.98,y+Math.sin(a)*r*.98,6.86);
    }
  }
  add(root,new RoundedBoxGeometry(1.6,.38,.06,2,.04),m.metal,0,1.4,6.85);
  return root;
}
export function createSmallLamp(m:Materials){
  const root=new THREE.Group();root.name='Dome table light';
  add(root,new THREE.LatheGeometry([new THREE.Vector2(0,0),new THREE.Vector2(4.3,0),new THREE.Vector2(4.6,.35),new THREE.Vector2(4.5,.7),new THREE.Vector2(3.8,1),new THREE.Vector2(1.2,1.5),new THREE.Vector2(.7,2)],48),m.shade);
  add(root,new THREE.CylinderGeometry(.32,.42,16.4,24),m.metal,0,9.7,0);
  // Thin double-sided shell with a rolled rim; warm diffuser sits below the dome.
  const points:THREE.Vector2[]=[];
  for(let i=0;i<=40;i++){const a=i/40*Math.PI/2;points.push(new THREE.Vector2(Math.sin(a)*8.7,17+Math.cos(a)*7.8));}
  points.push(new THREE.Vector2(8.7,16.85),new THREE.Vector2(8.45,16.85));
  for(let i=40;i>=0;i--){const a=i/40*Math.PI/2;points.push(new THREE.Vector2(Math.sin(a)*8.45,17+Math.cos(a)*7.55));}
  add(root,new THREE.LatheGeometry(points,64),m.shade);
  const disc=add(root,new THREE.CircleGeometry(8.25,64),m.diffuser,0,17.12,0);disc.rotation.x=Math.PI/2;
  const switchButton=add(root,new THREE.CylinderGeometry(.45,.45,.15,16),m.metal,2.6,.98,0);switchButton.rotation.z=-.12;
  return root;
}
