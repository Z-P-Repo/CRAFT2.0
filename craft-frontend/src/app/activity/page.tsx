'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Tooltip,
  Button,
  Stack,
  Divider,
  Alert,
  Skeleton,
  useTheme,
  alpha,
  Toolbar,
  Popover,
  List,
  ListItem,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as ComplianceIcon,
  Settings as OperationIcon,
  Tune as ConfigIcon,
  Extension as IntegrationIcon,
  MonitorHeart as MonitoringIcon,
  Person as UserActivityIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Schedule as PendingIcon,
  Computer as SystemIcon,
  AccountCircle as UserIcon,
  Build as ServiceIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ActivityDetailModal from '@/components/activity/ActivityDetailModal';
import activityService from '@/lib/activityService';
import apiClient from '@/lib/api';
import { Activity, ActivityCategory, ActivityType, ActivitySeverity, ActivityFilter } from '@/types';

// Mock data for demonstration - replace with API integration
const generateMockActivities = (): Activity[] => {
  const activities: Activity[] = [];
  const types: ActivityType[] = [
    'authentication', 'authorization', 'policy_management', 'user_management', 
    'resource_management', 'system_configuration', 'audit', 'security_event'
  ];
  const categories: ActivityCategory[] = [
    'security', 'administration', 'compliance', 'operation', 'configuration'
  ];
  const severities: ActivitySeverity[] = ['low', 'medium', 'high', 'critical'];
  const actors = [
    { name: 'John Doe', email: 'john.doe@company.com', type: 'user' as const },
    { name: 'System', email: 'system@craft.local', type: 'system' as const },
    { name: 'API Service', email: 'api@craft.local', type: 'service' as const },
  ];

  for (let i = 0; i < 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)] as ActivityType;
    const category = categories[Math.floor(Math.random() * categories.length)] as ActivityCategory;
    const severity = severities[Math.floor(Math.random() * severities.length)] as ActivitySeverity;
    const actor = actors[Math.floor(Math.random() * actors.length)];
    
    activities.push({
      _id: `activity-${i}`,
      type,
      category,
      action: getActionForType(type),
      resource: {
        type: 'policy',
        id: `resource-${i}`,
        name: `Resource ${i + 1}`,
      },
      actor: {
        id: `user-${i}`,
        name: actor?.name || 'Unknown',
        email: actor?.email || 'unknown@example.com',
        type: actor?.type || 'user',
      },
      description: getDescriptionForType(type, actor?.name || 'Unknown'),
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      severity,
      metadata: {
        status: Math.random() > 0.1 ? 'success' : 'failure',
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
        userAgent: 'Mozilla/5.0 (Chrome/91.0)',
      },
      tags: [`${category}`, `${severity}-priority`],
    });
  }

  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const getActionForType = (type: ActivityType): string => {
  const actions: Record<ActivityType, string[]> = {
    authentication: ['login', 'logout', 'password_change', 'mfa_setup'],
    authorization: ['access_granted', 'access_denied', 'permission_check'],
    policy_management: ['policy_created', 'policy_updated', 'policy_deleted'],
    user_management: ['user_created', 'user_updated', 'user_deleted'],
    resource_management: ['resource_created', 'resource_updated', 'resource_deleted'],
    system_configuration: ['config_changed', 'setting_updated'],
    audit: ['audit_log_created', 'compliance_check'],
    security_event: ['suspicious_activity', 'security_violation'],
    data_modification: ['data_created', 'data_updated', 'data_deleted'],
    access_request: ['request_submitted', 'request_approved', 'request_denied'],
    workflow: ['workflow_started', 'workflow_completed'],
    integration: ['api_call', 'data_sync'],
    maintenance: ['system_update', 'backup_created'],
  };
  
  const typeActions = actions[type];
  if (!typeActions || typeActions.length === 0) {
    return 'unknown_action';
  }
  return typeActions[Math.floor(Math.random() * typeActions.length)] as string;
};

