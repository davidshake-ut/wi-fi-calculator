# Claude Code Build Guide — Cambium Managed Wi-Fi BOM Calculator
**Version:** 1.1 (verified against live app at wifibuilder.fusionsg.com)  
**Date:** June 2026  
**Purpose:** Step-by-step implementation guide for Claude Code to build this application from scratch as a production-ready enterprise web app.

---

## Project Summary

Build a multi-tenant SaaS web application that generates itemized Bill of Materials (BOM) and professional services quotes for Cambium Networks Wi-Fi deployments. Target verticals: Hospitality, Senior Living, Multi-Family residential.

The app produces hardware BOMs, cnMaestro subscription line items, professional services estimates, and exports to PDF and CSV. It has a full admin panel and role-based access control.

---

## Recommended Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev, SPA suitable for internal tool |
| Styling | Tailwind CSS + shadcn/ui | Consistent, accessible component system |
| State | React useState / useEffect | Adequate for this complexity level |
| Data Fetching | @tanstack/react-query | Server state caching, loading/error states |
| Routing | react-router-dom v6 | Standard SPA routing |
| Backend | Node.js + Express on Railway or Render | Simple REST API, easy deploy |
| Database | PostgreSQL (Supabase or Railway) | Relational, row-level security |
| Auth | Supabase Auth | Email invite, JWT, integrates with Postgres RLS |
| PDF Export | jsPDF + jspdf-autotable | Proven, client-side, landscape support |
| CSV Export | Browser Blob API | No library needed |

> **Alternative full-stack option:** Use Next.js App Router with API routes, Supabase for DB + Auth, deployed on Vercel. This reduces infrastructure surface area significantly and is the recommended path if you want the fastest time-to-production.

---

## Repository Structure

```
/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives
│   │   ├── BOMTable.jsx           # Hardware BOM grouped table
│   │   ├── ServicesTable.jsx      # Professional services table
│   │   ├── CostSummary.jsx        # Cost/price/margin summary
│   │   ├── ProductDatabase.jsx    # Product catalog management
│   │   ├── SummaryCards.jsx       # Top KPI cards
│   │   ├── InputPanel.jsx         # Left-side input form
│   │   └── AdminPanel.jsx         # /admin route content
│   ├── hooks/
│   │   ├── useTenant.js           # Company resolution logic
│   │   ├── useProjects.js         # Project CRUD
│   │   └── useProducts.js         # Product catalog + custom products
│   ├── lib/
│   │   ├── calculateBOM.js        # Core calculation engine (pure function)
│   │   ├── exportPDF.js           # jsPDF export logic
│   │   ├── exportCSV.js           # CSV generation
│   │   └── catalog.js             # Base product catalog (static data)
│   ├── pages/
│   │   ├── App.jsx                # Main calculator page
│   │   └── Admin.jsx              # Admin panel page
│   └── main.jsx
├── public/
├── .env.example
├── package.json
└── vite.config.js
```

---

## Phase 1 — Project Setup

1. `npm create vite@latest wifi-bom -- --template react`
2. Install dependencies:
   ```
   npm install react-router-dom @tanstack/react-query tailwindcss @tailwindcss/vite
   npm install jspdf jspdf-autotable
   npm install @supabase/supabase-js
   npm install lucide-react class-variance-authority clsx tailwind-merge
   ```
3. Install shadcn/ui: `npx shadcn@latest init` — select New York style, Neutral base color.
4. Add shadcn components: `npx shadcn@latest add button input select card tabs badge dialog table toast`
5. Configure Tailwind, set up Supabase client in `src/lib/supabase.js`.
6. Set up react-router-dom with two routes: `/` (App) and `/admin` (Admin).

---

## Phase 2 — Database Schema (Supabase / PostgreSQL)

Run these migrations in order:

