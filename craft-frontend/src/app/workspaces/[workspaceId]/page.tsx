'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  IconButton,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Business as WorkspaceIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon,
  Apps as ApplicationIcon,
  Science as EnvironmentIcon
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';

interface IWorkspaceDetail {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  settings: any;
  limits: any;
  metadata: any;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  applications?: any[];
}

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams();
  const router = useRouter();
  const { showError } = useSnackbar();
  
  const [workspace, setWorkspace] = useState<IWorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get(`/workspaces/${workspaceId}`);
        
        if (response.success) {
          setWorkspace(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch workspace');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load workspace');
        showError('Failed to load workspace details');
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchWorkspace();
    }
  }, [workspaceId, showError]);

  const handleBack = () => {
    router.push('/workspaces');
  };

  const handleEdit = () => {
    router.push(`/workspaces/${workspaceId}/edit`);
  };

  const handleSettings = () => {
    router.push(`/workspaces/${workspaceId}/settings`);
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

  if (error || !workspace) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Workspace not found'}
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="/workspaces"
            onClick={(e) => {
              e.preventDefault();
              handleBack();
            }}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <WorkspaceIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Workspaces
          </Link>
          <Typography color="text.primary">
            {workspace.displayName}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <WorkspaceIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="600">
                {workspace.displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {workspace.description || workspace.name}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleEdit} color="primary">
              <EditIcon />
            </IconButton>
            <IconButton onClick={handleSettings} color="default">
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Workspace Overview */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Workspace Overview
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={workspace.status}
                    color={workspace.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    System Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {workspace.name}
                  </Typography>
                </Box>
                {workspace.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {workspace.description}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {new Date(workspace.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Last Modified
                    </Typography>
                    <Typography variant="body1">
                      {new Date(workspace.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Workspace Stats */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistics
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ApplicationIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4" color="primary.main">
                      {workspace.applications?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Applications
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EnvironmentIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Box>
                    <Typography variant="h4" color="secondary.main">
                      {workspace.applications?.reduce((total: number, app: any) => 
                        total + (app.environments?.length || 0), 0) || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Environments
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Resource Limits */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resource Limits
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Max Applications: {workspace.limits?.maxApplications || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Max Users: {workspace.limits?.maxUsers || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Storage Quota: {workspace.limits?.storageQuota || 'N/A'} MB
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Plan: {workspace.metadata?.plan?.toUpperCase() || 'FREE'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Applications List */}
          {workspace.applications && workspace.applications.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Applications
                  </Typography>
                  {workspace.applications.map((app: any) => (
                    <Box key={app._id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ApplicationIcon sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="subtitle1" fontWeight="600">
                              {app.displayName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {app.description || app.name}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip label={app.type} size="small" variant="outlined" />
                      </Box>
                      {app.environments && app.environments.length > 0 && (
                        <Box sx={{ mt: 1, ml: 4 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Environments:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {app.environments.map((env: any) => (
                              <Chip
                                key={env._id}
                                label={env.displayName}
                                size="small"
                                color={env.type === 'production' ? 'error' : 
                                      env.type === 'staging' ? 'warning' : 
                                      env.type === 'development' ? 'success' : 'default'}
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </DashboardLayout>
  );
}