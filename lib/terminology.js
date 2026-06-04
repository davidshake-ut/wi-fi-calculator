export const TERMINOLOGY = {
  hospitality: {
    label: 'Hospitality',
    unitLabel: 'Guest Rooms',
    unitSingular: 'Guest Room',
    wiredLabel: 'Guest Room Wired Ports',
    apRatioLabel: 'AP : Room Ratio',
    apRatioSub: 'per room',
    commonAreaLabel: 'Meeting Rooms',
    businessLabel: 'Business Center Wired Ports',
    summaryUnit: 'guest rooms',
  },
  senior_living: {
    label: 'Senior Living',
    unitLabel: 'Resident Units',
    unitSingular: 'Resident Unit',
    wiredLabel: 'Unit Wired Ports',
    apRatioLabel: 'AP : Unit Ratio',
    apRatioSub: 'per unit',
    commonAreaLabel: 'Common / Activity Room APs',
    businessLabel: 'Admin / Office Wired Ports',
    summaryUnit: 'resident units',
  },
  multifamily: {
    label: 'Multi-Family',
    unitLabel: 'Apartments / Units',
    unitSingular: 'Apartment',
    wiredLabel: 'Unit Wired Ports',
    apRatioLabel: 'AP : Unit Ratio',
    apRatioSub: 'per unit',
    commonAreaLabel: 'Common Area / Amenity APs',
    businessLabel: 'Leasing Office Wired Ports',
    summaryUnit: 'apartments',
  },
};

export function getTerminology(propertyType) {
  return TERMINOLOGY[propertyType] || TERMINOLOGY.hospitality;
}
