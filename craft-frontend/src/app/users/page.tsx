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
  Alert,
  AlertTitle,
  Grid,
  Divider,
  ListItemIcon,
  FormHelperText,
  Autocomplete,
  AccordionSummary,
  AccordionDetails,
  Accordion,
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
  Business as WorkspaceIcon,
  Apps as ApplicationIcon,
  Layers as EnvironmentIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DeleteConfirmationDialog from '@/components/common/DeleteConfirmationDialog';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { apiClient } from '@/lib/api';
import { User, ApiResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { canManage, canEdit, canDelete, canCreate } from '@/utils/permissions';
import RoleProtection from '@/components/auth/RoleProtection';

interface ExtendedUser extends User {
  id?: string;
  displayName?: string;
  workspaceRoles?: Map<string, {
    role: string;
    permissions: string[];
    joinedAt: Date;
  }>;
  assignedWorkspaces?: string[];
  assignedApplications?: string[];
}

interface Workspace {
  _id: string;
  name: string;
  description?: string;
}

interface Application {
  _id: string;
  name: string;
  workspaceId: string;
  description?: string;
}


export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { currentWorkspace, currentApplication } = useWorkspace();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);

  // Data for dropdowns
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);

  // Store applications that belong to user's assigned apps (for value display)
  const [userAssignedApps, setUserAssignedApps] = useState<Application[]>([]);

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
  
  // Assignment states
  const [assignedWorkspaces, setAssignedWorkspaces] = useState<string[]>([]);
  const [assignedApplications, setAssignedApplications] = useState<string[]>([]);
  
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
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Filter and sort menu states
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<HTMLElement | null>(null);
  const filterOpen = Boolean(filterAnchorEl);
  const sortOpen = Boolean(sortAnchorEl);

  // Fetch workspaces for assignment
  const fetchWorkspaces = useCallback(async () => {
    if (currentUser?.role !== 'super_admin') return;
    
    try {
      setLoadingWorkspaces(true);
      const response = await apiClient.get('/workspaces');
      
      if (response.success && response.data) {
        setWorkspaces(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch workspaces:', err);
    } finally {
      setLoadingWorkspaces(false);
    }
  }, [currentUser]);

  // Fetch applications for assignment - dynamically based on selected workspaces
  const fetchApplications = useCallback(async (targetWorkspaces?: string[]) => {
    try {
      setLoadingApplications(true);

      // Use selected workspaces in dialog or all available workspaces
      const workspacesToFetch = targetWorkspaces || assignedWorkspaces;
      const allApplications: Application[] = [];

      if (workspacesToFetch.length > 0) {
        // Filter workspaces to only include those that exist and user has access to
        const validWorkspaces = workspaces.filter(ws => workspacesToFetch.includes(ws._id));

        if (validWorkspaces.length === 0) {
          console.warn('No valid/accessible workspaces found for application fetch:', workspacesToFetch);
          setApplications([]);
          return;
        }

        // Fetch applications only for valid workspaces
        const applicationPromises = validWorkspaces.map(async (workspace) => {
          try {
            const response = await apiClient.get(`/workspaces/${workspace._id}/applications`);
            if (response.success && response.data) {
              return response.data.map((app: Application) => ({
                ...app,
                workspaceId: workspace._id // Ensure workspaceId is set
              }));
            }
            return [];
          } catch (error: any) {
            console.warn(`Failed to fetch applications for workspace ${workspace._id} (${workspace.name}):`, error?.response?.data?.error || error.message);
            return [];
          }
        });

        const applicationArrays = await Promise.all(applicationPromises);
        applicationArrays.forEach(apps => {
          allApplications.push(...apps);
        });
      }

      setApplications(allApplications);
    } catch (err: any) {
      console.error('Failed to fetch applications:', err);
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  }, [assignedWorkspaces, workspaces]);

  // Fetch user's currently assigned applications for editing
  const fetchUserAssignedApplications = useCallback(async (userApplicationIds: string[]) => {
    if (userApplicationIds.length === 0) {
      setUserAssignedApps([]);
      return;
    }

    try {
      const allApps: Application[] = [];

      // Fetch applications from all accessible workspaces to find user's assigned apps
      for (const workspace of workspaces) {
        try {
          const response = await apiClient.get(`/workspaces/${workspace._id}/applications`);
          if (response.success && response.data) {
            const workspaceApps = response.data.map((app: Application) => ({
              ...app,
              workspaceId: workspace._id
            }));
            allApps.push(...workspaceApps);
          }
        } catch (error) {
          // Continue if workspace is not accessible
          console.warn(`Cannot access workspace ${workspace._id} for user app lookup`);
        }
      }

      // Filter to only user's assigned applications
      const userApps = allApps.filter(app => userApplicationIds.includes(app._id));
      setUserAssignedApps(userApps);
    } catch (error) {
      console.error('Failed to fetch user assigned applications:', error);
      setUserAssignedApps([]);
    }
  }, [workspaces]);

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
        // Backend returns paginated data - use it directly
        setUsers(response.data);
        setTotal(response.pagination?.total || 0);

        // For counts, use backend pagination info if available, otherwise count current page
        setActiveCount(response.pagination?.activeCount || response.data.filter((user: User) => user.active).length);
        setInactiveCount(response.pagination?.inactiveCount || response.data.filter((user: User) => !user.active).length);
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
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300); // Standard debounce delay

    return () => clearTimeout(timeoutId);
    // ESLint disable to prevent infinite loop - fetchUsers causes circular dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, sortBy, sortOrder, searchTerm, filterRole, filterStatus]);

  // Load workspaces when component mounts or user changes
  useEffect(() => {
    if (currentUser?.role === 'super_admin') {
      fetchWorkspaces();
    }
  }, [currentUser, fetchWorkspaces]);

  // Load initial applications when component mounts and workspaces are available
  useEffect(() => {
    if (workspaces.length > 0 && assignedWorkspaces.length === 0) {
      // Only load all applications initially when no workspaces are selected
      // This helps with the initial dropdown population
      setApplications([]);
    }
  }, [workspaces, assignedWorkspaces]);

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

    // Role-based validation
    if (role === 'admin' && assignedWorkspaces.length === 0) {
      setError('Admin users must be assigned to at least one workspace');
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
        // Include assignments for non-super-admin users
        ...(role !== 'super_admin' && {
          assignedWorkspaces,
          assignedApplications,
        }),
      };

      let response;
      if (selectedUser) {
        response = await apiClient.put(`/users/${selectedUser._id}`, userData);
      } else {
        response = await apiClient.post('/users', userData);
      }

      if (response.success) {
        await fetchUsers();
        handleSuccessClose();
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

    // Set assignments for editing
    const userWorkspaces = user?.assignedWorkspaces || [];
    const userApps = user?.assignedApplications || [];
    setAssignedWorkspaces(userWorkspaces);
    setAssignedApplications(userApps);

    // Clear previous user assigned apps
    setUserAssignedApps([]);

    // Fetch applications for user's assigned workspaces when editing
    if (user && userWorkspaces.length > 0) {
      fetchApplications(userWorkspaces);
    } else {
      setApplications([]);
    }

    // Fetch user's currently assigned applications to show in value
    if (user && userApps.length > 0) {
      fetchUserAssignedApplications(userApps);
    }

    setOpen(true);
  };

  const handleClose = () => {
    // Check if form has data and show confirmation
    const hasFormData = name.trim() || 
                       email.trim() || 
                       role !== 'basic' ||
                       department.trim() ||
                       password.trim() ||
                       assignedWorkspaces.length > 0 ||
                       assignedApplications.length > 0;
    
    if (hasFormData) {
      setCancelDialogOpen(true);
      return;
    }
    
    // No data, close directly
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
    setAssignedWorkspaces([]);
    setAssignedApplications([]);
    setUserAssignedApps([]);
  };

  // Cancel confirmation handlers
  const handleCancelConfirm = () => {
    setCancelDialogOpen(false);
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
    setAssignedWorkspaces([]);
    setAssignedApplications([]);
    setUserAssignedApps([]);
  };

  const handleCancelCancel = () => {
    setCancelDialogOpen(false);
  };

  // Success handler that closes modal without cancel confirmation
  const handleSuccessClose = () => {
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
    setError('');
    setAssignedWorkspaces([]);
    setAssignedApplications([]);
    setUserAssignedApps([]);
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
      case 'basic': return 'Basic User';
      default: return role;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Full system access across all workspaces and applications';
      case 'admin': return 'Workspace-specific administration and user management';
      case 'basic': return 'Limited access to assigned workspaces and applications';
      default: return '';
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'super_admin':
        return [
          'Access to all workspaces and applications',
          'Create and manage workspaces',
          'Manage all users and assign roles',
          'Configure global settings and policies',
          'Full CRUD operations on all entities'
        ];
      case 'admin':
        return [
          'Access to assigned workspaces only',
          'Manage users within assigned scope',
          'Configure environments and applications',
          'Oversee day-to-day operations',
          'Limited to assigned workspace/application'
        ];
      case 'basic':
        return [
          'View assigned workspaces and applications',
          'Monitor activities and dashboards',
          'Update own profile settings',
          'Read-only access to most features',
          'No administrative privileges'
        ];
      default: return [];
    }
  };

  const getStatusColor = (active: boolean) => {
    return active ? 'success' : 'error';
  };

  // Backend handles filtering, sorting, and pagination
  // Use the users data directly from the API response
  const paginatedUsers = users;

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

  // Check if user can create entities (requires workspace and application selection)
  const canCreateEntity = currentWorkspace && currentApplication && canCreate(currentUser);

  return (
    <ProtectedRoute>
      <RoleProtection allowedRoles={['admin', 'super_admin']}>
        <DashboardLayout>
      {(!currentWorkspace || !currentApplication) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Workspace and Application Required</AlertTitle>
          Please select a workspace and application before creating or managing users. 
          Use the workspace switcher in the header to select your workspace and application.
        </Alert>
      )}
      
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="h5" component="h1" fontWeight="600">
              User Management
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, textAlign: 'center' }}>
            <Box>
              <Typography variant="h6" color="primary.main" fontWeight="600">
                {loading ? '...' : total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Users
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
                {loading ? '...' : users.filter(u => u.role === 'super_admin').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Super Admins
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="warning.main" fontWeight="600">
                {loading ? '...' : users.filter(u => u.role === 'admin').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Admins
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="info.main" fontWeight="600">
                {loading ? '...' : users.filter(u => u.role === 'basic').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Basic Users
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Role Information Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SuperAdminIcon sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="subtitle2" fontWeight="600">
                    Super Admin
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {getRoleDescription('super_admin')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="small"
                    label={`${users.filter(u => u.role === 'super_admin').length} users`}
                    color="error"
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label="Full Access"
                    color="error"
                    variant="filled"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AdminIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="subtitle2" fontWeight="600">
                    Admin
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {getRoleDescription('admin')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="small"
                    label={`${users.filter(u => u.role === 'admin').length} users`}
                    color="warning"
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label="Workspace Scoped"
                    color="warning"
                    variant="filled"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BasicIcon sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="subtitle2" fontWeight="600">
                    Basic User
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {getRoleDescription('basic')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="small"
                    label={`${users.filter(u => u.role === 'basic').length} users`}
                    color="info"
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label="Limited Access"
                    color="info"
                    variant="filled"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Hierarchical user management with role-based access control
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleClickOpen()}
            disabled={!canCreateEntity}
            sx={{ px: 3 }}
          >
            Create User
          </Button>
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
                  <IconButton color="error" onClick={() => {/* Bulk delete functionality */}}>
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
                      Role & Access Level
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                      Workspace Access
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                      Department
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                      Status
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', width: '140px', minWidth: '140px' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          Loading users...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
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
                          <Box>
                            <Chip
                              icon={getRoleIcon(user.role)}
                              label={getRoleDisplayName(user.role)}
                              size="small"
                              color={getRoleColor(user.role) as any}
                              variant="outlined"
                              sx={{ mb: 0.5 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {getRoleDescription(user.role)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ minHeight: '32px', display: 'flex', alignItems: 'center' }}>
                            {user.role === 'super_admin' ? (
                              <Chip
                                icon={<WorkspaceIcon sx={{ fontSize: '16px !important' }} />}
                                label="All Workspaces"
                                size="small"
                                sx={{
                                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                                  color: 'white',
                                  fontWeight: 600,
                                  border: 'none',
                                  '& .MuiChip-icon': {
                                    color: 'white',
                                  },
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                                  },
                                  transition: 'all 0.2s ease-in-out',
                                }}
                              />
                            ) : user.assignedWorkspaces && user.assignedWorkspaces.length > 0 ? (
                              <Box sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                                alignItems: 'center',
                                maxWidth: '220px'
                              }}>
                                {user.assignedWorkspaces.slice(0, 1).map((workspaceId) => {
                                  const workspace = workspaces.find(w => w._id === workspaceId);
                                  return (
                                    <Chip
                                      key={workspaceId}
                                      icon={<WorkspaceIcon sx={{ fontSize: '12px !important' }} />}
                                      label={workspace?.name || 'Unknown'}
                                      size="small"
                                      sx={{
                                        background: user.role === 'admin'
                                          ? 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)'
                                          : 'linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%)',
                                        color: 'white',
                                        fontWeight: 500,
                                        fontSize: '0.7rem',
                                        height: '22px',
                                        border: 'none',
                                        maxWidth: '140px',
                                        '& .MuiChip-icon': {
                                          color: 'white',
                                          marginLeft: '4px',
                                        },
                                        '& .MuiChip-label': {
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          paddingLeft: '4px',
                                          paddingRight: '8px',
                                        },
                                        '&:hover': {
                                          background: user.role === 'admin'
                                            ? 'linear-gradient(135deg, #fb8c00 0%, #ffa726 100%)'
                                            : 'linear-gradient(135deg, #1e88e5 0%, #42a5f5 100%)',
                                          transform: 'scale(1.02)',
                                          boxShadow: user.role === 'admin'
                                            ? '0 2px 6px rgba(255, 167, 38, 0.4)'
                                            : '0 2px 6px rgba(66, 165, 245, 0.4)',
                                        },
                                        transition: 'all 0.15s ease-in-out',
                                      }}
                                    />
                                  );
                                })}
                                {user.assignedWorkspaces.length > 1 && (
                                  <Tooltip
                                    title={
                                      <Box sx={{ p: 0.5 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                          All Assigned Workspaces:
                                        </Typography>
                                        {user.assignedWorkspaces.map((workspaceId, index) => {
                                          const workspace = workspaces.find(w => w._id === workspaceId);
                                          return (
                                            <Typography
                                              key={workspaceId}
                                              variant="body2"
                                              sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                py: 0.25,
                                                fontSize: '0.8rem'
                                              }}
                                            >
                                              <Box
                                                component="span"
                                                sx={{
                                                  width: 6,
                                                  height: 6,
                                                  borderRadius: '50%',
                                                  backgroundColor: user.role === 'admin' ? '#ffa726' : '#42a5f5',
                                                  flexShrink: 0
                                                }}
                                              />
                                              {workspace?.name || 'Unknown Workspace'}
                                            </Typography>
                                          );
                                        })}
                                      </Box>
                                    }
                                    arrow
                                    placement="top"
                                    PopperProps={{
                                      sx: {
                                        '& .MuiTooltip-tooltip': {
                                          backgroundColor: 'background.paper',
                                          color: 'text.primary',
                                          border: '1px solid',
                                          borderColor: 'divider',
                                          boxShadow: 3,
                                          maxWidth: 280,
                                        },
                                        '& .MuiTooltip-arrow': {
                                          color: 'background.paper',
                                          '&::before': {
                                            border: '1px solid',
                                            borderColor: 'divider',
                                          },
                                        },
                                      },
                                    }}
                                  >
                                    <Chip
                                      label={`+${user.assignedWorkspaces.length - 1}`}
                                      size="small"
                                      sx={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                        color: 'text.secondary',
                                        fontWeight: 600,
                                        fontSize: '0.65rem',
                                        height: '22px',
                                        minWidth: '32px',
                                        border: '1px solid rgba(0, 0, 0, 0.08)',
                                        cursor: 'help',
                                        '& .MuiChip-label': {
                                          paddingLeft: '6px',
                                          paddingRight: '6px',
                                        },
                                        '&:hover': {
                                          backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                          transform: 'scale(1.05)',
                                        },
                                        transition: 'all 0.15s ease-in-out',
                                      }}
                                    />
                                  </Tooltip>
                                )}
                              </Box>
                            ) : (
                              <Chip
                                icon={<WarningIcon sx={{ fontSize: '16px !important' }} />}
                                label="No Access"
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                  color: '#f57c00',
                                  border: '1px solid rgba(245, 124, 0, 0.3)',
                                  fontWeight: 500,
                                  '& .MuiChip-icon': {
                                    color: '#f57c00',
                                  },
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 193, 7, 0.15)',
                                    border: '1px solid rgba(245, 124, 0, 0.5)',
                                  },
                                  transition: 'all 0.2s ease-in-out',
                                }}
                              />
                            )}
                          </Box>
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
              <FormHelperText>
                {getRoleDescription(role)}
              </FormHelperText>
            </FormControl>

            {/* Role-based Access Management */}
            {role !== 'super_admin' && (
              <Accordion sx={{ mt: 2, mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="600">
                      Access Assignment {role === 'admin' ? '(Required)' : '(Optional)'}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Alert severity={role === 'admin' ? 'warning' : 'info'} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {role === 'admin' 
                          ? 'Admins must be assigned to specific workspaces and applications they can manage.'
                          : 'Basic users can be assigned to specific workspaces and applications for limited access.'
                        }
                      </Typography>
                    </Alert>
                    
                    <Autocomplete
                      multiple
                      options={workspaces}
                      getOptionLabel={(option) => `${(option as any).displayName || option.name} (${option.name})`}
                      value={workspaces.filter(ws => assignedWorkspaces.includes(ws._id))}
                      onChange={(event, newValue) => {
                        const newWorkspaceIds = newValue.map(ws => ws._id);
                        setAssignedWorkspaces(newWorkspaceIds);

                        // When editing a user, preserve existing applications that are still valid
                        // (i.e., applications that belong to workspaces that are still selected)
                        if (selectedUser && userAssignedApps.length > 0) {
                          // Keep applications that belong to the currently selected workspaces
                          const validExistingApps = assignedApplications.filter(appId => {
                            const app = userAssignedApps.find(a => a._id === appId);
                            return app && newWorkspaceIds.includes(app.workspaceId);
                          });
                          setAssignedApplications(validExistingApps);
                        } else {
                          // For new users or when no existing apps, clear applications
                          setAssignedApplications([]);
                        }

                        // Fetch applications for the newly selected workspaces
                        if (newWorkspaceIds.length > 0) {
                          fetchApplications(newWorkspaceIds);
                        } else {
                          setApplications([]);
                        }
                      }}
                      loading={loadingWorkspaces}
                      disabled={loadingWorkspaces}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Assigned Workspaces"
                          placeholder="Select workspaces..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <WorkspaceIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={option._id}
                            label={(option as any).displayName || option.name}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))
                      }
                    />

                    {assignedWorkspaces.length > 0 && (
                      <Autocomplete
                        multiple
                        options={applications.filter(app => assignedWorkspaces.includes(app.workspaceId))}
                        getOptionLabel={(option) => {
                          const workspace = workspaces.find(ws => ws._id === option.workspaceId);
                          const workspaceName = (workspace as any)?.displayName || workspace?.name || 'Unknown';
                          return `${(option as any).displayName || option.name} (${workspaceName})`;
                        }}
                        value={(() => {
                          // Combine applications from current workspace selection and user's assigned apps
                          const allAvailableApps = [...applications, ...userAssignedApps];
                          // Remove duplicates by _id
                          const uniqueApps = allAvailableApps.filter((app, index, arr) =>
                            arr.findIndex(a => a._id === app._id) === index
                          );
                          // Return only apps that are in assignedApplications
                          return uniqueApps.filter(app => assignedApplications.includes(app._id));
                        })()}
                        onChange={(event, newValue) => {
                          setAssignedApplications(newValue.map(app => app._id));
                        }}
                        loading={loadingApplications}
                        disabled={loadingApplications || applications.length === 0}
                        noOptionsText={
                          loadingApplications
                            ? "Loading applications..."
                            : applications.length === 0
                              ? "No applications found in selected workspaces"
                              : "No applications match filter"
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Assigned Applications"
                            placeholder={
                              loadingApplications
                                ? "Loading..."
                                : applications.length === 0
                                  ? "No applications available"
                                  : "Select applications..."
                            }
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <>
                                  <ApplicationIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                  {params.InputProps.startAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                        renderTags={(tagValue, getTagProps) =>
                          tagValue.map((option, index) => (
                            <Chip
                              {...getTagProps({ index })}
                              key={option._id}
                              label={(option as any).displayName || option.name}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          ))
                        }
                      />
                    )}

                    {assignedWorkspaces.length === 0 && (
                      <Box sx={{ p: 2, border: '1px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" align="center">
                          Select workspaces first to see available applications
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {role === 'super_admin' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SuperAdminIcon />
                  <Typography variant="body2" fontWeight="600">
                    Super Admin Access: Full system access to all workspaces and applications
                  </Typography>
                </Box>
              </Alert>
            )}

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
                
                {/* Role-based Access Information */}
                {viewUser.role !== 'super_admin' && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentIcon color="primary" fontSize="small" />
                        Access Assignments
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Assigned Workspaces
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {viewUser.assignedWorkspaces && viewUser.assignedWorkspaces.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {workspaces
                                  .filter(ws => viewUser.assignedWorkspaces?.includes(ws._id))
                                  .map(workspace => (
                                    <Chip
                                      key={workspace._id}
                                      label={(workspace as any).displayName || workspace.name}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      icon={<WorkspaceIcon />}
                                    />
                                  ))
                                }
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No workspace assignments
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Assigned Applications
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {viewUser.assignedApplications && viewUser.assignedApplications.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {applications
                                  .filter(app => viewUser.assignedApplications?.includes(app._id))
                                  .map(application => (
                                    <Chip
                                      key={application._id}
                                      label={(application as any).displayName || application.name}
                                      size="small"
                                      color="secondary"
                                      variant="outlined"
                                      icon={<ApplicationIcon />}
                                    />
                                  ))
                                }
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No application assignments
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </>
                )}
                
                {viewUser.role === 'super_admin' && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Alert severity="info" icon={<SuperAdminIcon />}>
                      <Typography variant="body2" fontWeight="600">
                        Super Admin Access
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Full system access to all workspaces, applications, and environments
                      </Typography>
                    </Alert>
                  </>
                )}
                
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

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCancelCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          {selectedUser ? 'Cancel User Edit' : 'Cancel User Creation'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to cancel? All your changes will be lost and cannot be recovered.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelCancel} variant="outlined">
            {selectedUser ? 'Continue Editing' : 'Continue Creating'}
          </Button>
          <Button onClick={handleCancelConfirm} variant="contained" color="error">
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        onConfirm={handleDelete}
        title="Delete User"
        item={deleteUser ? {
          id: deleteUser._id || deleteUser.id || '',
          name: deleteUser.name || 'No name',
          displayName: deleteUser.name || 'No name',
          isSystem: false
        } : undefined}
        loading={isDeleting}
        entityName="user"
        entityNamePlural="users"
        additionalInfo="This will permanently remove the user from the system and may affect any policies or permissions associated with them."
      />

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
      </RoleProtection>
    </ProtectedRoute>
  );
}