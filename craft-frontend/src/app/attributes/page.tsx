'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Grid,
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
  ListItemButton,
  Checkbox,
  Toolbar,
  Tooltip,
  InputAdornment,
  OutlinedInput,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Label as LabelIcon,
  DataObject as ObjectIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Code as CodeIcon,
  Schedule as ScheduleIcon,
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
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import { canManage, canEdit, canDelete, canCreate } from '@/utils/permissions';

interface Attribute {
  _id: string;
  id: string;
  name: string;
  displayName: string;
  description?: string;
  categories: ('subject' | 'resource')[];
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  isRequired: boolean;
  isMultiValue: boolean;
  defaultValue?: any;
  constraints: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: string;
    enumValues?: any[];
    format?: string;
  };
  validation: {
    isEmail?: boolean;
    isUrl?: boolean;
    isPhoneNumber?: boolean;
    customValidator?: string;
  };
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    isSystem: boolean;
    isCustom: boolean;
    version: string;
    externalId?: string;
  };
  mapping: {
    sourceField?: string;
    transformFunction?: string;
    cacheTime?: number;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | { name?: string }; // Add this field for compatibility
}

export default function AttributesPage() {
  const { user: currentUser } = useAuth();
  const snackbar = useApiSnackbar();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [valuesAnchorEl, setValuesAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDataType, setSelectedDataType] = useState('');
  const [permittedValues, setPermittedValues] = useState('');
  const [parsedValues, setParsedValues] = useState<any[]>([]);
  const [booleanValues, setBooleanValues] = useState<string[]>([]);
  const [numberValues, setNumberValues] = useState<string[]>([]);
  const [stringValues, setStringValues] = useState<string[]>([]);
  const [dateValues, setDateValues] = useState<string[]>([]);
  const [dateInputType, setDateInputType] = useState<'single' | 'range' | 'period'>('single');
  const [description, setDescription] = useState('');
  // Search, Filter, Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterDataType, setFilterDataType] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('displayName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const filterOpen = Boolean(filterAnchorEl);
  const sortOpen = Boolean(sortAnchorEl);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewAttribute, setViewAttribute] = useState<Attribute | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAttribute, setDeleteAttribute] = useState<Attribute | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAttributeUsedInPolicies, setIsAttributeUsedInPolicies] = useState(false);
  const [existingValues, setExistingValues] = useState<any[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  
  // Helper function to check if user can only add values (for array/object when used in policies)
  const canOnlyAddValues = () => {
    return isAttributeUsedInPolicies && (selectedDataType === 'array' || selectedDataType === 'object');
  };
  
  // Helper function to check if field should be completely disabled
  const isFieldDisabled = () => {
    return isAttributeUsedInPolicies && selectedDataType !== 'array' && selectedDataType !== 'object';
  };

  const handleClickOpen = async (attribute?: Attribute) => {
    setSelectedAttribute(attribute || null);
    setDisplayName(attribute?.displayName || '');
    setDisplayNameError('');
    setSelectedCategories(attribute?.categories ? attribute.categories : []);
    setSelectedDataType(attribute?.dataType || '');
    setDescription(attribute?.description || '');
    
    // Initialize values immediately if attribute exists
    if (attribute && attribute.constraints && attribute.constraints.enumValues && attribute.constraints.enumValues.length > 0) {
      const enumValues = attribute.constraints.enumValues;
      setExistingValues(enumValues);
      
      // Set values immediately based on data type
      if (attribute.dataType === 'string') {
        setStringValues([...enumValues]);
        setPermittedValues(enumValues.join(', '));
      } else if (attribute.dataType === 'number') {
        setNumberValues(enumValues.map(String));
        setPermittedValues(enumValues.join(', '));
      } else if (attribute.dataType === 'boolean') {
        setBooleanValues(enumValues.map(String));
      } else if (attribute.dataType === 'array' || attribute.dataType === 'object') {
        setParsedValues([...enumValues]);
        // Format values as proper JSON for display
        if (attribute.dataType === 'array') {
          // For arrays, show as JSON array format
          const jsonString = JSON.stringify(enumValues, null, 2);
          setPermittedValues(jsonString);
        } else {
          // For objects, each value should be a separate JSON object
          const formattedValues = enumValues.map(value => {
            return typeof value === 'object' ? JSON.stringify(value, null, 2) : JSON.stringify(value);
          });
          setPermittedValues(formattedValues.join('\n'));
        }
      }
    } else {
      // Reset all values if no enumValues
      setPermittedValues('');
      setParsedValues([]);
      setBooleanValues([]);
      setNumberValues([]);
      setStringValues([]);
      setExistingValues([]);
    }
    
    setDateValues([]);
    setDateInputType('single');
    
    // Open modal
    setOpen(true);
    
    // Load usage information asynchronously (for determining if values can be edited)
    if (attribute) {
      try {
        const response = await apiClient.get(`/attributes/${attribute._id}/usage`);
        setIsAttributeUsedInPolicies(response.data.isUsedInPolicies || false);
      } catch (error) {
        console.warn('Failed to check attribute usage:', error);
        setIsAttributeUsedInPolicies(false);
      }
    } else {
      setIsAttributeUsedInPolicies(false);
    }
  };

  const handleViewOpen = (attribute: Attribute) => {
    setViewAttribute(attribute);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setViewAttribute(null);
  };


  const handleDeleteOpen = (attribute: Attribute) => {
    setDeleteAttribute(attribute);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setDeleteAttribute(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAttribute) return;

    setIsDeleting(true);
    try {
      const response = await apiClient.delete(`/attributes/${deleteAttribute._id}`);

      if (response.success) {
        // Remove from local state
        setAttributes(prev => prev.filter(attr => attr._id !== deleteAttribute._id));
        setTotal(prev => prev - 1);
        handleDeleteClose();
        snackbar.showSuccess(`Attribute "${deleteAttribute.displayName}" deleted successfully`);
      } else {
        snackbar.handleApiResponse(response, undefined, 'Failed to delete attribute');
        handleDeleteClose();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      
      // Get the error message from the API response
      const errorMessage = error?.error || error?.message || 'Unknown error';
      
      // Handle specific error cases with better messages
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        snackbar.showInfo('Attribute no longer exists. Refreshing the list...');
        await fetchAttributes(); // Refresh the data
        handleDeleteClose();
      } else if (errorMessage.includes('Cannot delete system attributes') ||
        errorMessage.includes('system attribute')) {
        snackbar.showWarning('System attributes cannot be deleted as they are required for the system to function properly.');
        handleDeleteClose();
      } else if (errorMessage.includes('Unable to delete') && errorMessage.includes('currently being used in')) {
        // Handle policy dependency error with snackbar
        snackbar.showError(errorMessage);
        handleDeleteClose();
      } else {
        // Handle other API errors
        snackbar.handleApiError(error, 'Failed to delete attribute');
        handleDeleteClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAttribute(null);
    setDisplayName('');
    setDisplayNameError('');
    setSelectedCategories([]);
    setSelectedDataType('');
    setDescription('');
    setPermittedValues('');
    setParsedValues([]);
    setBooleanValues([]);
    setNumberValues([]);
    setStringValues([]);
    setDateValues([]);
    setDateInputType('single');
  };

  const parsePermittedValues = (input: string, dataType: string) => {
    if (!input.trim()) return [];

    try {
      switch (dataType) {
        case 'array':
          // Try to parse as a single JSON array first
          try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) {
              return parsed;
            }
          } catch {
            // Fall back to line-by-line parsing for backward compatibility
            const arrayValues = input.split('\n').map(v => v.trim()).filter(v => v);
            const allArrayValues = [];
            for (const v of arrayValues) {
              try {
                const parsed = JSON.parse(v);
                if (!Array.isArray(parsed)) throw new Error('Not an array');
                allArrayValues.push(...parsed); // Flatten the arrays
              } catch {
                throw new Error(`"${v}" is not a valid JSON array`);
              }
            }
            return allArrayValues;
          }
          throw new Error('Invalid array format');
        case 'object':
          // For objects, parse each line as a JSON object
          const objectValues = input.split('\n').map(v => v.trim()).filter(v => v);
          return objectValues.map(v => {
            try {
              const parsed = JSON.parse(v);
              if (Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Not an object');
              return parsed;
            } catch {
              throw new Error(`"${v}" is not a valid JSON object`);
            }
          });
        default:
          // For primitive types, split by comma
          const values = input.split(',').map(v => v.trim()).filter(v => v);

          switch (dataType) {
            case 'string':
              return values;
            case 'number':
              return values.map(v => {
                const num = parseFloat(v);
                if (isNaN(num)) throw new Error(`"${v}" is not a valid number`);
                return num;
              });
            case 'boolean':
              return values.map(v => {
                const lower = v.toLowerCase();
                if (lower === 'true') return true;
                if (lower === 'false') return false;
                throw new Error(`"${v}" is not a valid boolean (use true/false)`);
              });
            case 'date':
              return values.map(v => {
                const date = new Date(v);
                if (isNaN(date.getTime())) throw new Error(`"${v}" is not a valid date`);
                return date.toISOString().split('T')[0]; // Return as YYYY-MM-DD
              });
            default:
              return values;
          }
      }
    } catch (error) {
      return [];
    }
  };

  const handlePermittedValuesChange = (value: string) => {
    setPermittedValues(value);
    setParsedValues(parsePermittedValues(value, selectedDataType));
  };

  const handleDataTypeChange = (dataType: string) => {
    setSelectedDataType(dataType);
    // Clear permitted values when data type changes
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

  const getPlaceholderForDataType = (dataType: string) => {
    switch (dataType) {
      case 'string':
        return 'IT, HR, Finance';
      case 'number':
        return '1, 2, 3, 10';
      case 'boolean':
        return 'true, false';
      case 'date':
        return '2024-01-01, 2024-12-31';
      case 'array':
        return '["item1", "item2"]\n["item3", "item4"]\n[1, 2, 3]';
      case 'object':
        return '{"key": "value"}\n{"name": "test"}\n{"id": 123}';
      default:
        return 'Enter comma-separated values';
    }
  };

  const validateDisplayName = (value: string) => {
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

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    setDisplayNameError(validateDisplayName(value));
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleValuesPopoverOpen = (event: React.MouseEvent<HTMLElement>, values: string[]) => {
    setValuesAnchorEl(event.currentTarget);
    setSelectedValues(values);
  };

  const handleValuesPopoverClose = () => {
    setValuesAnchorEl(null);
    setSelectedValues([]);
  };

  // Multi-selection handlers
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = paginatedAttributes.map((attribute) => attribute.id);
      setSelectedAttributes(newSelected);
    } else {
      setSelectedAttributes([]);
    }
  };

  const handleAttributeSelect = (attributeId: string) => {
    const selectedIndex = selectedAttributes.indexOf(attributeId);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedAttributes, attributeId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedAttributes.slice(1));
    } else if (selectedIndex === selectedAttributes.length - 1) {
      newSelected = newSelected.concat(selectedAttributes.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedAttributes.slice(0, selectedIndex),
        selectedAttributes.slice(selectedIndex + 1)
      );
    }

    setSelectedAttributes(newSelected);
  };

  const isSelected = (attributeId: string) => selectedAttributes.indexOf(attributeId) !== -1;

  // Bulk operations handlers

  const handleBulkDeleteOpen = () => {
    setBulkDeleteOpen(true);
  };
  
  const handleBulkDeleteClose = () => {
    setBulkDeleteOpen(false);
  };
  
  const handleBulkDeleteConfirm = async () => {
    if (selectedAttributes.length === 0) return;
    
    setIsSubmitting(true);
    setBulkDeleteOpen(false);
    
    try {
      // Use the bulk delete API endpoint
      const response = await apiClient.delete('/attributes/bulk/delete', {
        attributeIds: selectedAttributes
      });
      
      if (response.success) {
        // Update local state by filtering out deleted attributes
        setAttributes(prev => prev.filter(attr => !selectedAttributes.includes(attr.id)));
        setTotal(prev => prev - selectedAttributes.length);
        
        // Clear selection
        setSelectedAttributes([]);
        
        snackbar.showSuccess(`${selectedAttributes.length} attributes deleted successfully`);
      } else {
        snackbar.handleApiResponse(response, undefined, 'Failed to delete attributes');
      }
      
    } catch (error: any) {
      console.error('Failed to delete attributes:', error);
      
      // Get the error message from the API response
      const errorMessage = error?.error || error?.message || 'Unknown error';
      
      // Handle specific error cases
      if (errorMessage.includes('Cannot delete system attributes')) {
        snackbar.showWarning('Some attributes could not be deleted because they are system attributes required for the system to function.');
      } else if (errorMessage.includes('Unable to delete') && errorMessage.includes('currently being used in')) {
        // Handle policy dependency error with simplified message
        snackbar.showError(errorMessage);
      } else {
        snackbar.handleApiError(error, 'Failed to delete attributes');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSelection = () => {
    setSelectedAttributes([]);
  };

  // Search and filter handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(0); // Reset to first page when searching
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleSortChange = (field: string) => {
    if (field === sortBy) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(0); // Reset to first page when sorting
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory([]);
    setFilterDataType([]);
    setSortBy('displayName');
    setSortOrder('asc');
    setPage(0);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const hasActiveFilters = Boolean(searchTerm || filterCategory.length > 0 || filterDataType.length > 0);

  // Stats calculation
  const activeCount = attributes.filter(attr => attr.active !== false).length;
  const inactiveCount = attributes.filter(attr => attr.active === false).length;

  const handleSubmit = async () => {
    if (!displayName || displayNameError) return;

    // Additional validation
    if (!displayName.trim()) {
      setDisplayNameError('Display name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const attributeData = {
        id: `attr_${displayName.trim().toLowerCase().replace(/\s+/g, '_')}`,
        name: displayName.trim(),
        displayName: displayName.trim(),
        description: description?.trim() || '',
        categories: selectedCategories,
        dataType: selectedDataType || 'string',
        isRequired: false,
        isMultiValue: false,
        constraints: {
          enumValues: parsedValues.length > 0 ? parsedValues : []
        },
        metadata: {
          createdBy: currentUser?.name || 'System',
          tags: [],
          isSystem: false,
          isCustom: true,
          version: '1.0.0'
        }
      };

      // Debug logging

      if (selectedAttribute) {
        // Update existing attribute
        const response = await apiClient.put(`/attributes/${selectedAttribute._id}`, attributeData);
        if (response.success) {
          // Update local state
          setAttributes(prev => prev.map(attr =>
            attr._id === selectedAttribute._id ? response.data : attr
          ));
          handleClose();
        } else {
          throw new Error(response.error || 'Failed to update attribute');
        }
      } else {
        // Create new attribute
        const response = await apiClient.post('/attributes', attributeData);
        if (response.success) {
          // Add to local state
          setAttributes(prev => [response.data, ...prev]);
          setTotal(prev => prev + 1);
          handleClose();
        } else {
          throw new Error(response.error || 'Failed to create attribute');
        }
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      
      let errorMessage = 'Failed to save attribute';
      if (error.response?.data?.error) {
        errorMessage += ': ' + error.response.data.error;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch attributes from API
  const fetchAttributes = async () => {
    try {
      setLoading(true);

      const response: ApiResponse<Attribute[]> = await apiClient.get('/attributes', {
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
        sortBy: sortBy,
        sortOrder: sortOrder,
        search: searchTerm,
        category: filterCategory,
        dataType: filterDataType,
      });

      if (response.success && response.data) {
        setAttributes(response.data);
        setTotal(response.pagination?.total || 0);
      } else {
        snackbar.handleApiResponse(response, undefined, 'Failed to load attributes');
        setAttributes([]);
        setTotal(0);
      }
    } catch (err: any) {
      console.error('Error fetching attributes:', err);
      snackbar.handleApiError(err, 'Failed to load attributes');
      // Fallback to empty array
      setAttributes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Unified effect with debouncing for search, immediate for others
  useEffect(() => {
    if (searchTerm !== '') {
      // Debounce search
      const timeoutId = setTimeout(() => {
        setPage(0); // Reset to first page when searching
        fetchAttributes();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      // Immediate fetch for non-search changes
      fetchAttributes();
      return () => {}; // Empty cleanup function for consistency
    }
  }, [searchTerm, page, rowsPerPage, filterCategory, filterDataType, sortBy, sortOrder]);

  const getStatusColor = (active: boolean) => {
    return active ? 'success' : 'error';
  };

  const getTypeColor = (dataType: string) => {
    switch (dataType) {
      case 'string': return 'primary';
      case 'number': return 'success';
      case 'boolean': return 'warning';
      case 'date': return 'info';
      case 'array': return 'secondary';
      case 'object': return 'error';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'subject': return <PersonIcon />;
      case 'resource': return <ObjectIcon />;
      case 'action': return <CodeIcon />;
      case 'environment': return <BusinessIcon />;
      default: return <LabelIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'subject': return 'primary';
      case 'resource': return 'secondary';
      case 'action': return 'success';
      case 'environment': return 'warning';
      default: return 'default';
    }
  };

  // Since API handles pagination, we use all attributes returned
  const paginatedAttributes = attributes;

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="h5" component="h1" fontWeight="600">
              Attributes
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, textAlign: 'center' }}>
            <Box>
              <Typography variant="h6" color="primary.main" fontWeight="600">
                {loading ? '...' : total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="success.main" fontWeight="600">
                {loading ? '...' : activeCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="warning.main" fontWeight="600">
                {loading ? '...' : inactiveCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Inactive
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Manage system attributes for subjects, resources, actions, and environment
          </Typography>
          {canCreate(currentUser) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                handleClickOpen();
              }}
              sx={{ px: 3 }}
            >
              Create Attribute
            </Button>
          )}
        </Box>
      </Paper>


      {/* Toolbar */}
      <Paper sx={{ mb: 2 }}>
        <Toolbar sx={{ px: { sm: 2 }, minHeight: '64px !important' }}>
          {selectedAttributes.length > 0 ? (
            <>
              <Typography
                sx={{ flex: '1 1 100%' }}
                color="inherit"
                variant="subtitle1"
              >
                {selectedAttributes.length} selected
              </Typography>
              {canDelete(currentUser) && (
                <Tooltip title="Delete selected">
                  <IconButton color="error" onClick={handleBulkDeleteOpen}>
                    <BulkDeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          ) : (
            <>
              <Box sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                <OutlinedInput
                  size="small"
                  placeholder="Search attributes..."
                  value={searchTerm}
                  onChange={handleSearch}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  }
                  sx={{ minWidth: 300 }}
                />
                
                {hasActiveFilters && (
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    size="small"
                  >
                    Clear
                  </Button>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Filter">
                  <IconButton onClick={handleFilterClick}>
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Sort">
                  <IconButton onClick={handleSortClick}>
                    <SortIcon />
                    {sortBy && (
                      sortOrder === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          )}
        </Toolbar>
      </Paper>

      {/* Attributes Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        indeterminate={selectedAttributes.length > 0 && selectedAttributes.length < paginatedAttributes.length}
                        checked={paginatedAttributes.length > 0 && selectedAttributes.length === paginatedAttributes.length}
                        onChange={handleSelectAllClick}
                        inputProps={{
                          'aria-label': 'select all attributes',
                        }}
                      />
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: '0.875rem', 
                        color: 'text.primary',
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'grey.50' }
                      }}
                      onClick={() => handleSortChange('displayName')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        Name & Description
                        {sortBy === 'displayName' && (
                          sortOrder === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: '0.875rem', 
                        color: 'text.primary',
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'grey.50' }
                      }}
                      onClick={() => handleSortChange('category')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        Category
                        {sortBy === 'category' && (
                          sortOrder === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: '0.875rem', 
                        color: 'text.primary',
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'grey.50' }
                      }}
                      onClick={() => handleSortChange('dataType')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        Data Type
                        {sortBy === 'dataType' && (
                          sortOrder === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                      Permitted Values
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                      Created By
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', width: '120px', minWidth: '120px' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          Loading attributes...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedAttributes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No attributes found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAttributes.map((attribute) => {
                      const isItemSelected = isSelected(attribute.id);
                      const labelId = `enhanced-table-checkbox-${attribute.id}`;

                      return (
                        <TableRow
                          key={attribute.id}
                          hover
                          onClick={() => handleAttributeSelect(attribute.id)}
                          role="checkbox"
                          aria-checked={isItemSelected}
                          tabIndex={-1}
                          selected={isItemSelected}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isItemSelected}
                              inputProps={{
                                'aria-labelledby': labelId,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: `${getCategoryColor(attribute.categories?.[0] || 'subject')}.main` }}>
                                {getCategoryIcon(attribute.categories?.[0] || 'subject')}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="medium"
                                  id={labelId}
                                >
                                  {attribute.displayName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {attribute.description || 'No description available'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {attribute.categories?.map((category) => (
                                <Chip
                                  key={category}
                                  label={category}
                                  size="small"
                                  color={getCategoryColor(category) as any}
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={attribute.dataType}
                              size="small"
                              color={getTypeColor(attribute.dataType) as any}
                            />
                          </TableCell>
                          <TableCell>
                            {attribute.constraints.enumValues && attribute.constraints.enumValues.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                                {attribute.constraints.enumValues.slice(0, 2).map((value, index) => (
                                  <Chip
                                    key={index}
                                    label={value}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                ))}
                                {attribute.constraints.enumValues.length > 2 && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleValuesPopoverOpen(e, attribute.constraints.enumValues!);
                                    }}
                                    sx={{
                                      ml: 0.5,
                                      bgcolor: 'primary.main',
                                      color: 'white',
                                      width: 24,
                                      height: 24,
                                      '&:hover': {
                                        bgcolor: 'primary.dark',
                                      }
                                    }}
                                  >
                                    <MoreIcon sx={{ fontSize: '0.875rem' }} />
                                  </IconButton>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                Any value
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {(() => {
                                if (typeof attribute.createdBy === 'string') {
                                  return attribute.createdBy;
                                } else if (attribute.createdBy && typeof attribute.createdBy === 'object' && attribute.createdBy.name) {
                                  return attribute.createdBy.name;
                                } else if (attribute.metadata?.createdBy) {
                                  return typeof attribute.metadata.createdBy === 'string' 
                                    ? attribute.metadata.createdBy 
                                    : 'System';
                                }
                                return 'System';
                              })()} 
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ width: '120px', minWidth: '120px' }}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewOpen(attribute);
                                }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                              {canEdit(currentUser) && (
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClickOpen(attribute);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              )}
                              {canDelete(currentUser) && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOpen(attribute);
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
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
      </Paper>

      {/* Filter Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 280 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filter Attributes
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Category (Multi-select)
            </Typography>
            <Box sx={{ mt: 1 }}>
              {['subject', 'resource', 'action', 'environment'].map((category) => (
                <Chip
                  key={category}
                  label={category.charAt(0).toUpperCase() + category.slice(1)}
                  variant={filterCategory.includes(category) ? 'filled' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setFilterCategory(prev => 
                      prev.includes(category) 
                        ? prev.filter(c => c !== category)
                        : [...prev, category]
                    );
                  }}
                  sx={{ mr: 0.5, mb: 0.5 }}
                  color={filterCategory.includes(category) ? 'primary' : 'default'}
                />
              ))}
            </Box>
            {filterCategory.length > 0 && (
              <Button 
                size="small" 
                onClick={() => setFilterCategory([])}
                sx={{ mt: 1, fontSize: '0.75rem' }}
              >
                Clear Category
              </Button>
            )}
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Data Type (Multi-select)
            </Typography>
            <Box sx={{ mt: 1 }}>
              {['string', 'number', 'boolean', 'date', 'array', 'object'].map((type) => (
                <Chip
                  key={type}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  variant={filterDataType.includes(type) ? 'filled' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setFilterDataType(prev => 
                      prev.includes(type) 
                        ? prev.filter(t => t !== type)
                        : [...prev, type]
                    );
                  }}
                  sx={{ mr: 0.5, mb: 0.5 }}
                  color={filterDataType.includes(type) ? 'primary' : 'default'}
                />
              ))}
            </Box>
            {filterDataType.length > 0 && (
              <Button 
                size="small" 
                onClick={() => setFilterDataType([])}
                sx={{ mt: 1, fontSize: '0.75rem' }}
              >
                Clear Data Type
              </Button>
            )}
          </Box>

          {(filterCategory.length > 0 || filterDataType.length > 0) && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button 
                variant="outlined" 
                size="small" 
                fullWidth
                onClick={() => {
                  setFilterCategory([]);
                  setFilterDataType([]);
                }}
              >
                Clear All Filters
              </Button>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Sort Popover */}
      <Popover
        open={sortOpen}
        anchorEl={sortAnchorEl}
        onClose={handleSortClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { p: 2, minWidth: 200 }
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Sort Attributes
        </Typography>
        
        <List dense>
          <ListItemButton 
            onClick={() => {
              setSortBy('displayName');
              setSortOrder('asc');
              handleSortClose();
            }}
            selected={sortBy === 'displayName' && sortOrder === 'asc'}
          >
            <ListItemText primary="Name (A-Z)" />
            {sortBy === 'displayName' && sortOrder === 'asc' && <ArrowUpIcon fontSize="small" />}
          </ListItemButton>
          <ListItemButton 
            onClick={() => {
              setSortBy('displayName');
              setSortOrder('desc');
              handleSortClose();
            }}
            selected={sortBy === 'displayName' && sortOrder === 'desc'}
          >
            <ListItemText primary="Name (Z-A)" />
            {sortBy === 'displayName' && sortOrder === 'desc' && <ArrowDownIcon fontSize="small" />}
          </ListItemButton>
          <ListItemButton 
            onClick={() => {
              setSortBy('createdAt');
              setSortOrder('desc');
              handleSortClose();
            }}
            selected={sortBy === 'createdAt' && sortOrder === 'desc'}
          >
            <ListItemText primary="Newest First" />
            {sortBy === 'createdAt' && sortOrder === 'desc' && <ArrowDownIcon fontSize="small" />}
          </ListItemButton>
          <ListItemButton 
            onClick={() => {
              setSortBy('createdAt');
              setSortOrder('asc');
              handleSortClose();
            }}
            selected={sortBy === 'createdAt' && sortOrder === 'asc'}
          >
            <ListItemText primary="Oldest First" />
            {sortBy === 'createdAt' && sortOrder === 'asc' && <ArrowUpIcon fontSize="small" />}
          </ListItemButton>
        </List>
      </Popover>

      {/* Values Popover */}
      <Popover
        open={Boolean(valuesAnchorEl)}
        anchorEl={valuesAnchorEl}
        onClose={handleValuesPopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            maxWidth: 300,
            maxHeight: 400,
            overflow: 'auto'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            All Permitted Values
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selectedValues.map((value, index) => (
              <Chip
                key={index}
                label={value}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        </Box>
      </Popover>


      {/* Floating Action Button */}
      {canCreate(currentUser) && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => handleClickOpen()}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Attribute Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
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
            {selectedAttribute ? 'Edit Attribute' : 'New Attribute'}
          </Typography>
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
          {/* Warning for attributes used in policies */}
          {isAttributeUsedInPolicies && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'warning.50', 
              border: '1px solid', 
              borderColor: 'warning.200', 
              borderRadius: 1,
              mb: 2
            }}>
              <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 500 }}>
                ⚠️ Restricted Editing
              </Typography>
              <Typography variant="caption" color="warning.dark" sx={{ display: 'block', mt: 0.5 }}>
                {selectedDataType === 'array' || selectedDataType === 'object'
                  ? "This attribute is used in policies. Only description can be edited and new values can be added. Existing values cannot be modified."
                  : "This attribute is used in policies. Only the description can be edited."
                }
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField
              fullWidth
              label="Display Name"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              variant="outlined"
              placeholder="e.g., department"
              error={!!displayNameError}
              helperText={displayNameError || 'No spaces allowed, use camelCase or snake_case'}
              disabled={isFieldDisabled()}
            />

            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                  disabled={isFieldDisabled()}
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
                  disabled={isFieldDisabled()}
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
                
                {/* Boolean Values */}
                {selectedDataType === 'boolean' && (
                  <FormControl fullWidth>
                    <InputLabel>Select Boolean Values</InputLabel>
                    <Select
                      multiple
                      value={booleanValues}
                      onChange={(e) => handleBooleanValuesChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                      label="Select Boolean Values"
                      disabled={isFieldDisabled()}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const isExistingValue = canOnlyAddValues() && existingValues.includes(value === 'true');
                            return (
                              <Chip 
                                key={value} 
                                label={value} 
                                size="small" 
                                color={isExistingValue ? "default" : "primary"}
                                variant={isExistingValue ? "outlined" : "filled"}
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      <MenuItem value="true">true</MenuItem>
                      <MenuItem value="false">false</MenuItem>
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      {canOnlyAddValues() 
                        ? "You can only add new values. Existing values cannot be changed."
                        : "Select which boolean values are allowed"
                      }
                    </Typography>
                  </FormControl>
                )}

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
                      {stringValues.map((value, index) => {
                        const isExistingValue = canOnlyAddValues() && existingValues.includes(value);
                        const chipProps: any = {
                          key: index,
                          label: value,
                          size: "small",
                          color: isExistingValue ? "default" : "primary",
                          variant: isExistingValue ? "outlined" : "filled"
                        };
                        
                        if (!isExistingValue) {
                          chipProps.onDelete = () => handleStringValuesRemove(index);
                        }
                        
                        return <Chip {...chipProps} />;
                      })}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {canOnlyAddValues() 
                        ? "You can only add new values. Existing values (outlined) cannot be removed."
                        : "Press Enter or click Add to add values"
                      }
                    </Typography>
                  </Box>
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
                      {numberValues.map((value, index) => {
                        const numValue = parseFloat(value);
                        const isExistingValue = canOnlyAddValues() && existingValues.includes(numValue);
                        const chipProps: any = {
                          key: index,
                          label: value,
                          size: "small",
                          color: isExistingValue ? "default" : "secondary",
                          variant: isExistingValue ? "outlined" : "filled"
                        };
                        
                        if (!isExistingValue) {
                          chipProps.onDelete = () => handleNumberValuesRemove(index);
                        }
                        
                        return <Chip {...chipProps} />;
                      })}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {canOnlyAddValues() 
                        ? "You can only add new values. Existing values (outlined) cannot be removed."
                        : "Enter numeric values only"
                      }
                    </Typography>
                  </Box>
                )}

                {/* Date Values */}
                {selectedDataType === 'date' && (
                  <Box sx={{ opacity: isFieldDisabled() ? 0.5 : 1 }}>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                      Add Permitted Date/Time Values
                    </Typography>

                    {/* Input Type Selector */}
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
                            onClick={() => setDateInputType(option.key as any)}
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

                    {/* Input Area */}
                    <Box sx={{ 
                      border: '1px solid',
                      borderColor: 'grey.300',
                      borderRadius: 2,
                      p: 2,
                      mb: 2,
                      bgcolor: 'grey.50'
                    }}>
                      {/* Single Date/Time Input */}
                      {dateInputType === 'single' && (
                        <Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 2, alignItems: 'end' }}>
                            <TextField
                              label="Date"
                              type="date"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              inputRef={(input) => input?.setAttribute('data-single-date', '')}
                            />
                            <TextField
                              label="Time (Optional)"
                              type="time"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              inputRef={(input) => input?.setAttribute('data-single-time', '')}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => {
                                const dateInput = document.querySelector('[data-single-date]') as HTMLInputElement;
                                const timeInput = document.querySelector('[data-single-time]') as HTMLInputElement;
                                if (dateInput?.value) {
                                  let dateTimeString = `${dateInput.value}${timeInput?.value ? `T${timeInput.value}:00` : 'T00:00:00'}`;
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

                      {/* Date Range Input */}
                      {dateInputType === 'range' && (
                        <Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 2, alignItems: 'end' }}>
                            <TextField
                              label="From Date"
                              type="date"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              inputRef={(input) => input?.setAttribute('data-from-date', '')}
                            />
                            <TextField
                              label="To Date"
                              type="date"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              inputRef={(input) => input?.setAttribute('data-to-date', '')}
                            />
                            <TextField
                              label="Time (Optional)"
                              type="time"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              inputRef={(input) => input?.setAttribute('data-range-time', '')}
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
                            Add a date range (e.g., weekend, multiple days)
                          </Typography>
                        </Box>
                      )}

                      {/* Time Period Input */}
                      {dateInputType === 'period' && (
                        <Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 2, alignItems: 'end' }}>
                            <TextField
                              label="From Time"
                              type="time"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              inputRef={(input) => input?.setAttribute('data-from-time', '')}
                            />
                            <TextField
                              label="To Time"
                              type="time"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              inputRef={(input) => input?.setAttribute('data-to-time', '')}
                            />
                            <TextField
                              label="Days (Optional)"
                              placeholder="Mon, Wed, Fri"
                              size="small"
                              inputRef={(input) => input?.setAttribute('data-days', '')}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => {
                                const fromTimeInput = document.querySelector('[data-from-time]') as HTMLInputElement;
                                const toTimeInput = document.querySelector('[data-to-time]') as HTMLInputElement;
                                const daysInput = document.querySelector('[data-days]') as HTMLInputElement;
                                if (fromTimeInput?.value && toTimeInput?.value) {
                                  const daysStr = daysInput?.value ? ` on ${daysInput.value}` : ' (Daily)';
                                  const label = `${fromTimeInput.value} - ${toTimeInput.value}${daysStr}`;
                                  handleFlexibleDateAdd(label);
                                  fromTimeInput.value = '';
                                  toTimeInput.value = '';
                                  if (daysInput) daysInput.value = '';
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
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                          Permitted Date/Time Values ({dateValues.length})
                        </Typography>
                        <Box sx={{ 
                          maxHeight: '150px', 
                          overflowY: 'auto',
                          border: '1px solid',
                          borderColor: 'grey.200',
                          borderRadius: 1,
                          p: 1,
                          bgcolor: 'white'
                        }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {dateValues.map((value, index) => (
                              <Chip
                                key={index}
                                label={value}
                                onDelete={() => handleDateValuesRemove(index)}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{
                                  '& .MuiChip-label': {
                                    fontSize: '0.75rem',
                                    maxWidth: '200px'
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {dateValues.length === 0 && (
                      <Box sx={{
                        textAlign: 'center',
                        py: 2,
                        color: 'text.secondary',
                        fontStyle: 'italic',
                        fontSize: '0.875rem'
                      }}>
                        No date/time values added yet
                      </Box>
                    )}
                  </Box>
                )}

                {/* Array/Object Values - Compact Interface */}
                {(selectedDataType === 'array' || selectedDataType === 'object') && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                        {selectedDataType === 'array' ? 'Array Values' : 'Object Values'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {parsedValues.length} value{parsedValues.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>

                    {/* Compact Values Display */}
                    {parsedValues.length > 0 && (
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
                          {parsedValues.map((value, index) => {
                            const isExistingValue = canOnlyAddValues() && existingValues.includes(value);
                            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                            const truncatedValue = displayValue.length > 30 ? displayValue.substring(0, 30) + '...' : displayValue;
                            
                            return (
                              <Chip
                                key={index}
                                label={truncatedValue}
                                size="small"
                                color={isExistingValue ? "default" : "primary"}
                                variant={isExistingValue ? "outlined" : "filled"}
                                {...(!isExistingValue && {
                                  onDelete: () => {
                                    const newValues = parsedValues.filter((_, i) => i !== index);
                                    setParsedValues(newValues);
                                    setPermittedValues(newValues.map(v => 
                                      typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)
                                    ).join('\n'));
                                  }
                                })}
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
                        {parsedValues.some(value => {
                          const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                          return displayValue.length > 30;
                        }) && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            * Some values are truncated. Full values are preserved when saving.
                          </Typography>
                        )}
                      </Paper>
                    )}

                    {/* Compact Input Interface */}
                    <TextField
                      fullWidth
                      label={canOnlyAddValues() ? `Add New ${selectedDataType} Values` : `${selectedDataType} Values (JSON)`}
                      value={permittedValues}
                      onChange={(e) => handlePermittedValuesChange(e.target.value)}
                      placeholder={selectedDataType === 'array' ? '["item1", "item2", "item3"]' : '{"key": "value", "name": "example"}'}
                      helperText={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: permittedValues && parsedValues.length === 0 ? 'error.main' : 
                                      parsedValues.length > 0 ? 'success.main' : 'grey.400'
                            }}
                          />
                          <Typography variant="caption">
                            {permittedValues && parsedValues.length === 0 ? 
                              'Invalid JSON format' : 
                              parsedValues.length > 0 ? 
                                `Valid JSON - ${parsedValues.length} value${parsedValues.length !== 1 ? 's' : ''} ready` :
                                `Enter valid ${selectedDataType} JSON`
                            }
                          </Typography>
                        </Box>
                      }
                      multiline
                      rows={3}
                      InputProps={{
                        sx: {
                          fontFamily: 'Monaco, "Lucida Console", monospace',
                          fontSize: '0.85rem'
                        }
                      }}
                    />
                      
                    {canOnlyAddValues() && existingValues.length > 0 && (
                      <Box sx={{ mt: 1, p: 1.5, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                        <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 500 }}>
                          ⚠️ Protected values (outlined chips) cannot be modified
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Compact Preview for non-visual types */}
            {parsedValues.length > 0 && !['boolean', 'string', 'number', 'date'].includes(selectedDataType) && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                ✓ {parsedValues.length} valid value{parsedValues.length !== 1 ? 's' : ''}
              </Typography>
            )}

            {/* Error Section */}
            {permittedValues && parsedValues.length === 0 && selectedDataType && !['boolean', 'string', 'number', 'date'].includes(selectedDataType) && (
              <Box sx={{
                p: 2,
                bgcolor: 'error.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'error.300'
              }}>
                <Typography variant="body2" color="error.main">
                  Invalid format for {selectedDataType} type. Please check your values.
                </Typography>
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
            variant="text"
            color="inherit"
            sx={{
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!!displayNameError || !displayName || isSubmitting}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            {isSubmitting ? 'Saving...' : selectedAttribute ? 'Save Changes' : 'Create Attribute'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Attribute Dialog */}
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
            View Attribute
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
          {viewAttribute && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* Name */}
              <TextField
                fullWidth
                label="Name"
                value={viewAttribute.displayName}
                variant="outlined"
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.50' } }}
              />


              {/* Description */}
              <TextField
                fullWidth
                label="Description"
                value={viewAttribute.description || 'No description available'}
                variant="outlined"
                multiline
                rows={3}
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.50' } }}
              />

              {/* Category & Data Type */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Category"
                  value={viewAttribute.categories.join(', ')}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                  sx={{ 
                    '& .MuiInputBase-input': { 
                      bgcolor: 'grey.50',
                      textTransform: 'capitalize'
                    } 
                  }}
                />
                <TextField
                  fullWidth
                  label="Data Type"
                  value={viewAttribute.dataType}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                  sx={{ 
                    '& .MuiInputBase-input': { 
                      bgcolor: 'grey.50',
                      textTransform: 'capitalize'
                    } 
                  }}
                />
              </Box>

              {/* Permitted Values */}
              {viewAttribute.constraints.enumValues && viewAttribute.constraints.enumValues.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    Permitted Values
                  </Typography>
                  <Box sx={{
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 1,
                    p: 1.5,
                    bgcolor: 'grey.50',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {viewAttribute.constraints.enumValues.map((value, index) => (
                        <Chip
                          key={index}
                          label={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{
                            '& .MuiChip-label': {
                              fontSize: '0.75rem',
                              maxWidth: '200px'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}

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
                        {
                          viewAttribute.createdBy 
                            ? (typeof viewAttribute.createdBy === 'string' 
                                ? viewAttribute.createdBy 
                                : viewAttribute.createdBy.name || 'Unknown')
                            : (viewAttribute.metadata?.createdBy || 'System')
                        }
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Version
                      </Typography>
                      <Typography variant="body2">
                        {viewAttribute.metadata?.version || '1.0.0'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography variant="body2">
                        {viewAttribute.createdAt ? new Date(viewAttribute.createdAt).toLocaleDateString() : 'Unknown'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {viewAttribute.updatedAt ? new Date(viewAttribute.updatedAt).toLocaleDateString() : 'Unknown'}
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
          <Button
            onClick={() => {
              handleViewClose();
              handleClickOpen(viewAttribute!);
            }}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            Edit Attribute
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
          <Typography variant="h6" fontWeight="600" color="error.main">
            Delete Attribute
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pb: 2 }}>
          {deleteAttribute && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to delete this attribute?
              </Typography>

              <Box sx={{
                mt: 2,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{
                    bgcolor: `${getCategoryColor(deleteAttribute.categories?.[0] || 'subject')}.main`,
                    width: 32,
                    height: 32
                  }}>
                    {getCategoryIcon(deleteAttribute.categories?.[0] || 'subject')}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">
                      {deleteAttribute.displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      {deleteAttribute.name}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This action cannot be undone. The attribute will be permanently removed from the system.
              </Typography>

              {/* Warning for system attributes */}
              {deleteAttribute.metadata.isSystem && (
                <Box sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'warning.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'warning.200'
                }}>
                  <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 600 }}>
                    ⚠️ System Attribute
                  </Typography>
                  <Typography variant="caption" color="warning.dark">
                    This is a system attribute and cannot be deleted. System attributes are protected and required for proper system operation.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={handleDeleteClose}
            variant="outlined"
            disabled={isDeleting}
            sx={{
              textTransform: 'none',
              minWidth: 80
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={isDeleting || Boolean(deleteAttribute?.metadata.isSystem)}
            sx={{
              textTransform: 'none',
              minWidth: 80
            }}
          >
            {isDeleting ? 'Deleting...' :
              deleteAttribute?.metadata.isSystem ? 'Cannot Delete' : 'Delete'}
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
          <Typography variant="h6" fontWeight="600" color="error.main">
            Delete Multiple Attributes
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pb: 2 }}>
          <Box>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to delete {selectedAttributes.length} selected attribute{selectedAttributes.length > 1 ? 's' : ''}?
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
              This action cannot be undone. The following attributes will be permanently deleted:
            </Typography>
            
            <Box sx={{
              maxHeight: '200px',
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 1,
              p: 1.5,
              bgcolor: 'grey.50'
            }}>
              {selectedAttributes.map(attributeId => {
                const attribute = attributes.find(attr => attr.id === attributeId);
                if (!attribute) return null;
                
                return (
                  <Box key={attributeId} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Avatar sx={{
                      bgcolor: `${getCategoryColor(attribute.categories?.[0] || 'subject')}.main`,
                      width: 28,
                      height: 28
                    }}>
                      {getCategoryIcon(attribute.categories?.[0] || 'subject')}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="500">
                        {attribute.displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                        {attribute.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={attribute.categories?.[0] || 'subject'}
                      size="small"
                      color={getCategoryColor(attribute.categories?.[0] || 'subject') as any}
                      variant="outlined"
                    />
                  </Box>
                );
              })}
            </Box>
            
            <Typography variant="body2" color="warning.dark" sx={{ mt: 2, fontWeight: 500 }}>
              ⚠️ Warning: Deleting attributes may affect existing policies that use them.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={handleBulkDeleteClose}
            variant="outlined"
            disabled={isSubmitting}
            sx={{
              textTransform: 'none',
              minWidth: 80
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkDeleteConfirm}
            variant="contained"
            color="error"
            disabled={isSubmitting}
            sx={{
              textTransform: 'none',
              minWidth: 120
            }}
          >
            {isSubmitting ? 'Deleting...' : `Delete ${selectedAttributes.length} Attribute${selectedAttributes.length > 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>


    </DashboardLayout>
  );
}