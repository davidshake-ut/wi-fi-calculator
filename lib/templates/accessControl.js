export const ACCESS_CONTROL = {
  id: 'system:access-control',
  name: 'Access Control System Deployment',
  description:
    'End-to-end deployment template for electronic access control systems. Covers door survey, hardware installation, controller programming, credential enrollment, and staff training.',
  technology: 'Access Control',
  isSystem: true,
  phases: [
    {
      name: 'Phase 1 — Kickoff & Design',
      order: 0,
      tasks: [
        {
          name: 'Kickoff meeting with customer & security stakeholders',
          description:
            'Conduct project kickoff with property owner, security director, and IT contact. Review full scope: door count, credential technology (proximity, smart card, mobile, PIN, or biometric), access schedule requirements, integration with existing alarm/CCTV systems, and remote management needs. Establish key contacts, communication protocols, access procedures (especially for occupied buildings), and escalation path. Document any legacy system being replaced and determine if existing hardware can be reused.',
          duration_days: 0.5,
          role: 'PM',
          order: 0,
        },
        {
          name: 'Door survey & hardware assessment',
          description:
            'Physically inspect every door in the scope. For each door record: door material (hollow metal, wood, glass, aluminum storefront), frame type (hollow metal, aluminum, wood), door thickness, hinge position, existing hardware (lockset, panic hardware, closer, existing reader or keypad), power availability (is there a junction box above the door or nearby?), and the required locking device (electric strike, electromagnetic lock, or electrified lockset). Assess cable routing path from each door to the nearest controller panel or IDF. Photograph all doors and frames.',
          duration_days: 1,
          role: 'Tech Lead',
          order: 1,
        },
        {
          name: 'System design & access level plan',
          description:
            'Design the full access control architecture: number of access control panels (ACUs), controller locations, door-to-panel assignments, and network topology (IP-based controllers vs. RS-485 serial). Define the credential technology and card format. Create an access level matrix: which credential groups can access which doors during which time schedules (e.g., "Employees — All Interior Doors M–F 7am–7pm", "Maintenance — All Doors 24/7"). Design the wiring plan: reader cable (18/4 shielded), lock power cable, REX sensor, and door contact for each door. Calculate power supply requirements — include lock inrush current.',
          duration_days: 1,
          role: 'Tech Lead',
          order: 2,
        },
        {
          name: 'Design review & customer sign-off',
          description:
            'Present the system design, door hardware specifications, access level matrix, and credential plan to the customer. Walk through each door and explain hardware selection rationale. Review the lockdown and egress plan (free egress is required by fire code on all occupied egress doors regardless of access control). Confirm integration touchpoints (alarm panel, video, elevator, visitor management). Obtain written sign-off before ordering equipment.',
          duration_days: 0.5,
          role: 'PM',
          order: 3,
        },
      ],
    },
    {
      name: 'Phase 2 — Procurement',
      order: 1,
      tasks: [
        {
          name: 'Submit purchase order',
          description:
            'Place PO for all hardware: access control panels/controllers, power supplies with battery backup, readers (verify card format compatibility with existing badges if applicable), electric strikes or maglocks, REX (request to exit) sensors, door contacts, door closers if needed, cabling (18/4 shielded for readers, 16/2 for power, 22/2 for contacts), conduit, and credential cards or fobs. Include any license fees for the access control software. Verify all part numbers against the approved BOM.',
          duration_days: 0.5,
          role: 'PM',
          order: 0,
        },
        {
          name: 'Confirm order & schedule delivery',
          description:
            'Verify order acknowledgment from the distributor. Confirm all lead times — access control panels and specialty readers can have longer lead times. Flag any substitutions or back-orders immediately. Schedule delivery to staging location. Coordinate with the customer for any doors that require the building locksmith or door hardware contractor for frame prep.',
          duration_days: 0.5,
          role: 'PM',
          order: 1,
        },
        {
          name: 'Receive, inspect & stage equipment',
          description:
            'Check in all delivered equipment against the PO. Inspect panels, readers, and locking devices for damage. Pre-program panel IP addresses and test panel power-on at the staging location before going to the site. Verify all reader LEDs illuminate on bench test. Inventory all credential cards/fobs and record counts.',
          duration_days: 0.5,
          role: 'Field Tech',
          order: 2,
        },
      ],
    },
    {
      name: 'Phase 3 — Infrastructure & Wiring',
      order: 2,
      tasks: [
        {
          name: 'Install access control panels & power supplies',
          description:
            'Mount access control panels and associated power supplies in the designed locations (typically a locked IDF, electrical room, or security closet on each floor). Mount power supply enclosures adjacent to panels. Connect panels to the network (IP controllers) or to the head-end via RS-485 wiring. Apply a static management IP to each IP controller per the addressing plan. Label all panels with location and panel ID.',
          duration_days: 1,
          role: 'Tech Lead',
          order: 0,
        },
        {
          name: 'Install conduit & pull wiring — all doors',
          description:
            'Install conduit from the panel to each door in the panel\'s zone. Use 3/4" EMT in exposed or mechanical areas; flexible conduit for the last 18" at the door frame to accommodate hinge swing. Pull 18/4 shielded cable to each reader location, 16/2 power cable to each locking device, and 22/2 for each REX sensor and door contact. Leave 12" service loops at all device locations. Label all cables at both ends with the door ID.',
          duration_days: 3,
          role: 'Field Tech',
          order: 1,
        },
        {
          name: 'Frame prep & locking device installation',
          description:
            'Install locking devices at each door: electric strikes in the door frame at the latch engagement point (verify the strike is the correct "fail safe" or "fail secure" type per the design and fire code requirements for that door), or electromagnetic locks mounted at the top of the frame with a strike plate on the door. Install door closers where required. Drill and mount all hardware per manufacturer templates. Connect lock power wires. Verify door closes and latches securely.',
          duration_days: 2,
          role: 'Field Tech',
          order: 2,
        },
        {
          name: 'Install readers, REX sensors & door contacts',
          description:
            'Mount credential readers on the door frame or adjacent wall at 42" AFF (centerline) per ADA guidelines. Connect reader data wires (Wiegand or OSDP) and power wires to the controller. Mount REX (passive infrared or push-button) sensors above the door on the secure side. Mount magnetic door contacts on the door and frame (top corner preferred). Wire all devices to the corresponding controller inputs. Label all wiring at the panel termination.',
          duration_days: 1,
          role: 'Field Tech',
          order: 3,
        },
      ],
    },
    {
      name: 'Phase 4 — Software & Programming',
      order: 3,
      tasks: [
        {
          name: 'Install & configure access control software',
          description:
            'Install the access control software (or connect to the cloud-based platform) on the designated server or workstation. Apply all software licenses. Add all hardware: panels, doors, readers, inputs, and outputs per the door survey. Set IP addresses and verify all panels connect to the software. Change all default passwords. Configure the database backup schedule.',
          duration_days: 1,
          role: 'Tech Lead',
          order: 0,
        },
        {
          name: 'Configure doors, schedules & holidays',
          description:
            'In the access control software, create all time schedules that will be used in the access level matrix (e.g., Business Hours M–F 7am–7pm, 24/7, After Hours). Create a holiday schedule for all observed holidays. Configure each door: assign the reader, define the "door open too long" (DOTL) alarm threshold (typically 30 seconds), define the "forced door" alarm behavior, set the "door held open" relay output. Set the lock relay strike time (typically 3–5 seconds).',
          duration_days: 1,
          role: 'Tech Lead',
          order: 1,
        },
        {
          name: 'Create access levels & credential groups',
          description:
            'Build all access levels in the software per the approved access level matrix. Create cardholder groups (departments or tenant groups). Assign access levels to groups. Set anti-passback rules if applicable. Configure alarm output rules (e.g., forced door triggers monitoring station notification). Set up guard tour points if in scope.',
          duration_days: 0.5,
          role: 'Tech Lead',
          order: 2,
        },
        {
          name: 'Enroll credentials & create cardholder records',
          description:
            'Import or manually enter all cardholder records. Encode and assign credential cards or fobs to each cardholder. Assign each cardholder to the appropriate group and access level. For mobile credentials, send enrollment invitations to each user. For PIN systems, generate and distribute PINs securely. For biometric enrollment, schedule enrollment sessions with all users at the reader location.',
          duration_days: 1,
          role: 'Tech Lead',
          order: 3,
        },
      ],
    },
    {
      name: 'Phase 5 — Testing & QA',
      order: 4,
      tasks: [
        {
          name: 'Door-by-door hardware & wiring test',
          description:
            'Test every door in sequence: present an authorized credential to the reader and verify the lock releases and the door opens. Verify the door contact reports "open" and "closed" correctly in the software. Wave in front of the REX sensor and verify the lock releases without a credential (free egress). Hold the door open past the DOTL threshold and verify the alarm triggers in the software. Force the door open (brief manual force) and verify the forced-door alarm triggers.',
          duration_days: 1,
          role: 'Tech Lead',
          order: 0,
        },
        {
          name: 'Access level & schedule verification',
          description:
            'Use a set of test credentials representing each access level. For each credential, verify access is granted at the correct doors during allowed hours and denied at unauthorized doors. Advance the system clock to outside business hours and verify after-hours restrictions apply. Test all holiday schedule overrides. Test any anti-passback rules by attempting to badge in twice without badging out.',
          duration_days: 1,
          role: 'Tech Lead',
          order: 1,
        },
        {
          name: 'Alarm & integration testing',
          description:
            'Verify all alarm events appear in the software event log with correct timestamps. Test any third-party integrations: if integrated with a CCTV system, verify that a door alarm triggers a camera popup. If integrated with an alarm panel, verify the access control alarm relay outputs trigger the correct alarm panel zones. Test the lockdown function if the system includes that feature.',
          duration_days: 0.5,
          role: 'Tech Lead',
          order: 2,
        },
        {
          name: 'Punch list & remediation',
          description:
            'Compile all issues: non-functioning readers, misaligned strikes, incorrect access level assignments, wiring faults, or software configuration errors. Assign remediation owners and completion dates. Resolve all items and re-test to confirm resolution. Document final pass/fail status for each door.',
          duration_days: 0.5,
          role: 'PM',
          order: 3,
        },
      ],
    },
    {
      name: 'Phase 6 — Handoff & Closeout',
      order: 5,
      tasks: [
        {
          name: 'Administrator training',
          description:
            'Conduct hands-on administrator training with the designated system administrator(s). Cover: adding and removing cardholders, assigning access levels, generating access and event reports, responding to alarms, unlocking a door remotely, creating temporary access credentials, and how to add a new door (if applicable to their software tier). Confirm the administrator can independently add a new user and run an access report before training is complete.',
          duration_days: 1,
          role: 'PM',
          order: 0,
        },
        {
          name: 'End-user credential distribution',
          description:
            'Distribute physical credentials (cards, fobs) to all end users or confirm mobile credential enrollment is complete. For any users not present at time of installation, document the handoff procedure for the property manager to distribute remaining credentials. Collect and deactivate all test credentials used during commissioning.',
          duration_days: 0.5,
          role: 'PM',
          order: 1,
        },
        {
          name: 'Deliver as-built documentation',
          description:
            'Compile and deliver the full handoff package: (1) Door hardware schedule with device types and model numbers at each door. (2) Panel layout diagram showing which doors are wired to which panel inputs/outputs. (3) IP address table for all controllers and workstations. (4) Access level matrix (final approved version). (5) Software admin login credentials (stored securely). (6) Equipment serial numbers, warranty information, and software license keys. (7) FSG support contact and escalation path.',
          duration_days: 0.5,
          role: 'PM',
          order: 2,
        },
        {
          name: 'Project closeout',
          description:
            'Issue final invoice per contract. Close all open time entries and mark project complete in FSG OS. Update the CRM account with door count, panel model, software version, and support tier. Start the warranty period clock. Schedule a 30-day check-in to confirm the system is operating correctly and the administrator is comfortable managing it. Archive all project documentation.',
          duration_days: 0.5,
          role: 'PM',
          order: 3,
        },
      ],
    },
  ],
};
