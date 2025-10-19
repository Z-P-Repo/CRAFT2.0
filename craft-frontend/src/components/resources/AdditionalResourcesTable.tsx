'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
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
  Button,
  Box,
  Typography,
  Checkbox,
  TablePagination,
  Toolbar,
  Tooltip,
  InputAdornment,
  OutlinedInput,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Avatar,
  Switch,
  FormControlLabel,
  Alert,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Settings as ConditionsIcon,
  Schedule as TimeIcon,
  Code as CodeIcon,
  CheckCircle,
  InfoOutlined as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { apiClient } from '@/lib/api';
import DeleteConfirmationDialog from '@/components/common/DeleteConfirmationDialog';

interface AdditionalResource {
  id: string;
  name: string;
  displayName: string;
  type: 'condition' | 'state' | 'approval' | 'status' | 'ticket';
  dataType?: string;
  description?: string;
  attributes: {
    [key: string]: any;
  };
  dependencies?: string[];
  active: boolean;
  metadata: {
    owner: string;
    createdBy: string;
    tags: string[];
    isSystem: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface AdditionalResourcesTableProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  filterType: string;
  filterStatus: string;
  onFilterTypeChange: (type: string) => void;
  onFilterStatusChange: (status: string) => void;
  onResourcesChange: (resources: AdditionalResource[]) => void;
}

const RESOURCE_TYPES = [
  { value: 'condition', label: 'Condition', icon: <ConditionsIcon />, description: 'General conditions that can be evaluated' },
  { value: 'state', label: 'State', icon: <ActiveIcon />, description: 'State-based conditions (Active, Inactive, etc.)' },
  { value: 'approval', label: 'Approval', icon: <CheckCircle />, description: 'Approval-based conditions' },
  { value: 'status', label: 'Status', icon: <InfoIcon />, description: 'Status-based conditions' },
  { value: 'ticket', label: 'Ticket', icon: <CodeIcon />, description: 'Ticket-based conditions (L1, L2, L3, etc.)' }
];

const PREDEFINED_RESOURCE_NAMES = {
  condition: [
    { name: 'Time Based Condition', attributes: { type: 'time', evaluation: 'dynamic' } },
    { name: 'Location Based Condition', attributes: { type: 'location', evaluation: 'static' } },
    { name: 'User Role Condition', attributes: { type: 'role', evaluation: 'dynamic' } },
    { name: 'Security Level Condition', attributes: { type: 'security', evaluation: 'static' } },
    { name: 'Business Hours Condition', attributes: { type: 'business_hours', evaluation: 'time' } }
  ],
  state: [
    { name: 'Active Status', attributes: { status: 'active', enabled: true } },
    { name: 'Inactive Status', attributes: { status: 'inactive', enabled: false } },
    { name: 'Pending Status', attributes: { status: 'pending', enabled: null } },
    { name: 'Completed Status', attributes: { status: 'completed', enabled: true } },
    { name: 'Draft Status', attributes: { status: 'draft', enabled: false } }
  ],
  approval: [
    { name: 'Director Approval', attributes: { approver: 'director', level: 'high' } },
    { name: 'Manager Approval', attributes: { approver: 'manager', level: 'medium' } },
    { name: 'Supervisor Approval', attributes: { approver: 'supervisor', level: 'low' } },
    { name: 'System Auto Approval', attributes: { approver: 'system', level: 'auto' } },
    { name: 'Multi-Level Approval', attributes: { approver: 'multi', level: 'complex' } }
  ],
  status: [
    { name: 'In Progress', attributes: { workflow_status: 'in_progress' } },
    { name: 'Under Review', attributes: { workflow_status: 'under_review' } },
    { name: 'Awaiting Approval', attributes: { workflow_status: 'awaiting_approval' } },
    { name: 'Rejected', attributes: { workflow_status: 'rejected' } },
    { name: 'On Hold', attributes: { workflow_status: 'on_hold' } }
  ],
  ticket: [
    { name: 'L1 Support Ticket', attributes: { level: 'L1', priority: 'low' } },
    { name: 'L2 Support Ticket', attributes: { level: 'L2', priority: 'medium' } },
    { name: 'L3 Support Ticket', attributes: { level: 'L3', priority: 'high' } },
    { name: 'Emergency Ticket', attributes: { level: 'Emergency', priority: 'critical' } },
    { name: 'Incident Ticket', attributes: { level: 'Incident', priority: 'urgent' } }
  ]
};

interface ExtendedAdditionalResourcesTableProps extends AdditionalResourcesTableProps {
  isVisible?: boolean;
}

export default function AdditionalResourcesTable({
  searchTerm,
  onSearchChange,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  sortBy,
  sortOrder,
  onSortChange,
  filterType,
  filterStatus,
  onFilterTypeChange,
  onFilterStatusChange,
  onResourcesChange,
  isVisible = true
}: ExtendedAdditionalResourcesTableProps) {
  const snackbar = useApiSnackbar();
  const { currentWorkspace, currentApplication, currentEnvironment } = useWorkspace();

  const [additionalResources, setAdditionalResources] = useState<AdditionalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDataType, setSelectedDataType] = useState<string>('');
  const [selectedResourceName, setSelectedResourceName] = useState<any>(null);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [predefinedSelection, setPredefinedSelection] = useState<any>(null);
  const [isCustomName, setIsCustomName] = useState(false);
  const [editingResource, setEditingResource] = useState<AdditionalResource | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string>('');
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Filter and sort popover states
  const [filterAnchor, setFilterAnchor] = useState<HTMLButtonElement | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLButtonElement | null>(null);

