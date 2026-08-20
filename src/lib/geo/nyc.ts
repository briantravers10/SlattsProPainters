import type { Borough } from "@/lib/types";

export interface NeighborhoodDef {
  name: string;
  borough: Borough;
  lat: number;
  lng: number;
  /** Relative property-value multiplier used by the synthetic data generator. */
  valueTier: number;
  /** Dominant housing stock, drives property type selection. */
  stock: "brownstone" | "detached" | "highrise" | "mixed" | "rowhouse";
  /**
   * ZIP codes covering this neighborhood.
   *
   * NYC ZIPs do NOT nest inside neighborhoods — a neighborhood commonly spans
   * several ZIPs and a ZIP routinely straddles neighborhood boundaries. These
   * lists therefore overlap on purpose, and ZIP is treated as an independent
   * filter rather than a child of borough → neighborhood. In production the
   * ZIP comes off the property record itself, never derived from this table.
   */
  zips: string[];
}

export const NEIGHBORHOODS: NeighborhoodDef[] = [
  // Manhattan
  { name: "Upper East Side", borough: "Manhattan", lat: 40.7736, lng: -73.9566, valueTier: 2.3, stock: "highrise", zips: ["10021", "10028", "10065", "10075", "10128"] },
  { name: "Upper West Side", borough: "Manhattan", lat: 40.7870, lng: -73.9754, valueTier: 2.2, stock: "highrise", zips: ["10023", "10024", "10025", "10069"] },
  { name: "Harlem", borough: "Manhattan", lat: 40.8116, lng: -73.9465, valueTier: 1.3, stock: "brownstone", zips: ["10026", "10027", "10030", "10037", "10039"] },
  { name: "Chelsea", borough: "Manhattan", lat: 40.7465, lng: -74.0014, valueTier: 2.4, stock: "highrise", zips: ["10001", "10011"] },
  { name: "Tribeca", borough: "Manhattan", lat: 40.7163, lng: -74.0086, valueTier: 3.1, stock: "highrise", zips: ["10007", "10013"] },
  { name: "East Village", borough: "Manhattan", lat: 40.7265, lng: -73.9815, valueTier: 1.8, stock: "mixed", zips: ["10003", "10009"] },
  { name: "Washington Heights", borough: "Manhattan", lat: 40.8417, lng: -73.9394, valueTier: 1.0, stock: "mixed", zips: ["10032", "10033", "10040"] },
  { name: "Murray Hill", borough: "Manhattan", lat: 40.7479, lng: -73.9756, valueTier: 2.0, stock: "highrise", zips: ["10016", "10017"] },
  { name: "Inwood", borough: "Manhattan", lat: 40.8677, lng: -73.9212, valueTier: 0.9, stock: "mixed", zips: ["10034"] },
  { name: "Financial District", borough: "Manhattan", lat: 40.7075, lng: -74.0113, valueTier: 2.2, stock: "highrise", zips: ["10004", "10005", "10006", "10038", "10280"] },

  // Brooklyn
  { name: "Park Slope", borough: "Brooklyn", lat: 40.6710, lng: -73.9814, valueTier: 2.1, stock: "brownstone", zips: ["11215", "11217", "11238"] },
  { name: "Williamsburg", borough: "Brooklyn", lat: 40.7081, lng: -73.9571, valueTier: 1.9, stock: "mixed", zips: ["11211", "11249"] },
  { name: "Bay Ridge", borough: "Brooklyn", lat: 40.6262, lng: -74.0299, valueTier: 1.3, stock: "rowhouse", zips: ["11209", "11220"] },
  { name: "Bushwick", borough: "Brooklyn", lat: 40.6944, lng: -73.9213, valueTier: 1.1, stock: "rowhouse", zips: ["11206", "11207", "11221", "11237"] },
  { name: "Crown Heights", borough: "Brooklyn", lat: 40.6694, lng: -73.9442, valueTier: 1.2, stock: "brownstone", zips: ["11213", "11216", "11225", "11233"] },
  { name: "Bedford-Stuyvesant", borough: "Brooklyn", lat: 40.6872, lng: -73.9418, valueTier: 1.4, stock: "brownstone", zips: ["11205", "11206", "11216", "11221", "11233"] },
  { name: "Greenpoint", borough: "Brooklyn", lat: 40.7304, lng: -73.9540, valueTier: 1.7, stock: "rowhouse", zips: ["11222"] },
  { name: "Sunset Park", borough: "Brooklyn", lat: 40.6454, lng: -74.0122, valueTier: 1.1, stock: "rowhouse", zips: ["11220", "11232"] },
  { name: "Flatbush", borough: "Brooklyn", lat: 40.6409, lng: -73.9624, valueTier: 1.0, stock: "detached", zips: ["11210", "11226", "11230"] },
  { name: "Canarsie", borough: "Brooklyn", lat: 40.6404, lng: -73.9010, valueTier: 0.9, stock: "detached", zips: ["11236"] },
  { name: "Brooklyn Heights", borough: "Brooklyn", lat: 40.6959, lng: -73.9932, valueTier: 2.6, stock: "brownstone", zips: ["11201"] },
  { name: "Dyker Heights", borough: "Brooklyn", lat: 40.6190, lng: -74.0128, valueTier: 1.5, stock: "detached", zips: ["11219", "11228"] },

  // Queens
  { name: "Astoria", borough: "Queens", lat: 40.7644, lng: -73.9235, valueTier: 1.3, stock: "mixed", zips: ["11102", "11103", "11105", "11106"] },
  { name: "Long Island City", borough: "Queens", lat: 40.7447, lng: -73.9485, valueTier: 1.7, stock: "highrise", zips: ["11101", "11109"] },
  { name: "Forest Hills", borough: "Queens", lat: 40.7196, lng: -73.8448, valueTier: 1.6, stock: "detached", zips: ["11375"] },
  { name: "Flushing", borough: "Queens", lat: 40.7674, lng: -73.8331, valueTier: 1.2, stock: "mixed", zips: ["11354", "11355", "11358"] },
  { name: "Jackson Heights", borough: "Queens", lat: 40.7557, lng: -73.8831, valueTier: 1.1, stock: "mixed", zips: ["11372"] },
  { name: "Ridgewood", borough: "Queens", lat: 40.7003, lng: -73.9060, valueTier: 1.1, stock: "rowhouse", zips: ["11385"] },
  { name: "Bayside", borough: "Queens", lat: 40.7685, lng: -73.7715, valueTier: 1.5, stock: "detached", zips: ["11360", "11361", "11364"] },
  { name: "Jamaica", borough: "Queens", lat: 40.7020, lng: -73.7889, valueTier: 0.9, stock: "mixed", zips: ["11432", "11433", "11434", "11435", "11436"] },
  { name: "Sunnyside", borough: "Queens", lat: 40.7433, lng: -73.9196, valueTier: 1.2, stock: "rowhouse", zips: ["11104"] },
  { name: "Whitestone", borough: "Queens", lat: 40.7920, lng: -73.8095, valueTier: 1.4, stock: "detached", zips: ["11357"] },
  { name: "Woodside", borough: "Queens", lat: 40.7454, lng: -73.9062, valueTier: 1.1, stock: "rowhouse", zips: ["11377"] },
  { name: "Rockaway Park", borough: "Queens", lat: 40.5795, lng: -73.8365, valueTier: 1.0, stock: "detached", zips: ["11694"] },

  // The Bronx
  { name: "Riverdale", borough: "The Bronx", lat: 40.8900, lng: -73.9124, valueTier: 1.6, stock: "detached", zips: ["10463", "10471"] },
  { name: "Throgs Neck", borough: "The Bronx", lat: 40.8180, lng: -73.8210, valueTier: 1.1, stock: "detached", zips: ["10465"] },
  { name: "Pelham Bay", borough: "The Bronx", lat: 40.8501, lng: -73.8329, valueTier: 1.1, stock: "detached", zips: ["10461"] },
  { name: "Fordham", borough: "The Bronx", lat: 40.8620, lng: -73.9010, valueTier: 0.8, stock: "mixed", zips: ["10458", "10468"] },
  { name: "Mott Haven", borough: "The Bronx", lat: 40.8091, lng: -73.9229, valueTier: 0.9, stock: "mixed", zips: ["10451", "10454", "10455"] },
  { name: "Morris Park", borough: "The Bronx", lat: 40.8540, lng: -73.8560, valueTier: 1.0, stock: "detached", zips: ["10461", "10462"] },
  { name: "Country Club", borough: "The Bronx", lat: 40.8420, lng: -73.8110, valueTier: 1.3, stock: "detached", zips: ["10465"] },
  { name: "Kingsbridge", borough: "The Bronx", lat: 40.8790, lng: -73.9050, valueTier: 0.9, stock: "mixed", zips: ["10463"] },
  { name: "City Island", borough: "The Bronx", lat: 40.8466, lng: -73.7873, valueTier: 1.2, stock: "detached", zips: ["10464"] },

  // Staten Island
  { name: "St. George", borough: "Staten Island", lat: 40.6437, lng: -74.0765, valueTier: 1.0, stock: "mixed", zips: ["10301"] },
  { name: "Tottenville", borough: "Staten Island", lat: 40.5122, lng: -74.2454, valueTier: 1.1, stock: "detached", zips: ["10307"] },
  { name: "Great Kills", borough: "Staten Island", lat: 40.5543, lng: -74.1516, valueTier: 1.1, stock: "detached", zips: ["10308"] },
  { name: "New Dorp", borough: "Staten Island", lat: 40.5735, lng: -74.1170, valueTier: 1.0, stock: "detached", zips: ["10306"] },
  { name: "Todt Hill", borough: "Staten Island", lat: 40.5975, lng: -74.1015, valueTier: 2.0, stock: "detached", zips: ["10304", "10314"] },
  { name: "West Brighton", borough: "Staten Island", lat: 40.6300, lng: -74.1080, valueTier: 0.9, stock: "detached", zips: ["10310"] },
  { name: "Annadale", borough: "Staten Island", lat: 40.5405, lng: -74.1783, valueTier: 1.2, stock: "detached", zips: ["10312"] },
  { name: "Bulls Head", borough: "Staten Island", lat: 40.6070, lng: -74.1600, valueTier: 1.0, stock: "detached", zips: ["10314"] },
];

