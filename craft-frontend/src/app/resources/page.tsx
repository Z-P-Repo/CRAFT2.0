'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ListItemButton,
  ListItemText,
  Checkbox,
  Toolbar,
  Tooltip,
  InputAdornment,
  OutlinedInput,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Folder as FolderIcon,
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
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DeleteConfirmationDialog from '@/components/common/DeleteConfirmationDialog';
import { apiClient } from '@/lib/api';
import { ApiResponse, ResourceObject } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import { canManage, canEdit, canDelete, canCreate } from '@/utils/permissions';
import RoleProtection from '@/components/auth/RoleProtection';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdditionalResourcesTable from '@/components/resources/AdditionalResourcesTable';
import ResourceCreationDialog from '@/components/resources/ResourceCreationDialog';

interface ExtendedResourceObject extends ResourceObject {
  id?: string;
  displayName?: string;
  description?: string;
  type?: 'file' | 'document' | 'api' | 'database' | 'service' | 'folder' | 'application';
  uri?: string;
  attributes?: any;
  children?: string[];
  path?: string;
  owner?: string;
  policyCount?: number;
  usedInPolicies?: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  permissions?: {
    read: boolean;
    write: boolean;
    delete: boolean;
    execute: boolean;
    admin: boolean;
  };
  status?: string;
  metadata?: {
    owner: string;
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    externalId?: string;
    size?: number;
    mimeType?: string;
    isSystem: boolean;
    isCustom: boolean;
    version: string;
  };
  active?: boolean;
  lastAccessed?: string;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | { name?: string }; // Add this field for compatibility
}


