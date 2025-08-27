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
  NavigateNext as NavigateNextIcon,
  Check as CheckIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Settings as AttributeIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';

interface Policy {
  _id: string;
  id: string;
  name: string;
  description?: string;
  effect: 'Allow' | 'Deny';
  status: 'Active' | 'Inactive' | 'Draft';
  rules: PolicyRule[];
  subjects: string[];
  resources: string[];
  actions: string[];
  conditions: PolicyCondition[];
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    version: string;
    isSystem: boolean;
    isCustom: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface PolicyRule {
  id: string;
  subject: {
    type: string;
    attributes: PolicyAttribute[];
  };
  action: {
    name: string;
    displayName: string;
  };
  object: {
    type: string;
    attributes: PolicyAttribute[];
  };
  conditions: PolicyCondition[];
}

interface PolicyAttribute {
  name: string;
  operator: 'equals' | 'contains' | 'in' | 'not_equals' | 'not_contains' | 'not_in';
  value: string | string[];
}

interface PolicyCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | string[];
}

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
  category?: 'subject' | 'resource' | 'action' | 'environment'; // Legacy field for compatibility
  categories?: string[]; // New field - array of categories
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
  'Review & Save'
];

// Helper function to check if an attribute belongs to a specific category
const attributeHasCategory = (attribute: Attribute, categoryToCheck: string): boolean => {
  // Check new categories array field first
  if (attribute.categories && Array.isArray(attribute.categories)) {
    return attribute.categories.includes(categoryToCheck);
  }
  // Fallback to legacy category field
  if (attribute.category) {
    return attribute.category === categoryToCheck;
  }
  return false;
};

