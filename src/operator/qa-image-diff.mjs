import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import {
  buildImageHotspots,
  emptyImageDiffSummary,
  imageDiffResult
} from './shared.mjs';

export async function checkImageDiff(options) {
  const { reference, actual, threshold = 0 } = options;
  const parsedThreshold = Number(threshold);
  if (!Number.isFinite(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > 1) {
    throw new Error('Invalid --threshold; expected a number from 0 to 1.');
  }
  const referencePath = path.resolve(reference);
  const actualPath = path.resolve(actual);
  const conflicts = [];
  const warnings = [];
  if (!referencePath.toLowerCase().endsWith('.png')) {
    conflicts.push({
      id: 'qa.image-diff.unsupported-reference',
      message: 'Reference image must be a PNG file.',
      paths: [referencePath]
    });
  }
  if (!actualPath.toLowerCase().endsWith('.png')) {
    conflicts.push({
      id: 'qa.image-diff.unsupported-actual',
      message: 'Actual image must be a PNG file.',
      paths: [actualPath]
    });
  }
  if (!existsSync(referencePath)) {
    conflicts.push({
      id: 'qa.image-diff.reference-missing',
      message: 'Reference image does not exist.',
      paths: [referencePath]
    });
  }
  if (!existsSync(actualPath)) {
    conflicts.push({
      id: 'qa.image-diff.actual-missing',
      message: 'Actual image does not exist.',
      paths: [actualPath]
    });
  }
  if (conflicts.length > 0) {
    return imageDiffResult({ referencePath, actualPath, threshold: parsedThreshold, summary: emptyImageDiffSummary(), hotspots: [], warnings, conflicts });
  }

  let referencePng;
  let actualPng;
  try {
    referencePng = PNG.sync.read(await readFile(referencePath));
    actualPng = PNG.sync.read(await readFile(actualPath));
  } catch (error) {
    conflicts.push({
      id: 'qa.image-diff.png-parse',
      message: `Failed to parse PNG image: ${error.message}`,
      paths: [referencePath, actualPath]
    });
    return imageDiffResult({ referencePath, actualPath, threshold: parsedThreshold, summary: emptyImageDiffSummary(), hotspots: [], warnings, conflicts });
  }

  if (referencePng.width !== actualPng.width || referencePng.height !== actualPng.height) {
    conflicts.push({
      id: 'qa.image-diff.dimension-mismatch',
      message: `Image dimensions differ: ${referencePng.width}x${referencePng.height} vs ${actualPng.width}x${actualPng.height}.`,
      paths: [referencePath, actualPath]
    });
    return imageDiffResult({
      referencePath,
      actualPath,
      threshold: parsedThreshold,
      summary: {
        width: referencePng.width,
        height: referencePng.height,
        actualWidth: actualPng.width,
        actualHeight: actualPng.height,
        totalPixels: 0,
        changedPixels: 0,
        diffRatio: 1,
        similarityScore: 0,
        threshold: parsedThreshold
      },
      hotspots: [],
      warnings,
      conflicts
    });
  }

  const width = referencePng.width;
  const height = referencePng.height;
  const totalPixels = width * height;
  let changedPixels = 0;
  const changed = new Uint8Array(totalPixels);
  for (let index = 0; index < totalPixels; index += 1) {
    const offset = index * 4;
    const different = referencePng.data[offset] !== actualPng.data[offset] ||
      referencePng.data[offset + 1] !== actualPng.data[offset + 1] ||
      referencePng.data[offset + 2] !== actualPng.data[offset + 2] ||
      referencePng.data[offset + 3] !== actualPng.data[offset + 3];
    if (different) {
      changed[index] = 1;
      changedPixels += 1;
    }
  }
  const diffRatio = totalPixels === 0 ? 0 : changedPixels / totalPixels;
  const summary = {
    width,
    height,
    totalPixels,
    changedPixels,
    diffRatio,
    similarityScore: 1 - diffRatio,
    threshold: parsedThreshold
  };
  const hotspots = buildImageHotspots({ changed, width, height });
  return imageDiffResult({ referencePath, actualPath, threshold: parsedThreshold, summary, hotspots, warnings, conflicts });
}
