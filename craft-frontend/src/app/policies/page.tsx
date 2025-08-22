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
} from '@mui/material';
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Policy {
  id: string;
  name: string;
  description: string;
  effect: 'Allow' | 'Deny';
  status: 'Active' | 'Inactive' | 'Draft';
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

export default function PoliciesPage() {
  const [policies] = useState<Policy[]>([
    {
      id: '1',
      name: 'Admin Full Access',
      description: 'Grants full system access to administrators',
      effect: 'Allow',
      status: 'Active',
      createdBy: 'System',
      createdAt: '2024-01-15',
      lastModified: '2024-01-20',
    },
    {
      id: '2',
      name: 'User Read Only',
      description: 'Allows users to view resources only',
      effect: 'Allow',
      status: 'Active',
      createdBy: 'Admin',
      createdAt: '2024-01-16',
      lastModified: '2024-01-18',
    },
    {
      id: '3',
      name: 'Guest Restrictions',
      description: 'Restricts guest user access to sensitive data',
      effect: 'Deny',
      status: 'Active',
      createdBy: 'Admin',
      createdAt: '2024-01-17',
      lastModified: '2024-01-19',
    },
    {
      id: '4',
      name: 'Manager Policy',
      description: 'Allows managers to access department resources',
      effect: 'Allow',
      status: 'Draft',
      createdBy: 'HR',
      createdAt: '2024-01-18',
      lastModified: '2024-01-21',
    },
  ]);

  const [open, setOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const handleClickOpen = (policy?: Policy) => {
    setSelectedPolicy(policy || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPolicy(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      case 'Draft': return 'warning';
      default: return 'default';
    }
  };

  const getEffectColor = (effect: string) => {
    return effect === 'Allow' ? 'success' : 'error';
  };

  const stats = [
    { label: 'Total Policies', value: policies.length, color: 'primary' },
    { label: 'Active', value: policies.filter(p => p.status === 'Active').length, color: 'success' },
    { label: 'Draft', value: policies.filter(p => p.status === 'Draft').length, color: 'warning' },
    { label: 'This Month', value: '3', color: 'info' },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Policies
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage access control policies and permissions for your system.
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
          Create Policy
        </Button>
      </Box>

      {/* Policies Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Effect</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Last Modified</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="medium">
                      {policy.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {policy.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={policy.effect}
                      size="small"
                      color={getEffectColor(policy.effect) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={policy.status}
                      size="small"
                      color={getStatusColor(policy.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {policy.createdBy}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {policy.lastModified}
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
                        onClick={() => handleClickOpen(policy)}
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

      {/* Policy Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPolicy ? 'Edit Policy' : 'Create New Policy'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Policy Name"
                defaultValue={selectedPolicy?.name || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Effect</InputLabel>
                <Select
                  value={selectedPolicy?.effect || 'Allow'}
                  label="Effect"
                >
                  <MenuItem value="Allow">Allow</MenuItem>
                  <MenuItem value="Deny">Deny</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                defaultValue={selectedPolicy?.description || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedPolicy?.status || 'Draft'}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Draft">Draft</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Priority"
                type="number"
                defaultValue="1"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleClose} variant="contained">
            {selectedPolicy ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}