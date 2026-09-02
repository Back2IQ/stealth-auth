/**
 * Back2IQ StealthAuth - 3x3 Geometric Matrix Grid Engine
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 * 
 * Generates a 3x3 challenge matrix where the user traverses
 * their secret geometric path (Diagonal, Horizontal, Vertical, Zigzag, Cross)
 */

import { GridTraversalPath } from '../types.js';

/**
 * Generates a deterministic 3x3 matrix based on counter and cycle
 */
export function generate3x3GridMatrix(counter: number, cycle = 0): string[][] {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const grid: string[][] = [];

  for (let r = 0; r < 3; r++) {
    const row: string[] = [];
    for (let c = 0; c < 3; c++) {
      const charIndex = ((counter * 7) + (cycle * 13) + (r * 3 + c) * 5) % chars.length;
      row.push(chars[charIndex]);
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Traverses a 3x3 matrix along a specified geometric path
 */
export function traverse3x3Grid(grid: string[][], path: GridTraversalPath): string {
  if (!grid || grid.length < 3 || grid[0].length < 3) {
    return 'SEC';
  }

  switch (path) {
    case 'diagonal-main':
      // Top-Left to Bottom-Right: (0,0), (1,1), (2,2)
      return `${grid[0][0]}${grid[1][1]}${grid[2][2]}`;

    case 'diagonal-anti':
      // Top-Right to Bottom-Left: (0,2), (1,1), (2,0)
      return `${grid[0][2]}${grid[1][1]}${grid[2][0]}`;

    case 'row-1':
      return `${grid[0][0]}${grid[0][1]}${grid[0][2]}`;
    case 'row-2':
      return `${grid[1][0]}${grid[1][1]}${grid[1][2]}`;
    case 'row-3':
      return `${grid[2][0]}${grid[2][1]}${grid[2][2]}`;

    case 'col-1':
      return `${grid[0][0]}${grid[1][0]}${grid[2][0]}`;
    case 'col-2':
      return `${grid[0][1]}${grid[1][1]}${grid[2][1]}`;
    case 'col-3':
      return `${grid[0][2]}${grid[1][2]}${grid[2][2]}`;

    case 'cross-center':
      // Center column + center row cross: (0,1), (1,1), (2,1), (1,0), (1,2)
      return `${grid[0][1]}${grid[1][1]}${grid[2][1]}`;

    case 'perimeter-clockwise':
      return `${grid[0][0]}${grid[0][1]}${grid[0][2]}${grid[1][2]}${grid[2][2]}${grid[2][1]}${grid[2][0]}${grid[1][0]}`;

    case 'zigzag-horizontal':
      return `${grid[0][0]}${grid[0][1]}${grid[0][2]}${grid[1][2]}${grid[1][1]}${grid[1][0]}${grid[2][0]}${grid[2][1]}${grid[2][2]}`;

    case 'zigzag-vertical':
      return `${grid[0][0]}${grid[1][0]}${grid[2][0]}${grid[2][1]}${grid[1][1]}${grid[0][1]}${grid[0][2]}${grid[1][2]}${grid[2][2]}`;

    default:
      return `${grid[0][0]}${grid[1][1]}${grid[2][2]}`;
  }
}

/**
 * Formats 3x3 matrix into a clean ASCII/UI badge
 */
export function formatGridMatrixAscii(grid: string[][]): string {
  const line1 = grid[0].join(' | ');
  const line2 = grid[1].join(' | ');
  const line3 = grid[2].join(' | ');
  return `[ ${line1} / ${line2} / ${line3} ]`;
}
