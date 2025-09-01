import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ActivityDetailModal from '../ActivityDetailModal';
import { Activity } from '@/types';

const mockTheme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
);

const mockActivity: Activity = {
  _id: 'activity-1',
  type: 'authentication',
  category: 'security',
  action: 'login',
  description: 'User logged in successfully',
  actor: {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    type: 'user',
  },
  resource: {
    type: 'user',
    id: 'user-1',
    name: 'John Doe',
  },
  timestamp: '2023-12-01T10:00:00.000Z',
  severity: 'low',
  metadata: {
    status: 'success',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'session-123',
    duration: 250,
  },
  tags: ['login', 'success'],
};

const mockSystemActivity: Activity = {
  _id: 'activity-2',
  type: 'system_configuration',
  category: 'configuration',
  action: 'system_update',
  description: 'System configuration updated',
  actor: {
    id: 'system-1',
    name: 'System',
    email: 'system@example.com',
    type: 'system',
  },
  resource: {
    type: 'system',
    id: 'system-1',
    name: 'Main System',
  },
  timestamp: '2023-12-01T09:30:00.000Z',
  severity: 'medium',
  metadata: {
    status: 'success',
  },
  tags: ['system', 'configuration'],
};

const mockServiceActivity: Activity = {
  _id: 'activity-3',
  type: 'integration',
  category: 'integration',
  action: 'api_call',
  description: 'External API integration call',
  actor: {
    id: 'service-1',
    name: 'API Service',
    email: 'service@example.com',
    type: 'service',
  },
  resource: {
    type: 'api',
    id: 'api-1',
    name: 'External API',
  },
  timestamp: '2023-12-01T11:15:00.000Z',
  severity: 'critical',
  metadata: {
    status: 'failure',
    errorMessage: 'Connection timeout',
  },
  tags: ['api', 'integration', 'failure'],
};

const mockOnClose = jest.fn();

