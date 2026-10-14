import { format } from "date-fns";
import { Trophy, TrendingUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Stat, Tag } from "@/components/strata/ui";
import { exerciseHistory } from "@/lib/train-history";
import type { Workout } from "@/lib/types";

export function ExerciseTrend({ name, workouts }: { name: string; workouts: Workout[] }) {
  const points = exerciseHistory(name, workouts);
  const latest = points.at(-1);
  if (!latest)
    return <p className="text-label text-muted-foreground">No weighted sets recorded yet.</p>;
  const best = Math.max(...points.map((point) => point.estimate));
  const first = points[0];
  const gain = first ? latest.estimate - first.estimate : 0;
  return (
    <div>
      <div className="flex items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <div className="eyebrow">Estimated one-rep max</div>
          <div className="num mt-2 text-display font-bold text-volt">
            {latest.estimate}
            <span className="ml-2 text-title text-muted-foreground">kg</span>
          </div>
        </div>
        {gain > 0 && (
          <Tag tone="volt">
            <TrendingUp className="size-3" /> +{gain} kg
          </Tag>
        )}
      </div>
      <p className="mt-3 text-label text-muted-foreground">
        An estimate from your strongest logged set, not a tested max.
      </p>
      <div className="my-5 grid grid-cols-3 gap-4">
        <Stat size="sm" label="Best max" value={best} unit="kg" />
        <Stat size="sm" label="Sessions" value={points.length} />
        <Stat size="sm" label="Latest set" value={latest.weight} unit={`kg × ${latest.reps}`} />
      </div>
      <div
        className="h-52"
        role="img"
        aria-label={`${name}: estimated one-rep max ${latest.estimate} kilograms, ${gain >= 0 ? "up" : "down"} ${Math.abs(gain)} kilograms across ${points.length} sessions. Trophy markers show new records.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ left: -24, right: 28, top: 24, bottom: 4 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(value) => format(new Date(value), "d MMM")}
              tick={{ fill: "var(--muted-foreground)", fontSize: "var(--text-caption)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={32}
            />
            <YAxis
              domain={["dataMin - 5", "dataMax + 5"]}
              tick={{ fill: "var(--muted-foreground)", fontSize: "var(--text-caption)" }}
              axisLine={false}
              tickLine={false}
              tickCount={3}
              allowDecimals={false}
            />
            <Tooltip
              labelFormatter={(value) => format(new Date(value), "d MMM yyyy")}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                fontSize: "var(--text-label)",
              }}
              formatter={(value: number) => [`${value} kg`, "Estimated max"]}
            />
            <Line
              type="monotone"
              dataKey="estimate"
              stroke="var(--volt)"
              strokeWidth={2.5}
              isAnimationActive={false}
              activeDot={{ r: 5, fill: "var(--volt)", stroke: "var(--background)" }}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (cx == null || cy == null) return <g />;
                return (
                  <g key={payload.id}>
                    {payload.record ? (
                      <>
                        <circle cx={cx} cy={cy} r={7} fill="var(--surface)" stroke="var(--volt)" />
                        <Trophy
                          x={cx - 6}
                          y={cy - 23}
                          width={12}
                          height={12}
                          stroke="var(--volt)"
                          strokeWidth={1.75}
                        />
                      </>
                    ) : (
                      <circle cx={cx} cy={cy} r={3} fill="var(--volt)" />
                    )}
                  </g>
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-5 border-t border-border">
        {[...points]
          .reverse()
          .slice(0, 8)
          .map((point) => (
            <div
              key={point.id}
              className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0"
            >
              <div>
                <div className="text-label font-semibold">
                  {format(new Date(point.date), "EEE, d MMM")}
                </div>
                <div className="num mt-1 text-caption text-muted-foreground">
                  {point.weight} kg × {point.reps} reps
                </div>
              </div>
              <div className="flex items-center gap-2">
                {point.record && (
                  <Trophy aria-label="New estimated-max record" className="size-4 text-volt" />
                )}
                <span className="num text-label font-semibold">{point.estimate} kg</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
