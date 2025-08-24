'use client';

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  Button,
  Paper,
  Chip,
  IconButton,
  Breadcrumbs,
  Link,
  Container,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  PlayArrow as ActionIcon,
  Storage as ResourceIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';

interface Policy {
  _id: string;
  id: string;
  name: string;
  description?: string;
  effect: 'Allow' | 'Deny';
  status: 'Active' | 'Inactive' | 'Draft';
  priority: number;
  rules: PolicyRule[];
  subjects: string[];
  resources: string[];
  actions: string[];
  conditions: PolicyCondition[];
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    version: string;
    isSystem: boolean;
    isCustom: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface PolicyRule {
  id: string;
  subject: {
    type: string;
    attributes: PolicyAttribute[];
  };
  action: {
    name: string;
    displayName: string;
  };
  object: {
    type: string;
    attributes: PolicyAttribute[];
  };
  conditions: PolicyCondition[];
}

interface PolicyAttribute {
  name: string;
  operator: 'equals' | 'contains' | 'in' | 'not_equals' | 'not_contains' | 'not_in';
  value: string | string[];
}

interface PolicyCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | string[];
}

export default function PolicyViewPage() {
  const router = useRouter();
  const params = useParams();
  const policyId = params.id as string;

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!policyId) return;

    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/policies/${policyId}`);
        
        if (response.success && response.data) {
          setPolicy(response.data);
        } else {
          setError('Policy not found');
        }
      } catch (error: any) {
        console.error('Failed to fetch policy:', error);
        setError('Failed to load policy. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [policyId]);

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

  const renderHumanReadablePolicy = () => {
    if (!policy || !policy.rules.length) return null;

    return (
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ 
          bgcolor: 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)', 
          p: 3, 
          borderBottom: '1px solid', 
          borderColor: 'divider' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SecurityIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="600" color="text.primary">
                Policy Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Human-readable interpretation of access control rules
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: 'primary.main' }}>
            "{policy.name}"
          </Typography>
          
          {policy.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
              {policy.description}
            </Typography>
          )}
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Chip 
                label={policy.effect}
                color={getEffectColor(policy.effect) as any}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Typography variant="body1" fontWeight="500">
                This policy <strong>{policy.effect.toLowerCase()}s</strong> the following access:
              </Typography>
            </Box>
            
            <Box sx={{ pl: 2 }}>
              {policy.rules.map((rule, index) => (
                <Box key={rule.id} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1 }}>
                    <Box sx={{ 
                      minWidth: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {index + 1}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ mb: 1.5 }}>
                        <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {rule.subject.type}
                        </Box>
                        {rule.subject.attributes.length > 0 && (
                          <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                            {' '}(with conditions: {rule.subject.attributes.map((attr, i) => (
                              <Box key={i} component="span">
                                {i > 0 && ', '}
                                <em>{attr.name}</em> {attr.operator === 'equals' ? '=' : attr.operator} {' '}
                                <strong>{Array.isArray(attr.value) ? attr.value.join(' or ') : attr.value}</strong>
                              </Box>
                            ))})
                          </Box>
                        )}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">
                          Can perform:
                        </Typography>
                        <Chip 
                          label={rule.action.displayName} 
                          size="small" 
                          color="warning"
                          variant="outlined"
                        />
                        <Typography variant="body2" color="text.secondary">
                          on:
                        </Typography>
                        <Chip 
                          label={rule.object.type} 
                          size="small" 
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>
                      
                      {rule.conditions.length > 0 && (
                        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                          <Typography variant="caption" color="info.main" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                            Additional Conditions:
                          </Typography>
                          {rule.conditions.map((cond, i) => (
                            <Typography key={i} variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                              • <em>{cond.field}</em> {cond.operator} {Array.isArray(cond.value) ? cond.value.join(' or ') : cond.value}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Card>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, p: 3 }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error || !policy) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Policy not found'}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/policies')}
          >
            Back to Policies
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ mb: 1 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <Link 
              color="inherit" 
              onClick={() => router.push('/policies')}
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              Policies
            </Link>
            <Typography color="text.primary">{policy.name}</Typography>
          </Breadcrumbs>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                onClick={() => router.push('/policies')}
                sx={{ 
                  bgcolor: 'grey.100',
                  '&:hover': { bgcolor: 'grey.200' }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <SecurityIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="h5" component="h1" fontWeight="600">
                    {policy.name}
                  </Typography>
                  <Chip 
                    label={policy.effect} 
                    color={getEffectColor(policy.effect) as any}
                    variant="filled"
                  />
                  <Chip 
                    label={policy.status} 
                    color={getStatusColor(policy.status) as any}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {policy.description || 'No description provided'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => router.push(`/policies/${policy.id}/edit`)}
              >
                Edit Policy
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

        {/* Human-Readable Policy Statement */}
        {renderHumanReadablePolicy()}

        {/* Policy Details Grid */}
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="primary" />
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Priority
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {policy.priority}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Rules Count
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {policy.rules.length}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Version
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {policy.metadata.version}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    System Policy
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {policy.metadata.isSystem ? (
                      <Chip label="Yes" size="small" color="warning" />
                    ) : (
                      <Chip label="No" size="small" color="default" />
                    )}
                  </Typography>
                </Box>
                
                {policy.metadata.tags.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {policy.metadata.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Timestamps */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon color="primary" />
                  Timeline
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {new Date(policy.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    by {policy.metadata.createdBy}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last Modified
                  </Typography>
                  <Typography variant="body2">
                    {new Date(policy.updatedAt).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    by {policy.metadata.lastModifiedBy}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Coverage */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon color="primary" />
                  Coverage
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Subjects ({policy.subjects.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {policy.subjects.map((subject, index) => (
                      <Chip key={index} label={subject} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Actions ({policy.actions.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {policy.actions.map((action, index) => (
                      <Chip key={index} label={action} size="small" color="warning" variant="outlined" />
                    ))}
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Resources ({policy.resources.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {policy.resources.map((resource, index) => (
                      <Chip key={index} label={resource} size="small" color="secondary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Detailed Rules */}
        {policy.rules.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Detailed Rules
            </Typography>
            
            {policy.rules.map((rule, index) => (
              <Accordion key={rule.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight="500">
                    Rule {index + 1}: {rule.action.displayName} on {rule.object.type}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Subject
                      </Typography>
                      <Typography variant="body2" fontWeight="500">
                        {rule.subject.type}
                      </Typography>
                      {rule.subject.attributes.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Attributes:
                          </Typography>
                          {rule.subject.attributes.map((attr, i) => (
                            <Typography key={i} variant="caption" display="block">
                              {attr.name} {attr.operator} {Array.isArray(attr.value) ? attr.value.join(', ') : attr.value}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Action
                      </Typography>
                      <Typography variant="body2" fontWeight="500">
                        {rule.action.displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({rule.action.name})
                      </Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Resource
                      </Typography>
                      <Typography variant="body2" fontWeight="500">
                        {rule.object.type}
                      </Typography>
                      {rule.object.attributes.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Attributes:
                          </Typography>
                          {rule.object.attributes.map((attr, i) => (
                            <Typography key={i} variant="caption" display="block">
                              {attr.name} {attr.operator} {Array.isArray(attr.value) ? attr.value.join(', ') : attr.value}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Grid>
                    
                    {rule.conditions.length > 0 && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          Conditions
                        </Typography>
                        {rule.conditions.map((condition, i) => (
                          <Typography key={i} variant="body2">
                            {condition.field} {condition.operator} {Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
                          </Typography>
                        ))}
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
    </DashboardLayout>
  );
}