import { layoutFor, TILE } from '../widgetLayout';

const NEXT = 'Your Next 1thing!';
const LONG = 'Finish the quarterly report and send it to Priya before lunch';

describe('layoutFor', () => {
  it('keeps the full-size type and generous padding on a 3x1 tile', () => {
    const l = layoutFor(330, 70, NEXT);
    expect(l.fontSize).toBe(TILE.fontMax);
    expect(l.paddingX).toBe(TILE.padding);
    expect(l.paddingY).toBe(TILE.padding);
    expect(l.gap).toBe(TILE.gap);
    expect(l.maxLines).toBe(1);
  });

  it('tightens the chrome on a narrow tile', () => {
    const l = layoutFor(130, 70, NEXT);
    expect(l.paddingX).toBe(TILE.paddingXMin);
    expect(l.gap).toBe(TILE.gapMin);
  });

  // Cell widths below follow Android's 73n-16 dp formula for a 5-column
  // handset grid: 2 cells = 130dp, 3 cells = 203dp. The 110dp minWidth in
  // app.json means the tile can never be a single cell.
  it('gives vertical padding up before shrinking the type, so a 3-cell tile wraps', () => {
    const l = layoutFor(200, 70, NEXT);
    expect(l.fontSize).toBe(TILE.fontMax);
    expect(l.maxLines).toBe(2);
    expect(l.paddingY).toBeLessThan(TILE.padding);
    expect(l.paddingY).toBeGreaterThanOrEqual(TILE.paddingYMin);
  });

  it('wraps and steps the type down together on a 2-cell tile rather than ellipsising', () => {
    const l = layoutFor(130, 70, NEXT);
    expect(l.maxLines).toBe(2);
    expect(l.fontSize).toBeLessThan(TILE.fontMax);
    expect(l.fontSize).toBeGreaterThan(TILE.fontMin);
    expect(l.paddingY * 2 + l.maxLines * l.lineHeight).toBeLessThanOrEqual(70);
  });

  it('shrinks the type when wrapping alone cannot fit the copy', () => {
    const l = layoutFor(130, 46, NEXT);
    expect(l.fontSize).toBeLessThan(TILE.fontMax);
    expect(l.fontSize).toBeGreaterThanOrEqual(TILE.fontMin);
    expect(l.paddingY * 2 + l.maxLines * l.lineHeight).toBeLessThanOrEqual(46);
  });

  it('never goes below the floor size; leftover copy is for the ellipsis', () => {
    const l = layoutFor(110, 40, LONG);
    expect(l.fontSize).toBe(TILE.fontMin);
    expect(l.maxLines).toBeGreaterThanOrEqual(1);
    expect(l.paddingY * 2 + l.maxLines * l.lineHeight).toBeLessThanOrEqual(40);
  });

  it('lets a long label wrap across a tall tile at full size', () => {
    const l = layoutFor(330, 150, LONG);
    expect(l.fontSize).toBe(TILE.fontMax);
    expect(l.maxLines).toBeGreaterThanOrEqual(3);
  });

  it('scales the line box with the type', () => {
    expect(layoutFor(330, 70, NEXT).lineHeight).toBe(25);
    expect(layoutFor(110, 40, LONG).lineHeight).toBeLessThan(25);
  });

  it('fits a single line at the 40dp minimum height', () => {
    const l = layoutFor(330, 40, NEXT);
    expect(l.fontSize).toBe(TILE.fontMax);
    expect(l.maxLines).toBe(1);
    expect(l.paddingY * 2 + l.lineHeight).toBeLessThanOrEqual(40);
  });

  it('survives degenerate bounds', () => {
    const l = layoutFor(0, 0, NEXT);
    expect(l.maxLines).toBe(1);
    expect(l.fontSize).toBe(TILE.fontMin);
  });
});
