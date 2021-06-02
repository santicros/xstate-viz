import { useSelector, useService } from '@xstate/react';
import React, { useContext, useMemo } from 'react';
import { SimulationContext } from './App';
import { useGetRect } from './getRect';
import { getPath, LPathParam, pathToD, Point, SvgPath } from './pathUtils';
import './EdgeViz.scss';
import { ArrowMarker } from './ArrowMarker';
import { DirectedGraphEdge } from './directedGraph';

function translatePoint(point: Point, vector: Point): Point {
  return {
    x: point.x + vector.x,
    y: point.y + vector.y,
  };
}

function translate(path: SvgPath, vector: Point): SvgPath {
  return path.map((cmd) => {
    switch (cmd[0]) {
      case 'M':
        return ['M', translatePoint(cmd[1], vector)];
      case 'L':
        return ['L', translatePoint(cmd[1], vector)];
      default:
        return cmd;
    }
  }) as SvgPath;
}

export const EdgeViz: React.FC<{ edge: DirectedGraphEdge; order: number }> = ({
  edge,
  order,
}) => {
  const service = useContext(SimulationContext);
  const isActive = useSelector(service, (state) => {
    return state.context.state.configuration.includes(edge.source) || undefined;
  });
  const sourceRect = useGetRect(`${edge.source.id}`);
  const edgeRect = useGetRect(edge.id);
  const targetRect = useGetRect(`${edge.target.id}`);

  if (!sourceRect || !targetRect || !edgeRect) {
    return null;
  }

  let path: SvgPath | undefined;

  if (edge.sections.length) {
    const section = edge.sections[0];

    path = [
      ['M', section.startPoint],
      ...(section.bendPoints?.map(
        (point: Point) => ['L', point] as LPathParam,
      ) || []),
    ];

    const preLastPoint = path[path.length - 1][1]!;
    const xSign = Math.sign(section.endPoint.x - preLastPoint.x);
    const ySign = Math.sign(section.endPoint.y - preLastPoint.y);
    const endPoint = {
      x: section.endPoint.x - 5 * xSign,
      y: section.endPoint.y - 5 * ySign,
    };
    path.push(['L', endPoint]);
  } else {
    path = getPath(sourceRect, edgeRect, targetRect);
  }

  const markerId = `${edge.source.order}-${order}`;

  return path ? (
    <g data-viz="edgeGroup" data-viz-edge={edge.id} data-viz-active={isActive}>
      <defs>
        <ArrowMarker id={markerId} />
      </defs>
      <path
        stroke="#fff4"
        strokeWidth={2}
        fill="none"
        d={pathToD(path)}
        data-viz="edge"
        markerEnd={`url(#${markerId})`}
      ></path>
    </g>
  ) : null;
};