const getDescriptionForType = (type: ActivityType, actorName: string): string => {
  const descriptions: Record<ActivityType, string[]> = {
    authentication: [
      `${actorName} successfully logged in`,
      `${actorName} logged out`,
      `${actorName} changed password`,
    ],
    authorization: [
      `${actorName} was granted access to resource`,
      `${actorName} was denied access to resource`,
    ],
    policy_management: [
      `${actorName} created a new policy`,
      `${actorName} updated policy configuration`,
      `${actorName} deleted a policy`,
    ],
    user_management: [
      `${actorName} created a new user account`,
      `${actorName} updated user permissions`,
    ],
    resource_management: [
      `${actorName} added a new resource`,
      `${actorName} modified resource attributes`,
    ],
    system_configuration: [
      `${actorName} updated system configuration`,
      `${actorName} changed security settings`,
    ],
    audit: [
      `Compliance audit initiated by ${actorName}`,
      `Security audit completed`,
    ],
    security_event: [
      `Suspicious login attempt detected`,
      `Security violation reported`,
    ],
    data_modification: [
      `${actorName} created new data record`,
      `${actorName} updated data record`,
    ],
    access_request: [
      `${actorName} submitted access request`,
      `Access request approved by ${actorName}`,
    ],
    workflow: [
      `Workflow initiated by ${actorName}`,
      `Workflow completed successfully`,
    ],
    integration: [
      `External API call made by ${actorName}`,
      `Data synchronization completed`,
    ],
    maintenance: [
      `System maintenance performed`,
      `Backup operation completed`,
    ],
  };
  
  const typeDescriptions = descriptions[type];
  if (!typeDescriptions || typeDescriptions.length === 0) {
    return `Unknown activity by ${actorName}`;
  }
  return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)] as string;
};

const CATEGORY_ICONS: Record<ActivityCategory, React.ComponentType> = {
  security: SecurityIcon,
  administration: AdminIcon,
  compliance: ComplianceIcon,
  operation: OperationIcon,
  configuration: ConfigIcon,
  integration: IntegrationIcon,
  monitoring: MonitoringIcon,
  user_activity: UserActivityIcon,
};

const SEVERITY_COLORS: Record<ActivitySeverity, string> = {
  low: '#4caf50',
  medium: '#ff9800', 
  high: '#f44336',
  critical: '#d32f2f',
};

const ACTOR_TYPE_ICONS: Record<'user' | 'system' | 'service', React.ComponentType> = {
  user: UserIcon,
  system: SystemIcon,
  service: ServiceIcon,
};

