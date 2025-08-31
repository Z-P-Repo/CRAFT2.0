import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { SnackbarProvider, useSnackbar, useApiSnackbar } from '../SnackbarContext';

// Mock MUI components
jest.mock('@mui/material', () => ({
  Snackbar: ({ children, open, onClose, autoHideDuration, TransitionComponent, anchorOrigin, sx }: any) => (
    open ? (
      <div 
        data-testid="snackbar"
        data-auto-hide-duration={autoHideDuration || ''}
        data-anchor-vertical={anchorOrigin?.vertical}
        data-anchor-horizontal={anchorOrigin?.horizontal}
      >
        {TransitionComponent ? React.createElement(TransitionComponent, {}, children) : children}
        <button data-testid="snackbar-close" onClick={onClose}>Close Snackbar</button>
        <button data-testid="snackbar-close-clickaway" onClick={(e) => onClose(e, 'clickaway')}>Close Clickaway</button>
      </div>
    ) : null
  ),
  Alert: ({ children, severity, variant, action, onClose, sx }: any) => (
    <div 
      data-testid="alert"
      data-severity={severity}
      data-variant={variant}
    >
      {children}
      {action}
      <button data-testid="alert-close" onClick={onClose}>Close Alert</button>
    </div>
  ),
  Slide: React.forwardRef<any, any>(function SlideTransition({ children, direction, appear, enter, exit, ...props }, ref) {
    return (
      <div 
        ref={ref} 
        data-testid="slide-transition" 
        data-direction={direction}
        data-appear={appear ? 'true' : 'false'}
        data-enter={enter ? 'true' : 'false'}
        data-exit={exit ? 'true' : 'false'}
        {...props}
      >
        {children}
      </div>
    );
  }),
}));

jest.mock('@mui/material/transitions', () => ({
  TransitionProps: {},
}));

