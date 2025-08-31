import { Activity, ActivityType, ActivityCategory, ActivitySeverity } from '@/types';
import apiClient from './api';

export interface ActivityTrackingOptions {
  type: ActivityType;
  category: ActivityCategory;
  action: string;
  description: string;
  severity?: ActivitySeverity;
  resource?: {
    type: string;
    id: string;
    name: string;
  };
  target?: {
    type: string;
    id: string;
    name: string;
  };
  metadata?: Record<string, any>;
  tags?: string[];
}

class ActivityService {
  private isEnabled: boolean = false; // Disabled by default until API is confirmed available
  private queue: Activity[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private apiAvailable: boolean = false;

  constructor() {
    // Check if API is available on initialization
    this.checkApiAvailability();
    
    // Initialize flush interval for batch processing
    this.flushInterval = setInterval(() => {
      if (this.apiAvailable) {
        this.flushQueue();
      }
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Check if the activity API is available
   */
  private async checkApiAvailability(): Promise<void> {
    try {
      // Try a simple health check or test endpoint
      const response = await fetch('/api/v1/health');
      if (response.ok) {
        this.apiAvailable = true;
        this.isEnabled = true;
        console.log('Activity API is available');
      } else {
        this.apiAvailable = false;
        console.warn('Activity API health check failed');
      }
    } catch (error) {
      this.apiAvailable = false;
      console.warn('Activity API is not available:', error);
    }
  }

  /**
   * Track a new activity
   */
  async track(options: ActivityTrackingOptions): Promise<void> {
    if (!this.isEnabled || !this.apiAvailable) {
      // Log to console for development/debugging
      console.log('Activity tracked (API unavailable):', {
        type: options.type,
        action: options.action,
        description: options.description,
        severity: options.severity || 'low'
      });
      return;
    }

    try {
      const activity: Activity = {
        type: options.type,
        category: options.category,
        action: options.action,
        description: options.description,
        severity: options.severity || 'low',
        timestamp: new Date().toISOString(),
        actor: this.getCurrentActor(),
        resource: options.resource || {
          type: 'unknown',
          id: 'unknown',
          name: 'Unknown Resource',
        },
        target: options.target,
        metadata: {
          ...options.metadata,
          ipAddress: await this.getClientIP(),
          userAgent: navigator.userAgent,
          sessionId: this.getSessionId(),
        },
        tags: options.tags || [],
      };

      // Add to queue for batch processing
      this.queue.push(activity);

      // If high or critical severity, flush immediately
      if (options.severity === 'high' || options.severity === 'critical') {
        await this.flushQueue();
      }
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }

  /**
   * Track authentication events
   */
  async trackAuth(action: 'login' | 'logout' | 'password_change' | 'mfa_setup', success: boolean = true): Promise<void> {
    await this.track({
      type: 'authentication',
      category: 'security',
      action,
      description: `User ${action} ${success ? 'successful' : 'failed'}`,
      severity: success ? 'low' : 'medium',
      metadata: {
        status: success ? 'success' : 'failure',
      },
      tags: ['authentication', success ? 'success' : 'failure'],
    });
  }

  /**
   * Track authorization events
   */
  async trackAuthz(resource: string, action: string, granted: boolean, reason?: string): Promise<void> {
    await this.track({
      type: 'authorization',
      category: 'security',
      action: granted ? 'access_granted' : 'access_denied',
      description: `Access ${granted ? 'granted' : 'denied'} for ${action} on ${resource}`,
      severity: granted ? 'low' : 'medium',
      resource: {
        type: 'resource',
        id: resource,
        name: resource,
      },
      metadata: {
        requestedAction: action,
        reason,
        status: granted ? 'success' : 'failure',
      },
      tags: ['authorization', granted ? 'granted' : 'denied'],
    });
  }

  /**
   * Track policy management events
   */
  async trackPolicy(action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated', policyId: string, policyName: string): Promise<void> {
    await this.track({
      type: 'policy_management',
      category: 'administration',
      action: `policy_${action}`,
      description: `Policy "${policyName}" was ${action}`,
      severity: action === 'deleted' ? 'medium' : 'low',
      resource: {
        type: 'policy',
        id: policyId,
        name: policyName,
      },
      tags: ['policy', action],
    });
  }

  /**
   * Track user management events
   */
  async trackUser(action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated', userId: string, userName: string): Promise<void> {
    await this.track({
      type: 'user_management',
      category: 'administration',
      action: `user_${action}`,
      description: `User "${userName}" was ${action}`,
      severity: action === 'deleted' ? 'medium' : 'low',
      target: {
        type: 'user',
        id: userId,
        name: userName,
      },
      tags: ['user', action],
    });
  }

  /**
   * Track resource management events
   */
  async trackResource(action: 'created' | 'updated' | 'deleted', resourceId: string, resourceName: string): Promise<void> {
    await this.track({
      type: 'resource_management',
      category: 'administration',
      action: `resource_${action}`,
      description: `Resource "${resourceName}" was ${action}`,
      severity: action === 'deleted' ? 'medium' : 'low',
      resource: {
        type: 'resource',
        id: resourceId,
        name: resourceName,
      },
      tags: ['resource', action],
    });
  }

  /**
   * Track security events
   */
  async trackSecurity(event: string, description: string, severity: ActivitySeverity = 'high'): Promise<void> {
    await this.track({
      type: 'security_event',
      category: 'security',
      action: event,
      description,
      severity,
      tags: ['security', 'alert'],
    });
  }

  /**
   * Track system configuration changes
   */
  async trackConfig(setting: string, oldValue: any, newValue: any): Promise<void> {
    await this.track({
      type: 'system_configuration',
      category: 'configuration',
      action: 'config_changed',
      description: `Configuration "${setting}" was updated`,
      severity: 'low',
      metadata: {
        changes: {
          [setting]: { from: oldValue, to: newValue },
        },
      },
      tags: ['configuration', 'system'],
    });
  }

  /**
   * Track data access patterns
   */
  async trackDataAccess(operation: 'read' | 'write' | 'delete', resource: string, count?: number): Promise<void> {
    await this.track({
      type: 'data_modification',
      category: 'operation',
      action: `data_${operation}`,
      description: `Data ${operation} operation on ${resource}${count ? ` (${count} records)` : ''}`,
      severity: operation === 'delete' ? 'medium' : 'low',
      resource: {
        type: 'data',
        id: resource,
        name: resource,
      },
      metadata: {
        operation,
        recordCount: count,
      },
      tags: ['data', operation],
    });
  }

  /**
   * Enable/disable activity tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if the API is currently available
   */
  isApiAvailable(): boolean {
    return this.apiAvailable;
  }

  /**
   * Manually check API availability
   */
  async recheckApi(): Promise<boolean> {
    await this.checkApiAvailability();
    return this.apiAvailable;
  }

  /**
   * Get current user as actor
   */
  private getCurrentActor() {
    // Get user from auth context or localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          id: user._id || user.id || 'unknown',
          name: user.name || 'Unknown User',
          email: user.email || 'unknown@unknown.com',
          type: 'user' as const,
        };
      } catch {
        // Fallback to anonymous user
      }
    }

    return {
      id: 'anonymous',
      name: 'Anonymous User',
      email: 'anonymous@unknown.com',
      type: 'user' as const,
    };
  }

  /**
   * Get client IP address (simplified for demo)
   */
  private async getClientIP(): Promise<string> {
    // In a real implementation, this would call an API to get the client IP
    return 'unknown';
  }

  /**
   * Get or generate session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Flush queued activities to the server
   */
  private async flushQueue(): Promise<void> {
    if (this.queue.length === 0 || !this.apiAvailable) return;

    const activitiesToFlush = [...this.queue];
    this.queue = [];

    try {
      // Try to send activities to the API
      for (const activity of activitiesToFlush) {
        await apiClient.createActivity(activity);
      }
      console.log(`Successfully flushed ${activitiesToFlush.length} activities`);
    } catch (error) {
      console.error('Failed to flush activity queue:', error);
      
      // Check if API is still available
      await this.checkApiAvailability();
      
      if (!this.apiAvailable) {
        // If API is down, don't re-queue (avoid memory buildup)
        console.warn('Activity API is down, discarding queued activities');
      } else {
        // Re-queue failed activities for retry
        this.queue.unshift(...activitiesToFlush);
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushQueue(); // Final flush
  }
}

// Create singleton instance
const activityService = new ActivityService();

export default activityService;

// Utility functions for easy access
export const trackAuth = activityService.trackAuth.bind(activityService);
export const trackAuthz = activityService.trackAuthz.bind(activityService);
export const trackPolicy = activityService.trackPolicy.bind(activityService);
export const trackUser = activityService.trackUser.bind(activityService);
export const trackResource = activityService.trackResource.bind(activityService);
export const trackSecurity = activityService.trackSecurity.bind(activityService);
export const trackConfig = activityService.trackConfig.bind(activityService);
export const trackDataAccess = activityService.trackDataAccess.bind(activityService);