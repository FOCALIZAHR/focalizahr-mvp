import { LineChart, Line, ResponsiveContainer, Cell, BarChart, Bar } from 'recharts';
import type { DepartmentMomentumData } from '@/types';
function MomentumSparklines({ data }: { data: DepartmentMomentumData }) {
  return (
    <div className="w-full h-16 relative">
      {/* Sparkline principal con gradiente */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.sparklineData}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="url(#momentumGradient)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#22D3EE' }}
          />
          <defs>
            <linearGradient id="momentumGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
      
      {/* Indicadores de velocidad */}
      <div className="absolute top-0 right-0 flex gap-1">
        {data.departments.slice(0, 3).map((dept, i) => (
          <div
            key={dept.name}
            className={`w-2 h-2 rounded-full ${
              dept.velocity > 0 ? 'bg-green-400' :
              dept.velocity < -0.5 ? 'bg-red-400' : 'bg-amber-400'
            }`}
            title={`${dept.name}: ${dept.velocity > 0 ? '+' : ''}${dept.velocity.toFixed(1)}/día`}
          />
        ))}
      </div>
    </div>
  );
}