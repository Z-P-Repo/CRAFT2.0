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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  Speed as SpeedIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  FiberManualRecord as DotIcon
} from '@mui/icons-material';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { canCreate, canManage } from '@/utils/permissions';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface IWorkspaceData {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended' | 'deleted' | 'draft';
  settings: any;
  limits: any;
  metadata: any;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  applications?: IApplicationData[];
}

interface IApplicationData {
  _id: string;
  workspaceId: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'web' | 'api' | 'mobile' | 'desktop' | 'service' | 'microservice';
  configuration: any;
  metadata: any;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  environments?: IEnvironmentData[];
}

interface IEnvironmentData {
  _id: string;
  workspaceId: string;
  applicationId: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'development' | 'testing' | 'staging' | 'production' | 'preview' | 'hotfix';
  configuration: any;
  metadata: any;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCreatedBy = (createdBy: any) => {
  if (!createdBy) return 'Admin';
  if (typeof createdBy === 'string') return 'Admin';
  if (createdBy && typeof createdBy === 'object') {
    return createdBy.firstName && createdBy.lastName 
      ? `${createdBy.firstName} ${createdBy.lastName}`
      : createdBy.email || 'Admin';
  }
  return 'Admin';
};

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<IWorkspaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<IWorkspaceData | null>(null);
  const [expandedWorkspace, setExpandedWorkspace] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<IWorkspaceData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { showError, showSuccess } = useSnackbar();
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const router = useRouter();

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/workspaces');
      
