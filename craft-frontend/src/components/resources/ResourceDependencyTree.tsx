'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AccountTree as TreeIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface ResourceNode {
  id: string;
  name: string;
  displayName: string;
  type: 'resource' | 'additional';
  hasConditions: boolean;
  dependsOn: string[];
  status?: 'accessible' | 'blocked' | 'pending';
  conditions?: string[];
  level: number;
}

interface DependencyEdge {
  source: string;
  target: string;
  type: 'dependency' | 'condition';
}

interface ResourceDependencyGraph {
  nodes: ResourceNode[];
  edges: DependencyEdge[];
}

interface ResourceDependencyTreeProps {
  environmentId?: string;
  selectedResourceId?: string;
  onResourceSelect?: (resourceId: string) => void;
}

const ResourceDependencyTree: React.FC<ResourceDependencyTreeProps> = ({
  environmentId,
  selectedResourceId,
  onResourceSelect
}) => {
  const [dependencyGraph, setDependencyGraph] = useState<ResourceDependencyGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const calculateNodeLevel = (nodeId: string, edges: DependencyEdge[]): number => {
    const visited = new Set<string>();

    const dfs = (id: string): number => {
      if (visited.has(id)) return 0;
      visited.add(id);

      const dependencies = edges.filter(edge => edge.target === id);
      if (dependencies.length === 0) return 0;

      return 1 + Math.max(...dependencies.map(dep => dfs(dep.source)));
    };

    return dfs(nodeId);
  };

  const getNodeStatus = (node: any): 'accessible' | 'blocked' | 'pending' => {
    if (!node.hasConditions) return 'accessible';
    if (node.dependsOn && node.dependsOn.length > 0) return 'pending';
    return 'accessible';
  };

  const processGraphData = useCallback((rawGraph: any): ResourceDependencyGraph => {
    const nodes = rawGraph.nodes.map((node: any, index: number) => ({
      ...node,
      level: calculateNodeLevel(node.id, rawGraph.edges),
      status: getNodeStatus(node)
    }));

    // Sort nodes by level for hierarchical display
    nodes.sort((a: ResourceNode, b: ResourceNode) => a.level - b.level);

    return {
      nodes,
      edges: rawGraph.edges
    };
  }, []);

  const fetchDependencyGraph = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the authenticated apiClient instead of fetch
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.get('/resources/dependency-graph', {
        environmentId
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch dependency graph');
      }

      const processedGraph = processGraphData(response.data);
      setDependencyGraph(processedGraph);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [environmentId, processGraphData]);

  useEffect(() => {
    if (environmentId) {
      fetchDependencyGraph();
    }
  }, [environmentId, fetchDependencyGraph]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accessible':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'blocked':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'pending':
        return <WarningIcon color="warning" fontSize="small" />;
      default:
        return <InfoIcon color="info" fontSize="small" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accessible':
        return 'success';
      case 'blocked':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getDependentNodes = (nodeId: string): ResourceNode[] => {
    if (!dependencyGraph) return [];

    const dependentIds = dependencyGraph.edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);

    return dependencyGraph.nodes.filter(node => dependentIds.includes(node.id));
  };

  const renderNode = (node: ResourceNode, depth: number = 0) => {
    const dependentNodes = getDependentNodes(node.id);
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedResourceId === node.id;

    return (
      <Box key={node.id} sx={{ ml: depth * 3 }}>
        <Card
          variant={isSelected ? "elevation" : "outlined"}
          elevation={isSelected ? 3 : 0}
          sx={{
            mb: 1,
            border: isSelected ? 2 : 1,
            borderColor: isSelected ? 'primary.main' : 'divider',
            cursor: 'pointer'
          }}
          onClick={() => onResourceSelect?.(node.id)}
        >
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {dependentNodes.length > 0 && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNodeExpansion(node.id);
                    }}
                  >
                    <ExpandMoreIcon
                      sx={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}
                    />
                  </IconButton>
                )}

                {getStatusIcon(node.status || 'accessible')}

                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {node.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {node.name}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={node.type}
                  size="small"
                  variant="outlined"
                  color={node.type === 'additional' ? 'secondary' : 'primary'}
                />

                <Chip
                  label={node.status || 'accessible'}
                  size="small"
                  color={getStatusColor(node.status || 'accessible') as any}
                />

                {node.hasConditions && (
                  <Tooltip title="Has additional access rules">
                    <TreeIcon fontSize="small" color="action" />
                  </Tooltip>
                )}
              </Box>
            </Box>

            {node.conditions && node.conditions.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Conditions:
                </Typography>
                {node.conditions.map((condition, index) => (
                  <Typography key={index} variant="caption" display="block" sx={{ ml: 1 }}>
                    • {condition}
                  </Typography>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {isExpanded && dependentNodes.map(depNode =>
          renderNode(depNode, depth + 1)
        )}
      </Box>
    );
  };

  const renderTree = () => {
    if (!dependencyGraph) return null;

    // Get root nodes (nodes with no dependencies)
    const rootNodes = dependencyGraph.nodes.filter(node =>
      !dependencyGraph.edges.some(edge => edge.target === node.id)
    );

    if (rootNodes.length === 0) {
      return (
        <Alert severity="info">
          No independent resources found. All resources have dependencies.
        </Alert>
      );
    }

    return (
      <Box>
        {rootNodes.map(node => renderNode(node))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!environmentId) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Select an environment to view resource dependencies.
      </Alert>
    );
  }

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TreeIcon />
          <Typography variant="h6">Resource Dependency Tree</Typography>
          {dependencyGraph && (
            <Chip
              label={`${dependencyGraph.nodes.length} resources`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
          {dependencyGraph && dependencyGraph.nodes.length === 0 ? (
            <Alert severity="info">
              No resources with dependencies found in this environment.
            </Alert>
          ) : (
            renderTree()
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default ResourceDependencyTree;