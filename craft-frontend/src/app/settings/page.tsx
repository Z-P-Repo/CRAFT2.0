'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Business as WorkspaceIcon,
  Apps as ApplicationIcon,
  Science as EnvironmentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface UserInfo {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface HierarchyItem {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  status?: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    createdBy: UserInfo | string;
    lastModifiedBy: UserInfo | string;
    owner: UserInfo | string;
    [key: string]: any;
  };
}

interface WorkspaceWithChildren extends HierarchyItem {
  applications: ApplicationWithChildren[];
}

interface ApplicationWithChildren extends HierarchyItem {
  workspaceId: string;
  environments: EnvironmentItem[];
}

interface EnvironmentItem extends HierarchyItem {
  workspaceId: string;
  applicationId: string;
  configuration?: any;
}

// Helper function moved outside component to prevent recreation
const extractErrorMessage = (error: any): string => {
  // If it's an API response error with specific error field
  if (error?.error) {
    return error.error;
  }
  
  // If it's an axios error with response data
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  // If it's a validation error with details
  if (error?.response?.data?.details && Array.isArray(error.response.data.details)) {
    const validationErrors = error.response.data.details
      .map((detail: any) => detail.msg || detail.message)
      .filter(Boolean);
    if (validationErrors.length > 0) {
      return validationErrors.join(', ');
    }
  }
  
  // If it's a standard error with message
  if (error?.message) {
    return error.message;
  }
  
  // If it's a string error
  if (typeof error === 'string') {
    return error;
  }
  
  // Fallback for unknown error formats
  return 'An unexpected error occurred';
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceWithChildren[]>([]);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedItemType, setSelectedItemType] = useState<'workspace' | 'application' | 'environment'>('workspace');
  
  const snackbar = useSnackbar();
  const workspaceContext = useWorkspace();
  const router = useRouter();

  // Load hierarchical data
  const loadHierarchy = useCallback(async () => {
    setLoading(true);
    try {
      // Load workspaces
      const workspaceResponse = await apiClient.get('/workspaces');
      if (workspaceResponse.success) {
        const workspacesWithChildren: WorkspaceWithChildren[] = [];
        
        for (const workspace of workspaceResponse.data || []) {
          // Load applications for each workspace
          try {
            const appResponse = await apiClient.get(`/workspaces/${workspace._id}/applications`);
            const applicationsWithChildren: ApplicationWithChildren[] = [];
            
            for (const app of appResponse.data || []) {
              // Load environments for each application
              try {
                const envResponse = await apiClient.get(`/workspaces/${workspace._id}/applications/${app._id}/environments`);
                applicationsWithChildren.push({
                  ...app,
                  environments: envResponse.data || []
                });
              } catch (error) {
                console.error(`Failed to load environments for app ${app._id}:`, error);
                applicationsWithChildren.push({
                  ...app,
                  environments: []
                });
              }
            }
            
            workspacesWithChildren.push({
              ...workspace,
              applications: applicationsWithChildren
            });
          } catch (error) {
            console.error(`Failed to load applications for workspace ${workspace._id}:`, error);
            workspacesWithChildren.push({
              ...workspace,
              applications: []
            });
          }
        }
        
        setWorkspaces(workspacesWithChildren);
      }
    } catch (error: any) {
      snackbar.showError(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [snackbar]);

  useEffect(() => {
    loadHierarchy();
  }, [loadHierarchy]);

  const handleExpandWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workspaceId)) {
        newSet.delete(workspaceId);
      } else {
        newSet.add(workspaceId);
      }
      return newSet;
    });
  };

  const handleExpandApplication = (applicationId: string) => {
    setExpandedApplications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(applicationId)) {
        newSet.delete(applicationId);
      } else {
        newSet.add(applicationId);
      }
      return newSet;
    });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, item: any, type: 'workspace' | 'application' | 'environment') => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
    setSelectedItemType(type);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!selectedItem || !selectedItemType) return;

    try {
      let endpoint = '';
      let successMessage = '';
      
      if (selectedItemType === 'workspace') {
        endpoint = `/workspaces/${selectedItem._id}`;
        successMessage = 'Workspace deleted successfully';
      } else if (selectedItemType === 'application') {
        endpoint = `/workspaces/${selectedItem.workspaceId}/applications/${selectedItem._id}`;
        successMessage = 'Application deleted successfully';
      } else if (selectedItemType === 'environment') {
        endpoint = `/workspaces/${selectedItem.workspaceId}/applications/${selectedItem.applicationId}/environments/${selectedItem._id}`;
        successMessage = 'Environment deleted successfully';
      }

      const response = await apiClient.delete(endpoint);
      if (response.success) {
        snackbar.showSuccess(successMessage);
        loadHierarchy(); // Reload the entire hierarchy
      }
    } catch (error: any) {
      snackbar.showError(extractErrorMessage(error));
    } finally {
      handleMenuClose();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'suspended': return 'error';
      case 'development': return 'info';
      case 'staging': return 'warning';
      case 'production': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'web': return '🌐';
      case 'api': return '🔌';
      case 'mobile': return '📱';
      case 'desktop': return '🖥️';
      case 'service': return '⚙️';
      case 'microservice': return '🔗';
      default: return '📦';
    }
  };

  const getTotalCounts = () => {
    const totalApplications = workspaces.reduce((acc, ws) => acc + ws.applications.length, 0);
    const totalEnvironments = workspaces.reduce((acc, ws) => 
      acc + ws.applications.reduce((appAcc, app) => appAcc + app.environments.length, 0), 0
    );
    return { totalApplications, totalEnvironments };
  };

  const { totalApplications, totalEnvironments } = getTotalCounts();

  // Helper functions
  const formatUserEmail = (user: UserInfo | string | undefined) => {
    if (!user) return 'Unknown';
    if (typeof user === 'string') return user;
    if (user.email) return user.email;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user._id || 'Unknown';
  };

  const formatCompactDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const renderEnvironment = (environment: EnvironmentItem, workspaceId: string, applicationId: string) => (
    <Box
      key={environment._id}
      sx={{
        ml: 6,
        p: 2,
        mb: 1,
        bgcolor: 'grey.50',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'grey.200',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: getStatusColor(environment.type), width: 32, height: 32 }}>
          <EnvironmentIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>
            {environment.displayName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Chip 
              label={environment.type} 
              size="small" 
              color={getStatusColor(environment.type) as any}
            />
            <Chip 
              label={environment.status || 'active'} 
              size="small" 
              variant="outlined"
            />
            {environment.metadata?.isDefault && (
              <Chip label="Default" size="small" color="primary" />
            )}
          </Box>
          {environment.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {environment.description}
            </Typography>
          )}
          <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Created: {formatCompactDate(environment.createdAt)} by {formatUserEmail(environment.metadata?.createdBy)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Updated: {formatCompactDate(environment.updatedAt)} by {formatUserEmail(environment.metadata?.lastModifiedBy)}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {environment.configuration && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Variables">
              <Chip 
                icon={<SettingsIcon />}
                label={Object.keys(environment.configuration.variables || {}).length}
                size="small"
                variant="outlined"
              />
            </Tooltip>
            <Tooltip title="Endpoints">
              <Chip 
                icon={<StorageIcon />}
                label={Object.keys(environment.configuration.endpoints || {}).length}
                size="small"
                variant="outlined"
              />
            </Tooltip>
          </Box>
        )}
        <IconButton
          size="small"
          onClick={(e) => handleMenuClick(e, environment, 'environment')}
        >
          <MoreVertIcon />
        </IconButton>
      </Box>
    </Box>
  );

  const renderApplication = (application: ApplicationWithChildren, workspaceId: string) => {
    const isExpanded = expandedApplications.has(application._id);
    
    return (
      <Box key={application._id} sx={{ ml: 3 }}>
        <Box
          sx={{
            p: 2,
            mb: 1,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.300',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'grey.50'
            }
          }}
          onClick={() => handleExpandApplication(application._id)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              {isExpanded ? <ExpandMoreIcon /> : <ArrowRightIcon />}
            </IconButton>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
              {getTypeIcon(application.type)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {application.displayName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip label={application.type} size="small" variant="outlined" />
                <Chip 
                  label={application.status || 'active'} 
                  size="small" 
                  color={getStatusColor(application.status) as any}
                />
                <Badge badgeContent={application.environments.length} color="primary">
                  <EnvironmentIcon />
                </Badge>
              </Box>
              {application.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {application.description}
                </Typography>
              )}
              <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  Created: {formatCompactDate(application.createdAt)} by {formatUserEmail(application.metadata?.createdBy)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Updated: {formatCompactDate(application.updatedAt)} by {formatUserEmail(application.metadata?.lastModifiedBy)}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
              v{application.metadata?.version || '1.0.0'}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => handleMenuClick(e, application, 'application')}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Environments */}
        {isExpanded && application.environments.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {application.environments.map((env) => 
              renderEnvironment({ ...env, workspaceId, applicationId: application._id }, workspaceId, application._id)
            )}
          </Box>
        )}

        {/* No environments message */}
        {isExpanded && application.environments.length === 0 && (
          <Alert severity="info" sx={{ ml: 3, mb: 2 }}>
            No environments found in this application.
            <Button 
              size="small" 
              sx={{ ml: 1 }}
              onClick={() => snackbar.showInfo('Environment creation will be available soon')}
            >
              Create Environment
            </Button>
          </Alert>
        )}
      </Box>
    );
  };

  const renderWorkspace = (workspace: WorkspaceWithChildren) => {
    const isExpanded = expandedWorkspaces.has(workspace._id);
    
    return (
      <Card key={workspace._id} sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
            onClick={() => handleExpandWorkspace(workspace._id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                {isExpanded ? <ExpandMoreIcon /> : <ArrowRightIcon />}
              </IconButton>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <WorkspaceIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {workspace.displayName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Chip 
                    label={workspace.status} 
                    size="small" 
                    color={getStatusColor(workspace.status) as any}
                  />
                  <Chip 
                    label={workspace.metadata?.plan || 'free'} 
                    size="small" 
                    variant="outlined"
                  />
                  <Badge badgeContent={workspace.applications.length} color="primary">
                    <ApplicationIcon />
                  </Badge>
                </Box>
                {workspace.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {workspace.description}
                  </Typography>
                )}
                <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">
                    Created: {formatCompactDate(workspace.createdAt)} by {formatUserEmail(workspace.metadata?.createdBy)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Updated: {formatCompactDate(workspace.updatedAt)} by {formatUserEmail(workspace.metadata?.lastModifiedBy)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={(e) => handleMenuClick(e, workspace, 'workspace')}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Applications */}
          {isExpanded && workspace.applications.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 2, ml: 3, color: 'text.secondary' }}>
                Applications ({workspace.applications.length})
              </Typography>
              {workspace.applications.map((app) => renderApplication(app, workspace._id))}
            </Box>
          )}

          {/* No applications message */}
          {isExpanded && workspace.applications.length === 0 && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Alert severity="info">
                No applications found in this workspace.
                <Button 
                  size="small" 
                  sx={{ ml: 1 }}
                  onClick={() => snackbar.showInfo('Application creation will be available soon')}
                >
                  Create Application
                </Button>
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="h5" component="h1" fontWeight="600">
              Settings
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, textAlign: 'center' }}>
            <Box>
              <Typography variant="h6" color="primary.main" fontWeight="600">
                {loading ? '...' : workspaces.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Workspaces
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="secondary.main" fontWeight="600">
                {loading ? '...' : totalApplications}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Applications
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="success.main" fontWeight="600">
                {loading ? '...' : totalEnvironments}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Environments
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Manage your complete organizational hierarchy: workspaces, applications, and environments
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/settings/create')}
            sx={{ px: 3 }}
          >
            Create Workspace
          </Button>
        </Box>
      </Paper>

      {/* Section Title */}
      <Typography variant="h6" sx={{ mb: 3 }}>
        Organizational Structure
      </Typography>

      {/* Hierarchy Display */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress size={40} />
        </Box>
      ) : workspaces.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <WorkspaceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No workspaces found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first workspace to get started with organizing your applications and environments.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/settings/create')}
            size="large"
          >
            Create Your First Workspace
          </Button>
        </Paper>
      ) : (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Navigate your hierarchy:</strong> Click on workspaces to expand and view their applications. 
              Click on applications to view their environments. Use the action menus (⋮) to manage individual items.
            </Typography>
          </Alert>
          
          {workspaces.map(renderWorkspace)}
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </DashboardLayout>
  );
}