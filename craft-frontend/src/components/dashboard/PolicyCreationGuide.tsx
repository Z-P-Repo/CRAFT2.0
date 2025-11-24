'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  MenuBook as GuideIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  TipsAndUpdates as TipIcon,
  Person as SubjectIcon,
  FlashOn as ActionIcon,
  Folder as ResourceIcon,
  Label as AttributeIcon,
  Extension as AdditionalIcon,
  Visibility as PreviewIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  PlayArrow as StartIcon,
  AutoAwesome as MagicIcon,
  Business as WorkspaceIcon,
  Apps as ApplicationIcon,
  Cloud as EnvironmentIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface GuideStep {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  description: string;
  tips: string[];
  examples: string[];
  commonMistakes?: string[];
}

const PolicyCreationGuide: React.FC = () => {
  const router = useRouter();
  const { currentWorkspace, currentApplication, currentEnvironment } = useWorkspace();
  const [activeStep, setActiveStep] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);

  const steps: GuideStep[] = [
    {
      title: 'Step 1: Create Workspace',
      subtitle: 'Set up your organization workspace',
      icon: <WorkspaceIcon sx={{ fontSize: 40, color: '#d32f2f' }} />,
      description: 'A workspace is your organization\'s top-level container. It represents your company, department, or team. All your applications and policies will live inside this workspace.',
      tips: [
        'Think of a workspace as your organization\'s home in the system',
        'Use your company or department name for easy identification',
        'You only need to create a workspace once - it will contain everything else',
        'Multiple teams can share one workspace or have separate ones',
        'Workspace admins can manage all applications and policies within it',
      ],
      examples: [
        'Workspace Name: "Acme Corporation"',
        'Workspace Name: "Marketing Department"',
        'Workspace Name: "IT Operations Team"',
        'Description: "Main workspace for all company access policies"',
      ],
      commonMistakes: [
        'Creating multiple workspaces when one would suffice',
        'Using generic names that don\'t identify your organization',
        'Not adding a clear description',
      ],
    },
    {
      title: 'Step 2: Create Application',
      subtitle: 'Define your application or system',
      icon: <ApplicationIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      description: 'Applications represent the systems, tools, or platforms you want to control access to. Examples include your CRM, document management system, or internal tools.',
      tips: [
        'Each application should represent a distinct system or tool',
        'You can create multiple applications within one workspace',
        'Name applications after the actual systems they represent',
        'Applications help organize policies by system or service',
        'Each application can have its own environments (dev, staging, production)',
      ],
      examples: [
        'Application Name: "Customer CRM System"',
        'Application Name: "Document Management Portal"',
        'Application Name: "HR Management System"',
        'Description: "Main customer relationship management application"',
      ],
      commonMistakes: [
        'Creating one application for everything instead of separating by system',
        'Using technical IDs instead of user-friendly names',
        'Not planning for multiple environments',
      ],
    },
    {
      title: 'Step 3: Create Environment',
      subtitle: 'Set up deployment environment',
      icon: <EnvironmentIcon sx={{ fontSize: 40, color: '#2e7d32' }} />,
      description: 'Environments represent different stages of your application lifecycle. Common environments include Development (for testing), Staging (for pre-production), and Production (for live use).',
      tips: [
        'Most applications need at least Development and Production environments',
        'Test policies in Development before deploying to Production',
        'Each environment can have different policies and access rules',
        'Production environment should have stricter access controls',
        'You can create custom environments for your specific needs',
      ],
      examples: [
        'Environment Name: "Development" - for testing new policies',
        'Environment Name: "Staging" - for pre-production validation',
        'Environment Name: "Production" - for live, active policies',
        'Environment Name: "QA" - for quality assurance testing',
      ],
      commonMistakes: [
        'Testing policies directly in Production environment',
        'Not separating environments by purpose',
        'Using the same access rules across all environments',
      ],
    },
    {
      title: 'Step 4: Policy Details',
      subtitle: 'Define the basic information',
      icon: <InfoIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      description: 'Start by giving your policy a clear name and description. Think of the policy name as a title that describes what access you\'re controlling.',
      tips: [
        'Use descriptive names like "Sales Team Document Access" instead of just "Policy 1"',
        'Choose ALLOW to grant permissions or DENY to restrict access',
        'ALLOW policies are most common - use them when you want to give people access',
        'DENY policies override ALLOW policies - use them to block specific access',
        'Set status to Draft while testing, then change to Active when ready',
      ],
      examples: [
        'Policy Name: "Marketing Team Social Media Access"',
        'Description: "Allows marketing team members to manage social media accounts"',
        'Effect: ALLOW',
        'Status: Draft (change to Active after testing)',
      ],
      commonMistakes: [
        'Using vague names that don\'t explain the policy purpose',
        'Forgetting to change from Draft to Active after testing',
        'Creating DENY policies when ALLOW would be simpler',
      ],
    },
    {
      title: 'Step 5: Select Subjects',
      subtitle: 'Choose WHO gets access',
      icon: <SubjectIcon sx={{ fontSize: 40, color: '#2e7d32' }} />,
      description: 'Subjects are the "WHO" in your policy - the people, groups, or roles that will be affected. You can select existing users/groups or create new ones.',
      tips: [
        'Think of subjects as the people or teams you want to give (or deny) access to',
        'You can select multiple subjects - perfect for entire teams or departments',
        'Use the search box to quickly find users by name or email',
        'Create new subjects on the fly if you don\'t see the person/group you need',
        'Add attributes to subjects to create conditions like "only managers" or "only full-time employees"',
      ],
      examples: [
        'Select "Marketing Team" group for team-wide access',
        'Choose individual users: "john.doe@company.com", "jane.smith@company.com"',
        'Add attribute: Department = "Marketing" to apply policy to all marketing staff',
        'Add attribute: Role = "Manager" to restrict to managers only',
      ],
      commonMistakes: [
        'Selecting the wrong users - always double-check your selections',
        'Forgetting to add conditions when you need them (like "only managers")',
        'Not using groups when multiple people need the same access',
      ],
    },
    {
      title: 'Step 6: Select Actions',
      subtitle: 'Define WHAT they can do',
      icon: <ActionIcon sx={{ fontSize: 40, color: '#ed6c02' }} />,
      description: 'Actions define what operations subjects can perform. Common actions include Read, Write, Delete, and Execute. Choose all actions that should be allowed or denied.',
      tips: [
        'Actions are the operations or activities people can perform',
        'Read = viewing or downloading, Write = creating or editing, Delete = removing',
        'Select multiple actions if subjects need several permissions',
        'Low risk actions are safer (like Read), High risk actions need more care (like Delete)',
        'Create custom actions for specific business operations like "Approve Invoice" or "Generate Report"',
      ],
      examples: [
        'For viewing documents: Select "Read" and "Download"',
        'For content creators: Select "Read", "Write", and "Upload"',
        'For administrators: Select "Read", "Write", "Delete", and "Manage"',
        'For approval workflows: Create custom action "Approve Purchase Order"',
      ],
      commonMistakes: [
        'Giving too many permissions - only grant what\'s actually needed',
        'Selecting Delete without Read/Write - users usually need these together',
        'Not considering the risk level of actions',
      ],
    },
    {
      title: 'Step 7: Select Resources',
      subtitle: 'Specify WHERE access applies',
      icon: <ResourceIcon sx={{ fontSize: 40, color: '#0288d1' }} />,
      description: 'Resources are the "WHERE" - the files, folders, databases, or applications that the policy controls access to. Be specific about what subjects can access.',
      tips: [
        'Resources are the things people access - files, folders, systems, databases',
        'You can select multiple resources in one policy',
        'Use folders/parent resources to grant access to everything inside',
        'Add resource attributes to create rules like "only public files" or "only approved documents"',
        'Create new resources if you don\'t see what you need',
      ],
      examples: [
        'Select "Marketing Folder" to grant access to all marketing materials',
        'Choose "Customer Database" for database access',
        'Pick "Social Media Dashboard" for application access',
        'Add attribute: Classification = "Public" to limit to public documents only',
        'Add attribute: Status = "Approved" to only allow access to approved content',
      ],
      commonMistakes: [
        'Granting access to parent folders when you meant to restrict to specific files',
        'Not using resource attributes when you need conditional access',
        'Selecting the wrong resource type',
      ],
    },
    {
      title: 'Step 8: Additional Resources & Conditions',
      subtitle: 'Add advanced rules (Optional)',
      icon: <AdditionalIcon sx={{ fontSize: 40, color: '#9c27b0' }} />,
      description: 'Additional resources let you create complex conditions like "only during business hours" or "only if manager approved". This step is optional but powerful for advanced policies.',
      tips: [
        'Skip this step if you don\'t need special conditions - it\'s completely optional',
        'Use additional resources for time-based access, approval workflows, or status checks',
        'Common types: Conditions (if-then rules), Status (approved/pending), Approval (needs manager OK)',
        'Think of these as "AND" conditions - subjects must meet ALL requirements',
        'You can create new additional resources or select existing ones',
      ],
      examples: [
        'Add "Business Hours Only" condition to restrict access to 9 AM - 5 PM',
        'Add "Manager Approval Required" to need approval before access',
        'Add "VPN Connection Required" to only allow access from secure network',
        'Add "Training Completed" status to require training before access',
      ],
      commonMistakes: [
        'Making policies too complex - simpler is often better',
        'Adding conditions that conflict with each other',
        'Not testing complex policies before making them active',
      ],
    },
    {
      title: 'Step 9: Review & Create',
      subtitle: 'Verify everything looks correct',
      icon: <PreviewIcon sx={{ fontSize: 40, color: '#7b1fa2' }} />,
      description: 'This is your final check. Review the complete policy in plain English to make sure it does exactly what you want. Once you\'re happy, create the policy!',
      tips: [
        'Read the policy summary carefully - it shows exactly what will happen',
        'Make sure the subjects, actions, and resources are all correct',
        'Check that the policy effect (ALLOW or DENY) is what you intended',
        'If something looks wrong, use the Back button to make changes',
        'Remember: Draft policies don\'t take effect until you change them to Active',
      ],
      examples: [
        'Policy reads: "This policy ALLOWS Marketing Team to perform read, write actions on Marketing Folder"',
        'Double-check: Marketing Team ✓, read and write ✓, Marketing Folder ✓',
        'If everything looks good, click "Create Policy"',
        'Test the policy as a Draft first before making it Active',
      ],
      commonMistakes: [
        'Not reading the final summary before creating',
        'Creating policies as Active without testing first',
        'Rushing through the review step',
      ],
    },
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleStartCreating = () => {
    router.push('/policies/create');
  };

  return (
    <>
      <Card
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          },
        }}
        onClick={() => setOpenDialog(true)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <GuideIcon sx={{ fontSize: 48 }} />
              <Box>
                <Typography variant="h5" fontWeight="600" gutterBottom>
                  Policy Creation Guide
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Step-by-step instructions for creating access control policies
                </Typography>
              </Box>
            </Box>
            <Chip
              label="Click to Open"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GuideIcon sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="600">
                How to Create an Access Policy
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                A complete guide for non-technical users
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setOpenDialog(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 3 }}>
          <Alert severity="info" icon={<MagicIcon />} sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="600" gutterBottom>
              Complete Setup Guide
            </Typography>
            <Typography variant="body2">
              This guide covers the complete setup from creating your workspace to defining access policies. An access policy is like a set of rules that says <strong>WHO</strong> can do <strong>WHAT</strong> with{' '}
              <strong>WHICH</strong> resources. For example: "Marketing team members can view and edit marketing documents."
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {currentWorkspace && (
                <Chip
                  icon={<CheckIcon />}
                  label="Workspace Created"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
              {currentApplication && (
                <Chip
                  icon={<CheckIcon />}
                  label="Application Created"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
              {currentEnvironment && (
                <Chip
                  icon={<CheckIcon />}
                  label="Environment Created"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </Box>
          </Alert>

          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={index}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: '1.1rem',
                      fontWeight: 600,
                    },
                  }}
                >
                  {step.title}
                </StepLabel>
                <StepContent>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        {step.icon}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" color="primary" gutterBottom>
                            {step.subtitle}
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {step.description}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TipIcon color="primary" />
                            <Typography variant="subtitle1" fontWeight="600">
                              💡 Helpful Tips ({step.tips.length})
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {step.tips.map((tip, idx) => (
                              <ListItem key={idx}>
                                <ListItemIcon>
                                  <CheckIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={tip} />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>

                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InfoIcon color="info" />
                            <Typography variant="subtitle1" fontWeight="600">
                              📝 Examples ({step.examples.length})
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <List dense>
                              {step.examples.map((example, idx) => (
                                <ListItem key={idx}>
                                  <ListItemIcon>
                                    <CheckIcon color="primary" fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={example}
                                    primaryTypographyProps={{
                                      fontFamily: 'monospace',
                                      fontSize: '0.9rem',
                                    }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        </AccordionDetails>
                      </Accordion>

                      {step.commonMistakes && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <WarningIcon color="warning" />
                              <Typography variant="subtitle1" fontWeight="600">
                                ⚠️ Common Mistakes to Avoid ({step.commonMistakes.length})
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Alert severity="warning">
                              <List dense>
                                {step.commonMistakes.map((mistake, idx) => (
                                  <ListItem key={idx}>
                                    <ListItemIcon>
                                      <WarningIcon color="warning" fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={mistake} />
                                  </ListItem>
                                ))}
                              </List>
                            </Alert>
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </CardContent>
                  </Card>

                  <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      variant="outlined"
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={index === steps.length - 1 ? handleReset : handleNext}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      {index === steps.length - 1 ? 'Start Over' : 'Next Step'}
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {activeStep === steps.length && (
            <Paper square elevation={0} sx={{ p: 3, bgcolor: 'success.light' }}>
              <Typography variant="h6" gutterBottom>
                🎉 You\'re Ready to Create Your First Policy!
              </Typography>
              <Typography paragraph>
                You've completed the guide. Now you understand all 9 steps from workspace setup to policy creation. Remember to start with
                Draft status and test before making policies Active.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button onClick={handleReset} variant="outlined">
                  Review Guide Again
                </Button>
                <Button onClick={handleStartCreating} variant="contained" startIcon={<StartIcon />}>
                  Start Creating Policy
                </Button>
              </Box>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined">
            Close Guide
          </Button>
          <Button onClick={handleStartCreating} variant="contained" startIcon={<StartIcon />}>
            Create Policy Now
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PolicyCreationGuide;