describe('SnackbarContext', () => {
  // Test component to interact with SnackbarContext
  const TestComponent = ({ onSnackbarData }: { onSnackbarData?: (snackbar: any) => void }) => {
    const snackbar = useSnackbar();
    
    React.useEffect(() => {
      if (onSnackbarData) {
        onSnackbarData(snackbar);
      }
    }, [snackbar, onSnackbarData]);

    return (
      <div>
        <button data-testid="show-info" onClick={() => snackbar.showInfo('Info message')}>
          Show Info
        </button>
        <button data-testid="show-success" onClick={() => snackbar.showSuccess('Success message')}>
          Show Success
        </button>
        <button data-testid="show-error" onClick={() => snackbar.showError('Error message')}>
          Show Error
        </button>
        <button data-testid="show-warning" onClick={() => snackbar.showWarning('Warning message')}>
          Show Warning
        </button>
        <button data-testid="show-custom" onClick={() => snackbar.showSnackbar('Custom message', 'success', 2000)}>
          Show Custom
        </button>
        <button data-testid="show-with-action" onClick={() => 
          snackbar.showSnackbar('Message with action', 'info', 4000, <button>Action</button>)
        }>
          Show With Action
        </button>
        <button data-testid="hide-snackbar" onClick={() => snackbar.hideSnackbar()}>
          Hide Snackbar
        </button>
      </div>
    );
  };

  // Test component for useApiSnackbar
  const ApiTestComponent = ({ onApiSnackbarData }: { onApiSnackbarData?: (apiSnackbar: any) => void }) => {
    const apiSnackbar = useApiSnackbar();
    
    React.useEffect(() => {
      if (onApiSnackbarData) {
        onApiSnackbarData(apiSnackbar);
      }
    }, [apiSnackbar, onApiSnackbarData]);

    return (
      <div>
        <button data-testid="handle-success-response" onClick={() => 
          apiSnackbar.handleApiResponse({ success: true, message: 'API Success' })
        }>
          Handle Success Response
        </button>
        <button data-testid="handle-error-response" onClick={() => 
          apiSnackbar.handleApiResponse({ success: false, error: 'API Error' })
        }>
          Handle Error Response
        </button>
        <button data-testid="handle-api-error" onClick={() => 
          apiSnackbar.handleApiError({ message: 'Network error' })
        }>
          Handle API Error
        </button>
      </div>
    );
  };

  describe('Provider and Hook', () => {
    it('provides snackbar context to children', () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      expect(screen.getByTestId('show-info')).toBeInTheDocument();
      expect(screen.getByTestId('show-success')).toBeInTheDocument();
      expect(screen.getByTestId('show-error')).toBeInTheDocument();
      expect(screen.getByTestId('show-warning')).toBeInTheDocument();
    });

    it('throws error when useSnackbar is used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSnackbar must be used within a SnackbarProvider');
      
      consoleError.mockRestore();
    });

    it('throws error when useApiSnackbar is used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<ApiTestComponent />);
      }).toThrow('useSnackbar must be used within a SnackbarProvider');
      
      consoleError.mockRestore();
    });
  });

  describe('Basic Snackbar Functions', () => {
    it('shows info snackbar', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('show-info'));
      });

      expect(screen.getByTestId('snackbar')).toBeInTheDocument();
      expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'info');
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('shows success snackbar', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('show-success'));
      });

      expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'success');
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('shows error snackbar', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('show-error'));
      });

      expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error');
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByTestId('snackbar')).toHaveAttribute('data-auto-hide-duration', '6000');
    });

    it('shows warning snackbar', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('show-warning'));
      });

      expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'warning');
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByTestId('snackbar')).toHaveAttribute('data-auto-hide-duration', '5000');
    });

    it('shows custom snackbar with custom duration', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('show-custom'));
      });

      expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'success');
      expect(screen.getByText('Custom message')).toBeInTheDocument();
      expect(screen.getByTestId('snackbar')).toHaveAttribute('data-auto-hide-duration', '2000');
    });

    it('shows snackbar with action', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('show-with-action'));
      });

      expect(screen.getByText('Message with action')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  describe('Snackbar Visibility and Hiding', () => {
    it('hides snackbar manually', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      // Show snackbar
      act(() => {
        fireEvent.click(screen.getByTestId('show-info'));
      });

      expect(screen.getByTestId('snackbar')).toBeInTheDocument();

      // Hide snackbar
      act(() => {
        fireEvent.click(screen.getByTestId('hide-snackbar'));
      });

      expect(screen.queryByTestId('snackbar')).not.toBeInTheDocument();
    });

    it('closes snackbar via close button', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('show-info'));
      });

      expect(screen.getByTestId('snackbar')).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByTestId('snackbar-close'));
      });

      expect(screen.queryByTestId('snackbar')).not.toBeInTheDocument();
    });

    it('closes snackbar via alert close button', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('show-info'));
      });

      expect(screen.getByTestId('snackbar')).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByTestId('alert-close'));
      });

      expect(screen.queryByTestId('snackbar')).not.toBeInTheDocument();
    });

    it('does not close on clickaway', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('show-info'));
      });

      expect(screen.getByTestId('snackbar')).toBeInTheDocument();

      // Simulate clickaway event - should NOT close the snackbar
      act(() => {
        fireEvent.click(screen.getByTestId('snackbar-close-clickaway'));
      });

      // Snackbar should still be visible (clickaway should be ignored)
      expect(screen.getByTestId('snackbar')).toBeInTheDocument();
    });
  });

  describe('Snackbar Configuration', () => {
    it('sets correct anchor position', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('show-info'));
      });

      const snackbar = screen.getByTestId('snackbar');
      expect(snackbar).toHaveAttribute('data-anchor-vertical', 'top');
      expect(snackbar).toHaveAttribute('data-anchor-horizontal', 'center');
    });

    it('uses slide transition', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('show-info'));
      });

      const transition = screen.getByTestId('slide-transition');
      expect(transition).toHaveAttribute('data-direction', 'down');
      expect(transition).toHaveAttribute('data-appear', 'true');
      expect(transition).toHaveAttribute('data-enter', 'true');
      expect(transition).toHaveAttribute('data-exit', 'true');
    });

    it('shows alert with filled variant', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('show-info'));
      });

      expect(screen.getByTestId('alert')).toHaveAttribute('data-variant', 'filled');
    });
  });

  describe('useApiSnackbar', () => {
    it('handles successful API response', async () => {
      render(
        <SnackbarProvider>
          <ApiTestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('handle-success-response'));
      });

      expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'success');
      expect(screen.getByText('API Success')).toBeInTheDocument();
    });

    it('handles error API response', async () => {
      render(
        <SnackbarProvider>
          <ApiTestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('handle-error-response'));
      });

      expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error');
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });

    it('handles API error object', async () => {
      render(
        <SnackbarProvider>
          <ApiTestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('handle-api-error'));
      });

      expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error');
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('handles API response with custom success message', async () => {
      let apiSnackbarData: any;
      render(
        <SnackbarProvider>
          <ApiTestComponent onApiSnackbarData={(apiSnackbar) => { apiSnackbarData = apiSnackbar; }} />
        </SnackbarProvider>
      );

      act(() => {
        apiSnackbarData.handleApiResponse(
          { success: true },
          'Custom success message'
        );
      });

      expect(screen.getByText('Custom success message')).toBeInTheDocument();
    });

    it('handles API response with custom error message', async () => {
      let apiSnackbarData: any;
      render(
        <SnackbarProvider>
          <ApiTestComponent onApiSnackbarData={(apiSnackbar) => { apiSnackbarData = apiSnackbar; }} />
        </SnackbarProvider>
      );

      act(() => {
        apiSnackbarData.handleApiResponse(
          { success: false },
          undefined,
          'Custom error message'
        );
      });

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('handles API response with default success message', async () => {
      let apiSnackbarData: any;
      render(
        <SnackbarProvider>
          <ApiTestComponent onApiSnackbarData={(apiSnackbar) => { apiSnackbarData = apiSnackbar; }} />
        </SnackbarProvider>
      );

      act(() => {
        apiSnackbarData.handleApiResponse({ success: true });
      });

      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    });

    it('handles API response with default error message', async () => {
      let apiSnackbarData: any;
      render(
        <SnackbarProvider>
          <ApiTestComponent onApiSnackbarData={(apiSnackbar) => { apiSnackbarData = apiSnackbar; }} />
        </SnackbarProvider>
      );

      act(() => {
        apiSnackbarData.handleApiResponse({ success: false });
      });

      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });

  describe('API Error Handling', () => {
    it('handles error with response data', async () => {
      let apiSnackbarData: any;
      render(
        <SnackbarProvider>
          <ApiTestComponent onApiSnackbarData={(apiSnackbar) => { apiSnackbarData = apiSnackbar; }} />
        </SnackbarProvider>
      );

      act(() => {
        apiSnackbarData.handleApiError({
          response: {
            data: {
              error: 'Server error from response'
            }
          }
        });
      });

      expect(screen.getByText('Server error from response')).toBeInTheDocument();
    });

    it('handles error with response message', async () => {
      let apiSnackbarData: any;
      render(
        <SnackbarProvider>
          <ApiTestComponent onApiSnackbarData={(apiSnackbar) => { apiSnackbarData = apiSnackbar; }} />
        </SnackbarProvider>
      );

      act(() => {
        apiSnackbarData.handleApiError({
          response: {
            data: {
              message: 'Server message from response'
            }
          }
        });
      });

      expect(screen.getByText('Server message from response')).toBeInTheDocument();
    });

    it('handles error with fallback message', async () => {
      let apiSnackbarData: any;
      render(
        <SnackbarProvider>
          <ApiTestComponent onApiSnackbarData={(apiSnackbar) => { apiSnackbarData = apiSnackbar; }} />
        </SnackbarProvider>
      );

      act(() => {
        apiSnackbarData.handleApiError({}, 'Fallback error message');
      });

      expect(screen.getByText('Fallback error message')).toBeInTheDocument();
    });

    it('handles error with default message', async () => {
      let apiSnackbarData: any;
      render(
        <SnackbarProvider>
          <ApiTestComponent onApiSnackbarData={(apiSnackbar) => { apiSnackbarData = apiSnackbar; }} />
        </SnackbarProvider>
      );

      act(() => {
        apiSnackbarData.handleApiError({});
      });

      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });

  describe('Snackbar Message Generation', () => {
    it('generates unique IDs for snackbar messages', async () => {
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        return 1000 + callCount;
      });

      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('show-info'));
      });

      act(() => {
        fireEvent.click(screen.getByTestId('hide-snackbar'));
      });

      act(() => {
        fireEvent.click(screen.getByTestId('show-success'));
      });

      expect(Date.now).toHaveBeenCalledTimes(2);

      Date.now = originalDateNow;
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('handles multiple rapid snackbar calls', async () => {
      render(
        <SnackbarProvider>
          <TestComponent />
        </SnackbarProvider>
      );

      // Rapidly show multiple snackbars
      act(() => {
        fireEvent.click(screen.getByTestId('show-info'));
        fireEvent.click(screen.getByTestId('show-success'));
        fireEvent.click(screen.getByTestId('show-error'));
      });

      // Should show the last one (error)
      expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error');
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('handles snackbar with null duration', async () => {
      let snackbarData: any;
      render(
        <SnackbarProvider>
          <TestComponent onSnackbarData={(snackbar) => { snackbarData = snackbar; }} />
        </SnackbarProvider>
      );

      act(() => {
        snackbarData.showSnackbar('Message', 'info', null);
      });

      expect(screen.getByTestId('snackbar')).toHaveAttribute('data-auto-hide-duration', '');
    });

    it('provides all snackbar methods through useApiSnackbar', async () => {
      let apiSnackbarData: any;
      render(
        <SnackbarProvider>
          <ApiTestComponent onApiSnackbarData={(apiSnackbar) => { apiSnackbarData = apiSnackbar; }} />
        </SnackbarProvider>
      );

      // Should have all methods from useSnackbar plus API helpers
      expect(typeof apiSnackbarData.showSnackbar).toBe('function');
      expect(typeof apiSnackbarData.showSuccess).toBe('function');
      expect(typeof apiSnackbarData.showError).toBe('function');
      expect(typeof apiSnackbarData.showWarning).toBe('function');
      expect(typeof apiSnackbarData.showInfo).toBe('function');
      expect(typeof apiSnackbarData.hideSnackbar).toBe('function');
      expect(typeof apiSnackbarData.handleApiResponse).toBe('function');
      expect(typeof apiSnackbarData.handleApiError).toBe('function');
    });

    it('exports SnackbarContext properly', () => {
      const { SnackbarContext } = require('../SnackbarContext');
      expect(SnackbarContext).toBeDefined();
    });
  });
});