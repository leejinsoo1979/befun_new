'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, NormalBlending, Object3D, Vector2, type WebGLRenderTarget } from 'three';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

/** Composite a screen-space silhouette after the normal scene render.
 * No full-scene postprocessing: upholstery and background keep their colour pipeline.
 */
export default function SofaSelectionOutline() {
  const { gl, scene, camera, size, invalidate } = useThree();
  const pass = useRef<OutlinePass | null>(null);

  useEffect(() => {
    const outline = new OutlinePass(new Vector2(1, 1), scene, camera);
    outline.visibleEdgeColor.set('#ffffff');
    // Both masks contribute: adjacent cushions must not erase the selected module.
    outline.hiddenEdgeColor.set('#ffffff');
    outline.edgeStrength = 2;
    outline.edgeThickness = 2;
    outline.edgeGlow = 2;
    outline.pulsePeriod = 0;
    // Alpha compositing keeps a coloured edge visible against pale fabric.
    outline.overlayMaterial.blending = NormalBlending;
    outline.overlayMaterial.uniforms.outlineColor = { value: new Color('#339922') };
    outline.overlayMaterial.fragmentShader = outline.overlayMaterial.fragmentShader
      .replace('uniform float edgeStrength;', 'uniform vec3 outlineColor;\nuniform float edgeStrength;')
      .replace('gl_FragColor = finalColor;', 'gl_FragColor = vec4(outlineColor, clamp(finalColor.r, 0.0, 1.0));\n#include <colorspace_fragment>');
    pass.current = outline;
    invalidate();
    return () => { pass.current = null; outline.dispose(); };
  }, [gl, scene, camera, invalidate]);

  useEffect(() => {
    const dpr = gl.getPixelRatio();
    pass.current?.setSize(size.width * dpr, size.height * dpr);
    invalidate();
  }, [size.width, size.height, gl, invalidate]);

  useFrame((_, delta) => {
    gl.setRenderTarget(null);
    gl.render(scene, camera);
    const outline = pass.current;
    if (!outline) return;
    const selected: Object3D[] = [];
    scene.traverse(node => { if (node.userData.sofaSelected) selected.push(node); });
    outline.selectedObjects = selected;
    // OutlinePass writes its overlay to readBuffer. null targets the screen;
    // renderToScreen remains false to skip its unnecessary input-texture copy.
    const screen = null as unknown as WebGLRenderTarget;
    const hidden: Object3D[] = [];
    scene.traverse(node => {
      if (node.userData.sofaOutlineIgnore && node.visible) { hidden.push(node); node.visible = false; }
    });
    try { outline.render(gl, screen, screen, delta, false); }
    finally { hidden.forEach(node => { node.visible = true; }); }
  }, 1);
  return null;
}
