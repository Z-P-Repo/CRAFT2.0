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
  Divider,
  Autocomplete,
  Grid,
  Alert,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { apiClient } from '@/lib/api';
import { useApiSnackbar } from '@/contexts/SnackbarContext';

// Operator options for additional resource attributes
const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'in', label: 'In' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'not_in', label: 'Not In' }
];

export interface ResourceCreationDialogProps {
  open: boolean;
  onClose: () => void;
  onResourceCreated?: (resource: any) => void;
  onResourceUpdated?: (resource: any) => void;
  editingResource?: any;
  isAdditionalResource?: boolean; // Flag to determine if creating Additional Resource
}

export default function ResourceCreationDialog({
  open,
  onClose,
  onResourceCreated,
  onResourceUpdated,
  editingResource,
  isAdditionalResource = false
}: ResourceCreationDialogProps) {
  const { currentWorkspace, currentApplication, currentEnvironment } = useWorkspace();
  const snackbar = useApiSnackbar();
  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState('');
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

  // Additional resource attributes (with operators and values)
  const [resourceAttributes, setResourceAttributes] = useState<any[]>([]);
  const [showAddAttributeDialog, setShowAddAttributeDialog] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<any>(null);
  const [selectedOperator, setSelectedOperator] = useState('');
  const [attributeValue, setAttributeValue] = useState<string>('');
  const [attributeValues, setAttributeValues] = useState<string[]>([]);

  // Populate form when editing and load attributes
  const [hasInitialized, setHasInitialized] = React.useState(false);

  React.useEffect(() => {
    if (open && !hasInitialized) {
      if (editingResource) {
        setDisplayName(editingResource.displayName || '');
        setDescription(editingResource.description || '');
        setResourceType(editingResource.type || '');
        setDisplayNameError('');
      } else {
        // Reset form for new resource
        setDisplayName('');
        setDescription('');
        setResourceType('');
        setDisplayNameError('');
      }
      loadAttributes();
      setHasInitialized(true);
    } else if (!open) {
      // Reset initialization flag when dialog closes
      setHasInitialized(false);
    }
  }, [editingResource, open, hasInitialized]);

  const loadAttributes = async () => {
    try {
      const response = await apiClient.get('/attributes', {
        params: {
          categories: 'resource' // Filter by resource category at API level
        }
      });
      if (response.success) {
        // Attributes are already filtered by backend, but double-check for safety
        const resourceAttributes = response.data.filter((attr: any) =>
          attr.categories && attr.categories.includes('resource')
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
    if (displayName.trim() || description.trim() || resourceType.trim()) {
      setCancelDialogOpen(true);
      return;
    }

    // No data, close directly
    setDisplayName('');
    setDescription('');
    setResourceType('');
    setDisplayNameError('');
    onClose();
  };

  // Cancel confirmation handlers
  const handleCancelConfirm = () => {
    setCancelDialogOpen(false);
    setDisplayName('');
    setDescription('');
    setResourceType('');
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

    // Check if required workspace context is available
    if (!currentWorkspace || !currentApplication || !currentEnvironment) {
      snackbar.showError('Please select a workspace, application, and environment before creating an attribute.');
      return;
    }

    setIsCreatingAttribute(true);

    // Generate unique ID for the attribute
    const attributeId = `attr_${attributeDisplayName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

    const attributeData = {
      id: attributeId,
      name: attributeDisplayName.toLowerCase().replace(/\s+/g, '_'),
      displayName: attributeDisplayName.trim(),
      description: attributeDescription?.trim() || '',
      categories: selectedAttributeCategories,
      dataType: selectedAttributeDataType,
      isRequired: false,
      isMultiValue: false,
      defaultValue: null,
      validationRules: attributePermittedValues ? { permittedValues: attributePermittedValues.split(',').map(v => v.trim()) } : {},
      // Required workspace context for backend validation
      workspaceId: currentWorkspace._id,
      applicationId: currentApplication._id,
      environmentId: currentEnvironment._id,
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

  // Additional resource attribute handlers
  const handleAddResourceAttribute = () => {
    setShowAddAttributeDialog(true);
    setSelectedAttribute(null);
    setSelectedOperator('');
    setAttributeValue('');
    setAttributeValues([]);
  };

  const handleCloseAddAttributeDialog = () => {
    setShowAddAttributeDialog(false);
    setSelectedAttribute(null);
    setSelectedOperator('');
    setAttributeValue('');
    setAttributeValues([]);
  };

  const handleAddAttribute = () => {
    if (!selectedAttribute || !selectedOperator) return;

    const value = selectedOperator === 'in' || selectedOperator === 'not_in'
      ? attributeValues
      : attributeValue;

    if (!value || (Array.isArray(value) && value.length === 0)) return;

    const newAttribute = {
      name: selectedAttribute.name,
      displayName: selectedAttribute.displayName,
      operator: selectedOperator,
      value: value
    };

    setResourceAttributes(prev => [...prev, newAttribute]);
    handleCloseAddAttributeDialog();
  };

  const handleRemoveResourceAttribute = (index: number) => {
    setResourceAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const handleOperatorChange = (operator: string) => {
    setSelectedOperator(operator);
    // Reset values when operator changes
    setAttributeValue('');
    setAttributeValues([]);
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
      type: resourceType || 'file',
      uri: `/${displayName.toLowerCase().replace(/\s+/g, '')}`,
      active: true,
      // Required workspace context for backend validation
      workspaceId: currentWorkspace._id,
      applicationId: currentApplication._id,
      environmentId: currentEnvironment._id,
      attributes: resourceAttributes.reduce((map, attr) => {
        map[attr.name] = {
          operator: attr.operator,
          value: attr.value
        };
        return map;
      }, {} as any),
      // Backend will automatically set owner, createdBy, and lastModifiedBy from authenticated user
    };

    try {
      let response;
      if (isEditing) {
        // Use appropriate endpoint based on resource type
        const endpoint = isAdditionalResource ? 'additional-resources' : 'resources';
        response = await apiClient.put(`/${endpoint}/${editingResource._id}`, payload);
      } else {
        // Use appropriate endpoint based on resource type
        const endpoint = isAdditionalResource ? 'additional-resources' : 'resources';
        response = await apiClient.post(`/${endpoint}`, payload);
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
        setResourceType('');
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

          <FormControl fullWidth disabled={isCreating}>
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
              <MenuItem value="file">File</MenuItem>
              <MenuItem value="document">Document</MenuItem>
              <MenuItem value="folder">Folder</MenuItem>
              <MenuItem value="database">Database</MenuItem>
              <MenuItem value="api">API</MenuItem>
              <MenuItem value="service">Service</MenuItem>
              <MenuItem value="application">Application</MenuItem>
            </Select>
          </FormControl>

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
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddResourceAttribute}
                  disabled={isCreating || attributes.length === 0}
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                >
                  Add Attribute
                </Button>
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
            </Box>

            {/* Added Attributes with Values */}
            {resourceAttributes.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                  Added Attributes:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {resourceAttributes.map((attr, index) => (
                    <Paper key={index} sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {attr.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {OPERATOR_OPTIONS.find(op => op.value === attr.operator)?.label}: {' '}
                            {Array.isArray(attr.value) ? attr.value.join(', ') : attr.value}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveResourceAttribute(index)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}

            {/* Available Attributes */}
            {attributes.length > 0 ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                  Available Attributes:
                </Typography>
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
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No resource attributes available. Create one to get started.
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
              <InputLabel id="attribute-data-type-label">Data Type</InputLabel>
              <Select
                labelId="attribute-data-type-label"
                id="attribute-data-type-select"
                value={selectedAttributeDataType}
                onChange={(e) => setSelectedAttributeDataType(e.target.value)}
                label="Data Type"
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

      {/* Add Attribute Dialog */}
      <Dialog
        open={showAddAttributeDialog}
        onClose={handleCloseAddAttributeDialog}
        maxWidth="md"
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
          Add Attribute Value
          <IconButton
            onClick={handleCloseAddAttributeDialog}
            sx={{
              color: 'grey.500',
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 2, pb: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Configure an attribute condition for this additional resource. This will be evaluated when the policy is checked.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <Autocomplete
                  options={attributes}
                  getOptionLabel={(option) => option.displayName || option.name}
                  value={selectedAttribute}
                  onChange={(_, newValue) => setSelectedAttribute(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Attribute"
                      placeholder="Choose an attribute"
                    />
                  )}
                />
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="operator-label">Operator</InputLabel>
                <Select
                  labelId="operator-label"
                  id="operator-select"
                  value={selectedOperator}
                  onChange={(e) => handleOperatorChange(e.target.value)}
                  label="Operator"
                  disabled={!selectedAttribute}
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
                  {OPERATOR_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              {selectedOperator === 'in' || selectedOperator === 'not_in' ? (
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={attributeValues}
                  onChange={(_, newValues) => setAttributeValues(newValues)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Values"
                      placeholder="Type and press Enter to add values"
                      helperText="Enter multiple values separated by Enter"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          {...tagProps}
                          label={option}
                          size="small"
                        />
                      );
                    })
                  }
                />
              ) : (
                <TextField
                  fullWidth
                  label="Value"
                  value={attributeValue}
                  onChange={(e) => setAttributeValue(e.target.value)}
                  placeholder="Enter attribute value"
                  disabled={!selectedOperator}
                />
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{
          px: 3,
          pb: 3,
          pt: 1,
          gap: 1.5
        }}>
          <Button
            onClick={handleCloseAddAttributeDialog}
            variant="outlined"
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
            onClick={handleAddAttribute}
            variant="contained"
            disabled={!selectedAttribute || !selectedOperator ||
              (selectedOperator === 'in' || selectedOperator === 'not_in' ?
                attributeValues.length === 0 : !attributeValue.trim())}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            Add Attribute
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}