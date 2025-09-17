'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Divider,
  IconButton,
  Chip,
  Avatar,
  CircularProgress,
  Tooltip,
  ListItemText,
  ListItemAvatar,
  ListItemIcon
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  Business as WorkspaceIcon,
  Apps as ApplicationIcon,
  Science as EnvironmentIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { canCreate } from '@/utils/permissions';

interface WorkspaceSwitcherProps {
  variant?: 'header' | 'sidebar';
  showLabels?: boolean;
  compact?: boolean;
}

const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  variant = 'header',
  showLabels = true,
  compact = false
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const {
    currentWorkspace,
    currentApplication,
    currentEnvironment,
    workspaces,
    applications,
    environments,
    workspacesLoading,
    applicationsLoading,
    environmentsLoading,
    setCurrentWorkspace,
    setCurrentApplication,
    setCurrentEnvironment
  } = useWorkspace();

  const [workspaceMenuAnchor, setWorkspaceMenuAnchor] = useState<null | HTMLElement>(null);
  const [applicationMenuAnchor, setApplicationMenuAnchor] = useState<null | HTMLElement>(null);
  const [environmentMenuAnchor, setEnvironmentMenuAnchor] = useState<null | HTMLElement>(null);

  const handleWorkspaceMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setWorkspaceMenuAnchor(event.currentTarget);
  };

  const handleApplicationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setApplicationMenuAnchor(event.currentTarget);
  };

  const handleEnvironmentMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setEnvironmentMenuAnchor(event.currentTarget);
  };

  const handleWorkspaceSelect = (workspace: any) => {
    setCurrentWorkspace(workspace);
    setWorkspaceMenuAnchor(null);
  };

  const handleApplicationSelect = (application: any) => {
    setCurrentApplication(application);
    setApplicationMenuAnchor(null);
  };

  const handleEnvironmentSelect = (environment: any) => {
    setCurrentEnvironment(environment);
    setEnvironmentMenuAnchor(null);
  };

  const getEnvironmentColor = (envType: string) => {
    switch (envType) {
      case 'production': return 'error';
      case 'staging': return 'warning';
      case 'development': return 'success';
      case 'testing': return 'info';
      case 'preview': return 'secondary';
      case 'hotfix': return 'error';
      default: return 'default';
    }
  };

  const renderWorkspaceButton = () => (
    <Button
      variant={variant === 'sidebar' ? 'text' : 'outlined'}
      startIcon={workspacesLoading ? <CircularProgress size={16} /> : <WorkspaceIcon />}
      endIcon={<ArrowDownIcon />}
      onClick={handleWorkspaceMenuOpen}
      sx={{
        minWidth: compact ? 'auto' : 200,
        justifyContent: 'flex-start',
        textTransform: 'none',
        ...(variant === 'sidebar' && {
          width: '100%',
          mb: 1,
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        })
      }}
      disabled={workspacesLoading}
    >
      {!compact && (
        <Box sx={{ flex: 1, textAlign: 'left', ml: showLabels ? 1 : 0 }}>
          {showLabels && (
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
              Workspace
            </Typography>
          )}
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {workspacesLoading ? 'Loading...' : currentWorkspace?.displayName || 
             (workspaces.length === 0 ? 'No Workspaces' : 'Select Workspace')}
          </Typography>
        </Box>
      )}
    </Button>
  );

  const renderApplicationButton = () => {
    if (!currentWorkspace) return null;

    return (
      <Button
        variant={variant === 'sidebar' ? 'text' : 'outlined'}
        startIcon={applicationsLoading ? <CircularProgress size={16} /> : <ApplicationIcon />}
        endIcon={<ArrowDownIcon />}
        onClick={handleApplicationMenuOpen}
        sx={{
          minWidth: compact ? 'auto' : 200,
          justifyContent: 'flex-start',
          textTransform: 'none',
          ...(variant === 'sidebar' && {
            width: '100%',
            mb: 1,
            color: 'text.primary',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          })
        }}
        disabled={applicationsLoading || applications.length === 0}
      >
        {!compact && (
          <Box sx={{ flex: 1, textAlign: 'left', ml: showLabels ? 1 : 0 }}>
            {showLabels && (
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                Application
              </Typography>
            )}
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {applicationsLoading ? 'Loading...' : currentApplication?.displayName || 
               (applications.length === 0 ? 'No Applications' : 'Select Application')}
            </Typography>
          </Box>
        )}
      </Button>
    );
  };

  const renderEnvironmentButton = () => {
    if (!currentApplication) return null;

    return (
      <Button
        variant={variant === 'sidebar' ? 'text' : 'outlined'}
        startIcon={environmentsLoading ? <CircularProgress size={16} /> : <EnvironmentIcon />}
        endIcon={<ArrowDownIcon />}
        onClick={handleEnvironmentMenuOpen}
        sx={{
          minWidth: compact ? 'auto' : 200,
          justifyContent: 'flex-start',
          textTransform: 'none',
          ...(variant === 'sidebar' && {
            width: '100%',
            mb: 1,
            color: 'text.primary',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          })
        }}
        disabled={environmentsLoading || environments.length === 0}
      >
        {!compact && (
          <Box sx={{ flex: 1, textAlign: 'left', ml: showLabels ? 1 : 0 }}>
            {showLabels && (
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                Environment
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {environmentsLoading ? 'Loading...' : currentEnvironment?.displayName || 
                 (environments.length === 0 ? 'No Environments' : 'Select Environment')}
              </Typography>
              {currentEnvironment && !environmentsLoading && (
                <Chip
                  label={currentEnvironment.type}
                  size="small"
                  color={getEnvironmentColor(currentEnvironment.type) as any}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Box>
          </Box>
        )}
      </Button>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: variant === 'sidebar' ? 'column' : 'row', gap: 1 }}>
      {/* Workspace Selector */}
      {renderWorkspaceButton()}
      <Menu
        anchorEl={workspaceMenuAnchor}
        open={Boolean(workspaceMenuAnchor)}
        onClose={() => setWorkspaceMenuAnchor(null)}
        PaperProps={{
          sx: { minWidth: 280, maxHeight: workspaces.length === 0 ? 200 : 400 }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
            Select Workspace
          </Typography>
        </Box>
        <Divider />
        {workspaces && workspaces.length > 0 ? (
          workspaces.map((workspace) => (
            <MenuItem
              key={workspace._id}
              onClick={() => handleWorkspaceSelect(workspace)}
              sx={{ py: 1.5 }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <WorkspaceIcon fontSize="small" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={workspace.displayName}
                secondary={workspace.description || `${workspace.name} workspace`}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
              {currentWorkspace?._id === workspace._id && (
                <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                  <CheckIcon color="primary" />
                </ListItemIcon>
              )}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled sx={{ py: 1.5 }}>
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                No workspaces available
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Create your first workspace below
              </Typography>
            </Box>
          </MenuItem>
        )}
        {canCreate(user) && [
          <Divider key="divider-workspace" />,
          <MenuItem key="create-workspace" onClick={() => router.push('/workspaces')}>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="Create New Workspace" />
          </MenuItem>
        ]}
      </Menu>

      {/* Application Selector */}
      {renderApplicationButton()}
      <Menu
        anchorEl={applicationMenuAnchor}
        open={Boolean(applicationMenuAnchor)}
        onClose={() => setApplicationMenuAnchor(null)}
        PaperProps={{
          sx: { minWidth: 280, maxHeight: 400 }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
            Select Application
          </Typography>
        </Box>
        <Divider />
        {applications && applications.length > 0 ? applications.map((application) => (
          <MenuItem
            key={application._id}
            onClick={() => handleApplicationSelect(application)}
            sx={{ py: 1.5 }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                <ApplicationIcon fontSize="small" />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={application.displayName}
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption">
                    {application.description || `${application.type} application`}
                  </Typography>
                  <Chip
                    label={application.type}
                    size="small"
                    variant="outlined"
                    sx={{ height: 16, fontSize: '0.6rem' }}
                  />
                </Box>
              }
              primaryTypographyProps={{ fontWeight: 500 }}
            />
            {currentApplication?._id === application._id && (
              <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                <CheckIcon color="primary" />
              </ListItemIcon>
            )}
          </MenuItem>
        )) : (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No applications available
            </Typography>
          </MenuItem>
        )}
        {canCreate(user) && [
          <Divider key="divider-application" />,
          <MenuItem
            key="create-application"
            onClick={() => router.push(`/workspaces`)}
            disabled={!currentWorkspace}
          >
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="Create New Application" />
          </MenuItem>
        ]}
      </Menu>

      {/* Environment Selector */}
      {renderEnvironmentButton()}
      <Menu
        anchorEl={environmentMenuAnchor}
        open={Boolean(environmentMenuAnchor)}
        onClose={() => setEnvironmentMenuAnchor(null)}
        PaperProps={{
          sx: { minWidth: 280, maxHeight: 400 }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
            Select Environment
          </Typography>
        </Box>
        <Divider />
        {environments && environments.length > 0 ? environments.map((environment) => (
          <MenuItem
            key={environment._id}
            onClick={() => handleEnvironmentSelect(environment)}
            sx={{ py: 1.5 }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: `${getEnvironmentColor(environment.type)}.main`, width: 32, height: 32 }}>
                <EnvironmentIcon fontSize="small" />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {environment.displayName}
                  {environment.metadata.isDefault && (
                    <Chip label="Default" size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem' }} />
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption">
                    {environment.description || `${environment.type} environment`}
                  </Typography>
                  <Chip
                    label={environment.type}
                    size="small"
                    color={getEnvironmentColor(environment.type) as any}
                    sx={{ height: 16, fontSize: '0.6rem' }}
                  />
                </Box>
              }
              primaryTypographyProps={{ fontWeight: 500 }}
            />
            {currentEnvironment?._id === environment._id && (
              <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                <CheckIcon color="primary" />
              </ListItemIcon>
            )}
          </MenuItem>
        )) : (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No environments available
            </Typography>
          </MenuItem>
        )}
        {canCreate(user) && [
          <Divider key="divider-environment" />,
          <MenuItem
            key="create-environment"
            onClick={() => router.push(`/workspaces`)}
            disabled={!currentApplication}
          >
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="Create New Environment" />
          </MenuItem>
        ]}
      </Menu>
    </Box>
  );
};

export default WorkspaceSwitcher;