```sql
-- Companies / Tenants
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email_domain TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users (synced from Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY,  -- matches Supabase auth.users.id
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'user',  -- 'user', 'company_admin', 'super_admin'
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Saved Projects
CREATE TABLE saved_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  created_by UUID REFERENCES users(id),
  project_name TEXT NOT NULL,
  inputs JSONB NOT NULL DEFAULT '{}',
  price_overrides JSONB NOT NULL DEFAULT '{}',
  service_overrides JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row-Level Security for projects
ALTER TABLE saved_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON saved_projects
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Custom Products (global — no tenant isolation)
CREATE TABLE custom_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Supabase Auth setup:**
- Enable Email provider
- Disable public signups (invite-only)
- Use `supabase.auth.admin.inviteUserByEmail()` from a server function for invitations
- On `auth.users` insert trigger, create a corresponding row in `public.users`

---

## Phase 3 — Authentication & Tenant Resolution

### useTenant Hook

```javascript
// src/hooks/useTenant.js
// On app load, resolve which company the current user belongs to.
// Logic:
//   1. Fetch current user from public.users (includes role, company_id)
//   2. If role === 'super_admin': set isSuperAdmin=true, skip company resolution
//   3. Fetch all companies
//   4. If user.company_id is set: match by id
//   5. If no match: extract email domain, match by email_domain
//      If matched: call UPDATE users SET company_id = matched.id WHERE id = auth.uid()
//   6. If no company found: show "Company Not Recognized" error screen
//   7. Expose: { user, company, isSuperAdmin, loading, error }
```

### Auth Guard

Wrap routes with a component that:
- Shows loading spinner while `useTenant` resolves
- Redirects to login if no session
- Shows error page if company not found
- Guards `/admin` route to `super_admin` role only

---

## Phase 4 — Base Product Catalog

Create `src/lib/catalog.js` as a static JavaScript object. This is the ground truth for all products. Do NOT fetch this from the database — it is embedded in the frontend. The `custom_products` table only holds overrides and additions on top of this.

```javascript
// src/lib/catalog.js
export const BASE_PRODUCTS = [
  // === GATEWAYS ===
  { sku: 'NSE3000', desc: 'Cambium NSE3000 Network Services Engine (Gateway/Router)', cost: 1295.00, price: 1750.00, category: 'Gateway' },
  { sku: 'NSE4000', desc: 'Cambium NSE4000 Network Services Engine (Gateway/Router)', cost: 2495.00, price: 3200.00, category: 'Gateway' },

  // === UPS ===
  { sku: 'PSI5-1500RT120', desc: 'Liebert UPS Vertiv PSI5 1500 1350W 120VAC Rack/Tower', cost: 779.99, price: 999.00, category: 'UPS' },

  // === ACCESS POINTS — Wi-Fi 6 ===
  { sku: 'XV2-21X', desc: 'Cambium XV2-21X WiFi 6 2x2 Indoor Ceiling AP (1Gb)', cost: 98.94, price: 149.00, category: 'Access Point' },
  { sku: 'XV2-22H', desc: 'Cambium XV2-22H WiFi 6 Wallplate AP 2x2 Indoor (1Gb)', cost: 99.92, price: 149.00, category: 'Access Point' },
  { sku: 'XV2-2X', desc: 'Cambium XV2-2X WiFi 6 2x2 Indoor AP (2.5Gb) — Meeting/Public', cost: 222.68, price: 295.00, category: 'Access Point' },
  { sku: 'XV2-23T', desc: 'Cambium XV2-23T WiFi 6 2x2 Outdoor AP (1Gb)', cost: 248.05, price: 325.00, category: 'Access Point' },

  // === ACCESS POINTS — Wi-Fi 7 ===
  { sku: 'XV3-21X', desc: 'Cambium XV3-21X WiFi 7 2x2 Indoor Ceiling AP (2.5Gb)', cost: 178.00, price: 249.00, category: 'Access Point' },
  { sku: 'XV3-22H', desc: 'Cambium XV3-22H WiFi 7 Wallplate AP 2x2 Indoor (2.5Gb)', cost: 189.00, price: 265.00, category: 'Access Point' },
  { sku: 'XV3-2X', desc: 'Cambium XV3-2X WiFi 7 4x4 Indoor AP (2.5Gb) — Meeting/Public', cost: 345.00, price: 459.00, category: 'Access Point' },
  { sku: 'XV3-23T', desc: 'Cambium XV3-23T WiFi 7 2x2 Outdoor AP (2.5Gb)', cost: 378.00, price: 499.00, category: 'Access Point' },

  // === MOUNTING ===
  { sku: 'PL-WALLMNTB-WW', desc: '430H/425 Mounting Adapter for Wallplate AP (flush surface)', cost: 17.10, price: 28.00, category: 'Mounting' },

  // === SUBSCRIPTIONS — AP (5-year cnMaestro X) ===
  { sku: 'MSX-SUB-XV2-21X-5', desc: 'cnMaestro X 5-yr Sub — XV2-21X Indoor AP', cost: 54.75, price: 75.00, category: 'Subscription' },
  { sku: 'MSX-SUB-XV2-22H-5', desc: 'cnMaestro X 5-yr Sub — XV2-22H Wallplate AP', cost: 54.75, price: 75.00, category: 'Subscription' },
  { sku: 'MSX-SUB-XV2-2X-5', desc: 'cnMaestro X 5-yr Sub — XV2-2X Indoor 2.5Gb AP', cost: 54.75, price: 75.00, category: 'Subscription' },
  { sku: 'MSX-SUB-XV2-23T-5', desc: 'cnMaestro X 5-yr Sub — XV2-23T Outdoor AP', cost: 54.75, price: 75.00, category: 'Subscription' },
  { sku: 'MSX-SUB-XV3-21X-5', desc: 'cnMaestro X 5-yr Sub — XV3-21X WiFi 7 Indoor AP', cost: 54.75, price: 75.00, category: 'Subscription' },
  { sku: 'MSX-SUB-XV3-22H-5', desc: 'cnMaestro X 5-yr Sub — XV3-22H WiFi 7 Wallplate AP', cost: 54.75, price: 75.00, category: 'Subscription' },
  { sku: 'MSX-SUB-XV3-2X-5', desc: 'cnMaestro X 5-yr Sub — XV3-2X WiFi 7 Indoor 2.5Gb AP', cost: 54.75, price: 75.00, category: 'Subscription' },
  { sku: 'MSX-SUB-XV3-23T-5', desc: 'cnMaestro X 5-yr Sub — XV3-23T WiFi 7 Outdoor AP', cost: 54.75, price: 75.00, category: 'Subscription' },

  // === SUBSCRIPTIONS — SWITCHES ===
  { sku: 'MSX-SUB-EX2028-P-5', desc: 'cnMaestro X 5-yr Sub — EX2028-P Switch', cost: 59.40, price: 85.00, category: 'Subscription' },
  { sku: 'MSX-SUB-EX2052-P-5', desc: 'cnMaestro X 5-yr Sub — EX2052-P Switch', cost: 84.15, price: 115.00, category: 'Subscription' },
  { sku: 'MSX-SUB-EX3024F-5', desc: 'cnMaestro X 5-yr Sub — EX3024F Aggregate Switch', cost: 118.80, price: 160.00, category: 'Subscription' },

  // === SWITCHES ===
  { sku: 'MX-EX2028PxA-U', desc: 'Cambium cnMatrix EX2028-P 24-Port PoE+ 4SFP+ 400W', cost: 664.76, price: 895.00, category: 'Switch' },
  { sku: 'MXEX2052GxPA01', desc: 'Cambium cnMatrix EX2052-P 48-Port PoE+ 4SFP+ 540W', cost: 1014.55, price: 1350.00, category: 'Switch' },

  // === AGGREGATE SWITCH ===
  { sku: 'MXEX3024xFxA01', desc: 'Cambium cnMatrix EX3024F 24-Port 10Gb SFP+ Fiber Aggregate Switch', cost: 1898.10, price: 2495.00, category: 'Aggregate Switch' },

  // === FIBER MODULES ===
  { sku: 'SFP-10G-SR', desc: 'Cambium 10G SFP+ MMF SR Transceiver 850nm (300m)', cost: 51.79, price: 75.00, category: 'Fiber Module' },
  { sku: 'SFP-1G-SX', desc: 'Cambium 1G SFP MMF SX Transceiver 850nm', cost: 31.06, price: 48.00, category: 'Fiber Module' },

  // === CABLES ===
  { sku: 'GS-LC2-05-10G', desc: 'OM4 Duplex OFNR LC-LC 5M Fiber Patch Cable', cost: 6.24, price: 12.00, category: 'Cable' },
  { sku: 'CAT6-3ft-RED', desc: "CAT6 Patch Cable 3' Red — Gateway connections", cost: 1.69, price: 3.50, category: 'Cable' },
  { sku: 'CAT6-5ft-BLUE', desc: "CAT6 Patch Cable 5' Blue — Uplink", cost: 2.16, price: 4.00, category: 'Cable' },
  { sku: 'CAT6-1ft-PURPLE', desc: "CAT6 Patch Cable 1' Purple — Guest Internet", cost: 0.86, price: 2.00, category: 'Cable' },
  { sku: 'CAT6-3ft-PURPLE', desc: "CAT6 Patch Cable 3' Purple — Guest Internet", cost: 1.16, price: 2.50, category: 'Cable' },
  { sku: 'CAT6-5ft-PURPLE', desc: "CAT6 Patch Cable 5' Purple — Guest Internet", cost: 1.48, price: 3.00, category: 'Cable' },
  { sku: 'CAT6-15ft-BLACK', desc: "CAT6 Patch Cable 15' Black — End Device/AP", cost: 4.77, price: 8.00, category: 'Cable' },
  { sku: 'CAT6-3in-BLACK', desc: 'CAT6 3" Cable (No Boot) Black — Wallplate AP', cost: 2.01, price: 4.00, category: 'Cable' },
  { sku: 'CAT6-DROP', desc: 'CAT6 Ethernet Cabling Drop (per drop, installed)', cost: 175.00, price: 225.00, category: 'Cabling' },

  // === RACKS ===
  { sku: 'RR1907-BK1', desc: "Middle Atlantic 7' Full Height 19\" Rack", cost: 144.15, price: 210.00, category: 'Rack' },
  { sku: 'SPM-4', desc: 'Wall Mount Rack 4U Sideways', cost: 97.19, price: 145.00, category: 'Rack' },

  // === RACK ACCESSORIES ===
  { sku: 'RS-1215', desc: 'Tripplite Power Strip 15A 12-Outlet 19" Rackmount', cost: 108.80, price: 155.00, category: 'Rack Accessory' },
  { sku: 'W-75-MRL-BK', desc: '3/4" Rip-Tie Wrap Strap 75ft Roll Black', cost: 32.43, price: 50.00, category: 'Rack Accessory' },

  // === BUILDING-TO-BUILDING ===
  { sku: 'B2B-FIBER', desc: 'Building-to-Building Connection — Fiber (per link)', cost: 2000.00, price: 3000.00, category: 'Cabling' },
  { sku: 'B2B-COPPER', desc: 'Building-to-Building Connection — Copper (per link)', cost: 300.00, price: 500.00, category: 'Cabling' },
  { sku: 'B2B-WIRELESS', desc: 'Building-to-Building Connection — Wireless (per link)', cost: 900.00, price: 1500.00, category: 'Cabling' },

  // === MISC HARDWARE ===
  { sku: 'MISC-HW', desc: 'Miscellaneous Hardware Components', cost: 500.00, price: 650.00, category: 'Miscellaneous' },
];

