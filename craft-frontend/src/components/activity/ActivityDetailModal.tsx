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
  Card,
  CardContent,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as UserIcon,
  Computer as SystemIcon,
  Build as ServiceIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as ComplianceIcon,
  Settings as OperationIcon,
  Tune as ConfigIcon,
  Extension as IntegrationIcon,
  MonitorHeart as MonitoringIcon,
  Schedule as UserActivityIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { alpha } from '@mui/material/styles';
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
  user: UserIcon,
  system: SystemIcon,
  service: ServiceIcon,
};

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  open,
  onClose,
}) => {
  if (!activity) {
    return null;
  }

  const CategoryIcon = CATEGORY_ICONS[activity.category];

  const getSeverityColor = (severity: ActivitySeverity) => {
    return SEVERITY_COLORS[severity];
  };

  const getActorAvatar = () => {
    const ActorIcon = ACTOR_TYPE_ICONS[activity.actor.type];

    if (activity.actor.type === 'user') {
      return (
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
          {activity.actor.name.charAt(0).toUpperCase()}
        </Avatar>
      );
    }

    return (
      <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.500' }}>
        <ActorIcon />
      </Avatar>
    );
  };

  const getStatusIcon = () => {
    const status = activity.metadata?.status;
    switch (status) {
      case 'success':
        return <SuccessIcon sx={{ color: '#4caf50', fontSize: 20 }} />;
      case 'failure':
        return <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />;
      case 'pending':
        return <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />;
      default:
        return <InfoIcon sx={{ color: '#2196f3', fontSize: 20 }} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: 400,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CategoryIcon />
          <Box>
            <Typography variant="h6">
              Activity Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activity.action.replace(/_/g, ' ').toUpperCase()}
            </Typography>
          </Box>
        </Box>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Header Info */}
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {getActorAvatar()}
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {activity.action.replace(/_/g, ' ').toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activity.description}
                  </Typography>
                </Box>
                <Chip
                  label={activity.severity.toUpperCase()}
                  size="small"
                  sx={{
                    ml: 'auto',
                    bgcolor: alpha(getSeverityColor(activity.severity), 0.1),
                    color: getSeverityColor(activity.severity),
                    fontWeight: 500,
                  }}
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Time:</strong> {formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true })} 
                ({format(parseISO(activity.timestamp), 'PPpp')})
              </Typography>
            </CardContent>
          </Card>

          {/* Details Section */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Category:</strong> {activity.category}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {activity.type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Resource:</strong> {activity.resource.name} ({activity.resource.type})
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {activity.metadata?.status || 'success'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Actor Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {activity.actor.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {activity.actor.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {activity.actor.type}
                  </Typography>
                  {activity.metadata?.ipAddress && (
                    <Typography variant="body2">
                      <strong>IP Address:</strong> {activity.metadata.ipAddress}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Metadata */}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Metadata
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {Object.entries(activity.metadata).map(([key, value]) => (
                    <Typography key={key} variant="body2">
                      <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {String(value)}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {activity.tags && activity.tags.length > 0 && (
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {activity.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityDetailModal;