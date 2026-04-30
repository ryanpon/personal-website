import { colorSpan, colors } from "../terminal/colors";
import type { ReactNode } from "react";
import { pad } from "../terminal/helpers";
import type { JSX } from "react";

type FlexDirection = 'row' | 'column';
type WrapEnum = 'ERROR' | 'NO_WRAP' | 'WRAP' | 'TRUNCATE';
type BorderStyles = 'none' | 'single' | 'double';
type BorderElems = 'tLeft' | 'tRight' | 'bLeft' | 'bRight' | 'vert' | 'horiz';

const borderStyles: Record<BorderStyles, Record<BorderElems, string>> = {
  none: {
    tLeft: ' ',
    tRight: ' ',
    bLeft: ' ',
    bRight: ' ',
    vert: ' ',
    horiz: ' ',
  },
  single: {
    tLeft: '┌',
    tRight: '┐',
    bLeft: '└',
    bRight: '┘',
    vert: '│',
    horiz: '─',
  },
  double: {
    tLeft: '╔',
    tRight: '╗',
    bLeft: '╚',
    bRight: '╝',
    vert: '║',
    horiz: '═',
  }
};

type RowItems = string | Array<string | JSX.Element>;
type CellRow = [RowItems, string];
export type Props = {
  rows: Array<CellRow>,
  width: number,
  lrPad?: number,
  lMargin?: number,
  tMargin?: number,
  borderColor?: string,
  borderStyle?: BorderStyles,
};

export function Grid({
  rows,
  width,
  lrPad = 1,
  lMargin = 0,
  tMargin = 0,
  borderStyle = 'single',
  borderColor = colors.foreground,
}: Props) {
  const lrPadStr = ' '.repeat(lrPad);
  const totWidth = width + (lrPad * 2);

  const bc = borderStyles[borderStyle];
  const tBorder = colorSpan(bc.tLeft + bc.horiz.repeat(totWidth) + bc.tRight, borderColor);
  const bBorder = colorSpan(bc.bLeft + bc.horiz.repeat(totWidth) + bc.bRight, borderColor);
  const lrBorderCh = colorSpan(bc.vert, borderColor);

  return (
    <div style={{whiteSpace: "pre"}}>
      <div>{tBorder}</div>
      {
        rows.map(([content, color], idx) => {
          const contentWidth = content instanceof Array ?
            content.reduce((sum, entry) => {
              return (
                typeof entry === "string" ?
                  entry.length :
                  entry.props.children.length
              ) + sum;
            }, 0) :
            content.length;
          const rPad = ' '.repeat(Math.max(width - contentWidth, 0));

          return (
            <div key={'r' + idx}>
              {lrBorderCh}{lrPadStr}{colorSpan(content, color, idx)}{rPad}{lrPadStr}{lrBorderCh}
            </div>
          );
        })
      }
      <div>{bBorder}</div>
    </div>
  );
}
