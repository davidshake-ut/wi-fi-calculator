export const OTHER_TECHNOLOGY = {
  id: 'system:other-technology',
  name: 'Technology Deployment',
  description:
    'General-purpose deployment template for technology projects that do not fit a standard category. Adapt phase names and tasks to match the specific scope of work.',
  technology: 'Other',
  isSystem: true,
  phases: [
    {
      name: 'Phase 1 — Kickoff & Planning',
      order: 0,
      tasks: [
        {
          name: 'Kickoff meeting with customer',
          description:
            'Schedule and conduct project kickoff. Review the full scope of work, deliverables, and success criteria. Establish key contacts on the customer side (project owner, technical contact, on-site liaison). Confirm schedule, site access procedures, and escalation path. Document any existing systems being replaced or integrated. Agree on the communication cadence (weekly status call, email updates, or milestone-based check-ins).',
          duration_days: 0.5,
          role: 'PM',
          order: 0,
        },
        {
          name: 'Site survey & requirements gathering',
          description:
            'Visit the site and document all relevant conditions: physical layout, existing infrastructure, power availability, network connectivity, environmental conditions (temperature, humidity, dust, outdoor exposure), and any constraints (building codes, tenant rules, occupied spaces). Interview end users to understand operational requirements and workflow. Photograph all areas relevant to the installation.',
          duration_days: 1,
          role: 'Tech Lead',
          order: 1,
        },
        {
          name: 'Technical design & solution documentation',
          description:
            'Produce a technical design document: equipment layout, cable/conduit plan, network architecture (if applicable), power requirements, and integration points with existing systems. Include a bill of materials aligned to the approved quote. Document all assumptions. Identify any dependencies on third parties (ISP, electrician, general contractor) and their required timelines.',
          duration_days: 1,
          role: 'Tech Lead',
          order: 2,
        },
        {
          name: 'Design review & customer sign-off',
          description:
            'Present the technical design to the customer. Explain all major decisions and trade-offs. Incorporate any requested changes. Obtain written approval (signed SOW or email confirmation) before purchasing materials or beginning installation.',
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
            'Place PO for all hardware, software, cabling, and mounting materials per the approved BOM. Reference the approved quote number on the PO. Verify all part numbers and quantities. Flag any items with lead times longer than 2 weeks.',
          duration_days: 0.5,
          role: 'PM',
          order: 0,
        },
        {
          name: 'Confirm order & schedule delivery',
          description:
            'Verify order acknowledgment from the distributor or vendor. Confirm all ETAs and flag back-orders or substitutions. Schedule delivery to the site or a staging location. Coordinate delivery timing with the customer and any other trades on-site.',
          duration_days: 0.5,
          role: 'PM',
          order: 1,
        },
        {
          name: 'Receive, inspect & stage equipment',
          description:
            'Check in all delivered equipment against the PO line by line. Inspect for shipping damage — photograph and file claims for any damage. Update equipment firmware to current stable releases at the staging location before going to the site. Inventory all items and confirm nothing is missing before mobilizing.',
          duration_days: 0.5,
          role: 'Field Tech',
          order: 2,
        },
      ],
    },
    {
      name: 'Phase 3 — Infrastructure Installation',
      order: 2,
      tasks: [
        {
          name: 'Prepare equipment rooms & mounting locations',
          description:
            'Prepare all locations where equipment will be installed: verify adequate power circuits, ventilation, physical security, and space. Install racks, enclosures, or mounting structures. Verify all anchor points are secured to structural members rated for the equipment weight. Label all power circuits and breakers feeding the installation.',
          duration_days: 1,
          role: 'Field Tech',
          order: 0,
        },
        {
          name: 'Install conduit & cable pathways',
          description:
            'Install conduit, cable trays, or J-hooks along all planned cable routes. Use appropriate conduit type for the environment (EMT in interior/dry, rigid or PVC in damp or outdoor areas). Pull pull strings in all empty conduit. Seal all penetrations through fire-rated walls or floors with approved firestop material. Label all conduit at both ends.',
          duration_days: 2,
          role: 'Field Tech',
          order: 1,
        },
        {
          name: 'Pull & terminate all cabling',
          description:
            'Pull all signal, power, and control cable through the installed pathways. Leave adequate service loops at all device locations (12" minimum). Terminate all cable at both ends using the correct connector type. Test all cable runs with an appropriate tester and document pass/fail results. Label every cable at both ends with a unique identifier.',
          duration_days: 2,
          role: 'Field Tech',
          order: 2,
        },
      ],
    },
    {
      name: 'Phase 4 — Equipment Installation',
      order: 3,
      tasks: [
        {
          name: 'Mount & install all equipment',
          description:
            'Install all equipment at its designed location. Torque all mounting hardware to manufacturer specifications. Connect all signal, network, and power cables. Verify polarity on all power connections before energizing. Apply power to each device and confirm it powers on without fault. Label all installed equipment with its asset ID and IP address (if applicable).',
          duration_days: 2,
          role: 'Field Tech',
          order: 0,
        },
        {
          name: 'Network & IP configuration',
          description:
            'Assign IP addresses to all networked devices per the IP addressing plan. Verify all devices can be reached from the management workstation. Change all default credentials. Configure any required VLANs, firewall rules, or network policies. Verify internet or cloud connectivity if required for the system to function.',
          duration_days: 1,
          role: 'Tech Lead',
          order: 1,
        },
        {
          name: 'Cable management & labeling',
          description:
            'Dress all installed cables using Velcro straps (never permanent zip ties on signal cable). Route cables neatly through cable management and away from heat sources or pinch points. Apply final labels to all cables, devices, and ports. Photograph all completed equipment installations for the as-built documentation.',
          duration_days: 0.5,
          role: 'Field Tech',
          order: 2,
        },
      ],
    },
    {
      name: 'Phase 5 — Configuration & Commissioning',
      order: 4,
      tasks: [
        {
          name: 'System configuration',
          description:
            'Apply all required software or firmware configuration per the technical design: create user accounts, set system parameters, configure integrations with third-party platforms, and apply any licensing. Export and save a backup of all configuration files. Change all default passwords and document all credentials securely.',
          duration_days: 1,
          role: 'Tech Lead',
          order: 0,
        },
        {
          name: 'Integration testing with existing systems',
          description:
            'Test all integration points between the new system and any existing infrastructure: network connectivity, API or protocol handshakes, data exchange, alarm relay outputs, or third-party platform sync. Document the result of each integration test and resolve any failures before proceeding.',
          duration_days: 1,
          role: 'Tech Lead',
          order: 1,
        },
        {
          name: 'Configure monitoring & alerting',
          description:
            'Set up remote monitoring for the installed system: enable SNMP, syslog, or cloud-based monitoring agent as appropriate. Configure alert rules for critical fault conditions (device offline, disk full, temperature threshold, link failure). Set notification recipients to the FSG NOC and the customer\'s technical contact. Verify a test alert is successfully received.',
          duration_days: 0.5,
          role: 'Tech Lead',
          order: 2,
        },
      ],
    },
    {
      name: 'Phase 6 — Testing & QA',
      order: 5,
      tasks: [
        {
          name: 'Functional acceptance testing',
          description:
            'Test every deliverable function in the scope of work end to end. For each function, record the expected result and the actual result. Any failure is logged as a deficiency requiring remediation. Obtain the customer\'s or PM\'s sign-off on each function tested before the test is considered complete.',
          duration_days: 1,
          role: 'Tech Lead',
          order: 0,
        },
        {
          name: 'Performance & load testing',
          description:
            'Validate that the system meets the specified performance requirements under representative operating conditions: throughput, response time, concurrent users or devices, or environmental tolerance as applicable to the technology deployed. Document all performance measurements and compare against the design specification.',
          duration_days: 0.5,
          role: 'Tech Lead',
          order: 1,
        },
        {
          name: 'Punch list & remediation',
          description:
            'Compile all deficiencies identified during testing: functional failures, performance shortfalls, cosmetic issues, or incomplete configuration items. Assign each item an owner and a resolution date. Resolve all items and re-test to confirm closure. Do not proceed to handoff until all punch list items are resolved and confirmed.',
          duration_days: 1,
          role: 'PM',
          order: 2,
        },
      ],
    },
    {
      name: 'Phase 7 — Handoff & Closeout',
      order: 6,
      tasks: [
        {
          name: 'Customer training',
          description:
            'Conduct hands-on training with the customer\'s designated administrator and end users. Tailor the content to the system deployed. Confirm all trainees can independently perform their core day-to-day tasks in the system before training is considered complete. Provide written quick-reference documentation for common operations.',
          duration_days: 1,
          role: 'PM',
          order: 0,
        },
        {
          name: 'Deliver as-built documentation',
          description:
            'Compile and deliver the full handoff package: (1) As-built installation drawings or diagrams. (2) IP address and device inventory table. (3) Configuration backup files. (4) All login credentials stored securely. (5) Equipment serial numbers and warranty expiry dates. (6) Vendor and FSG support contact information and escalation path. (7) Test results and acceptance sign-off records.',
          duration_days: 0.5,
          role: 'PM',
          order: 1,
        },
        {
          name: 'Project closeout',
          description:
            'Issue final invoice per contract. Close all open time entries and mark project complete in FSG OS. Update the CRM account record with project notes and support tier. Start the warranty period clock. Schedule a 30-day check-in call with the customer. Archive all project documentation, configuration backups, and test records.',
          duration_days: 0.5,
          role: 'PM',
          order: 2,
        },
      ],
    },
  ],
};
