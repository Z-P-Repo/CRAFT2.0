'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Computer as SystemIcon,
  Build as ServiceIcon,
  Schedule as TimeIcon,
  LocationOn as LocationIcon,
  Devices as DeviceIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as ComplianceIcon,
  Settings as OperationIcon,
  Tune as ConfigIcon,
  Extension as IntegrationIcon,
  MonitorHeart as MonitoringIcon,
  Timeline as UserActivityIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { Activity, ActivityCategory, ActivitySeverity } from '@/types';

interface ActivityDetailModalProps {
  activity: Activity | null;
  open: boolean;
  onClose: () => void;
}

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
  user: PersonIcon,
  system: SystemIcon,
  service: ServiceIcon,
};

export default function ActivityDetailModal({ activity, open, onClose }: ActivityDetailModalProps) {
  if (!activity) return null;

  const CategoryIcon = CATEGORY_ICONS[activity.category];
  const ActorIcon = ACTOR_TYPE_ICONS[activity.actor.type];
  const getActorAvatar = () => {
    if (activity.actor.type === 'user') {
      return (
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
          {activity.actor.name.charAt(0).toUpperCase()}
        </Avatar>
      );
    }

    return (
      <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.500' }}>
        <ActorIcon sx={{ fontSize: 20 }} />
      </Avatar>
    );
  };

  const getStatusIcon = () => {
    const status = activity.metadata?.status;
    switch (status) {
      case 'success':
        return <SuccessIcon sx={{ color: '#4caf50', mr: 1 }} />;
      case 'failure':
        return <ErrorIcon sx={{ color: '#f44336', mr: 1 }} />;
      case 'pending':
        return <WarningIcon sx={{ color: '#ff9800', mr: 1 }} />;
      default:
        return <InfoIcon sx={{ color: '#2196f3', mr: 1 }} />;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CategoryIcon sx={{ color: 'primary.main' }} />
          <Box>
            <Typography variant="h6">
              Activity Details
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {activity.action.replace(/_/g, ' ').toUpperCase()}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Header Info */}
          <Grid item xs={12}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {getStatusIcon()}
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {activity.description}
                  </Typography>
                  <Chip
                    label={activity.severity.toUpperCase()}
                    sx={{
                      bgcolor: `${SEVERITY_COLORS[activity.severity]}20`,
                      color: SEVERITY_COLORS[activity.severity],
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {format(parseISO(activity.timestamp), 'PPpp')}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  {activity.tags?.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Actor Information */}
          <Grid item xs={12} md={6}>
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon sx={{ fontSize: 20 }} />
                  Actor
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {getActorAvatar()}
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {activity.actor.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activity.actor.email}
                    </Typography>
                    <Chip 
                      label={activity.actor.type} 
                      size="small" 
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Resource Information */}
          <Grid item xs={12} md={6}>
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon sx={{ fontSize: 20 }} />
                  Resource
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" fontWeight={500}>
                    {activity.resource.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {activity.resource.type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {activity.resource.id}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Target Information (if exists) */}
          {activity.target && (
            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Target
                  </Typography>
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {activity.target.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type: {activity.target.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {activity.target.id}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Category & Type */}
          <Grid item xs={12} md={activity.target ? 6 : 12}>
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Classification
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CategoryIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Category" 
                      secondary={activity.category.charAt(0).toUpperCase() + activity.category.slice(1)} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon sx={{ fontSize: 20, color: 'info.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Type" 
                      secondary={activity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Metadata */}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <Grid item xs={12}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Additional Information
                  </Typography>
                  <Grid container spacing={2}>
                    {activity.metadata.ipAddress && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <LocationIcon sx={{ fontSize: 16 }} />
                            <Typography variant="body2" fontWeight={500}>
                              IP Address
                            </Typography>
                          </Box>
                          <Typography variant="body2">
                            {activity.metadata.ipAddress}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                    
                    {activity.metadata.userAgent && (
                      <Grid item xs={12} sm={6} md={8}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <DeviceIcon sx={{ fontSize: 16 }} />
                            <Typography variant="body2" fontWeight={500}>
                              User Agent
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                            {activity.metadata.userAgent.length > 100 
                              ? `${activity.metadata.userAgent.slice(0, 100)}...`
                              : activity.metadata.userAgent
                            }
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    {activity.metadata.sessionId && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="body2" fontWeight={500} gutterBottom>
                            Session ID
                          </Typography>
                          <Typography variant="body2" fontFamily="monospace">
                            {activity.metadata.sessionId}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    {activity.metadata.duration && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="body2" fontWeight={500} gutterBottom>
                            Duration
                          </Typography>
                          <Typography variant="body2">
                            {activity.metadata.duration}ms
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    {activity.metadata.errorMessage && (
                      <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'error.50', borderLeft: 3, borderColor: 'error.main' }}>
                          <Typography variant="body2" fontWeight={500} color="error.main" gutterBottom>
                            Error Message
                          </Typography>
                          <Typography variant="body2" color="error.dark">
                            {activity.metadata.errorMessage}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    {activity.metadata.changes && (
                      <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.50' }}>
                          <Typography variant="body2" fontWeight={500} gutterBottom>
                            Changes Made
                          </Typography>
                          {Object.entries(activity.metadata.changes).map(([field, change]) => (
                            <Box key={field} sx={{ mb: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {field}:
                              </Typography>
                              <Typography variant="body2" sx={{ ml: 2 }}>
                                From: <code>{JSON.stringify(change.from)}</code>
                              </Typography>
                              <Typography variant="body2" sx={{ ml: 2 }}>
                                To: <code>{JSON.stringify(change.to)}</code>
                              </Typography>
                            </Box>
                          ))}
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}