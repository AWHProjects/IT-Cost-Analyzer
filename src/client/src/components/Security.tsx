import React, { useState, useEffect } from 'react';
import './Security.css';

interface SecurityEvent {
  id: string;
  type: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  userId?: string;
  resource?: string;
  details: Record<string, any>;
}

interface SecurityScan {
  vulnerabilities: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    affected: string[];
  }>;
  score: number;
  lastScan: string;
}

interface ComplianceReport {
  id: string;
  type: string;
  generatedAt: string;
  status: 'compliant' | 'non_compliant' | 'partial_compliance';
  score: number;
  findings?: Array<{
    category: string;
    requirement: string;
    status: string;
    priority: string;
  }>;
}

const Security: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'scan' | 'compliance' | 'tools'>('events');
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityScan, setSecurityScan] = useState<SecurityScan | null>(null);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);

  useEffect(() => {
    fetchSecurityEvents();
    fetchComplianceReports();
  }, []);

  const fetchSecurityEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/security/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSecurityEvents(data.data.events);
      }
    } catch (error) {
      console.error('Failed to fetch security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/security/compliance/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComplianceReports(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch compliance reports:', error);
    }
  };

  const performSecurityScan = async () => {
    setScanLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/security/scan', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSecurityScan(data.data);
      } else {
        alert('Failed to perform security scan');
      }
    } catch (error) {
      console.error('Failed to perform security scan:', error);
      alert('Failed to perform security scan');
    } finally {
      setScanLoading(false);
    }
  };

  const generateComplianceReport = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // Last 3 months

      const response = await fetch('/api/security/compliance/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComplianceReports(prev => [data.data, ...prev]);
        alert('Compliance report generated successfully!');
      } else {
        alert('Failed to generate compliance report');
      }
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      alert('Failed to generate compliance report');
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-medium';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'compliant': return 'status-compliant';
      case 'non_compliant': return 'status-non-compliant';
      case 'partial_compliance': return 'status-partial';
      default: return 'status-unknown';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="security-container">
        <div className="loading">Loading security dashboard...</div>
      </div>
    );
  }

  return (
    <div className="security-container">
      <div className="security-header">
        <h1>Security & Compliance</h1>
        <p>Monitor security events, perform scans, and manage compliance requirements</p>
      </div>

      <div className="security-tabs">
        <button
          className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Security Events
        </button>
        <button
          className={`tab-button ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          Security Scan
        </button>
        <button
          className={`tab-button ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          Compliance
        </button>
        <button
          className={`tab-button ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          Security Tools
        </button>
      </div>

      {activeTab === 'events' && (
        <div className="security-events-section">
          <div className="section-header">
            <h2>Security Events</h2>
            <button className="refresh-button" onClick={fetchSecurityEvents}>
              Refresh
            </button>
          </div>

          <div className="events-list">
            {securityEvents.length === 0 ? (
              <div className="no-events">
                <div className="no-events-icon">🔒</div>
                <h3>No security events</h3>
                <p>No security events have been recorded recently.</p>
              </div>
            ) : (
              securityEvents.map((event) => (
                <div key={event.id} className={`event-item ${getSeverityClass(event.severity)}`}>
                  <div className="event-header">
                    <div className="event-type">{event.type.replace('_', ' ').toUpperCase()}</div>
                    <div className="event-time">{formatTimeAgo(event.timestamp)}</div>
                  </div>
                  <div className="event-action">{event.action}</div>
                  {event.resource && (
                    <div className="event-resource">Resource: {event.resource}</div>
                  )}
                  <div className={`event-severity ${getSeverityClass(event.severity)}`}>
                    {event.severity.toUpperCase()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'scan' && (
        <div className="security-scan-section">
          <div className="section-header">
            <h2>Security Scan</h2>
            <button
              className="scan-button"
              onClick={performSecurityScan}
              disabled={scanLoading}
            >
              {scanLoading ? 'Scanning...' : 'Run Security Scan'}
            </button>
          </div>

          {securityScan && (
            <div className="scan-results">
              <div className="scan-score">
                <div className="score-circle">
                  <div className="score-value">{securityScan.score}</div>
                  <div className="score-label">Security Score</div>
                </div>
                <div className="scan-info">
                  <p>Last scan: {formatTimeAgo(securityScan.lastScan)}</p>
                  <p>{securityScan.vulnerabilities.length} vulnerabilities found</p>
                </div>
              </div>

              <div className="vulnerabilities-list">
                <h3>Vulnerabilities</h3>
                {securityScan.vulnerabilities.map((vuln) => (
                  <div key={vuln.id} className={`vulnerability-item ${getSeverityClass(vuln.severity)}`}>
                    <div className="vulnerability-header">
                      <h4>{vuln.type.replace('_', ' ').toUpperCase()}</h4>
                      <span className={`severity-badge ${getSeverityClass(vuln.severity)}`}>
                        {vuln.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="vulnerability-description">{vuln.description}</p>
                    <p className="vulnerability-recommendation">
                      <strong>Recommendation:</strong> {vuln.recommendation}
                    </p>
                    <div className="affected-components">
                      <strong>Affected:</strong> {vuln.affected.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!securityScan && !scanLoading && (
            <div className="no-scan">
              <div className="no-scan-icon">🔍</div>
              <h3>No recent security scan</h3>
              <p>Run a security scan to identify potential vulnerabilities and security issues.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="compliance-section">
          <div className="section-header">
            <h2>Compliance Reports</h2>
            <div className="compliance-actions">
              <button onClick={() => generateComplianceReport('gdpr')}>
                Generate GDPR Report
              </button>
              <button onClick={() => generateComplianceReport('sox')}>
                Generate SOX Report
              </button>
              <button onClick={() => generateComplianceReport('iso27001')}>
                Generate ISO 27001 Report
              </button>
            </div>
          </div>

          <div className="compliance-reports">
            {complianceReports.length === 0 ? (
              <div className="no-reports">
                <div className="no-reports-icon">📋</div>
                <h3>No compliance reports</h3>
                <p>Generate compliance reports to assess your organization's compliance status.</p>
              </div>
            ) : (
              complianceReports.map((report) => (
                <div key={report.id} className="compliance-report">
                  <div className="report-header">
                    <h3>{report.type.toUpperCase()} Compliance Report</h3>
                    <div className={`status-badge ${getStatusClass(report.status)}`}>
                      {report.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  <div className="report-details">
                    <div className="report-score">Score: {report.score}%</div>
                    <div className="report-date">
                      Generated: {new Date(report.generatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  {report.findings && (
                    <div className="report-findings">
                      <h4>Key Findings:</h4>
                      <ul>
                        {report.findings.slice(0, 3).map((finding, index) => (
                          <li key={index} className={`finding-${finding.status}`}>
                            {finding.requirement}: {finding.status}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="security-tools-section">
          <h2>Security Tools</h2>
          <div className="tools-grid">
            <div className="tool-card">
              <h3>🔐 Data Encryption</h3>
              <p>Encrypt sensitive data using industry-standard algorithms</p>
              <button className="tool-button">Access Tool</button>
            </div>
            <div className="tool-card">
              <h3>🔑 Hash Generator</h3>
              <p>Generate secure hashes for data integrity verification</p>
              <button className="tool-button">Access Tool</button>
            </div>
            <div className="tool-card">
              <h3>📊 Data Classification</h3>
              <p>Automatically classify data based on sensitivity levels</p>
              <button className="tool-button">Access Tool</button>
            </div>
            <div className="tool-card">
              <h3>📝 Audit Logs</h3>
              <p>View comprehensive audit trails and security events</p>
              <button className="tool-button">Access Tool</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Security;