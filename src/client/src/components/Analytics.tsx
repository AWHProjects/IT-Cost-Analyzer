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

interface AnalyticsData {
  costTrends: Array<{
    month: string;
    totalCost: number;
    newLicenses: number;
    cancelledLicenses: number;
    savings: number;
  }>;
  departmentSpending: Array<{
    department: string;
    spending: number;
    applications: number;
    users: number;
  }>;
  utilizationTrends: Array<{
    month: string;
    utilization: number;
    activeUsers: number;
    totalLicenses: number;
  }>;
  topApplications: Array<{
    name: string;
    cost: number;
    users: number;
    utilization: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  savingsOpportunities: Array<{
    type: string;
    description: string;
    potentialSavings: number;
    impact: 'high' | 'medium' | 'low';
    effort: 'easy' | 'moderate' | 'complex';
  }>;
  complianceMetrics: {
    licensesInCompliance: number;
    totalLicenses: number;
    complianceScore: number;
    violations: Array<{
      application: string;
      issue: string;
      severity: 'high' | 'medium' | 'low';
    }>;
  };
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'3m' | '6m' | '12m'>('6m');
  const [selectedMetric, setSelectedMetric] = useState<'cost' | 'utilization' | 'compliance'>('cost');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockData: AnalyticsData = {
        costTrends: [
          { month: 'Jul 2023', totalCost: 115000, newLicenses: 12, cancelledLicenses: 3, savings: 2500 },
          { month: 'Aug 2023', totalCost: 118000, newLicenses: 8, cancelledLicenses: 2, savings: 1800 },
          { month: 'Sep 2023', totalCost: 120000, newLicenses: 15, cancelledLicenses: 5, savings: 3200 },
          { month: 'Oct 2023', totalCost: 122000, newLicenses: 10, cancelledLicenses: 4, savings: 2100 },
          { month: 'Nov 2023', totalCost: 123000, newLicenses: 6, cancelledLicenses: 8, savings: 4500 },
          { month: 'Dec 2023', totalCost: 125000, newLicenses: 18, cancelledLicenses: 2, savings: 1200 }
        ],
        departmentSpending: [
          { department: 'Engineering', spending: 45000, applications: 12, users: 85 },
          { department: 'Marketing', spending: 32000, applications: 8, users: 45 },
          { department: 'Sales', spending: 28000, applications: 6, users: 35 },
          { department: 'HR', spending: 12000, applications: 4, users: 15 },
          { department: 'Finance', spending: 8000, applications: 3, users: 12 }
        ],
        utilizationTrends: [
          { month: 'Jul 2023', utilization: 78.5, activeUsers: 320, totalLicenses: 408 },
          { month: 'Aug 2023', utilization: 81.2, activeUsers: 335, totalLicenses: 412 },
          { month: 'Sep 2023', utilization: 83.1, activeUsers: 348, totalLicenses: 419 },
          { month: 'Oct 2023', utilization: 85.3, activeUsers: 362, totalLicenses: 424 },
          { month: 'Nov 2023', utilization: 87.8, activeUsers: 378, totalLicenses: 430 },
          { month: 'Dec 2023', utilization: 86.2, activeUsers: 388, totalLicenses: 450 }
        ],
        topApplications: [
          { name: 'Microsoft 365', cost: 45000, users: 142, utilization: 94.7, trend: 'up' },
          { name: 'Adobe Creative Cloud', cost: 24000, users: 35, utilization: 87.5, trend: 'stable' },
          { name: 'Slack', cost: 18000, users: 98, utilization: 81.7, trend: 'up' },
          { name: 'Jira', cost: 12000, users: 65, utilization: 81.3, trend: 'down' },
          { name: 'Figma', cost: 8400, users: 18, utilization: 72.0, trend: 'stable' }
        ],
        savingsOpportunities: [
          {
            type: 'Unused Licenses',
            description: 'Remove 22 unused Zoom licenses',
            potentialSavings: 1320,
            impact: 'medium',
            effort: 'easy'
          },
          {
            type: 'License Optimization',
            description: 'Downgrade 8 Adobe licenses to lower tier',
            potentialSavings: 2400,
            impact: 'high',
            effort: 'moderate'
          },
          {
            type: 'Duplicate Tools',
            description: 'Consolidate project management tools',
            potentialSavings: 3600,
            impact: 'high',
            effort: 'complex'
          },
          {
            type: 'Contract Negotiation',
            description: 'Renegotiate Microsoft 365 contract',
            potentialSavings: 6750,
            impact: 'high',
            effort: 'moderate'
          }
        ],
        complianceMetrics: {
          licensesInCompliance: 387,
          totalLicenses: 450,
          complianceScore: 86.0,
          violations: [
            { application: 'Adobe Creative Cloud', issue: 'Over-deployment detected', severity: 'high' },
            { application: 'Slack', issue: 'Missing usage tracking', severity: 'medium' },
            { application: 'Zoom', issue: 'License type mismatch', severity: 'low' }
          ]
        }
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
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

  if (!analyticsData) return null;

  // Chart configurations
  const costTrendData = {
    labels: analyticsData.costTrends.map(trend => trend.month),
    datasets: [
      {
        label: 'Total Cost ($)',
        data: analyticsData.costTrends.map(trend => trend.totalCost),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Savings ($)',
        data: analyticsData.costTrends.map(trend => trend.savings),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
      }
    ],
  };

  const departmentSpendingData = {
    labels: analyticsData.departmentSpending.map(dept => dept.department),
    datasets: [
      {
        label: 'Spending ($)',
        data: analyticsData.departmentSpending.map(dept => dept.spending),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6'
        ],
        borderWidth: 0,
      },
    ],
  };

  const utilizationTrendData = {
    labels: analyticsData.utilizationTrends.map(trend => trend.month),
    datasets: [
      {
        label: 'Utilization Rate (%)',
        data: analyticsData.utilizationTrends.map(trend => trend.utilization),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.1,
      }
    ],
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="mt-2 text-gray-600">Deep insights into your IT cost optimization</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as '3m' | '6m' | '12m')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="12m">Last 12 Months</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Focus Metric</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as 'cost' | 'utilization' | 'compliance')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cost">Cost Analysis</option>
                <option value="utilization">Utilization Analysis</option>
                <option value="compliance">Compliance Analysis</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Savings</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${analyticsData.costTrends.reduce((sum, trend) => sum + trend.savings, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">%</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Utilization</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(analyticsData.utilizationTrends.reduce((sum, trend) => sum + trend.utilization, 0) / analyticsData.utilizationTrends.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Compliance Score</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analyticsData.complianceMetrics.complianceScore.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">💡</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Opportunities</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analyticsData.savingsOpportunities.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cost Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Trends & Savings</h3>
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

          {/* Department Spending */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Department Spending</h3>
            <div className="h-64">
              <Bar 
                data={departmentSpendingData}
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
        </div>

        {/* Utilization Trends */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">License Utilization Trends</h3>
          <div className="h-64">
            <Line 
              data={utilizationTrendData} 
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
                    min: 70,
                    max: 100,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Savings Opportunities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Savings Opportunities</h3>
            <div className="space-y-4">
              {analyticsData.savingsOpportunities.map((opportunity, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{opportunity.type}</h4>
                    <span className="text-lg font-semibold text-green-600">
                      ${opportunity.potentialSavings.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{opportunity.description}</p>
                  <div className="flex gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getImpactColor(opportunity.impact)}`}>
                      {opportunity.impact} impact
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEffortColor(opportunity.effort)}`}>
                      {opportunity.effort}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Status</h3>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Compliance</span>
                <span className="text-sm font-semibold text-gray-900">
                  {analyticsData.complianceMetrics.licensesInCompliance} / {analyticsData.complianceMetrics.totalLicenses}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${analyticsData.complianceMetrics.complianceScore}%` }}
                ></div>
              </div>
            </div>
            
            <h4 className="text-sm font-medium text-gray-900 mb-3">Compliance Issues</h4>
            <div className="space-y-3">
              {analyticsData.complianceMetrics.violations.map((violation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(violation.severity)}`}>
                    {violation.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{violation.application}</p>
                    <p className="text-sm text-gray-500">{violation.issue}</p>
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

export default Analytics;