'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Business as WorkspaceIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface IWorkspaceSettings {
  _id: string;
  name: string;
  displayName: string;
  metadata: {
    owner: any;
    admins: any[];
    plan: string;
  };
  settings: {
    allowedDomains?: string[];
    [key: string]: any;
  };
}

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams();
  const router = useRouter();
  const { showError, showSuccess } = useSnackbar();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<IWorkspaceSettings | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [showAddDomainDialog, setShowAddDomainDialog] = useState(false);

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
        showError('Failed to load workspace settings');
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchWorkspace();
    }
  }, [workspaceId, showError]);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      showError('Domain cannot be empty');
      return;
    }

    try {
      setSaving(true);
      
      const updatedDomains = [...(workspace?.settings?.allowedDomains || []), newDomain.trim()];
      
      const response = await apiClient.put(`/workspaces/${workspaceId}`, {
        settings: {
          ...workspace?.settings,
          allowedDomains: updatedDomains
        }
      });

      if (response.success) {
        setWorkspace(prev => prev ? {
          ...prev,
          settings: {
            ...prev.settings,
            allowedDomains: updatedDomains
          }
        } : null);
        setNewDomain('');
        setShowAddDomainDialog(false);
        showSuccess('Domain added successfully');
      } else {
        throw new Error(response.error || 'Failed to add domain');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to add domain');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDomain = async (domainToRemove: string) => {
    if (!window.confirm(`Are you sure you want to remove "${domainToRemove}"?`)) {
      return;
    }

    try {
      setSaving(true);
      
      const updatedDomains = (workspace?.settings?.allowedDomains || []).filter(
        domain => domain !== domainToRemove
      );
      
      const response = await apiClient.put(`/workspaces/${workspaceId}`, {
        settings: {
          ...workspace?.settings,
          allowedDomains: updatedDomains
        }
      });

      if (response.success) {
        setWorkspace(prev => prev ? {
          ...prev,
          settings: {
            ...prev.settings,
            allowedDomains: updatedDomains
          }
        } : null);
        showSuccess('Domain removed successfully');
      } else {
        throw new Error(response.error || 'Failed to remove domain');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to remove domain');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/workspaces/${workspaceId}`);
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
        <Box>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="/workspaces"
            onClick={(e) => {
              e.preventDefault();
              router.push('/workspaces');
            }}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <WorkspaceIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Workspaces
          </Link>
          <Link
            color="inherit"
            href={`/workspaces/${workspaceId}`}
            onClick={(e) => {
              e.preventDefault();
              router.push(`/workspaces/${workspaceId}`);
            }}
            sx={{ cursor: 'pointer' }}
          >
            {workspace.displayName}
          </Link>
          <Typography color="text.primary">
            Settings
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="600">
            Workspace Settings
          </Typography>
        </Box>

        {/* Security Settings */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <SecurityIcon sx={{ mr: 1 }} />
              Security & Access
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Workspace Plan
              </Typography>
              <Chip 
                label={workspace.metadata?.plan?.toUpperCase() || 'FREE'} 
                color="primary" 
                variant="outlined" 
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Allowed Domains
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Restrict access to this workspace to specific domains
            </Typography>

            {workspace.settings?.allowedDomains && workspace.settings.allowedDomains.length > 0 ? (
              <List dense>
                {workspace.settings.allowedDomains.map((domain, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={domain}
                      secondary="Allowed domain"
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveDomain(domain)}
                        color="error"
                        size="small"
                        disabled={saving}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                No domain restrictions configured. All domains are allowed.
              </Alert>
            )}

            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={() => setShowAddDomainDialog(true)}
              disabled={saving}
            >
              Add Domain
            </Button>
          </CardContent>
        </Card>

        {/* Workspace Information */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Workspace Information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                System Name
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                {workspace.name}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Workspace ID
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                {workspace._id}
              </Typography>
            </Box>

            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Danger Zone:</strong> Workspace deletion and other destructive actions are available through the main workspace menu.
              </Typography>
            </Alert>
          </CardContent>
        </Card>

        {/* Add Domain Dialog */}
        <Dialog open={showAddDomainDialog} onClose={() => setShowAddDomainDialog(false)}>
          <DialogTitle>Add Allowed Domain</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Domain"
              type="text"
              fullWidth
              variant="outlined"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              helperText="Enter a domain name without protocol (e.g., example.com)"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddDomainDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddDomain}
              variant="contained"
              disabled={saving || !newDomain.trim()}
            >
              {saving ? <CircularProgress size={20} /> : 'Add Domain'}
            </Button>
          </DialogActions>
        </Dialog>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}