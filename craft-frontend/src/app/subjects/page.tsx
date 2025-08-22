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
} from '@mui/material';
import {
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Person,
  Group,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Subject {
  id: string;
  name: string;
  email: string;
  type: 'User' | 'Group' | 'Role';
  role: string;
  department: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  lastLogin: string;
}

export default function SubjectsPage() {
  const [subjects] = useState<Subject[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@company.com',
      type: 'User',
      role: 'Admin',
      department: 'IT',
      status: 'Active',
      createdAt: '2024-01-15',
      lastLogin: '2024-01-21 10:30',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      type: 'User',
      role: 'Manager',
      department: 'HR',
      status: 'Active',
      createdAt: '2024-01-16',
      lastLogin: '2024-01-21 09:15',
    },
    {
      id: '3',
      name: 'Developers',
      email: '',
      type: 'Group',
      role: 'Developer',
      department: 'Engineering',
      status: 'Active',
      createdAt: '2024-01-17',
      lastLogin: '',
    },
    {
      id: '4',
      name: 'Bob Johnson',
      email: 'bob.johnson@company.com',
      type: 'User',
      role: 'User',
      department: 'Sales',
      status: 'Inactive',
      createdAt: '2024-01-18',
      lastLogin: '2024-01-19 14:22',
    },
  ]);

  const [open, setOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const handleClickOpen = (subject?: Subject) => {
    setSelectedSubject(subject || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSubject(null);
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'success' : 'error';
  };

  const getTypeIcon = (type: string) => {
    return type === 'Group' ? <Group /> : <Person />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'User': return 'primary';
      case 'Group': return 'secondary';
      case 'Role': return 'info';
      default: return 'default';
    }
  };

  const stats = [
    { label: 'Total Subjects', value: subjects.length, color: 'primary' },
    { label: 'Active Users', value: subjects.filter(s => s.status === 'Active' && s.type === 'User').length, color: 'success' },
    { label: 'Groups', value: subjects.filter(s => s.type === 'Group').length, color: 'secondary' },
    { label: 'Online Now', value: '12', color: 'info' },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PeopleIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Subjects
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage users, groups, and roles in your system.
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
          Add Subject
        </Button>
      </Box>

      {/* Subjects Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: `${getTypeColor(subject.type)}.main` }}>
                        {getTypeIcon(subject.type)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {subject.name}
                        </Typography>
                        {subject.email && (
                          <Typography variant="body2" color="text.secondary">
                            {subject.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={subject.type}
                      size="small"
                      color={getTypeColor(subject.type) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {subject.role}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {subject.department}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={subject.status}
                      size="small"
                      color={getStatusColor(subject.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {subject.lastLogin || 'Never'}
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
                        onClick={() => handleClickOpen(subject)}
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

      {/* Subject Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSubject ? 'Edit Subject' : 'Add New Subject'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                defaultValue={selectedSubject?.name || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                defaultValue={selectedSubject?.email || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={selectedSubject?.type || 'User'}
                  label="Type"
                >
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Group">Group</MenuItem>
                  <MenuItem value="Role">Role</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedSubject?.role || 'User'}
                  label="Role"
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Developer">Developer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department"
                defaultValue={selectedSubject?.department || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedSubject?.status || 'Active'}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleClose} variant="contained">
            {selectedSubject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}