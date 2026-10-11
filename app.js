/**
 * ColdBend Pro - Pipeline Cold Field Bend Engineering Engine
 * Compliant with ASME B31.8 (Sec. 841.2.3), ASME B31.4 (Sec. 406.2.1) & BOTAŞ Standards
 */

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
  radiusMultiplier: 40,  // Bend radius multiplier (R = k * D)
  designPressure: 75.0,  // Bar
  designFactor: 0.72,    // Class 1 / ASME
  useMandrel: true,      // Internal hydraulic mandrel active
  girthWeldInBend: false,// Circumferential weld in bend section (Md. 841.2.3-a-5)
  showDimensions: true,  // Toggle dimension labels in 2D
  mandrelVisible3D: true,
  seamVisible3D: true,
  
  // Theme & New Features
  theme: localStorage.getItem('coldbend_theme') || 'dark',
  bendType: 'overbend',  // overbend, sagbend, sidebend_right, sidebend_left, compound
  clockPos: '3',         // 3, 9, 12, 6, custom
  
  // Traceability Fields
  projectName: 'BOTAŞ Doğal Gaz İletim Hattı - Faz 2',
  lineSection: 'Lot 3 (Büküm Sahası)',
  chainageKP: 'KP 154+280',
  pipeNo: 'P-1284',
  heatNo: 'H-9832A',
  reportNo: 'CFB-2026-0042'
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
  inpTargetAngle: document.getElementById('inpTargetAngle'),
  rngTargetAngle: document.getElementById('rngTargetAngle'),
  badgeMaxAngleInfo: document.getElementById('badgeMaxAngleInfo'),
  selRadiusMultiplier: document.getElementById('selRadiusMultiplier'),
  inpCalculatedRadius: document.getElementById('inpCalculatedRadius'),
  groupCustomRadius: document.getElementById('groupCustomRadius'),
  inpCustomRadius: document.getElementById('inpCustomRadius'),
  inpTangent1: document.getElementById('inpTangent1'),
  inpTangent2: document.getElementById('inpTangent2'),
  inpDesignPressure: document.getElementById('inpDesignPressure'),
  selDesignFactor: document.getElementById('selDesignFactor'),
  chkUseMandrel: document.getElementById('chkUseMandrel'),
  chkGirthWeld: document.getElementById('chkGirthWeld'),

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
  
  // Pulls Table
  tbodyPulls: document.getElementById('tbodyPulls'),
  pullSummaryPill: document.getElementById('pullSummaryPill'),
  
  // Tabs & Views
  tab2D: document.getElementById('tab2D'),
  tab3D: document.getElementById('tab3D'),
  visInfoLabel: document.getElementById('visInfoLabel'),
  view2D: document.getElementById('view2D'),
  view3D: document.getElementById('view3D'),
  svgDynamicGroup: document.getElementById('svgDynamicGroup'),
  btnResetDefaults: document.getElementById('btnResetDefaults'),
  btnPrintCard: document.getElementById('btnPrintCard'),
  btnResetView: document.getElementById('btnResetView'),
  btnToggleLabels: document.getElementById('btnToggleLabels'),
  
  // 3D Controls
  container3D: document.getElementById('container3D'),
  loading3D: document.getElementById('loading3D'),
  btn3dResetCam: document.getElementById('btn3dResetCam'),
  btn3dToggleMandrel: document.getElementById('btn3dToggleMandrel'),
  btn3dToggleSeam: document.getElementById('btn3dToggleSeam'),

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
  prtPullsBody: document.getElementById('prtPullsBody'),

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

function calculateMinimumBendRadiusMultiplier(standard, odMm) {
  // odMm in mm
  const npsInches = odMm / 25.4;
  
  if (standard === 'ASME_B31_8') {
    // ASME B31.8 Table 841.2.3-1
    if (npsInches < 12) return 18;
    if (npsInches <= 14) return 21;
    if (npsInches <= 16) return 24;
    if (npsInches <= 18) return 27;
    return 30; // NPS 20 and larger
  } else if (standard === 'ASME_B31_4') {
    // ASME B31.4 Section 406.2.1
    if (npsInches <= 12) return 18;
    if (npsInches <= 14) return 21;
    if (npsInches <= 16) return 24;
    if (npsInches <= 18) return 27;
    return 30;
  } else if (standard === 'BOTAS_SPEC') {
    // BOTAŞ / TANAP strict specification
    if (npsInches <= 12) return 18;
    if (npsInches <= 16) return 24;
    if (npsInches <= 24) return 30;
    return 40; // NPS > 24" (e.g., 28", 30", 36", 48", 56")
  }
  return 30;
}

