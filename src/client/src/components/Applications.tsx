import React, { useState, useEffect } from 'react';

interface Application {
  id: string;
  name: string;
  category: string;
  vendor: string;
  description: string;
  totalCost: number;
  monthlyCost: number;
  licenseCount: number;
  activeUsers: number;
  utilizationRate: number;
  status: 'active' | 'inactive' | 'trial';
  renewalDate: Date;
  lastUsed: Date;
  integrationStatus: 'connected' | 'disconnected' | 'pending';
}

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'utilization'>('cost');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockApplications: Application[] = [
        {
          id: '1',
          name: 'Microsoft 365',
          category: 'Productivity',
          vendor: 'Microsoft',
          description: 'Complete productivity suite with Office apps, email, and collaboration tools',
          totalCost: 45000,
          monthlyCost: 3750,
          licenseCount: 150,
          activeUsers: 142,
          utilizationRate: 94.7,
          status: 'active',
          renewalDate: new Date('2024-12-31'),
          lastUsed: new Date('2024-01-20'),
          integrationStatus: 'connected'
        },
        {
          id: '2',
          name: 'Slack',
          category: 'Communication',
          vendor: 'Slack Technologies',
          description: 'Team communication and collaboration platform',
          totalCost: 18000,
          monthlyCost: 1500,
          licenseCount: 120,
          activeUsers: 98,
          utilizationRate: 81.7,
          status: 'active',
          renewalDate: new Date('2024-08-15'),
          lastUsed: new Date('2024-01-20'),
          integrationStatus: 'connected'
        },
        {
          id: '3',
          name: 'Adobe Creative Cloud',
          category: 'Design',
          vendor: 'Adobe',
          description: 'Creative software suite for design, video, and web development',
          totalCost: 24000,
          monthlyCost: 2000,
          licenseCount: 40,
          activeUsers: 35,
          utilizationRate: 87.5,
          status: 'active',
          renewalDate: new Date('2024-06-30'),
          lastUsed: new Date('2024-01-19'),
          integrationStatus: 'connected'
        },
        {
          id: '4',
          name: 'Jira',
          category: 'Project Management',
          vendor: 'Atlassian',
          description: 'Issue tracking and project management tool',
          totalCost: 12000,
          monthlyCost: 1000,
          licenseCount: 80,
          activeUsers: 65,
          utilizationRate: 81.3,
          status: 'active',
          renewalDate: new Date('2024-09-15'),
          lastUsed: new Date('2024-01-20'),
          integrationStatus: 'connected'
        },
        {
          id: '5',
          name: 'Figma',
          category: 'Design',
          vendor: 'Figma',
          description: 'Collaborative interface design tool',
          totalCost: 8400,
          monthlyCost: 700,
          licenseCount: 25,
          activeUsers: 18,
          utilizationRate: 72.0,
          status: 'active',
          renewalDate: new Date('2024-11-20'),
          lastUsed: new Date('2024-01-18'),
          integrationStatus: 'pending'
        },
        {
          id: '6',
          name: 'Zoom',
          category: 'Communication',
          vendor: 'Zoom',
          description: 'Video conferencing and webinar platform',
          totalCost: 6000,
          monthlyCost: 500,
          licenseCount: 100,
          activeUsers: 45,
          utilizationRate: 45.0,
          status: 'active',
          renewalDate: new Date('2024-07-10'),
          lastUsed: new Date('2024-01-15'),
          integrationStatus: 'disconnected'
        }
      ];

      setApplications(mockApplications);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedApplications = applications
    .filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           app.vendor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || app.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cost':
          return b.totalCost - a.totalCost;
        case 'utilization':
          return b.utilizationRate - a.utilizationRate;
        default:
          return 0;
      }
    });

  const categories = ['all', ...Array.from(new Set(applications.map(app => app.category)))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'trial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIntegrationStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Applications Management</h1>
          <p className="mt-2 text-gray-600">Monitor and manage your SaaS applications</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">📱</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{applications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Applications</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {applications.filter(app => app.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">$</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Monthly Cost</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${applications.reduce((sum, app) => sum + app.monthlyCost, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">%</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Utilization</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(applications.reduce((sum, app) => sum + app.utilizationRate, 0) / applications.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Applications</label>
              <input
                type="text"
                placeholder="Search by name or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'cost' | 'utilization')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cost">Total Cost</option>
                <option value="name">Name</option>
                <option value="utilization">Utilization Rate</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Licenses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Integration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{app.name}</div>
                          <div className="text-sm text-gray-500">{app.vendor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {app.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>${app.monthlyCost.toLocaleString()}/mo</div>
                      <div className="text-xs text-gray-500">${app.totalCost.toLocaleString()}/yr</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{app.activeUsers} / {app.licenseCount}</div>
                      <div className="text-xs text-gray-500">Active / Total</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${app.utilizationRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{app.utilizationRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getIntegrationStatusColor(app.integrationStatus)}`}>
                        {app.integrationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                      <button className="text-green-600 hover:text-green-900 mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Applications;