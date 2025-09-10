'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { apiClient } from '@/lib/api';
import { useApiSnackbar } from '@/contexts/SnackbarContext';

export interface SubjectCreationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubjectCreated?: (subject: any) => void;
  onSubjectUpdated?: (subject: any) => void;
  editingSubject?: any;
}

export default function SubjectCreationDialog({ 
  open, 
  onClose, 
  onSubjectCreated,
  onSubjectUpdated,
  editingSubject
}: SubjectCreationDialogProps) {
  const { currentWorkspace, currentApplication, currentEnvironment } = useWorkspace();
  const snackbar = useApiSnackbar();
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Populate form when editing
  React.useEffect(() => {
    if (editingSubject && open) {
      setDisplayName(editingSubject.displayName || '');
      setDescription(editingSubject.description || '');
    } else if (!editingSubject && open) {
      // Reset form for new subject
      setDisplayName('');
      setDescription('');
    }
  }, [editingSubject, open]);

  const handleClose = () => {
    if (isCreating) return; // Prevent closing during creation
    setDisplayName('');
    setDescription('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      return;
    }

    // Check if required context is available
    if (!currentWorkspace || !currentApplication || !currentEnvironment) {
      snackbar.showError('Please select a workspace, application, and environment before creating a subject.');
      return;
    }

    setIsCreating(true);
    const isEditing = !!editingSubject;
    const url = isEditing 
      ? `${process.env.NEXT_PUBLIC_API_URL}/subjects/${editingSubject.id || editingSubject._id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/subjects`;
    const method = isEditing ? 'PUT' : 'POST';

    const payload = {
      displayName: displayName.trim(),
      description: description.trim(),
      // Set default values for required backend fields
      name: displayName.toLowerCase().replace(/\s+/g, ''),
      email: `${displayName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      type: 'user',
      role: 'User',
      department: 'General',
      status: 'active',
      // Required IDs from workspace context
      workspaceId: currentWorkspace._id,
      applicationId: currentApplication._id,
      environmentId: currentEnvironment._id
    };


    try {
      let response;
      if (isEditing) {
        response = await apiClient.put(`/subjects/${editingSubject.id || editingSubject._id}`, payload);
      } else {
        response = await apiClient.post('/subjects', payload);
      }

      if (response.success) {
        // Call the appropriate callback
        if (isEditing) {
          onSubjectUpdated?.(response.data);
        } else {
          onSubjectCreated?.(response.data);
        }
        
        // Reset form and close dialog
        setDisplayName('');
        setDescription('');
        onClose();
      } else {
        console.error('API Error:', response.error);
        snackbar.showError(response.error || `Failed to ${isEditing ? 'update' : 'create'} subject`);
      }
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} subject:`, error);
      snackbar.handleApiError(error, `Failed to ${isEditing ? 'update' : 'create'} subject`);
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid = displayName.trim();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{
        pb: 1,
        pt: 2.5,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
{editingSubject ? 'Edit Subject' : 'Create New Subject'}
        <IconButton
          onClick={handleClose}
          disabled={isCreating}
          sx={{
            color: 'grey.500',
            '&:hover': { bgcolor: 'grey.100' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            fullWidth
            label="Subject Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g., John Doe, Marketing Team, Admin Role"
            required
            disabled={isCreating}
            error={!displayName.trim() && displayName !== ''}
            helperText={!displayName.trim() && displayName !== '' ? 'Subject name is required' : ''}
          />
          
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the subject"
            multiline
            rows={3}
            disabled={isCreating}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{
        px: 3,
        pb: 3,
        pt: 1,
        gap: 1.5
      }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={isCreating}
          sx={{
            borderColor: 'grey.300',
            color: 'text.secondary',
            '&:hover': {
              borderColor: 'grey.400',
              bgcolor: 'grey.50'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid || isCreating}
          startIcon={isCreating ? <CircularProgress size={20} /> : null}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          {isCreating 
            ? `${editingSubject ? 'Updating' : 'Creating'}...` 
            : `${editingSubject ? 'Update' : 'Create'} Subject`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}