/**
 * ASME B31.8 / BOTAŞ Seam Clock Position & Neutral Axis Safety Validator
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
      desc = `${bendName}: Kaynak dikişi Saat ${clockPos}:00 nötr eksenindedir. Çekme ve basma gerilmelerinden muaftır (ASME & BOTAŞ KABUL).`;
    } else if (clockPos === '12' || clockPos === '6') {
      isSafe = false;
      badgeText = 'KRİTİK UYARI / RET';
      badgeClass = 'fail';
      boxClass = 'warning';
      const zone = (bendType === 'overbend') 
        ? (clockPos === '12' ? 'Ekstrados (Maksimum Çekme & Cidar İncelmesi)' : 'İntrados (Maksimum Basma & Kalınlaşma)')
        : (clockPos === '12' ? 'İntrados (Maksimum Basma)' : 'Ekstrados (Maksimum Çekme)');
      desc = `DİKKAT: Dikiş Saat ${clockPos}:00 (${zone}) üzerindedir! ASME B31.8 ve BOTAŞ gereği kaynak dikişi Saat 3:00 veya 9:00 nötr eksenine alınmalıdır.`;
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
    desc = 'Kombine bükümde (3D kavis) dikişin bileşke sıfır moment ekseninde konumlandırıldığı sahada doğrulanmalıdır.';
  }

  return { isSafe, badgeText, badgeClass, boxClass, lblClock, desc, angleDeg };
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
  const T_temp = 1.0;
  const t_min_design = (P_mpa * D) / (2 * S_mpa * F * E_weld * T_temp) + state.ca;
  const isWallThinningSafe = t_extrados >= t_min_design;
  const wallMarginMm = t_extrados - t_min_design;
  const wallMarginPercent = (wallMarginMm / t_min_design) * 100;
  
  // Ovality Calculation
  // Empirical natural ovality without mandrel: (1/16) * (D / t) * (D / R) * 100%
  const D_to_t = D / state.t_nom;
  const D_to_R = D / R_mm;
  let estimatedOvality = (1 / 16) * D_to_t * D_to_R * 100;
  
  // If internal hydraulic mandrel is used, ovality is drastically restrained
  if (state.useMandrel) {
    estimatedOvality = Math.min(estimatedOvality * 0.32, 1.15);
  }
  const isOvalityCompliant = estimatedOvality <= 2.50; // ASME / BOTAŞ ILI Pig passage limit (<= 2.5%)
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
  
  // --- Standard Hydraulic Step/Pull Calculations (ASME B31.8 / B31.4 / BOTAŞ / CRC-Evans) ---
  // Active curved arc length traversed by hydraulic bending die:
  const l_bent_m = r_bend_m * (machineAngleDeg * Math.PI / 180);
  const l_t2_actual = Math.max(0, state.length - state.tangent1 - l_bent_m);
  
  // Max allowable pull angle per step per standard (to prevent localized wrinkling/kink):
  // X65-X80 high grade steels: <= 1.0 deg/pull, Lower grades: <= 1.25 deg/pull
  const maxAllowPullAngle = (S_mpa >= 450) ? 1.00 : 1.25;
  
  // Standard step pitch: 350-450mm for >=24", 250-350mm for <24"
  const targetStepPitch = (D >= 600) ? 0.40 : 0.30; // meters
  const n_from_pitch = Math.round(l_bent_m / targetStepPitch);
  const n_from_angle = Math.ceil(machineAngleDeg / maxAllowPullAngle);
  const numPulls = Math.max(2, Math.max(n_from_pitch, n_from_angle));
  
  const pullStepPitch = l_bent_m / numPulls;
  const pullAnglePerStep = machineAngleDeg / numPulls;
  const netAnglePerStep = state.targetAngle / numPulls;
  const isPullAngleCompliant = pullAnglePerStep <= (maxAllowPullAngle + 0.05);
  
  // --- ASME B31.8 Tablo 841.2.3-1 Yöntem 2 (Deflection Rate per OD) ---
  const npsInches = state.od / 25.4;
  let asmeMethod2Limit = 1.9; // NPS 20 and larger
  if (npsInches <= 12) asmeMethod2Limit = 3.2;
  else if (npsInches <= 14) asmeMethod2Limit = 2.7;
  else if (npsInches <= 16) asmeMethod2Limit = 2.4;
  else if (npsInches <= 18) asmeMethod2Limit = 2.1;
  
  const actualDeflectionRatePerOD = (odM / r_bend_m) * (180 / Math.PI);
  const actualDeflectionRatePerMeter = (1.0 / r_bend_m) * (180 / Math.PI);
  const isMethod2Compliant = actualDeflectionRatePerOD <= (asmeMethod2Limit + 0.05);

  // --- ASME B31.8 Md. 841.2.3(a)(7) Ondülasyon (Ripple) Hesabı ---
  // Max allowable peak-to-valley ripple height is 1.0% of OD:
  const maxAllowRippleMm = 0.01 * state.od;
  // Estimated ripple: with mandrel ~0.2% D, without mandrel on thin pipe ~1.4% D
  const estimatedRippleMm = state.useMandrel ? (0.002 * state.od) : (D_to_t > 45 ? 0.014 * state.od : 0.0055 * state.od);
  const isRippleCompliant = estimatedRippleMm <= maxAllowRippleMm;

  // --- Global feasibility: machine-angle arc must fit into available arc ---
  const isGeometryFeasible = l_bent_m <= l_arc_m + 1e-6;

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
    { key: 'ripple', label: 'Ripple', pass: isRippleCompliant }
  ];
  const failedChecks = complianceChecks.filter(c => !c.pass);
  const overallPass = failedChecks.length === 0;
  
  return {
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
    complianceChecks,
    failedChecks,
    overallPass
  };
}

/* ==========================================================================
   UI Update & DOM Rendering
   ========================================================================== */

