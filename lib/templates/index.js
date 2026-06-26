import { MULTIFAMILY_WIFI } from './multifamilyWifi';
import { CAMERA_SYSTEMS } from './cameraSystems';
import { FIBER } from './fiber';
import { ACCESS_CONTROL } from './accessControl';
import { AUDIO_VISUAL } from './audioVisual';
import { OTHER_TECHNOLOGY } from './other';

export const SYSTEM_TEMPLATES = [MULTIFAMILY_WIFI, CAMERA_SYSTEMS, FIBER, ACCESS_CONTROL, AUDIO_VISUAL, OTHER_TECHNOLOGY];

export const TECHNOLOGIES = [
  'Managed Wi-Fi',
  'Camera Systems',
  'Fiber',
  'Access Control',
  'Audio / Visual',
  'Other',
];

export function systemTemplatesForTech(technology) {
  return SYSTEM_TEMPLATES.filter((t) => t.technology === technology);
}
