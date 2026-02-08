import { Point2D, VesselGeometry, WallPoint, RegionType } from '@/types';
import { CANVAS } from '../constants';

/**
 * 3次ベジエ曲線上の点を計算
 */
function cubicBezier(t: number, p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

/**
 * 3次ベジエ曲線の接線ベクトル（正規化済み）を計算
 */
function cubicBezierTangent(t: number, p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  // Derivative of cubic bezier
  const dx = 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x);
  const dy = 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y);

  const len = Math.hypot(dx, dy);
  return { x: dx / len, y: dy / len };
}

/**
 * 吻合部のEnd-to-Side形状を生成 (カーブ形状)
 * 座標系: 吻合点が中央、動脈が水平、静脈がJ字型に合流
 */
export function generateGeometry(
  arteryDiameter: number,
  veinDiameter: number,
  anastomosisAngle: number
): VesselGeometry {
  const scale = CANVAS.vesselScale;
  const cx = CANVAS.width / 2;
  const cy = CANVAS.height * 0.65; // 少し下に配置してカーブのスペースを確保

  const arteryRadius = (arteryDiameter / 2) * scale;
  const veinRadius = (veinDiameter / 2) * scale;
  const angleRad = (anastomosisAngle * Math.PI) / 180;

  // 吻合点
  const anastomosisPoint: Point2D = { x: cx, y: cy };

  // 動脈中心線: 左から右へ水平
  const arteryLength = CANVAS.width * 0.8; // px
  const arteryCenterline: Point2D[] = [];
  const numArteryPts = 60;
  for (let i = 0; i < numArteryPts; i++) {
    const t = i / (numArteryPts - 1);
    arteryCenterline.push({
      x: cx - arteryLength / 2 + t * arteryLength,
      y: cy,
    });
  }

  // 静脈中心線: ベジエ曲線でカーブを描く
  // P0: 吻合点
  // P1: 吻合角度方向に伸ばした制御点
  // P3: 画面左上（心臓側）
  // P2: P3から水平に伸ばした制御点

  const veinCurveLength = 350; // カーブ全体の長さ目安
  const p0 = { x: cx, y: cy };
  const p1 = {
    x: cx + Math.cos(Math.PI - angleRad) * veinCurveLength * 0.4,
    y: cy - Math.sin(angleRad) * veinCurveLength * 0.4,
  };
  const p3 = {
    x: cx - veinCurveLength * 0.8,
    y: cy - veinCurveLength * 0.8,
  };
  const p2 = {
    x: p3.x + veinCurveLength * 0.4, // 水平に入る
    y: p3.y,
  };

  const veinCenterline: Point2D[] = [];
  const veinNormals: Point2D[] = [];
  const numVeinPts = 50;

  for (let i = 0; i < numVeinPts; i++) {
    const t = i / (numVeinPts - 1);
    const p = cubicBezier(t, p0, p1, p2, p3);
    veinCenterline.push(p);

    const tangent = cubicBezierTangent(t, p0, p1, p2, p3);
    // Normal is tangent rotated 90 degrees
    veinNormals.push({ x: -tangent.y, y: tangent.x });
  }

  // 動脈壁 (上壁・下壁)
  const arteryUpperWall = arteryCenterline.map((p) => ({ x: p.x, y: p.y - arteryRadius }));
  const arteryLowerWall = arteryCenterline.map((p) => ({ x: p.x, y: p.y + arteryRadius }));

  // 静脈壁 (外壁・内壁) - 中心線に垂直方向にオフセット
  const veinOuterWall = veinCenterline.map((p, i) => ({
    x: p.x + veinRadius * veinNormals[i].x,
    y: p.y + veinRadius * veinNormals[i].y,
  }));
  const veinInnerWall = veinCenterline.map((p, i) => ({
    x: p.x - veinRadius * veinNormals[i].x,
    y: p.y - veinRadius * veinNormals[i].y,
  }));

  // 吻合部のスムーズな接続部分を生成 (Toe)
  // 静脈外壁(i=0) と 動脈上壁の接続
  // 実際にはveinOuterWall[0]付近は動脈内部に入り込むのでクリッピングが必要だが、
  // 簡易的にBezierでつなぐ
  const toeConnection = generateSmoothConnection(
    arteryUpperWall,
    veinOuterWall,
    cx,
    cy - arteryRadius,
    15
  );

  // 動脈上壁の吻合部開口部分を修正
  const modifiedArteryUpper = modifyArteryWallForAnastomosis(
    arteryUpperWall,
    cx,
    veinRadius,
    angleRad,
    arteryRadius
  );

  // 再循環ゾーン推定
  const recirculationZone = estimateRecirculationZone(
    cx, cy, arteryRadius, veinRadius, angleRad, scale
  );

  // 壁面ポイント生成 (WSS計算用)
  const wallPoints = generateWallPoints(
    modifiedArteryUpper,
    arteryLowerWall,
    veinOuterWall,
    veinInnerWall,
    veinNormals,
    toeConnection,
    cx,
    cy,
    arteryRadius,
    angleRad
  );

  // 形状データとしての静脈長さ（曲線長概算）
  const veinLength = veinCurveLength;

  return {
    arteryCenterline,
    veinCenterline,
    arteryUpperWall: modifiedArteryUpper,
    arteryLowerWall,
    veinOuterWall,
    veinInnerWall,
    anastomosisPoint,
    wallPoints,
    recirculationZone,
    // Geometric dimensions
    arteryLength,
    veinLength,
    arteryDiameter,
    veinDiameter,
    anastomosisAngle,
  };
}

