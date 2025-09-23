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
  Link,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Business as WorkspaceIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon,
  Apps as ApplicationIcon,
  Science as EnvironmentIcon,
  Storage as StorageIcon,
  Group as GroupIcon,
  Policy as PolicyIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

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
    <ProtectedRoute>
      <DashboardLayout>
        {/* Compact Header */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={handleBack}
              size="small"
              sx={{ bgcolor: 'grey.100', '&:hover': { bgcolor: 'grey.200' } }}
            >
              <ArrowBackIcon />
            </IconButton>
            <WorkspaceIcon sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" component="h1" fontWeight="600">
                {workspace.displayName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                <Chip
                  label={workspace.status}
                  color={workspace.status === 'active' ? 'success' : 'default'}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {workspace.name}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              size="small"
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={handleSettings}
              size="small"
            >
              Settings
            </Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        {/* Key Metrics Row */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ApplicationIcon sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" fontWeight="600" color="primary.main">
                    {workspace.applications?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Applications
                  </Typography>
                </Box>
              </Box>
            </Card>

            <Card variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EnvironmentIcon sx={{ color: 'secondary.main' }} />
                <Box>
                  <Typography variant="h6" fontWeight="600" color="secondary.main">
                    {workspace.applications?.reduce((total: number, app: any) =>
                      total + (app.environments?.length || 0), 0) || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Environments
                  </Typography>
                </Box>
              </Box>
            </Card>

            <Card variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <StorageIcon sx={{ color: 'info.main' }} />
                <Box>
                  <Typography variant="h6" fontWeight="600" color="info.main">
                    {workspace.limits?.storageQuota || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Storage (MB)
                  </Typography>
                </Box>
              </Box>
            </Card>

            <Card variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CalendarIcon sx={{ color: 'success.main' }} />
                <Box>
                  <Typography variant="h6" fontWeight="600" color="success.main">
                    {workspace.metadata?.plan?.toUpperCase() || 'FREE'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Plan
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        </Grid>

        {/* Main Content */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            {/* Workspace Details */}
            <Card variant="outlined">
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  Workspace Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {workspace.description && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="500">
                        Description
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {workspace.description}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="500">
                      Created
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {new Date(workspace.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="500">
                      Last Modified
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {new Date(workspace.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Applications Table */}
            {workspace.applications && workspace.applications.length > 0 && (
              <Card variant="outlined">
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight="600">
                      Applications ({workspace.applications.length})
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Environments</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {workspace.applications.map((app: any) => (
                          <TableRow key={app._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ApplicationIcon fontSize="small" color="primary" />
                                <Typography variant="body2" fontWeight="500">
                                  {app.displayName}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={app.type} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {app.environments?.map((env: any) => (
                                  <Chip
                                    key={env._id}
                                    label={env.displayName}
                                    size="small"
                                    color={
                                      env.type === 'production' ? 'error' :
                                      env.type === 'staging' ? 'warning' :
                                      env.type === 'development' ? 'success' : 'default'
                                    }
                                    variant="outlined"
                                    sx={{ fontSize: '0.6rem', height: 20 }}
                                  />
                                )) || (
                                  <Typography variant="caption" color="text.secondary">
                                    No environments
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {app.description || '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>

        {/* Resource Limits Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                Resource Limits
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ApplicationIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Max Applications</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="500">
                    {workspace.limits?.maxApplications || '∞'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon fontSize="small" color="secondary" />
                    <Typography variant="body2">Max Users</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="500">
                    {workspace.limits?.maxUsers || '∞'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PolicyIcon fontSize="small" color="info" />
                    <Typography variant="body2">Max Policies</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="500">
                    {workspace.limits?.maxPolicies || '∞'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="500">Plan Type</Typography>
                  <Chip
                    label={workspace.metadata?.plan?.toUpperCase() || 'FREE'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </DashboardLayout>
    </ProtectedRoute>
  );
}