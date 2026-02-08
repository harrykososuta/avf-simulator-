// === シミュレーションパラメータ ===
export interface SimulationParams {
  arteryDiameter: number;    // mm
  veinDiameter: number;      // mm
  anastomosisAngle: number;  // degrees
  baseFlowRate: number;      // mL/min
  bloodFlowRate: number;     // mL/min (deprecated, use baseFlowRate)
  hematocrit: number;        // 0-1 ratio
  heartRate: number;         // bpm
  bloodPressure: number;     // mmHg
  systolicRatio: number;     // 収縮期/拡張期比
}

// === 血液物性 ===
export interface BloodProperties {
  viscosity: number;         // Pa·s
  density: number;           // kg/m³
  reynoldsNumber: number;
  shearRate: number;         // 1/s
}

// === ジオメトリ ===
export interface Point2D {
  x: number;
  y: number;
}

export interface WallPoint {
  point: Point2D;
  normal: Point2D;
  regionType: RegionType;
  paramPosition: number; // 0-1 along the wall
}

export type RegionType =
  | 'proximal_artery'
  | 'distal_artery'
  | 'vein_outer'
  | 'vein_inner'
  | 'anastomosis_toe'
  | 'anastomosis_heel'
  | 'anastomosis_floor'
  | 'anastomosis_outer';

export interface VesselGeometry {
  // Centerlines
  arteryCenterline: Point2D[];
  veinCenterline: Point2D[];
  // Wall contours
  arteryUpperWall: Point2D[];
  arteryLowerWall: Point2D[];
  veinOuterWall: Point2D[];
  veinInnerWall: Point2D[];
  // Anastomosis point
  anastomosisPoint: Point2D;
  // All wall points with metadata
  wallPoints: WallPoint[];
  // Recirculation zone polygon
  recirculationZone: Point2D[];
  // Geometric dimensions
  arteryLength: number;      // mm
  veinLength: number;        // mm
  arteryDiameter: number;    // mm
  veinDiameter: number;      // mm
  anastomosisAngle: number;  // degrees
}

// === 血行動態結果 ===
export interface WSSData {
  tawss: number;   // Pa
  osi: number;     // 0-0.5
  rrt: number;     // 1/Pa
}

export interface HemodynamicResult {
  wallWSS: { point: WallPoint; data: WSSData }[];
  velocityField: VelocityVector[];
  metrics: HemodynamicMetrics;
  flowSplit: FlowSplit;
}

export interface VelocityVector {
  position: Point2D;
  vx: number;
  vy: number;
  magnitude: number;
}

export interface HemodynamicMetrics {
  tawss: number;            // Time-averaged WSS (Pa)
  osi: number;              // Oscillatory shear index (0-0.5)
  rrt: number;              // Relative residence time (Pa⁻¹)
  totalFlowRate: number;    // Total flow rate (mL/min)
  meanTAWSS: number;
  maxTAWSS: number;
  minTAWSS: number;
  meanOSI: number;
  maxOSI: number;
  meanRRT: number;
  maxRRT: number;
  // Detailed Analysis
  reynoldsNumber: number;
  deanNumber: number;
  wssGradient: number;
  effectiveViscosity: number;
}

export interface FlowSplit {
  veinFlowRate: number;      // mL/min
  distalFlowRate: number;    // mL/min
  veinFraction: number;      // 0-1
}

// === 成熟予測 ===
export interface MaturationFactor {
  name: string;
  value: number;
  threshold: string;
  score: number;
  maxScore: number;
  passed: boolean;
}

export interface MaturationScore {
  totalScore: number;
  probability: number;      // 0-1
  factors: MaturationFactor[];
  riskLevel: 'low' | 'moderate' | 'high';
  recommendation: string;
}

export interface TimelinePoint {
  week: number;
  veinDiameter: number;     // mm
  flowRate: number;          // mL/min
  maturationStatus: 'immature' | 'developing' | 'mature';
}

// === 表示設定 ===
export type DisplayMode = 'wss' | 'osi' | 'rrt' | 'velocity';
