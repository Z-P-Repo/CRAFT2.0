import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog';

// Simple test without complex mocking
const mockTheme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
);

const mockProps = {
  open: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
  title: 'Delete Subject',
  entityName: 'subject',
  entityNamePlural: 'subjects',
  loading: false,
};

describe('DeleteConfirmationDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open is true', () => {
    render(
      <TestWrapper>
        <DeleteConfirmationDialog {...mockProps} />
      </TestWrapper>
    );
    
    expect(screen.getByText('Delete Subject')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <TestWrapper>
        <DeleteConfirmationDialog {...mockProps} open={false} />
      </TestWrapper>
    );
    
    expect(screen.queryByText('Delete Subject')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    render(
      <TestWrapper>
        <DeleteConfirmationDialog {...mockProps} />
      </TestWrapper>
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when delete is clicked', () => {
    render(
      <TestWrapper>
        <DeleteConfirmationDialog {...mockProps} />
      </TestWrapper>
    );
    
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    expect(mockProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(
      <TestWrapper>
        <DeleteConfirmationDialog {...mockProps} loading={true} />
      </TestWrapper>
    );
    
    const deleteButton = screen.getByText('Delete').closest('button');
    expect(deleteButton).toBeDisabled();
  });

  it('displays item name when provided', () => {
    const item = {
      id: '1',
      name: 'Test Item',
      displayName: 'Test Item',
      isSystem: false,
    };
    
    render(
      <TestWrapper>
        <DeleteConfirmationDialog {...mockProps} item={item} />
      </TestWrapper>
    );
    
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('shows system warning for system items', () => {
    const systemItem = {
      id: '1',
      name: 'System Item',
      displayName: 'System Item',
      isSystem: true,
    };
    
    render(
      <TestWrapper>
        <DeleteConfirmationDialog {...mockProps} item={systemItem} />
      </TestWrapper>
    );
    
    expect(screen.getByText(/system subject/i)).toBeInTheDocument();
  });

  it('handles bulk mode', () => {
    const items = [
      { id: '1', name: 'Item 1', displayName: 'Item 1', isSystem: false },
      { id: '2', name: 'Item 2', displayName: 'Item 2', isSystem: false },
    ];
    
    render(
      <TestWrapper>
        <DeleteConfirmationDialog {...mockProps} bulkMode={true} items={items} />
      </TestWrapper>
    );
    
    expect(screen.getByText(/Are you sure you want to delete these 2 subjects/)).toBeInTheDocument();
  });

  it('displays additional info when provided', () => {
    const additionalInfo = 'This action cannot be undone';
    
    render(
      <TestWrapper>
        <DeleteConfirmationDialog {...mockProps} additionalInfo={additionalInfo} />
      </TestWrapper>
    );
    
    expect(screen.getByText(additionalInfo)).toBeInTheDocument();
  });
});