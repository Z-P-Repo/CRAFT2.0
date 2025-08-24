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
  Checkbox,
  Toolbar,
  Tooltip,
  InputAdornment,
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

interface Attribute {
  _id: string;
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: 'subject' | 'resource' | 'action' | 'environment';
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
}

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDataType, setFilterDataType] = useState('');
  const [sortBy, setSortBy] = useState('displayName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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
    setSelectedCategories(attribute?.category ? [attribute.category] : []);
    setSelectedDataType(attribute?.dataType || '');
    setDescription(attribute?.description || '');
    setPermittedValues('');
    setParsedValues([]);
    setBooleanValues([]);
    setNumberValues([]);
    setStringValues([]);
    setDateValues([]);
    setDateInputType('single');
    
    // Check if attribute is used in policies and load existing values
    if (attribute) {
      try {
        const response = await apiClient.get(`/attributes/${attribute._id}/usage`);
        setIsAttributeUsedInPolicies(response.data.isUsedInPolicies || false);
        
        // Load existing permitted values
        if (attribute.constraints.enumValues) {
          setExistingValues(attribute.constraints.enumValues);
          // Initialize the appropriate value arrays based on data type
          if (attribute.dataType === 'string') {
            setStringValues(attribute.constraints.enumValues);
          } else if (attribute.dataType === 'number') {
            setNumberValues(attribute.constraints.enumValues.map(String));
          } else if (attribute.dataType === 'boolean') {
            setBooleanValues(attribute.constraints.enumValues.map(String));
          } else if (attribute.dataType === 'array' || attribute.dataType === 'object') {
            setParsedValues(attribute.constraints.enumValues);
          }
        }
      } catch (error) {
        console.warn('Failed to check attribute usage:', error);
        setIsAttributeUsedInPolicies(false);
        setExistingValues([]);
      }
    } else {
      setIsAttributeUsedInPolicies(false);
      setExistingValues([]);
    }
    
    setOpen(true);
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
        // Show success message if you have a toast system
      } else {
        throw new Error(response.error || 'Failed to delete attribute');
      }
    } catch (error: any) {
      console.error('Delete error:', error);

      // Handle specific error cases
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        alert('This attribute no longer exists. Refreshing the list...');
        await fetchAttributes(); // Refresh the data
        handleDeleteClose();
      } else if (error.message?.includes('Cannot delete system attributes') ||
        error.message?.includes('system attribute')) {
        alert('System attributes cannot be deleted. They are protected and required for the system to function properly.');
        handleDeleteClose();
      } else {
        // Show error message for other errors
        alert('Failed to delete attribute: ' + (error.message || 'Unknown error'));
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
          // For arrays, parse each line as a JSON array and flatten
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
      // Delete each selected attribute
      const deletePromises = selectedAttributes.map(attributeId => {
        const attribute = attributes.find(attr => attr.id === attributeId);
        if (attribute) {
          return apiClient.delete(`/attributes/${attribute._id}`);
        }
        return Promise.resolve();
      });
      
      await Promise.all(deletePromises);
      
      // Update local state by filtering out deleted attributes
      setAttributes(prev => prev.filter(attr => !selectedAttributes.includes(attr.id)));
      setTotal(prev => prev - selectedAttributes.length);
      
      // Clear selection
      setSelectedAttributes([]);
      
      console.log(`Successfully deleted ${selectedAttributes.length} attributes`);
    } catch (error) {
      console.error('Failed to delete attributes:', error);
      setError('Failed to delete some attributes. Please try again.');
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
    setFilterCategory('');
    setFilterDataType('');
    setSortBy('displayName');
    setSortOrder('asc');
    setPage(0);
  };

  const hasActiveFilters = searchTerm || filterCategory || filterDataType;

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
        category: selectedCategories.length > 0 ? selectedCategories[0] : 'subject',
        dataType: selectedDataType || 'string',
        isRequired: false,
        isMultiValue: false,
        constraints: {
          enumValues: parsedValues.length > 0 ? parsedValues : []
        },
        metadata: {
          createdBy: 'System',
          tags: [],
          isSystem: false,
          isCustom: true,
          version: '1.0.0'
        }
      };

      // Debug logging
      console.log('Submitting attribute data:', attributeData);

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
      setError(null);

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
        throw new Error(response.error || 'Failed to fetch attributes');
      }
    } catch (err: any) {
      console.error('Error fetching attributes:', err);
      setError(err.message || 'Failed to load attributes');
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
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" color="primary.main" fontWeight="600">
              {loading ? '...' : total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Attributes
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Manage system attributes for subjects, resources, actions, and environment.
          {hasActiveFilters && (
            <Typography component="span" color="primary.main" sx={{ ml: 1 }}>
              (Filtered)
            </Typography>
          )}
        </Typography>
      </Paper>


      {/* Multi-select Delete */}
      {selectedAttributes.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<BulkDeleteIcon />}
            onClick={handleBulkDeleteOpen}
            disabled={isSubmitting}
            sx={{ textTransform: 'none' }}
          >
            Delete {selectedAttributes.length} Selected
          </Button>
        </Box>
      )}
      {/* Filter Bar */}
      {selectedAttributes.length === 0 && (
        <Paper elevation={0} sx={{ 
          p: 2, 
          mb: 3, 
          border: '1px solid',
          borderColor: 'grey.200',
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <TextField
              placeholder="Search attributes..."
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

            {/* Category Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="subject">Subject</MenuItem>
                <MenuItem value="resource">Resource</MenuItem>
                <MenuItem value="action">Action</MenuItem>
                <MenuItem value="environment">Environment</MenuItem>
              </Select>
            </FormControl>

            {/* Data Type Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={filterDataType}
                onChange={(e) => setFilterDataType(e.target.value)}
                label="Data Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="string">String</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="boolean">Boolean</MenuItem>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="array">Array</MenuItem>
                <MenuItem value="object">Object</MenuItem>
              </Select>
            </FormControl>

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
                onClick={() => handleClickOpen()}
                sx={{ textTransform: 'none' }}
              >
                Create Attribute
              </Button>
            </Box>
          </Box>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filterCategory && (
                <Chip
                  label={`Category: ${filterCategory}`}
                  onDelete={() => setFilterCategory('')}
                  size="small"
                  color="primary"
                />
              )}
              {filterDataType && (
                <Chip
                  label={`Type: ${filterDataType}`}
                  onDelete={() => setFilterDataType('')}
                  size="small"
                  color="secondary"
                />
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* Attributes Table */}
      <Card variant="outlined">
        {error && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" variant="body1">
              {error}
            </Typography>
            <Button
              variant="outlined"
              onClick={fetchAttributes}
              sx={{ mt: 2 }}
            >
              Retry
            </Button>
          </Box>
        )}

        {!error && (
          <>
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
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', width: '120px', minWidth: '120px' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          Loading attributes...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedAttributes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
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
                              <Avatar sx={{ bgcolor: `${getCategoryColor(attribute.category)}.main` }}>
                                {getCategoryIcon(attribute.category)}
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
                            <Chip
                              label={attribute.category}
                              size="small"
                              color={getCategoryColor(attribute.category) as any}
                              variant="outlined"
                            />
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
                          <TableCell align="center" sx={{ width: '120px', minWidth: '120px' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
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
          </>
        )}
      </Card>

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
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => handleClickOpen()}
      >
        <AddIcon />
      </Fab>

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

                {/* Array/Object Values */}
                {(selectedDataType === 'array' || selectedDataType === 'object') && (
                  <Box>
                    {/* Existing Values Display */}
                    {canOnlyAddValues() && existingValues.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                          Existing Values (cannot be modified)
                        </Typography>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'grey.50', 
                          borderRadius: 1, 
                          border: '1px solid', 
                          borderColor: 'grey.200',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          maxHeight: '150px',
                          overflow: 'auto'
                        }}>
                          {existingValues.map((value, index) => (
                            <Typography key={index} variant="body2" sx={{ fontFamily: 'inherit', color: 'text.secondary' }}>
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    <TextField
                      fullWidth
                      label={canOnlyAddValues() ? "Add New Values" : "Permitted Values"}
                      value={permittedValues}
                      onChange={(e) => handlePermittedValuesChange(e.target.value)}
                      placeholder={getPlaceholderForDataType(selectedDataType)}
                      helperText={canOnlyAddValues() 
                        ? `Add new ${selectedDataType} values in JSON format. Existing values cannot be changed.`
                        : `Enter each ${selectedDataType} on a new line in JSON format`
                      }
                      multiline
                      rows={3}
                      InputProps={{
                        sx: {
                          fontFamily: 'monospace',
                          fontSize: '0.875rem'
                        }
                      }}
                    />
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
              {/* Display Name */}
              <TextField
                fullWidth
                label="Display Name"
                value={viewAttribute.displayName}
                variant="outlined"
                size="small"
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    color: 'text.primary',
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'grey.50',
                  }
                }}
              />


              {/* Description */}
              <TextField
                fullWidth
                label="Description"
                value={viewAttribute.description || 'No description provided'}
                variant="outlined"
                size="small"
                multiline
                minRows={2}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    color: 'text.primary',
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'grey.50',
                  }
                }}
              />

              {/* Category and Data Type - Same Row */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Category"
                  value={viewAttribute.category}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      color: 'text.primary',
                      textTransform: 'capitalize',
                    },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'grey.50',
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Data Type"
                  value={viewAttribute.dataType}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      color: 'text.primary',
                      textTransform: 'capitalize',
                    },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'grey.50',
                    }
                  }}
                />
              </Box>

              {/* Used By Categories */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                  Used By Categories
                </Typography>
                <Box sx={{
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 1,
                  p: 1.5,
                  bgcolor: 'grey.50',
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Subject Category */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label="Subject"
                        size="small"
                        color="primary"
                        variant="filled"
                        sx={{
                          minWidth: '80px',
                          '& .MuiChip-label': {
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }
                        }}
                      />
                      <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.875rem' }}>
                        User Role, Employee ID, Security Level, Project Code, Cost Center
                      </Typography>
                    </Box>

                    {/* Resource Category */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label="Resource"
                        size="small"
                        color="secondary"
                        variant="filled"
                        sx={{
                          minWidth: '80px',
                          '& .MuiChip-label': {
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }
                        }}
                      />
                      <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.875rem' }}>
                        File Type, Sensitivity Level, Data Owner
                      </Typography>
                    </Box>

                    {/* Action Category */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label="Action"
                        size="small"
                        color="success"
                        variant="filled"
                        sx={{
                          minWidth: '80px',
                          '& .MuiChip-label': {
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }
                        }}
                      />
                      <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.875rem' }}>
                        Operation Type, Risk Level, Approval Required
                      </Typography>
                    </Box>

                    {/* Environment Category */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label="Environment"
                        size="small"
                        color="warning"
                        variant="filled"
                        sx={{
                          minWidth: '80px',
                          '& .MuiChip-label': {
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }
                        }}
                      />
                      <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.875rem' }}>
                        Time of Day, Location, Network Zone, Device Type
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Permitted Values */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                  Permitted Values
                </Typography>
                {viewAttribute.constraints.enumValues && viewAttribute.constraints.enumValues.length > 0 ? (
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
                ) : (
                  <Box sx={{
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 1,
                    p: 1.5,
                    bgcolor: 'grey.50',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Any value allowed
                    </Typography>
                  </Box>
                )}
              </Box>

            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{
          px: 3,
          pb: 3,
          pt: 1,
          gap: 1.5
        }}>
          <Button
            onClick={handleViewClose}
            variant="text"
            color="inherit"
            sx={{
              textTransform: 'none',
              fontWeight: 500
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
                    bgcolor: `${getCategoryColor(deleteAttribute.category)}.main`,
                    width: 32,
                    height: 32
                  }}>
                    {getCategoryIcon(deleteAttribute.category)}
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
                      bgcolor: `${getCategoryColor(attribute.category)}.main`,
                      width: 28,
                      height: 28
                    }}>
                      {getCategoryIcon(attribute.category)}
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
                      label={attribute.category}
                      size="small"
                      color={getCategoryColor(attribute.category) as any}
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