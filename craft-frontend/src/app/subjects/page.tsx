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
import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/types';

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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  
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
    setDisplayName(subject?.displayName || '');
    setDisplayNameError('');
    setDescription(subject?.description || '');
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
      } else {
        throw new Error(response.error || 'Failed to delete subject');
      }
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      
      // If subject was not found (404), it might have been already deleted
      // Remove from local state and close the dialog
      if (error.code === 'NOT_FOUND' || error.message?.includes('not found')) {
        console.log('Subject not found, removing from local state...');
        setSubjects(prev => prev.filter(subj => subj._id !== deleteSubject._id));
        setTotal(prev => prev - 1);
        handleDeleteClose();
      } else {
        setError('Failed to delete subject');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSubject(null);
    setDisplayName('');
    setDisplayNameError('');
    setDescription('');
  };

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    if (value.trim().length < 2) {
      setDisplayNameError('Name must be at least 2 characters long.');
    } else {
      setDisplayNameError('');
    }
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
        
        console.log(`Successfully deleted ${selectedSubjects.length} subjects`);
      } else {
        throw new Error(response.error || 'Failed to delete subjects');
      }
    } catch (error: any) {
      console.error('Failed to delete subjects:', error);
      
      // Always refresh the data to sync with backend state
      await fetchSubjects();
      
      // Clear selection regardless of error
      setSelectedSubjects([]);
      
      // Only show error if it's not a "not found" case
      if (!error.message?.includes('not found') && error.code !== 'NOT_FOUND') {
        setError('Failed to delete some subjects. Please try again.');
      }
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
    fetchSubjects();
  }, [fetchSubjects]);

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

  const handleSubmit = async () => {
    if (!displayName.trim() || displayNameError) {
      return;
    }

    setIsSubmitting(true);
    try {
      const subjectData = {
        displayName: displayName.trim(),
        description: description?.trim() || '',
        // Set default values for required backend fields
        name: displayName.toLowerCase().replace(/\s+/g, ''),
        type: 'user',
        role: 'User',
        department: 'General',
        status: 'active',
      };

      if (selectedSubject) {
        // Update existing subject
        const response = await apiClient.put(`/subjects/${selectedSubject._id}`, subjectData);
        
        if (response.success) {
          // Refresh the data by calling fetchSubjects
          await fetchSubjects();
        }
      } else {
        // Create new subject
        const response = await apiClient.post('/subjects', subjectData);
        
        if (response.success) {
          // Refresh the data by calling fetchSubjects
          await fetchSubjects();
        }
      }
      
      handleClose();
    } catch (error) {
      console.error('Error saving subject:', error);
      setError('Failed to save subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
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
              <Tooltip title="Delete selected">
                <IconButton color="error" onClick={handleBulkDeleteOpen}>
                  <BulkDeleteIcon />
                </IconButton>
              </Tooltip>
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
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', width: '120px', minWidth: '120px' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          Loading subjects...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedSubjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
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
                          <TableCell align="center" sx={{ width: '120px', minWidth: '120px' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
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

      {/* Subject Dialog */}
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
            {selectedSubject ? 'Edit Subject' : 'New Subject'}
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
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              variant="outlined"
              placeholder="e.g., John Doe, Marketing Team, Admin Role"
              error={!!displayNameError}
              helperText={displayNameError || 'Enter the subject name'}
            />

            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              variant="outlined"
              placeholder="Brief description of the subject"
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
            {isSubmitting ? 'Saving...' : (selectedSubject ? 'Update Subject' : 'Create Subject')}
          </Button>
        </DialogActions>
      </Dialog>

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
            Delete Subject
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pb: 2 }}>
          {deleteSubject && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to delete this subject?
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
                    bgcolor: `${getTypeColor(deleteSubject.type)}.main`,
                    width: 32,
                    height: 32
                  }}>
                    {getTypeIcon(deleteSubject.type)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">
                      {deleteSubject.displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      {deleteSubject.name}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This action cannot be undone. The subject will be permanently removed from the system.
              </Typography>
              
              {deleteSubject.metadata.isSystem && (
                <Typography variant="body2" color="error.main" sx={{ mt: 2, fontWeight: 500 }}>
                  Warning: This is a system subject and cannot be deleted.
                </Typography>
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
            disabled={isDeleting || Boolean(deleteSubject?.metadata.isSystem)}
            sx={{
              textTransform: 'none',
              minWidth: 80
            }}
          >
            {isDeleting ? 'Deleting...' :
              deleteSubject?.metadata.isSystem ? 'Cannot Delete' : 'Delete'}
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
            Delete Multiple Subjects
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pb: 2 }}>
          <Box>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to delete {selectedSubjects.length} selected subject{selectedSubjects.length > 1 ? 's' : ''}?
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
              This action cannot be undone. The following subjects will be permanently deleted:
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
              {selectedSubjects.map(subjectId => {
                const subject = subjects.find(sub => sub.id === subjectId);
                if (!subject) return null;
                
                return (
                  <Box key={subjectId} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Avatar sx={{
                      bgcolor: `${getTypeColor(subject.type)}.main`,
                      width: 28,
                      height: 28
                    }}>
                      {getTypeIcon(subject.type)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="500">
                        {subject.displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                        {subject.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={subject.type}
                      size="small"
                      color={getTypeColor(subject.type) as any}
                      variant="outlined"
                    />
                  </Box>
                );
              })}
            </Box>
            
            <Typography variant="body2" color="warning.dark" sx={{ mt: 2, fontWeight: 500 }}>
              Warning: Deleting subjects may affect existing policies that reference them.
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
            {isSubmitting ? 'Deleting...' : `Delete ${selectedSubjects.length} Subject${selectedSubjects.length > 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

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
  );
}