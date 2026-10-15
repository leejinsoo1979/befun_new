import test from 'node:test';
import assert from 'node:assert/strict';
import {panelJoints,jointVertices} from './panel-joints.ts';
const slab=(x1,x2)=>({x1,x2,y1:1915,y2:1933,z1:0,z2:428});
test('only real abutting boards have joints, never column-sized fake cuts',()=>{
 const one={slabs:[slab(-1582,1582)],walls:[]};
 assert.equal(panelJoints(one).length,0);
 const two={slabs:[slab(-1582,10),slab(10,1582)],walls:[]};
 assert.deepEqual(panelJoints(two),[{axis:'x',at:10,a1:1915,a2:1933,b1:0,b2:428}]);
 const vertices=jointVertices(panelJoints(two));
 assert.equal(vertices.length,24);
 for(let i=0;i<vertices.length;i+=3)assert.ok(Math.abs(vertices[i]-.01)<1e-8);
 assert.equal(panelJoints({slabs:[slab(-1582,9),slab(10,1582)],walls:[]}).length,0,'do not connect separated boards');
 assert.equal(panelJoints({slabs:[slab(-1582,10),{...slab(10,1582),y1:1900,y2:1918}],walls:[]}).length,0,'do not connect different heights');
});