export const CATEGORY_ORDER = [
  'Gateway', 'UPS', 'Access Point', 'Mounting', 'Subscription',
  'Aggregate Switch', 'Switch', 'Fiber Module', 'Cable', 'Rack',
  'Rack Accessory', 'Miscellaneous', 'Cabling', 'Software'
];
```

### Product Merge Logic

```javascript
// src/lib/mergeProducts.js
// Merges BASE_PRODUCTS with custom_products from the database.
// 1. Collect SKUs where is_deleted = true → hide from output
// 2. For each base product: if a custom_product row exists with same SKU (not deleted),
//    override cost/price/desc from that row
// 3. Append pure custom products (SKUs not in base catalog)
// 4. Return sorted by CATEGORY_ORDER, then alphabetically by description within category
```

---

## Phase 5 — BOM Calculation Engine

This is the most critical module. Implement as a **pure function** — no side effects, no API calls.

```javascript
// src/lib/calculateBOM.js
export function calculateBOM(inputs, priceOverrides = {}, serviceOverrides = {}, allProducts = []) {
  // allProducts = merged base + custom (passed in from hook)
  // Returns: { items[], serviceItems[], totalHardwareCost, totalHardwarePrice,
  //            totalServicesCost, totalServicesPrice, shippingCost, shippingPrice,
  //            grandTotalCost, grandTotalPrice, overallMargin,
  //            guestRoomAPs, totalAPs, totalIdfSwitches, idfSwitches24, idfSwitches48, needsAggSwitch }
}
```

### Key Internal Variables (declare at top of function)

```javascript
const items = [];         // hardware line items
const serviceItems = [];  // service line items

