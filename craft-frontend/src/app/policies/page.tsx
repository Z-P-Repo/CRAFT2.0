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
  Fab,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Security as PolicyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Settings as SystemIcon,
  MoreHoriz as MoreIcon,
  SelectAll as SelectAllIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  DeleteSweep as BulkDeleteIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  Clear as ClearIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { canManage, canEdit, canDelete, canCreate } from '@/utils/permissions';

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

export default function PoliciesPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  // State for policies
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Selection state
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterEffect, setFilterEffect] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Delete confirmation dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePolicy, setDeletePolicy] = useState<Policy | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Bulk operations
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  
  // Filter popover
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<HTMLElement | null>(null);

  // Fetch policies
  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        sortBy,
        sortOrder,
        _t: Date.now().toString(), // Cache busting
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus.length > 0) params.append('status', filterStatus.join(','));
      if (filterEffect.length > 0) params.append('effect', filterEffect.join(','));

      const response: ApiResponse<Policy[]> = await apiClient.get(`/policies?${params.toString()}`);

      if (response.success && response.data) {
        setPolicies(response.data || []);
        setTotalCount(response.pagination?.total || 0);
      }
    } catch (error: any) {
      console.error('Failed to fetch policies:', error);
      setError('Failed to load policies. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, filterStatus, filterEffect, sortBy, sortOrder]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Navigation handlers
  const handleViewPolicy = useCallback((policy: Policy) => {
    router.push(`/policies/${policy.id}`);
  }, [router]);

  const handleEditPolicy = useCallback((policy: Policy) => {
    router.push(`/policies/${policy.id}/edit`);
  }, [router]);

  // Delete handlers
  const handleDeleteOpen = useCallback((policy: Policy) => {
    setDeletePolicy(policy);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteOpen(false);
    setDeletePolicy(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletePolicy) return;

    try {
      setDeleteLoading(true);
      const response = await apiClient.delete(`/policies/${deletePolicy.id}`);
      
      if (response.success) {
        setPolicies(policies?.filter(p => p.id !== deletePolicy.id) || []);
        setDeleteOpen(false);
        setDeletePolicy(null);
        // Show success message
      }
    } catch (error: any) {
      console.error('Failed to delete policy:', error);
      setError('Failed to delete policy. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletePolicy, policies]);

  // Selection handlers
  const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedPolicies(policies.map(policy => policy.id));
    } else {
      setSelectedPolicies([]);
    }
  }, [policies]);

  const handleSelectPolicy = useCallback((policyId: string) => {
    setSelectedPolicies(prev => 
      prev.includes(policyId) 
        ? prev.filter(id => id !== policyId)
        : [...prev, policyId]
    );
  }, []);

  // Bulk delete handlers
  const handleBulkDeleteOpen = useCallback(() => {
    setBulkDeleteOpen(true);
  }, []);

  const handleBulkDeleteClose = useCallback(() => {
    setBulkDeleteOpen(false);
  }, []);

  const handleBulkDeleteConfirm = useCallback(async () => {
    try {
      setBulkDeleteLoading(true);
      const response = await apiClient.delete('/policies/bulk/delete', {
        policyIds: selectedPolicies
      });
      
      if (response.success) {
        setPolicies(policies?.filter(p => !selectedPolicies.includes(p.id)) || []);
        setSelectedPolicies([]);
        setBulkDeleteOpen(false);
        // Show success message
      }
    } catch (error: any) {
      console.error('Failed to bulk delete policies:', error);
      setError('Failed to delete policies. Please try again.');
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [selectedPolicies, policies]);

  // Filter and sort handlers
  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterStatus([]);
    setFilterEffect([]);
    setPage(0);
  }, []);

  const handleFilterClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  }, []);

  const handleFilterClose = useCallback(() => {
    setFilterAnchorEl(null);
  }, []);

  const handleSortClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  }, []);

  const handleSortClose = useCallback(() => {
    setSortAnchorEl(null);
  }, []);

  const handleSortChange = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setSortAnchorEl(null);
    setPage(0);
  }, [sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      case 'Draft': return 'warning';
      default: return 'default';
    }
  };

  const getEffectColor = (effect: string) => {
    return effect === 'Allow' ? 'success' : 'error';
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PolicyIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="h5" component="h1" fontWeight="600">
              Access Control Policies
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, textAlign: 'center' }}>
            <Box>
              <Typography variant="h6" color="primary.main" fontWeight="600">
                {loading ? '...' : totalCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="success.main" fontWeight="600">
                {loading ? '...' : policies?.filter(p => p.status === 'Active').length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="warning.main" fontWeight="600">
                {loading ? '...' : policies?.filter(p => p.status === 'Draft').length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Draft
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Manage and monitor your organization's access control policies
          </Typography>
          {canCreate(currentUser) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/policies/create')}
              sx={{ px: 3 }}
            >
              Create Policy
            </Button>
          )}
        </Box>
      </Paper>

      {/* Toolbar */}
      <Paper sx={{ mb: 2 }}>
        <Toolbar sx={{ px: { sm: 2 }, minHeight: '64px !important' }}>
            {selectedPolicies.length > 0 ? (
              <>
                <Typography
                  sx={{ flex: '1 1 100%' }}
                  color="inherit"
                  variant="subtitle1"
                >
                  {selectedPolicies.length} selected
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
                    placeholder="Search policies..."
                    value={searchTerm}
                    onChange={handleSearch}
                    startAdornment={
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    }
                    sx={{ minWidth: 300 }}
                  />
                  
                  {(searchTerm || filterStatus.length > 0 || filterEffect.length > 0) && (
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

      {/* Policies Table */}
      <Paper>
        <TableContainer>
          <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selectedPolicies.length > 0 && selectedPolicies.length < policies.length}
                      checked={policies.length > 0 && selectedPolicies.length === policies.length}
                      onChange={handleSelectAll}
                      inputProps={{
                        'aria-label': 'select all policies',
                      }}
                    />
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: '0.875rem', 
                      color: 'text.primary',
                      width: '450px',
                      minWidth: '350px'
                    }}
                  >
                    Name & Description
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>Effect</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>Created By</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', width: '120px', minWidth: '120px' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : policies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No policies found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  policies.map((policy) => (
                    <TableRow key={policy.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedPolicies.includes(policy.id)}
                          onChange={() => handleSelectPolicy(policy.id)}
                          icon={<CheckBoxOutlineBlankIcon />}
                          checkedIcon={<CheckBoxIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="500">
                            {policy.name}
                          </Typography>
                          {policy.description && (
                            <Typography variant="caption" color="text.secondary">
                              {policy.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={policy.effect} 
                          size="small" 
                          color={getEffectColor(policy.effect) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={policy.status} 
                          size="small" 
                          color={getStatusColor(policy.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {policy.metadata?.createdBy || 'Unknown'}
                        </Typography>
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
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
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
              Filter Policies
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Status (Multi-select)
              </Typography>
              <Box sx={{ mt: 1 }}>
                {['Active', 'Inactive', 'Draft'].map((status) => (
                  <Chip
                    key={status}
                    label={status}
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
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Effect (Multi-select)
              </Typography>
              <Box sx={{ mt: 1 }}>
                {['Allow', 'Deny'].map((effect) => (
                  <Chip
                    key={effect}
                    label={effect}
                    variant={filterEffect.includes(effect) ? 'filled' : 'outlined'}
                    size="small"
                    onClick={() => {
                      setFilterEffect(prev => 
                        prev.includes(effect) 
                          ? prev.filter(e => e !== effect)
                          : [...prev, effect]
                      );
                    }}
                    sx={{ mr: 0.5, mb: 0.5 }}
                    color={filterEffect.includes(effect) ? 'primary' : 'default'}
                  />
                ))}
              </Box>
              {filterEffect.length > 0 && (
                <Button 
                  size="small" 
                  onClick={() => setFilterEffect([])}
                  sx={{ mt: 1, fontSize: '0.75rem' }}
                >
                  Clear Effect
                </Button>
              )}
            </Box>

            {(filterStatus.length > 0 || filterEffect.length > 0) && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  fullWidth
                  onClick={() => {
                    setFilterStatus([]);
                    setFilterEffect([]);
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
              { field: 'name', label: 'Name' },
              { field: 'effect', label: 'Effect' },
              { field: 'status', label: 'Status' },
              { field: 'createdBy', label: 'Created By' },
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteOpen}
          onClose={handleDeleteClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Policy</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the policy "{deletePolicy?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteClose} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error" 
              variant="contained"
              disabled={deleteLoading}
            >
              {deleteLoading ? <CircularProgress size={20} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog
          open={bulkDeleteOpen}
          onClose={handleBulkDeleteClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Selected Policies</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete {selectedPolicies.length} selected policies? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleBulkDeleteClose} disabled={bulkDeleteLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkDeleteConfirm} 
              color="error" 
              variant="contained"
              disabled={bulkDeleteLoading}
            >
              {bulkDeleteLoading ? <CircularProgress size={20} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Policy FAB */}
        {canCreate(currentUser) && (
          <Fab
            color="primary"
            aria-label="add"
            onClick={() => router.push('/policies/create')}
            sx={{ position: 'fixed', bottom: 24, right: 24 }}
          >
            <AddIcon />
          </Fab>
        )}
    </DashboardLayout>
  );
}