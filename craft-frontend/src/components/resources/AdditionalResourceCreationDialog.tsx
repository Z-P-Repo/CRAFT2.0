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
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Close as CloseIcon,
} from '@mui/icons-material';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { apiClient } from '@/lib/api';
import { useApiSnackbar } from '@/contexts/SnackbarContext';

export interface AdditionalResourceCreationDialogProps {
  open: boolean;
  onClose: () => void;
  onResourceCreated?: (resource: any) => void;
}

export default function AdditionalResourceCreationDialog({
  open,
  onClose,
  onResourceCreated,
}: AdditionalResourceCreationDialogProps) {
  const { currentWorkspace, currentApplication, currentEnvironment } = useWorkspace();
  const snackbar = useApiSnackbar();

  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setDisplayName('');
      setDescription('');
      setResourceType('');
      setDisplayNameError('');
    }
  }, [open]);

  const handleClose = () => {
    if (isCreating) return;
    setDisplayName('');
    setDescription('');
    setResourceType('');
    setDisplayNameError('');
    onClose();
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

    if (!currentWorkspace || !currentApplication || !currentEnvironment) {
      snackbar.showError('Please select a workspace, application, and environment before creating a resource.');
      return;
    }

    setIsCreating(true);

    const payload = {
      name: displayName.toLowerCase().replace(/\s+/g, ''),
      displayName: displayName.trim(),
      description: description?.trim() || '',
      type: resourceType || 'condition',
      active: true,
      workspaceId: currentWorkspace._id,
      applicationId: currentApplication._id,
      environmentId: currentEnvironment._id,
      attributes: {},
      // Backend will automatically set owner, createdBy, and lastModifiedBy from authenticated user
    };

    try {
      const response = await apiClient.post('/additional-resources', payload);

      if (response.success) {
        onResourceCreated?.(response.data);
        handleClose();
        snackbar.showSuccess('Additional resource created successfully!');
      } else {
        console.error('API Error:', response.error);
        snackbar.showError(response.error || 'Failed to create additional resource');
      }
    } catch (error: any) {
      console.error('Error creating additional resource:', error);
      snackbar.handleApiError(error, 'Failed to create additional resource');
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid = displayName.trim() && !displayNameError && resourceType.trim();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          zIndex: 1300
        }
      }}
      sx={{
        zIndex: 1300
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
        Create Additional Resource
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
            placeholder="e.g., Approval Pending, Draft Status"
            required
            disabled={isCreating}
            error={!!displayNameError}
            helperText={displayNameError || 'Enter the additional resource name'}
          />

          <FormControl fullWidth disabled={isCreating} required>
            <InputLabel id="resource-type-label">Resource Type</InputLabel>
            <Select
              labelId="resource-type-label"
              id="resource-type-select"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              label="Resource Type"
              sx={{
                pointerEvents: 'auto',
                cursor: 'pointer',
                '& .MuiSelect-select': {
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  pointerEvents: 'none'
                }
              }}
              MenuProps={{
                disablePortal: false,
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    zIndex: 9999,
                  },
                },
              }}
            >
              <MenuItem value="condition">Condition</MenuItem>
              <MenuItem value="state">State</MenuItem>
              <MenuItem value="approval">Approval</MenuItem>
              <MenuItem value="status">Status</MenuItem>
              <MenuItem value="ticket">Ticket</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the additional resource"
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
          {isCreating ? 'Creating...' : 'Create Resource'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