// Destructure ALL inputs with defaults
const {
  propertyName = '',
  propertyType = 'hospitality',
  wifiGeneration = 'wifi6',
  gatewayModel = 'NSE3000',
  deploymentType = 'hallway',
  numberOfRooms = 100,
  apToRoomRatio = 2,
  numberOfIDFs = 2,
  guestRoomWiredConnections = 0,
  b2bConnectionType = 'none',
  b2bConnectionQty = 1,
  meetingRooms = 0,
  publicAreaAPs = 0,
  bohAPs = 0,
  outdoorAPs = 0,
  businessCenterWired = 0,
  idfRacksNeeded = true,
  spareAPs = false,
  spareSwitches = false,
  cat6Required = false,
  cat6Drops = 0,
  aggSwitchType = 'fiber',
  miscHwPercent = 0,
} = inputs;
```

### Product Lookup Helper

```javascript
function getProduct(sku) {
  const base = allProducts.find(p => p.sku === sku);
  const override = priceOverrides[sku];
  if (!base) throw new Error(`Product not found: ${sku}`);
  return {
    ...base,
    cost: override?.cost ?? base.cost,
    price: override?.price ?? base.price,
  };
}

function addItem(sku, qty, note = '') {
  const p = getProduct(sku);
  const unitCost = p.cost;
  const unitPrice = p.price;
  items.push({
    sku: p.sku,
    description: p.desc,
    qty,
    unitCost,
    unitPrice,
    totalCost: unitCost * qty,
    totalPrice: unitPrice * qty,
    total: unitPrice * qty,
    margin: unitPrice > 0 ? ((unitPrice - unitCost) / unitPrice) * 100 : 0,
    category: p.category,
    note,
  });
}
```

### Step-by-Step Calculation Order

Follow this exact sequence. Order matters for the miscHwPercent dynamic calculation.

**Step 1 — Derive AP product SKUs based on wifiGeneration:**
```
isWifi7 = wifiGeneration === 'wifi7'
AP_CEILING   = isWifi7 ? 'XV3-21X'  : 'XV2-21X'
AP_WALLPLATE = isWifi7 ? 'XV3-22H'  : 'XV2-22H'
AP_INDOOR    = isWifi7 ? 'XV3-2X'   : 'XV2-2X'
AP_OUTDOOR   = isWifi7 ? 'XV3-23T'  : 'XV2-23T'
SUB_CEILING   = isWifi7 ? 'MSX-SUB-XV3-21X-5' : 'MSX-SUB-XV2-21X-5'
SUB_WALLPLATE = isWifi7 ? 'MSX-SUB-XV3-22H-5' : 'MSX-SUB-XV2-22H-5'
SUB_INDOOR    = isWifi7 ? 'MSX-SUB-XV3-2X-5'  : 'MSX-SUB-XV2-2X-5'
SUB_OUTDOOR   = isWifi7 ? 'MSX-SUB-XV3-23T-5' : 'MSX-SUB-XV2-23T-5'
```

**Step 2 — Gateway section (always added):**
```
addItem(gatewayModel === 'NSE4000' ? 'NSE4000' : 'NSE3000', 1)
addItem('PSI5-1500RT120', 1)
addItem('SFP-1G-SX', 4, 'Gateway SFP modules')
addItem('CAT6-3ft-RED', 4, 'Gateway patch cables')
```

**Step 3 — Guest room APs:**
```
guestRoomAPs = Math.ceil(numberOfRooms / apToRoomRatio)

if deploymentType === 'inroom':
  addItem(AP_WALLPLATE, guestRoomAPs, 'In-Room Wallplate APs')
  addItem(SUB_WALLPLATE, guestRoomAPs, '5yr support')
  addItem('PL-WALLMNTB-WW', guestRoomAPs, 'Flush mount adapters')
  addItem('CAT6-3in-BLACK', guestRoomAPs, '3" patch for wallplate AP')
else:
  addItem(AP_CEILING, guestRoomAPs, 'Guest Hallway Ceiling APs')
  addItem(SUB_CEILING, guestRoomAPs, '5yr support')
```

**Step 4 — Additional AP locations:**
```
if meetingRooms > 0: addItem(AP_INDOOR, meetingRooms); addItem(SUB_INDOOR, meetingRooms)
if publicAreaAPs > 0: addItem(AP_INDOOR, publicAreaAPs); addItem(SUB_INDOOR, publicAreaAPs)
if bohAPs > 0: addItem(AP_CEILING, bohAPs); addItem(SUB_CEILING, bohAPs)
if outdoorAPs > 0: addItem(AP_OUTDOOR, outdoorAPs); addItem(SUB_OUTDOOR, outdoorAPs)
```

**Step 5 — Spare APs:**
```
if spareAPs:
  spareCount = Math.max(1, Math.ceil(guestRoomAPs * 0.05))
  spareAP  = deploymentType === 'inroom' ? AP_WALLPLATE : AP_CEILING
  spareSub = deploymentType === 'inroom' ? SUB_WALLPLATE : SUB_CEILING
  addItem(spareAP, spareCount, 'Spare APs (5%)')
  addItem(spareSub, spareCount, '5yr support for spares')
```

**Step 6 — Compute totals needed for switch sizing:**
```
totalAPs = guestRoomAPs + meetingRooms + publicAreaAPs + bohAPs + outdoorAPs
// spares NOT included in totalAPs
totalPoEPorts = totalAPs + guestRoomWiredConnections
```

**Step 7 — IDF edge switch sizing:**
```
apsPerIDF = Math.ceil(totalPoEPorts / numberOfIDFs)
idfSwitches24 = 0
idfSwitches48 = 0

for i = 0 to numberOfIDFs - 1:
  portsNeeded = Math.min(apsPerIDF, totalPoEPorts - i * apsPerIDF)
  if portsNeeded <= 0: continue
  if portsNeeded <= 22: idfSwitches24 += 1
  else if portsNeeded <= 46: idfSwitches48 += 1
  else: idfSwitches24 += Math.ceil(portsNeeded / 22)

totalIdfSwitches = idfSwitches24 + idfSwitches48

if idfSwitches24 > 0:
  addItem('MX-EX2028PxA-U', idfSwitches24, 'IDF Edge PoE+ Switch (24-port)')
  addItem('MSX-SUB-EX2028-P-5', idfSwitches24, '5yr support')