function generateSmoothConnection(
  arteryWall: Point2D[],
  veinWall: Point2D[],
  cx: number,
  toeY: number,
  numPts: number
): Point2D[] {
  // 動脈上の接続点（吻合中心より少し遠位）
  const arteryPt = { x: cx + 5, y: toeY };
  // 静脈外壁の開始点より少し進んだ点
  const veinPt = veinWall[Math.min(5, veinWall.length - 1)];

  const points: Point2D[] = [];
  // 制御点を使ってカーブさせる
  const cp1 = { x: arteryPt.x + 20, y: arteryPt.y };
  const cp2 = { x: veinPt.x + 10, y: veinPt.y + 10 };

  for (let i = 0; i <= numPts; i++) {
    const t = i / numPts;
    points.push(cubicBezier(t, arteryPt, cp1, cp2, veinPt));
  }
  return points;
}

function modifyArteryWallForAnastomosis(
  upperWall: Point2D[],
  cx: number,
  veinRadius: number,
  angleRad: number,
  arteryRadius: number
): Point2D[] {
  // 吻合部の開口幅
  const openingWidth = veinRadius * 2 / Math.sin(angleRad); // 楕円形の長軸
  const halfOpening = openingWidth / 2;

  // ヒールの位置（開口の近位端）
  const heelX = cx - halfOpening * 0.8;
  // トウの位置（開口の遠位端）
  const toeX = cx + halfOpening * 0.8;

  return upperWall.map((p) => {
    if (p.x > heelX && p.x < toeX) {
      // 開口部は描画しない（あるいは凹ませる）
      // ここではWSS計算用に残すが、描画時にマスクされることを想定して
      // 少し内側にオフセットして「穴」を表現
      return { x: p.x, y: p.y + arteryRadius * 0.8 };
    }
    return p;
  });
}

function estimateRecirculationZone(
  cx: number,
  cy: number,
  arteryRadius: number,
  veinRadius: number,
  angleRad: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _scale: number
): Point2D[] {
  // 再循環帯: 吻合部のfloor側（静脈入口の対面壁）
  // 大きさは角度と径比に依存
  const zoneLengthFactor = 1.0 + 1.5 * Math.sin(angleRad);
  const zoneLength = veinRadius * 2 * zoneLengthFactor;
  const zoneWidth = arteryRadius * 0.5;

  // 再循環帯は吻合部の遠位動脈側に延びる
  const points: Point2D[] = [];
  const numPts = 16;
  for (let i = 0; i <= numPts; i++) {
    const t = i / numPts;
    const angle = t * Math.PI;
    points.push({
      x: cx + zoneLength * 0.4 + zoneLength * 0.6 * Math.cos(angle),
      y: cy + arteryRadius * 0.4 - zoneWidth * Math.sin(angle) * (1 - 0.2 * t),
    });
  }
  return points;
}

function generateWallPoints(
  arteryUpper: Point2D[],
  arteryLower: Point2D[],
  veinOuter: Point2D[],
  veinInner: Point2D[],
  veinNormals: Point2D[],
  toeConnection: Point2D[],
  cx: number,
  cy: number,
  arteryRadius: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  angleRad: number
): WallPoint[] {
  const points: WallPoint[] = [];

  // 動脈上壁
  arteryUpper.forEach((p, i) => {
    const t = i / (arteryUpper.length - 1);
    let region: RegionType = 'proximal_artery';
    const dx = p.x - cx;

    if (dx > arteryRadius) region = 'distal_artery';
    else if (Math.abs(dx) < arteryRadius) {
      if (dx < 0) region = 'anastomosis_heel';
      else region = 'anastomosis_toe';
    }

    // 開口部（modifyArteryWallで下げた部分）は除外または特別なタイプ
    if (p.y > cy - arteryRadius + 5) return;

    points.push({
      point: p,
      normal: { x: 0, y: -1 },
      regionType: region,
      paramPosition: t,
    });
  });

  // Toe接続部（追加）
  toeConnection.forEach((p, i) => {
    const t = i / (toeConnection.length - 1);
    points.push({
      point: p,
      normal: { x: Math.cos(Math.PI / 4), y: -Math.sin(Math.PI / 4) }, // 概算
      regionType: 'anastomosis_toe',
      paramPosition: t
    });
  });

  // 動脈下壁
  arteryLower.forEach((p, i) => {
    const t = i / (arteryLower.length - 1);
    let region: RegionType = 'proximal_artery';
    const dx = p.x - cx;

    if (dx > arteryRadius * 0.5) region = 'distal_artery';
    else if (Math.abs(dx) < arteryRadius * 1.5) region = 'anastomosis_floor';

    points.push({
      point: p,
      normal: { x: 0, y: 1 },
      regionType: region,
      paramPosition: t,
    });
  });

  // 静脈外壁
  veinOuter.forEach((p, i) => {
    const t = i / (veinOuter.length - 1);
    // 最初の数点は動脈内に入り込んでいる可能性があるのでスキップ
    if (i < 3) return;

    points.push({
      point: p,
      normal: veinNormals[i], // 計算済みの法線を使用
      regionType: t < 0.2 ? 'anastomosis_outer' : 'vein_outer',
      paramPosition: t,
    });
  });

  // 静脈内壁
  veinInner.forEach((p, i) => {
    const t = i / (veinInner.length - 1);
    // 最初の数点は動脈内に入り込んでいる可能性があるのでスキップ
    if (i < 3) return;

    points.push({
      point: p,
      normal: { x: -veinNormals[i].x, y: -veinNormals[i].y }, // 法線反転
      regionType: t < 0.2 ? 'anastomosis_floor' : 'vein_inner',
      paramPosition: t,
    });
  });

  return points;
}