export default function EditPolicyPage() {
  const router = useRouter();
  const params = useParams();
  const policyId = params.id as string;

  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);
  const [loading, setLoading] = useState(true);

  // Original policy data
  const [originalPolicy, setOriginalPolicy] = useState<Policy | null>(null);

  // Form data
  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [description, setDescription] = useState('');
  const [effect, setEffect] = useState<'Allow' | 'Deny'>('Allow');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Draft'>('Draft');

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

  // Load original policy
  useEffect(() => {
    if (!policyId) return;

    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/policies/${policyId}`);
        
        if (response.success && response.data) {
          const policy = response.data;
          setOriginalPolicy(policy);
          
          // Populate form fields
          setDisplayName(policy.name);
          setDescription(policy.description || '');
          setEffect(policy.effect);
          setStatus(policy.status);
          
          // Populate selections (simplified - taking first rule's data)
          if (policy.rules.length > 0) {
            const firstRule = policy.rules[0];
            setSelectedSubject(firstRule.subject.type);
          }
          
          setSelectedActions(policy.actions);
          setSelectedResources(policy.resources);
        } else {
          setError('Policy not found');
        }
      } catch (error: any) {
        console.error('Failed to fetch policy:', error);
        setError('Failed to load policy. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [policyId]);

  // Initialize attribute values when both policy and attributes are loaded
  useEffect(() => {
    if (originalPolicy && attributes.length > 0 && originalPolicy.rules.length > 0) {
      const firstRule = originalPolicy.rules[0];
      const subjectAttrs: { [key: string]: any } = {};
      
      firstRule?.subject?.attributes?.forEach((attr: any) => {
        // Try to find the attribute in the loaded attributes list to get the correct ID
        const attributeObj = attributes.find(a => a.name === attr.name || a.id === attr.name);
        if (attributeObj) {
          subjectAttrs[attributeObj.id] = attr.value;
        } else {
          // Fallback to using the name if no matching attribute found
          subjectAttrs[attr.name] = attr.value;
        }
      });
      
      setSelectedSubjectAttributes(subjectAttrs);
    }
  }, [originalPolicy, attributes]);

  // Initialize selectedAttributes when attributes and selectedSubjectAttributes are loaded
  useEffect(() => {
    if (attributes.length > 0 && Object.keys(selectedSubjectAttributes).length > 0) {
      const selectedAttrIds = Object.keys(selectedSubjectAttributes);
      const selectedAttrObjects = attributes.filter(attr => 
        selectedAttrIds.includes(attr.id) || selectedAttrIds.includes(attr.name)
      );
      setSelectedAttributes(selectedAttrObjects);
    }
  }, [attributes, selectedSubjectAttributes]);

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
  }, []); // Remove fetchDropdownData dependency - only run once on mount

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
      setDisplayNameError('');
    } else if (displayName.length < 3) {
      setDisplayNameError('Policy name must be at least 3 characters');
    } else if (displayName.length > 100) {
      setDisplayNameError('Policy name cannot exceed 100 characters');
    } else {
      setDisplayNameError('');
    }
  }, [displayName]);

  // Update current step validation
  useEffect(() => {
    setIsCurrentStepValid(isStepValid(activeStep));
  }, [activeStep, isStepValid]);

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

  // Subject attribute selection
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

  // Form submission
  const handleSubmit = async () => {
    if (!originalPolicy || !isStepValid(0) || !isStepValid(1) || !isStepValid(2)) {
      setError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build rules structure similar to create policy
      const rules = selectedActions.flatMap((actionId, actionIndex) =>
        selectedResources.map((resourceId, resourceIndex) => {
          const ruleIndex = actionIndex * selectedResources.length + resourceIndex;
          
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
        effect: effect,
        status: status,
        rules,
        subjects: [selectedSubject],
        resources: selectedResources,
        actions: selectedActions,
        conditions: []
      };

      const response = await apiClient.put(`/policies/${originalPolicy.id}`, policyData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/policies/${originalPolicy.id}`);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Failed to update policy:', error);
      setError('Failed to update policy. Please try again.');
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
                Update the basic details of your access control policy
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
                    {selectedSubject && (
                      <Box>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                              Attribute Conditions
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              (Optional)
                            </Typography>
                            <Chip 
                              label={`${attributes?.filter(attr => attributeHasCategory(attr, 'subject') && attr.active).length || 0} Available`}
                              size="small"
                              variant="outlined"
                              sx={{ ml: 2, fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                        </Box>

                        <Box sx={{ 
                          maxHeight: 400, 
                          overflow: 'auto', 
                          border: '1px solid', 
                          borderColor: 'grey.300', 
                          borderRadius: 1,
                          bgcolor: 'grey.50',
                          p: 2
                        }}>
                          {/* Search and Filter */}
                          <Box sx={{ mb: 2 }}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Search attributes..."
                              variant="outlined"
                              sx={{ bgcolor: 'white', mb: 1 }}
                              InputProps={{
                                startAdornment: (
                                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                    <AddIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                                  </Box>
                                )
                              }}
                            />
                          </Box>
                          <Grid container spacing={2}>
                            {attributes
                              ?.filter(attr => attributeHasCategory(attr, 'subject') && attr.active)
                              .sort((a, b) => {
                                // Sort by required first, then alphabetically
                                if (a.isRequired && !b.isRequired) return -1;
                                if (!a.isRequired && b.isRequired) return 1;
                                return a.displayName.localeCompare(b.displayName);
                              })
                              .map((attribute) => {
                                const isArrayOrObject = (attribute.dataType as string) === 'object' || 
                                  (attribute.dataType as string) === 'array' ||
                                  (attribute.dataType === 'string' && attribute.constraints.enumValues && 
                                   Array.isArray(attribute.constraints.enumValues) && attribute.isMultiValue);
                                
                                return (
                                  <Grid key={attribute.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <Box 
                                      sx={{ 
                                        p: 2, 
                                        border: '1px solid', 
                                        borderColor: 'grey.200',
                                        borderRadius: 1.5,
                                        bgcolor: 'white',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          borderColor: 'primary.main',
                                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        },
                                        ...(selectedSubjectAttributes[attribute.id] && {
                                          borderColor: 'primary.main',
                                          bgcolor: 'primary.50'
                                        })
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <Box sx={{ 
                                          width: 6, 
                                          height: 6, 
                                          borderRadius: '50%', 
                                          bgcolor: attribute.isRequired ? 'error.main' : 'success.main' 
                                        }} />
                                        <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ flex: 1 }}>
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
                                      
                                      {attribute.description && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                                          {attribute.description}
                                        </Typography>
                                      )}
                                  
                                  {((attribute.dataType === 'string' || (attribute.dataType as string) === 'array') && attribute.constraints.enumValues) ? (
                                    isArrayOrObject ? (
                                      <Autocomplete
                                        multiple
                                        freeSolo
                                        options={attribute.constraints.enumValues || []}
                                        value={selectedSubjectAttributes[attribute.id] || []}
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
                                            handleSubjectAttributeSelection(attribute.id, e.target.value);
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
                        
                            {(attributes?.filter(attr => attributeHasCategory(attr, 'subject') && attr.active).length || 0) === 0 && (
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
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      </Box>
                    )}
                    
                    {!selectedSubject && (
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
          <Card sx={{ mt: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'grey.200' }}>
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <SaveIcon color="primary" />
                Review & Save
              </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                {/* Human-Readable Policy Statement */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    mb: 3, 
                    p: 4,
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <SecurityIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                    <Typography variant="h6" fontWeight="600">
                      Policy Summary
                    </Typography>
                  </Box>
                  
                  <Typography 
                    component="div" 
                    variant="body1" 
                    sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}
                  >
                    This policy <strong style={{ color: effect === 'Allow' ? '#2e7d32' : '#d32f2f' }}>
                      {effect.toUpperCase()}S
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
                </Paper>

                {/* Policy Configuration */}
                <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'grey.200' }}>
                  <Box sx={{ p: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <SecurityIcon color="primary" />
                      Policy Configuration
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {/* Effect Section */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            borderRadius: 2,
                            bgcolor: 'grey.50',
                            border: '1px solid',
                            borderColor: 'grey.200',
                            height: '100%'
                          }}
                        >
                          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.75rem' }}>
                            Policy Effect
                          </Typography>
                          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Button
                              variant={effect === 'Allow' ? 'contained' : 'outlined'}
                              color={effect === 'Allow' ? 'success' : 'inherit'}
                              size="small"
                              onClick={() => setEffect('Allow')}
                              sx={{ 
                                textTransform: 'none',
                                fontWeight: effect === 'Allow' ? 600 : 400,
                                minWidth: '80px'
                              }}
                            >
                              <CheckIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                              Allow
                            </Button>
                            <Button
                              variant={effect === 'Deny' ? 'contained' : 'outlined'}
                              color={effect === 'Deny' ? 'error' : 'inherit'}
                              size="small"
                              onClick={() => setEffect('Deny')}
                              sx={{ 
                                textTransform: 'none',
                                fontWeight: effect === 'Deny' ? 600 : 400,
                                minWidth: '80px'
                              }}
                            >
                              <CloseIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                              Deny
                            </Button>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            {effect === 'Allow' ? 'This policy will grant access' : 'This policy will block access'}
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      {/* Status Section */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            borderRadius: 2,
                            bgcolor: 'grey.50',
                            border: '1px solid',
                            borderColor: 'grey.200',
                            height: '100%'
                          }}
                        >
                          <Typography variant="overline" sx={{ color: 'secondary.main', fontWeight: 600, fontSize: '0.75rem' }}>
                            Policy Status
                          </Typography>
                          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Button
                              variant={status === 'Active' ? 'contained' : 'outlined'}
                              color={status === 'Active' ? 'success' : 'inherit'}
                              size="small"
                              onClick={() => setStatus('Active')}
                              sx={{ 
                                textTransform: 'none',
                                fontWeight: status === 'Active' ? 600 : 400,
                                minWidth: '70px'
                              }}
                            >
                              Active
                            </Button>
                            <Button
                              variant={status === 'Inactive' ? 'contained' : 'outlined'}
                              color={status === 'Inactive' ? 'warning' : 'inherit'}
                              size="small"
                              onClick={() => setStatus('Inactive')}
                              sx={{ 
                                textTransform: 'none',
                                fontWeight: status === 'Inactive' ? 600 : 400,
                                minWidth: '70px'
                              }}
                            >
                              Inactive
                            </Button>
                            <Button
                              variant={status === 'Draft' ? 'contained' : 'outlined'}
                              color={status === 'Draft' ? 'info' : 'inherit'}
                              size="small"
                              onClick={() => setStatus('Draft')}
                              sx={{ 
                                textTransform: 'none',
                                fontWeight: status === 'Draft' ? 600 : 400,
                                minWidth: '70px'
                              }}
                            >
                              Draft
                            </Button>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            {status === 'Active' && 'Policy is enforced and active'}
                            {status === 'Inactive' && 'Policy is disabled but preserved'}
                            {status === 'Draft' && 'Policy is being developed'}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </Card>
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Policy updated successfully! Redirecting to policy view...
              </Alert>
            )}
            </Box>
          </Card>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, p: 3 }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error && !originalPolicy) {
    return (
      <DashboardLayout>
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <SecurityIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h5" fontWeight="600">
              Edit Policy
            </Typography>
          </Box>
        </Paper>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/policies')}
        >
          Back to Policies
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            onClick={() => router.push('/policies')}
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            Policies
          </Link>
          <Link 
            color="inherit" 
            onClick={() => router.push(`/policies/${policyId}`)}
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            {originalPolicy?.name}
          </Link>
          <Typography color="text.primary">Edit</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => router.push(`/policies/${policyId}`)}
              sx={{ 
                bgcolor: 'grey.100',
                '&:hover': { bgcolor: 'grey.200' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SecurityIcon color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h5" fontWeight="600">
                  Edit Policy
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Update access control rules for your organization
              </Typography>
            </Box>
          </Box>
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
                onClick={() => router.push(`/policies/${policyId}`)}
              >
                Cancel
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isCurrentStepValid}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
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