export function neighborhoodsIn(borough: Borough) {
  return NEIGHBORHOODS.filter((n) => n.borough === borough);
}

export const BOROUGH_COLORS: Record<Borough, string> = {
  Manhattan: "#6366f1",
  Brooklyn: "#0ea5e9",
  Queens: "#14b8a6",
  "The Bronx": "#f59e0b",
  "Staten Island": "#ec4899",
};

/**
 * Rough, stylised borough outlines in [lng, lat].
 * These are deliberately simplified — enough to render a recognisable
 * territory map without pulling in a mapping library or tile provider.
 */
export const BOROUGH_SHAPES: Record<Borough, [number, number][]> = {
  Manhattan: [
    [-74.017, 40.705], [-74.013, 40.7], [-73.998, 40.708], [-73.978, 40.725],
    [-73.972, 40.737], [-73.962, 40.756], [-73.941, 40.775], [-73.934, 40.796],
    [-73.928, 40.81], [-73.91, 40.834], [-73.907, 40.855], [-73.92, 40.872],
    [-73.933, 40.878], [-73.946, 40.867], [-73.95, 40.853], [-73.956, 40.838],
    [-73.965, 40.82], [-73.975, 40.8], [-73.985, 40.775], [-73.995, 40.756],
    [-74.008, 40.735], [-74.017, 40.72],
  ],
  Brooklyn: [
    [-73.998, 40.7], [-73.978, 40.704], [-73.963, 40.722], [-73.949, 40.741],
    [-73.936, 40.729], [-73.918, 40.714], [-73.898, 40.702], [-73.881, 40.687],
    [-73.868, 40.665],
    [-73.868, 40.638], [-73.895, 40.615], [-73.925, 40.59], [-73.96, 40.575],
    [-74.0, 40.58], [-74.028, 40.6], [-74.042, 40.63], [-74.03, 40.655],
    [-74.015, 40.68],
  ],
  Queens: [
    [-73.962, 40.743], [-73.932, 40.781], [-73.9, 40.795], [-73.855, 40.8],
    [-73.82, 40.795], [-73.79, 40.79], [-73.76, 40.78], [-73.735, 40.76],
    [-73.705, 40.745], [-73.7, 40.72], [-73.72, 40.7], [-73.745, 40.68],
    [-73.76, 40.65], [-73.79, 40.61], [-73.822, 40.588], [-73.85, 40.583],
    [-73.862, 40.6], [-73.852, 40.64], [-73.855, 40.672], [-73.872, 40.694],
    [-73.895, 40.712], [-73.928, 40.726],
  ],
  "The Bronx": [
    [-73.933, 40.878], [-73.92, 40.895], [-73.91, 40.912], [-73.89, 40.915],
    [-73.865, 40.905], [-73.84, 40.895], [-73.815, 40.89], [-73.79, 40.88],
    [-73.77, 40.87], [-73.765, 40.85], [-73.785, 40.83], [-73.805, 40.815],
    [-73.825, 40.805], [-73.85, 40.8], [-73.88, 40.795], [-73.9, 40.8],
    [-73.912, 40.815], [-73.92, 40.84], [-73.925, 40.86],
  ],
  "Staten Island": [
    [-74.052, 40.65], [-74.07, 40.645], [-74.09, 40.648], [-74.115, 40.64],
    [-74.14, 40.63], [-74.165, 40.62], [-74.19, 40.605], [-74.21, 40.59],
    [-74.23, 40.57], [-74.25, 40.545], [-74.255, 40.52], [-74.24, 40.5],
    [-74.215, 40.495], [-74.19, 40.51], [-74.165, 40.53], [-74.14, 40.55],
    [-74.11, 40.57], [-74.085, 40.59], [-74.062, 40.61], [-74.05, 40.63],
  ],
};

