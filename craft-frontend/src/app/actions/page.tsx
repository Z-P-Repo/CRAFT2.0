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
  ListItemButton,
  Checkbox,
  Toolbar,
  Tooltip,
  InputAdornment,
  OutlinedInput,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  PlayArrow as ActionIcon,
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
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DeleteConfirmationDialog from '@/components/common/DeleteConfirmationDialog';
import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { canManage, canEdit, canDelete, canCreate } from '@/utils/permissions';
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import RoleProtection from '@/components/auth/RoleProtection';

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
  policyCount?: number;
  usedInPolicies?: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  metadata: {
    owner: string;
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

export default function ActionsPage() {
  const { user: currentUser } = useAuth();
  const { currentWorkspace, currentApplication, currentEnvironment } = useWorkspace();
  const snackbar = useApiSnackbar();
  const [actions, setActions] = useState<ActionObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionObject | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [description, setDescription] = useState('');
  
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
  const [viewAction, setViewAction] = useState<ActionObject | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAction, setDeleteAction] = useState<ActionObject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  
  // Form state - simplified to match Object modal

  // Fetch actions from API
  const fetchActions = useCallback(async () => {
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
      
      const response: ApiResponse<ActionObject[]> = await apiClient.get('/actions', params);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch actions');
      }
      
      setActions(response.data || []);
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
        'Failed to load actions';
      
      setError(errorMessage);
      
      // Fallback to empty array on error
      setActions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchActions();
    }, 300); // Standard debounce delay
    
    return () => clearTimeout(timeoutId);
    // ESLint disable to prevent infinite loop - fetchActions causes circular dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, page, rowsPerPage, sortBy, sortOrder]);

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
    setFilterStatus([]);
    setPage(0);
  }, []);

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

  // Dialog handlers
  const handleClickOpen = useCallback((action?: ActionObject) => {
    if (action) {
      setSelectedAction(action);
      setDisplayName(action.displayName);
      setDescription(action.description || '');
    } else {
      setSelectedAction(null);
      setDisplayName('');
      setDescription('');
    }
    setDisplayNameError('');
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedAction(null);
    setDisplayNameError('');
  }, []);

  const handleViewOpen = useCallback((action: ActionObject) => {
    setViewAction(action);
    setViewOpen(true);
  }, []);

  const handleViewClose = useCallback(() => {
    setViewOpen(false);
    setViewAction(null);
  }, []);

  const handleDeleteOpen = useCallback((action: ActionObject) => {
    setDeleteAction(action);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteOpen(false);
    setDeleteAction(null);
  }, []);

  const handleDelete = async () => {
    if (!deleteAction) return;
    
    try {
      setIsDeleting(true);
      
      const response = await apiClient.delete(`/actions/${deleteAction._id}`);
      
      if (response.success) {
        // Remove from local state immediately
        setActions(prev => prev.filter(action => action._id !== deleteAction._id));
        setTotal(prev => prev - 1);
        handleDeleteClose();
        snackbar.showSuccess(`Action "${deleteAction.displayName}" deleted successfully`);
      } else {
        snackbar.handleApiResponse(response, undefined, 'Failed to delete action');
        handleDeleteClose();
      }
      
    } catch (error: any) {
      console.error('Delete error:', error);
      
      // Get the error message from the API response
      const errorMessage = error?.error || error?.message || 'Unknown error';
      
      // Handle specific error cases with better messages
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        snackbar.showInfo('Action no longer exists. Refreshing the list...');
        await fetchActions(); // Refresh the data
        handleDeleteClose();
      } else if (errorMessage.includes('Cannot delete system actions') ||
        errorMessage.includes('system action')) {
        snackbar.showWarning('System actions cannot be deleted as they are required for the system to function properly.');
        handleDeleteClose();
      } else if (errorMessage.includes('Unable to delete') && errorMessage.includes('currently being used in')) {
        // Handle policy dependency error with snackbar
        snackbar.showError(errorMessage);
        handleDeleteClose();
      } else {
        // Handle other API errors
        snackbar.handleApiError(error, 'Failed to delete action');
        handleDeleteClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async () => {
    if (!displayName.trim() || displayNameError) {
      return;
    }

    // Check if required context is available
    if (!currentWorkspace || !currentApplication || !currentEnvironment) {
      snackbar.showError('Please select a workspace, application, and environment before creating an action.');
      return;
    }

    setIsSubmitting(true);
    try {
      const actionData = {
        name: displayName.toLowerCase().replace(/\s+/g, ''),
        displayName: displayName.trim(),
        description: description?.trim() || '',
        category: 'read',
        riskLevel: 'low',
        active: true,
        // Required workspace context for backend validation
        workspaceId: currentWorkspace._id,
        applicationId: currentApplication._id,
        environmentId: currentEnvironment._id,
        metadata: {
          owner: currentUser?.name || 'System',
          createdBy: currentUser?.name || 'System',
          lastModifiedBy: currentUser?.name || 'System',
          tags: [],
          isSystem: false,
          isCustom: true,
          version: '1.0.0'
        }
      };

      if (selectedAction) {
        // Update existing action
        const response = await apiClient.put(`/actions/${selectedAction._id}`, actionData);
        
        if (response.success) {
          // Refresh the data by calling fetchActions
          await fetchActions();
          snackbar.showSuccess(`Action "${actionData.displayName}" updated successfully`);
          handleClose();
        } else {
          snackbar.handleApiResponse(response, undefined, 'Failed to update action');
        }
      } else {
        // Create new action
        const response = await apiClient.post('/actions', actionData);
        
        if (response.success) {
          // Refresh the data by calling fetchActions
          await fetchActions();
          snackbar.showSuccess(`Action "${actionData.displayName}" created successfully`);
          handleClose();
        } else {
          snackbar.handleApiResponse(response, undefined, 'Failed to create action');
        }
      }
      
    } catch (error: any) {
      console.error('Failed to save action:', error);
      
      // Handle specific duplicate error
      if (error?.error && error.error.includes('already exists')) {
        snackbar.showError(`Action "${displayName.trim()}" already exists. Please choose a different name.`);
      } else {
        snackbar.handleApiError(error, 'Failed to save action. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Multi-select handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = actions.map(action => action._id);
      setSelectedActions(newSelected);
    } else {
      setSelectedActions([]);
    }
  };

  const handleSelectAction = (actionId: string) => {
    const selectedIndex = selectedActions.indexOf(actionId);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedActions, actionId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedActions.slice(1));
    } else if (selectedIndex === selectedActions.length - 1) {
      newSelected = newSelected.concat(selectedActions.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedActions.slice(0, selectedIndex),
        selectedActions.slice(selectedIndex + 1),
      );
    }

    setSelectedActions(newSelected);
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
      
      const response = await apiClient.delete('/actions/bulk/delete', {
        actionIds: selectedActions
      });
      
      if (response.success) {
        // Update local state by filtering out deleted actions
        setActions(prev => prev.filter(action => !selectedActions.includes(action._id)));
        setTotal(prev => prev - selectedActions.length);
        
        setSelectedActions([]);
        handleBulkDeleteClose();
        snackbar.showSuccess(`${selectedActions.length} actions deleted successfully`);
      } else {
        snackbar.handleApiResponse(response, undefined, 'Failed to delete actions');
        handleBulkDeleteClose();
      }
      
    } catch (error: any) {
      console.error('Failed to delete actions:', error);
      
      // Get the error message from the API response
      const errorMessage = error?.error || error?.message || 'Unknown error';
      
      // Handle specific error cases
      if (errorMessage.includes('Cannot delete system actions')) {
        snackbar.showWarning('Some actions could not be deleted because they are system actions required for the system to function.');
        handleBulkDeleteClose();
      } else if (errorMessage.includes('Unable to delete') && errorMessage.includes('currently being used in')) {
        // Handle policy dependency error with simplified message
        snackbar.showError(errorMessage);
        handleBulkDeleteClose();
      } else {
        snackbar.handleApiError(error, 'Failed to delete actions');
        handleBulkDeleteClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(searchTerm || filterStatus.length > 0);

  // Stats calculation
  const activeCount = actions.filter(action => action.active !== false).length;
  const inactiveCount = actions.filter(action => action.active === false).length;

  // Check if user can create entities (requires workspace, application, and environment selection)
  const canCreateEntity = currentWorkspace && currentApplication && currentEnvironment && canCreate(currentUser);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'read': return <ViewIcon />;
      case 'write': return <EditIcon />;
      case 'execute': return <ActionIcon />;
      case 'delete': return <DeleteIcon />;
      case 'admin': return <SystemIcon />;
      default: return <ActionIcon />;
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
    <RoleProtection allowedRoles={['basic', 'admin', 'super_admin']}>
      <DashboardLayout>
      {(!currentWorkspace || !currentApplication || !currentEnvironment) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Workspace, Application, and Environment Required</AlertTitle>
          Please select a workspace, application, and environment before creating or managing actions. 
          Use the workspace switcher in the header to select your workspace and application.
        </Alert>
      )}
      
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ActionIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="h5" component="h1" fontWeight="600">
              Actions
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
              <Typography variant="h6" color="error.main" fontWeight="600">
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
            Manage system actions and operations in your permission system.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleClickOpen()}
            disabled={!canCreateEntity}
            sx={{ px: 3 }}
          >
            Create Action
          </Button>
        </Box>
      </Paper>

      {/* Toolbar */}
      <Paper sx={{ mb: 2 }}>
        <Toolbar sx={{ px: { sm: 2 }, minHeight: '64px !important' }}>
          {selectedActions.length > 0 ? (
            <>
              <Typography
                sx={{ flex: '1 1 100%' }}
                color="inherit"
                variant="subtitle1"
              >
                {selectedActions.length} selected
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
                  placeholder="Search actions..."
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
              </Box>
            </>
          )}
        </Toolbar>
      </Paper>

      {/* Actions Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell padding="checkbox" sx={{ width: '48px' }}>
                  <Checkbox
                    color="primary"
                    indeterminate={selectedActions.length > 0 && selectedActions.length < actions.length}
                    checked={actions.length > 0 && selectedActions.length === actions.length}
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
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.875rem', 
                    color: 'text.primary',
                    width: '120px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                  onClick={() => handleSort('policyCount')}
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
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', width: '120px' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Loading actions...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="error" variant="body1">
                      {error}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : actions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No actions found
                    </Typography>
                    {hasActiveFilters && (
                      <Button
                        size="small"
                        onClick={clearFilters}
                        sx={{ mt: 1 }}
                      >
                        Clear filters to see all actions
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                actions.map((action) => {
                  const isItemSelected = selectedActions.includes(action._id);
                  return (
                    <TableRow
                      key={action._id}
                      hover
                      selected={isItemSelected}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onChange={() => handleSelectAction(action._id)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              width: 40, 
                              height: 40, 
                              bgcolor: `${getCategoryColor(action.category)}.main`,
                              color: 'white'
                            }}
                          >
                            {getCategoryIcon(action.category)}
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="subtitle2" 
                              fontWeight="500" 
                              color="text.primary"
                              sx={{ mb: 0.5 }}
                            >
                              {action.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {action.description || 'No description available'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {action.policyCount !== undefined && action.policyCount > 0 ? (
                            <Tooltip 
                              title={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                    Used in {action.policyCount} {action.policyCount === 1 ? 'policy' : 'policies'}:
                                  </Typography>
                                  {action.usedInPolicies?.slice(0, 5).map((policy, index) => (
                                    <Typography key={policy.id} variant="body2" sx={{ fontSize: '0.75rem' }}>
                                      • {policy.displayName || policy.name}
                                    </Typography>
                                  ))}
                                  {action.usedInPolicies && action.usedInPolicies.length > 5 && (
                                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                                      ... and {action.usedInPolicies.length - 5} more
                                    </Typography>
                                  )}
                                </Box>
                              }
                              arrow
                              placement="top"
                            >
                              <Chip
                                label={action.policyCount}
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
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {action.metadata?.createdBy || 'System'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewOpen(action)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canEdit(currentUser) && (
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleClickOpen(action)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDelete(currentUser) && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteOpen(action)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
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
          Filter Actions
        </Typography>
        
        <List dense>
          <ListItem onClick={() => {}} sx={{ cursor: 'pointer' }}>            
            <Checkbox size="small" />
            <ListItemText primary="Active Actions" />
          </ListItem>
          <ListItem onClick={() => {}} sx={{ cursor: 'pointer' }}>            
            <Checkbox size="small" />
            <ListItemText primary="Inactive Actions" />
          </ListItem>
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
          Sort Actions
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

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleClickOpen()}
        disabled={!canCreateEntity}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Create/Edit Action Dialog */}
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
            {selectedAction ? 'Edit Action' : 'Create Action'}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
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
              placeholder="e.g., Read User Profile, Delete Account, System Backup"
              error={!!displayNameError}
              helperText={displayNameError || 'Enter the action name'}
            />

            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              variant="outlined"
              placeholder="Brief description of the action"
              multiline
              rows={3}
            />
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
              textTransform: 'none',
              minWidth: 100,
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
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting || !displayName.trim() || !!displayNameError}
            sx={{
              textTransform: 'none',
              minWidth: 120,
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            {isSubmitting ? 'Saving...' : (selectedAction ? 'Update Action' : 'Create Action')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Action Dialog */}
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
            View Action
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
          {viewAction && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* Name */}
              <TextField
                fullWidth
                label="Name"
                value={viewAction.displayName}
                variant="outlined"
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.50' } }}
              />

              {/* Description */}
              <TextField
                fullWidth
                label="Description"
                value={viewAction.description || 'No description available'}
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
                        {viewAction.metadata.createdBy}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Version
                      </Typography>
                      <Typography variant="body2">
                        {viewAction.metadata.version}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography variant="body2">
                        {new Date(viewAction.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {new Date(viewAction.updatedAt).toLocaleDateString()}
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
                handleClickOpen(viewAction!);
              }}
              variant="contained"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 3
              }}
            >
              Edit Action
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        onConfirm={handleDelete}
        title="Delete Action"
        item={deleteAction ? {
          id: deleteAction._id || deleteAction.id || '',
          name: deleteAction.name || 'No name',
          displayName: deleteAction.displayName || deleteAction.name || 'No name',
          isSystem: false
        } : undefined}
        loading={isDeleting}
        entityName="action"
        entityNamePlural="actions"
        additionalInfo="This will permanently remove the action and all associated configurations."
      />

      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onClose={handleBulkDeleteClose}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Actions"
        items={selectedActions.map(actionId => {
          const action = actions.find(a => a._id === actionId);
          return action ? {
            id: action._id || action.id || '',
            name: action.name || 'No name',
            displayName: action.displayName || action.name || 'No name',
            isSystem: false
          } : {
            id: actionId,
            name: 'Unknown Action',
            displayName: 'Unknown Action',
            isSystem: false
          };
        })}
        loading={isDeleting}
        entityName="action"
        entityNamePlural="actions"
        bulkMode={true}
        additionalInfo="This will permanently remove all selected actions and their associated configurations."
      />
      </DashboardLayout>
    </RoleProtection>
  );
}