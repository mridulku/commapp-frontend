/* 24 demo concepts — 8 per subject
   ────────────────────────────────
   Replace / extend with your real data later.
   Every object has:
     • id         unique slug
     • subject    "Physics" | "Chemistry" | "Biology"
     • unit       NCERT unit / broad theme
     • chapter    textbook chapter   (2-level breadcrumb)
     • subChap    sub-chapter / topic (3-level breadcrumb)
     • name       human-readable concept name
     • weight     0-10     ← exam importance
     • mastery    0-100 %  ← learner’s current mastery
*/

export const conceptCatalog = [
  /* ──────────── PHYSICS ──────────── */
  {
    id: "phy_optics_refraction_basics",
    subject: "Physics",
    unit: "Optics",
    chapter: "Ray Optics",
    subChap: "Refraction",
    name: "Snell’s law & refractive index",
    weight: 8,
    mastery: 42
  },
  {
    id: "phy_optics_total_internal",
    subject: "Physics",
    unit: "Optics",
    chapter: "Ray Optics",
    subChap: "T.I.R.",
    name: "Critical angle & total internal reflection",
    weight: 7,
    mastery: 55
  },
  {
    id: "phy_mech_laws_motion",
    subject: "Physics",
    unit: "Mechanics",
    chapter: "Laws of Motion",
    subChap: "Friction",
    name: "Static / kinetic friction & angle of repose",
    weight: 6,
    mastery: 68
  },
  {
    id: "phy_mech_work_energy",
    subject: "Physics",
    unit: "Mechanics",
    chapter: "Work, Energy & Power",
    subChap: "Work–energy theorem",
    name: "Conservative vs non-conservative forces",
    weight: 5,
    mastery: 80
  },
  {
    id: "phy_thermo_heat_transfer",
    subject: "Physics",
    unit: "Thermal Physics",
    chapter: "Heat Transfer",
    subChap: "Conduction",
    name: "Thermal conductivity & Newton’s cooling",
    weight: 4,
    mastery: 30
  },
  {
    id: "phy_modern_photoelectric",
    subject: "Physics",
    unit: "Modern Physics",
    chapter: "Dual Nature",
    subChap: "Photoelectric effect",
    name: "Einstein’s photoelectric equation",
    weight: 9,
    mastery: 25
  },
  {
    id: "phy_elec_capacitors",
    subject: "Physics",
    unit: "Electrostatics",
    chapter: "Capacitance",
    subChap: "Parallel-plate",
    name: "Energy stored in a capacitor",
    weight: 6,
    mastery: 73
  },
  {
    id: "phy_magnetism_biot_savart",
    subject: "Physics",
    unit: "Magnetism",
    chapter: "Magnetic Field",
    subChap: "Biot–Savart law",
    name: "Field on axis of a circular loop",
    weight: 5,
    mastery: 48
  },

  /* ─────────── CHEMISTRY ─────────── */
  {
    id: "chem_stoich_limiting",
    subject: "Chemistry",
    unit: "Basic Concepts",
    chapter: "Stoichiometry",
    subChap: "Limiting reagent",
    name: "Limiting / excess reagent",
    weight: 7,
    mastery: 76
  },
  {
    id: "chem_equil_ionic_product",
    subject: "Chemistry",
    unit: "Equilibrium",
    chapter: "Ionic Equilibrium",
    subChap: "Solubility product",
    name: "Ksp & common-ion effect",
    weight: 6,
    mastery: 65
  },
  {
    id: "chem_thermo_enthalpy",
    subject: "Chemistry",
    unit: "Thermodynamics",
    chapter: "Enthalpy",
    subChap: "Hess’s law",
    name: "Bond enthalpy & Hess’s cycles",
    weight: 5,
    mastery: 50
  },
  {
    id: "chem_organic_sn1sn2",
    subject: "Chemistry",
    unit: "Organic Chemistry",
    chapter: "Halogenoalkanes",
    subChap: "Reaction mechanism",
    name: "SN1 vs SN2 kinetics & stereochemistry",
    weight: 8,
    mastery: 41
  },
  {
    id: "chem_inorg_pblock_nitrogen",
    subject: "Chemistry",
    unit: "Inorganic Chemistry",
    chapter: "P-Block",
    subChap: "Nitrogen family",
    name: "Anomalous behaviour of nitrogen",
    weight: 4,
    mastery: 60
  },
  {
    id: "chem_electro_nernst",
    subject: "Chemistry",
    unit: "Electrochemistry",
    chapter: "Electrochemical Cells",
    subChap: "Nernst equation",
    name: "Cell EMF & concentration cells",
    weight: 7,
    mastery: 33
  },
  {
    id: "chem_surface_adsorption",
    subject: "Chemistry",
    unit: "Surface Chemistry",
    chapter: "Adsorption",
    subChap: "Freundlich isotherm",
    name: "Types of adsorption & catalysts",
    weight: 3,
    mastery: 54
  },
  {
    id: "chem_kinetics_rate_laws",
    subject: "Chemistry",
    unit: "Chemical Kinetics",
    chapter: "Rate Laws",
    subChap: "First order",
    name: "Half-life & Arrhenius equation",
    weight: 6,
    mastery: 47
  },

  /* ──────────── BIOLOGY ──────────── */
  {
    id: "bio_cell_totipotency",
    subject: "Biology",
    unit: "Cell Biology",
    chapter: "Plant Tissue Culture",
    subChap: "Totipotency",
    name: "Totipotency & regeneration",
    weight: 5,
    mastery: 61
  },
  {
    id: "bio_genetics_mendel",
    subject: "Biology",
    unit: "Genetics",
    chapter: "Mendelian Genetics",
    subChap: "Monohybrid cross",
    name: "Law of segregation & dominance",
    weight: 7,
    mastery: 70
  },
  {
    id: "bio_human_physio_neuron",
    subject: "Biology",
    unit: "Human Physiology",
    chapter: "Neural Control",
    subChap: "Neuron",
    name: "Resting membrane potential",
    weight: 6,
    mastery: 52
  },
  {
    id: "bio_ecology_biodiversity",
    subject: "Biology",
    unit: "Ecology",
    chapter: "Biodiversity",
    subChap: "Species richness",
    name: "Latitudinal gradients in diversity",
    weight: 4,
    mastery: 45
  },
  {
    id: "bio_biotech_pcr",
    subject: "Biology",
    unit: "Biotechnology",
    chapter: "PCR & Blotting",
    subChap: "Polymerase Chain Reaction",
    name: "PCR steps & Taq polymerase",
    weight: 8,
    mastery: 38
  },
  {
    id: "bio_botany_photosynthesis",
    subject: "Biology",
    unit: "Plant Physiology",
    chapter: "Photosynthesis",
    subChap: "Calvin cycle",
    name: "C3, C4 & CAM pathways",
    weight: 6,
    mastery: 66
  },
  {
    id: "bio_zoology_immune",
    subject: "Biology",
    unit: "Human Health",
    chapter: "Immune System",
    subChap: "Antibodies",
    name: "Structure & classes of antibodies",
    weight: 5,
    mastery: 58
  },
  {
    id: "bio_microbiology_virus",
    subject: "Biology",
    unit: "Microbiology",
    chapter: "Viruses",
    subChap: "Lytic vs lysogenic",
    name: "HIV life cycle & retroviruses",
    weight: 7,
    mastery: 49
  }
];