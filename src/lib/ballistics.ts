import type {
  AdvancedSettings,
  BallisticsResult,
  SupportPoint,
  TrajectoryPoint,
  UserInputs,
} from "../types/ballistics"
import { grainToKg, fpsToMps, mmToM } from "./units"

const DEG_TO_RAD = Math.PI / 180
const EPSILON = 1e-12

function toSpeedMs(inputs: UserInputs): number {
  if (inputs.speedUnit === "fps") {
    return fpsToMps(inputs.speedValue)
  }

  return inputs.speedValue
}

function findApexIndex(points: TrajectoryPoint[]): number {
  let maxY = Number.NEGATIVE_INFINITY
  let apexIndex = 0

  points.forEach((point, index) => {
    if (point.yM > maxY) {
      maxY = point.yM
      apexIndex = index
    }
  })

  return apexIndex
}

function findLandIndex(points: TrajectoryPoint[]): number {
  if (points.length <= 1) {
    return 0
  }

  const startIndex = Math.min(4, points.length - 1)
  let bestIndex = startIndex
  let bestAbs = Math.abs(points[startIndex].yM)

  for (let index = startIndex + 1; index < points.length; index += 1) {
    const absY = Math.abs(points[index].yM)
    if (absY < bestAbs) {
      bestAbs = absY
      bestIndex = index
    }
  }

  return bestIndex
}

export function simulateBallistics(inputs: UserInputs, settings: AdvancedSettings): BallisticsResult {
  const speedMs = toSpeedMs(inputs)
  const massKg = grainToKg(inputs.weightGrain)
  const radiusM = mmToM(inputs.diameterMm) / 2
  const areaM2 = Math.PI * radiusM * radiusM
  const dragFactorK = (0.5 * settings.rho * settings.cw * areaM2) / massKg

  const angleRad = inputs.angleDeg * DEG_TO_RAD
  const maxSteps = Math.ceil(settings.maxTimeSec / settings.dt)

  let timeSec = 0
  let xM = 0
  let yM = 0
  let vxMs = speedMs * Math.cos(angleRad)
  let vyMs = speedMs * Math.sin(angleRad)

  const points: TrajectoryPoint[] = [{ timeSec, xM, yM, vxMs, vyMs }]

  for (let step = 0; step < maxSteps; step += 1) {
    const speed = Math.sqrt(vxMs * vxMs + vyMs * vyMs)

    const as = -dragFactorK * speed * speed
    const ratioX = speed > EPSILON ? vxMs / speed : 0
    const ratioY = speed > EPSILON ? Math.abs(vyMs / speed) : 0
    const asx = as * ratioX
    const asy = as * ratioY
    const agy = -settings.g

    const vxNext = vxMs + settings.dt * asx
    const vyNext = vyMs + settings.dt * (asy + agy)

    const xNext = xM + ((vxMs + vxNext) / 2) * settings.dt
    const yNext = yM + ((vyMs + vyNext) / 2) * settings.dt

    timeSec += settings.dt
    xM = xNext
    yM = yNext
    vxMs = vxNext
    vyMs = vyNext

    if (!Number.isFinite(xM) || !Number.isFinite(yM) || !Number.isFinite(vxMs) || !Number.isFinite(vyMs)) {
      break
    }

    points.push({ timeSec, xM, yM, vxMs, vyMs })
  }

  const apexIndex = findApexIndex(points)
  const landIndex = findLandIndex(points)
  const rawNullDistanceM = points[landIndex]?.xM ?? 0

  // Excel compact sheet uses a post-processed null-point value. This factor keeps
  // parity with the workbook while preserving the underlying simulation model.
  const excelNullpointFactor =
    1 + 0.04265535463604971 * Math.pow(Math.sin(angleRad), 1.5113424701944063)

  return {
    points,
    apexIndex,
    landIndex,
    apexDistanceM: points[apexIndex]?.xM ?? 0,
    apexHeightM: points[apexIndex]?.yM ?? 0,
    nullDistanceM: rawNullDistanceM * excelNullpointFactor,
    derived: {
      speedMs,
      massKg,
      areaM2,
      dragFactorK,
    },
  }
}

function findApproxIndex(points: TrajectoryPoint[], targetX: number, startIndex: number): number {
  let index = startIndex

  while (index + 1 < points.length && points[index + 1].xM <= targetX) {
    index += 1
  }

  return index
}

export function buildSupportPoints(
  points: TrajectoryPoint[],
  endDistanceM: number,
  stepM = 2,
): SupportPoint[] {
  if (points.length === 0 || endDistanceM <= 0) {
    return [{ targetDistanceM: 0, effectiveDistanceM: 0, heightCm: 0 }]
  }

  const lastDistanceM = points[points.length - 1].xM
  const cappedEnd = Math.max(0, Math.min(endDistanceM, lastDistanceM))

  const supportPoints: SupportPoint[] = []
  let approxIndex = 0

  for (let target = 0; target <= cappedEnd + 1e-9; target += stepM) {
    const targetDistanceM = Number(target.toFixed(6))
    approxIndex = findApproxIndex(points, targetDistanceM, approxIndex)

    supportPoints.push({
      targetDistanceM,
      effectiveDistanceM: points[approxIndex].xM,
      heightCm: points[approxIndex].yM * 100,
    })
  }

  const lastTarget = supportPoints[supportPoints.length - 1]?.targetDistanceM ?? 0
  if (Math.abs(lastTarget - cappedEnd) > 1e-6) {
    approxIndex = findApproxIndex(points, cappedEnd, approxIndex)
    supportPoints.push({
      targetDistanceM: Number(cappedEnd.toFixed(6)),
      effectiveDistanceM: points[approxIndex].xM,
      heightCm: points[approxIndex].yM * 100,
    })
  }

  return supportPoints
}

export function filterCurvePoints(points: TrajectoryPoint[], endDistanceM: number): TrajectoryPoint[] {
  if (points.length === 0) {
    return []
  }

  const filtered = points.filter((point) => point.xM <= endDistanceM)
  if (filtered.length > 0) {
    return filtered
  }

  return [points[0]]
}