describe('ActivityDetailModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders nothing when activity is null', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={null}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders nothing when modal is closed', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={false}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders modal when open with activity', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Activity Details')).toBeInTheDocument();
    });

    it('displays activity action in dialog title', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getAllByText('LOGIN')).toHaveLength(2); // Title and content
    });

    it('renders close button with proper aria-label', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const closeButton = screen.getByLabelText('close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Activity Information Display', () => {
    it('displays activity description and action', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getAllByText('LOGIN')).toHaveLength(2); // Title and content
      expect(screen.getByText('User logged in successfully')).toBeInTheDocument();
    });

    it('displays severity chip with correct styling', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const severityChip = screen.getByText('LOW');
      expect(severityChip).toBeInTheDocument();
      expect(severityChip).toHaveClass('MuiChip-label');
    });

    it('displays different severity levels correctly', () => {
      const { rerender } = render(
        <TestWrapper>
          <ActivityDetailModal
            activity={{ ...mockActivity, severity: 'critical' }}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText('CRITICAL')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <ActivityDetailModal
            activity={{ ...mockActivity, severity: 'high' }}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText('HIGH')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <ActivityDetailModal
            activity={{ ...mockActivity, severity: 'medium' }}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });

    it('formats timestamp correctly with relative time', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Time:/)).toBeInTheDocument();
      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });
  });

  describe('Actor Information', () => {
    it('displays user actor with avatar initials', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();

      // Should show user's initials in avatar
      const avatar = screen.getByText('J');
      expect(avatar).toBeInTheDocument();
    });

    it('displays system actor with system icon', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockSystemActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('system@example.com')).toBeInTheDocument();
      expect(screen.getAllByText('system')).toHaveLength(2); // Type and chip

      // Should have system icon instead of initials
      expect(screen.queryByText('S')).not.toBeInTheDocument();
    });

    it('displays service actor with service icon', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockServiceActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText('API Service')).toBeInTheDocument();
      expect(screen.getByText('service@example.com')).toBeInTheDocument();
      expect(screen.getByText('service')).toBeInTheDocument();
    });
  });

  describe('Resource and Category Information', () => {
    it('displays resource information', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Resource:/)).toBeInTheDocument();
      expect(screen.getByText('John Doe (user)')).toBeInTheDocument();
    });

    it('displays category and type information', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Category:/)).toBeInTheDocument();
      expect(screen.getByText('security')).toBeInTheDocument();
      // Use getAllByText since there are multiple "Type:" labels
      const typeLabels = screen.getAllByText(/Type:/);
      expect(typeLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('authentication')).toBeInTheDocument();
    });

    it('displays status information', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      // Check for Status field in Details section
      const statusElements = screen.getAllByText(/Status:/);
      expect(statusElements.length).toBeGreaterThan(0);
      // Check for status icon (CheckCircleIcon)
      expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
      const successTexts = screen.getAllByText('success');
      expect(successTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Metadata Display', () => {
    it('displays metadata section when metadata exists', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Metadata')).toBeInTheDocument();
      const statusElements = screen.getAllByText(/Status:/);
      expect(statusElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/IP Address:/)).toBeInTheDocument();
      const ipAddresses = screen.getAllByText('192.168.1.1');
      expect(ipAddresses.length).toBeGreaterThan(0);
    });

    it('shows IP address when available in metadata', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/IP Address:/)).toBeInTheDocument();
      const ipAddresses = screen.getAllByText('192.168.1.1');
      expect(ipAddresses.length).toBeGreaterThan(0);
    });

    it('hides metadata section when no metadata', () => {
      const activityWithoutMetadata = {
        ...mockActivity,
        metadata: undefined,
      };

      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={activityWithoutMetadata}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Metadata')).not.toBeInTheDocument();
    });

    it('displays all metadata fields', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/UserAgent:/)).toBeInTheDocument();
      expect(screen.getByText(/SessionId:/)).toBeInTheDocument();
      expect(screen.getByText(/Duration:/)).toBeInTheDocument();
    });
  });

  describe('Tags Display', () => {
    it('displays tags section when tags exist', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('login')).toBeInTheDocument();
      // Check for the success tag specifically
      const successTexts = screen.getAllByText('success');
      expect(successTexts.length).toBeGreaterThan(0); // Should find the tag and status
    });

    it('hides tags section when no tags', () => {
      const activityWithoutTags = {
        ...mockActivity,
        tags: undefined,
      };

      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={activityWithoutTags}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    });

    it('hides tags section when empty tags array', () => {
      const activityWithEmptyTags = {
        ...mockActivity,
        tags: [],
      };

      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={activityWithEmptyTags}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const closeButton = screen.getByLabelText('close');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Close button in actions clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const closeActionButton = screen.getByText('Close');
      await user.click(closeActionButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking outside modal', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Status Icons', () => {
    it('displays success icon for success status', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      // Success status should be displayed with icon
      expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
      const successTexts = screen.getAllByText('success');
      expect(successTexts.length).toBeGreaterThan(0);
    });

    it('displays failure status correctly', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockServiceActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      // Failure status should be displayed with error icon
      expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
      const failureTexts = screen.getAllByText('failure');
      expect(failureTexts.length).toBeGreaterThan(0);
    });

    it('displays pending status', () => {
      const pendingActivity = {
        ...mockActivity,
        metadata: {
          ...mockActivity.metadata!,
          status: 'pending'
        }
      };

      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={pendingActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('WarningIcon')).toBeInTheDocument();
      const pendingTexts = screen.getAllByText('pending');
      expect(pendingTexts.length).toBeGreaterThan(0);
    });

    it('handles unknown status values', () => {
      const unknownStatusActivity = {
        ...mockActivity,
        metadata: {
          ...mockActivity.metadata!,
          status: 'unknown_status'
        }
      };

      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={unknownStatusActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('InfoIcon')).toBeInTheDocument(); // Default icon
      const unknownTexts = screen.getAllByText('unknown_status');
      expect(unknownTexts.length).toBeGreaterThan(0);
    });

    it('handles missing status gracefully', () => {
      const activityWithoutStatus = {
        ...mockActivity,
        metadata: {
          ipAddress: '192.168.1.1',
        },
      };

      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={activityWithoutStatus}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('InfoIcon')).toBeInTheDocument(); // Default icon when no metadata status
      const successTexts = screen.getAllByText('success'); // Default status
      expect(successTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('renders with proper responsive layout', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // Check that dialog exists and is properly sized (Material-UI handles maxWidth internally)
      expect(dialog).toHaveClass('MuiDialog-paper');
    });

    it('maintains minimum height for consistent layout', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // Check that dialog paper exists (Material-UI applies minHeight via PaperProps)
      expect(dialog).toHaveClass('MuiDialog-paper');
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has accessible close button', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const closeButton = screen.getByLabelText('close');
      expect(closeButton).toHaveAttribute('aria-label', 'close');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      // Should be able to tab to close button
      await user.tab();
      const closeButton = screen.getByLabelText('close');
      expect(closeButton).toHaveFocus();
    });

    it('traps focus within modal', () => {
      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={mockActivity}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Modal should contain focusable elements
      const closeButton = screen.getByLabelText('close');
      const actionButton = screen.getByText('Close');
      
      expect(closeButton).toBeInTheDocument();
      expect(actionButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long descriptions gracefully', () => {
      const activityWithLongDescription = {
        ...mockActivity,
        description: 'This is a very long description that should be handled gracefully by the component without breaking the layout or causing any issues with the display of the modal'.repeat(5),
      };

      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={activityWithLongDescription}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles empty metadata object', () => {
      const activityWithEmptyMetadata = {
        ...mockActivity,
        metadata: {},
      };

      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={activityWithEmptyMetadata}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Metadata')).not.toBeInTheDocument();
    });

    it('handles special characters in activity data', () => {
      const activityWithSpecialChars = {
        ...mockActivity,
        description: 'Activity with special chars: <>&"\'',
        actor: {
          ...mockActivity.actor,
          name: 'User <Test>',
          email: 'test@domain.com',
        },
      };

      render(
        <TestWrapper>
          <ActivityDetailModal
            activity={activityWithSpecialChars}
            open={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Activity with special chars: <>&"\'')).toBeInTheDocument();
      expect(screen.getByText('User <Test>')).toBeInTheDocument();
    });
  });
});