  const loadAdditionalResources = useCallback(async () => {
    console.log('loadAdditionalResources called');
    console.log('currentWorkspace:', currentWorkspace);
    console.log('currentApplication:', currentApplication);
    console.log('currentEnvironment:', currentEnvironment);

    if (!currentEnvironment) {
      console.log('No environment selected, skipping API call');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Loading additional resources from API...');
      const response = await apiClient.getAdditionalResources({
        page: 1,
        limit: 1000,
        environmentId: currentEnvironment._id,
        applicationId: currentApplication?._id,
        workspaceId: currentWorkspace?._id
      });

      console.log('Additional resources API response:', response);
      console.log('Response data type:', typeof response.data);
      console.log('Is array?:', Array.isArray(response.data));
      console.log('Response data:', response.data);

      // Backend returns { success: true, data: [...], pagination: {...}, filters: {...}, sort: {...} }
      // response.data should be the array of resources
      const resources = Array.isArray(response.data) ? response.data : [];

      console.log('Final resources array:', resources);
      console.log('Resources length:', resources.length);
      setAdditionalResources(resources);
      onResourcesChange(resources);
    } catch (error) {
      console.error('Error loading additional resources:', error);
      snackbar.showError('Failed to load additional resources');
      // Set empty array on error
      setAdditionalResources([]);
      onResourcesChange([]);
    } finally {
      setLoading(false);
    }
  }, [currentEnvironment, currentApplication, currentWorkspace, onResourcesChange, snackbar]);

