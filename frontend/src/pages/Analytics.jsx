import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts';
import api from '../api';

const LoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="h-80 bg-slate-100 rounded-xl animate-pulse" />
  </div>
);

const EmptyState = () => (
  <div className="h-80 flex items-center justify-center text-slate-400 text-sm">
    No data available
  </div>
);

const ChartCard = ({ title, children, loading }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="text-sm font-semibold text-slate-900 mb-4">{title}</h3>
    {loading ? <LoadingSkeleton /> : children}
  </div>
);

const PieChartComponent = ({ data }) => {
  if (!data || data.length === 0) return <EmptyState />;
  const COLORS = ['#3B82F6', '#EAB308', '#A855F7', '#EC4899', '#10B981', '#EF4444', '#6B7280'];
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
          {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

const LineChartComponent = ({ data }) => {
  if (!data || data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="applications" stroke="#3B82F6" dot={{ fill: '#3B82F6' }} strokeWidth={2} name="Applications" />
      </LineChart>
    </ResponsiveContainer>
  );
};

const VerticalBarChartComponent = ({ data }) => {
  if (!data || data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="course" stroke="#64748b" style={{ fontSize: '12px' }} />
        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Bar dataKey="rate" fill="#10B981" name="Placement Rate (%)" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const HorizontalBarChartComponent = ({ data }) => {
  if (!data || data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
        <YAxis dataKey="name" type="category" width={140} stroke="#64748b" style={{ fontSize: '12px' }} />
        <Tooltip />
        <Bar dataKey="count" fill="#3B82F6" name="Applications" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ statusCounts: [], monthlyTrend: [], placementByCourse: [], topCompanies: [] });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data: response } = await api.get('/super-admin/analytics');
        setData(response);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setData({ statusCounts: [], monthlyTrend: [], placementByCourse: [], topCompanies: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard title="Application Status Distribution" loading={loading}>
          <PieChartComponent data={data.statusCounts} />
        </ChartCard>
        <ChartCard title="Monthly Application Trend (Last 12 Months)" loading={loading}>
          <LineChartComponent data={data.monthlyTrend} />
        </ChartCard>
        <ChartCard title="Placement Rate by Course" loading={loading}>
          <VerticalBarChartComponent data={data.placementByCourse} />
        </ChartCard>
        <ChartCard title="Top Hiring Companies" loading={loading}>
          <HorizontalBarChartComponent data={data.topCompanies} />
        </ChartCard>
      </div>
    </div>
  );
}