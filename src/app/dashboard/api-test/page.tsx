'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface EndpointTest {
  name: string;
  endpoint: string;
  method: () => Promise<any>;
  status?: 'pending' | 'success' | 'error';
  result?: any;
  error?: string;
}

export default function APITestPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<EndpointTest[]>([
    { name: 'Platform Members', endpoint: '/api/platform/members/', method: () => api.getPlatformMembers() },
    { name: 'Platform Projects', endpoint: '/api/platform/projects/', method: () => api.getPlatformProjects() },
    { name: 'Platform Applications', endpoint: '/api/platform/applications/', method: () => api.getPlatformApplications() },
    { name: 'Community Members', endpoint: '/api/platform/community-members/', method: () => api.getCommunityMembers() },
    { name: 'Research Cohort', endpoint: '/api/platform/research-cohort/', method: () => api.getResearchCohort() },
    { name: 'Education Cohort', endpoint: '/api/platform/education-cohort/', method: () => api.getEducationCohort() },
    { name: 'Analytics Overview', endpoint: '/api/admin/analytics/overview/', method: () => api.getAnalyticsOverview() },
    { name: 'User Analytics', endpoint: '/api/admin/analytics/users/', method: () => api.getUserAnalytics() },
    { name: 'Project Analytics', endpoint: '/api/admin/analytics/projects/', method: () => api.getProjectAnalytics() },
    { name: 'Email Analytics', endpoint: '/api/admin/analytics/emails/', method: () => api.getEmailAnalytics() },
  ]);

  const testAllEndpoints = async () => {
    setTesting(true);
    const updatedResults: EndpointTest[] = [];

    for (const test of results) {
      try {
        const response = await test.method();
        updatedResults.push({
          ...test,
          status: response.data ? 'success' : 'error',
          result: response.data,
          error: response.error,
        });
      } catch (error: any) {
        updatedResults.push({
          ...test,
          status: 'error',
          error: error.message || 'Unknown error',
        });
      }
      setResults([...updatedResults]);
    }

    setTesting(false);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getDataCount = (result: any): string => {
    if (!result) return '';
    if (result.count !== undefined) return `(${result.count} items)`;
    if (result.results?.length) return `(${result.results.length} items)`;
    if (result.total_users !== undefined) return `(${result.total_users} users)`;
    return '(Data received)';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">API Endpoint Tests</h1>
            <p className="text-blue-100 text-lg">
              Testing connection to: <code className="bg-white/20 px-2 py-1 rounded">https://mansa-backend-1rr8.onrender.com</code>
            </p>
          </div>
          <Button
            onClick={testAllEndpoints}
            disabled={testing}
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            {testing ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                Test All Endpoints
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader gradient>
          <CardTitle className="text-xl">Endpoint Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.map((test, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {getStatusIcon(test.status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{test.name}</p>
                    <p className="text-sm text-gray-500 font-mono">{test.endpoint}</p>
                    {test.error && (
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        Error: {test.error}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {test.status === 'success' && (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-bold text-green-700 bg-green-100 rounded-full border border-green-300">
                      ✅ Working {getDataCount(test.result)}
                    </span>
                  )}
                  {test.status === 'error' && (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-bold text-red-700 bg-red-100 rounded-full border border-red-300">
                      ❌ Failed
                    </span>
                  )}
                  {test.status === 'pending' && (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-full border border-blue-300">
                      ⏳ Testing...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {results.some(r => r.status === 'success') && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-sm font-bold text-green-800">
                  {results.filter(r => r.status === 'success').length} / {results.length} endpoints working correctly!
                </p>
              </div>
            </div>
          )}

          {results.some(r => r.status === 'error') && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-bold text-amber-800">
                Some endpoints failed. Make sure you&apos;re logged in with a valid JWT token.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader gradient>
          <CardTitle className="text-xl">Backend Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Production URL</h3>
              <p className="text-sm font-mono bg-gray-100 p-3 rounded-lg border border-gray-200">
                https://mansa-backend-1rr8.onrender.com
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Total Endpoints</h3>
              <p className="text-3xl font-bold text-blue-600">25</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Data Available</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• 120 Platform Members</li>
                <li>• 120 Community Members</li>
                <li>• 18 Projects</li>
                <li>• 41 Applications</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Authentication</h3>
              <p className="text-sm text-gray-700">
                JWT Bearer Token required for all endpoints
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
