import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CreateAttributeDialog from '../CreateAttributeDialog';

// Mock MUI components
jest.mock('@mui/material', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogActions: ({ children }: any) => <div data-testid="dialog-actions">{children}</div>,
  TextField: ({ value, onChange, label, placeholder }: any) => (
    <input 
      value={value || ''} 
      onChange={onChange}
      placeholder={placeholder}
      data-testid={`input-${label?.toLowerCase().replace(/\s+/g, '-')}`}
    />
  ),
  FormControl: ({ children }: any) => <div>{children}</div>,
  InputLabel: ({ children }: any) => <label>{children}</label>,
  Select: ({ value, onChange, children }: any) => (
    <select 
      value={value} 
      onChange={(e) => onChange({ target: { value: e.target.value } })}
      data-testid={`select-${value}`}
    >
      {children}
    </select>
  ),
  MenuItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  Button: ({ children, onClick, disabled }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-testid={`button-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`}
    >
      {children}
    </button>
  ),
  Box: ({ children }: any) => <div>{children}</div>,
  Grid: ({ children }: any) => <div>{children}</div>,
  Typography: ({ children }: any) => <div>{children}</div>,
  Switch: ({ checked, onChange }: any) => (
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onChange({ target: { checked: e.target.checked } })}
      data-testid="switch"
    />
  ),
  FormControlLabel: ({ control, label }: any) => (
    <label data-testid={`label-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
      {control}{label}
    </label>
  ),
  IconButton: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="icon-button">
      {children}
    </button>
  ),
}));

jest.mock('@mui/icons-material', () => ({
  Settings: () => <span data-testid="settings-icon">Settings</span>,
  Add: () => <span data-testid="add-icon">Add</span>,
  Close: () => <span data-testid="close-icon">Close</span>,
}));

describe('CreateAttributeDialog', () => {
  const mockProps = {
    open: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockProps.onSubmit.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('renders when open', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<CreateAttributeDialog {...mockProps} open={false} />);
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('renders form elements', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      expect(screen.getByTestId('input-attribute-name')).toBeInTheDocument();
      expect(screen.getByTestId('input-display-name')).toBeInTheDocument();
      expect(screen.getByTestId('input-description')).toBeInTheDocument();
      expect(screen.getByTestId('button-cancel')).toBeInTheDocument();
      expect(screen.getByTestId('button-create-attribute')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('updates form fields', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      const nameInput = screen.getByTestId('input-attribute-name');
      const displayInput = screen.getByTestId('input-display-name');
      const descriptionInput = screen.getByTestId('input-description');
      
      fireEvent.change(nameInput, { target: { value: 'test-name' } });
      fireEvent.change(displayInput, { target: { value: 'Test Display' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      
      expect(nameInput).toHaveValue('test-name');
      expect(displayInput).toHaveValue('Test Display');
      expect(descriptionInput).toHaveValue('Test description');
    });

    it('toggles switches', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      const switches = screen.getAllByTestId('switch');
      const requiredSwitch = switches[0];
      
      expect(requiredSwitch).not.toBeChecked();
      fireEvent.click(requiredSwitch);
      expect(requiredSwitch).toBeChecked();
    });

    it('manages enum values', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      const enumInput = screen.getByPlaceholderText('Value 1');
      fireEvent.change(enumInput, { target: { value: 'enum1' } });
      expect(enumInput).toHaveValue('enum1');
      
      const addButton = screen.getByTestId('button-add-value');
      fireEvent.click(addButton);
      
      expect(screen.getByPlaceholderText('Value 2')).toBeInTheDocument();
      
      const removeButtons = screen.getAllByTestId('icon-button');
      expect(removeButtons[1]).not.toBeDisabled();
      fireEvent.click(removeButtons[1]);
      
      expect(screen.queryByPlaceholderText('Value 2')).not.toBeInTheDocument();
    });

    it('prevents removing last enum value', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      const removeButton = screen.getByTestId('icon-button');
      expect(removeButton).toBeDisabled();
    });
  });

  describe('Validation and Submission', () => {
    it('disables submit when fields are empty', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      const submitButton = screen.getByTestId('button-create-attribute');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit when required fields are filled', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      fireEvent.change(screen.getByTestId('input-attribute-name'), { target: { value: 'test' } });
      fireEvent.change(screen.getByTestId('input-display-name'), { target: { value: 'Test' } });
      
      const submitButton = screen.getByTestId('button-create-attribute');
      expect(submitButton).not.toBeDisabled();
    });

    it('submits form with valid data', async () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      fireEvent.change(screen.getByTestId('input-attribute-name'), { target: { value: 'test' } });
      fireEvent.change(screen.getByTestId('input-display-name'), { target: { value: 'Test' } });
      
      const submitButton = screen.getByTestId('button-create-attribute');
      
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      expect(mockProps.onSubmit).toHaveBeenCalledWith({
        name: 'test',
        displayName: 'Test',
        description: '',
        category: 'subject',
        dataType: 'string',
        isRequired: false,
        isMultiValue: false,
        enumValues: ['']
      });
    });

    it('does not submit with empty name', async () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      fireEvent.change(screen.getByTestId('input-display-name'), { target: { value: 'Test' } });
      
      const submitButton = screen.getByTestId('button-create-attribute');
      fireEvent.click(submitButton);
      
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('does not submit with empty display name', async () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      fireEvent.change(screen.getByTestId('input-attribute-name'), { target: { value: 'test' } });
      
      const submitButton = screen.getByTestId('button-create-attribute');
      fireEvent.click(submitButton);
      
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('handles loading state', () => {
      render(<CreateAttributeDialog {...mockProps} loading={true} />);
      
      fireEvent.change(screen.getByTestId('input-attribute-name'), { target: { value: 'test' } });
      fireEvent.change(screen.getByTestId('input-display-name'), { target: { value: 'Test' } });
      
      const submitButton = screen.getByTestId('button-create-attribute');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Dialog Actions', () => {
    it('calls onClose when cancelled', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      const cancelButton = screen.getByTestId('button-cancel');
      fireEvent.click(cancelButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('resets form on close', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      fireEvent.change(screen.getByTestId('input-attribute-name'), { target: { value: 'test' } });
      
      const cancelButton = screen.getByTestId('button-cancel');
      fireEvent.click(cancelButton);
      
      expect(screen.getByTestId('input-attribute-name')).toHaveValue('');
    });

    it('resets form after submission', async () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      fireEvent.change(screen.getByTestId('input-attribute-name'), { target: { value: 'test' } });
      fireEvent.change(screen.getByTestId('input-display-name'), { target: { value: 'Test' } });
      
      const submitButton = screen.getByTestId('button-create-attribute');
      
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      expect(screen.getByTestId('input-attribute-name')).toHaveValue('');
      expect(screen.getByTestId('input-display-name')).toHaveValue('');
    });
  });

  describe('Data Type Changes', () => {
    it('shows enum section for string type', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      expect(screen.getByText('Predefined Values (Optional)')).toBeInTheDocument();
    });

    it('hides enum section for non-string types', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      const select = screen.getByTestId('select-string');
      fireEvent.change(select, { target: { value: 'number' } });
      
      expect(screen.queryByText('Predefined Values (Optional)')).not.toBeInTheDocument();
    });
  });

  describe('Default Props', () => {
    it('uses default loading false', () => {
      const propsWithoutLoading = {
        open: true,
        onClose: jest.fn(),
        onSubmit: jest.fn(),
      };
      
      render(<CreateAttributeDialog {...propsWithoutLoading} />);
      
      fireEvent.change(screen.getByTestId('input-attribute-name'), { target: { value: 'test' } });
      fireEvent.change(screen.getByTestId('input-display-name'), { target: { value: 'Test' } });
      
      const submitButton = screen.getByTestId('button-create-attribute');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Complex Form States', () => {
    it('handles all form options', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      // Test category options
      const categorySelect = screen.getByTestId('select-subject');
      fireEvent.change(categorySelect, { target: { value: 'resource' } });
      fireEvent.change(categorySelect, { target: { value: 'action' } });
      fireEvent.change(categorySelect, { target: { value: 'environment' } });
      
      // Test data type options
      const dataTypeSelect = screen.getByTestId('select-string');
      fireEvent.change(dataTypeSelect, { target: { value: 'boolean' } });
      fireEvent.change(dataTypeSelect, { target: { value: 'number' } });
      fireEvent.change(dataTypeSelect, { target: { value: 'date' } });
      
      // Test switches
      const switches = screen.getAllByTestId('switch');
      fireEvent.click(switches[0]); // required
      fireEvent.click(switches[1]); // multivalue
      
      expect(switches[0]).toBeChecked();
      expect(switches[1]).toBeChecked();
    });

    it('covers all conditional branches', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      // Test enum value change with different indices
      const enumInput = screen.getByPlaceholderText('Value 1');
      fireEvent.change(enumInput, { target: { value: 'first-value' } });
      
      // Add another enum value to test different indices
      const addButton = screen.getByTestId('button-add-value');
      fireEvent.click(addButton);
      
      const secondEnumInput = screen.getByPlaceholderText('Value 2');
      fireEvent.change(secondEnumInput, { target: { value: 'second-value' } });
      
      // Test removal when multiple values exist
      const removeButtons = screen.getAllByTestId('icon-button');
      expect(removeButtons[0]).not.toBeDisabled();
      fireEvent.click(removeButtons[0]);
      
      // Test the remaining enum value
      expect(screen.getByDisplayValue('second-value')).toBeInTheDocument();
    });

    it('covers submit disabled conditions', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      const submitButton = screen.getByTestId('button-create-attribute');
      
      // Test: no name, no display name (both false)
      expect(submitButton).toBeDisabled();
      
      // Test: has name, no display name (first true, second false)
      fireEvent.change(screen.getByTestId('input-attribute-name'), { target: { value: 'test' } });
      expect(submitButton).toBeDisabled();
      
      // Test: no name, has display name (first false, second true)
      fireEvent.change(screen.getByTestId('input-attribute-name'), { target: { value: '' } });
      fireEvent.change(screen.getByTestId('input-display-name'), { target: { value: 'Test' } });
      expect(submitButton).toBeDisabled();
      
      // Test: has both name and display name (both true)
      fireEvent.change(screen.getByTestId('input-attribute-name'), { target: { value: 'test' } });
      expect(submitButton).not.toBeDisabled();
    });

    it('covers loading condition in submit disabled', () => {
      render(<CreateAttributeDialog {...mockProps} loading={true} />);
      
      // Even with valid fields, should be disabled when loading
      fireEvent.change(screen.getByTestId('input-attribute-name'), { target: { value: 'test' } });
      fireEvent.change(screen.getByTestId('input-display-name'), { target: { value: 'Test' } });
      
      const submitButton = screen.getByTestId('button-create-attribute');
      expect(submitButton).toBeDisabled();
    });

    it('covers early return paths in handleSubmit', async () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      // Test the early return when name is missing (line 64)
      fireEvent.change(screen.getByTestId('input-display-name'), { target: { value: 'Test Display' } });
      
      // Try to submit - should hit early return and not call onSubmit
      const submitButton = screen.getByTestId('button-create-attribute');
      fireEvent.click(submitButton);
      
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
      
      // Test the early return when display name is missing (line 64)
      fireEvent.change(screen.getByTestId('input-attribute-name'), { target: { value: 'test-name' } });
      fireEvent.change(screen.getByTestId('input-display-name'), { target: { value: '' } });
      
      fireEvent.click(submitButton);
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('covers successful submission flow', async () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      // Fill required fields to avoid early return
      fireEvent.change(screen.getByTestId('input-attribute-name'), { target: { value: 'test-name' } });
      fireEvent.change(screen.getByTestId('input-display-name'), { target: { value: 'Test Display' } });
      fireEvent.change(screen.getByTestId('input-description'), { target: { value: 'Test description' } });
      
      // Configure additional fields to test complete form data submission
      const switches = screen.getAllByTestId('switch');
      fireEvent.click(switches[0]); // isRequired = true
      fireEvent.click(switches[1]); // isMultiValue = true
      
      // Submit and verify complete flow (lines 66-67: onSubmit call and handleReset)
      const submitButton = screen.getByTestId('button-create-attribute');
      
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      // Verify onSubmit was called with correct data (line 66)
      expect(mockProps.onSubmit).toHaveBeenCalledWith({
        name: 'test-name',
        displayName: 'Test Display',
        description: 'Test description',
        category: 'subject',
        dataType: 'string',
        isRequired: true,
        isMultiValue: true,
        enumValues: ['']
      });
      
      // Verify form was reset after submission (line 67 calls handleReset)
      expect(screen.getByTestId('input-attribute-name')).toHaveValue('');
      expect(screen.getByTestId('input-display-name')).toHaveValue('');
    });

    it('covers removeEnumValue branch when length > 1', () => {
      render(<CreateAttributeDialog {...mockProps} />);
      
      // Add multiple enum values
      const addButton = screen.getByTestId('button-add-value');
      fireEvent.click(addButton);
      fireEvent.click(addButton);
      
      // Should have 3 enum values now
      expect(screen.getByPlaceholderText('Value 1')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Value 2')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Value 3')).toBeInTheDocument();
      
      // Remove the middle value to test filter logic (lines 100-101)
      const removeButtons = screen.getAllByTestId('icon-button');
      fireEvent.click(removeButtons[1]); // Remove second value
      
      // Should have 2 values remaining
      expect(screen.getByPlaceholderText('Value 1')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Value 2')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Value 3')).not.toBeInTheDocument();
    });
  });
});