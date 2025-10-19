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
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface AdditionalResourceWithAttributes {
  id: string;
  attributes: PolicyAttribute[];
}

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
  additionalResources: AdditionalResourceWithAttributes[];
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

interface AdditionalResource {
  id: string;
  displayName: string;
  name: string;
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
  const [additionalResources, setAdditionalResources] = useState<AdditionalResource[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  // Load lookup data for human-readable formatting
  const loadLookupData = async () => {
    try {
      const [subjectsRes, actionsRes, resourcesRes, additionalResourcesRes, attributesRes] = await Promise.all([
        apiClient.get('/subjects?page=1&limit=1000'),
        apiClient.get('/actions?page=1&limit=1000'),
        apiClient.get('/resources?page=1&limit=1000'),
        apiClient.get('/additional-resources?page=1&limit=1000'),
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
      if (additionalResourcesRes.success && additionalResourcesRes.data) {
        setAdditionalResources(Array.isArray(additionalResourcesRes.data) ? additionalResourcesRes.data : additionalResourcesRes.data.data || []);
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
              setPolicy({
                ...response.data,
                additionalResources: response.data.additionalResources || []
              });
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

  const getAdditionalResourceDisplayName = (resourceId: string) => {
    const resource = additionalResources.find(r => r.id === resourceId);
    return resource ? resource.displayName : `Additional Resource (${resourceId})`;
  };

  const getAttributeDisplayName = (attrName: string) => {
    const attribute = attributes.find(a => a.name === attrName || a.id === attrName);
    return attribute ? attribute.displayName : attrName;
  };

  // Function to generate text-based policy description matching stepper 6 format
  const generatePolicyDescription = () => {
    if (!policy) return '';

    // Build the sentence the same way as stepper 6 (Review & Create)
    let sentence = `This policy ${policy.effect === 'Allow' ? 'ALLOWS' : 'DENIES'} `;

    // Subjects
    const subjectNames = policy.subjects.map(id => getSubjectDisplayName(id));
    sentence += subjectNames.join(', ');

    // Subject attributes (from first rule if available)
    if (policy.rules && policy.rules.length > 0 && policy.rules[0].subject.attributes.length > 0) {
      const conditions = policy.rules[0].subject.attributes
        .filter(attr => attr.value !== '' && attr.value !== null && attr.value !== undefined)
        .map((attr, index, array) => {
          const formattedValue = Array.isArray(attr.value) ? attr.value.join(' or ') : attr.value;
          const condition = `${getAttributeDisplayName(attr.name).toLowerCase()} is ${formattedValue}`;
          if (index === array.length - 1 && array.length > 1) {
            return `and ${condition}`;
          }
          return condition;
        })
        .join(', ');

      if (conditions) {
        sentence += ` (when ${conditions})`;
      }
    }

    sentence += ' to perform ';

    // Actions
    const actionNames = policy.actions.map(id => getActionDisplayName(id).toLowerCase());
    if (actionNames.length === 1) {
      sentence += actionNames[0];
    } else if (actionNames.length === 2) {
      sentence += `${actionNames[0]} and ${actionNames[1]}`;
    } else {
      sentence += `${actionNames.slice(0, -1).join(', ')}, and ${actionNames[actionNames.length - 1]}`;
    }

    sentence += ' actions on ';

    // Resources
    const resourceNames = policy.resources.map(id => getResourceDisplayName(id));
    if (resourceNames.length === 1) {
      sentence += resourceNames[0];
    } else if (resourceNames.length === 2) {
      sentence += `${resourceNames[0]} and ${resourceNames[1]}`;
    } else {
      sentence += `${resourceNames.slice(0, -1).join(', ')}, and ${resourceNames[resourceNames.length - 1]}`;
    }

    // Resource attributes (from first rule if available)
    if (policy.rules && policy.rules.length > 0 && policy.rules[0].object.attributes.length > 0) {
      const conditions = policy.rules[0].object.attributes
        .filter(attr => attr.value !== '' && attr.value !== null && attr.value !== undefined)
        .map((attr, index, array) => {
          const formattedValue = Array.isArray(attr.value) ? attr.value.join(' or ') : attr.value;
          const condition = `${getAttributeDisplayName(attr.name).toLowerCase()} is ${formattedValue}`;
          if (index === array.length - 1 && array.length > 1) {
            return `and ${condition}`;
          }
          return condition;
        })
        .join(', ');

      if (conditions) {
        sentence += ` (where ${conditions})`;
      }
    }

    // Additional resources with their attributes
    if (policy.additionalResources && policy.additionalResources.length > 0) {
      sentence += ' if ';
      policy.additionalResources.forEach((res, idx, arr) => {
        const resourceName = getAdditionalResourceDisplayName(res.id);
        sentence += resourceName;

        // Add attribute conditions if present
        if (res.attributes && res.attributes.length > 0) {
          const conditions = res.attributes
            .filter(attr => attr.value !== '' && attr.value !== null && attr.value !== undefined)
            .map((attr, index, array) => {
              const formattedValue = Array.isArray(attr.value) ? attr.value.join(' or ') : attr.value;
              const condition = `${getAttributeDisplayName(attr.name).toLowerCase()} is ${formattedValue}`;
              if (index === array.length - 1 && array.length > 1) {
                return `and ${condition}`;
              }
              return condition;
            })
            .join(', ');

          if (conditions) {
            sentence += ` (when ${conditions})`;
          }
        }

        // Add appropriate connector
        if (idx < arr.length - 2) {
          sentence += ', ';
        } else if (idx === arr.length - 2) {
          sentence += ' and ';
        }
      });
    }

    sentence += '.';
    return sentence;
  };

  // Function to highlight key elements in policy description with clean, elegant styling
  const highlightPolicyElements = (description: string) => {
    let highlightedText = description;

    // Escape special regex characters in display names
    const escapeRegex = (str: string) => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Create dynamic patterns based on loaded lookup data with elegant styling
    const patterns = [];

    // 1. Subject highlighting - clean blue style
    if (subjects && subjects.length > 0) {
      const subjectNames = subjects.map(s => escapeRegex(s.displayName)).join('|');
      patterns.push({
        pattern: new RegExp(`\\b(${subjectNames})\\b`, 'g'),
        replacement: '<span style="color: #1565c0; font-weight: 600; border-bottom: 2px solid #e3f2fd;">$1</span>'
      });
    }

    // 2. Action highlighting - clean orange style
    if (actions && actions.length > 0) {
      const actionNames = actions.map(a => escapeRegex(a.displayName)).join('|');
      patterns.push({
        pattern: new RegExp(`\\b(${actionNames})\\b`, 'gi'),
        replacement: '<span style="color: #ef6c00; font-weight: 600; border-bottom: 2px solid #fff3e0;">$1</span>'
      });
    }

    // 3. Resource highlighting - clean purple style
    if (resources && resources.length > 0) {
      const resourceNames = resources.map(r => escapeRegex(r.displayName)).join('|');
      patterns.push({
        pattern: new RegExp(`\\b(${resourceNames})\\b`, 'g'),
        replacement: '<span style="color: #6a1b9a; font-weight: 600; border-bottom: 2px solid #f3e5f5;">$1</span>'
      });
    }

    // 4. Additional Resources highlighting - clean green style
    if (additionalResources && additionalResources.length > 0) {
      const additionalResourceNames = additionalResources.map(ar => escapeRegex(ar.displayName)).join('|');
      patterns.push({
        pattern: new RegExp(`\\b(${additionalResourceNames})\\b`, 'g'),
        replacement: '<span style="color: #2e7d32; font-weight: 600; border-bottom: 2px solid #e8f5e8;">$1</span>'
      });
    }

    // Apply each pattern
    patterns.forEach(({ pattern, replacement }) => {
      highlightedText = highlightedText.replace(pattern, replacement);
    });

    return highlightedText;
  };

  const renderHumanReadablePolicy = () => {
    if (!policy || !policy.rules.length) return null;

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
                <Typography
                  component="div"
                  variant="body1"
                  sx={{ lineHeight: 1.8, fontSize: '1.1rem', mb: 3 }}
                  dangerouslySetInnerHTML={{
                    __html: highlightPolicyElements(generatePolicyDescription())
                  }}
                />

                {/* Legend */}
                <Box sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  pt: 2,
                  borderTop: '1px solid',
                  borderColor: 'grey.300',
                  fontSize: '0.875rem'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ color: '#1565c0', fontWeight: 600, borderBottom: '2px solid #e3f2fd' }}>Subject</span>
                    <Typography variant="caption" color="text.secondary">- Who</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ color: '#ef6c00', fontWeight: 600, borderBottom: '2px solid #fff3e0' }}>Action</span>
                    <Typography variant="caption" color="text.secondary">- What</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ color: '#6a1b9a', fontWeight: 600, borderBottom: '2px solid #f3e5f5' }}>Resource</span>
                    <Typography variant="caption" color="text.secondary">- Where</Typography>
                  </Box>
                  {policy.additionalResources && policy.additionalResources.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span style={{ color: '#2e7d32', fontWeight: 600, borderBottom: '2px solid #e8f5e8' }}>Condition</span>
                      <Typography variant="caption" color="text.secondary">- When</Typography>
                    </Box>
                  )}
                </Box>
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
    <ProtectedRoute>
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