function updateUI() {
  const calc = runCalculations();
  
  // Standard badge (+ select sync so first paint matches state)
  if (dom.selStandard) {
    const hasStd = [...dom.selStandard.options].some(o => o.value === state.standard);
    if (hasStd) dom.selStandard.value = state.standard;
  }
  if (state.standard === 'ASME_B31_8') {
    dom.standardDisplayBadge.textContent = 'ASME B31.8 (Md. 841.2.3)';
  } else if (state.standard === 'ASME_B31_4') {
    dom.standardDisplayBadge.textContent = 'ASME B31.4 (Md. 406.2.1)';
  } else if (state.standard === 'BOTAS_SPEC') {
    dom.standardDisplayBadge.textContent = 'BOTAŞ / TANAP Kriteri';
  } else {
    dom.standardDisplayBadge.textContent = 'Özel Şartname';
  }
  
  // Radius calculation display
  dom.inpCalculatedRadius.value = `${calc.r_bend_m.toFixed(2)} m (${state.radiusMultiplier} D)`;
  dom.badgeMaxAngleInfo.textContent = `Max: ~${calc.theta_max_deg.toFixed(1)}°`;

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
    dom.kpiDescRmin.textContent = `Seçilen ${state.radiusMultiplier}D ≥ ${calc.minMult}D limitini karşılıyor.`;
  } else {
    dom.kpiBadgeRmin.textContent = 'RİSKLİ / YETERSİZ';
    dom.kpiBadgeRmin.className = 'status-indicator fail';
    dom.kpiDescRmin.textContent = `Seçilen ${state.radiusMultiplier}D < ${calc.minMult}D limitinin altında!`;
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
    dom.kpiBadgeThin.textContent = 'GÜVENLİ';
    dom.kpiBadgeThin.className = 'status-indicator pass';
    dom.kpiDescThin.textContent = `Kalan: ${calc.t_extrados.toFixed(2)} mm ≥ t_min: ${calc.t_min_design.toFixed(2)} mm`;
  } else {
    dom.kpiBadgeThin.textContent = 'RİSKLİ (t < t_min)';
    dom.kpiBadgeThin.className = 'status-indicator fail';
    dom.kpiDescThin.textContent = `Kalan cidar (${calc.t_extrados.toFixed(2)}mm), t_min (${calc.t_min_design.toFixed(2)}mm) altına iniyor!`;
  }
  
  // KPI 4: Ovality
  dom.kpiValOvality.textContent = `%${calc.estimatedOvality.toFixed(2)}`;
  if (calc.isOvalityCompliant) {
    dom.kpiBadgeOvality.textContent = 'ILI UYGUN (≤ %2.5)';
    dom.kpiBadgeOvality.className = 'status-indicator pass';
    dom.kpiDescOvality.textContent = 'Akıllı pig (ILI) serbest geçiş kriteri sağlandı.';
  } else {
    dom.kpiBadgeOvality.textContent = 'PİG RİSKİ (> %2.5)';
    dom.kpiBadgeOvality.className = 'status-indicator fail';
    dom.kpiDescOvality.textContent = 'Aşırı ovalleşme! Akıllı pig sıkışma tehlikesi var.';
  }
  
  // KPI 5: Springback & Machine Angle
  dom.kpiValMachineAngle.textContent = `${calc.machineAngleDeg.toFixed(2)}°`;
  dom.kpiDescSpringback.textContent = `Hedef: ${state.targetAngle.toFixed(2)}° + Geri Yaylanma: ${calc.springbackDeg.toFixed(2)}°`;
  
  // Verification Matrix Card Updates
  dom.matValTnom.textContent = `${state.t_nom.toFixed(2)} mm`;
  dom.matValDeltaThin.textContent = `${calc.delta_t_thin.toFixed(2)} mm (%${calc.thinningPercent.toFixed(2)})`;
  dom.matValTextrados.textContent = `${calc.t_extrados.toFixed(2)} mm`;
  dom.matValTextrados.className = calc.isWallThinningSafe ? 'text-success' : 'text-danger';
  dom.matValTminDesign.textContent = `${calc.t_min_design.toFixed(2)} mm`;
  dom.matValMargin.textContent = `${calc.wallMarginMm >= 0 ? '+' : ''}${calc.wallMarginMm.toFixed(2)} mm (%${calc.wallMarginPercent.toFixed(1)})`;
  dom.matValMargin.className = calc.wallMarginMm >= 0 ? 'text-success' : 'text-danger';
  dom.badgeThinningMatrix.textContent = calc.isWallThinningSafe ? 'PASS' : 'FAIL';
  dom.badgeThinningMatrix.className = `badge-pill ${calc.isWallThinningSafe ? 'pass' : 'fail'}`;
  
  // Ovality Matrix
  dom.matValOvality.textContent = `%${calc.estimatedOvality.toFixed(2)}`;
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
  
  // ASME B31.8 Md. 841.2.3 Ripple & Method 2 Rate Matrix
  if (dom.matValDeflectionRate) {
    dom.matValDeflectionRate.textContent = `${calc.actualDeflectionRatePerOD.toFixed(2)}° / D`;
    dom.matValDeflectionLimit.textContent = `≤ ${calc.asmeMethod2Limit.toFixed(1)}° / D (Tablo 841.2.3-1)`;
    dom.matValRatePerMeter.textContent = `~${calc.actualDeflectionRatePerMeter.toFixed(2)}° / m`;
    dom.matValRippleHeight.textContent = `~${calc.estimatedRippleMm.toFixed(1)} mm`;
    dom.matValRippleHeight.className = calc.isRippleCompliant ? 'text-success' : 'text-danger';
    dom.matValRippleLimit.textContent = `≤ ${calc.maxAllowRippleMm.toFixed(2)} mm (%1.0 D)`;
    const isMatrix4Pass = calc.isMethod2Compliant && calc.isRippleCompliant;
    dom.badgeRippleMatrix.textContent = isMatrix4Pass ? 'PASS' : 'FAIL';
    dom.badgeRippleMatrix.className = `badge-pill ${isMatrix4Pass ? 'pass' : 'fail'}`;
  }
  
  // Populate Hydraulic Pulls Table
  renderPullsTable(calc);
  
  // Update Printable Card Data
  updatePrintableCard(calc);
  
  // Re-render 2D Dynamic Sketch
  render2DSketch(calc);
  
  // Re-render 3D WebGL Pipe
  update3DPipe(calc);

  // Persist inputs (debounced; theme has its own key)
  scheduleSave();
}

/* ==========================================================================
   Fabrication Pull Steps Table Rendering (ASME & BOTAS Standards)
   ========================================================================== */

