'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Avatar,
  Switch,
  FormControlLabel,
  TablePagination,
  Popover,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Toolbar,
  Tooltip,
  InputAdornment,
  OutlinedInput,
  ListItemIcon,
  Autocomplete,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Security as PolicyIcon,
  Security as SecurityIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  PlayArrow as ActionIcon,
  Storage as ResourceIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Description as FileIcon,
  FolderOpen,
  Settings as SystemIcon,
  MoreHoriz as MoreIcon,
  SelectAll as SelectAllIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  DeleteSweep as BulkDeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  Clear as ClearIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/types';

interface Policy {
  _id: string;
  id: string;
  name: string;
  description?: string;
  effect: 'Allow' | 'Deny';
  status: 'Active' | 'Inactive' | 'Draft';
  priority: number;
  rules: any[];
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    isSystem: boolean;
    isCustom: boolean;
    version: string;
  };
  createdAt: string;
  updatedAt: string;
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

export default function PoliciesPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [description, setDescription] = useState('');
  
  // Search, Filter, Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewPolicy, setViewPolicy] = useState<Policy | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePolicy, setDeletePolicy] = useState<Policy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  
  // Form state for policy creation
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  
  // Data for dropdowns
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [actions, setActions] = useState<ActionObject[]>([]);
  const [resources, setResources] = useState<ResourceObject[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loadingDropdownData, setLoadingDropdownData] = useState(false);
  
  // Attribute selection for subjects and resources
  const [subjectAttributes, setSubjectAttributes] = useState<Record<string, any>>({});
  const [resourceAttributes, setResourceAttributes] = useState<Record<string, Record<string, any>>>({});
  const [selectedSubjectAttributes, setSelectedSubjectAttributes] = useState<{ [key: string]: any }>({});
  
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

  // Fetch policies from API
  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, any> = {
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
      };
      
      if (searchTerm?.trim()) {
        params.search = searchTerm.trim();
      }
      
      console.log('Fetching policies with params:', params);
      const response: ApiResponse<Policy[]> = await apiClient.get('/policies', params);
      console.log('Policies response:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch policies');
      }
      
      setPolicies(response.data || []);
      setTotal(response.pagination?.total || 0);
      
    } catch (err: any) {
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url,
        method: err.config?.method
      });
      
      const errorMessage = err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to load policies';
      
      setError(errorMessage);
      
      // Fallback to empty array on error
      setPolicies([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortOrder, searchTerm]);

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
        setSubjects(subjectsResponse.data);
      }
      if (actionsResponse.success && actionsResponse.data) {
        setActions(actionsResponse.data);
      }
      if (resourcesResponse.success && resourcesResponse.data) {
        setResources(resourcesResponse.data);
      }
      if (attributesResponse.success && attributesResponse.data) {
        setAttributes(attributesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    } finally {
      setLoadingDropdownData(false);
    }
  }, []);

  // Helper function to get available subject attributes
  const getSubjectAttributeOptions = (subject: Subject) => {
    return {
      type: subject.type,
      role: subject.role,
      department: subject.department,
      status: subject.status,
      email: subject.email
    };
  };

  // Helper function to get available resource attributes  
  const getResourceAttributeOptions = (resource: ResourceObject) => {
    return {
      type: resource.type,
      uri: resource.uri,
      permissions: resource.permissions,
      ...resource.attributes
    };
  };

  // Handle subject attribute changes
  const handleSubjectAttributeChange = (attribute: string, value: any) => {
    setSubjectAttributes(prev => ({
      ...prev,
      [attribute]: value
    }));
  };

  // Handle resource attribute changes
  const handleResourceAttributeChange = (resourceId: string, attribute: string, value: any) => {
    setResourceAttributes(prev => ({
      ...prev,
      [resourceId]: {
        ...prev[resourceId],
        [attribute]: value
      }
    }));
  };

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
        // Refresh attributes
        await fetchDropdownData();
        setShowCreateAttribute(false);
        // Reset form
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

      // Update the attribute's enumValues
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
        // Refresh attributes
        await fetchDropdownData();
        setShowCreateValue(null);
        setNewValueData('');
      }
    } catch (error) {
      console.error('Error creating value:', error);
      setError('Failed to create value. Please try again.');
    }
  };

  useEffect(() => {
    if (searchTerm !== '') {
      const timeoutId = setTimeout(() => {
        setPage(0);
        fetchPolicies();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      fetchPolicies();
      return () => {}; // Empty cleanup function for consistency
    }
  }, [fetchPolicies]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(0); // Reset to first page
  }, []);

  const handleSort = (property: string) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setPage(0);
  }, []);

  // Dialog handlers
  const handleClickOpen = useCallback((policy?: Policy) => {
    if (policy) {
      setSelectedPolicy(policy);
      setDisplayName(policy.name);
      setDescription(policy.description || '');
      // TODO: Parse existing policy rules to populate form fields
    } else {
      setSelectedPolicy(null);
      setDisplayName('');
      setDescription('');
      setSelectedSubject('');
      setSelectedActions([]);
      setSelectedResources([]);
      setSubjectAttributes({});
      setResourceAttributes({});
    }
    setDisplayNameError('');
    
    // Load dropdown data when opening modal
    fetchDropdownData();
    
    setOpen(true);
  }, [fetchDropdownData]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedPolicy(null);
    setDisplayName('');
    setDescription('');
    setSelectedSubject('');
    setSelectedActions([]);
    setSelectedResources([]);
    setSubjectAttributes({});
    setResourceAttributes({});
    setDisplayNameError('');
  }, []);

  const handleViewPolicy = useCallback((policy: Policy) => {
    router.push(`/policies/${policy.id}`);
  }, [router]);

  const handleEditPolicy = useCallback((policy: Policy) => {
    router.push(`/policies/${policy.id}/edit`);
  }, [router]);

  const handleDeleteOpen = useCallback((policy: Policy) => {
    setDeletePolicy(policy);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteOpen(false);
    setDeletePolicy(null);
  }, []);

  const handleDelete = async () => {
    if (!deletePolicy) return;
    
    try {
      setIsDeleting(true);
      
      console.log('Deleting policy:', deletePolicy.id);
      const response = await apiClient.delete(`/policies/${deletePolicy.id}`);
      console.log('Delete response:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete policy');
      }
      
      handleDeleteClose();
      fetchPolicies();
      
    } catch (err: any) {
      console.error('Error deleting policy:', err);
      setError(err.message || 'Failed to delete policy');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async () => {
    if (!displayName.trim() || displayNameError) {
      return;
    }

    // Validation for required fields
    if (!selectedSubject) {
      alert('Please select a subject');
      return;
    }
    if (selectedActions.length === 0) {
      alert('Please select at least one action');
      return;
    }
    if (selectedResources.length === 0) {
      alert('Please select at least one resource');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build policy rules based on selected items
      const rules = selectedActions.flatMap(actionId =>
        selectedResources.map(resourceId => {
          // Build conditions based on selected attributes
          const conditions: any = {};
          
          // Add subject attributes as conditions
          if (subjectAttributes && Object.keys(subjectAttributes).length > 0) {
            if (subjectAttributes.type) conditions.subjectType = subjectAttributes.type;
            if (subjectAttributes.status) conditions.subjectStatus = subjectAttributes.status;
            if (subjectAttributes.department) conditions.subjectDepartment = subjectAttributes.department;
            if (subjectAttributes.role) conditions.subjectRole = subjectAttributes.role;
          }
            
            // Add resource attributes as conditions
            if (resourceAttributes[resourceId]) {
              const resourceAttrs = resourceAttributes[resourceId];
              if (resourceAttrs.type) conditions.resourceType = resourceAttrs.type;
              if (resourceAttrs.uri) conditions.resourceUriPattern = resourceAttrs.uri;
              if (resourceAttrs.permissions) {
                conditions.resourcePermissions = resourceAttrs.permissions;
              }
            }

          return {
            subject: selectedSubject,
            action: actionId,
            resource: resourceId,
            condition: conditions,
            environment: {}
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
      };

      if (selectedPolicy) {
        // Update existing policy
        const response = await apiClient.put(`/policies/${selectedPolicy.id}`, policyData);
        
        if (response.success) {
          // Refresh the data by calling fetchPolicies
          await fetchPolicies();
        }
      } else {
        // Create new policy
        const response = await apiClient.post('/policies', policyData);
        
        if (response.success) {
          // Refresh the data by calling fetchPolicies
          await fetchPolicies();
        }
      }
      
      handleClose();
    } catch (error: any) {
      console.error('Failed to save policy:', error);
      setError('Failed to save policy. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Multi-select handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = policies.map(policy => policy._id);
      setSelectedPolicies(newSelected);
    } else {
      setSelectedPolicies([]);
    }
  };

  const handleSelectPolicy = (policyId: string) => {
    const selectedIndex = selectedPolicies.indexOf(policyId);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedPolicies, policyId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedPolicies.slice(1));
    } else if (selectedIndex === selectedPolicies.length - 1) {
      newSelected = newSelected.concat(selectedPolicies.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedPolicies.slice(0, selectedIndex),
        selectedPolicies.slice(selectedIndex + 1),
      );
    }

    setSelectedPolicies(newSelected);
  };

  const handleBulkDeleteOpen = useCallback(() => {
    setBulkDeleteOpen(true);
  }, []);

  const handleBulkDeleteClose = useCallback(() => {
    setBulkDeleteOpen(false);
  }, []);

  const handleBulkDelete = async () => {
    try {
      setIsDeleting(true);
      
      console.log('Bulk deleting policies:', selectedPolicies);
      const response = await apiClient.delete('/policies/bulk/delete', {
        policyIds: selectedPolicies
      });
      console.log('Bulk delete response:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete policies');
      }
      
      setSelectedPolicies([]);
      handleBulkDeleteClose();
      fetchPolicies();
      
    } catch (err: any) {
      console.error('Error bulk deleting policies:', err);
      setError(err.message || 'Failed to delete policies');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = searchTerm.length > 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'read': return <ViewIcon />;
      case 'write': return <EditIcon />;
      case 'execute': return <PolicyIcon />;
      case 'delete': return <DeleteIcon />;
      case 'admin': return <SystemIcon />;
      default: return <PolicyIcon />;
    }
  };

  const getCategoryColor = (category: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (category) {
      case 'read': return 'info';
      case 'write': return 'primary';
      case 'execute': return 'secondary';
      case 'delete': return 'error';
      case 'admin': return 'warning';
      default: return 'default';
    }
  };

  const getRiskColor = (riskLevel: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (riskLevel) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PolicyIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="h5" component="h1" fontWeight="600">
              Policies
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" color="primary.main" fontWeight="600">
              {loading ? '...' : total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Policies
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Manage system policies and operations in your permission system.
          {hasActiveFilters && (
            <Typography component="span" variant="body2" color="primary.main" sx={{ ml: 1 }}>
              (Filtered)
            </Typography>
          )}
        </Typography>
      </Paper>

      {/* Filter Bar */}
      {selectedPolicies.length === 0 && (
        <Paper elevation={0} sx={{ 
          p: 2, 
          mb: 3, 
          border: '1px solid',
          borderColor: 'grey.200',
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <TextField
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              size="small"
              sx={{ minWidth: '250px', flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Clear & Add buttons */}
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              {hasActiveFilters && (
                <Button
                  size="small"
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Clear
                </Button>
              )}
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => router.push('/policies/create')}
                sx={{ textTransform: 'none' }}
              >
                Create Policy
              </Button>
            </Box>
          </Box>

          {/* Active Filter Chips */}
          {hasActiveFilters && searchTerm && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={`Search: "${searchTerm}"`}
                onDelete={clearFilters}
                size="small"
                color="primary"
              />
            </Box>
          )}
        </Paper>
      )}

      {/* Selected Policies Toolbar */}
      {selectedPolicies.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1" fontWeight="500" color="primary.main">
              {selectedPolicies.length} polic{selectedPolicies.length === 1 ? 'y' : 'ies'} selected
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={() => setSelectedPolicies([])}
                sx={{ color: 'text.secondary' }}
              >
                Clear selection
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<BulkDeleteIcon />}
                onClick={handleBulkDeleteOpen}
              >
                Delete Selected
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Policies Table */}
      <Card variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell padding="checkbox" sx={{ width: '48px' }}>
                  <Checkbox
                    color="primary"
                    indeterminate={selectedPolicies.length > 0 && selectedPolicies.length < policies.length}
                    checked={policies.length > 0 && selectedPolicies.length === policies.length}
                    onChange={handleSelectAll}
                    size="small"
                  />
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.875rem', 
                    color: 'text.primary',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                  onClick={() => handleSort('displayName')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Name & Description
                    {sortBy === 'displayName' && (
                      sortOrder === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', width: '120px' }}>
                  Policies
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Loading policies...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="error" variant="body1">
                      {error}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : policies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No policies found
                    </Typography>
                    {hasActiveFilters && (
                      <Button
                        size="small"
                        onClick={clearFilters}
                        sx={{ mt: 1 }}
                      >
                        Clear filters to see all policies
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                policies.map((policy) => {
                  const isItemSelected = selectedPolicies.includes(policy._id);
                  return (
                    <TableRow
                      key={policy._id}
                      hover
                      selected={isItemSelected}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onChange={() => handleSelectPolicy(policy._id)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              width: 40, 
                              height: 40, 
                              bgcolor: `primary.main`,
                              color: 'white'
                            }}
                          >
                            P
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="subtitle2" 
                              fontWeight="500" 
                              color="text.primary"
                              sx={{ mb: 0.5 }}
                            >
                              {policy.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {policy.description || 'No description available'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewPolicy(policy)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditPolicy(policy)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteOpen(policy)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.875rem',
              color: 'text.secondary',
            },
          }}
        />
      </Card>

      {/* Floating Policy Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => router.push('/policies/create')}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Edit Policy Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            m: 2,
          }
        }}
      >
        <DialogTitle sx={{
          pb: 2,
          pt: 3,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'white',
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SecurityIcon sx={{ fontSize: 28, color: 'white' }} />
            <Box>
              <Typography variant="h5" fontWeight="600" color="white">
                Edit Policy
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
                Modify access control rules
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Step 1: Basic Information */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" color="primary" fontWeight="600">
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginRight: 8
                  }}>1</span>
                  Basic Information
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Policy Name"
                  value={displayName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDisplayName(value);
                    if (value.trim().length < 2) {
                      setDisplayNameError('Name must be at least 2 characters long.');
                    } else {
                      setDisplayNameError('');
                    }
                  }}
                  variant="outlined"
                  placeholder="e.g., HR Department File Access Policy"
                  error={!!displayNameError}
                  helperText={displayNameError || 'Enter a clear, descriptive name for this policy'}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <PolicyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </Box>
                    )
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  variant="outlined"
                  placeholder="Describe what this policy controls and why it's needed"
                  multiline
                  rows={2}
                  helperText="Optional: Help others understand the purpose and scope of this policy"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'flex-start', pt: 1 }}>
                        <DescriptionIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </Box>
                    )
                  }}
                />
              </Box>
            </Paper>



            {/* Step 2: Subject Selection */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" color="primary" fontWeight="600">
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginRight: 8
                  }}>2</span>
                  Subject Selection
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose who this policy applies to and specify any additional conditions
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Select Subject</InputLabel>
                    <Select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      label="Select Subject"
                      disabled={loadingDropdownData}
                      startAdornment={
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </Box>
                      }
                    >
                      {subjects.map((subject) => (
                        <MenuItem key={subject.id} value={subject.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: subject.type === 'user' ? 'primary.main' : 
                                         subject.type === 'group' ? 'secondary.main' : 'warning.main',
                                fontSize: '14px'
                              }}
                            >
                              {subject.displayName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2" fontWeight="500">
                                {subject.displayName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {subject.email} • {subject.type} • {subject.department}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {!selectedSubject && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Choose a user, group, or role that this policy will govern
                        </Typography>
                      </Box>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  {selectedSubject ? (
                    <Box>
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="subtitle2" color="primary.main" fontWeight="600">
                          Subject Attributes & Conditions
                        </Typography>
                        <Button 
                          size="small" 
                          startIcon={<AddIcon />}
                          onClick={() => setShowCreateAttribute(true)}
                          sx={{ ml: 'auto', fontSize: '0.75rem' }}
                        >
                          New Attribute
                        </Button>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                        Configure dynamic attributes and conditions for {subjects.find(s => s.id === selectedSubject)?.displayName}
                      </Typography>
                      
                      <Accordion defaultExpanded sx={{ mb: 1, bgcolor: 'white', border: '1px solid', borderColor: 'grey.200' }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ 
                            '& .MuiAccordionSummary-content': { 
                              alignItems: 'center' 
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: subjects.find(s => s.id === selectedSubject)?.type === 'user' ? 'primary.main' : 
                                         subjects.find(s => s.id === selectedSubject)?.type === 'group' ? 'secondary.main' : 'warning.main',
                                fontSize: '12px'
                              }}
                            >
                              {subjects.find(s => s.id === selectedSubject)?.displayName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="subtitle2" fontWeight="500">
                              {subjects.find(s => s.id === selectedSubject)?.displayName} - Dynamic Attributes
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 2 }}>
                          <Grid container spacing={2}>
                            {attributes
                              .filter(attr => attr.category === 'subject' && attr.active)
                              .map((attribute) => (
                                <Grid key={attribute.id} size={{ xs: 12, md: 6 }}>
                                  <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                      <Typography variant="body2" fontWeight="500">
                                        {attribute.displayName}
                                      </Typography>
                                      {attribute.isRequired && (
                                        <Typography variant="caption" color="error">
                                          *
                                        </Typography>
                                      )}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                      {attribute.description}
                                    </Typography>
                                    
                                    {attribute.dataType === 'string' && attribute.constraints.enumValues ? (
                                      <FormControl fullWidth size="small">
                                        <InputLabel>{attribute.displayName}</InputLabel>
                                        <Select
                                          value={attribute.isMultiValue 
                                            ? (selectedSubjectAttributes[attribute.id] || []) 
                                            : (selectedSubjectAttributes[attribute.id] || '')
                                          }
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            if (attribute.isMultiValue && Array.isArray(value)) {
                                              // Handle multi-value case - check if __add_new_value__ is in the array
                                              if (value.includes('__add_new_value__')) {
                                                // Remove the special value and open modal
                                                const filteredValue = value.filter(v => v !== '__add_new_value__');
                                                handleSubjectAttributeSelection(attribute.id, filteredValue);
                                                setShowCreateValue(attribute.id);
                                              } else {
                                                handleSubjectAttributeSelection(attribute.id, value);
                                              }
                                            } else if (!attribute.isMultiValue && value === '__add_new_value__') {
                                              setShowCreateValue(attribute.id);
                                            } else {
                                              handleSubjectAttributeSelection(attribute.id, value);
                                            }
                                          }}
                                          label={attribute.displayName}
                                          multiple={attribute.isMultiValue}
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
                                              bgcolor: 'grey.50',
                                              borderTop: '1px solid',
                                              borderColor: 'grey.200',
                                              '&:hover': {
                                                bgcolor: 'primary.50'
                                              }
                                            }}
                                          >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                                              <AddIcon fontSize="small" />
                                              <Typography variant="body2" color="primary.main">
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
                                          label={attribute.displayName}
                                        />
                                      </FormControl>
                                    ) : attribute.dataType === 'number' ? (
                                      <TextField
                                        fullWidth
                                        type="number"
                                        label={attribute.displayName}
                                        value={selectedSubjectAttributes[attribute.id] || ''}
                                        onChange={(e) => handleSubjectAttributeSelection(attribute.id, Number(e.target.value))}
                                        size="small"
                                        inputProps={{
                                          min: attribute.constraints.minValue,
                                          max: attribute.constraints.maxValue
                                        }}
                                      />
                                    ) : (
                                      <TextField
                                        fullWidth
                                        label={attribute.displayName}
                                        value={selectedSubjectAttributes[attribute.id] || ''}
                                        onChange={(e) => handleSubjectAttributeSelection(attribute.id, e.target.value)}
                                        size="small"
                                        multiline={attribute.isMultiValue}
                                        rows={attribute.isMultiValue ? 3 : 1}
                                      />
                                    )}
                                  </Box>
                                </Grid>
                              ))}
                            
                            {attributes.filter(attr => attr.category === 'subject' && attr.active).length === 0 && (
                              <Grid size={{ xs: 12 }}>
                                <Box sx={{ 
                                  textAlign: 'center', 
                                  py: 3,
                                  border: '2px dashed',
                                  borderColor: 'grey.300',
                                  borderRadius: 1,
                                  bgcolor: 'grey.50'
                                }}>
                                  <Typography variant="body2" color="text.secondary">
                                    No subject attributes available.
                                  </Typography>
                                  <Button 
                                    size="small" 
                                    startIcon={<AddIcon />}
                                    onClick={() => setShowCreateAttribute(true)}
                                    sx={{ mt: 1 }}
                                  >
                                    Create First Attribute
                                  </Button>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  ) : (
                    <Box sx={{
                      p: 3,
                      border: '2px dashed',
                      borderColor: 'grey.300',
                      borderRadius: 2,
                      textAlign: 'center',
                      bgcolor: 'grey.25'
                    }}>
                      <PersonIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Select a subject above to configure additional conditions
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* Step 3: Actions Selection */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" color="primary" fontWeight="600">
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginRight: 8
                  }}>3</span>
                  What actions are allowed?
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select the specific actions that this policy will control. Actions define what operations can be performed.
              </Typography>
              
              <Autocomplete
                multiple
                options={actions}
                getOptionLabel={(option) => `${option.displayName} (${option.category})`}
                value={actions.filter(action => selectedActions.includes(action.id))}
                onChange={(event, newValue) => {
                  setSelectedActions(newValue.map(action => action.id));
                }}
                loading={loadingDropdownData}
                renderInput={(params) => {
                  const { InputProps, InputLabelProps, ...restParams } = params;
                  return (
                    <TextField
                      {...restParams}
                      label="Select Actions"
                      placeholder="Choose actions to allow or deny"
                      helperText="Select one or more actions that this policy will govern"
                      required
                      size="small"
                      InputProps={{
                        ...InputProps,
                        startAdornment: (
                          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            <ActionIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            {InputProps?.startAdornment}
                          </Box>
                        )
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  );
                }}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box component="li" key={key} {...optionProps} sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: getCategoryColor(option.category) + '.50',
                          color: getCategoryColor(option.category) + '.main'
                        }}>
                          {getCategoryIcon(option.category)}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight="500">
                            {option.displayName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={option.category}
                              size="small"
                              color={getCategoryColor(option.category)}
                              sx={{ fontSize: '10px', height: 18 }}
                            />
                            <Chip
                              label={`${option.riskLevel} risk`}
                              size="small"
                              color={getRiskColor(option.riskLevel)}
                              sx={{ fontSize: '10px', height: 18 }}
                            />
                          </Box>
                          {option.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {option.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                }}
              />
              
              {/* Selected Actions Preview */}
              {selectedActions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ActionIcon sx={{ fontSize: 16 }} />
                    Selected Actions ({selectedActions.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedActions.map(actionId => {
                      const action = actions.find(a => a.id === actionId);
                      return action ? (
                        <Chip
                          key={actionId}
                          label={action.displayName}
                          color={getCategoryColor(action.category)}
                          size="small"
                          variant="outlined"
                          icon={getCategoryIcon(action.category)}
                          onDelete={() => setSelectedActions(prev => prev.filter(id => id !== actionId))}
                        />
                      ) : null;
                    })}
                  </Box>
                </Box>
              )}
              
              {selectedActions.length === 0 && (
                <Box sx={{
                  mt: 2,
                  p: 2,
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  textAlign: 'center',
                  bgcolor: 'grey.25'
                }}>
                  <ActionIcon sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No actions selected. Choose actions from the dropdown above.
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Step 4: Resources Selection */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" color="primary" fontWeight="600">
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginRight: 8
                  }}>4</span>
                  On which resources?
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose the specific files, documents, systems, or applications that this policy will protect.
              </Typography>
              
              <Autocomplete
                multiple
                options={resources}
                getOptionLabel={(option) => `${option.displayName} (${option.type})`}
                value={resources.filter(resource => selectedResources.includes(resource.id))}
                onChange={(event, newValue) => {
                  setSelectedResources(newValue.map(resource => resource.id));
                }}
                loading={loadingDropdownData}
                renderInput={(params) => {
                  const { InputProps, InputLabelProps, ...restParams } = params;
                  return (
                    <TextField
                      {...restParams}
                      label="Select Resources"
                      placeholder="Choose files, documents, systems, or applications"
                      helperText="Select one or more resources that this policy will control access to"
                      required
                      size="small"
                      InputProps={{
                        ...InputProps,
                        startAdornment: (
                          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            <ResourceIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            {InputProps?.startAdornment}
                          </Box>
                        )
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  );
                }}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  const getResourceIcon = (type: string) => {
                    switch (type) {
                      case 'file': return <FileIcon />;
                      case 'document': return <DescriptionIcon />;
                      case 'folder': return <FolderOpen />;
                      case 'api': return <SystemIcon />;
                      case 'database': return <ResourceIcon />;
                      case 'service': return <SystemIcon />;
                      case 'application': return <SystemIcon />;
                      default: return <ResourceIcon />;
                    }
                  };
                  
                  const getResourceColor = (type: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
                    switch (type) {
                      case 'file': return 'info';
                      case 'document': return 'primary';
                      case 'folder': return 'warning';
                      case 'api': return 'secondary';
                      case 'database': return 'success';
                      case 'service': return 'secondary';
                      case 'application': return 'primary';
                      default: return 'primary';
                    }
                  };
                  
                  return (
                    <Box component="li" key={key} {...optionProps} sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: getResourceColor(option.type) + '.50',
                          color: getResourceColor(option.type) + '.main'
                        }}>
                          {getResourceIcon(option.type)}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight="500">
                            {option.displayName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={option.type}
                              size="small"
                              color={getResourceColor(option.type)}
                              sx={{ fontSize: '10px', height: 18 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {option.uri}
                            </Typography>
                          </Box>
                          {option.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {option.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                }}
              />
              
              {/* Selected Resources Preview */}
              {selectedResources.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ResourceIcon sx={{ fontSize: 16 }} />
                    Selected Resources ({selectedResources.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedResources.map(resourceId => {
                      const resource = resources.find(r => r.id === resourceId);
                      const getResourceColor = (type: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
                        switch (type) {
                          case 'file': return 'info';
                          case 'document': return 'primary';
                          case 'folder': return 'warning';
                          case 'api': return 'secondary';
                          case 'database': return 'success';
                          case 'service': return 'secondary';
                          case 'application': return 'primary';
                          default: return 'primary';
                        }
                      };
                      return resource ? (
                        <Chip
                          key={resourceId}
                          label={resource.displayName}
                          color={getResourceColor(resource.type)}
                          size="small"
                          variant="outlined"
                          onDelete={() => setSelectedResources(prev => prev.filter(id => id !== resourceId))}
                        />
                      ) : null;
                    })}
                  </Box>
                </Box>
              )}
              
              {selectedResources.length === 0 && (
                <Box sx={{
                  mt: 2,
                  p: 2,
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  textAlign: 'center',
                  bgcolor: 'grey.25'
                }}>
                  <ResourceIcon sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No resources selected. Choose resources from the dropdown above.
                  </Typography>
                </Box>
              )}
            </Paper>


            {/* Resource Attributes Selection */}
            {selectedResources.length > 0 && (
              <Box>
                {selectedResources.map(resourceId => {
                  const resource = resources.find(r => r.id === resourceId);
                  if (!resource) return null;
                  
                  return (
                    <Accordion key={resourceId} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">
                          {resource.displayName} - Attributes
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6 }}>
                            <FormControl fullWidth>
                              <InputLabel>Type</InputLabel>
                              <Select
                                value={resourceAttributes[resourceId]?.type || ''}
                                onChange={(e) => handleResourceAttributeChange(resourceId, 'type', e.target.value)}
                                label="Type"
                              >
                                <MenuItem value="">Any</MenuItem>
                                <MenuItem value="file">File</MenuItem>
                                <MenuItem value="document">Document</MenuItem>
                                <MenuItem value="api">API</MenuItem>
                                <MenuItem value="database">Database</MenuItem>
                                <MenuItem value="service">Service</MenuItem>
                                <MenuItem value="folder">Folder</MenuItem>
                                <MenuItem value="application">Application</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <TextField
                              fullWidth
                              label="URI Pattern"
                              value={resourceAttributes[resourceId]?.uri || ''}
                              onChange={(e) => handleResourceAttributeChange(resourceId, 'uri', e.target.value)}
                              placeholder="e.g., /files/*, /documents/sensitive/* (leave empty for any URI)"
                            />
                          </Grid>
                          
                          {/* Permission Attributes */}
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                              Required Permissions (Optional)
                            </Typography>
                            <Grid container spacing={1}>
                              {['read', 'write', 'delete', 'execute', 'admin'].map(permission => (
                                <Grid size="auto" key={permission}>
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={resourceAttributes[resourceId]?.permissions?.[permission] || false}
                                        onChange={(e) => {
                                          const currentPermissions = resourceAttributes[resourceId]?.permissions || {};
                                          handleResourceAttributeChange(resourceId, 'permissions', {
                                            ...currentPermissions,
                                            [permission]: e.target.checked
                                          });
                                        }}
                                      />
                                    }
                                    label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                                  />
                                </Grid>
                              ))}
                            </Grid>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )}

            {/* Step 5: Policy Summary & Review */}
            {(selectedSubject || selectedActions.length > 0 || selectedResources.length > 0) && (
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" color="success.dark" fontWeight="600">
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#2e7d32',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginRight: 8
                    }}>5</span>
                    Policy Summary & Review
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="success.dark" sx={{ mb: 3, fontWeight: 500 }}>
                  Review your policy configuration before creating it
                </Typography>
                
                {/* Policy Overview */}
                <Box sx={{ 
                  p: 2.5, 
                  bgcolor: 'white', 
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'success.200',
                  mb: 2
                }}>
                  <Typography variant="subtitle1" color="primary.main" fontWeight="600" sx={{ mb: 1.5 }}>
                    Policy Overview
                  </Typography>
                  <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
                    This policy will <Chip label="ALLOW" color="success" size="small" sx={{ mx: 0.5 }} /> access for:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Subject Summary */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PersonIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="body2" color="text.primary">
                        <strong>{selectedSubject ? subjects.find(s => s.id === selectedSubject)?.displayName || 'Selected Subject' : 'No Subject Selected'}</strong>
                        {selectedSubject && (
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            ({subjects.find(s => s.id === selectedSubject)?.type} • {subjects.find(s => s.id === selectedSubject)?.department})
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                    
                    {/* Actions Summary */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <ActionIcon sx={{ color: 'secondary.main', fontSize: 20, mt: 0.25 }} />
                      <Box>
                        <Typography variant="body2" color="text.primary">
                          <strong>{selectedActions.length} Action{selectedActions.length !== 1 ? 's' : ''}</strong>
                        </Typography>
                        {selectedActions.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {selectedActions.slice(0, 3).map(actionId => {
                              const action = actions.find(a => a.id === actionId);
                              return action ? (
                                <Chip key={actionId} label={action.displayName} size="small" variant="outlined" sx={{ fontSize: '10px', height: 20 }} />
                              ) : null;
                            })}
                            {selectedActions.length > 3 && (
                              <Chip label={`+${selectedActions.length - 3} more`} size="small" variant="outlined" sx={{ fontSize: '10px', height: 20 }} />
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                    
                    {/* Resources Summary */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <ResourceIcon sx={{ color: 'warning.main', fontSize: 20, mt: 0.25 }} />
                      <Box>
                        <Typography variant="body2" color="text.primary">
                          <strong>{selectedResources.length} Resource{selectedResources.length !== 1 ? 's' : ''}</strong>
                        </Typography>
                        {selectedResources.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {selectedResources.slice(0, 3).map(resourceId => {
                              const resource = resources.find(r => r.id === resourceId);
                              return resource ? (
                                <Chip key={resourceId} label={resource.displayName} size="small" variant="outlined" sx={{ fontSize: '10px', height: 20 }} />
                              ) : null;
                            })}
                            {selectedResources.length > 3 && (
                              <Chip label={`+${selectedResources.length - 3} more`} size="small" variant="outlined" sx={{ fontSize: '10px', height: 20 }} />
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
                
                {/* Additional Conditions */}
                {(Object.keys(subjectAttributes).length > 0 || Object.keys(resourceAttributes).length > 0) && (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'white', 
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'warning.200'
                  }}>
                    <Typography variant="subtitle2" color="warning.dark" fontWeight="600" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SystemIcon sx={{ fontSize: 16 }} />
                      Additional Conditions Applied
                    </Typography>
                    
                    {Object.entries(subjectAttributes).map(([subjectId, attrs]) => {
                      const subject = subjects.find(s => s.id === subjectId);
                      if (!subject || !attrs || Object.keys(attrs).length === 0) return null;
                      
                      const conditions = Object.entries(attrs)
                        .filter(([key, value]) => value && value !== '')
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                        
                      if (!conditions) return null;
                      
                      return (
                        <Typography key={subjectId} variant="body2" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                          • <strong>Subject:</strong> {subject.displayName} must have {conditions}
                        </Typography>
                      );
                    })}
                    
                    {Object.entries(resourceAttributes).map(([resourceId, attrs]) => {
                      const resource = resources.find(r => r.id === resourceId);
                      if (!resource || !attrs || Object.keys(attrs).length === 0) return null;
                      
                      const conditions: string[] = [];
                      Object.entries(attrs).forEach(([key, value]) => {
                        if (key === 'permissions' && value && typeof value === 'object') {
                          const perms = Object.entries(value)
                            .filter(([perm, enabled]) => enabled)
                            .map(([perm]) => perm)
                            .join(', ');
                          if (perms) conditions.push(`permissions: ${perms}`);
                        } else if (value && value !== '') {
                          conditions.push(`${key}: ${value}`);
                        }
                      });
                        
                      if (conditions.length === 0) return null;
                      
                      return (
                        <Typography key={resourceId} variant="body2" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                          • <strong>Resource:</strong> {resource.displayName} must have {conditions.join(', ')}
                        </Typography>
                      );
                    })}
                  </Box>
                )}
                
                {/* Validation Status */}
                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {selectedSubject && selectedActions.length > 0 && selectedResources.length > 0 ? (
                    <>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        color: 'white'
                      }}>
                        ✓
                      </Box>
                      <Typography variant="body2" color="success.dark" fontWeight="500">
                        Policy is ready to be created
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: 'warning.main',
                        color: 'white'
                      }}>
                        !
                      </Box>
                      <Typography variant="body2" color="warning.dark" fontWeight="500">
                        Complete all required fields above to create the policy
                      </Typography>
                    </>
                  )}
                </Box>
              </Paper>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{
          px: 3,
          pb: 3,
          pt: 2,
          gap: 2,
          bgcolor: 'grey.50',
          borderTop: '1px solid',
          borderColor: 'grey.200',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {(!selectedSubject || selectedActions.length === 0 || selectedResources.length === 0) ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'warning.main'
                }} />
                <Typography variant="caption" color="text.secondary">
                  Please complete all required fields
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'success.main'
                }} />
                <Typography variant="caption" color="success.dark" fontWeight="500">
                  Policy ready to create
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              onClick={handleClose}
              variant="outlined"
              disabled={isSubmitting}
              size="large"
              sx={{
                textTransform: 'none',
                minWidth: 100,
                borderColor: 'grey.300',
                color: 'text.secondary',
                fontWeight: 500,
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
              color="primary"
              disabled={isSubmitting || !displayName.trim() || !!displayNameError || !selectedSubject || selectedActions.length === 0 || selectedResources.length === 0}
              size="large"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SecurityIcon />}
              sx={{
                textTransform: 'none',
                minWidth: 140,
                fontWeight: 600,
                py: 1.2,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                },
                '&:disabled': {
                  boxShadow: 'none',
                }
              }}
            >
              {isSubmitting ? 'Updating...' : 'Update Policy'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* View Policy Dialog */}
      <Dialog
        open={viewOpen}
        onClose={handleViewClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            m: 2,
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
          <Typography variant="h6" fontWeight="600" color="text.primary">
            View Policy
          </Typography>
          <IconButton
            onClick={handleViewClose}
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
          {viewPolicy && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* Name */}
              <TextField
                fullWidth
                label="Name"
                value={viewPolicy.name}
                variant="outlined"
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.50' } }}
              />

              {/* Description */}
              <TextField
                fullWidth
                label="Description"
                value={viewPolicy.description || 'No description available'}
                variant="outlined"
                multiline
                rows={3}
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.50' } }}
              />

              {/* Metadata */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                  Metadata
                </Typography>
                <Box sx={{
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 1,
                  p: 1.5,
                  bgcolor: 'grey.50',
                }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Created By
                      </Typography>
                      <Typography variant="body2">
                        {viewPolicy.metadata.createdBy}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Version
                      </Typography>
                      <Typography variant="body2">
                        {viewPolicy.metadata.version}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography variant="body2">
                        {new Date(viewPolicy.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {new Date(viewPolicy.updatedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{
          px: 3,
          pb: 3,
          pt: 1
        }}>
          <Button
            onClick={handleViewClose}
            variant="outlined"
            sx={{
              textTransform: 'none',
              minWidth: 100
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'error.main' }}>
              <DeleteIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="600" color="text.primary">
                Delete Policy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This action cannot be undone
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography variant="body1">
            Are you sure you want to delete <strong>"{deletePolicy?.name}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will permanently remove the action and all associated configurations.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={handleDeleteClose}
            variant="text"
            color="inherit"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={isDeleting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Policy'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteOpen}
        onClose={handleBulkDeleteClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'error.main' }}>
              <BulkDeleteIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="600" color="text.primary">
                Delete {selectedPolicies.length} Policies
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This action cannot be undone
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the following policies?
          </Typography>
          <Box sx={{ 
            maxHeight: 200, 
            overflow: 'auto', 
            border: '1px solid', 
            borderColor: 'grey.200', 
            borderRadius: 1,
            bgcolor: 'grey.50'
          }}>
            {selectedPolicies.map((policyId) => {
              const policy = policies.find(p => p._id === policyId);
              return policy ? (
                <Box key={policyId} sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="body2" fontWeight="500">
                    {policy.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {policy.description || 'No description available'}
                  </Typography>
                </Box>
              ) : null;
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={handleBulkDeleteClose}
            variant="text"
            color="inherit"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkDelete}
            variant="contained"
            color="error"
            disabled={isDeleting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {isDeleting ? 'Deleting...' : `Delete ${selectedPolicies.length} Policies`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Attribute Modal */}
      <Dialog
        open={showCreateAttribute}
        onClose={() => setShowCreateAttribute(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{
          pb: 2,
          pt: 3,
          px: 3,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AddIcon sx={{ fontSize: 24 }} />
            <Typography variant="h6" fontWeight="600">
              Create New Attribute
            </Typography>
          </Box>
          <IconButton
            onClick={() => setShowCreateAttribute(false)}
            size="small"
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Display Name"
                  value={newAttributeData.displayName}
                  onChange={(e) => setNewAttributeData(prev => ({
                    ...prev,
                    displayName: e.target.value,
                    name: e.target.value.toLowerCase().replace(/\s+/g, '')
                  }))}
                  placeholder="e.g., Security Clearance Level"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Name (Auto-generated)"
                  value={newAttributeData.name}
                  onChange={(e) => setNewAttributeData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  placeholder="e.g., securityClearanceLevel"
                  helperText="Internal name for the attribute (lowercase, no spaces)"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={newAttributeData.description}
                  onChange={(e) => setNewAttributeData(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="Describe what this attribute represents..."
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Data Type</InputLabel>
                  <Select
                    value={newAttributeData.dataType}
                    onChange={(e) => setNewAttributeData(prev => ({
                      ...prev,
                      dataType: e.target.value as any
                    }))}
                    label="Data Type"
                  >
                    <MenuItem value="string">Text</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="boolean">Boolean</MenuItem>
                    <MenuItem value="date">Date</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Box sx={{ pt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newAttributeData.isRequired}
                        onChange={(e) => setNewAttributeData(prev => ({
                          ...prev,
                          isRequired: e.target.checked
                        }))}
                      />
                    }
                    label="Required"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newAttributeData.isMultiValue}
                        onChange={(e) => setNewAttributeData(prev => ({
                          ...prev,
                          isMultiValue: e.target.checked
                        }))}
                      />
                    }
                    label="Multi-value"
                  />
                </Box>
              </Grid>
              {newAttributeData.dataType === 'string' && (
                <Grid size={{ xs: 12 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Predefined Values (Optional)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField
                        id="new-enum-value-input"
                        size="small"
                        placeholder="Add a value"
                        onKeyDown={(e) => {
                          const target = e.currentTarget as HTMLInputElement;
                          if (e.key === 'Enter' && target.value.trim()) {
                            const value = target.value.trim();
                            if (!newAttributeData.enumValues.includes(value)) {
                              setNewAttributeData(prev => ({
                                ...prev,
                                enumValues: [...prev.enumValues, value]
                              }));
                            }
                            target.value = '';
                          }
                        }}
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => {
                          const input = document.getElementById('new-enum-value-input') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            const value = input.value.trim();
                            if (!newAttributeData.enumValues.includes(value)) {
                              setNewAttributeData(prev => ({
                                ...prev,
                                enumValues: [...prev.enumValues, value]
                              }));
                            }
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {newAttributeData.enumValues.map((value, index) => (
                        <Chip
                          key={index}
                          label={value}
                          size="small"
                          onDelete={() => {
                            setNewAttributeData(prev => ({
                              ...prev,
                              enumValues: prev.enumValues.filter((_, i) => i !== index)
                            }));
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={() => setShowCreateAttribute(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateAttribute}
            variant="contained"
            disabled={!newAttributeData.displayName.trim() || !newAttributeData.name.trim()}
          >
            Create Attribute
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Value Modal */}
      <Dialog
        open={showCreateValue !== null}
        onClose={() => {
          setShowCreateValue(null);
          setNewValueData('');
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{
          pb: 2,
          pt: 3,
          px: 3,
          bgcolor: 'secondary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AddIcon sx={{ fontSize: 20 }} />
            <Typography variant="h6" fontWeight="600">
              Add New Value
            </Typography>
          </Box>
          <IconButton
            onClick={() => {
              setShowCreateValue(null);
              setNewValueData('');
            }}
            size="small"
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 3 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Adding a new value to: {attributes.find(attr => attr.id === showCreateValue)?.displayName}
            </Typography>
            <TextField
              fullWidth
              label="New Value"
              value={newValueData}
              onChange={(e) => setNewValueData(e.target.value)}
              placeholder="Enter new value..."
              autoFocus
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={() => {
              setShowCreateValue(null);
              setNewValueData('');
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={() => showCreateValue && handleCreateValue(showCreateValue)}
            variant="contained"
            disabled={!newValueData.trim()}
          >
            Add Value
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}