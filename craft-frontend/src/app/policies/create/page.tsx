'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Switch,
  FormControlLabel,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  CircularProgress,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Breadcrumbs,
  Link,
  Container,
  IconButton,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  PlayArrow as ActionIcon,
  Storage as ResourceIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  NavigateNext as NavigateNextIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Settings as AttributeIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';

interface Subject {
  _id: string;
  id: string;
  name: string;
  displayName: string;
  email: string;
  type: 'user' | 'group' | 'role';
  role: string;
  department: string;
  description?: string;
  status: 'active' | 'inactive';
  permissions: string[];
  metadata: {
    createdBy: string;
  };
}

interface ActionObject {
  _id: string;
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: 'read' | 'write' | 'execute' | 'delete' | 'admin';
  httpMethod?: string;
  endpoint?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
  metadata: {
    owner: string;
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    isSystem: boolean;
  };
}

interface ResourceObject {
  _id: string;
  id: string;
  name: string;
  displayName: string;
  type: 'file' | 'document' | 'api' | 'database' | 'service' | 'folder' | 'application';
  uri: string;
  description?: string;
  attributes: any;
  children: string[];
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    execute: boolean;
    admin: boolean;
  };
}

interface Attribute {
  _id: string;
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: 'subject' | 'resource' | 'action' | 'environment';
  dataType: 'string' | 'number' | 'boolean' | 'date';
  isRequired: boolean;
  isMultiValue: boolean;
  defaultValue?: any;
  constraints: {
    enumValues?: any[];
    minValue?: number;
    maxValue?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  validation: any;
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    isSystem: boolean;
    isCustom: boolean;
    version: string;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const steps = [
  'Basic Information',
  'Subject Selection',
  'Actions & Resources',
  'Review & Create'
];

export default function CreatePolicyPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);

  // Form data
  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [description, setDescription] = useState('');

  // Selection data
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Attribute[]>([]);
  const [selectedSubjectAttributes, setSelectedSubjectAttributes] = useState<{ [key: string]: any }>({});

  // Dropdown data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [actions, setActions] = useState<ActionObject[]>([]);
  const [resources, setResources] = useState<ResourceObject[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loadingDropdownData, setLoadingDropdownData] = useState(false);

  // Create attribute modal states (original modal)
  const [open, setOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<any | null>(null);
  const [attributeDisplayName, setAttributeDisplayName] = useState('');
  const [attributeDisplayNameError, setAttributeDisplayNameError] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDataType, setSelectedDataType] = useState('');
  const [permittedValues, setPermittedValues] = useState('');
  const [parsedValues, setParsedValues] = useState<any[]>([]);
  const [booleanValues, setBooleanValues] = useState<string[]>([]);
  const [numberValues, setNumberValues] = useState<string[]>([]);
  const [stringValues, setStringValues] = useState<string[]>([]);
  const [dateValues, setDateValues] = useState<string[]>([]);
  const [dateInputType, setDateInputType] = useState<'single' | 'range' | 'period'>('single');
  const [attributeDescription, setAttributeDescription] = useState('');
  const [isAttributeUsedInPolicies, setIsAttributeUsedInPolicies] = useState(false);
  const [existingValues, setExistingValues] = useState<any[]>([]);
  
  // Create value modal (keep existing)
  const [showCreateValue, setShowCreateValue] = useState<string | null>(null);
  const [newValueData, setNewValueData] = useState('');

