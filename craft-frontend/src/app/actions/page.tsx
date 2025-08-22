'use client';

import React, { useState } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Code as CodeIcon,
  Storage as DatabaseIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Action {
  id: string;
  name: string;
  description: string;
  category: 'Read' | 'Write' | 'Execute' | 'Delete' | 'Admin';
  httpMethod?: string;
  endpoint?: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Active' | 'Inactive' | 'Deprecated';
  createdAt: string;
  usageCount: number;
}

export default function ActionsPage() {
  const [actions] = useState<Action[]>([
    {
      id: '1',
      name: 'read_user_profile',
      description: 'Read user profile information',
      category: 'Read',
      httpMethod: 'GET',
      endpoint: '/api/users/{id}',
      riskLevel: 'Low',
      status: 'Active',
      createdAt: '2024-01-15',
      usageCount: 1247,
    },
    {
      id: '2',
      name: 'update_user_profile',
      description: 'Update user profile information',
      category: 'Write',
      httpMethod: 'PUT',
      endpoint: '/api/users/{id}',
      riskLevel: 'Medium',
      status: 'Active',
      createdAt: '2024-01-16',
      usageCount: 423,
    },
    {
      id: '3',
      name: 'delete_user_account',
      description: 'Permanently delete a user account',
      category: 'Delete',
      httpMethod: 'DELETE',
      endpoint: '/api/users/{id}',
      riskLevel: 'Critical',
      status: 'Active',
      createdAt: '2024-01-17',
      usageCount: 12,
    },
    {
      id: '4',
      name: 'execute_system_backup',
      description: 'Execute full system backup',
      category: 'Execute',
      riskLevel: 'High',
      status: 'Active',
      createdAt: '2024-01-18',
      usageCount: 89,
    },
    {
      id: '5',
      name: 'manage_permissions',
      description: 'Manage user permissions and roles',
      category: 'Admin',
      httpMethod: 'POST',
      endpoint: '/api/admin/permissions',
      riskLevel: 'Critical',
      status: 'Active',
      createdAt: '2024-01-19',
      usageCount: 56,
    },
  ]);

  const [open, setOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);

  const handleClickOpen = (action?: Action) => {
    setSelectedAction(action || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAction(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      case 'Deprecated': return 'warning';
      default: return 'default';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'error';
      case 'Critical': return 'error';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Read': return <ViewIcon />;
      case 'Write': return <EditIcon />;
      case 'Execute': return <PlayArrowIcon />;
      case 'Delete': return <DeleteIcon />;
      case 'Admin': return <SecurityIcon />;
      default: return <CodeIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Read': return 'info';
      case 'Write': return 'primary';
      case 'Execute': return 'secondary';
      case 'Delete': return 'error';
      case 'Admin': return 'warning';
      default: return 'default';
    }
  };

  const stats = [
    { label: 'Total Actions', value: actions.length, color: 'primary' },
    { label: 'Active', value: actions.filter(a => a.status === 'Active').length, color: 'success' },
    { label: 'High Risk', value: actions.filter(a => a.riskLevel === 'High' || a.riskLevel === 'Critical').length, color: 'error' },
    { label: 'This Week', value: '7', color: 'info' },
  ];

  const categoryStats = actions.reduce((acc, action) => {
    acc[action.category] = (acc[action.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PlayArrowIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Actions
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage available actions and operations in your system.
        </Typography>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h4" component="div" color={`${stat.color}.main`}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Category Breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          {/* Actions Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<FilterIcon />}>
                Filter
              </Button>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleClickOpen()}
            >
              Create Action
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions by Category
              </Typography>
              <List dense>
                {Object.entries(categoryStats).map(([category, count]) => (
                  <ListItem key={category} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Box sx={{ color: `${getCategoryColor(category)}.main` }}>
                        {getCategoryIcon(category)}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={category}
                      secondary={`${count} actions`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Method/Endpoint</TableCell>
                <TableCell>Risk Level</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {actions.map((action) => (
                <TableRow key={action.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="medium" fontFamily="monospace">
                        {action.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: `${getCategoryColor(action.category)}.main` }}>
                        {getCategoryIcon(action.category)}
                      </Box>
                      <Chip
                        label={action.category}
                        size="small"
                        color={getCategoryColor(action.category) as any}
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {action.httpMethod && action.endpoint ? (
                      <Box>
                        <Chip
                          label={action.httpMethod}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 0.5, fontFamily: 'monospace' }}
                        />
                        <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                          {action.endpoint}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        System Action
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={action.riskLevel}
                      size="small"
                      color={getRiskColor(action.riskLevel) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={action.status}
                      size="small"
                      color={getStatusColor(action.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {action.usageCount.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" color="primary">
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleClickOpen(action)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => handleClickOpen()}
      >
        <AddIcon />
      </Fab>

      {/* Action Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAction ? 'Edit Action' : 'Create New Action'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Action Name"
                defaultValue={selectedAction?.name || ''}
                variant="outlined"
                placeholder="e.g., read_user_profile"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedAction?.category || 'Read'}
                  label="Category"
                >
                  <MenuItem value="Read">Read</MenuItem>
                  <MenuItem value="Write">Write</MenuItem>
                  <MenuItem value="Execute">Execute</MenuItem>
                  <MenuItem value="Delete">Delete</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                defaultValue={selectedAction?.description || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>HTTP Method</InputLabel>
                <Select
                  value={selectedAction?.httpMethod || ''}
                  label="HTTP Method"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                  <MenuItem value="PATCH">PATCH</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Endpoint"
                defaultValue={selectedAction?.endpoint || ''}
                variant="outlined"
                placeholder="/api/resource/{id}"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Risk Level</InputLabel>
                <Select
                  value={selectedAction?.riskLevel || 'Low'}
                  label="Risk Level"
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedAction?.status || 'Active'}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Deprecated">Deprecated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleClose} variant="contained">
            {selectedAction ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}