export default function ActivityPage() {
  const theme = useTheme();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ActivityFilter>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'available' | 'unavailable'>('unknown');
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<HTMLElement | null>(null);

  // Initialize with API data, fallback to mock data
  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      try {
        // Try to load from API first using the API client
        const response = await apiClient.getActivities({
          page: 1,
          limit: 100
        });
        
        if (response.success && response.data) {
          setActivities(response.data);
          setApiStatus('available');
        } else {
          throw new Error(response.error || 'Invalid API response format');
        }
      } catch (error) {
        console.warn('Failed to load activities from API, using mock data:', error);
        setApiStatus('unavailable');
        // Fallback to mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setActivities(generateMockActivities());
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  // Filter activities based on search and filters
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.actor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(activity => filters.category!.includes(activity.category));
    }

    // Severity filter
    if (filters.severity && filters.severity.length > 0) {
      filtered = filtered.filter(activity => filters.severity!.includes(activity.severity));
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(activity => filters.type!.includes(activity.type));
    }

    return filtered;
  }, [activities, searchTerm, filters]);

  // Paginated activities
  const paginatedActivities = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredActivities.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredActivities, page, rowsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    const total = activities.length;
    const categories = activities.reduce((acc, activity) => {
      acc[activity.category] = (acc[activity.category] || 0) + 1;
      return acc;
    }, {} as Record<ActivityCategory, number>);

    const severities = activities.reduce((acc, activity) => {
      acc[activity.severity] = (acc[activity.severity] || 0) + 1;
      return acc;
    }, {} as Record<ActivitySeverity, number>);

    const recentActivities = activities.filter(activity => 
      new Date(activity.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length;

    return { total, categories, severities, recentActivities };
  }, [activities]);

  const handleFilterChange = useCallback((filterType: keyof ActivityFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
    setPage(0);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      // Try to load from API first using the API client
      const response = await apiClient.getActivities({
        page: 1,
        limit: 100
      });
      
      if (response.success && response.data) {
        setActivities(response.data);
        setApiStatus('available');
      } else {
        throw new Error(response.error || 'Invalid API response format');
      }
    } catch (error) {
      console.warn('Failed to refresh activities from API, using mock data:', error);
      setApiStatus('unavailable');
      // Fallback to generating new mock data
      setActivities(generateMockActivities());
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRowClick = useCallback((activity: Activity) => {
    setSelectedActivity(activity);
    setDetailModalOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedActivity(null);
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

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setPage(0);
  }, []);

  const hasActiveFilters = Boolean(
    searchTerm || 
    (filters.category && filters.category.length > 0) ||
    (filters.severity && filters.severity.length > 0) ||
    (filters.type && filters.type.length > 0)
  );

  const getSeverityIcon = (severity: ActivitySeverity, status?: string) => {
    if (status === 'failure') return <ErrorIcon sx={{ color: '#f44336', fontSize: 16 }} />;
    if (status === 'pending') return <PendingIcon sx={{ color: '#ff9800', fontSize: 16 }} />;
    
    switch (severity) {
      case 'critical': return <ErrorIcon sx={{ color: SEVERITY_COLORS.critical, fontSize: 16 }} />;
      case 'high': return <WarningIcon sx={{ color: SEVERITY_COLORS.high, fontSize: 16 }} />;
      case 'medium': return <InfoIcon sx={{ color: SEVERITY_COLORS.medium, fontSize: 16 }} />;
      default: return <SuccessIcon sx={{ color: SEVERITY_COLORS.low, fontSize: 16 }} />;
    }
  };

  const getActorAvatar = (activity: Activity) => {
    const ActorIcon = ACTOR_TYPE_ICONS[activity.actor.type];
    
    if (activity.actor.type === 'user') {
      return (
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
          {activity.actor.name.charAt(0).toUpperCase()}
        </Avatar>
      );
    }

    return (
      <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.500' }}>
        <ActorIcon />
      </Avatar>
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Header */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimelineIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h4" component="h1">
                Activity Log
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              <Button
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                variant="outlined"
                size="small"
              >
                Refresh
              </Button>
              <Button
                startIcon={<ExportIcon />}
                variant="outlined"
                size="small"
              >
                Export
              </Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
            <Typography variant="body1" color="text.secondary">
              Monitor and track all system activities, user actions, and security events in real-time.
            </Typography>
            <Chip
              label={
                apiStatus === 'available' ? 'Live Data' : 
                apiStatus === 'unavailable' ? 'Demo Mode' : 'Connecting...'
              }
              color={
                apiStatus === 'available' ? 'success' : 
                apiStatus === 'unavailable' ? 'warning' : 'default'
              }
              size="small"
              sx={{ ml: 'auto' }}
            />
          </Box>
        </Paper>

        {/* API Status Alert */}
        {apiStatus === 'unavailable' && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRefresh}
              >
                Retry
              </Button>
            }
          >
            Activity API is not available. Showing demo data for demonstration purposes.
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item={true} xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary.main" gutterBottom>
                  {loading ? <Skeleton width={60} /> : stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Activities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item={true} xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="success.main" gutterBottom>
                  {loading ? <Skeleton width={60} /> : stats.recentActivities}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last 24 Hours
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item={true} xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="warning.main" gutterBottom>
                  {loading ? <Skeleton width={60} /> : (stats.severities.high || 0) + (stats.severities.critical || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  High Priority
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item={true} xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="info.main" gutterBottom>
                  {loading ? <Skeleton width={60} /> : Object.keys(stats.categories).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Categories
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important' }}>
            <Box sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              <OutlinedInput
                size="small"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                }
                sx={{ minWidth: 300 }}
              />
              
              {hasActiveFilters && (
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
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </Paper>

        {/* Activities Table */}
        <Paper elevation={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Activity</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 7 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No activities found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedActivities.map((activity) => {
                    const CategoryIcon = CATEGORY_ICONS[activity.category];
                    
                    return (
                      <TableRow 
                        key={activity._id} 
                        hover 
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleRowClick(activity)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {getSeverityIcon(activity.severity, activity.metadata?.status)}
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {activity.action.replace(/_/g, ' ').toUpperCase()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {activity.description}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getActorAvatar(activity)}
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {activity.actor.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {activity.actor.type}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {activity.resource.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.resource.type}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            <Chip 
                              label={activity.category} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={activity.severity.toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: alpha(SEVERITY_COLORS[activity.severity], 0.1),
                              color: SEVERITY_COLORS[activity.severity],
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={format(parseISO(activity.timestamp), 'PPpp')}>
                            <Typography variant="body2">
                              {formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true })}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={activity.metadata?.status || 'success'}
                            size="small"
                            color={activity.metadata?.status === 'success' ? 'success' : 
                                   activity.metadata?.status === 'failure' ? 'error' : 'warning'}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredActivities.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>

        {/* Activity Detail Modal */}
        <ActivityDetailModal
          activity={selectedActivity}
          open={detailModalOpen}
          onClose={handleCloseDetail}
        />

        {/* Filter Popover */}
        <Popover
          open={Boolean(filterAnchorEl)}
          anchorEl={filterAnchorEl}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ p: 2, minWidth: 300 }}>
            <Typography variant="h6" gutterBottom>
              Filter Activities
            </Typography>
            
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                multiple
                value={filters.category || []}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                input={<OutlinedInput label="Category" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as ActivityCategory[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {Object.keys(CATEGORY_ICONS).map((category) => (
                  <MenuItem key={category} value={category}>
                    <Checkbox checked={filters.category?.includes(category as ActivityCategory)} />
                    <ListItemText primary={category} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Severity</InputLabel>
              <Select
                multiple
                value={filters.severity || []}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                input={<OutlinedInput label="Severity" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as ActivitySeverity[]).map((value) => (
                      <Chip 
                        key={value} 
                        label={value} 
                        size="small"
                        sx={{ 
                          bgcolor: alpha(SEVERITY_COLORS[value], 0.1),
                          color: SEVERITY_COLORS[value],
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {Object.keys(SEVERITY_COLORS).map((severity) => (
                  <MenuItem key={severity} value={severity}>
                    <Checkbox checked={filters.severity?.includes(severity as ActivitySeverity)} />
                    <ListItemText primary={severity} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small">  
              <InputLabel>Type</InputLabel>
              <Select
                multiple
                value={filters.type || []}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                input={<OutlinedInput label="Type" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as ActivityType[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {[
                  'authentication', 'authorization', 'policy_management', 'user_management', 
                  'resource_management', 'system_configuration', 'audit', 'security_event',
                  'data_modification', 'access_request', 'workflow', 'integration', 'maintenance'
                ].map((type) => (
                  <MenuItem key={type} value={type}>
                    <Checkbox checked={filters.type?.includes(type as ActivityType)} />
                    <ListItemText primary={type.replace(/_/g, ' ')} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Popover>

        {/* Sort Popover */}
        <Popover
          open={Boolean(sortAnchorEl)}
          anchorEl={sortAnchorEl}
          onClose={handleSortClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ p: 2, minWidth: 200 }}>
            <Typography variant="h6" gutterBottom>
              Sort Activities
            </Typography>
            <List>
              <ListItem button onClick={() => { /* Sort by timestamp */ handleSortClose(); }}>
                <ListItemText primary="Most Recent" />
              </ListItem>
              <ListItem button onClick={() => { /* Sort by severity */ handleSortClose(); }}>
                <ListItemText primary="By Severity" />
              </ListItem>
              <ListItem button onClick={() => { /* Sort by category */ handleSortClose(); }}>
                <ListItemText primary="By Category" />
              </ListItem>
              <ListItem button onClick={() => { /* Sort by actor */ handleSortClose(); }}>
                <ListItemText primary="By Actor" />
              </ListItem>
            </List>
          </Box>
        </Popover>
      </DashboardLayout>
    </ProtectedRoute>
  );
}