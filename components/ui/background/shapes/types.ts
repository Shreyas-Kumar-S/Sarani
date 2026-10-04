// The whole contract between a floating shape and the thing that moves it.
// A shape is a pure picture: given a box size, a colour and an opacity it
// returns an element. It does not position itself, animate, or know it is
// one of several. Anything that satisfies this (a cloud, a polygon, a
// gradient blob) can be dropped into the background in place of a bubble.
export type ShapeProps = {
  /** Diameter of the shape's bounding box, in dp. */
  size: number;
  color: string;
  opacity: number;
};
