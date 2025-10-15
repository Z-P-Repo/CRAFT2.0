'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as ConditionsIcon,
  Link as DependencyIcon,
  Schedule as TimeIcon,
  AccountTree as HierarchyIcon,
  InfoOutlined as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  CheckCircle,
  Cancel as InactiveIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useApiSnackbar } from '@/contexts/SnackbarContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { apiClient } from '@/lib/api';

interface AdditionalResource {
  id: string;
  name: string;
  displayName: string;
  type: 'condition' | 'state' | 'approval' | 'status' | 'ticket';
  description?: string;
  attributes: {
    [key: string]: any;
  };
  dependencies?: string[];
  active: boolean;
  metadata: {
    owner: string;
    createdBy: string;
    tags: string[];
    isSystem: boolean;
  };
}

interface AdditionalResourceCardProps {
  title?: string;
  subtitle?: string;
}

const RESOURCE_TYPES = [
  { value: 'condition', label: 'Condition', icon: <ConditionsIcon />, description: 'General conditions that can be evaluated' },
  { value: 'state', label: 'State', icon: <ActiveIcon />, description: 'State-based conditions (Active, Inactive, etc.)' },
  { value: 'approval', label: 'Approval', icon: <CheckCircle />, description: 'Approval-based conditions' },
  { value: 'status', label: 'Status', icon: <InfoIcon />, description: 'Status-based conditions' },
  { value: 'ticket', label: 'Ticket', icon: <CodeIcon />, description: 'Ticket-based conditions (L1, L2, L3, etc.)' }
];

const PREDEFINED_CONDITIONS = {
  ticket: [
    { name: 'L1 Ticket', attributes: { level: 'L1', priority: 'low' } },
    { name: 'L2 Ticket', attributes: { level: 'L2', priority: 'medium' } },
    { name: 'L3 Ticket', attributes: { level: 'L3', priority: 'high' } },
    { name: 'Emergency Ticket', attributes: { level: 'Emergency', priority: 'critical' } }
  ],
  state: [
    { name: 'Active Status', attributes: { status: 'active', enabled: true } },
    { name: 'Inactive Status', attributes: { status: 'inactive', enabled: false } },
    { name: 'Pending Status', attributes: { status: 'pending', enabled: null } },
    { name: 'Completed Status', attributes: { status: 'completed', enabled: true } }
  ],
  approval: [
    { name: 'Approved By Director', attributes: { approver: 'director', level: 'high' } },
    { name: 'Approved By Manager', attributes: { approver: 'manager', level: 'medium' } },
    { name: 'Approved By Supervisor', attributes: { approver: 'supervisor', level: 'low' } },
    { name: 'Auto Approved', attributes: { approver: 'system', level: 'auto' } }
  ],
  status: [
    { name: 'In Progress', attributes: { workflow_status: 'in_progress' } },
    { name: 'Under Review', attributes: { workflow_status: 'under_review' } },
    { name: 'Awaiting Approval', attributes: { workflow_status: 'awaiting_approval' } },
    { name: 'Rejected', attributes: { workflow_status: 'rejected' } }
  ]
};

