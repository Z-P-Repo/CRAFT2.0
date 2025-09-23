'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Check as CheckIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface ApplicationFormData {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  type: 'web' | 'api' | 'mobile' | 'desktop' | 'service' | 'microservice';
  environments: EnvironmentFormData[];
}

interface EnvironmentFormData {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  type: 'development' | 'testing' | 'staging' | 'production' | 'preview' | 'hotfix';
  isDefault: boolean;
}

interface WorkspaceFormData {
  _id?: string;
  name: string;
  displayName: string;
  description: string;
  settings: {
    allowSubdomains: boolean;
    enforceSSO: boolean;
    requireMFA: boolean;
    sessionTimeout: number;
    maxConcurrentSessions: number;
    dataRetentionPeriod: number;
    allowGuestUsers: boolean;
    enableAuditLogging: boolean;
    inheritancePolicies: {
      allowApplicationOverrides: boolean;
      allowEnvironmentOverrides: boolean;
      requireApprovalForChanges: boolean;
    };
  };
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
  'Review & Save'
];

export default function EditWorkspacePage() {
  const { workspaceId } = useParams();
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'draft' | 'publish' | null>(null);
  const [originalData, setOriginalData] = useState<WorkspaceFormData | null>(null);
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
    settings: {
      allowSubdomains: false,
      enforceSSO: false,
      requireMFA: false,
      sessionTimeout: 3600,
      maxConcurrentSessions: 5,
      dataRetentionPeriod: 365,
      allowGuestUsers: false,
      enableAuditLogging: true,
      inheritancePolicies: {
        allowApplicationOverrides: true,
        allowEnvironmentOverrides: true,
        requireApprovalForChanges: false
      }
    },
    applications: []
  });

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch workspace details with applications and environments
        const [workspaceResponse, applicationsResponse] = await Promise.all([
          apiClient.get(`/workspaces/${workspaceId}`),
          apiClient.get(`/workspaces/${workspaceId}/applications`)
        ]);
        
        if (workspaceResponse.success) {
          const workspace = workspaceResponse.data;
          
          // Fetch environments for each application
          const applications = applicationsResponse.success ? applicationsResponse.data : [];
          const applicationsWithEnvironments = await Promise.all(
            applications.map(async (app: any) => {
              const envResponse = await apiClient.get(`/workspaces/${workspaceId}/applications/${app._id}/environments`);
              const environments = envResponse.success ? envResponse.data.map((env: any) => ({
                id: env._id,
                name: env.name,
                displayName: env.displayName,
                description: env.description || '',
                type: env.type,
                isDefault: env.isDefault || false
              })) : [];
              
              return {
                id: app._id,
                name: app.name,
                displayName: app.displayName,
                description: app.description || '',
                type: app.type,
                environments
              };
            })
          );
          
          const workspaceData: WorkspaceFormData = {
            _id: workspace._id,
            name: workspace.name,
            displayName: workspace.displayName,
            description: workspace.description || '',
            settings: {
              allowSubdomains: workspace.settings?.allowSubdomains ?? false,
              enforceSSO: workspace.settings?.enforceSSO ?? false,
              requireMFA: workspace.settings?.requireMFA ?? false,
              sessionTimeout: workspace.settings?.sessionTimeout ?? 3600,
              maxConcurrentSessions: workspace.settings?.maxConcurrentSessions ?? 5,
              dataRetentionPeriod: workspace.settings?.dataRetentionPeriod ?? 365,
              allowGuestUsers: workspace.settings?.allowGuestUsers ?? false,
              enableAuditLogging: workspace.settings?.enableAuditLogging ?? true,
              inheritancePolicies: {
                allowApplicationOverrides: workspace.settings?.inheritancePolicies?.allowApplicationOverrides ?? true,
                allowEnvironmentOverrides: workspace.settings?.inheritancePolicies?.allowEnvironmentOverrides ?? true,
                requireApprovalForChanges: workspace.settings?.inheritancePolicies?.requireApprovalForChanges ?? false
              }
            },
            applications: applicationsWithEnvironments
          };
          
          setFormData(workspaceData);
          setOriginalData(JSON.parse(JSON.stringify(workspaceData))); // Deep copy for comparison
        } else {
          throw new Error(workspaceResponse.error || 'Failed to fetch workspace');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load workspace');
        showError('Failed to load workspace details');
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchWorkspace();
    }
  }, [workspaceId, showError]);

  const handleCancelClick = useCallback(() => {
    // Check if there's any unsaved data
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
    
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      router.push('/workspaces');
    }
  }, [formData, originalData, router]);

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
      if (!name || name === originalData?.name) {
        setNameValidation({ isValidating: false, isValid: true, message: '' });
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
        // Use validation endpoint to check ALL workspaces for exact name match, excluding current workspace
        const response = await apiClient.get(`/workspaces/validate-name/${encodeURIComponent(trimmedName)}?excludeId=${workspaceId}`) as any;

        if (response.success && response.available) {
          // Name is available
          setNameValidation({
            isValidating: false,
            isValid: true,
            message: 'Name is available'
          });
        } else if (response.success === false) {
          // Name is taken by another workspace
          const errorMessage = response.details?.message || response.error || 'This workspace name is already taken';
          setNameValidation({
            isValidating: false,
            isValid: false,
            message: errorMessage
          });
        } else {
          // If search fails, assume name is available (graceful degradation)
          setNameValidation({ 
            isValidating: false, 
            isValid: true, 
            message: '' 
          });
        }
      } catch (error: any) {
        console.error('Name validation error:', error);
        // Handle API error responses (409, etc.)
        if (error.success === false) {
          const errorMessage = error.details?.message || error.error || 'This workspace name is already taken';
          setNameValidation({
            isValidating: false,
            isValid: false,
            message: errorMessage
          });
        } else {
          // Graceful degradation - don't block user if API fails
          setNameValidation({
            isValidating: false,
            isValid: true,
            message: ''
          });
        }
      }
    },
    [originalData?.name, workspaceId]
  );

  // Debounce name validation
  useEffect(() => {
    if (formData.name && formData.name.length >= 2) {
      const timeoutId = setTimeout(() => {
        validateWorkspaceName(formData.name);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else if (formData.displayName && formData.displayName.length < 2) {
      // Handle short displayNames immediately
      setNameValidation({
        isValidating: false,
        isValid: false,
        message: 'Name must be at least 2 characters'
      });
    } else if (!formData.displayName) {
      // Empty displayName case
      setNameValidation({
        isValidating: false,
        isValid: false,
        message: ''
      });
    }
    return undefined;
  }, [formData.name, formData.displayName, validateWorkspaceName]);

  const handleWorkspaceChange = useCallback((field: keyof Pick<WorkspaceFormData, 'name' | 'displayName' | 'description'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // When displayName changes, also update internal name
      ...(field === 'displayName' ? { name: generateValidSystemName(value) } : {}),
      // When name changes, also update displayName to keep them in sync
      ...(field === 'name' ? { displayName: value } : {})
    }));

    // Reset validation when name or displayName changes
    if (field === 'name' || field === 'displayName') {
      setNameValidation({ isValidating: false, isValid: true, message: '' });
    }
  }, [generateValidSystemName]);

  const handleSettingsChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
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
            name: generateValidSystemName(value) 
          } : {})
        } : app
      )
    }));
  }, [generateValidSystemName]);

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
                name: generateValidSystemName(value) 
              } : {})
            } : env
          )
        } : app
      )
    }));
  }, [generateValidSystemName]);

  const submitWorkspace = useCallback(async (status: 'draft' | 'active') => {
    try {
      setSaving(true);
      hideSnackbar();

      if (!formData.displayName) {
        showError('Workspace name is required');
        return;
      }

      // Step 1: Update workspace basic details
      const workspaceUpdateData = {
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description,
        settings: formData.settings,
        status: status
      };

      const workspaceResponse = await apiClient.put(`/workspaces/${workspaceId}`, workspaceUpdateData);
      if (!workspaceResponse.success) {
        throw new Error(workspaceResponse.error || 'Failed to update workspace');
      }

      // Step 2: Handle applications and environments
      const originalApps = originalData?.applications || [];
      const newApps = formData.applications;

      // Process each application
      for (const app of newApps) {
        const appData = {
          name: app.name || generateValidSystemName(app.displayName),
          displayName: app.displayName,
          description: app.description || '',
          type: app.type
        };

        let applicationId = app.id;

        if (app.id) {
          // Update existing application
          const updateResponse = await apiClient.put(`/workspaces/${workspaceId}/applications/${app.id}`, appData);
          if (!updateResponse.success) {
            throw new Error(`Failed to update application: ${app.displayName}`);
          }
        } else {
          // Create new application
          const createResponse = await apiClient.post(`/workspaces/${workspaceId}/applications`, appData);
          if (!createResponse.success) {
            throw new Error(`Failed to create application: ${app.displayName}`);
          }
          applicationId = createResponse.data._id;
        }

        // Process environments for this application
        const originalEnvs = originalApps.find(origApp => origApp.id === app.id)?.environments || [];
        
        for (const env of app.environments) {
          const envData = {
            name: env.name || generateValidSystemName(env.displayName),
            displayName: env.displayName,
            description: env.description || '',
            type: env.type,
            isDefault: env.isDefault
          };

          if (env.id) {
            // Update existing environment
            const updateResponse = await apiClient.put(`/workspaces/${workspaceId}/applications/${applicationId}/environments/${env.id}`, envData);
            if (!updateResponse.success) {
              throw new Error(`Failed to update environment: ${env.displayName}`);
            }
          } else {
            // Create new environment
            const createResponse = await apiClient.post(`/workspaces/${workspaceId}/applications/${applicationId}/environments`, envData);
            if (!createResponse.success) {
              throw new Error(`Failed to create environment: ${env.displayName}`);
            }
          }
        }

        // Delete removed environments
        const currentEnvIds = app.environments.filter(env => env.id).map(env => env.id);
        const removedEnvs = originalEnvs.filter(origEnv => !currentEnvIds.includes(origEnv.id));
        
        for (const removedEnv of removedEnvs) {
          if (removedEnv.id) {
            const deleteResponse = await apiClient.delete(`/workspaces/${workspaceId}/applications/${applicationId}/environments/${removedEnv.id}`);
            if (!deleteResponse.success) {
              console.warn(`Failed to delete environment: ${removedEnv.displayName}`);
            }
          }
        }
      }

      // Delete removed applications
      const currentAppIds = newApps.filter(app => app.id).map(app => app.id);
      const removedApps = originalApps.filter(origApp => !currentAppIds.includes(origApp.id));
      
      for (const removedApp of removedApps) {
        if (removedApp.id) {
          const deleteResponse = await apiClient.delete(`/workspaces/${workspaceId}/applications/${removedApp.id}`);
          if (!deleteResponse.success) {
            console.warn(`Failed to delete application: ${removedApp.displayName}`);
          }
        }
      }

      showSuccess(status === 'draft' ? 'Workspace saved as draft' : 'Workspace published successfully');
      await refreshWorkspaces();
      router.push('/workspaces');

    } catch (error: any) {
      console.error('Error updating workspace:', error);
      showError(error.message || 'Failed to update workspace');
    } finally {
      setSaving(false);
    }
  }, [formData, originalData, showError, showSuccess, hideSnackbar, refreshWorkspaces, router, generateValidSystemName, workspaceId]);

  const handleSaveDraft = useCallback(() => {
    setSelectedAction('draft');
    submitWorkspace('draft');
  }, [submitWorkspace]);

  const handlePublish = useCallback(() => {
    setSelectedAction('publish');
    submitWorkspace('active');
  }, [submitWorkspace]);

  const isStepValid = useCallback((step: number) => {
    switch (step) {
      case 0:
        // Step 0: Length and duplicate check required
        return formData.displayName &&
               formData.displayName.trim().length >= 2 &&
               formData.displayName.trim().length <= 100 &&
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
                value={formData.displayName}
                onChange={(e) => handleWorkspaceChange('displayName', e.target.value)}
                placeholder="e.g., my-awesome-workspace"
                fullWidth
                required
                error={!nameValidation.isValid && !nameValidation.isValidating && formData.displayName.length > 0 && formData.displayName !== originalData?.displayName}
                helperText={
                  nameValidation.isValidating
                    ? "Checking availability..."
                    : nameValidation.message || "Enter a unique name for your workspace (2-25 characters)"
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
                Manage applications and their environments within this workspace
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
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'error.50', borderRadius: 2, border: '1px solid', borderColor: 'error.200' }}>
                  <AppsIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                  <Typography variant="body1" color="error.main" fontWeight={600} gutterBottom>
                    At least one application is required
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click "Add Application" to create your first application with at least one environment.
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
                          {app.id && <Chip label="Existing" size="small" color="success" />}
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => removeApplication(appIndex)}
                          size="small"
                          disabled={formData.applications.length === 1}
                          title={formData.applications.length === 1 ? "At least one application is required" : "Delete application"}
                          sx={{ 
                            '&:hover': { bgcolor: 'error.50' },
                            '&.Mui-disabled': { opacity: 0.3 }
                          }}
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
                                  {env.id && <Chip label="Existing" size="small" color="success" />}
                                  <IconButton
                                    color="error"
                                    onClick={() => removeEnvironment(appIndex, envIndex)}
                                    size="small"
                                    disabled={app.environments.length === 1}
                                    title={app.environments.length === 1 ? "Cannot delete the last environment" : "Delete environment"}
                                    sx={{ 
                                      '&:hover': { bgcolor: 'error.50' },
                                      '&.Mui-disabled': { opacity: 0.3 }
                                    }}
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
                Review & Save Changes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review your workspace changes before saving
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
                      Display Name:
                    </Typography>
                    <Typography variant="body2">
                      {formData.displayName}
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
                          {app.id && <Chip label="Existing" size="small" color="success" />}
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

              {/* Action Selection Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: selectedAction === 'draft' ? 'warning.main' : 'grey.200',
                    bgcolor: selectedAction === 'draft' ? 'warning.50' : 'transparent',
                    '&:hover': {
                      borderColor: selectedAction === 'draft' ? 'warning.main' : 'warning.light',
                      bgcolor: selectedAction === 'draft' ? 'warning.50' : 'warning.25'
                    }
                  }}
                  onClick={() => setSelectedAction('draft')}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom color="warning.main">
                      💾 Save as Draft
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Save your changes without making the workspace active. You can continue editing later.
                    </Typography>
                  </CardContent>
                </Card>

                <Card 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: selectedAction === 'publish' ? 'success.main' : 'grey.200',
                    bgcolor: selectedAction === 'publish' ? 'success.50' : 'transparent',
                    '&:hover': {
                      borderColor: selectedAction === 'publish' ? 'success.main' : 'success.light',
                      bgcolor: selectedAction === 'publish' ? 'success.50' : 'success.25'
                    }
                  }}
                  onClick={() => setSelectedAction('publish')}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom color="success.main">
                      🚀 Publish Workspace
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Make the workspace active and available for use. All applications and environments will be accessible.
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {saving && (
                <Alert severity="info">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    {selectedAction === 'draft' ? 'Saving workspace as draft...' : 'Publishing workspace...'}
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

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute>
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
            <Typography color="text.primary">Edit {formData.displayName}</Typography>
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
              <EditIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Box>
                <Typography variant="h5" component="h1" fontWeight="600">
                  Edit Workspace
                </Typography>
              </Box>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Update workspace configuration and manage applications
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
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant={selectedAction === 'draft' ? 'contained' : 'outlined'}
                  color="warning"
                  onClick={handleSaveDraft}
                  disabled={saving || !isStepValid(activeStep)}
                  startIcon={saving && selectedAction === 'draft' ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {saving && selectedAction === 'draft' ? 'Saving Draft...' : 'Save as Draft'}
                </Button>
                <Button
                  variant={selectedAction === 'publish' ? 'contained' : 'outlined'}
                  color="success"
                  onClick={handlePublish}
                  disabled={saving || !isStepValid(activeStep)}
                  startIcon={saving && selectedAction === 'publish' ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {saving && selectedAction === 'publish' ? 'Publishing...' : 'Publish Workspace'}
                </Button>
              </Box>
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
          Cancel Workspace Changes?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to cancel editing this workspace? All unsaved changes will be lost.
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
    </ProtectedRoute>
  );
}