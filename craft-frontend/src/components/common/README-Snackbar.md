# Standardized Snackbar System

## Overview
The CRAFT application uses a standardized snackbar system for all user feedback, API responses, and notifications. This ensures a consistent and professional user experience across the entire application.

## Usage

### Basic Import
```typescript
import { useApiSnackbar } from '@/contexts/SnackbarContext';

const MyComponent = () => {
  const snackbar = useApiSnackbar();
  // ... component logic
};
```

### Available Methods

#### Basic Snackbar Methods
```typescript
// General purpose snackbar
snackbar.showSnackbar(message, severity, duration, action);

// Convenience methods
snackbar.showSuccess('Operation completed successfully');
snackbar.showError('Something went wrong');
snackbar.showWarning('Please check your input');
snackbar.showInfo('Information message');
snackbar.hideSnackbar(); // Manual close
```

#### API Response Handlers
```typescript
// Automatic handling of API responses
snackbar.handleApiResponse(response, successMessage?, errorMessage?);

// Error handling for API calls
snackbar.handleApiError(error, fallbackMessage?);
```

## Implementation Examples

### 1. Basic Form Submission
```typescript
const handleSubmit = async (formData) => {
  try {
    const response = await apiClient.post('/endpoint', formData);
    
    if (response.success) {
      snackbar.showSuccess('Item created successfully');
      // Navigate or update UI
    } else {
      snackbar.handleApiResponse(response);
    }
  } catch (error) {
    snackbar.handleApiError(error, 'Failed to create item');
  }
};
```

### 2. Delete Operations
```typescript
const handleDelete = async (id) => {
  try {
    const response = await apiClient.delete(`/items/${id}`);
    snackbar.handleApiResponse(
      response, 
      'Item deleted successfully', 
      'Failed to delete item'
    );
  } catch (error) {
    snackbar.handleApiError(error);
  }
};
```

### 3. Validation Feedback
```typescript
const validateForm = () => {
  if (!name.trim()) {
    snackbar.showWarning('Name is required');
    return false;
  }
  if (email && !isValidEmail(email)) {
    snackbar.showError('Please enter a valid email address');
    return false;
  }
  return true;
};
```

### 4. Long-running Operations
```typescript
const handleLongOperation = async () => {
  snackbar.showInfo('Processing... This may take a few moments');
  
  try {
    const response = await apiClient.post('/long-operation');
    snackbar.showSuccess('Operation completed successfully');
  } catch (error) {
    snackbar.handleApiError(error);
  }
};
```

## Best Practices

### Message Guidelines
- **Success**: Use positive, confirmation language
  - ✅ "Policy created successfully"
  - ✅ "Settings saved"
  - ❌ "Policy was created without errors"

- **Error**: Be specific and actionable when possible
  - ✅ "Email address is required"
  - ✅ "Failed to save. Please try again."
  - ❌ "Error occurred"

- **Warning**: Use for validation and non-critical issues
  - ✅ "Please fill in all required fields"
  - ✅ "Changes will be lost if you navigate away"

- **Info**: Use for status updates and helpful information
  - ✅ "Loading data..."
  - ✅ "Auto-save enabled"

### Duration Guidelines
- **Success**: 4 seconds (default)
- **Error**: 6 seconds (longer for users to read)
- **Warning**: 5 seconds (moderate attention)
- **Info**: 4 seconds (default)

### When NOT to Use Snackbars
- Critical errors that require user action (use dialog)
- Form validation for individual fields (use field-level errors)
- Multi-step processes (use progress indicators)
- Permanent status information (use status components)

## Technical Details

### Configuration
The snackbar appears at the top-center of the screen with:
- Slide-down animation
- Professional styling with shadows
- Auto-dismiss after specified duration
- Manual close button
- Responsive width (300px min, 600px max)

### Accessibility
- Proper ARIA labels for screen readers
- Keyboard navigation support
- High contrast colors for visibility
- Appropriate timing for different severity levels

## Migration Guide

### Replacing Existing Alerts
```typescript
// OLD - Inline alerts
const [error, setError] = useState(null);
const [success, setSuccess] = useState(false);

// In JSX
{error && <Alert severity="error">{error}</Alert>}
{success && <Alert severity="success">Success!</Alert>}

// NEW - Snackbar system
const snackbar = useApiSnackbar();

// In handlers
snackbar.showError('Error message');
snackbar.showSuccess('Success message');

// Remove error/success state and Alert components from JSX
```

### API Response Handling
```typescript
// OLD - Manual response checking
if (response.success) {
  setSuccess(true);
  setError(null);
} else {
  setError(response.error || 'Failed');
  setSuccess(false);
}

// NEW - Automatic handling
snackbar.handleApiResponse(response, 'Success message', 'Error message');
```

## Integration Status
- ✅ Policy Creation Page
- ✅ Login Page  
- ✅ Root Layout (SnackbarProvider)
- 🔄 Policy List Page (in progress)
- ⏳ Attributes Page
- ⏳ Subjects Page
- ⏳ Resources Page
- ⏳ Actions Page
- ⏳ Users Page

## Future Enhancements
- Action buttons in snackbars (undo, retry)
- Queued notifications for multiple messages
- Persistent notifications for critical updates
- Custom positioning options