        {/* Additional Resources Section */}
        {policy.additionalResources && policy.additionalResources.length > 0 && (
          <Card sx={{ mt: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InfoIcon color="success" />
                Additional Resources (Conditions)
              </Typography>

              <Grid container spacing={2}>
                {policy.additionalResources.map((resource, index) => (
                  <Grid key={index} size={{ xs: 12 }}>
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
                      <Box sx={{
                        p: 1.5,
                        bgcolor: 'white',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}>
                        <Typography variant="overline" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.7rem' }}>
                          Additional Resource {index + 1}
                        </Typography>
                        <Typography variant="body2" fontWeight="500" sx={{ mt: 0.5 }}>
                          {getAdditionalResourceDisplayName(resource.id)}
                        </Typography>

                        {resource.attributes && resource.attributes.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                              Attributes:
                            </Typography>
                            {resource.attributes.map((attr, i) => (
                              <Box key={i} sx={{ mt: 0.3 }}>
                                <Chip
                                  label={`${getAttributeDisplayName(attr.name)}: ${Array.isArray(attr.value) ? attr.value.join(', ') : attr.value}`}
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  sx={{ fontSize: '0.65rem', height: '20px' }}
                                />
                              </Box>
                            ))}
                          </Box>
                        )}

                        {(!resource.attributes || resource.attributes.length === 0) && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic' }}>
                              No attributes configured
                            </Typography>
                          </Box>
                        )}
                      </Box>
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

                    {policy.additionalResources && policy.additionalResources.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Additional Resources ({policy.additionalResources.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {policy.additionalResources.slice(0, 2).map((resource, index) => (
                            <Chip key={index} label={getAdditionalResourceDisplayName(resource.id)} size="small" color="secondary" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          ))}
                          {policy.additionalResources.length > 2 && (
                            <Chip label={`+${policy.additionalResources.length - 2} more`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          )}
                        </Box>
                      </Box>
                    )}

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
    </ProtectedRoute>
  );
}