/**
 * Synthetic name pools.
 *
 * Street names, owner names and business names below are invented for the
 * demo. They are intentionally *not* real NYC streets, real property owners
 * or real businesses — nothing here identifies a private individual.
 * Borough and neighborhood names are real public geographic labels.
 */

export const DEMO_STREETS = [
  "Kesterfield Avenue", "Bramblewood Street", "Halvorsen Place", "Ardmore Row",
  "Wexley Terrace", "Pemberton Lane", "Crestmere Street", "Dunhaven Avenue",
  "Tolliver Court", "Marchfield Road", "Ellendale Street", "Quarry Bend",
  "Rosslyn Walk", "Havenbrook Avenue", "Sturgis Place", "Clarendale Street",
  "Windermoor Road", "Ashcombe Avenue", "Fennimore Street", "Lindgate Place",
  "Ravensworth Road", "Millbrace Avenue", "Oakhaven Street", "Draycott Lane",
  "Thornbury Place", "Selwyn Avenue", "Bexhill Street", "Norhaven Road",
  "Carrowmore Avenue", "Ivyglen Street", "Barrowfield Road", "Penhurst Place",
  "Stonefall Avenue", "Wrenfield Street", "Colbourne Road", "Aldergate Avenue",
  "Merribrook Lane", "Tanglewick Street", "Fairmount Row", "Hollowmead Avenue",
];

export const DEMO_SURNAMES = [
  "Alvarro", "Benniston", "Corvale", "Delmarr", "Estevane", "Fennwick",
  "Granholm", "Harrowgate", "Ilverson", "Jasperly", "Kaldwell", "Lorimere",
  "Marchetta", "Nordhaven", "Ostrander", "Pellingham", "Quillory", "Ravensby",
  "Sandoval-Rhee", "Thackery", "Underhale", "Vandermoor", "Westbourne",
  "Yarrowmere", "Zelnick", "Bellacourt", "Cardovan", "Dunmoray",
];

export const DEMO_FIRST_NAMES = [
  "A.", "B.", "C.", "D.", "E.", "F.", "G.", "H.", "J.", "K.", "L.", "M.",
  "N.", "P.", "R.", "S.", "T.", "V.",
];

export const DEMO_CONTACT_FIRST = [
  "Alexis", "Bennett", "Camille", "Devin", "Elena", "Franklin", "Georgia",
  "Hector", "Imani", "Jordan", "Kiera", "Lucien", "Mara", "Nolan", "Oriana",
  "Priya", "Quentin", "Rosalind", "Soren", "Tamsin", "Ulises", "Vera",
];

export const LLC_PREFIXES = [
  "Harborline", "Stonecourt", "Westmark", "Ridgepoint", "Blue Anchor",
  "Chandler Gate", "Northaven", "Silverbrook", "Kingsfold", "Ember Row",
  "Foxglove", "Grandview Bay", "Lantern Hill", "Merchant Row", "Copperfield",
  "Braddock", "Trellis Park", "Ashfield", "Coventry Row", "Marlowe Bay",
];

export const LLC_SUFFIXES = [
  "Holdings LLC", "Property Group LLC", "Realty Holdings LLC", "Equities LLC",
  "Estates LLC", "Capital Partners LLC", "Residential LLC", "Asset Co. LLC",
];

export const PM_NAMES = [
  "Harborline Residential Management", "Stonecourt Property Partners",
  "Westmark Building Services", "Ridgepoint Asset Management",
  "Blue Anchor Property Group", "Chandler Gate Management",
  "Northaven Residential", "Silverbrook Property Co.",
  "Kingsfold Management Group", "Ember Row Property Services",
  "Foxglove Building Management", "Grandview Bay Residential",
  "Lantern Hill Property Group", "Merchant Row Management",
  "Copperfield Residential Services",
];

export const REALTY_NAMES = [
  "Bridgeway Realty Collective", "Cobblestone Property Advisors",
  "Marlowe & Finch Real Estate", "Trellis Park Realty",
  "Ashfield Residential Brokerage", "Coventry Row Real Estate",
  "Beacon & Vine Realty Group", "Halyard Real Estate Partners",
  "Sparrow Lane Realty", "Quayside Property Advisors",
  "Whitfield & Marr Brokerage", "Rowan Court Realty",
  "Anchorage Home Group", "Fairstead Realty Partners",
  "Lattice & Co. Real Estate",
];

export const GC_NAMES = [
  "Braddock Construction Group", "Ironvale Builders",
  "Kestrel General Contracting", "Meridian Line Construction",
  "Northgate Build Co.", "Palisade Construction Partners",
  "Redstone Contracting", "Summit Row Builders",
  "Tidewater General Contracting", "Vanguard Build Group",
];

export const OTHER_PARTNER_NAMES: Record<string, string[]> = {
  "Interior Designer": ["Juniper & Slate Interiors", "Foxfield Design Studio"],
  Architect: ["Clairmont Architecture Studio", "Northline Architects"],
  "Flooring Company": ["Timberline Floor Co.", "Grainhouse Flooring"],
  "Drywall Contractor": ["Levelset Drywall Partners", "Chalkline Wall Systems"],
  "Restoration Company": ["Rapid Response Restoration Co.", "Driftwood Restoration Group"],
  "Building Maintenance": ["Sentry Building Maintenance", "Clearpath Facility Services"],
  Landlord: ["Cobble & Kane Holdings", "Rowanwood Rentals"],
  "Condo / Co-op Management": ["Beaumont Co-op Advisors", "Sterling Court Board Services"],
  "Building Manager": ["Ashgrove Tower Management", "Pinnacle House Management"],
};

export const CUSTOMER_NAMES = [
  "The Delmarr Residence", "Bramblewood Co-op Board", "Harborline Unit 4B Turnover",
  "The Fennwick Residence", "Wexley Terrace Duplex", "Ardmore Row Brownstone",
  "Crestmere Two-Family", "The Ostrander Residence", "Quarry Bend Townhouse",
  "Havenbrook Rental Portfolio", "The Marchetta Residence", "Sturgis Place Condo",
];

export const NOTE_SNIPPETS = [
  "Left in the weekly territory review — worth a second look after the seasonal exterior window opens.",
  "Owner profile suggests a design-conscious buyer; lead with finish quality rather than price.",
  "Block already has two completed jobs — strong neighbor-campaign candidate.",
  "Permit filing suggests a general contractor is already engaged; approach the GC rather than the owner.",
  "Building has restricted lobby access — door canvassing is not viable here.",
  "Flagged by the Compliance Agent: no verified contact permission on file yet.",
  "High-value exterior scope; recommend a scaffold-access site visit before quoting.",
  "Multi-unit turnover cadence looks quarterly — good candidate for a standing rate card.",
  "Discovered through a public permit filing; no owner contact details have been collected.",
  "Second attempt scheduled — first mailer went out with the neighborhood drop.",
];
