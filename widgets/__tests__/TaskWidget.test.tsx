import React from 'react';
import { buildWidgetTree } from 'react-native-android-widget/src/api/build-widget-tree';
import { TaskWidget } from '../TaskWidget';
import { layoutFor } from '../widgetLayout';

type Node = { type: string; props: Record<string, any>; children?: Node[] };

function tree(width: number, height: number, label = 'Retrt'): Node {
  return buildWidgetTree(
    <TaskWidget status="active" label={label} width={width} height={height} />
  ) as unknown as Node;
}

function findText(node: Node): Node {
  if (node.type === 'TextWidget' && node.props.text !== 'S') {
    return node;
  }
  for (const child of node.children ?? []) {
    const hit = findText(child);
    if (hit) {
      return hit;
    }
  }
  return undefined as unknown as Node;
}

describe('TaskWidget', () => {
  it('fills whatever bitmap Android draws instead of pinning its own size', () => {
    // The native root is measured from the widget options at draw time. If
    // the tile carried fixed dp from an earlier snapshot, a later resize step
    // would crop it (or leave a transparent margin). match_parent tracks the
    // bitmap exactly, whatever the JS-side numbers were.
    const root = tree(300, 100);
    expect(root.props.width).toBe('match_parent');
    expect(root.props.height).toBe('match_parent');
  });

  it('derives padding, type size and line count from the bounds', () => {
    const text = findText(tree(130, 70, 'Your Next 1thing!'));
    const expected = layoutFor(130, 70, 'Your Next 1thing!');
    expect(text.props.fontSize).toBe(expected.fontSize);
    expect(text.props.lineHeight).toBe(expected.lineHeight);
    expect(text.props.maxLines).toBe(expected.maxLines);
    expect(text.props.truncate).toBe('END');
  });

  it('sizes the type in dp so the fit maths is exact', () => {
    const text = findText(tree(330, 70));
    expect(text.props.allowFontScaling).toBe(false);
  });

  it('uses the tightened chrome on a 2-cell tile', () => {
    const root = tree(130, 70);
    expect(root.props.padding.left).toBe(12);
    expect(root.props.padding.right).toBe(12);
  });
});
