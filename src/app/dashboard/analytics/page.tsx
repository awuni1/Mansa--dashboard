'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { supabase, Member, ProjectApplication } from '@/lib/supabase';
import { BarChart3, TrendingUp, Users, Calendar, MapPin, Briefcase } from 'lucide-react';

interface AnalyticsData {
  totalMembers: number;
  totalApplications: number;
  memberGrowth: number[];
  applicationGrowth: number[];
  membersByLocation: { [key: string]: number };
  membersByProfession: { [key: string]: number };
  applicationsByStatus: { [key: string]: number };
  applicationsByType: { [key: string]: number };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalMembers: 0,
    totalApplications: 0,
    memberGrowth: [],
    applicationGrowth: [],
    membersByLocation: {},
    membersByProfession: {},
    applicationsByStatus: {},
    applicationsByType: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [membersResult, applicationsResult] = await Promise.all([
        supabase.from('members').select('*').order('created_at', { ascending: true }),
        supabase.from('project_applications').select('*').order('created_at', { ascending: true }),
      ]);

      const members = membersResult.data || [];
      const applications = applicationsResult.data || [];

      // Calculate member growth over the last 12 months
      const memberGrowth = calculateMonthlyGrowth(members);
      const applicationGrowth = calculateMonthlyGrowth(applications);

      // Calculate member distribution by location
      const membersByLocation: { [key: string]: number } = {};
      members.forEach(member => {
        const location = member.location || 'Unknown';
        membersByLocation[location] = (membersByLocation[location] || 0) + 1;
      });

      // Calculate member distribution by profession
      const membersByProfession: { [key: string]: number } = {};
      members.forEach(member => {
        const profession = member.profession || 'Unknown';
        membersByProfession[profession] = (membersByProfession[profession] || 0) + 1;
      });

      // Calculate application distribution by status
      const applicationsByStatus: { [key: string]: number } = {};
      applications.forEach(application => {
        const status = application.status || 'pending';
        applicationsByStatus[status] = (applicationsByStatus[status] || 0) + 1;
      });

      // Calculate application distribution by type
      const applicationsByType: { [key: string]: number } = {};
      applications.forEach(application => {
        const type = application.project_type || 'Unknown';
        applicationsByType[type] = (applicationsByType[type] || 0) + 1;
      });

      setAnalytics({
        totalMembers: members.length,
        totalApplications: applications.length,
        memberGrowth,
        applicationGrowth,
        membersByLocation,
        membersByProfession,
        applicationsByStatus,
        applicationsByType,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyGrowth = (data: any[]) => {
    const monthlyData = new Array(12).fill(0);
    const currentDate = new Date();
    
    data.forEach(item => {
      const itemDate = new Date(item.created_at);
      const monthsAgo = Math.floor((currentDate.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      if (monthsAgo >= 0 && monthsAgo < 12) {
        monthlyData[11 - monthsAgo]++;
      }
    });

    return monthlyData;
  };

  const getMonthLabels = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const labels = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      labels.push(months[date.getMonth()]);
    }
    
    return labels;
  };

  const renderBarChart = (data: number[], color: string = 'bg-blue-500') => {
    const maxValue = Math.max(...data, 1);
    
    return (
      <div className="flex items-end space-x-2 h-32">
        {data.map((value, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className={`w-full ${color} rounded-t-sm transition-all hover:opacity-80`}
              style={{ height: `${(value / maxValue) * 100}%` }}
            />
            <span className="text-xs text-gray-600 mt-1 transform rotate-45 origin-bottom-left">
              {getMonthLabels()[index]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderPieChart = (data: { [key: string]: number }, colors: string[]) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    if (total === 0) return <div className="text-gray-500">No data available</div>;

    return (
      <div className="space-y-2">
        {Object.entries(data)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([key, value], index) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}
                />
                <span className="text-sm text-gray-700 truncate max-w-32">
                  {key}
                </span>
              </div>
              <div className="text-sm font-medium">
                {value} ({Math.round((value / total) * 100)}%)
              </div>
            </div>
          ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-2 text-gray-600">Insights and metrics for Mansa to Mansa</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalMembers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-4">
              <Briefcase className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalApplications}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Growth Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.memberGrowth.slice(-1)[0] || 0}
              </p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mr-4">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.applicationsByStatus.pending || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Member Growth (12 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderBarChart(analytics.memberGrowth, 'bg-blue-500')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Application Growth (12 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderBarChart(analytics.applicationGrowth, 'bg-green-500')}
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Members by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPieChart(analytics.membersByLocation, [
              'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'
            ])}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Members by Profession
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPieChart(analytics.membersByProfession, [
              'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500'
            ])}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Applications by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPieChart(analytics.applicationsByStatus, [
              'bg-yellow-500', 'bg-green-500', 'bg-red-500'
            ])}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Applications by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPieChart(analytics.applicationsByType, [
              'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'
            ])}
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((analytics.memberGrowth.reduce((a, b) => a + b, 0) / 12) * 10) / 10}
              </div>
              <div className="text-sm text-gray-600">Avg Monthly Member Growth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.applicationsByStatus.approved || 0}
              </div>
              <div className="text-sm text-gray-600">Approved Applications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(analytics.membersByLocation).length}
              </div>
              <div className="text-sm text-gray-600">Countries Represented</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}