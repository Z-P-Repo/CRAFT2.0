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
  Folder as FolderIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Description as FileIcon,
  FolderOpen,
  Settings as SystemIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface ResourceObject {
  id: string;
  name: string;
  type: 'File' | 'Folder' | 'System' | 'Database' | 'API';
  path: string;
  owner: string;
  permissions: string;
  size?: string;
  status: 'Active' | 'Archived' | 'Restricted';
  createdAt: string;
  lastAccessed: string;
}

export default function ObjectsPage() {
  const [objects] = useState<ResourceObject[]>([
    {
      id: '1',
      name: 'Customer Database',
      type: 'Database',
      path: '/databases/customer_db',
      owner: 'Admin',
      permissions: 'Read, Write, Delete',
      status: 'Active',
      createdAt: '2024-01-15',
      lastAccessed: '2024-01-21 10:30',
    },
    {
      id: '2',
      name: 'User Documents',
      type: 'Folder',
      path: '/documents/users',
      owner: 'HR Manager',
      permissions: 'Read, Write',
      status: 'Active',
      createdAt: '2024-01-16',
      lastAccessed: '2024-01-21 09:15',
    },
    {
      id: '3',
      name: 'System Config',
      type: 'System',
      path: '/system/config',
      owner: 'System',
      permissions: 'Read Only',
      status: 'Restricted',
      createdAt: '2024-01-17',
      lastAccessed: '2024-01-20 16:45',
    },
    {
      id: '4',
      name: 'Financial Reports',
      type: 'File',
      path: '/reports/financial/q1_2024.pdf',
      owner: 'Finance',
      permissions: 'Read',
      size: '2.5 MB',
      status: 'Active',
      createdAt: '2024-01-18',
      lastAccessed: '2024-01-19 14:22',
    },
    {
      id: '5',
      name: 'API Gateway',
      type: 'API',
      path: '/api/v1/gateway',
      owner: 'DevOps',
      permissions: 'Execute',
      status: 'Active',
      createdAt: '2024-01-19',
      lastAccessed: '2024-01-21 11:00',
    },
  ]);

  const [open, setOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<ResourceObject | null>(null);

  const handleClickOpen = (object?: ResourceObject) => {
    setSelectedObject(object || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedObject(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Archived': return 'warning';
      case 'Restricted': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'File': return <FileIcon />;
      case 'Folder': return <FolderOpen />;
      case 'System': return <SystemIcon />;
      case 'Database': return <SystemIcon />;
      case 'API': return <SystemIcon />;
      default: return <FileIcon />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'File': return 'primary';
      case 'Folder': return 'secondary';
      case 'System': return 'error';
      case 'Database': return 'info';
      case 'API': return 'success';
      default: return 'default';
    }
  };

  const stats = [
    { label: 'Total Objects', value: objects.length, color: 'primary' },
    { label: 'Active', value: objects.filter(o => o.status === 'Active').length, color: 'success' },
    { label: 'Restricted', value: objects.filter(o => o.status === 'Restricted').length, color: 'error' },
    { label: 'This Week', value: '8', color: 'info' },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FolderIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Objects
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage system resources, files, databases, and other objects.
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
          Add Object
        </Button>
      </Box>

      {/* Objects Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Path</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Accessed</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {objects.map((object) => (
                <TableRow key={object.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ color: `${getTypeColor(object.type)}.main` }}>
                        {getTypeIcon(object.type)}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {object.name}
                        </Typography>
                        {object.size && (
                          <Typography variant="caption" color="text.secondary">
                            {object.size}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={object.type}
                      size="small"
                      color={getTypeColor(object.type) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                      {object.path}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {object.owner}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {object.permissions}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={object.status}
                      size="small"
                      color={getStatusColor(object.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {object.lastAccessed}
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
                        onClick={() => handleClickOpen(object)}
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

      {/* Object Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedObject ? 'Edit Object' : 'Add New Object'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                defaultValue={selectedObject?.name || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={selectedObject?.type || 'File'}
                  label="Type"
                >
                  <MenuItem value="File">File</MenuItem>
                  <MenuItem value="Folder">Folder</MenuItem>
                  <MenuItem value="System">System</MenuItem>
                  <MenuItem value="Database">Database</MenuItem>
                  <MenuItem value="API">API</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Path"
                defaultValue={selectedObject?.path || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner"
                defaultValue={selectedObject?.owner || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedObject?.status || 'Active'}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Archived">Archived</MenuItem>
                  <MenuItem value="Restricted">Restricted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                variant="outlined"
                placeholder="Optional description..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleClose} variant="contained">
            {selectedObject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}