/** Bounding box covering all five boroughs. */
export const NYC_BOUNDS = {
  minLng: -74.27,
  maxLng: -73.69,
  minLat: 40.49,
  maxLat: 40.925,
};

/** Equirectangular projection into a unit box (0-1), y flipped for SVG. */
export function project(lng: number, lat: number) {
  const { minLng, maxLng, minLat, maxLat } = NYC_BOUNDS;
  return {
    x: (lng - minLng) / (maxLng - minLng),
    y: 1 - (lat - minLat) / (maxLat - minLat),
  };
}

export const BOROUGH_LABEL_POINTS: Record<Borough, [number, number]> = {
  Manhattan: [-73.995, 40.755],
  Brooklyn: [-73.955, 40.645],
  Queens: [-73.82, 40.705],
  "The Bronx": [-73.858, 40.868],
  "Staten Island": [-74.155, 40.575],
};


/**
 * Shrinks a borough outline very slightly toward its own centroid. Neighbouring
 * boroughs then render with a hairline of background between them, which reads
 * as five distinct territories rather than one merged shape.
 */
export function insetShape(points: [number, number][], factor = 0.985): [number, number][] {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return points.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor]);
}


/** Every ZIP in the service territory, sorted, de-duplicated. */
export const ALL_ZIPS: string[] = [
  ...new Set(NEIGHBORHOODS.flatMap((n) => n.zips)),
].sort();

/** ZIPs grouped by borough, for the filter UI. */
export function zipsByBorough(borough?: Borough): string[] {
  const pool = borough ? NEIGHBORHOODS.filter((n) => n.borough === borough) : NEIGHBORHOODS;
  return [...new Set(pool.flatMap((n) => n.zips))].sort();
}

/** Which boroughs a ZIP touches — several straddle a borough line. */
export function boroughsForZip(zip: string): Borough[] {
  return [...new Set(NEIGHBORHOODS.filter((n) => n.zips.includes(zip)).map((n) => n.borough))];
}
