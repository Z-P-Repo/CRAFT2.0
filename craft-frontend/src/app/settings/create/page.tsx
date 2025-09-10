'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Workspaces as WorkspaceIcon,
  Apps as AppsIcon,
  Science as EnvironmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Build as SettingsIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';

const steps = ['Workspace Details', 'Applications & Projects', 'Environments', 'Review & Create'];

const applicationTypes = [
  { 
    value: 'web', 
    label: 'Web Application', 
    description: 'Frontend web applications',
    icon: '🌐',
    defaultEnvironments: ['development', 'staging', 'production']
  },
  { 
    value: 'api', 
    label: 'REST API', 
    description: 'Backend API services',
    icon: '🔌',
    defaultEnvironments: ['development', 'testing', 'production']
  },
  { 
    value: 'mobile', 
    label: 'Mobile App', 
    description: 'iOS/Android applications',
    icon: '📱',
    defaultEnvironments: ['development', 'testing', 'production']
  },
  { 
    value: 'desktop', 
    label: 'Desktop App', 
    description: 'Desktop applications',
    icon: '🖥️',
    defaultEnvironments: ['development', 'staging', 'production']
  },
  { 
    value: 'service', 
    label: 'Service', 
    description: 'Background services',
    icon: '⚙️',
    defaultEnvironments: ['development', 'production']
  },
  { 
    value: 'microservice', 
    label: 'Microservice', 
    description: 'Containerized microservices',
    icon: '🔗',
    defaultEnvironments: ['development', 'testing', 'staging', 'production']
  }
];

const environmentTypes = [
  { value: 'development', label: 'Development', description: 'For active development' },
  { value: 'testing', label: 'Testing', description: 'For QA and testing' },
  { value: 'staging', label: 'Staging', description: 'Pre-production environment' },
  { value: 'production', label: 'Production', description: 'Live production environment' },
  { value: 'preview', label: 'Preview', description: 'Feature preview environment' },
  { value: 'hotfix', label: 'Hotfix', description: 'Emergency hotfix environment' }
];

interface Environment {
  name: string;
  displayName: string;
  description: string;
  type: string;
  isDefault: boolean;
}

interface Application {
  name: string;
  displayName: string;
  description: string;
  type: string;
  environments: Environment[];
}

interface WorkspaceSettings {
  workspace: {
    name: string;
    displayName: string;
    description: string;
  };
  applications: Application[];
}

