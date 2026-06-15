export const DEFAULT_INPUTS = {
  propertyName: '',
  propertyAddress: '',
  propertyType: 'hospitality',
  includeWifi: true, // off = camera-only quote (zeroes Wi-Fi equipment + services)
  numberOfRooms: 100,
  numberOfIDFs: 2,
  apToRoomRatio: 2,
  deploymentType: 'hallway',
  guestRoomWiredConnections: 0,
  meetingRooms: 0,
  publicAreaAPs: 0,
  bohAPs: 0,
  outdoorAPs: 0,
  businessCenterWired: 0,
  idfRacksNeeded: true,
  spareAPs: false,
  spareSwitches: false,
  cat6Required: false,
  cat6Drops: 0,
  gatewayModel: 'NSE3000',
  aggSwitchType: 'fiber',
  wifiGeneration: 'wifi6',
  miscHwPercent: 0,
  b2bConnectionType: 'none',
  b2bConnectionQty: 1,
};

// Company branding — applied to the app header and the CSV/PDF exports.
// Stored globally in localStorage (one brand per install), not per-project.
export const DEFAULT_BRANDING = {
  companyName: '',
  logo: null, // { dataUrl, w, h }
  primaryColor: '#2563eb', // banners, section bars, table headers, app accent
  accentColor: '#1e40af', // totals / gross-profit highlights
};

// Professional-labor rate card — drives ALL labor on the quote (it replaces the
// old hardcoded auto-generated services). One project-wide set of roles, each
// with an internal cost rate, a client bill rate, and estimated hours. Rates are
// $/hr; line cost = costRate × hours, line price = billRate × hours. Fully
// editable per project on the Services tab; persisted with the project.
export const DEFAULT_LABOR_ROLES = [
  { key: 'install-tech', label: 'Installation Technician', costRate: 75, billRate: 125, hours: 40 },
  { key: 'project-manager', label: 'Project Manager', costRate: 110, billRate: 175, hours: 16 },
  { key: 'network-engineer', label: 'Network Engineer', costRate: 130, billRate: 200, hours: 12 },
  { key: 'system-designer', label: 'System Designer', costRate: 120, billRate: 190, hours: 8 },
  {
    key: 'admin-overhead',
    label: 'Admin (Procurement, Finance, IT)',
    costRate: 65,
    billRate: 110,
    hours: 8,
  },
];

// Camera-systems calculator inputs (separate BOM from the Wi-Fi one).
export const DEFAULT_CAMERA_INPUTS = {
  cam4mpBullet: 0,
  cam4mpTurret: 0,
  cam8mpBullet: 0,
  cam8mpTurret: 0,
  retention: 'month', // 'week' (2TB HDD) | 'month' (8TB HDD)
  spareCameras: false,
};
