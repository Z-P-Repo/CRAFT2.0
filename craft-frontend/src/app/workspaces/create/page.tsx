'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  FormControlLabel,
  Switch,
  Stack,
  Divider,
  Breadcrumbs,
  Link,
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
  Chip,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import {
  Business as WorkspaceIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Apps as AppsIcon,
  CloudQueue as EnvironmentIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';

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
  isDefault: boolean;
}

interface WorkspaceFormData {
  name: string;
  displayName: string;
  description: string;
  applications: ApplicationFormData[];
}

const applicationTypes = [
  { value: 'web', label: 'Web Application' },
  { value: 'api', label: 'API Service' },
  { value: 'mobile', label: 'Mobile Application' },
  { value: 'desktop', label: 'Desktop Application' },
  { value: 'service', label: 'Service' },
  { value: 'microservice', label: 'Microservice' }
];

const environmentTypes = [
  { value: 'development', label: 'Development' },
  { value: 'testing', label: 'Testing' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
  { value: 'preview', label: 'Preview' },
  { value: 'hotfix', label: 'Hotfix' }
];

const steps = [
  'Workspace Details',
  'Applications & Environments',
  'Review & Create'
];

export default function CreateWorkspacePage() {
  const router = useRouter();
  const { showError, showSuccess, hideSnackbar } = useSnackbar();
  const { refreshWorkspaces } = useWorkspace();
  
  // Helper function to generate valid system names
  const generateValidSystemName = useCallback((displayName: string): string => {
    if (!displayName) return '';
    let name = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Ensure minimum length of 2 characters  
    if (name.length < 2) {
      name = name + '01'; // Append '01' if too short
    }
    
    return name;
  }, []);
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [nameValidation, setNameValidation] = useState<{
    isValidating: boolean;
    isValid: boolean;
    message: string;
  }>({
    isValidating: false,
    isValid: true,
    message: ''
  });
  const [formData, setFormData] = useState<WorkspaceFormData>({
    name: '',
    displayName: '',
    description: '',
    applications: []
  });
  const [selectedAction, setSelectedAction] = useState<'draft' | 'publish' | null>(null);

  const handleCancelClick = useCallback(() => {
    // Check if there's any unsaved data
    const hasUnsavedData = formData.name || formData.description || formData.applications.length > 0;
    
    if (hasUnsavedData) {
      setShowCancelDialog(true);
    } else {
      router.push('/workspaces');
    }
  }, [formData, router]);

  const handleConfirmCancel = useCallback(() => {
    setShowCancelDialog(false);
    router.push('/workspaces');
  }, [router]);

  const handleCancelDialogClose = useCallback(() => {
    setShowCancelDialog(false);
  }, []);

  const handleNext = useCallback(() => {
    setActiveStep((prevStep) => prevStep + 1);
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prevStep) => prevStep - 1);
  }, []);

  // Debounced name validation
  const validateWorkspaceName = useCallback(
    async (name: string) => {
      if (!name) {
        setNameValidation({ isValidating: false, isValid: false, message: '' });
        return;
      }

      // Length validation on trimmed input
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        setNameValidation({ isValidating: false, isValid: false, message: 'Name must be at least 2 characters' });
        return;
      }

      if (trimmedName.length > 25) {
        setNameValidation({ isValidating: false, isValid: false, message: 'Name must be no more than 25 characters' });
        return;
      }

      setNameValidation({ isValidating: true, isValid: false, message: 'Checking availability...' });

      try {
        // Use search to find similar names, then check for exact match using trimmed name
        const response = await apiClient.get(`/workspaces?search=${encodeURIComponent(trimmedName)}&limit=100`);
        
        if (response.success && response.data) {
          const workspaces = response.data.workspaces || response.data || [];
          const exactMatch = workspaces.find((ws: any) => ws.name === trimmedName);
          
          if (exactMatch) {
            setNameValidation({ 
              isValidating: false, 
              isValid: false, 
              message: 'This workspace name is already taken' 
            });
          } else {
            setNameValidation({ 
              isValidating: false, 
              isValid: true, 
              message: 'Name is available' 
            });
          }
        } else {
          // If search fails, assume name is available (graceful degradation)
          setNameValidation({ 
            isValidating: false, 
            isValid: true, 
            message: '' 
          });
        }
      } catch (error) {
        console.error('Name validation error:', error);
        // Graceful degradation - don't block user if API fails
        setNameValidation({ 
          isValidating: false, 
          isValid: true, 
          message: '' 
        });
      }
    },
    []
  );

  // Debounce name validation
  useEffect(() => {
    if (formData.name && formData.name.length >= 2) {
      const timeoutId = setTimeout(() => {
        validateWorkspaceName(formData.name);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else if (formData.name && formData.name.length < 2) {
      // Handle short names immediately
      setNameValidation({ 
        isValidating: false, 
        isValid: false, 
        message: 'Name must be at least 2 characters' 
      });
    } else {
      // Empty name case
      setNameValidation({ 
        isValidating: false, 
        isValid: false, 
        message: '' 
      });
    }
    return undefined;
  }, [formData.name, validateWorkspaceName]);

  const handleWorkspaceChange = useCallback((field: keyof Pick<WorkspaceFormData, 'name' | 'description'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset validation when name changes
    if (field === 'name') {
      setNameValidation({ isValidating: false, isValid: true, message: '' });
    }
  }, []);

  const addApplication = useCallback(() => {
    const newApp: ApplicationFormData = {
      name: '',
      displayName: '',
      description: '',
      type: 'web',
      environments: [
        {
          name: 'development',
          displayName: 'Development',
          description: 'Development environment',
          type: 'development',
          isDefault: true
        }
      ]
    };
    setFormData(prev => ({
      ...prev,
      applications: [...prev.applications, newApp]
    }));
  }, []);

  const removeApplication = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      applications: prev.applications.filter((_, i) => i !== index)
    }));
  }, []);

  const updateApplication = useCallback((appIndex: number, field: keyof ApplicationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      applications: prev.applications.map((app, i) => 
        i === appIndex ? {
          ...app,
          [field]: value,
          ...(field === 'displayName' && !app.name ? { 
            name: value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') 
          } : {})
        } : app
      )
    }));
  }, []);

  const addEnvironment = useCallback((appIndex: number) => {
    const newEnv: EnvironmentFormData = {
      name: '',
      displayName: '',
      description: '',
      type: 'development',
      isDefault: false
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
  }, []);

  const removeEnvironment = useCallback((appIndex: number, envIndex: number) => {
    setFormData(prev => ({
      ...prev,
      applications: prev.applications.map((app, i) => 
        i === appIndex ? {
          ...app,
          environments: app.environments.filter((_, j) => j !== envIndex)
        } : app
      )
    }));
  }, []);

  const updateEnvironment = useCallback((appIndex: number, envIndex: number, field: keyof EnvironmentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      applications: prev.applications.map((app, i) => 
        i === appIndex ? {
          ...app,
          environments: app.environments.map((env, j) => 
            j === envIndex ? {
              ...env,
              [field]: value,
              ...(field === 'displayName' && !env.name ? { 
                name: value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') 
              } : {})
            } : env
          )
        } : app
      )
    }));
  }, []);

  const submitWorkspace = useCallback(async (status: 'draft' | 'active') => {
    try {
      setLoading(true);
      // Clear any existing error messages
      hideSnackbar();

      if (!formData.name) {
        showError('Workspace name is required');
        return;
      }

      // Use workspace name as displayName and auto-generate system names if not provided
      const submitData = {
        ...formData,
        displayName: formData.name,
        status,
        applications: formData.applications.map(app => ({
          ...app,
          name: app.name || generateValidSystemName(app.displayName),
          environments: app.environments.map(env => ({
            ...env,
            name: env.name || generateValidSystemName(env.displayName)
          }))
        }))
      };

      const response = await apiClient.post('/workspaces', submitData);

      if (response.success) {
        const message = status === 'active' 
          ? 'Workspace created and published successfully! It is now active.'
          : 'Workspace created successfully as draft! You can publish it later from the workspaces list.';
        showSuccess(message);
        await refreshWorkspaces();
        router.push('/workspaces');
      } else {
        throw new Error(response.error || 'Failed to create workspace');
      }
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      showError(error.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  }, [formData, showError, showSuccess, hideSnackbar, refreshWorkspaces, router, generateValidSystemName]);

  // Handle saving as draft
  const handleSaveDraft = useCallback(() => {
    setSelectedAction('draft');
    submitWorkspace('draft');
  }, [submitWorkspace]);

  // Handle publishing immediately  
  const handlePublish = useCallback(() => {
    setSelectedAction('publish');
    submitWorkspace('active');
  }, [submitWorkspace]);

  const isStepValid = useCallback((step: number) => {
    switch (step) {
      case 0:
        // Step 0: Length and duplicate check required
        return formData.name && 
               formData.name.trim().length >= 2 &&
               formData.name.trim().length <= 25 &&
               nameValidation.isValid && 
               !nameValidation.isValidating;
      case 1:
        // Step 1: Must have at least one application with at least one environment
        return formData.applications.length > 0 &&
               formData.applications.every(app => 
                 app.displayName && 
                 app.displayName.trim().length > 0 &&
                 app.environments.length > 0 &&
                 app.environments.every(env => 
                   env.displayName && 
                   env.displayName.trim().length > 0
                 )
               );
      case 2:
        // Step 2: Review step - all previous validations must pass
        return isStepValid(0) && isStepValid(1);
      default:
        return false;
    }
  }, [formData, nameValidation]);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Card sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                Workspace Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Basic information about your workspace
              </Typography>
            </Box>

            <Stack spacing={3}>
              <TextField
                label="Workspace Name"
                value={formData.name}
                onChange={(e) => handleWorkspaceChange('name', e.target.value)}
                placeholder="e.g., my-awesome-workspace"
                fullWidth
                required
                error={!nameValidation.isValid && !nameValidation.isValidating && formData.name.length > 0}
                helperText={
                  nameValidation.isValidating 
                    ? "Checking availability..." 
                    : nameValidation.message || "Enter a unique name for your workspace (2-25 characters)"
                }
                InputProps={{
                  endAdornment: nameValidation.isValidating ? (
                    <CircularProgress size={20} />
                  ) : nameValidation.isValid && nameValidation.message ? (
                    <CheckIcon color="success" />
                  ) : null
                }}
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => handleWorkspaceChange('description', e.target.value)}
                placeholder="Describe the purpose of this workspace..."
                multiline
                rows={3}
                fullWidth
              />
            </Stack>
          </Card>
        );

      case 1:
        return (
          <Card sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                Applications & Environments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Define the applications and their environments within this workspace
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addApplication}
                sx={{ mb: 3 }}
              >
                Add Application
              </Button>

              {formData.applications.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
                  <AppsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No applications added yet. Click "Add Application" to get started.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={3}>
                  {formData.applications.map((app, appIndex) => (
                    <Paper key={appIndex} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                      {/* Application Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <AppsIcon color="primary" />
                          <Typography variant="subtitle1" fontWeight={600}>
                            {app.displayName || `Application ${appIndex + 1}`}
                          </Typography>
                          <Chip label={app.type} size="small" color="primary" variant="outlined" />
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => removeApplication(appIndex)}
                          size="small"
                          sx={{ '&:hover': { bgcolor: 'error.50' } }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      {/* Application Fields */}
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <TextField
                            label="Display Name"
                            value={app.displayName}
                            onChange={(e) => updateApplication(appIndex, 'displayName', e.target.value)}
                            placeholder="e.g., Web Portal"
                            size="small"
                            required
                            sx={{ flex: 2 }}
                          />
                          <FormControl size="small" sx={{ flex: 1, minWidth: 140 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                              value={app.type}
                              onChange={(e) => updateApplication(appIndex, 'type', e.target.value)}
                              label="Type"
                            >
                              {applicationTypes.map(type => (
                                <MenuItem key={type.value} value={type.value}>
                                  {type.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>

                        <TextField
                          label="Description"
                          value={app.description}
                          onChange={(e) => updateApplication(appIndex, 'description', e.target.value)}
                          placeholder="Describe this application..."
                          size="small"
                          multiline
                          rows={2}
                          fullWidth
                        />

                        {/* Environments Section */}
                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.25', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                              Environments
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => addEnvironment(appIndex)}
                              variant="text"
                            >
                              Add Environment
                            </Button>
                          </Box>

                          <Stack spacing={2}>
                            {app.environments.map((env, envIndex) => (
                              <Box 
                                key={envIndex} 
                                sx={{ 
                                  p: 2, 
                                  bgcolor: 'white', 
                                  borderRadius: 1, 
                                  border: '1px solid', 
                                  borderColor: 'grey.200' 
                                }}
                              >
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                                  <TextField
                                    label="Display Name"
                                    value={env.displayName}
                                    onChange={(e) => updateEnvironment(appIndex, envIndex, 'displayName', e.target.value)}
                                    placeholder="e.g., Development"
                                    size="small"
                                    required
                                    sx={{ flex: 2 }}
                                  />
                                  <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                      value={env.type}
                                      onChange={(e) => updateEnvironment(appIndex, envIndex, 'type', e.target.value)}
                                      label="Type"
                                    >
                                      {environmentTypes.map(type => (
                                        <MenuItem key={type.value} value={type.value}>
                                          {type.label}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={env.isDefault}
                                        onChange={(e) => updateEnvironment(appIndex, envIndex, 'isDefault', e.target.checked)}
                                        size="small"
                                      />
                                    }
                                    label="Default"
                                    sx={{ ml: 1 }}
                                  />
                                  <IconButton
                                    color="error"
                                    onClick={() => removeEnvironment(appIndex, envIndex)}
                                    size="small"
                                    sx={{ '&:hover': { bgcolor: 'error.50' } }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>

                                <TextField
                                  label="Description"
                                  value={env.description}
                                  onChange={(e) => updateEnvironment(appIndex, envIndex, 'description', e.target.value)}
                                  placeholder="Describe this environment..."
                                  size="small"
                                  fullWidth
                                />
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Card>
        );

      case 2:
        return (
          <Card sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                Review & Create
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review your workspace configuration before creating
              </Typography>
            </Box>

            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Workspace Details
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                      Workspace Name:
                    </Typography>
                    <Typography variant="body2">
                      {formData.name}
                    </Typography>
                  </Box>
                  {formData.description && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                        Description:
                      </Typography>
                      <Typography variant="body2">
                        {formData.description}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Applications ({formData.applications.length})
                </Typography>
                {formData.applications.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No applications configured
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {formData.applications.map((app, appIndex) => (
                      <Box key={appIndex} sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'primary.main' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <AppsIcon fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight={500}>
                            {app.displayName}
                          </Typography>
                          <Chip label={app.type} size="small" />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                          {app.environments.length} environment{app.environments.length !== 1 ? 's' : ''}: {' '}
                          {app.environments.map(env => env.displayName).join(', ')}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                  Choose How to Create Your Workspace
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Card sx={{ 
                    flex: 1, 
                    p: 2, 
                    border: '2px solid', 
                    borderColor: 'grey.200',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main'
                    }
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      💾 Save as Draft
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Save the workspace for review and testing. You can publish it later from the workspaces list.
                    </Typography>
                  </Card>
                  <Card sx={{ 
                    flex: 1, 
                    p: 2, 
                    border: '2px solid', 
                    borderColor: 'grey.200',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    '&:hover': {
                      borderColor: 'success.main'
                    }
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🚀 Publish Immediately
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Create and publish the workspace immediately. It will be active and ready to use.
                    </Typography>
                  </Card>
                </Box>
              </Box>

              {loading && (
                <Alert severity="info">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    Creating workspace...
                  </Box>
                </Alert>
              )}
            </Stack>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ mb: 1 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <Link 
              color="inherit" 
              onClick={handleCancelClick}
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              Workspaces
            </Link>
            <Typography color="text.primary">Create New Workspace</Typography>
          </Breadcrumbs>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                onClick={handleCancelClick}
                sx={{ 
                  bgcolor: 'grey.100',
                  '&:hover': { bgcolor: 'grey.200' }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <WorkspaceIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Box>
                <Typography variant="h5" component="h1" fontWeight="600">
                  Create New Workspace
                </Typography>
              </Box>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Set up a new workspace with applications and environments
          </Typography>
        </Box>
      </Paper>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel 
                StepIconComponent={({ active, completed }) => (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                      color: 'white',
                      fontWeight: 600
                    }}
                  >
                    {completed ? <CheckIcon /> : index + 1}
                  </Box>
                )}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: activeStep === index ? 600 : 400,
                    color: activeStep === index ? 'primary.main' : 'text.secondary'
                  }}
                >
                  {label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={handleCancelClick}
              variant="outlined"
              color="error"
            >
              Cancel
            </Button>
            {activeStep === steps.length - 1 ? (
              <>
                <Button
                  variant="outlined"
                  onClick={handleSaveDraft}
                  disabled={loading || !isStepValid(activeStep)}
                  startIcon={loading && selectedAction === 'draft' ? <CircularProgress size={20} /> : null}
                  sx={{ mr: 2 }}
                >
                  {loading && selectedAction === 'draft' ? 'Saving Draft...' : 'Save as Draft'}
                </Button>
                <Button
                  variant="contained"
                  onClick={handlePublish}
                  disabled={loading || !isStepValid(activeStep)}
                  startIcon={loading && selectedAction === 'publish' ? <CircularProgress size={20} /> : <CheckIcon />}
                >
                  {loading && selectedAction === 'publish' ? 'Publishing...' : 'Publish Workspace'}
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid(activeStep)}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={handleCancelDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Cancel Workspace Creation?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to cancel creating this workspace? All unsaved changes will be lost.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleCancelDialogClose}
            variant="outlined"
          >
            Continue Editing
          </Button>
          <Button
            onClick={handleConfirmCancel}
            variant="contained"
            color="error"
          >
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}