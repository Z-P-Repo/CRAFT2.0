import activityService, { 
  trackAuth, 
  trackAuthz,
  trackPolicy, 
  trackUser, 
  trackResource, 
  trackSecurity,
  trackConfig,
  trackDataAccess
} from '../activityService';
import apiClient from '../api';

// Mock the API client
jest.mock('../api', () => ({
  createActivity: jest.fn(),
}));

// Mock fetch for health checks
global.fetch = jest.fn();

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage and sessionStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(() => 'test-session-id'),
    setItem: jest.fn(),
  },
});

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('ActivityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset service state
    (activityService as any).isEnabled = false;
    (activityService as any).apiAvailable = false;
    (activityService as any).queue = [];
    
    // Mock API client responses
    mockApiClient.createActivity.mockResolvedValue({
      id: 'activity-1',
      type: 'authentication',
      action: 'test',
    });
    
    // Mock fetch for health checks
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    } as Response);

    // Clear console mocks
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('Initialization', () => {
    it('is a singleton instance', () => {
      expect(activityService).toBeDefined();
      expect(typeof activityService.track).toBe('function');
      expect(typeof activityService.trackAuth).toBe('function');
    });

    it('starts with API checking disabled by default', () => {
      expect(activityService.isApiAvailable()).toBe(false);
    });

    it('can manually recheck API availability', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      } as Response);

      const result = await activityService.recheckApi();
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/health');
    });
  });

  describe('API Availability Checking', () => {
    it('handles API unavailability gracefully', async () => {
      // Mock API failure
      mockFetch.mockRejectedValue(new Error('API not available'));

      await activityService.track({
        type: 'authentication',
        category: 'security',
        action: 'login',
        description: 'User login test',
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Activity tracked (API unavailable):', 
        expect.objectContaining({
          type: 'authentication',
          action: 'login',
          description: 'User login test',
          severity: 'low'
        })
      );
      expect(mockApiClient.createActivity).not.toHaveBeenCalled();
    });

    it('enables service when API becomes available', async () => {
      // Enable the service manually
      (activityService as any).apiAvailable = true;
      (activityService as any).isEnabled = true;

      await activityService.track({
        type: 'security_event',
        category: 'security',
        action: 'high_priority_alert',
        description: 'High priority security alert',
        severity: 'high',
      });

      expect(mockApiClient.createActivity).toHaveBeenCalled();
    });
  });

  describe('Activity Tracking', () => {
    beforeEach(() => {
      // Pre-enable the service
      (activityService as any).apiAvailable = true;
      (activityService as any).isEnabled = true;
    });

    it('tracks high severity activities immediately', async () => {
      await activityService.track({
        type: 'authentication',
        category: 'security',
        action: 'login',
        description: 'User logged in',
        severity: 'high',
      });

      expect(mockApiClient.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'authentication',
          action: 'login',
          description: 'User logged in',
          category: 'security',
          severity: 'high',
        })
      );
    });

    it('queues low severity activities for batch processing', async () => {
      await activityService.track({
        type: 'policy_management',
        category: 'administration',
        action: 'policy_created',
        description: 'Policy created',
        severity: 'low',
      });

      // Low severity should be queued, not sent immediately
      expect(mockApiClient.createActivity).not.toHaveBeenCalled();
      
      // Queue should have the activity
      expect((activityService as any).queue).toHaveLength(1);
    });

    it('sends critical severity activities immediately', async () => {
      await activityService.track({
        type: 'security_event',
        category: 'security',
        action: 'security_breach',
        description: 'Security breach detected',
        severity: 'critical',
      });

      expect(mockApiClient.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'critical',
          action: 'security_breach',
        })
      );
    });

    it('includes actor information in high severity activities', async () => {
      const mockUser = { 
        _id: 'user-1', 
        name: 'John Doe', 
        email: 'john@example.com' 
      };
      
      (window.localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify(mockUser)
      );

      await activityService.track({
        type: 'authentication',
        category: 'security',
        action: 'login',
        description: 'User logged in',
        severity: 'high',
      });

      expect(mockApiClient.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: {
            id: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
            type: 'user',
          },
        })
      );
    });

    it('includes resource information in high severity activities', async () => {
      await activityService.track({
        type: 'policy_management',
        category: 'administration',
        action: 'policy_deleted',
        description: 'Policy deleted',
        severity: 'high',
        resource: {
          type: 'policy',
          id: 'policy-1',
          name: 'Security Policy',
        },
      });

      expect(mockApiClient.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: {
            type: 'policy',
            id: 'policy-1',
            name: 'Security Policy',
          },
        })
      );
    });

    it('includes custom metadata in high severity activities', async () => {
      const customMetadata = {
        customField: 'customValue',
      };

      await activityService.track({
        type: 'security_event',
        category: 'security',
        action: 'breach_detected',
        description: 'Security breach',
        severity: 'critical',
        metadata: customMetadata,
      });

      expect(mockApiClient.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            customField: 'customValue',
            sessionId: 'test-session-id',
            userAgent: expect.any(String),
          }),
        })
      );
    });

    it('handles API errors gracefully for high severity activities', async () => {
      mockApiClient.createActivity.mockRejectedValue(new Error('API Error'));

      await activityService.track({
        type: 'security_event',
        category: 'security',
        action: 'critical_error',
        description: 'Critical system error',
        severity: 'critical',
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to flush activity queue:',
        expect.any(Error)
      );
    });
  });

  describe('Service Control', () => {
    it('can be enabled and disabled', () => {
      activityService.setEnabled(true);
      expect((activityService as any).isEnabled).toBe(true);
      
      activityService.setEnabled(false);
      expect((activityService as any).isEnabled).toBe(false);
    });

    it('reports API availability status', () => {
      (activityService as any).apiAvailable = true;
      expect(activityService.isApiAvailable()).toBe(true);
      
      (activityService as any).apiAvailable = false;
      expect(activityService.isApiAvailable()).toBe(false);
    });
  });

  describe('Helper Functions', () => {
    beforeEach(() => {
      // Pre-enable the service
      (activityService as any).apiAvailable = true;
      (activityService as any).isEnabled = true;
    });

    describe('trackAuth', () => {
      it('tracks failed authentication but queues medium severity', async () => {
        await trackAuth('login', false);

        // Medium severity gets queued, not sent immediately
        expect(mockApiClient.createActivity).not.toHaveBeenCalled();
        expect((activityService as any).queue).toHaveLength(1);
      });
    });

    describe('trackPolicy', () => {
      it('tracks policy deletion but queues medium severity', async () => {
        await trackPolicy('deleted', 'policy-1', 'Security Policy');

        // Medium severity gets queued, not sent immediately
        expect(mockApiClient.createActivity).not.toHaveBeenCalled();
        expect((activityService as any).queue).toHaveLength(1);
      });
    });

    describe('trackUser', () => {
      it('tracks user deletion but queues medium severity', async () => {
        await trackUser('deleted', 'user-1', 'John Doe');

        // Medium severity gets queued, not sent immediately
        expect(mockApiClient.createActivity).not.toHaveBeenCalled();
        expect((activityService as any).queue).toHaveLength(1);
      });
    });

    describe('trackSecurity', () => {
      it('tracks security events with high severity by default', async () => {
        await trackSecurity('violation_detected', 'Suspicious login attempt');

        expect(mockApiClient.createActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'security_event',
            category: 'security',
            action: 'violation_detected',
            description: 'Suspicious login attempt',
            severity: 'high',
          })
        );
      });

      it('tracks security events with custom critical severity', async () => {
        await trackSecurity('data_breach', 'Data breach detected', 'critical');

        expect(mockApiClient.createActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'security_event',
            category: 'security',
            action: 'data_breach',
            description: 'Data breach detected',
            severity: 'critical',
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles tracking failures gracefully', async () => {
      // Enable service first
      (activityService as any).apiAvailable = true;
      (activityService as any).isEnabled = true;

      // Make tracking fail
      mockApiClient.createActivity.mockRejectedValue(new Error('Tracking failed'));

      await activityService.track({
        type: 'security_event',
        category: 'security',
        action: 'critical_failure',
        description: 'Should fail',
        severity: 'critical',
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to flush activity queue:',
        expect.any(Error)
      );
    });
  });
});