export default function AdditionalResourceCard({
  title = "Additional Resources",
  subtitle = "Create and manage additional resources for complex policies"
}: AdditionalResourceCardProps) {
  const snackbar = useApiSnackbar();
  const { currentWorkspace, currentApplication, currentEnvironment } = useWorkspace();

  const [additionalResources, setAdditionalResources] = useState<AdditionalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [predefinedSelection, setPredefinedSelection] = useState<any>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    loadAdditionalResources();
  }, [currentEnvironment]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAdditionalResources = async () => {
    if (!currentEnvironment) return;

    setLoading(true);
    try {
      // For now, we'll use mock data since the additional resources are a new concept
      // In a real implementation, this would call the API
      const mockData: AdditionalResource[] = [
        {
          id: 'cond-1',
          name: 'l3_ticket',
          displayName: 'L3 Ticket',
          type: 'ticket',
          description: 'High priority support ticket requiring escalation',
          attributes: { level: 'L3', priority: 'high', escalation_required: true },
          active: true,
          metadata: {
            owner: 'System',
            createdBy: 'System',
            tags: ['ticket', 'support', 'escalation'],
            isSystem: false
          }
        },
        {
          id: 'cond-2',
          name: 'active_status',
          displayName: 'Active Status',
          type: 'state',
          description: 'Resource or entity is in active state',
          attributes: { status: 'active', enabled: true },
          active: true,
          metadata: {
            owner: 'System',
            createdBy: 'System',
            tags: ['status', 'state'],
            isSystem: false
          }
        },
        {
          id: 'cond-3',
          name: 'approved_by_director',
          displayName: 'Approved By Director',
          type: 'approval',
          description: 'Approval granted by director level authority',
          attributes: { approver: 'director', level: 'high', authority: 'executive' },
          active: true,
          metadata: {
            owner: 'System',
            createdBy: 'System',
            tags: ['approval', 'director', 'executive'],
            isSystem: false
          }
        }
      ];

      setAdditionalResources(mockData);
    } catch (error) {
      console.error('Error loading additional resources:', error);
      snackbar.showError('Failed to load additional resources');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
    setSelectedType('');
    setCustomName('');
    setCustomDescription('');
    setPredefinedSelection(null);
    setIsCustom(false);
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setPredefinedSelection(null);
    setCustomName('');
    setCustomDescription('');
  };

  const handleCreateAdditionalResource = async () => {
    if (!selectedType) {
      snackbar.showError('Please select a resource type');
      return;
    }

    let resourceData;

    if (isCustom) {
      if (!customName.trim()) {
        snackbar.showError('Please enter a resource name');
        return;
      }

      resourceData = {
        name: customName.toLowerCase().replace(/\s+/g, '_'),
        displayName: customName.trim(),
        type: selectedType,
        description: customDescription.trim() || '',
        attributes: {},
        active: true,
        metadata: {
          owner: 'User',
          createdBy: 'User',
          tags: [selectedType, 'custom'],
          isSystem: false
        }
      };
    } else {
      if (!predefinedSelection) {
        snackbar.showError('Please select a predefined condition');
        return;
      }

      resourceData = {
        name: predefinedSelection.name.toLowerCase().replace(/\s+/g, '_'),
        displayName: predefinedSelection.name,
        type: selectedType,
        description: `Predefined ${selectedType} condition: ${predefinedSelection.name}`,
        attributes: predefinedSelection.attributes,
        active: true,
        metadata: {
          owner: 'System',
          createdBy: 'User',
          tags: [selectedType, 'predefined'],
          isSystem: false
        }
      };
    }

    try {
      // For now, we'll add to local state since this is a new feature
      // In real implementation, this would call the API
      const newResource: AdditionalResource = {
        id: `cond-${Date.now()}`,
        ...resourceData
      };

      setAdditionalResources(prev => [...prev, newResource]);
      snackbar.showSuccess('Additional resource created successfully');
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating additional resource:', error);
      snackbar.showError('Failed to create additional resource');
    }
  };

  const getPredefinedOptions = () => {
    if (!selectedType || !(selectedType in PREDEFINED_CONDITIONS)) return [];
    return PREDEFINED_CONDITIONS[selectedType as keyof typeof PREDEFINED_CONDITIONS];
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = RESOURCE_TYPES.find(t => t.value === type);
    return typeConfig?.icon || <ConditionsIcon />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      condition: 'default',
      state: 'success',
      approval: 'primary',
      status: 'info',
      ticket: 'warning'
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  return (
    <Card sx={{ mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <ConditionsIcon color="primary" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="600">
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
            <Chip
              label={`${additionalResources.length} Resources`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </AccordionSummary>

        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Additional Resources</strong> represent states, conditions, or approval workflows that can be used in complex policies.
                For example: "L3 Ticket", "Active Status", "Approved By Director".
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="600">
                Available Additional Resources
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateClick}
                size="small"
              >
                Create Additional Resource
              </Button>
            </Box>

            {loading ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Loading additional resources...
              </Typography>
            ) : additionalResources.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ConditionsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No additional resources created yet
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleCreateClick}
                >
                  Create Your First Additional Resource
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {additionalResources.map((resource) => (
                  <Grid key={resource.id} size={{ xs: 12, md: 6, lg: 4 }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {getTypeIcon(resource.type)}
                          <Typography variant="subtitle2" fontWeight="600">
                            {resource.displayName}
                          </Typography>
                          <Chip
                            label={resource.type}
                            size="small"
                            color={getTypeColor(resource.type) as any}
                            variant="outlined"
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {resource.description}
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="600">
                            Attributes:
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {Object.entries(resource.attributes).map(([key, value]) => (
                              <Chip
                                key={key}
                                label={`${key}: ${value}`}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5, fontSize: '0.75rem' }}
                              />
                            ))}
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            icon={resource.active ? <ActiveIcon /> : <InactiveIcon />}
                            label={resource.active ? 'Active' : 'Inactive'}
                            size="small"
                            color={resource.active ? 'success' : 'default'}
                            variant="filled"
                          />
                          <Box>
                            <Tooltip title="Edit">
                              <IconButton size="small">
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error">
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Create Additional Resource Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create Additional Resource</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create additional resources that represent states, conditions, or workflows for use in complex policies.
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Resource Type</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                label="Resource Type"
              >
                {RESOURCE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type.icon}
                      <Box>
                        <Typography variant="body2">{type.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedType && (
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isCustom}
                      onChange={(e) => setIsCustom(e.target.checked)}
                    />
                  }
                  label="Create Custom Resource"
                />
              </Box>
            )}

            {selectedType && !isCustom && (
              <Autocomplete
                options={getPredefinedOptions()}
                getOptionLabel={(option) => option.name}
                value={predefinedSelection}
                onChange={(_, newValue) => setPredefinedSelection(newValue)}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Object.entries(option.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Predefined Condition"
                    fullWidth
                  />
                )}
                sx={{ mb: 3 }}
              />
            )}

            {selectedType && isCustom && (
              <>
                <TextField
                  fullWidth
                  label="Resource Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Emergency Approval, VIP Status"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Describe what this additional resource represents"
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleCreateAdditionalResource}
            variant="contained"
            disabled={!selectedType || (!isCustom && !predefinedSelection) || (isCustom && !customName.trim())}
          >
            Create Resource
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}