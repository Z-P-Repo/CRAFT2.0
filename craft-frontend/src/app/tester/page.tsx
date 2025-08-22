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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  BugReport as TesterIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as RunIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Save as SaveIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface TestResult {
  id: string;
  decision: 'Allow' | 'Deny';
  policy: string;
  timestamp: string;
  executionTime: string;
  details: {
    evaluatedPolicies: number;
    matchedRules: string[];
    failedRules: string[];
  };
}

interface TestHistory {
  id: string;
  name: string;
  subject: string;
  action: string;
  object: string;
  result: 'Allow' | 'Deny';
  timestamp: string;
}

export default function PolicyTesterPage() {
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [subject, setSubject] = useState('john.doe@company.com');
  const [action, setAction] = useState('read');
  const [object, setObject] = useState('/documents/financial/report.pdf');
  const [environment, setEnvironment] = useState('{"ip": "192.168.1.100", "time": "09:30"}');

  const [testHistory] = useState<TestHistory[]>([
    {
      id: '1',
      name: 'Admin Access Test',
      subject: 'admin@company.com',
      action: 'delete',
      object: '/system/users',
      result: 'Allow',
      timestamp: '2024-01-21 10:30:00',
    },
    {
      id: '2',
      name: 'User Read Test',
      subject: 'user@company.com',
      action: 'read',
      object: '/documents/public/readme.txt',
      result: 'Allow',
      timestamp: '2024-01-21 10:25:00',
    },
    {
      id: '3',
      name: 'Guest Restricted',
      subject: 'guest@company.com',
      action: 'write',
      object: '/documents/sensitive/data.csv',
      result: 'Deny',
      timestamp: '2024-01-21 10:20:00',
    },
  ]);

  const handleRunTest = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockResult: TestResult = {
        id: Date.now().toString(),
        decision: Math.random() > 0.5 ? 'Allow' : 'Deny',
        policy: 'User Access Policy',
        timestamp: new Date().toISOString(),
        executionTime: `${Math.floor(Math.random() * 100) + 10}ms`,
        details: {
          evaluatedPolicies: Math.floor(Math.random() * 5) + 1,
          matchedRules: ['user.department == "IT"', 'action == "read"'],
          failedRules: ['resource.classification != "confidential"'],
        },
      };
      
      setTestResult(mockResult);
      setIsLoading(false);
    }, 2000);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getResultColor = (result: string) => {
    return result === 'Allow' ? 'success' : 'error';
  };

  const stats = [
    { label: 'Tests Run Today', value: '24', color: 'primary' },
    { label: 'Success Rate', value: '87%', color: 'success' },
    { label: 'Avg Response Time', value: '45ms', color: 'info' },
    { label: 'Policies Tested', value: '12', color: 'warning' },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TesterIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Policy Tester
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Test and evaluate access control policies with different scenarios.
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

      {/* Main Content */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Test Runner" />
          <Tab label="Test History" />
        </Tabs>
      </Box>

      {/* Test Runner Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Input Form */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Policy Test Configuration
                </Typography>
                
                <Box sx={{ '& > *': { mb: 3 } }}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., john.doe@company.com"
                    helperText="User, group, or role identifier"
                  />
                  
                  <FormControl fullWidth>
                    <InputLabel>Action</InputLabel>
                    <Select value={action} onChange={(e) => setAction(e.target.value)} label="Action">
                      <MenuItem value="read">Read</MenuItem>
                      <MenuItem value="write">Write</MenuItem>
                      <MenuItem value="delete">Delete</MenuItem>
                      <MenuItem value="execute">Execute</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Object/Resource"
                    value={object}
                    onChange={(e) => setObject(e.target.value)}
                    placeholder="e.g., /documents/report.pdf"
                    helperText="Resource path or identifier"
                  />
                  
                  <TextField
                    fullWidth
                    label="Environment Context"
                    multiline
                    rows={3}
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    placeholder='{"ip": "192.168.1.100", "time": "09:30"}'
                    helperText="JSON object with environmental attributes"
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={isLoading ? <CircularProgress size={20} /> : <RunIcon />}
                    onClick={handleRunTest}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Testing...' : 'Run Test'}
                  </Button>
                  <Button variant="outlined" startIcon={<SaveIcon />}>
                    Save
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Results */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Test Results
                </Typography>
                
                {!testResult && !isLoading && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: 200,
                      color: 'text.secondary'
                    }}
                  >
                    <Typography variant="body2">
                      Run a test to see results here
                    </Typography>
                  </Box>
                )}

                {isLoading && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: 200 
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}

                {testResult && (
                  <Box>
                    <Alert 
                      severity={testResult.decision === 'Allow' ? 'success' : 'error'}
                      sx={{ mb: 3 }}
                    >
                      <Typography variant="h6">
                        {testResult.decision.toUpperCase()}
                      </Typography>
                      <Typography variant="body2">
                        Policy decision: {testResult.decision}
                      </Typography>
                    </Alert>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Execution Time
                          </Typography>
                          <Typography variant="h6">
                            {testResult.executionTime}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Policies Evaluated
                          </Typography>
                          <Typography variant="h6">
                            {testResult.details.evaluatedPolicies}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">Matched Rules</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {testResult.details.matchedRules.map((rule, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <SuccessIcon color="success" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={
                                  <Typography variant="body2" fontFamily="monospace">
                                    {rule}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>

                    {testResult.details.failedRules.length > 0 && (
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle1">Failed Rules</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {testResult.details.failedRules.map((rule, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <ErrorIcon color="error" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={
                                    <Typography variant="body2" fontFamily="monospace">
                                      {rule}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Test History Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Test History
              </Typography>
              <Button variant="outlined" startIcon={<HistoryIcon />}>
                Clear History
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Test Name</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Object</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testHistory.map((test) => (
                    <TableRow key={test.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {test.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {test.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={test.action} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                          {test.object}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={test.result}
                          size="small"
                          color={getResultColor(test.result) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {test.timestamp}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}