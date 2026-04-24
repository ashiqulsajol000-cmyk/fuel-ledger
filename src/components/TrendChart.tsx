import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { colors, spacing, typography } from '../theme';

type Point = { x: number; y: number };

type Props = {
  data: Point[];
  height?: number;
  unit?: string;
  color?: string;
};

export function TrendChart({
  data,
  height = 180,
  unit = '',
  color = colors.gold,
}: Props) {
  const [width, setWidth] = React.useState(0);

  if (data.length === 0 || width === 0) {
    return (
      <View
        style={{ height }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {width === 0 ? null : (
          <Text style={{ color: colors.textMuted, ...typography.caption }}>
            Not enough data.
          </Text>
        )}
      </View>
    );
  }

  const padding = { top: 20, right: 8, bottom: 22, left: 36 };
  const w = width;
  const h = height;
  const innerW = w - padding.left - padding.right;
  const innerH = h - padding.top - padding.bottom;

  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padY = (maxY - minY) * 0.2 || 1;
  const y0 = Math.max(0, minY - padY);
  const y1 = maxY + padY;

  const singlePoint = data.length < 2;
  const toX = (x: number) =>
    singlePoint
      ? padding.left + innerW / 2
      : padding.left + ((x - minX) / Math.max(1, maxX - minX)) * innerW;
  const toY = (y: number) =>
    padding.top + (1 - (y - y0) / (y1 - y0)) * innerH;

  const pathD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.x)} ${toY(d.y)}`)
    .join(' ');
  const fillD =
    `M ${toX(data[0].x)} ${toY(data[0].y)} ` +
    data
      .slice(1)
      .map((d) => `L ${toX(d.x)} ${toY(d.y)}`)
      .join(' ') +
    ` L ${toX(data[data.length - 1].x)} ${padding.top + innerH} ` +
    ` L ${toX(data[0].x)} ${padding.top + innerH} Z`;

  const yTicks = 3;
  const tickVals = Array.from(
    { length: yTicks },
    (_, i) => y0 + ((y1 - y0) * i) / (yTicks - 1),
  );

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Svg width={w} height={h}>
        <Defs>
          <SvgGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.35" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </SvgGradient>
        </Defs>
        {tickVals.map((v, i) => (
          <Path
            key={i}
            d={`M ${padding.left} ${toY(v)} L ${padding.left + innerW} ${toY(v)}`}
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        <Path d={fillD} fill="url(#fill)" />
        <Path
          d={pathD}
          stroke={color}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <Circle
            key={i}
            cx={toX(d.x)}
            cy={toY(d.y)}
            r={3}
            fill={color}
            stroke={colors.bg}
            strokeWidth={1.5}
          />
        ))}
      </Svg>
      <View style={[styles.labels, { left: 0, top: padding.top - 10 }]}>
        {tickVals
          .slice()
          .reverse()
          .map((v, i) => (
            <Text key={i} style={styles.tick}>
              {v.toFixed(1)}
              {unit ? ` ${unit}` : ''}
            </Text>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    position: 'absolute',
    height: '100%',
    justifyContent: 'space-between',
    paddingBottom: 24,
    paddingRight: 4,
    width: 36,
  },
  tick: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 10,
    textAlign: 'right',
    marginRight: spacing.xs,
  },
});
