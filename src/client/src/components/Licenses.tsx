import React, { useState, useEffect } from 'react';

interface License {
  id: string;
  applicationName: string;
  applicationId: string;
  licenseType: 'user' | 'device' | 'site' | 'concurrent';
  totalSeats: number;
  usedSeats: number;
  availableSeats: number;
  costPerSeat: number;
  totalCost: number;
  billingCycle: 'monthly' | 'annual' | 'one-time';
  status: 'active' | 'expired' | 'trial' | 'suspended';
  purchaseDate: Date;
  renewalDate: Date;
  vendor: string;
  assignedUsers: string[];
  department: string;
  utilizationRate: number;
  lastUsed: Date;
}

const Licenses: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState<'application' | 'cost' | 'utilization' | 'renewal'>('cost');

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockLicenses: License[] = [
        {
          id: '1',
          applicationName: 'Microsoft 365',
          applicationId: '1',
          licenseType: 'user',
          totalSeats: 150,
          usedSeats: 142,
          availableSeats: 8,
          costPerSeat: 25,
          totalCost: 3750,
          billingCycle: 'monthly',
          status: 'active',
          purchaseDate: new Date('2023-01-15'),
          renewalDate: new Date('2024-12-31'),
          vendor: 'Microsoft',
          assignedUsers: ['john.doe@company.com', 'jane.smith@company.com'],
          department: 'All Departments',
          utilizationRate: 94.7,
          lastUsed: new Date('2024-01-20')
        },
        {
          id: '2',
          applicationName: 'Slack',
          applicationId: '2',
          licenseType: 'user',
          totalSeats: 120,
          usedSeats: 98,
          availableSeats: 22,
          costPerSeat: 12.5,
          totalCost: 1500,
          billingCycle: 'monthly',
          status: 'active',
          purchaseDate: new Date('2023-03-01'),
          renewalDate: new Date('2024-08-15'),
          vendor: 'Slack Technologies',
          assignedUsers: ['team@company.com'],
          department: 'Engineering',
          utilizationRate: 81.7,
          lastUsed: new Date('2024-01-20')
        },
        {
          id: '3',
          applicationName: 'Adobe Creative Cloud',
          applicationId: '3',
          licenseType: 'user',
          totalSeats: 40,
          usedSeats: 35,
          availableSeats: 5,
          costPerSeat: 50,
          totalCost: 2000,
          billingCycle: 'monthly',
          status: 'active',
          purchaseDate: new Date('2023-06-01'),
          renewalDate: new Date('2024-06-30'),
          vendor: 'Adobe',
          assignedUsers: ['design@company.com'],
          department: 'Marketing',
          utilizationRate: 87.5,
          lastUsed: new Date('2024-01-19')
        },
        {
          id: '4',
          applicationName: 'Jira',
          applicationId: '4',
          licenseType: 'user',
          totalSeats: 80,
          usedSeats: 65,
          availableSeats: 15,
          costPerSeat: 12.5,
          totalCost: 1000,
          billingCycle: 'monthly',
          status: 'active',
          purchaseDate: new Date('2023-02-15'),
          renewalDate: new Date('2024-09-15'),
          vendor: 'Atlassian',
          assignedUsers: ['dev@company.com'],
          department: 'Engineering',
          utilizationRate: 81.3,
          lastUsed: new Date('2024-01-20')
        },
        {
          id: '5',
          applicationName: 'Figma',
          applicationId: '5',
          licenseType: 'user',
          totalSeats: 25,
          usedSeats: 18,
          availableSeats: 7,
          costPerSeat: 28,
          totalCost: 700,
          billingCycle: 'monthly',
          status: 'active',
          purchaseDate: new Date('2023-04-10'),
          renewalDate: new Date('2024-11-20'),
          vendor: 'Figma',
          assignedUsers: ['design@company.com'],
          department: 'Design',
          utilizationRate: 72.0,
          lastUsed: new Date('2024-01-18')
        },
        {
          id: '6',
          applicationName: 'Zoom Pro',
          applicationId: '6',
          licenseType: 'user',
          totalSeats: 100,
          usedSeats: 45,
          availableSeats: 55,
          costPerSeat: 5,
          totalCost: 500,
          billingCycle: 'monthly',
          status: 'active',
          purchaseDate: new Date('2023-01-01'),
          renewalDate: new Date('2024-07-10'),
          vendor: 'Zoom',
          assignedUsers: ['all@company.com'],
          department: 'All Departments',
          utilizationRate: 45.0,
          lastUsed: new Date('2024-01-15')
        },
        {
          id: '7',
          applicationName: 'GitHub Enterprise',
          applicationId: '7',
          licenseType: 'user',
          totalSeats: 60,
          usedSeats: 58,
          availableSeats: 2,
          costPerSeat: 21,
          totalCost: 1260,
          billingCycle: 'monthly',
          status: 'active',
          purchaseDate: new Date('2023-01-20'),
          renewalDate: new Date('2024-10-15'),
          vendor: 'GitHub',
          assignedUsers: ['dev@company.com'],
          department: 'Engineering',
          utilizationRate: 96.7,
          lastUsed: new Date('2024-01-20')
        }
      ];

      setLicenses(mockLicenses);
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedLicenses = licenses
    .filter(license => {
      const matchesSearch = license.applicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           license.vendor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || license.status === filterStatus;
      const matchesType = filterType === 'all' || license.licenseType === filterType;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'application':
          return a.applicationName.localeCompare(b.applicationName);
        case 'cost':
          return b.totalCost - a.totalCost;
        case 'utilization':
          return b.utilizationRate - a.utilizationRate;
        case 'renewal':
          return a.renewalDate.getTime() - b.renewalDate.getTime();
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'trial': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRenewalUrgency = (renewalDate: Date) => {
    const today = new Date();
    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilRenewal < 30) return 'text-red-600 font-semibold';
    if (daysUntilRenewal < 90) return 'text-yellow-600 font-medium';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalLicenses = licenses.reduce((sum, license) => sum + license.totalSeats, 0);
  const usedLicenses = licenses.reduce((sum, license) => sum + license.usedSeats, 0);
  const totalMonthlyCost = licenses.reduce((sum, license) => sum + license.totalCost, 0);
  const averageUtilization = licenses.reduce((sum, license) => sum + license.utilizationRate, 0) / licenses.length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">License Management</h1>
          <p className="mt-2 text-gray-600">Track and optimize your software licenses</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">📄</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Licenses</p>
                <p className="text-2xl font-semibold text-gray-900">{totalLicenses}</p>
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
                <p className="text-sm font-medium text-gray-500">Used Licenses</p>
                <p className="text-2xl font-semibold text-gray-900">{usedLicenses}</p>
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
                <p className="text-sm font-medium text-gray-500">Monthly Cost</p>
                <p className="text-2xl font-semibold text-gray-900">${totalMonthlyCost.toLocaleString()}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{averageUtilization.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Licenses</label>
              <input
                type="text"
                placeholder="Search by application or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">License Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="user">User</option>
                <option value="device">Device</option>
                <option value="site">Site</option>
                <option value="concurrent">Concurrent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'application' | 'cost' | 'utilization' | 'renewal')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cost">Cost</option>
                <option value="application">Application</option>
                <option value="utilization">Utilization</option>
                <option value="renewal">Renewal Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Licenses Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Renewal Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedLicenses.map((license) => (
                  <tr key={license.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{license.applicationName}</div>
                          <div className="text-sm text-gray-500">{license.vendor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {license.usedSeats} / {license.totalSeats} seats
                      </div>
                      <div className="text-xs text-gray-500">
                        {license.availableSeats} available
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>${license.totalCost.toLocaleString()}/{license.billingCycle === 'monthly' ? 'mo' : 'yr'}</div>
                      <div className="text-xs text-gray-500">${license.costPerSeat}/seat</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${getUtilizationColor(license.utilizationRate)}`}
                            style={{ width: `${license.utilizationRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{license.utilizationRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(license.status)}`}>
                        {license.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${getRenewalUrgency(license.renewalDate)}`}>
                        {license.renewalDate.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.ceil((license.renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Manage</button>
                      <button className="text-green-600 hover:text-green-900 mr-3">Renew</button>
                      <button className="text-red-600 hover:text-red-900">Cancel</button>
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

export default Licenses;