import { MULTIFAMILY_WIFI } from './multifamilyWifi';

export const SYSTEM_TEMPLATES = [MULTIFAMILY_WIFI];

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
