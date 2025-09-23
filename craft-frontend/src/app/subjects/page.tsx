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
  CircularProgress,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  AdminPanelSettings as RoleIcon,
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
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DeleteConfirmationDialog from '@/components/common/DeleteConfirmationDialog';
import SubjectCreationDialog from '@/components/subjects/SubjectCreationDialog';
import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { canManage, canEdit, canDelete, canCreate } from '@/utils/permissions';
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import RoleProtection from '@/components/auth/RoleProtection';

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
  policyCount?: number;
  usedInPolicies?: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    isSystem: boolean;
    isCustom: boolean;
    version: string;
    externalId?: string;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export default function SubjectsPage() {
  const { user: currentUser } = useAuth();
  const snackbar = useApiSnackbar();
  const { currentWorkspace, currentApplication } = useWorkspace();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  // Search, Filter, Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('displayName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Filter popover
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<HTMLElement | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewSubject, setViewSubject] = useState<Subject | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const handleClickOpen = (subject?: Subject) => {
    setSelectedSubject(subject || null);
    setOpen(true);
  };

  const handleViewOpen = (subject: Subject) => {
    setViewSubject(subject);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setViewSubject(null);
  };

  const handleDeleteOpen = (subject: Subject) => {
    setDeleteSubject(subject);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setDeleteSubject(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteSubject) return;

    setIsDeleting(true);
    try {
      const response = await apiClient.delete(`/subjects/${deleteSubject._id}`);
      
      if (response.success) {
        // Remove from local state immediately
        setSubjects(prev => prev.filter(subj => subj._id !== deleteSubject._id));
        setTotal(prev => prev - 1);
        handleDeleteClose();
        snackbar.showSuccess(`Subject "${deleteSubject.displayName}" deleted successfully`);
      } else {
        snackbar.handleApiResponse(response, undefined, 'Failed to delete subject');
        handleDeleteClose();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      
      // Get the error message from the API response
      const errorMessage = error?.error || error?.message || 'Unknown error';
      
      // Handle specific error cases with better messages
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        snackbar.showInfo('Subject no longer exists. Refreshing the list...');
        await fetchSubjects(); // Refresh the data
        handleDeleteClose();
      } else if (errorMessage.includes('Cannot delete system subjects') ||
        errorMessage.includes('system subject')) {
        snackbar.showWarning('System subjects cannot be deleted as they are required for the system to function properly.');
        handleDeleteClose();
      } else if (errorMessage.includes('Unable to delete') && errorMessage.includes('currently being used in')) {
        // Handle policy dependency error with snackbar
        snackbar.showError(errorMessage);
        handleDeleteClose();
      } else {
        // Handle other API errors
        snackbar.handleApiError(error, 'Failed to delete subject');
        handleDeleteClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSubject(null);
  };


  // Multi-selection handlers
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = paginatedSubjects.map((subject) => subject.id);
      setSelectedSubjects(newSelected);
    } else {
      setSelectedSubjects([]);
    }
  };
  
  const handleSubjectSelect = (subjectId: string) => {
    const selectedIndex = selectedSubjects.indexOf(subjectId);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedSubjects, subjectId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedSubjects.slice(1));
    } else if (selectedIndex === selectedSubjects.length - 1) {
      newSelected = newSelected.concat(selectedSubjects.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedSubjects.slice(0, selectedIndex),
        selectedSubjects.slice(selectedIndex + 1)
      );
    }

    setSelectedSubjects(newSelected);
  };
  
  const isSelected = (subjectId: string) => selectedSubjects.indexOf(subjectId) !== -1;
  
  // Bulk operations handlers
  const handleBulkDeleteOpen = () => {
    setBulkDeleteOpen(true);
  };
  
  const handleBulkDeleteClose = () => {
    setBulkDeleteOpen(false);
  };
  
  const handleBulkDeleteConfirm = async () => {
    if (selectedSubjects.length === 0) return;
    
    setIsSubmitting(true);
    setBulkDeleteOpen(false);
    
    try {
      // Use the bulk delete API endpoint with request method
      const response = await apiClient.request({
        method: 'DELETE',
        url: '/subjects/bulk/delete',
        data: {
          subjectIds: selectedSubjects
        }
      });
      
      if (response.success) {
        // Update local state by filtering out deleted subjects
        setSubjects(prev => prev.filter(subj => !selectedSubjects.includes(subj.id)));
        setTotal(prev => prev - selectedSubjects.length);
        
        // Clear selection
        setSelectedSubjects([]);
        
        // Show success message
        snackbar.showSuccess(`${selectedSubjects.length} subject${selectedSubjects.length === 1 ? '' : 's'} deleted successfully`);
        
      } else {
        throw new Error(response.error || 'Failed to delete subjects');
      }
    } catch (error: any) {
      console.error('Failed to delete subjects:', error);
      
      // Extract error message from API response
      const errorMessage = error?.error || error?.message || 'Unknown error';
      
      // Handle specific error cases
      if (errorMessage.includes('Unable to delete') && errorMessage.includes('currently being used in')) {
        snackbar.showError(errorMessage);
      } else if (!error.message?.includes('not found') && error.code !== 'NOT_FOUND') {
        snackbar.showError('Failed to delete some subjects. Please try again.');
      }
      
      // Update local state instead of refetching
      setSubjects(prev => prev.filter(subject => !selectedSubjects.includes(subject.id)));
      setTotal(prev => Math.max(0, prev - selectedSubjects.length));
      
      // Clear selection regardless of error
      setSelectedSubjects([]);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const clearSelection = () => {
    setSelectedSubjects([]);
  };
  
  // Search and filter handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(0); // Reset to first page
  }, []);

  const handleSortChange = (field: string) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
    setPage(0); // Reset to first page when sorting
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType([]);
    setFilterStatus([]);
    setPage(0);
  };

  const hasActiveFilters = Boolean(searchTerm || filterType.length > 0 || filterStatus.length > 0);

  // Filter and sort handlers
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

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Use subjects directly since pagination, filtering, and sorting are handled server-side
  const paginatedSubjects = subjects;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fetch subjects from API
  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
        sortBy: sortBy,
        sortOrder: sortOrder,
        ...(searchTerm && { search: searchTerm }),
      };

      const response: ApiResponse<Subject[]> & {
        pagination?: {
          page: number;
          limit: number;
          total: number;
          pages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      } = await apiClient.get('/subjects', params);

      if (response.success && response.data) {
        setSubjects(response.data);
        setTotal(response.pagination?.total || 0);
      } else {
        throw new Error(response.error || 'Failed to fetch subjects');
      }
    } catch (err: any) {
      console.error('Error fetching subjects:', err);
      setError(err.message || 'Failed to load subjects');
      // Fallback to empty array
      setSubjects([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSubjects();
    }, 300); // Standard debounce delay
    
    return () => clearTimeout(timeoutId);
    // ESLint disable to prevent infinite loop - fetchSubjects causes circular dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, sortBy, sortOrder, searchTerm]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'primary';
      case 'group': return 'secondary';
      case 'role': return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return <PersonIcon />;
      case 'group': return <GroupIcon />;
      case 'role': return <RoleIcon />;
      default: return <PersonIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'error';
  };

  const handleSubjectCreated = (newSubject: any) => {
    setSubjects(prev => [newSubject, ...prev]);
    setTotal(prev => prev + 1);
    snackbar.showSuccess(`Subject "${newSubject.displayName}" created successfully`);
  };

  const handleSubjectUpdated = (updatedSubject: any) => {
    setSubjects(prev => prev.map(subject => 
      subject._id === updatedSubject._id ? updatedSubject : subject
    ));
    snackbar.showSuccess(`Subject "${updatedSubject.displayName}" updated successfully`);
  };

  // Check if workspace and application are selected
  const canCreateEntity = currentWorkspace && currentApplication && canCreate(currentUser);

  return (
    <ProtectedRoute>
      <RoleProtection allowedRoles={['basic', 'admin', 'super_admin']}>
        <DashboardLayout>
      {/* Workspace Selection Alert */}
      {(!currentWorkspace || !currentApplication) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Workspace and Application Required</AlertTitle>
          Please select a workspace and application before creating or managing subjects. 
          Use the workspace switcher in the header to select your workspace and application.
        </Alert>
      )}

      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PeopleIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="h5" component="h1" fontWeight="600">
              Subjects
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
                {loading ? '...' : subjects?.filter(s => s.status === 'active').length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="warning.main" fontWeight="600">
                {loading ? '...' : subjects?.filter(s => s.status === 'inactive').length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Inactive
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Manage users, groups, and roles in your permission system
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleClickOpen()}
            disabled={!canCreateEntity}
            sx={{ px: 3 }}
          >
            Create Subject
          </Button>
        </Box>
      </Paper>

      {/* Toolbar */}
      <Paper sx={{ mb: 2 }}>
        <Toolbar sx={{ px: { sm: 2 }, minHeight: '64px !important' }}>
          {selectedSubjects.length > 0 ? (
            <>
              <Typography
                sx={{ flex: '1 1 100%' }}
                color="inherit"
                variant="subtitle1"
              >
                {selectedSubjects.length} selected
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
                  placeholder="Search subjects..."
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


      {/* Subjects Table */}
      <Paper>
        {error && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" variant="body1">
              {error}
            </Typography>
            <Button
              variant="outlined"
              onClick={fetchSubjects}
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
                        indeterminate={selectedSubjects.length > 0 && selectedSubjects.length < paginatedSubjects.length}
                        checked={paginatedSubjects.length > 0 && selectedSubjects.length === paginatedSubjects.length}
                        onChange={handleSelectAllClick}
                        inputProps={{
                          'aria-label': 'select all subjects',
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
                          Loading subjects...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedSubjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No subjects found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSubjects.map((subject) => {
                      const isItemSelected = isSelected(subject.id);
                      const labelId = `enhanced-table-checkbox-${subject.id}`;

                      return (
                        <TableRow
                          key={subject.id}
                          hover
                          onClick={() => handleSubjectSelect(subject.id)}
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
                              <Avatar sx={{ bgcolor: `${getTypeColor(subject.type)}.main` }}>
                                {getTypeIcon(subject.type)}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="medium"
                                  id={labelId}
                                >
                                  {subject.displayName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {subject.description || 'No description'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {subject.policyCount !== undefined && subject.policyCount > 0 ? (
                                <Tooltip 
                                  title={
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                        Used in {subject.policyCount} {subject.policyCount === 1 ? 'policy' : 'policies'}:
                                      </Typography>
                                      {subject.usedInPolicies?.slice(0, 5).map((policy, index) => (
                                        <Typography key={policy.id} variant="body2" sx={{ fontSize: '0.75rem' }}>
                                          • {policy.displayName || policy.name}
                                        </Typography>
                                      ))}
                                      {subject.usedInPolicies && subject.usedInPolicies.length > 5 && (
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                                          ... and {subject.usedInPolicies.length - 5} more
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                  arrow
                                  placement="top"
                                >
                                  <Chip
                                    label={subject.policyCount}
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
                              {subject.metadata?.createdBy || 'System'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ width: '120px', minWidth: '120px' }}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewOpen(subject);
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
                                    handleClickOpen(subject);
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
                                    handleDeleteOpen(subject);
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
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Subject Creation/Edit Dialog */}
      <SubjectCreationDialog
        open={open}
        onClose={handleClose}
        onSubjectCreated={handleSubjectCreated}
        onSubjectUpdated={handleSubjectUpdated}
        editingSubject={selectedSubject}
      />

      {/* View Subject Dialog */}
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
            View Subject
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
          {viewSubject && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* Name */}
              <TextField
                fullWidth
                label="Name"
                value={viewSubject.displayName}
                variant="outlined"
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.50' } }}
              />

              {/* Description */}
              <TextField
                fullWidth
                label="Description"
                value={viewSubject.description || 'No description available'}
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
                        {viewSubject.metadata.createdBy}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Version
                      </Typography>
                      <Typography variant="body2">
                        {viewSubject.metadata.version}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography variant="body2">
                        {new Date(viewSubject.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {new Date(viewSubject.updatedAt).toLocaleDateString()}
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
                handleClickOpen(viewSubject!);
              }}
              variant="contained"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 3
              }}
            >
              Edit Subject
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmationDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        title="Delete Subject"
        item={deleteSubject ? {
          id: deleteSubject.id,
          name: deleteSubject.name,
          displayName: deleteSubject.displayName,
          isSystem: deleteSubject.metadata.isSystem
        } : undefined}
        loading={isDeleting}
        entityName="subject"
        entityNamePlural="subjects"
        additionalInfo="Deleting subjects may affect existing policies that reference them."
      />

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onClose={handleBulkDeleteClose}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Multiple Subjects"
        items={selectedSubjects.map(subjectId => {
          const subject = subjects.find(sub => sub.id === subjectId);
          return subject ? {
            id: subject.id,
            name: subject.name,
            displayName: subject.displayName,
            isSystem: subject.metadata.isSystem
          } : { id: subjectId, name: subjectId, displayName: subjectId, isSystem: false };
        }).filter(Boolean)}
        loading={isSubmitting}
        entityName="subject"
        entityNamePlural="subjects"
        bulkMode={true}
        additionalInfo="Deleting subjects may affect existing policies that reference them."
      />

      {/* Filter Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 280 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filter Subjects
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Type (Multi-select)
            </Typography>
            <Box sx={{ mt: 1 }}>
              {['user', 'group', 'role'].map((type) => (
                <Chip
                  key={type}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  variant={filterType.includes(type) ? 'filled' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setFilterType(prev => 
                      prev.includes(type) 
                        ? prev.filter(t => t !== type)
                        : [...prev, type]
                    );
                  }}
                  sx={{ mr: 0.5, mb: 0.5 }}
                  color={filterType.includes(type) ? 'primary' : 'default'}
                />
              ))}
            </Box>
            {filterType.length > 0 && (
              <Button 
                size="small" 
                onClick={() => setFilterType([])}
                sx={{ mt: 1, fontSize: '0.75rem' }}
              >
                Clear Type
              </Button>
            )}
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Status (Multi-select)
            </Typography>
            <Box sx={{ mt: 1 }}>
              {['active', 'inactive'].map((status) => (
                <Chip
                  key={status}
                  label={status.charAt(0).toUpperCase() + status.slice(1)}
                  variant={filterStatus.includes(status) ? 'filled' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setFilterStatus(prev => 
                      prev.includes(status) 
                        ? prev.filter(s => s !== status)
                        : [...prev, status]
                    );
                  }}
                  sx={{ mr: 0.5, mb: 0.5 }}
                  color={filterStatus.includes(status) ? 'primary' : 'default'}
                />
              ))}
            </Box>
            {filterStatus.length > 0 && (
              <Button 
                size="small" 
                onClick={() => setFilterStatus([])}
                sx={{ mt: 1, fontSize: '0.75rem' }}
              >
                Clear Status
              </Button>
            )}
          </Box>

          {(filterType.length > 0 || filterStatus.length > 0) && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button 
                variant="outlined" 
                size="small" 
                fullWidth
                onClick={() => {
                  setFilterType([]);
                  setFilterStatus([]);
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
        open={Boolean(sortAnchorEl)}
        anchorEl={sortAnchorEl}
        onClose={handleSortClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <List>
          {[
            { field: 'displayName', label: 'Name' },
            { field: 'type', label: 'Type' },
            { field: 'status', label: 'Status' },
            { field: 'createdAt', label: 'Created At' },
          ].map(({ field, label }) => (
            <ListItem key={field} onClick={() => handleSortChange(field)} sx={{ cursor: 'pointer' }}>
              <ListItemText primary={label} />
              {sortBy === field && (
                <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                  {sortOrder === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
                </ListItemIcon>
              )}
            </ListItem>
          ))}
        </List>
      </Popover>
        </DashboardLayout>
      </RoleProtection>
    </ProtectedRoute>
  );
}