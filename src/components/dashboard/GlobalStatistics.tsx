'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
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
  primary: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  gender: ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981'],
  occupation: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'],
  country: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1'],
};

export default function GlobalStatistics({ members, className = '' }: GlobalStatisticsProps) {
  // Process membership type statistics
  const membershipStats = useMemo(() => {
    const stats = new Map<string, number>();
    members.forEach(member => {
      const type = member.membershipType || 'Unspecified';
      stats.set(type, (stats.get(type) || 0) + 1);
    });
    return Array.from(stats.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [members]);

  // Process gender statistics
  const genderStats = useMemo(() => {
    const stats = new Map<string, number>();
    members.forEach(member => {
      const gender = member.gender || 'Not specified';
      stats.set(gender, (stats.get(gender) || 0) + 1);
    });
    return Array.from(stats.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [members]);

  // Process country distribution (top 10)
  const countryStats = useMemo(() => {
    const stats = new Map<string, number>();
    members.forEach(member => {
      if (member.country) {
        const country = member.country.trim();
        stats.set(country, (stats.get(country) || 0) + 1);
      }
    });
    return Array.from(stats.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [members]);

  // Process occupation/industry statistics (top 8)
  const occupationStats = useMemo(() => {
    const stats = new Map<string, number>();
    members.forEach(member => {
      const occ = member.occupation || member.industry || 'Unspecified';
      if (occ) {
        stats.set(occ, (stats.get(occ) || 0) + 1);
      }
    });
    return Array.from(stats.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [members]);

  // Calculate key metrics
  const totalCountries = useMemo(() => {
    return new Set(members.filter(m => m.country).map(m => m.country)).size;
  }, [members]);

  const totalCities = useMemo(() => {
    return new Set(members.filter(m => m.city).map(m => `${m.city}, ${m.country}`)).size;
  }, [members]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / members.length) * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border-2 border-blue-500">
          <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-blue-600 dark:text-blue-400 font-bold">{data.value} members</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-bold text-sm"
        style={{ textShadow: '0 0 3px rgba(0,0,0,0.8)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Key Metrics */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-none shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Globe className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Global Member Statistics</h2>
              <p className="text-blue-100">Comprehensive analytics and insights</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <Users className="h-6 w-6 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{members.length}</div>
              <div className="text-sm text-blue-100">Total Members</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <Globe className="h-6 w-6 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{totalCountries}</div>
              <div className="text-sm text-blue-100">Countries</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <MapPin className="h-6 w-6 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{totalCities}</div>
              <div className="text-sm text-blue-100">Cities</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <TrendingUp className="h-6 w-6 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{membershipStats.length}</div>
              <div className="text-sm text-blue-100">Member Types</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership Type Distribution */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Membership Distribution</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">By membership type</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={membershipStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {membershipStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-sm font-medium">{value} ({entry.payload.value})</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Gender Distribution</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Member demographics</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {genderStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.gender[index % COLORS.gender.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-sm font-medium">{value} ({entry.payload.value})</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Countries Bar Chart */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Top 10 Countries</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Highest member concentration</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryStats} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={800}>
                  {countryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.country[index % COLORS.country.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Occupation/Industry Distribution */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Briefcase className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Professional Fields</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Top occupations & industries</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={occupationStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {occupationStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.occupation[index % COLORS.occupation.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-sm font-medium text-xs">{value} ({entry.payload.value})</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics Table */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-900">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Detailed Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Membership Types */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Membership Types
              </h3>
              <div className="space-y-2">
                {membershipStats.map((stat, index) => {
                  const percentage = ((stat.value / members.length) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS.primary[index % COLORS.primary.length] }}
                        />
                        <span className="text-gray-700 dark:text-gray-300">{stat.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {stat.value} ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Countries */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Top Countries
              </h3>
              <div className="space-y-2">
                {countryStats.slice(0, 5).map((stat, index) => {
                  const percentage = ((stat.value / members.length) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS.country[index % COLORS.country.length] }}
                        />
                        <span className="text-gray-700 dark:text-gray-300">{stat.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {stat.value} ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gender Stats */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gender Breakdown
              </h3>
              <div className="space-y-2">
                {genderStats.map((stat, index) => {
                  const percentage = ((stat.value / members.length) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS.gender[index % COLORS.gender.length] }}
                        />
                        <span className="text-gray-700 dark:text-gray-300">{stat.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {stat.value} ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
