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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Checkbox,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Settings as SettingsIcon
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

  // Attribute management states
  const [attributes, setAttributes] = useState<any[]>([]);
  const [attributeModalOpen, setAttributeModalOpen] = useState(false);
  const [selectedAttributeForAttribute, setSelectedAttributeForAttribute] = useState<any>(null);
  const [attributeDisplayName, setAttributeDisplayName] = useState('');
  const [attributeDisplayNameError, setAttributeDisplayNameError] = useState('');
  const [selectedAttributeCategories, setSelectedAttributeCategories] = useState<string[]>(['resource']);
  const [selectedAttributeDataType, setSelectedAttributeDataType] = useState('');
  const [attributeDescription, setAttributeDescription] = useState('');
  const [attributePermittedValues, setAttributePermittedValues] = useState('');
  const [isCreatingAttribute, setIsCreatingAttribute] = useState(false);

  // Populate form when editing and load attributes
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

    // Load attributes when dialog opens
    if (open) {
      loadAttributes();
    }
  }, [editingResource, open]);

  const loadAttributes = async () => {
    try {
      const response = await apiClient.get('/attributes');
      if (response.success) {
        // Filter for resource category attributes
        const resourceAttributes = response.data.filter((attr: any) =>
          attr.categories.includes('resource')
        );
        setAttributes(resourceAttributes);
      }
    } catch (error) {
      console.error('Error loading attributes:', error);
    }
  };

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

  // Attribute modal handlers
  const handleOpenAttributeModal = () => {
    setAttributeModalOpen(true);
  };

  const handleCloseAttributeModal = () => {
    setAttributeModalOpen(false);
    setSelectedAttributeForAttribute(null);
    setAttributeDisplayName('');
    setAttributeDisplayNameError('');
    setSelectedAttributeCategories(['resource']);
    setSelectedAttributeDataType('');
    setAttributeDescription('');
    setAttributePermittedValues('');
  };

  const handleAttributeDisplayNameChange = (value: string) => {
    setAttributeDisplayName(value);
    if (value.trim().length < 2) {
      setAttributeDisplayNameError('Name must be at least 2 characters long.');
    } else {
      setAttributeDisplayNameError('');
    }
  };

  const handleCreateAttribute = async () => {
    if (!attributeDisplayName.trim() || attributeDisplayNameError) {
      return;
    }

    setIsCreatingAttribute(true);

    const attributeData = {
      name: attributeDisplayName.toLowerCase().replace(/\s+/g, '_'),
      displayName: attributeDisplayName.trim(),
      description: attributeDescription?.trim() || '',
      categories: selectedAttributeCategories,
      dataType: selectedAttributeDataType,
      isRequired: false,
      isMultiValue: false,
      defaultValue: null,
      validationRules: attributePermittedValues ? { permittedValues: attributePermittedValues.split(',').map(v => v.trim()) } : {},
      metadata: {
        createdBy: 'User',
        owner: 'User',
        isSystem: false,
        isCustom: true,
        version: '1.0.0'
      }
    };

    try {
      const response = await apiClient.post('/attributes', attributeData);
      if (response.success) {
        // Add new attribute to the list
        setAttributes(prev => [...prev, response.data]);
        snackbar.showSuccess('Attribute created successfully!');
        handleCloseAttributeModal();
      } else {
        snackbar.showError(response.error || 'Failed to create attribute');
      }
    } catch (error: any) {
      console.error('Error creating attribute:', error);
      snackbar.handleApiError(error, 'Failed to create attribute');
    } finally {
      setIsCreatingAttribute(false);
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

          <Divider sx={{ my: 1 }} />

          {/* Attributes Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Resource Attributes
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleOpenAttributeModal}
                disabled={isCreating}
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              >
                Create Attribute
              </Button>
            </Box>

            {attributes.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {attributes.map((attr) => (
                  <Chip
                    key={attr._id || attr.id}
                    label={attr.displayName}
                    size="small"
                    variant="outlined"
                    icon={<SettingsIcon />}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No resource attributes available. Create one above.
              </Typography>
            )}
          </Box>
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

      {/* Attribute Creation Modal */}
      <Dialog
        open={attributeModalOpen}
        onClose={handleCloseAttributeModal}
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
          Create New Attribute
          <IconButton
            onClick={handleCloseAttributeModal}
            disabled={isCreatingAttribute}
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
              label="Attribute Name"
              value={attributeDisplayName}
              onChange={(e) => handleAttributeDisplayNameChange(e.target.value)}
              placeholder="e.g., File Type, Security Level, Department"
              required
              disabled={isCreatingAttribute}
              error={!!attributeDisplayNameError}
              helperText={attributeDisplayNameError || 'Enter the attribute name'}
            />

            <TextField
              fullWidth
              label="Description"
              value={attributeDescription}
              onChange={(e) => setAttributeDescription(e.target.value)}
              placeholder="Brief description of the attribute"
              multiline
              rows={2}
              disabled={isCreatingAttribute}
            />

            <FormControl fullWidth disabled={isCreatingAttribute}>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={selectedAttributeDataType}
                onChange={(e) => setSelectedAttributeDataType(e.target.value)}
                label="Data Type"
              >
                <MenuItem value="string">String</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="boolean">Boolean</MenuItem>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="array">Array</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Permitted Values (Optional)"
              value={attributePermittedValues}
              onChange={(e) => setAttributePermittedValues(e.target.value)}
              placeholder="value1, value2, value3"
              disabled={isCreatingAttribute}
              helperText="Comma-separated list of allowed values"
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
            onClick={handleCloseAttributeModal}
            variant="outlined"
            disabled={isCreatingAttribute}
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
            onClick={handleCreateAttribute}
            variant="contained"
            disabled={!attributeDisplayName.trim() || !!attributeDisplayNameError || !selectedAttributeDataType || isCreatingAttribute}
            startIcon={isCreatingAttribute ? <CircularProgress size={20} /> : null}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            {isCreatingAttribute ? 'Creating...' : 'Create Attribute'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}