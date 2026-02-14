import type * as THREE from 'three';

export interface TextureConfig {
  scale: number;
  rotation: number;
}

export interface TextureScales {
  verticalBase: number;
  verticalEdge: number;
  horizontalBase: number;
  horizontalEdge: number;
}

export interface TextureRotations {
  verticalBase: number;
  verticalEdge: number;
  horizontalBase: number;
  horizontalEdge: number;
}

export interface MaterialSet {
  verticalBase: THREE.Material | null;
  verticalEdge: THREE.Material | null;
  horizontalBase: THREE.Material | null;
  horizontalEdge: THREE.Material | null;
  backPanel: THREE.Material | null;
}

export interface ColorInfo {
  name: string;
  category: 'classic' | 'natural' | 'solid' | 'edgeMix';
  displayName: string;
  thumbnail: string;
  hasTexture: boolean;
}