if idfSwitches48 > 0:
  addItem('MXEX2052GxPA01', idfSwitches48, 'IDF Edge PoE+ Switch (48-port)')
  addItem('MSX-SUB-EX2052-P-5', idfSwitches48, '5yr support')
```

**Step 8 — Spare switch:**
```
if spareSwitches && totalIdfSwitches > 0:
  addItem('MX-EX2028PxA-U', 1, 'Spare PoE+ Switch')
  addItem('MSX-SUB-EX2028-P-5', 1, '5yr support for spare')
```

**Step 9 — Aggregate / core switch:**
```
needsAggSwitch = numberOfIDFs > 1 || totalIdfSwitches > 1
useCopperAgg = aggSwitchType === 'copper'

if needsAggSwitch:
  if useCopperAgg:
    addItem('MXEX2052GxPA01', 1, 'Core/MDF Aggregate Switch (48-Port PoE+ Copper)')
    addItem('MSX-SUB-EX2052-P-5', 1, '5yr support')
  else:
    addItem('MXEX3024xFxA01', 1, 'Core/MDF Aggregate Switch (10Gb Fiber)')
    addItem('MSX-SUB-EX3024F-5', 1, '5yr support')
else:
  // Single-IDF, single-switch deployment: IDF switch IS the core
  addItem('MX-EX2028PxA-U', 1, 'Core HSIA Switch (single-IDF deployment)')
  addItem('MSX-SUB-EX2028-P-5', 1, '5yr support')
```

**Step 10 — Fiber infrastructure:**
```
fiberLinks = (needsAggSwitch && !useCopperAgg) ? numberOfIDFs : 0
if fiberLinks > 0:
  addItem('SFP-10G-SR', fiberLinks * 2, '10G MMF SFP+ modules (both ends)')
  addItem('GS-LC2-05-10G', fiberLinks, 'OM4 LC-LC 5M Fiber Patch Cables')
```

**Step 11 — Patch cables:**
```
addItem('CAT6-5ft-BLUE', totalIdfSwitches + 1, 'Uplink patch cables (blue)')

purpleQty = Math.max(12, Math.ceil((totalIdfSwitches + 1) * 6))
addItem('CAT6-1ft-PURPLE', purpleQty)
addItem('CAT6-3ft-PURPLE', purpleQty)
addItem('CAT6-5ft-PURPLE', purpleQty)

apCableQty = Math.ceil(totalAPs * 1.03)
addItem('CAT6-15ft-BLACK', apCableQty, 'AP run patch cables (15ft black)')
```

**Step 12 — Rack hardware:**
```
if idfRacksNeeded:
  addItem('RR1907-BK1', numberOfIDFs, 'IDF Full-Height 19" Rack')
  if needsAggSwitch:
    addItem('RR1907-BK1', 1, 'MDF Rack')
  totalRacks = needsAggSwitch ? numberOfIDFs + 1 : numberOfIDFs
  addItem('RS-1215', totalRacks, 'Rack Power Strip (1 per rack)')
  addItem('W-75-MRL-BK', 1, 'Velcro cable management')
```

**Step 13 — Structured cabling:**
```
if cat6Required && cat6Drops > 0:
  addItem('CAT6-DROP', cat6Drops, 'CAT6 Ethernet cabling drops')
```

**Step 14 — Building-to-building:**
```
if b2bConnectionType && b2bConnectionType !== 'none' && b2bConnectionQty > 0:
  const b2bSkuMap = { fiber: 'B2B-FIBER', copper: 'B2B-COPPER', wireless: 'B2B-WIRELESS' }
  addItem(b2bSkuMap[b2bConnectionType], b2bConnectionQty, 'Building-to-Building Connection')
```

**Step 15 — Miscellaneous hardware (LAST hardware item):**
```
if miscHwPercent > 0:
  hwCostSubtotal  = items.reduce((s, i) => s + i.totalCost, 0)
  hwPriceSubtotal = items.reduce((s, i) => s + i.totalPrice, 0)
  miscCost  = hwCostSubtotal  * (miscHwPercent / 100)
  miscPrice = hwPriceSubtotal * (miscHwPercent / 100)
  items.push({ sku: 'MISC-HW', description: 'Miscellaneous Hardware Components',
    qty: 1, unitCost: miscCost, unitPrice: miscPrice,
    totalCost: miscCost, totalPrice: miscPrice, total: miscPrice,
    margin: miscPrice > 0 ? ((miscPrice - miscCost) / miscPrice) * 100 : 0,
    category: 'Miscellaneous', note: `${miscHwPercent}% of hardware subtotal` })
else:
  addItem('MISC-HW', 1, 'Miscellaneous hardware')
```

**Step 16 — Professional services:**

```javascript
function addService(sku, desc, cost, price, note = '') {
  if (cost <= 0) return;
  const override = serviceOverrides[sku];
  const resolvedCost  = override?.cost  ?? cost;
  const resolvedPrice = override?.price ?? price;
  serviceItems.push({
    sku, description: desc, qty: 1,
    unitCost: resolvedCost, unitPrice: resolvedPrice,
    totalCost: resolvedCost, totalPrice: resolvedPrice,
    margin: resolvedPrice > 0 ? ((resolvedPrice - resolvedCost) / resolvedPrice) * 100 : 0,
    note, defaultCost: cost, defaultPrice: price,
  });
}

addService('PROJ-MGMT', 'Project Management & Equipment Procurement Services', 350, 500);

const installMinutes =
  (guestRoomAPs  * 30) +
  (meetingRooms  * 30) +
  (publicAreaAPs * 30) +
  (bohAPs        * 30) +
  (outdoorAPs    * 45) +
  (totalIdfSwitches * 45) +
  (idfSwitches48 * 60);
const installHours = Math.ceil(installMinutes / 60);
const installCost  = installHours * 75;
const installPrice = installHours * 100;
addService('INSTALL', `Onsite Installation, Testing & Documentation (est. ${installHours} hrs @ $100/hr)`, installCost, installPrice);

