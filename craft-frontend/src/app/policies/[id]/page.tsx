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

// Additional interfaces for lookup data
interface Subject {
  id: string;
  displayName: string;
  name: string;
}

interface ActionObject {
  id: string;
  displayName: string;
  name: string;
}

interface ResourceObject {
  id: string;
  displayName: string;
  name: string;
}

interface Attribute {
  id: string;
  displayName: string;
  name: string;
  dataType: string;
}

export default function PolicyViewPage() {
  const router = useRouter();
  const params = useParams();
  const policyId = params.id as string;

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Lookup data for human-readable formatting
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [actions, setActions] = useState<ActionObject[]>([]);
  const [resources, setResources] = useState<ResourceObject[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  // Load lookup data for human-readable formatting
  const loadLookupData = async () => {
    try {
      const [subjectsRes, actionsRes, resourcesRes, attributesRes] = await Promise.all([
        apiClient.get('/subjects?page=1&limit=1000'),
        apiClient.get('/actions?page=1&limit=1000'), 
        apiClient.get('/resources?page=1&limit=1000'),
        apiClient.get('/attributes?page=1&limit=1000')
      ]);
      
      if (subjectsRes.success && subjectsRes.data) {
        setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : subjectsRes.data.data || []);
      }
      if (actionsRes.success && actionsRes.data) {
        setActions(Array.isArray(actionsRes.data) ? actionsRes.data : actionsRes.data.data || []);
      }
      if (resourcesRes.success && resourcesRes.data) {
        setResources(Array.isArray(resourcesRes.data) ? resourcesRes.data : resourcesRes.data.data || []);
      }
      if (attributesRes.success && attributesRes.data) {
        setAttributes(Array.isArray(attributesRes.data) ? attributesRes.data : attributesRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load lookup data:', error);
    }
  };

  useEffect(() => {
    if (!policyId) return;

    const fetchPolicy = async () => {
      try {
        setLoading(true);
        
        // Load both policy and lookup data
        await Promise.all([
          (async () => {
            const response = await apiClient.get(`/policies/${policyId}`);
            if (response.success && response.data) {
              setPolicy(response.data);
            } else {
              setError('Policy not found');
            }
          })(),
          loadLookupData()
        ]);
        
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

  // Lookup functions for human-readable names
  const getSubjectDisplayName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.displayName : `Subject (${subjectId})`;
  };

  const getActionDisplayName = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    return action ? action.displayName : `Action (${actionId})`;
  };

  const getResourceDisplayName = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.displayName : `Resource (${resourceId})`;
  };

  const getAttributeDisplayName = (attrName: string) => {
    const attribute = attributes.find(a => a.name === attrName || a.id === attrName);
    return attribute ? attribute.displayName : attrName;
  };

  const renderHumanReadablePolicy = () => {
    if (!policy || !policy.rules.length) return null;

    // Debug logging (can be removed later)
    console.log('Rendering policy with data:', {
      policy: policy.name,
      subjectsCount: subjects.length,
      actionsCount: actions.length,
      resourcesCount: resources.length,
      attributesCount: attributes.length,
      rules: policy.rules.length
    });

    return (
      <Card sx={{ 
        mb: 3, 
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'grey.200'
      }}>
        <Box sx={{ 
          p: 4,
          bgcolor: 'grey.50', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
                {policy.rules.length === 1 ? (
                  // Single rule formatting - more natural language
                  <Typography component="div" variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                    This policy <strong style={{ color: policy.effect === 'Allow' ? '#2e7d32' : '#d32f2f' }}>
                      {policy.effect.toUpperCase()}S
                    </strong>{' '}
                    <strong style={{ color: '#1976d2' }}>
                      {getSubjectDisplayName(policy.rules[0]?.subject?.type || '')}
                    </strong>
                    {(policy.rules[0]?.subject?.attributes?.length || 0) > 0 && (
                      <span>
                        {' '}(when{' '}
                        {policy.rules[0]?.subject?.attributes?.map((attr, index, array) => {
                          const formattedValue = Array.isArray(attr.value) ? attr.value.join(' or ') : attr.value;
                          const condition = `${getAttributeDisplayName(attr.name)} ${attr.operator} ${formattedValue}`;
                          if (index === array.length - 1 && array.length > 1) {
                            return `and ${condition}`;
                          }
                          return condition;
                        }).join(', ')}
                        )
                      </span>
                    )}
                    {' '}to perform{' '}
                    <strong style={{ color: '#f57c00' }}>
                      {getActionDisplayName(policy.rules[0]?.action?.name || '')}
                    </strong>
                    {' '}on{' '}
                    <strong style={{ color: '#7b1fa2' }}>
                      {getResourceDisplayName(policy.rules[0]?.object?.type || '')}
                    </strong>
                    {(policy.rules[0]?.object?.attributes?.length || 0) > 0 && (
                      <span>
                        {' '}(where{' '}
                        {policy.rules[0]?.object?.attributes?.map((attr, index, array) => {
                          const formattedValue = Array.isArray(attr.value) ? attr.value.join(' or ') : attr.value;
                          const condition = `${getAttributeDisplayName(attr.name)} ${attr.operator} ${formattedValue}`;
                          if (index === array.length - 1 && array.length > 1) {
                            return `and ${condition}`;
                          }
                          return condition;
                        }).join(', ')}
                        )
                      </span>
                    )}
                    {(policy.rules[0]?.conditions?.length || 0) > 0 && (
                      <span>
                        , provided that {policy.rules[0]?.conditions?.map((cond, index, array) => {
                          const formattedValue = Array.isArray(cond.value) ? cond.value.join(' or ') : cond.value;
                          const condition = `${cond.field} ${cond.operator} ${formattedValue}`;
                          if (index === array.length - 1 && array.length > 1) {
                            return `and ${condition}`;
                          }
                          return condition;
                        }).join(', ')}
                      </span>
                    )}
                    .
                  </Typography>
                ) : (
                  // Multiple rules formatting - bullet list
                  <Box>
                    <Typography component="div" variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem', mb: 2 }}>
                      This policy <strong style={{ color: policy.effect === 'Allow' ? '#2e7d32' : '#d32f2f' }}>
                        {policy.effect.toUpperCase()}S
                      </strong> the following access:
                    </Typography>
                    {policy.rules.map((rule, index) => (
                      <Box key={rule.id} sx={{ mb: 2, ml: 2 }}>
                        <Typography component="div" variant="body1" sx={{ lineHeight: 1.6 }}>
                          <strong>{index + 1}.</strong>{' '}
                          <strong style={{ color: '#1976d2' }}>
                            {getSubjectDisplayName(rule.subject.type)}
                          </strong>
                          {rule.subject.attributes.length > 0 && (
                            <span>
                              {' '}(when{' '}
                              {rule.subject.attributes.map((attr, i, array) => {
                                const formattedValue = Array.isArray(attr.value) ? attr.value.join(' or ') : attr.value;
                                const condition = `${getAttributeDisplayName(attr.name)} ${attr.operator} ${formattedValue}`;
                                if (i === array.length - 1 && array.length > 1) {
                                  return `and ${condition}`;
                                }
                                return condition;
                              }).join(', ')}
                              )
                            </span>
                          )}
                          {' '}can perform{' '}
                          <strong style={{ color: '#f57c00' }}>
                            {getActionDisplayName(rule.action.name)}
                          </strong>
                          {' '}on{' '}
                          <strong style={{ color: '#7b1fa2' }}>
                            {getResourceDisplayName(rule.object.type)}
                          </strong>
                          {rule.object.attributes.length > 0 && (
                            <span>
                              {' '}(where{' '}
                              {rule.object.attributes.map((attr, i, array) => {
                                const formattedValue = Array.isArray(attr.value) ? attr.value.join(' or ') : attr.value;
                                const condition = `${getAttributeDisplayName(attr.name)} ${attr.operator} ${formattedValue}`;
                                if (i === array.length - 1 && array.length > 1) {
                                  return `and ${condition}`;
                                }
                                return condition;
                              }).join(', ')}
                              )
                            </span>
                          )}
                          {rule.conditions.length > 0 && (
                            <span>
                              , provided that {rule.conditions.map((cond, i, array) => {
                                const formattedValue = Array.isArray(cond.value) ? cond.value.join(' or ') : cond.value;
                                const condition = `${cond.field} ${cond.operator} ${formattedValue}`;
                                if (i === array.length - 1 && array.length > 1) {
                                  return `and ${condition}`;
                                }
                                return condition;
                              }).join(', ')}
                            </span>
                          )}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
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


        {/* Detailed Rules */}
        {policy.rules.length > 0 && (
          <Card sx={{ mt: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SecurityIcon color="primary" />
                Policy Rules
              </Typography>
              
              <Grid container spacing={2}>
                {policy.rules.map((rule, index) => (
                  <Grid key={rule.id} size={{ xs: 12 }}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ mb: 1.5, color: 'primary.main' }}>
                        Rule {index + 1}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box sx={{ 
                            p: 1.5, 
                            bgcolor: 'white', 
                            borderRadius: 1, 
                            border: '1px solid', 
                            borderColor: 'grey.200',
                            height: '100%'
                          }}>
                            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.7rem' }}>
                              Subject
                            </Typography>
                            <Typography variant="body2" fontWeight="500" sx={{ mt: 0.5 }}>
                              {getSubjectDisplayName(rule.subject.type)}
                            </Typography>
                            {rule.subject.attributes.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                                  Attributes:
                                </Typography>
                                {rule.subject.attributes.map((attr, i) => (
                                  <Box key={i} sx={{ mt: 0.3 }}>
                                    <Chip 
                                      label={`${getAttributeDisplayName(attr.name)}: ${Array.isArray(attr.value) ? attr.value.join(', ') : attr.value}`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.65rem', height: '20px' }}
                                    />
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box sx={{ 
                            p: 1.5, 
                            bgcolor: 'white', 
                            borderRadius: 1, 
                            border: '1px solid', 
                            borderColor: 'grey.200',
                            height: '100%'
                          }}>
                            <Typography variant="overline" sx={{ color: 'warning.main', fontWeight: 600, fontSize: '0.7rem' }}>
                              Action
                            </Typography>
                            <Typography variant="body2" fontWeight="500" sx={{ mt: 0.5 }}>
                              {getActionDisplayName(rule.action.name)}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box sx={{ 
                            p: 1.5, 
                            bgcolor: 'white', 
                            borderRadius: 1, 
                            border: '1px solid', 
                            borderColor: 'grey.200',
                            height: '100%'
                          }}>
                            <Typography variant="overline" sx={{ color: 'secondary.main', fontWeight: 600, fontSize: '0.7rem' }}>
                              Resource
                            </Typography>
                            <Typography variant="body2" fontWeight="500" sx={{ mt: 0.5 }}>
                              {getResourceDisplayName(rule.object.type)}
                            </Typography>
                            {rule.object.attributes.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                                  Attributes:
                                </Typography>
                                {rule.object.attributes.map((attr, i) => (
                                  <Box key={i} sx={{ mt: 0.3 }}>
                                    <Chip 
                                      label={`${getAttributeDisplayName(attr.name)}: ${Array.isArray(attr.value) ? attr.value.join(', ') : attr.value}`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.65rem', height: '20px' }}
                                    />
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box sx={{ 
                            p: 1.5, 
                            bgcolor: 'white', 
                            borderRadius: 1, 
                            border: '1px solid', 
                            borderColor: 'grey.200',
                            height: '100%'
                          }}>
                            <Typography variant="overline" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.7rem' }}>
                              Effect
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Chip 
                                label={policy.effect}
                                size="small"
                                color={policy.effect === 'Allow' ? 'success' : 'error'}
                                sx={{ fontWeight: 600, fontSize: '0.7rem', height: '22px' }}
                              />
                            </Box>
                            {rule.conditions.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                                  Conditions:
                                </Typography>
                                {rule.conditions.map((condition, i) => (
                                  <Typography key={i} variant="caption" display="block" sx={{ mt: 0.3, fontSize: '0.65rem' }}>
                                    {condition.field} {condition.operator} {Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Card>
        )}

        {/* Activity Details */}
        <Card sx={{ mt: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <ScheduleIcon color="primary" />
              Activity Details
            </Typography>
            
            <Grid container spacing={3}>
              {/* Timeline */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    height: '100%'
                  }}
                >
                  <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.75rem' }}>
                    Timeline
                  </Typography>
                  
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Created
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {new Date(policy.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      at {new Date(policy.createdAt).toLocaleTimeString()}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      by {policy.metadata.createdBy}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Last Modified
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {new Date(policy.updatedAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      at {new Date(policy.updatedAt).toLocaleTimeString()}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      by {policy.metadata.lastModifiedBy}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Metadata */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    height: '100%'
                  }}
                >
                  <Typography variant="overline" sx={{ color: 'secondary.main', fontWeight: 600, fontSize: '0.75rem' }}>
                    Metadata
                  </Typography>
                  
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Version
                      </Typography>
                      <Typography variant="body2" fontWeight="500">
                        {policy.metadata.version}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                        System Policy
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          label={policy.metadata.isSystem ? "Yes" : "No"}
                          size="small"
                          color={policy.metadata.isSystem ? "warning" : "default"}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Custom Policy
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          label={policy.metadata.isCustom ? "Yes" : "No"}
                          size="small"
                          color={policy.metadata.isCustom ? "info" : "default"}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Coverage & Tags */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    height: '100%'
                  }}
                >
                  <Typography variant="overline" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.75rem' }}>
                    Coverage & Tags
                  </Typography>
                  
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Rules Count
                      </Typography>
                      <Typography variant="body2" fontWeight="500">
                        {policy.rules.length} rule{policy.rules.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Subjects ({policy.subjects.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {policy.subjects.slice(0, 2).map((subject, index) => (
                          <Chip key={index} label={getSubjectDisplayName(subject)} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        ))}
                        {policy.subjects.length > 2 && (
                          <Chip label={`+${policy.subjects.length - 2} more`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        )}
                      </Box>
                    </Box>
                    
                    {policy.metadata.tags.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Tags ({policy.metadata.tags.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {policy.metadata.tags.slice(0, 3).map((tag, index) => (
                            <Chip key={index} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          ))}
                          {policy.metadata.tags.length > 3 && (
                            <Chip label={`+${policy.metadata.tags.length - 3} more`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Card>
    </DashboardLayout>
  );
}