import React, { useState, useEffect } from 'react';
import './Reports.css';

interface ReportTemplate {
  type: string;
  name: string;
  description: string;
  supportedFormats: string[];
}

interface ReportConfig {
  type: string;
  format: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters?: {
    applications?: string[];
    departments?: string[];
    users?: string[];
    licenseTypes?: string[];
  };
  includeCharts?: boolean;
}

interface GeneratedReport {
  id: string;
  type: string;
  format: string;
  fileName: string;
  generatedAt: string;
  generatedBy: string;
  size: number;
  status: string;
}

const Reports: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: '',
    format: 'pdf',
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
    includeCharts: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportHistory, setReportHistory] = useState<GeneratedReport[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'scheduled'>('generate');

  useEffect(() => {
    fetchReportTemplates();
    fetchReportHistory();
  }, []);

  const fetchReportTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch report templates:', error);
    }
  };

  const fetchReportHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReportHistory(data.data.reports);
      }
    } catch (error) {
      console.error('Failed to fetch report history:', error);
    }
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setReportConfig(prev => ({
      ...prev,
      type: template.type,
      format: template.supportedFormats[0] || 'pdf',
    }));
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reportConfig),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Report generated successfully! File: ${data.data.fileName}`);
        
        // Download the report
        const downloadUrl = data.data.downloadUrl;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = data.data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Refresh history
        fetchReportHistory();
      } else {
        const error = await response.json();
        alert(`Failed to generate report: ${error.error}`);
      }
    } catch (error) {
      console.error('Report generation failed:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/download/${fileName}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download report');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download report');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Reports & Analytics</h1>
        <p>Generate comprehensive reports and export your IT cost analysis data</p>
      </div>

      <div className="reports-tabs">
        <button
          className={`tab-button ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          Generate Report
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Report History
        </button>
        <button
          className={`tab-button ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          Scheduled Reports
        </button>
      </div>

      {activeTab === 'generate' && (
        <div className="generate-report-section">
          <div className="report-templates">
            <h2>Select Report Template</h2>
            <div className="templates-grid">
              {templates.map((template) => (
                <div
                  key={template.type}
                  className={`template-card ${selectedTemplate?.type === template.type ? 'selected' : ''}`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <div className="supported-formats">
                    <strong>Formats:</strong> {template.supportedFormats.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedTemplate && (
            <div className="report-configuration">
              <h2>Configure Report</h2>
              <div className="config-form">
                <div className="form-group">
                  <label htmlFor="format">Output Format:</label>
                  <select
                    id="format"
                    value={reportConfig.format}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value }))}
                  >
                    {selectedTemplate.supportedFormats.map(format => (
                      <option key={format} value={format}>
                        {format.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="startDate">Start Date:</label>
                  <input
                    type="date"
                    id="startDate"
                    value={reportConfig.dateRange.startDate}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, startDate: e.target.value }
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">End Date:</label>
                  <input
                    type="date"
                    id="endDate"
                    value={reportConfig.dateRange.endDate}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, endDate: e.target.value }
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={reportConfig.includeCharts || false}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        includeCharts: e.target.checked
                      }))}
                    />
                    Include Charts and Visualizations
                  </label>
                </div>

                <button
                  className="generate-button"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="report-history-section">
          <h2>Report History</h2>
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>Report Type</th>
                  <th>Format</th>
                  <th>Generated</th>
                  <th>Generated By</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reportHistory.map((report) => (
                  <tr key={report.id}>
                    <td>{report.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                    <td>{report.format.toUpperCase()}</td>
                    <td>{new Date(report.generatedAt).toLocaleDateString()}</td>
                    <td>{report.generatedBy}</td>
                    <td>{formatFileSize(report.size)}</td>
                    <td>
                      <span className={`status ${report.status}`}>
                        {report.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="download-button"
                        onClick={() => handleDownloadReport(report.fileName)}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reportHistory.length === 0 && (
              <div className="no-reports">
                <p>No reports generated yet. Create your first report using the Generate Report tab.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'scheduled' && (
        <div className="scheduled-reports-section">
          <h2>Scheduled Reports</h2>
          <div className="scheduled-placeholder">
            <p>Scheduled reports functionality coming soon!</p>
            <p>You'll be able to set up automatic report generation and delivery.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;