import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface DashboardData {
  totalCost: number;
  monthlyCost: number;
  totalLicenses: number;
  activeLicenses: number;
  inactiveLicenses: number;
  potentialSavings: number;
  topApplications: Array<{
    applicationId: string;
    applicationName: string;
    totalCost: number;
    licenseCount: number;
    activeUsers: number;
    utilizationRate: number;
  }>;
  costTrends: Array<{
    date: Date;
    totalCost: number;
    newLicenses: number;
    cancelledLicenses: number;
  }>;
  utilizationByDepartment: Array<{
    department: string;
    totalCost: number;
    licenseCount: number;
    utilizationRate: number;
    topApplications: string[];
  }>;
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    createdAt: Date;
    applicationId?: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/analytics/dashboard');
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockData: DashboardData = {
        totalCost: 125000,
        monthlyCost: 10416.67,
        totalLicenses: 450,
        activeLicenses: 387,
        inactiveLicenses: 63,
        potentialSavings: 18500,
        topApplications: [
          {
            applicationId: '1',
            applicationName: 'Microsoft 365',
            totalCost: 45000,
            licenseCount: 150,
            activeUsers: 142,
            utilizationRate: 94.7
          },
          {
            applicationId: '2',
            applicationName: 'Slack',
            totalCost: 18000,
            licenseCount: 120,
            activeUsers: 98,
            utilizationRate: 81.7
          },
          {
            applicationId: '3',
            applicationName: 'Adobe Creative Cloud',
            totalCost: 24000,
            licenseCount: 40,
            activeUsers: 35,
            utilizationRate: 87.5
          }
        ],
        costTrends: [
          { date: new Date('2024-01-01'), totalCost: 118000, newLicenses: 5, cancelledLicenses: 2 },
          { date: new Date('2024-02-01'), totalCost: 120000, newLicenses: 8, cancelledLicenses: 1 },
          { date: new Date('2024-03-01'), totalCost: 125000, newLicenses: 12, cancelledLicenses: 3 }
        ],
        utilizationByDepartment: [
          {
            department: 'Engineering',
            totalCost: 45000,
            licenseCount: 120,
            utilizationRate: 92.5,
            topApplications: ['GitHub', 'Jira', 'Slack']
          },
          {
            department: 'Marketing',
            totalCost: 32000,
            licenseCount: 85,
            utilizationRate: 78.2,
            topApplications: ['Adobe Creative Cloud', 'HubSpot', 'Canva']
          }
        ],
        recentAlerts: [
          {
            id: '1',
            type: 'unused_license',
            severity: 'warning',
            title: 'Unused Adobe License',
            message: 'John Doe has not used Adobe Creative Cloud for 45 days',
            createdAt: new Date(),
            applicationId: '3'
          }
        ]
      };

      setDashboardData(mockData);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  // Chart configurations
  const costTrendData = {
    labels: dashboardData.costTrends.map(trend => 
      trend.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    ),
    datasets: [
      {
        label: 'Total Cost ($)',
        data: dashboardData.costTrends.map(trend => trend.totalCost),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const utilizationData = {
    labels: ['Active Licenses', 'Inactive Licenses'],
    datasets: [
      {
        data: [dashboardData.activeLicenses, dashboardData.inactiveLicenses],
        backgroundColor: ['#10B981', '#EF4444'],
        borderWidth: 0,
      },
    ],
  };

  const topAppsData = {
    labels: dashboardData.topApplications.map(app => app.applicationName),
    datasets: [
      {
        label: 'Annual Cost ($)',
        data: dashboardData.topApplications.map(app => app.totalCost),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">IT Cost Analyzer Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor and optimize your SaaS spending</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">$</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Annual Cost</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${dashboardData.totalCost.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">L</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Licenses</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.totalLicenses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">!</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Inactive Licenses</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.inactiveLicenses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">↓</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Potential Savings</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${dashboardData.potentialSavings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cost Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Trends</h3>
            <div className="h-64">
              <Line 
                data={costTrendData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: false,
                      ticks: {
                        callback: function(value) {
                          return '$' + Number(value).toLocaleString();
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* License Utilization */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">License Utilization</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="w-48 h-48">
                <Doughnut 
                  data={utilizationData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Applications and Recent Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Applications */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Applications by Cost</h3>
            <div className="h-64">
              <Bar 
                data={topAppsData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '$' + Number(value).toLocaleString();
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Alerts</h3>
            <div className="space-y-4">
              {dashboardData.recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                    alert.severity === 'error' ? 'bg-red-500' : 
                    alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    <p className="text-sm text-gray-500">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {alert.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;