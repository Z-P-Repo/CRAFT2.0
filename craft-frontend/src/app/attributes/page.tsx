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
  Avatar,
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
  Code as CodeIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Attribute {
  id: string;
  name: string;
  displayName: string;
  type: 'String' | 'Number' | 'Boolean' | 'Date' | 'Array';
  category: 'Subject' | 'Resource' | 'Environment' | 'Action';
  defaultValue?: string;
  required: boolean;
  description: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  lastModified: string;
}

export default function AttributesPage() {
  const [attributes] = useState<Attribute[]>([
    {
      id: '1',
      name: 'department',
      displayName: 'Department',
      type: 'String',
      category: 'Subject',
      defaultValue: 'IT',
      required: true,
      description: 'User department within organization',
      status: 'Active',
      createdAt: '2024-01-15',
      lastModified: '2024-01-21',
    },
    {
      id: '2',
      name: 'clearanceLevel',
      displayName: 'Clearance Level',
      type: 'Number',
      category: 'Subject',
      defaultValue: '1',
      required: true,
      description: 'Security clearance level (1-5)',
      status: 'Active',
      createdAt: '2024-01-16',
      lastModified: '2024-01-20',
    },
    {
      id: '3',
      name: 'classification',
      displayName: 'Classification',
      type: 'String',
      category: 'Resource',
      defaultValue: 'public',
      required: false,
      description: 'Data classification level',
      status: 'Active',
      createdAt: '2024-01-17',
      lastModified: '2024-01-19',
    },
    {
      id: '4',
      name: 'currentTime',
      displayName: 'Current Time',
      type: 'Date',
      category: 'Environment',
      required: false,
      description: 'Timestamp of access request',
      status: 'Active',
      createdAt: '2024-01-18',
      lastModified: '2024-01-18',
    },
    {
      id: '5',
      name: 'riskLevel',
      displayName: 'Risk Level',
      type: 'String',
      category: 'Action',
      defaultValue: 'low',
      required: false,
      description: 'Risk level of the action',
      status: 'Active',
      createdAt: '2024-01-19',
      lastModified: '2024-01-21',
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
      case 'Resource': return <ObjectIcon />;
      case 'Environment': return <BusinessIcon />;
      case 'Action': return <CodeIcon />;
      default: return <LabelIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Subject': return 'primary';
      case 'Resource': return 'secondary';
      case 'Environment': return 'info';
      case 'Action': return 'warning';
      default: return 'default';
    }
  };

  const stats = [
    { label: 'Total Attributes', value: attributes.length, color: 'primary' },
    { label: 'Active', value: attributes.filter(a => a.status === 'Active').length, color: 'success' },
    { label: 'Required', value: attributes.filter(a => a.required).length, color: 'error' },
    { label: 'This Month', value: '3', color: 'info' },
  ];

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
          Add Attribute
        </Button>
      </Box>

      {/* Attributes Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Attribute</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Required</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Modified</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attributes.map((attribute) => (
                <TableRow key={attribute.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: `${getCategoryColor(attribute.category)}.main` }}>
                        {getCategoryIcon(attribute.category)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {attribute.displayName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                          {attribute.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {attribute.description}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={attribute.category}
                      size="small"
                      color={getCategoryColor(attribute.category) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={attribute.type}
                      size="small"
                      color={getTypeColor(attribute.type) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={attribute.required ? 'Required' : 'Optional'}
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
                    <Typography variant="body2" color="text.secondary">
                      {attribute.lastModified}
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
          {selectedAttribute ? 'Edit Attribute' : 'Add New Attribute'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                defaultValue={selectedAttribute?.name || ''}
                variant="outlined"
                placeholder="e.g., department"
                helperText="Technical attribute name"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Display Name"
                defaultValue={selectedAttribute?.displayName || ''}
                variant="outlined"
                placeholder="e.g., Department"
                helperText="Human-readable name"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedAttribute?.category || 'Subject'}
                  label="Category"
                >
                  <MenuItem value="Subject">Subject</MenuItem>
                  <MenuItem value="Resource">Resource</MenuItem>
                  <MenuItem value="Environment">Environment</MenuItem>
                  <MenuItem value="Action">Action</MenuItem>
                </Select>
              </FormControl>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                defaultValue={selectedAttribute?.description || ''}
                variant="outlined"
                placeholder="Describe the purpose of this attribute..."
              />
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