addService('TRAVEL', 'Airfare or Ground Travel (estimated, billed separately)', 2200, 3000);

addService('WIRELESS-TEST',
  `Wireless Testing & Validation (${totalAPs} APs)`,
  Math.ceil(totalAPs * 12),
  Math.ceil(totalAPs * 18));

const totalWiredPorts = guestRoomWiredConnections + businessCenterWired;
if (totalWiredPorts > 0) {
  addService('WIRED-TEST',
    `Wired Testing (${totalWiredPorts} wired connections)`,
    totalWiredPorts * 7,
    totalWiredPorts * 10);
}

const incidentalsCost  = Math.ceil(installCost  * 0.133);
const incidentalsPrice = Math.ceil(installPrice * 0.133);
addService('INCIDENTALS', 'Expenses Incurred Onsite & During Installation', incidentalsCost, incidentalsPrice);

if (cat6Required && cat6Drops > 0) {
  addService('FIBER-CABLING',
    `Fiber Cabling — OM3 6-Strand MM to each IDF (${numberOfIDFs} IDFs)`,
    numberOfIDFs * 400,
    numberOfIDFs * 500);
}
```

**Step 17 — Compute financial totals and return:**

```javascript
const totalHardwareCost  = items.reduce((s, i) => s + i.totalCost, 0);
const totalHardwarePrice = items.reduce((s, i) => s + i.totalPrice, 0);
const totalServicesCost  = serviceItems.reduce((s, i) => s + i.totalCost, 0);
const totalServicesPrice = serviceItems.reduce((s, i) => s + i.totalPrice, 0);
const shippingCost  = totalHardwareCost  * 0.07;
const shippingPrice = totalHardwarePrice * 0.07;
const grandTotalCost  = totalHardwareCost  + totalServicesCost  + shippingCost;
const grandTotalPrice = totalHardwarePrice + totalServicesPrice + shippingPrice;
const overallMargin = grandTotalPrice > 0
  ? ((grandTotalPrice - grandTotalCost) / grandTotalPrice) * 100 : 0;

