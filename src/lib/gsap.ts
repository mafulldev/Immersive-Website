import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, Draggable, InertiaPlugin, CustomEase, useGSAP);

if (!CustomEase.get('caudal')) {
  CustomEase.create('caudal', '0.16, 1, 0.3, 1');
}

gsap.defaults({ ease: 'caudal' });

/** Durações da marca, em segundos. */
export const DUR = {
  micro: 0.25,
  ui: 0.6,
  reveal: 1.0,
  scene: 1.6,
} as const;

export { gsap, ScrollTrigger, SplitText, Draggable, InertiaPlugin, CustomEase, useGSAP };
