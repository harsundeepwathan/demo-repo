import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { theme } from "../lib/theme";
import type { MoodPoint } from "../lib/types";

const CHART_HEIGHT = 140;
const CHART_WIDTH = 320;
const PADDING = 16;

export function TrendChart({ points }: { points: MoodPoint[] }) {
  if (points.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Check in a few times and your mood trend will show up here.
        </Text>
      </View>
    );
  }

  const usable = points.slice(-14);
  const minScore = -5;
  const maxScore = 5;
  const innerWidth = CHART_WIDTH - PADDING * 2;
  const innerHeight = CHART_HEIGHT - PADDING * 2;

  const toX = (i: number) =>
    usable.length === 1
      ? PADDING + innerWidth / 2
      : PADDING + (i / (usable.length - 1)) * innerWidth;
  const toY = (score: number) =>
    PADDING + innerHeight - ((score - minScore) / (maxScore - minScore)) * innerHeight;

  const linePoints = usable.map((p, i) => `${toX(i)},${toY(p.averageMood)}`).join(" ");
  const zeroY = toY(0);

  return (
    <View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Line
          x1={PADDING}
          y1={zeroY}
          x2={CHART_WIDTH - PADDING}
          y2={zeroY}
          stroke={theme.panelBorder}
          strokeWidth={1}
        />
        <Polyline points={linePoints} fill="none" stroke={theme.accent} strokeWidth={2.5} />
        {usable.map((p, i) => (
          <Circle
            key={p.date}
            cx={toX(i)}
            cy={toY(p.averageMood)}
            r={i === usable.length - 1 ? 4.5 : 3}
            fill={theme.accent}
          />
        ))}
      </Svg>
      <View style={styles.labels}>
        <Text style={styles.labelText}>{usable[0]?.date.slice(5)}</Text>
        <Text style={styles.labelText}>{usable[usable.length - 1]?.date.slice(5)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: CHART_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    color: theme.textFaint,
    textAlign: "center",
    fontSize: 13,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: PADDING,
  },
  labelText: {
    color: theme.textFaint,
    fontSize: 11,
  },
});
