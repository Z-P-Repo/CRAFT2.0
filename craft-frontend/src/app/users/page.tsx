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
  ListItemButton,
  ListItemText,
  Checkbox,
  Toolbar,
  Tooltip,
  InputAdornment,
  OutlinedInput,
} from '@mui/material';
import {
  Person as PersonIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  MoreVert as MoreVertIcon,
  Clear as ClearIcon,
  AdminPanelSettings as SuperAdminIcon,
  Security as AdminIcon,
  AccountCircle as BasicIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import { User, ApiResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { canManage, canEdit, canDelete, canCreate } from '@/utils/permissions';

interface ExtendedUser extends User {
  id?: string;
  displayName?: string;
}


export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);

  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [role, setRole] = useState<'super_admin' | 'admin' | 'basic'>('basic');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<keyof ExtendedUser>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Dialog states
  const [viewOpen, setViewOpen] = useState(false);
  const [viewUser, setViewUser] = useState<ExtendedUser | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<ExtendedUser | null>(null);
  const [roleChangeOpen, setRoleChangeOpen] = useState(false);
  const [roleChangeUser, setRoleChangeUser] = useState<ExtendedUser | null>(null);
  const [newRole, setNewRole] = useState<'super_admin' | 'admin' | 'basic'>('basic');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter and sort menu states
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<HTMLElement | null>(null);
  const filterOpen = Boolean(filterAnchorEl);
  const sortOpen = Boolean(sortAnchorEl);

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const params: any = {
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
      };

      if (searchTerm) params.search = searchTerm;
      if (filterRole.length > 0) params.role = filterRole.join(',');
      if (filterStatus.length > 0) params.active = filterStatus.includes('active') ? true : false;

      const response = await apiClient.get('/users', params);

      if (response.success && response.data) {
        setUsers(response.data);
        setTotal(response.pagination?.total || 0);
        
        // Update counts
        const activeUsers = response.data.filter((user: User) => user.active).length;
        setActiveCount(activeUsers);
        setInactiveCount(response.data.length - activeUsers);
      } else {
        throw new Error(response.error || 'Failed to fetch users');
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortOrder, searchTerm, filterRole, filterStatus]);


  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async () => {
    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');

    // Validate
    let hasError = false;
    if (!name.trim()) {
      setNameError('Name is required');
      hasError = true;
    }
    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }
    if (!selectedUser && !password.trim()) {
      setPasswordError('Password is required for new users');
      hasError = true;
    } else if (!selectedUser && password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      const userData = {
        name: name.trim(),
        email: email.trim(),
        role,
        department: department.trim(),
        ...(password && { password }),
      };

      let response;
      if (selectedUser) {
        response = await apiClient.put(`/users/${selectedUser._id}`, userData);
      } else {
        response = await apiClient.post('/users', userData);
      }

      if (response.success) {
        await fetchUsers();
        handleClose();
      } else {
        throw new Error(response.error || 'Failed to save user');
      }
    } catch (error: any) {
      console.error('Failed to save user:', error);
      if (error.response?.data?.error?.includes('email')) {
        setEmailError('A user with this email already exists');
      } else {
        setError('Failed to save user. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async () => {
    if (!roleChangeUser) return;
    
    setIsSubmitting(true);
    try {
      const response = await apiClient.put(`/users/${roleChangeUser._id}/change-role`, {
        role: newRole
      });

      if (response.success) {
        await fetchUsers();
        setRoleChangeOpen(false);
        setRoleChangeUser(null);
      } else {
        throw new Error(response.error || 'Failed to change user role');
      }
    } catch (error: any) {
      console.error('Failed to change role:', error);
      setError(error.response?.data?.error || 'Failed to change user role. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    
    setIsDeleting(true);
    try {
      const response = await apiClient.delete(`/users/${deleteUser._id}`);
      
      if (response.success) {
        // Remove from local state immediately
        const updatedUsers = users.filter(user => user._id !== deleteUser._id);
        setUsers(updatedUsers);
        const usersWithId = updatedUsers.filter(user => user.id);
        setTotal(usersWithId.length);
        handleDeleteClose();
      } else {
        throw new Error(response.error || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      if (error.code === 'NOT_FOUND' || error.message?.includes('not found')) {
        console.log('User not found, removing from local state...');
        const updatedUsers = users.filter(user => user._id !== deleteUser._id);
        setUsers(updatedUsers);
        const usersWithId = updatedUsers.filter(user => user.id);
        setTotal(usersWithId.length);
        handleDeleteClose();
      } else {
        setError('Failed to delete user');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClickOpen = (user?: ExtendedUser) => {
    setSelectedUser(user || null);
    setName(user?.name || '');
    setEmail(user?.email || '');
    setRole(user?.role || 'basic');
    setDepartment(user?.department || '');
    setPassword('');
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
    setName('');
    setEmail('');
    setRole('basic');
    setDepartment('');
    setPassword('');
    setNameError('');
    setEmailError('');
    setPasswordError('');
  };

  const handleViewOpen = (user: ExtendedUser) => {
    setViewUser(user);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setViewUser(null);
  };

  const handleDeleteOpen = (user: ExtendedUser) => {
    setDeleteUser(user);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setDeleteUser(null);
    setIsDeleting(false);
  };

  const handleRoleChangeOpen = (user: ExtendedUser) => {
    setRoleChangeUser(user);
    setNewRole(user.role);
    setRoleChangeOpen(true);
  };

  const handleRoleChangeClose = () => {
    setRoleChangeOpen(false);
    setRoleChangeUser(null);
    setNewRole('basic');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <SuperAdminIcon />;
      case 'admin': return <AdminIcon />;
      case 'basic': return <BasicIcon />;
      default: return <BasicIcon />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'error';
      case 'admin': return 'warning';
      case 'basic': return 'info';
      default: return 'default';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'basic': return 'Basic';
      default: return role;
    }
  };

  const getStatusColor = (active: boolean) => {
    return active ? 'success' : 'error';
  };

  // Filtering and sorting
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesRole = filterRole.length === 0 || filterRole.includes(user.role);
    const matchesStatus = filterStatus.length === 0 || 
      (filterStatus.includes('active') && user.active) ||
      (filterStatus.includes('inactive') && !user.active);
      
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Sort logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = String(a?.[sortBy as keyof ExtendedUser] || '');
    const bValue = String(b?.[sortBy as keyof ExtendedUser] || '');
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const paginatedUsers = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
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

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="h5" component="h1" fontWeight="600">
              Users
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
            Manage user accounts and roles in your system
          </Typography>
          {canCreate(currentUser) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleClickOpen()}
              sx={{ px: 3 }}
            >
              Create User
            </Button>
          )}
        </Box>
      </Paper>


      {/* Toolbar */}
      <Paper sx={{ mb: 2 }}>
        <Toolbar sx={{ px: { sm: 2 }, minHeight: '64px !important' }}>
          {selectedUsers.length > 0 ? (
            <>
              <Typography
                sx={{ flex: '1 1 100%' }}
                color="inherit"
                variant="subtitle1"
              >
                {selectedUsers.length} selected
              </Typography>
              {canDelete(currentUser) && (
                <Tooltip title="Delete selected">
                  <IconButton color="error" onClick={() => console.log('Bulk delete')}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          ) : (
            <>
              <Box sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                <OutlinedInput
                  size="small"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  }
                  sx={{ minWidth: 300 }}
                />
                
                {(searchTerm || filterRole.length > 0 || filterStatus.length > 0) && (
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={() => {
                      setFilterRole([]);
                      setFilterStatus([]);
                      setSearchTerm('');
                    }}
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
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          )}
        </Toolbar>
      </Paper>

      {/* Users Table */}
      <Paper>
        {error && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" variant="body1">
              {error}
            </Typography>
            <Button
              variant="outlined"
              onClick={fetchUsers}
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
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                      User
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                      Role
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                      Department
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                      Status
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
                          Loading users...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No users found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => (
                      <TableRow key={user._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                              {user.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {user.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getRoleIcon(user.role)}
                            label={getRoleDisplayName(user.role)}
                            size="small"
                            color={getRoleColor(user.role) as any}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.department || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.active ? 'Active' : 'Inactive'}
                            size="small"
                            color={getStatusColor(user.active) as any}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewOpen(user)}
                              color="info"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            {canEdit(currentUser) && (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleClickOpen(user)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                            {canManage(currentUser) && (
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => handleRoleChangeOpen(user)}
                              >
                                <AdminIcon fontSize="small" />
                              </IconButton>
                            )}
                            {canDelete(currentUser) && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteOpen(user)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
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
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Create/Edit User Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!nameError}
              helperText={nameError}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError}
              margin="normal"
            />
            {!selectedUser && (
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                margin="normal"
              />
            )}
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as 'super_admin' | 'admin' | 'basic')}
                label="Role"
              >
                <MenuItem value="basic">Basic User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="super_admin">Super Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : selectedUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={roleChangeOpen} onClose={handleRoleChangeClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Change User Role
        </DialogTitle>
        <DialogContent>
          {roleChangeUser && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Change role for <strong>{roleChangeUser.name}</strong>?
              </Typography>
              <FormControl fullWidth>
                <InputLabel>New Role</InputLabel>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'super_admin' | 'admin' | 'basic')}
                  label="New Role"
                >
                  <MenuItem value="basic">Basic User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRoleChangeClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleRoleChange} 
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Changing...' : 'Change Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewOpen} onClose={handleViewClose} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {viewUser && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                  {viewUser.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{viewUser.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {viewUser.email}
                  </Typography>
                  <Chip
                    icon={getRoleIcon(viewUser.role)}
                    label={getRoleDisplayName(viewUser.role)}
                    size="small"
                    color={getRoleColor(viewUser.role) as any}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Department
                  </Typography>
                  <Typography variant="body2">
                    {viewUser.department || 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={viewUser.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={getStatusColor(viewUser.active) as any}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleDateString() : 'Unknown'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={handleDeleteClose}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          {deleteUser && (
            <Typography>
              Are you sure you want to delete <strong>{deleteUser.name}</strong>? This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Popover */}
      <Popover
        open={filterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Filter Users
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            Role
          </Typography>
          {['super_admin', 'admin', 'basic'].map((roleOption) => (
            <Box key={roleOption} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Checkbox
                size="small"
                checked={filterRole.includes(roleOption)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilterRole([...filterRole, roleOption]);
                  } else {
                    setFilterRole(filterRole.filter(r => r !== roleOption));
                  }
                }}
              />
              <Typography variant="body2">
                {getRoleDisplayName(roleOption)}
              </Typography>
            </Box>
          ))}
          
          <Typography variant="body2" sx={{ mb: 1, mt: 2, fontWeight: 500 }}>
            Status
          </Typography>
          {['active', 'inactive'].map((status) => (
            <Box key={status} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Checkbox
                size="small"
                checked={filterStatus.includes(status)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilterStatus([...filterStatus, status]);
                  } else {
                    setFilterStatus(filterStatus.filter(s => s !== status));
                  }
                }}
              />
              <Typography variant="body2">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Typography>
            </Box>
          ))}
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
      >
        <Box sx={{ p: 2, minWidth: 180 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Sort Users
          </Typography>
          
          <List dense>
            <ListItemButton
              onClick={() => {
                setSortBy('name');
                setSortOrder('asc');
                handleSortClose();
              }}
              selected={sortBy === 'name' && sortOrder === 'asc'}
            >
              <ListItemText primary="Name (A-Z)" />
              {sortBy === 'name' && sortOrder === 'asc' && <ArrowUpIcon fontSize="small" />}
            </ListItemButton>
            <ListItemButton
              onClick={() => {
                setSortBy('name');
                setSortOrder('desc');
                handleSortClose();
              }}
              selected={sortBy === 'name' && sortOrder === 'desc'}
            >
              <ListItemText primary="Name (Z-A)" />
              {sortBy === 'name' && sortOrder === 'desc' && <ArrowDownIcon fontSize="small" />}
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
        </Box>
      </Popover>
    </DashboardLayout>
  );
}