  // Load resources when tab becomes visible AND environment is selected
  // Only watch primitive values, not the callback function itself to avoid infinite loops
  useEffect(() => {
    console.log('=== Visibility Effect Triggered ===');
    console.log('isVisible:', isVisible);
    console.log('currentEnvironment:', currentEnvironment);
    console.log('currentWorkspace:', currentWorkspace);
    console.log('currentApplication:', currentApplication);

    if (isVisible && currentEnvironment) {
      console.log('✅ Tab is visible AND environment exists, calling loadAdditionalResources');
      loadAdditionalResources();
    } else {
      console.log('❌ NOT loading because:');
      console.log('  - isVisible:', isVisible);
      console.log('  - currentEnvironment exists:', !!currentEnvironment);

      // Set loading to false if we're not going to load
      if (!currentEnvironment) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, currentEnvironment?._id, currentWorkspace?._id, currentApplication?._id]);

  // Listen for create button clicks from header
  useEffect(() => {
    const handleCreateEvent = () => {
      handleCreateClick();
    };

    window.addEventListener('createAdditionalResource', handleCreateEvent);

    return () => {
      window.removeEventListener('createAdditionalResource', handleCreateEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter and sort the resources
  const filteredResources = additionalResources.filter(resource => {
    const matchesSearch = resource.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || resource.type === filterType;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && resource.active) ||
      (filterStatus === 'inactive' && !resource.active);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Sort the filtered resources
  const sortedResources = [...filteredResources].sort((a, b) => {
    let aValue = a[sortBy as keyof AdditionalResource];
    let bValue = b[sortBy as keyof AdditionalResource];

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Paginate the sorted resources
  const paginatedResources = sortedResources.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
    setSelectedType('');
    setSelectedDataType('');
    setSelectedResourceName(null);
    setCustomName('');
    setCustomDescription('');
    setPredefinedSelection(null);
    setIsCustomName(false);
  };

  const handleEditClick = (resource: AdditionalResource) => {
    setEditingResource(resource);
    setSelectedType(resource.type);
    setSelectedDataType(resource.dataType || '');

    // Check if this is a predefined resource name or custom
    const predefinedOptions = getPredefinedResourceNameOptions(resource.type);
    const matchedPredefined = predefinedOptions.find(option => option.name === resource.displayName);

    if (matchedPredefined) {
      setSelectedResourceName(matchedPredefined);
      setIsCustomName(false);
      setCustomName('');
    } else {
      setSelectedResourceName(null);
      setIsCustomName(true);
      setCustomName(resource.displayName);
    }

    setCustomDescription(resource.description || '');
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (resourceId: string) => {
    setDeletingResourceId(resourceId);
    setDeleteDialogOpen(true);
  };

  const handleCreateAdditionalResource = async () => {
    if (!selectedType) {
      snackbar.showError('Please select a resource type');
      return;
    }

    let resourceData;

    if (isCustomName) {
      if (!customName.trim()) {
        snackbar.showError('Please enter a resource name');
        return;
      }

      resourceData = {
        name: customName.toLowerCase().replace(/\s+/g, '_'),
        displayName: customName.trim(),
        type: selectedType,
        dataType: selectedDataType || 'string',
        description: customDescription.trim() || '',
        attributes: {},
        active: true,
        // Backend will automatically set owner, createdBy, and lastModifiedBy from authenticated user
      };
    } else {
      if (!selectedResourceName) {
        snackbar.showError('Please select a predefined resource');
        return;
      }

      resourceData = {
        name: selectedResourceName.name.toLowerCase().replace(/\s+/g, '_'),
        displayName: selectedResourceName.name,
        type: selectedType,
        dataType: selectedDataType || 'string',
        description: customDescription.trim() || `Predefined ${selectedType} resource: ${selectedResourceName.name}`,
        attributes: selectedResourceName.attributes,
        active: true,
        // Backend will automatically set owner, createdBy, and lastModifiedBy from authenticated user
      };
    }

    try {
      console.log('Creating additional resource:', resourceData);

      // Add workspace/application/environment context
      const createData = {
        ...resourceData,
        environmentId: currentEnvironment?._id,
        applicationId: currentApplication?._id,
        workspaceId: currentWorkspace?._id
      };

      const response = await apiClient.createAdditionalResource(createData);
      console.log('Additional resource created successfully:', response.data);

      // Reload the resources to get the updated list from the server
      await loadAdditionalResources();

      snackbar.showSuccess('Additional resource created successfully');
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating additional resource:', error);
      snackbar.showError('Failed to create additional resource');
    }
  };

  const handleUpdateAdditionalResource = async () => {
    if (!editingResource) {
      snackbar.showError('No resource selected for editing');
      return;
    }

    if (isCustomName && !customName.trim()) {
      snackbar.showError('Please enter a resource name');
      return;
    }

    if (!isCustomName && !selectedResourceName) {
      snackbar.showError('Please select a predefined resource');
      return;
    }

    try {
      console.log('Updating additional resource:', editingResource.id);

      const updateData = {
        displayName: isCustomName ? customName.trim() : selectedResourceName?.name,
        description: customDescription.trim() || '',
        dataType: selectedDataType || 'string'
      };

      await apiClient.updateAdditionalResource(editingResource.id, updateData);
      console.log('Additional resource updated successfully');

      // Reload the resources to get the updated list from the server
      await loadAdditionalResources();

      snackbar.showSuccess('Additional resource updated successfully');
      setEditDialogOpen(false);
      setEditingResource(null);
    } catch (error) {
      console.error('Error updating additional resource:', error);
      snackbar.showError('Failed to update additional resource');
    }
  };

  const handleDeleteAdditionalResource = async () => {
    try {
      console.log('Deleting additional resource:', deletingResourceId);

      await apiClient.deleteAdditionalResource(deletingResourceId);
      console.log('Additional resource deleted successfully');

      // Reload the resources to get the updated list from the server
      await loadAdditionalResources();

      snackbar.showSuccess('Additional resource deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingResourceId('');
    } catch (error) {
      console.error('Error deleting additional resource:', error);
      snackbar.showError('Failed to delete additional resource');
    }
  };

  const handleBulkDeleteOpen = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteClose = () => {
    setBulkDeleteDialogOpen(false);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedResources.length === 0) return;

    setIsBulkDeleting(true);
    try {
      console.log('Bulk deleting additional resources:', selectedResources);

      // Delete each resource individually since we may not have a bulk delete endpoint
      const deletePromises = selectedResources.map(resourceId =>
        apiClient.deleteAdditionalResource(resourceId)
      );

      const results = await Promise.allSettled(deletePromises);

      // Count successes and failures
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      // Reload the resources to get the updated list from the server
      await loadAdditionalResources();

      // Clear selection
      setSelectedResources([]);

      // Show appropriate message
      if (successCount > 0 && failureCount === 0) {
        snackbar.showSuccess(`${successCount} additional ${successCount === 1 ? 'resource' : 'resources'} deleted successfully`);
      } else if (successCount > 0 && failureCount > 0) {
        snackbar.showWarning(`${successCount} additional ${successCount === 1 ? 'resource' : 'resources'} deleted successfully. ${failureCount} failed.`);
      } else {
        snackbar.showError(`Failed to delete ${failureCount} additional ${failureCount === 1 ? 'resource' : 'resources'}`);
      }

      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error bulk deleting additional resources:', error);
      snackbar.showError('Failed to delete additional resources');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedResources.length === paginatedResources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(paginatedResources.map(r => r.id));
    }
  };

  const handleSelectResource = (resourceId: string) => {
    setSelectedResources(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = RESOURCE_TYPES.find(t => t.value === type);
    return typeConfig?.icon || <ConditionsIcon />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      condition: 'default',
      state: 'success',
      approval: 'primary',
      status: 'info',
      ticket: 'warning'
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const getPredefinedOptions = () => {
    if (!selectedType || !(selectedType in PREDEFINED_RESOURCE_NAMES)) return [];
    return PREDEFINED_RESOURCE_NAMES[selectedType as keyof typeof PREDEFINED_RESOURCE_NAMES];
  };

  const getPredefinedResourceNameOptions = (resourceType: string) => {
    if (!resourceType || !(resourceType in PREDEFINED_RESOURCE_NAMES)) return [];
    return PREDEFINED_RESOURCE_NAMES[resourceType as keyof typeof PREDEFINED_RESOURCE_NAMES];
  };

  return (
    <>
      {/* Toolbar */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', mb: 2 }}>
        <Toolbar sx={{ px: { sm: 2 }, minHeight: '64px !important' }}>
          {selectedResources.length > 0 ? (
            <>
              <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1">
                {selectedResources.length} selected
              </Typography>
              <Tooltip title="Delete selected">
                <IconButton color="error" onClick={handleBulkDeleteOpen}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Box sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                <OutlinedInput
                  size="small"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  }
                  sx={{ minWidth: 300 }}
                />

                {(filterType !== 'all' || filterStatus !== 'all') && (
                  <Button variant="outlined" startIcon={<ClearIcon />} onClick={() => {
                    onFilterTypeChange('all');
                    onFilterStatusChange('all');
                  }} size="small">
                    Clear
                  </Button>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Filter">
                  <IconButton onClick={(e) => setFilterAnchor(e.currentTarget)}>
                    <FilterIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Sort">
                  <IconButton onClick={(e) => setSortAnchor(e.currentTarget)}>
                    <SortIcon />
                    {sortBy && (
                      sortOrder === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Refresh data - Updates counts and other information">
                  <IconButton onClick={() => window.location.reload()} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          )}
        </Toolbar>
      </Paper>

      {/* Filter Popover */}
      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, minWidth: 200 } }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Filter Additional Resources
        </Typography>

        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          Type
        </Typography>
        {RESOURCE_TYPES.map((type) => (
          <Box key={type.value} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Checkbox
              size="small"
              checked={filterType === type.value}
              onChange={(e) => {
                if (e.target.checked) {
                  onFilterTypeChange(type.value);
                } else {
                  onFilterTypeChange('all');
                }
                setFilterAnchor(null);
              }}
            />
            <Typography variant="body2">
              {type.label}
            </Typography>
          </Box>
        ))}

        <Typography variant="body2" sx={{ mb: 1, mt: 2, fontWeight: 500 }}>
          Status
        </Typography>
        {[{ value: 'active', label: 'Active Resources' }, { value: 'inactive', label: 'Inactive Resources' }].map((status) => (
          <Box key={status.value} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Checkbox
              size="small"
              checked={filterStatus === status.value}
              onChange={(e) => {
                if (e.target.checked) {
                  onFilterStatusChange(status.value);
                } else {
                  onFilterStatusChange('all');
                }
                setFilterAnchor(null);
              }}
            />
            <Typography variant="body2">
              {status.label}
            </Typography>
          </Box>
        ))}
      </Popover>

      {/* Sort Popover */}
      <Popover
        open={Boolean(sortAnchor)}
        anchorEl={sortAnchor}
        onClose={() => setSortAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, minWidth: 200 } }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Sort Additional Resources
        </Typography>

        <List dense>
          <ListItemButton
            onClick={() => { onSortChange('displayName', 'asc'); setSortAnchor(null); }}
            selected={sortBy === 'displayName' && sortOrder === 'asc'}
          >
            <ListItemText primary="Name (A-Z)" />
            {sortBy === 'displayName' && sortOrder === 'asc' && <ArrowUpIcon fontSize="small" />}
          </ListItemButton>
          <ListItemButton
            onClick={() => { onSortChange('displayName', 'desc'); setSortAnchor(null); }}
            selected={sortBy === 'displayName' && sortOrder === 'desc'}
          >
            <ListItemText primary="Name (Z-A)" />
            {sortBy === 'displayName' && sortOrder === 'desc' && <ArrowDownIcon fontSize="small" />}
          </ListItemButton>
          <ListItemButton
            onClick={() => { onSortChange('type', 'asc'); setSortAnchor(null); }}
            selected={sortBy === 'type' && sortOrder === 'asc'}
          >
            <ListItemText primary="Type (A-Z)" />
            {sortBy === 'type' && sortOrder === 'asc' && <ArrowUpIcon fontSize="small" />}
          </ListItemButton>
          <ListItemButton
            onClick={() => { onSortChange('createdAt', 'desc'); setSortAnchor(null); }}
            selected={sortBy === 'createdAt' && sortOrder === 'desc'}
          >
            <ListItemText primary="Newest First" />
            {sortBy === 'createdAt' && sortOrder === 'desc' && <ArrowDownIcon fontSize="small" />}
          </ListItemButton>
          <ListItemButton
            onClick={() => { onSortChange('createdAt', 'asc'); setSortAnchor(null); }}
            selected={sortBy === 'createdAt' && sortOrder === 'asc'}
          >
            <ListItemText primary="Oldest First" />
            {sortBy === 'createdAt' && sortOrder === 'asc' && <ArrowUpIcon fontSize="small" />}
          </ListItemButton>
        </List>
      </Popover>

      {/* Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedResources.length === paginatedResources.length && paginatedResources.length > 0}
                    indeterminate={selectedResources.length > 0 && selectedResources.length < paginatedResources.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>Name & Description</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>Attributes</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', width: '180px', minWidth: '180px' }}>Created By</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', width: '120px', minWidth: '120px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    Loading additional resources...
                  </TableCell>
                </TableRow>
              ) : paginatedResources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No additional resources found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedResources.map((resource) => (
                  <TableRow
                    key={resource.id}
                    hover
                    onClick={() => handleSelectResource(resource.id)}
                    role="checkbox"
                    aria-checked={selectedResources.includes(resource.id)}
                    tabIndex={-1}
                    selected={selectedResources.includes(resource.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={selectedResources.includes(resource.id)}
                        inputProps={{
                          'aria-labelledby': `resource-${resource.id}`,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: `${getTypeColor(resource.type)}.main` }}>
                          {getTypeIcon(resource.type)}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            fontWeight="medium"
                            id={`resource-${resource.id}`}
                          >
                            {resource.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {resource.description || 'No description'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={resource.type}
                        size="small"
                        color={getTypeColor(resource.type) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Object.entries(resource.attributes).length > 0 ? (
                          Object.entries(resource.attributes).slice(0, 3).map(([key, value]) => (
                            <Chip
                              key={key}
                              label={`${key}: ${value}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ))
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No attributes
                          </Typography>
                        )}
                        {Object.entries(resource.attributes).length > 3 && (
                          <Chip
                            label={`+${Object.entries(resource.attributes).length - 3}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ width: '180px', minWidth: '180px' }}>
                      <Typography variant="body2" color="text.secondary">
                        {resource.metadata?.createdBy || 'System'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ width: '120px', minWidth: '120px' }}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            // View functionality can be added here
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(resource);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(resource.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredResources.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        />
      </Paper>

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            zIndex: 1300
          }
        }}
        sx={{
          zIndex: 1300
        }}
      >
        <DialogTitle sx={{
          fontWeight: 600,
          fontSize: '1.25rem',
          px: 3,
          pt: 3,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          Create Additional Resource
          <IconButton
            onClick={() => setCreateDialogOpen(false)}
            sx={{
              color: 'grey.500',
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 2, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Resource Type</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setSelectedResourceName(null);
                  setIsCustomName(false);
                }}
                label="Resource Type"
              >
                <MenuItem value="condition">Condition</MenuItem>
                <MenuItem value="state">State</MenuItem>
                <MenuItem value="approval">Approval</MenuItem>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="ticket">Ticket</MenuItem>
              </Select>
            </FormControl>

            {selectedType && (
              <Autocomplete
                freeSolo
                options={getPredefinedResourceNameOptions(selectedType)}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                value={selectedResourceName}
                onChange={(_, newValue) => {
                  if (typeof newValue === 'string') {
                    setCustomName(newValue);
                    setSelectedResourceName(null);
                    setIsCustomName(true);
                  } else {
                    setSelectedResourceName(newValue);
                    setCustomName('');
                    setIsCustomName(false);
                  }
                }}
                onInputChange={(_, newInputValue) => {
                  if (newInputValue && !getPredefinedResourceNameOptions(selectedType).find(option => option.name === newInputValue)) {
                    setCustomName(newInputValue);
                    setIsCustomName(true);
                  }
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Object.entries(option.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Resource Name"
                    placeholder="Select predefined or enter custom name"
                    fullWidth
                  />
                )}
              />
            )}

            <TextField
              fullWidth
              label="Description"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Describe what this additional resource represents"
              multiline
              rows={3}
            />

            <FormControl fullWidth>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={selectedDataType}
                onChange={(e) => setSelectedDataType(e.target.value)}
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
        </DialogContent>
        <DialogActions sx={{
          px: 3,
          pb: 3,
          pt: 1,
          gap: 1.5
        }}>
          <Button
            onClick={() => setCreateDialogOpen(false)}
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
            onClick={handleCreateAdditionalResource}
            variant="contained"
            disabled={!selectedType || (!isCustomName && !selectedResourceName) || (isCustomName && !customName.trim())}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            Create Resource
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            zIndex: 1300
          }
        }}
        sx={{
          zIndex: 1300
        }}
      >
        <DialogTitle sx={{
          fontWeight: 600,
          fontSize: '1.25rem',
          px: 3,
          pt: 3,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          Edit Additional Resource
          <IconButton
            onClick={() => setEditDialogOpen(false)}
            sx={{
              color: 'grey.500',
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 2, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <FormControl fullWidth disabled>
              <InputLabel>Resource Type</InputLabel>
              <Select
                value={selectedType}
                label="Resource Type"
              >
                <MenuItem value="condition">Condition</MenuItem>
                <MenuItem value="state">State</MenuItem>
                <MenuItem value="approval">Approval</MenuItem>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="ticket">Ticket</MenuItem>
              </Select>
            </FormControl>

            <Autocomplete
              freeSolo
              options={getPredefinedResourceNameOptions(selectedType)}
              getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
              value={selectedResourceName}
              inputValue={isCustomName ? customName : selectedResourceName?.name || ''}
              onChange={(_, newValue) => {
                if (typeof newValue === 'string') {
                  setCustomName(newValue);
                  setSelectedResourceName(null);
                  setIsCustomName(true);
                } else {
                  setSelectedResourceName(newValue);
                  setCustomName('');
                  setIsCustomName(false);
                }
              }}
              onInputChange={(_, newInputValue) => {
                if (newInputValue && !getPredefinedResourceNameOptions(selectedType).find(option => option.name === newInputValue)) {
                  setCustomName(newInputValue);
                  setIsCustomName(true);
                }
              }}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Object.entries(option.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Resource Name"
                  placeholder="Select predefined or enter custom name"
                  fullWidth
                />
              )}
            />

            <TextField
              fullWidth
              label="Description"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              multiline
              rows={3}
            />

            <FormControl fullWidth>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={selectedDataType}
                onChange={(e) => setSelectedDataType(e.target.value)}
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
        </DialogContent>
        <DialogActions sx={{
          px: 3,
          pb: 3,
          pt: 1,
          gap: 1.5
        }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
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
            onClick={handleUpdateAdditionalResource}
            variant="contained"
            disabled={(!isCustomName && !selectedResourceName) || (isCustomName && !customName.trim())}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            Update Resource
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAdditionalResource}
        title="Delete Additional Resource"
        entityName="additional resource"
        entityNamePlural="additional resources"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={bulkDeleteDialogOpen}
        onClose={handleBulkDeleteClose}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Multiple Additional Resources"
        items={selectedResources.map(resourceId => {
          const resource = additionalResources.find(r => r.id === resourceId);
          return resource ? {
            id: resource.id,
            name: resource.name,
            displayName: resource.displayName,
            isSystem: false
          } : { id: resourceId, name: resourceId, displayName: resourceId, isSystem: false };
        })}
        loading={isBulkDeleting}
        entityName="additional resource"
        entityNamePlural="additional resources"
        bulkMode={true}
        additionalInfo="Deleting additional resources may affect existing policies that use them."
      />
    </>
  );
}