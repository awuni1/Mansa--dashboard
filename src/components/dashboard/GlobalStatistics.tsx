'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Globe, Users, MapPin, TrendingUp, Award, Briefcase } from 'lucide-react';

export interface MemberStatistics {
  id: string;
  name: string;
  country?: string;
  city?: string;
  membershipType?: string;
  gender?: string;
  occupation?: string;
  industry?: string;
}

interface GlobalStatisticsProps {
  members: MemberStatistics[];
  className?: string;
}

const COLORS = {
  primary:    ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  gender:     ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981'],
  occupation: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'],
  country:    ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1'],
};

export default function GlobalStatistics({ members, className = '' }: GlobalStatisticsProps) {
  const membershipStats = useMemo(() => {
    const stats = new Map<string, number>();
    members.forEach(member => {
      const raw = member.membershipType || 'Unspecified';
      const key = raw.trim().toLowerCase();
      const display = key === 'unspecified' ? 'Unspecified' : key.charAt(0).toUpperCase() + key.slice(1);
      stats.set(display, (stats.get(display) || 0) + 1);
    });
    return Array.from(stats.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [members]);

  const genderStats = useMemo(() => {
    const stats = new Map<string, number>();
    members.forEach(member => {
      const raw = member.gender || 'Not specified';
      const gender = raw.trim().toLowerCase();
      const display = gender === 'not specified' ? 'Not specified' : gender.charAt(0).toUpperCase() + gender.slice(1);
      stats.set(display, (stats.get(display) || 0) + 1);
    });
    return Array.from(stats.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [members]);

  const countryStats = useMemo(() => {
    const stats = new Map<string, number>();
    members.forEach(member => {
      if (member.country) {
        const key = member.country.trim().toLowerCase();
        const display = key.charAt(0).toUpperCase() + key.slice(1);
        stats.set(display, (stats.get(display) || 0) + 1);
      }
    });
    return Array.from(stats.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [members]);

  const occupationStats = useMemo(() => {
    const stats = new Map<string, number>();
    members.forEach(member => {
      const raw = member.occupation || member.industry || 'Unspecified';
      const key = raw.trim().toLowerCase();
      const display = key === 'unspecified' ? 'Unspecified' : key.charAt(0).toUpperCase() + key.slice(1);
      stats.set(display, (stats.get(display) || 0) + 1);
    });
    return Array.from(stats.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [members]);

  const totalCountries = useMemo(() =>
    new Set(members.filter(m => m.country).map(m => m.country!.trim().toLowerCase())).size,
  [members]);

  const totalCities = useMemo(() =>
    new Set(members.filter(m => m.city).map(m => `${m.city}, ${m.country}`)).size,
  [members]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / members.length) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
          <p className="text-[13px] font-semibold text-gray-900">{data.name}</p>
          <p className="text-[13px] font-bold text-blue-600">{data.value} members</p>
          <p className="text-[11px] text-gray-500">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>

      {/* ── Summary stat row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Members',   value: members.length,    icon: Users,  bg: 'bg-blue-100',   ic: 'text-blue-600' },
          { label: 'Countries',       value: totalCountries,    icon: Globe,  bg: 'bg-green-100',  ic: 'text-green-600' },
          { label: 'Cities',          value: totalCities,       icon: MapPin, bg: 'bg-amber-100',  ic: 'text-amber-600' },
          { label: 'Member Types',    value: membershipStats.length, icon: TrendingUp, bg: 'bg-purple-100', ic: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, bg, ic }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${ic}`} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Membership Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-gray-400" />
            <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">Membership Distribution</span>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={membershipStats} cx="50%" cy="50%" labelLine={false} label={renderCustomLabel} outerRadius={100} dataKey="value" animationDuration={800}>
                  {membershipStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} formatter={(value, entry: any) => (
                  <span className="text-[12px] font-medium text-gray-700">{value} ({entry.payload.value})</span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">Gender Distribution</span>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={genderStats} cx="50%" cy="50%" labelLine={false} label={renderCustomLabel} outerRadius={100} dataKey="value" animationDuration={800}>
                  {genderStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.gender[index % COLORS.gender.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} formatter={(value, entry: any) => (
                  <span className="text-[12px] font-medium text-gray-700">{value} ({entry.payload.value})</span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">Top 10 Countries</span>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={countryStats} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={800}>
                  {countryStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.country[index % COLORS.country.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Professional Fields */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">Professional Fields</span>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={occupationStats} cx="50%" cy="50%" labelLine={false} label={renderCustomLabel} outerRadius={100} dataKey="value" animationDuration={800}>
                  {occupationStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.occupation[index % COLORS.occupation.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} formatter={(value, entry: any) => (
                  <span className="text-[12px] font-medium text-gray-700">{value} ({entry.payload.value})</span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Detailed Breakdown ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">Detailed Breakdown</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Membership Types */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Membership Types
              </p>
              <div className="space-y-2">
                {membershipStats.map((stat, index) => {
                  const pct = ((stat.value / members.length) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS.primary[index % COLORS.primary.length] }} />
                        <span className="text-gray-700">{stat.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{stat.value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Countries */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Top Countries
              </p>
              <div className="space-y-2">
                {countryStats.slice(0, 5).map((stat, index) => {
                  const pct = ((stat.value / members.length) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS.country[index % COLORS.country.length] }} />
                        <span className="text-gray-700">{stat.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{stat.value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gender */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Gender Breakdown
              </p>
              <div className="space-y-2">
                {genderStats.map((stat, index) => {
                  const pct = ((stat.value / members.length) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS.gender[index % COLORS.gender.length] }} />
                        <span className="text-gray-700">{stat.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{stat.value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
