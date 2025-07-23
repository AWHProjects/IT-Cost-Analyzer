import React, { useState, useEffect } from 'react';
import './Notifications.css';

interface Notification {
  id: string;
  type: 'cost-alert' | 'usage-warning' | 'license-expiry' | 'security-alert' | 'system-update' | 'report-ready';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  categories: {
    costAlerts: boolean;
    usageWarnings: boolean;
    licenseExpiry: boolean;
    securityAlerts: boolean;
    systemUpdates: boolean;
    reportReady: boolean;
  };
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'preferences'>('all');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    categories: {
      costAlerts: true,
      usageWarnings: true,
      licenseExpiry: true,
      securityAlerts: true,
      systemUpdates: false,
      reportReady: true,
    },
  });

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, []);

  const fetchNotifications = async (unreadOnly = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications?unreadOnly=${unreadOnly}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, readAt: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}/dismiss`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        if (!notifications.find(n => n.id === notificationId)?.readAt) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newPreferences),
      });

      if (response.ok) {
        setPreferences(prev => ({ ...prev, ...newPreferences }));
        alert('Preferences updated successfully!');
      } else {
        alert('Failed to update preferences');
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      alert('Failed to update preferences');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'cost-alert': return '💰';
      case 'usage-warning': return '⚠️';
      case 'license-expiry': return '📋';
      case 'security-alert': return '🔒';
      case 'system-update': return '🔄';
      case 'report-ready': return '📊';
      default: return '📢';
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.readAt)
    : notifications;

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="loading">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="unread-badge">
          {unreadCount > 0 && (
            <span className="badge">{unreadCount} unread</span>
          )}
        </div>
      </div>

      <div className="notifications-tabs">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Notifications
        </button>
        <button
          className={`tab-button ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
      </div>

      {activeTab === 'preferences' ? (
        <div className="preferences-section">
          <h2>Notification Preferences</h2>
          
          <div className="preference-group">
            <h3>General Settings</h3>
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => updatePreferences({ emailNotifications: e.target.checked })}
              />
              <span>Email notifications</span>
            </label>
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.pushNotifications}
                onChange={(e) => updatePreferences({ pushNotifications: e.target.checked })}
              />
              <span>Push notifications</span>
            </label>
          </div>

          <div className="preference-group">
            <h3>Notification Categories</h3>
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.categories.costAlerts}
                onChange={(e) => updatePreferences({
                  categories: { ...preferences.categories, costAlerts: e.target.checked }
                })}
              />
              <span>💰 Cost alerts</span>
            </label>
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.categories.usageWarnings}
                onChange={(e) => updatePreferences({
                  categories: { ...preferences.categories, usageWarnings: e.target.checked }
                })}
              />
              <span>⚠️ Usage warnings</span>
            </label>
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.categories.licenseExpiry}
                onChange={(e) => updatePreferences({
                  categories: { ...preferences.categories, licenseExpiry: e.target.checked }
                })}
              />
              <span>📋 License expiry</span>
            </label>
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.categories.securityAlerts}
                onChange={(e) => updatePreferences({
                  categories: { ...preferences.categories, securityAlerts: e.target.checked }
                })}
              />
              <span>🔒 Security alerts</span>
            </label>
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.categories.systemUpdates}
                onChange={(e) => updatePreferences({
                  categories: { ...preferences.categories, systemUpdates: e.target.checked }
                })}
              />
              <span>🔄 System updates</span>
            </label>
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.categories.reportReady}
                onChange={(e) => updatePreferences({
                  categories: { ...preferences.categories, reportReady: e.target.checked }
                })}
              />
              <span>📊 Report ready</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="no-notifications">
              <div className="no-notifications-icon">🔔</div>
              <h3>No notifications</h3>
              <p>
                {activeTab === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.readAt ? 'unread' : ''} ${getSeverityClass(notification.severity)}`}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h4 className="notification-title">{notification.title}</h4>
                    <span className="notification-time">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  
                  <p className="notification-message">{notification.message}</p>
                  
                  {notification.actionUrl && notification.actionText && (
                    <div className="notification-actions">
                      <a
                        href={notification.actionUrl}
                        className="action-button"
                        onClick={() => !notification.readAt && markAsRead(notification.id)}
                      >
                        {notification.actionText}
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="notification-controls">
                  {!notification.readAt && (
                    <button
                      className="control-button mark-read"
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="control-button dismiss"
                    onClick={() => dismissNotification(notification.id)}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;