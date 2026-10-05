import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export interface ResourcePoint {
  time: string;
  cpuPercent: number;
  memoryUsageMb: number;
}

interface Props {
  data: ResourcePoint[];
  memoryLimitMb: number;
}

export function ResourceChart({ data, memoryLimitMb }: Props) {
  if (data.length < 2) {
    return (
      <div className="text-sm text-muted py-8 text-center">
        Đang thu thập dữ liệu... (cần vài lần đo mới vẽ được biểu đồ)
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="text-xs text-muted mb-2">CPU (%)</div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data}>
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8b9481' }} axisLine={{ stroke: '#333d29' }} />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#8b9481' }}
              axisLine={{ stroke: '#333d29' }}
              width={30}
            />
            <Tooltip
              contentStyle={{ background: '#1c2620', border: '1px solid #333d29', fontSize: 12 }}
              labelStyle={{ color: '#8b9481' }}
              formatter={(value: number) => [`${value}%`, 'CPU']}
            />
            <Line type="monotone" dataKey="cpuPercent" stroke="#6b9b37" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div className="text-xs text-muted mb-2">RAM (MB)</div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data}>
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8b9481' }} axisLine={{ stroke: '#333d29' }} />
            <YAxis
              domain={[0, memoryLimitMb]}
              tick={{ fontSize: 10, fill: '#8b9481' }}
              axisLine={{ stroke: '#333d29' }}
              width={40}
            />
            <Tooltip
              contentStyle={{ background: '#1c2620', border: '1px solid #333d29', fontSize: 12 }}
              labelStyle={{ color: '#8b9481' }}
              formatter={(value: number) => [`${value} MB`, 'RAM']}
            />
            <Line type="monotone" dataKey="memoryUsageMb" stroke="#c78a3d" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
