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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
  Save as SaveIcon,
  Delete as DeleteIcon,
  Settings as AttributeIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import RoleProtection from '@/components/auth/RoleProtection';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import SubjectCreationDialog from '@/components/subjects/SubjectCreationDialog';
import ActionCreationDialog from '@/components/actions/ActionCreationDialog';
import ResourceCreationDialog from '@/components/resources/ResourceCreationDialog';

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
  additionalResources?: any[]; // Can be array of IDs or array of objects
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
  'Action Selection',
  'Resource Selection',
  'Additional Resources',
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
  const snackbar = useApiSnackbar();
  const { currentWorkspace, currentApplication, currentEnvironment } = useWorkspace();

  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [showCreateValue, setShowCreateValue] = useState<string | null>(null);
  const [newValueData, setNewValueData] = useState('');

  // Attribute creation modal states
  const [open, setOpen] = useState(false);
  const [currentAdditionalResourceId, setCurrentAdditionalResourceId] = useState<string | null>(null);
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
  const [arrayValues, setArrayValues] = useState<string[]>([]);
  const [objectValues, setObjectValues] = useState<string[]>([]);
  const [dateValues, setDateValues] = useState<string[]>([]);
  const [dateInputType, setDateInputType] = useState<'single' | 'range' | 'period'>('single');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [attributeDescription, setAttributeDescription] = useState('');
  const [isAttributeUsedInPolicies, setIsAttributeUsedInPolicies] = useState(false);
  const [selectedSubjectsForAttribute, setSelectedSubjectsForAttribute] = useState<string[]>([]);
  const [selectedResourcesForAttribute, setSelectedResourcesForAttribute] = useState<string[]>([]);
  const [existingValues, setExistingValues] = useState<any[]>([]);

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
  const [selectedAdditionalResources, setSelectedAdditionalResources] = useState<string[]>([]);
  const [selectedAdditionalResourceAttributes, setSelectedAdditionalResourceAttributes] = useState<{ [resourceId: string]: { [attributeId: string]: any } }>({});
  const [selectedAttributes, setSelectedAttributes] = useState<Attribute[]>([]);
  const [selectedSubjectAttributes, setSelectedSubjectAttributes] = useState<{ [key: string]: any }>({});
  const [selectedResourceAttributes, setSelectedResourceAttributes] = useState<Attribute[]>([]);
  const [selectedResourceAttributeValues, setSelectedResourceAttributeValues] = useState<{ [key: string]: any }>({});

  // Dropdown data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [actions, setActions] = useState<ActionObject[]>([]);
  const [resources, setResources] = useState<ResourceObject[]>([]);
  const [additionalResources, setAdditionalResources] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [resourceAttributes, setResourceAttributes] = useState<Attribute[]>([]);
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

          // Handle additional resources - extract IDs if objects are provided
          if (policy.additionalResources && Array.isArray(policy.additionalResources)) {
            console.log('Raw policy.additionalResources:', policy.additionalResources);
            const additionalResourceIds = policy.additionalResources.map((item: any) => {
              // If item is an object with id property, extract the id
              // Otherwise assume it's already an id string
              return typeof item === 'object' && item?.id ? item.id : item;
            });
            console.log('Extracted additionalResourceIds:', additionalResourceIds);
            setSelectedAdditionalResources(additionalResourceIds);
          } else {
            setSelectedAdditionalResources([]);
          }
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

      // Also initialize resource attributes from the first rule
      const resourceAttrs: { [key: string]: any } = {};

      firstRule?.object?.attributes?.forEach((attr: any) => {
        // Try to find the attribute in the loaded attributes list to get the correct ID
        const attributeObj = resourceAttributes.find(a => a.name === attr.name || a.id === attr.name) ||
          attributes.find(a => a.name === attr.name || a.id === attr.name);
        if (attributeObj) {
          resourceAttrs[attributeObj.id] = attr.value;
        } else {
          // Fallback to using the name if no matching attribute found
          resourceAttrs[attr.name] = attr.value;
        }
      });

      setSelectedResourceAttributeValues(resourceAttrs);
    }
  }, [originalPolicy, attributes, resourceAttributes]);

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

  // Initialize selectedResourceAttributes when resourceAttributes and selectedResourceAttributeValues are loaded
  useEffect(() => {
    if (resourceAttributes.length > 0 && Object.keys(selectedResourceAttributeValues).length > 0) {
      const selectedAttrIds = Object.keys(selectedResourceAttributeValues);
      const selectedAttrObjects = resourceAttributes.filter(attr =>
        selectedAttrIds.includes(attr.id) || selectedAttrIds.includes(attr.name)
      );
      setSelectedResourceAttributes(selectedAttrObjects);
    }
  }, [resourceAttributes, selectedResourceAttributeValues]);

  // Fetch dropdown data
  const fetchDropdownData = useCallback(async () => {
    try {
      setLoadingDropdownData(true);
      console.log('Fetching dropdown data including additional resources...');
      const [subjectsResponse, actionsResponse, resourcesResponse, additionalResourcesResponse, attributesResponse] = await Promise.allSettled([
        apiClient.get('/subjects', { page: 1, limit: 1000 }),
        apiClient.get('/actions', { page: 1, limit: 1000 }),
        apiClient.get('/resources', { page: 1, limit: 1000 }),
        apiClient.getAdditionalResources({ page: 1, limit: 1000 }),
        apiClient.get('/attributes', { page: 1, limit: 1000 })
      ]);

      if (subjectsResponse.status === 'fulfilled' && subjectsResponse.value.success && subjectsResponse.value.data) {
        setSubjects(Array.isArray(subjectsResponse.value.data) ? subjectsResponse.value.data : []);
      }
      if (actionsResponse.status === 'fulfilled' && actionsResponse.value.success && actionsResponse.value.data) {
        setActions(Array.isArray(actionsResponse.value.data) ? actionsResponse.value.data : []);
      }
      if (resourcesResponse.status === 'fulfilled' && resourcesResponse.value.success && resourcesResponse.value.data) {
        setResources(Array.isArray(resourcesResponse.value.data) ? resourcesResponse.value.data : []);
      }
      if (additionalResourcesResponse.status === 'fulfilled' && additionalResourcesResponse.value.success && additionalResourcesResponse.value.data) {
        console.log('Setting additional resources:', additionalResourcesResponse.value.data);
        setAdditionalResources(Array.isArray(additionalResourcesResponse.value.data) ? additionalResourcesResponse.value.data : []);
      } else if (additionalResourcesResponse.status === 'rejected') {
        console.error('Additional Resources API failed:', additionalResourcesResponse.reason);
      }
      if (attributesResponse.status === 'fulfilled' && attributesResponse.value.success && attributesResponse.value.data) {
        const attributesData = Array.isArray(attributesResponse.value.data) ? attributesResponse.value.data : [];
        setAttributes(attributesData);
        // Filter resource attributes to only show those with 'resource' category
        const resourceAttributesData = attributesData.filter(attr =>
          attributeHasCategory(attr, 'resource')
        );
        setResourceAttributes(resourceAttributesData);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    } finally {
      setLoadingDropdownData(false);
    }
  }, []);

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
        return selectedSubject !== '';
      case 2:
        return selectedActions.length > 0;
      case 3:
        return selectedResources.length > 0;
      case 4:
        return true; // Additional resources step is optional, always valid
      case 5:
        return true; // Review step is always valid if we reach it
      default:
        return false;
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

  // Handle additional resource selection
  const handleAdditionalResourceSelection = useCallback((event: any, newValue: any[]) => {
    console.log('Additional Resource Autocomplete onChange - newValue:', newValue);
    const newResourceIds = newValue.map(resource => resource.id);
    console.log('Setting selectedAdditionalResources to:', newResourceIds);
    setSelectedAdditionalResources(newResourceIds);
  }, []);

  const handleClearAllAdditionalResources = () => {
    setSelectedAdditionalResources([]);
  };

  // Handle additional resource deletion
  const handleAdditionalResourceDelete = useCallback((resourceId: string) => {
    console.log('Deleting additional resource:', resourceId);
    setSelectedAdditionalResources(prev => {
      const newResources = prev.filter(id => id !== resourceId);
      console.log('Updated additional resources:', newResources);
      return newResources;
    });
  }, []);

  // Handle additional resource attribute selection changes
  const handleAdditionalResourceAttributeSelection = (resourceId: string, attributeId: string, value: any) => {
    setSelectedAdditionalResourceAttributes(prev => ({
      ...prev,
      [resourceId]: {
        ...(prev[resourceId] || {}),
        [attributeId]: value
      }
    }));
  };

  // Cancel confirmation handlers
  const handleCancelClick = () => {
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    setCancelDialogOpen(false);
    router.push(`/policies/${policyId}`);
  };

  const handleCancelCancel = () => {
    setCancelDialogOpen(false);
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
    setSelectedSubject(newSubject.id);

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

    // Add to selected actions
    setSelectedActions(prev => [...prev, newAction.id]);

    // Show success message
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
    // Add the new resource to both resources and additional resources lists
    setResources(prev => [...prev, newResource]);
    setAdditionalResources(prev => [...prev, newResource]);

    // Select the newly created resource in both lists
    setSelectedResources(prev => [...prev, newResource.id]);
    setSelectedAdditionalResources(prev => [...prev, newResource.id]);

    // Show success message using snackbar
    snackbar.showSuccess('Resource created successfully!');
  };

  // Attribute creation handlers
  const canOnlyAddValues = () => {
    return isAttributeUsedInPolicies && (selectedDataType === 'array' || selectedDataType === 'object');
  };

  // Resource attribute creation handler (pre-selects resource category)
  const handleCreateResourceAttribute = async () => {
    setSelectedAttribute(null);
    setAttributeDisplayName('');
    setAttributeDisplayNameError('');
    setSelectedCategories(['resource']); // Pre-select resource category
    setSelectedDataType('');
    setAttributeDescription('');
    setPermittedValues('');
    setParsedValues([]);
    setBooleanValues([]);
    setNumberValues([]);
    setStringValues([]);
    setArrayValues([]);
    setObjectValues([]);
    setDateValues([]);
    setDateInputType('single');
    setSelectedDays([]);
    setExistingValues([]);
    setIsAttributeUsedInPolicies(false);
    setSelectedSubjectsForAttribute([]);
    setSelectedResourcesForAttribute([]);
    setOpen(true);
  };

  const isFieldDisabled = () => {
    return isAttributeUsedInPolicies && selectedDataType !== 'array' && selectedDataType !== 'object';
  };

  const handleClickOpen = async () => {
    setAttributeDisplayName('');
    setAttributeDisplayNameError('');
    setSelectedCategories(['subject']); // Pre-select subject category for edit page
    setSelectedDataType('');
    setAttributeDescription('');
    setPermittedValues('');
    setParsedValues([]);
    setBooleanValues([]);
    setNumberValues([]);
    setStringValues([]);
    setArrayValues([]);
    setObjectValues([]);
    setDateValues([]);
    setDateInputType('single');
    setSelectedDays([]);
    setExistingValues([]);
    setIsAttributeUsedInPolicies(false);
    setSelectedSubjectsForAttribute([]);
    setSelectedResourcesForAttribute([]);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentAdditionalResourceId(null);
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
    setArrayValues([]);
    setObjectValues([]);
    setDateValues([]);
    setDateInputType('single');
    setSelectedDays([]);
    setExistingValues([]);
    setIsAttributeUsedInPolicies(false);
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

  const handleDataTypeChange = (dataType: string) => {
    setSelectedDataType(dataType);
    setPermittedValues('');
    setParsedValues([]);
    setBooleanValues([]);
    setNumberValues([]);
    setStringValues([]);
    setArrayValues([]);
    setObjectValues([]);
    setDateValues([]);
    setDateInputType('single');
    setSelectedDays([]);
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

  const handleArrayValuesRemove = (index: number) => {
    const newValues = arrayValues.filter((_, i) => i !== index);
    setArrayValues(newValues);
    setParsedValues(newValues);
    setPermittedValues(JSON.stringify(newValues, null, 2));
  };

  const handleObjectValuesRemove = (index: number) => {
    const newValues = objectValues.filter((_, i) => i !== index);
    setObjectValues(newValues);
    try {
      const currentObj = JSON.parse(permittedValues);
      const keys = Object.keys(currentObj);
      if (keys[index]) {
        delete currentObj[keys[index]];
        setParsedValues([currentObj]);
        setPermittedValues(JSON.stringify(currentObj, null, 2));
      }
    } catch (error) {
      setParsedValues(newValues);
      setPermittedValues('{}');
    }
  };

  const handleFlexibleDateAdd = (dateString: string, type: string = 'single') => {
    if (dateString && !dateValues.includes(dateString)) {
      const newValues = [...dateValues, dateString];
      setDateValues(newValues);
      setParsedValues(newValues);
      setPermittedValues(newValues.join(', '));
    }
  };

  const handleDateValuesRemove = (index: number) => {
    const newValues = dateValues.filter((_, i) => i !== index);
    setDateValues(newValues);
    setParsedValues(newValues);
    setPermittedValues(newValues.join(', '));
  };

  const handleAttributeSubmit = async () => {
    if (!attributeDisplayName || attributeDisplayNameError) return;

    if (!currentWorkspace || !currentApplication || !currentEnvironment) {
      snackbar.showError('Please select a workspace, application, and environment before creating an attribute.');
      return;
    }

    try {
      setIsSubmitting(true);

      const finalEnumValues = parsedValues.length > 0 ? parsedValues : (
        selectedDataType === 'string' ? stringValues.filter(v => v.trim() !== '') :
          selectedDataType === 'number' ? numberValues.map(v => parseFloat(v)).filter(v => !isNaN(v)) :
            selectedDataType === 'boolean' ? booleanValues.map(v => v === 'true') :
              selectedDataType === 'array' ? arrayValues.filter(v => v.trim() !== '') :
                selectedDataType === 'object' ? objectValues.filter(v => v.trim() !== '') :
                  []
      );

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

        // Automatically add the new attribute to the appropriate selected list based on category
        if (response.data) {
          const hasResourceCategory = response.data.categories && response.data.categories.includes('resource');
          const hasSubjectCategory = response.data.categories && response.data.categories.includes('subject');

          if (hasResourceCategory) {
            setSelectedResourceAttributes(prev => [...prev, response.data]);
          }
          if (hasSubjectCategory) {
            setSelectedAttributes(prev => [...prev, response.data]);
          }
        }

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

  // Create value handler
  const handleCreateValue = async (attributeId: string) => {
    try {
      const attribute = attributes.find(attr => attr.id === attributeId);
      if (!attribute) return;

      // Check for duplicate values (case-insensitive)
      const existingValues = attribute.constraints.enumValues || [];
      const trimmedNewValue = newValueData.trim();
      const isDuplicate = existingValues.some(existingValue =>
        existingValue.toString().toLowerCase() === trimmedNewValue.toLowerCase()
      );

      if (isDuplicate) {
        snackbar.showError(`The value "${trimmedNewValue}" already exists for this attribute`);
        return;
      }

      if (!trimmedNewValue) {
        snackbar.showError('Please enter a value');
        return;
      }

      const response = await apiClient.put(`/attributes/${attribute.id}`, {
        ...attribute,
        constraints: {
          ...attribute.constraints,
          enumValues: [...existingValues, trimmedNewValue]
        }
      });

      if (response.success) {
        // Update local attribute state immediately
        setAttributes(prev => prev.map(attr => {
          if (attr.id === attributeId) {
            return {
              ...attr,
              constraints: {
                ...attr.constraints,
                enumValues: [...existingValues, trimmedNewValue]
              }
            };
          }
          return attr;
        }));

        // Also update resourceAttributes if needed
        setResourceAttributes(prev => prev.map(attr => {
          if (attr.id === attributeId) {
            return {
              ...attr,
              constraints: {
                ...attr.constraints,
                enumValues: [...existingValues, trimmedNewValue]
              }
            };
          }
          return attr;
        }));

        snackbar.showSuccess(`Value "${trimmedNewValue}" added successfully`);
        setShowCreateValue(null);
        setNewValueData('');

        // Optionally refresh from API in background
        fetchDropdownData().catch(console.error);
      } else {
        snackbar.handleApiResponse(response, undefined, 'Failed to create value');
      }
    } catch (error) {
      console.error('Error creating value:', error);
      snackbar.handleApiError(error, 'Failed to create value. Please try again.');
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

  // Resource attribute handlers
  const handleResourceAttributeValueSelection = (attributeId: string, value: any) => {
    setSelectedResourceAttributeValues(prev => ({
      ...prev,
      [attributeId]: value
    }));
  };

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

  const handleRemoveResourceAttribute = (attributeId: string) => {
    setSelectedResourceAttributes(prev => prev.filter(attr => attr.id !== attributeId));
    setSelectedResourceAttributeValues(prev => {
      const updated = { ...prev };
      delete updated[attributeId];
      return updated;
    });
  };

  // Form submission
  const handleSubmit = async () => {
    if (!originalPolicy || !isStepValid(0) || !isStepValid(1) || !isStepValid(2) || !isStepValid(3) || !isStepValid(4)) {
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
              attributes: resourceAttributes
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
        additionalResources: selectedAdditionalResources,
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
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={handleClickOpen}
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
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Configure conditions for selected attributes ({selectedAttributes.length}):
                          </Typography>
                          <Grid container spacing={1.5}>
                            {selectedAttributes.map((attribute) => {
                              const isArrayOrObject = (attribute.dataType as string) === 'object' ||
                                (attribute.dataType as string) === 'array' ||
                                (attribute.dataType === 'string' && attribute.constraints.enumValues &&
                                  Array.isArray(attribute.constraints.enumValues) && attribute.isMultiValue);

                              return (
                                <Grid key={attribute.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                  <Card
                                    variant="outlined"
                                    sx={{
                                      p: 1.5,
                                      bgcolor: 'white',
                                      border: '1px solid',
                                      borderColor: 'grey.200',
                                      height: '100%',
                                      '&:hover': {
                                        borderColor: 'primary.main',
                                        boxShadow: 1
                                      }
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                                        <Box sx={{
                                          width: 5,
                                          height: 5,
                                          borderRadius: '50%',
                                          bgcolor: attribute.isRequired ? 'error.main' : 'success.main',
                                          flexShrink: 0
                                        }} />
                                        <Typography variant="body2" fontWeight="600" color="text.primary" noWrap sx={{ fontSize: '0.8rem' }}>
                                          {attribute.displayName}
                                        </Typography>
                                        {attribute.isRequired && (
                                          <Chip
                                            label="Req"
                                            size="small"
                                            color="error"
                                            sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600, ml: 0.5 }}
                                          />
                                        )}
                                      </Box>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleRemoveAttribute(attribute.id)}
                                        sx={{
                                          color: 'text.secondary',
                                          p: 0.5,
                                          ml: 0.5,
                                          '&:hover': {
                                            color: 'error.main',
                                            bgcolor: 'error.50'
                                          }
                                        }}
                                      >
                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Box>

                                    {attribute.description && (
                                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, lineHeight: 1.3 }}>
                                        {attribute.description}
                                      </Typography>
                                    )}

                                    {((attribute.dataType === 'string' || (attribute.dataType as string) === 'array') && attribute.constraints.enumValues) ? (
                                      <Box>
                                        {isArrayOrObject ? (
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
                                                placeholder="Select or type values"
                                                sx={{
                                                  bgcolor: 'grey.50',
                                                  '& .MuiInputBase-input': {
                                                    fontSize: '0.8rem'
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
                                                    sx={{ fontSize: '0.65rem', height: 20 }}
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
                                                bgcolor: 'grey.50',
                                                fontSize: '0.8rem'
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
                                              sx={{ bgcolor: 'grey.50', fontSize: '0.8rem' }}
                                            >
                                              {!attribute.isRequired && (
                                                <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
                                                  <em>Not specified</em>
                                                </MenuItem>
                                              )}
                                              {attribute.constraints.enumValues.map((value: any) => (
                                                <MenuItem key={value} value={value} sx={{ fontSize: '0.8rem' }}>
                                                  {value}
                                                </MenuItem>
                                              ))}
                                              <MenuItem
                                                value="__add_new_value__"
                                                sx={{
                                                  bgcolor: 'primary.50',
                                                  borderTop: '1px solid',
                                                  borderColor: 'grey.200',
                                                  fontSize: '0.75rem',
                                                  '&:hover': {
                                                    bgcolor: 'primary.100'
                                                  }
                                                }}
                                              >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main' }}>
                                                  <AddIcon sx={{ fontSize: 14 }} />
                                                  <Typography variant="caption" color="primary.main" fontWeight="600" sx={{ fontSize: '0.75rem' }}>
                                                    Add new
                                                  </Typography>
                                                </Box>
                                              </MenuItem>
                                            </Select>
                                          </FormControl>
                                        )}
                                        <Button
                                          size="small"
                                          variant="text"
                                          startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                                          onClick={() => setShowCreateValue(attribute.id)}
                                          sx={{
                                            mt: 0.5,
                                            fontSize: '0.7rem',
                                            textTransform: 'none',
                                            color: 'primary.main',
                                            p: 0.5,
                                            minHeight: 'auto',
                                            '&:hover': {
                                              bgcolor: 'primary.50'
                                            }
                                          }}
                                        >
                                          Add Value
                                        </Button>
                                      </Box>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ResourceIcon color="primary" />
                      <Typography variant="h6" fontWeight="600">
                        Resources
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleOpenResourceDialog}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Create New Resource
                    </Button>
                  </Box>

                  <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'grey.200', borderRadius: 1, p: 2, bgcolor: 'grey.50' }}>
                    {resources.map((resource) => (
                      <Box key={resource.id} sx={{ mb: 1.5, last: { mb: 0 } }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
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
                            <Box sx={{ ml: 1 }}>
                              <Typography variant="body2" fontWeight="500">
                                {resource.displayName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                {resource.description || resource.uri}
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: 'flex-start', m: 0, width: '100%' }}
                        />
                      </Box>
                    ))}
                  </Box>

                  {selectedResources.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Selected Resources ({selectedResources.length}):
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
                              onDelete={() => {
                                setSelectedResources(prev => prev.filter(id => id !== resourceId));
                              }}
                            />
                          ) : null;
                        })}
                      </Box>
                    </Box>
                  )}
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  {selectedResources.length > 0 ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttributeIcon color="primary" />
                          Resource Attribute Conditions
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={handleCreateResourceAttribute}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          Create New Resource Attribute
                        </Button>
                      </Box>

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
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Select resource attributes to configure..."
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
                                        <Box>
                                          <FormControl fullWidth size="small">
                                            <Select
                                              value={selectedResourceAttributeValues[attribute.id] || ''}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '__add_new_value__') {
                                                  setShowCreateValue(attribute.id);
                                                } else {
                                                  handleResourceAttributeValueSelection(attribute.id, value);
                                                }
                                              }}
                                              displayEmpty
                                              sx={{ bgcolor: 'grey.50', fontSize: '0.8rem' }}
                                            >
                                              {!attribute.isRequired && (
                                                <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
                                                  <em>Not specified</em>
                                                </MenuItem>
                                              )}
                                              {attribute.constraints.enumValues.map((value: any) => (
                                                <MenuItem key={value} value={value} sx={{ fontSize: '0.8rem' }}>
                                                  {value}
                                                </MenuItem>
                                              ))}
                                              <MenuItem
                                                value="__add_new_value__"
                                                sx={{
                                                  bgcolor: 'primary.50',
                                                  borderTop: '1px solid',
                                                  borderColor: 'grey.200',
                                                  fontSize: '0.75rem',
                                                  '&:hover': {
                                                    bgcolor: 'primary.100'
                                                  }
                                                }}
                                              >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main' }}>
                                                  <AddIcon sx={{ fontSize: 14 }} />
                                                  <Typography variant="caption" color="primary.main" fontWeight="600" sx={{ fontSize: '0.75rem' }}>
                                                    Add new
                                                  </Typography>
                                                </Box>
                                              </MenuItem>
                                            </Select>
                                          </FormControl>
                                          <Button
                                            size="small"
                                            variant="text"
                                            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                                            onClick={() => setShowCreateValue(attribute.id)}
                                            sx={{
                                              mt: 0.5,
                                              fontSize: '0.7rem',
                                              textTransform: 'none',
                                              color: 'primary.main',
                                              p: 0.5,
                                              minHeight: 'auto',
                                              '&:hover': {
                                                bgcolor: 'primary.50'
                                              }
                                            }}
                                          >
                                            Add Value
                                          </Button>
                                        </Box>
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
                Additional Resources
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select additional resources that become available when specific conditions are met
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Advanced Feature:</strong> Additional resources are only accessible when the main policy conditions are satisfied.
                This allows for complex, context-aware resource access patterns.
              </Typography>
            </Alert>

            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Available Additional Resources
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
                    options={additionalResources}
                    getOptionLabel={(option) => option.displayName || option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={additionalResources.filter(resource => selectedAdditionalResources.includes(resource.id))}
                    onChange={handleAdditionalResourceSelection}
                    disabled={loadingDropdownData}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(option =>
                        (option.displayName && option.displayName.toLowerCase().includes(inputValue.toLowerCase())) ||
                        (option.name && option.name.toLowerCase().includes(inputValue.toLowerCase())) ||
                        (option.description && option.description.toLowerCase().includes(inputValue.toLowerCase())) ||
                        (option.type && option.type.toLowerCase().includes(inputValue.toLowerCase())) ||
                        (option.priority && option.priority.toLowerCase().includes(inputValue.toLowerCase())) ||
                        (option.category && option.category.toLowerCase().includes(inputValue.toLowerCase()))
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Additional Resources"
                        placeholder="Search additional resources by name, description, type, or priority"
                        sx={{ bgcolor: 'white' }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={option.id}
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
                        <Box component="li" key={option.id} {...otherProps}>
                          <Checkbox
                            checked={selected}
                            sx={{ mr: 1 }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', py: 0.5 }}>
                            <ResourceIcon
                              color="secondary"
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
                  {selectedAdditionalResources.length > 0 ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Selected Additional Resources ({selectedAdditionalResources.length})
                        </Typography>
                        <Button
                          size="small"
                          onClick={handleClearAllAdditionalResources}
                          startIcon={<DeleteIcon />}
                        >
                          Clear All
                        </Button>
                      </Box>

                      <Box sx={{ maxHeight: 300, overflow: 'auto' }} key={`additional-resources-${selectedAdditionalResources.length}`}>
                        {selectedAdditionalResources.map((resourceId, index) => {
                          const resource = additionalResources.find(r => r.id === resourceId);
                          if (!resource) return null;

                          return (
                            <Box key={resourceId} sx={{ mb: 2 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  p: 2,
                                  border: '1px solid',
                                  borderColor: 'grey.200',
                                  borderRadius: 1,
                                  bgcolor: 'grey.50'
                                }}
                              >
                                <ResourceIcon color="secondary" sx={{ mr: 2 }} />
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="body2" fontWeight="600">
                                    {resource.displayName || resource.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {resource.description || 'No description'} • {resource.type} • Priority: {resource.priority || 'Normal'}
                                  </Typography>
                                </Box>
                                <Button
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => {
                                    setCurrentAdditionalResourceId(resourceId);
                                    setOpen(true);
                                  }}
                                  sx={{ mr: 1 }}
                                  variant="outlined"
                                >
                                  Add Attribute
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAdditionalResourceDelete(resourceId);
                                  }}
                                  sx={{ ml: 1 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              {/* Additional Resource Attributes */}
                              {selectedAdditionalResourceAttributes[resourceId] && Object.keys(selectedAdditionalResourceAttributes[resourceId]).length > 0 && (
                                <Box sx={{ mt: 2, pl: 6 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                                    Resource Attributes:
                                  </Typography>
                                  <Grid container spacing={1.5}>
                                    {Object.entries(selectedAdditionalResourceAttributes[resourceId]).map(([attrId, value]) => {
                                      const attribute = attributes.find(attr => attr.id === attrId);
                                      if (!attribute || !value || value === '') return null;

                                      return (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={attrId}>
                                          <Card sx={{ p: 1.5, bgcolor: 'white', border: '1px solid', borderColor: 'grey.200', height: '100%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                              <Typography variant="body2" fontWeight="600" color="secondary" noWrap sx={{ fontSize: '0.8rem', flex: 1, minWidth: 0 }}>
                                                {attribute.displayName}
                                              </Typography>
                                              <IconButton
                                                size="small"
                                                onClick={() => {
                                                  setSelectedAdditionalResourceAttributes(prev => {
                                                    const newAttributes = { ...prev };
                                                    if (newAttributes[resourceId]) {
                                                      delete newAttributes[resourceId][attrId];
                                                      if (Object.keys(newAttributes[resourceId]).length === 0) {
                                                        delete newAttributes[resourceId];
                                                      }
                                                    }
                                                    return newAttributes;
                                                  });
                                                }}
                                                sx={{
                                                  color: 'text.secondary',
                                                  p: 0.5,
                                                  ml: 0.5,
                                                  '&:hover': {
                                                    color: 'error.main',
                                                    bgcolor: 'error.50'
                                                  }
                                                }}
                                              >
                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                              </IconButton>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                              {Array.isArray(value) ? value.join(', ') : String(value)}
                                            </Typography>
                                          </Card>
                                        </Grid>
                                      );
                                    })}
                                  </Grid>
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 200,
                      border: '2px dashed',
                      borderColor: 'grey.300',
                      borderRadius: 2,
                      bgcolor: 'grey.50'
                    }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <ResourceIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          No additional resources selected
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Additional resources are optional for complex policies
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Card>
        );

      case 5:
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
                      )}
                      {selectedAdditionalResources.length > 0 && (
                        <span>
                          {' '}if{' '}
                          <strong style={{ color: '#2e7d32' }}>
                            {selectedAdditionalResources.length === 1
                              ? additionalResources.find(r => r.id === selectedAdditionalResources[0])?.displayName
                              : selectedAdditionalResources.length === 2
                                ? `${additionalResources.find(r => r.id === selectedAdditionalResources[0])?.displayName} and ${additionalResources.find(r => r.id === selectedAdditionalResources[1])?.displayName}`
                                : `${selectedAdditionalResources.slice(0, -1).map(id => additionalResources.find(r => r.id === id)?.displayName).join(', ')}, and ${additionalResources.find(r => r.id === selectedAdditionalResources[selectedAdditionalResources.length - 1])?.displayName}`
                            }
                          </strong>
                        </span>
                      )}.
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
    <ProtectedRoute>
      <RoleProtection allowedRoles={['admin', 'super_admin']}>
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
                  onClick={handleCancelClick}
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

          {/* Cancel Confirmation Dialog */}
          <Dialog open={cancelDialogOpen} onClose={handleCancelCancel} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ pb: 1 }}>
              Cancel Policy Edit
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" color="text.secondary">
                Are you sure you want to cancel editing this policy? All your changes will be lost and cannot be recovered.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={handleCancelCancel} variant="outlined">
                Continue Editing
              </Button>
              <Button onClick={handleCancelConfirm} variant="contained" color="error">
                Yes, Cancel
              </Button>
            </DialogActions>
          </Dialog>

          {/* Attribute Creation Dialog */}
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

                    {/* Date Values */}
                    {selectedDataType === 'date' && (
                      <Box>
                        <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                          Add Permitted Date/Time Values
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Choose input type:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {[
                              { key: 'single', label: 'Single Date/Time', desc: 'Specific date and time' },
                              { key: 'range', label: 'Date Range', desc: 'From date to date' },
                              { key: 'period', label: 'Time Period', desc: 'Daily time period' }
                            ].map((option) => (
                              <Button
                                key={option.key}
                                variant={dateInputType === option.key ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() => setDateInputType(option.key as 'single' | 'range' | 'period')}
                                sx={{
                                  textTransform: 'none',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  py: 1,
                                  minWidth: '100px'
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {option.label}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                                  {option.desc}
                                </Typography>
                              </Button>
                            ))}
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          {dateInputType === 'single' && (
                            <Box>
                              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <TextField
                                  type="date"
                                  size="small"
                                  sx={{ flex: 1 }}
                                  inputProps={{ 'data-single-date': true }}
                                />
                                <TextField
                                  type="time"
                                  size="small"
                                  sx={{ flex: 1 }}
                                  inputProps={{ 'data-single-time': true }}
                                />
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => {
                                    const dateInput = document.querySelector('[data-single-date]') as HTMLInputElement;
                                    const timeInput = document.querySelector('[data-single-time]') as HTMLInputElement;
                                    if (dateInput?.value) {
                                      const label = timeInput?.value
                                        ? `${dateInput.value} ${timeInput.value}`
                                        : `${dateInput.value} (All day)`;
                                      handleFlexibleDateAdd(label);
                                      dateInput.value = '';
                                      if (timeInput) timeInput.value = '';
                                    }
                                  }}
                                >
                                  Add
                                </Button>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Add specific date and optional time
                              </Typography>
                            </Box>
                          )}

                          {dateInputType === 'range' && (
                            <Box>
                              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <TextField
                                  type="date"
                                  size="small"
                                  placeholder="From"
                                  sx={{ flex: 1 }}
                                  inputProps={{ 'data-from-date': true }}
                                />
                                <TextField
                                  type="date"
                                  size="small"
                                  placeholder="To"
                                  sx={{ flex: 1 }}
                                  inputProps={{ 'data-to-date': true }}
                                />
                                <TextField
                                  type="time"
                                  size="small"
                                  placeholder="Time (optional)"
                                  sx={{ flex: 1 }}
                                  inputProps={{ 'data-range-time': true }}
                                />
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => {
                                    const fromInput = document.querySelector('[data-from-date]') as HTMLInputElement;
                                    const toInput = document.querySelector('[data-to-date]') as HTMLInputElement;
                                    const timeInput = document.querySelector('[data-range-time]') as HTMLInputElement;
                                    if (fromInput?.value && toInput?.value) {
                                      const timeStr = timeInput?.value ? ` at ${timeInput.value}` : ' (All day)';
                                      const label = `${fromInput.value} to ${toInput.value}${timeStr}`;
                                      handleFlexibleDateAdd(label);
                                      fromInput.value = '';
                                      toInput.value = '';
                                      if (timeInput) timeInput.value = '';
                                    }
                                  }}
                                >
                                  Add Range
                                </Button>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Add date range with optional time
                              </Typography>
                            </Box>
                          )}

                          {dateInputType === 'period' && (
                            <Box>
                              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <TextField
                                  type="time"
                                  size="small"
                                  placeholder="From Time"
                                  sx={{ flex: 1 }}
                                  inputProps={{ 'data-from-time': true }}
                                />
                                <TextField
                                  type="time"
                                  size="small"
                                  placeholder="To Time"
                                  sx={{ flex: 1 }}
                                  inputProps={{ 'data-to-time': true }}
                                />
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                  <InputLabel>Days (Optional)</InputLabel>
                                  <Select
                                    multiple
                                    value={selectedDays}
                                    onChange={(e) => setSelectedDays(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                    label="Days (Optional)"
                                    renderValue={(selected) => (
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                          <Chip key={value} label={value} size="small" />
                                        ))}
                                      </Box>
                                    )}
                                  >
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                      <MenuItem key={day} value={day}>
                                        <Checkbox checked={selectedDays.indexOf(day) > -1} />
                                        <ListItemText primary={day} />
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => {
                                    const fromTimeInput = document.querySelector('[data-from-time]') as HTMLInputElement;
                                    const toTimeInput = document.querySelector('[data-to-time]') as HTMLInputElement;
                                    if (fromTimeInput?.value && toTimeInput?.value) {
                                      const daysStr = selectedDays.length > 0 ? ` on ${selectedDays.join(', ')}` : ' (Daily)';
                                      const label = `${fromTimeInput.value} - ${toTimeInput.value}${daysStr}`;
                                      handleFlexibleDateAdd(label);
                                      fromTimeInput.value = '';
                                      toTimeInput.value = '';
                                      setSelectedDays([]);
                                    }
                                  }}
                                >
                                  Add Period
                                </Button>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Add recurring time periods (e.g., business hours, lunch break)
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Selected Values */}
                        {dateValues.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              Selected date/time values:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {dateValues.map((value, index) => (
                                <Chip
                                  key={index}
                                  label={value}
                                  size="small"
                                  color="info"
                                  onDelete={() => handleDateValuesRemove(index)}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Array Values */}
                    {selectedDataType === 'array' && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                            Array Values
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {arrayValues.length} value{arrayValues.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>

                        {arrayValues.length > 0 && (
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              mb: 2,
                              maxHeight: '200px',
                              overflow: 'auto',
                              bgcolor: 'grey.50',
                              border: '1px solid',
                              borderColor: 'grey.200'
                            }}
                          >
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {arrayValues.map((value, index) => {
                                const displayValue = String(value);
                                const truncatedValue = displayValue.length > 30 ? displayValue.substring(0, 30) + '...' : displayValue;

                                return (
                                  <Chip
                                    key={index}
                                    label={truncatedValue}
                                    size="small"
                                    color="primary"
                                    variant="filled"
                                    onDelete={() => handleArrayValuesRemove(index)}
                                    sx={{
                                      maxWidth: '200px',
                                      fontSize: '0.75rem',
                                      '& .MuiChip-label': {
                                        fontFamily: 'Monaco, "Lucida Console", monospace'
                                      }
                                    }}
                                  />
                                );
                              })}
                            </Box>
                          </Paper>
                        )}

                        <TextField
                          fullWidth
                          label="Array Values (JSON)"
                          value={permittedValues}
                          onChange={(e) => {
                            setPermittedValues(e.target.value);
                            try {
                              const parsed = JSON.parse(e.target.value);
                              if (Array.isArray(parsed)) {
                                setArrayValues(parsed.map(v => String(v)));
                                setParsedValues(parsed);
                              }
                            } catch (error) {
                              // Invalid JSON
                            }
                          }}
                          placeholder='["item1", "item2", "item3"]'
                          multiline
                          rows={3}
                          InputProps={{
                            sx: {
                              fontFamily: 'Monaco, "Lucida Console", monospace',
                              fontSize: '0.85rem'
                            }
                          }}
                        />
                      </Box>
                    )}

                    {/* Object Values */}
                    {selectedDataType === 'object' && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                            Object Values
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {objectValues.length} value{objectValues.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>

                        {objectValues.length > 0 && (
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              mb: 2,
                              maxHeight: '200px',
                              overflow: 'auto',
                              bgcolor: 'grey.50',
                              border: '1px solid',
                              borderColor: 'grey.200'
                            }}
                          >
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {objectValues.map((value, index) => {
                                const displayValue = String(value);
                                const truncatedValue = displayValue.length > 30 ? displayValue.substring(0, 30) + '...' : displayValue;

                                return (
                                  <Chip
                                    key={index}
                                    label={truncatedValue}
                                    size="small"
                                    color="primary"
                                    variant="filled"
                                    onDelete={() => handleObjectValuesRemove(index)}
                                    sx={{
                                      maxWidth: '200px',
                                      fontSize: '0.75rem',
                                      '& .MuiChip-label': {
                                        fontFamily: 'Monaco, "Lucida Console", monospace'
                                      }
                                    }}
                                  />
                                );
                              })}
                            </Box>
                          </Paper>
                        )}

                        <TextField
                          fullWidth
                          label="Object Values (JSON)"
                          value={permittedValues}
                          onChange={(e) => {
                            setPermittedValues(e.target.value);
                            try {
                              const parsed = JSON.parse(e.target.value);
                              if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                                setObjectValues(Object.keys(parsed).map(k => String(k)));
                                setParsedValues([parsed]);
                              }
                            } catch (error) {
                              // Invalid JSON
                            }
                          }}
                          placeholder='{"key": "value", "name": "example"}'
                          multiline
                          rows={3}
                          InputProps={{
                            sx: {
                              fontFamily: 'Monaco, "Lucida Console", monospace',
                              fontSize: '0.85rem'
                            }
                          }}
                        />
                      </Box>
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

          {/* Create Value Dialog */}
          <Dialog
            open={showCreateValue !== null}
            onClose={() => setShowCreateValue(null)}
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
              position: 'relative',
              borderBottom: '1px solid',
              borderColor: 'grey.200'
            }}>
              Add New Value
              <IconButton
                onClick={() => {
                  setShowCreateValue(null);
                  setNewValueData('');
                }}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: 16,
                  color: 'grey.500',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ px: 3, pt: 2, pb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5 }}>
                {showCreateValue && (() => {
                  const attribute = attributes.find(attr => attr.id === showCreateValue);
                  return `Add a new value to the "${attribute?.displayName || 'selected'}" attribute. This value will be available for selection in policy conditions.`;
                })()}
              </Typography>
              <TextField
                fullWidth
                label="New Value"
                value={newValueData}
                onChange={(e) => setNewValueData(e.target.value)}
                placeholder="Enter value..."
                helperText="This value will be added to the attribute's permitted values"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    bgcolor: 'grey.50'
                  }
                }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
              <Button
                onClick={() => {
                  setShowCreateValue(null);
                  setNewValueData('');
                }}
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
                onClick={() => {
                  if (showCreateValue) {
                    handleCreateValue(showCreateValue);
                  }
                }}
                variant="contained"
                disabled={!newValueData.trim()}
                sx={{
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                }}
              >
                Add Value
              </Button>
            </DialogActions>
          </Dialog>
        </DashboardLayout>
      </RoleProtection>
    </ProtectedRoute>
  );
}