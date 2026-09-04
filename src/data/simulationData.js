export const VEHICLE_TYPES = {
  BIKE: { label: "Courier Bike (Small / Nimble)", speed: 84, capacity: 25, fuel: 100, fuelRate: 0.010, icon: "bicycle" },
  VAN: { label: "Delivery Van (Medium Cargo)", speed: 68, capacity: 120, fuel: 190, fuelRate: 0.018, icon: "van" },
  TRUCK: { label: "Heavy Transport (High Capacity)", speed: 52, capacity: 260, fuel: 260, fuelRate: 0.024, icon: "truck" },
};

export const PRIORITY_RANK = {
  CRITICAL: 3,
  HIGH: 2,
  NORMAL: 1,
};

export const MAP_DATA = {
  viewBox: "0 0 1200 780",
  width: 1200,
  height: 780,

  river: {
    name: "Rivermere River",
    x: 550,
    width: 100,
    boats: [
      { id: "BOAT-1", x: 600, y: 120, length: 28, width: 10, angle: 180 },
      { id: "BOAT-2", x: 595, y: 470, length: 26, width: 10, angle: 175 },
      { id: "BOAT-3", x: 605, y: 660, length: 24, width: 9, angle: 190 },
    ],
  },

  bridges: [
    { id: "ROAD-BR-N", label: "North Bridge", x: 520, y: 190, width: 160, height: 38, fromNode: "A_N_BRIDGE", toNode: "B_N_BRIDGE" },
    { id: "ROAD-BR-S", label: "South Bridge", x: 520, y: 530, width: 160, height: 38, fromNode: "C_S_BRIDGE", toNode: "D_S_BRIDGE" },
  ],

  warehouse: {
    id: "HUB_WH",
    label: "Warehouse (Main Hub)",
    clusterId: "CL-C",
    x: 170,
    y: 600,
    building: { x: 90, y: 560, width: 160, height: 100 },
    bays: [
      { x: 110, y: 662, width: 22, height: 16 },
      { x: 140, y: 662, width: 22, height: 16 },
      { x: 170, y: 662, width: 22, height: 16 },
      { x: 200, y: 662, width: 22, height: 16 },
    ],
    dockedTrucks: [
      { x: 55, y: 580, width: 26, height: 14 },
      { x: 55, y: 620, width: 26, height: 14 },
    ],
  },

  clusters: [
    {
      id: "CL-A",
      name: "Cluster A",
      subtitle: "Northwest",
      theme: "green",
      color: "#22c55e",
      badgeColor: "#15803d",
      badgeX: 110,
      badgeY: 42,
      bounds: { x: 50, y: 40, width: 470, height: 280 },
    },
    {
      id: "CL-B",
      name: "Cluster B",
      subtitle: "Northeast",
      theme: "red",
      color: "#ef4444",
      badgeColor: "#b91c1c",
      badgeX: 1040,
      badgeY: 42,
      bounds: { x: 680, y: 40, width: 480, height: 280 },
    },
    {
      id: "CL-C",
      name: "Cluster C",
      subtitle: "Southwest",
      theme: "blue",
      color: "#3b82f6",
      badgeColor: "#1d4ed8",
      badgeX: 100,
      badgeY: 410,
      bounds: { x: 50, y: 390, width: 470, height: 350 },
    },
    {
      id: "CL-D",
      name: "Cluster D",
      subtitle: "Southeast",
      theme: "yellow",
      color: "#f59e0b",
      badgeColor: "#d97706",
      badgeX: 1060,
      badgeY: 410,
      bounds: { x: 680, y: 390, width: 480, height: 350 },
    },
  ],

  // City intersections forming the road graph
  intersections: [
    // Cluster A (Northwest)
    { id: "A_R1_C1", label: "NW Park Junction", x: 130, y: 80 },
    { id: "A_R1_C2", label: "North Clinic Lane", x: 230, y: 80 },
    { id: "A_R1_C3", label: "Upper A Avenue", x: 380, y: 80 },
    { id: "A_R1_C4", label: "A East Edge", x: 490, y: 80 },

    { id: "A_R2_C1", label: "West Res Parkway", x: 130, y: 190 },
    { id: "A_R2_C2", label: "NW Central Cross", x: 230, y: 190 },
    { id: "A_R2_C3", label: "Mid A Boulevard", x: 380, y: 190 },
    { id: "A_N_BRIDGE", label: "A Bridge Approach", x: 490, y: 190 },

    { id: "A_R3_C1", label: "Lower A West", x: 130, y: 280 },
    { id: "A_R3_C2", label: "A South Homes", x: 230, y: 280 },
    { id: "A_R3_C3", label: "A South Cross", x: 380, y: 280 },
    { id: "A_R3_C4", label: "A Southeast Gate", x: 490, y: 280 },

    // Central Main Avenue & Roundabouts
    { id: "ROUNDABOUT_WEST", label: "West Roundabout", x: 100, y: 340 },
    { id: "AVE_W_1", label: "West Avenue 1", x: 230, y: 340 },
    { id: "AVE_W_2", label: "West Avenue 2", x: 380, y: 340 },
    { id: "AVE_W_EDGE", label: "West Riverbank", x: 490, y: 340 },

    { id: "AVE_E_EDGE", label: "East Riverbank", x: 710, y: 340 },
    { id: "AVE_E_1", label: "East Avenue 1", x: 830, y: 340 },
    { id: "AVE_E_2", label: "East Avenue 2", x: 960, y: 340 },
    { id: "ROUNDABOUT_EAST", label: "East Roundabout", x: 1110, y: 340 },

    // Cluster B (Northeast)
    { id: "B_N_BRIDGE", label: "B Bridge Approach", x: 710, y: 190 },
    { id: "B_R1_C1", label: "NE River Cross", x: 710, y: 80 },
    { id: "B_R1_C2", label: "B North Homes", x: 830, y: 80 },
    { id: "B_R1_C3", label: "B Upper Square", x: 960, y: 80 },
    { id: "B_R1_C4", label: "NE Terminal", x: 1080, y: 80 },

    { id: "B_R2_C2", label: "B Central Plaza", x: 830, y: 190 },
    { id: "B_R2_C3", label: "East Market Square", x: 960, y: 190 },
    { id: "B_R2_C4", label: "B East Parkway", x: 1080, y: 190 },

    { id: "B_R3_C1", label: "Lower B Riverbank", x: 710, y: 280 },
    { id: "B_R3_C2", label: "B South Cross", x: 830, y: 280 },
    { id: "B_R3_C3", label: "B South Residences", x: 960, y: 280 },
    { id: "B_R3_C4", label: "B Southeast Gate", x: 1080, y: 280 },

    // Cluster C (Southwest)
    { id: "C_R1_C1", label: "C Northwest Corner", x: 130, y: 430 },
    { id: "C_R1_C2", label: "C North Residences", x: 230, y: 430 },
    { id: "C_R1_C3", label: "C Upper Cross", x: 380, y: 430 },
    { id: "C_R1_C4", label: "C Riverbank North", x: 490, y: 430 },

    { id: "C_R2_C1", label: "C Mid West", x: 130, y: 530 },
    { id: "C_R2_C2", label: "Southwest Store Plaza", x: 230, y: 530 },
    { id: "C_R2_C3", label: "C Center Cross", x: 380, y: 530 },
    { id: "C_S_BRIDGE", label: "C South Bridge", x: 490, y: 530 },

    { id: "HUB_WH", label: "Central Warehouse Hub", x: 170, y: 630 },
    { id: "C_R3_C2", label: "Warehouse Dock Exit", x: 260, y: 630 },
    { id: "C_R3_C3", label: "C South Boulevard", x: 380, y: 630 },
    { id: "C_R3_C4", label: "C South Riverbank", x: 490, y: 630 },

    // Cluster D (Southeast)
    { id: "D_R1_C1", label: "D North Riverbank", x: 710, y: 430 },
    { id: "D_R1_C2", label: "D North Cross", x: 830, y: 430 },
    { id: "D_R1_C3", label: "D Community Square", x: 960, y: 430 },
    { id: "D_R1_C4", label: "D East Edge", x: 1080, y: 430 },

    { id: "D_S_BRIDGE", label: "D South Bridge", x: 710, y: 530 },
    { id: "D_R2_C2", label: "Southeast Pickup Hub", x: 830, y: 530 },
    { id: "D_R2_C3", label: "D South Residences", x: 960, y: 530 },
    { id: "D_R2_C4", label: "Highway Ramp Entrance", x: 1080, y: 530 },

    { id: "D_R3_C1", label: "D Lower Riverbank", x: 710, y: 640 },
    { id: "D_R3_C2", label: "D South Industrial", x: 830, y: 640 },
    { id: "D_R3_C3", label: "D Harbor Junction", x: 960, y: 640 },
    { id: "D_HIGHWAY_EXIT", label: "Overpass Flyover Exit", x: 1080, y: 640 },
  ],

  // Specific Delivery & Pickup Locations
  locations: [
    // Cluster A
    { id: "LOC-A1", nodeId: "A_R1_C2", label: "Green Clinic", type: "customer", clusterId: "CL-A" },
    { id: "LOC-A2", nodeId: "A_R1_C4", label: "Avenue Homes 4", type: "customer", clusterId: "CL-A" },
    { id: "LOC-A3", nodeId: "A_R2_C2", label: "Northwest Housing", type: "customer", clusterId: "CL-A" },
    { id: "LOC-A4", nodeId: "A_R3_C1", label: "West Meadow Homes", type: "customer", clusterId: "CL-A" },
    { id: "LOC-A5", nodeId: "A_R3_C3", label: "Parkside Residences", type: "customer", clusterId: "CL-A" },

    // Cluster B
    { id: "LOC-B1", nodeId: "B_R1_C2", label: "Northeast Apartments", type: "customer", clusterId: "CL-B" },
    { id: "LOC-B2", nodeId: "B_R1_C4", label: "Block 12 Residences", type: "customer", clusterId: "CL-B" },
    { id: "LOC-B_STORE", nodeId: "B_R2_C3", label: "East Mart & Pickup", type: "store", clusterId: "CL-B" },
    { id: "LOC-B3", nodeId: "B_R2_C1", label: "B Riverfront Flat", type: "customer", clusterId: "CL-B" },
    { id: "LOC-B4", nodeId: "B_R3_C3", label: "Northeast Metro Court", type: "customer", clusterId: "CL-B" },

    // Cluster C
    { id: "LOC-C1", nodeId: "C_R1_C2", label: "Southwest Care Center", type: "customer", clusterId: "CL-C" },
    { id: "LOC-C_STORE", nodeId: "C_R2_C2", label: "Metro Mart SW", type: "store", clusterId: "CL-C" },
    { id: "LOC-C2", nodeId: "C_R1_C4", label: "Riverview Homes C", type: "customer", clusterId: "CL-C" },
    { id: "LOC-C3", nodeId: "C_R2_C3", label: "Southwest Highrise", type: "customer", clusterId: "CL-C" },
    { id: "LOC-C4", nodeId: "C_R3_C3", label: "South Industrial Unit", type: "customer", clusterId: "CL-C" },

    // Cluster D
    { id: "LOC-D1", nodeId: "D_R1_C2", label: "Southeast Shelter", type: "customer", clusterId: "CL-D" },
    { id: "LOC-D_STORE", nodeId: "D_R2_C2", label: "Express Pickup Point", type: "store", clusterId: "CL-D" },
    { id: "LOC-D2", nodeId: "D_R1_C3", label: "Harbor View Flats", type: "customer", clusterId: "CL-D" },
    { id: "LOC-D3", nodeId: "D_R2_C3", label: "Highway Green Condos", type: "customer", clusterId: "CL-D" },
    { id: "LOC-D4", nodeId: "D_R3_C3", label: "Eastport Residences", type: "customer", clusterId: "CL-D" },
  ],

  // Road graph segments
  roads: [
    // Bridges
    { id: "ROAD-BR-N", from: "A_N_BRIDGE", to: "B_N_BRIDGE", type: "bridge", label: "North Bridge Span" },
    { id: "ROAD-BR-S", from: "C_S_BRIDGE", to: "D_S_BRIDGE", type: "bridge", label: "South Bridge Span" },

    // Cluster A Roads
    { id: "RA-01", from: "A_R1_C1", to: "A_R1_C2", type: "cluster", label: "North Clinic Lane" },
    { id: "RA-02", from: "A_R1_C2", to: "A_R1_C3", type: "cluster", label: "Upper A Avenue" },
    { id: "RA-03", from: "A_R1_C3", to: "A_R1_C4", type: "cluster", label: "A East Edge" },
    { id: "RA-04", from: "A_R1_C1", to: "A_R2_C1", type: "cluster", label: "West Meadow Way" },
    { id: "RA-05", from: "A_R1_C2", to: "A_R2_C2", type: "cluster", label: "NW Center Link" },
    { id: "RA-06", from: "A_R1_C3", to: "A_R2_C3", type: "cluster", label: "Mid A Cross" },
    { id: "RA-07", from: "A_R1_C4", to: "A_N_BRIDGE", type: "arterial", label: "North Bridge Approach A" },
    { id: "RA-08", from: "A_R2_C1", to: "A_R2_C2", type: "cluster", label: "NW Housing Link" },
    { id: "RA-09", from: "A_R2_C2", to: "A_R2_C3", type: "cluster", label: "Mid A Boulevard" },
    { id: "RA-10", from: "A_R2_C3", to: "A_N_BRIDGE", type: "cluster", label: "Bridge Connector A" },
    { id: "RA-11", from: "A_R2_C1", to: "A_R3_C1", type: "cluster", label: "Parkside Access A" },
    { id: "RA-12", from: "A_R2_C2", to: "A_R3_C2", type: "cluster", label: "A South Link" },
    { id: "RA-13", from: "A_R2_C3", to: "A_R3_C3", type: "cluster", label: "A South Boulevard" },
    { id: "RA-14", from: "A_N_BRIDGE", to: "A_R3_C4", type: "arterial", label: "A River Arterial" },
    { id: "RA-15", from: "A_R3_C1", to: "A_R3_C2", type: "cluster", label: "Meadow Way A" },
    { id: "RA-16", from: "A_R3_C2", to: "A_R3_C3", type: "cluster", label: "Parkside Lane A" },
    { id: "RA-17", from: "A_R3_C3", to: "A_R3_C4", type: "cluster", label: "Southeast Gate A" },

    // Central West Avenue
    { id: "RW-01", from: "ROUNDABOUT_WEST", to: "AVE_W_1", type: "arterial", label: "West Arterial 1" },
    { id: "RW-02", from: "AVE_W_1", to: "AVE_W_2", type: "arterial", label: "West Main Corridor" },
    { id: "RW-03", from: "AVE_W_2", to: "AVE_W_EDGE", type: "arterial", label: "West Riverbank Way" },
    { id: "RW-04", from: "ROUNDABOUT_WEST", to: "A_R3_C1", type: "local", label: "Roundabout NW Spur" },
    { id: "RW-05", from: "AVE_W_1", to: "A_R3_C2", type: "local", label: "Avenue Cross A1" },
    { id: "RW-06", from: "AVE_W_2", to: "A_R3_C3", type: "local", label: "Avenue Cross A2" },
    { id: "RW-07", from: "AVE_W_EDGE", to: "A_R3_C4", type: "arterial", label: "River Ramp North" },
    { id: "RW-08", from: "ROUNDABOUT_WEST", to: "C_R1_C1", type: "local", label: "Roundabout SW Spur" },
    { id: "RW-09", from: "AVE_W_1", to: "C_R1_C2", type: "local", label: "Avenue Cross C1" },
    { id: "RW-10", from: "AVE_W_2", to: "C_R1_C3", type: "local", label: "Avenue Cross C2" },
    { id: "RW-11", from: "AVE_W_EDGE", to: "C_R1_C4", type: "arterial", label: "River Ramp South" },

    // Central East Avenue
    { id: "RE-01", from: "AVE_E_EDGE", to: "AVE_E_1", type: "arterial", label: "East Riverbank Way" },
    { id: "RE-02", from: "AVE_E_1", to: "AVE_E_2", type: "arterial", label: "East Main Corridor" },
    { id: "RE-03", from: "AVE_E_2", to: "ROUNDABOUT_EAST", type: "arterial", label: "East Arterial 2" },
    { id: "RE-04", from: "AVE_E_EDGE", to: "B_R3_C1", type: "arterial", label: "NE River Ramp" },
    { id: "RE-05", from: "AVE_E_1", to: "B_R3_C2", type: "local", label: "Avenue Cross B1" },
    { id: "RE-06", from: "AVE_E_2", to: "B_R3_C3", type: "local", label: "Avenue Cross B2" },
    { id: "RE-07", from: "ROUNDABOUT_EAST", to: "B_R3_C4", type: "local", label: "Roundabout NE Spur" },
    { id: "RE-08", from: "AVE_E_EDGE", to: "D_R1_C1", type: "arterial", label: "SE River Ramp" },
    { id: "RE-09", from: "AVE_E_1", to: "D_R1_C2", type: "local", label: "Avenue Cross D1" },
    { id: "RE-10", from: "AVE_E_2", to: "D_R1_C3", type: "local", label: "Avenue Cross D2" },
    { id: "RE-11", from: "ROUNDABOUT_EAST", to: "D_R1_C4", type: "local", label: "Roundabout SE Spur" },

    // Cluster B Roads
    { id: "RB-01", from: "B_R1_C1", to: "B_R1_C2", type: "cluster", label: "B Riverfront Lane" },
    { id: "RB-02", from: "B_R1_C2", to: "B_R1_C3", type: "cluster", label: "B North Homes Link" },
    { id: "RB-03", from: "B_R1_C3", to: "B_R1_C4", type: "cluster", label: "Block 12 Avenue" },
    { id: "RB-04", from: "B_R1_C1", to: "B_N_BRIDGE", type: "arterial", label: "North Bridge Approach B" },
    { id: "RB-05", from: "B_R1_C2", to: "B_R2_C2", type: "cluster", label: "B Center Cross" },
    { id: "RB-06", from: "B_R1_C3", to: "B_R2_C3", type: "cluster", label: "East Mart Way" },
    { id: "RB-07", from: "B_R1_C4", to: "B_R2_C4", type: "cluster", label: "B East Parkway" },
    { id: "RB-08", from: "B_N_BRIDGE", to: "B_R2_C2", type: "cluster", label: "Plaza Connector B" },
    { id: "RB-09", from: "B_R2_C2", to: "B_R2_C3", type: "cluster", label: "East Market Plaza" },
    { id: "RB-10", from: "B_R2_C3", to: "B_R2_C4", type: "cluster", label: "East Terminal Access" },
    { id: "RB-11", from: "B_N_BRIDGE", to: "B_R3_C1", type: "arterial", label: "B River Arterial" },
    { id: "RB-12", from: "B_R2_C2", to: "B_R3_C2", type: "cluster", label: "B South Cross" },
    { id: "RB-13", from: "B_R2_C3", to: "B_R3_C3", type: "cluster", label: "Metro Court Link" },
    { id: "RB-14", from: "B_R2_C4", to: "B_R3_C4", type: "cluster", label: "Southeast Gate B" },
    { id: "RB-15", from: "B_R3_C1", to: "B_R3_C2", type: "cluster", label: "South Riverfront B" },
    { id: "RB-16", from: "B_R3_C2", to: "B_R3_C3", type: "cluster", label: "Metro Court Avenue" },
    { id: "RB-17", from: "B_R3_C3", to: "B_R3_C4", type: "cluster", label: "B Boundary Road" },

    // Cluster C Roads (including Warehouse connectivity)
    { id: "RC-01", from: "C_R1_C1", to: "C_R1_C2", type: "cluster", label: "Care Center Link" },
    { id: "RC-02", from: "C_R1_C2", to: "C_R1_C3", type: "cluster", label: "C Upper Avenue" },
    { id: "RC-03", from: "C_R1_C3", to: "C_R1_C4", type: "cluster", label: "Riverview Link C" },
    { id: "RC-04", from: "C_R1_C1", to: "C_R2_C1", type: "cluster", label: "C West Parkway" },
    { id: "RC-05", from: "C_R1_C2", to: "C_R2_C2", type: "cluster", label: "Metro Mart SW Way" },
    { id: "RC-06", from: "C_R1_C3", to: "C_R2_C3", type: "cluster", label: "C Center Link" },
    { id: "RC-07", from: "C_R1_C4", to: "C_S_BRIDGE", type: "arterial", label: "South Bridge Approach C" },
    { id: "RC-08", from: "C_R2_C1", to: "C_R2_C2", type: "cluster", label: "Store Plaza C" },
    { id: "RC-09", from: "C_R2_C2", to: "C_R2_C3", type: "cluster", label: "Highrise Access C" },
    { id: "RC-10", from: "C_R2_C3", to: "C_S_BRIDGE", type: "cluster", label: "Bridge Connector C" },
    { id: "RC-11", from: "C_R2_C1", to: "HUB_WH", type: "arterial", label: "Warehouse West Gate" },
    { id: "RC-12", from: "HUB_WH", to: "C_R3_C2", type: "arterial", label: "Warehouse Main Exit" },
    { id: "RC-13", from: "C_R2_C2", to: "C_R3_C2", type: "cluster", label: "Dock Access Road" },
    { id: "RC-14", from: "C_R3_C2", to: "C_R3_C3", type: "cluster", label: "South Industrial Way" },
    { id: "RC-15", from: "C_R2_C3", to: "C_R3_C3", type: "cluster", label: "Industrial Cross C" },
    { id: "RC-16", from: "C_S_BRIDGE", to: "C_R3_C4", type: "arterial", label: "C River Arterial South" },
    { id: "RC-17", from: "C_R3_C3", to: "C_R3_C4", type: "cluster", label: "C South Perimeter" },

    // Cluster D Roads (including Highway Flyover)
    { id: "RD-01", from: "D_R1_C1", to: "D_R1_C2", type: "cluster", label: "Shelter Access Way" },
    { id: "RD-02", from: "D_R1_C2", to: "D_R1_C3", type: "cluster", label: "Harbor View Link" },
    { id: "RD-03", from: "D_R1_C3", to: "D_R1_C4", type: "cluster", label: "D East Parkway" },
    { id: "RD-04", from: "D_R1_C1", to: "D_S_BRIDGE", type: "arterial", label: "South Bridge Approach D" },
    { id: "RD-05", from: "D_R1_C2", to: "D_R2_C2", type: "cluster", label: "Express Pickup Link" },
    { id: "RD-06", from: "D_R1_C3", to: "D_R2_C3", type: "cluster", label: "Highway Green Link" },
    { id: "RD-07", from: "D_R1_C4", to: "D_R2_C4", type: "cluster", label: "Overpass Ramp North" },
    { id: "RD-08", from: "D_S_BRIDGE", to: "D_R2_C2", type: "cluster", label: "Bridge Connector D" },
    { id: "RD-09", from: "D_R2_C2", to: "D_R2_C3", type: "cluster", label: "Community Square D" },
    { id: "RD-10", from: "D_R2_C3", to: "D_R2_C4", type: "cluster", label: "Flyover Approach East" },
    { id: "RD-11", from: "D_S_BRIDGE", to: "D_R3_C1", type: "arterial", label: "D River Arterial South" },
    { id: "RD-12", from: "D_R2_C2", to: "D_R3_C2", type: "cluster", label: "Industrial Cross D" },
    { id: "RD-13", from: "D_R2_C3", to: "D_R3_C3", type: "cluster", label: "Eastport Access" },
    { id: "RD-14", from: "D_R2_C4", to: "D_HIGHWAY_EXIT", type: "highway", label: "Highway Overpass Flyover" },
    { id: "RD-15", from: "D_R3_C1", to: "D_R3_C2", type: "cluster", label: "D South Riverfront" },
    { id: "RD-16", from: "D_R3_C2", to: "D_R3_C3", type: "cluster", label: "Eastport Boulevard" },
    { id: "RD-17", from: "D_R3_C3", to: "D_HIGHWAY_EXIT", type: "arterial", label: "Overpass South Merge" },
  ],

  // Highway overpass geometry for the bottom-right interchange
  highwayOverpass: [
    { id: "HW-MAIN", path: "M 680 730 C 820 730 960 700 1140 590", width: 22, color: "#334155", laneColor: "#facc15" },
    { id: "HW-RAMP-1", path: "M 780 750 C 880 750 990 680 1180 640", width: 14, color: "#1e293b", laneColor: "#94a3b8" },
    { id: "HW-FLYOVER", path: "M 920 760 C 1040 730 1120 670 1200 630", width: 16, color: "#334155", laneColor: "#facc15" },
  ],

  // City Building blocks for urban depth
  buildings: [
    { id: "A-B1", x: 146, y: 96, width: 68, height: 78 },
    { id: "A-B2", x: 246, y: 96, width: 118, height: 78 },
    { id: "A-B3", x: 396, y: 96, width: 78, height: 78 },
    { id: "A-B4", x: 146, y: 206, width: 68, height: 58 },
    { id: "A-B5", x: 246, y: 206, width: 118, height: 58 },
    { id: "A-B6", x: 396, y: 206, width: 78, height: 58 },

    { id: "B-B1", x: 726, y: 96, width: 88, height: 78 },
    { id: "B-B2", x: 846, y: 96, width: 98, height: 78 },
    { id: "B-B3", x: 976, y: 96, width: 88, height: 78 },
    { id: "B-B4", x: 726, y: 206, width: 88, height: 58 },
    { id: "B-B5", x: 846, y: 206, width: 98, height: 58 },
    { id: "B-B6", x: 976, y: 206, width: 88, height: 58 },

    { id: "C-B1", x: 146, y: 446, width: 68, height: 68 },
    { id: "C-B2", x: 246, y: 446, width: 118, height: 68 },
    { id: "C-B3", x: 396, y: 446, width: 78, height: 68 },
    { id: "C-B4", x: 276, y: 546, width: 88, height: 68 },
    { id: "C-B5", x: 396, y: 546, width: 78, height: 68 },

    { id: "D-B1", x: 726, y: 446, width: 88, height: 68 },
    { id: "D-B2", x: 846, y: 446, width: 98, height: 68 },
    { id: "D-B3", x: 976, y: 446, width: 88, height: 68 },
    { id: "D-B4", x: 726, y: 546, width: 88, height: 78 },
    { id: "D-B5", x: 846, y: 546, width: 98, height: 78 },
  ],

  // Green spaces & ponds
  parks: [
    { id: "PARK-A", x: 60, y: 90, width: 56, height: 180, label: "Riverview Park" },
    { id: "POND-A", x: 68, y: 160, width: 40, height: 50, rx: 18, type: "water" },
    { id: "PARK-B", x: 1096, y: 90, width: 50, height: 180, label: "East Gardens" },
    { id: "PARK-C", x: 388, y: 648, width: 88, height: 64, label: "South Green Belt" },
    { id: "PARK-D", x: 724, y: 654, width: 92, height: 58, label: "Harbor Reserve" },
  ],

  // Synthetic Street Traffic
  trafficVehicles: [
    { x: 230, y: 334, width: 14, height: 8, color: "#f8fafc", angle: 0 },
    { x: 380, y: 346, width: 14, height: 8, color: "#facc15", angle: 180 },
    { x: 860, y: 334, width: 14, height: 8, color: "#38bdf8", angle: 0 },
    { x: 1020, y: 346, width: 14, height: 8, color: "#ef4444", angle: 180 },
    { x: 490, y: 220, width: 8, height: 14, color: "#f8fafc", angle: 90 },
    { x: 710, y: 250, width: 8, height: 14, color: "#facc15", angle: 270 },
  ],

  // Exactly 3 vehicles: BIKE, VAN, TRUCK
  vehicles: [
    {
      id: "V-01",
      label: "V1 Courier Bike",
      driver: "Aarav (Rider)",
      type: "BIKE",
      clusterId: "CL-A",
      color: "#22c55e",
      accentColor: "#86efac",
      startNodeId: "HUB_WH",
    },
    {
      id: "V-02",
      label: "V2 Delivery Van",
      driver: "Meera (Driver)",
      type: "VAN",
      clusterId: "CL-C",
      color: "#3b82f6",
      accentColor: "#93c5fd",
      startNodeId: "HUB_WH",
    },
    {
      id: "V-03",
      label: "V3 Heavy Truck",
      driver: "Isha (Driver)",
      type: "TRUCK",
      clusterId: "CL-B",
      color: "#ef4444",
      accentColor: "#fca5a5",
      startNodeId: "HUB_WH",
    },
  ],

  // Exactly 7 strategic deliveries across the city
  deliveries: [
    { id: "DEL-01", destination: "A_R1_C2", locationId: "LOC-A1", weight: 8, priority: "CRITICAL", title: "Emergency Blood Units", recipient: "Green Clinic (Cluster A)" },
    { id: "DEL-02", destination: "B_R2_C3", locationId: "LOC-B_STORE", weight: 85, priority: "CRITICAL", title: "Medical Oxygen Cylinders", recipient: "East Mart (Cluster B)" },
    { id: "DEL-03", destination: "D_R1_C2", locationId: "LOC-D1", weight: 14, priority: "HIGH", title: "Emergency Power Generators", recipient: "Southeast Shelter (Cluster D)" },
    { id: "DEL-04", destination: "C_R2_C2", locationId: "LOC-C_STORE", weight: 45, priority: "HIGH", title: "Water Purification Units", recipient: "Metro Mart SW (Cluster C)" },
    { id: "DEL-05", destination: "B_R1_C4", locationId: "LOC-B2", weight: 60, priority: "HIGH", title: "Rescue Gear Kits", recipient: "Block 12 Residences (Cluster B)" },
    { id: "DEL-06", destination: "A_R3_C3", locationId: "LOC-A5", weight: 12, priority: "NORMAL", title: "First Aid Rations", recipient: "Parkside Residences (Cluster A)" },
    { id: "DEL-07", destination: "C_R1_C4", locationId: "LOC-C2", weight: 20, priority: "NORMAL", title: "Comms Satellite Terminals", recipient: "Riverview Homes C (Cluster C)" },
  ],
};