  // Fetch dropdown data
  const fetchDropdownData = useCallback(async () => {
    try {
      setLoadingDropdownData(true);
      const [subjectsResponse, actionsResponse, resourcesResponse, attributesResponse] = await Promise.all([
        apiClient.get('/subjects', { page: 1, limit: 1000 }),
        apiClient.get('/actions', { page: 1, limit: 1000 }),
        apiClient.get('/resources', { page: 1, limit: 1000 }),
        apiClient.get('/attributes', { page: 1, limit: 1000 })
      ]);

      if (subjectsResponse.success && subjectsResponse.data) {
        setSubjects(Array.isArray(subjectsResponse.data) ? subjectsResponse.data : []);
      }
      if (actionsResponse.success && actionsResponse.data) {
        setActions(Array.isArray(actionsResponse.data) ? actionsResponse.data : []);
      }
      if (resourcesResponse.success && resourcesResponse.data) {
        setResources(Array.isArray(resourcesResponse.data) ? resourcesResponse.data : []);
      }
      if (attributesResponse.success && attributesResponse.data) {
        setAttributes(Array.isArray(attributesResponse.data) ? attributesResponse.data : []);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    } finally {
      setLoadingDropdownData(false);
    }
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  // Form validation
  const isStepValid = useCallback((step: number) => {
    switch (step) {
      case 0:
        const isValid = displayName.trim() !== '' && displayName.length >= 3 && displayName.length <= 100;
        return isValid;
      case 1:
        return selectedSubject !== '';
      case 2:
        return selectedActions.length > 0 && selectedResources.length > 0;
      default:
        return true;
    }
  }, [displayName, selectedSubject, selectedActions, selectedResources]);

  // Validation for display name
  useEffect(() => {
    if (displayName.trim() === '') {
      setDisplayNameError('');  // Don't show error for empty field initially
    } else if (displayName.length < 3) {
      setDisplayNameError('Policy name must be at least 3 characters');
    } else if (displayName.length > 100) {
      setDisplayNameError('Policy name cannot exceed 100 characters');
    } else {
      setDisplayNameError('');
    }
  }, [displayName]);

  // Update current step validation when dependencies change
  useEffect(() => {
    setIsCurrentStepValid(isStepValid(activeStep));
  }, [activeStep, isStepValid]);

  // Handle subject attribute selection changes
  const handleSubjectAttributeSelection = (attributeId: string, value: any) => {
    setSelectedSubjectAttributes(prev => ({
      ...prev,
      [attributeId]: value
    }));
  };

  // Handle attribute dropdown selection
  const handleAttributeSelection = (event: any, newValue: Attribute[]) => {
    setSelectedAttributes(newValue);
    // Reset values for removed attributes
    const removedAttributes = selectedAttributes.filter(
      oldAttr => !newValue.find(newAttr => newAttr.id === oldAttr.id)
    );
    removedAttributes.forEach(attr => {
      setSelectedSubjectAttributes(prev => {
        const updated = { ...prev };
        delete updated[attr.id];
        return updated;
      });
    });
  };

  // Remove attribute from selection
  const handleRemoveAttribute = (attributeId: string) => {
    setSelectedAttributes(prev => prev.filter(attr => attr.id !== attributeId));
    setSelectedSubjectAttributes(prev => {
      const updated = { ...prev };
      delete updated[attributeId];
      return updated;
    });
  };

  // Create new attribute
  // Helper functions for original modal
  const canOnlyAddValues = () => {
    return isAttributeUsedInPolicies && (selectedDataType === 'array' || selectedDataType === 'object');
  };
  
  const isFieldDisabled = () => {
    return isAttributeUsedInPolicies && selectedDataType !== 'array' && selectedDataType !== 'object';
  };

  // Original modal functions
  const handleClickOpen = async () => {
    setSelectedAttribute(null);
    setAttributeDisplayName('');
    setAttributeDisplayNameError('');
    setSelectedCategories([]);
    setSelectedDataType('');
    setAttributeDescription('');
    setPermittedValues('');
    setParsedValues([]);
    setBooleanValues([]);
    setNumberValues([]);
    setStringValues([]);
    setDateValues([]);
    setDateInputType('single');
    setExistingValues([]);
    setIsAttributeUsedInPolicies(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAttribute(null);
    setAttributeDisplayName('');
    setAttributeDisplayNameError('');
    setSelectedCategories([]);
    setSelectedDataType('');
    setAttributeDescription('');
    setPermittedValues('');
    setParsedValues([]);
    setBooleanValues([]);
    setNumberValues([]);
    setStringValues([]);
    setDateValues([]);
    setDateInputType('single');
    setExistingValues([]);
    setIsAttributeUsedInPolicies(false);
  };

  const validateAttributeDisplayName = (value: string) => {
    if (!value) {
      return 'Display name is required';
    }
    if (value.includes(' ')) {
      return 'Display name cannot contain spaces';
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
      return 'Display name must start with a letter and contain only letters, numbers, and underscores';
    }
    return '';
  };

  const handleAttributeDisplayNameChange = (value: string) => {
    setAttributeDisplayName(value);
    setAttributeDisplayNameError(validateAttributeDisplayName(value));
  };

  const handleDataTypeChange = (dataType: string) => {
    setSelectedDataType(dataType);
    setPermittedValues('');
    setParsedValues([]);
    setBooleanValues([]);
    setNumberValues([]);
    setStringValues([]);
    setDateValues([]);
    setDateInputType('single');
  };

  const handleBooleanValuesChange = (values: string[]) => {
    setBooleanValues(values);
    const boolValues = values.map(v => v === 'true');
    setParsedValues(boolValues);
    setPermittedValues(values.join(', '));
  };

  const handleStringValuesAdd = (value: string) => {
    if (value.trim() && !stringValues.includes(value.trim())) {
      const newValues = [...stringValues, value.trim()];
      setStringValues(newValues);
      setParsedValues(newValues);
      setPermittedValues(newValues.join(', '));
    }
  };

  const handleStringValuesRemove = (index: number) => {
    const newValues = stringValues.filter((_, i) => i !== index);
    setStringValues(newValues);
    setParsedValues(newValues);
    setPermittedValues(newValues.join(', '));
  };

  const handleNumberValuesAdd = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && !numberValues.includes(value.trim())) {
      const newValues = [...numberValues, value.trim()];
      setNumberValues(newValues);
      setParsedValues(newValues.map(v => parseFloat(v)));
      setPermittedValues(newValues.join(', '));
    }
  };

  const handleNumberValuesRemove = (index: number) => {
    const newValues = numberValues.filter((_, i) => i !== index);
    setNumberValues(newValues);
    setParsedValues(newValues.map(v => parseFloat(v)));
    setPermittedValues(newValues.join(', '));
  };

  const handleAttributeSubmit = async () => {
    if (!attributeDisplayName || attributeDisplayNameError) return;

    try {
      setIsSubmitting(true);
      
      const apiData = {
        id: attributeDisplayName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_'),
        name: attributeDisplayName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_'),
        displayName: attributeDisplayName,
        description: attributeDescription,
        category: selectedCategories[0] || 'subject',
        dataType: selectedDataType,
        isRequired: false,
        isMultiValue: false,
        constraints: {
          enumValues: parsedValues.length > 0 ? parsedValues : (
            selectedDataType === 'string' ? stringValues.filter(v => v.trim() !== '') :
            selectedDataType === 'number' ? numberValues.map(v => parseFloat(v)).filter(v => !isNaN(v)) :
            selectedDataType === 'boolean' ? booleanValues.map(v => v === 'true') :
            []
          )
        },
        validation: {},
        metadata: {
          createdBy: 'user',
          lastModifiedBy: 'user',
          tags: ['custom'],
          isSystem: false,
          isCustom: true,
          version: '1.0.0'
        },
        active: true
      };

      const response = await apiClient.post('/attributes', apiData);
      if (response.success) {
        await fetchDropdownData();
        handleClose();
      }
    } catch (error) {
      console.error('Error creating attribute:', error);
      setError('Failed to create attribute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create new value for an attribute
  const handleCreateValue = async (attributeId: string) => {
    try {
      const attribute = attributes.find(attr => attr.id === attributeId);
      if (!attribute) return;

      const updatedEnumValues = [...(attribute.constraints.enumValues || []), newValueData];
      
      const updatedAttribute = {
        ...attribute,
        constraints: {
          ...attribute.constraints,
          enumValues: updatedEnumValues
        }
      };

      const response = await apiClient.put(`/attributes/${attributeId}`, updatedAttribute);
      if (response.success) {
        await fetchDropdownData();
        setShowCreateValue(null);
        setNewValueData('');
      }
    } catch (error) {
      console.error('Error creating value:', error);
      setError('Failed to create value. Please try again.');
    }
  };

  // Navigation functions
  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prevStep => prevStep - 1);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!isStepValid(0) || !isStepValid(1) || !isStepValid(2)) {
      setError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const rules = selectedActions.flatMap((actionId, actionIndex) =>
        selectedResources.map((resourceId, resourceIndex) => {
          const ruleIndex = actionIndex * selectedResources.length + resourceIndex;
          
          // Build subject attributes for rule
          const subjectAttributes = Object.entries(selectedSubjectAttributes)
            .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
            .map(([attrId, value]) => {
              const attribute = attributes.find(attr => attr.id === attrId);
              if (!attribute) return null;
              
              return {
                name: attribute.name,
                operator: Array.isArray(value) ? 'in' : 'equals',
                value: value
              };
            })
            .filter(Boolean);

          const action = actions.find(a => a.id === actionId);
          const resource = resources.find(r => r.id === resourceId);
          const subject = subjects.find(s => s.id === selectedSubject);

          return {
            id: `rule-${Date.now()}-${ruleIndex}`,
            subject: {
              type: selectedSubject,
              attributes: subjectAttributes
            },
            action: {
              name: actionId,
              displayName: action?.displayName || actionId
            },
            object: {
              type: resourceId,
              attributes: []
            },
            conditions: []
          };
        })
      );

      const policyData = {
        name: displayName.trim(),
        description: description?.trim() || '',
        effect: 'Allow' as const,
        status: 'Draft' as const,
        rules,
        subjects: [selectedSubject],
        resources: selectedResources,
        actions: selectedActions,
        conditions: []
      };

      const response = await apiClient.post('/policies', policyData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/policies');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Failed to create policy:', error);
      setError('Failed to create policy. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Card sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                Basic Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Provide basic details about your access control policy
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Policy Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  error={!!displayNameError}
                  helperText={displayNameError || "Enter a descriptive name for this policy (minimum 3 characters)"}
                  placeholder="e.g., Finance Team Document Access"
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <SecurityIcon sx={{ 
                          color: displayName.trim() && isStepValid(0) ? 'success.main' : 'text.secondary', 
                          fontSize: 20 
                        }} />
                      </Box>
                    )
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={3}
                  placeholder="Optional: Describe the purpose and scope of this policy"
                  helperText="Help others understand when and why this policy should be applied"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'flex-start', pt: 1 }}>
                        <DescriptionIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </Box>
                    )
                  }}
                />
              </Grid>
            </Grid>
          </Card>
        );

      case 1:
        return (
          <Card sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                Subject Selection
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose who this policy applies to and configure their attributes
              </Typography>
            </Box>

            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <FormControl fullWidth required>
                      <InputLabel>Select Subject</InputLabel>
                      <Select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        label="Select Subject"
                        disabled={loadingDropdownData}
                        sx={{ bgcolor: 'white' }}
                      >
                        {subjects.map((subject) => (
                          <MenuItem key={subject.id} value={subject.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', py: 0.5 }}>
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  bgcolor: subject.type === 'user' ? 'primary.main' : 
                                           subject.type === 'group' ? 'secondary.main' : 'warning.main',
                                  fontSize: '15px',
                                  fontWeight: 600
                                }}
                              >
                                {subject.displayName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" fontWeight="600">
                                  {subject.displayName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {subject.email}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {subject.type} • {subject.department}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 7 }}>
                    {selectedSubject ? (
                      <Box>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                              Attribute Conditions
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              (Optional)
                            </Typography>
                          </Box>
                          <Button 
                            size="small" 
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              console.log('Policy Creation - Add Attribute clicked');
                              handleClickOpen();
                            }}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            Add Attribute
                          </Button>
                        </Box>

                        {/* Attribute Selection Dropdown */}
                        <Box sx={{ mb: 3 }}>
                          <Autocomplete
                            multiple
                            options={attributes?.filter(attr => attr.category === 'subject' && attr.active) || []}
                            value={selectedAttributes}
                            onChange={handleAttributeSelection}
                            getOptionLabel={(option) => option.displayName}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select Attributes"
                                placeholder="Choose attributes to configure conditions"
                                variant="outlined"
                                size="small"
                                InputLabelProps={{}}
                              />
                            )}
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => {
                                const { key, ...tagProps } = getTagProps({ index });
                                return (
                                  <Chip
                                    key={key}
                                    {...tagProps}
                                    variant="filled"
                                    color="primary"
                                    size="small"
                                    label={option.displayName}
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                );
                              })
                            }
                            renderOption={(props, option) => {
                              const { key, ...otherProps } = props;
                              return (
                                <Box component="li" key={key} {...otherProps} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5, width: '100%' }}>
                                    <Box sx={{ 
                                      width: 6, 
                                      height: 6, 
                                      borderRadius: '50%', 
                                      bgcolor: option.isRequired ? 'error.main' : 'success.main',
                                      flexShrink: 0
                                    }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="body2" fontWeight="500" noWrap>
                                        {option.displayName}
                                        {option.isRequired && (
                                          <Chip 
                                            label="Required" 
                                            size="small" 
                                            color="error"
                                            sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
                                          />
                                        )}
                                      </Typography>
                                      {option.description && (
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                          {option.description}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                              );
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: 'white'
                              }
                            }}
                          />
                        </Box>

                        {/* Selected Attributes Configuration */}
                        {selectedAttributes.length > 0 && (
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Configure conditions for selected attributes ({selectedAttributes.length}):
                            </Typography>
                            <Grid container spacing={2}>
                              {selectedAttributes.map((attribute) => {
                                const isArrayOrObject = (attribute.dataType as string) === 'object' || 
                                  (attribute.dataType as string) === 'array' ||
                                  (attribute.dataType === 'string' && attribute.constraints.enumValues && 
                                   Array.isArray(attribute.constraints.enumValues) && attribute.isMultiValue);
                                
                                return (
                                  <Grid key={attribute.id} size={{ xs: 12, md: 6 }}>
                                    <Card 
                                      variant="outlined"
                                      sx={{ 
                                        p: 2,
                                        bgcolor: 'white',
                                        border: '1px solid',
                                        borderColor: 'grey.200',
                                        '&:hover': {
                                          borderColor: 'primary.main',
                                          boxShadow: 1
                                        }
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Box sx={{ 
                                            width: 6, 
                                            height: 6, 
                                            borderRadius: '50%', 
                                            bgcolor: attribute.isRequired ? 'error.main' : 'success.main' 
                                          }} />
                                          <Typography variant="body2" fontWeight="600" color="text.primary">
                                            {attribute.displayName}
                                          </Typography>
                                          {attribute.isRequired && (
                                            <Chip 
                                              label="Required" 
                                              size="small" 
                                              color="error"
                                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                                            />
                                          )}
                                        </Box>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleRemoveAttribute(attribute.id)}
                                          sx={{ 
                                            color: 'text.secondary',
                                            '&:hover': {
                                              color: 'error.main',
                                              bgcolor: 'error.50'
                                            }
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                      
                                      {attribute.description && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontStyle: 'italic' }}>
                                          {attribute.description}
                                        </Typography>
                                      )}
                                  
                                      {((attribute.dataType === 'string' || (attribute.dataType as string) === 'array') && attribute.constraints.enumValues) ? (
                                        isArrayOrObject ? (
                                          <Autocomplete
                                            multiple
                                            freeSolo
                                            options={attribute.constraints.enumValues || []}
                                            value={selectedSubjectAttributes[attribute.id] ?? []}
                                            onChange={(event, newValue) => {
                                              handleSubjectAttributeSelection(attribute.id, newValue);
                                            }}
                                            renderInput={(params) => (
                                              <TextField
                                                {...params}
                                                size="small"
                                                label={`${attribute.displayName} Values`}
                                                placeholder="Select existing or type new values"
                                                helperText="Type to add new values, or select from existing ones"
                                                InputLabelProps={{}}
                                                sx={{ 
                                                  bgcolor: 'grey.50',
                                                  '& .MuiFormHelperText-root': {
                                                    fontSize: '0.65rem',
                                                    mt: 0.5
                                                  }
                                                }}
                                              />
                                            )}
                                            renderTags={(value, getTagProps) =>
                                              value.map((option, index) => {
                                                const { key, ...tagProps } = getTagProps({ index });
                                                return (
                                                  <Chip
                                                    key={key}
                                                    {...tagProps}
                                                    variant="filled"
                                                    color="primary"
                                                    size="small"
                                                    label={option}
                                                    sx={{ fontSize: '0.7rem', height: 22 }}
                                                  />
                                                );
                                              })
                                            }
                                            renderOption={(props, option) => {
                                              const { key, ...otherProps } = props;
                                              return (
                                                <Box component="li" key={key} {...otherProps}>
                                                  <Chip 
                                                    label={option} 
                                                    size="small" 
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.7rem' }}
                                                  />
                                                </Box>
                                              );
                                            }}
                                            sx={{
                                              '& .MuiOutlinedInput-root': {
                                                bgcolor: 'grey.50'
                                              }
                                            }}
                                          />
                                        ) : (
                                          <FormControl fullWidth size="small">
                                            <Select
                                              value={selectedSubjectAttributes[attribute.id] || ''}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '__add_new_value__') {
                                                  setShowCreateValue(attribute.id);
                                                } else {
                                                  handleSubjectAttributeSelection(attribute.id, value);
                                                }
                                              }}
                                              displayEmpty
                                              sx={{ bgcolor: 'grey.50' }}
                                            >
                                              {!attribute.isRequired && (
                                                <MenuItem value="">
                                                  <em>Not specified</em>
                                                </MenuItem>
                                              )}
                                              {attribute.constraints.enumValues.map((value: any) => (
                                                <MenuItem key={value} value={value}>
                                                  {value}
                                                </MenuItem>
                                              ))}
                                              <MenuItem 
                                                value="__add_new_value__"
                                                sx={{
                                                  bgcolor: 'primary.50',
                                                  borderTop: '1px solid',
                                                  borderColor: 'grey.200',
                                                  '&:hover': {
                                                    bgcolor: 'primary.100'
                                                  }
                                                }}
                                              >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                                                  <AddIcon fontSize="small" />
                                                  <Typography variant="caption" color="primary.main" fontWeight="600">
                                                    Add new value
                                                  </Typography>
                                                </Box>
                                              </MenuItem>
                                            </Select>
                                          </FormControl>
                                        )
                                      ) : attribute.dataType === 'boolean' ? (
                                        <FormControl fullWidth>
                                          <FormControlLabel
                                            control={
                                              <Switch 
                                                checked={selectedSubjectAttributes[attribute.id] || false}
                                                onChange={(e) => handleSubjectAttributeSelection(attribute.id, e.target.checked)}
                                                size="small"
                                              />
                                            }
                                            label=""
                                            sx={{ m: 0 }}
                                          />
                                        </FormControl>
                                      ) : attribute.dataType === 'number' ? (
                                        <TextField
                                          fullWidth
                                          type="number"
                                          value={selectedSubjectAttributes[attribute.id] || ''}
                                          onChange={(e) => handleSubjectAttributeSelection(attribute.id, Number(e.target.value))}
                                          size="small"
                                          placeholder="Enter number"
                                          inputProps={{
                                            min: attribute.constraints.minValue,
                                            max: attribute.constraints.maxValue
                                          }}
                                          sx={{ bgcolor: 'grey.50' }}
                                        />
                                      ) : (
                                        <TextField
                                          fullWidth
                                          value={selectedSubjectAttributes[attribute.id] || ''}
                                          onChange={(e) => handleSubjectAttributeSelection(attribute.id, e.target.value)}
                                          size="small"
                                          multiline={attribute.isMultiValue}
                                          rows={attribute.isMultiValue ? 2 : 1}
                                          placeholder={`Enter ${attribute.displayName.toLowerCase()}`}
                                          sx={{ bgcolor: 'grey.50' }}
                                        />
                                      )}
                                    </Card>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </Box>
                        )}

                        {/* Empty State */}
                        {selectedAttributes.length === 0 && (
                          <Box sx={{
                            p: 3,
                            border: '2px dashed',
                            borderColor: 'grey.300',
                            borderRadius: 2,
                            textAlign: 'center',
                            bgcolor: 'grey.50'
                          }}>
                            <AttributeIcon sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary" fontWeight="500" sx={{ mb: 0.5 }}>
                              No attributes selected
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Use the dropdown above to select attributes for this policy
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{
                        p: 4,
                        border: '2px dashed',
                        borderColor: 'grey.300',
                        borderRadius: 2,
                        textAlign: 'center',
                        bgcolor: 'grey.50'
                      }}>
                        <PersonIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary" fontWeight="500" sx={{ mb: 1 }}>
                          Subject Selection Required
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Choose a subject from the dropdown to configure attribute conditions
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Paper>
          </Card>
        );

      case 2:
        return (
          <Card sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                Actions & Resources
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Define what actions can be performed on which resources
              </Typography>
            </Box>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ActionIcon color="primary" />
                  Actions
                </Typography>
                <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                  {actions.map((action) => (
                    <Box key={action.id} sx={{ mb: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={selectedActions.includes(action.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedActions(prev => [...prev, action.id]);
                              } else {
                                setSelectedActions(prev => prev.filter(id => id !== action.id));
                              }
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="500">
                              {action.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {action.description}
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>
                  ))}
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ResourceIcon color="primary" />
                  Resources
                </Typography>
                <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                  {resources.map((resource) => (
                    <Box key={resource.id} sx={{ mb: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={selectedResources.includes(resource.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedResources(prev => [...prev, resource.id]);
                              } else {
                                setSelectedResources(prev => prev.filter(id => id !== resource.id));
                              }
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="500">
                              {resource.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {resource.description || resource.uri}
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>
          </Card>
        );

      case 3:
        return (
          <Card sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                Review & Create
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review your policy configuration before creating
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                {/* Human-Readable Policy Statement */}
                <Card sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <Box sx={{ 
                    p: 4,
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <Typography component="div" variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                      This policy <strong style={{ color: '#2e7d32' }}>
                        ALLOWS
                      </strong>{' '}
                      <strong style={{ color: '#1976d2' }}>
                        {subjects.find(s => s.id === selectedSubject)?.displayName}
                      </strong>
                      {Object.keys(selectedSubjectAttributes).length > 0 && (
                        <span>
                          {' '}(when{' '}
                          {Object.entries(selectedSubjectAttributes)
                            .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
                            .map(([attrId, value], index, array) => {
                              const attr = attributes.find(a => a.id === attrId);
                              if (!attr) return '';
                              const formattedValue = Array.isArray(value) ? value.join(' or ') : value;
                              const condition = `${attr.displayName.toLowerCase()} is ${formattedValue}`;
                              if (index === array.length - 1 && array.length > 1) {
                                return `and ${condition}`;
                              }
                              return condition;
                            })
                            .filter(Boolean)
                            .join(', ')}
                          )
                        </span>
                      )}
                      {' '}to perform{' '}
                      <strong style={{ color: '#f57c00' }}>
                        {selectedActions.length === 1 
                          ? actions.find(a => a.id === selectedActions[0])?.displayName?.toLowerCase()
                          : selectedActions.length === 2
                            ? `${actions.find(a => a.id === selectedActions[0])?.displayName?.toLowerCase()} and ${actions.find(a => a.id === selectedActions[1])?.displayName?.toLowerCase()}`
                            : `${selectedActions.slice(0, -1).map(id => actions.find(a => a.id === id)?.displayName?.toLowerCase()).join(', ')}, and ${actions.find(a => a.id === selectedActions[selectedActions.length - 1])?.displayName?.toLowerCase()}`
                        }
                      </strong>
                      {' '}actions on{' '}
                      <strong style={{ color: '#7b1fa2' }}>
                        {selectedResources.length === 1
                          ? resources.find(r => r.id === selectedResources[0])?.displayName
                          : selectedResources.length === 2
                            ? `${resources.find(r => r.id === selectedResources[0])?.displayName} and ${resources.find(r => r.id === selectedResources[1])?.displayName}`
                            : `${selectedResources.slice(0, -1).map(id => resources.find(r => r.id === id)?.displayName).join(', ')}, and ${resources.find(r => r.id === selectedResources[selectedResources.length - 1])?.displayName}`
                        }
                      </strong>.
                    </Typography>
                  </Box>
                </Card>

                {/* Technical Details */}
                <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
                    Technical Details
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" />
                          Subject
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {subjects.find(s => s.id === selectedSubject)?.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {subjects.find(s => s.id === selectedSubject)?.type} • {subjects.find(s => s.id === selectedSubject)?.department}
                        </Typography>
                        {Object.keys(selectedSubjectAttributes).length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Conditions:
                            </Typography>
                            {Object.entries(selectedSubjectAttributes)
                              .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
                              .map(([attrId, value]) => {
                                const attr = attributes.find(a => a.id === attrId);
                                return attr ? (
                                  <Chip 
                                    key={attrId}
                                    label={`${attr.displayName}: ${Array.isArray(value) ? value.join(', ') : value}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 0.5, mt: 0.5, fontSize: '0.65rem' }}
                                  />
                                ) : null;
                              })}
                          </Box>
                        )}
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ActionIcon fontSize="small" />
                          Actions ({selectedActions.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedActions.map(actionId => {
                            const action = actions.find(a => a.id === actionId);
                            return action ? (
                              <Chip 
                                key={actionId} 
                                label={action.displayName} 
                                size="small" 
                                color="warning"
                                variant="filled"
                              />
                            ) : null;
                          })}
                        </Box>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ResourceIcon fontSize="small" />
                          Resources ({selectedResources.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedResources.map(resourceId => {
                            const resource = resources.find(r => r.id === resourceId);
                            return resource ? (
                              <Chip 
                                key={resourceId} 
                                label={resource.displayName} 
                                size="small" 
                                color="secondary"
                                variant="filled"
                              />
                            ) : null;
                          })}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Policy created successfully! Redirecting to policies list...
              </Alert>
            )}
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
              onClick={() => router.push('/policies')}
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              Policies
            </Link>
            <Typography color="text.primary">Create New Policy</Typography>
          </Breadcrumbs>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                onClick={() => router.push('/policies')}
                sx={{ 
                  bgcolor: 'grey.100',
                  '&:hover': { bgcolor: 'grey.200' }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <SecurityIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Box>
                <Typography variant="h5" component="h1" fontWeight="600">
                  Create New Policy
                </Typography>
              </Box>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Define access control rules for your organization
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

        {/* Step Content */}
        <Box sx={{ mb: 3 }}>
          {renderStepContent(activeStep)}
        </Box>

        {/* Navigation Buttons */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/policies')}
              >
                Cancel
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isCurrentStepValid}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckIcon />}
                >
                  {isSubmitting ? 'Creating...' : 'Create Policy'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isCurrentStepValid}
                  endIcon={<NavigateNextIcon />}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Create Attribute Dialog (Original Modal) */}
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttributeIcon color="primary" />
              <Typography variant="h6" fontWeight="600" color="text.primary">
                New Attribute
              </Typography>
            </Box>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: 'grey.500',
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 3, pt: 2, pb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <TextField
                fullWidth
                label="Display Name"
                value={attributeDisplayName}
                onChange={(e) => handleAttributeDisplayNameChange(e.target.value)}
                variant="outlined"
                placeholder="e.g., department"
                error={!!attributeDisplayNameError}
                helperText={attributeDisplayNameError || 'No spaces allowed, use camelCase or snake_case'}
              />

              <TextField
                fullWidth
                label="Description"
                value={attributeDescription}
                onChange={(e) => setAttributeDescription(e.target.value)}
                variant="outlined"
                placeholder="Brief description of the attribute"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    multiple
                    value={selectedCategories}
                    onChange={(e) => setSelectedCategories(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                    label="Category"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="subject">
                      <Checkbox checked={selectedCategories.indexOf('subject') > -1} />
                      <Typography>Subject</Typography>
                    </MenuItem>
                    <MenuItem value="resource">
                      <Checkbox checked={selectedCategories.indexOf('resource') > -1} />
                      <Typography>Resource</Typography>
                    </MenuItem>
                    <MenuItem value="action">
                      <Checkbox checked={selectedCategories.indexOf('action') > -1} />
                      <Typography>Action</Typography>
                    </MenuItem>
                    <MenuItem value="environment">
                      <Checkbox checked={selectedCategories.indexOf('environment') > -1} />
                      <Typography>Environment</Typography>
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Data Type</InputLabel>
                  <Select
                    value={selectedDataType}
                    onChange={(e) => handleDataTypeChange(e.target.value)}
                    label="Data Type"
                  >
                    <MenuItem value="string">String</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="boolean">Boolean</MenuItem>
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="array">Array</MenuItem>
                    <MenuItem value="object">Object</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {selectedDataType && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Permitted Values
                  </Typography>
                  
                  {/* String Values */}
                  {selectedDataType === 'string' && (
                    <Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Enter a string value"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              handleStringValuesAdd(target.value);
                              target.value = '';
                            }
                          }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                            if (input) {
                              handleStringValuesAdd(input.value);
                              input.value = '';
                            }
                          }}
                        >
                          Add
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: '32px' }}>
                        {stringValues.map((value, index) => (
                          <Chip
                            key={index}
                            label={value}
                            size="small"
                            color="primary"
                            onDelete={() => handleStringValuesRemove(index)}
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Press Enter or click Add to add values
                      </Typography>
                    </Box>
                  )}

                  {/* Boolean Values */}
                  {selectedDataType === 'boolean' && (
                    <FormControl fullWidth>
                      <InputLabel>Select Boolean Values</InputLabel>
                      <Select
                        multiple
                        value={booleanValues}
                        onChange={(e) => handleBooleanValuesChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                        label="Select Boolean Values"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" color="primary" />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="true">true</MenuItem>
                        <MenuItem value="false">false</MenuItem>
                      </Select>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        Select which boolean values are allowed
                      </Typography>
                    </FormControl>
                  )}

                  {/* Number Values */}
                  {selectedDataType === 'number' && (
                    <Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          placeholder="Enter a number value"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              handleNumberValuesAdd(target.value);
                              target.value = '';
                            }
                          }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                            if (input) {
                              handleNumberValuesAdd(input.value);
                              input.value = '';
                            }
                          }}
                        >
                          Add
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: '32px' }}>
                        {numberValues.map((value, index) => (
                          <Chip
                            key={index}
                            label={value}
                            size="small"
                            color="secondary"
                            onDelete={() => handleNumberValuesRemove(index)}
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Enter numeric values only
                      </Typography>
                    </Box>
                  )}

                  {/* Simplified input for other data types */}
                  {(selectedDataType === 'date' || selectedDataType === 'array' || selectedDataType === 'object') && (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={`Enter ${selectedDataType} values (comma-separated)`}
                      value={permittedValues}
                      onChange={(e) => setPermittedValues(e.target.value)}
                    />
                  )}
                </Box>
              )}
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
              disabled={isSubmitting}
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
              onClick={handleAttributeSubmit}
              variant="contained"
              disabled={!attributeDisplayName || !!attributeDisplayNameError || isSubmitting}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create Attribute'}
            </Button>
          </DialogActions>
        </Dialog>

    </DashboardLayout>
  );
}