function renderPullsTable(calc) {
  dom.tbodyPulls.innerHTML = '';
  dom.pullSummaryPill.textContent = `Toplam ${calc.numPulls} Paso • İlerleme: ${(calc.pullStepPitch * 1000).toFixed(0)} mm • ~${calc.pullAnglePerStep.toFixed(2)}°/Paso • Büküm Boyu: ${calc.l_bent_m.toFixed(2)} m (Kalan Arka Düzlük: ${calc.l_t2_actual.toFixed(2)} m)`;
  
  // Starting die advance from front tangent Lt1
  let currentPos = state.tangent1;
  let cumMachAngle = 0;
  let cumNetAngle = 0;
  
  for (let i = 1; i <= calc.numPulls; i++) {
    currentPos += calc.pullStepPitch;
    cumMachAngle += calc.pullAnglePerStep;
    cumNetAngle += calc.netAnglePerStep;
    
    const tr = document.createElement('tr');
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
   2D Dynamic Engineering SVG Sketch Rendering (C1 Continuous)
   ========================================================================== */

function render2DSketch(calc) {
  const g = dom.svgDynamicGroup;
  g.innerHTML = '';
  
  // Available canvas bounds: 1000 x 550
  const svgWidth = 1000;
  const svgHeight = 550;
  
  // Real dimensions in meters
  const totalLength = state.length;
  const t1 = state.tangent1;
  const t2 = state.tangent2;
  // Drawn rear straight uses the realized remainder so the sketch agrees
  // with the pulls table ("Kalan Arka Düzlük"), not just the Lt2 input.
  const t2draw = Math.max(t2, calc.l_t2_actual);
  const r_bend = calc.r_bend_m;
  const thetaRad = (state.targetAngle * Math.PI) / 180;
  
  // Dynamic scaling so the pipe comfortably fits the SVG viewport
  // Pipe length ~8m - 20m, deflection angle up to 30 deg
  const scale = 580 / Math.max(8, totalLength); // pixels per meter
  
  // Visual radius for display (scaled reasonably so curvature is clear)
  const r_vis = Math.max(160, Math.min(380, r_bend * scale * 0.35));
  const pipeDiaVis = Math.max(14, Math.min(32, (state.od / 1000) * scale * 2.2));
  
  // Starting coordinate of pipe on screen
  const startX = 110;
  const startY = 380; // horizontal baseline
  
  // Point of Curvature (PC) - End of Tangent 1
  const t1_len_px = t1 * scale;
  const x_pc = startX + t1_len_px;
  const y_pc = startY;
  
  // Center of Curvature O is located UPWARDS (-Y in SVG) from PC
  const cx = x_pc;
  const cy = y_pc - r_vis;
  
  // Point of Tangency (PT) - End of Arc on Centerline
  const x_pt = cx + r_vis * Math.sin(thetaRad);
  const y_pt = cy + r_vis * Math.cos(thetaRad);
  
  // Tangent 2 (straight line continuing tangentially from PT)
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
  elemNeutral.setAttribute('stroke', '#10b981');
  elemNeutral.setAttribute('stroke-width', '2.5');
  elemNeutral.setAttribute('stroke-dasharray', '8,4');
  g.appendChild(elemNeutral);
  
  // --- INTRADOS (Inner curve - closer to center O, Compression & Thickening) ---
  // Distance to center O is r_vis - pipeDiaVis/2
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
  elemInt.setAttribute('stroke', 'url(#gradCompression)');
  elemInt.setAttribute('stroke-width', '3.5');
  g.appendChild(elemInt);
  
  // --- EXTRADOS (Outer curve - further from center O, Tension & Thinning Δt) ---
  // Distance to center O is r_vis + pipeDiaVis/2
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
  elemExt.setAttribute('stroke', 'url(#gradTension)');
  elemExt.setAttribute('stroke-width', '3.5');
  g.appendChild(elemExt);
  
  const isLight = document.body.classList.contains('light-theme');
  const textColor = isLight ? '#0f172a' : '#cbd5e1';
  const subTextColor = isLight ? '#475569' : '#94a3b8';
  const dimLineColor = isLight ? '#64748b' : '#94a3b8';
  const endCapColor = isLight ? '#0f172a' : '#ffffff';
  const radiusColor = isLight ? '#0284c7' : '#38bdf8';
  const arcColor = isLight ? '#d97706' : '#f59e0b';

  // Synchronize SVG defs arrow markers
  const arrowStart = document.getElementById('arrowStart')?.querySelector('path');
  const arrowEnd = document.getElementById('arrowEnd')?.querySelector('path');
  if (arrowStart) arrowStart.setAttribute('fill', dimLineColor);
  if (arrowEnd) arrowEnd.setAttribute('fill', dimLineColor);

  // End caps (Start & End face bevels)
  drawEndCap(g, int_startX, int_startY, ext_startX, ext_startY, 'Boru Başı', endCapColor);
  drawEndCap(g, int_endX, int_endY, ext_endX, ext_endY, 'Boru Sonu', endCapColor);
  
  // Pull / Step markers along the centerline arc
  const numSteps = Math.min(calc.numPulls, 16);
  for (let i = 1; i <= numSteps; i++) {
    const fraction = i / (numSteps + 1);
    const curAngle = thetaRad * fraction;
    const px = cx + r_vis * Math.sin(curAngle);
    const py = cy + r_vis * Math.cos(curAngle);
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', px);
    circle.setAttribute('cy', py);
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', '#f59e0b');
    g.appendChild(circle);
  }
  
  // Center of Curvature O & Radial Vector Line
  const lineRadius = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  lineRadius.setAttribute('x1', cx);
  lineRadius.setAttribute('y1', cy);
  lineRadius.setAttribute('x2', x_pc);
  lineRadius.setAttribute('y2', y_pc);
  lineRadius.setAttribute('stroke', dimLineColor);
  lineRadius.setAttribute('stroke-width', '1.5');
  lineRadius.setAttribute('stroke-dasharray', '4,4');
  g.appendChild(lineRadius);
  
  const centerO = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerO.setAttribute('cx', cx);
  centerO.setAttribute('cy', cy);
  centerO.setAttribute('r', '4.5');
  centerO.setAttribute('fill', '#10b981');
  g.appendChild(centerO);
  
  drawSvgText(g, cx - 14, cy - 10, 'O (Büküm Merkezi)', subTextColor, '11px', 'var(--font-mono)');
  
  // Dimension Lines and Annotations
  if (state.showDimensions) {
    // Tangent 1 Dimension (Lt1)
    drawDimensionLine(g, startX, startY + 48, x_pc, y_pc + 48, `Lt1 = ${t1.toFixed(1)} m (Ön Düzlük)`, dimLineColor, textColor);
    
    // Tangent 2 Dimension (Lt2)
    const t2_dimOffset = 48;
    const t2_normX = Math.sin(thetaRad);
    const t2_normY = Math.cos(thetaRad);
    const t2_dimStartX = x_pt + t2_dimOffset * t2_normX;
    const t2_dimStartY = y_pt + t2_dimOffset * t2_normY;
    const t2_dimEndX = endX + t2_dimOffset * t2_normX;
    const t2_dimEndY = endY + t2_dimOffset * t2_normY;
    drawDimensionLine(g, t2_dimStartX, t2_dimStartY, t2_dimEndX, t2_dimEndY, t2draw > t2 + 1e-9 ? `Lt2 = ${t2draw.toFixed(1)} m (gerçekleşen, giriş ${t2.toFixed(1)} m)` : `Lt2 = ${t2.toFixed(1)} m`, dimLineColor, textColor);
    
    // Total Pipe Length Dimension at Bottom
    drawDimensionLine(g, startX, startY + 95, endX, startY + 95, `Boru Boyu: ${state.length.toFixed(1)} m | Efektif Büküm Yayı: ${calc.l_arc_m.toFixed(2)} m`, dimLineColor, textColor);
    
    // Deflection Angle Arc (at center O)
    drawAngleArcCorrect(g, cx, cy, 75, 0, thetaRad, `θ = ${state.targetAngle.toFixed(1)}° (Makine: ${calc.machineAngleDeg.toFixed(1)}°)`, arcColor);
    
    // Radius Label
    drawSvgText(g, cx + 14, cy + r_vis * 0.5, `Rbend = ${calc.r_bend_m.toFixed(1)} m (${state.radiusMultiplier}D)`, radiusColor, '12px', 'var(--font-mono)', 'bold');
    
    // Extrados Thinning Label (Below outer red curve)
    const midExtAngle = thetaRad * 0.5;
    const midExtX = cx + (r_ext + 15) * Math.sin(midExtAngle);
    const midExtY = cy + (r_ext + 15) * Math.cos(midExtAngle);
    drawSvgText(g, midExtX - 40, midExtY + 16, `Ekstrados (Çekme) Δt = -${calc.delta_t_thin.toFixed(2)} mm (Kalan: ${calc.t_extrados.toFixed(2)} mm)`, '#ef4444', '11px', 'var(--font-mono)', 'bold');
    
    // Intrados Thickening Label (Above inner blue curve)
    const midIntAngle = thetaRad * 0.5;
    const midIntX = cx + (r_int - 15) * Math.sin(midIntAngle);
    const midIntY = cy + (r_int - 15) * Math.cos(midIntAngle);
    drawSvgText(g, midIntX - 30, midIntY - 8, `İntrados (Basma) +${calc.delta_t_thick.toFixed(2)} mm`, '#3b82f6', '11px', 'var(--font-mono)');
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

function drawDimensionLine(g, x1, y1, x2, y2, text, strokeColor = '#94a3b8', textColor = '#cbd5e1') {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', strokeColor);
  line.setAttribute('stroke-width', '1.3');
  line.setAttribute('marker-start', 'url(#arrowStart)');
  line.setAttribute('marker-end', 'url(#arrowEnd)');
  g.appendChild(line);
  
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2 - 7;
  drawSvgText(g, midX, midY, text, textColor, '11px', 'var(--font-mono)', 'bold', 'middle');
}

function drawAngleArcCorrect(g, cx, cy, radius, startAngle, endAngle, label, arcColor = '#f59e0b') {
  // startAngle = 0 (points straight down: 0, +radius)
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

let scene3D, camera3D, renderer3D, controls3D, gridHelper3D;
let pipeCenter3D = null; // pipe midpoint, applied to orbit target on tab switch only
// Single home framing for the 3D view (opening view + all reset buttons)
const CAM_HOME = { pos: [0, 7, 18], tgt: [0, 0, 0] };
let pipeMesh3D = null;
let mandrelMesh3D = null;
let seamLine3D = null;
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
  gridHelper3D = new THREE.GridHelper(26, 26, c1, c2);
  gridHelper3D.position.y = -2.5;
  scene3D.add(gridHelper3D);
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
      scene3D.background = new THREE.Color(0xf8fafc);
      update3DGrid(true);
    }
  } else {
    document.body.classList.remove('light-theme');
    if (dom.themeIcon) dom.themeIcon.textContent = '☀️';
    if (dom.themeLabel) dom.themeLabel.textContent = 'Açık Tema';
    if (scene3D) {
      scene3D.background = new THREE.Color(0x090d16);
      update3DGrid(false);
    }
  }
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
  camera3D.position.set(...CAM_HOME.pos);
  
  // Renderer setup
  renderer3D = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer3D.setSize(width, height);
  renderer3D.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer3D.shadowMap.enabled = true;
  container.appendChild(renderer3D.domElement);
  
  // OrbitControls
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls3D = new THREE.OrbitControls(camera3D, renderer3D.domElement);
    controls3D.enableDamping = true;
    controls3D.dampingFactor = 0.05;
    controls3D.maxDistance = 50;
    controls3D.minDistance = 3;
    controls3D.target.set(0, 0, 0);
  }
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene3D.add(ambientLight);
  
  const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 0.9);
  dirLight1.position.set(10, 20, 15);
  scene3D.add(dirLight1);
  
  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight2.position.set(-15, -10, -10);
  scene3D.add(dirLight2);
  
  // Floor Reference Grid
  update3DGrid(isLight);
  
  dom.loading3D.style.display = 'none';
  is3DInitialized = true;
  
  // Animation Loop (skips GPU work while the 3D tab is hidden)
  function animate() {
    requestAnimationFrame(animate);
    if (!dom.view3D.classList.contains('active')) return;
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

function update3DPipe(calc) {
  if (!is3DInitialized) {
    if (dom.view3D.classList.contains('active')) {
      init3DScene();
    } else {
      return;
    }
  }

  // Perf: skip rebuild while 3D tab is hidden.
  // Tab switch (tab3D handler) already calls update3DPipe after activating view3D.
  if (!dom.view3D.classList.contains('active')) return;
  
  // Free GPU buffers of the previous rebuild (slider drags rebuild often)
  const disposeMesh = (m) => {
    if (!m) return;
    scene3D.remove(m);
    if (m.geometry) m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    mats.forEach((mt) => { if (mt && mt.dispose) mt.dispose(); });
  };
  disposeMesh(pipeMesh3D);
  disposeMesh(mandrelMesh3D);
  disposeMesh(seamLine3D);
  pipeMesh3D = mandrelMesh3D = seamLine3D = null;
  
  // Geometry parameters
  const totalLength = state.length;
  const t1 = state.tangent1;
  const t2 = state.tangent2;
  const r_bend = calc.r_bend_m;
  const thetaRad = (state.targetAngle * Math.PI) / 180;
  
  // Pipe outer radius in 3D coordinate units (1m = 1 unit)
  const pipeRadius = (state.od / 1000) / 2;
  
  // Center the overall pipe symmetrically around origin (0, 0, 0)
  const startX = -totalLength / 2;
  
  // Mathematically Continuous C1 Curve Points
  const curvePoints = [];
  
  // --- 1. FRONT TANGENT (Straight line along +X at Y=0, Z=0) ---
  const numStepsT1 = 16;
  for (let i = 0; i <= numStepsT1; i++) {
    const fraction = i / numStepsT1;
    const x = startX + t1 * fraction;
    curvePoints.push(new THREE.Vector3(x, 0, 0));
  }
  
  // Point of Curvature (PC)
  const x_pc = startX + t1;
  
  // --- 2. BENT CIRCULAR ARC (Smooth C1 tangency starting at PC) ---
  const numStepsArc = 40;
  const arcStartIndex = curvePoints.length - 1;
  
  for (let i = 1; i <= numStepsArc; i++) {
    const fraction = i / numStepsArc;
    const phi = thetaRad * fraction;
    const dx = r_bend * Math.sin(phi);
    const defl = r_bend * (1 - Math.cos(phi));
    
    let curX = x_pc + dx;
    let curY = 0;
    let curZ = 0;
    
    if (state.bendType === 'overbend') {
      curY = defl; // Upward arch
    } else if (state.bendType === 'sagbend') {
      curY = -defl; // Downward dip
    } else if (state.bendType === 'sidebend_right') {
      curZ = defl; // Horizontal right
    } else if (state.bendType === 'sidebend_left') {
      curZ = -defl; // Horizontal left
    } else { // compound
      curY = defl * 0.707;
      curZ = defl * 0.707;
    }
    curvePoints.push(new THREE.Vector3(curX, curY, curZ));
  }
  
  const arcEndIndex = curvePoints.length - 1;
  const pt_last = curvePoints[arcEndIndex];
  
  // --- 3. REAR TANGENT (Straight line continuing along tangent vector) ---
  const numStepsT2 = 16;
  let dirX = Math.cos(thetaRad);
  let dirY = 0;
  let dirZ = 0;
  if (state.bendType === 'overbend') {
    dirY = Math.sin(thetaRad);
  } else if (state.bendType === 'sagbend') {
    dirY = -Math.sin(thetaRad);
  } else if (state.bendType === 'sidebend_right') {
    dirZ = Math.sin(thetaRad);
  } else if (state.bendType === 'sidebend_left') {
    dirZ = -Math.sin(thetaRad);
  } else { // compound
    dirY = Math.sin(thetaRad) * 0.707;
    dirZ = Math.sin(thetaRad) * 0.707;
  }
  
  for (let i = 1; i <= numStepsT2; i++) {
    const fraction = i / numStepsT2;
    const x = pt_last.x + t2 * fraction * dirX;
    const y = pt_last.y + t2 * fraction * dirY;
    const z = pt_last.z + t2 * fraction * dirZ;
    curvePoints.push(new THREE.Vector3(x, y, z));
  }
  
  // Build smooth 3D spline curve
  const pipeCurve = new THREE.CatmullRomCurve3(curvePoints);
  
  // Tube Geometry with vertex colors for stress visualization
  const tubularSegments = 140;
  const radialSegments = 32;
  const pipeGeom = new THREE.TubeGeometry(pipeCurve, tubularSegments, pipeRadius, radialSegments, false);
  
  // Add Vertex Colors for Stress Gradient
  const count = pipeGeom.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const pos = pipeGeom.attributes.position;
  
  for (let i = 0; i < count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    
    if (vx >= x_pc && vx <= pt_last.x) {
      let isTension = false;
      if (state.bendType === 'overbend') {
        isTension = vy > 0.08;
      } else if (state.bendType === 'sagbend') {
        isTension = vy < -0.08;
      } else if (state.bendType === 'sidebend_right') {
        isTension = vz < 0.12;
      } else if (state.bendType === 'sidebend_left') {
        isTension = vz > -0.12;
      } else {
        isTension = (vy + vz) > 0.08;
      }

      if (isTension) {
        // Tension face (Red/Orange Extrados)
        colors[i * 3] = 0.94;
        colors[i * 3 + 1] = 0.27;
        colors[i * 3 + 2] = 0.27;
      } else {
        // Compression face (Blue Intrados)
        colors[i * 3] = 0.23;
        colors[i * 3 + 1] = 0.51;
        colors[i * 3 + 2] = 0.96;
      }
    } else {
      // Tangents (Steel Grey)
      colors[i * 3] = 0.45;
      colors[i * 3 + 1] = 0.52;
      colors[i * 3 + 2] = 0.60;
    }
  }
  pipeGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  // When the internal mandrel is shown, fade the shell so the green
  // mandrel inside the opaque tube actually becomes visible.
  const mandrelShown = state.useMandrel && state.mandrelVisible3D;
  const pipeMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.75,
    roughness: 0.35,
    wireframe: false,
    transparent: mandrelShown,
    opacity: mandrelShown ? 0.45 : 1.0
  });
  
  pipeMesh3D = new THREE.Mesh(pipeGeom, pipeMaterial);
  scene3D.add(pipeMesh3D);
  
  // Internal Hydraulic Mandrel Mesh (Placed accurately inside the bent arc)
  if (mandrelShown) {
    const mandrelCurvePoints = [];
    for (let i = arcStartIndex; i <= arcEndIndex; i += 2) {
      mandrelCurvePoints.push(curvePoints[i]);
    }
    
    if (mandrelCurvePoints.length > 2) {
      const mandrelCurve = new THREE.CatmullRomCurve3(mandrelCurvePoints);
      const mandrelGeom = new THREE.TubeGeometry(mandrelCurve, 40, pipeRadius * 0.86, 16, false);
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
    
    if (state.seamType === 'SAWH') {
      // SAWH: Helical Spiral Weld Seam wrapping 360° around the pipe
      const helixAngleRad = 58 * Math.PI / 180;
      const pitch = Math.PI * (2 * pipeRadius) / Math.tan(helixAngleRad);
      const numSamples = 240;
      
      for (let i = 0; i <= numSamples; i++) {
        const u = i / numSamples;
        const pt = pipeCurve.getPointAt(u);
        const tangent = pipeCurve.getTangentAt(u).normalize();
        
        const up = new THREE.Vector3(0, 1, 0);
        let binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
        if (binormal.lengthSq() < 0.001) binormal.set(0, 0, 1);
        const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();
        
        const s = u * totalLength;
        const phi = (2 * Math.PI * s) / pitch + seamRadOffset;
        
        const surfaceOffset = new THREE.Vector3()
          .addScaledVector(normal, Math.cos(phi) * pipeRadius * 1.018)
          .addScaledVector(binormal, Math.sin(phi) * pipeRadius * 1.018);
          
        seamPoints.push(new THREE.Vector3().addVectors(pt, surfaceOffset));
      }
      
      const seamCurve = new THREE.CatmullRomCurve3(seamPoints);
      const seamGeom = new THREE.TubeGeometry(seamCurve, 200, Math.max(0.015, pipeRadius * 0.038), 8, false);
      const seamMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.9,
        roughness: 0.25
      });
      seamLine3D = new THREE.Mesh(seamGeom, seamMat);
      scene3D.add(seamLine3D);
      
    } else if (state.seamType === 'SAWL') {
      // SAWL / HFW: Longitudinal Weld Seam along the specified clock angle
      const numSamples = 120;
      for (let i = 0; i <= numSamples; i++) {
        const u = i / numSamples;
        const pt = pipeCurve.getPointAt(u);
        const tangent = pipeCurve.getTangentAt(u).normalize();
        
        const up = new THREE.Vector3(0, 1, 0);
        let binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
        if (binormal.lengthSq() < 0.001) binormal.set(0, 0, 1);
        const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();
        
        const surfaceOffset = new THREE.Vector3()
          .addScaledVector(normal, Math.cos(seamRadOffset) * pipeRadius * 1.018)
          .addScaledVector(binormal, Math.sin(seamRadOffset) * pipeRadius * 1.018);
          
        seamPoints.push(new THREE.Vector3().addVectors(pt, surfaceOffset));
      }
      
      const seamCurve = new THREE.CatmullRomCurve3(seamPoints);
      const seamGeom = new THREE.TubeGeometry(seamCurve, 100, Math.max(0.018, pipeRadius * 0.042), 8, false);
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
  
  // Remember pipe center for tab-switch framing; never touch the user's
  // live orbit target here so sidebar edits don't yank the camera.
  const endPt = curvePoints[curvePoints.length - 1];
  pipeCenter3D = {
    x: (startX + endPt.x) / 2,
    y: endPt.y / 2,
    z: endPt.z / 2
  };
}

/* ==========================================================================
   Printable A4 QC Inspection Sheet Data Sync
   ========================================================================== */

function updatePrintableCard(calc) {
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
  if (dom.prtBendType) dom.prtBendType.textContent = bendNames[state.bendType] || state.bendType;

  const clockCheck = validateClockSafety(state.bendType, state.clockPos, state.seamAngle);
  if (dom.prtClockPos) {
    dom.prtClockPos.textContent = `${clockCheck.lblClock} - ${clockCheck.isSafe ? 'KABUL (Nötr Eksende)' : 'RET (Kritik Gerilme)'}`;
  }
  
  // Section 1
  if (dom.prtPipeLength) dom.prtPipeLength.textContent = `${state.length.toFixed(2)} m`;
  if (dom.prtPipeOD) dom.prtPipeOD.textContent = `${state.npsLabel} (${state.od.toFixed(1)} mm)`;
  if (dom.prtSteelGrade) dom.prtSteelGrade.textContent = `${state.gradeName} (SMYS: ${state.smys} MPa)`;
  if (dom.prtNomWT) dom.prtNomWT.textContent = `${state.t_nom.toFixed(2)} mm (CA: ${state.ca.toFixed(1)} mm)`;
  if (dom.prtSeam) dom.prtSeam.textContent = `${state.seamType} - ${clockCheck.lblClock}`;
  if (dom.prtDesignPress) dom.prtDesignPress.textContent = `${state.designPressure.toFixed(1)} bar (F: ${state.designFactor})`;
  
  // Section 2
  if (dom.prtRCalculated) dom.prtRCalculated.textContent = `${calc.r_bend_m.toFixed(2)} m (${state.radiusMultiplier} D)`;
  if (dom.prtRmin) dom.prtRmin.textContent = `${calc.r_min_m.toFixed(2)} m (${calc.isRadiusCompliant ? 'UYGUN' : 'UYGUN DEĞİL'})`;
  if (dom.prtThetaTarget) dom.prtThetaTarget.textContent = `${state.targetAngle.toFixed(2)}°`;
  if (dom.prtThetaMax) dom.prtThetaMax.textContent = `${calc.theta_max_deg.toFixed(2)}° (${calc.isAngleWithinPipeCapacity ? 'KAPASİTE DAHİLİ' : 'AŞIM'})`;
  if (dom.prtTangents) dom.prtTangents.textContent = `${state.tangent1.toFixed(2)} m / ${state.tangent2.toFixed(2)} m`;
  if (dom.prtArcLength) dom.prtArcLength.textContent = `${calc.l_arc_m.toFixed(2)} m`;
  if (dom.prtSpringback) dom.prtSpringback.textContent = `${calc.springbackDeg.toFixed(2)}°`;
  if (dom.prtMachineAngle) dom.prtMachineAngle.textContent = `${calc.machineAngleDeg.toFixed(2)}°`;
  
  // Section 3
  if (dom.prtThinning) dom.prtThinning.textContent = `${calc.delta_t_thin.toFixed(2)} mm (%${calc.thinningPercent.toFixed(2)})`;
  if (dom.prtRemainingWT) dom.prtRemainingWT.textContent = `${calc.t_extrados.toFixed(2)} mm (t_min: ${calc.t_min_design.toFixed(2)} mm) - ${calc.isWallThinningSafe ? 'KABUL' : 'RET'}`;
  if (dom.prtOvality) dom.prtOvality.textContent = `%${calc.estimatedOvality.toFixed(2)} (Maks: %2.5) - ${calc.isOvalityCompliant ? 'KABUL' : 'RET'}`;
  if (dom.prtMandrel) dom.prtMandrel.textContent = state.useMandrel ? 'İç Hidrolik Mandrel Kullanıldı (KABUL)' : 'Mandrelsiz Büküm Yapıldı';
  if (dom.prtDeflectionRate) dom.prtDeflectionRate.textContent = `${calc.actualDeflectionRatePerOD.toFixed(2)}° / D (Limit: ≤ ${calc.asmeMethod2Limit.toFixed(1)}° / D) - ${calc.isMethod2Compliant ? 'KABUL' : 'RET'}`;
  if (dom.prtRippleStatus) dom.prtRippleStatus.textContent = `~${calc.estimatedRippleMm.toFixed(1)} mm (Limit: ≤ ${calc.maxAllowRippleMm.toFixed(1)} mm / %1.0 D) - ${calc.isRippleCompliant ? 'KABUL' : 'RET'}`;
  if (dom.prtSeamStatus) dom.prtSeamStatus.textContent = calc.isSeamSafe ? 'Nötr Eksen ±10° sınırında (KABUL)' : 'Nötr Eksen Dışında (RET)';
  if (dom.prtGirthWeldStatus) dom.prtGirthWeldStatus.textContent = state.girthWeldInBend ? 'Alın Kaynağı MEVCUT (Md. 841.2.3-a-5 Gereği 100% RT ZORUNLU)' : 'Alın Kaynağı Yok (RT Gerekmez)';

  // Section 4: print pulls table (same math as renderPullsTable; truncated for A4)
  const prtBody = dom.prtPullsBody;
  if (prtBody) {
    prtBody.innerHTML = '';
    const stepMm = (calc.pullStepPitch * 1000).toFixed(0);
    const stepAng = calc.pullAnglePerStep.toFixed(2);
    const rows = [];
    for (let i = 1; i <= calc.numPulls; i++) {
      rows.push({
        n: i,
        pos: (state.tangent1 + calc.pullStepPitch * i).toFixed(3),
        cumMach: (calc.pullAnglePerStep * i).toFixed(2),
        cumNet: (calc.netAnglePerStep * i).toFixed(2)
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
      const tr = document.createElement('tr');
      if (r === null) {
        tr.innerHTML = `<td colspan="6" style="text-align:center;">… (${skipped} paso atlandı — tam liste için ekran tablosuna bakınız) …</td>`;
      } else {
        tr.innerHTML = `<td><strong>${r.n}</strong></td><td>${r.pos}</td><td>${stepMm}</td><td>+${stepAng}°</td><td><strong>${r.cumMach}°</strong></td><td>${r.cumNet}°</td>`;
      }
      prtBody.appendChild(tr);
    });
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

// Central numeric guard: non-finite input falls back, out-of-range input is
// clamped to the field limits so absurd values (negative wall, zero length)
// can never flow into the engineering calculations.
function clampNum(v, min, max, fallback) {
  // Accept Turkish decimal comma ("14,3") as well as dot
  const n = parseFloat(String(v).replace(',', '.'));
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
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    /* storage unavailable (private mode, quota) — silently ignore */
  }
}

function restoreState() {
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem(STATE_STORAGE_KEY) || 'null');
  } catch (err) {
    data = null;
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

  state.standard = oneOf(data.standard, ['ASME_B31_8', 'ASME_B31_4', 'BOTAS_SPEC', 'CUSTOM_SPEC'], state.standard);
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
  state.targetAngle = num(data.targetAngle, state.targetAngle, 0.5, 90);
  state.radiusMultiplier = num(data.radiusMultiplier, state.radiusMultiplier, 5, 100);
  state.designPressure = num(data.designPressure, state.designPressure, 1, 250);
  state.designFactor = oneOf(num(data.designFactor, state.designFactor), [0.8, 0.72, 0.6, 0.5, 0.4], state.designFactor);
  state.useMandrel = data.useMandrel !== undefined ? !!data.useMandrel : state.useMandrel;
  state.girthWeldInBend = data.girthWeldInBend !== undefined ? !!data.girthWeldInBend : state.girthWeldInBend;
  state.showDimensions = data.showDimensions !== undefined ? !!data.showDimensions : state.showDimensions;
  state.mandrelVisible3D = data.mandrelVisible3D !== undefined ? !!data.mandrelVisible3D : state.mandrelVisible3D;
  state.seamVisible3D = data.seamVisible3D !== undefined ? !!data.seamVisible3D : state.seamVisible3D;
  ['projectName', 'lineSection', 'chainageKP', 'pipeNo', 'heatNo', 'reportNo'].forEach((k) => {
    if (typeof data[k] === 'string' && data[k].length > 0) state[k] = data[k];
  });

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
  setVal(dom.inpDesignPressure, state.designPressure);
  if (dom.chkUseMandrel) dom.chkUseMandrel.checked = state.useMandrel;
  if (dom.chkGirthWeld) dom.chkGirthWeld.checked = state.girthWeldInBend;
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
  // Restored values are no longer a named preset
  if (dom.selPreset) dom.selPreset.value = 'custom';
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
      dom.selRadiusMultiplier.value = p.radiusMultiplier;
      if (dom.groupCustomRadius) dom.groupCustomRadius.style.display = 'none';
      if (dom.inpCustomRadius) dom.inpCustomRadius.value = p.radiusMultiplier;
      
      state.designPressure = p.designPressure;
      dom.inpDesignPressure.value = p.designPressure;
      
      state.designFactor = p.designFactor;
      dom.selDesignFactor.value = p.designFactor;
      
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
    updateUI();
  });

  dom.inpCustomOD.addEventListener('input', (e) => {
    state.od = clampNum(e.target.value, 50, 2500, 100);
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
      const customK = dom.inpCustomRadius ? parseFloat(dom.inpCustomRadius.value) : NaN;
      state.radiusMultiplier = (Number.isFinite(customK) && customK >= 5 && customK <= 100) ? customK : 40;
    } else {
      if (dom.groupCustomRadius) dom.groupCustomRadius.style.display = 'none';
      state.radiusMultiplier = parseFloat(e.target.value) || 40;
    }
    updateUI();
  });

  if (dom.inpCustomRadius) {
    dom.inpCustomRadius.addEventListener('input', (e) => {
      const k = parseFloat(String(e.target.value).replace(',', '.'));
      if (Number.isFinite(k) && k >= 5 && k <= 100) {
        state.radiusMultiplier = k;
        updateUI();
      }
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

  // Pressure & Class Factor
  dom.inpDesignPressure.addEventListener('input', (e) => {
    state.designPressure = clampNum(e.target.value, 1, 250, 50);
    updateUI();
  });

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

  // Tab Switching (2D vs 3D)
  dom.tab2D.addEventListener('click', () => {
    dom.tab2D.classList.add('active');
    dom.tab3D.classList.remove('active');
    dom.view2D.classList.add('active');
    dom.view3D.classList.remove('active');
    if (dom.visInfoLabel) dom.visInfoLabel.textContent = 'Şematik Vektör Analizi • Canlı Güncelleme';
    if (dom.btnResetView) dom.btnResetView.style.display = 'none';
    render2DSketch(runCalculations());
  });

  dom.tab3D.addEventListener('click', () => {
    dom.tab3D.classList.add('active');
    dom.tab2D.classList.remove('active');
    dom.view3D.classList.add('active');
    dom.view2D.classList.remove('active');
    init3DScene();
    update3DPipe(runCalculations());
    if (dom.visInfoLabel) dom.visInfoLabel.textContent = '3D WebGL Modeli • Canlı Güncelleme';
    if (dom.btnResetView) dom.btnResetView.style.display = '';
    if (controls3D && pipeCenter3D) {
      controls3D.target.set(pipeCenter3D.x, pipeCenter3D.y, pipeCenter3D.z);
      controls3D.update();
    }
  });

  // View reset & toggle labels
  dom.btnResetView.addEventListener('click', () => {
    if (dom.view3D.classList.contains('active') && controls3D) {
      camera3D.position.set(...CAM_HOME.pos);
      controls3D.target.set(...CAM_HOME.tgt);
      controls3D.update();
    } else {
      render2DSketch(runCalculations());
    }
  });

  dom.btnToggleLabels.addEventListener('click', () => {
    state.showDimensions = !state.showDimensions;
    dom.btnToggleLabels.textContent = state.showDimensions ? 'Ölçüleri Gizle' : 'Ölçüleri Göster';
    dom.btnToggleLabels.setAttribute('aria-pressed', String(state.showDimensions));
    render2DSketch(runCalculations());
  });

  // 3D Control Buttons
  dom.btn3dResetCam.addEventListener('click', () => {
    if (camera3D && controls3D) {
      camera3D.position.set(...CAM_HOME.pos);
      controls3D.target.set(...CAM_HOME.tgt);
      controls3D.update();
    }
  });

  dom.btn3dToggleMandrel.addEventListener('click', () => {
    state.mandrelVisible3D = !state.mandrelVisible3D;
    dom.btn3dToggleMandrel.textContent = `Mandrel: ${state.mandrelVisible3D ? 'Açık' : 'Kapalı'}`;
    dom.btn3dToggleMandrel.setAttribute('aria-pressed', String(state.mandrelVisible3D));
    update3DPipe(runCalculations());
  });

  dom.btn3dToggleSeam.addEventListener('click', () => {
    state.seamVisible3D = !state.seamVisible3D;
    update3DPipe(runCalculations());
  });

  // Reset to Defaults
  dom.btnResetDefaults.addEventListener('click', () => {
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
}

// Initial Boot
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  restoreState();
  applyTheme(state.theme);
  updateUI();
});
