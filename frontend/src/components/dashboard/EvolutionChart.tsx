import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { formatDate } from "../../helpers";

type DataPoint = {
    date: string;
    [key: string]: number | string;
};

type Props = {
    data: DataPoint[];
    lines: {
        key: string;
        color: string;
        name: string;
    }[];
    title: string;
};

export function EvolutionChart({ data, lines, title }: Props) {
    // Sort data by date ascending for the chart
    const chartData = [...data].sort((a, b) => a.date.localeCompare(b.date));

    return (
        <div className="page-card stack-gap-sm">
            <h4>{title}</h4>
            <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid stroke="#eee" strokeDasharray="5 5" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(val) => formatDate(val)}
                            tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                            stroke="var(--border)"
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                            stroke="var(--border)"
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--panel)",
                                borderRadius: "8px",
                                border: "1px solid var(--border)",
                                boxShadow: "var(--shadow-md)",
                            }}
                            labelFormatter={(label) => formatDate(label)}
                        />
                        {lines.map((line) => (
                            <Line
                                key={line.key}
                                type="monotone"
                                dataKey={line.key}
                                stroke={line.color}
                                name={line.name}
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
