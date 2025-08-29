import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog';

describe('DeleteConfirmationDialog', () => {
  const mockProps = {
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Delete Subject',
    entityName: 'subject',
    entityNamePlural: 'subjects',
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the dialog when open is true', () => {
      render(<DeleteConfirmationDialog {...mockProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Subject')).toBeInTheDocument();
    });

    it('does not render the dialog when open is false', () => {
      render(<DeleteConfirmationDialog {...mockProps} open={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders the close icon button', () => {
      render(<DeleteConfirmationDialog {...mockProps} />);
      
      const closeButton = screen.getByLabelText('close');
      expect(closeButton).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<DeleteConfirmationDialog {...mockProps} />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  describe('Single Item Mode', () => {
    const singleItemProps = {
      ...mockProps,
      item: {
        id: '1',
        name: 'Test Item',
        displayName: 'Test Item',
        isSystem: false,
      },
    };

    it('displays single item deletion message', () => {
      render(<DeleteConfirmationDialog {...singleItemProps} />);
      
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('shows system item warning for system items', () => {
      render(
        <DeleteConfirmationDialog 
          {...singleItemProps} 
          item={{ ...singleItemProps.item!, isSystem: true }} 
        />
      );
      
      expect(screen.getByText(/system subject/)).toBeInTheDocument();
      expect(screen.getByText(/may affect system functionality/)).toBeInTheDocument();
    });

    it('displays additional info when provided', () => {
      const additionalInfo = 'This action cannot be undone';
      render(
        <DeleteConfirmationDialog 
          {...singleItemProps} 
          additionalInfo={additionalInfo}
        />
      );
      
      expect(screen.getByText(additionalInfo)).toBeInTheDocument();
    });
  });

  describe('Bulk Mode', () => {
    const bulkItemProps = {
      ...mockProps,
      bulkMode: true,
      items: [
        { id: '1', name: 'Item 1', displayName: 'Item 1', isSystem: false },
        { id: '2', name: 'Item 2', displayName: 'Item 2', isSystem: true },
      ],
    };

    it('displays bulk deletion message', () => {
      render(<DeleteConfirmationDialog {...bulkItemProps} />);
      
      expect(screen.getByText(/Are you sure you want to delete these 2 subjects/)).toBeInTheDocument();
    });

    it('lists all items to be deleted', () => {
      render(<DeleteConfirmationDialog {...bulkItemProps} />);
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('shows system item indicator for system items', () => {
      render(<DeleteConfirmationDialog {...bulkItemProps} />);
      
      const systemBadges = screen.getAllByText('System');
      expect(systemBadges).toHaveLength(1); // Only Item 2 is system
    });

    it('shows warning when system items are included', () => {
      render(<DeleteConfirmationDialog {...bulkItemProps} />);
      
      expect(screen.getByText(/includes system subjects/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading is true', () => {
      render(<DeleteConfirmationDialog {...mockProps} loading={true} />);
      
      const deleteButton = screen.getByText('Delete').closest('button');
      expect(deleteButton).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('disables buttons when loading', () => {
      render(<DeleteConfirmationDialog {...mockProps} loading={true} />);
      
      const deleteButton = screen.getByText('Delete').closest('button');
      const cancelButton = screen.getByText('Cancel').closest('button');
      
      expect(deleteButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when close icon is clicked', () => {
      render(<DeleteConfirmationDialog {...mockProps} />);
      
      const closeButton = screen.getByLabelText('close');
      fireEvent.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Cancel button is clicked', () => {
      render(<DeleteConfirmationDialog {...mockProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when Delete button is clicked', () => {
      render(<DeleteConfirmationDialog {...mockProps} />);
      
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      expect(mockProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when dialog backdrop is clicked', async () => {
      render(<DeleteConfirmationDialog {...mockProps} />);
      
      // Click on backdrop (outside the dialog content)
      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        
        await waitFor(() => {
          expect(mockProps.onClose).toHaveBeenCalledTimes(1);
        });
      }
    });

    it('calls onClose when Escape key is pressed', () => {
      render(<DeleteConfirmationDialog {...mockProps} />);
      
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<DeleteConfirmationDialog {...mockProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('focuses on the dialog when opened', () => {
      const { rerender } = render(<DeleteConfirmationDialog {...mockProps} open={false} />);
      
      rerender(<DeleteConfirmationDialog {...mockProps} open={true} />);
      
      expect(screen.getByRole('dialog')).toHaveFocus();
    });

    it('has proper button labels', () => {
      render(<DeleteConfirmationDialog {...mockProps} />);
      
      expect(screen.getByLabelText('close')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty items array in bulk mode', () => {
      render(<DeleteConfirmationDialog {...mockProps} bulkMode={true} items={[]} />);
      
      expect(screen.getByText(/Are you sure you want to delete these 0 subjects/)).toBeInTheDocument();
    });

    it('handles missing displayName and falls back to name', () => {
      const item = { id: '1', name: 'Test Item', isSystem: false };
      render(<DeleteConfirmationDialog {...mockProps} item={item} />);
      
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('handles item without name', () => {
      const item = { id: '1', isSystem: false };
      render(<DeleteConfirmationDialog {...mockProps} item={item} />);
      
      expect(screen.getByText('Unnamed')).toBeInTheDocument();
    });

    it('handles very long item names', () => {
      const longName = 'A'.repeat(100);
      const item = { id: '1', name: longName, displayName: longName, isSystem: false };
      render(<DeleteConfirmationDialog {...mockProps} item={item} />);
      
      // Should still render the long name (truncation is handled by CSS)
      expect(screen.getByText(longName)).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('applies proper theme colors', () => {
      render(<DeleteConfirmationDialog {...mockProps} />);
      
      const deleteButton = screen.getByText('Delete');
      expect(deleteButton).toHaveClass('MuiButton-containedError');
    });

    it('uses consistent spacing and typography', () => {
      render(<DeleteConfirmationDialog {...mockProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle('border-radius: 8px');
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const { rerender } = render(<DeleteConfirmationDialog {...mockProps} />);
      
      // Re-render with same props should not cause issues
      rerender(<DeleteConfirmationDialog {...mockProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles rapid open/close states', async () => {
      const { rerender } = render(<DeleteConfirmationDialog {...mockProps} open={false} />);
      
      rerender(<DeleteConfirmationDialog {...mockProps} open={true} />);
      rerender(<DeleteConfirmationDialog {...mockProps} open={false} />);
      rerender(<DeleteConfirmationDialog {...mockProps} open={true} />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });
});