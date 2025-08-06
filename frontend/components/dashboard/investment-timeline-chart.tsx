'use client'

import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface InvestmentTimelineChartProps {
  data: Array<{ year: number; amount: number; count: number }>
}

export function InvestmentTimelineChart({ data }: InvestmentTimelineChartProps) {
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'amount' 
                ? `Investment Volume: ${formatCurrency(entry.value)}`
                : `Deal Count: ${formatNumber(entry.value)}`
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            yAxisId="amount"
            orientation="left"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCurrency(value).replace('.0', '')}
          />
          <YAxis 
            yAxisId="count"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={customTooltip} />
          <Legend />
          <Area
            yAxisId="amount"
            type="monotone"
            dataKey="amount"
            fill="hsl(var(--chart-1))"
            fillOpacity={0.3}
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            name="Investment Volume"
          />
          <Bar
            yAxisId="count"
            dataKey="count"
            fill="hsl(var(--chart-2))"
            opacity={0.8}
            name="Deal Count"
            radius={[2, 2, 0, 0]}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}