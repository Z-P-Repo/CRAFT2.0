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
  const [selectedSubjectAttributes, setSelectedSubjectAttributes] = useState<{ [key: string]: any }>({});

  // Dropdown data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [actions, setActions] = useState<ActionObject[]>([]);
  const [resources, setResources] = useState<ResourceObject[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loadingDropdownData, setLoadingDropdownData] = useState(false);

  // Create attribute/value modals
  const [showCreateAttribute, setShowCreateAttribute] = useState(false);
  const [showCreateValue, setShowCreateValue] = useState<string | null>(null);
  const [newAttributeData, setNewAttributeData] = useState({
    name: '',
    displayName: '',
    description: '',
    dataType: 'string' as 'string' | 'number' | 'boolean' | 'date',
    isRequired: false,
    isMultiValue: false,
    enumValues: [] as string[]
  });
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

  // Create new attribute
  const handleCreateAttribute = async () => {
    try {
      const attributeData = {
        name: newAttributeData.name,
        displayName: newAttributeData.displayName,
        description: newAttributeData.description,
        category: 'subject',
        dataType: newAttributeData.dataType,
        isRequired: newAttributeData.isRequired,
        isMultiValue: newAttributeData.isMultiValue,
        constraints: {
          enumValues: newAttributeData.enumValues.length > 0 ? newAttributeData.enumValues : undefined
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

      const response = await apiClient.post('/attributes', attributeData);
      if (response.success) {
        await fetchDropdownData();
        setShowCreateAttribute(false);
        setNewAttributeData({
          name: '',
          displayName: '',
          description: '',
          dataType: 'string',
          isRequired: false,
          isMultiValue: false,
          enumValues: []
        });
      }
    } catch (error) {
      console.error('Error creating attribute:', error);
      setError('Failed to create attribute. Please try again.');
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
        priority: 100,
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

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                Subject Selection
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose the subject (user, group, or role) this policy applies to
              </Typography>
              
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
                            onClick={() => setShowCreateAttribute(true)}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            Add Attribute
                          </Button>
                        </Box>

                        <Box sx={{ 
                          maxHeight: 280, 
                          overflow: 'auto', 
                          border: '1px solid', 
                          borderColor: 'grey.300', 
                          borderRadius: 1,
                          bgcolor: 'grey.50',
                          p: 2
                        }}>
                          <Grid container spacing={2}>
                            {attributes
                              ?.filter(attr => attr.category === 'subject' && attr.active)
                              .map((attribute) => {
                                const isArrayOrObject = attribute.dataType === 'object' || 
                                  (attribute.dataType === 'string' && attribute.constraints.enumValues && 
                                   Array.isArray(attribute.constraints.enumValues) && attribute.isMultiValue);
                                
                                return (
                                  <Grid key={attribute.id} size={{ xs: 12, sm: 6 }}>
                                    <Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                        <Typography variant="body2" fontWeight="600" color="text.primary">
                                          {attribute.displayName}
                                        </Typography>
                                        {attribute.isRequired && (
                                          <Typography variant="caption" color="error">
                                            *
                                          </Typography>
                                        )}
                                      </Box>
                                  
                                  {attribute.dataType === 'string' && attribute.constraints.enumValues ? (
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={isArrayOrObject
                                          ? (selectedSubjectAttributes[attribute.id] || []) 
                                          : (selectedSubjectAttributes[attribute.id] || '')
                                        }
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (isArrayOrObject && Array.isArray(value)) {
                                            if (value.includes('__add_new_value__')) {
                                              const filteredValue = value.filter(v => v !== '__add_new_value__');
                                              handleSubjectAttributeSelection(attribute.id, filteredValue);
                                              setShowCreateValue(attribute.id);
                                            } else {
                                              handleSubjectAttributeSelection(attribute.id, value);
                                            }
                                          } else if (!isArrayOrObject && value === '__add_new_value__') {
                                            setShowCreateValue(attribute.id);
                                          } else {
                                            handleSubjectAttributeSelection(attribute.id, value);
                                          }
                                        }}
                                        displayEmpty
                                        multiple={isArrayOrObject}
                                        renderValue={(selected) => {
                                          if (isArrayOrObject && Array.isArray(selected)) {
                                            return selected.length === 0 ? 
                                              <em style={{ color: '#999' }}>Select values</em> : 
                                              selected.join(', ');
                                          }
                                          return selected || <em style={{ color: '#999' }}>Select value</em>;
                                        }}
                                        sx={{ bgcolor: 'white' }}
                                      >
                                        {!attribute.isRequired && !isArrayOrObject && (
                                          <MenuItem value="">
                                            <em>Not specified</em>
                                          </MenuItem>
                                        )}
                                        {attribute.constraints.enumValues.map((value: any) => (
                                          <MenuItem key={value} value={value}>
                                            {isArrayOrObject ? (
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip 
                                                  label={value} 
                                                  size="small" 
                                                  variant={selectedSubjectAttributes[attribute.id]?.includes?.(value) ? "filled" : "outlined"}
                                                  color="primary"
                                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                                />
                                              </Box>
                                            ) : (
                                              value
                                            )}
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
                                      sx={{ bgcolor: 'white' }}
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
                                      sx={{ bgcolor: 'white' }}
                                    />
                                  )}
                                </Box>
                              </Grid>
                            );
                          })}
                        
                            {(attributes?.filter(attr => attr.category === 'subject' && attr.active).length || 0) === 0 && (
                              <Grid size={{ xs: 12 }}>
                                <Box sx={{ 
                                  textAlign: 'center', 
                                  py: 3,
                                  border: '1px dashed',
                                  borderColor: 'grey.300',
                                  borderRadius: 1,
                                  bgcolor: 'white'
                                }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    No subject attributes available
                                  </Typography>
                                  <Button 
                                    size="small" 
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={() => setShowCreateAttribute(true)}
                                    sx={{ fontSize: '0.75rem' }}
                                  >
                                    Create First Attribute
                                  </Button>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
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
            </Box>
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
                <Paper sx={{ p: 4, bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.200', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <SecurityIcon sx={{ color: 'primary.main', fontSize: 28, mt: 0.5 }} />
                    <Box>
                      <Typography variant="h6" color="primary.main" fontWeight="700" gutterBottom>
                        "{displayName}" Policy
                      </Typography>
                      {description && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                          {description}
                        </Typography>
                      )}
                      
                      {/* Main Policy Statement */}
                      <Box sx={{ 
                        bgcolor: 'white', 
                        p: 3, 
                        borderRadius: 2, 
                        border: '1px solid', 
                        borderColor: 'primary.100',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                          This policy <strong style={{ color: '#2e7d32' }}>ALLOWS</strong>{' '}
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
                          <strong style={{ color: '#ed6c02' }}>
                            {selectedActions.length === 1 
                              ? actions.find(a => a.id === selectedActions[0])?.displayName?.toLowerCase()
                              : selectedActions.length === 2
                                ? `${actions.find(a => a.id === selectedActions[0])?.displayName?.toLowerCase()} and ${actions.find(a => a.id === selectedActions[1])?.displayName?.toLowerCase()}`
                                : `${selectedActions.slice(0, -1).map(id => actions.find(a => a.id === id)?.displayName?.toLowerCase()).join(', ')}, and ${actions.find(a => a.id === selectedActions[selectedActions.length - 1])?.displayName?.toLowerCase()}`
                            }
                          </strong>
                          {' '}actions on{' '}
                          <strong style={{ color: '#9c27b0' }}>
                            {selectedResources.length === 1
                              ? resources.find(r => r.id === selectedResources[0])?.displayName
                              : selectedResources.length === 2
                                ? `${resources.find(r => r.id === selectedResources[0])?.displayName} and ${resources.find(r => r.id === selectedResources[1])?.displayName}`
                                : `${selectedResources.slice(0, -1).map(id => resources.find(r => r.id === id)?.displayName).join(', ')}, and ${resources.find(r => r.id === selectedResources[selectedResources.length - 1])?.displayName}`
                            }
                          </strong>.
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>

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
    </DashboardLayout>
  );
}