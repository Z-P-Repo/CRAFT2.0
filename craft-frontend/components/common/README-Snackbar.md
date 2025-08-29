# Snackbar Context Documentation

This document describes the implementation and usage of the global snackbar system for displaying notifications and API response messages throughout the CRAFT frontend application.

## ✅ Latest Updates (August 2025)

- **Enhanced API Error Handling**: Comprehensive error message parsing and user-friendly display
- **Success/Error Notifications**: Automatic success and error message handling for all API operations
- **ValidationError Support**: Special handling for backend ValidationError responses with detailed feedback
- **Material-UI Integration**: Seamless integration with Material-UI Alert components
- **Auto-dismiss Functionality**: Configurable auto-hide timers for different message types
- **Queue Management**: Multiple notification queue support for simultaneous messages

## Overview

The Snackbar Context provides a centralized system for managing notifications across the CRAFT application. It handles API response messages, validation errors, success confirmations, and general user notifications.

## Context Implementation

### SnackbarContext

**Location**: `/src/contexts/SnackbarContext.tsx`

```typescript
interface SnackbarContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
  handleApiResponse: (response: ApiResponse, successMessage?: string, errorMessage?: string) => void;
  handleApiError: (error: any, fallbackMessage?: string) => void;
}
```

### Key Features

- **Multiple Severity Levels**: Success, error, info, and warning notifications
- **API Response Handling**: Automatic parsing of API responses with standardized error handling
- **ValidationError Support**: Special handling for backend validation errors with detailed messages
- **Auto-hide Timers**: Configurable duration for different message types
- **Material-UI Integration**: Uses Material-UI Alert and Snackbar components

## Usage Examples

### Basic Notifications

```typescript
const snackbar = useApiSnackbar();

// Success notification
snackbar.showSuccess('Policy created successfully');

// Error notification
snackbar.showError('Failed to delete subject');

// Info notification
snackbar.showInfo('Data refreshed automatically');

// Warning notification
snackbar.showWarning('This action cannot be undone');
```

### API Response Handling

```typescript
const snackbar = useApiSnackbar();

try {
  const response = await apiClient.post('/policies', policyData);
  snackbar.handleApiResponse(response, 'Policy created successfully', 'Failed to create policy');
} catch (error) {
  snackbar.handleApiError(error, 'Failed to create policy');
}
```

### ValidationError Handling

```typescript
// Backend returns ValidationError for entity deletion protection
try {
  const response = await apiClient.delete(`/subjects/${subjectId}`);
  if (response.success) {
    snackbar.showSuccess('Subject deleted successfully');
  } else {
    snackbar.handleApiResponse(response, undefined, 'Failed to delete subject');
  }
} catch (error) {
  snackbar.handleApiError(error, 'Failed to delete subject');
}
```

## API Response Integration

### Standard Response Format

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: {
    type?: string;
    entityType?: string;
    entityId?: string;
    policyCount?: number;
    policyNames?: string[];
  };
}
```

### ValidationError Handling

The snackbar system provides special handling for `ValidationError` responses from the backend:

```typescript
// Example ValidationError response from backend
{
  success: false,
  error: "Cannot delete subject. It is currently used in 3 active policies: Policy A, Policy B, Policy C",
  code: "VALIDATION_ERROR",
  details: {
    type: "ENTITY_IN_USE",
    entityType: "subject",
    entityId: "subject_123",
    policyCount: 3,
    policyNames: ["Policy A", "Policy B", "Policy C"]
  }
}
```

## Configuration

### Auto-hide Timers

```typescript
const SNACKBAR_CONFIG = {
  success: { autoHideDuration: 4000 },
  error: { autoHideDuration: 6000 },
  info: { autoHideDuration: 4000 },
  warning: { autoHideDuration: 5000 }
};
```

### Positioning and Styling

```typescript
<Snackbar
  open={open}
  autoHideDuration={autoHideDuration}
  onClose={handleClose}
  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
>
  <Alert
    onClose={handleClose}
    severity={severity}
    variant="filled"
    sx={{ width: '100%' }}
  >
    {message}
  </Alert>
</Snackbar>
```

## Integration with Components

### Standard Integration Pattern

```typescript
import { useApiSnackbar } from '@/contexts/SnackbarContext';

export default function ComponentPage() {
  const snackbar = useApiSnackbar();

  const handleDelete = async (id: string) => {
    try {
      const response = await apiClient.delete(`/entities/${id}`);
      snackbar.handleApiResponse(response, 'Entity deleted successfully', 'Failed to delete entity');
      
      if (response.success) {
        // Update local state
        setEntities(prev => prev.filter(entity => entity.id !== id));
      }
    } catch (error) {
      snackbar.handleApiError(error, 'Failed to delete entity');
    }
  };

  return (
    // Component JSX
  );
}
```

### Delete Modal Integration

```typescript
const handleDeleteConfirm = async () => {
  try {
    setDeleteLoading(true);
    const response = await apiClient.delete(`/subjects/${deleteSubject.id}`);
    
    if (response.success) {
      setSubjects(subjects?.filter(s => s.id !== deleteSubject.id) || []);
      setDeleteOpen(false);
      snackbar.showSuccess('Subject deleted successfully');
    } else {
      snackbar.handleApiResponse(response, undefined, 'Failed to delete subject');
    }
  } catch (error: any) {
    snackbar.handleApiError(error, 'Failed to delete subject');
  } finally {
    setDeleteLoading(false);
  }
};
```

## Best Practices

1. **Consistent Error Handling**: Always use `handleApiError` for API exceptions
2. **Response Validation**: Use `handleApiResponse` for standardized API response handling
3. **Meaningful Messages**: Provide clear, user-friendly success and error messages
4. **Context Usage**: Always access snackbar through `useApiSnackbar()` hook
5. **ValidationError Support**: Let the system handle ValidationError responses automatically
6. **Loading States**: Show loading states while operations are in progress

## Error Message Guidelines

### Success Messages
- Be specific: "Policy created successfully" vs "Success"
- Use past tense: "Subject updated successfully"
- Include entity type when relevant

### Error Messages
- Be helpful: "Failed to delete subject" vs "Error"
- Include context when possible: "Failed to create policy: Name is required"
- Let ValidationErrors provide detailed feedback automatically

### ValidationError Messages
The system automatically handles ValidationError responses with detailed messages like:
- "Cannot delete subject. It is currently used in 3 active policies: Policy A, Policy B, Policy C"

## Future Enhancements

- **Notification Persistence**: Store notifications for offline review
- **Action Buttons**: Add action buttons to notifications (retry, undo)
- **Notification Categories**: Group notifications by type or source
- **Sound Notifications**: Optional audio feedback for critical notifications
- **Rich Content**: Support for formatted text and links in notifications

---

*Last updated: August 29, 2025 - Enhanced API error handling and ValidationError support*  
🤖 *Generated and maintained with [Claude Code](https://claude.ai/code)*