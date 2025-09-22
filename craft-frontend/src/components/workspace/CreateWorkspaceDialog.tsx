'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Grid,
  FormControlLabel,
  Switch,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment
} from '@mui/material';
import {
  Business as WorkspaceIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Apps as AppsIcon,
  CloudQueue as EnvironmentIcon
} from '@mui/icons-material';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { apiClient } from '@/lib/api';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ApplicationFormData {
  name: string;
  displayName: string;
  description: string;
  type: 'web' | 'api' | 'mobile' | 'desktop' | 'service' | 'microservice';
  environments: EnvironmentFormData[];
}

interface EnvironmentFormData {
  name: string;
  displayName: string;
  description: string;
  type: 'development' | 'testing' | 'staging' | 'production' | 'preview' | 'hotfix';
  isDefault?: boolean;
}

interface WorkspaceFormData {
  name: string;
  displayName: string;
  description: string;
  settings: {
    maxApplications: number;
    maxEnvironments: number;
    allowPublicAccess: boolean;
    enableActivityLogs: boolean;
  };
  limits: {
    storageLimit: number;
    apiCallsPerMonth: number;
  };
  applications: ApplicationFormData[];
}

const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<WorkspaceFormData>({
    name: '',
    displayName: '',
    description: '',
    settings: {
      maxApplications: 10,
      maxEnvironments: 50,
      allowPublicAccess: false,
      enableActivityLogs: true
    },
    limits: {
      storageLimit: 1000, // MB
      apiCallsPerMonth: 10000
    },
    applications: []
  });

  const [activeStep, setActiveStep] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [nameValidation, setNameValidation] = useState<{
    isChecking: boolean;
    isValid: boolean;
    message: string | null;
  }>({ isChecking: false, isValid: true, message: null });

  const { showError, showSuccess } = useSnackbar();
  const { refreshWorkspaces } = useWorkspace();

  // Debounced workspace name validation
  const checkWorkspaceNameAvailability = useCallback(async (name: string) => {
    if (!name || name.length < 2) {
      setNameValidation({ isChecking: false, isValid: true, message: null });
      return;
    }

    setNameValidation({ isChecking: true, isValid: true, message: null });

    try {
      const response = await apiClient.get(`/workspaces/validate-name/${encodeURIComponent(name)}`) as any;

      if (response.success && response.available) {
        setNameValidation({
          isChecking: false,
          isValid: true,
          message: '✓ Workspace name is available'
        });
      } else if (response.success === false) {
        // Handle case where response doesn't indicate availability
        const errorMessage = response.details?.message || response.error || 'Workspace name is not available';
        setNameValidation({
          isChecking: false,
          isValid: false,
          message: errorMessage
        });
      } else {
        // Fallback case
        setNameValidation({
          isChecking: false,
          isValid: false,
          message: response.error || 'Workspace name is not available'
        });
      }
    } catch (err: any) {
      if (err.success === false) {
        // Handle API error responses (409, etc.)
        const errorMessage = err.details?.message || err.error || 'Unable to validate workspace name';
        setNameValidation({
          isChecking: false,
          isValid: false,
          message: errorMessage
        });
      } else if (err.details?.message) {
        setNameValidation({
          isChecking: false,
          isValid: false,
          message: err.details.message
        });
      } else {
        setNameValidation({
          isChecking: false,
          isValid: false,
          message: err.error || 'Unable to validate workspace name'
        });
      }
    }
  }, []);

  // Debounce the validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.name && formData.name.length >= 2) {
        checkWorkspaceNameAvailability(formData.name);
      } else {
        // Reset validation for short names
        setNameValidation({ isChecking: false, isValid: true, message: null });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.name, checkWorkspaceNameAvailability]);

  const handleFieldChange = (field: keyof WorkspaceFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate name from displayName
    if (field === 'displayName') {
      const generatedName = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Reset validation when name changes
      setNameValidation({ isChecking: false, isValid: true, message: null });

      setFormData(prev => ({
        ...prev,
        name: generatedName
      }));
    }

    // Reset validation when name field is directly edited
    if (field === 'name') {
      setNameValidation({ isChecking: false, isValid: true, message: null });
    }
  };

  const handleSettingChange = (field: keyof WorkspaceFormData['settings']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : Number(event.target.value);
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const handleLimitChange = (field: keyof WorkspaceFormData['limits']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      limits: {
        ...prev.limits,
        [field]: Number(event.target.value)
      }
    }));
  };

  const addApplication = () => {
    const newApp: ApplicationFormData = {
      name: '',
      displayName: '',
      description: '',
      type: 'web',
      environments: [{
        name: 'development',
        displayName: 'Development',
        description: 'Development environment',
        type: 'development',
        isDefault: true
      }]
    };
    setFormData(prev => ({
      ...prev,
      applications: [...prev.applications, newApp]
    }));
  };

  const removeApplication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      applications: prev.applications.filter((_, i) => i !== index)
    }));
  };

  const updateApplication = (index: number, field: keyof ApplicationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      applications: prev.applications.map((app, i) => 
        i === index ? { ...app, [field]: value } : app
      )
    }));

    // Auto-generate name from displayName for applications
    if (field === 'displayName') {
      const generatedName = (value as string)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      setFormData(prev => ({
        ...prev,
        applications: prev.applications.map((app, i) => 
          i === index ? { ...app, name: generatedName } : app
        )
      }));
    }
  };

  const addEnvironment = (appIndex: number) => {
    const newEnv: EnvironmentFormData = {
      name: '',
      displayName: '',
      description: '',
      type: 'development'
    };
    
    setFormData(prev => ({
      ...prev,
      applications: prev.applications.map((app, i) => 
        i === appIndex ? {
          ...app,
          environments: [...app.environments, newEnv]
        } : app
      )
    }));
  };

  const removeEnvironment = (appIndex: number, envIndex: number) => {
    setFormData(prev => ({
      ...prev,
      applications: prev.applications.map((app, i) => 
        i === appIndex ? {
          ...app,
          environments: app.environments.filter((_, ei) => ei !== envIndex)
        } : app
      )
    }));
  };

  const updateEnvironment = (appIndex: number, envIndex: number, field: keyof EnvironmentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      applications: prev.applications.map((app, i) => 
        i === appIndex ? {
          ...app,
          environments: app.environments.map((env, ei) => 
            ei === envIndex ? { ...env, [field]: value } : env
          )
        } : app
      )
    }));

    // Auto-generate name from displayName for environments
    if (field === 'displayName') {
      const generatedName = (value as string)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      setFormData(prev => ({
        ...prev,
        applications: prev.applications.map((app, i) => 
          i === appIndex ? {
            ...app,
            environments: app.environments.map((env, ei) => 
              ei === envIndex ? { ...env, name: generatedName } : env
            )
          } : app
        )
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    setError(null);

    switch (step) {
      case 0: // Workspace details
        if (!formData.displayName.trim()) {
          setError('Display name is required');
          return false;
        }
        if (!formData.name.trim()) {
          setError('Workspace name is required');
          return false;
        }
        if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(formData.name)) {
          setError('Workspace name must be lowercase alphanumeric with hyphens');
          return false;
        }
        if (formData.displayName.length < 2 || formData.displayName.length > 100) {
          setError('Display name must be 2-100 characters');
          return false;
        }
        if (formData.description.length > 500) {
          setError('Description cannot exceed 500 characters');
          return false;
        }
        // Check workspace name availability
        if (nameValidation.isChecking) {
          setError('Please wait while we verify the workspace name...');
          return false;
        }
        if (!nameValidation.isValid) {
          setError(nameValidation.message || 'Workspace name is not available');
          return false;
        }
        // For names that haven't been validated yet, require validation before proceeding
        if (formData.name.length >= 2 && nameValidation.message === null && !nameValidation.isChecking) {
          setError('Workspace name validation is required. Please wait a moment and try again.');
          return false;
        }
        return true;
      
      case 1: // Applications
        if (formData.applications.length === 0) {
          setError('At least one application is required');
          return false;
        }
        for (let i = 0; i < formData.applications.length; i++) {
          const app = formData.applications[i];
          if (!app.displayName.trim()) {
            setError(`Application ${i + 1}: Display name is required`);
            return false;
          }
          if (!app.name.trim()) {
            setError(`Application ${i + 1}: Name is required`);
            return false;
          }
          if (app.environments.length === 0) {
            setError(`Application ${i + 1}: At least one environment is required`);
            return false;
          }
          // Check for duplicate application names
          const duplicateAppIndex = formData.applications.findIndex((otherApp, otherIndex) => 
            otherIndex !== i && otherApp.name === app.name
          );
          if (duplicateAppIndex !== -1) {
            setError(`Application names must be unique: "${app.name}" is used more than once`);
            return false;
          }
        }
        return true;
        
      default:
        return true;
    }
  };

  const validateForm = (): boolean => {
    return validateStep(0) && validateStep(1);
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const steps = ['Workspace Details', 'Applications & Environments', 'Review & Create'];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/workspaces', formData);

      if (response.success) {
        showSuccess('Workspace created successfully!');
        await refreshWorkspaces();
        
        if (onSuccess) {
          onSuccess();
        }
        
        handleClose();
      } else {
        throw new Error(response.error || 'Failed to create workspace');
      }
    } catch (err: any) {
      let errorMessage = err.error || err.message || 'Failed to create workspace';
      let detailedMessage = '';

      // Check if this is a detailed error response with workspace name conflict info
      if (err.details?.message) {
        detailedMessage = err.details.message;
      } else if (err.details?.existingWorkspace) {
        const existing = err.details.existingWorkspace;
        detailedMessage = `A workspace with the name '${formData.name}' was created by ${existing.createdBy} on ${existing.createdAt}. Please choose a different workspace name.`;
      }

      setError(detailedMessage || errorMessage);
      showError(detailedMessage || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    // Check if form has data
    const hasFormData = 
      formData.displayName.trim() || 
      formData.description.trim() ||
      formData.settings.maxApplications !== 10 ||
      formData.settings.maxEnvironments !== 50 ||
      formData.settings.allowPublicAccess !== false ||
      formData.settings.enableActivityLogs !== true ||
      formData.limits.storageLimit !== 1000 ||
      formData.limits.apiCallsPerMonth !== 10000;

    if (hasFormData) {
      setCancelDialogOpen(true);
      return;
    }

    handleClose();
  };

  const handleCancelConfirm = () => {
    setCancelDialogOpen(false);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      settings: {
        maxApplications: 10,
        maxEnvironments: 50,
        allowPublicAccess: false,
        enableActivityLogs: true
      },
      limits: {
        storageLimit: 1000,
        apiCallsPerMonth: 10000
      },
      applications: []
    });
    setError(null);
    setActiveStep(0);
    setNameValidation({ isChecking: false, isValid: true, message: null });
    onClose();
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleCancelClick}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkspaceIcon color="primary" />
          Create New Workspace
        </DialogTitle>
        
        <DialogContent>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Step 0: Workspace Details */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Workspace Details
              </Typography>

              <Stack spacing={3}>
                <TextField
                  label="Display Name"
                  value={formData.displayName}
                  onChange={handleFieldChange('displayName')}
                  fullWidth
                  required
                  helperText="The human-readable name for your workspace"
                />

                <TextField
                  label="Workspace Name"
                  value={formData.name}
                  onChange={handleFieldChange('name')}
                  fullWidth
                  required
                  error={!nameValidation.isValid && !nameValidation.isChecking}
                  helperText={
                    nameValidation.isChecking
                      ? "Checking availability..."
                      : nameValidation.message
                      ? nameValidation.message
                      : "Auto-generated from display name. Must be lowercase alphanumeric with hyphens."
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-error': {
                        '& fieldset': {
                          borderColor: 'error.main',
                          borderWidth: '2px',
                        },
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      '&.Mui-error': {
                        color: 'error.main',
                        fontWeight: 500,
                      },
                    },
                  }}
                  InputProps={{
                    endAdornment: nameValidation.isChecking ? (
                      <InputAdornment position="end">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    ) : null
                  }}
                />

                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={handleFieldChange('description')}
                  fullWidth
                  multiline
                  rows={3}
                  helperText="Optional description of your workspace (max 500 characters)"
                />

                <Divider />

                <Typography variant="h6" gutterBottom>
                  Settings & Limits
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Max Applications"
                    type="number"
                    value={formData.settings.maxApplications}
                    onChange={handleSettingChange('maxApplications')}
                    sx={{ flex: 1 }}
                    inputProps={{ min: 1, max: 100 }}
                  />

                  <TextField
                    label="Max Environments"
                    type="number"
                    value={formData.settings.maxEnvironments}
                    onChange={handleSettingChange('maxEnvironments')}
                    sx={{ flex: 1 }}
                    inputProps={{ min: 1, max: 500 }}
                  />
                </Box>

                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.settings.allowPublicAccess}
                        onChange={handleSettingChange('allowPublicAccess')}
                      />
                    }
                    label="Allow Public Access"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.settings.enableActivityLogs}
                        onChange={handleSettingChange('enableActivityLogs')}
                      />
                    }
                    label="Enable Activity Logs"
                  />
                </Stack>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Storage Limit (MB)"
                    type="number"
                    value={formData.limits.storageLimit}
                    onChange={handleLimitChange('storageLimit')}
                    sx={{ flex: 1 }}
                    inputProps={{ min: 100, max: 100000 }}
                  />

                  <TextField
                    label="API Calls per Month"
                    type="number"
                    value={formData.limits.apiCallsPerMonth}
                    onChange={handleLimitChange('apiCallsPerMonth')}
                    sx={{ flex: 1 }}
                    inputProps={{ min: 1000, max: 1000000 }}
                  />
                </Box>
              </Stack>
            </Box>
          )}

          {/* Step 1: Applications & Environments */}
          {activeStep === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Applications & Environments</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addApplication}
                  variant="outlined"
                  size="small"
                >
                  Add Application
                </Button>
              </Box>

              {formData.applications.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AppsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No applications yet
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Click "Add Application" to create your first application
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {formData.applications.map((app, appIndex) => (
                    <Accordion key={appIndex} defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                          <AppsIcon />
                          <Typography variant="h6">
                            {app.displayName || `Application ${appIndex + 1}`}
                          </Typography>
                          <Chip
                            label={app.type}
                            size="small"
                            variant="outlined"
                          />
                          <Box sx={{ flex: 1 }} />
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeApplication(appIndex);
                            }}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={3}>
                          {/* Application Details */}
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Application Details
                            </Typography>
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                  label="Display Name"
                                  value={app.displayName}
                                  onChange={(e) => updateApplication(appIndex, 'displayName', e.target.value)}
                                  required
                                  sx={{ flex: 2 }}
                                />
                                <FormControl sx={{ flex: 1 }}>
                                  <InputLabel>Type</InputLabel>
                                  <Select
                                    value={app.type}
                                    label="Type"
                                    onChange={(e) => updateApplication(appIndex, 'type', e.target.value)}
                                  >
                                    <MenuItem value="web">Web Application</MenuItem>
                                    <MenuItem value="api">API Service</MenuItem>
                                    <MenuItem value="mobile">Mobile App</MenuItem>
                                    <MenuItem value="desktop">Desktop App</MenuItem>
                                    <MenuItem value="service">Service</MenuItem>
                                    <MenuItem value="microservice">Microservice</MenuItem>
                                  </Select>
                                </FormControl>
                              </Box>
                              <TextField
                                label="Name"
                                value={app.name}
                                onChange={(e) => updateApplication(appIndex, 'name', e.target.value)}
                                required
                                helperText="Auto-generated from display name"
                              />
                              <TextField
                                label="Description"
                                value={app.description}
                                onChange={(e) => updateApplication(appIndex, 'description', e.target.value)}
                                multiline
                                rows={2}
                              />
                            </Stack>
                          </Box>

                          <Divider />

                          {/* Environments */}
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="subtitle2">
                                Environments ({app.environments.length})
                              </Typography>
                              <Button
                                startIcon={<AddIcon />}
                                onClick={() => addEnvironment(appIndex)}
                                size="small"
                                variant="outlined"
                              >
                                Add Environment
                              </Button>
                            </Box>

                            {app.environments.length === 0 ? (
                              <Box sx={{ textAlign: 'center', py: 2 }}>
                                <EnvironmentIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                  No environments yet
                                </Typography>
                              </Box>
                            ) : (
                              <Stack spacing={2}>
                                {app.environments.map((env, envIndex) => (
                                  <Box key={envIndex} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                      <EnvironmentIcon />
                                      <Typography variant="subtitle2">
                                        {env.displayName || `Environment ${envIndex + 1}`}
                                      </Typography>
                                      <Chip
                                        label={env.type}
                                        size="small"
                                        color={env.type === 'production' ? 'error' : 'default'}
                                        variant="outlined"
                                      />
                                      {env.isDefault && (
                                        <Chip label="Default" size="small" color="primary" />
                                      )}
                                      <Box sx={{ flex: 1 }} />
                                      <IconButton
                                        size="small"
                                        onClick={() => removeEnvironment(appIndex, envIndex)}
                                        color="error"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Box>
                                    
                                    <Stack spacing={2}>
                                      <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                          label="Display Name"
                                          value={env.displayName}
                                          onChange={(e) => updateEnvironment(appIndex, envIndex, 'displayName', e.target.value)}
                                          required
                                          sx={{ flex: 2 }}
                                          size="small"
                                        />
                                        <FormControl sx={{ flex: 1 }}>
                                          <InputLabel size="small">Type</InputLabel>
                                          <Select
                                            value={env.type}
                                            label="Type"
                                            size="small"
                                            onChange={(e) => updateEnvironment(appIndex, envIndex, 'type', e.target.value)}
                                          >
                                            <MenuItem value="development">Development</MenuItem>
                                            <MenuItem value="testing">Testing</MenuItem>
                                            <MenuItem value="staging">Staging</MenuItem>
                                            <MenuItem value="production">Production</MenuItem>
                                            <MenuItem value="preview">Preview</MenuItem>
                                            <MenuItem value="hotfix">Hotfix</MenuItem>
                                          </Select>
                                        </FormControl>
                                      </Box>
                                      <TextField
                                        label="Name"
                                        value={env.name}
                                        onChange={(e) => updateEnvironment(appIndex, envIndex, 'name', e.target.value)}
                                        required
                                        size="small"
                                        helperText="Auto-generated from display name"
                                      />
                                      <TextField
                                        label="Description"
                                        value={env.description}
                                        onChange={(e) => updateEnvironment(appIndex, envIndex, 'description', e.target.value)}
                                        size="small"
                                      />
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={env.isDefault || false}
                                            onChange={(e) => updateEnvironment(appIndex, envIndex, 'isDefault', e.target.checked)}
                                            size="small"
                                          />
                                        }
                                        label="Default Environment"
                                      />
                                    </Stack>
                                  </Box>
                                ))}
                              </Stack>
                            )}
                          </Box>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {/* Step 2: Review & Create */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Review & Create
              </Typography>
              
              <Stack spacing={3}>
                {/* Workspace Summary */}
                <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <WorkspaceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {formData.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {formData.description}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label={`${formData.applications.length} Applications`} size="small" />
                    <Chip 
                      label={`${formData.applications.reduce((total, app) => total + app.environments.length, 0)} Environments`} 
                      size="small" 
                    />
                  </Stack>
                </Box>

                {/* Applications Summary */}
                {formData.applications.map((app, index) => (
                  <Box key={index} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      <AppsIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 18 }} />
                      {app.displayName} ({app.type})
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {app.description}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                      {app.environments.map((env, envIndex) => (
                        <Chip
                          key={envIndex}
                          label={`${env.displayName} (${env.type})${env.isDefault ? ' - Default' : ''}`}
                          size="small"
                          variant="outlined"
                          color={env.type === 'production' ? 'error' : 'default'}
                        />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCancelClick}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Box sx={{ flex: '1 1 auto' }} />
          
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={loading}>
              Back
            </Button>
          )}
          
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading || (activeStep === 0 && (nameValidation.isChecking || !nameValidation.isValid))}
            >
              {activeStep === 0 && nameValidation.isChecking ? 'Validating...' : 'Next'}
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <WorkspaceIcon />}
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
      >
        <DialogTitle>Discard Changes?</DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes. Are you sure you want to discard them and close this dialog?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Keep Editing
          </Button>
          <Button onClick={handleCancelConfirm} variant="contained" color="error">
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreateWorkspaceDialog;