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
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import { ApiResponse, ResourceObject } from '@/types';

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
}


export default function ObjectsPage() {
  const [objects, setObjects] = useState<ExtendedResourceObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<ResourceObject | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [description, setDescription] = useState('');

  // Search, Filter, Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('displayName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewObject, setViewObject] = useState<ExtendedResourceObject | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteObject, setDeleteObject] = useState<ExtendedResourceObject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Mock data for now - in real implementation this would come from API
  const mockObjects: ExtendedResourceObject[] = [
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
  ];

  const handleClickOpen = (object?: ExtendedResourceObject) => {
    setSelectedObject(object || null);
    setDisplayName(object?.displayName || '');
    setDisplayNameError('');
    setDescription(object?.description || '');
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
      const response = await apiClient.delete(`/resources/${deleteObject?._id}`);

      if (response.success) {
        // Refresh the data by calling fetchObjects
        await fetchObjects();
        handleDeleteClose();
      } else {
        throw new Error(response.error || 'Failed to delete object');
      }
    } catch (error: any) {
      console.error('Error deleting object:', error);

      // If object was not found (404), it might have been already deleted
      // Refresh the data and close the dialog
      if (error.code === 'NOT_FOUND' || error.message?.includes('not found')) {
        console.log('Object not found, refreshing data...');
        await fetchObjects();
        handleDeleteClose();
      } else {
        setError('Failed to delete object');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedObject(null);
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
      const newSelected = paginatedObjects.map((object) => object.id).filter((id): id is string => id !== undefined);
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
        // Refresh the data by calling fetchObjects
        await fetchObjects();

        // Clear selection
        setSelectedObjects([]);

        console.log(`Successfully deleted ${selectedObjects.length} objects`);
      } else {
        throw new Error(response.error || 'Failed to delete objects');
      }
    } catch (error: any) {
      console.error('Failed to delete objects:', error);

      // Always refresh the data to sync with backend state
      await fetchObjects();

      // Clear selection regardless of error
      setSelectedObjects([]);

      // Only show error if it's not a "not found" case
      if (!error.message?.includes('not found') && error.code !== 'NOT_FOUND') {
        setError('Failed to delete some objects. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSelection = () => {
    setSelectedObjects([]);
  };

  // Search and filter handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(0); // Reset to first page
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setPage(0);
  };

  const handleSortChange = (field: string) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
  };

  const handleSubmit = async () => {
    if (!displayName.trim() || displayNameError) {
      return;
    }

    setIsSubmitting(true);
    try {
      const objectData = {
        name: displayName.toLowerCase().replace(/\s+/g, ''),
        displayName: displayName.trim(),
        description: description?.trim() || '',
        type: 'file',
        uri: `/${displayName.toLowerCase().replace(/\s+/g, '')}`,
        active: true,
      };

      if (selectedObject) {
        // Update existing object
        const response = await apiClient.put(`/resources/${selectedObject?._id}`, objectData);

        if (response.success) {
          // Refresh the data by calling fetchObjects
          await fetchObjects();
        }
      } else {
        // Create new object
        const response = await apiClient.post('/resources', objectData);

        if (response.success) {
          // Refresh the data by calling fetchObjects
          await fetchObjects();
        }
      }

      handleClose();
    } catch (error) {
      console.error('Error saving object:', error);
      setError('Failed to save object');
    } finally {
      setIsSubmitting(false);
    }
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
        setTotal(response.pagination?.total || 0);
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

      // Fallback to mock data for demo
      setObjects(mockObjects);
      setTotal(mockObjects.length);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    fetchObjects();
  }, [fetchObjects]);

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

  // Search and filter logic
  const filteredObjects = objects.filter(object => {
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

  const hasActiveFilters = searchTerm.length > 0;

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FolderIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="h5" component="h1" fontWeight="600">
              Resources
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" color="primary.main" fontWeight="600">
              {loading ? '...' : total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Resources
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Manage files, folders, databases, and other system objects in your permission system.
          {hasActiveFilters && (
            <Typography component="span" variant="body2" color="primary.main" sx={{ ml: 1 }}>
              (Filtered)
            </Typography>
          )}
        </Typography>
      </Paper>

      {/* Multi-select Delete */}
      {selectedObjects.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<BulkDeleteIcon />}
            onClick={handleBulkDeleteOpen}
            disabled={isSubmitting}
            sx={{ textTransform: 'none' }}
          >
            Delete {selectedObjects.length} Selected
          </Button>
        </Box>
      )}

      {/* Filter Bar */}
      {selectedObjects.length === 0 && (
        <Paper elevation={0} sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: 'grey.200',
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <TextField
              placeholder="Search objects..."
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
                onClick={() => handleClickOpen()}
                sx={{ textTransform: 'none' }}
              >
                Create Object
              </Button>
            </Box>
          </Box>

          {/* Active Filter Chips */}
          {hasActiveFilters && searchTerm && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={`Search: ${searchTerm}`}
                onDelete={() => setSearchTerm('')}
                size="small"
                color="primary"
              />
            </Box>
          )}
        </Paper>
      )}

      {/* Resources Table */}
      <Card variant="outlined">
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
                          Loading objects...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedObjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No objects found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedObjects.filter(object => object.id).map((object) => {
                      const isItemSelected = isSelected(object.id!);
                      const labelId = `enhanced-table-checkbox-${object.id}`;

                      return (
                        <TableRow
                          key={object.id}
                          hover
                          onClick={() => handleObjectSelect(object.id!)}
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
                          <TableCell align="center" sx={{ width: '120px', minWidth: '120px' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
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
      </Card>

      <Fab 
        color="primary" 
        aria-label="add" 
        sx={{ position: 'fixed', bottom: 24, right: 24 }} 
        onClick={() => handleClickOpen()}
      >
        <AddIcon />
      </Fab>

      {/* Resource Dialog */}
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
            {selectedObject ? 'Edit Object' : 'New Object'}
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
              placeholder="e.g., Customer Database, User Files, System Config"
              error={!!displayNameError}
              helperText={displayNameError || 'Enter the object name'}
            />

            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              variant="outlined"
              placeholder="Brief description of the object"
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
            {isSubmitting ? 'Saving...' : (selectedObject ? 'Update Object' : 'Create Object')}
          </Button>
        </DialogActions>
      </Dialog>

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
            View Object
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
            Delete Object
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pb: 2 }}>
          {deleteObject && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to delete this object?
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
                    bgcolor: `${getTypeColor(deleteObject?.type || 'file')}.main`,
                    width: 32,
                    height: 32
                  }}>
                    {getTypeIcon(deleteObject?.type || 'file')}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">
                      {deleteObject?.displayName || 'No name'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      {deleteObject?.name || 'No name'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This action cannot be undone. The object will be permanently removed from the system.
              </Typography>

              {deleteObject?.metadata?.isSystem && (
                <Typography variant="body2" color="error.main" sx={{ mt: 2, fontWeight: 500 }}>
                  Warning: This is a system object and cannot be deleted.
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
            disabled={isDeleting || Boolean(deleteObject?.metadata?.isSystem)}
            sx={{
              textTransform: 'none',
              minWidth: 80
            }}
          >
            {isDeleting ? 'Deleting...' :
              deleteObject?.metadata?.isSystem ? 'Cannot Delete' : 'Delete'}
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
            Delete Multiple Resources
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pb: 2 }}>
          <Box>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to delete {selectedObjects.length} selected resource{selectedObjects.length > 1 ? 's' : ''}?
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
              This action cannot be undone. The following objects will be permanently deleted:
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
              {selectedObjects.map(objectId => {
                const object = objects.find(obj => obj.id === objectId);
                if (!object) return null;

                return (
                  <Box key={objectId} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Avatar sx={{
                      bgcolor: `${getTypeColor(object?.type || 'file')}.main`,
                      width: 28,
                      height: 28
                    }}>
                      {getTypeIcon(object?.type || 'file')}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="500">
                        {object?.displayName || 'No name'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                        {object?.name || 'No name'}
                      </Typography>
                    </Box>
                    <Chip
                      label={object?.type || 'unknown'}
                      size="small"
                      color={getTypeColor(object?.type || 'file') as any}
                      variant="outlined"
                    />
                  </Box>
                );
              })}
            </Box>

            <Typography variant="body2" color="warning.dark" sx={{ mt: 2, fontWeight: 500 }}>
              Warning: Deleting objects may affect existing policies that reference them.
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
            {isSubmitting ? 'Deleting...' : `Delete ${selectedObjects.length} Resource${selectedObjects.length > 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}