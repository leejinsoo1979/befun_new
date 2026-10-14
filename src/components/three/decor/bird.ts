import * as THREE from 'three';

/** Eames House Bird visual study, not Vitra CAD. Catalogue envelope: 278 × 276 × 85 mm.
 * https://www.vitra.com/en-un/product/details/eames-house-bird
 * Shelf scene units are cm. Smooth continuous sections avoid intersecting primitive body parts.
 */
export function createHouseBird(body:THREE.Material,metal:THREE.Material,eye:THREE.Material) {
  const root=new THREE.Group();root.name='House Bird — visual study';
  // Tail → belly → breast → neck → crown → pointed beak. Last two values are section radii.
  const sections=[
    [13.7,.3,.06,.06],[11.5,2.8,.45,.45],[7,7.1,1.25,1.2],
    [1.6,11.2,3.15,2.8],[-2,14.5,4.1,4.25],[-3.9,18.3,3.4,3.25],
    [-4.8,22.3,2.1,2.15],[-5.4,25,1.85,1.8],[-7.2,25.6,1.45,1.5],
    [-9.1,25.4,.7,.95],[-11.4,25.4,.35,.5],[-13.7,25.5,.015,.015],
  ];
  const center=new THREE.CatmullRomCurve3(sections.map(s=>new THREE.Vector3(s[0],s[1],0)),false,'centripetal');
  // Use the same centripetal curve for radii to retain sculpted, uninterrupted highlights.
  const radii=new THREE.CatmullRomCurve3(sections.map(s=>new THREE.Vector3(s[2],s[3],0)),false,'centripetal');
  const vertices:number[]=[],uv:number[]=[],indices:number[]=[];
  const rings=160,sides=48;
  for(let i=0;i<=rings;i++){
    const t=i/rings,c=center.getPoint(t),v=center.getTangent(t),r=radii.getPoint(t);
    for(let j=0;j<=sides;j++){
      const a=j/sides*Math.PI*2,offset=Math.cos(a)*Math.max(.015,r.x);
      vertices.push(c.x-v.y*offset,c.y+v.x*offset,Math.sin(a)*Math.max(.015,r.y));uv.push(j/sides,t);
      if(i<rings&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  root.add(new THREE.Mesh(geometry,body));
  for(const z of [-2.35,2.35]){
    const a=new THREE.Vector3(-1,10,z),b=new THREE.Vector3(-6.2,0.16,z*1.25),delta=a.clone().sub(b);
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.145,.145,delta.length(),12),metal);
    leg.position.copy(a.add(b).multiplyScalar(.5));leg.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());root.add(leg);
    const eyeMesh=new THREE.Mesh(new THREE.SphereGeometry(.17,16,12),eye);eyeMesh.position.set(-7.25,26.15,z<0?-1.35:1.35);root.add(eyeMesh);
  }
  root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
  // Normalize once to the catalogue envelope, never scale to fit a shelf opening.
  const scale=new THREE.Vector3(27.8/size.x,27.6/size.y,8.5/size.z),mid=bounds.getCenter(new THREE.Vector3());
  for(const child of root.children){child.position.sub(new THREE.Vector3(mid.x,bounds.min.y,mid.z));child.position.multiply(scale);child.scale.multiply(scale);}
  return root;
}
