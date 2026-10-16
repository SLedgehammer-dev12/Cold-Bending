/**
 * ColdBend Pro - Pipeline Cold Field Bend Engineering Engine
 * Compliant with ASME B31.8 (Sec. 841.2.3), ASME B31.4 (Sec. 406.2.1) & Employer Standards
 */

// Single source of truth for the app version
// (must match UI badge, package.json, electron shell, release tag).
const APP_VERSION = '2.6.3';
const UPDATE_API_URL = 'https://api.github.com/repos/SLedgehammer-dev12/Cold-Bending/releases/latest';
const UPDATE_CACHE_KEY = 'coldbend_update_cache';
const UPDATE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // silent auto-check at most once a day

// Global state and calculation parameters
const state = {
  standard: 'BOTAS_SPEC',
  od: 914.4,             // Pipe Outer Diameter in mm (default 36")
  npsLabel: 'NPS 36"',
  t_nom: 14.3,           // Nominal wall thickness in mm
  ca: 1.0,               // Corrosion allowance in mm
  length: 12.0,          // User defined total pipe length in meters
  tangent1: 1.8,         // Front tangent straight length in meters
  tangent2: 1.8,         // Rear tangent straight length in meters
  smys: 485,             // Yield strength in MPa (API 5L X70)
  gradeName: 'API 5L X70',
  seamType: 'SAWH',      // SAWH, SAWL, SMLS
  seamAngle: 0,          // Angle from neutral axis (-90 to +90 deg)
  targetAngle: 10.0,     // Route deflection target angle in degrees
  manualPulls: null,     // Manual pull count override (2-60); null = automatic
  radiusMultiplier: 40,  // Bend radius multiplier (R = k * D)
  designPressure: 75.0,  // Bar
  designFactor: 0.72,    // Class 1 / ASME
  designTemp: 20.0,      // Design Operating Temperature in Celsius (-20 to +250 °C)
  useMandrel: true,      // Internal hydraulic mandrel active
  girthWeldInBend: false,// Circumferential weld in bend section (Md. 841.2.3-a-5)
  girthWeldDist: 6.0,    // Distance of girth weld from front of pipe in meters
  showDimensions: true,  // Toggle dimension labels in 2D
  mandrelVisible3D: true,
  seamVisible3D: true,
  
  // Theme & New Features
  theme: localStorage.getItem('coldbend_theme') || ((typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark'),
  bendType: 'overbend',  // overbend, sagbend, sidebend_right, sidebend_left, compound
  compoundHoriAngle: 0,
  compoundVertAngle: 0,
  compoundHoriDir: 'right', // right | left
  compoundVertDir: 'sagbend', // overbend | sagbend
  compoundRollAngle: 0,
  clockPos: '3',         // 3, 9, 12, 6, custom
  
  // Traceability Fields
  projectName: 'Doğal Gaz İletim Hattı - Faz 2',
  lineSection: 'Lot 3 (Büküm Sahası)',
  chainageKP: 'KP 154+280',
  pipeNo: 'P-1284',
  heatNo: 'H-9832A',
  reportNo: 'CFB-2026-0042',

  // As-Built Site Quality Control Fields
  asBuilt: {
    spoolNo: 'SP-01 / B-104',
    measuredAngle: null,
    measuredWT: null,
    measuredOvality: null,
    measuredRipple: 0.0,
    inspector: '',
    date: new Date().toISOString().split('T')[0]
  },

  // Easter Egg: Old-School Tree Bend Mode
  isTreeBendMode: false
};

// DOM Element References
const dom = {
  // Theme Toggle Elements
  btnToggleTheme: document.getElementById('btnToggleTheme'),
  themeIcon: document.getElementById('themeIcon'),
  themeLabel: document.getElementById('themeLabel'),

  selPreset: document.getElementById('selPreset'),
  selStandard: document.getElementById('selStandard'),
  standardDisplayBadge: document.getElementById('standardDisplayBadge'),
  selNPS: document.getElementById('selNPS'),
  groupCustomOD: document.getElementById('groupCustomOD'),
  inpCustomOD: document.getElementById('inpCustomOD'),
  inpWallThk: document.getElementById('inpWallThk'),
  inpCorrosion: document.getElementById('inpCorrosion'),
  inpPipeLength: document.getElementById('inpPipeLength'),
  rngPipeLength: document.getElementById('rngPipeLength'),
  badgePipeWeightUnit: document.getElementById('badgePipeWeightUnit'),
  valTotalPipeWeight: document.getElementById('valTotalPipeWeight'),
  valRiggingSlingLoad: document.getElementById('valRiggingSlingLoad'),
  selGrade: document.getElementById('selGrade'),
  
  // Seam & Clock Position
  selSeamType: document.getElementById('selSeamType'),
  selClockPos: document.getElementById('selClockPos'),
  groupCustomSeamAngle: document.getElementById('groupCustomSeamAngle'),
  inpSeamAngle: document.getElementById('inpSeamAngle'),
  clockSafetyBox: document.getElementById('clockSafetyBox'),
  badgeClockSafety: document.getElementById('badgeClockSafety'),
  lblClockDeg: document.getElementById('lblClockDeg'),
  clockSafetyText: document.getElementById('clockSafetyText'),

  // Route & Bend Type
  selBendType: document.getElementById('selBendType'),
  compoundActiveInfo: document.getElementById('compoundActiveInfo'),
  txtCompoundActiveInfo: document.getElementById('txtCompoundActiveInfo'),
  inpTargetAngle: document.getElementById('inpTargetAngle'),
  rngTargetAngle: document.getElementById('rngTargetAngle'),
  btnOpenSlopeCalc: document.getElementById('btnOpenSlopeCalc'),
  badgeMaxAngleInfo: document.getElementById('badgeMaxAngleInfo'),
  slopeModal: document.getElementById('slopeModal'),
  btnCloseSlopeModal: document.getElementById('btnCloseSlopeModal'),
  btnCloseSlopeModalX: document.getElementById('btnCloseSlopeModalX'),
  tabSlopePercent: document.getElementById('tabSlopePercent'),
  tabSlopeElevation: document.getElementById('tabSlopeElevation'),
  panelSlopePercent: document.getElementById('panelSlopePercent'),
  panelSlopeElevation: document.getElementById('panelSlopeElevation'),
  inpSlope1: document.getElementById('inpSlope1'),
  inpSlope2: document.getElementById('inpSlope2'),
  selSlopeUnit: document.getElementById('selSlopeUnit'),
  inpElevKp1: document.getElementById('inpElevKp1'),
  inpElevZ1: document.getElementById('inpElevZ1'),
  inpElevKp2: document.getElementById('inpElevKp2'),
  inpElevZ2: document.getElementById('inpElevZ2'),
  inpElevKp3: document.getElementById('inpElevKp3'),
  inpElevZ3: document.getElementById('inpElevZ3'),
  valCalculatedSlopeAngle: document.getElementById('valCalculatedSlopeAngle'),
  badgeCalculatedBendType: document.getElementById('badgeCalculatedBendType'),
  descCalculatedSlope: document.getElementById('descCalculatedSlope'),
  btnApplyCalculatedSlope: document.getElementById('btnApplyCalculatedSlope'),
  btnOpenCompoundCalc: document.getElementById('btnOpenCompoundCalc'),
  compoundModal: document.getElementById('compoundModal'),
  btnCloseCompoundModal: document.getElementById('btnCloseCompoundModal'),
  btnCloseCompoundModalX: document.getElementById('btnCloseCompoundModalX'),
  inpHoriAngle: document.getElementById('inpHoriAngle'),
  selHoriDir: document.getElementById('selHoriDir'),
  inpVertAngle: document.getElementById('inpVertAngle'),
  selVertDir: document.getElementById('selVertDir'),
  compoundResultBox: document.getElementById('compoundResultBox'),
  valCompound3DAngle: document.getElementById('valCompound3DAngle'),
  valCompoundRollAngle: document.getElementById('valCompoundRollAngle'),
  badgeCompoundType: document.getElementById('badgeCompoundType'),
  descCompoundResult: document.getElementById('descCompoundResult'),
  btnApplyCompoundBend: document.getElementById('btnApplyCompoundBend'),
  selRadiusMultiplier: document.getElementById('selRadiusMultiplier'),
  inpCalculatedRadius: document.getElementById('inpCalculatedRadius'),
  inpManualPulls: document.getElementById('inpManualPulls'),
  groupCustomRadius: document.getElementById('groupCustomRadius'),
  inpCustomRadius: document.getElementById('inpCustomRadius'),
  inpTangent1: document.getElementById('inpTangent1'),
  inpTangent2: document.getElementById('inpTangent2'),
  helperTangentClamping: document.getElementById('helperTangentClamping'),
  inpDesignPressure: document.getElementById('inpDesignPressure'),
  selDesignFactor: document.getElementById('selDesignFactor'),
  inpDesignTemp: document.getElementById('inpDesignTemp'),
  badgeTempDerating: document.getElementById('badgeTempDerating'),
  helperTempDerating: document.getElementById('helperTempDerating'),
  chkUseMandrel: document.getElementById('chkUseMandrel'),
  chkGirthWeld: document.getElementById('chkGirthWeld'),
  groupGirthWeldDist: document.getElementById('groupGirthWeldDist'),
  inpGirthWeldDist: document.getElementById('inpGirthWeldDist'),
  girthWeldStatusAlert: document.getElementById('girthWeldStatusAlert'),

  // Traceability Inputs
  inpProjectName: document.getElementById('inpProjectName'),  inpLineSection: document.getElementById('inpLineSection'),
  inpChainageKP: document.getElementById('inpChainageKP'),
  inpPipeNo: document.getElementById('inpPipeNo'),
  inpHeatNo: document.getElementById('inpHeatNo'),
  inpReportNo: document.getElementById('inpReportNo'),
  
  // KPI Elements
  kpiValRmin: document.getElementById('kpiValRmin'),
  kpiBadgeRmin: document.getElementById('kpiBadgeRmin'),
  kpiDescRmin: document.getElementById('kpiDescRmin'),
  
  kpiValThetaMax: document.getElementById('kpiValThetaMax'),
  kpiBadgeTheta: document.getElementById('kpiBadgeTheta'),
  kpiDescTheta: document.getElementById('kpiDescTheta'),
  
  kpiValThinning: document.getElementById('kpiValThinning'),
  kpiBadgeThin: document.getElementById('kpiBadgeThin'),
  kpiDescThin: document.getElementById('kpiDescThin'),
  
  kpiValOvality: document.getElementById('kpiValOvality'),
  kpiBadgeOvality: document.getElementById('kpiBadgeOvality'),
  kpiDescOvality: document.getElementById('kpiDescOvality'),
  
  kpiValMachineAngle: document.getElementById('kpiValMachineAngle'),
  kpiDescSpringback: document.getElementById('kpiDescSpringback'),
  
  // Matrix Elements
  matValTnom: document.getElementById('matValTnom'),
  matValDeltaThin: document.getElementById('matValDeltaThin'),
  matValTextrados: document.getElementById('matValTextrados'),
  matValTminDesign: document.getElementById('matValTminDesign'),
  matValMargin: document.getElementById('matValMargin'),
  badgeThinningMatrix: document.getElementById('badgeThinningMatrix'),
  
  matValOvality: document.getElementById('matValOvality'),
  matValOvalityLimit: document.getElementById('matValOvalityLimit'),
  matValDeltaID: document.getElementById('matValDeltaID'),
  matValDtoT: document.getElementById('matValDtoT'),
  matValMandrelStatus: document.getElementById('matValMandrelStatus'),
  badgeOvalityMatrix: document.getElementById('badgeOvalityMatrix'),
  
  matValSeamAngle: document.getElementById('matValSeamAngle'),
  matValSpringbackAngle: document.getElementById('matValSpringbackAngle'),
  matValMachineAngleSet: document.getElementById('matValMachineAngleSet'),
  matValSeamRisk: document.getElementById('matValSeamRisk'),
  badgeSeamMatrix: document.getElementById('badgeSeamMatrix'),

  // Matrix Card 4: Ripple & Method 2
  matValDeflectionRate: document.getElementById('matValDeflectionRate'),
  matValDeflectionLimit: document.getElementById('matValDeflectionLimit'),
  matValRatePerMeter: document.getElementById('matValRatePerMeter'),
  matValRippleHeight: document.getElementById('matValRippleHeight'),
  matValRippleLimit: document.getElementById('matValRippleLimit'),
  badgeRippleMatrix: document.getElementById('badgeRippleMatrix'),
  badgeCombinedStressMatrix: document.getElementById('badgeCombinedStressMatrix'),
  matValHoopStress: document.getElementById('matValHoopStress'),
  matValLongStress: document.getElementById('matValLongStress'),
  matValVonMises: document.getElementById('matValVonMises'),
  matValAllowCombined: document.getElementById('matValAllowCombined'),
  matValStressRatio: document.getElementById('matValStressRatio'),

  // Matrix Card 6: Bending Machine Ram Force & Plastic Moment
  badgeMachineForceMatrix: document.getElementById('badgeMachineForceMatrix'),
  matValPlasticSectionMod: document.getElementById('matValPlasticSectionMod'),
  matValPlasticMoment: document.getElementById('matValPlasticMoment'),
  matValRamForceKn: document.getElementById('matValRamForceKn'),
  matValMachineClass: document.getElementById('matValMachineClass'),
  matValMachineStatus: document.getElementById('matValMachineStatus'),
  
  // Pulls Table
  tbodyPulls: document.getElementById('tbodyPulls'),
  pullSummaryPill: document.getElementById('pullSummaryPill'),
  btnPrevPull: document.getElementById('btnPrevPull'),
  btnNextPull: document.getElementById('btnNextPull'),
  badgeActivePull: document.getElementById('badgeActivePull'),
  btnExportCSV: document.getElementById('btnExportCSV'),
  btnExportJSON: document.getElementById('btnExportJSON'),
  btnImportJSON: document.getElementById('btnImportJSON'),
  fileImportJSON: document.getElementById('fileImportJSON'),
  btnTogglePulls: document.getElementById('btnTogglePulls'),
  pullsWrap: document.getElementById('pullsWrap'),
  
  // Tabs & Views
  tab2D: document.getElementById('tab2D'),
  tabAsBuilt: document.getElementById('tabAsBuilt'),
  tab3D: document.getElementById('tab3D'),
  visInfoLabel: document.getElementById('visInfoLabel'),
  toolbarActions2D: document.getElementById('toolbarActions2D'),
  arrowStartPath: null,
  arrowEndPath: null,
  svgMethod2Group: null,
  view2D: document.getElementById('view2D'),
  viewAsBuilt: document.getElementById('viewAsBuilt'),
  view3D: document.getElementById('view3D'),
  svgDynamicGroup: document.getElementById('svgDynamicGroup'),
  svgPrintDynamicGroup: document.getElementById('svgPrintDynamicGroup'),
  btnResetDefaults: document.getElementById('btnResetDefaults'),
  btnPrintCard: document.getElementById('btnPrintCard'),
  btnResetView: document.getElementById('btnResetView'),
  btnToggleLabels: document.getElementById('btnToggleLabels'),
  btnExportDXF: document.getElementById('btnExportDXF'),
  btnExportSVG: document.getElementById('btnExportSVG'),
  
  // 2D Controls
  svgBend2D: document.getElementById('svgBend2D'),
  btn2dZoomIn: document.getElementById('btn2dZoomIn'),
  btn2dZoomOut: document.getElementById('btn2dZoomOut'),
  btn2dFocusArc: document.getElementById('btn2dFocusArc'),
  btn2dReset: document.getElementById('btn2dReset'),
  badgeZoom2D: document.getElementById('badgeZoom2D'),
  
  // 3D Controls
  container3D: document.getElementById('container3D'),
  loading3D: document.getElementById('loading3D'),
  btnCamIso: document.getElementById('btnCamIso'),
  btnCamTop: document.getElementById('btnCamTop'),
  btnCamSide: document.getElementById('btnCamSide'),
  btnCamFront: document.getElementById('btnCamFront'),
  btn3dResetCam: document.getElementById('btn3dResetCam'),
  btn3dFullscreen: document.getElementById('btn3dFullscreen'),
  btn3dSnapshot: document.getElementById('btn3dSnapshot'),
  btn3dAutoRotate: document.getElementById('btn3dAutoRotate'),
  btn3dToggleMandrel: document.getElementById('btn3dToggleMandrel'),
  btn3dToggleSeam: document.getElementById('btn3dToggleSeam'),
  btn3dPlay: document.getElementById('btn3dPlay'),
  btn3dStepPrev: document.getElementById('btn3dStepPrev'),
  btn3dStep: document.getElementById('btn3dStep'),
  slider3dStep: document.getElementById('slider3dStep'),
  animProgress: document.getElementById('animProgress'),
  btnExitTreeMode: document.getElementById('btnExitTreeMode'),
  badgeEasterEggThumbsUp: document.getElementById('badgeEasterEggThumbsUp'),
  legend3DValueExt: document.getElementById('legend3DValueExt'),
  legend3DValueInt: document.getElementById('legend3DValueInt'),
  legend3DValueWt: document.getElementById('legend3DValueWt'),

  // Update Manager
  btnCheckUpdates: document.getElementById('btnCheckUpdates'),
  btnSidebarCheckUpdates: document.getElementById('btnSidebarCheckUpdates'),
  btnModalRecheck: document.getElementById('btnModalRecheck'),
  updatePill: document.getElementById('updatePill'),
  updateModal: document.getElementById('updateModal'),
  updateInstalledVer: document.getElementById('updateInstalledVer'),
  updateLatestVer: document.getElementById('updateLatestVer'),
  updateBadgeStatus: document.getElementById('updateBadgeStatus'),
  updateStatus: document.getElementById('updateStatus'),
  updateNotes: document.getElementById('updateNotes'),
  updateAssets: document.getElementById('updateAssets'),
  btnCloseUpdateModal: document.getElementById('btnCloseUpdateModal'),

  // Printable Card Dynamic References
  prtDocNo: document.getElementById('prtDocNo'),
  prtDate: document.getElementById('prtDate'),
  prtLineName: document.getElementById('prtLineName'),
  prtPipeNo: document.getElementById('prtPipeNo'),
  prtBendType: document.getElementById('prtBendType'),
  prtClockPos: document.getElementById('prtClockPos'),
  prtVerdict: document.getElementById('prtVerdict'),
  prtPipeLength: document.getElementById('prtPipeLength'),
  prtPipeOD: document.getElementById('prtPipeOD'),
  prtSteelGrade: document.getElementById('prtSteelGrade'),
  prtNomWT: document.getElementById('prtNomWT'),
  prtPipeWeight: document.getElementById('prtPipeWeight'),
  prtRiggingLoad: document.getElementById('prtRiggingLoad'),
  prtSeam: document.getElementById('prtSeam'),
  prtDesignPress: document.getElementById('prtDesignPress'),
  prtRCalculated: document.getElementById('prtRCalculated'),
  prtRmin: document.getElementById('prtRmin'),
  prtThetaTarget: document.getElementById('prtThetaTarget'),
  prtThetaMax: document.getElementById('prtThetaMax'),
  prtTangents: document.getElementById('prtTangents'),
  prtArcLength: document.getElementById('prtArcLength'),
  prtSpringback: document.getElementById('prtSpringback'),
  prtMachineAngle: document.getElementById('prtMachineAngle'),
  prtThinning: document.getElementById('prtThinning'),
  prtRemainingWT: document.getElementById('prtRemainingWT'),
  prtOvality: document.getElementById('prtOvality'),
  prtMandrel: document.getElementById('prtMandrel'),
  prtDeflectionRate: document.getElementById('prtDeflectionRate'),
  prtRippleStatus: document.getElementById('prtRippleStatus'),
  prtSeamStatus: document.getElementById('prtSeamStatus'),
  prtGirthWeldStatus: document.getElementById('prtGirthWeldStatus'),
  prtCombinedStress: document.getElementById('prtCombinedStress'),
  prtBendingForce: document.getElementById('prtBendingForce'),
  prtMachineClass: document.getElementById('prtMachineClass'),
  prtPullsBody: document.getElementById('prtPullsBody'),
  prtPullsHead: document.getElementById('prtPullsHead'),

  // As-Built Site QC Inputs & Elements
  inpAsBuiltSpool: document.getElementById('inpAsBuiltSpool'),
  inpAsBuiltDate: document.getElementById('inpAsBuiltDate'),
  inpAsBuiltAngle: document.getElementById('inpAsBuiltAngle'),
  inpAsBuiltWT: document.getElementById('inpAsBuiltWT'),
  inpAsBuiltOvality: document.getElementById('inpAsBuiltOvality'),
  inpAsBuiltRipple: document.getElementById('inpAsBuiltRipple'),
  inpAsBuiltInspector: document.getElementById('inpAsBuiltInspector'),
  btnSyncAsBuiltCalc: document.getElementById('btnSyncAsBuiltCalc'),
  btnClearAsBuilt: document.getElementById('btnClearAsBuilt'),
  asBuiltTargetAngle: document.getElementById('asBuiltTargetAngle'),
  asBuiltTargetWT: document.getElementById('asBuiltTargetWT'),
  asBuiltTargetOvality: document.getElementById('asBuiltTargetOvality'),
  asBuiltTargetRipple: document.getElementById('asBuiltTargetRipple'),
  asBuiltDevAngle: document.getElementById('asBuiltDevAngle'),
  asBuiltDevWT: document.getElementById('asBuiltDevWT'),
  asBuiltDevOvality: document.getElementById('asBuiltDevOvality'),
  asBuiltDevRipple: document.getElementById('asBuiltDevRipple'),
  asBuiltCritWT: document.getElementById('asBuiltCritWT'),
  asBuiltCritOvality: document.getElementById('asBuiltCritOvality'),
  asBuiltCritRipple: document.getElementById('asBuiltCritRipple'),
  asBuiltStatusAngle: document.getElementById('asBuiltStatusAngle'),
  asBuiltStatusWT: document.getElementById('asBuiltStatusWT'),
  asBuiltStatusOvality: document.getElementById('asBuiltStatusOvality'),
  asBuiltStatusRipple: document.getElementById('asBuiltStatusRipple'),
  badgeAsBuiltVerdict: document.getElementById('badgeAsBuiltVerdict'),
  txtAsBuiltSummary: document.getElementById('txtAsBuiltSummary'),

  // Printable Card As-Built Section
  prtAsBuiltTable: document.getElementById('prtAsBuiltTable'),
  prtAsBuiltTargetAngle: document.getElementById('prtAsBuiltTargetAngle'),
  prtAsBuiltMeasAngle: document.getElementById('prtAsBuiltMeasAngle'),
  prtAsBuiltDevAngle: document.getElementById('prtAsBuiltDevAngle'),
  prtAsBuiltStatusAngle: document.getElementById('prtAsBuiltStatusAngle'),
  prtAsBuiltTargetWT: document.getElementById('prtAsBuiltTargetWT'),
  prtAsBuiltMeasWT: document.getElementById('prtAsBuiltMeasWT'),
  prtAsBuiltDevWT: document.getElementById('prtAsBuiltDevWT'),
  prtAsBuiltCritWT: document.getElementById('prtAsBuiltCritWT'),
  prtAsBuiltStatusWT: document.getElementById('prtAsBuiltStatusWT'),
  prtAsBuiltTargetOvality: document.getElementById('prtAsBuiltTargetOvality'),
  prtAsBuiltMeasOvality: document.getElementById('prtAsBuiltMeasOvality'),
  prtAsBuiltDevOvality: document.getElementById('prtAsBuiltDevOvality'),
  prtAsBuiltCritOvality: document.getElementById('prtAsBuiltCritOvality'),
  prtAsBuiltStatusOvality: document.getElementById('prtAsBuiltStatusOvality'),
  prtAsBuiltTargetRipple: document.getElementById('prtAsBuiltTargetRipple'),
  prtAsBuiltMeasRipple: document.getElementById('prtAsBuiltMeasRipple'),
  prtAsBuiltDevRipple: document.getElementById('prtAsBuiltDevRipple'),
  prtAsBuiltCritRipple: document.getElementById('prtAsBuiltCritRipple'),
  prtAsBuiltStatusRipple: document.getElementById('prtAsBuiltStatusRipple'),
  prtAsBuiltMeta: document.getElementById('prtAsBuiltMeta'),
  prtAsBuiltFinalVerdict: document.getElementById('prtAsBuiltFinalVerdict'),

  // Global Verdict Banner
  masterVerdict: document.getElementById('masterVerdict'),
  masterVerdictTitle: document.getElementById('masterVerdictTitle'),
  masterVerdictSub: document.getElementById('masterVerdictSub'),
  masterVerdictCount: document.getElementById('masterVerdictCount')
};

// Preset Configurations
const PRESETS = {
  botas_36: {
    standard: 'BOTAS_SPEC',
    od: 914.4,
    npsSelect: '914.4',
    t_nom: 14.3,
    ca: 1.0,
    length: 12.0,
    tangent1: 1.8,
    tangent2: 1.8,
    smys: 485,
    seamType: 'SAWH',
    seamAngle: 0,
    targetAngle: 10.0,
    radiusMultiplier: 40,
    designPressure: 75.0,
    designFactor: 0.72,
    useMandrel: true,
    bendType: 'overbend',
    clockPos: '3'
  },
  asme_24: {
    standard: 'ASME_B31_8',
    od: 610.0,
    npsSelect: '610.0',
    t_nom: 11.9,
    ca: 0.5,
    length: 12.2,
    tangent1: 1.6,
    tangent2: 1.6,
    smys: 450,
    seamType: 'SAWL',
    seamAngle: 0,
    targetAngle: 12.5,
    radiusMultiplier: 30,
    designPressure: 80.0,
    designFactor: 0.72,
    useMandrel: true,
    bendType: 'sidebend_right',
    clockPos: '12'
  },
  asme_16: {
    standard: 'ASME_B31_4',
    od: 406.4,
    npsSelect: '406.4',
    t_nom: 9.5,
    ca: 1.5,
    length: 12.0,
    tangent1: 1.5,
    tangent2: 1.5,
    smys: 360,
    seamType: 'SAWL',
    seamAngle: 0,
    targetAngle: 14.0,
    radiusMultiplier: 24,
    designPressure: 64.0,
    designFactor: 0.72,
    useMandrel: true,
    bendType: 'sagbend',
    clockPos: '9'
  },
  tanap_48: {
    standard: 'BOTAS_SPEC',
    od: 1219.2,
    npsSelect: '1219.2',
    t_nom: 19.1,
    ca: 1.0,
    length: 12.2,
    tangent1: 2.0,
    tangent2: 2.0,
    smys: 485,
    seamType: 'SAWH',
    seamAngle: 0,
    targetAngle: 8.5,
    radiusMultiplier: 40,
    designPressure: 90.0,
    designFactor: 0.60,
    useMandrel: true,
    bendType: 'overbend',
    clockPos: '3'
  },
  dist_10: {
    standard: 'ASME_B31_8',
    od: 273.1,
    npsSelect: '273.1',
    t_nom: 6.4,
    ca: 0.5,
    length: 11.8,
    tangent1: 1.2,
    tangent2: 1.2,
    smys: 245,
    seamType: 'SMLS',
    seamAngle: 0,
    targetAngle: 16.0,
    radiusMultiplier: 18,
    designPressure: 40.0,
    designFactor: 0.50,
    useMandrel: false,
    bendType: 'overbend',
    clockPos: '3'
  }
};

/* ==========================================================================
   Engineering Calculation Engine
   ========================================================================== */

/**
 * Helper to determine nominal pipe size category in inches (ASME B36.10M / API 5L)
 * Pipe sizes NPS 12 and smaller have outer diameter up to 12.75" (323.85 mm).
 * Pipe sizes NPS 14 and larger have outer diameter equal to nominal size.
 */
function getNominalNpsInches(odMm) {
  if (odMm <= 325.0) return 12.0; // NPS 12 (DN 300 / OD 323.9 mm) and smaller
  return Math.round((odMm / 25.4) * 10) / 10;
}

/**
 * API 5L Table 11 / BOTAŞ Hat Boruları Teknik Şartnamesi
 * Boru Üretimi Et Kalınlığı Negatif İmalat Toleransı (Δt_mill)
 */
function getPipeMillWallTolerance(tNomMm, seamType) {
  const t = Math.max(0, Number(tNomMm) || 0);
  let minusTolMm = 0;
  let ruleLabel = '';

  if (seamType === 'SMLS') {
    // Dikişsiz (Seamless) hat boruları (API 5L Tablo 11)
    if (t <= 4.0) {
      minusTolMm = 0.50;
      ruleLabel = '-0.50 mm (SMLS t ≤ 4 mm)';
    } else if (t < 25.0) {
      minusTolMm = 0.125 * t;
      ruleLabel = '-%12.5 t_nom (SMLS 4 < t < 25 mm)';
    } else {
      const pct10 = 0.10 * t;
      if (3.0 >= pct10) {
        minusTolMm = 3.0;
        ruleLabel = '-3.00 mm (SMLS t ≥ 25 mm)';
      } else {
        minusTolMm = pct10;
        ruleLabel = '-%10.0 t_nom (SMLS t ≥ 25 mm)';
      }
    }
  } else {
    // Kaynaklı (SAWH, SAWL, ERW) hat boruları (API 5L Tablo 11 / BOTAŞ)
    if (t <= 5.0) {
      minusTolMm = 0.50;
      ruleLabel = '-0.50 mm (Kaynaklı t ≤ 5 mm)';
    } else if (t < 15.0) {
      minusTolMm = 0.10 * t;
      ruleLabel = '-%10.0 t_nom (Kaynaklı 5 < t < 15 mm)';
    } else {
      minusTolMm = 1.50;
      ruleLabel = '-1.50 mm (Kaynaklı t ≥ 15 mm)';
    }
  }

  const minusTolPct = t > 0 ? (minusTolMm / t) * 100 : 0;
  const tMinMillMm = Math.max(0, t - minusTolMm);

  return {
    minusTolMm,
    minusTolPct,
    tMinMillMm,
    ruleLabel
  };
}

function calculateMinimumBendRadiusMultiplier(standard, odMm) {
  const npsInches = getNominalNpsInches(odMm);
  
  if (standard === 'ASME_B31_8') {
    // ASME B31.8 Table 841.2.3-1 (NPS 12 and smaller: 18D)
    if (npsInches <= 12) return 18;
    if (npsInches <= 14) return 21;
    if (npsInches <= 16) return 24;
    if (npsInches <= 18) return 27;
    return 30; // NPS 20 and larger
  } else if (standard === 'ASME_B31_4') {
    // ASME B31.4 Section 406.2.1 (NPS 12 and smaller: 18D)
    if (npsInches <= 12) return 18;
    if (npsInches <= 14) return 21;
    if (npsInches <= 16) return 24;
    if (npsInches <= 18) return 27;
    return 30;
  } else if (standard === 'EN_1594') {
    // EN 1594 Md. 8.4 / EN 14161 (Avrupa Gaz İletim Hatları: DN <= 300: 20D, DN <= 600: 30D, DN > 600: 40D)
    if (npsInches <= 12) return 20;
    if (npsInches <= 24) return 30;
    return 40;
  } else if (standard === 'CSA_Z662') {
    // CSA Z662 Clause 6.2.3 Table 6.1 (Kanada Boru Hattı Standardı)
    if (npsInches <= 12) return 18;
    if (npsInches <= 14) return 21;
    if (npsInches <= 16) return 24;
    if (npsInches <= 18) return 27;
    return 30;
  } else if (standard === 'BOTAS_SPEC') {
    // Employer strict specification (NPS <= 12: 18D, NPS <= 16: 24D, NPS <= 24: 30D, > 24: 40D)
    if (npsInches <= 12) return 18;
    if (npsInches <= 16) return 24;
    if (npsInches <= 24) return 30;
    return 40; // NPS > 24" (e.g., 28", 30", 36", 48", 56")
  }
  return 30;
}

/**
 * Seçilen Referans Mühendislik Standardına Göre Kabul Kriterleri Matrisi
 */
function getStandardCriteria(standard, odMm, tNomMm, seamType) {
  const npsInches = getNominalNpsInches(odMm);
  const minMult = calculateMinimumBendRadiusMultiplier(standard, odMm);
  const millTol = getPipeMillWallTolerance(tNomMm, seamType);

  // Default ASME Method 2 deflection limit (deg / D)
  let asmeM2 = 1.9;
  if (npsInches <= 12) asmeM2 = 3.2;
  else if (npsInches <= 14) asmeM2 = 2.7;
  else if (npsInches <= 16) asmeM2 = 2.4;
  else if (npsInches <= 18) asmeM2 = 2.1;

  if (standard === 'BOTAS_SPEC') {
    const botasM2 = Number(((180 / Math.PI) / minMult).toFixed(2));
    return {
      code: 'BOTAS_SPEC',
      badgeName: 'BOTAŞ Şartnamesi (Sıkı)',
      shortRef: 'BOTAŞ / API 5L Tablo 11',
      minMult,
      maxAllowOvality: 2.00,
      ovalityRefText: '%2.00 (BOTAŞ Sıkı Kriter)',
      maxAllowRipplePct: 0.5,
      rippleRefText: '%0.5 D (BOTAŞ Sıkı Kriter)',
      method2Limit: Math.min(asmeM2, botasM2),
      method2RefText: 'BOTAŞ Sıkı R_min Sınırı',
      enforceMillTolThinning: true,
      millTol
    };
  } else if (standard === 'EN_1594') {
    const enM2 = Number(((180 / Math.PI) / minMult).toFixed(2));
    return {
      code: 'EN_1594',
      badgeName: 'EN 1594 (Md. 8.4 Avrupa)',
      shortRef: 'EN 1594 Md. 8.4',
      minMult,
      maxAllowOvality: 2.00,
      ovalityRefText: '%2.00 (EN 1594 Md. 8.4)',
      maxAllowRipplePct: 0.5,
      rippleRefText: '%0.5 D (EN 1594 Md. 8.4)',
      method2Limit: enM2,
      method2RefText: 'EN 1594 Md. 8.4',
      enforceMillTolThinning: false,
      millTol
    };
  } else if (standard === 'CSA_Z662') {
    return {
      code: 'CSA_Z662',
      badgeName: 'CSA Z662 (Md. 6.2.3 Kanada)',
      shortRef: 'CSA Z662 Tablo 6.1',
      minMult,
      maxAllowOvality: 2.50,
      ovalityRefText: '%2.50 (CSA Z662 Md. 6.2.3)',
      maxAllowRipplePct: 1.0,
      rippleRefText: '%1.0 D (CSA Z662 Md. 6.2.3)',
      method2Limit: asmeM2,
      method2RefText: 'CSA Z662 Tablo 6.1',
      enforceMillTolThinning: false,
      millTol
    };
  } else if (standard === 'ASME_B31_4') {
    return {
      code: 'ASME_B31_4',
      badgeName: 'ASME B31.4 (Md. 406.2.1)',
      shortRef: 'ASME B31.4 Md. 406.2.1',
      minMult,
      maxAllowOvality: 2.50,
      ovalityRefText: '%2.50 (ASME B31.4)',
      maxAllowRipplePct: 1.0,
      rippleRefText: '%1.0 D (ASME B31.4)',
      method2Limit: asmeM2,
      method2RefText: 'Md. 406.2.1',
      enforceMillTolThinning: false,
      millTol
    };
  } else if (standard === 'CUSTOM_SPEC') {
    return {
      code: 'CUSTOM_SPEC',
      badgeName: 'Özel Şartname',
      shortRef: 'Özel / Kullanıcı Kriteri',
      minMult,
      maxAllowOvality: 2.50,
      ovalityRefText: '%2.50 (Özel / ASME)',
      maxAllowRipplePct: 1.0,
      rippleRefText: '%1.0 D (Özel / ASME)',
      method2Limit: asmeM2,
      method2RefText: 'Tablo 841.2.3-1',
      enforceMillTolThinning: false,
      millTol
    };
  }
  // Default: ASME_B31_8
  return {
    code: 'ASME_B31_8',
    badgeName: 'ASME B31.8 (Md. 841.2.3)',
    shortRef: 'ASME B31.8 Md. 841.2.3',
    minMult,
    maxAllowOvality: 2.50,
    ovalityRefText: '%2.50 (ASME B31.8)',
    maxAllowRipplePct: 1.0,
    rippleRefText: '%1.0 D (Tablo 841.2.3-1)',
    method2Limit: asmeM2,
    method2RefText: 'Tablo 841.2.3-1',
    enforceMillTolThinning: false,
    millTol
  };
}

/**
 * ASME B31.8 / Employer Seam Clock Position & Neutral Axis Safety Validator
 * Overbend & Sagbend (Vertical Bending): Neutral axis is at 3:00 and 9:00 (+/- 10 deg)
 * Sidebend Right & Left (Horizontal Bending): Neutral axis is at 12:00 and 6:00 (+/- 10 deg)
 */
function validateClockSafety(bendType, clockPos, customAngle) {
  if (state.seamType === 'SMLS') {
    return {
      isSafe: true,
      badgeText: 'DİKİŞSİZ (SMLS)',
      badgeClass: 'pass',
      boxClass: '',
      lblClock: 'Dikişsiz Boru',
      desc: 'Dikişsiz borularda boyuna veya helezoni kaynak dikişi bulunmadığından dikiş yönü kısıtlaması yoktur.',
      angleDeg: 0
    };
  }

  let angleDeg = 0;
  if (clockPos === '3') angleDeg = 0;
  else if (clockPos === '9') angleDeg = 180;
  else if (clockPos === '12') angleDeg = 90;
  else if (clockPos === '6') angleDeg = -90;
  else angleDeg = customAngle;

  let isSafe = true;
  let badgeText = 'NÖTR EKSEN UYGUN';
  let badgeClass = 'pass';
  let boxClass = '';
  let lblClock = clockPos === 'custom' ? `Özel (${angleDeg}°)` : `Saat ${clockPos}:00 (${angleDeg}°)`;
  let desc = '';

  if (bendType === 'overbend' || bendType === 'sagbend') {
    const bendName = bendType === 'overbend' ? 'Tepe Bükümü (Overbend)' : 'Taban Bükümü (Sagbend)';
    if (clockPos === '3' || clockPos === '9') {
      isSafe = true;
      badgeText = 'NÖTR EKSEN UYGUN';
      badgeClass = 'pass';
      desc = `${bendName}: Kaynak dikişi Saat ${clockPos}:00 nötr eksenindedir. Çekme ve basma gerilmelerinden muaftır (ASME KABUL).`;
    } else if (clockPos === '12' || clockPos === '6') {
      isSafe = false;
      badgeText = 'KRİTİK UYARI / RET';
      badgeClass = 'fail';
      boxClass = 'warning';
      const zone = (bendType === 'overbend') 
        ? (clockPos === '12' ? 'Ekstrados (Maksimum Çekme & Cidar İncelmesi)' : 'İntrados (Maksimum Basma & Kalınlaşma)')
        : (clockPos === '12' ? 'İntrados (Maksimum Basma)' : 'Ekstrados (Maksimum Çekme)');
      desc = `DİKKAT: Dikiş Saat ${clockPos}:00 (${zone}) üzerindedir! ASME B31.8 gereği kaynak dikişi Saat 3:00 veya 9:00 nötr eksenine alınmalıdır.`;
    } else {
      const diff3 = Math.abs(angleDeg);
      const diff9 = Math.abs(Math.abs(angleDeg) - 180);
      const minDiff = Math.min(diff3, diff9);
      isSafe = minDiff <= 10;
      badgeText = isSafe ? 'NÖTR EKSEN DAHİLİ' : 'TOLERANS AŞIMI';
      badgeClass = isSafe ? 'pass' : 'fail';
      boxClass = isSafe ? '' : 'warning';
      desc = isSafe 
        ? `Özel dikiş açısı nötr eksenden ${minDiff.toFixed(0)}° sapmaktadır (±10° izin verilen tolerans dahilindedir).`
        : `KRİTİK: Dikiş nötr eksenden ${minDiff.toFixed(0)}° sapmaktadır! İzin verilen azami sapma ±10°'dir.`;
    }
  } else if (bendType === 'sidebend_right' || bendType === 'sidebend_left') {
    const sideName = bendType === 'sidebend_right' ? 'Yatay Sağ Büküm (Sidebend)' : 'Yatay Sol Büküm (Sidebend)';
    if (clockPos === '12' || clockPos === '6') {
      isSafe = true;
      badgeText = 'NÖTR EKSEN UYGUN';
      badgeClass = 'pass';
      desc = `${sideName}: Yatay düzlemde büküldüğünden nötr eksen Saat ${clockPos}:00 (üst/alt tepe) hattındadır. Gerilme sıfırdır (KABUL).`;
    } else if (clockPos === '3' || clockPos === '9') {
      isSafe = false;
      badgeText = 'KRİTİK UYARI / RET';
      badgeClass = 'fail';
      boxClass = 'warning';
      desc = `DİKKAT: Yatay bükümde Saat ${clockPos}:00 iç veya dış viraj cidarındadır! Dikiş Saat 12:00 veya 6:00 nötr eksenine getirilmelidir.`;
    } else {
      const diff12 = Math.abs(Math.abs(angleDeg) - 90);
      isSafe = diff12 <= 10;
      badgeText = isSafe ? 'NÖTR EKSEN DAHİLİ' : 'TOLERANS AŞIMI';
      badgeClass = isSafe ? 'pass' : 'fail';
      boxClass = isSafe ? '' : 'warning';
      desc = isSafe
        ? `Yatay bükümde dikiş nötr eksenden ${diff12.toFixed(0)}° sapmaktadır (±10° toleransı dahilinde).`
        : `KRİTİK: Yatay bükümde dikiş Saat 12/6 nötr ekseninden ${diff12.toFixed(0)}° sapmaktadır (Limit: ±10°)!`;
    }
  } else {
    isSafe = true;
    badgeText = '3D KOMBİNE';
    badgeClass = 'warn';
    const roll = state.compoundRollAngle ? state.compoundRollAngle.toFixed(1) : '45.0';
    desc = `3D Bileşik Büküm (Kalıp Roll: ${roll}°): Dikişin nötr eksende kalması için boru büküm presinde ${roll}° döndürülerek bükülmelidir.`;
  }

  return { isSafe, badgeText, badgeClass, boxClass, lblClock, desc, angleDeg };
}

/* ==========================================================================
   Temperature Derating Factor Engine (ASME B31.8 Table 841.1.8-1 & B31.4)
   ========================================================================== */
function getTemperatureDeratingFactor(tempC) {
  if (tempC <= 121.1) return 1.000;
  if (tempC >= 232.2) return 0.867;
  const points = [
    { t: 121.1, f: 1.000 },
    { t: 148.9, f: 0.967 },
    { t: 176.7, f: 0.933 },
    { t: 204.4, f: 0.900 },
    { t: 232.2, f: 0.867 }
  ];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (tempC >= p1.t && tempC <= p2.t) {
      const ratio = (tempC - p1.t) / (p2.t - p1.t);
      return p1.f + ratio * (p2.f - p1.f);
    }
  }
  return 1.000;
}

/* ==========================================================================
   Bending Machine Classification Engine (CRC-Evans / Superior / DMI PB Series)
   ========================================================================== */
function getBendingMachineClass(odMm, ramTon) {
  let modelName = 'PB 16"-30"';
  let capTon = 450;
  if (odMm <= 508) {
    modelName = 'PB 16"-30" (veya 6"-20")';
    capTon = 450;
  } else if (odMm <= 762) {
    modelName = 'PB 22"-36" (veya 16"-30" HD)';
    capTon = 750;
  } else if (odMm <= 1067) {
    modelName = 'PB 36"-48" (Ağır Hizmet)';
    capTon = 1100;
  } else {
    modelName = 'PB 48"-60" (Süper Ağır Hizmet)';
    capTon = 1600;
  }
  const isSufficient = ramTon <= capTon;
  const utilPercent = Math.round((ramTon / capTon) * 100);
  return {
    modelName,
    capacityTon: capTon,
    isSufficient,
    utilPercent,
    statusText: isSufficient
      ? `KAPASİTE DAHİLİ (%${utilPercent} Kullanım)`
      : `YETERSİZ: %${utilPercent} Aşım (Daha Yüksek Sınıf Makine Gerekli!)`
  };
}

function runCalculations() {
  const odM = state.od / 1000; // in meters
  const minMult = calculateMinimumBendRadiusMultiplier(state.standard, state.od);
  const selectedMult = state.radiusMultiplier;
  
  // Radius calculation
  const r_min_m = minMult * odM;
  const r_bend_m = selectedMult * odM;
  const isRadiusCompliant = selectedMult >= minMult;
  
  // Tangents & Arc calculation
  const totalTangents = state.tangent1 + state.tangent2;
  const l_arc_m = Math.max(0, state.length - totalTangents);
  const isTangentFeasible = totalTangents < state.length;
  
  // Max allowable angle for this pipe joint
  // theta_rad = l_arc / R
  const theta_max_rad = l_arc_m / r_bend_m;
  const theta_max_deg = (theta_max_rad * 180) / Math.PI;
  const isAngleWithinPipeCapacity = state.targetAngle <= theta_max_deg;
  
  // Wall thinning & thickening
  // Formula requested: delta_t_thin = t_nom * D / (2 * R + D)
  const D = state.od;
  const R_mm = r_bend_m * 1000;
  const delta_t_thin = state.t_nom * (D / (2 * R_mm + D));
  const t_extrados = state.t_nom - delta_t_thin;
  const thinningPercent = (delta_t_thin / state.t_nom) * 100;
  
  // Intrados thickening
  const delta_t_thick = state.t_nom * (D / (2 * R_mm - D));
  const t_intrados = state.t_nom + delta_t_thick;
  
  // Design Minimum Wall Thickness (Barlow's formula per ASME B31.8 / B31.4)
  // P in MPa: P_bar * 0.1
  const P_mpa = state.designPressure * 0.1;
  const S_mpa = state.smys;
  const F = state.designFactor;
  const E_weld = 1.0; // SAW / HFW high quality
  const T_temp = getTemperatureDeratingFactor(state.designTemp);
  const t_min_design = (P_mpa * D) / (2 * S_mpa * F * E_weld * T_temp) + state.ca;

  // Standard-specific acceptance criteria & API 5L Table 11 pipe mill wall tolerance
  const stdCriteria = getStandardCriteria(state.standard, state.od, state.t_nom, state.seamType);
  const millTol = stdCriteria.millTol;
  const isMillTolSafe = (delta_t_thin <= millTol.minusTolMm) && (t_extrados >= (t_min_design + millTol.minusTolMm));
  const t_min_required = stdCriteria.enforceMillTolThinning
    ? (t_min_design + millTol.minusTolMm)
    : t_min_design;
  const isWallThinningSafe = stdCriteria.enforceMillTolThinning
    ? isMillTolSafe
    : (t_extrados >= t_min_design);
  const wallMarginMm = t_extrados - t_min_required;
  const wallMarginPercent = (wallMarginMm / Math.max(1e-9, t_min_required)) * 100;
  
  // Combined Stress & Von Mises Analysis (ASME B31.8 Section 833 & ASME B31.4 Section 402.3)
  const hoopStressMpa = (P_mpa * D) / (2 * Math.max(1, t_extrados));
  const effectiveSMYS = S_mpa * T_temp;
  const hoopStressPercentSmys = (hoopStressMpa / effectiveSMYS) * 100;

  // Longitudinal Stress S_L: Poisson + Thermal + Elastic bending residual
  const nu = 0.30;
  const longStressPressure = nu * hoopStressMpa;
  const alphaSteel = 1.17e-5;
  const deltaT = state.designTemp - 15.0;
  const longStressThermal = -207000 * alphaSteel * deltaT;
  const eps_bend_fiber = (odM / 2) / Math.max(1e-9, r_bend_m);
  const longStressBending = Math.min(207000 * eps_bend_fiber * 0.12, effectiveSMYS * 0.35);
  const longStressMpa = longStressPressure + longStressThermal + longStressBending;

  // Von Mises Equivalent Stress: S_eq = sqrt(S_h^2 - S_h*S_L + S_L^2)
  const vonMisesStressMpa = Math.sqrt(
    Math.max(0, hoopStressMpa * hoopStressMpa - hoopStressMpa * longStressMpa + longStressMpa * longStressMpa)
  );

  // Allowable Combined Stress Limit: 0.90 * SMYS * T (ASME B31.8 Section 833.4 / B31.4 Sec 402.3.2)
  const allowableCombinedStressMpa = 0.90 * effectiveSMYS;
  const combinedStressRatioPercent = (vonMisesStressMpa / allowableCombinedStressMpa) * 100;
  const isCombinedStressCompliant = vonMisesStressMpa <= allowableCombinedStressMpa;
  
  // Ovality Calculation
  // Empirical natural ovality without mandrel: (1/16) * (D / t) * (D / R) * 100%
  const D_to_t = D / state.t_nom;
  const D_to_R = D / R_mm;
  let estimatedOvality = (1 / 16) * D_to_t * D_to_R * 100;
  
  // If internal hydraulic mandrel is used, ovality is drastically restrained
  if (state.useMandrel) {
    estimatedOvality = Math.min(estimatedOvality * 0.32, 1.15);
  }
  const maxAllowOvality = stdCriteria.maxAllowOvality;
  const isOvalityCompliant = estimatedOvality <= maxAllowOvality;
  const deltaID_mm = (estimatedOvality / 100) * (D - 2 * state.t_nom);
  
  // Springback (Elastik Geri Yaylanma) Calculation
  // In API 5L steel bending, springback is proportional to (SMYS / E) * (R / D)
  const E_modulus = 207000; // MPa for steel
  // Theoretical angular springback ratio
  const springbackRatio = (3.5 * S_mpa * r_bend_m) / (E_modulus * odM) * 0.055;
  const springbackDeg = state.targetAngle * springbackRatio;
  const machineAngleDeg = state.targetAngle + springbackDeg;
  
  // Seam orientation check using clock position safety engine
  const clockCheck = validateClockSafety(state.bendType, state.clockPos, state.seamAngle);
  const isSeamSafe = clockCheck.isSafe;
  
  // --- Standard Hydraulic Step/Pull Calculations (ASME B31.8 / B31.4 / CRC-Evans) ---
  // Active curved arc length traversed by hydraulic bending die:
  const l_bent_m = r_bend_m * (machineAngleDeg * Math.PI / 180);

  // Max allowable pull angle per step per standard (to prevent localized wrinkling/kink):
  // X65-X80 high grade steels: <= 1.0 deg/pull, Lower grades: <= 1.25 deg/pull
  const maxAllowPullAngle = (S_mpa >= 450) ? 1.00 : 1.25;

  // Standard step pitch: 350-450mm for >=24", 250-350mm for <24"
  const targetStepPitch = (D >= 600) ? 0.40 : 0.30; // meters
  const n_from_pitch = Math.round(l_bent_m / targetStepPitch);
  const n_from_angle = Math.ceil(machineAngleDeg / maxAllowPullAngle);
  const n_auto = Math.max(2, Math.max(n_from_pitch, n_from_angle));
  // Manual override (2-60); empty input falls back to automatic
  const manualPullsUsed = Number.isInteger(state.manualPulls);
  const numPulls = manualPullsUsed ? state.manualPulls : n_auto;

  // Pull start: front-anchored at Lt1, but centered in the available arc
  // when both tangents are equal (leftover split evenly both ends).
  const isCentered = Math.abs(state.tangent1 - state.tangent2) < 1e-6;
  const pullShiftM = isCentered ? Math.max(0, (l_arc_m - l_bent_m) / 2) : 0;
  const pullStartM = state.tangent1 + pullShiftM;
  const l_t2_actual = Math.max(0, state.length - pullStartM - l_bent_m);

  // --- Büküm Makinesi Kalıp & Sıkma Pimi Minimum Tutma Payı Kontrolü (CRC-Evans / DMI / BOTAŞ) ---
  const minClampingLenM = Math.max(1.2 * odM, 1.50);
  const isFrontClampingSafe = pullStartM >= (minClampingLenM - 0.02);
  const isRearClampingSafe = l_t2_actual >= (minClampingLenM - 0.02);
  const isClampingSafe = isFrontClampingSafe && isRearClampingSafe;

  let clampingStatusText = 'UYGUN (Kalıp ve Sıkma Pimi Emniyetli)';
  let clampingWarningText = '';
  if (!isFrontClampingSafe && !isRearClampingSafe) {
    clampingStatusText = `YETERSİZ: Hem Ön (${pullStartM.toFixed(2)}m) hem Arka (${l_t2_actual.toFixed(2)}m) teğet, makine asgari sıkma boyunun (${minClampingLenM.toFixed(2)}m) altındadır! Kaynak ağzı (bevel) ezilme riski!`;
    clampingWarningText = `Ön (${pullStartM.toFixed(2)}m) ve Arka (${l_t2_actual.toFixed(2)}m) < Min. ${minClampingLenM.toFixed(2)} m!`;
  } else if (!isFrontClampingSafe) {
    clampingStatusText = `YETERSİZ: Ön teğet (${pullStartM.toFixed(2)}m) makine asgari sıkma boyunun (${minClampingLenM.toFixed(2)}m) altındadır! Bevel ezilme riski!`;
    clampingWarningText = `Ön teğet (${pullStartM.toFixed(2)}m) < Min. ${minClampingLenM.toFixed(2)} m!`;
  } else if (!isRearClampingSafe) {
    clampingStatusText = `YETERSİZ: Arka teğet (${l_t2_actual.toFixed(2)}m) makine asgari sıkma boyunun (${minClampingLenM.toFixed(2)}m) altındadır!`;
    clampingWarningText = `Arka teğet (${l_t2_actual.toFixed(2)}m) < Min. ${minClampingLenM.toFixed(2)} m!`;
  } else {
    clampingWarningText = `Min. ${minClampingLenM.toFixed(2)} m düzlük sağlandı (Ön: ${pullStartM.toFixed(2)} m, Arka: ${l_t2_actual.toFixed(2)} m)`;
  }
  
  const pullStepPitch = l_bent_m / numPulls;
  const pullAnglePerStep = machineAngleDeg / numPulls;
  const netAnglePerStep = state.targetAngle / numPulls;
  const isPullAngleCompliant = pullAnglePerStep <= (maxAllowPullAngle + 0.05);
  
  // --- Birim Çap Başına Sapma Açısı (Yöntem 2 / Deflection Rate per OD) ---
  const asmeMethod2Limit = stdCriteria.method2Limit;
  const actualDeflectionRatePerOD = (odM / r_bend_m) * (180 / Math.PI);
  const actualDeflectionRatePerMeter = (1.0 / r_bend_m) * (180 / Math.PI);
  const isMethod2Compliant = actualDeflectionRatePerOD <= (asmeMethod2Limit + 0.05);

  // --- Ondülasyon (Ripple) Hesabı (ASME B31.8 / EN 1594 / CSA Z662 / BOTAŞ) ---
  const maxAllowRippleMm = (stdCriteria.maxAllowRipplePct / 100) * state.od;
  // Estimated ripple: with mandrel ~0.2% D, without mandrel on thin pipe ~1.4% D
  const estimatedRippleMm = state.useMandrel ? (0.002 * state.od) : (D_to_t > 45 ? 0.014 * state.od : 0.0055 * state.od);
  const isRippleCompliant = estimatedRippleMm <= maxAllowRippleMm;

  // --- Global feasibility: machine-angle arc must fit into available arc ---
  const isGeometryFeasible = l_bent_m <= l_arc_m + 1e-6;

  // --- ASME B31.8 Md. 841.2.3(a)(5) Çevresel Alın Kaynağı (Girth Weld) Analizi ---
  const pullEndM = pullStartM + l_bent_m;
  let isGwOnPipe = true;
  let isGwInArc = false;
  let isGwInFrontTangent = false;
  let isGwInRearTangent = false;
  let girthWeldStatusText = 'Alın Kaynağı Yok (RT Gerekmez)';
  let girthWeldBadge = 'YOK';
  let girthWeldClass = 'pass';

  if (state.girthWeldInBend) {
    const gwDist = state.girthWeldDist;
    isGwOnPipe = gwDist > 0 && gwDist < state.length;
    if (!isGwOnPipe) {
      girthWeldStatusText = `Hatalı Konum: Alın kaynağı (X=${gwDist.toFixed(2)}m) boru boyu [0 - ${state.length.toFixed(2)}m] dışındadır!`;
      girthWeldBadge = 'HATALI KONUM';
      girthWeldClass = 'fail';
    } else if (gwDist >= (pullStartM - 0.02) && gwDist <= (pullEndM + 0.02)) {
      isGwInArc = true;
      girthWeldStatusText = `DİKKAT: Alın kaynağı (X=${gwDist.toFixed(2)}m) BÜKÜM YAYI [${pullStartM.toFixed(2)}m - ${pullEndM.toFixed(2)}m] İÇİNDEDİR. ASME B31.8 Md. 841.2.3(a)(5) gereği büküm sonrası %100 Radyografik Muayene (RT) ZORUNLUDUR!`;
      girthWeldBadge = '%100 RT ZORUNLU';
      girthWeldClass = 'warn';
    } else {
      const zoneName = gwDist < pullStartM ? `Ön Teğet [0 - ${pullStartM.toFixed(2)}m]` : `Arka Teğet [${pullEndM.toFixed(2)}m - ${state.length.toFixed(2)}m]`;
      if (gwDist < pullStartM) isGwInFrontTangent = true;
      else isGwInRearTangent = true;
      girthWeldStatusText = `UYGUN: Alın kaynağı (X=${gwDist.toFixed(2)}m) ${zoneName} üzerindedir. Büküm kavisinden muaftır, standart saha RT prosedürü geçerlidir.`;
      girthWeldBadge = 'TEĞET BÖLGEDE';
      girthWeldClass = 'pass';
    }
  }

  // --- Boru Ağırlığı ve Sahada Kaldırma / Rigging Yükü Hesabı (API 5L / ASME B30.20) ---
  // API 5L / ASME B36.10M standardı çelik boru ağırlık formülü:
  // w = 0.0246615 * (OD - WT) * WT (kg/m)
  const weightPerMeterKg = 0.0246615 * (state.od - state.t_nom) * state.t_nom;
  const totalPipeWeightKg = weightPerMeterKg * state.length;
  const totalPipeWeightTon = totalPipeWeightKg / 1000;
  // Büküm makinesine boru sürme esnasında konsol ve vinç sapanı statik taşıma yükü (yaklaşık W/2):
  const riggingSlingLoadKg = totalPipeWeightKg / 2;
  const riggingSlingLoadTon = riggingSlingLoadKg / 1000;
  // ASME B30.20 / ASME P30.1 saha dinamik kaldırma faktörü DAF = 1.25 ile önerilen minimum sapan SWL:
  const minRecommendedSlingSwlTon = riggingSlingLoadTon * 1.25;

  // --- Büküm Makinesi Plastik Momenti & Ram Tonajı Hesabı (CRC-Evans / DMI / ASME) ---
  const D_in_mm = D - 2 * state.t_nom;
  const Z_p_mm3 = (Math.pow(D, 3) - Math.pow(Math.max(1, D_in_mm), 3)) / 6;
  const plasticMomentKnm = (Z_p_mm3 * S_mpa) / 1e6;
  const dieSupportSpanM = Math.max(1.0, 2.5 * odM);
  const ramForceKn = (4 * plasticMomentKnm) / dieSupportSpanM;
  const ramForceTon = ramForceKn / 9.80665;
  const machineClass = getBendingMachineClass(D, ramForceTon);

  const complianceChecks = [
    { key: 'tangent', label: 'Teğetler', pass: isTangentFeasible },
    { key: 'radius', label: 'Yarıçap', pass: isRadiusCompliant },
    { key: 'angle', label: 'Açı Kapasitesi', pass: isAngleWithinPipeCapacity },
    { key: 'geometry', label: 'Yay Boyu', pass: isGeometryFeasible },
    { key: 'wall', label: 'Cidar', pass: isWallThinningSafe },
    { key: 'ovality', label: 'Ovalite', pass: isOvalityCompliant },
    { key: 'seam', label: 'Dikiş', pass: isSeamSafe },
    { key: 'pull', label: 'Paso', pass: isPullAngleCompliant },
    { key: 'method2', label: 'Yöntem 2', pass: isMethod2Compliant },
    { key: 'ripple', label: 'Ripple', pass: isRippleCompliant },
    { key: 'girthWeld', label: 'Alın Kaynağı', pass: !state.girthWeldInBend || isGwOnPipe },
    { key: 'combinedStress', label: 'Bileşik Gerilme', pass: isCombinedStressCompliant },
    { key: 'clamping', label: 'Kalıp Sıkma Payı', pass: isClampingSafe },
    { key: 'machineForce', label: 'Makine Tonajı', pass: machineClass.isSufficient }
  ];
  const failedChecks = complianceChecks.filter(c => !c.pass);
  const overallPass = failedChecks.length === 0;
  
  return {
    stdCriteria,
    millTol,
    isMillTolSafe,
    t_min_required,
    maxAllowOvality,
    minMult,
    r_min_m,
    r_bend_m,
    isRadiusCompliant,
    l_arc_m,
    l_bent_m,
    l_t2_actual,
    theta_max_deg,
    isAngleWithinPipeCapacity,
    delta_t_thin,
    t_extrados,
    thinningPercent,
    delta_t_thick,
    t_intrados,
    t_min_design,
    isWallThinningSafe,
    wallMarginMm,
    wallMarginPercent,
    hoopStressMpa,
    hoopStressPercentSmys,
    longStressMpa,
    vonMisesStressMpa,
    allowableCombinedStressMpa,
    combinedStressRatioPercent,
    isCombinedStressCompliant,
    estimatedOvality,
    isOvalityCompliant,
    deltaID_mm,
    D_to_t,
    springbackDeg,
    springbackRatio,
    machineAngleDeg,
    isSeamSafe,
    maxAllowPullAngle,
    numPulls,
    manualPullsUsed,
    pullStartM,
    pullShiftM,
    isCentered,
    pullStepPitch,
    pullAnglePerStep,
    netAnglePerStep,
    isPullAngleCompliant,
    asmeMethod2Limit,
    actualDeflectionRatePerOD,
    actualDeflectionRatePerMeter,
    isMethod2Compliant,
    maxAllowRippleMm,
    estimatedRippleMm,
    isRippleCompliant,
    isGeometryFeasible,
    totalTangents,
    isTangentFeasible,
    minClampingLenM,
    isFrontClampingSafe,
    isRearClampingSafe,
    isClampingSafe,
    clampingStatusText,
    clampingWarningText,
    pullEndM,
    isGwOnPipe,
    isGwInArc,
    isGwInFrontTangent,
    isGwInRearTangent,
    girthWeldStatusText,
    girthWeldBadge,
    girthWeldClass,
    weightPerMeterKg,
    totalPipeWeightKg,
    totalPipeWeightTon,
    riggingSlingLoadKg,
    riggingSlingLoadTon,
    minRecommendedSlingSwlTon,
    T_temp,
    Z_p_mm3,
    plasticMomentKnm,
    dieSupportSpanM,
    ramForceKn,
    ramForceTon,
    machineClass,
    complianceChecks,
    failedChecks,
    overallPass,
    isOverallCompliant: overallPass
  };
}

/* ==========================================================================
   UI Update & DOM Rendering
   ========================================================================== */

function updateUI() {
  stopBendAnimation(false); // sidebar edits cancel the bend animation
  const calc = runCalculations();
  if (selectedPullIndex !== null && selectedPullIndex > calc.numPulls) {
    selectedPullIndex = calc.numPulls > 0 ? calc.numPulls : null;
  }
  
  // Standard badge (+ select sync so first paint matches state)
  if (dom.selStandard) {
    const hasStd = [...dom.selStandard.options].some(o => o.value === state.standard);
    if (hasStd) dom.selStandard.value = state.standard;
  }
  dom.standardDisplayBadge.textContent = calc.stdCriteria.badgeName;
  
  // Radius calculation display
  dom.inpCalculatedRadius.value = `${calc.r_bend_m.toFixed(2)} m (${state.radiusMultiplier} D)`;
  dom.badgeMaxAngleInfo.textContent = `Max: ~${calc.theta_max_deg.toFixed(1)}°`;

  // Compound 3D Bend Active Info Banner
  if (dom.compoundActiveInfo && dom.txtCompoundActiveInfo) {
    if (state.bendType === 'compound') {
      dom.compoundActiveInfo.style.display = 'block';
      const hStr = `${(state.compoundHoriAngle || 0).toFixed(1)}° (${state.compoundHoriDir === 'right' ? 'Sağ' : 'Sol'})`;
      const vStr = `${(state.compoundVertAngle || 0).toFixed(1)}° (${state.compoundVertDir === 'overbend' ? 'Tepe' : 'Vadi'})`;
      dom.txtCompoundActiveInfo.textContent = `🌐 3D Bileşik Büküm: Kalıp Roll Açısı: ${(state.compoundRollAngle || 0).toFixed(1)}° | Yatay: ${hStr} | Düşey: ${vStr}`;
    } else {
      dom.compoundActiveInfo.style.display = 'none';
    }
  }

  // Machine Die & Clamping Pin Clearance Helper
  if (dom.helperTangentClamping) {
    dom.helperTangentClamping.textContent = calc.clampingWarningText;
    dom.helperTangentClamping.className = `field-helper ${calc.isClampingSafe ? 'text-success' : 'text-danger'}`;
  }

  // Global GO / NO-GO verdict banner
  if (dom.masterVerdict) {
    const passed = calc.complianceChecks.length - calc.failedChecks.length;
    const total = calc.complianceChecks.length;
    dom.masterVerdict.className = `verdict-banner ${calc.overallPass ? 'pass' : 'fail'}`;
    if (dom.masterVerdictTitle) {
      dom.masterVerdictTitle.textContent = calc.overallPass
        ? 'GENEL HÜKÜM: KABUL — İmalata Uygun'
        : `GENEL HÜKÜM: RET — İmalata Uygun Değil (${calc.failedChecks.map(c => c.label).join(', ')})`;
    }
    if (dom.masterVerdictSub) {
      dom.masterVerdictSub.textContent = calc.overallPass
        ? `Tüm ${total} kontrol geçti | Makine: ${calc.machineAngleDeg.toFixed(2)}° | Yay: ${calc.l_bent_m.toFixed(2)}/${calc.l_arc_m.toFixed(2)}m`
        : `Kalan arka düzlük: ${calc.l_t2_actual.toFixed(2)}m | Makine yayı ${calc.l_bent_m.toFixed(2)}m / mevcut ${calc.l_arc_m.toFixed(2)}m`;
    }
    if (dom.masterVerdictCount) dom.masterVerdictCount.textContent = `${passed}/${total}`;
  }
  document.title = `${calc.overallPass ? 'KABUL' : 'RET'} • ColdBend Pro — Soğuk Büküm Hesap Motoru`;
  if (dom.btnToggleLabels) {
    dom.btnToggleLabels.textContent = state.showDimensions ? 'Ölçüleri Gizle' : 'Ölçüleri Göster';
    dom.btnToggleLabels.setAttribute('aria-pressed', String(state.showDimensions));
  }
  
  // KPI 1: R_min
  dom.kpiValRmin.innerHTML = `${calc.r_min_m.toFixed(2)} m <span class="kpi-sub">(${calc.minMult} D)</span>`;
  if (calc.isRadiusCompliant) {
    dom.kpiBadgeRmin.textContent = 'UYGUN';
    dom.kpiBadgeRmin.className = 'status-indicator pass';
    dom.kpiDescRmin.textContent = `Seçilen ${state.radiusMultiplier}D ≥ ${calc.minMult}D (${calc.stdCriteria.shortRef}) limitini karşılıyor.`;
  } else {
    dom.kpiBadgeRmin.textContent = 'RİSKLİ / YETERSİZ';
    dom.kpiBadgeRmin.className = 'status-indicator fail';
    dom.kpiDescRmin.textContent = `Seçilen ${state.radiusMultiplier}D < ${calc.minMult}D (${calc.stdCriteria.shortRef}) limitinin altında!`;
  }
  
  // KPI 2: Theta Max (hedef + makine açısı yay uyumu birlikte)
  dom.kpiValThetaMax.textContent = `${calc.theta_max_deg.toFixed(2)}°`;
  if (!calc.isTangentFeasible) {
    dom.kpiBadgeTheta.textContent = 'TEĞET HATASI!';
    dom.kpiBadgeTheta.className = 'status-indicator fail';
    dom.kpiDescTheta.textContent = `Lt1 (${state.tangent1.toFixed(1)}m) + Lt2 (${state.tangent2.toFixed(1)}m) = ${calc.totalTangents.toFixed(1)}m ≥ boru boyu ${state.length.toFixed(1)}m — büküm yayı kalmıyor!`;
  } else if (!calc.isAngleWithinPipeCapacity) {
    dom.kpiBadgeTheta.textContent = 'BORU AŞIMI!';
    dom.kpiBadgeTheta.className = 'status-indicator fail';
    dom.kpiDescTheta.textContent = `Hedef açı (${state.targetAngle.toFixed(1)}°) tek boru kapasitesini (${calc.theta_max_deg.toFixed(1)}°) aşıyor!`;
  } else if (!calc.isGeometryFeasible) {
    dom.kpiBadgeTheta.textContent = 'YAY YETERSİZ!';
    dom.kpiBadgeTheta.className = 'status-indicator fail';
    dom.kpiDescTheta.textContent = `Makine açısı ${calc.machineAngleDeg.toFixed(1)}° için ${calc.l_bent_m.toFixed(2)}m yay gerekli, mevcut ${calc.l_arc_m.toFixed(2)}m (kalan arka: ${calc.l_t2_actual.toFixed(2)}m)`;
  } else {
    dom.kpiBadgeTheta.textContent = 'KAPASİTE DAHİLİ';
    dom.kpiBadgeTheta.className = 'status-indicator pass';
    dom.kpiDescTheta.textContent = `Hedef: ${state.targetAngle.toFixed(1)}° ≤ Maks: ${calc.theta_max_deg.toFixed(1)}° | Makine: ${calc.machineAngleDeg.toFixed(1)}° | Yay: ${calc.l_bent_m.toFixed(2)}/${calc.l_arc_m.toFixed(2)}m`;
  }
  
  // KPI 3: Wall Thinning
  dom.kpiValThinning.innerHTML = `${calc.delta_t_thin.toFixed(2)} mm <span class="kpi-sub">(%${calc.thinningPercent.toFixed(2)})</span>`;
  if (calc.isWallThinningSafe) {
    dom.kpiBadgeThin.textContent = calc.stdCriteria.enforceMillTolThinning ? 'BOTAŞ / API 5L UYGUN' : 'GÜVENLİ';
    dom.kpiBadgeThin.className = 'status-indicator pass';
    dom.kpiDescThin.textContent = calc.stdCriteria.enforceMillTolThinning
      ? `Kalan: ${calc.t_extrados.toFixed(2)} mm ≥ t_min+Δt_mill: ${calc.t_min_required.toFixed(2)} mm (Üretim Tol: -${calc.millTol.minusTolMm.toFixed(2)} mm)`
      : `Kalan: ${calc.t_extrados.toFixed(2)} mm ≥ t_min: ${calc.t_min_design.toFixed(2)} mm`;
  } else {
    dom.kpiBadgeThin.textContent = calc.stdCriteria.enforceMillTolThinning ? 'BOTAŞ TOLERANS AŞIMI' : 'RİSKLİ (t < t_min)';
    dom.kpiBadgeThin.className = 'status-indicator fail';
    dom.kpiDescThin.textContent = calc.stdCriteria.enforceMillTolThinning
      ? `Kalan (${calc.t_extrados.toFixed(2)}mm) < t_min+Δt_mill (${calc.t_min_required.toFixed(2)}mm) [API 5L Tol: -${calc.millTol.minusTolMm.toFixed(2)}mm]!`
      : `Kalan cidar (${calc.t_extrados.toFixed(2)}mm), t_min (${calc.t_min_design.toFixed(2)}mm) altına iniyor!`;
  }
  
  // KPI 4: Ovality
  const ovLimitStr = calc.maxAllowOvality.toFixed(1);
  dom.kpiValOvality.textContent = `%${calc.estimatedOvality.toFixed(2)}`;
  if (calc.isOvalityCompliant) {
    dom.kpiBadgeOvality.textContent = `ILI UYGUN (≤ %${ovLimitStr})`;
    dom.kpiBadgeOvality.className = 'status-indicator pass';
    dom.kpiDescOvality.textContent = `Akıllı pig (ILI) geçiş kriteri (≤ %${calc.maxAllowOvality.toFixed(2)}) sağlandı.`;
  } else {
    dom.kpiBadgeOvality.textContent = `PİG RİSKİ (> %${ovLimitStr})`;
    dom.kpiBadgeOvality.className = 'status-indicator fail';
    dom.kpiDescOvality.textContent = `Ovalleşme %${calc.maxAllowOvality.toFixed(2)} (${calc.stdCriteria.shortRef}) sınırını aşıyor!`;
  }
  
  // KPI 5: Springback & Machine Angle
  dom.kpiValMachineAngle.textContent = `${calc.machineAngleDeg.toFixed(2)}°`;
  dom.kpiDescSpringback.textContent = `Hedef: ${state.targetAngle.toFixed(2)}° + Geri Yaylanma: ${calc.springbackDeg.toFixed(2)}°`;
  
  // Verification Matrix Card Updates
  dom.matValTnom.textContent = calc.stdCriteria.enforceMillTolThinning
    ? `${state.t_nom.toFixed(2)} mm (API 5L Tol: -${calc.millTol.minusTolMm.toFixed(2)} mm)`
    : `${state.t_nom.toFixed(2)} mm`;
  dom.matValDeltaThin.textContent = calc.stdCriteria.enforceMillTolThinning
    ? `${calc.delta_t_thin.toFixed(2)} mm (%${calc.thinningPercent.toFixed(2)}) [Limit ≤ ${calc.millTol.minusTolMm.toFixed(2)} mm]`
    : `${calc.delta_t_thin.toFixed(2)} mm (%${calc.thinningPercent.toFixed(2)})`;
  dom.matValTextrados.textContent = `${calc.t_extrados.toFixed(2)} mm`;
  dom.matValTextrados.className = calc.isWallThinningSafe ? 'text-success' : 'text-danger';
  dom.matValTminDesign.textContent = calc.stdCriteria.enforceMillTolThinning
    ? `${calc.t_min_design.toFixed(2)} mm (Tol. Dahil Gerekli: ${calc.t_min_required.toFixed(2)} mm)`
    : `${calc.t_min_design.toFixed(2)} mm`;
  dom.matValMargin.textContent = `${calc.wallMarginMm >= 0 ? '+' : ''}${calc.wallMarginMm.toFixed(2)} mm (%${calc.wallMarginPercent.toFixed(1)})`;
  dom.matValMargin.className = calc.wallMarginMm >= 0 ? 'text-success' : 'text-danger';
  dom.badgeThinningMatrix.textContent = calc.isWallThinningSafe ? 'PASS' : 'FAIL';
  dom.badgeThinningMatrix.className = `badge-pill ${calc.isWallThinningSafe ? 'pass' : 'fail'}`;
  
  // Ovality Matrix
  dom.matValOvality.textContent = `%${calc.estimatedOvality.toFixed(2)}`;
  if (dom.matValOvalityLimit) {
    dom.matValOvalityLimit.textContent = calc.stdCriteria.ovalityRefText;
  }
  dom.matValDeltaID.textContent = `~${calc.deltaID_mm.toFixed(1)} mm`;
  dom.matValDtoT.textContent = `${calc.D_to_t.toFixed(1)} (${calc.D_to_t > 30 ? 'Mandrel Zorunlu' : 'Standart'})`;
  if (state.useMandrel) {
    dom.matValMandrelStatus.textContent = 'İç Hidrolik Mandrel Devrede';
    dom.matValMandrelStatus.className = 'text-success';
  } else {
    dom.matValMandrelStatus.textContent = calc.D_to_t > 30 ? 'DİKKAT: Mandrelsiz Büküm Riski!' : 'Mandrelsiz Uygulanabilir';
    dom.matValMandrelStatus.className = calc.D_to_t > 30 ? 'text-danger' : 'text-warning';
  }
  dom.badgeOvalityMatrix.textContent = calc.isOvalityCompliant ? 'PASS' : 'FAIL';
  dom.badgeOvalityMatrix.className = `badge-pill ${calc.isOvalityCompliant ? 'pass' : 'fail'}`;
  
  // Seam & Clock Position Safety Box Updates
  const clockCheck = validateClockSafety(state.bendType, state.clockPos, state.seamAngle);
  if (dom.badgeClockSafety) {
    dom.badgeClockSafety.textContent = clockCheck.badgeText;
    dom.badgeClockSafety.className = `badge-mini ${clockCheck.badgeClass}`;
  }
  if (dom.lblClockDeg) dom.lblClockDeg.textContent = clockCheck.lblClock;
  if (dom.clockSafetyText) dom.clockSafetyText.textContent = clockCheck.desc;
  if (dom.clockSafetyBox) {
    dom.clockSafetyBox.className = `clock-safety-box ${clockCheck.boxClass}`;
  }

  // Seam & Springback Matrix
  dom.matValSeamAngle.textContent = `${clockCheck.lblClock} - ${calc.isSeamSafe ? '(Nötr Eksen Dahili)' : '(AŞIRI GERİLME RİSKİ!)'}`;
  dom.matValSpringbackAngle.textContent = `${calc.springbackDeg.toFixed(2)}° (%${((calc.springbackDeg / state.targetAngle) * 100).toFixed(1)})`;
  dom.matValMachineAngleSet.textContent = `${calc.machineAngleDeg.toFixed(2)}°`;
  if (calc.isSeamSafe) {
    dom.matValSeamRisk.textContent = 'MİNİMUM (Güvenli Nötr Hat)';
    dom.matValSeamRisk.className = 'text-success';
    dom.badgeSeamMatrix.textContent = 'UYGUN';
    dom.badgeSeamMatrix.className = 'badge-pill pass';
  } else {
    dom.matValSeamRisk.textContent = 'RİSKLİ (Çekme/Basma Yırtılma Tehlikesi)';
    dom.matValSeamRisk.className = 'text-danger';
    dom.badgeSeamMatrix.textContent = 'HATA';
    dom.badgeSeamMatrix.className = 'badge-pill fail';
  }
  
  // Ripple & Method 2 Rate Matrix
  if (dom.matValDeflectionRate) {
    dom.matValDeflectionRate.textContent = `${calc.actualDeflectionRatePerOD.toFixed(2)}° / D`;
    dom.matValDeflectionLimit.textContent = `≤ ${calc.asmeMethod2Limit.toFixed(2)}° / D (${calc.stdCriteria.method2RefText})`;
    dom.matValRatePerMeter.textContent = `~${calc.actualDeflectionRatePerMeter.toFixed(2)}° / m`;
    dom.matValRippleHeight.textContent = `~${calc.estimatedRippleMm.toFixed(1)} mm`;
    dom.matValRippleHeight.className = calc.isRippleCompliant ? 'text-success' : 'text-danger';
    dom.matValRippleLimit.textContent = `≤ ${calc.maxAllowRippleMm.toFixed(2)} mm (${calc.stdCriteria.rippleRefText})`;
    const isMatrix4Pass = calc.isMethod2Compliant && calc.isRippleCompliant;
    dom.badgeRippleMatrix.textContent = isMatrix4Pass ? 'PASS' : 'FAIL';
    dom.badgeRippleMatrix.className = `badge-pill ${isMatrix4Pass ? 'pass' : 'fail'}`;
  }

  // ASME B31.8 Md. 833 / B31.4 Md. 402.3 Combined Stress & Von Mises Matrix
  if (dom.matValHoopStress) {
    dom.matValHoopStress.textContent = `${calc.hoopStressMpa.toFixed(1)} MPa (%${calc.hoopStressPercentSmys.toFixed(1)} SMYS)`;
    dom.matValLongStress.textContent = `${calc.longStressMpa.toFixed(1)} MPa`;
    dom.matValVonMises.textContent = `${calc.vonMisesStressMpa.toFixed(1)} MPa`;
    dom.matValAllowCombined.textContent = `≤ ${calc.allowableCombinedStressMpa.toFixed(1)} MPa (%90 SMYS·T)`;
    dom.matValStressRatio.textContent = `%${calc.combinedStressRatioPercent.toFixed(1)} (${calc.isCombinedStressCompliant ? 'KABUL' : 'LİMİT AŞIMI'})`;
    dom.matValStressRatio.className = calc.isCombinedStressCompliant ? 'text-success' : 'text-danger';
    if (dom.badgeCombinedStressMatrix) {
      dom.badgeCombinedStressMatrix.textContent = calc.isCombinedStressCompliant ? 'PASS' : 'FAIL';
      dom.badgeCombinedStressMatrix.className = `badge-pill ${calc.isCombinedStressCompliant ? 'pass' : 'fail'}`;
    }
  }

  // Matrix Card 6: Bending Machine Ram Force & Plastic Moment
  if (dom.matValPlasticSectionMod) {
    const zpExp = (calc.Z_p_mm3 / 1e6).toFixed(2);
    dom.matValPlasticSectionMod.textContent = `${zpExp} × 10⁶ mm³`;
    dom.matValPlasticMoment.textContent = `${Math.round(calc.plasticMomentKnm).toLocaleString('tr-TR')} kNm`;
    dom.matValRamForceKn.textContent = `${Math.round(calc.ramForceKn).toLocaleString('tr-TR')} kN (~${Math.round(calc.ramForceTon).toLocaleString('tr-TR')} Ton)`;
    dom.matValMachineClass.textContent = calc.machineClass.modelName;
    dom.matValMachineStatus.textContent = calc.machineClass.statusText;
    dom.matValMachineStatus.className = calc.machineClass.isSufficient ? 'text-success' : 'text-danger';
    if (dom.badgeMachineForceMatrix) {
      dom.badgeMachineForceMatrix.textContent = calc.machineClass.isSufficient ? 'UYGUN' : 'AŞIM';
      dom.badgeMachineForceMatrix.className = `badge-pill ${calc.machineClass.isSufficient ? 'pass' : 'fail'}`;
    }
  }

  // Girth Weld Group & Dynamic Status
  if (dom.chkGirthWeld) dom.chkGirthWeld.checked = state.girthWeldInBend;
  if (dom.groupGirthWeldDist) {
    dom.groupGirthWeldDist.style.display = state.girthWeldInBend ? 'block' : 'none';
  }
  if (dom.inpGirthWeldDist && document.activeElement !== dom.inpGirthWeldDist) {
    dom.inpGirthWeldDist.value = state.girthWeldDist;
  }
  if (dom.girthWeldStatusAlert) {
    if (!state.girthWeldInBend) {
      dom.girthWeldStatusAlert.textContent = '';
      dom.girthWeldStatusAlert.className = 'field-helper';
    } else {
      dom.girthWeldStatusAlert.textContent = calc.girthWeldStatusText;
      dom.girthWeldStatusAlert.className = 'field-helper ' + (calc.isGwInArc ? 'text-warning' : (calc.isGwOnPipe ? 'text-success' : 'text-danger'));
    }
  }

  // Pipe Weight & Rigging Safety Box Updates
  if (dom.badgePipeWeightUnit) dom.badgePipeWeightUnit.textContent = `${calc.weightPerMeterKg.toFixed(1)} kg/m`;
  if (dom.valTotalPipeWeight) dom.valTotalPipeWeight.textContent = `${calc.totalPipeWeightTon.toFixed(2)} Ton (${Math.round(calc.totalPipeWeightKg).toLocaleString('tr-TR')} kg)`;
  if (dom.valRiggingSlingLoad) dom.valRiggingSlingLoad.textContent = `~${calc.riggingSlingLoadTon.toFixed(2)} Ton / Sapan`;

  // Temperature Derating Factor (ASME B31.8 Tablo 841.1.8-1)
  const T_factor = calc.T_temp;
  if (dom.inpDesignTemp && document.activeElement !== dom.inpDesignTemp) {
    dom.inpDesignTemp.value = state.designTemp;
  }
  if (dom.badgeTempDerating) {
    if (T_factor >= 0.999) {
      dom.badgeTempDerating.textContent = `T = 1.000 (${state.designTemp.toFixed(0)}°C • Azaltma Yok)`;
      dom.badgeTempDerating.className = 'badge-mini pass';
    } else {
      dom.badgeTempDerating.textContent = `T = ${T_factor.toFixed(3)} (${state.designTemp.toFixed(0)}°C • SMYS %${((1 - T_factor) * 100).toFixed(1)} Azaltıldı)`;
      dom.badgeTempDerating.className = 'badge-mini warn';
    }
  }
  if (dom.helperTempDerating) {
    if (state.designTemp <= 121.1) {
      dom.helperTempDerating.textContent = `ASME B31.8 Tablo 841.1.8-1: ≤ 121°C (250°F) için T = 1.000. Tam akma dayanımı (SMYS = ${state.smys} MPa) geçerlidir.`;
    } else {
      const sEff = Math.round(state.smys * T_factor);
      dom.helperTempDerating.textContent = `ASME B31.8 Tablo 841.1.8-1: ${state.designTemp.toFixed(0)}°C sıcaklıkta efektif akma dayanımı S_eff = ${sEff} MPa (${state.smys} MPa'dan düşürüldü). Gerekli t_min: ${calc.t_min_design.toFixed(2)} mm.`;
    }
  }

  // Method-2 schematic with live values
  renderMethod2Sketch(calc);
  
  // Populate Hydraulic Pulls Table
  renderPullsTable(calc);
  
  // Update Printable Card Data
  updatePrintableCard(calc);

  // Update As-Built & Site QC Evaluation
  updateAsBuiltUI(calc);
  
  // Re-render 2D Dynamic Sketch
  render2DSketch(calc);
  
  // Re-render 3D WebGL Pipe
  update3DPipe(calc);

  // Persist inputs (debounced; theme has its own key)
  scheduleSave();
}

/* ==========================================================================
   Method-2 Schematic (ASME 841.2.3-1: deflection per diameter)
   Illustrative, not to scale — labels carry the live values.
   ========================================================================== */

function renderMethod2Sketch(calc) {
  if (!dom.svgMethod2Group) dom.svgMethod2Group = document.getElementById('svgMethod2Group');
  const g = dom.svgMethod2Group;
  if (!g) return;
  const pass = calc.isMethod2Compliant;
  const verdictColor = pass ? '#10b981' : '#ef4444';
  const mono = "font-family:'JetBrains Mono',monospace";
  const a = (22 * Math.PI) / 180; // fixed readable sweep; live numbers in labels
  const ox = 52, oy = 18, r = 104;
  const ax = ox, ay = oy + r;
  const bx = ox + r * Math.sin(a), by = oy + r * Math.cos(a);
  const wx = ox + 26 * Math.sin(a), wy = oy + 26 * Math.cos(a);
  const f = (n) => n.toFixed(1);
  g.innerHTML =
    `<line x1="${ox}" y1="${oy}" x2="${ax}" y2="${ay}" stroke="#64748b" stroke-width="1" stroke-dasharray="3,3"/>` +
    `<line x1="${ox}" y1="${oy}" x2="${f(bx)}" y2="${f(by)}" stroke="#64748b" stroke-width="1" stroke-dasharray="3,3"/>` +
    `<path d="M ${ax} ${ay} A ${r} ${r} 0 0 0 ${f(bx)} ${f(by)}" fill="none" stroke="#0284c7" stroke-width="3.5"/>` +
    `<path d="M ${ox} ${oy + 26} A 26 26 0 0 0 ${f(wx)} ${f(wy)}" fill="none" stroke="#d97706" stroke-width="2"/>` +
    `<line x1="${ax}" y1="${ay}" x2="${f(bx)}" y2="${f(by)}" stroke="#d97706" stroke-width="1" stroke-dasharray="4,3"/>` +
    `<circle cx="${ox}" cy="${oy}" r="3.5" fill="#10b981"/>` +
    `<text x="${ox + 6}" y="${oy + 5}" font-size="10" style="fill:var(--text-muted);${mono};">O</text>` +
    `<text x="64" y="34" font-size="11" font-weight="bold" style="fill:#d97706;${mono};">θ</text>` +
    `<text x="150" y="62" font-size="11" style="fill:var(--text-main);${mono};">fiili θ = ${calc.actualDeflectionRatePerOD.toFixed(2)}°/D</text>` +
    `<text x="150" y="82" font-size="11" style="fill:var(--text-muted);${mono};">limit ≤ ${calc.asmeMethod2Limit.toFixed(1)}°/D</text>` +
    `<text x="150" y="106" font-size="12" font-weight="bold" style="fill:${verdictColor};${mono};">${pass ? 'PASS ✓' : 'RET ✗'} (Yöntem 2)</text>` +
    `<text x="${f((ax + bx) / 2 - 40)}" y="${f((ay + by) / 2 + 24)}" font-size="10" style="fill:var(--text-muted);${mono};">yay = 1D (${state.od.toFixed(0)} mm)</text>` +
    `<text x="${f(ox + 30)}" y="${f(oy + 64)}" font-size="10" style="fill:var(--text-muted);${mono};">R = ${calc.r_bend_m.toFixed(1)} m</text>`;
}

/* ==========================================================================
   Fabrication Pull Steps Table Rendering (ASME Standards)
   & Step-by-Step Operator Inspector
   ========================================================================== */

let selectedPullIndex = null;

function selectPull(k) {
  const calc = runCalculations();
  if (k === null || k === undefined || calc.numPulls <= 0) {
    selectedPullIndex = null;
  } else {
    selectedPullIndex = Math.max(1, Math.min(calc.numPulls, Math.round(Number(k))));
  }

  // Update operator inspector badge and nav buttons
  if (dom.badgeActivePull) {
    if (selectedPullIndex !== null) {
      dom.badgeActivePull.textContent = `Paso #${selectedPullIndex}/${calc.numPulls}`;
      dom.badgeActivePull.classList.add('active');
    } else {
      dom.badgeActivePull.textContent = `Tüm Pasolar (${calc.numPulls})`;
      dom.badgeActivePull.classList.remove('active');
    }
  }
  if (dom.btnPrevPull) {
    dom.btnPrevPull.disabled = selectedPullIndex === null || selectedPullIndex <= 1;
  }
  if (dom.btnNextPull) {
    dom.btnNextPull.disabled = selectedPullIndex !== null && selectedPullIndex >= calc.numPulls;
  }

  // Highlight selected row in table and scroll into view
  if (dom.tbodyPulls) {
    const rows = dom.tbodyPulls.querySelectorAll('tr');
    rows.forEach((tr) => {
      const step = Number(tr.dataset.step);
      if (selectedPullIndex !== null && step === selectedPullIndex) {
        tr.classList.add('selected-pull-row');
        tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        tr.classList.remove('selected-pull-row');
      }
    });
  }

  // Synchronize 2D CAD and 3D pipe models
  render2DSketch(calc);
  update3DPipe(calc);
}

function renderPullsTable(calc) {
  dom.tbodyPulls.innerHTML = '';
  const modeNote = `${calc.manualPullsUsed ? ' (manuel adet)' : ''}${calc.isCentered ? ' (ortalı)' : ''}`;
  dom.pullSummaryPill.textContent = `Toplam ${calc.numPulls} Paso${modeNote} • İlerleme: ${(calc.pullStepPitch * 1000).toFixed(0)} mm • ~${calc.pullAnglePerStep.toFixed(2)}°/Paso • Büküm Boyu: ${calc.l_bent_m.toFixed(2)} m (Kalan Arka Düzlük: ${calc.l_t2_actual.toFixed(2)} m)`;

  if (selectedPullIndex !== null && (selectedPullIndex > calc.numPulls || calc.numPulls === 0)) {
    selectedPullIndex = calc.numPulls > 0 ? calc.numPulls : null;
  }

  if (dom.badgeActivePull) {
    if (selectedPullIndex !== null) {
      dom.badgeActivePull.textContent = `Paso #${selectedPullIndex}/${calc.numPulls}`;
      dom.badgeActivePull.classList.add('active');
    } else {
      dom.badgeActivePull.textContent = `Tüm Pasolar (${calc.numPulls})`;
      dom.badgeActivePull.classList.remove('active');
    }
  }
  if (dom.btnPrevPull) {
    dom.btnPrevPull.disabled = selectedPullIndex === null || selectedPullIndex <= 1;
  }
  if (dom.btnNextPull) {
    dom.btnNextPull.disabled = selectedPullIndex !== null && selectedPullIndex >= calc.numPulls;
  }

  // Starting die advance from the pull start (centered when Lt1 == Lt2)
  let currentPos = calc.pullStartM;
  let cumMachAngle = 0;
  let cumNetAngle = 0;
  
  for (let i = 1; i <= calc.numPulls; i++) {
    currentPos += calc.pullStepPitch;
    cumMachAngle += calc.pullAnglePerStep;
    cumNetAngle += calc.netAnglePerStep;
    
    const tr = document.createElement('tr');
    tr.dataset.step = String(i);
    if (selectedPullIndex === i) {
      tr.classList.add('selected-pull-row');
    }
    tr.style.cursor = 'pointer';
    tr.setAttribute('title', `Paso #${i} istasyonunu vurgula ve odaklan`);
    tr.addEventListener('click', () => {
      selectPull(selectedPullIndex === i ? null : i);
    });

    tr.innerHTML = `
      <td><strong>Paso #${i}</strong></td>
      <td><strong class="text-primary">${currentPos.toFixed(3)} m</strong></td>
      <td>${(calc.pullStepPitch * 1000).toFixed(0)} mm</td>
      <td class="text-info">+${calc.pullAnglePerStep.toFixed(2)}°</td>
      <td><strong>${cumMachAngle.toFixed(2)}°</strong></td>
      <td class="text-success">${cumNetAngle.toFixed(2)}°</td>
      <td><span class="${state.useMandrel ? 'text-success' : 'text-warning'}">${state.useMandrel ? 'Kilitli (Mandrel Devrede)' : 'Mandrelsiz Pres'}</span></td>
      <td><span class="badge-mini ${calc.isPullAngleCompliant ? '' : 'fail'}">${calc.isPullAngleCompliant ? 'PASS (≤ ' + calc.maxAllowPullAngle.toFixed(1) + '°)' : 'UYARI: > ' + calc.maxAllowPullAngle.toFixed(1) + '°'}</span></td>
    `;
    dom.tbodyPulls.appendChild(tr);
  }
}

/* ==========================================================================
   Pulls Data Export Engine (Excel CSV & JSON)
   ========================================================================== */

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportPullsToCSV(calc) {
  if (!calc) calc = runCalculations();
  const safePipeNo = (state.pipeNo || 'Boru').toString().replace(/[^a-zA-Z0-9_\-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `ColdBend_Paso_Raporu_${safePipeNo}_${dateStr}.csv`;

  const rows = [];
  // Excel delimiter hint
  rows.push('sep=;');
  // Header metadata block
  rows.push(['# ColdBend Pro — Saha Soğuk Büküm & QC İmalat Föyü', '', '', '', '', '', '', ''].join(';'));
  rows.push(['Rapor Tarihi', new Date().toLocaleString('tr-TR'), '', 'Standart', state.standard, '', '', ''].join(';'));
  rows.push(['Proje Adı', state.projectName || '-', '', 'Hat / Kesim', state.lineSection || '-', '', '', ''].join(';'));
  rows.push(['Boru No', state.pipeNo || '-', '', 'Heat / Döküm No', state.heatNo || '-', '', '', ''].join(';'));
  rows.push(['Nominal Dış Çap (OD)', `${state.od} mm`, '', 'Et Kalınlığı (WT)', `${state.t_nom} mm`, '', '', ''].join(';'));
  rows.push(['Korozyon Payı (CA)', `${state.ca} mm`, '', 'Çelik Kalitesi', `${state.gradeName || 'API 5L'} (SMYS: ${state.smys} MPa)`, '', '', ''].join(';'));
  const bendTypeCsv = state.bendType === 'compound'
    ? `3D Bileşik Büküm (Roll: ${(state.compoundRollAngle || 0).toFixed(1)}°, Yatay: ${(state.compoundHoriAngle || 0).toFixed(2)}°, Düşey: ${(state.compoundVertAngle || 0).toFixed(2)}°)`
    : state.bendType;
  rows.push(['Büküm Tipi', bendTypeCsv, '', 'Kaynak Dikiş Yönü', `${state.clockPos} Saat (${state.seamAngle}°)`, '', '', ''].join(';'));
  rows.push(['Hedef Büküm Açısı', `${state.targetAngle.toFixed(2)}°`, '', 'Elastik Geri Yaylanma', `${calc.springbackDeg.toFixed(2)}°`, '', '', ''].join(';'));
  rows.push(['Hidrolik Makine Açısı', `${calc.machineAngleDeg.toFixed(2)}°`, '', 'Büküm Yarıçapı (R)', `${calc.r_bend_m.toFixed(2)} m (${state.radiusMultiplier}D)`, '', '', ''].join(';'));
  rows.push(['Toplam Boru Boyu', `${state.length.toFixed(2)} m`, '', 'Büküm Yayı Boyu', `${calc.l_bent_m.toFixed(2)} m`, '', '', ''].join(';'));
  rows.push(['Birim Boru Ağırlığı', `${calc.weightPerMeterKg.toFixed(1)} kg/m`, '', 'Toplam Boru Ağırlığı', `${calc.totalPipeWeightTon.toFixed(2)} Ton (${Math.round(calc.totalPipeWeightKg)} kg)`, '', '', ''].join(';'));
  rows.push(['Rigging Sapan Yükü', `~${calc.riggingSlingLoadTon.toFixed(2)} Ton / Sapan`, '', 'Önerilen Min. Sapan SWL', `${calc.minRecommendedSlingSwlTon.toFixed(2)} Ton (DAF=1.25)`, '', '', ''].join(';'));
  rows.push(['Ön Düzlük (Lt1)', `${state.tangent1.toFixed(2)} m (Min: ${calc.minClampingLenM.toFixed(2)} m)`, '', 'Arka Düzlük (Lt2)', `${calc.l_t2_actual.toFixed(2)} m (${calc.isClampingSafe ? 'KABUL' : 'RET'})`, '', '', ''].join(';'));
  rows.push(['Büküm Başlangıcı (PC)', `${calc.pullStartM.toFixed(3)} m`, '', 'Büküm Bitişi (PT)', `${calc.pullEndM.toFixed(3)} m`, '', '', ''].join(';'));
  rows.push(['Toplam Paso Sayısı', `${calc.numPulls}`, '', 'Paso Başı İlerleme', `${(calc.pullStepPitch * 1000).toFixed(0)} mm`, '', '', ''].join(';'));
  rows.push(['İç Mandrel Durumu', state.useMandrel ? 'Kilitli (Mandrel Devrede)' : 'Mandrelsiz Pres', '', 'Tasarım Basıncı / Sıcaklık', `${state.designPressure} bar / ${state.designTemp}°C (F=${state.designFactor}, T=${calc.T_temp.toFixed(3)})`, '', '', ''].join(';'));
  const csvMinWallNote = calc.stdCriteria.enforceMillTolThinning
    ? `${calc.t_extrados.toFixed(2)} mm (Min Tasarım: ${calc.t_min_design.toFixed(2)} mm, API 5L Üretim Tol: -${calc.millTol.minusTolMm.toFixed(2)} mm, Gerekli: ${calc.t_min_required.toFixed(2)} mm)`
    : `${calc.t_extrados.toFixed(2)} mm (Min: ${calc.t_min_design.toFixed(2)} mm)`;
  rows.push(['Cidar İncelmesi', `%${calc.thinningPercent.toFixed(2)} (${calc.delta_t_thin.toFixed(2)} mm)`, '', 'Kalan Et Kalınlığı', csvMinWallNote, '', '', ''].join(';'));
  rows.push(['Ovalleşme', `%${calc.estimatedOvality.toFixed(2)} (Limit: ≤ ${calc.maxAllowOvality.toFixed(2)}%)`, '', 'Ondülasyon (Ripple)', `${calc.estimatedRippleMm.toFixed(2)} mm (Limit: ≤ ${calc.maxAllowRippleMm.toFixed(2)} mm / %${calc.stdCriteria.maxAllowRipplePct.toFixed(1)} D)`, '', '', ''].join(';'));
  rows.push(['Birim Çap Başına Açı', `${calc.actualDeflectionRatePerOD.toFixed(2)}°/D (Limit: ≤ ${calc.asmeMethod2Limit.toFixed(2)}°/D)`, '', 'Alın Kaynağı', calc.girthWeldBadge || 'YOK', '', '', ''].join(';'));
  rows.push(['Bileşik Gerilme (Von Mises)', `${calc.vonMisesStressMpa.toFixed(1)} MPa (Limit: ≤ ${calc.allowableCombinedStressMpa.toFixed(1)} MPa)`, '', 'Gerilme Kullanım Oranı', `%${calc.combinedStressRatioPercent.toFixed(1)} (${calc.isCombinedStressCompliant ? 'KABUL' : 'RET'})`, '', '', ''].join(';'));
  rows.push(['Plastik Moment (Mp)', `${calc.plasticMomentKnm.toFixed(1)} kNm`, '', 'Tahmini Ram Kuvveti (Fram)', `${calc.ramForceKn.toFixed(0)} kN (~${calc.ramForceTon.toFixed(1)} Ton)`, '', '', ''].join(';'));
  rows.push(['Önerilen Büküm Makinesi', `${calc.machineClass.modelName} (%${calc.machineClass.utilPercent} Kullanım - ${calc.machineClass.isSufficient ? 'KABUL' : 'RET'})`, '', 'Kalıp Mesnet Açıklığı', `${calc.dieSupportSpanM.toFixed(2)} m (~2.5D)`, '', '', ''].join(';'));
  rows.push(['GENEL HÜKÜM', calc.overallPass ? 'UYGUN (KABUL)' : 'RET (KUSURLU)', '', '', '', '', '', ''].join(';'));
  rows.push('');
  // Pulls Table Header
  rows.push(['Paso #', 'Boru Başı Mesafesi (m)', 'Kalıp İlerlemesi (mm)', 'Paso Açısı (°/Paso)', 'Kümülatif Makine Açısı (°)', 'Kümülatif Net Açı (°)', 'Pres / Mandrel Durumu', 'Standart Limiti'].join(';'));

  let currentPos = calc.pullStartM;
  let cumMachAngle = 0;
  let cumNetAngle = 0;

  for (let i = 1; i <= calc.numPulls; i++) {
    currentPos += calc.pullStepPitch;
    cumMachAngle += calc.pullAnglePerStep;
    cumNetAngle += calc.netAnglePerStep;

    rows.push([
      `Paso #${i}`,
      currentPos.toFixed(3),
      (calc.pullStepPitch * 1000).toFixed(0),
      `+${calc.pullAnglePerStep.toFixed(2)}°`,
      `${cumMachAngle.toFixed(2)}°`,
      `${cumNetAngle.toFixed(2)}°`,
      state.useMandrel ? 'Kilitli (Mandrel Devrede)' : 'Mandrelsiz Pres',
      calc.isPullAngleCompliant ? `PASS (≤ ${calc.maxAllowPullAngle.toFixed(1)}°)` : `UYARI: > ${calc.maxAllowPullAngle.toFixed(1)}°`
    ].join(';'));
  }

  // Prepend UTF-8 BOM so Excel opens Turkish characters correctly
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

function exportPullsToJSON(calc) {
  if (!calc) calc = runCalculations();
  const safePipeNo = (state.pipeNo || 'Boru').toString().replace(/[^a-zA-Z0-9_\-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `ColdBend_Bukum_Verisi_${safePipeNo}_${dateStr}.json`;

  const pullsList = [];
  let currentPos = calc.pullStartM;
  let cumMachAngle = 0;
  let cumNetAngle = 0;

  for (let i = 1; i <= calc.numPulls; i++) {
    currentPos += calc.pullStepPitch;
    cumMachAngle += calc.pullAnglePerStep;
    cumNetAngle += calc.netAnglePerStep;

    pullsList.push({
      step: i,
      positionFromPipeStart_m: Number(currentPos.toFixed(3)),
      dieAdvance_mm: Math.round(calc.pullStepPitch * 1000),
      stepAngle_deg: Number(calc.pullAnglePerStep.toFixed(2)),
      cumulativeMachineAngle_deg: Number(cumMachAngle.toFixed(2)),
      cumulativeNetAngle_deg: Number(cumNetAngle.toFixed(2)),
      mandrelStatus: state.useMandrel ? 'Kilitli (Mandrel Devrede)' : 'Mandrelsiz Pres',
      isCompliant: calc.isPullAngleCompliant,
      maxAllowableAngle_deg: calc.maxAllowPullAngle
    });
  }

  const exportData = {
    application: 'ColdBend Pro',
    version: APP_VERSION,
    exportDate: new Date().toISOString(),
    project: {
      name: state.projectName || '',
      lineSection: state.lineSection || '',
      chainageKP: state.chainageKP || '',
      pipeNo: state.pipeNo || '',
      heatNo: state.heatNo || '',
      reportNo: state.reportNo || ''
    },
    pipeSpecifications: {
      standard: state.standard,
      outerDiameter_mm: state.od,
      nominalWallThickness_mm: state.t_nom,
      corrosionAllowance_mm: state.ca,
      smys_mpa: state.smys,
      steelGrade: state.gradeName || 'API 5L',
      pipeLength_m: state.length,
      seamType: state.seamType,
      seamClockPosition: state.clockPos,
      seamAngle_deg: state.seamAngle,
      designPressure_bar: state.designPressure,
      designFactor: state.designFactor,
      designTemperature_C: state.designTemp,
      temperatureDeratingFactor_T: Number(calc.T_temp.toFixed(3)),
      effectiveSMYS_mpa: Number((state.smys * calc.T_temp).toFixed(1)),
      weightPerMeter_kg_m: Number(calc.weightPerMeterKg.toFixed(1)),
      totalPipeWeight_kg: Math.round(calc.totalPipeWeightKg),
      totalPipeWeight_ton: Number(calc.totalPipeWeightTon.toFixed(2)),
      riggingSlingLoad_ton: Number(calc.riggingSlingLoadTon.toFixed(2)),
      minRecommendedSlingSwl_ton: Number(calc.minRecommendedSlingSwlTon.toFixed(2))
    },
    bendDesign: {
      bendType: state.bendType,
      targetAngle_deg: state.targetAngle,
      compoundDetails: state.bendType === 'compound' ? {
        horizontalAngle_deg: state.compoundHoriAngle,
        horizontalDirection: state.compoundHoriDir,
        verticalAngle_deg: state.compoundVertAngle,
        verticalDirection: state.compoundVertDir,
        machineRollAngle_deg: Number((state.compoundRollAngle || 0).toFixed(1))
      } : null,
      springbackAngle_deg: Number(calc.springbackDeg.toFixed(2)),
      machineAngle_deg: Number(calc.machineAngleDeg.toFixed(2)),
      radiusMultiplier: state.radiusMultiplier,
      bendRadius_m: Number(calc.r_bend_m.toFixed(2)),
      arcLength_m: Number(calc.l_bent_m.toFixed(2)),
      frontTangent_m: state.tangent1,
      rearTangentDesign_m: state.tangent2,
      actualRearTangent_m: Number(calc.l_t2_actual.toFixed(2)),
      minRequiredClampingLength_m: Number(calc.minClampingLenM.toFixed(2)),
      isClampingSafe: calc.isClampingSafe,
      clampingStatus: calc.clampingStatusText,
      pullStart_m: Number(calc.pullStartM.toFixed(3)),
      pullEnd_m: Number(calc.pullEndM.toFixed(3)),
      useMandrel: state.useMandrel,
      girthWeldInBend: state.girthWeldInBend,
      girthWeldDistance_m: state.girthWeldDist
    },
    integrityResults: {
      overallPass: calc.overallPass,
      wallThinningPercent: Number(calc.thinningPercent.toFixed(2)),
      remainingWallMm: Number(calc.t_extrados.toFixed(2)),
      minRequiredWallMm: Number(calc.t_min_design.toFixed(2)),
      pipeMillMinusToleranceMm: Number(calc.millTol.minusTolMm.toFixed(2)),
      pipeMillMinWallMm: Number(calc.millTol.tMinMillMm.toFixed(2)),
      effectiveRequiredWallMm: Number(calc.t_min_required.toFixed(2)),
      estimatedOvalityPercent: Number(calc.estimatedOvality.toFixed(2)),
      ovalityLimitPercent: calc.maxAllowOvality,
      estimatedRippleMm: Number(calc.estimatedRippleMm.toFixed(2)),
      maxAllowRippleMm: Number(calc.maxAllowRippleMm.toFixed(2)),
      actualDeflectionRatePerOD: Number(calc.actualDeflectionRatePerOD.toFixed(2)),
      method2LimitPerOD: calc.asmeMethod2Limit,
      girthWeldStatus: calc.girthWeldStatusText,
      hoopStress_mpa: Number(calc.hoopStressMpa.toFixed(1)),
      longitudinalStress_mpa: Number(calc.longStressMpa.toFixed(1)),
      vonMisesStress_mpa: Number(calc.vonMisesStressMpa.toFixed(1)),
      allowableCombinedStress_mpa: Number(calc.allowableCombinedStressMpa.toFixed(1)),
      combinedStressRatioPercent: Number(calc.combinedStressRatioPercent.toFixed(1)),
      isCombinedStressCompliant: calc.isCombinedStressCompliant,
      plasticSectionModulus_cm3: Number((calc.Z_p_mm3 / 1000).toFixed(1)),
      plasticBendingMoment_kNm: Number(calc.plasticMomentKnm.toFixed(1)),
      estimatedBendingRamForce_kN: Number(calc.ramForceKn.toFixed(1)),
      estimatedBendingRamForce_ton: Number(calc.ramForceTon.toFixed(1)),
      recommendedMachineClass: calc.machineClass.modelName,
      isMachineCapacitySufficient: calc.machineClass.isSufficient,
      machineUtilizationPercent: calc.machineClass.utilPercent,
      failedChecks: calc.failedChecks.map(c => ({ key: c.key, label: c.label }))
    },
    pullSchedule: {
      totalPulls: calc.numPulls,
      pitch_mm: Math.round(calc.pullStepPitch * 1000),
      anglePerPull_deg: Number(calc.pullAnglePerStep.toFixed(2)),
      netAnglePerPull_deg: Number(calc.netAnglePerStep.toFixed(2)),
      steps: pullsList
    },
    siteAsBuiltVerification: calculateAsBuiltEvaluation(calc),
    asBuilt: state.asBuilt
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, filename);
}

function parseColdBendJSON(json) {
  if (!json || typeof json !== 'object') return null;
  if (json.application === 'ColdBend Pro' || json.pipeSpecifications || json.bendDesign) {
    const proj = json.project || {};
    const pipe = json.pipeSpecifications || {};
    const bend = json.bendDesign || {};
    const comp = bend.compoundDetails || {};
    const asb = json.asBuilt || (json.siteAsBuiltVerification ? {
      spoolNo: json.siteAsBuiltVerification.spoolNo,
      date: json.siteAsBuiltVerification.date,
      measuredAngle: json.siteAsBuiltVerification.measuredAngle,
      measuredWT: json.siteAsBuiltVerification.measuredWT,
      measuredOvality: json.siteAsBuiltVerification.measuredOvality,
      measuredRipple: json.siteAsBuiltVerification.measuredRipple,
      inspector: json.siteAsBuiltVerification.inspector
    } : null);

    return {
      projectName: proj.name,
      lineSection: proj.lineSection,
      chainageKP: proj.chainageKP,
      pipeNo: proj.pipeNo,
      heatNo: proj.heatNo,
      reportNo: proj.reportNo,
      standard: pipe.standard,
      od: pipe.outerDiameter_mm,
      t_nom: pipe.nominalWallThickness_mm,
      ca: pipe.corrosionAllowance_mm,
      smys: pipe.smys_mpa,
      gradeName: pipe.steelGrade,
      length: pipe.pipeLength_m,
      seamType: pipe.seamType,
      clockPos: pipe.seamClockPosition,
      seamAngle: pipe.seamAngle_deg,
      designPressure: pipe.designPressure_bar,
      designFactor: pipe.designFactor,
      designTemp: pipe.designTemperature_C,
      bendType: bend.bendType,
      targetAngle: bend.targetAngle_deg,
      compoundHoriAngle: comp.horizontalAngle_deg,
      compoundHoriDir: comp.horizontalDirection,
      compoundVertAngle: comp.verticalAngle_deg,
      compoundVertDir: comp.verticalDirection,
      compoundRollAngle: comp.machineRollAngle_deg,
      radiusMultiplier: bend.radiusMultiplier,
      tangent1: bend.frontTangent_m,
      tangent2: bend.rearTangentDesign_m,
      useMandrel: bend.useMandrel,
      girthWeldInBend: bend.girthWeldInBend,
      girthWeldDist: bend.girthWeldDistance_m,
      manualPulls: bend.manualPulls,
      asBuilt: asb
    };
  }
  return json;
}

function importProjectFromJSON(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const normalized = parseColdBendJSON(parsed);
      if (!normalized || typeof normalized !== 'object') {
        alert('Geçersiz JSON dosyası: ColdBend Pro proje formatı bulunamadı.');
        return;
      }
      restoreState(normalized);
      updateUI();
      scheduleSave();
      if (dom.visInfoLabel) {
        dom.visInfoLabel.textContent = `Proje Yüklendi: ${state.projectName || state.pipeNo || 'ColdBend'}`;
      }
    } catch (err) {
      alert('Dosya okuma hatası: ' + (err.message || 'Geçersiz JSON'));
    }
  };
  reader.readAsText(file);
}

/* ==========================================================================
   2D Vector CAD Drawing Exporters (AutoCAD DXF & Vector SVG)
   ========================================================================== */
function generateDXFContent(calc) {
  const lines = [];
  const add = (code, val) => { lines.push(String(code), String(val)); };
  
  // Header section (AutoCAD R12/2000 ASCII compatibility)
  add(0, 'SECTION'); add(2, 'HEADER');
  add(9, '$ACADVER'); add(1, 'AC1009');
  add(9, '$INSUNITS'); add(70, 4); // Millimeters (1:1 real world metric)
  add(0, 'ENDSEC');
  
  // Tables section: linetypes & layers
  add(0, 'SECTION'); add(2, 'TABLES');
  add(0, 'TABLE'); add(2, 'LTYPE'); add(70, 1);
  add(0, 'LTYPE'); add(2, 'CENTER'); add(70, 0); add(3, 'Centerline ____ _ ____'); add(72, 65); add(73, 4); add(40, 25.0);
  add(49, 15.0); add(49, -4.0); add(49, 2.0); add(49, -4.0);
  add(0, 'ENDTAB');
  
  add(0, 'TABLE'); add(2, 'LAYER'); add(70, 7);
  add(0, 'LAYER'); add(2, 'CENTERLINE'); add(70, 0); add(62, 3); add(6, 'CENTER'); // Green
  add(0, 'LAYER'); add(2, 'PIPE_WALL'); add(70, 0); add(62, 7); add(6, 'CONTINUOUS'); // White
  add(0, 'LAYER'); add(2, 'DIMENSIONS'); add(70, 0); add(62, 6); add(6, 'CONTINUOUS'); // Magenta
  add(0, 'LAYER'); add(2, 'PULL_STATIONS'); add(70, 0); add(62, 4); add(6, 'CONTINUOUS'); // Cyan
  add(0, 'LAYER'); add(2, 'MARKERS'); add(70, 0); add(62, 2); add(6, 'CONTINUOUS'); // Yellow
  add(0, 'LAYER'); add(2, 'TITLE_BLOCK'); add(70, 0); add(62, 4); add(6, 'CONTINUOUS'); // Cyan
  add(0, 'LAYER'); add(2, 'ANNOTATIONS'); add(70, 0); add(62, 1); add(6, 'CONTINUOUS'); // Red
  add(0, 'ENDTAB');
  add(0, 'ENDSEC');
  
  // Entities section
  add(0, 'SECTION'); add(2, 'ENTITIES');
  
  const f = (n, d = 3) => Number(n).toFixed(d);
  
  const lineEntity = (layer, x1, y1, x2, y2) => {
    add(0, 'LINE'); add(8, layer);
    add(10, f(x1)); add(20, f(y1)); add(30, '0.0');
    add(11, f(x2)); add(21, f(y2)); add(31, '0.0');
  };
  
  const arcEntity = (layer, cx, cy, r, aStart, aEnd) => {
    add(0, 'ARC'); add(8, layer);
    add(10, f(cx)); add(20, f(cy)); add(30, '0.0');
    add(40, f(r));
    add(50, f(aStart)); add(51, f(aEnd));
  };
  
  const circleEntity = (layer, cx, cy, r) => {
    add(0, 'CIRCLE'); add(8, layer);
    add(10, f(cx)); add(20, f(cy)); add(30, '0.0');
    add(40, f(r));
  };
  
  const textEntity = (layer, x, y, height, text, angleDeg = 0) => {
    add(0, 'TEXT'); add(8, layer);
    add(10, f(x)); add(20, f(y)); add(30, '0.0');
    add(40, f(height));
    if (angleDeg !== 0) {
      add(50, f(angleDeg));
    }
    add(1, String(text));
  };

  const od_mm = state.od;
  const r_pipe = od_mm / 2;
  const t1_mm = calc.pullStartM * 1000;
  const R_mm = calc.r_bend_m * 1000;
  const theta_deg = state.targetAngle;
  const theta_rad = (theta_deg * Math.PI) / 180;
  const t2draw_mm = Math.max(state.tangent2, state.length - calc.pullStartM - calc.r_bend_m * theta_rad) * 1000;
  const txtH = Math.max(80, r_pipe * 0.35);

  const dimLinear = (layer, x1, y1, x2, y2, offset, label, angleDeg = 0) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1e-4) return;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    
    const p1x = x1 + nx * offset;
    const p1y = y1 + ny * offset;
    const p2x = x2 + nx * offset;
    const p2y = y2 + ny * offset;
    
    // Extension witness lines
    const extOver = Math.sign(offset || 1) * 80;
    lineEntity(layer, x1, y1, p1x + nx * extOver, p1y + ny * extOver);
    lineEntity(layer, x2, y2, p2x + nx * extOver, p2y + ny * extOver);
    
    // Dimension line
    lineEntity(layer, p1x, p1y, p2x, p2y);
    
    // 45-degree ticks
    const tickLen = Math.max(30, Math.min(70, r_pipe * 0.14));
    const tx = (ux + nx) * (tickLen * 0.707);
    const ty = (uy + ny) * (tickLen * 0.707);
    lineEntity(layer, p1x - tx, p1y - ty, p1x + tx, p1y + ty);
    lineEntity(layer, p2x - tx, p2y - ty, p2x + tx, p2y + ty);
    
    // Centered label slightly offset from dimension line
    const mx = (p1x + p2x) / 2 + nx * (txtH * 0.35);
    const my = (p1y + p2y) / 2 + ny * (txtH * 0.35);
    textEntity(layer, mx, my, txtH * 0.75, label, angleDeg);
  };
  
  const cx = t1_mm;
  const cy = R_mm;
  const aStart = 270.0;
  const aEnd = 270.0 + theta_deg;
  
  const dirX = Math.cos(theta_rad);
  const dirY = Math.sin(theta_rad);
  
  // 1. CENTERLINE (Neutral Axis)
  lineEntity('CENTERLINE', 0, 0, t1_mm, 0);
  arcEntity('CENTERLINE', cx, cy, R_mm, aStart, aEnd);
  const pt_x = cx + R_mm * Math.sin(theta_rad);
  const pt_y = cy - R_mm * Math.cos(theta_rad);
  const end_x = pt_x + t2draw_mm * dirX;
  const end_y = pt_y + t2draw_mm * dirY;
  lineEntity('CENTERLINE', pt_x, pt_y, end_x, end_y);
  
  // 2. PIPE WALLS (Extrados & Intrados)
  // Intrados: radius R_mm - r_pipe
  const R_int = Math.max(100, R_mm - r_pipe);
  lineEntity('PIPE_WALL', 0, r_pipe, t1_mm, r_pipe);
  arcEntity('PIPE_WALL', cx, cy, R_int, aStart, aEnd);
  const pt_int_x = cx + R_int * Math.sin(theta_rad);
  const pt_int_y = cy - R_int * Math.cos(theta_rad);
  const end_int_x = pt_int_x + t2draw_mm * dirX;
  const end_int_y = pt_int_y + t2draw_mm * dirY;
  lineEntity('PIPE_WALL', pt_int_x, pt_int_y, end_int_x, end_int_y);
  
  // Extrados: radius R_mm + r_pipe
  const R_ext = R_mm + r_pipe;
  lineEntity('PIPE_WALL', 0, -r_pipe, t1_mm, -r_pipe);
  arcEntity('PIPE_WALL', cx, cy, R_ext, aStart, aEnd);
  const pt_ext_x = cx + R_ext * Math.sin(theta_rad);
  const pt_ext_y = cy - R_ext * Math.cos(theta_rad);
  const end_ext_x = pt_ext_x + t2draw_mm * dirX;
  const end_ext_y = pt_ext_y + t2draw_mm * dirY;
  lineEntity('PIPE_WALL', pt_ext_x, pt_ext_y, end_ext_x, end_ext_y);
  
  // End caps
  lineEntity('PIPE_WALL', 0, -r_pipe, 0, r_pipe);
  lineEntity('PIPE_WALL', end_ext_x, end_ext_y, end_int_x, end_int_y);
  
  // 3. MARKERS (PC, PT, Girth Weld)
  circleEntity('MARKERS', t1_mm, 0, r_pipe * 0.15);
  textEntity('MARKERS', t1_mm, r_pipe * 1.5, r_pipe * 0.35, `PC (X=${(calc.pullStartM).toFixed(2)}m)`);
  
  circleEntity('MARKERS', pt_x, pt_y, r_pipe * 0.15);
  textEntity('MARKERS', pt_x, pt_y + r_pipe * 1.5, r_pipe * 0.35, `PT (X=${(calc.pullEndM).toFixed(2)}m)`);
  
  // Girth weld marker if present
  if (state.girthWeldInBend && calc.isGwOnPipe) {
    const gw_dist_mm = state.girthWeldDist * 1000;
    let gw_x = 0, gw_y = 0;
    if (gw_dist_mm <= t1_mm) {
      gw_x = gw_dist_mm;
      gw_y = 0;
      lineEntity('MARKERS', gw_x, -r_pipe * 1.2, gw_x, r_pipe * 1.2);
    } else if (gw_dist_mm <= (t1_mm + calc.l_bent_m * 1000)) {
      const arcDist = gw_dist_mm - t1_mm;
      const arcAngle = (arcDist / R_mm);
      gw_x = cx + R_mm * Math.sin(arcAngle);
      gw_y = cy - R_mm * Math.cos(arcAngle);
      const radX = Math.sin(arcAngle);
      const radY = -Math.cos(arcAngle);
      lineEntity('MARKERS', gw_x - radX * r_pipe * 1.2, gw_y - radY * r_pipe * 1.2, gw_x + radX * r_pipe * 1.2, gw_y + radY * r_pipe * 1.2);
    } else {
      const t2Dist = gw_dist_mm - t1_mm - calc.l_bent_m * 1000;
      gw_x = pt_x + t2Dist * dirX;
      gw_y = pt_y + t2Dist * dirY;
      const perpX = -dirY;
      const perpY = dirX;
      lineEntity('MARKERS', gw_x - perpX * r_pipe * 1.2, gw_y - perpY * r_pipe * 1.2, gw_x + perpX * r_pipe * 1.2, gw_y + perpY * r_pipe * 1.2);
    }
    textEntity('MARKERS', gw_x, gw_y + r_pipe * 1.8, r_pipe * 0.35, `GW (X=${state.girthWeldDist.toFixed(2)}m - %100 RT)`);
  }
  
  // 4. PULL STATIONS
  const numPulls = calc.numPulls || 1;
  for (let i = 1; i <= numPulls; i++) {
    const fraction = i / numPulls;
    const aStep = theta_rad * fraction;
    const px = cx + R_mm * Math.sin(aStep);
    const py = cy - R_mm * Math.cos(aStep);
    const radX = Math.sin(aStep);
    const radY = -Math.cos(aStep);
    lineEntity('PULL_STATIONS', px - radX * r_pipe * 0.9, py - radY * r_pipe * 0.9, px + radX * r_pipe * 0.9, py + radY * r_pipe * 0.9);
    textEntity('PULL_STATIONS', px, py - r_pipe * 1.4, r_pipe * 0.22, `P#${i}`);
  }

  // 5. DIMENSION ENTITIES (Lt1, Lt2, OD, Radius & Arc)
  // Front tangent dimension
  dimLinear('DIMENSIONS', 0, r_pipe, t1_mm, r_pipe, r_pipe * 0.85, `Lt1 = ${(calc.pullStartM).toFixed(3)} m (${Math.round(t1_mm)} mm)`);

  // Rear tangent dimension
  dimLinear('DIMENSIONS', pt_ext_x, pt_ext_y, end_ext_x, end_ext_y, -r_pipe * 0.85, `Lt2 = ${(calc.l_t2_actual).toFixed(3)} m (${Math.round(t2draw_mm)} mm)`, theta_deg);

  // Pipe OD dimension at infeed
  dimLinear('DIMENSIONS', 0, -r_pipe, 0, r_pipe, -r_pipe * 1.4, `OD ${state.od} mm (DN ${state.npsLabel})`);

  // Radius leader line & Arc callout
  const midAngleDeg = 270.0 + theta_deg / 2;
  const midAngleRad = (midAngleDeg * Math.PI) / 180;
  const radDirX = Math.cos(midAngleRad);
  const radDirY = Math.sin(midAngleRad);
  const radStartDist = R_mm - r_pipe;
  const radEndDist = R_mm + r_pipe + r_pipe * 1.3;
  const radP1X = cx + radStartDist * radDirX;
  const radP1Y = cy + radStartDist * radDirY;
  const radP2X = cx + radEndDist * radDirX;
  const radP2Y = cy + radEndDist * radDirY;
  lineEntity('DIMENSIONS', radP1X, radP1Y, radP2X, radP2Y);
  const tickL = Math.max(30, r_pipe * 0.12);
  lineEntity('DIMENSIONS', radP1X - tickL * 0.7, radP1Y - tickL * 0.7, radP1X + tickL * 0.7, radP1Y + tickL * 0.7);
  textEntity('DIMENSIONS', radP2X + 60, radP2Y + 60, txtH * 0.82, `R = ${(calc.r_bend_m).toFixed(2)} m (${state.radiusMultiplier}D) | Aci: ${state.targetAngle.toFixed(2)} deg (Yay: ${(calc.l_bent_m).toFixed(2)} m)`);

  // 6. ASME B31.8 / B31.4 TITLE BLOCK & COMPLIANCE STAMP TABLE
  const tblX = 0;
  const tblY = -r_pipe * 2.8 - 250;
  const tblW = Math.max(5000, Math.min(12000, t1_mm + t2draw_mm * 0.85));
  const rowH = Math.max(85, txtH * 1.45);
  const numRows = 7;
  const tblH = rowH * numRows;

  // Outer border
  lineEntity('TITLE_BLOCK', tblX, tblY, tblX + tblW, tblY);
  lineEntity('TITLE_BLOCK', tblX + tblW, tblY, tblX + tblW, tblY - tblH);
  lineEntity('TITLE_BLOCK', tblX + tblW, tblY - tblH, tblX, tblY - tblH);
  lineEntity('TITLE_BLOCK', tblX, tblY - tblH, tblX, tblY);

  // Horizontal divider lines
  for (let r = 1; r < numRows; r++) {
    lineEntity('TITLE_BLOCK', tblX, tblY - r * rowH, tblX + tblW, tblY - r * rowH);
  }

  // Row texts
  const padX = tblX + 80;
  const textY = (r) => tblY - r * rowH - rowH * 0.68;

  // Header Banner
  textEntity('TITLE_BLOCK', padX, textY(0), rowH * 0.44, 'COLDBEND PRO - SAHA BORU SOGUK BUKUM IMALAT VE MUHENDISLIK PLANI');

  // Row 1: Proje & Boru Kimligi
  textEntity('TITLE_BLOCK', padX, textY(1), rowH * 0.34, `Proje: ${state.projectName || '-'} | Hat: ${state.lineSection || '-'} | Boru No: ${state.pipeNo || '-'} | Heat No: ${state.heatNo || '-'} | Standart: ${state.standard}`);

  // Row 2: Malzeme ve Boyutlar
  textEntity('TITLE_BLOCK', padX, textY(2), rowH * 0.34, `Cap: DN ${state.npsLabel} (OD ${state.od} mm x WT ${state.t_nom} mm) | Celik SMYS: ${state.smys} MPa | Toplam Boru Boyu: ${state.length.toFixed(2)} m`);

  // Row 3: Bukum Geometrisi
  textEntity('TITLE_BLOCK', padX, textY(3), rowH * 0.34, `Hedef Bukum Acisi: ${state.targetAngle.toFixed(2)} deg | Makine Acisi: ${calc.machineAngleDeg.toFixed(2)} deg (Geri Yaylanma: +${calc.springbackDeg.toFixed(2)} deg) | R: ${calc.r_bend_m.toFixed(2)} m (${state.radiusMultiplier}D)`);

  // Row 4: Tegetler ve Pasolar
  textEntity('TITLE_BLOCK', padX, textY(4), rowH * 0.34, `On Teget Lt1: ${state.tangent1.toFixed(3)} m | Arka Teget Lt2: ${calc.l_t2_actual.toFixed(3)} m | Bukum Yay Boyu: ${calc.l_bent_m.toFixed(3)} m | Toplam ${calc.numPulls} Paso (${(calc.pullStepPitch * 1000).toFixed(0)} mm/Paso)`);

  // Row 5: Standart Kontrol Sonuclari
  const thinningVerdict = calc.isWallThinningSafe ? 'UYGUN [PASS]' : 'UYGUN DEGIL [FAIL]';
  const ovalityVerdict = calc.isOvalityCompliant ? 'UYGUN [PASS]' : 'ASIM [FAIL]';
  const stressVerdict = calc.isCombinedStressCompliant ? 'UYGUN [PASS]' : 'ASIM [FAIL]';
  const dxfTminStr = calc.stdCriteria && calc.stdCriteria.enforceMillTolThinning
    ? `t_min+tol: ${calc.t_min_required.toFixed(2)}mm`
    : `t_min: ${calc.t_min_design.toFixed(2)}mm`;
  const dxfOvLim = (calc.maxAllowOvality || 2.50).toFixed(2);
  textEntity('TITLE_BLOCK', padX, textY(5), rowH * 0.33, `Incelme: %${calc.thinningPercent.toFixed(2)} (t_ext: ${calc.t_extrados.toFixed(2)}mm >= ${dxfTminStr}) [${thinningVerdict}] | Ovallik: %${calc.estimatedOvality.toFixed(2)} (Limit: <=%${dxfOvLim}) [${ovalityVerdict}] | Gerilme: %${calc.combinedStressRatioPercent.toFixed(1)} SMYS [${stressVerdict}]`);

  // Row 6: Genel Onay Durumu & Imza
  const isApproved = Boolean(calc.overallPass ?? calc.isOverallCompliant);
  const overallText = isApproved
    ? 'GENEL DURUM: REFERANS STANDART VE ISVEREN SARTNAME KOSULLARINA UYGUNDUR (ONAYLANDI)'
    : 'GENEL DURUM: STANDART / SARTNAME LIMIT ASIMI MEVCUTTUR (REVIZYON GEREKLIDIR)';
  const dateStr = new Date().toLocaleDateString('tr-TR');
  textEntity('TITLE_BLOCK', padX, textY(6), rowH * 0.34, `${overallText} | Tarih: ${dateStr} | Versiyon: ColdBend Pro v${APP_VERSION}`);
  
  add(0, 'ENDSEC');
  add(0, 'EOF');
  
  return lines.join('\n');
}

function export2DToDXF(calc) {
  if (!calc) calc = runCalculations();
  const dxfContent = generateDXFContent(calc);
  const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8' });
  const safePipeNo = (state.pipeNo || 'Boru').toString().replace(/[^a-zA-Z0-9_\-]/g, '_');
  const filename = `ColdBend_2D_CAD_${safePipeNo}.dxf`;
  triggerDownload(blob, filename);
}

function export2DToSVG() {
  if (!dom.svgBend2D) return;
  const clone = dom.svgBend2D.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('width', '1000');
  clone.setAttribute('height', '550');
  const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const safePipeNo = (state.pipeNo || 'Boru').toString().replace(/[^a-zA-Z0-9_\-]/g, '_');
  const filename = `ColdBend_2D_Cizim_${safePipeNo}.svg`;
  triggerDownload(blob, filename);
}

/* ==========================================================================
   2D SVG CAD Viewport Zoom & Pan Controller
   ========================================================================== */

const svg2DState = {
  baseW: 1000,
  baseH: 550,
  x: 0,
  y: 0,
  w: 1000,
  h: 550,
  zoom: 1.0,
  minZoom: 0.5,
  maxZoom: 15.0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  startViewBoxX: 0,
  startViewBoxY: 0,
  activePointers: new Map(),
  initialPinchDist: 0,
  initialPinchZoom: 1.0,
  initialPinchCenter: { relX: 0.5, relY: 0.5 }
};

function apply2DViewBox() {
  if (!dom.svgBend2D) return;
  dom.svgBend2D.setAttribute(
    'viewBox',
    `${svg2DState.x.toFixed(2)} ${svg2DState.y.toFixed(2)} ${svg2DState.w.toFixed(2)} ${svg2DState.h.toFixed(2)}`
  );
  if (dom.badgeZoom2D) {
    dom.badgeZoom2D.textContent = `%${Math.round(svg2DState.zoom * 100)}`;
  }
}

function zoom2DAt(relX, relY, factor) {
  const currentZoom = svg2DState.zoom;
  let newZoom = currentZoom * factor;
  newZoom = Math.max(svg2DState.minZoom, Math.min(svg2DState.maxZoom, newZoom));
  if (Math.abs(newZoom - currentZoom) < 1e-4) return;

  const pointX = svg2DState.x + relX * svg2DState.w;
  const pointY = svg2DState.y + relY * svg2DState.h;

  const newW = svg2DState.baseW / newZoom;
  const newH = svg2DState.baseH / newZoom;

  const newX = pointX - relX * newW;
  const newY = pointY - relY * newH;

  svg2DState.zoom = newZoom;
  svg2DState.w = newW;
  svg2DState.h = newH;
  svg2DState.x = newX;
  svg2DState.y = newY;

  apply2DViewBox();
}

function reset2DView() {
  svg2DState.zoom = 1.0;
  svg2DState.w = svg2DState.baseW;
  svg2DState.h = svg2DState.baseH;
  svg2DState.x = 0;
  svg2DState.y = 0;
  apply2DViewBox();
}

function focus2DBendArc() {
  const calc = runCalculations();
  const pullStartM = calc.pullStartM;
  const r_bend = calc.r_bend_m;
  const thetaRad = (state.targetAngle * Math.PI) / 180;
  const t2 = state.tangent2;
  const t2draw = Math.max(t2, state.length - pullStartM - r_bend * thetaRad);
  const spanM = Math.max(1, pullStartM + r_bend * thetaRad + t2draw);
  const scale = 760 / spanM;
  const r_vis = Math.max(140, Math.min(1500, r_bend * scale));
  const startX = 110;
  const startY = 380;
  const x_pc = startX + pullStartM * scale;
  const y_pc = startY;
  const cx = x_pc;
  const cy = y_pc - r_vis;
  const x_pt = cx + r_vis * Math.sin(thetaRad);
  const y_pt = cy + r_vis * Math.cos(thetaRad);

  const minX = Math.min(x_pc, x_pt) - 60;
  const maxX = Math.max(x_pc, x_pt) + 80;
  const minY = Math.min(y_pc, y_pt) - 90;
  const maxY = Math.max(y_pc, y_pt) + 90;

  const boxW = Math.max(140, maxX - minX);
  const boxH = Math.max(120, maxY - minY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  let targetW = Math.max(boxW * 1.35, boxH * (1000 / 550) * 1.35);
  targetW = Math.min(svg2DState.baseW, Math.max(180, targetW));
  const targetH = targetW * (550 / 1000);

  svg2DState.zoom = svg2DState.baseW / targetW;
  svg2DState.w = targetW;
  svg2DState.h = targetH;
  svg2DState.x = centerX - targetW / 2;
  svg2DState.y = centerY - targetH / 2;

  apply2DViewBox();
}

function setup2DZoomPan() {
  if (!dom.svgBend2D) return;

  dom.svgBend2D.addEventListener('wheel', (e) => {
    // Only zoom drawing when Ctrl or Cmd is held (or trackpad pinch-zoom);
    // otherwise let the mouse roller scroll the page naturally without trapping the user
    if (!e.ctrlKey && !e.metaKey) {
      return;
    }
    e.preventDefault();
    const rect = dom.svgBend2D.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const factor = e.deltaY < 0 ? 1.15 : (1 / 1.15);
    zoom2DAt(relX, relY, factor);
  }, { passive: false });

  dom.svgBend2D.addEventListener('dblclick', (e) => {
    e.preventDefault();
    if (Math.abs(svg2DState.zoom - 1.0) < 0.15) {
      focus2DBendArc();
    } else {
      reset2DView();
    }
  });

  dom.svgBend2D.addEventListener('pointerdown', (e) => {
    if (e.target && e.target.closest && e.target.closest('.controls-2d-overlay, .legend-overlay, .hint-2d-overlay')) return;
    svg2DState.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { dom.svgBend2D.setPointerCapture(e.pointerId); } catch (_) {}

    if (svg2DState.activePointers.size === 1) {
      svg2DState.isDragging = true;
      svg2DState.dragStartX = e.clientX;
      svg2DState.dragStartY = e.clientY;
      svg2DState.startViewBoxX = svg2DState.x;
      svg2DState.startViewBoxY = svg2DState.y;
    } else if (svg2DState.activePointers.size === 2) {
      svg2DState.isDragging = false;
      const pts = Array.from(svg2DState.activePointers.values());
      svg2DState.initialPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      svg2DState.initialPinchZoom = svg2DState.zoom;
      const rect = dom.svgBend2D.getBoundingClientRect();
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      svg2DState.initialPinchCenter = {
        relX: Math.max(0, Math.min(1, (midX - rect.left) / rect.width)),
        relY: Math.max(0, Math.min(1, (midY - rect.top) / rect.height))
      };
    }
  });

  dom.svgBend2D.addEventListener('pointermove', (e) => {
    if (!svg2DState.activePointers.has(e.pointerId)) return;
    svg2DState.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const rect = dom.svgBend2D.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    if (svg2DState.activePointers.size === 1 && svg2DState.isDragging) {
      const dxScreen = e.clientX - svg2DState.dragStartX;
      const dyScreen = e.clientY - svg2DState.dragStartY;
      const scaleX = svg2DState.w / rect.width;
      const scaleY = svg2DState.h / rect.height;

      svg2DState.x = svg2DState.startViewBoxX - dxScreen * scaleX;
      svg2DState.y = svg2DState.startViewBoxY - dyScreen * scaleY;
      apply2DViewBox();
    } else if (svg2DState.activePointers.size === 2 && svg2DState.initialPinchDist > 0) {
      const pts = Array.from(svg2DState.activePointers.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (dist > 5) {
        const factor = dist / svg2DState.initialPinchDist;
        const targetZoom = Math.max(svg2DState.minZoom, Math.min(svg2DState.maxZoom, svg2DState.initialPinchZoom * factor));
        const deltaFactor = targetZoom / svg2DState.zoom;
        zoom2DAt(svg2DState.initialPinchCenter.relX, svg2DState.initialPinchCenter.relY, deltaFactor);
      }
    }
  });

  const endPointer = (e) => {
    svg2DState.activePointers.delete(e.pointerId);
    try { dom.svgBend2D.releasePointerCapture(e.pointerId); } catch (_) {}
    if (svg2DState.activePointers.size === 0) {
      svg2DState.isDragging = false;
    } else if (svg2DState.activePointers.size === 1) {
      const remaining = Array.from(svg2DState.activePointers.values())[0];
      svg2DState.isDragging = true;
      svg2DState.dragStartX = remaining.x;
      svg2DState.dragStartY = remaining.y;
      svg2DState.startViewBoxX = svg2DState.x;
      svg2DState.startViewBoxY = svg2DState.y;
    }
  };

  dom.svgBend2D.addEventListener('pointerup', endPointer);
  dom.svgBend2D.addEventListener('pointercancel', endPointer);

  // Button Listeners
  if (dom.btn2dZoomIn) {
    dom.btn2dZoomIn.addEventListener('click', () => zoom2DAt(0.5, 0.5, 1.25));
  }
  if (dom.btn2dZoomOut) {
    dom.btn2dZoomOut.addEventListener('click', () => zoom2DAt(0.5, 0.5, 1 / 1.25));
  }
  if (dom.btn2dFocusArc) {
    dom.btn2dFocusArc.addEventListener('click', focus2DBendArc);
  }
  if (dom.btn2dReset) {
    dom.btn2dReset.addEventListener('click', reset2DView);
  }
}

/* ==========================================================================
   2D Dynamic Engineering SVG Sketch Rendering (C1 Continuous)
   ========================================================================== */

function render2DSketch(calc) {
  render2DSketchTo(dom.svgDynamicGroup, calc, false);
  apply2DViewBox();
}

function render2DSketchTo(g, calc, isPrintMode = false) {
  if (!g) return;
  g.innerHTML = '';
  
  // Real dimensions in meters
  const t1 = state.tangent1;
  const t2 = state.tangent2;
  const pullStartM = calc.pullStartM;
  const r_bend = calc.r_bend_m;
  const thetaRad = (state.targetAngle * Math.PI) / 180;
  const t2draw = Math.max(t2, state.length - pullStartM - r_bend * thetaRad);

  // Fit-to-span scaling
  const spanM = Math.max(1, pullStartM + r_bend * thetaRad + t2draw);
  const scale = isPrintMode ? (820 / spanM) : (760 / spanM); // pixels per meter

  const r_vis = Math.max(isPrintMode ? 110 : 140, Math.min(isPrintMode ? 850 : 1500, r_bend * scale));
  const clampSvg = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const pipeDiaVis = Math.max(isPrintMode ? 12 : 14, Math.min(isPrintMode ? 24 : 32, (state.od / 1000) * scale * 2.2));
  
  // Starting coordinate of pipe on screen
  const startX = isPrintMode ? 80 : 110;
  const startY = isPrintMode ? 225 : 380; // baseline height
  
  // Point of Curvature (PC)
  const t1_len_px = pullStartM * scale;
  const x_pc = startX + t1_len_px;
  const y_pc = startY;
  
  // Center of Curvature O
  const cx = x_pc;
  const cy = y_pc - r_vis;
  
  // Point of Tangency (PT)
  const x_pt = cx + r_vis * Math.sin(thetaRad);
  const y_pt = cy + r_vis * Math.cos(thetaRad);
  
  // Tangent 2
  const t2_len_px = t2draw * scale;
  const t2_dirX = Math.cos(thetaRad);
  const t2_dirY = -Math.sin(thetaRad);
  const endX = x_pt + t2_len_px * t2_dirX;
  const endY = y_pt + t2_len_px * t2_dirY;
  
  // --- CENTERLINE (Neutral Axis) ---
  const pathNeutral = `
    M ${startX} ${startY}
    L ${x_pc} ${y_pc}
    A ${r_vis} ${r_vis} 0 0 0 ${x_pt} ${y_pt}
    L ${endX} ${endY}
  `;
  
  const elemNeutral = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  elemNeutral.setAttribute('d', pathNeutral);
  elemNeutral.setAttribute('fill', 'none');
  elemNeutral.setAttribute('stroke', isPrintMode ? '#047857' : '#10b981');
  elemNeutral.setAttribute('stroke-width', '2.5');
  elemNeutral.setAttribute('stroke-dasharray', '8,4');
  g.appendChild(elemNeutral);
  
  // --- INTRADOS ---
  const r_int = r_vis - pipeDiaVis / 2;
  const int_startX = startX;
  const int_startY = startY - pipeDiaVis / 2;
  const int_pcX = x_pc;
  const int_pcY = y_pc - pipeDiaVis / 2;
  const int_ptX = cx + r_int * Math.sin(thetaRad);
  const int_ptY = cy + r_int * Math.cos(thetaRad);
  const int_endX = int_ptX + t2_len_px * t2_dirX;
  const int_endY = int_ptY + t2_len_px * t2_dirY;
  
  const pathIntrados = `
    M ${int_startX} ${int_startY}
    L ${int_pcX} ${int_pcY}
    A ${r_int} ${r_int} 0 0 0 ${int_ptX} ${int_ptY}
    L ${int_endX} ${int_endY}
  `;
  const elemInt = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  elemInt.setAttribute('d', pathIntrados);
  elemInt.setAttribute('fill', 'none');
  elemInt.setAttribute('stroke', isPrintMode ? '#1e40af' : 'url(#gradCompression)');
  elemInt.setAttribute('stroke-width', '3.5');
  g.appendChild(elemInt);
  
  // --- EXTRADOS ---
  const r_ext = r_vis + pipeDiaVis / 2;
  const ext_startX = startX;
  const ext_startY = startY + pipeDiaVis / 2;
  const ext_pcX = x_pc;
  const ext_pcY = y_pc + pipeDiaVis / 2;
  const ext_ptX = cx + r_ext * Math.sin(thetaRad);
  const ext_ptY = cy + r_ext * Math.cos(thetaRad);
  const ext_endX = ext_ptX + t2_len_px * t2_dirX;
  const ext_endY = ext_ptY + t2_len_px * t2_dirY;
  
  const pathExtrados = `
    M ${ext_startX} ${ext_startY}
    L ${ext_pcX} ${ext_pcY}
    A ${r_ext} ${r_ext} 0 0 0 ${ext_ptX} ${ext_ptY}
    L ${ext_endX} ${ext_endY}
  `;
  const elemExt = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  elemExt.setAttribute('d', pathExtrados);
  elemExt.setAttribute('fill', 'none');
  elemExt.setAttribute('stroke', isPrintMode ? '#b91c1c' : 'url(#gradTension)');
  elemExt.setAttribute('stroke-width', '3.5');
  g.appendChild(elemExt);
  
  const isLight = isPrintMode || document.body.classList.contains('light-theme');
  const textColor = isPrintMode ? '#000000' : (isLight ? '#0f172a' : '#cbd5e1');
  const subTextColor = isPrintMode ? '#334155' : (isLight ? '#475569' : '#94a3b8');
  const dimLineColor = isPrintMode ? '#334155' : (isLight ? '#64748b' : '#94a3b8');
  const endCapColor = isPrintMode ? '#000000' : (isLight ? '#0f172a' : '#ffffff');
  const radiusColor = isPrintMode ? '#0284c7' : (isLight ? '#0284c7' : '#38bdf8');
  const arcColor = isPrintMode ? '#b45309' : (isLight ? '#d97706' : '#f59e0b');

  if (!isPrintMode) {
    const arrowStart = dom.arrowStartPath || document.getElementById('arrowStart')?.querySelector('path');
    const arrowEnd = dom.arrowEndPath || document.getElementById('arrowEnd')?.querySelector('path');
    if (!dom.arrowStartPath && arrowStart) dom.arrowStartPath = arrowStart;
    if (!dom.arrowEndPath && arrowEnd) dom.arrowEndPath = arrowEnd;
    if (arrowStart) arrowStart.setAttribute('fill', dimLineColor);
    if (arrowEnd) arrowEnd.setAttribute('fill', dimLineColor);
  }

  // End caps
  drawEndCap(g, int_startX, int_startY, ext_startX, ext_startY, 'Boru Başı', endCapColor);
  drawEndCap(g, int_endX, int_endY, ext_endX, ext_endY, 'Boru Sonu', endCapColor);
  
  // Pull / Step markers
  for (let i = 1; i <= calc.numPulls; i++) {
    const fraction = (calc.pullStepPitch * i) / Math.max(1e-9, calc.l_bent_m);
    const curAngle = thetaRad * Math.min(1, fraction);
    const px = cx + r_vis * Math.sin(curAngle);
    const py = cy + r_vis * Math.cos(curAngle);
    
    const isSelected = !isPrintMode && selectedPullIndex === i;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', px);
    circle.setAttribute('cy', py);
    circle.setAttribute('r', isSelected ? '7.5' : (isPrintMode ? '3' : '4'));
    circle.setAttribute('fill', isSelected ? '#ef4444' : '#d97706');
    if (isSelected) {
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '2.5');
    }
    if (!isPrintMode) {
      circle.style.cursor = 'pointer';
      circle.setAttribute('data-step', String(i));
      circle.addEventListener('click', (e) => {
        e.stopPropagation();
        selectPull(selectedPullIndex === i ? null : i);
      });
    }
    g.appendChild(circle);

    if (isSelected) {
      const stepDist = (calc.pullStartM + calc.pullStepPitch * i).toFixed(2);
      const calloutX = clampSvg(px + 10, 10, 850);
      const calloutY = clampSvg(py - 10, 20, isPrintMode ? 310 : 540);
      drawSvgText(g, calloutX, calloutY, `Paso #${i} (${stepDist}m • +${calc.pullAnglePerStep.toFixed(2)}°)`, '#ef4444', '11px', 'var(--font-mono)', 'bold');
    }
  }
  
  // Midpoint of the circular bend arc (bükümlü kısmın tam ortası)
  const midAngle = thetaRad * 0.5;
  const midArcX = cx + r_vis * Math.sin(midAngle);
  const midArcY = cy + r_vis * Math.cos(midAngle);

  // Center of Curvature O & Radial Vector Lines
  const oOnScreen = cx >= -60 && cx <= 1060 && cy >= -60 && cy <= (isPrintMode ? 340 : 610);

  // Sector boundary rays from O to PC and PT (when center O is on-screen)
  if (oOnScreen) {
    const rayPC = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    rayPC.setAttribute('x1', cx);
    rayPC.setAttribute('y1', cy);
    rayPC.setAttribute('x2', x_pc);
    rayPC.setAttribute('y2', y_pc);
    rayPC.setAttribute('stroke', dimLineColor);
    rayPC.setAttribute('stroke-width', '1.2');
    rayPC.setAttribute('stroke-dasharray', '3,3');
    rayPC.setAttribute('opacity', '0.55');
    g.appendChild(rayPC);

    const rayPT = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    rayPT.setAttribute('x1', cx);
    rayPT.setAttribute('y1', cy);
    rayPT.setAttribute('x2', x_pt);
    rayPT.setAttribute('y2', y_pt);
    rayPT.setAttribute('stroke', dimLineColor);
    rayPT.setAttribute('stroke-width', '1.2');
    rayPT.setAttribute('stroke-dasharray', '3,3');
    rayPT.setAttribute('opacity', '0.55');
    g.appendChild(rayPT);
  }

  // Primary Radius Vector: From O (or leader start) directly to Arc Midpoint (bükümlü kısmın ortası)
  let startRadX = cx;
  let startRadY = cy;
  if (!oOnScreen) {
    const leaderLen = Math.min(r_vis, isPrintMode ? 140 : 200);
    startRadX = midArcX - leaderLen * Math.sin(midAngle);
    startRadY = midArcY - leaderLen * Math.cos(midAngle);
  }

  const lineRadius = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  lineRadius.setAttribute('x1', startRadX);
  lineRadius.setAttribute('y1', startRadY);
  lineRadius.setAttribute('x2', midArcX);
  lineRadius.setAttribute('y2', midArcY);
  lineRadius.setAttribute('stroke', radiusColor);
  lineRadius.setAttribute('stroke-width', '1.8');
  lineRadius.setAttribute('stroke-dasharray', '5,3');
  g.appendChild(lineRadius);

  // Arrowhead touching the arc midpoint
  const arrowLen = isPrintMode ? 8 : 10;
  const radAngle = Math.atan2(midArcY - startRadY, midArcX - startRadX);
  const a1X = midArcX - arrowLen * Math.cos(radAngle - 0.35);
  const a1Y = midArcY - arrowLen * Math.sin(radAngle - 0.35);
  const a2X = midArcX - arrowLen * Math.cos(radAngle + 0.35);
  const a2Y = midArcY - arrowLen * Math.sin(radAngle + 0.35);
  const arrowPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  arrowPoly.setAttribute('points', `${midArcX},${midArcY} ${a1X},${a1Y} ${a2X},${a2Y}`);
  arrowPoly.setAttribute('fill', radiusColor);
  g.appendChild(arrowPoly);

  // Center O Marker
  const centerO = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerO.setAttribute('cx', startRadX);
  centerO.setAttribute('cy', startRadY);
  centerO.setAttribute('r', isPrintMode ? '3.5' : '4.5');
  centerO.setAttribute('fill', '#10b981');
  g.appendChild(centerO);

  drawSvgText(g, clampSvg(startRadX - 16, 8, 880), clampSvg(startRadY - 10, 20, isPrintMode ? 310 : 540), oOnScreen ? 'O (Büküm Merkezi)' : `O (R=${r_bend.toFixed(1)}m)`, subTextColor, '10.5px', 'var(--font-mono)');
  
  // Dimension Lines and Annotations
  if (state.showDimensions || isPrintMode) {
    const dimYOff = isPrintMode ? 34 : 48;
    drawDimensionLine(g, startX, startY + dimYOff, x_pc, y_pc + dimYOff, calc.isCentered ? `Ön = ${pullStartM.toFixed(1)} m (ortalı)` : `Lt1 = ${t1.toFixed(1)} m (Ön Düzlük)`, dimLineColor, textColor, isPrintMode);
    
    // Tangent 2 Dimension (Lt2)
    const t2_dimOffset = isPrintMode ? 34 : 48;
    const t2_normX = Math.sin(thetaRad);
    const t2_normY = Math.cos(thetaRad);
    const t2_dimStartX = x_pt + t2_dimOffset * t2_normX;
    const t2_dimStartY = y_pt + t2_dimOffset * t2_normY;
    const t2_dimEndX = endX + t2_dimOffset * t2_normX;
    const t2_dimEndY = endY + t2_dimOffset * t2_normY;
    drawDimensionLine(g, t2_dimStartX, t2_dimStartY, t2_dimEndX, t2_dimEndY, t2draw > t2 + 1e-9 ? `Lt2 = ${t2draw.toFixed(1)} m (gerçekleşen)` : `Lt2 = ${t2.toFixed(1)} m`, dimLineColor, textColor, isPrintMode);
    
    // Total Pipe Length Dimension at Bottom
    const totalDimYOff = isPrintMode ? 62 : 95;
    drawDimensionLine(g, startX, startY + totalDimYOff, endX, startY + totalDimYOff, `Boru Boyu: ${state.length.toFixed(1)} m | Efektif Büküm Yayı: ${calc.l_arc_m.toFixed(2)} m (${calc.numPulls} Paso)`, dimLineColor, textColor, isPrintMode);
    
    // Deflection Angle
    const thetaLabel = `θ = ${state.targetAngle.toFixed(1)}° (Makine: ${calc.machineAngleDeg.toFixed(1)}°)`;
    if (oOnScreen && r_vis <= 600) {
      drawAngleArcCorrect(g, cx, cy, isPrintMode ? 55 : 75, thetaRad, thetaLabel, arcColor);
    } else {
      const amx = cx + r_vis * Math.sin(thetaRad / 2);
      const amy = cy + r_vis * Math.cos(thetaRad / 2);
      drawSvgText(g, clampSvg(amx + 14, 8, 860), clampSvg(amy - 12, 20, isPrintMode ? 310 : 540), thetaLabel, arcColor, '11px', 'var(--font-mono)', 'bold');
    }

    // Radius Label along the radial vector pointing to arc midpoint
    const radMidX = (startRadX + midArcX) / 2 + 14;
    const radMidY = (startRadY + midArcY) / 2;
    drawSvgText(g, clampSvg(radMidX, 8, 830), clampSvg(radMidY, 20, isPrintMode ? 310 : 540), `Rbend = ${calc.r_bend_m.toFixed(1)} m (${state.radiusMultiplier}D)`, radiusColor, '11px', 'var(--font-mono)', 'bold');
    
    // Extrados Thinning Label
    const midExtAngle = thetaRad * 0.5;
    const midExtX = cx + (r_ext + 14) * Math.sin(midExtAngle);
    const midExtY = cy + (r_ext + 14) * Math.cos(midExtAngle);
    drawSvgText(g, midExtX - 35, midExtY + 14, `Ekstrados (Çekme) Δt = -${calc.delta_t_thin.toFixed(2)} mm (t: ${calc.t_extrados.toFixed(2)} mm)`, '#dc2626', '10px', 'var(--font-mono)', 'bold');
    
    // Intrados Thickening Label
    const midIntAngle = thetaRad * 0.5;
    const midIntX = cx + (r_int - 14) * Math.sin(midIntAngle);
    const midIntY = cy + (r_int - 14) * Math.cos(midIntAngle);
    drawSvgText(g, midIntX - 25, midIntY - 6, `İntrados (Basma) +${calc.delta_t_thick.toFixed(2)} mm`, '#1d4ed8', '10px', 'var(--font-mono)');
  }

  // --- GIRTH WELD IN 2D SKETCH ---
  if (state.girthWeldInBend && calc.isGwOnPipe) {
    const gwDist = state.girthWeldDist;
    let gwCenterX = startX, gwCenterY = startY;
    let gwNormX = 0, gwNormY = -1;
    
    if (gwDist <= pullStartM) {
      gwCenterX = startX + gwDist * scale;
      gwCenterY = startY;
      gwNormX = 0;
      gwNormY = -1;
    } else if (gwDist <= pullStartM + r_bend * thetaRad) {
      const arcDist = gwDist - pullStartM;
      const arcAng = arcDist / r_bend;
      gwCenterX = cx + r_vis * Math.sin(arcAng);
      gwCenterY = cy + r_vis * Math.cos(arcAng);
      gwNormX = -Math.sin(arcAng);
      gwNormY = -Math.cos(arcAng);
    } else {
      const t2Dist = gwDist - (pullStartM + r_bend * thetaRad);
      gwCenterX = x_pt + t2Dist * scale * t2_dirX;
      gwCenterY = y_pt + t2Dist * scale * t2_dirY;
      gwNormX = -t2_dirY;
      gwNormY = t2_dirX;
    }

    const halfW = pipeDiaVis / 2;
    const p1x = gwCenterX + gwNormX * (halfW + 4);
    const p1y = gwCenterY + gwNormY * (halfW + 4);
    const p2x = gwCenterX - gwNormX * (halfW + 4);
    const p2y = gwCenterY - gwNormY * (halfW + 4);

    const weldColor = calc.isGwInArc ? '#b91c1c' : '#0284c7';
    
    const gwLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gwLine.setAttribute('x1', p1x);
    gwLine.setAttribute('y1', p1y);
    gwLine.setAttribute('x2', p2x);
    gwLine.setAttribute('y2', p2y);
    gwLine.setAttribute('stroke', weldColor);
    gwLine.setAttribute('stroke-width', '3.5');
    gwLine.setAttribute('stroke-dasharray', '4,2');
    g.appendChild(gwLine);

    const labelText = calc.isGwInArc 
      ? `Alın Kaynağı (X=${gwDist.toFixed(1)}m · %100 RT Zorunlu)`
      : `Alın Kaynağı (X=${gwDist.toFixed(1)}m · Normal RT)`;
    
    const tagY = gwCenterY + (gwNormY < 0 ? -(halfW + 14) : (halfW + 20));
    drawSvgText(g, clampSvg(gwCenterX, 60, 920), clampSvg(tagY, 15, isPrintMode ? 310 : 530), labelText, weldColor, '10px', 'var(--font-mono)', 'bold', 'middle');
  }
}

function drawEndCap(g, x1, y1, x2, y2, label, color = '#ffffff') {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '2.5');
  g.appendChild(line);
  drawSvgText(g, (x1 + x2) / 2, (y1 + y2) / 2 - 10, label, color, '10px', "'JetBrains Mono', monospace", 'bold', 'middle');
}

function drawDimensionLine(g, x1, y1, x2, y2, text, strokeColor = '#94a3b8', textColor = '#cbd5e1', isPrint = false) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', strokeColor);
  line.setAttribute('stroke-width', '1.3');
  line.setAttribute('marker-start', isPrint ? 'url(#arrowPrintStart)' : 'url(#arrowStart)');
  line.setAttribute('marker-end', isPrint ? 'url(#arrowPrintEnd)' : 'url(#arrowEnd)');
  g.appendChild(line);
  
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2 - 7;
  drawSvgText(g, midX, midY, text, textColor, isPrint ? '10px' : '11px', 'var(--font-mono)', 'bold', 'middle');
}

function drawAngleArcCorrect(g, cx, cy, radius, endAngle, label, arcColor = '#f59e0b') {
  // Arc starts straight down from O: (cx, cy + radius)
  const x1 = cx;
  const y1 = cy + radius;
  const x2 = cx + radius * Math.sin(endAngle);
  const y2 = cy + radius * Math.cos(endAngle);
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  // Counter-clockwise arc in SVG from (x1, y1) to (x2, y2)
  path.setAttribute('d', `M ${x1} ${y1} A ${radius} ${radius} 0 0 0 ${x2} ${y2}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', arcColor);
  path.setAttribute('stroke-width', '2');
  g.appendChild(path);
  
  drawSvgText(g, (x1 + x2) / 2 + 12, (y1 + y2) / 2 + 6, label, arcColor, '11px', 'var(--font-mono)', 'bold');
}

function drawSvgText(g, x, y, text, fill, fontSize, fontFamily, fontWeight = 'normal', textAnchor = 'start') {
  const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  txt.setAttribute('x', x);
  txt.setAttribute('y', y);
  txt.setAttribute('fill', fill);
  txt.setAttribute('font-size', fontSize);
  // Presentation attributes don't resolve CSS var(); map to a concrete stack.
  txt.setAttribute('font-family', fontFamily === 'var(--font-mono)' ? "'JetBrains Mono', monospace" : fontFamily);
  txt.setAttribute('font-weight', fontWeight);
  txt.setAttribute('text-anchor', textAnchor);
  txt.textContent = text;
  g.appendChild(txt);
}

/* ==========================================================================
   3D WebGL Pipe Visualization (Mathematically Continuous C1 Curve)
   ========================================================================== */

let scene3D, camera3D, renderer3D, controls3D, gridHelper3D, lightRig3D;
let pipeCenter3D = null; // pipe midpoint, applied to orbit target on tab switch only
// Single home framing for the 3D view (opening view; resets re-fit distance)
const CAM_HOME_POS = [0, 7, 18];
let pipeMesh3D = null;
let pipeInnerMesh3D = null;
let pipeCaps3D = [];
let mandrelMesh3D = null;
let seamLine3D = null;
let girthWeldMesh3D = null;
let pullMarkers3D = [];
let bendCurve3D = null; // { curve, len } of the last built 3D pipe
let machineGroup3D = null;
let treeBendGroup3D = null;
let secretKeyBuffer = '';
let animLowDetail = false;
const bendAnim = { active: false, playing: false, step: 0, total: 0, done: 0, timer: null };
const ANIM_PRESS_MS = 380;
const ANIM_GAP_MS = 220;
// Long pull lists play faster so a full run stays watchable (~12 s max)
function animStepInterval(total) {
  return Math.min(ANIM_PRESS_MS + ANIM_GAP_MS, Math.max(150, Math.round(12000 / Math.max(1, total))));
}
let is3DInitialized = false;

function update3DGrid(isLight) {
  if (!scene3D) return;
  if (gridHelper3D) {
    scene3D.remove(gridHelper3D);
    if (gridHelper3D.geometry) gridHelper3D.geometry.dispose();
    if (gridHelper3D.material) gridHelper3D.material.dispose();
  }
  const c1 = isLight ? 0x94a3b8 : 0x1e293b;
  const c2 = isLight ? 0xcbd5e1 : 0x111827;
  // Grid follows the pipe length so long joints stay on a reference floor
  const gridSize = Math.ceil((state.length + 8) / 2) * 2;
  gridHelper3D = new THREE.GridHelper(gridSize, gridSize, c1, c2);
  gridHelper3D.position.y = -2.5;
  scene3D.add(gridHelper3D);
}

// Theme-reactive 3D light rig: keeps the pipe readable on both dark and
// light backgrounds (static lights washed out in light theme, looked flat in dark).
function tune3DLights(isLight) {
  if (!scene3D || !lightRig3D) return;
  const { ambient, key, rim, hemi } = lightRig3D;
  if (isLight) {
    scene3D.background = new THREE.Color(0xf1f5f9);
    ambient.intensity = 0.55;
    ambient.color.set(0xffffff);
    key.intensity = 1.15;
    key.color.set(0xfff7ed);
    rim.intensity = 0.35;
    rim.color.set(0xbae6fd);
    hemi.intensity = 0.45;
    hemi.color.set(0xffffff);
    hemi.groundColor.set(0x94a3b8);
    if (renderer3D) renderer3D.toneMappingExposure = 1.0;
  } else {
    scene3D.background = new THREE.Color(0x090d16);
    ambient.intensity = 0.75;
    ambient.color.set(0xdbeafe);
    key.intensity = 1.0;
    key.color.set(0x7dd3fc);
    rim.intensity = 0.55;
    rim.color.set(0xfbbf24);
    hemi.intensity = 0.5;
    hemi.color.set(0x8ab4ff);
    hemi.groundColor.set(0x0b0f19);
    if (renderer3D) renderer3D.toneMappingExposure = 1.12;
  }
}

let currentCameraPreset = 'iso';

function updateCameraPresetUI(presetName) {
  currentCameraPreset = presetName;
  const map = {
    iso: dom.btnCamIso,
    top: dom.btnCamTop,
    side: dom.btnCamSide,
    front: dom.btnCamFront
  };
  Object.keys(map).forEach((k) => {
    const btn = map[k];
    if (btn) {
      if (k === presetName) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
}

function set3DCameraPreset(presetName) {
  if (!camera3D || !controls3D) return;
  const w = (dom.container3D && dom.container3D.clientWidth) || 800;
  const h = (dom.container3D && dom.container3D.clientHeight) || 480;
  const tanV = Math.tan((camera3D.fov * Math.PI) / 360);
  const dist = Math.max(10, (state.length / 2 + 2.5) / (tanV * (w / h)));
  const c = pipeCenter3D || { x: 0, y: 0, z: 0 };

  camera3D.up.set(0, 1, 0);

  if (presetName === 'top') {
    // Üstten (Plan Görünümü): Kuşbakışı Z aşağı, X sağa
    camera3D.up.set(0, 0, -1);
    controls3D.target.set(c.x, c.y, c.z);
    camera3D.position.set(c.x, c.y + dist * 1.15, c.z);
  } else if (presetName === 'side') {
    // Yandan (Profil / Kavis Görünümü): Y yukarı, X sağa
    controls3D.target.set(c.x, c.y, c.z);
    camera3D.position.set(c.x, c.y, c.z + dist * 1.15);
  } else if (presetName === 'front') {
    // Önden (Boru Ağzı / Kesit Görünümü): Boru ön ağzına doğru bakış
    const frontPt = bendCurve3D && bendCurve3D.curve ? bendCurve3D.curve.getPointAt(0) : { x: -state.length / 2, y: 0, z: 0 };
    controls3D.target.set(frontPt.x, frontPt.y, frontPt.z);
    const closeDist = Math.max(3.2, (state.od / 1000) * 4.8);
    camera3D.position.set(frontPt.x - closeDist, frontPt.y + closeDist * 0.22, frontPt.z);
  } else {
    // İzometrik (Varsayılan 3D)
    controls3D.target.set(c.x, c.y, c.z);
    const dir = new THREE.Vector3(1, 0.45, 1).normalize();
    camera3D.position.copy(controls3D.target).addScaledVector(dir, dist);
  }

  controls3D.update();
  camera3D.updateProjectionMatrix();
  updateCameraPresetUI(presetName);
}

// Fit the camera distance to the pipe length along the current view
// direction (orientation is preserved; only framing is corrected).
function frameCameraToPipe() {
  if (!camera3D || !controls3D) return;
  const w = (dom.container3D && dom.container3D.clientWidth) || 800;
  const h = (dom.container3D && dom.container3D.clientHeight) || 480;
  const tanV = Math.tan((camera3D.fov * Math.PI) / 360);
  const dist = Math.max(10, (state.length / 2 + 2.5) / (tanV * (w / h)));
  const c = pipeCenter3D || { x: 0, y: 0, z: 0 };
  controls3D.target.set(c.x, c.y, c.z);
  const dir = new THREE.Vector3().subVectors(camera3D.position, controls3D.target);
  if (dir.lengthSq() < 1e-6) dir.set(0, 0.4, 1);
  dir.normalize();
  camera3D.position.copy(controls3D.target).addScaledVector(dir, dist);
  controls3D.update();
}

function applyTheme(themeName) {
  state.theme = themeName;
  localStorage.setItem('coldbend_theme', themeName);
  const isLight = themeName === 'light';
  if (isLight) {
    document.body.classList.add('light-theme');
    if (dom.themeIcon) dom.themeIcon.textContent = '🌙';
    if (dom.themeLabel) dom.themeLabel.textContent = 'Koyu Tema';
    if (scene3D) {
      update3DGrid(true);
      tune3DLights(true);
      if (is3DInitialized && dom.view3D.classList.contains('active')) update3DPipe(runCalculations());
    }
  } else {
    document.body.classList.remove('light-theme');
    if (dom.themeIcon) dom.themeIcon.textContent = '☀️';
    if (dom.themeLabel) dom.themeLabel.textContent = 'Açık Tema';
    if (scene3D) {
      update3DGrid(false);
      tune3DLights(false);
      if (is3DInitialized && dom.view3D.classList.contains('active')) update3DPipe(runCalculations());
    }
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', isLight ? '#f8fafc' : '#0b0f19');
  render2DSketch(runCalculations());
}

function init3DScene() {
  if (is3DInitialized) return;
  
  const container = dom.container3D;
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 480;
  
  if (typeof THREE === 'undefined') {
    dom.loading3D.innerHTML = '<span>Three.js kütüphanesi yüklenemedi.</span>';
    return;
  }
  
  const isLight = document.body.classList.contains('light-theme');
  scene3D = new THREE.Scene();
  scene3D.background = new THREE.Color(isLight ? 0xf8fafc : 0x090d16);
  
  // Camera setup
  camera3D = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera3D.position.set(...CAM_HOME_POS);
  
  // Renderer setup (may throw when WebGL is unavailable)
  try {
    renderer3D = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch (err) {
    dom.loading3D.innerHTML = '<span>WebGL başlatılamadı — 3D görünüm kullanılamıyor.</span>';
    return;
  }
  renderer3D.setSize(width, height);
  renderer3D.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer3D.shadowMap.enabled = true;
  renderer3D.toneMapping = THREE.ACESFilmicToneMapping;
  renderer3D.domElement.style.display = 'block';
  container.appendChild(renderer3D.domElement);
  // The wrapper already carries role="img" + label; hide the raw canvas
  renderer3D.domElement.setAttribute('aria-hidden', 'true');
  
  // OrbitControls
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls3D = new THREE.OrbitControls(camera3D, renderer3D.domElement);
    controls3D.enableDamping = true;
    controls3D.dampingFactor = 0.05;
    controls3D.maxDistance = 50;
    controls3D.minDistance = 3;
    controls3D.target.set(0, 0, 0);
    controls3D.autoRotate = false;
    controls3D.autoRotateSpeed = 2.0;

    // Only allow wheel zoom in 3D canvas when Ctrl or Cmd is held (or pinch-zoom);
    // otherwise allow the mouse roller to scroll the page naturally without trapping the user
    renderer3D.domElement.addEventListener('wheel', (e) => {
      controls3D.enableZoom = Boolean(e.ctrlKey || e.metaKey);
    }, { capture: true, passive: true });
  }
  
  // Lighting (theme-reactive rig; tuned per theme by tune3DLights)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene3D.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 0.9);
  dirLight1.position.set(10, 20, 15);
  scene3D.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight2.position.set(-15, -10, -10);
  scene3D.add(dirLight2);

  const hemiLight = new THREE.HemisphereLight(0x8ab4ff, 0x0b0f19, 0.5);
  hemiLight.position.set(0, 12, 0);
  scene3D.add(hemiLight);

  lightRig3D = { ambient: ambientLight, key: dirLight1, rim: dirLight2, hemi: hemiLight };
  tune3DLights(isLight);
  
  // Floor Reference Grid
  update3DGrid(isLight);
  
  dom.loading3D.style.display = 'none';
  is3DInitialized = true;
  
  // Animation Loop (skips GPU work while the 3D tab is hidden or tab is in background)
  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden || !dom.view3D.classList.contains('active')) return;
    if (controls3D) controls3D.update();
    renderer3D.render(scene3D, camera3D);
  }
  animate();
  
  // Resize Handler
  window.addEventListener('resize', onWindowResize3D);
}

function onWindowResize3D() {
  if (!is3DInitialized || !renderer3D) return;
  const container = dom.container3D;
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 480;
  camera3D.aspect = width / height;
  camera3D.updateProjectionMatrix();
  renderer3D.setSize(width, height);
}

function toggle3DFullscreen() {
  const elem = dom.container3D;
  if (!elem) return;
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

function handleFullscreenChange() {
  const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
  if (dom.btn3dFullscreen) {
    dom.btn3dFullscreen.textContent = isFull ? '✕ Küçült' : '⛶ Tam Ekran';
    dom.btn3dFullscreen.setAttribute('aria-pressed', String(isFull));
  }
  setTimeout(onWindowResize3D, 60);
}

document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

function export3DSnapshot() {
  if (!is3DInitialized || !renderer3D || !scene3D || !camera3D) return;
  renderer3D.render(scene3D, camera3D);
  renderer3D.domElement.toBlob((blob) => {
    if (!blob) return;
    const safePipeNo = (state.pipeNo || 'Boru').toString().replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `ColdBend_3D_${safePipeNo}.png`;
    triggerDownload(blob, filename);
  }, 'image/png');
}

function toggle3DAutoRotate() {
  if (!controls3D) return;
  controls3D.autoRotate = !controls3D.autoRotate;
  if (dom.btn3dAutoRotate) {
    dom.btn3dAutoRotate.setAttribute('aria-pressed', String(controls3D.autoRotate));
    dom.btn3dAutoRotate.classList.toggle('active', controls3D.autoRotate);
    dom.btn3dAutoRotate.textContent = controls3D.autoRotate ? '⏸ Döndürmeyi Durdur' : '🔄 360° Döndür';
  }
}

function update3DPipe(calc, angleOverrideDeg = null) {
  if (!is3DInitialized) {
    if (dom.view3D.classList.contains('active')) {
      init3DScene();
    } else {
      return;
    }
  }
  if (!is3DInitialized || !scene3D || typeof THREE === 'undefined') return;

  // Perf: skip rebuild while 3D tab is hidden.
  // Tab switch (tab3D handler) already calls update3DPipe after activating view3D.
  if (!dom.view3D.classList.contains('active')) return;
  
  // Free GPU buffers of the previous rebuild (slider drags rebuild often)
  const disposeMesh = (m) => {
    if (!m) return;
    scene3D.remove(m);
    m.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((mt) => {
        if (mt && mt.map && mt.map.dispose) mt.map.dispose();
        if (mt && mt.dispose) mt.dispose();
      });
    });
  };
  disposeMesh(pipeMesh3D);
  disposeMesh(pipeInnerMesh3D);
  disposeMesh(mandrelMesh3D);
  disposeMesh(seamLine3D);
  disposeMesh(girthWeldMesh3D);
  (pipeCaps3D || []).forEach(disposeMesh);
  pipeCaps3D = [];
  (pullMarkers3D || []).forEach(disposeMesh);
  pullMarkers3D = [];
  pipeMesh3D = pipeInnerMesh3D = mandrelMesh3D = seamLine3D = girthWeldMesh3D = null;
  
  // Geometry parameters
  const totalLength = state.length;
  const t1 = state.tangent1;
  const t2 = state.tangent2;
  // Manual inputs reshape the model: bend zone starts at the pull start
  // (centered when Lt1 == Lt2); rear straight fills the realized length.
  const pbStart = calc.pullStartM;
  const r_bend = calc.r_bend_m;
  const thetaRad = ((angleOverrideDeg != null ? angleOverrideDeg : state.targetAngle) * Math.PI) / 180;
  const t2draw3D = Math.max(t2, state.length - pbStart - r_bend * thetaRad);

  // Pipe outer radius in 3D coordinate units (1m = 1 unit)
  const pipeRadius = (state.od / 1000) / 2;
  
  // Center the overall pipe symmetrically around origin (0, 0, 0)
  const startX = -totalLength / 2;
  
  // Mathematically Continuous C1 Curve Points
  const curvePoints = [];
  let arcStartIndex = 0;
  let arcEndIndex = 0;
  let x_pc = 0;
  let pt_last = null;
  const activeBendType = state.isTreeBendMode ? 'sidebend_right' : state.bendType;

  const isFeedThrough = bendAnim.active || state.isTreeBendMode;

  if (isFeedThrough) {
    // KINEMATIC REALISM: Stationary Bending Machine / Fixed Tree at (0,0,0) & Feed-Through Pipe
    // Pipe feeds from -X into machine die / tree contact at (0,0,0). Bent arc emerges into +X, +Z.
    const kStep = state.isTreeBendMode && !bendAnim.active
      ? calc.numPulls
      : Math.max(1, Math.min(calc.numPulls, bendAnim.step || 1));
    const s_k = pbStart + kStep * calc.pullStepPitch; // distance from front tip to active pull station
    const l_arc_k = kStep * calc.pullStepPitch;       // realized bent arc length so far
    const l_rear = Math.max(0, totalLength - s_k);    // unbent tail behind the die

    // Tangent direction vectors at arc exit
    let dirX = Math.cos(thetaRad);
    let dirY = 0;
    let dirZ = 0;
    if (activeBendType === 'overbend') {
      dirY = Math.sin(thetaRad);
    } else if (activeBendType === 'sagbend') {
      dirY = -Math.sin(thetaRad);
    } else if (activeBendType === 'sidebend_right') {
      dirZ = Math.sin(thetaRad);
    } else if (activeBendType === 'sidebend_left') {
      dirZ = -Math.sin(thetaRad);
    } else { // compound
      const rollRad = (state.compoundRollAngle || 45) * Math.PI / 180;
      const vSign = state.compoundVertDir === 'sagbend' ? -1 : 1;
      const hSign = state.compoundHoriDir === 'left' ? -1 : 1;
      dirY = Math.sin(thetaRad) * Math.sin(rollRad) * vSign;
      dirZ = Math.sin(thetaRad) * Math.cos(rollRad) * hSign;
    }

    // Arc tip coordinate (where front tangent attaches)
    const arcTipX = thetaRad > 1e-6 ? r_bend * Math.sin(thetaRad) : l_arc_k;
    const arcDefl = thetaRad > 1e-6 ? r_bend * (1 - Math.cos(thetaRad)) : 0;
    let arcTipY = 0, arcTipZ = 0;
    if (activeBendType === 'overbend') arcTipY = arcDefl;
    else if (activeBendType === 'sagbend') arcTipY = -arcDefl;
    else if (activeBendType === 'sidebend_right') arcTipZ = arcDefl;
    else if (activeBendType === 'sidebend_left') arcTipZ = -arcDefl;
    else {
      const rollRad = (state.compoundRollAngle || 45) * Math.PI / 180;
      const vSign = state.compoundVertDir === 'sagbend' ? -1 : 1;
      const hSign = state.compoundHoriDir === 'left' ? -1 : 1;
      arcTipY = arcDefl * Math.sin(rollRad) * vSign;
      arcTipZ = arcDefl * Math.cos(rollRad) * hSign;
    }

    // --- 1. FRONT TANGENT (from front tip s=0 to start of arc s=pbStart) ---
    const numStepsT1 = 16;
    for (let i = 0; i <= numStepsT1; i++) {
      const fraction = i / numStepsT1;
      const distFromArc = pbStart * (1 - fraction); // i=0 is front tip, i=numStepsT1 is arc attachment
      const x = arcTipX + distFromArc * dirX;
      const y = arcTipY + distFromArc * dirY;
      const z = arcTipZ + distFromArc * dirZ;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }

    // --- 2. BENT CIRCULAR ARC (from arc attachment down to the die at 0,0,0) ---
    arcStartIndex = curvePoints.length - 1;
    const numStepsArc = 40;
    for (let i = 1; i <= numStepsArc; i++) {
      const fraction = i / numStepsArc;
      const phi = thetaRad * (1 - fraction); // fraction 0 is arcTip, fraction 1 is die (phi=0)
      const dx = thetaRad > 1e-6 ? r_bend * Math.sin(phi) : l_arc_k * (1 - fraction);
      const defl = thetaRad > 1e-6 ? r_bend * (1 - Math.cos(phi)) : 0;
      let curX = dx;
      let curY = 0;
      let curZ = 0;
      if (activeBendType === 'overbend') curY = defl;
      else if (activeBendType === 'sagbend') curY = -defl;
      else if (activeBendType === 'sidebend_right') curZ = defl;
      else if (activeBendType === 'sidebend_left') curZ = -defl;
      else {
        const rollRad = (state.compoundRollAngle || 45) * Math.PI / 180;
        const vSign = state.compoundVertDir === 'sagbend' ? -1 : 1;
        const hSign = state.compoundHoriDir === 'left' ? -1 : 1;
        curY = defl * Math.sin(rollRad) * vSign;
        curZ = defl * Math.cos(rollRad) * hSign;
      }
      curvePoints.push(new THREE.Vector3(curX, curY, curZ));
    }
    arcEndIndex = curvePoints.length - 1; // at (0, 0, 0) die
    pt_last = curvePoints[arcStartIndex];
    x_pc = 0;

    // --- 3. UNBENT REAR PIPE (straight line extending backwards along -X from die) ---
    const numStepsT2 = 20;
    for (let i = 1; i <= numStepsT2; i++) {
      const fraction = i / numStepsT2;
      const x = -l_rear * fraction; // extends from 0 to -l_rear
      curvePoints.push(new THREE.Vector3(x, 0, 0));
    }

  } else {
    // STANDARD / STATIC PIPE REPRESENTATION (Centered at startX = -totalLength / 2)
    // --- 1. FRONT TANGENT (Straight line along +X at Y=0, Z=0) ---
    const numStepsT1 = 16;
    for (let i = 0; i <= numStepsT1; i++) {
      const fraction = i / numStepsT1;
      const x = startX + pbStart * fraction;
      curvePoints.push(new THREE.Vector3(x, 0, 0));
    }
    
    // Point of Curvature (PC)
    x_pc = startX + pbStart;
    
    // --- 2. BENT CIRCULAR ARC (Smooth C1 tangency starting at PC) ---
    const numStepsArc = 40;
    arcStartIndex = curvePoints.length - 1;
    
    for (let i = 1; i <= numStepsArc; i++) {
      const fraction = i / numStepsArc;
      const phi = thetaRad * fraction;
      const dx = r_bend * Math.sin(phi);
      const defl = r_bend * (1 - Math.cos(phi));
      
      let curX = x_pc + dx;
      let curY = 0;
      let curZ = 0;
      
      if (activeBendType === 'overbend') {
        curY = defl; // Upward arch
      } else if (activeBendType === 'sagbend') {
        curY = -defl; // Downward dip
      } else if (activeBendType === 'sidebend_right') {
        curZ = defl; // Horizontal right
      } else if (activeBendType === 'sidebend_left') {
        curZ = -defl; // Horizontal left
      } else { // compound
        const rollRad = (state.compoundRollAngle || 45) * Math.PI / 180;
        const vSign = state.compoundVertDir === 'sagbend' ? -1 : 1;
        const hSign = state.compoundHoriDir === 'left' ? -1 : 1;
        curY = defl * Math.sin(rollRad) * vSign;
        curZ = defl * Math.cos(rollRad) * hSign;
      }
      curvePoints.push(new THREE.Vector3(curX, curY, curZ));
    }
    
    arcEndIndex = curvePoints.length - 1;
    pt_last = curvePoints[arcEndIndex];
    
    // --- 3. REAR TANGENT (Straight line continuing along tangent vector) ---
    const numStepsT2 = 16;
    let dirX = Math.cos(thetaRad);
    let dirY = 0;
    let dirZ = 0;
    if (activeBendType === 'overbend') {
      dirY = Math.sin(thetaRad);
    } else if (activeBendType === 'sagbend') {
      dirY = -Math.sin(thetaRad);
    } else if (activeBendType === 'sidebend_right') {
      dirZ = Math.sin(thetaRad);
    } else if (activeBendType === 'sidebend_left') {
      dirZ = -Math.sin(thetaRad);
    } else { // compound
      const rollRad = (state.compoundRollAngle || 45) * Math.PI / 180;
      const vSign = state.compoundVertDir === 'sagbend' ? -1 : 1;
      const hSign = state.compoundHoriDir === 'left' ? -1 : 1;
      dirY = Math.sin(thetaRad) * Math.sin(rollRad) * vSign;
      dirZ = Math.sin(thetaRad) * Math.cos(rollRad) * hSign;
    }
    
    for (let i = 1; i <= numStepsT2; i++) {
      const fraction = i / numStepsT2;
      const x = pt_last.x + t2draw3D * fraction * dirX;
      const y = pt_last.y + t2draw3D * fraction * dirY;
      const z = pt_last.z + t2draw3D * fraction * dirZ;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }
  }
  
  // Build smooth 3D spline curve
  const pipeCurve = new THREE.CatmullRomCurve3(curvePoints);
  
  // Tube Geometry with vertex colors for stress visualization
  // (low detail while the bend animation rebuilds every step)
  const tubularSegments = animLowDetail ? 56 : 140;
  const radialSegments = animLowDetail ? 14 : 32;
  const pipeGeom = new THREE.TubeGeometry(pipeCurve, tubularSegments, pipeRadius, radialSegments, false);
  
  // Fiber stress gradient (intrados/extrados): sigma = E*y/R, epsilon = y/R.
  // q = signed fiber coordinate in [-1, +1] measured from the bend neutral
  // plane along the deflection direction (extrados +, intrados -). Tangents
  // stay neutral; the bend zone blends in with a smoothstep feather.
  // (Elastic fiber theory; in reality limited by yielding — pass/fail stays
  // with the thinning/ovality checks. Core formulas untouched.)
  const E_MOD = 207000; // MPa, steel
  const odM = state.od / 1000;
  const bendDir = (() => {
    if (activeBendType === 'overbend') return { x: 0, y: 1, z: 0 };
    if (activeBendType === 'sagbend') return { x: 0, y: -1, z: 0 };
    if (activeBendType === 'sidebend_right') return { x: 0, y: 0, z: 1 };
    if (activeBendType === 'sidebend_left') return { x: 0, y: 0, z: -1 };
    const rollRad = (state.compoundRollAngle || 45) * Math.PI / 180;
    const vSign = state.compoundVertDir === 'sagbend' ? -1 : 1;
    const hSign = state.compoundHoriDir === 'left' ? -1 : 1;
    return { x: 0, y: Math.sin(rollRad) * vSign, z: Math.cos(rollRad) * hSign };
  })();
  const arcPts = [];
  for (let k = arcStartIndex; k <= arcEndIndex; k++) {
    const p = curvePoints[k];
    arcPts.push(p.x, p.y, p.z);
  }
  const arcCount = arcPts.length / 3;
  const x_arc_min = Math.min(x_pc, pt_last.x);
  const x_arc_max = Math.max(x_pc, pt_last.x);
  const spanX = Math.max(x_arc_max - x_arc_min, 1e-9);
  const feather = Math.max(spanX * 0.06, 1e-9);
  const themeIsLight = document.body.classList.contains('light-theme');
  // Neutral steel base (theme-aware so tangents read on both backgrounds)
  const nR = themeIsLight ? 0.40 : 0.52;
  const nG = themeIsLight ? 0.47 : 0.59;
  const nB = themeIsLight ? 0.56 : 0.68;
  // Gradient poles: tension (extrados) red, compression (intrados) blue
  const tR = 0.93, tG = 0.26, tB = 0.26;
  const cR = 0.24, cG = 0.52, cB = 0.95;

  const count = pipeGeom.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const pos = pipeGeom.attributes.position;

  for (let i = 0; i < count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);

    // Bend-zone mask with feathered edges (0 on tangents, 1 inside arc)
    let m = 0;
    if (spanX > 1e-9 && vx >= x_arc_min && vx <= x_arc_max) {
      const edge = Math.min(vx - x_arc_min, x_arc_max - vx) / feather;
      const f = Math.min(1, edge);
      m = f * f * (3 - 2 * f);
    }

    let q = 0;
    if (m > 0 && arcCount > 0 && pipeRadius > 1e-12) {
      // Nearest arc centerline point -> radial fiber direction
      let best = Infinity, bx = 0, by = 0, bz = 0;
      for (let a = 0; a < arcCount; a++) {
        const dx = vx - arcPts[a * 3];
        const dy = vy - arcPts[a * 3 + 1];
        const dz = vz - arcPts[a * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < best) { best = d2; bx = dx; by = dy; bz = dz; }
      }
      q = - (bx * bendDir.x + by * bendDir.y + bz * bendDir.z) / pipeRadius;
      if (q > 1) q = 1;
      else if (q < -1) q = -1;
      q *= m;
    }

    const mag = Math.pow(Math.abs(q), 0.8);
    if (q >= 0) {
      colors[i * 3] = nR + (tR - nR) * mag;
      colors[i * 3 + 1] = nG + (tG - nG) * mag;
      colors[i * 3 + 2] = nB + (tB - nB) * mag;
    } else {
      colors[i * 3] = nR + (cR - nR) * mag;
      colors[i * 3 + 1] = nG + (cG - nG) * mag;
      colors[i * 3 + 2] = nB + (cB - nB) * mag;
    }
  }
  pipeGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Extreme fiber values for the 3D legend and 3D surface callouts (elastic theory)
  let epsMax = 0, sigMax = 0;
  if (r_bend > 1e-9 && odM > 0) {
    epsMax = (odM / 2) / r_bend; // strain at outer fiber
    sigMax = E_MOD * epsMax;     // MPa, elastic fiber stress
    const extTxt = `ε +${(epsMax * 100).toFixed(2)}% · σ ≈ +${sigMax.toFixed(0)} MPa`;
    const intTxt = `ε −${(epsMax * 100).toFixed(2)}% · σ ≈ −${sigMax.toFixed(0)} MPa`;
    if (dom.legend3DValueExt) dom.legend3DValueExt.textContent = spanX > 1e-9 ? extTxt : '—';
    if (dom.legend3DValueInt) dom.legend3DValueInt.textContent = spanX > 1e-9 ? intTxt : '—';
  } else {
    if (dom.legend3DValueExt) dom.legend3DValueExt.textContent = '—';
    if (dom.legend3DValueInt) dom.legend3DValueInt.textContent = '—';
  }

  // Helper for cross-browser canvas rounded rectangles
  const drawCanvasRoundRect = (ctx, x, y, w, h, r) => {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  };

  const tNom = state.t_nom || 14.3;

  // Update wall thickness display in legend
  if (dom.legend3DValueWt) {
    const idVal = Math.max(0, state.od - 2 * tNom);
    const dtVal = tNom > 0 ? (state.od / tNom).toFixed(1) : '—';
    dom.legend3DValueWt.textContent = `t ${tNom.toFixed(1)} mm · ID ${idVal.toFixed(1)} mm (D/t: ${dtVal})`;
  }

  // When the internal mandrel is shown, fade the shell so the green
  // mandrel inside the opaque tube actually becomes visible.
  const mandrelShown = state.useMandrel && state.mandrelVisible3D;
  const pipeMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.45,
    roughness: 0.42,
    wireframe: false,
    transparent: mandrelShown,
    opacity: mandrelShown ? 0.45 : 1.0
  });
  
  pipeMesh3D = new THREE.Mesh(pipeGeom, pipeMaterial);
  scene3D.add(pipeMesh3D);

  // --- Real Hollow Pipe Geometry: Inner Bore Tube & Annular Wall End Caps ---
  const wtM = tNom / 1000;
  const innerRadius = Math.max(0.001, pipeRadius - wtM);
  const pipeInnerGeom = new THREE.TubeGeometry(pipeCurve, tubularSegments, innerRadius, radialSegments, false);
  const pipeInnerMat = new THREE.MeshStandardMaterial({
    color: themeIsLight ? 0x1e293b : 0x0f172a,
    metalness: 0.65,
    roughness: 0.55,
    side: THREE.BackSide,
    transparent: mandrelShown,
    opacity: mandrelShown ? 0.30 : 1.0
  });
  pipeInnerMesh3D = new THREE.Mesh(pipeInnerGeom, pipeInnerMat);
  scene3D.add(pipeInnerMesh3D);

  // Annular Cut Faces at both pipe ends (front u=0 and rear u=1)
  const endFaceMat = new THREE.MeshStandardMaterial({
    color: themeIsLight ? 0x475569 : 0x334155,
    metalness: 0.8,
    roughness: 0.32,
    side: THREE.DoubleSide
  });

  const ptStart = pipeCurve.getPointAt(0);
  const tangStart = pipeCurve.getTangentAt(0).normalize();
  const ringGeomStart = new THREE.RingGeometry(innerRadius, pipeRadius, radialSegments);
  const qStart = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangStart);
  const capStart = new THREE.Mesh(ringGeomStart, endFaceMat);
  capStart.position.copy(ptStart);
  capStart.quaternion.copy(qStart);
  scene3D.add(capStart);
  pipeCaps3D.push(capStart);

  const ptEnd = pipeCurve.getPointAt(1);
  const tangEnd = pipeCurve.getTangentAt(1).normalize();
  const ringGeomEnd = new THREE.RingGeometry(innerRadius, pipeRadius, radialSegments);
  const qEnd = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangEnd);
  const capEnd = new THREE.Mesh(ringGeomEnd, endFaceMat);
  capEnd.position.copy(ptEnd);
  capEnd.quaternion.copy(qEnd);
  scene3D.add(capEnd);
  pipeCaps3D.push(capEnd);

  // 3D Wall Thickness Leader Dimension & Engineering Callout Sprite at Front Cut Face
  const upRef = new THREE.Vector3(0, 1, 0);
  let sideVec = new THREE.Vector3().crossVectors(tangStart, upRef).normalize();
  if (sideVec.lengthSq() < 0.001) sideVec.set(1, 0, 0);
  const normalRadial = new THREE.Vector3().crossVectors(sideVec, tangStart).normalize();

  const ptInner = ptStart.clone().addScaledVector(normalRadial, innerRadius);
  const ptOuter = ptStart.clone().addScaledVector(normalRadial, pipeRadius);
  const ptCallout = ptStart.clone().addScaledVector(normalRadial, pipeRadius + 0.42).addScaledVector(sideVec, 0.18);

  const leaderPts = [
    ptInner.x, ptInner.y, ptInner.z,
    ptOuter.x, ptOuter.y, ptOuter.z,
    ptOuter.x, ptOuter.y, ptOuter.z,
    ptCallout.x, ptCallout.y, ptCallout.z
  ];
  const leaderGeom = new THREE.BufferGeometry();
  leaderGeom.setAttribute('position', new THREE.Float32BufferAttribute(leaderPts, 3));
  const leaderMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    linewidth: 2,
    transparent: true,
    opacity: 0.9
  });
  const leaderLine = new THREE.LineSegments(leaderGeom, leaderMat);
  scene3D.add(leaderLine);
  pipeCaps3D.push(leaderLine);

  // High-DPI 2D Canvas for crisp callout badge sprite
  const badgeCanvas = document.createElement('canvas');
  badgeCanvas.width = 512;
  badgeCanvas.height = 160;
  const bCtx = badgeCanvas.getContext('2d');
  bCtx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  drawCanvasRoundRect(bCtx, 6, 6, 500, 148, 14);
  bCtx.fill();
  bCtx.strokeStyle = '#38bdf8';
  bCtx.lineWidth = 4;
  bCtx.stroke();
  bCtx.fillStyle = '#38bdf8';
  bCtx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  bCtx.textAlign = 'center';
  bCtx.fillText(`BORU ET KALINLIĞI (t)`, 256, 42);
  bCtx.fillStyle = '#f8fafc';
  bCtx.font = 'bold 38px system-ui, -apple-system, sans-serif';
  bCtx.fillText(`t = ${tNom.toFixed(1)} mm`, 256, 88);
  const idMM = Math.max(0, state.od - 2 * tNom);
  bCtx.fillStyle = '#94a3b8';
  bCtx.font = '600 22px system-ui, -apple-system, sans-serif';
  bCtx.fillText(`İç Çap: ${idMM.toFixed(1)} mm · D/t: ${(state.od / tNom).toFixed(1)}`, 256, 126);

  const badgeTex = new THREE.CanvasTexture(badgeCanvas);
  const badgeMat = new THREE.SpriteMaterial({
    map: badgeTex,
    transparent: true,
    depthTest: false
  });
  const badgeSprite = new THREE.Sprite(badgeMat);
  badgeSprite.position.copy(ptCallout).addScaledVector(normalRadial, 0.22);
  badgeSprite.scale.set(1.5, 0.48, 1);
  scene3D.add(badgeSprite);
  pipeCaps3D.push(badgeSprite);

  // --- 3D Pipe Surface Stress Callouts (Extrados Çekme & İntrados Basınç) ---
  if (r_bend > 1e-9 && odM > 0 && Math.abs(thetaRad) > 0.005 && arcCount > 2) {
    const uMid = (arcStartIndex + arcEndIndex) / (2 * Math.max(1, curvePoints.length - 1));
    const ptMidArc = pipeCurve.getPointAt(Math.max(0, Math.min(1, uMid)));
    const bDirVec = new THREE.Vector3(bendDir.x, bendDir.y, bendDir.z).normalize();

    // Helper for stress callout sprite
    const createStressBadge = (title, valText, subText, borderColor, bgColor, titleColor) => {
      const sCanvas = document.createElement('canvas');
      sCanvas.width = 460;
      sCanvas.height = 140;
      const sCtx = sCanvas.getContext('2d');
      sCtx.fillStyle = bgColor;
      drawCanvasRoundRect(sCtx, 6, 6, 448, 128, 14);
      sCtx.fill();
      sCtx.strokeStyle = borderColor;
      sCtx.lineWidth = 4;
      sCtx.stroke();
      sCtx.fillStyle = titleColor;
      sCtx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      sCtx.textAlign = 'center';
      sCtx.fillText(title, 230, 36);
      sCtx.fillStyle = '#f8fafc';
      sCtx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      sCtx.fillText(valText, 230, 80);
      sCtx.fillStyle = '#cbd5e1';
      sCtx.font = '600 20px system-ui, -apple-system, sans-serif';
      sCtx.fillText(subText, 230, 116);

      const sTex = new THREE.CanvasTexture(sCanvas);
      const sMat = new THREE.SpriteMaterial({ map: sTex, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(sMat);
      sprite.scale.set(1.4, 0.42, 1);
      return sprite;
    };

    // Helper for leader pin line and surface anchor sphere
    const createStressPin = (ptSurf, ptBadge, pinColor) => {
      const pGeom = new THREE.BufferGeometry();
      pGeom.setAttribute('position', new THREE.Float32BufferAttribute([
        ptSurf.x, ptSurf.y, ptSurf.z,
        ptBadge.x, ptBadge.y, ptBadge.z
      ], 3));
      const pMat = new THREE.LineBasicMaterial({ color: pinColor, linewidth: 2, transparent: true, opacity: 0.85 });
      const line = new THREE.Line(pGeom, pMat);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(0.015, pipeRadius * 0.04), 8, 8),
        new THREE.MeshBasicMaterial({ color: pinColor })
      );
      dot.position.copy(ptSurf);
      const pGroup = new THREE.Group();
      pGroup.add(line);
      pGroup.add(dot);
      return pGroup;
    };

    // A. Extrados (Çekme Lif Tepe Noktası - Dış Viraj, Çekme Lifleri)
    const ptExtSurf = ptMidArc.clone().addScaledVector(bDirVec, -pipeRadius);
    const ptExtBadge = ptExtSurf.clone().addScaledVector(bDirVec, -0.65);
    const extPinGroup = createStressPin(ptExtSurf, ptExtBadge, 0xef4444);
    scene3D.add(extPinGroup);
    pipeCaps3D.push(extPinGroup);

    const extSprite = createStressBadge(
      '🔴 EKSTRADOS (ÇEKME LİFİ)',
      `σ ≈ +${sigMax.toFixed(0)} MPa`,
      `Maks. Gerinim: ε +${(epsMax * 100).toFixed(2)}%`,
      '#ef4444',
      'rgba(26, 10, 10, 0.92)',
      '#fca5a5'
    );
    extSprite.position.copy(ptExtBadge).addScaledVector(bDirVec, -0.22);
    scene3D.add(extSprite);
    pipeCaps3D.push(extSprite);

    // B. İntrados (Basınç Lif Tepe Noktası - İç Viraj, Basma Lifleri)
    const ptIntSurf = ptMidArc.clone().addScaledVector(bDirVec, pipeRadius);
    const ptIntBadge = ptIntSurf.clone().addScaledVector(bDirVec, 0.65);
    const intPinGroup = createStressPin(ptIntSurf, ptIntBadge, 0x3b82f6);
    scene3D.add(intPinGroup);
    pipeCaps3D.push(intPinGroup);

    const intSprite = createStressBadge(
      '🔵 İNTRADOS (BASINÇ LİFİ)',
      `σ ≈ −${sigMax.toFixed(0)} MPa`,
      `Maks. Basma: ε −${(epsMax * 100).toFixed(2)}%`,
      '#3b82f6',
      'rgba(10, 22, 40, 0.92)',
      '#93c5fd'
    );
    intSprite.position.copy(ptIntBadge).addScaledVector(bDirVec, 0.22);
    scene3D.add(intSprite);
    pipeCaps3D.push(intSprite);
  }
  
  // Internal Hydraulic Mandrel Mesh (Placed accurately inside the bent arc)
  if (mandrelShown) {
    const mandrelCurvePoints = [];
    for (let i = arcStartIndex; i <= arcEndIndex; i += 2) {
      mandrelCurvePoints.push(curvePoints[i]);
    }
    
    if (mandrelCurvePoints.length > 2) {
      const mandrelCurve = new THREE.CatmullRomCurve3(mandrelCurvePoints);
      const mandrelGeom = new THREE.TubeGeometry(mandrelCurve, animLowDetail ? 16 : 40, pipeRadius * 0.86, 16, false);
      const mandrelMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        metalness: 0.9,
        roughness: 0.2,
        transparent: true,
        opacity: 0.88
      });
      mandrelMesh3D = new THREE.Mesh(mandrelGeom, mandrelMat);
      scene3D.add(mandrelMesh3D);
    }
  }
  
  // --- Dynamic 3D Weld Seam by Pipe Type (SAWH, SAWL, SMLS) & Clock Position ---
  const clockCheck = validateClockSafety(state.bendType, state.clockPos, state.seamAngle);
  const seamRadOffset = (clockCheck.angleDeg * Math.PI) / 180;
  
  if (state.seamVisible3D && state.seamType !== 'SMLS') {
    const seamPoints = [];
    const beadRadius = Math.max(0.012, pipeRadius * 0.032);
    const rSurface = pipeRadius + beadRadius * 0.45; // Raised weld reinforcement bead sitting on pipe surface
    
    if (state.seamType === 'SAWH') {
      // SAWH: Continuous Helical Spiral Weld Seam hugging the cylindrical pipe surface
      const helixAngleRad = 58 * Math.PI / 180;
      const pitch = Math.PI * (2 * pipeRadius) / Math.tan(helixAngleRad);
      const numTurns = Math.max(1, totalLength / pitch);
      // High sample density per turn eliminates any polygonal chord facets
      const ptsPerTurn = animLowDetail ? 16 : 36;
      const numSamples = Math.max(animLowDetail ? 100 : 260, Math.round(numTurns * ptsPerTurn));
      const frames = pipeCurve.computeFrenetFrames(numSamples, false);
      
      for (let i = 0; i <= numSamples; i++) {
        const u = i / numSamples;
        const pt = pipeCurve.getPointAt(u);
        const normal = frames.normals[i];
        const binormal = frames.binormals[i];
        
        const s = u * totalLength;
        const phi = (2 * Math.PI * s) / pitch + seamRadOffset;
        
        const surfaceOffset = new THREE.Vector3()
          .addScaledVector(normal, Math.cos(phi) * rSurface)
          .addScaledVector(binormal, Math.sin(phi) * rSurface);
          
        seamPoints.push(new THREE.Vector3().addVectors(pt, surfaceOffset));
      }
      
      const seamCurve = new THREE.CatmullRomCurve3(seamPoints);
      const tubularSegments = Math.max(animLowDetail ? 80 : 240, Math.round(numTurns * (animLowDetail ? 14 : 32)));
      const seamGeom = new THREE.TubeGeometry(seamCurve, tubularSegments, beadRadius, animLowDetail ? 6 : 8, false);
      const seamMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.9,
        roughness: 0.25
      });
      seamLine3D = new THREE.Mesh(seamGeom, seamMat);
      scene3D.add(seamLine3D);
      
    } else if (state.seamType === 'SAWL') {
      // SAWL / HFW: Longitudinal Weld Seam along the specified clock angle
      const numSamples = animLowDetail ? 48 : 120;
      const frames = pipeCurve.computeFrenetFrames(numSamples, false);
      for (let i = 0; i <= numSamples; i++) {
        const u = i / numSamples;
        const pt = pipeCurve.getPointAt(u);
        const normal = frames.normals[i];
        const binormal = frames.binormals[i];
        
        const surfaceOffset = new THREE.Vector3()
          .addScaledVector(normal, Math.cos(seamRadOffset) * rSurface)
          .addScaledVector(binormal, Math.sin(seamRadOffset) * rSurface);
          
        seamPoints.push(new THREE.Vector3().addVectors(pt, surfaceOffset));
      }
      
      const seamCurve = new THREE.CatmullRomCurve3(seamPoints);
      const seamGeom = new THREE.TubeGeometry(seamCurve, animLowDetail ? 40 : 100, Math.max(0.016, pipeRadius * 0.038), 8, false);
      const seamMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.88,
        roughness: 0.2
      });
      seamLine3D = new THREE.Mesh(seamGeom, seamMat);
      scene3D.add(seamLine3D);
    }
  }
  
  // Update 3D seam button text based on seam type
  if (dom.btn3dToggleSeam) {
    if (state.seamType === 'SMLS') {
      dom.btn3dToggleSeam.textContent = 'Dikişsiz Boru (SMLS)';
    } else if (state.seamType === 'SAWH') {
      dom.btn3dToggleSeam.textContent = `Dikiş: SAWH (${clockCheck.lblClock}) ${state.seamVisible3D ? 'Açık' : 'Kapalı'}`;
    } else {
      dom.btn3dToggleSeam.textContent = `Dikiş: SAWL (${clockCheck.lblClock}) ${state.seamVisible3D ? 'Açık' : 'Kapalı'}`;
    }
    dom.btn3dToggleSeam.setAttribute('aria-pressed', String(state.seamVisible3D));
  }
  
  // --- Pull-station rings at exact table distances (same meters as tbodyPulls) ---
  // During an animation session only completed stations are shown and the
  // active pull is highlighted red.
  if (calc.numPulls > 0 && pipeRadius > 0) {
    const curveLen = Math.max(1e-9, pipeCurve.getLength());
    const ringGeom = new THREE.TorusGeometry(pipeRadius * 1.03, Math.max(0.012, pipeRadius * 0.03), 8, animLowDetail ? 12 : 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const ringMatActive = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const zAxis = new THREE.Vector3(0, 0, 1);
    for (let i = 1; i <= calc.numPulls; i++) {
      if (bendAnim.active && i > bendAnim.step) continue;
      const isSelected = !bendAnim.active && selectedPullIndex === i;
      const isActivePull = (bendAnim.active && i === bendAnim.step) || isSelected;
      const u = Math.min(1, (calc.pullStartM + calc.pullStepPitch * i) / curveLen);
      const ring = new THREE.Mesh(ringGeom, isActivePull ? ringMatActive : ringMat);
      if (isActivePull) ring.scale.setScalar(1.6);
      ring.position.copy(pipeCurve.getPointAt(u));
      ring.quaternion.setFromUnitVectors(zAxis, pipeCurve.getTangentAt(u).normalize());
      scene3D.add(ring);
      pullMarkers3D.push(ring);
    }
    if (selectedPullIndex && !bendAnim.active && machineGroup3D) {
      placeBendingMachineAt(calc.pullStartM + calc.pullStepPitch * selectedPullIndex);
    }
  }

  // --- Circumferential Girth Weld 3D Ring ---
  if (state.girthWeldInBend && calc.isGwOnPipe) {
    const uWeld = Math.max(0.001, Math.min(0.999, state.girthWeldDist / totalLength));
    const gwGeom = new THREE.TorusGeometry(pipeRadius * 1.05, Math.max(0.022, pipeRadius * 0.05), 10, animLowDetail ? 16 : 36);
    const gwColor = calc.isGwInArc ? 0xef4444 : 0x06b6d4; // Red if in bend zone (%100 RT), Cyan if in tangent
    const gwMat = new THREE.MeshStandardMaterial({
      color: gwColor,
      roughness: 0.3,
      metalness: 0.85,
      emissive: gwColor,
      emissiveIntensity: 0.45
    });
    girthWeldMesh3D = new THREE.Mesh(gwGeom, gwMat);
    girthWeldMesh3D.position.copy(pipeCurve.getPointAt(uWeld));
    const zAxis = new THREE.Vector3(0, 0, 1);
    girthWeldMesh3D.quaternion.setFromUnitVectors(zAxis, pipeCurve.getTangentAt(uWeld).normalize());
    scene3D.add(girthWeldMesh3D);
  }

  bendCurve3D = { curve: pipeCurve, len: pipeCurve.getLength() };

  // Remember pipe center for tab-switch framing; never touch the user's
  // live orbit target here so sidebar edits don't yank the camera.
  const endPt = curvePoints[curvePoints.length - 1];
  pipeCenter3D = {
    x: (curvePoints[0].x + endPt.x) / 2,
    y: (curvePoints[0].y + endPt.y) / 2,
    z: (curvePoints[0].z + endPt.z) / 2
  };

  // Sync Easter Egg Scene (Tree, Worker & Excavators) if active
  if (state.isTreeBendMode) {
    if (!treeBendGroup3D) {
      treeBendGroup3D = buildTreeBendScene(pipeRadius, calc);
      scene3D.add(treeBendGroup3D);
    }
    updateTreeBendSceneAt(calc, bendAnim.active ? bendAnim.step : (selectedPullIndex || calc.numPulls));
  } else if (treeBendGroup3D) {
    removeTreeBendScene();
  }
}

/* ==========================================================================
   Bend Animation: stepwise 3D bending at pull stations with machine
   ========================================================================== */

// Stylized bending machine (portal press) built in local coords with the
// pipe running along local +Z. Dimensions scale with the pipe radius.
function buildBendingMachine(pr) {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.5 });
  const ramMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.5, roughness: 0.4 });
  const dieMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7, roughness: 0.45 });
  const add = (geom, mat, x, y, z) => {
    const m = new THREE.Mesh(geom, mat);
    m.position.set(x, y, z);
    group.add(m);
    return m;
  };
  const W = pr * 2.4;
  const colH = pr * 7;
  const groundY = -2.5;

  // Sturdy ground skid frame (Zemin kızağı ve şasi yatağı)
  add(new THREE.BoxGeometry(W * 2.8, 0.4, 4.2), frameMat, 0, groundY + 0.2, 0);
  add(new THREE.BoxGeometry(0.35, 0.45, 4.8), dieMat, -W * 1.3, groundY + 0.22, 0);
  add(new THREE.BoxGeometry(0.35, 0.45, 4.8), dieMat, W * 1.3, groundY + 0.22, 0);

  // Vertical support columns down to ground
  const legH = Math.max(0.1, -pr - (groundY + 0.4));
  add(new THREE.BoxGeometry(pr * 1.0, legH, pr * 1.6), frameMat, -W, groundY + 0.4 + legH / 2, 0);
  add(new THREE.BoxGeometry(pr * 1.0, legH, pr * 1.6), frameMat, W, groundY + 0.4 + legH / 2, 0);

  // Upper portal press frame
  add(new THREE.BoxGeometry(pr * 1.0, colH, pr * 1.6), frameMat, -W, colH / 2 - pr, 0);
  add(new THREE.BoxGeometry(pr * 1.0, colH, pr * 1.6), frameMat, W, colH / 2 - pr, 0);
  add(new THREE.BoxGeometry(W * 2 + pr, pr * 1.2, pr * 1.8), frameMat, 0, colH - pr * 0.4, 0);

  // Hydraulic Ram cylinder & press shoe
  add(new THREE.CylinderGeometry(pr * 0.8, pr * 0.8, pr * 2.2, 20), ramMat, 0, colH - pr * 2.2, 0);
  const ram = add(new THREE.BoxGeometry(pr * 2.0, pr * 0.9, pr * 1.4), ramMat, 0, pr * 1.9, 0);
  add(new THREE.BoxGeometry(pr * 2.0, pr * 0.7, pr * 1.4), dieMat, 0, pr * 1.0, 0);

  // Bottom Stiffback & Bending Saddle Die
  add(new THREE.BoxGeometry(pr * 1.2, pr * 0.6, pr * 2.2), dieMat, -pr * 1.6, -pr * 0.2, 0);
  add(new THREE.BoxGeometry(pr * 1.2, pr * 0.6, pr * 2.2), dieMat, pr * 1.6, -pr * 0.2, 0);

  // Hydraulic Power Unit & Engine Pack on the side
  add(new THREE.BoxGeometry(pr * 1.5, 1.1, 1.8), ramMat, -W - pr * 1.4, groundY + 0.95, 0);
  add(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), dieMat, -W - pr * 1.4, groundY + 1.8, 0.4);

  group.userData.ram = ram;
  group.userData.ramBaseY = pr * 1.9;
  group.userData.pr = pr;
  return group;
}

function removeBendingMachine() {
  if (!machineGroup3D) return;
  machineGroup3D.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  if (scene3D) scene3D.remove(machineGroup3D);
  machineGroup3D = null;
}

function removeTreeBendScene() {
  if (!treeBendGroup3D) return;
  treeBendGroup3D.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  if (scene3D) scene3D.remove(treeBendGroup3D);
  treeBendGroup3D = null;
}

/* ==========================================================================
   Easter Egg: Old-School Tree Bend 3D Scene (Fixed Tree, Worker & Excavators)
   ========================================================================== */

function buildTreeBendScene(pr, calc) {
  const group = new THREE.Group();
  group.name = 'treeBendEasterEggGroup';

  // Materials
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.95, metalness: 0.05 });
  const leafMatDark = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.8, metalness: 0.1 });
  const leafMatMid = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8, metalness: 0.1 });
  const leafMatLight = new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.75, metalness: 0.1 });
  const yellowExcavatorMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45, metalness: 0.4 });
  const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x1e242d, roughness: 0.65, metalness: 0.75 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.1, metalness: 0.95 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.75 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.8 });
  const vestMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5, metalness: 0.1 });
  const vestLimeMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.5, metalness: 0.1 });
  const vestBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6, metalness: 0.1 });
  const reflectiveStripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.8, emissive: 0xf8fafc, emissiveIntensity: 0.4 });
  const hardHatMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.4 });
  const hardHatWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.3 });
  const hardHatOrangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.3, metalness: 0.4 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.8 });
  const bootsMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 });
  const phoneBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
  const phoneScreenMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, emissive: 0x38bdf8, emissiveIntensity: 0.8 });
  const recLedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const clipboardMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });

  // 1. ANCHORED STURDY TREE (Sabit Ağaç - Boruya orantılı daha kalın gövdeli)
  const treeGroup = new THREE.Group();
  const treeR = Math.max(0.85, pr * 2.4); // substantially thicker trunk than pipe diameter
  const trunkH = Math.max(7.5, pr * 12);
  const groundY = -2.5; // Exactly at 3D ground grid level

  // Trunk
  const trunkGeom = new THREE.CylinderGeometry(treeR * 0.85, treeR * 1.25, trunkH, 16);
  const trunk = new THREE.Mesh(trunkGeom, barkMat);
  trunk.position.y = trunkH / 2 + groundY;
  treeGroup.add(trunk);

  // Root flares at the base anchored into the ground
  for (let r = 0; r < 5; r++) {
    const rot = (r / 5) * Math.PI * 2;
    const rootGeom = new THREE.ConeGeometry(treeR * 0.35, treeR * 1.5, 8);
    const root = new THREE.Mesh(rootGeom, barkMat);
    root.rotation.x = Math.PI * 0.45;
    root.rotation.y = rot;
    root.position.set(Math.cos(rot) * treeR * 0.95, groundY + treeR * 0.25, Math.sin(rot) * treeR * 0.95);
    treeGroup.add(root);
  }

  // Canopy foliage spheres
  const addCanopySphere = (rad, x, y, z, mat) => {
    const geom = new THREE.SphereGeometry(rad, 12, 10);
    const sph = new THREE.Mesh(geom, mat);
    sph.position.set(x, y + groundY, z);
    treeGroup.add(sph);
  };
  addCanopySphere(treeR * 2.6, 0, trunkH * 0.85, 0, leafMatDark);
  addCanopySphere(treeR * 2.2, treeR * 0.9, trunkH * 0.95, treeR * 0.6, leafMatMid);
  addCanopySphere(treeR * 2.1, -treeR * 0.8, trunkH * 0.92, -treeR * 0.6, leafMatLight);
  addCanopySphere(treeR * 1.9, 0, trunkH * 1.15, 0, leafMatMid);

  group.add(treeGroup);

  // 2. FIELD CREW (Şantiye Ekibi - 68" / 1.72m Boy, 2/3 Gövde Oranı)
  // Shared Human Geometries
  const bootGeom = new THREE.BoxGeometry(0.10, 0.08, 0.22);
  const legGeom = new THREE.CylinderGeometry(0.06, 0.065, 0.76, 8);
  const torsoGeom = new THREE.BoxGeometry(0.25, 0.52, 0.16);
  const stripeHGeom = new THREE.BoxGeometry(0.256, 0.05, 0.166);
  const stripeVGeom = new THREE.BoxGeometry(0.04, 0.24, 0.166);
  const neckGeom = new THREE.CylinderGeometry(0.045, 0.05, 0.06, 8);
  const headGeom = new THREE.SphereGeometry(0.10, 10, 8);
  const hatDomeGeom = new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const hatBrimGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.018, 12);
  const armGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.52, 8);

  function createBaseHuman(vestMaterial, hatMaterial, pantsMaterial = pantsMat) {
    const hGroup = new THREE.Group();

    // Boots
    const leftBoot = new THREE.Mesh(bootGeom, bootsMat);
    leftBoot.position.set(-0.09, 0.04, 0.03);
    hGroup.add(leftBoot);
    const rightBoot = new THREE.Mesh(bootGeom, bootsMat);
    rightBoot.position.set(0.09, 0.04, 0.03);
    hGroup.add(rightBoot);

    // Legs
    const leftLeg = new THREE.Mesh(legGeom, pantsMaterial);
    leftLeg.position.set(-0.09, 0.46, 0);
    hGroup.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeom, pantsMaterial);
    rightLeg.position.set(0.09, 0.46, 0);
    hGroup.add(rightLeg);

    // Torso & Reflective Safety Vest
    const torso = new THREE.Mesh(torsoGeom, vestMaterial);
    torso.position.set(0, 1.10, 0);
    hGroup.add(torso);

    const stripeH = new THREE.Mesh(stripeHGeom, reflectiveStripeMat);
    stripeH.position.set(0, 1.05, 0);
    hGroup.add(stripeH);
    const stripeV1 = new THREE.Mesh(stripeVGeom, reflectiveStripeMat);
    stripeV1.position.set(-0.07, 1.22, 0);
    hGroup.add(stripeV1);
    const stripeV2 = new THREE.Mesh(stripeVGeom, reflectiveStripeMat);
    stripeV2.position.set(0.07, 1.22, 0);
    hGroup.add(stripeV2);

    // Head & Hard Hat
    const neck = new THREE.Mesh(neckGeom, skinMat);
    neck.position.set(0, 1.39, 0);
    hGroup.add(neck);
    const head = new THREE.Mesh(headGeom, skinMat);
    head.position.set(0, 1.48, 0);
    hGroup.add(head);

    const hatDome = new THREE.Mesh(hatDomeGeom, hatMaterial);
    hatDome.position.set(0, 1.52, 0);
    hGroup.add(hatDome);
    const hatBrim = new THREE.Mesh(hatBrimGeom, hatMaterial);
    hatBrim.position.set(0, 1.50, 0.02);
    hGroup.add(hatBrim);

    return hGroup;
  }

  // A. Şantiye Şefi (Foreman - Başparmak Havada / Thumbs-up)
  const workerGroup = createBaseHuman(vestMat, hardHatMat);
  const leftArm = new THREE.Mesh(armGeom, vestMat);
  leftArm.position.set(-0.16, 1.08, 0);
  leftArm.rotation.z = 0.12;
  workerGroup.add(leftArm);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.16, 1.30, 0);
  const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.48, 8), vestMat);
  rightArmMesh.position.set(0, -0.22, 0);
  rightArmPivot.add(rightArmMesh);
  const fistMesh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), skinMat);
  fistMesh.position.set(0, -0.48, 0);
  rightArmPivot.add(fistMesh);
  const thumbMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.09, 6), skinMat);
  thumbMesh.position.set(0.03, -0.44, 0.03);
  thumbMesh.rotation.z = -0.5;
  thumbMesh.rotation.x = -0.4;
  rightArmPivot.add(thumbMesh);
  workerGroup.add(rightArmPivot);
  workerGroup.position.set(0, groundY, 0);
  group.add(workerGroup);

  // B. Şantiye Kontrolörü / Mühendis (Inspector - Akıllı Telefonla Video Kaydı Alan)
  const inspectorGroup = createBaseHuman(vestLimeMat, hardHatWhiteMat);
  const inspLeftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.038, 0.42, 8), vestLimeMat);
  inspLeftArm.position.set(-0.14, 1.25, 0.14);
  inspLeftArm.rotation.set(Math.PI * 0.38, 0, -Math.PI * 0.22);
  inspectorGroup.add(inspLeftArm);
  const inspRightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.038, 0.42, 8), vestLimeMat);
  inspRightArm.position.set(0.14, 1.25, 0.14);
  inspRightArm.rotation.set(Math.PI * 0.38, 0, Math.PI * 0.22);
  inspectorGroup.add(inspRightArm);

  // Akıllı Telefon Modeli (Yatay video kaydı duruşu, parlayan ekran & kırmızı REC ışığı)
  const phoneHolder = new THREE.Group();
  phoneHolder.position.set(0, 1.38, 0.30);
  const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.075, 0.012), phoneBodyMat);
  phoneHolder.add(phoneBody);
  const phoneScreen = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.065, 0.003), phoneScreenMat);
  phoneScreen.position.set(0, 0, -0.006);
  phoneHolder.add(phoneScreen);
  const phoneLens = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.008, 8), darkSteelMat);
  phoneLens.rotation.x = Math.PI / 2;
  phoneLens.position.set(-0.04, 0.015, 0.007);
  phoneHolder.add(phoneLens);
  const recLed = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 6), recLedMat);
  recLed.position.set(0.045, 0.018, 0.007);
  phoneHolder.add(recLed);
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), skinMat);
  handL.position.set(-0.075, 0, 0);
  phoneHolder.add(handL);
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), skinMat);
  handR.position.set(0.075, 0, 0);
  phoneHolder.add(handR);
  inspectorGroup.add(phoneHolder);
  inspectorGroup.position.set(0, groundY, 0);
  group.add(inspectorGroup);

  // C. Saha İşçisi 1 (Giriş & Kaynak Dikişi Gözlemcisi)
  const workerTailGroup = createBaseHuman(vestBlueMat, hardHatMat);
  const tailArmL = new THREE.Mesh(armGeom, vestBlueMat);
  tailArmL.position.set(-0.16, 1.08, 0);
  tailArmL.rotation.z = 0.15;
  workerTailGroup.add(tailArmL);
  const tailArmR = new THREE.Mesh(armGeom, vestBlueMat);
  tailArmR.position.set(0.16, 1.08, 0);
  tailArmR.rotation.z = -0.15;
  workerTailGroup.add(tailArmR);
  workerTailGroup.position.set(0, groundY, 0);
  group.add(workerTailGroup);

  // D. Saha İşçisi 2 (Ağaç Temas & Deformasyon Kontrolcüsü - Elinde Kontrol Panosu)
  const workerTreeGroup = createBaseHuman(vestMat, hardHatOrangeMat);
  const treeArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.038, 0.42, 8), vestMat);
  treeArmL.position.set(-0.14, 1.18, 0.12);
  treeArmL.rotation.set(Math.PI * 0.32, 0, -Math.PI * 0.15);
  workerTreeGroup.add(treeArmL);
  const treeArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.038, 0.42, 8), vestMat);
  treeArmR.position.set(0.14, 1.18, 0.12);
  treeArmR.rotation.set(Math.PI * 0.32, 0, Math.PI * 0.15);
  workerTreeGroup.add(treeArmR);
  const clipboardGroup = new THREE.Group();
  clipboardGroup.position.set(0, 1.15, 0.25);
  clipboardGroup.rotation.set(Math.PI * 0.25, 0, 0);
  const boardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.01), clipboardMat);
  clipboardGroup.add(boardMesh);
  const sheetMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.19, 0.003), paperMat);
  sheetMesh.position.set(0, -0.01, 0.006);
  clipboardGroup.add(sheetMesh);
  workerTreeGroup.add(clipboardGroup);
  workerTreeGroup.position.set(0, groundY, 0);
  group.add(workerTreeGroup);

  // E. Saha İşçisi 3 (Çekici Ekskavatör İşaretçisi / Rigger)
  const workerSignalGroup = createBaseHuman(vestMat, hardHatMat);
  const signalArmLPivot = new THREE.Group();
  signalArmLPivot.position.set(-0.16, 1.30, 0);
  const sArmL = new THREE.Mesh(armGeom, vestMat);
  sArmL.position.set(0, 0.24, 0);
  signalArmLPivot.add(sArmL);
  signalArmLPivot.rotation.z = Math.PI * 0.40;
  workerSignalGroup.add(signalArmLPivot);

  const signalArmRPivot = new THREE.Group();
  signalArmRPivot.position.set(0.16, 1.30, 0);
  const sArmR = new THREE.Mesh(armGeom, vestMat);
  sArmR.position.set(0, 0.24, 0);
  signalArmRPivot.add(sArmR);
  signalArmRPivot.rotation.z = -Math.PI * 0.40;
  workerSignalGroup.add(signalArmRPivot);
  workerSignalGroup.position.set(0, groundY, 0);
  group.add(workerSignalGroup);

  // 3. EXCAVATORS (CAT 330 Sınıfı Boru Hattı Ekskavatörü & Sıfır Sapmalı Boru Kıskacı)
  const R_reach = 5.2; // Kol uzanma mesafesi (merkezden boru kıskacı eksenine)
  const H_reach = 2.5; // Palet tabanından boru merkezine (Y=0) dikey yükseklik

  function createExcavator() {
    const exc = new THREE.Group();

    // A. Undercarriage (Paletler ve Şasi)
    const trackGeom = new THREE.BoxGeometry(4.8, 0.85, 0.62);
    const leftTrack = new THREE.Mesh(trackGeom, darkSteelMat);
    leftTrack.position.set(0, 0.42, -1.15);
    exc.add(leftTrack);

    const rightTrack = new THREE.Mesh(trackGeom, darkSteelMat);
    rightTrack.position.set(0, 0.42, 1.15);
    exc.add(rightTrack);

    // Track sprockets & idlers
    const sprocGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.64, 12);
    sprocGeom.rotateX(Math.PI / 2);
    const sp1 = new THREE.Mesh(sprocGeom, darkSteelMat);
    sp1.position.set(-2.2, 0.42, -1.15);
    exc.add(sp1);
    const sp2 = new THREE.Mesh(sprocGeom, darkSteelMat);
    sp2.position.set(2.2, 0.42, -1.15);
    exc.add(sp2);
    const sp3 = new THREE.Mesh(sprocGeom, darkSteelMat);
    sp3.position.set(-2.2, 0.42, 1.15);
    exc.add(sp3);
    const sp4 = new THREE.Mesh(sprocGeom, darkSteelMat);
    sp4.position.set(2.2, 0.42, 1.15);
    exc.add(sp4);

    // Carbody & slewing ring
    const carbody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 1.8), darkSteelMat);
    carbody.position.set(0, 0.55, 0);
    exc.add(carbody);

    const slewingRing = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.2, 16), darkSteelMat);
    slewingRing.position.set(0, 0.85, 0);
    exc.add(slewingRing);

    // B. Upperstructure (Gövde, Kabin, Karşı Ağırlık)
    const upper = new THREE.Group();
    upper.position.set(0, 0.95, 0);

    const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.15, 2.3), yellowExcavatorMat);
    body.position.set(-0.25, 0.6, 0);
    upper.add(body);

    const counterweight = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.12, 2.28), darkSteelMat);
    counterweight.position.set(-1.8, 0.6, 0);
    upper.add(counterweight);

    const chevron = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 2.1), reflectiveStripeMat);
    chevron.position.set(-2.23, 0.55, 0);
    upper.add(chevron);

    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 8), darkSteelMat);
    exhaust.position.set(-1.1, 1.5, -0.65);
    upper.add(exhaust);

    // Operator Cab
    const cab = new THREE.Group();
    cab.position.set(0.45, 0.65, 0.65);
    const cabBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.35, 0.92), yellowExcavatorMat);
    cab.add(cabBody);
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.93), glassMat);
    windshield.position.set(0.3, 0.15, 0);
    cab.add(windshield);
    const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.94), glassMat);
    sideWindow.position.set(-0.15, 0.2, 0);
    cab.add(sideWindow);
    upper.add(cab);

    // C. Heavy Monoblock Boom & Chrome Hydraulic Lift Cylinders
    const boomPivot = new THREE.Group();
    boomPivot.position.set(0.9, 0.7, -0.2);

    // Dual chrome lift cylinders
    const cyl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 10), darkSteelMat);
    cyl1.position.set(-0.2, 0.5, -0.32);
    cyl1.rotation.z = -Math.PI * 0.28;
    boomPivot.add(cyl1);
    const rod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.3, 10), chromeMat);
    rod1.position.set(0.4, 1.1, -0.32);
    rod1.rotation.z = -Math.PI * 0.28;
    boomPivot.add(rod1);

    const cyl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 10), darkSteelMat);
    cyl2.position.set(-0.2, 0.5, 0.32);
    cyl2.rotation.z = -Math.PI * 0.28;
    boomPivot.add(cyl2);
    const rod2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.3, 10), chromeMat);
    rod2.position.set(0.4, 1.1, 0.32);
    rod2.rotation.z = -Math.PI * 0.28;
    boomPivot.add(rod2);

    const boomBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.45, 0.4), yellowExcavatorMat);
    boomBase.position.set(1.0, 1.1, 0);
    boomBase.rotation.z = Math.PI * 0.26;
    boomPivot.add(boomBase);

    const boomElbow = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.36), yellowExcavatorMat);
    boomElbow.position.set(2.4, 1.75, 0);
    boomElbow.rotation.z = -Math.PI * 0.12;
    boomPivot.add(boomElbow);

    upper.add(boomPivot);

    // Stick / Arm
    const stick = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.35, 0.3), yellowExcavatorMat);
    stick.position.set(4.4, 2.05 - 0.95, -0.2);
    stick.rotation.z = -Math.PI * 0.38;
    upper.add(stick);

    const stickCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.6, 8), darkSteelMat);
    stickCyl.position.set(2.8, 2.55 - 0.95, -0.2);
    stickCyl.rotation.z = -Math.PI * 0.18;
    upper.add(stickCyl);
    const stickRod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), chromeMat);
    stickRod.position.set(3.6, 2.35 - 0.95, -0.2);
    stickRod.rotation.z = -Math.PI * 0.18;
    upper.add(stickRod);

    // D. Specialized Pipeline Clamp Tool (Sıfır Sapmalı Boru Tutucu)
    // Centered exactly at local (R_reach = 5.2, H_reach = 2.5, 0)
    const clampGroup = new THREE.Group();
    clampGroup.position.set(R_reach, H_reach - 0.95, 0);

    const rotator = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 12), darkSteelMat);
    rotator.position.set(0, 0.25, 0);
    clampGroup.add(rotator);

    const collarGeom = new THREE.TorusGeometry(pr + 0.035, 0.045, 10, 24);
    collarGeom.rotateY(Math.PI / 2);
    const clampCollar = new THREE.Mesh(collarGeom, darkSteelMat);
    clampGroup.add(clampCollar);

    const jaw1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.12), darkSteelMat);
    jaw1.position.set(0, pr + 0.05, -pr * 0.7);
    clampGroup.add(jaw1);
    const jaw2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.12), darkSteelMat);
    jaw2.position.set(0, pr + 0.05, pr * 0.7);
    clampGroup.add(jaw2);

    upper.add(clampGroup);
    exc.add(upper);

    exc.userData = {
      R_reach,
      H_reach,
      upper,
      clampGroup
    };

    return exc;
  }

  const excavatorLeft = createExcavator();
  const excavatorRight = createExcavator();
  group.add(excavatorLeft);
  group.add(excavatorRight);

  group.userData = {
    treeGroup,
    trunk,
    treeR,
    groundY,
    workerGroup,
    rightArmPivot,
    inspectorGroup,
    workerTailGroup,
    workerTreeGroup,
    workerSignalGroup,
    signalArmLPivot,
    signalArmRPivot,
    excavatorLeft,
    excavatorRight,
    R_reach,
    pr
  };

  return group;
}

function updateTreeBendSceneAt(calc, stepIndex) {
  if (!treeBendGroup3D || !treeBendGroup3D.userData) return;
  const ud = treeBendGroup3D.userData;
  const pr = ud.pr;

  // Sturdy tree stands anchored at (0, 0, treeZ) touching pipe intrados at (0, 0, -pr)
  const treeX = 0;
  const treeZ = -(ud.treeR + pr);
  ud.treeGroup.position.set(treeX, 0, treeZ);

  // 1. Field foreman stands safely behind the anchored tree trunk (in -Z)
  // Absolutely zero clipping with the pipe at any deflection angle
  const workerZ = treeZ - ud.treeR - 1.2;
  const workerX = 1.2;
  ud.workerGroup.position.set(workerX, ud.groundY, workerZ);
  ud.workerGroup.rotation.y = -Math.PI * 0.22;

  // 2. Site Inspector (Şantiye Kontrolörü) recording video with phone
  // Stands with wide unobstructed vantage point aiming smartphone directly at the tree-pipe bend zone
  if (ud.inspectorGroup) {
    const inspX = 3.2;
    const inspZ = treeZ - ud.treeR - 1.4;
    ud.inspectorGroup.position.set(inspX, ud.groundY, inspZ);
    ud.inspectorGroup.rotation.y = Math.atan2(-inspX, -( -pr - inspZ));
  }

  // 3. Worker 2 (Ağaç / Temas Gözlemcisi) inspecting clearance on the opposite flank of the tree
  if (ud.workerTreeGroup) {
    const treeObsX = -1.8;
    const treeObsZ = treeZ - ud.treeR - 0.8;
    ud.workerTreeGroup.position.set(treeObsX, ud.groundY, treeObsZ);
    ud.workerTreeGroup.rotation.y = Math.atan2(0 - treeObsX, -pr - treeObsZ);
  }

  // 4. Excavators and dynamic workers (Tail worker & Signaler worker)
  if (bendCurve3D && bendCurve3D.curve) {
    const ptStart = bendCurve3D.curve.getPointAt(0); // Front tip of pipe (emerging bent pipe)
    const ptEnd = bendCurve3D.curve.getPointAt(1);   // Rear tip of pipe (unbent tail)
    const tangStart = bendCurve3D.curve.getTangentAt(0).normalize();
    const R_reach = ud.R_reach || 5.2;

    // Right excavator holding pipe front (bending and pulling into +X, +Z):
    const excFrontX = ptStart.x + R_reach * tangStart.x;
    const excFrontZ = ptStart.z + R_reach * tangStart.z;
    ud.excavatorRight.position.set(excFrontX, ud.groundY, excFrontZ);
    ud.excavatorRight.rotation.y = Math.atan2(-tangStart.z, -tangStart.x);

    // Left excavator holding pipe rear (feeding and supporting straight tail at -X):
    ud.excavatorLeft.position.set(ptEnd.x - R_reach, ud.groundY, ptEnd.z);
    ud.excavatorLeft.rotation.y = 0;

    // Worker 1 (Tail / Infeed Seam Observer): stands near straight pipe tail
    if (ud.workerTailGroup) {
      const tailX = Math.min(-3.6, ptEnd.x + 2.4);
      ud.workerTailGroup.position.set(tailX, ud.groundY, -1.8);
      ud.workerTailGroup.rotation.y = Math.PI * 0.45;
    }

    // Worker 3 (Front Rigging Signaler): stands at safe lateral offset guiding front excavator operator
    if (ud.workerSignalGroup) {
      const sigX = ptStart.x - 2.6 * tangStart.z;
      const sigZ = ptStart.z + 2.6 * tangStart.x;
      ud.workerSignalGroup.position.set(sigX, ud.groundY, sigZ);
      ud.workerSignalGroup.rotation.y = Math.atan2(excFrontX - sigX, excFrontZ - sigZ);
    }
  }

  // Thumbs up and crew reaction logic when bend is completed!
  const isComplete = (stepIndex >= calc.numPulls);
  if (isComplete) {
    // Raise arm and give prominent THUMBS UP! 👍
    ud.rightArmPivot.rotation.x = -Math.PI * 0.52;
    ud.rightArmPivot.rotation.y = 0.25;
    ud.rightArmPivot.rotation.z = -0.15;
    if (ud.signalArmLPivot && ud.signalArmRPivot) {
      ud.signalArmLPivot.rotation.z = Math.PI * 0.18;
      ud.signalArmRPivot.rotation.z = -Math.PI * 0.18;
    }
    if (dom.badgeEasterEggThumbsUp) {
      dom.badgeEasterEggThumbsUp.style.display = 'inline-block';
      dom.badgeEasterEggThumbsUp.textContent = '👷 Şantiye Ekibi: Tamamdır Usta! 👍 📱 Kayıt Alındı';
    }
  } else {
    // Directing arm gestures during bending
    const wave = Math.sin((stepIndex || 1) * 1.8) * 0.35;
    ud.rightArmPivot.rotation.x = -0.45 + wave;
    ud.rightArmPivot.rotation.y = 0.4;
    ud.rightArmPivot.rotation.z = -0.2;
    if (ud.signalArmLPivot && ud.signalArmRPivot) {
      const sigWave = Math.sin((stepIndex || 1) * 2.4) * 0.22;
      ud.signalArmLPivot.rotation.z = Math.PI * 0.40 + sigWave;
      ud.signalArmRPivot.rotation.z = -Math.PI * 0.40 - sigWave;
    }
    if (dom.badgeEasterEggThumbsUp) {
      dom.badgeEasterEggThumbsUp.style.display = 'none';
    }
  }
}

function enterTreeBendMode() {
  state.isTreeBendMode = true;
  stopBendAnimation(false);
  removeBendingMachine();
  removeTreeBendScene();
  const calc = runCalculations();
  const pr = (state.od / 1000) / 2;
  treeBendGroup3D = buildTreeBendScene(pr, calc);
  if (scene3D) scene3D.add(treeBendGroup3D);
  update3DPipe(calc);
  if (dom.btnExitTreeMode) dom.btnExitTreeMode.style.display = 'inline-block';
  if (dom.visInfoLabel) dom.visInfoLabel.textContent = '🌳 Gizli Mod: Şantiye Ağaç & Ekskavatör Bükümü (Çıkış: ESC)';
  if (dom.badgeEasterEggThumbsUp) {
    dom.badgeEasterEggThumbsUp.style.display = 'inline-block';
    dom.badgeEasterEggThumbsUp.textContent = '🚜 Ağaç Bükümü Modu Aktif! "▶ Bükümü Oynat"a basın';
  }
}

function exitTreeBendMode() {
  state.isTreeBendMode = false;
  stopBendAnimation(false);
  removeTreeBendScene();
  if (dom.btnExitTreeMode) dom.btnExitTreeMode.style.display = 'none';
  if (dom.badgeEasterEggThumbsUp) dom.badgeEasterEggThumbsUp.style.display = 'none';
  if (dom.visInfoLabel) dom.visInfoLabel.textContent = '3D WebGL Modeli • Canlı Güncelleme';
  ensureMachine();
  update3DPipe(runCalculations());
}

function placeBendingMachineAt(sMeters) {
  if (!machineGroup3D || !bendCurve3D || !bendCurve3D.curve) return;
  const u = Math.min(1, Math.max(0, sMeters / Math.max(1e-9, bendCurve3D.len)));
  machineGroup3D.position.copy(bendCurve3D.curve.getPointAt(u));
  machineGroup3D.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    bendCurve3D.curve.getTangentAt(u).normalize()
  );
}

function setRamPressed(pressed) {
  if (!machineGroup3D || !machineGroup3D.userData.ram) return;
  machineGroup3D.userData.ram.position.y =
    machineGroup3D.userData.ramBaseY - (pressed ? machineGroup3D.userData.pr * 0.55 : 0);
}

let _animUiSig = '';
function syncAnimUI() {
  const calc = runCalculations();
  const total = calc.numPulls || 0;
  const currentStep = bendAnim.active ? bendAnim.step : (bendAnim.done > 0 ? total : 0);
  // Skip redundant DOM writes on every keystroke-driven updateUI
  const sig = `${bendAnim.playing ? 1 : 0}|${bendAnim.active ? 1 : 0}|${currentStep}|${total}|${bendAnim.done}`;
  if (sig === _animUiSig) return;
  _animUiSig = sig;
  if (dom.btn3dPlay) {
    dom.btn3dPlay.textContent = bendAnim.playing ? '⏸ Duraklat' : '▶ Bükümü Oynat';
    dom.btn3dPlay.setAttribute('aria-pressed', String(bendAnim.playing));
  }
  if (dom.slider3dStep) {
    dom.slider3dStep.max = String(total);
    dom.slider3dStep.value = String(currentStep);
    dom.slider3dStep.disabled = total <= 0;
  }
  if (dom.btn3dStepPrev) {
    dom.btn3dStepPrev.disabled = currentStep <= 0;
  }
  if (dom.btn3dStep) {
    dom.btn3dStep.disabled = total > 0 && currentStep >= total;
  }
  if (dom.animProgress) {
    if (bendAnim.done > 0) {
      dom.animProgress.textContent = `Tamamlandı • ${bendAnim.done}/${total}`;
    } else if (bendAnim.active) {
      const curAng = (state.targetAngle * (currentStep / Math.max(1, total))).toFixed(2);
      dom.animProgress.textContent = currentStep === 0
        ? `Düz Boru (0.00°)`
        : `Paso ${currentStep}/${total} (${curAng}°)`;
    } else {
      dom.animProgress.textContent = 'Hazır';
    }
  }
}

function ensureMachine() {
  if (!scene3D || typeof THREE === 'undefined') return;
  if (state.isTreeBendMode) {
    if (!treeBendGroup3D) {
      removeBendingMachine();
      const calc = runCalculations();
      treeBendGroup3D = buildTreeBendScene((state.od / 1000) / 2, calc);
      scene3D.add(treeBendGroup3D);
    }
    return;
  }
  if (treeBendGroup3D) {
    removeTreeBendScene();
  }
  if (!machineGroup3D) {
    machineGroup3D = buildBendingMachine((state.od / 1000) / 2);
    scene3D.add(machineGroup3D);
  }
}

// Render animation step k (0 to numPulls): bend grows to k net pulls with pipe
// feeding through stationary bending machine anchored at (0,0,0).
function renderAnimStep(k) {
  const calc = runCalculations();
  const clampedK = Math.max(0, Math.min(calc.numPulls, k));
  const ang = state.targetAngle * (clampedK / Math.max(1, calc.numPulls));
  animLowDetail = true;
  bendAnim.step = clampedK;
  bendAnim.total = calc.numPulls;
  try {
    update3DPipe(calc, ang);
  } finally {
    animLowDetail = false; // never leak low-detail mode into static views
  }
  if (state.isTreeBendMode) {
    updateTreeBendSceneAt(calc, clampedK);
  } else {
    setRamPressed(clampedK > 0);
    if (machineGroup3D) {
      machineGroup3D.position.set(0, 0, 0);
      machineGroup3D.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(1, 0, 0)
      );
    }
  }
  if (dom.tbodyPulls) {
    const rows = dom.tbodyPulls.querySelectorAll('tr');
    rows.forEach((tr) => {
      const step = Number(tr.dataset.step);
      if (clampedK > 0 && step === clampedK) {
        tr.classList.add('selected-pull-row');
        tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        tr.classList.remove('selected-pull-row');
      }
    });
  }
  syncAnimUI();
}

function animTick() {
  if (!bendAnim.playing) return;
  const calc = runCalculations();
  if (bendAnim.step >= calc.numPulls) {
    stopBendAnimation(true, true);
    return;
  }
  renderAnimStep(bendAnim.step + 1);
  const interval = animStepInterval(bendAnim.total);
  bendAnim.timer = setTimeout(() => {
    setRamPressed(false);
    if (!bendAnim.playing) return;
    bendAnim.timer = setTimeout(animTick, Math.round(interval * 0.37));
  }, Math.round(interval * 0.63));
}

function startBendAnimation() {
  if (!dom.view3D.classList.contains('active') || typeof THREE === 'undefined') return;
  const calc = runCalculations();
  bendAnim.total = calc.numPulls;
  if (bendAnim.step >= calc.numPulls) bendAnim.step = 0;
  ensureMachine();
  if (!state.isTreeBendMode && machineGroup3D) {
    machineGroup3D.position.set(0, 0, 0);
    machineGroup3D.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(1, 0, 0)
    );
  }
  if (!state.isTreeBendMode && !machineGroup3D) return;
  if (state.isTreeBendMode && !treeBendGroup3D) return;
  bendAnim.active = true;
  bendAnim.playing = true;
  syncAnimUI();
  animTick();
}

function stopBendAnimation(restoreStatic, keepFinal) {
  bendAnim.playing = false;
  if (bendAnim.timer) {
    clearTimeout(bendAnim.timer);
    bendAnim.timer = null;
  }
  const wasActive = bendAnim.active;
  bendAnim.active = false;
  bendAnim.step = 0;
  bendAnim.done = (keepFinal && bendAnim.total > 0) ? bendAnim.total : 0;
  animLowDetail = false;
  if (!state.isTreeBendMode) {
    removeBendingMachine();
  } else if (treeBendGroup3D && keepFinal) {
    const calc = runCalculations();
    updateTreeBendSceneAt(calc, calc.numPulls);
  }
  syncAnimUI();
  if (restoreStatic && wasActive && dom.view3D.classList.contains('active')) {
    update3DPipe(runCalculations());
  }
}

/* ==========================================================================
   As-Built Physical Measurement & Site QC Compliance Evaluation
   ASME B31.8 Md. 841.2.3, ASME B31.4 Md. 406.2.1, BOTAŞ 5120 Rev 7
   ========================================================================== */

function calculateAsBuiltEvaluation(calc) {
  const stdCriteria = (calc && calc.stdCriteria) || getStandardCriteria(state.standard, state.od, state.t_nom, state.seamType);
  const millTol = (calc && calc.millTol) || stdCriteria.millTol;
  const targetAngle = state.targetAngle || 0;
  const t_min_design = calc.t_min_design || 0;
  const t_min = stdCriteria.enforceMillTolThinning
    ? Math.max(t_min_design, millTol.tMinMillMm)
    : t_min_design;
  const maxAllowOvality = calc.maxAllowOvality || stdCriteria.maxAllowOvality || 2.50;
  const maxAllowRipple = calc.maxAllowRippleMm || ((stdCriteria.maxAllowRipplePct / 100) * state.od);

  const measAngle = state.asBuilt.measuredAngle;
  const measWT = state.asBuilt.measuredWT;
  const measOvality = state.asBuilt.measuredOvality;
  const measRipple = state.asBuilt.measuredRipple;

  const hasAnyInput = (measAngle !== null && !isNaN(measAngle)) ||
                      (measWT !== null && !isNaN(measWT)) ||
                      (measOvality !== null && !isNaN(measOvality)) ||
                      (measRipple !== null && !isNaN(measRipple) && measRipple > 0);

  let angleDev = null;
  let angleStatus = 'neutral';
  if (measAngle !== null && !isNaN(measAngle)) {
    angleDev = Number(measAngle) - targetAngle;
    const absDev = Math.abs(angleDev);
    if (absDev <= 0.20) {
      angleStatus = 'pass';
    } else if (absDev <= 0.50) {
      angleStatus = 'warn';
    } else {
      angleStatus = 'fail';
    }
  }

  let wtDev = null;
  let wtStatus = 'neutral';
  if (measWT !== null && !isNaN(measWT)) {
    wtDev = Number(measWT) - t_min;
    wtStatus = Number(measWT) >= t_min ? 'pass' : 'fail';
  }

  let ovalityDev = null;
  let ovalityStatus = 'neutral';
  if (measOvality !== null && !isNaN(measOvality)) {
    ovalityDev = Number(measOvality) - maxAllowOvality;
    ovalityStatus = Number(measOvality) <= maxAllowOvality ? 'pass' : 'fail';
  }

  let rippleDev = null;
  let rippleStatus = 'neutral';
  if (hasAnyInput && measRipple !== null && !isNaN(measRipple)) {
    rippleDev = Number(measRipple) - maxAllowRipple;
    rippleStatus = Number(measRipple) <= maxAllowRipple ? 'pass' : 'fail';
  }

  let overallStatus = 'neutral';
  let verdictLabel = 'ÖLÇÜM GİRİŞİ BEKLENİYOR';
  let summaryText = `Saha büküm ölçümleri girildiğinde ${stdCriteria.badgeName} tolerans tahkiki otomatik gerçekleşecektir.`;

  if (hasAnyInput) {
    if (angleStatus === 'fail' || wtStatus === 'fail' || ovalityStatus === 'fail' || rippleStatus === 'fail') {
      overallStatus = 'fail';
      verdictLabel = 'AS-BUILT RET (TOLERANS AŞIMI)';
      const fails = [];
      if (angleStatus === 'fail') fails.push(`Açı sapması (${angleDev >= 0 ? '+' : ''}${angleDev.toFixed(2)}° > ±0.50°)`);
      if (wtStatus === 'fail') fails.push(`Cidar yetersiz (${Number(measWT).toFixed(2)} mm < ${t_min.toFixed(2)} mm)`);
      if (ovalityStatus === 'fail') fails.push(`Ovallik aşımı (%${Number(measOvality).toFixed(2)} > %${maxAllowOvality.toFixed(2)})`);
      if (rippleStatus === 'fail') fails.push(`Dalgalanma aşımı (${Number(measRipple).toFixed(1)} mm > ${maxAllowRipple.toFixed(1)} mm)`);
      summaryText = `RET SEBEBİ: ${fails.join(', ')}. Boru montaja sevk edilemez.`;
    } else if (angleStatus === 'warn') {
      overallStatus = 'warn';
      verdictLabel = 'ŞARTLI KABUL (İKAZ)';
      summaryText = `Açı sapması (${angleDev >= 0 ? '+' : ''}${angleDev.toFixed(2)}°) ±0.20° montaj sınırını aşıyor fakat ±0.50° emniyet aralığında. Saha QC şefi ve hat mühendisi onayı gereklidir.`;
    } else {
      overallStatus = 'pass';
      verdictLabel = 'AS-BUILT KABUL (ONAYLANDI)';
      summaryText = `Tüm saha fiziksel ölçümleri ${stdCriteria.badgeName} ve teknik şartname tolerans kriterlerini tam olarak sağlamaktadır.`;
    }
  }

  return {
    hasData: hasAnyInput,
    stdCriteria,
    millTol,
    targetAngle,
    t_min,
    t_min_design,
    maxAllowOvality,
    maxAllowRipple,
    measAngle,
    measWT,
    measOvality,
    measRipple,
    angleDev,
    angleStatus,
    wtDev,
    wtStatus,
    ovalityDev,
    ovalityStatus,
    rippleDev,
    rippleStatus,
    overallStatus,
    verdictLabel,
    summaryText
  };
}

function updateAsBuiltUI(calc) {
  if (!calc) calc = runCalculations();
  const evalRes = calculateAsBuiltEvaluation(calc);
  const stdCrit = evalRes.stdCriteria;

  // Targets in labels
  if (dom.asBuiltTargetAngle) dom.asBuiltTargetAngle.textContent = `${evalRes.targetAngle.toFixed(2)}°`;
  if (dom.asBuiltTargetWT) dom.asBuiltTargetWT.textContent = `${evalRes.t_min.toFixed(2)} mm`;
  if (dom.asBuiltTargetOvality) dom.asBuiltTargetOvality.textContent = `≤ %${evalRes.maxAllowOvality.toFixed(2)}`;
  if (dom.asBuiltTargetRipple) dom.asBuiltTargetRipple.textContent = `≤ ${evalRes.maxAllowRipple.toFixed(1)} mm (%${stdCrit.maxAllowRipplePct.toFixed(1)} D)`;

  // Criteria column cells in As-Built table
  if (dom.asBuiltCritWT) {
    dom.asBuiltCritWT.innerHTML = stdCrit.enforceMillTolThinning
      ? `t ≥ max(t<sub>min,des</sub>, t<sub>min,mill</sub>) (${evalRes.t_min.toFixed(2)} mm)`
      : `t ≥ t<sub>min,des</sub> (${evalRes.t_min.toFixed(2)} mm)`;
  }
  if (dom.asBuiltCritOvality) {
    dom.asBuiltCritOvality.textContent = `≤ %${evalRes.maxAllowOvality.toFixed(2)}`;
  }
  if (dom.asBuiltCritRipple) {
    dom.asBuiltCritRipple.textContent = `h ≤ %${stdCrit.maxAllowRipplePct.toFixed(1)} D`;
  }

  // Angle evaluation row
  if (dom.asBuiltDevAngle) {
    dom.asBuiltDevAngle.textContent = evalRes.angleDev !== null
      ? `${evalRes.angleDev >= 0 ? '+' : ''}${evalRes.angleDev.toFixed(2)}°`
      : '—';
  }
  if (dom.asBuiltStatusAngle) {
    dom.asBuiltStatusAngle.className = `asbuilt-status-pill ${evalRes.angleStatus}`;
    dom.asBuiltStatusAngle.textContent = evalRes.angleStatus === 'pass'
      ? 'KABUL'
      : evalRes.angleStatus === 'warn'
        ? 'ŞARTLI'
        : evalRes.angleStatus === 'fail'
          ? 'RET'
          : 'BEKLENİYOR';
  }

  // WT evaluation row
  if (dom.asBuiltDevWT) {
    dom.asBuiltDevWT.textContent = evalRes.wtDev !== null
      ? `${evalRes.wtDev >= 0 ? '+' : ''}${evalRes.wtDev.toFixed(2)} mm`
      : '—';
  }
  if (dom.asBuiltStatusWT) {
    dom.asBuiltStatusWT.className = `asbuilt-status-pill ${evalRes.wtStatus}`;
    dom.asBuiltStatusWT.textContent = evalRes.wtStatus === 'pass'
      ? 'KABUL'
      : evalRes.wtStatus === 'fail'
        ? 'RET'
        : 'BEKLENİYOR';
  }

  // Ovality evaluation row
  if (dom.asBuiltDevOvality) {
    dom.asBuiltDevOvality.textContent = evalRes.ovalityDev !== null
      ? `${evalRes.ovalityDev >= 0 ? '+' : ''}%${evalRes.ovalityDev.toFixed(2)}`
      : '—';
  }
  if (dom.asBuiltStatusOvality) {
    dom.asBuiltStatusOvality.className = `asbuilt-status-pill ${evalRes.ovalityStatus}`;
    dom.asBuiltStatusOvality.textContent = evalRes.ovalityStatus === 'pass'
      ? 'KABUL'
      : evalRes.ovalityStatus === 'fail'
        ? 'RET'
        : 'BEKLENİYOR';
  }

  // Ripple evaluation row
  if (dom.asBuiltDevRipple) {
    dom.asBuiltDevRipple.textContent = evalRes.rippleDev !== null
      ? `${evalRes.rippleDev >= 0 ? '+' : ''}${evalRes.rippleDev.toFixed(1)} mm`
      : '—';
  }
  if (dom.asBuiltStatusRipple) {
    dom.asBuiltStatusRipple.className = `asbuilt-status-pill ${evalRes.rippleStatus}`;
    dom.asBuiltStatusRipple.textContent = evalRes.rippleStatus === 'pass'
      ? 'KABUL'
      : evalRes.rippleStatus === 'fail'
        ? 'RET'
        : 'BEKLENİYOR';
  }

  // Overall Stamp & Summary
  if (dom.badgeAsBuiltVerdict) {
    dom.badgeAsBuiltVerdict.className = `asbuilt-verdict-badge ${evalRes.overallStatus}`;
    dom.badgeAsBuiltVerdict.textContent = evalRes.verdictLabel;
  }
  if (dom.txtAsBuiltSummary) {
    dom.txtAsBuiltSummary.textContent = evalRes.summaryText;
  }
}

/* ==========================================================================
   Printable A4 QC Inspection Sheet Data Sync
   ========================================================================== */

function updatePrintableCard(calc) {
  // Official sheet uses Turkish decimal commas (10,82°)
  const tr = (n, d = 2) => Number(n).toFixed(d).replace('.', ',');
  // Document No & Date
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
  if (dom.prtDate) dom.prtDate.textContent = dateStr;
  
  if (dom.prtDocNo) dom.prtDocNo.textContent = state.reportNo;
  if (dom.prtVerdict) {
    dom.prtVerdict.textContent = calc.overallPass
      ? 'KABUL — İmalata Uygun'
      : `RET — ${calc.failedChecks.map(c => c.label).join(', ')}`;
  }
  if (dom.prtLineName) dom.prtLineName.textContent = `${state.projectName} - ${state.lineSection} (${state.chainageKP})`;
  if (dom.prtPipeNo) dom.prtPipeNo.textContent = `${state.pipeNo} / Heat #${state.heatNo}`;

  const bendNames = {
    overbend: 'Overbend (Tepe Bükümü - Düşey Konveks)',
    sagbend: 'Sagbend (Taban / Vadi Bükümü - Düşey Konkav)',
    sidebend_right: 'Sidebend Sağ (Yatay Büküm)',
    sidebend_left: 'Sidebend Sol (Yatay Büküm)',
    compound: 'Kombine (Düşey + Yatay 3D Büküm)'
  };
  if (dom.prtBendType) {
    if (state.bendType === 'compound') {
      const hStr = `${tr(state.compoundHoriAngle || 0)}° (${state.compoundHoriDir === 'right' ? 'Sağ' : 'Sol'})`;
      const vStr = `${tr(state.compoundVertAngle || 0)}° (${state.compoundVertDir === 'overbend' ? 'Tepe' : 'Vadi'})`;
      const rollStr = `${tr(state.compoundRollAngle || 0, 1)}°`;
      dom.prtBendType.textContent = `3D Bileşik Büküm [Kalıp Roll: ${rollStr} | Yatay: ${hStr} | Düşey: ${vStr}]`;
    } else {
      dom.prtBendType.textContent = bendNames[state.bendType] || state.bendType;
    }
  }

  const clockCheck = validateClockSafety(state.bendType, state.clockPos, state.seamAngle);
  if (dom.prtClockPos) {
    dom.prtClockPos.textContent = `${clockCheck.lblClock} - ${clockCheck.isSafe ? 'KABUL (Nötr Eksende)' : 'RET (Kritik Gerilme)'}`;
  }
  
  // Section 1
  if (dom.prtPipeLength) dom.prtPipeLength.textContent = `${tr(state.length)} m`;
  if (dom.prtPipeOD) dom.prtPipeOD.textContent = `${state.npsLabel} (${tr(state.od, 1)} mm)`;
  if (dom.prtSteelGrade) dom.prtSteelGrade.textContent = `${state.gradeName} (SMYS: ${state.smys} MPa)`;
  if (dom.prtNomWT) {
    dom.prtNomWT.textContent = calc.stdCriteria.enforceMillTolThinning
      ? `${tr(state.t_nom)} mm (CA: ${tr(state.ca, 1)} mm, API 5L Tol: -${tr(calc.millTol.minusTolMm)} mm)`
      : `${tr(state.t_nom)} mm (CA: ${tr(state.ca, 1)} mm)`;
  }
  if (dom.prtPipeWeight) dom.prtPipeWeight.textContent = `${tr(calc.weightPerMeterKg, 1)} kg/m — ${tr(calc.totalPipeWeightTon)} Ton (${Math.round(calc.totalPipeWeightKg).toLocaleString('tr-TR')} kg)`;
  if (dom.prtRiggingLoad) dom.prtRiggingLoad.textContent = `~${tr(calc.riggingSlingLoadTon)} Ton (Min. Sapan SWL: ${tr(calc.minRecommendedSlingSwlTon)} Ton)`;
  if (dom.prtSeam) dom.prtSeam.textContent = `${state.seamType} - ${clockCheck.lblClock}`;
  if (dom.prtDesignPress) {
    dom.prtDesignPress.textContent = `${tr(state.designPressure, 1)} bar (F: ${String(state.designFactor).replace('.', ',')}${calc.T_temp < 0.999 ? `, T: ${tr(calc.T_temp, 3)} @ ${tr(state.designTemp, 0)}°C` : ` @ ${tr(state.designTemp, 0)}°C`})`;
  }
  
  // Section 2
  if (dom.prtRCalculated) dom.prtRCalculated.textContent = `${tr(calc.r_bend_m)} m (${state.radiusMultiplier} D)`;
  if (dom.prtRmin) dom.prtRmin.textContent = `${tr(calc.r_min_m)} m (${calc.minMult}D ${calc.stdCriteria.shortRef}, ${calc.isRadiusCompliant ? 'UYGUN' : 'UYGUN DEĞİL'})`;
  if (dom.prtThetaTarget) dom.prtThetaTarget.textContent = `${tr(state.targetAngle)}°`;
  if (dom.prtThetaMax) {
    dom.prtThetaMax.textContent = !calc.isTangentFeasible
      ? `${tr(calc.theta_max_deg)}° (TEĞET HATASI)`
      : !calc.isAngleWithinPipeCapacity
        ? `${tr(calc.theta_max_deg)}° (AŞIM)`
        : !calc.isGeometryFeasible
          ? `${tr(calc.theta_max_deg)}° (YAY YETERSİZ)`
          : `${tr(calc.theta_max_deg)}° (KAPASİTE DAHİLİ)`;
  }
  if (dom.prtTangents) {
    const clampNote = calc.isClampingSafe ? 'Sıkma: KABUL' : 'Sıkma: YETERSİZ';
    dom.prtTangents.textContent = calc.isCentered
      ? `${tr(calc.pullStartM)} m / ${tr(calc.l_t2_actual)} m (Min: ${tr(calc.minClampingLenM)} m - ${clampNote})`
      : `${tr(state.tangent1)} m / ${tr(calc.l_t2_actual)} m (Min: ${tr(calc.minClampingLenM)} m - ${clampNote})`;
  }
  if (dom.prtArcLength) dom.prtArcLength.textContent = `${tr(calc.l_arc_m)} m (makine yayı: ${tr(calc.l_bent_m)} m)`;
  if (dom.prtSpringback) dom.prtSpringback.textContent = `${tr(calc.springbackDeg)}°`;
  if (dom.prtMachineAngle) dom.prtMachineAngle.textContent = `${tr(calc.machineAngleDeg)}°`;
  if (dom.prtBendingForce) {
    dom.prtBendingForce.textContent = `${tr(calc.plasticMomentKnm, 0)} kNm / ~${tr(calc.ramForceTon, 0)} Ton (${tr(calc.ramForceKn, 0)} kN)`;
  }
  if (dom.prtMachineClass) {
    dom.prtMachineClass.textContent = `${calc.machineClass.modelName} (${calc.machineClass.isSufficient ? 'KAPASİTE DAHİLİ' : 'AŞIM'})`;
  }
  
  // Section 3
  if (dom.prtThinning) {
    dom.prtThinning.textContent = calc.stdCriteria.enforceMillTolThinning
      ? `${tr(calc.delta_t_thin)} mm (%${tr(calc.thinningPercent)}) [API 5L Tol: ≤ ${tr(calc.millTol.minusTolMm)} mm]`
      : `${tr(calc.delta_t_thin)} mm (%${tr(calc.thinningPercent)})`;
  }
  if (dom.prtRemainingWT) {
    dom.prtRemainingWT.textContent = calc.stdCriteria.enforceMillTolThinning
      ? `${tr(calc.t_extrados)} mm (t_min+tol: ${tr(calc.t_min_required)} mm) - ${calc.isWallThinningSafe ? 'KABUL' : 'RET'}`
      : `${tr(calc.t_extrados)} mm (t_min: ${tr(calc.t_min_design)} mm) - ${calc.isWallThinningSafe ? 'KABUL' : 'RET'}`;
  }
  if (dom.prtOvality) dom.prtOvality.textContent = `%${tr(calc.estimatedOvality)} (Maks: %${tr(calc.maxAllowOvality, 1)}) - ${calc.isOvalityCompliant ? 'KABUL' : 'RET'}`;
  if (dom.prtMandrel) dom.prtMandrel.textContent = state.useMandrel ? 'İç Hidrolik Mandrel Kullanıldı (KABUL)' : 'Mandrelsiz Büküm Yapıldı';
  if (dom.prtDeflectionRate) dom.prtDeflectionRate.textContent = `${tr(calc.actualDeflectionRatePerOD)}° / D (Limit: ≤ ${tr(calc.asmeMethod2Limit, 2)}° / D) - ${calc.isMethod2Compliant ? 'KABUL' : 'RET'}`;
  if (dom.prtRippleStatus) dom.prtRippleStatus.textContent = `~${tr(calc.estimatedRippleMm, 1)} mm (Limit: ≤ ${tr(calc.maxAllowRippleMm, 1)} mm / %${tr(calc.stdCriteria.maxAllowRipplePct, 1)} D) - ${calc.isRippleCompliant ? 'KABUL' : 'RET'}`;
  if (dom.prtGirthWeldStatus) {
    if (!state.girthWeldInBend) {
      dom.prtGirthWeldStatus.textContent = 'Alın Kaynağı Yok (RT Gerekmez)';
    } else if (calc.isGwInArc) {
      dom.prtGirthWeldStatus.textContent = `Boru Başı X=${tr(state.girthWeldDist)} m (BÜKÜM YAYI İÇİNDE - Md. 841.2.3-a-5 Gereği %100 RT ZORUNLU)`;
    } else if (calc.isGwOnPipe) {
      dom.prtGirthWeldStatus.textContent = `Boru Başı X=${tr(state.girthWeldDist)} m (Düz Teğet Bölgede - Büküm Yayından Muaf, Normal Saha RT)`;
    } else {
      dom.prtGirthWeldStatus.textContent = `Hatalı Konum (X=${tr(state.girthWeldDist)} m Boru Boyu Dışında)`;
    }
  }

  if (dom.prtCombinedStress) {
    dom.prtCombinedStress.textContent = `Von Mises: ${tr(calc.vonMisesStressMpa, 1)} MPa (Limit: ≤ ${tr(calc.allowableCombinedStressMpa, 1)} MPa / %90 SMYS) - ${calc.isCombinedStressCompliant ? 'KABUL' : 'RET'} (%${tr(calc.combinedStressRatioPercent, 1)})`;
  }

  // Section 4: Render 2D Vector CAD Sketch to Printable Card
  if (dom.svgPrintDynamicGroup) {
    render2DSketchTo(dom.svgPrintDynamicGroup, calc, true);
  }

  // Section 5: print pulls table (same math as renderPullsTable; truncated for A4)
  if (dom.prtPullsHead) {
    dom.prtPullsHead.textContent =
      `5. HİDROLİK BÜKÜM ADIMLARI (PASO / PULL TABLOSU) — ${calc.numPulls} paso` +
      `${calc.manualPullsUsed ? ' (manuel adet)' : ''}${calc.isCentered ? ' (ortalı)' : ''}`;
  }
  const prtBody = dom.prtPullsBody;
  if (prtBody) {
    prtBody.innerHTML = '';
    const stepMm = (calc.pullStepPitch * 1000).toFixed(0);
    const stepAng = tr(calc.pullAnglePerStep);
    const rows = [];
    for (let i = 1; i <= calc.numPulls; i++) {
      rows.push({
        n: i,
        pos: tr(calc.pullStartM + calc.pullStepPitch * i, 3),
        cumMach: tr(calc.pullAnglePerStep * i),
        cumNet: tr(calc.netAnglePerStep * i)
      });
    }
    const MAX_PRINT_ROWS = 30;
    let visible = rows;
    let skipped = 0;
    if (rows.length > MAX_PRINT_ROWS) {
      const head = 14;
      const tail = 14;
      skipped = rows.length - head - tail;
      visible = [...rows.slice(0, head), null, ...rows.slice(rows.length - tail)];
    }
    visible.forEach((r) => {
      const trow = document.createElement('tr');
      if (r === null) {
        trow.innerHTML = `<td colspan="6" style="text-align:center;">… (${skipped} paso atlandı — tam liste için ekran tablosuna bakınız) …</td>`;
      } else {
        trow.innerHTML = `<td><strong>${r.n}</strong></td><td>${r.pos}</td><td>${stepMm}</td><td>+${stepAng}°</td><td><strong>${r.cumMach}°</strong></td><td>${r.cumNet}°</td>`;
      }
      prtBody.appendChild(trow);
    });
  }

  // Section 6: Site As-Built Verification & QC Stamp Table
  const asBuiltEval = calculateAsBuiltEvaluation(calc);
  if (dom.prtAsBuiltTargetAngle) dom.prtAsBuiltTargetAngle.textContent = `${tr(asBuiltEval.targetAngle)}°`;
  if (dom.prtAsBuiltMeasAngle) {
    dom.prtAsBuiltMeasAngle.textContent = asBuiltEval.measAngle !== null ? `${tr(asBuiltEval.measAngle)}°` : '—';
  }
  if (dom.prtAsBuiltDevAngle) {
    dom.prtAsBuiltDevAngle.textContent = asBuiltEval.angleDev !== null ? `${asBuiltEval.angleDev >= 0 ? '+' : ''}${tr(asBuiltEval.angleDev)}°` : '—';
  }
  if (dom.prtAsBuiltStatusAngle) {
    dom.prtAsBuiltStatusAngle.innerHTML = asBuiltEval.angleStatus === 'pass'
      ? '<strong style="color:#15803d;">KABUL</strong>'
      : asBuiltEval.angleStatus === 'warn'
        ? '<strong style="color:#b45309;">ŞARTLI</strong>'
        : asBuiltEval.angleStatus === 'fail'
          ? '<strong style="color:#b91c1c;">RET</strong>'
          : '<strong>BEKLENİYOR</strong>';
  }

  if (dom.prtAsBuiltTargetWT) dom.prtAsBuiltTargetWT.textContent = `t_min: ${tr(asBuiltEval.t_min)} mm`;
  if (dom.prtAsBuiltMeasWT) {
    dom.prtAsBuiltMeasWT.textContent = asBuiltEval.measWT !== null ? `${tr(asBuiltEval.measWT)} mm` : '—';
  }
  if (dom.prtAsBuiltDevWT) {
    dom.prtAsBuiltDevWT.textContent = asBuiltEval.wtDev !== null ? `${asBuiltEval.wtDev >= 0 ? '+' : ''}${tr(asBuiltEval.wtDev)} mm` : '—';
  }
  if (dom.prtAsBuiltCritWT) {
    dom.prtAsBuiltCritWT.innerHTML = asBuiltEval.stdCriteria.enforceMillTolThinning
      ? `t<sub>meas</sub> ≥ max(t<sub>min,des</sub>, t<sub>min,mill</sub>)`
      : `t<sub>meas</sub> ≥ t<sub>min,design</sub>`;
  }
  if (dom.prtAsBuiltStatusWT) {
    dom.prtAsBuiltStatusWT.innerHTML = asBuiltEval.wtStatus === 'pass'
      ? '<strong style="color:#15803d;">KABUL</strong>'
      : asBuiltEval.wtStatus === 'fail'
        ? '<strong style="color:#b91c1c;">RET</strong>'
        : '<strong>BEKLENİYOR</strong>';
  }

  if (dom.prtAsBuiltTargetOvality) {
    dom.prtAsBuiltTargetOvality.textContent = `Maks: %${tr(asBuiltEval.maxAllowOvality)}`;
  }
  if (dom.prtAsBuiltMeasOvality) {
    dom.prtAsBuiltMeasOvality.textContent = asBuiltEval.measOvality !== null ? `%${tr(asBuiltEval.measOvality)}` : '—';
  }
  if (dom.prtAsBuiltDevOvality) {
    dom.prtAsBuiltDevOvality.textContent = asBuiltEval.ovalityDev !== null ? `${asBuiltEval.ovalityDev >= 0 ? '+' : ''}%${tr(asBuiltEval.ovalityDev)}` : '—';
  }
  if (dom.prtAsBuiltCritOvality) {
    dom.prtAsBuiltCritOvality.textContent = `${asBuiltEval.stdCriteria.shortRef}: ≤ %${tr(asBuiltEval.maxAllowOvality)}`;
  }
  if (dom.prtAsBuiltStatusOvality) {
    dom.prtAsBuiltStatusOvality.innerHTML = asBuiltEval.ovalityStatus === 'pass'
      ? '<strong style="color:#15803d;">KABUL</strong>'
      : asBuiltEval.ovalityStatus === 'fail'
        ? '<strong style="color:#b91c1c;">RET</strong>'
        : '<strong>BEKLENİYOR</strong>';
  }

  if (dom.prtAsBuiltTargetRipple) dom.prtAsBuiltTargetRipple.textContent = `≤ ${tr(asBuiltEval.maxAllowRipple, 1)} mm (%${tr(asBuiltEval.stdCriteria.maxAllowRipplePct, 1)} D)`;
  if (dom.prtAsBuiltMeasRipple) {
    dom.prtAsBuiltMeasRipple.textContent = asBuiltEval.measRipple !== null ? `${tr(asBuiltEval.measRipple, 1)} mm` : '—';
  }
  if (dom.prtAsBuiltDevRipple) {
    dom.prtAsBuiltDevRipple.textContent = asBuiltEval.rippleDev !== null ? `${asBuiltEval.rippleDev >= 0 ? '+' : ''}${tr(asBuiltEval.rippleDev, 1)} mm` : '—';
  }
  if (dom.prtAsBuiltCritRipple) {
    dom.prtAsBuiltCritRipple.textContent = `${asBuiltEval.stdCriteria.shortRef}: h ≤ %${tr(asBuiltEval.stdCriteria.maxAllowRipplePct, 1)} D`;
  }
  if (dom.prtAsBuiltStatusRipple) {
    dom.prtAsBuiltStatusRipple.innerHTML = asBuiltEval.rippleStatus === 'pass'
      ? '<strong style="color:#15803d;">KABUL</strong>'
      : asBuiltEval.rippleStatus === 'fail'
        ? '<strong style="color:#b91c1c;">RET</strong>'
        : '<strong>BEKLENİYOR</strong>';
  }

  if (dom.prtAsBuiltMeta) {
    const metaSpool = state.asBuilt.spoolNo || state.pipeNo || '—';
    const metaInsp = state.asBuilt.inspector || 'İmza Bekleniyor';
    const metaDate = state.asBuilt.date || dateStr;
    dom.prtAsBuiltMeta.textContent = `${metaSpool} / ${metaInsp} / ${metaDate}`;
  }
  if (dom.prtAsBuiltFinalVerdict) {
    dom.prtAsBuiltFinalVerdict.textContent = asBuiltEval.verdictLabel;
    dom.prtAsBuiltFinalVerdict.style.color = asBuiltEval.overallStatus === 'pass'
      ? '#15803d'
      : asBuiltEval.overallStatus === 'warn'
        ? '#b45309'
        : asBuiltEval.overallStatus === 'fail'
          ? '#b91c1c'
          : '#475569';
  }
}

/* ==========================================================================
   Radius menu: only standard-compliant multipliers are offered
   ========================================================================== */

const RADIUS_CHOICES = [18, 20, 21, 24, 27, 30, 40, 50];
const RADIUS_LABELS = {
  18: '18 D (Küçük Çap)',
  20: '20 D (EN 1594 Küçük Çap)',
  21: '21 D',
  24: '24 D',
  27: '27 D',
  30: '30 D (ASME Standart)',
  40: '40 D (Sıkı Kriter)',
  50: '50 D (Geniş Kavis)'
};

function allowedRadiusMultipliers() {
  const minMult = calculateMinimumBendRadiusMultiplier(state.standard, state.od);
  return RADIUS_CHOICES.filter(k => k >= minMult);
}

// Rebuilds the Rbend menu from the active standard + NPS. Keeps the current
// choice when still permitted, otherwise falls back to the standard minimum.
function syncRadiusOptions() {
  const sel = dom.selRadiusMultiplier;
  if (!sel) return;
  const allowed = allowedRadiusMultipliers();
  const prev = sel.value;
  sel.innerHTML = '';
  allowed.forEach((k) => {
    const o = document.createElement('option');
    o.value = String(k);
    o.textContent = RADIUS_LABELS[k];
    sel.appendChild(o);
  });
  const oc = document.createElement('option');
  oc.value = 'custom';
  oc.textContent = 'Özel Yarıçap...';
  sel.appendChild(oc);
  if (prev === 'custom' || allowed.includes(Number(prev))) {
    sel.value = prev;
    if (prev !== 'custom') state.radiusMultiplier = parseFloat(prev);
    if (dom.groupCustomRadius) dom.groupCustomRadius.style.display = prev === 'custom' ? 'block' : 'none';
  } else {
    sel.value = String(allowed[0]);
    state.radiusMultiplier = allowed[0];
    if (dom.groupCustomRadius) dom.groupCustomRadius.style.display = 'none';
    if (dom.inpCustomRadius) dom.inpCustomRadius.value = allowed[0];
  }
}

/* ==========================================================================
   Event Listeners & User Interaction Handlers
   ========================================================================== */

// Trailing debounce: slider drags fire dozens of input events/sec.
// State is applied immediately; only the heavy re-render is deferred.
function debounce(fn, wait) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
const scheduleUI = debounce(updateUI, 80);
const scheduleSave = debounce(saveState, 300);

// Central locale-aware float parser: handles both dot ("14.3") and Turkish decimal comma ("14,3")
function parseLocaleFloat(v, fallback = null) {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim().replace(',', '.');
  if (s === '') return fallback;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

// Central numeric guard: non-finite input falls back, out-of-range input is
// clamped to the field limits so absurd values (negative wall, zero length)
// can never flow into the engineering calculations.
function clampNum(v, min, max, fallback) {
  const n = parseLocaleFloat(v, NaN);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

const STATE_STORAGE_KEY = 'coldbend_state_v1';

function saveState() {
  try {
    const data = { ...state };
    delete data.theme; // theme persists under its own key
    data.npsSelect = dom.selNPS ? dom.selNPS.value : undefined;
    data.radiusSelect = dom.selRadiusMultiplier ? dom.selRadiusMultiplier.value : undefined;
    data.preset = dom.selPreset ? dom.selPreset.value : undefined;
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    /* storage unavailable (private mode, quota) — silently ignore */
  }
}

function restoreState(customData = null) {
  let data = customData;
  if (!data) {
    try {
      data = JSON.parse(localStorage.getItem(STATE_STORAGE_KEY) || 'null');
    } catch (err) {
      data = null;
    }
  }
  if (!data || typeof data !== 'object') return;

  const num = (v, fallback, min, max) => {
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return fallback;
    if (min !== undefined && n < min) return fallback;
    if (max !== undefined && n > max) return fallback;
    return n;
  };
  const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback);

  state.standard = oneOf(data.standard, ['ASME_B31_8', 'ASME_B31_4', 'EN_1594', 'CSA_Z662', 'BOTAS_SPEC', 'CUSTOM_SPEC'], state.standard);
  state.od = num(data.od, state.od, 50, 2500);
  state.t_nom = num(data.t_nom, state.t_nom, 3, 60);
  state.ca = num(data.ca, state.ca, 0, 10);
  state.length = num(data.length, state.length, 4, 25);
  state.tangent1 = num(data.tangent1, state.tangent1, 0.5, 5);
  state.tangent2 = num(data.tangent2, state.tangent2, 0.5, 5);
  state.smys = oneOf(num(data.smys, state.smys), [245, 290, 320, 360, 390, 415, 450, 485, 555], state.smys);
  state.seamType = oneOf(data.seamType, ['SAWH', 'SAWL', 'SMLS'], state.seamType);
  state.clockPos = oneOf(data.clockPos, ['3', '9', '12', '6', 'custom'], state.clockPos);
  state.seamAngle = num(data.seamAngle, state.seamAngle, -180, 180);
  state.bendType = oneOf(data.bendType, ['overbend', 'sagbend', 'sidebend_right', 'sidebend_left', 'compound'], state.bendType);
  state.compoundHoriAngle = num(data.compoundHoriAngle, state.compoundHoriAngle, 0, 90);
  state.compoundVertAngle = num(data.compoundVertAngle, state.compoundVertAngle, 0, 90);
  state.compoundHoriDir = oneOf(data.compoundHoriDir, ['right', 'left'], state.compoundHoriDir);
  state.compoundVertDir = oneOf(data.compoundVertDir, ['overbend', 'sagbend'], state.compoundVertDir);
  state.compoundRollAngle = num(data.compoundRollAngle, state.compoundRollAngle, 0, 90);
  state.targetAngle = num(data.targetAngle, state.targetAngle, 0.5, 90);
  state.radiusMultiplier = num(data.radiusMultiplier, state.radiusMultiplier, 5, 100);
  state.designPressure = num(data.designPressure, state.designPressure, 1, 250);
  state.designTemp = num(data.designTemp, state.designTemp, -20, 250);
  state.designFactor = oneOf(num(data.designFactor, state.designFactor), [0.8, 0.72, 0.6, 0.5, 0.4], state.designFactor);
  if (data.manualPulls === null || data.manualPulls === undefined || data.manualPulls === '') {
    state.manualPulls = null;
  } else {
    const mn = Math.round(Number(data.manualPulls));
    state.manualPulls = Number.isFinite(mn) ? Math.min(60, Math.max(2, mn)) : null;
  }
  state.useMandrel = data.useMandrel !== undefined ? !!data.useMandrel : state.useMandrel;
  state.girthWeldInBend = data.girthWeldInBend !== undefined ? !!data.girthWeldInBend : state.girthWeldInBend;
  state.girthWeldDist = num(data.girthWeldDist, state.girthWeldDist, 0.1, 30);
  state.showDimensions = data.showDimensions !== undefined ? !!data.showDimensions : state.showDimensions;
  state.mandrelVisible3D = data.mandrelVisible3D !== undefined ? !!data.mandrelVisible3D : state.mandrelVisible3D;
  state.seamVisible3D = data.seamVisible3D !== undefined ? !!data.seamVisible3D : state.seamVisible3D;
  ['projectName', 'lineSection', 'chainageKP', 'pipeNo', 'heatNo', 'reportNo'].forEach((k) => {
    if (typeof data[k] === 'string' && data[k].length > 0) state[k] = data[k];
  });
  // Migrate old saved states that still carry the previous project name
  state.projectName = state.projectName.replace(/^BOTAŞ\s+/, '');

  // Clock presets map to fixed seam angles (same as change handler)
  if (state.clockPos !== 'custom') {
    if (state.clockPos === '3') state.seamAngle = 0;
    else if (state.clockPos === '9') state.seamAngle = 180;
    else if (state.clockPos === '12') state.seamAngle = 90;
    else if (state.clockPos === '6') state.seamAngle = -90;
  }

  // Sync form controls from restored state
  const setVal = (el, v) => { if (el) el.value = v; };
  setVal(dom.selStandard, state.standard);
  setVal(dom.selGrade, String(state.smys));
  if (dom.selGrade && dom.selGrade.selectedIndex >= 0) {
    state.gradeName = dom.selGrade.options[dom.selGrade.selectedIndex].text.split('(')[0].trim();
  } else if (typeof data.gradeName === 'string' && data.gradeName) {
    state.gradeName = data.gradeName;
  }
  setVal(dom.selSeamType, state.seamType);
  setVal(dom.selClockPos, state.clockPos);
  setVal(dom.inpSeamAngle, state.seamAngle);
  if (dom.groupCustomSeamAngle) dom.groupCustomSeamAngle.style.display = state.clockPos === 'custom' ? 'block' : 'none';
  setVal(dom.selBendType, state.bendType);
  setVal(dom.selDesignFactor, String(state.designFactor));
  setVal(dom.inpWallThk, state.t_nom);
  setVal(dom.inpCorrosion, state.ca);
  setVal(dom.inpPipeLength, state.length);
  setVal(dom.rngPipeLength, Math.min(Math.max(state.length, 4.0), 25.0));
  setVal(dom.inpTargetAngle, state.targetAngle);
  setVal(dom.rngTargetAngle, Math.min(state.targetAngle, 45.0));
  setVal(dom.inpTangent1, state.tangent1);
  setVal(dom.inpTangent2, state.tangent2);
  setVal(dom.inpManualPulls, state.manualPulls == null ? '' : state.manualPulls);
  setVal(dom.inpDesignPressure, state.designPressure);
  setVal(dom.inpDesignTemp, state.designTemp);
  if (dom.chkUseMandrel) dom.chkUseMandrel.checked = state.useMandrel;
  if (dom.chkGirthWeld) dom.chkGirthWeld.checked = state.girthWeldInBend;
  setVal(dom.inpGirthWeldDist, state.girthWeldDist);
  if (dom.groupGirthWeldDist) dom.groupGirthWeldDist.style.display = state.girthWeldInBend ? 'block' : 'none';
  setVal(dom.inpProjectName, state.projectName);
  setVal(dom.inpLineSection, state.lineSection);
  setVal(dom.inpChainageKP, state.chainageKP);
  setVal(dom.inpPipeNo, state.pipeNo);
  setVal(dom.inpHeatNo, state.heatNo);
  setVal(dom.inpReportNo, state.reportNo);

  // NPS select: prefer saved raw value, fall back to matching OD
  if (dom.selNPS) {
    const savedNps = typeof data.npsSelect === 'string' ? data.npsSelect : null;
    const hasOption = (v) => [...dom.selNPS.options].some(o => o.value === v);
    if (savedNps && hasOption(savedNps) && savedNps !== 'custom') {
      dom.selNPS.value = savedNps;
      state.od = parseFloat(savedNps);
      state.npsLabel = dom.selNPS.options[dom.selNPS.selectedIndex].text.split('(')[0].trim();
      if (dom.groupCustomOD) dom.groupCustomOD.style.display = 'none';
    } else if (hasOption(String(state.od))) {
      dom.selNPS.value = String(state.od);
      state.npsLabel = dom.selNPS.options[dom.selNPS.selectedIndex].text.split('(')[0].trim();
      if (dom.groupCustomOD) dom.groupCustomOD.style.display = 'none';
    } else {
      dom.selNPS.value = 'custom';
      state.npsLabel = 'Özel Çap';
      if (dom.groupCustomOD) dom.groupCustomOD.style.display = 'block';
      setVal(dom.inpCustomOD, state.od);
    }
  }

  // Radius select: prefer saved raw value
  if (dom.selRadiusMultiplier) {
    const savedR = typeof data.radiusSelect === 'string' ? data.radiusSelect : null;
    const hasOption = (v) => [...dom.selRadiusMultiplier.options].some(o => o.value === v);
    if (savedR === 'custom' || (!savedR && !hasOption(String(state.radiusMultiplier)))) {
      dom.selRadiusMultiplier.value = 'custom';
      if (dom.groupCustomRadius) dom.groupCustomRadius.style.display = 'block';
      setVal(dom.inpCustomRadius, state.radiusMultiplier);
    } else if (savedR && hasOption(savedR)) {
      dom.selRadiusMultiplier.value = savedR;
      if (dom.groupCustomRadius) dom.groupCustomRadius.style.display = 'none';
    } else {
      dom.selRadiusMultiplier.value = String(state.radiusMultiplier);
      if (dom.groupCustomRadius) dom.groupCustomRadius.style.display = 'none';
    }
  }

  if (dom.btnToggleLabels) dom.btnToggleLabels.textContent = state.showDimensions ? 'Ölçüleri Gizle' : 'Ölçüleri Göster';
  if (dom.btnToggleLabels) dom.btnToggleLabels.setAttribute('aria-pressed', String(state.showDimensions));
  if (dom.btn3dToggleMandrel) dom.btn3dToggleMandrel.textContent = `Mandrel: ${state.mandrelVisible3D ? 'Açık' : 'Kapalı'}`;
  if (dom.btn3dToggleMandrel) dom.btn3dToggleMandrel.setAttribute('aria-pressed', String(state.mandrelVisible3D));
  if (dom.btn3dToggleSeam) dom.btn3dToggleSeam.setAttribute('aria-pressed', String(state.seamVisible3D));
  // Restored preset display: manual edits were already marked custom on save
  if (dom.selPreset) {
    const savedPreset = typeof data.preset === 'string' ? data.preset : null;
    const hasPreset = savedPreset && [...dom.selPreset.options].some(o => o.value === savedPreset);
    dom.selPreset.value = hasPreset ? savedPreset : 'custom';
  }

  // Restore As-Built Field QC Measurements
  if (data.asBuilt && typeof data.asBuilt === 'object') {
    state.asBuilt = { ...state.asBuilt, ...data.asBuilt };
    state.asBuilt.measuredAngle = parseLocaleFloat(state.asBuilt.measuredAngle, null);
    state.asBuilt.measuredWT = parseLocaleFloat(state.asBuilt.measuredWT, null);
    state.asBuilt.measuredOvality = parseLocaleFloat(state.asBuilt.measuredOvality, null);
    state.asBuilt.measuredRipple = parseLocaleFloat(state.asBuilt.measuredRipple, 0.0);
    setVal(dom.inpAsBuiltSpool, state.asBuilt.spoolNo || '');
    setVal(dom.inpAsBuiltDate, state.asBuilt.date || '');
    setVal(dom.inpAsBuiltAngle, state.asBuilt.measuredAngle !== null ? state.asBuilt.measuredAngle : '');
    setVal(dom.inpAsBuiltWT, state.asBuilt.measuredWT !== null ? state.asBuilt.measuredWT : '');
    setVal(dom.inpAsBuiltOvality, state.asBuilt.measuredOvality !== null ? state.asBuilt.measuredOvality : '');
    setVal(dom.inpAsBuiltRipple, state.asBuilt.measuredRipple !== null ? state.asBuilt.measuredRipple : '0.0');
    setVal(dom.inpAsBuiltInspector, state.asBuilt.inspector || '');
  }

  syncRadiusOptions();
}

/* ==========================================================================
   Topographic Slope & Elevation Deflection Angle Calculator
   ========================================================================== */
const slopeCalcState = {
  mode: 'percent', // 'percent' or 'elevation'
  calculatedAngle: 10.29,
  bendType: 'overbend'
};

function calculateSlopeDeflection() {
  let angleDeg = 0;
  let bendType = 'overbend';
  let desc = '';

  if (slopeCalcState.mode === 'percent') {
    const isDegree = dom.selSlopeUnit && dom.selSlopeUnit.value === 'degree';
    const s1 = parseLocaleFloat(dom.inpSlope1 ? dom.inpSlope1.value : '0', 0);
    const s2 = parseLocaleFloat(dom.inpSlope2 ? dom.inpSlope2.value : '0', 0);

    let a1 = 0, a2 = 0;
    if (isDegree) {
      a1 = s1;
      a2 = s2;
    } else {
      a1 = Math.atan(s1 / 100) * (180 / Math.PI);
      a2 = Math.atan(s2 / 100) * (180 / Math.PI);
    }

    angleDeg = Math.abs(a2 - a1);
    if (a1 > a2) {
      bendType = 'overbend';
      desc = `Giriş eğimi: ${a1 >= 0 ? '+' : ''}${a1.toFixed(2)}° • Çıkış eğimi: ${a2 >= 0 ? '+' : ''}${a2.toFixed(2)}° • Eğim farkı tepe (konveks) oluşturmaktadır.`;
    } else if (a1 < a2) {
      bendType = 'sagbend';
      desc = `Giriş eğimi: ${a1 >= 0 ? '+' : ''}${a1.toFixed(2)}° • Çıkış eğimi: ${a2 >= 0 ? '+' : ''}${a2.toFixed(2)}° • Eğim farkı vadi/çukur (konkav) oluşturmaktadır.`;
    } else {
      bendType = 'overbend';
      desc = 'Eğim farkı yoktur (düz doğrusal hat).';
    }
  } else {
    // Mode 2: Elevation & Stations (KP)
    const kp1 = parseLocaleFloat(dom.inpElevKp1 ? dom.inpElevKp1.value : '0', 0);
    const z1 = parseLocaleFloat(dom.inpElevZ1 ? dom.inpElevZ1.value : '0', 0);
    const kp2 = parseLocaleFloat(dom.inpElevKp2 ? dom.inpElevKp2.value : '0', 0);
    const z2 = parseLocaleFloat(dom.inpElevZ2 ? dom.inpElevZ2.value : '0', 0);
    const kp3 = parseLocaleFloat(dom.inpElevKp3 ? dom.inpElevKp3.value : '0', 0);
    const z3 = parseLocaleFloat(dom.inpElevZ3 ? dom.inpElevZ3.value : '0', 0);

    const dx1 = kp2 - kp1;
    const dz1 = z2 - z1;
    const dx2 = kp3 - kp2;
    const dz2 = z3 - z2;

    if (Math.abs(dx1) < 1e-4 || Math.abs(dx2) < 1e-4) {
      angleDeg = 0;
      desc = 'İstasyon mesafeleri sıfır olamaz.';
    } else {
      const a1 = Math.atan(dz1 / dx1) * (180 / Math.PI);
      const a2 = Math.atan(dz2 / dx2) * (180 / Math.PI);
      angleDeg = Math.abs(a2 - a1);

      if (a1 > a2) {
        bendType = 'overbend';
        desc = `1. Kol eğimi: ${a1 >= 0 ? '+' : ''}${a1.toFixed(2)}° (%${((dz1/dx1)*100).toFixed(1)}) • 2. Kol eğimi: ${a2 >= 0 ? '+' : ''}${a2.toFixed(2)}° (%${((dz2/dx2)*100).toFixed(1)}) • Tepe bükümü.`;
      } else if (a1 < a2) {
        bendType = 'sagbend';
        desc = `1. Kol eğimi: ${a1 >= 0 ? '+' : ''}${a1.toFixed(2)}° (%${((dz1/dx1)*100).toFixed(1)}) • 2. Kol eğimi: ${a2 >= 0 ? '+' : ''}${a2.toFixed(2)}° (%${((dz2/dx2)*100).toFixed(1)}) • Taban/vadi bükümü.`;
      } else {
        bendType = 'overbend';
        desc = 'İki kol aynı doğrultudadır (açı: 0°).';
      }
    }
  }

  slopeCalcState.calculatedAngle = angleDeg;
  slopeCalcState.bendType = bendType;

  if (dom.valCalculatedSlopeAngle) dom.valCalculatedSlopeAngle.textContent = `${angleDeg.toFixed(2)}°`;
  if (dom.badgeCalculatedBendType) {
    dom.badgeCalculatedBendType.textContent = bendType === 'overbend' ? 'OVERBEND (Tepe Bükümü)' : 'SAGBEND (Taban / Vadi Bükümü)';
    dom.badgeCalculatedBendType.className = `badge-mini ${bendType === 'overbend' ? 'pass' : 'info'}`;
  }
  if (dom.descCalculatedSlope) dom.descCalculatedSlope.textContent = desc;
}

function openSlopeModal() {
  if (!dom.slopeModal) return;
  dom.slopeModal.hidden = false;
  calculateSlopeDeflection();
}

function closeSlopeModal() {
  if (!dom.slopeModal) return;
  dom.slopeModal.hidden = true;
}

function applyCalculatedSlope() {
  const angle = parseFloat(slopeCalcState.calculatedAngle.toFixed(2));
  if (angle > 0.05) {
    state.targetAngle = angle;
    state.bendType = slopeCalcState.bendType;

    if (dom.inpTargetAngle) dom.inpTargetAngle.value = state.targetAngle;
    if (dom.rngTargetAngle) dom.rngTargetAngle.value = Math.min(45, state.targetAngle);
    if (dom.selBendType) dom.selBendType.value = state.bendType;

    updateUI();
  }
  closeSlopeModal();
}

/* ==========================================================================
   3D Compound Bend & Roll Angle Calculation Engine
   True 3D Spatial Curvature: cos(theta_3D) = cos(theta_H) * cos(theta_V)
   Machine Roll Angle: tan(psi) = tan(V) / sin(H)
   ========================================================================== */

const compoundCalcState = {
  horiAngle: 8.0,
  horiDir: 'right',
  vertAngle: 6.0,
  vertDir: 'overbend',
  resultAngle: 9.99,
  rollAngle: 36.9,
  bendType: 'compound'
};

function calculateCompoundBend() {
  const hDeg = clampNum(dom.inpHoriAngle ? dom.inpHoriAngle.value : 0, 0, 85, 0);
  const vDeg = clampNum(dom.inpVertAngle ? dom.inpVertAngle.value : 0, 0, 85, 0);
  const hDir = dom.selHoriDir ? dom.selHoriDir.value : 'right';
  const vDir = dom.selVertDir ? dom.selVertDir.value : 'overbend';

  const hRad = (hDeg * Math.PI) / 180;
  const vRad = (vDeg * Math.PI) / 180;

  // True 3D spatial compound bend angle: cos(theta_3D) = cos(theta_H) * cos(theta_V)
  const cos3D = Math.max(-1, Math.min(1, Math.cos(hRad) * Math.cos(vRad)));
  const theta3dRad = Math.acos(cos3D);
  const theta3dDeg = (theta3dRad * 180) / Math.PI;

  // Roll Angle psi (rotation of pipe bending plane from horizontal):
  // tan(psi) = tan(V) / sin(H)
  let rollDeg = 0;
  if (hDeg < 1e-6 && vDeg < 1e-6) {
    rollDeg = 0;
  } else if (hDeg < 1e-6) {
    rollDeg = 90.0;
  } else if (vDeg < 1e-6) {
    rollDeg = 0.0;
  } else {
    const tanV = Math.tan(vRad);
    const sinH = Math.sin(hRad);
    rollDeg = (Math.atan2(tanV, sinH) * 180) / Math.PI;
  }

  compoundCalcState.horiAngle = hDeg;
  compoundCalcState.vertAngle = vDeg;
  compoundCalcState.horiDir = hDir;
  compoundCalcState.vertDir = vDir;
  compoundCalcState.resultAngle = theta3dDeg;
  compoundCalcState.rollAngle = rollDeg;

  // Dominant bend type determination
  let bendTypeDesc = 'compound';
  if (hDeg < 0.2 && vDeg > 0.2) {
    bendTypeDesc = vDir;
  } else if (vDeg < 0.2 && hDeg > 0.2) {
    bendTypeDesc = hDir === 'right' ? 'sidebend_right' : 'sidebend_left';
  } else {
    bendTypeDesc = 'compound';
  }
  compoundCalcState.bendType = bendTypeDesc;

  // Update UI outputs
  if (dom.valCompound3DAngle) dom.valCompound3DAngle.textContent = `${theta3dDeg.toFixed(2)}°`;
  if (dom.valCompoundRollAngle) dom.valCompoundRollAngle.textContent = `${rollDeg.toFixed(1)}°`;
  if (dom.badgeCompoundType) {
    const hTxt = hDir === 'right' ? 'Sağ' : 'Sol';
    const vTxt = vDir === 'overbend' ? 'Tepe (Overbend)' : 'Vadi (Sagbend)';
    dom.badgeCompoundType.textContent = (hDeg > 0.1 && vDeg > 0.1)
      ? `3D KOMBİNE (${hTxt} + ${vTxt})`
      : (hDeg > 0.1 ? `YATAY BÜKÜM (${hTxt})` : `DÜŞEY BÜKÜM (${vTxt})`);
  }
  if (dom.descCompoundResult) {
    dom.descCompoundResult.textContent = `Yatay: ${hDeg.toFixed(2)}° (${hDir === 'right' ? 'Sağa' : 'Sola'}), Düşey: ${vDeg.toFixed(2)}° (${vDir === 'overbend' ? 'Tepeye' : 'Vadiye'}). Boru ekseni büküm presinde yataydan ${rollDeg.toFixed(1)}° döndürülerek ${theta3dDeg.toFixed(2)}° bileşke açıda tek seferde bükülmelidir.`;
  }
}

function openCompoundModal() {
  if (!dom.compoundModal) return;
  if (state.compoundHoriAngle || state.compoundVertAngle) {
    if (dom.inpHoriAngle) dom.inpHoriAngle.value = state.compoundHoriAngle;
    if (dom.inpVertAngle) dom.inpVertAngle.value = state.compoundVertAngle;
    if (dom.selHoriDir) dom.selHoriDir.value = state.compoundHoriDir;
    if (dom.selVertDir) dom.selVertDir.value = state.compoundVertDir;
  }
  dom.compoundModal.hidden = false;
  calculateCompoundBend();
}

function closeCompoundModal() {
  if (!dom.compoundModal) return;
  dom.compoundModal.hidden = true;
}

function applyCompoundBend() {
  const angle = parseFloat(compoundCalcState.resultAngle.toFixed(2));
  if (angle > 0.05) {
    state.targetAngle = angle;
    state.bendType = compoundCalcState.bendType;
    state.compoundHoriAngle = compoundCalcState.horiAngle;
    state.compoundVertAngle = compoundCalcState.vertAngle;
    state.compoundHoriDir = compoundCalcState.horiDir;
    state.compoundVertDir = compoundCalcState.vertDir;
    state.compoundRollAngle = compoundCalcState.rollAngle;

    if (dom.inpTargetAngle) dom.inpTargetAngle.value = state.targetAngle;
    if (dom.rngTargetAngle) dom.rngTargetAngle.value = Math.min(45, state.targetAngle);
    if (dom.selBendType) dom.selBendType.value = state.bendType;

    updateUI();
  }
  closeCompoundModal();
}

function setupEventListeners() {
  // Preset Selector
  dom.selPreset.addEventListener('change', (e) => {
    const key = e.target.value;
    if (key !== 'custom' && PRESETS[key]) {
      const p = PRESETS[key];
      state.standard = p.standard;
      dom.selStandard.value = p.standard;
      
      state.od = p.od;
      dom.selNPS.value = p.npsSelect;
      dom.groupCustomOD.style.display = 'none';
      
      state.t_nom = p.t_nom;
      dom.inpWallThk.value = p.t_nom;
      
      state.ca = p.ca;
      dom.inpCorrosion.value = p.ca;
      
      // PIPE LENGTH FROM PRESET
      state.length = p.length;
      dom.inpPipeLength.value = p.length;
      dom.rngPipeLength.value = p.length;
      
      state.tangent1 = p.tangent1;
      dom.inpTangent1.value = p.tangent1;
      
      state.tangent2 = p.tangent2;
      dom.inpTangent2.value = p.tangent2;
      
      state.smys = p.smys;
      dom.selGrade.value = p.smys;
      state.gradeName = dom.selGrade.options[dom.selGrade.selectedIndex].text.split('(')[0].trim();
      
      state.seamType = p.seamType;
      dom.selSeamType.value = p.seamType;
      
      state.seamAngle = p.seamAngle;
      dom.inpSeamAngle.value = p.seamAngle;
      
      state.targetAngle = p.targetAngle;
      dom.inpTargetAngle.value = p.targetAngle;
      dom.rngTargetAngle.value = p.targetAngle;
      
      state.radiusMultiplier = p.radiusMultiplier;
      dom.selRadiusMultiplier.value = String(p.radiusMultiplier);
      syncRadiusOptions(); // keeps the preset value (all presets are compliant)
      state.manualPulls = null;
      if (dom.inpManualPulls) dom.inpManualPulls.value = '';
      if (dom.groupCustomRadius) dom.groupCustomRadius.style.display = 'none';
      if (dom.inpCustomRadius) dom.inpCustomRadius.value = p.radiusMultiplier;
      
      state.designPressure = p.designPressure;
      dom.inpDesignPressure.value = p.designPressure;
      
      state.designFactor = p.designFactor;
      dom.selDesignFactor.value = p.designFactor;
      
      state.designTemp = p.designTemp !== undefined ? p.designTemp : 20.0;
      if (dom.inpDesignTemp) dom.inpDesignTemp.value = state.designTemp;
      
      state.useMandrel = p.useMandrel;
      dom.chkUseMandrel.checked = p.useMandrel;
      
      if (p.bendType) {
        state.bendType = p.bendType;
        if (dom.selBendType) dom.selBendType.value = p.bendType;
      }
      if (p.clockPos) {
        state.clockPos = p.clockPos;
        if (dom.selClockPos) dom.selClockPos.value = p.clockPos;
        if (dom.groupCustomSeamAngle) dom.groupCustomSeamAngle.style.display = 'none';
      }
      
      updateUI();
    }
  });

  // Theme Toggle Button
  if (dom.btnToggleTheme) {
    dom.btnToggleTheme.addEventListener('click', () => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
    });
  }

  // Bend Type Selector
  if (dom.selBendType) {
    dom.selBendType.addEventListener('change', (e) => {
      state.bendType = e.target.value;
      if (state.bendType === 'compound') {
        openCompoundModal();
      }
      updateUI();
    });
  }

  // Seam Clock Position Selector
  if (dom.selClockPos) {
    dom.selClockPos.addEventListener('change', (e) => {
      state.clockPos = e.target.value;
      if (state.clockPos === 'custom') {
        if (dom.groupCustomSeamAngle) dom.groupCustomSeamAngle.style.display = 'block';
      } else {
        if (dom.groupCustomSeamAngle) dom.groupCustomSeamAngle.style.display = 'none';
        if (state.clockPos === '3') state.seamAngle = 0;
        else if (state.clockPos === '9') state.seamAngle = 180;
        else if (state.clockPos === '12') state.seamAngle = 90;
        else if (state.clockPos === '6') state.seamAngle = -90;
        if (dom.inpSeamAngle) dom.inpSeamAngle.value = state.seamAngle;
      }
      updateUI();
    });
  }

  // Traceability Inputs Live Sync
  const traceInputs = [
    { el: dom.inpProjectName, key: 'projectName' },
    { el: dom.inpLineSection, key: 'lineSection' },
    { el: dom.inpChainageKP, key: 'chainageKP' },
    { el: dom.inpPipeNo, key: 'pipeNo' },
    { el: dom.inpHeatNo, key: 'heatNo' },
    { el: dom.inpReportNo, key: 'reportNo' }
  ];
  traceInputs.forEach(({ el, key }) => {
    if (el) {
      el.addEventListener('input', (e) => {
        state[key] = e.target.value;
        updatePrintableCard(runCalculations());
      });
    }
  });

  // Standard change
  dom.selStandard.addEventListener('change', (e) => {
    state.standard = e.target.value;
    syncRadiusOptions();
    updateUI();
  });

  // NPS Diameter change
  dom.selNPS.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      dom.groupCustomOD.style.display = 'block';
      state.od = clampNum(dom.inpCustomOD.value, 50, 2500, 914.4);
      state.npsLabel = 'Özel Çap';
    } else {
      dom.groupCustomOD.style.display = 'none';
      state.od = parseFloat(val);
      state.npsLabel = dom.selNPS.options[dom.selNPS.selectedIndex].text.split('(')[0].trim();
    }
    syncRadiusOptions();
    updateUI();
  });

  dom.inpCustomOD.addEventListener('input', (e) => {
    state.od = clampNum(e.target.value, 50, 2500, 100);
    syncRadiusOptions();
    updateUI();
  });

  // Wall Thickness
  dom.inpWallThk.addEventListener('input', (e) => {
    state.t_nom = clampNum(e.target.value, 3, 60, 10);
    updateUI();
  });

  // Corrosion
  dom.inpCorrosion.addEventListener('input', (e) => {
    state.ca = clampNum(e.target.value, 0, 10, 0);
    updateUI();
  });

  // PIPE LENGTH (CUSTOMIZABLE USER INPUT)
  dom.inpPipeLength.addEventListener('input', (e) => {
    const val = clampNum(e.target.value, 4, 25, 12.0);
    state.length = val;
    dom.rngPipeLength.value = Math.min(Math.max(val, 4.0), 25.0);
    updateUI();
  });

  dom.rngPipeLength.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.length = val;
    dom.inpPipeLength.value = val.toFixed(1);
    scheduleUI();
  });

  // Steel Grade
  dom.selGrade.addEventListener('change', (e) => {
    state.smys = parseFloat(e.target.value);
    state.gradeName = dom.selGrade.options[dom.selGrade.selectedIndex].text.split('(')[0].trim();
    updateUI();
  });

  // Seam Type & Custom Angle
  dom.selSeamType.addEventListener('change', (e) => {
    state.seamType = e.target.value;
    updateUI();
  });

  dom.inpSeamAngle.addEventListener('input', (e) => {
    state.seamAngle = clampNum(e.target.value, -180, 180, 0);
    updateUI();
  });

  // Target Angle Slider & Input
  dom.inpTargetAngle.addEventListener('input', (e) => {
    const val = clampNum(e.target.value, 0.5, 90, 10);
    state.targetAngle = val;
    dom.rngTargetAngle.value = Math.min(val, 45.0);
    updateUI();
  });

  dom.rngTargetAngle.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.targetAngle = val;
    dom.inpTargetAngle.value = val.toFixed(2);
    scheduleUI();
  });

  // Bend Radius Multiplier (incl. custom k = R/D)
  dom.selRadiusMultiplier.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      if (dom.groupCustomRadius) dom.groupCustomRadius.style.display = 'block';
      const customK = dom.inpCustomRadius ? parseLocaleFloat(dom.inpCustomRadius.value, NaN) : NaN;
      state.radiusMultiplier = (Number.isFinite(customK) && customK >= 5 && customK <= 100) ? customK : 40;
    } else {
      if (dom.groupCustomRadius) dom.groupCustomRadius.style.display = 'none';
      state.radiusMultiplier = parseLocaleFloat(e.target.value, 40) || 40;
    }
    updateUI();
  });

  if (dom.inpCustomRadius) {
    dom.inpCustomRadius.addEventListener('input', (e) => {
      const k = parseLocaleFloat(e.target.value, NaN);
      if (Number.isFinite(k) && k >= 5 && k <= 100) {
        state.radiusMultiplier = k;
        updateUI();
      }
    });
  }

  // Manual pull count (empty = automatic 2-60 clamped integer)
  if (dom.inpManualPulls) {
    dom.inpManualPulls.addEventListener('input', (e) => {
      const raw = String(e.target.value).trim().replace(',', '.');
      if (raw === '') {
        state.manualPulls = null;
      } else {
        const n = Number(raw);
        state.manualPulls = Number.isFinite(n) ? Math.min(60, Math.max(2, Math.round(n))) : null;
      }
      updateUI();
    });
  }

  // Tangents
  dom.inpTangent1.addEventListener('input', (e) => {
    state.tangent1 = clampNum(e.target.value, 0.5, 5, 1.5);
    updateUI();
  });

  dom.inpTangent2.addEventListener('input', (e) => {
    state.tangent2 = clampNum(e.target.value, 0.5, 5, 1.5);
    updateUI();
  });

  // Pressure & Class Factor & Temperature
  dom.inpDesignPressure.addEventListener('input', (e) => {
    state.designPressure = clampNum(e.target.value, 1, 250, 50);
    updateUI();
  });

  if (dom.inpDesignTemp) {
    dom.inpDesignTemp.addEventListener('input', (e) => {
      state.designTemp = clampNum(e.target.value, -20, 250, 20.0);
      updateUI();
    });
  }

  dom.selDesignFactor.addEventListener('change', (e) => {
    state.designFactor = parseFloat(e.target.value) || 0.72;
    updateUI();
  });

  // Mandrel Checkbox
  dom.chkUseMandrel.addEventListener('change', (e) => {
    state.useMandrel = e.target.checked;
    updateUI();
  });

  // Girth Weld in Bend Checkbox (ASME B31.8 Md. 841.2.3-a-5)
  if (dom.chkGirthWeld) {
    dom.chkGirthWeld.addEventListener('change', (e) => {
      state.girthWeldInBend = e.target.checked;
      updateUI();
    });
  }

  // Girth Weld Distance Input
  if (dom.inpGirthWeldDist) {
    dom.inpGirthWeldDist.addEventListener('input', (e) => {
      state.girthWeldDist = clampNum(e.target.value, 0.1, 30, 6.0);
      updateUI();
    });
  }

  // Collapsible pulls table (long lists on small screens)
  if (dom.btnTogglePulls) {
    dom.btnTogglePulls.addEventListener('click', () => {
      const collapsed = dom.pullsWrap ? dom.pullsWrap.classList.toggle('is-collapsed') : false;
      dom.btnTogglePulls.textContent = collapsed ? 'Göster' : 'Gizle';
      dom.btnTogglePulls.setAttribute('aria-expanded', String(!collapsed));
    });
  }

  // Step-by-Step Operator Inspector Controls
  if (dom.btnPrevPull) {
    dom.btnPrevPull.addEventListener('click', () => {
      const calc = runCalculations();
      if (selectedPullIndex === null) {
        selectPull(calc.numPulls);
      } else if (selectedPullIndex > 1) {
        selectPull(selectedPullIndex - 1);
      }
    });
  }
  if (dom.btnNextPull) {
    dom.btnNextPull.addEventListener('click', () => {
      const calc = runCalculations();
      if (selectedPullIndex === null) {
        selectPull(1);
      } else if (selectedPullIndex < calc.numPulls) {
        selectPull(selectedPullIndex + 1);
      }
    });
  }
  if (dom.badgeActivePull) {
    dom.badgeActivePull.addEventListener('click', () => {
      selectPull(null);
    });
  }

  // Pulls Table Excel CSV & JSON Export
  if (dom.btnExportCSV) {
    dom.btnExportCSV.addEventListener('click', () => {
      const calc = runCalculations();
      exportPullsToCSV(calc);
    });
  }
  if (dom.btnExportJSON) {
    dom.btnExportJSON.addEventListener('click', () => {
      const calc = runCalculations();
      exportPullsToJSON(calc);
    });
  }
  if (dom.btnImportJSON && dom.fileImportJSON) {
    dom.btnImportJSON.addEventListener('click', () => {
      dom.fileImportJSON.value = '';
      dom.fileImportJSON.click();
    });
    dom.fileImportJSON.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        importProjectFromJSON(file);
      }
    });
  }
  if (dom.btnExportDXF) {
    dom.btnExportDXF.addEventListener('click', () => {
      const calc = runCalculations();
      export2DToDXF(calc);
    });
  }
  if (dom.btnExportSVG) {
    dom.btnExportSVG.addEventListener('click', () => {
      export2DToSVG();
    });
  }

  // Tab Switching (2D vs As-Built vs 3D)
  dom.tab2D.addEventListener('click', () => {
    dom.tab2D.classList.add('active');
    dom.tabAsBuilt.classList.remove('active');
    dom.tab3D.classList.remove('active');
    dom.tab2D.setAttribute('aria-selected', 'true');
    dom.tabAsBuilt.setAttribute('aria-selected', 'false');
    dom.tab3D.setAttribute('aria-selected', 'false');
    dom.view2D.classList.add('active');
    dom.viewAsBuilt.classList.remove('active');
    dom.view3D.classList.remove('active');
    if (dom.visInfoLabel) dom.visInfoLabel.textContent = 'Şematik Vektör Analizi • Canlı Güncelleme';
    if (dom.toolbarActions2D) dom.toolbarActions2D.style.display = 'flex';
    if (dom.btnResetView) dom.btnResetView.style.display = '';
    stopBendAnimation(false);
    render2DSketch(runCalculations());
  });

  dom.tabAsBuilt.addEventListener('click', () => {
    dom.tabAsBuilt.classList.add('active');
    dom.tab2D.classList.remove('active');
    dom.tab3D.classList.remove('active');
    dom.tabAsBuilt.setAttribute('aria-selected', 'true');
    dom.tab2D.setAttribute('aria-selected', 'false');
    dom.tab3D.setAttribute('aria-selected', 'false');
    dom.viewAsBuilt.classList.add('active');
    dom.view2D.classList.remove('active');
    dom.view3D.classList.remove('active');
    if (dom.visInfoLabel) dom.visInfoLabel.textContent = '📋 Şantiye As-Built Ölçüm & QC Kabul Paneli';
    if (dom.toolbarActions2D) dom.toolbarActions2D.style.display = 'none';
    if (dom.btnResetView) dom.btnResetView.style.display = 'none';
    stopBendAnimation(false);
    updateAsBuiltUI(runCalculations());
  });

  dom.tab3D.addEventListener('click', () => {
    dom.tab3D.classList.add('active');
    dom.tab2D.classList.remove('active');
    dom.tabAsBuilt.classList.remove('active');
    dom.tab3D.setAttribute('aria-selected', 'true');
    dom.tab2D.setAttribute('aria-selected', 'false');
    dom.tabAsBuilt.setAttribute('aria-selected', 'false');
    dom.view3D.classList.add('active');
    dom.view2D.classList.remove('active');
    dom.viewAsBuilt.classList.remove('active');
    init3DScene();
    update3DPipe(runCalculations());
    if (dom.visInfoLabel) dom.visInfoLabel.textContent = '3D WebGL Modeli • Canlı Güncelleme (F: Tam Ekran • R: 360° Döndür • P: Resim Kaydet)';
    if (dom.toolbarActions2D) dom.toolbarActions2D.style.display = 'none';
    if (dom.btnResetView) dom.btnResetView.style.display = '';
    if (controls3D && pipeCenter3D) {
      controls3D.target.set(pipeCenter3D.x, pipeCenter3D.y, pipeCenter3D.z);
      controls3D.update();
    }
    frameCameraToPipe();
  });

  // As-Built Site QC Action Buttons
  if (dom.btnSyncAsBuiltCalc) {
    dom.btnSyncAsBuiltCalc.addEventListener('click', () => {
      const calc = runCalculations();
      state.asBuilt.measuredAngle = Number(state.targetAngle.toFixed(2));
      state.asBuilt.measuredWT = Number(calc.t_extrados.toFixed(2));
      state.asBuilt.measuredOvality = Number(calc.estimatedOvality.toFixed(2));
      state.asBuilt.measuredRipple = Number(calc.estimatedRippleMm.toFixed(1));
      if (!state.asBuilt.spoolNo || state.asBuilt.spoolNo === 'SP-01 / B-104') {
        state.asBuilt.spoolNo = state.pipeNo ? `${state.pipeNo} / Spool-01` : 'SP-01 / B-104';
      }
      if (dom.inpAsBuiltAngle) dom.inpAsBuiltAngle.value = state.asBuilt.measuredAngle;
      if (dom.inpAsBuiltWT) dom.inpAsBuiltWT.value = state.asBuilt.measuredWT;
      if (dom.inpAsBuiltOvality) dom.inpAsBuiltOvality.value = state.asBuilt.measuredOvality;
      if (dom.inpAsBuiltRipple) dom.inpAsBuiltRipple.value = state.asBuilt.measuredRipple;
      if (dom.inpAsBuiltSpool) dom.inpAsBuiltSpool.value = state.asBuilt.spoolNo;
      updateAsBuiltUI(calc);
      updatePrintableCard(calc);
      scheduleSave();
    });
  }

  if (dom.btnClearAsBuilt) {
    dom.btnClearAsBuilt.addEventListener('click', () => {
      state.asBuilt.measuredAngle = null;
      state.asBuilt.measuredWT = null;
      state.asBuilt.measuredOvality = null;
      state.asBuilt.measuredRipple = 0.0;
      if (dom.inpAsBuiltAngle) dom.inpAsBuiltAngle.value = '';
      if (dom.inpAsBuiltWT) dom.inpAsBuiltWT.value = '';
      if (dom.inpAsBuiltOvality) dom.inpAsBuiltOvality.value = '';
      if (dom.inpAsBuiltRipple) dom.inpAsBuiltRipple.value = '0.0';
      const calc = runCalculations();
      updateAsBuiltUI(calc);
      updatePrintableCard(calc);
      scheduleSave();
    });
  }

  const asBuiltInputs = [
    { el: dom.inpAsBuiltAngle, key: 'measuredAngle', isNum: true },
    { el: dom.inpAsBuiltWT, key: 'measuredWT', isNum: true },
    { el: dom.inpAsBuiltOvality, key: 'measuredOvality', isNum: true },
    { el: dom.inpAsBuiltRipple, key: 'measuredRipple', isNum: true },
    { el: dom.inpAsBuiltSpool, key: 'spoolNo', isNum: false },
    { el: dom.inpAsBuiltInspector, key: 'inspector', isNum: false },
    { el: dom.inpAsBuiltDate, key: 'date', isNum: false }
  ];

  asBuiltInputs.forEach(({ el, key, isNum }) => {
    if (!el) return;
    const handleInput = () => {
      const val = el.value.trim();
      if (isNum) {
        state.asBuilt[key] = parseLocaleFloat(val, null);
      } else {
        state.asBuilt[key] = val;
      }
      const calc = runCalculations();
      updateAsBuiltUI(calc);
      updatePrintableCard(calc);
      scheduleSave();
    };
    el.addEventListener('input', handleInput);
    el.addEventListener('change', handleInput);
  });

  // View reset & toggle labels
  dom.btnResetView.addEventListener('click', () => {
    if (dom.view3D.classList.contains('active') && controls3D) {
      frameCameraToPipe();
    } else {
      reset2DView();
    }
  });

  dom.btnToggleLabels.addEventListener('click', () => {
    state.showDimensions = !state.showDimensions;
    dom.btnToggleLabels.textContent = state.showDimensions ? 'Ölçüleri Gizle' : 'Ölçüleri Göster';
    dom.btnToggleLabels.setAttribute('aria-pressed', String(state.showDimensions));
    render2DSketch(runCalculations());
  });

  // 3D Control Buttons
  if (dom.btnCamIso) {
    dom.btnCamIso.addEventListener('click', () => set3DCameraPreset('iso'));
  }
  if (dom.btnCamTop) {
    dom.btnCamTop.addEventListener('click', () => set3DCameraPreset('top'));
  }
  if (dom.btnCamSide) {
    dom.btnCamSide.addEventListener('click', () => set3DCameraPreset('side'));
  }
  if (dom.btnCamFront) {
    dom.btnCamFront.addEventListener('click', () => set3DCameraPreset('front'));
  }

  dom.btn3dResetCam.addEventListener('click', () => {
    if (camera3D && controls3D) {
      set3DCameraPreset('iso');
    }
  });

  if (dom.btn3dFullscreen) {
    dom.btn3dFullscreen.addEventListener('click', toggle3DFullscreen);
  }

  if (dom.btn3dSnapshot) {
    dom.btn3dSnapshot.addEventListener('click', export3DSnapshot);
  }

  if (dom.btn3dAutoRotate) {
    dom.btn3dAutoRotate.addEventListener('click', toggle3DAutoRotate);
  }

  if (dom.container3D) {
    dom.container3D.addEventListener('dblclick', (e) => {
      if (e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('.controls-3d-overlay') || e.target.closest('.legend-3d-overlay'))) {
        return;
      }
      toggle3DFullscreen();
    });
  }

  dom.btn3dToggleMandrel.addEventListener('click', () => {
    state.mandrelVisible3D = !state.mandrelVisible3D;
    stopBendAnimation(false); // visibility edits end the animation session
    dom.btn3dToggleMandrel.textContent = `Mandrel: ${state.mandrelVisible3D ? 'Açık' : 'Kapalı'}`;
    dom.btn3dToggleMandrel.setAttribute('aria-pressed', String(state.mandrelVisible3D));
    update3DPipe(runCalculations());
  });

  dom.btn3dToggleSeam.addEventListener('click', () => {
    state.seamVisible3D = !state.seamVisible3D;
    stopBendAnimation(false); // visibility edits end the animation session
    update3DPipe(runCalculations());
  });

  // Bend animation controls
  if (dom.btn3dPlay) {
    dom.btn3dPlay.addEventListener('click', () => {
      if (bendAnim.playing) {
        bendAnim.playing = false;
        if (bendAnim.timer) {
          clearTimeout(bendAnim.timer);
          bendAnim.timer = null;
        }
        setRamPressed(false);
        syncAnimUI();
      } else {
        startBendAnimation();
      }
    });
  }

  if (dom.btn3dStepPrev) {
    dom.btn3dStepPrev.addEventListener('click', () => {
      if (!dom.view3D.classList.contains('active') || typeof THREE === 'undefined') return;
      bendAnim.playing = false;
      if (bendAnim.timer) {
        clearTimeout(bendAnim.timer);
        bendAnim.timer = null;
      }
      const calc = runCalculations();
      bendAnim.total = calc.numPulls;
      ensureMachine();
      if (!state.isTreeBendMode && !machineGroup3D) return;
      if (state.isTreeBendMode && !treeBendGroup3D) return;
      bendAnim.active = true;
      const targetStep = Math.max(0, (bendAnim.step || 0) - 1);
      renderAnimStep(targetStep);
      if (!state.isTreeBendMode) setRamPressed(false);
      syncAnimUI();
    });
  }

  if (dom.btn3dStep) {
    dom.btn3dStep.addEventListener('click', () => {
      if (!dom.view3D.classList.contains('active') || typeof THREE === 'undefined') return;
      bendAnim.playing = false;
      if (bendAnim.timer) {
        clearTimeout(bendAnim.timer);
        bendAnim.timer = null;
      }
      const calc = runCalculations();
      bendAnim.total = calc.numPulls;
      ensureMachine();
      if (!state.isTreeBendMode && !machineGroup3D) return;
      if (state.isTreeBendMode && !treeBendGroup3D) return;
      bendAnim.active = true;
      const targetStep = Math.min(calc.numPulls, (bendAnim.step || 0) + 1);
      renderAnimStep(targetStep);
      if (!state.isTreeBendMode) setRamPressed(false);
      syncAnimUI();
    });
  }

  if (dom.slider3dStep) {
    const handleSliderInput = (e) => {
      if (!dom.view3D.classList.contains('active') || typeof THREE === 'undefined') return;
      bendAnim.playing = false;
      if (bendAnim.timer) {
        clearTimeout(bendAnim.timer);
        bendAnim.timer = null;
      }
      const calc = runCalculations();
      bendAnim.total = calc.numPulls;
      ensureMachine();
      if (!state.isTreeBendMode && !machineGroup3D) return;
      if (state.isTreeBendMode && !treeBendGroup3D) return;
      bendAnim.active = true;
      const stepVal = parseInt(e.target.value, 10) || 0;
      renderAnimStep(stepVal);
      if (!state.isTreeBendMode) setRamPressed(false);
      syncAnimUI();
    };
    dom.slider3dStep.addEventListener('input', handleSliderInput);
    dom.slider3dStep.addEventListener('change', handleSliderInput);
  }

  // Easter Egg: Exit Tree Bend Mode Button
  if (dom.btnExitTreeMode) {
    dom.btnExitTreeMode.addEventListener('click', () => {
      exitTreeBendMode();
    });
  }

  // Easter Egg Secret Code Key Listener (typing 'agac' or 'tree' in 3D tab)
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
      return;
    }
    if (e.key === 'Escape') {
      const activeTrigger = document.querySelector('.info-trigger.active');
      if (activeTrigger) activeTrigger.classList.remove('active');
      if (state.isTreeBendMode) {
        exitTreeBendMode();
      }
      return;
    }
    if (!dom.view3D || !dom.view3D.classList.contains('active')) return;
    secretKeyBuffer = (secretKeyBuffer + e.key.toLowerCase()).slice(-10);
    if (secretKeyBuffer.endsWith('agac') || secretKeyBuffer.endsWith('tree')) {
      secretKeyBuffer = '';
      enterTreeBendMode();
    }
  });

  // Calculation Info Popovers (Click / Touch toggle, inside-popover protect & Outside/ESC dismissal)
  document.addEventListener('click', (e) => {
    // If click or selection is inside an open popover card, keep it open (allow text selection / copying)
    if (e.target.closest && e.target.closest('.info-popover')) {
      return;
    }
    const trigger = e.target.closest ? e.target.closest('.info-trigger') : null;
    const allActive = document.querySelectorAll('.info-trigger.active');
    allActive.forEach((t) => {
      if (t !== trigger) t.classList.remove('active');
    });
    if (trigger) {
      trigger.classList.toggle('active');
    }
  });

  // Keyboard accessibility for info triggers (Enter or Space to toggle)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const trigger = e.target && e.target.closest ? e.target.closest('.info-trigger') : null;
      if (trigger && (!e.target.closest || !e.target.closest('.info-popover'))) {
        e.preventDefault();
        const wasActive = trigger.classList.contains('active');
        document.querySelectorAll('.info-trigger.active').forEach((t) => t.classList.remove('active'));
        if (!wasActive) trigger.classList.add('active');
      }
    }
  });

  // Reset to Defaults
  dom.btnResetDefaults.addEventListener('click', () => {
    const ok = window.confirm('Tüm girişler varsayılan preset değerlerine dönecek. Devam edilsin mi?');
    if (!ok) return;
    dom.selPreset.value = 'botas_36';
    dom.selPreset.dispatchEvent(new Event('change'));
  });

  // Print / PDF Button (guarded by global verdict)
  dom.btnPrintCard.addEventListener('click', () => {
    const calc = runCalculations();
    updatePrintableCard(calc);
    if (!calc.overallPass) {
      const failed = calc.failedChecks.map(c => c.label).join(', ');
      const ok = window.confirm(
        `GENEL HÜKÜM: RET — Bu büküm imalata uygun değil.\n\nKalan kontroller: ${failed}\n\nYine de QC kartını yazdırmak istiyor musunuz? (Kayıt/ret föyü olarak)`
      );
      if (!ok) return;
    }
    window.print();
  });

  // Manual edits invalidate the named preset display (preset loads and
  // restores set controls programmatically, which fires no events)
  const markCustomPreset = (e) => {
    if (e.target && e.target.id !== 'selPreset' && dom.selPreset) dom.selPreset.value = 'custom';
  };
  const sidebarEl = document.querySelector('.sidebar-panel');
  if (sidebarEl) {
    sidebarEl.addEventListener('input', markCustomPreset);
    sidebarEl.addEventListener('change', markCustomPreset);
  }

  // Topographic Slope / Elevation Calculator Modal wiring
  if (dom.btnOpenSlopeCalc) {
    dom.btnOpenSlopeCalc.addEventListener('click', openSlopeModal);
  }
  if (dom.btnCloseSlopeModal) {
    dom.btnCloseSlopeModal.addEventListener('click', closeSlopeModal);
  }
  if (dom.btnCloseSlopeModalX) {
    dom.btnCloseSlopeModalX.addEventListener('click', closeSlopeModal);
  }
  if (dom.slopeModal) {
    dom.slopeModal.addEventListener('click', (e) => {
      if (e.target === dom.slopeModal) closeSlopeModal();
    });
  }
  if (dom.tabSlopePercent) {
    dom.tabSlopePercent.addEventListener('click', () => {
      slopeCalcState.mode = 'percent';
      dom.tabSlopePercent.classList.add('active');
      dom.tabSlopeElevation.classList.remove('active');
      dom.tabSlopePercent.setAttribute('aria-selected', 'true');
      dom.tabSlopeElevation.setAttribute('aria-selected', 'false');
      if (dom.panelSlopePercent) dom.panelSlopePercent.style.display = 'block';
      if (dom.panelSlopeElevation) dom.panelSlopeElevation.style.display = 'none';
      calculateSlopeDeflection();
    });
  }
  if (dom.tabSlopeElevation) {
    dom.tabSlopeElevation.addEventListener('click', () => {
      slopeCalcState.mode = 'elevation';
      dom.tabSlopeElevation.classList.add('active');
      dom.tabSlopePercent.classList.remove('active');
      dom.tabSlopeElevation.setAttribute('aria-selected', 'true');
      dom.tabSlopePercent.setAttribute('aria-selected', 'false');
      if (dom.panelSlopeElevation) dom.panelSlopeElevation.style.display = 'block';
      if (dom.panelSlopePercent) dom.panelSlopePercent.style.display = 'none';
      calculateSlopeDeflection();
    });
  }
  [dom.inpSlope1, dom.inpSlope2, dom.selSlopeUnit, dom.inpElevKp1, dom.inpElevZ1, dom.inpElevKp2, dom.inpElevZ2, dom.inpElevKp3, dom.inpElevZ3].forEach((inputEl) => {
    if (inputEl) {
      inputEl.addEventListener('input', calculateSlopeDeflection);
      inputEl.addEventListener('change', calculateSlopeDeflection);
    }
  });
  if (dom.btnApplyCalculatedSlope) {
    dom.btnApplyCalculatedSlope.addEventListener('click', applyCalculatedSlope);
  }

  // 3D Compound Bend Calculator Modal wiring
  if (dom.btnOpenCompoundCalc) {
    dom.btnOpenCompoundCalc.addEventListener('click', openCompoundModal);
  }
  if (dom.btnCloseCompoundModal) {
    dom.btnCloseCompoundModal.addEventListener('click', closeCompoundModal);
  }
  if (dom.btnCloseCompoundModalX) {
    dom.btnCloseCompoundModalX.addEventListener('click', closeCompoundModal);
  }
  if (dom.compoundModal) {
    dom.compoundModal.addEventListener('click', (e) => {
      if (e.target === dom.compoundModal) closeCompoundModal();
    });
  }
  [dom.inpHoriAngle, dom.selHoriDir, dom.inpVertAngle, dom.selVertDir].forEach((inputEl) => {
    if (inputEl) {
      inputEl.addEventListener('input', calculateCompoundBend);
      inputEl.addEventListener('change', calculateCompoundBend);
    }
  });
  if (dom.btnApplyCompoundBend) {
    dom.btnApplyCompoundBend.addEventListener('click', applyCompoundBend);
  }

  // Forward wheel events on app header to content panel for smooth top scrolling
  const appHeader = document.querySelector('.app-header');
  const contentPanel = document.querySelector('.content-panel');
  if (appHeader && contentPanel) {
    appHeader.addEventListener('wheel', (e) => {
      contentPanel.scrollTop += e.deltaY;
    }, { passive: true });
  }

  // Update Manager wiring
  if (dom.btnCheckUpdates) {
    dom.btnCheckUpdates.addEventListener('click', () => checkForUpdates(true));
  }
  if (dom.btnSidebarCheckUpdates) {
    dom.btnSidebarCheckUpdates.addEventListener('click', () => checkForUpdates(true));
  }
  if (dom.btnModalRecheck) {
    dom.btnModalRecheck.addEventListener('click', () => checkForUpdates(true));
  }
  if (dom.btnCloseUpdateModal) {
    dom.btnCloseUpdateModal.addEventListener('click', closeUpdateModal);
  }
  if (dom.updateModal) {
    dom.updateModal.addEventListener('click', (e) => {
      if (e.target === dom.updateModal) closeUpdateModal();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (dom.updateModal && !dom.updateModal.hidden) closeUpdateModal();
      if (dom.slopeModal && !dom.slopeModal.hidden) closeSlopeModal();
      if (dom.compoundModal && !dom.compoundModal.hidden) closeCompoundModal();
      if (selectedPullIndex !== null) selectPull(null);
      return;
    }
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;

    const in3D = dom.view3D && dom.view3D.classList.contains('active');

    if (in3D) {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (dom.btn3dPlay) dom.btn3dPlay.click();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (dom.btn3dStep) dom.btn3dStep.click();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (dom.btn3dStepPrev) dom.btn3dStepPrev.click();
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        renderAnimStep(0);
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        const calc = runCalculations();
        renderAnimStep(calc.numPulls);
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggle3DFullscreen();
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        export3DSnapshot();
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        toggle3DAutoRotate();
        return;
      }
      if (e.key === '1') {
        e.preventDefault();
        set3DCameraPreset('iso');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        set3DCameraPreset('top');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        set3DCameraPreset('side');
        return;
      }
      if (e.key === '4') {
        e.preventDefault();
        set3DCameraPreset('front');
        return;
      }
    } else {
      if (e.key === 'ArrowRight') {
        const calc = runCalculations();
        if (calc.numPulls > 0) {
          e.preventDefault();
          if (selectedPullIndex === null) {
            selectPull(1);
          } else if (selectedPullIndex < calc.numPulls) {
            selectPull(selectedPullIndex + 1);
          }
        }
      } else if (e.key === 'ArrowLeft') {
        const calc = runCalculations();
        if (calc.numPulls > 0) {
          e.preventDefault();
          if (selectedPullIndex === null) {
            selectPull(calc.numPulls);
          } else if (selectedPullIndex > 1) {
            selectPull(selectedPullIndex - 1);
          }
        }
      }
    }
  });

  // Initialize 2D CAD Zoom & Pan Controller
  setup2DZoomPan();
}

/* ==========================================================================
   Update Manager: GitHub Releases check + guided download.
   Read-only w.r.t. the calculation engine; offline failures stay silent
   for auto-checks and show an explanatory modal for manual checks.
   ========================================================================== */
const updateMgr = { checking: false, latest: null };

function syncVersionBadge() {
  const el = document.querySelector('.version-tag');
  if (el) el.textContent = `v${APP_VERSION} - ASME Compliant`;
}

function parseSemver(tag) {
  const m = String(tag || '').trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function isNewerTag(latestTag, currentTag) {
  const l = parseSemver(latestTag);
  const c = parseSemver(currentTag);
  if (!l || !c) return false;
  for (let i = 0; i < 3; i++) {
    if (l[i] !== c[i]) return l[i] > c[i];
  }
  return false;
}

function readUpdateCache() {
  try {
    const raw = localStorage.getItem(UPDATE_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.ts !== 'number' || !data.release) return null;
    return data;
  } catch (err) {
    return null;
  }
}

function writeUpdateCache(release) {
  try {
    localStorage.setItem(UPDATE_CACHE_KEY, JSON.stringify({ ts: Date.now(), release }));
  } catch (err) { /* private mode etc. — cache is best-effort */ }
}

function setUpdatePill(mode, text) {
  if (!dom.updatePill) return;
  dom.updatePill.textContent = text;
  dom.updatePill.dataset.state = mode; // idle | checking | current | update | error
  if (dom.btnCheckUpdates) dom.btnCheckUpdates.dataset.updateState = mode;
}

function openUpdateModal() {
  if (dom.updateModal) dom.updateModal.hidden = false;
}

function closeUpdateModal() {
  if (dom.updateModal) dom.updateModal.hidden = true;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatReleaseNotes(body) {
  if (!body) return '';
  const lines = String(body).split('\n');
  let html = '';
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('### ')) {
      html += `<h4 class="notes-h4">${escapeHtml(line.slice(4))}</h4>`;
    } else if (line.startsWith('## ')) {
      html += `<h3 class="notes-h3">${escapeHtml(line.slice(3))}</h3>`;
    } else if (line.startsWith('# ')) {
      html += `<h2 class="notes-h2">${escapeHtml(line.slice(2))}</h2>`;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      html += `<div class="notes-bullet">• ${escapeHtml(line.slice(2))}</div>`;
    } else {
      html += `<p class="notes-p">${escapeHtml(line)}</p>`;
    }
  }
  return html;
}

function pickUpdateAssets(release) {
  const assets = (release && release.assets) || [];
  const find = (re) => assets.find((a) => re.test(a.name || ''));
  const plat = String((typeof navigator !== 'undefined' && navigator.platform) || '').toLowerCase();
  const ua = String((typeof navigator !== 'undefined' && navigator.userAgent) || '').toLowerCase();
  const isMac = plat.includes('mac');
  const isWin = plat.includes('win');
  const isArm = ua.includes('arm') || ua.includes('apple') || plat.includes('arm');

  const picked = [];
  const formatBytes = (bytes) => {
    if (!bytes || isNaN(bytes)) return '';
    return ' (' + (bytes / (1024 * 1024)).toFixed(1) + ' MB)';
  };

  const push = (asset, label, icon, recommended) => {
    if (asset && asset.browser_download_url) {
      picked.push({
        label: label + formatBytes(asset.size) + (recommended ? ' ★ Önerilen' : ''),
        url: asset.browser_download_url,
        icon: icon,
        recommended: recommended
      });
    }
  };

  // macOS
  const macArm = find(/arm64\.dmg$/i);
  const macX64 = find(/x64\.dmg$/i);
  if (macArm) push(macArm, 'macOS Apple Silicon (.dmg)', '🍏', isMac && isArm);
  if (macX64) push(macX64, 'macOS Intel (.dmg)', '🍎', isMac && !isArm);
  if (!macArm && !macX64) push(find(/\.dmg$/i), 'macOS Kurulumu (.dmg)', '🍎', isMac);

  // Windows
  const winPortable = find(/portable.*\.exe$/i);
  const winSetup = find(/setup.*\.exe$/i);
  if (winPortable) push(winPortable, 'Windows Taşınabilir (.exe)', '💼', isWin);
  if (winSetup) push(winSetup, 'Windows Kurulum Sihirbazı (.exe)', '🪟', false);

  // Web Offline Package
  const webZip = find(/web.*\.zip$/i);
  if (webZip) push(webZip, 'Çevrimdışı Web Paketi (.zip)', '🌐', !isMac && !isWin);

  return picked;
}

function renderUpdateModal(release, opts) {
  const options = opts || {};
  if (!dom.updateModal) return;
  if (dom.updateAssets) dom.updateAssets.textContent = '';
  if (dom.updateNotes) dom.updateNotes.textContent = '';

  if (dom.updateInstalledVer) {
    dom.updateInstalledVer.textContent = 'v' + APP_VERSION;
  }

  if (options.error || !release) {
    if (dom.updateLatestVer) dom.updateLatestVer.textContent = 'Bağlantı Yok';
    if (dom.updateBadgeStatus) {
      dom.updateBadgeStatus.textContent = 'Çevrimdışı';
      dom.updateBadgeStatus.className = 'badge warning';
    }
    if (dom.updateStatus) {
      dom.updateStatus.textContent =
        'GitHub sunucusuna erişilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin ' +
        '(Saha kullanımında çevrimdışı modda hesaplamalar eksiksiz çalışır).';
    }
    openUpdateModal();
    return;
  }

  const latestTag = release.tag_name || ('v' + APP_VERSION);
  if (dom.updateLatestVer) dom.updateLatestVer.textContent = latestTag;

  const newer = isNewerTag(release.tag_name, APP_VERSION);
  if (dom.updateBadgeStatus) {
    if (newer) {
      dom.updateBadgeStatus.textContent = 'Yeni Sürüm Mevcut';
      dom.updateBadgeStatus.className = 'badge warning';
    } else {
      dom.updateBadgeStatus.textContent = 'Güncel';
      dom.updateBadgeStatus.className = 'badge success';
    }
  }

  if (dom.updateStatus) {
    const pubDate = release.published_at ? new Date(release.published_at).toLocaleDateString('tr-TR') : '';
    dom.updateStatus.textContent = newer
      ? `Yeni bir ColdBend Pro sürümü yayınlandı: ${release.tag_name} ${pubDate ? '(' + pubDate + ')' : ''}. Güncellemeniz önerilir.`
      : `Programınız en güncel sürümdedir (v${APP_VERSION}). Tüm hesaplama ve ASME standart modülleri günceldir.`;
  }

  // Render formatted changelog notes
  if (dom.updateNotes) {
    if (release.body) {
      dom.updateNotes.innerHTML = formatReleaseNotes(release.body);
    } else {
      dom.updateNotes.textContent = 'Bu sürüm için detaylı sürüm notu girilmedi.';
    }
  }

  // Render platform download buttons
  if (dom.updateAssets) {
    const picked = pickUpdateAssets(release);
    picked.forEach((p) => {
      const a = document.createElement('a');
      a.href = p.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'update-asset-btn ' + (p.recommended && newer ? 'recommended' : '');
      a.innerHTML = `<span class="asset-icon">${p.icon}</span><span class="asset-text">${p.label}</span>`;
      dom.updateAssets.appendChild(a);
    });

    const ghLink = document.createElement('a');
    ghLink.href = release.html_url || UPDATE_API_URL;
    ghLink.target = '_blank';
    ghLink.rel = 'noopener';
    ghLink.className = 'update-asset-btn github';
    ghLink.innerHTML = `<span class="asset-icon">📦</span><span class="asset-text">GitHub Release Sayfası</span>`;
    dom.updateAssets.appendChild(ghLink);
  }

  openUpdateModal();
}

function paintFromRelease(release, showModal) {
  const newer = isNewerTag(release.tag_name, APP_VERSION);
  setUpdatePill(newer ? 'update' : 'current',
    newer ? `Yeni sürüm: ${release.tag_name}` : `v${APP_VERSION} • Güncel`);
  if (showModal) renderUpdateModal(release, {});
}

async function checkForUpdates(manual) {
  if (updateMgr.checking) return;
  if (!manual) {
    const cached = readUpdateCache();
    if (cached && (Date.now() - cached.ts) < UPDATE_CACHE_TTL_MS && cached.release) {
      updateMgr.latest = cached.release;
      paintFromRelease(cached.release, false);
      return;
    }
  }
  if (typeof fetch === 'undefined') {
    if (manual) renderUpdateModal(null, { error: true });
    return;
  }
  updateMgr.checking = true;
  if (manual) setUpdatePill('checking', 'Denetleniyor…');
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(UPDATE_API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const release = await res.json();
    if (!release || !release.tag_name) throw new Error('bad payload');
    writeUpdateCache(release);
    updateMgr.latest = release;
    paintFromRelease(release, manual);
  } catch (err) {
    if (manual) {
      setUpdatePill('error', 'Denetim başarısız');
      renderUpdateModal(null, { error: true });
    } else {
      setUpdatePill('idle', 'v' + APP_VERSION);
    }
  } finally {
    updateMgr.checking = false;
  }
}

// Initial Boot
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  restoreState();
  applyTheme(state.theme);
  syncRadiusOptions();
  updateUI();
  syncVersionBadge();
  setUpdatePill('idle', 'v' + APP_VERSION);
  checkForUpdates(false); // silent daily auto-check; never blocks boot
});

// Ctrl+P bypasses the print button: refresh the QC card with live values.
window.addEventListener('beforeprint', () => {
  try { updatePrintableCard(runCalculations()); } catch (err) { /* print anyway */ }
});

// Flush pending inputs on tab close (debounced saver might not have run)
window.addEventListener('pagehide', () => {
  try { saveState(); } catch (err) { /* ignore */ }
});