export default function CreateWorkspacePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const snackbar = useSnackbar();
  const router = useRouter();

  // Form state
  const [settings, setSettings] = useState<WorkspaceSettings>({
    workspace: {
      name: '',
      displayName: '',
      description: ''
    },
    applications: [
      {
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
      }
    ]
  });


  // Generate name from display name
  const generateName = useCallback((displayName: string): string => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }, []);

  // Handle workspace changes
  const handleWorkspaceChange = useCallback((field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      workspace: {
        ...prev.workspace,
        [field]: value,
        ...(field === 'displayName' && { name: generateName(value) })
      }
    }));
  }, [generateName]);

  // Handle application changes
  const handleApplicationChange = useCallback((index: number, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      applications: prev.applications.map((app, i) => {
        if (i === index) {
          const updates: any = {
            ...app,
            [field]: value,
            ...(field === 'displayName' && { name: generateName(value) })
          };
          
          // Auto-generate environments when type changes
          if (field === 'type') {
            const appType = applicationTypes.find(type => type.value === value);
            if (appType && appType.defaultEnvironments) {
              updates.environments = appType.defaultEnvironments.map((envType, envIndex) => ({
                name: envType,
                displayName: envType.charAt(0).toUpperCase() + envType.slice(1),
                description: `${envType} environment for ${app.displayName || 'this application'}`,
                type: envType,
                isDefault: envIndex === 0
              }));
            }
          }
          
          return updates;
        }
        return app;
      })
    }));
  }, [generateName]);

  // Add new application
  const addApplication = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      applications: [
        ...prev.applications,
        {
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
        }
      ]
    }));
  }, []);

  // Remove application
  const removeApplication = useCallback((index: number) => {
    setSettings(prev => ({
      ...prev,
      applications: prev.applications.filter((_, i) => i !== index)
    }));
  }, []);

  // Handle environment changes
  const handleEnvironmentChange = useCallback((appIndex: number, envIndex: number, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      applications: prev.applications.map((app, i) => 
        i === appIndex
          ? {
              ...app,
              environments: app.environments.map((env, j) => 
                j === envIndex
                  ? {
                      ...env,
                      [field]: value,
                      ...(field === 'displayName' && typeof value === 'string' && { name: generateName(value) })
                    }
                  : field === 'isDefault' && value === true ? { ...env, isDefault: false } : env
              )
            }
          : app
      )
    }));
  }, [generateName]);

  // Add environment to application
  const addEnvironment = useCallback((appIndex: number) => {
    setSettings(prev => ({
      ...prev,
      applications: prev.applications.map((app, i) => 
        i === appIndex
          ? {
              ...app,
              environments: [
                ...app.environments,
                {
                  name: '',
                  displayName: '',
                  description: '',
                  type: 'development',
                  isDefault: false
                }
              ]
            }
          : app
      )
    }));
  }, []);

  // Remove environment
  const removeEnvironment = useCallback((appIndex: number, envIndex: number) => {
    setSettings(prev => ({
      ...prev,
      applications: prev.applications.map((app, i) => 
        i === appIndex
          ? {
              ...app,
              environments: app.environments.filter((_, j) => j !== envIndex)
            }
          : app
      )
    }));
  }, []);


  // Validation
  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 0: // Workspace
        return !!(settings.workspace.displayName.trim());
      
      case 1: // Applications
        return settings.applications.every(app => 
          app.displayName.trim()
        );
      
      case 2: // Environments
        return settings.applications.every(app => 
          app.environments.length > 0 && 
          app.environments.every(env => env.displayName.trim() && env.type) &&
          app.environments.some(env => env.isDefault)
        );
      
      default:
        return true;
    }
  }, [settings]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    } else {
      snackbar.showError('Please fill in all required fields');
    }
  }, [activeStep, validateStep, snackbar]);

  // Handle back step
  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  // Submit settings
  const handleSubmit = useCallback(async () => {
    if (!validateStep(activeStep)) {
      snackbar.showError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/settings', settings);
      
      if (response.success) {
        snackbar.showSuccess('Workspace created successfully!');
        router.push('/settings');
      } else {
        snackbar.showError(response.error || 'Failed to create workspace');
      }
    } catch (error: any) {
      snackbar.showError(error?.response?.data?.error || 'Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  }, [activeStep, settings, validateStep, snackbar, router]);

  const renderWorkspaceStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WorkspaceIcon />
        Workspace Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        A workspace is your organization's top-level container for all projects and environments.
      </Typography>


      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Workspace Display Name"
          placeholder="My Organization"
          value={settings.workspace.displayName}
          onChange={(e) => handleWorkspaceChange('displayName', e.target.value)}
          required
          helperText="This is the human-readable name for your workspace"
        />
      </Box>
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Description"
        placeholder="Describe your workspace..."
        value={settings.workspace.description}
        onChange={(e) => handleWorkspaceChange('description', e.target.value)}
        helperText="Optional: Brief description of your workspace"
      />
    </Box>
  );

  const renderApplicationsStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AppsIcon />
        Applications & Projects (Enhanced)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Applications are your individual projects or services within the workspace.
      </Typography>

      {settings.applications.map((app, appIndex) => (
        <Accordion key={appIndex} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="subtitle1">
                {app.displayName || `Application ${appIndex + 1}`}
              </Typography>
              {settings.applications.length > 1 && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeApplication(appIndex);
                  }}
                  sx={{ ml: 'auto' }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Application Name"
                placeholder="My App"
                value={app.displayName}
                onChange={(e) => handleApplicationChange(appIndex, 'displayName', e.target.value)}
                required
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Application Type</InputLabel>
                <Select
                  value={app.type}
                  label="Application Type"
                  onChange={(e) => handleApplicationChange(appIndex, 'type', e.target.value)}
                >
                  {applicationTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body1">{type.icon}</Typography>
                        <Box>
                          <Typography variant="body2">{type.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              placeholder="Describe this application..."
              value={app.description}
              onChange={(e) => handleApplicationChange(appIndex, 'description', e.target.value)}
            />
            {app.type && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Auto-Generated:</strong> Selecting "{applicationTypes.find(t => t.value === app.type)?.label}" 
                  will automatically create {applicationTypes.find(t => t.value === app.type)?.defaultEnvironments?.length || 0} 
                  default environments in the next step.
                </Typography>
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          startIcon={<AddIcon />}
          onClick={addApplication}
          variant="contained"
          size="small"
        >
          Add Application
        </Button>
      </Box>
    </Box>
  );

  const renderEnvironmentsStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EnvironmentIcon />
        Environments
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Environments represent different deployment stages for your applications (dev, staging, production).
      </Typography>

      {settings.applications.map((app, appIndex) => (
        <Accordion key={appIndex} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              {app.displayName} Environments
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {app.environments.map((env, envIndex) => (
              <Card key={envIndex} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2">
                      Environment {envIndex + 1}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {env.isDefault && (
                        <Chip label="Default" size="small" color="primary" />
                      )}
                      {app.environments.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => removeEnvironment(appIndex, envIndex)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Environment Name"
                      placeholder="Production"
                      value={env.displayName}
                      onChange={(e) => handleEnvironmentChange(appIndex, envIndex, 'displayName', e.target.value)}
                      required
                    />
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Environment Type</InputLabel>
                      <Select
                        value={env.type}
                        label="Environment Type"
                        onChange={(e) => handleEnvironmentChange(appIndex, envIndex, 'type', e.target.value)}
                      >
                        {environmentTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            <Box>
                              <Typography variant="body2">{type.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {type.description}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box sx={{ gridColumn: { xs: '1', sm: 'span 2' }, display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={env.isDefault}
                            onChange={(e) => handleEnvironmentChange(appIndex, envIndex, 'isDefault', e.target.checked)}
                          />
                        }
                        label="Default Environment"
                      />
                    </Box>
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    label="Description"
                    placeholder="Describe this environment..."
                    value={env.description}
                    onChange={(e) => handleEnvironmentChange(appIndex, envIndex, 'description', e.target.value)}
                  />
                </CardContent>
              </Card>
            ))}

            <Box sx={{ textAlign: 'center' }}>
              <Button
                startIcon={<AddIcon />}
                onClick={() => addEnvironment(appIndex)}
                variant="outlined"
                size="small"
              >
                Add Environment
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );

  const renderReviewStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckCircleIcon />
        Review & Create
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review your workspace configuration before creating.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {settings.workspace.displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {settings.workspace.name}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {settings.workspace.description}
          </Typography>
        </CardContent>
      </Card>

      {settings.applications.map((app, appIndex) => (
        <Card key={appIndex} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              {app.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {app.description}
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom>
              Environments:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {app.environments.map((env, envIndex) => (
                <Chip
                  key={envIndex}
                  label={`${env.displayName} (${env.type})`}
                  color={env.isDefault ? 'primary' : 'default'}
                  variant={env.isDefault ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      ))}

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Summary:</strong> You're creating 1 workspace, {settings.applications.length} application(s), 
          and {settings.applications.reduce((total, app) => total + app.environments.length, 0)} environment(s).
        </Typography>
      </Alert>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderWorkspaceStep();
      case 1:
        return renderApplicationsStep();
      case 2:
        return renderEnvironmentsStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="h5" component="h1" fontWeight="600">
              Create New Workspace
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, textAlign: 'center' }}>
            <Box>
              <Typography variant="h6" color="primary.main" fontWeight="600">
                {activeStep + 1}/{steps.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Step
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="success.main" fontWeight="600">
                {settings.applications.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Apps
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="info.main" fontWeight="600">
                {settings.applications.reduce((total, app) => total + app.environments.length, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Environments
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Create your workspace, applications, and environments all in one place
          </Typography>
        </Box>
      </Paper>

      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel 
                StepIconComponent={({ active, completed }) => (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                      color: 'white',
                      fontWeight: 600
                    }}
                  >
                    {completed ? <CheckIcon fontSize="small" /> : index + 1}
                  </Box>
                )}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Main Content */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ p: 4 }}>
          {renderStepContent()}

          <Divider sx={{ my: 4 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              variant="outlined"
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/settings')}
              >
                Cancel
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  size="large"
                  disabled={isLoading || !validateStep(activeStep)}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                >
                  {isLoading ? 'Creating...' : 'Create Workspace'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  disabled={!validateStep(activeStep)}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </DashboardLayout>
  );
}