      if (response.success) {
        // Handle both paginated and direct data structures
        const workspacesData = response.data?.workspaces || response.data || [];
        setWorkspaces(workspacesData);
      } else {
        throw new Error(response.error || 'Failed to fetch workspaces');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load workspaces');
      showError('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, workspace: IWorkspaceData) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedWorkspace(workspace);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedWorkspace(null);
  };

  const handleViewWorkspace = (workspace: IWorkspaceData) => {
    handleMenuClose();
    router.push(`/workspaces/${workspace._id}`);
  };

  const handleEditWorkspace = (workspace: IWorkspaceData) => {
    handleMenuClose();
    router.push(`/workspaces/${workspace._id}/edit`);
  };

  const handleSettingsWorkspace = (workspace: IWorkspaceData) => {
    handleMenuClose();
    router.push(`/workspaces/${workspace._id}/settings`);
  };

  const handleDeleteWorkspace = (workspace: IWorkspaceData) => {
    handleMenuClose();
    setWorkspaceToDelete(workspace);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!workspaceToDelete) return;

    try {
      setIsDeleting(true);
      const response = await apiClient.delete(`/workspaces/${workspaceToDelete._id}`);
      
      if (response.success) {
        showSuccess('Workspace deleted successfully');
        fetchWorkspaces(); // Refresh the list
        setShowDeleteDialog(false);
        setWorkspaceToDelete(null);
      } else {
        throw new Error(response.error || 'Failed to delete workspace');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to delete workspace');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setWorkspaceToDelete(null);
  };

  const handleWorkspaceToggle = (workspaceId: string) => {
    setExpandedWorkspace(prev => prev === workspaceId ? null : workspaceId);
  };

  const handleCreateWorkspace = () => {
    router.push('/workspaces/create');
  };


  const getEnvironmentColor = (type: string) => {
    switch (type) {
      case 'production': return 'error';
      case 'staging': return 'warning';
      case 'development': return 'success';
      case 'testing': return 'info';
      case 'preview': return 'secondary';
      case 'hotfix': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
        </Box>
      </DashboardLayout>
    );
  }

  // Calculate statistics
  const totalWorkspaces = workspaces.length;
  const activeWorkspaces = workspaces.filter(w => w.status === 'active').length;
  const draftWorkspaces = workspaces.filter(w => w.status === 'draft').length;
  const totalApplications = workspaces.reduce((sum, w) => sum + (w.applications?.length || 0), 0);

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      case 'deleted': return 'error';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout>
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Header */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WorkspaceIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Typography variant="h5" component="h1" fontWeight="600">
                Workspaces
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, textAlign: 'center' }}>
              <Box>
                <Typography variant="h6" color="primary.main" fontWeight="600">
                  {loading ? '...' : totalWorkspaces}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" color="success.main" fontWeight="600">
                  {loading ? '...' : activeWorkspaces}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" color="warning.main" fontWeight="600">
                  {loading ? '...' : draftWorkspaces}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Drafts
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" color="info.main" fontWeight="600">
                  {loading ? '...' : totalApplications}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Applications
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Manage your workspaces, applications, and environments
            </Typography>
            {canCreate(user) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateWorkspace}
                sx={{ px: 3 }}
              >
                Create Workspace
              </Button>
            )}
          </Box>
        </Paper>

        {/* Workspaces List */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkspaceIcon />
              Workspace Hierarchy
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              View and manage your workspace structure including applications and environments.
            </Typography>

            {workspaces.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <WorkspaceIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No workspaces found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create your first workspace to get started
                </Typography>
                {canCreate(user) && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateWorkspace}
                  >
                    Create Workspace
                  </Button>
                )}
              </Box>
            ) : (
              <Box>
                {workspaces.map((workspace) => (
                  <Box key={workspace._id} sx={{ position: 'relative', mb: 1.5 }}>
                    <Accordion
                      expanded={expandedWorkspace === workspace._id}
                      onChange={() => handleWorkspaceToggle(workspace._id)}
                      sx={{ 
                        '&:before': {
                          display: 'none'
                        },
                        boxShadow: 'none',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        '&.Mui-expanded': {
                          margin: 0
                        }
                      }}
                    >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center',
                          margin: '8px 0',
                          pr: 1
                        },
                        '& .MuiAccordionSummary-expandIconWrapper': {
                          order: 3,
                          ml: 1
                        },
                        minHeight: '56px',
                        '&.Mui-expanded': {
                          minHeight: '56px'
                        },
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28 }}>
                          <WorkspaceIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            {workspace.displayName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {formatCreatedBy(workspace.metadata?.createdBy)}
                            </Typography>
                            <DotIcon sx={{ fontSize: 4, color: 'text.secondary', mx: 0.5 }} />
                            <ScheduleIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {formatDate(workspace.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                          <Chip
                            label={workspace.status}
                            color={getStatusColor(workspace.status) as any}
                            size="small"
                            sx={{ 
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 3,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              height: 'auto',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            bgcolor: 'info.light',
                            color: 'info.contrastText',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 3,
                            minWidth: 'fit-content',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}>
                            <ApplicationIcon sx={{ fontSize: 12 }} />
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {workspace.applications?.length || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.9 }}>
                              {(workspace.applications?.length || 0) === 1 ? 'app' : 'apps'}
                            </Typography>
                          </Box>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e, workspace);
                            }}
                            size="small"
                            sx={{ 
                              ml: 1,
                              order: 2,
                              bgcolor: 'transparent',
                              '&:hover': {
                                bgcolor: 'action.hover'
                              }
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                      <Box sx={{ pl: 1 }}>
                        {workspace.applications && workspace.applications.length > 0 ? (
                          <Box sx={{ bgcolor: 'grey.50', borderRadius: 1, p: 2 }}>
                            {workspace.applications.map((app, appIndex) => (
                              <Box key={app._id} sx={{ mb: appIndex < workspace.applications.length - 1 ? 2 : 0 }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  bgcolor: 'white',
                                  border: '1px solid',
                                  borderColor: 'grey.200',
                                  borderRadius: 1,
                                  px: 2,
                                  py: 1.5,
                                  mb: app.environments?.length > 0 ? 1 : 0
                                }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, minWidth: 0 }}>
                                    <ApplicationIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                        {app.displayName}
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <PersonIcon sx={{ fontSize: 11, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                          {formatCreatedBy(app.metadata?.createdBy)}
                                        </Typography>
                                        <DotIcon sx={{ fontSize: 3, color: 'text.secondary', mx: 0.5 }} />
                                        <ScheduleIcon sx={{ fontSize: 11, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                          {formatDate(app.createdAt)}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                                    <Chip 
                                      label={app.type} 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ height: 18, fontSize: '0.65rem', borderRadius: '8px' }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                      {app.environments?.length || 0} envs
                                    </Typography>
                                  </Box>
                                </Box>

                                {app.environments && app.environments.length > 0 && (
                                  <Box sx={{ ml: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {app.environments.map((env) => (
                                      <Box 
                                        key={env._id} 
                                        sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: 1,
                                          bgcolor: 'white',
                                          border: '1px solid',
                                          borderColor: 'grey.200',
                                          borderRadius: 1,
                                          px: 1.5,
                                          py: 1,
                                          minWidth: 200,
                                          flex: 1
                                        }}
                                      >
                                        <EnvironmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', lineHeight: 1.2 }}>
                                            {env.displayName}
                                          </Typography>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                            <PersonIcon sx={{ fontSize: 10, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                                              {formatCreatedBy(env.metadata?.createdBy)}
                                            </Typography>
                                            <DotIcon sx={{ fontSize: 2, color: 'text.secondary', mx: 0.25 }} />
                                            <ScheduleIcon sx={{ fontSize: 10, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                                              {formatDate(env.createdAt)}
                                            </Typography>
                                          </Box>
                                        </Box>
                                        <Chip
                                          label={env.type}
                                          color={getEnvironmentColor(env.type) as any}
                                          size="small"
                                          sx={{ height: 16, fontSize: '0.6rem', borderRadius: '6px' }}
                                        />
                                      </Box>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Box sx={{ 
                            textAlign: 'center', 
                            py: 3,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                            border: '1px dashed',
                            borderColor: 'grey.300'
                          }}>
                            <ApplicationIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              No applications found in this workspace
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => selectedWorkspace && handleViewWorkspace(selectedWorkspace)}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          {user?.role !== 'basic' && (
            <>
              <MenuItem onClick={() => selectedWorkspace && handleEditWorkspace(selectedWorkspace)}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Edit Workspace</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => selectedWorkspace && handleSettingsWorkspace(selectedWorkspace)}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => selectedWorkspace && handleDeleteWorkspace(selectedWorkspace)}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            </>
          )}
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={showDeleteDialog}
          onClose={handleCancelDelete}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Delete Workspace
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete the workspace <strong>"{workspaceToDelete?.displayName}"</strong>?
            </Typography>
            <Alert severity="error" sx={{ mb: 2 }}>
              This action cannot be undone. The workspace and ALL its applications and environments will be permanently deleted.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              This will permanently delete:
              • The workspace and all its settings
              • All applications within this workspace
              • All environments within those applications
              • All associated data and configurations
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button
              onClick={handleCancelDelete}
              variant="outlined"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
              disabled={isDeleting}
              startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
            >
              {isDeleting ? 'Deleting...' : 'Delete Workspace'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </DashboardLayout>
  );
}