return {
  items, serviceItems,
  totalHardwareCost, totalHardwarePrice,
  totalServicesCost, totalServicesPrice,
  shippingCost, shippingPrice,
  grandTotalCost, grandTotalPrice,
  overallMargin,
  guestRoomAPs, totalAPs,
  totalIdfSwitches, idfSwitches24, idfSwitches48,
  needsAggSwitch,
};
```

---

## Phase 6 — Default Inputs

```javascript
// src/lib/defaults.js
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
```

---

## Phase 7 — Property Type Terminology

```javascript
// src/lib/terminology.js
export const TERMINOLOGY = {
  hospitality: {
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
```

---

## Phase 8 — Main App Component Structure

### State Variables (App.jsx)

```javascript
const [inputs, setInputs] = useState(DEFAULT_INPUTS);
const [priceOverrides, setPriceOverrides] = useState({});
const [serviceOverrides, setServiceOverrides] = useState({});
const [currentProjectId, setCurrentProjectId] = useState(null);
const [savedSnapshot, setSavedSnapshot] = useState(null);
const [activeTab, setActiveTab] = useState('hardware'); // 'hardware' | 'services' | 'summary' | 'products'
const [showMargin, setShowMargin] = useState(false);
const [editServices, setEditServices] = useState(false);
```

### BOM Recalculation

```javascript
// Recalculate on every input/override change
const bom = useMemo(
  () => calculateBOM(inputs, priceOverrides, serviceOverrides, allProducts),
  [inputs, priceOverrides, serviceOverrides, allProducts]
);
```

### Unsaved Changes Detection

```javascript
const hasChanges = useMemo(() => {
  if (!savedSnapshot) return Object.keys(priceOverrides).length > 0
    || Object.keys(serviceOverrides).length > 0
    || inputs.propertyName !== '';
  return (
    JSON.stringify(inputs) !== JSON.stringify(savedSnapshot.inputs) ||
    JSON.stringify(priceOverrides) !== JSON.stringify(savedSnapshot.priceOverrides) ||
    JSON.stringify(serviceOverrides) !== JSON.stringify(savedSnapshot.serviceOverrides)
  );
}, [inputs, priceOverrides, serviceOverrides, savedSnapshot]);
```

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Header: Logo | Project Selector | Save | Export btns│
├────────────────┬────────────────────────────────────┤
│                │ [Hardware] [Services] [Summary] [⚙] │
│  INPUT PANEL   ├────────────────────────────────────┤
│                │ Summary Cards (4 KPI cards)         │
│  Property Info │                                     │
│  Network Design│ BOM Table / Services / Summary /    │
│  AP Locations  │ Product Database                    │
│  Options       │                                     │
│                │                                     │
└────────────────┴────────────────────────────────────┘
```

---

## Phase 9 — Input Panel Fields

Build as a scrollable left column (~350px wide). Group inputs under collapsible sections.

### Section 1: Property Information
- `propertyName` — text input (also used as project selector, see below)
- `propertyAddress` — text input
- `propertyType` — segmented control: Hospitality | Senior Living | Multi-Family

### Section 2: Network Design
- `wifiGeneration` — toggle: Wi-Fi 6 | Wi-Fi 7
- `gatewayModel` — select: NSE3000 | NSE4000
- `deploymentType` — toggle: Hallway | In-Room (disabled + forced to Hallway when wifiGeneration = wifi7)
- `numberOfRooms` — number input (label from terminology.unitLabel)
- `apToRoomRatio` — select: 1 | 2 | 3 | 4 (label from terminology.apRatioLabel)
- `numberOfIDFs` — number input

### Section 3: Additional AP Locations
- `meetingRooms` — number input (label from terminology.commonAreaLabel)
- `publicAreaAPs` — number input
- `bohAPs` — number input
- `outdoorAPs` — number input
- `guestRoomWiredConnections` — number input (label from terminology.wiredLabel)
- `businessCenterWired` — number input (label from terminology.businessLabel)

### Section 4: Options
- `idfRacksNeeded` — checkbox/toggle
- `spareAPs` — checkbox/toggle
- `spareSwitches` — checkbox/toggle
- `aggSwitchType` — select: Fiber (EX3024F) | Copper (EX2052P)
- `cat6Required` — checkbox/toggle
- `cat6Drops` — number input (only visible when cat6Required = true)
- `b2bConnectionType` — select: None | Fiber | Copper | Wireless
- `b2bConnectionQty` — number input (only visible when b2bConnectionType ≠ none)
- `miscHwPercent` — number input (0 = use fixed $650 item; >0 = percent of hardware)

---

## Phase 10 — Project Selector

The property name field doubles as a project selector:

```
┌──────────────────────────────────────────┐
│ [— New Project —         ▼]              │
│  ↑ dropdown shows saved projects         │
│  Type to set a name for unsaved project  │
└──────────────────────────────────────────┘
```

- Dropdown lists all saved projects for the user's company (super_admin sees all)
- Selecting a project loads it (merge with DEFAULT_INPUTS to handle new fields)
- Selecting "— New Project —" resets everything
- Free-text input sets the project name for the current unsaved project

### Save Button

- Disabled (grayed) when `hasChanges === false`
- Shows "Save" when new project, "Update" when editing existing
- Requires `propertyName` to be non-empty (show toast error if blank)

---

## Phase 11 — Summary Cards

Four cards displayed above the BOM table:

| Card | Primary Value | Sub-label |
|---|---|---|
| Total Access Points | `bom.totalAPs` | `"{bom.guestRoomAPs} {summaryUnit} APs"` |
| Total Sell Price | `$bom.grandTotalPrice` formatted | `"Cost: $bom.grandTotalCost"` |
| Gross Margin | `bom.overallMargin.toFixed(1)%` | `"Profit: $bom.grandTotalPrice - bom.grandTotalCost"` |
| IDF Switches | `bom.totalIdfSwitches + 1` | `"+ 1 Aggregate switch"` OR `"Single-switch deployment"` if !needsAggSwitch |

Margin card background: green ≥30%, yellow 15–29%, red <15%.

---

## Phase 12 — BOM Table (Hardware & Software Tab)

Group items by category in CATEGORY_ORDER sequence. Each category = collapsible card with:
- Category header + subtotal price
- Table rows for items in that category

### Columns

| Column | Default | showMargin=true only |
|---|---|---|
| SKU | ✓ | |
| Description + Note (italic, smaller) | ✓ | |
| Qty | ✓ | |
| Unit Cost | | ✓ |
| Unit Price | ✓ | |
| Total Cost | | ✓ |
| Total Price | ✓ | |
| Margin % | | ✓ (color-coded) |

Toggle button above table: "Show Cost & Margin" / "Hide Cost & Margin"

---

## Phase 13 — Services Table

Table with service line items.

Toggle buttons:
- "Show Cost & Margin" — reveals cost column and margin %
- "Edit Values" — reveals inline editable cost/price inputs per row

When editServices = true and a value is changed:
```javascript
setServiceOverrides(prev => ({
  ...prev,
  [sku]: { cost: newCost, price: newPrice }
}));
```

Show a reset icon (↺) on rows with active overrides.

---

## Phase 14 — Cost Summary Tab

Three-row table:

| Category | Our Cost | Client Price | Margin % |
|---|---|---|---|
| Hardware & Software | totalHardwareCost | totalHardwarePrice | hw margin |
| Professional Services | totalServicesCost | totalServicesPrice | svc margin |
| Estimated Shipping (7%) | shippingCost | shippingPrice | shipping margin |
| **Total Project Estimate** | **grandTotalCost** | **grandTotalPrice** | **overallMargin** |

Below table: a "Gross Profit" callout showing the dollar profit amount, color-coded by margin threshold.

Below that: disclaimer text — `* Budgetary estimate only. Final pricing may vary. Valid for 30 days.`

---

## Phase 15 — Product Database Tab

Full product catalog management UI.

**Display:** Table of all products (merged base + custom). Columns: SKU | Description | Category (badge) | Cost | Price | Actions

**Features:**
- Search bar (filter by SKU, description, or category)
- Inline editable cost/price (updates priceOverrides immediately on blur/enter)
- Rows with active priceOverrides shown with orange tint + reset button
- Custom products shown with "custom" badge on SKU
- "Reset All Prices" button (clears priceOverrides)
- "Add Product" button → modal with fields: SKU, Description, Category (select from list), Cost, Price
- Edit button per row → same modal (SKU locked for base products)
- Delete: soft-delete for base products (sets is_deleted=true in DB), hard-delete for custom

**Note:** Changes to cost/price here update `priceOverrides` (session-level, saved with project). Changes via Add/Edit/Delete modal write to `custom_products` table in the database (global, persistent).

---

## Phase 16 — PDF Export

```javascript
// src/lib/exportPDF.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportPDF(inputs, bom, terminology) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const brandBlue = [0, 82, 165]; // #0052A5
  const pageW = 279; const pageH = 216;

  // ---- Page 1: Header banner ----
  doc.setFillColor(...brandBlue);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('Cambium Networks — Managed Wi-Fi Budgetary Quote', 10, 12);
  doc.setFontSize(10);
  doc.text(inputs.propertyName || 'Untitled Project', 10, 20);
  doc.text(inputs.propertyAddress || '', 10, 26);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - 10, 20, { align: 'right' });

  // ---- Summary metrics bar (6 KPIs) ----
  // ... render 6 small metric boxes at y=32

  // ---- Hardware BOM table ----
  // Group items by category, render with autoTable, category header rows

  // ---- Professional Services table ----
  // ---- Cost Summary table ----
  // ---- Gross Profit banner ----
  // ---- Disclaimer text (6.5pt italic) ----

  // Page footer on each page:
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(
      `Cambium Networks Managed Wi-Fi — Confidential Budgetary Quote | Page ${i} of ${pageCount}`,
      pageW / 2, pageH - 5, { align: 'center' }
    );
  }

  const safeName = (inputs.propertyName || 'BOM').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${safeName}_BOM.pdf`);
}
```

---

## Phase 17 — CSV Export

```javascript
// src/lib/exportCSV.js
export function exportCSV(inputs, bom) {
  const rows = [
    ['Category', 'SKU', 'Description', 'Qty', 'Unit Price', 'Total Price'],
    ...bom.items.map(i => [
      i.category, i.sku, i.description, i.qty,
      i.unitPrice.toFixed(2), i.totalPrice.toFixed(2)
    ]),
    [],
    ['--- Professional Services ---'],
    ...bom.serviceItems.map(i => [
      'Services', i.sku, i.description, 1,
      i.unitPrice.toFixed(2), i.totalPrice.toFixed(2)
    ]),
    [],
    ['--- Summary ---'],
    ['', '', 'Hardware Subtotal', '', '', bom.totalHardwarePrice.toFixed(2)],
    ['', '', 'Professional Services', '', '', bom.totalServicesPrice.toFixed(2)],
    ['', '', 'Shipping (7%)', '', '', bom.shippingPrice.toFixed(2)],
    ['', '', 'GRAND TOTAL', '', '', bom.grandTotalPrice.toFixed(2)],
  ];

  const csv = rows.map(r =>
    r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (inputs.propertyName || 'BOM').replace(/[^a-zA-Z0-9]/g, '_');
  a.href = url; a.download = `${safeName}_BOM.csv`; a.click();
  URL.revokeObjectURL(url);
}
```

---

## Phase 18 — Admin Panel (/admin)

Guard: redirect non-super_admin users to `/`.

### Three sections:

**1. Company Management**
- Table of all companies (name, email_domain, user count, active status)
- "Add Company" form: name + emailDomain (auto-strip leading @)
- Delete button (confirm dialog before hard delete)

**2. User Invite**
- Fields: Email, Company (select dropdown), Role (user / company_admin / super_admin)
- Calls Supabase `inviteUserByEmail` via Edge Function or server API

**3. User Management**
- Table of all users: full_name, email, company (inline select), role (inline select)
- Changes saved on blur via `UPDATE users SET ...`

---

## Phase 19 — Margin Color Coding

Apply consistently everywhere margin percentages appear:

```javascript
export function marginColor(margin) {
  if (margin >= 30) return 'text-green-600 bg-green-50';
  if (margin >= 15) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}
```

---

## Phase 20 — Environment Variables

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Do NOT expose service role key to the frontend. Admin operations (invite user, etc.) should go through a Supabase Edge Function that uses the service role key server-side.

---

## Implementation Order (Recommended)

1. Project scaffold, Tailwind, shadcn setup
2. `catalog.js` — base product data (static)
3. `calculateBOM.js` — pure function, write unit tests
4. `defaults.js` and `terminology.js`
5. Main App layout (no auth yet) with all inputs wired up
6. BOM table display working end-to-end
7. PDF and CSV export
8. Supabase project setup, schema migration
9. Auth integration (login page, session handling)
10. `useTenant` hook
11. Project save/load
12. Product Database tab with CustomProduct CRUD
13. Admin panel
14. Polish: loading states, error toasts, responsive layout, empty states

---

## Critical Implementation Notes

- **calculateBOM is a pure function.** Never call APIs or mutate state inside it. Pass all data in.
- **Wi-Fi 7 disables in-room deployment.** Enforce in UI: when `wifiGeneration === 'wifi7'`, force `deploymentType = 'hallway'` and disable the toggle.
- **miscHwPercent must be applied AFTER all other hardware items.** It calculates a percentage of the running hardware subtotal at that point.
- **Spare APs are NOT counted in totalAPs.** They are stocked spares, not deployed APs. This affects services calculation, cable quantities, and summary card.
- **The "single-IDF" path in step 9** means NO separate agg switch is added — the IDF switch serves as the core. But a separate EX2028P is still added labeled as "Core HSIA Switch."
- **Project load must merge with DEFAULT_INPUTS** to handle fields added after a project was saved: `{ ...DEFAULT_INPUTS, ...savedProject.inputs }`.
- **Price overrides are per-project, not global.** They are stored in `saved_projects.price_overrides`. The `custom_products` table holds global catalog-level changes.
- **Shipping = 7% of hardware price only** (not services).

---

## Testing Checklist

Before declaring the app complete, verify:

- [ ] 100-room hotel, 2 IDFs, hallway Wi-Fi 6: produces expected AP/switch/cable counts
- [ ] Same with Wi-Fi 7: APs switch to XV3 series, in-room option disabled
- [ ] In-room deployment: wallplate APs + WALLMNT + 3" cables appear
- [ ] Single IDF deployment: no agg switch added (only "Core HSIA Switch")
- [ ] Multiple IDFs with fiber: SFP modules and fiber cables appear
- [ ] Multiple IDFs with copper agg: EX2052P used as agg, no fiber modules
- [ ] Spare APs = 5% of guestRoomAPs, min 1; NOT counted in totalAPs
- [ ] miscHwPercent > 0: MISC-HW cost/price = exact % of hardware subtotal
- [ ] b2bConnectionType = 'none': no B2B line item
- [ ] cat6Required = false: no CAT6-DROP, no FIBER-CABLING service
- [ ] PDF: landscape letter, footer on every page, brand blue header
- [ ] CSV: no cost columns, sections separated by blank rows
- [ ] Project save/load: full round-trip preserves all inputs + overrides
- [ ] New project: resets everything to defaults
- [ ] Super admin: sees all companies' projects
- [ ] Regular user: sees only their company's projects
- [ ] Admin panel only accessible to super_admin

---

*End of Claude Code Build Guide — Cambium Wi-Fi BOM Calculator*
