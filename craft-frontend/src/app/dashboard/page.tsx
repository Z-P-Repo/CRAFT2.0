'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Paper,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  Stack,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Security as PolicyIcon,
  People as SubjectIcon,
  FlashOn as ActionIcon,
  Folder as ResourceIcon,
  Label as AttributeIcon,
  Business as WorkspaceIcon,
  PersonAdd as UserIcon,
  TrendingUp,
  Add as AddIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as DraftIcon,
  ArrowForward as ArrowIcon,
  Settings as SettingsIcon,
  PlayArrow as TestIcon,
  Description as ReportIcon,
  Layers as LayersIcon,
  AccountTree as HierarchyIcon,
  Extension as AdditionalIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { apiClient } from '@/lib/api';
import { useApiSnackbar } from '@/contexts/SnackbarContext';

interface DashboardStats {
  policies: {
    total: number;
    active: number;
    draft: number;
    inactive: number;
  };
  subjects: number;
  actions: number;
  resources: number;
  additionalResources: number;
  attributes: number;
  workspaces: number;
  users: number;
}

interface RecentActivity {
  id: string;
  type: 'policy' | 'subject' | 'action' | 'resource' | 'attribute' | 'workspace';
  action: 'created' | 'updated' | 'deleted';
  name: string;
  timestamp: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentWorkspace, currentApplication } = useWorkspace();
  const router = useRouter();
  const snackbar = useApiSnackbar();

  const [stats, setStats] = useState<DashboardStats>({
    policies: { total: 0, active: 0, draft: 0, inactive: 0 },
    subjects: 0,
    actions: 0,
    resources: 0,
    additionalResources: 0,
    attributes: 0,
    workspaces: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all statistics in parallel
      const [
        policiesRes,
        subjectsRes,
        actionsRes,
        resourcesRes,
        additionalResourcesRes,
        attributesRes,
        workspacesRes,
        usersRes,
      ] = await Promise.all([
        apiClient.get('/policies?page=1&limit=1000'),
        apiClient.get('/subjects?page=1&limit=1000'),
        apiClient.get('/actions?page=1&limit=1000'),
        apiClient.get('/resources?page=1&limit=1000'),
        apiClient.get('/additional-resources?page=1&limit=1000'),
        apiClient.get('/attributes?page=1&limit=1000'),
        apiClient.get('/workspaces?page=1&limit=1000'),
        apiClient.get('/users?page=1&limit=1000'),
      ]);

      // Process policies data
      const policiesData = Array.isArray(policiesRes.data) ? policiesRes.data : policiesRes.data?.data || [];
      const policyStats = {
        total: policiesData.length,
        active: policiesData.filter((p: any) => p.status === 'Active').length,
        draft: policiesData.filter((p: any) => p.status === 'Draft').length,
        inactive: policiesData.filter((p: any) => p.status === 'Inactive').length,
      };

      // Process other data
      const subjectsCount = Array.isArray(subjectsRes.data) ? subjectsRes.data.length : subjectsRes.data?.data?.length || 0;
      const actionsCount = Array.isArray(actionsRes.data) ? actionsRes.data.length : actionsRes.data?.data?.length || 0;
      const resourcesCount = Array.isArray(resourcesRes.data) ? resourcesRes.data.length : resourcesRes.data?.data?.length || 0;
      const additionalResourcesCount = Array.isArray(additionalResourcesRes.data) ? additionalResourcesRes.data.length : additionalResourcesRes.data?.data?.length || 0;
      const attributesCount = Array.isArray(attributesRes.data) ? attributesRes.data.length : attributesRes.data?.data?.length || 0;
      const workspacesCount = Array.isArray(workspacesRes.data) ? workspacesRes.data.length : workspacesRes.data?.data?.length || 0;
      const usersCount = Array.isArray(usersRes.data) ? usersRes.data.length : usersRes.data?.data?.length || 0;

      setStats({
        policies: policyStats,
        subjects: subjectsCount,
        actions: actionsCount,
        resources: resourcesCount,
        additionalResources: additionalResourcesCount,
        attributes: attributesCount,
        workspaces: workspacesCount,
        users: usersCount,
      });

      // Generate recent activities from latest policies
      const activities: RecentActivity[] = policiesData
        .slice(0, 5)
        .map((policy: any) => ({
          id: policy.id || policy._id,
          type: 'policy' as const,
          action: policy.status === 'Draft' ? 'created' as const : 'updated' as const,
          name: policy.name,
          timestamp: policy.updatedAt || policy.createdAt,
        }));

      setRecentActivities(activities);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      snackbar.showError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace, currentApplication]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'policy': return <PolicyIcon fontSize="small" />;
      case 'subject': return <SubjectIcon fontSize="small" />;
      case 'action': return <ActionIcon fontSize="small" />;
      case 'resource': return <ResourceIcon fontSize="small" />;
      case 'attribute': return <AttributeIcon fontSize="small" />;
      case 'workspace': return <WorkspaceIcon fontSize="small" />;
      default: return <DashboardIcon fontSize="small" />;
    }
  };

  const mainStats = [
    {
      label: 'Total Policies',
      value: stats.policies.total,
      icon: PolicyIcon,
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      route: '/policies',
      subtitle: `${stats.policies.active} Active, ${stats.policies.draft} Draft`,
    },
    {
      label: 'Subjects',
      value: stats.subjects,
      icon: SubjectIcon,
      color: '#2e7d32',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      route: '/subjects',
      subtitle: 'Users & Groups',
    },
    {
      label: 'Actions',
      value: stats.actions,
      icon: ActionIcon,
      color: '#ed6c02',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      route: '/actions',
      subtitle: 'System Operations',
    },
    {
      label: 'Resources',
      value: stats.resources,
      icon: ResourceIcon,
      color: '#0288d1',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      route: '/resources',
      subtitle: `+${stats.additionalResources} Additional`,
    },
  ];

  const secondaryStats = [
    {
      label: 'Attributes',
      value: stats.attributes,
      icon: AttributeIcon,
      color: '#9c27b0',
      route: '/attributes',
    },
    {
      label: 'Workspaces',
      value: stats.workspaces,
      icon: WorkspaceIcon,
      color: '#d32f2f',
      route: '/workspaces',
    },
    {
      label: 'Users',
      value: stats.users,
      icon: UserIcon,
      color: '#7b1fa2',
      route: '/users',
    },
    {
      label: 'Additional Resources',
      value: stats.additionalResources,
      icon: AdditionalIcon,
      color: '#0097a7',
      route: '/resources',
    },
  ];

  const quickActions = [
    {
      label: 'Create Policy',
      icon: AddIcon,
      route: '/policies/create',
      color: 'primary',
      description: 'Define new access control rules',
    },
    {
      label: 'Test Policy',
      icon: TestIcon,
      route: '/tester',
      color: 'success',
      description: 'Evaluate policy decisions',
    },
    {
      label: 'Settings',
      icon: SettingsIcon,
      route: '/settings',
      color: 'info',
      description: 'Configure workspace hierarchy',
    },
    {
      label: 'Activity Log',
      icon: ReportIcon,
      route: '/activity',
      color: 'warning',
      description: 'View system activities',
    },
  ];

  const features = [
    {
      title: 'ABAC Components',
      description: 'Complete attribute-based access control with subjects, actions, resources, and attributes',
      icon: LayersIcon,
      color: '#1976d2',
    },
    {
      title: 'Workspace Hierarchy',
      description: 'Multi-tenant architecture with workspaces, applications, and environments',
      icon: HierarchyIcon,
      color: '#2e7d32',
    },
    {
      title: 'Additional Resources',
      description: 'Complex policy conditions with states, approvals, and dynamic resource management',
      icon: AdditionalIcon,
      color: '#ed6c02',
    },
    {
      title: 'Policy Testing',
      description: 'Real-time policy evaluation and testing with comprehensive debugging tools',
      icon: TestIcon,
      color: '#0288d1',
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Welcome Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  width: 64,
                  height: 64,
                  mr: 2,
                  fontSize: '1.5rem',
                  fontWeight: 600,
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" fontWeight="600" gutterBottom>
                  Welcome back, {user?.name}!
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {currentWorkspace ? `${currentWorkspace.displayName || currentWorkspace.name}` : 'CRAFT Permission System'} Dashboard
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Data">
                <IconButton onClick={loadDashboardData} sx={{ color: 'white' }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              label={user?.role?.toUpperCase()}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
              }}
            />
            {user?.department && (
              <Chip
                label={user.department}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                }}
              />
            )}
            <Chip
              icon={<CheckIcon />}
              label="Active"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
              }}
            />
          </Box>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {/* Main Statistics Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          {mainStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }, minWidth: 0 }}>
                <Card
                  sx={{
                    height: '100%',
                    background: stat.gradient,
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => router.push(stat.route)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          {stat.label}
                        </Typography>
                        <Typography variant="h3" component="div" fontWeight="700">
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                          {stat.subtitle}
                        </Typography>
                      </Box>
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          width: 56,
                          height: 56,
                        }}
                      >
                        <Icon sx={{ fontSize: 32 }} />
                      </Avatar>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        View Details
                      </Typography>
                      <ArrowIcon fontSize="small" />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>

        {/* Secondary Statistics */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          {secondaryStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }, minWidth: 0 }}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => router.push(stat.route)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: `${stat.color}15`, mr: 2 }}>
                        <Icon sx={{ color: stat.color }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" component="div" fontWeight="600">
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.label}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>

        {/* Content Grid */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {/* Quick Actions */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' }, minWidth: 0 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Quick Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={index}
                        variant="outlined"
                        fullWidth
                        startIcon={<Icon />}
                        onClick={() => router.push(action.route)}
                        sx={{
                          justifyContent: 'flex-start',
                          py: 1.5,
                          textAlign: 'left',
                        }}
                      >
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                          <Typography variant="body2" fontWeight="600">
                            {action.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {action.description}
                          </Typography>
                        </Box>
                        <ArrowIcon fontSize="small" />
                      </Button>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Policy Status Breakdown */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' }, minWidth: 0 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Policy Status Overview
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ '& > *': { mb: 3 } }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckIcon color="success" fontSize="small" />
                        <Typography variant="body2" fontWeight="500">Active Policies</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="600">
                        {stats.policies.active} / {stats.policies.total}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stats.policies.total > 0 ? (stats.policies.active / stats.policies.total) * 100 : 0}
                      color="success"
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DraftIcon color="warning" fontSize="small" />
                        <Typography variant="body2" fontWeight="500">Draft Policies</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="600">
                        {stats.policies.draft} / {stats.policies.total}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stats.policies.total > 0 ? (stats.policies.draft / stats.policies.total) * 100 : 0}
                      color="warning"
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CancelIcon color="error" fontSize="small" />
                        <Typography variant="body2" fontWeight="500">Inactive Policies</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="600">
                        {stats.policies.inactive} / {stats.policies.total}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stats.policies.total > 0 ? (stats.policies.inactive / stats.policies.total) * 100 : 0}
                      color="error"
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/policies/create')}
                >
                  Create New Policy
                </Button>
              </CardContent>
            </Card>
          </Box>

          {/* Recent Activity */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' }, minWidth: 0 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Recent Activity
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {recentActivities.length === 0 ? (
                  <Alert severity="info">No recent activities to display</Alert>
                ) : (
                  <Box sx={{ '& > *': { py: 2, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } } }}>
                    {recentActivities.map((activity) => (
                      <Box key={activity.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36 }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="500">
                            {activity.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.type} {activity.action}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {formatTimestamp(activity.timestamp)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Feature Highlights */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' }, minWidth: 0 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Feature Highlights
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <Box key={index}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                            p: 2,
                            borderRadius: 1,
                            bgcolor: 'grey.50',
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              bgcolor: 'grey.100',
                            },
                          }}
                        >
                          <Avatar sx={{ bgcolor: `${feature.color}15` }}>
                            <Icon sx={{ color: feature.color }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="600" gutterBottom>
                              {feature.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {feature.description}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