export default function ObjectsPage() {
  const { user: currentUser } = useAuth();
  const { currentWorkspace, currentApplication, currentEnvironment } = useWorkspace();
  const snackbar = useApiSnackbar();
  const [objects, setObjects] = useState<ExtendedResourceObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<ResourceObject | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);

  // Search, Filter, Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('displayName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const filterOpen = Boolean(filterAnchorEl);
  const sortOpen = Boolean(sortAnchorEl);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewObject, setViewObject] = useState<ExtendedResourceObject | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteObject, setDeleteObject] = useState<ExtendedResourceObject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Additional Resources State
  const [additionalResources, setAdditionalResources] = useState([]);
  const [additionalResourcesLoading, setAdditionalResourcesLoading] = useState(false);
  const [additionalResourcesPage, setAdditionalResourcesPage] = useState(0);
  const [additionalResourcesRowsPerPage, setAdditionalResourcesRowsPerPage] = useState(10);
  const [additionalResourcesSearchTerm, setAdditionalResourcesSearchTerm] = useState('');
  const [additionalResourcesSortBy, setAdditionalResourcesSortBy] = useState('name');
  const [additionalResourcesSortOrder, setAdditionalResourcesSortOrder] = useState('asc');
  const [additionalResourcesFilterType, setAdditionalResourcesFilterType] = useState('all');
  const [additionalResourcesFilterStatus, setAdditionalResourcesFilterStatus] = useState('all');

  // Mock data for now - in real implementation this would come from API
  const mockObjects: ExtendedResourceObject[] = useMemo(() => [
    {
      _id: '1',
      id: 'object-customer-db',
      name: 'customerDatabase',
      attributeIds: [],
      displayName: 'Customer Database',
      type: 'database',
      path: '/databases/customer_db',
      owner: 'Admin',
      permissions: { read: true, write: true, delete: true, execute: false, admin: false },
      status: 'Active',
      description: 'Main customer database containing user information',
      metadata: {
        owner: 'Admin',
        createdBy: 'System Administrator',
        lastModifiedBy: 'Admin User',
        tags: ['database', 'customer', 'primary'],
        classification: 'confidential' as const,
        isSystem: false,
        isCustom: true,
        version: '1.0.0'
      },
      active: true,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-21T14:22:00Z',
      lastAccessed: '2024-01-21T10:30:00Z'
    },
    {
      _id: '2',
      id: 'object-user-docs',
      name: 'userDocuments',
      attributeIds: [],
      displayName: 'User Documents',
      type: 'folder',
      path: '/documents/users',
      owner: 'HR Manager',
      permissions: { read: true, write: true, delete: false, execute: false, admin: false },
      status: 'Active',
      description: 'Folder containing all user-related documents',
      metadata: {
        owner: 'HR Manager',
        createdBy: 'System Administrator',
        lastModifiedBy: 'HR Manager',
        tags: ['folder', 'documents', 'users'],
        classification: 'internal' as const,
        isSystem: false,
        isCustom: true,
        version: '1.0.0'
      },
      active: true,
      createdAt: '2024-01-16T09:15:00Z',
      updatedAt: '2024-01-20T16:45:00Z',
      lastAccessed: '2024-01-21T09:15:00Z'
    }
  ], []);

  const handleClickOpen = (object?: ExtendedResourceObject) => {
    setSelectedObject(object || null);
    setOpen(true);
  };

  const handleViewOpen = (object: ExtendedResourceObject) => {
    setViewObject(object);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setViewObject(null);
  };

  const handleDeleteOpen = (object: ExtendedResourceObject) => {
    setDeleteObject(object);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setDeleteObject(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteObject) return;

    setIsDeleting(true);
    try {
      const resourceId = deleteObject._id || deleteObject.id;
      const response = await apiClient.delete(`/resources/${resourceId}`);

      if (response.success) {
        // Remove from local state immediately using both id and _id for matching
        const updatedObjects = objects.filter(obj => 
          (obj._id !== deleteObject._id) && 
          (obj.id !== deleteObject.id)
        );
        setObjects(updatedObjects);
        setTotal(updatedObjects.length);
        
        // Clear selection if deleted object was selected
        setSelectedObjects(prev => prev.filter(id => id !== deleteObject.id));
        
        handleDeleteClose();
        snackbar.showSuccess(`Resource "${deleteObject.displayName || deleteObject.name}" deleted successfully`);
      } else {
        throw new Error(response.error || 'Failed to delete object');
      }
    } catch (error: any) {
      console.error('Error deleting object:', error);

      // If object was not found (404), it might have been already deleted
      // Remove from local state and close the dialog
      if (error.code === 'NOT_FOUND' || error.message?.includes('not found')) {
        const updatedObjects = objects.filter(obj => 
          (obj._id !== deleteObject._id) && 
          (obj.id !== deleteObject.id)
        );
        setObjects(updatedObjects);
        setTotal(updatedObjects.length);
        
        // Clear selection if deleted object was selected
        setSelectedObjects(prev => prev.filter(id => id !== deleteObject.id));
        
        handleDeleteClose();
        snackbar.showSuccess(`Resource "${deleteObject.displayName || deleteObject.name}" was already deleted`);
      } else {
        // Extract error message from API response
        const errorMessage = error?.error || error?.message || 'Unknown error';
        
        if (errorMessage.includes('Unable to delete') && errorMessage.includes('currently being used in')) {
          snackbar.showError(errorMessage);
          handleDeleteClose();
        } else {
          snackbar.showError('Failed to delete resource');
          handleDeleteClose();
        }
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedObject(null);
  };

  // Multi-selection handlers
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = paginatedObjects.map((object) => object.id || object._id).filter((id): id is string => id !== undefined && id !== '');
      setSelectedObjects(newSelected);
    } else {
      setSelectedObjects([]);
    }
  };

  const handleObjectSelect = (objectId: string) => {
    const selectedIndex = selectedObjects.indexOf(objectId);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedObjects, objectId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedObjects.slice(1));
    } else if (selectedIndex === selectedObjects.length - 1) {
      newSelected = newSelected.concat(selectedObjects.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedObjects.slice(0, selectedIndex),
        selectedObjects.slice(selectedIndex + 1)
      );
    }

    setSelectedObjects(newSelected);
  };

  const isSelected = (objectId: string) => selectedObjects.indexOf(objectId) !== -1;

  // Bulk operations handlers
  const handleBulkDeleteOpen = () => {
    setBulkDeleteOpen(true);
  };

  const handleBulkDeleteClose = () => {
    setBulkDeleteOpen(false);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedObjects.length === 0) return;

    setIsSubmitting(true);
    setBulkDeleteOpen(false);

    try {
      // Use the bulk delete API endpoint with request method
      const response = await apiClient.request({
        method: 'DELETE',
        url: '/resources/bulk/delete',
        data: {
          resourceIds: selectedObjects
        }
      });

      if (response.success) {
        const { deletedCount, skippedCount, skippedResources, deleted } = response.data;

        // Update local state by filtering out only the deleted resources
        const deletedIds = deleted?.map((resource: any) => resource.id) || [];
        setObjects(prev => prev.filter(obj => !deletedIds.includes(obj.id)));
        setTotal(prev => prev - deletedCount);

        // Clear selection
        setSelectedObjects([]);

        // Show appropriate message based on results
        if (deletedCount > 0 && skippedCount > 0) {
          // Some deleted, some skipped
          const skippedDetails = skippedResources
            ?.map((resource: any) => {
              if (resource.policyCount > 0) {
                return `"${resource.name}" (used in ${resource.policyCount} ${resource.policyCount === 1 ? 'policy' : 'policies'})`;
              }
              return `"${resource.name}" (${resource.reason})`;
            })
            .join(', ');

          snackbar.showWarning(
            `${deletedCount} ${deletedCount === 1 ? 'resource' : 'resources'} deleted successfully. ${skippedCount} ${skippedCount === 1 ? 'resource was' : 'resources were'} skipped: ${skippedDetails}`
          );
        } else if (deletedCount > 0) {
          // All deleted
          snackbar.showSuccess(`${deletedCount} ${deletedCount === 1 ? 'resource' : 'resources'} deleted successfully`);
        } else if (skippedCount > 0) {
          // None deleted, all skipped
          const skippedDetails = skippedResources
            ?.map((resource: any) => {
              if (resource.policyCount > 0) {
                return `"${resource.name}" (used in ${resource.policyCount} ${resource.policyCount === 1 ? 'policy' : 'policies'})`;
              }
              return `"${resource.name}" (${resource.reason})`;
            })
            .join(', ');

          snackbar.showWarning(
            `No resources were deleted. ${skippedCount} ${skippedCount === 1 ? 'resource was' : 'resources were'} skipped: ${skippedDetails}`
          );
        }
      } else {
        throw new Error(response.error || 'Failed to delete resources');
      }
    } catch (error: any) {
      console.error('Failed to delete resources:', error);
      snackbar.handleApiError(error, 'Failed to delete resources');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSelection = () => {
    setSelectedObjects([]);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Clear selection when switching tabs
    setSelectedObjects([]);
  };

  // Search and filter handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(0); // Reset to first page
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus([]);
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

  const handleSortChange = (field: string) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
  };


  // Fetch objects function
  const fetchObjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
      };

      // Only add search if it has a value
      if (searchTerm?.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await apiClient.get('/resources', params);

      if (response.success && response.data) {
        setObjects(response.data);
        setTotal(response.data.length);
        setError(null); // Clear any previous errors
      } else {
        throw new Error(response.error || 'Failed to fetch objects');
      }
    } catch (err: any) {
      console.error('Error fetching objects:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: err.config
      });

      setError(err.response?.data?.error || err.message || 'Failed to load objects');

      // Only fall back to mock data if objects array is empty (first load failure)
      // Don't override existing data on subsequent failures to preserve user interactions
      if (objects.length === 0) {
        setObjects(mockObjects);
        setTotal(mockObjects.length);
      }
    } finally {
      setLoading(false);
    }
    // ESLint disable to prevent infinite loop - mockObjects causes circular dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchObjects();
    }, 300); // Standard debounce delay
    
    return () => clearTimeout(timeoutId);
    // ESLint disable to prevent infinite loop - fetchObjects causes circular dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, sortBy, sortOrder, searchTerm]);


  const getTypeColor = (type: string) => {
    switch (type) {
      case 'file': return 'primary';
      case 'document': return 'primary';
      case 'folder': return 'secondary';
      case 'database': return 'info';
      case 'api': return 'success';
      case 'service': return 'warning';
      case 'application': return 'error';
      default: return 'primary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file': return <FileIcon />;
      case 'document': return <FileIcon />;
      case 'folder': return <FolderIcon />;
      case 'database': return <SystemIcon />;
      case 'api': return <SystemIcon />;
      case 'service': return <SystemIcon />;
      case 'application': return <SystemIcon />;
      default: return <FileIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'success' : 'error';
  };

  // Filter out objects without valid IDs first, then apply search and filter logic
  const validObjects = objects.filter(object => object.id || object._id);
  
  const filteredObjects = validObjects.filter(object => {
    const searchMatch = !searchTerm ||
      object?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      object?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      object?.type?.toLowerCase().includes(searchTerm.toLowerCase());

    return searchMatch;
  });

  // Sort logic
  const sortedObjects = [...filteredObjects].sort((a, b) => {
    const aValue = String(a?.[sortBy as keyof ExtendedResourceObject] || '');
    const bValue = String(b?.[sortBy as keyof ExtendedResourceObject] || '');

    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // Pagination logic
  const paginatedObjects = sortedObjects.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const hasActiveFilters = Boolean(searchTerm || filterStatus.length > 0);

  // Stats calculation
  const activeCount = validObjects.filter(obj => obj.active !== false).length;
  const inactiveCount = validObjects.filter(obj => obj.active === false).length;

  // Additional Resources Stats calculation
  const validAdditionalResources = additionalResources.filter(resource => resource.id);
  const additionalActiveCount = validAdditionalResources.filter(resource => resource.active !== false).length;
  const additionalInactiveCount = validAdditionalResources.filter(resource => resource.active === false).length;

  // Dynamic header content based on tab
  const getHeaderContent = () => {
    if (tabValue === 0) {
      return {
        title: 'Resources',
        description: 'Manage files, folders, databases, and other system objects in your permission system.',
        buttonLabel: 'Create Resource',
        total: validObjects.length,
        active: activeCount,
        inactive: inactiveCount,
        loading: loading
      };
    } else {
      return {
        title: 'Additional Resources',
        description: 'Manage additional resources like conditions, states, and workflows for complex policies.',
        buttonLabel: 'Create Additional Resource',
        total: validAdditionalResources.length,
        active: additionalActiveCount,
        inactive: additionalInactiveCount,
        loading: additionalResourcesLoading
      };
    }
  };

  const headerContent = getHeaderContent();

  // Check if user can create entities (requires workspace, application, and environment selection)
  const canCreateEntity = currentWorkspace && currentApplication && currentEnvironment && canCreate(currentUser);

  return (
    <ProtectedRoute>
      <RoleProtection allowedRoles={['basic', 'admin', 'super_admin']}>
        <DashboardLayout>
      {(!currentWorkspace || !currentApplication || !currentEnvironment) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Workspace, Application, and Environment Required</AlertTitle>
          Please select a workspace, application, and environment before creating or managing resources. 
          Use the workspace switcher in the header to select your workspace and application.
        </Alert>
      )}
      
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FolderIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="h5" component="h1" fontWeight="600">
              {headerContent.title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, textAlign: 'center' }}>
            <Box>
              <Typography variant="h6" color="primary.main" fontWeight="600">
                {headerContent.loading ? '...' : headerContent.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="success.main" fontWeight="600">
                {headerContent.loading ? '...' : headerContent.active}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="error.main" fontWeight="600">
                {headerContent.loading ? '...' : headerContent.inactive}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Inactive
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {headerContent.description}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              if (tabValue === 0) {
                handleClickOpen();
              } else {
                // For Additional Resources tab, we need to trigger the create dialog
                // This will be handled by the AdditionalResourcesTable component
                const event = new CustomEvent('createAdditionalResource');
                window.dispatchEvent(event);
              }
            }}
            disabled={!canCreateEntity}
            sx={{ px: 3 }}
          >
            {headerContent.buttonLabel}
          </Button>
        </Box>
      </Paper>

      {/* Tabs for Resources and Additional Resources */}
      <Paper elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="resources tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem'
            }
          }}
        >
          <Tab label="Resources" id="tab-0" aria-controls="tabpanel-0" />
          <Tab label="Additional Resources" id="tab-1" aria-controls="tabpanel-1" />
        </Tabs>
      </Paper>


      {/* Tab Content */}
      <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
        {/* Toolbar */}
        <Paper sx={{ mb: 2 }}>
        <Toolbar sx={{ px: { sm: 2 }, minHeight: '64px !important' }}>
          {selectedObjects.length > 0 ? (
            <>
              <Typography
                sx={{ flex: '1 1 100%' }}
                color="inherit"
                variant="subtitle1"
              >
                {selectedObjects.length} selected
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
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
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

                <Tooltip title="Refresh data - Updates policy counts and other information">
                  <IconButton 
                    onClick={fetchObjects}
                    disabled={loading}
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.50',
                      }
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          )}
        </Toolbar>
        </Paper>

        {/* Resources Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        {error && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" variant="body1">
              {error}
            </Typography>
            <Button
              variant="outlined"
              onClick={fetchObjects}
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
                        indeterminate={selectedObjects.length > 0 && selectedObjects.length < paginatedObjects.length}
                        checked={paginatedObjects.length > 0 && selectedObjects.length === paginatedObjects.length}
                        onChange={handleSelectAllClick}
                        inputProps={{
                          'aria-label': 'select all objects',
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
                        width: '120px',
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'grey.50' }
                      }}
                      onClick={() => handleSortChange('policyCount')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap' }}>
                        Policies
                        {sortBy === 'policyCount' && (
                          sortOrder === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', width: '180px', minWidth: '180px' }}>
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
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          Loading objects...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedObjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No objects found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedObjects.map((object) => {
                      const objectId = object.id || object._id || '';
                      const isItemSelected = isSelected(objectId);
                      const labelId = `enhanced-table-checkbox-${objectId}`;

                      return (
                        <TableRow
                          key={objectId}
                          hover
                          onClick={() => handleObjectSelect(objectId)}
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
                              <Avatar sx={{ bgcolor: `${getTypeColor(object?.type || 'file')}.main` }}>
                                {getTypeIcon(object?.type || 'file')}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="medium"
                                  id={labelId}
                                >
                                  {object?.displayName || 'No name'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {object?.description || 'No description'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {object.policyCount !== undefined && object.policyCount > 0 ? (
                                <Tooltip 
                                  title={
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                        Used in {object.policyCount} {object.policyCount === 1 ? 'policy' : 'policies'}:
                                      </Typography>
                                      {object.usedInPolicies?.slice(0, 5).map((policy, index) => (
                                        <Typography key={policy.id} variant="body2" sx={{ fontSize: '0.75rem' }}>
                                          • {policy.displayName || policy.name}
                                        </Typography>
                                      ))}
                                      {object.usedInPolicies && object.usedInPolicies.length > 5 && (
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                                          ... and {object.usedInPolicies.length - 5} more
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                  arrow
                                  placement="top"
                                >
                                  <Chip
                                    label={object.policyCount}
                                    size="small"
                                    color="primary"
                                    sx={{ minWidth: '32px', fontWeight: 600 }}
                                  />
                                </Tooltip>
                              ) : (
                                <Chip
                                  label="0"
                                  size="small"
                                  variant="outlined"
                                  sx={{ minWidth: '32px', color: 'text.secondary' }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ width: '180px', minWidth: '180px' }}>
                            <Typography variant="body2" color="text.secondary">
                              {object?.metadata?.createdBy || 
                               (typeof object?.createdBy === 'string' ? object.createdBy : object?.createdBy?.name) || 
                               'System'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ width: '120px', minWidth: '120px' }}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewOpen(object);
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
                                    handleClickOpen(object);
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
                                    handleDeleteOpen(object);
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
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredObjects.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
        </Paper>
      </Box>

      {/* Additional Resources Tab */}
      <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
        <AdditionalResourcesTable
          searchTerm={additionalResourcesSearchTerm}
          onSearchChange={setAdditionalResourcesSearchTerm}
          page={additionalResourcesPage}
          rowsPerPage={additionalResourcesRowsPerPage}
          onPageChange={setAdditionalResourcesPage}
          onRowsPerPageChange={(rowsPerPage) => {
            setAdditionalResourcesRowsPerPage(rowsPerPage);
            setAdditionalResourcesPage(0);
          }}
          sortBy={additionalResourcesSortBy}
          sortOrder={additionalResourcesSortOrder as 'asc' | 'desc'}
          onSortChange={(sortBy, sortOrder) => {
            setAdditionalResourcesSortBy(sortBy);
            setAdditionalResourcesSortOrder(sortOrder);
          }}
          filterType={additionalResourcesFilterType}
          filterStatus={additionalResourcesFilterStatus}
          onFilterTypeChange={setAdditionalResourcesFilterType}
          onFilterStatusChange={setAdditionalResourcesFilterStatus}
          onResourcesChange={(resources) => {
            // Update parent state with the new resources for stats calculation
            setAdditionalResources(resources);
          }}
          isVisible={tabValue === 1}
        />
      </Box>

      {/* Filter Popover */}
      <Popover
        open={filterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
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
          Filter Resources
        </Typography>
        
        <List dense>
          <ListItemButton onClick={() => {}}>            
            <Checkbox size="small" />
            <ListItemText primary="Active Resources" />
          </ListItemButton>
          <ListItemButton onClick={() => {}}>            
            <Checkbox size="small" />
            <ListItemText primary="Inactive Resources" />
          </ListItemButton>
        </List>
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
          Sort Resources
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

      <Fab 
        color="primary" 
        aria-label="add" 
        sx={{ position: 'fixed', bottom: 24, right: 24 }} 
        onClick={() => handleClickOpen()}
        disabled={!canCreateEntity}
      >
        <AddIcon />
      </Fab>

      {/* Resource Creation Dialog */}
      <ResourceCreationDialog
        open={open}
        onClose={handleClose}
        editingResource={selectedObject}
        onResourceCreated={() => {
          fetchObjects();
          handleClose();
        }}
        onResourceUpdated={() => {
          fetchObjects();
          handleClose();
        }}
      />

      {/* View Object Dialog */}
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
            View Resource
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
          {viewObject && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* Name */}
              <TextField
                fullWidth
                label="Name"
                value={viewObject?.displayName || 'No name'}
                variant="outlined"
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.50' } }}
              />

              {/* Description */}
              <TextField
                fullWidth
                label="Description"
                value={viewObject?.description || 'No description available'}
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
                        {viewObject?.metadata?.createdBy || 'Unknown'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Version
                      </Typography>
                      <Typography variant="body2">
                        {viewObject?.metadata?.version || 'Unknown'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography variant="body2">
                        {viewObject?.createdAt ? new Date(viewObject.createdAt).toLocaleDateString() : 'Unknown'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {viewObject?.updatedAt ? new Date(viewObject.updatedAt).toLocaleDateString() : 'Unknown'}
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
          {canEdit(currentUser) && (
            <Button
              onClick={() => {
                handleViewClose();
                handleClickOpen(viewObject!);
              }}
              variant="contained"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 3
              }}
            >
              Edit Resource
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmationDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        title="Delete Resource"
        item={deleteObject ? {
          id: deleteObject.id || deleteObject._id || '',
          name: deleteObject.name || 'No name',
          displayName: deleteObject.displayName || deleteObject.name || 'No name',
          isSystem: Boolean(deleteObject.metadata?.isSystem)
        } : undefined}
        loading={isDeleting}
        entityName="resource"
        entityNamePlural="resources"
        additionalInfo="Deleting resources may affect existing policies that reference them."
      />

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onClose={handleBulkDeleteClose}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Multiple Resources"
        items={selectedObjects.map(objectId => {
          const object = objects.find(obj => obj.id === objectId);
          return object ? {
            id: object.id || object._id || '',
            name: object.name || 'No name',
            displayName: object.displayName || object.name || 'No name',
            isSystem: Boolean(object.metadata?.isSystem)
          } : { id: objectId, name: objectId, displayName: objectId, isSystem: false };
        }).filter(Boolean)}
        loading={isSubmitting}
        entityName="resource"
        entityNamePlural="resources"
        bulkMode={true}
        additionalInfo="Deleting resources may affect existing policies that reference them."
      />
        </DashboardLayout>
      </RoleProtection>
    </ProtectedRoute>
  );
}