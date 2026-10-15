import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface Point {
  name: string;
  date: string;
  percentage: number;
}

const ScoreTrendChart = ({ data }: { data: Point[] }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
        <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelFormatter={(_, p) => (p?.[0]?.payload as Point | undefined)?.date ?? ""}
          formatter={(v: number) => [`${v}%`, "Score"]}
        />
        <Line
          type="monotone"
          dataKey="percentage"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3, fill: "hsl(var(--primary))" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default ScoreTrendChart;