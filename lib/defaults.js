export const DEFAULT_INPUTS = {
  propertyName: '',
  propertyAddress: '',
  propertyType: 'hospitality',
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

// Camera-systems calculator inputs (separate BOM from the Wi-Fi one).
export const DEFAULT_CAMERA_INPUTS = {
  cam4mpBullet: 0,
  cam4mpTurret: 0,
  cam8mpBullet: 0,
  cam8mpTurret: 0,
  retention: 'month', // 'week' (2TB HDD) | 'month' (8TB HDD)
  spareCameras: false,
};
