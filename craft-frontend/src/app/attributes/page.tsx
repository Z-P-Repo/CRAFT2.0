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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Label as LabelIcon,
  DataObject as ObjectIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Attribute {
  id: string;
  name: string;
  displayName: string;
  type: 'String' | 'Number' | 'Boolean' | 'Date' | 'Array';
  category: 'Subject' | 'Object' | 'Environment' | 'Action';
  defaultValue?: string;
  required: boolean;
  description: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  usageCount: number;
}

export default function AttributesPage() {
  const [attributes] = useState<Attribute[]>([
    {
      id: '1',
      name: 'user.department',
      displayName: 'User Department',
      type: 'String',
      category: 'Subject',
      defaultValue: 'general',
      required: true,
      description: 'Department where the user belongs',
      status: 'Active',
      createdAt: '2024-01-15',
      usageCount: 156,
    },
    {
      id: '2',
      name: 'user.clearance_level',
      displayName: 'Security Clearance',
      type: 'Number',
      category: 'Subject',
      defaultValue: '1',
      required: true,
      description: 'Security clearance level (1-5)',
      status: 'Active',
      createdAt: '2024-01-16',
      usageCount: 203,
    },
    {
      id: '3',
      name: 'resource.classification',
      displayName: 'Resource Classification',
      type: 'String',
      category: 'Object',
      defaultValue: 'public',
      required: false,
      description: 'Classification level of the resource',
      status: 'Active',
      createdAt: '2024-01-17',
      usageCount: 87,
    },
    {
      id: '4',
      name: 'environment.ip_address',
      displayName: 'IP Address',
      type: 'String',
      category: 'Environment',
      required: false,
      description: 'Client IP address making the request',
      status: 'Active',
      createdAt: '2024-01-18',
      usageCount: 342,
    },
    {
      id: '5',
      name: 'action.risk_score',
      displayName: 'Action Risk Score',
      type: 'Number',
      category: 'Action',
      defaultValue: '0',
      required: false,
      description: 'Risk assessment score for the action',
      status: 'Active',
      createdAt: '2024-01-19',
      usageCount: 124,
    },
  ]);

  const [open, setOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);

  const handleClickOpen = (attribute?: Attribute) => {
    setSelectedAttribute(attribute || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAttribute(null);
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'success' : 'error';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'String': return 'primary';
      case 'Number': return 'success';
      case 'Boolean': return 'warning';
      case 'Date': return 'info';
      case 'Array': return 'secondary';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Subject': return <PersonIcon />;
      case 'Object': return <ObjectIcon />;
      case 'Environment': return <BusinessIcon />;
      case 'Action': return <SettingsIcon />;
      default: return <LabelIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Subject': return 'primary';
      case 'Object': return 'secondary';
      case 'Environment': return 'info';
      case 'Action': return 'warning';
      default: return 'default';
    }
  };

  const stats = [
    { label: 'Total Attributes', value: attributes.length, color: 'primary' },
    { label: 'Active', value: attributes.filter(a => a.status === 'Active').length, color: 'success' },
    { label: 'Required', value: attributes.filter(a => a.required).length, color: 'warning' },
    { label: 'This Month', value: '3', color: 'info' },
  ];

  const categoryStats = attributes.reduce((acc, attr) => {
    acc[attr.category] = (acc[attr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SettingsIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Attributes
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage system attributes for subjects, objects, environment, and actions.
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

      {/* Category Breakdown and Actions */}
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
              Create Attribute
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attributes by Category
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
                      secondary={`${count} attributes`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Attributes Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Attribute</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Default Value</TableCell>
                <TableCell>Required</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attributes.map((attribute) => (
                <TableRow key={attribute.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="medium" fontFamily="monospace">
                        {attribute.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {attribute.displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {attribute.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={attribute.type}
                      size="small"
                      color={getTypeColor(attribute.type) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: `${getCategoryColor(attribute.category)}.main` }}>
                        {getCategoryIcon(attribute.category)}
                      </Box>
                      <Chip
                        label={attribute.category}
                        size="small"
                        color={getCategoryColor(attribute.category) as any}
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                      {attribute.defaultValue || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={attribute.required ? 'Yes' : 'No'}
                      size="small"
                      color={attribute.required ? 'error' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={attribute.status}
                      size="small"
                      color={getStatusColor(attribute.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {attribute.usageCount.toLocaleString()}
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
                        onClick={() => handleClickOpen(attribute)}
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

      {/* Attribute Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAttribute ? 'Edit Attribute' : 'Create New Attribute'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Attribute Name"
                defaultValue={selectedAttribute?.name || ''}
                variant="outlined"
                placeholder="e.g., user.department"
                helperText="Use dot notation for nested attributes"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Display Name"
                defaultValue={selectedAttribute?.displayName || ''}
                variant="outlined"
                placeholder="e.g., User Department"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                defaultValue={selectedAttribute?.description || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={selectedAttribute?.type || 'String'}
                  label="Type"
                >
                  <MenuItem value="String">String</MenuItem>
                  <MenuItem value="Number">Number</MenuItem>
                  <MenuItem value="Boolean">Boolean</MenuItem>
                  <MenuItem value="Date">Date</MenuItem>
                  <MenuItem value="Array">Array</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedAttribute?.category || 'Subject'}
                  label="Category"
                >
                  <MenuItem value="Subject">Subject</MenuItem>
                  <MenuItem value="Object">Object</MenuItem>
                  <MenuItem value="Environment">Environment</MenuItem>
                  <MenuItem value="Action">Action</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default Value"
                defaultValue={selectedAttribute?.defaultValue || ''}
                variant="outlined"
                placeholder="Optional default value"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedAttribute?.status || 'Active'}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    defaultChecked={selectedAttribute?.required || false}
                  />
                }
                label="Required attribute"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleClose} variant="contained">
            {selectedAttribute ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}