import type {Preset,Configuration,Geometry,Thumbnail} from '../types';
export default class Furniture {
 withDNA(dna:unknown):this;
 loadPreset(preset:Preset):void;
 changeConfiguration(patch:Record<string,unknown>):void;
 getConfiguration():Configuration;
 getGeometry():Geometry;
 getPreset():Preset;
 getThumbnailsByIndex(index:number):Thumbnail[];
}
