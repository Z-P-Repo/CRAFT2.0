'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  CircularProgress,
  Typography
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { apiClient } from '@/lib/api';
import { useApiSnackbar } from '@/contexts/SnackbarContext';

export interface ResourceCreationDialogProps {
  open: boolean;
  onClose: () => void;
  onResourceCreated?: (resource: any) => void;
  onResourceUpdated?: (resource: any) => void;
  editingResource?: any;
}

export default function ResourceCreationDialog({ 
  open, 
  onClose, 
  onResourceCreated,
  onResourceUpdated,
  editingResource
}: ResourceCreationDialogProps) {
  const { currentWorkspace, currentApplication, currentEnvironment } = useWorkspace();
  const snackbar = useApiSnackbar();
  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Populate form when editing
  React.useEffect(() => {
    if (editingResource && open) {
      setDisplayName(editingResource.displayName || '');
      setDescription(editingResource.description || '');
      setDisplayNameError('');
    } else if (!editingResource && open) {
      // Reset form for new resource
      setDisplayName('');
      setDescription('');
      setDisplayNameError('');
    }
  }, [editingResource, open]);

  const handleClose = () => {
    if (isCreating) return; // Prevent closing during creation
    
    // Check if form has data and show confirmation
    if (displayName.trim() || description.trim()) {
      setCancelDialogOpen(true);
      return;
    }
    
    // No data, close directly
    setDisplayName('');
    setDescription('');
    setDisplayNameError('');
    onClose();
  };

  // Cancel confirmation handlers
  const handleCancelConfirm = () => {
    setCancelDialogOpen(false);
    setDisplayName('');
    setDescription('');
    setDisplayNameError('');
    onClose();
  };

  const handleCancelCancel = () => {
    setCancelDialogOpen(false);
  };

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    if (value.trim().length < 2) {
      setDisplayNameError('Name must be at least 2 characters long.');
    } else {
      setDisplayNameError('');
    }
  };

  const handleSubmit = async () => {
    if (!displayName.trim() || displayNameError) {
      return;
    }

    // Check if required context is available
    if (!currentWorkspace || !currentApplication || !currentEnvironment) {
      snackbar.showError('Please select a workspace, application, and environment before creating a resource.');
      return;
    }

    setIsCreating(true);
    const isEditing = !!editingResource;
    const url = isEditing 
      ? `${process.env.NEXT_PUBLIC_API_URL}/resources/${editingResource._id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/resources`;
    const method = isEditing ? 'PUT' : 'POST';

    const payload = {
      name: displayName.toLowerCase().replace(/\s+/g, ''),
      displayName: displayName.trim(),
      description: description?.trim() || '',
      type: 'file',
      uri: `/${displayName.toLowerCase().replace(/\s+/g, '')}`,
      active: true,
      // Required workspace context for backend validation
      workspaceId: currentWorkspace._id,
      applicationId: currentApplication._id,
      environmentId: currentEnvironment._id,
      attributes: new Map(),
      children: [],
      permissions: {
        read: true,
        write: false,
        delete: false,
        execute: false,
        admin: false
      },
      metadata: {
        owner: 'System',
        createdBy: 'System',
        lastModifiedBy: 'System',
        classification: 'internal' as 'public' | 'internal' | 'confidential' | 'restricted',
        tags: [],
        isSystem: false,
        isCustom: true,
        version: '1.0.0'
      }
    };

    try {
      let response;
      if (isEditing) {
        response = await apiClient.put(`/resources/${editingResource._id}`, payload);
      } else {
        response = await apiClient.post('/resources', payload);
      }

      if (response.success) {
        // Call the appropriate callback
        if (isEditing) {
          onResourceUpdated?.(response.data);
        } else {
          onResourceCreated?.(response.data);
        }
        
        // Reset form and close dialog
        setDisplayName('');
        setDescription('');
        setDisplayNameError('');
        onClose();
      } else {
        console.error('API Error:', response.error);
        snackbar.showError(response.error || `Failed to ${isEditing ? 'update' : 'create'} resource`);
      }
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} resource:`, error);
      snackbar.handleApiError(error, `Failed to ${isEditing ? 'update' : 'create'} resource`);
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid = displayName.trim() && !displayNameError;

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
        fontWeight: 600,
        fontSize: '1.25rem',
        px: 3,
        pt: 3,
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {editingResource ? 'Edit Resource' : 'Create New Resource'}
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <TextField
            fullWidth
            label="Resource Name"
            value={displayName}
            onChange={(e) => handleDisplayNameChange(e.target.value)}
            placeholder="e.g., Customer Database, User Files, System Config"
            required
            disabled={isCreating}
            error={!!displayNameError}
            helperText={displayNameError || 'Enter the resource name'}
          />
          
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the resource"
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
            ? `${editingResource ? 'Updating' : 'Creating'}...` 
            : `${editingResource ? 'Update' : 'Create'} Resource`}
        </Button>
      </DialogActions>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCancelCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          {editingResource ? 'Cancel Resource Edit' : 'Cancel Resource Creation'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to cancel? All your changes will be lost and cannot be recovered.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelCancel} variant="outlined">
            {editingResource ? 'Continue Editing' : 'Continue Creating'}
          </Button>
          <Button onClick={handleCancelConfirm} variant="contained" color="error">
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}