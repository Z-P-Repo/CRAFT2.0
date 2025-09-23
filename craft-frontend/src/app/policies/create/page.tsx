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
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import SubjectCreationDialog from '@/components/subjects/SubjectCreationDialog';
import ActionCreationDialog from '@/components/actions/ActionCreationDialog';
import ResourceCreationDialog from '@/components/resources/ResourceCreationDialog';
import RoleProtection from '@/components/auth/RoleProtection';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

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
  'Action Selection',
  'Resource Selection', 
  'Review & Create'
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

export default function CreatePolicyPage() {
  const router = useRouter();
  const snackbar = useApiSnackbar();
  const { currentWorkspace, currentApplication, currentEnvironment } = useWorkspace();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);

  // Form data
  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [description, setDescription] = useState('');

  // Selection data
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Attribute[]>([]);
  const [selectedSubjectAttributes, setSelectedSubjectAttributes] = useState<{ [key: string]: any }>({});
  const [selectedResourceAttributes, setSelectedResourceAttributes] = useState<Attribute[]>([]);
  const [selectedResourceAttributeValues, setSelectedResourceAttributeValues] = useState<{ [key: string]: any }>({});
  const [selectedAction, setSelectedAction] = useState<'draft' | 'publish' | null>(null);

  // Dropdown data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [actions, setActions] = useState<ActionObject[]>([]);
  const [resources, setResources] = useState<ResourceObject[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [resourceAttributes, setResourceAttributes] = useState<Attribute[]>([]);
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
  // Conditional selections for attribute scope
  const [selectedSubjectsForAttribute, setSelectedSubjectsForAttribute] = useState<string[]>([]);
  const [selectedResourcesForAttribute, setSelectedResourcesForAttribute] = useState<string[]>([]);

  // Subject creation modal state
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [existingValues, setExistingValues] = useState<any[]>([]);
  
  // Action creation modal state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  
  // Resource creation modal state
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  
  // Cancel confirmation dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
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
        const attributesData = Array.isArray(attributesResponse.data) ? attributesResponse.data : [];
        setAttributes(attributesData);
        // Filter resource attributes to only show those with 'resource' category
        const resourceAttributesData = attributesData.filter(attr => 
          attributeHasCategory(attr, 'resource')
        );
        setResourceAttributes(resourceAttributesData);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      snackbar.handleApiError(error, 'Failed to load form data. Please refresh the page.');
    } finally {
      setLoadingDropdownData(false);
    }
    // ESLint disable to prevent infinite loop - snackbar causes issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - only run once on mount

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]); // Include fetchDropdownData dependency

  // Form validation
  const isStepValid = useCallback((step: number) => {
    switch (step) {
      case 0:
        const isValid = displayName.trim() !== '' && displayName.length >= 3 && displayName.length <= 100;
        return isValid;
      case 1:
        return selectedSubjects.length > 0;
      case 2:
        return selectedActions.length > 0;
      case 3:
        return selectedResources.length > 0;
      default:
        return true;
    }
  }, [displayName, selectedSubjects, selectedActions, selectedResources]);

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

  // Handle resource attribute value selection changes
  const handleResourceAttributeValueSelection = (attributeId: string, value: any) => {
    setSelectedResourceAttributeValues(prev => ({
      ...prev,
      [attributeId]: value
    }));
  };

  // Handle resource attribute dropdown selection
  const handleResourceAttributeDropdownSelection = (event: any, newValue: Attribute[]) => {
    setSelectedResourceAttributes(newValue);
    // Reset values for removed attributes
    const removedAttributes = selectedResourceAttributes.filter(
      oldAttr => !newValue.find(newAttr => newAttr.id === oldAttr.id)
    );
    removedAttributes.forEach(attr => {
      setSelectedResourceAttributeValues(prev => {
        const updated = { ...prev };
        delete updated[attr.id];
        return updated;
      });
    });
  };

  // Remove resource attribute from selection
  const handleRemoveResourceAttribute = (attributeId: string) => {
    setSelectedResourceAttributes(prev => prev.filter(attr => attr.id !== attributeId));
    setSelectedResourceAttributeValues(prev => {
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
    // Reset new scope-related states
    setSelectedSubjectsForAttribute([]);
    setSelectedResourcesForAttribute([]);
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

  // Subject creation handlers
  const handleOpenSubjectDialog = () => {
    setSubjectDialogOpen(true);
  };

  const handleCloseSubjectDialog = () => {
    setSubjectDialogOpen(false);
  };

  const handleSubjectCreated = (newSubject: any) => {
    // Add the new subject to the subjects list
    setSubjects(prev => [...prev, newSubject]);
    
    // Select the newly created subject
    setSelectedSubjects(prev => [...prev, newSubject.id]);
    
    // Show success message using snackbar
    snackbar.showSuccess('Subject created successfully!');
  };

  // Action creation handlers
  const handleOpenActionDialog = () => {
    setActionDialogOpen(true);
  };

  const handleCloseActionDialog = () => {
    setActionDialogOpen(false);
  };

  const handleActionCreated = (newAction: any) => {
    // Add the new action to the actions list
    setActions(prev => [...prev, newAction]);
    
    // Select the newly created action
    setSelectedActions(prev => [...prev, newAction.id]);
    
    // Show success message using snackbar
    snackbar.showSuccess('Action created successfully!');
  };

  // Resource creation handlers
  const handleOpenResourceDialog = () => {
    setResourceDialogOpen(true);
  };

  const handleCloseResourceDialog = () => {
    setResourceDialogOpen(false);
  };

  const handleResourceCreated = (newResource: any) => {
    // Add the new resource to the resources list
    setResources(prev => [...prev, newResource]);
    
    // Select the newly created resource
    setSelectedResources(prev => [...prev, newResource.id]);
    
    // Show success message using snackbar
    snackbar.showSuccess('Resource created successfully!');
  };

  // Cancel confirmation handlers
  const handleCancelClick = () => {
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    setCancelDialogOpen(false);
    router.push('/policies');
  };

  const handleCancelCancel = () => {
    setCancelDialogOpen(false);
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

    // Check if required workspace context is available
    if (!currentWorkspace || !currentApplication || !currentEnvironment) {
      snackbar.showError('Please select a workspace, application, and environment before creating an attribute.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Debug logging for policy creation attribute flow
      console.log('Policy Creation - Attribute Debug Info:');
      console.log('Selected Data Type:', selectedDataType);
      console.log('Permitted Values:', permittedValues);
      console.log('String Values:', stringValues);
      console.log('Number Values:', numberValues);
      console.log('Boolean Values:', booleanValues);
      console.log('Parsed Values:', parsedValues);
      
      const finalEnumValues = parsedValues.length > 0 ? parsedValues : (
        selectedDataType === 'string' ? stringValues.filter(v => v.trim() !== '') :
        selectedDataType === 'number' ? numberValues.map(v => parseFloat(v)).filter(v => !isNaN(v)) :
        selectedDataType === 'boolean' ? booleanValues.map(v => v === 'true') :
        []
      );
      
      console.log('Final Enum Values to send:', finalEnumValues);
      
      const apiData = {
        id: attributeDisplayName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_'),
        name: attributeDisplayName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_'),
        displayName: attributeDisplayName,
        description: attributeDescription,
        categories: selectedCategories.length > 0 ? selectedCategories : ['subject'],
        dataType: selectedDataType,
        isRequired: false,
        isMultiValue: false,
        scope: 'environment',
        // Required hierarchy IDs
        workspaceId: currentWorkspace._id,
        applicationId: currentApplication._id,
        environmentId: currentEnvironment._id,
        constraints: {
          enumValues: finalEnumValues
        },
        validation: {},
        metadata: {
          createdBy: 'user',
          lastModifiedBy: 'user',
          tags: ['custom'],
          isSystem: false,
          isCustom: true,
          version: '1.0.0',
          scope: {
            appliesTo: (selectedSubjectsForAttribute.length > 0 || selectedResourcesForAttribute.length > 0) ? 'specific' : 'all',
            subjects: selectedSubjectsForAttribute,
            resources: selectedResourcesForAttribute
          }
        },
        active: true
      };

      const response = await apiClient.post('/attributes', apiData);
      if (response.success) {
        snackbar.showSuccess('Attribute created successfully');
        await fetchDropdownData();
        handleClose();
      } else {
        snackbar.handleApiResponse(response, undefined, 'Failed to create attribute');
      }
    } catch (error) {
      console.error('Error creating attribute:', error);
      snackbar.handleApiError(error, 'Failed to create attribute. Please try again.');
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
        snackbar.showSuccess('Value added successfully');
        await fetchDropdownData();
        setShowCreateValue(null);
        setNewValueData('');
      } else {
        snackbar.handleApiResponse(response, undefined, 'Failed to create value');
      }
    } catch (error) {
      console.error('Error creating value:', error);
      snackbar.handleApiError(error, 'Failed to create value. Please try again.');
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

  // Submit form (common logic)
  const submitPolicy = async (status: 'Draft' | 'Active') => {
    if (!isStepValid(0) || !isStepValid(1) || !isStepValid(2) || !isStepValid(3)) {
      snackbar.showError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const rules = selectedActions.flatMap((actionId, actionIndex) =>
        selectedResources.map((resourceId, resourceIndex) => {
          const ruleIndex = actionIndex * selectedResources.length + resourceIndex;
          
          // Build subject attributes for rule
          console.log('Selected Subject Attributes:', selectedSubjectAttributes);
          console.log('Available Attributes:', attributes.map(a => ({ id: a.id, name: a.name, displayName: a.displayName })));
          
          const subjectAttributes = Object.entries(selectedSubjectAttributes)
            .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
            .map(([attrId, value]) => {
              const attribute = attributes.find(attr => attr.id === attrId);
              console.log(`Looking for attribute ${attrId}, found:`, attribute);
              if (!attribute) return null;
              
              const attrData = {
                name: attribute.name,
                operator: Array.isArray(value) ? 'in' : 'equals',
                value: value
              };
              console.log('Created attribute data:', attrData);
              return attrData;
            })
            .filter(Boolean);
            
          console.log('Final subject attributes for rule:', subjectAttributes);

          // Build resource attributes for rule
          const resourceAttributes = Object.entries(selectedResourceAttributeValues)
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
          const subject = subjects.find(s => s.id === selectedSubjects[0]); // Use first selected subject for now

          return {
            id: `rule-${Date.now()}-${ruleIndex}`,
            subject: {
              type: selectedSubjects[0], // Use first selected subject for now
              attributes: subjectAttributes
            },
            action: {
              name: actionId,
              displayName: action?.displayName || actionId
            },
            object: {
              type: resourceId,
              attributes: resourceAttributes
            },
            conditions: []
          };
        })
      );

      // Check if required workspace context is available
      if (!currentWorkspace || !currentApplication || !currentEnvironment) {
        snackbar.showError('Please select a workspace, application, and environment before creating a policy.');
        return;
      }

      const policyData = {
        name: displayName.trim(),
        description: description?.trim() || '',
        effect: 'Allow' as const,
        status,
        rules,
        subjects: selectedSubjects,
        resources: selectedResources,
        actions: selectedActions,
        conditions: [],
        // Required workspace context for backend validation
        workspaceId: currentWorkspace._id,
        applicationId: currentApplication._id,
        environmentId: currentEnvironment._id
      };

      console.log('Final policy data being sent to backend:', JSON.stringify(policyData, null, 2));

      const response = await apiClient.post('/policies', policyData);
      
      if (response.success) {
        const message = status === 'Active' 
          ? 'Policy created and published successfully! It is now active and enforced.'
          : 'Policy created successfully as draft! You can publish it later from the policies list.';
        
        snackbar.showSuccess(message);
        
        setTimeout(() => {
          router.push('/policies');
        }, 1500);
      } else {
        snackbar.handleApiResponse(response, undefined, 'Failed to create policy');
      }
    } catch (error: any) {
      console.error('Failed to create policy:', error);
      snackbar.handleApiError(error, 'Failed to create policy. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle saving as draft
  const handleSaveDraft = () => {
    setSelectedAction('draft');
    submitPolicy('Draft');
  };

  // Handle publishing immediately  
  const handlePublish = () => {
    setSelectedAction('publish');
    submitPolicy('Active');
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
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight="600">
                        Select Subject
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleOpenSubjectDialog}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Create New Subject
                      </Button>
                    </Box>
                    <Autocomplete
                      options={subjects}
                      getOptionLabel={(option) => option.displayName}
                      value={subjects.find(subject => selectedSubjects.includes(subject.id)) || null}
                      onChange={(event, newValue) => {
                        setSelectedSubjects(newValue ? [newValue.id] : []);
                      }}
                      disabled={loadingDropdownData}
                      filterOptions={(options, { inputValue }) => {
                        return options.filter(option =>
                          option.displayName.toLowerCase().includes(inputValue.toLowerCase()) ||
                          option.email.toLowerCase().includes(inputValue.toLowerCase()) ||
                          option.type.toLowerCase().includes(inputValue.toLowerCase()) ||
                          option.department.toLowerCase().includes(inputValue.toLowerCase())
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Subject *"
                          placeholder="Search subjects by name, email, type, or department"
                          sx={{ bgcolor: 'white' }}
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', py: 0.5 }}>
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  bgcolor: option.type === 'user' ? 'primary.main' : 
                                           option.type === 'group' ? 'secondary.main' : 'warning.main',
                                  fontSize: '15px',
                                  fontWeight: 600
                                }}
                              >
                                {option.displayName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" fontWeight="600">
                                  {option.displayName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {option.email}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        );
                      }}
                      sx={{ width: '100%' }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 7 }}>
                    {selectedSubjects.length > 0 ? (
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
                            options={attributes?.filter(attr => attributeHasCategory(attr, 'subject') && attr.active) || []}
                            value={selectedAttributes}
                            onChange={handleAttributeSelection}
                            getOptionLabel={(option) => option.displayName}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            filterOptions={(options, { inputValue }) => {
                              return options.filter(option =>
                                option.displayName.toLowerCase().includes(inputValue.toLowerCase()) ||
                                option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                                (option.description && option.description.toLowerCase().includes(inputValue.toLowerCase())) ||
                                option.dataType.toLowerCase().includes(inputValue.toLowerCase()) ||
                                (option.categories && option.categories.some(cat => cat.toLowerCase().includes(inputValue.toLowerCase())))
                              );
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select Attributes"
                                placeholder="Search attributes by name, description, type, or category"
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
                Action Selection
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select the actions that can be performed under this policy
              </Typography>
            </Box>

            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Available Actions
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleOpenActionDialog}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Create New Action
                </Button>
              </Box>
              <Autocomplete
                multiple
                options={actions || []}
                getOptionLabel={(option) => option.displayName}
                value={actions.filter(action => selectedActions.includes(action.id))}
                onChange={(event, newValue) => {
                  setSelectedActions(newValue.map(action => action.id));
                }}
                filterOptions={(options, { inputValue }) => {
                  return options.filter(option =>
                    option.displayName.toLowerCase().includes(inputValue.toLowerCase()) ||
                    option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                    (option.description && option.description.toLowerCase().includes(inputValue.toLowerCase())) ||
                    (option.category && option.category.toLowerCase().includes(inputValue.toLowerCase())) ||
                    (option.riskLevel && option.riskLevel.toLowerCase().includes(inputValue.toLowerCase()))
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Actions"
                    placeholder="Search actions by name, description, category, or risk level"
                    sx={{ bgcolor: 'white' }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        {...tagProps}
                        label={option.displayName}
                        color="primary"
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    );
                  })
                }
                renderOption={(props, option, { selected }) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Checkbox
                        checked={selected}
                        sx={{ mr: 1 }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', py: 0.5 }}>
                        <ActionIcon color="primary" fontSize="small" />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight="600">
                            {option.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {option.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                }}
                sx={{ width: '100%' }}
              />
            </Paper>

          </Card>
        );

      case 3:
        return (
          <Card sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                Resource Selection
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select resources and configure their access conditions
              </Typography>
            </Box>

            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Available Resources
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleOpenResourceDialog}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Create New Resource
                      </Button>
                    </Box>
                    <Autocomplete
                      multiple
                      options={resources}
                      getOptionLabel={(option) => option.displayName}
                      value={resources.filter(resource => selectedResources.includes(resource.id))}
                      onChange={(event, newValue) => {
                        setSelectedResources(newValue.map(resource => resource.id));
                      }}
                      disabled={loadingDropdownData}
                      filterOptions={(options, { inputValue }) => {
                        return options.filter(option =>
                          option.displayName.toLowerCase().includes(inputValue.toLowerCase()) ||
                          option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                          (option.description && option.description.toLowerCase().includes(inputValue.toLowerCase())) ||
                          (option.uri && option.uri.toLowerCase().includes(inputValue.toLowerCase())) ||
                          option.type.toLowerCase().includes(inputValue.toLowerCase())
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Resources *"
                          placeholder="Search resources by name, description, URI, or type"
                          sx={{ bgcolor: 'white' }}
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              {...tagProps}
                              label={option.displayName}
                              size="small"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          );
                        })
                      }
                      renderOption={(props, option, { selected }) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Checkbox
                              checked={selected}
                              sx={{ mr: 1 }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', py: 0.5 }}>
                              <ResourceIcon
                                color="primary"
                                sx={{ fontSize: 20 }}
                              />
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" fontWeight="600">
                                  {option.displayName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {option.description || option.uri}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        );
                      }}
                      sx={{ width: '100%' }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 7 }}>
                    {selectedResources.length > 0 ? (
                      <Box>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <AttributeIcon color="primary" />
                          Resource Attribute Conditions
                        </Typography>

                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Select resource attributes to configure conditions (optional):
                          </Typography>
                          <Autocomplete
                            multiple
                            size="small"
                            options={resourceAttributes}
                            value={selectedResourceAttributes}
                            onChange={handleResourceAttributeDropdownSelection}
                            getOptionLabel={(option) => option.displayName}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            filterOptions={(options, { inputValue }) => {
                              return options.filter(option =>
                                option.displayName.toLowerCase().includes(inputValue.toLowerCase()) ||
                                option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                                (option.description && option.description.toLowerCase().includes(inputValue.toLowerCase())) ||
                                option.dataType.toLowerCase().includes(inputValue.toLowerCase()) ||
                                (option.categories && option.categories.some(cat => cat.toLowerCase().includes(inputValue.toLowerCase())))
                              );
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Search resource attributes by name, description, type, or category"
                                sx={{ bgcolor: 'white' }}
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

                        {/* Selected Resource Attributes Configuration */}
                        {selectedResourceAttributes.length > 0 && (
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Configure conditions for selected attributes ({selectedResourceAttributes.length}):
                            </Typography>
                            <Grid container spacing={2}>
                              {selectedResourceAttributes.map((attribute) => {
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
                                              sx={{ height: 16, fontSize: '0.6rem' }}
                                            />
                                          )}
                                        </Box>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleRemoveResourceAttribute(attribute.id)}
                                          sx={{ color: 'text.secondary', ml: 1 }}
                                        >
                                          <CloseIcon fontSize="small" />
                                        </IconButton>
                                      </Box>

                                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, lineHeight: 1.3 }}>
                                        {attribute.description || `Configure ${attribute.displayName.toLowerCase()} condition`}
                                      </Typography>

                                      {attribute.constraints.enumValues && attribute.constraints.enumValues.length > 0 ? (
                                        attribute.isMultiValue ? (
                                          <Autocomplete
                                            multiple
                                            size="small"
                                            options={attribute.constraints.enumValues}
                                            value={selectedResourceAttributeValues[attribute.id] || []}
                                            onChange={(_, newValue) => handleResourceAttributeValueSelection(attribute.id, newValue)}
                                            renderInput={(params) => (
                                              <TextField
                                                {...params}
                                                placeholder="Select values..."
                                                size="small"
                                                sx={{ bgcolor: 'grey.50' }}
                                              />
                                            )}
                                            renderTags={(value, getTagProps) =>
                                              value.map((option, index) => (
                                                <Chip
                                                  key={option}
                                                  label={option}
                                                  {...getTagProps({ index })}
                                                  size="small"
                                                  color="primary"
                                                  variant="outlined"
                                                  sx={{ fontSize: '0.7rem' }}
                                                />
                                              ))
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
                                              value={selectedResourceAttributeValues[attribute.id] || ''}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                handleResourceAttributeValueSelection(attribute.id, value);
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
                                                checked={selectedResourceAttributeValues[attribute.id] || false}
                                                onChange={(e) => handleResourceAttributeValueSelection(attribute.id, e.target.checked)}
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
                                          value={selectedResourceAttributeValues[attribute.id] || ''}
                                          onChange={(e) => handleResourceAttributeValueSelection(attribute.id, Number(e.target.value))}
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
                                          value={selectedResourceAttributeValues[attribute.id] || ''}
                                          onChange={(e) => handleResourceAttributeValueSelection(attribute.id, e.target.value)}
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
                        {selectedResourceAttributes.length === 0 && (
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
                              No resource attributes selected
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Use the dropdown above to select resource attributes for this policy
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
                        <ResourceIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary" fontWeight="500" sx={{ mb: 1 }}>
                          Resource Selection Required
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Choose resources from the list to configure attribute conditions
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Paper>
          </Card>
        );

      case 4:
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
                        {selectedSubjects.map(id => subjects.find(s => s.id === id)?.displayName).join(', ')}
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
                      </strong>
                      {Object.keys(selectedResourceAttributeValues).length > 0 && (
                        <span>
                          {' '}(where{' '}
                          {Object.entries(selectedResourceAttributeValues)
                            .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
                            .map(([attrId, value], index, array) => {
                              const attr = resourceAttributes.find(a => a.id === attrId);
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
                      )}.
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
                          {selectedSubjects.map(id => subjects.find(s => s.id === id)?.displayName).join(', ')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedSubjects.map(id => {
                            const subject = subjects.find(s => s.id === id);
                            return subject ? subject.email : '';
                          }).join('; ')}
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
                        {Object.keys(selectedResourceAttributeValues).length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Conditions:
                            </Typography>
                            {Object.entries(selectedResourceAttributeValues)
                              .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
                              .map(([attrId, value]) => {
                                const attr = resourceAttributes.find(a => a.id === attrId);
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
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {/* Action Options */}
            <Card sx={{ mt: 3, p: 3, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
                Next Steps
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose how you want to proceed with your policy:
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom sx={{ fontWeight: 600 }}>
                      💾 Save as Draft
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Save the policy for review and testing. You can publish it later from the policies list.
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom sx={{ fontWeight: 600 }}>
                      🚀 Publish Immediately
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Create and activate the policy immediately. It will be enforced across your system right away.
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Card>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <RoleProtection allowedRoles={['admin', 'super_admin']}>
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
              Policies
            </Link>
            <Typography color="text.primary">Create New Policy</Typography>
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
                onClick={handleCancelClick}
              >
                Cancel
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting || !isCurrentStepValid}
                    startIcon={isSubmitting && selectedAction === 'draft' ? <CircularProgress size={20} /> : null}
                    sx={{ mr: 2 }}
                  >
                    {isSubmitting && selectedAction === 'draft' ? 'Saving Draft...' : 'Save as Draft'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handlePublish}
                    disabled={isSubmitting || !isCurrentStepValid}
                    startIcon={isSubmitting && selectedAction === 'publish' ? <CircularProgress size={20} /> : <CheckIcon />}
                  >
                    {isSubmitting && selectedAction === 'publish' ? 'Publishing...' : 'Publish Policy'}
                  </Button>
                </>
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

              {/* Conditional Subject/Resource Selection */}
              {(selectedCategories.includes('subject') || selectedCategories.includes('resource')) && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                    Attribute Scope
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select which {selectedCategories.includes('subject') && selectedCategories.includes('resource') 
                      ? 'subjects and resources' 
                      : selectedCategories.includes('subject') 
                        ? 'subjects' 
                        : 'resources'} this attribute applies to. Leave empty to apply to all.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedCategories.includes('subject') && (
                      <FormControl fullWidth>
                        <InputLabel>Applies to Subjects (optional)</InputLabel>
                        <Select
                          multiple
                          value={selectedSubjectsForAttribute}
                          onChange={(e) => setSelectedSubjectsForAttribute(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                          label="Applies to Subjects (optional)"
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">All subjects</Typography>
                              ) : (
                                selected.map((subjectId) => {
                                  const subject = subjects.find(s => s.id === subjectId);
                                  return (
                                    <Chip 
                                      key={subjectId} 
                                      label={subject?.displayName || subjectId} 
                                      size="small" 
                                      color="primary"
                                    />
                                  );
                                })
                              )}
                            </Box>
                          )}
                        >
                          {subjects.map((subject) => (
                            <MenuItem key={subject.id} value={subject.id}>
                              <Checkbox checked={selectedSubjectsForAttribute.indexOf(subject.id) > -1} />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <Avatar
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    bgcolor: subject.type === 'user' ? 'primary.main' : 
                                             subject.type === 'group' ? 'secondary.main' : 'warning.main',
                                    fontSize: '12px',
                                    fontWeight: 600
                                  }}
                                >
                                  {subject.displayName.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="body2" fontWeight="500">
                                    {subject.displayName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {subject.email}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    {selectedCategories.includes('resource') && (
                      <FormControl fullWidth>
                        <InputLabel>Applies to Resources (optional)</InputLabel>
                        <Select
                          multiple
                          value={selectedResourcesForAttribute}
                          onChange={(e) => setSelectedResourcesForAttribute(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                          label="Applies to Resources (optional)"
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">All resources</Typography>
                              ) : (
                                selected.map((resourceId) => {
                                  const resource = resources.find(r => r.id === resourceId);
                                  return (
                                    <Chip 
                                      key={resourceId} 
                                      label={resource?.displayName || resourceId} 
                                      size="small" 
                                      color="secondary"
                                    />
                                  );
                                })
                              )}
                            </Box>
                          )}
                        >
                          {resources.map((resource) => (
                            <MenuItem key={resource.id} value={resource.id}>
                              <Checkbox checked={selectedResourcesForAttribute.indexOf(resource.id) > -1} />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <ResourceIcon 
                                  sx={{ 
                                    color: 'secondary.main',
                                    fontSize: 24 
                                  }} 
                                />
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="body2" fontWeight="500">
                                    {resource.displayName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {resource.description || resource.uri}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                </Box>
              )}

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

        {/* Subject Creation Dialog */}
        <SubjectCreationDialog
          open={subjectDialogOpen}
          onClose={handleCloseSubjectDialog}
          onSubjectCreated={handleSubjectCreated}
        />

        {/* Action Creation Dialog */}
        <ActionCreationDialog
          open={actionDialogOpen}
          onClose={handleCloseActionDialog}
          onActionCreated={handleActionCreated}
        />

        {/* Resource Creation Dialog */}
        <ResourceCreationDialog
          open={resourceDialogOpen}
          onClose={handleCloseResourceDialog}
          onResourceCreated={handleResourceCreated}
        />

        {/* Cancel Confirmation Dialog */}
        <Dialog
          open={cancelDialogOpen}
          onClose={handleCancelCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            Cancel Policy Creation
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" color="text.secondary">
              Are you sure you want to cancel? All your progress will be lost and cannot be recovered.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={handleCancelCancel}
              variant="outlined"
            >
              Continue Editing
            </Button>
            <Button 
              onClick={handleCancelConfirm}
              variant="contained"
              color="error"
            >
              Yes, Cancel
            </Button>
          </DialogActions>
        </Dialog>

        </DashboardLayout>
      </RoleProtection>
    </ProtectedRoute>
  );
}