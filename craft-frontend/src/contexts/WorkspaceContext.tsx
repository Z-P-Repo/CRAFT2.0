'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface IWorkspace {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  settings: {
    defaultEnvironment?: string;
    allowedDomains?: string[];
    branding?: {
      logo?: string;
      primaryColor?: string;
      theme?: 'light' | 'dark' | 'auto';
    };
    notifications?: {
      email: boolean;
      slack: boolean;
      webhook?: string;
    };
  };
  limits: {
    maxApplications: number;
    maxUsers: number;
    maxPolicies: number;
    storageQuota: number;
    apiCallsPerMonth: number;
  };
  metadata: {
    owner: string;
    admins: string[];
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    isSystem: boolean;
    plan: 'free' | 'professional' | 'enterprise';
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IApplication {
  _id: string;
  workspaceId: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'web' | 'api' | 'mobile' | 'desktop' | 'service' | 'microservice';
  configuration: {
    authSettings: {
      requireAuthentication: boolean;
      authProviders: string[];
      sessionTimeout: number;
      mfaRequired: boolean;
    };
  };
  metadata: {
    owner: string;
    maintainers: string[];
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    version: string;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IEnvironment {
  _id: string;
  workspaceId: string;
  applicationId: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'development' | 'testing' | 'staging' | 'production' | 'preview' | 'hotfix';
  configuration: {
    variables: Record<string, string>;
    endpoints: Record<string, string>;
    features: Record<string, boolean>;
  };
  metadata: {
    owner: string;
    createdBy: string;
    lastModifiedBy: string;
    tags: string[];
    isDefault: boolean;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceContextType {
  // Current selections
  currentWorkspace: IWorkspace | null;
  currentApplication: IApplication | null;
  currentEnvironment: IEnvironment | null;
  
  // Available options
  workspaces: IWorkspace[];
  applications: IApplication[];
  environments: IEnvironment[];
  
  // Loading states
  workspacesLoading: boolean;
  applicationsLoading: boolean;
  environmentsLoading: boolean;
  
  // Actions
  setCurrentWorkspace: (workspace: IWorkspace | null) => void;
  setCurrentApplication: (application: IApplication | null) => void;
  setCurrentEnvironment: (environment: IEnvironment | null) => void;
  refreshWorkspaces: () => Promise<void>;
  refreshApplications: () => Promise<void>;
  refreshEnvironments: () => Promise<void>;
  
  // Utility functions
  isWorkspaceOwner: (workspace: IWorkspace) => boolean;
  isWorkspaceAdmin: (workspace: IWorkspace) => boolean;
  hasWorkspaceAccess: (workspace: IWorkspace) => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Current selections
  const [currentWorkspace, setCurrentWorkspace] = useState<IWorkspace | null>(null);
  const [currentApplication, setCurrentApplication] = useState<IApplication | null>(null);
  const [currentEnvironment, setCurrentEnvironment] = useState<IEnvironment | null>(null);
  
  // Available options
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [environments, setEnvironments] = useState<IEnvironment[]>([]);
  
  // Loading states
  const [workspacesLoading, setWorkspacesLoading] = useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);
  
  // Get current user ID from auth context
  const { user } = useAuth();
  const getCurrentUserId = () => {
    return user?._id || null;
  };

  // Utility functions
  const isWorkspaceOwner = (workspace: IWorkspace): boolean => {
    const userId = getCurrentUserId();
    return userId && workspace.metadata.owner === userId;
  };

  const isWorkspaceAdmin = (workspace: IWorkspace): boolean => {
    const userId = getCurrentUserId();
    return userId && (
      workspace.metadata.owner === userId || 
      workspace.metadata.admins.includes(userId)
    );
  };

  const hasWorkspaceAccess = (workspace: IWorkspace): boolean => {
    return isWorkspaceOwner(workspace) || isWorkspaceAdmin(workspace);
  };

  // API calls
  const refreshWorkspaces = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      return;
    }
    
    setWorkspacesLoading(true);
    try {
      const response = await apiClient.get('/workspaces');
      
      if (response.success) {
        const workspaces = response.data || [];
        setWorkspaces(workspaces);
        
        // Clear current selections if they don't exist in the new data
        if (currentWorkspace && !workspaces.find((w: IWorkspace) => w._id === currentWorkspace._id)) {
          setCurrentWorkspace(null);
          setCurrentApplication(null);
          setCurrentEnvironment(null);
          localStorage.removeItem('currentWorkspace');
          localStorage.removeItem('currentApplication');
          localStorage.removeItem('currentEnvironment');
        }
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setWorkspacesLoading(false);
    }
  }, [isAuthenticated, currentWorkspace]);

  const refreshApplications = useCallback(async (): Promise<void> => {
    if (!currentWorkspace || !isAuthenticated) {
      setApplications([]);
      return;
    }
    
    setApplicationsLoading(true);
    try {
      const response = await apiClient.get(`/workspaces/${currentWorkspace._id}/applications`);
      
      if (response.success) {
        const applications = response.data || [];
        setApplications(applications);
        
        // Clear current selection if it doesn't exist in the new data
        if (currentApplication && !applications.find((a: IApplication) => a._id === currentApplication._id)) {
          setCurrentApplication(null);
          setCurrentEnvironment(null);
          localStorage.removeItem('currentApplication');
          localStorage.removeItem('currentEnvironment');
        }
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setApplicationsLoading(false);
    }
  }, [currentWorkspace, isAuthenticated, currentApplication]);

  const refreshEnvironments = useCallback(async (): Promise<void> => {
    if (!currentWorkspace || !currentApplication || !isAuthenticated) {
      setEnvironments([]);
      return;
    }
    
    setEnvironmentsLoading(true);
    try {
      const response = await apiClient.get(
        `/workspaces/${currentWorkspace._id}/applications/${currentApplication._id}/environments`
      );
      
      if (response.success) {
        const environments = response.data || [];
        setEnvironments(environments);
        
        // Clear current selection if it doesn't exist in the new data
        if (currentEnvironment && !environments.find((e: IEnvironment) => e._id === currentEnvironment._id)) {
          setCurrentEnvironment(null);
          localStorage.removeItem('currentEnvironment');
        }
      }
    } catch (error) {
      console.error('Failed to fetch environments:', error);
    } finally {
      setEnvironmentsLoading(false);
    }
  }, [currentWorkspace, currentApplication, isAuthenticated, currentEnvironment]);

  // Custom setters that handle cascading updates
  const handleSetCurrentWorkspace = (workspace: IWorkspace | null) => {
    setCurrentWorkspace(workspace);
    setCurrentApplication(null);
    setCurrentEnvironment(null);
    
    // Save to localStorage for persistence
    if (workspace) {
      localStorage.setItem('currentWorkspace', JSON.stringify(workspace));
      localStorage.removeItem('currentApplication');
      localStorage.removeItem('currentEnvironment');
    } else {
      localStorage.removeItem('currentWorkspace');
      localStorage.removeItem('currentApplication');
      localStorage.removeItem('currentEnvironment');
    }
  };

  const handleSetCurrentApplication = (application: IApplication | null) => {
    setCurrentApplication(application);
    setCurrentEnvironment(null);
    
    // Save to localStorage for persistence
    if (application) {
      localStorage.setItem('currentApplication', JSON.stringify(application));
      localStorage.removeItem('currentEnvironment');
    } else {
      localStorage.removeItem('currentApplication');
      localStorage.removeItem('currentEnvironment');
    }
  };

  const handleSetCurrentEnvironment = (environment: IEnvironment | null) => {
    setCurrentEnvironment(environment);
    
    // Save to localStorage for persistence
    if (environment) {
      localStorage.setItem('currentEnvironment', JSON.stringify(environment));
    } else {
      localStorage.removeItem('currentEnvironment');
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    const savedWorkspace = localStorage.getItem('currentWorkspace');
    const savedApplication = localStorage.getItem('currentApplication');
    const savedEnvironment = localStorage.getItem('currentEnvironment');
    
    if (savedWorkspace) {
      setCurrentWorkspace(JSON.parse(savedWorkspace));
    }
    if (savedApplication) {
      setCurrentApplication(JSON.parse(savedApplication));
    }
    if (savedEnvironment) {
      setCurrentEnvironment(JSON.parse(savedEnvironment));
    }
  }, []);

  // Load workspaces when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      refreshWorkspaces();
    } else if (!isAuthenticated && !authLoading) {
      // Clear data when not authenticated
      setWorkspaces([]);
      setApplications([]);
      setEnvironments([]);
      setCurrentWorkspace(null);
      setCurrentApplication(null);
      setCurrentEnvironment(null);
    }
  }, [isAuthenticated, authLoading, refreshWorkspaces]);

  // Load applications when workspace changes
  useEffect(() => {
    refreshApplications();
  }, [currentWorkspace, refreshApplications]);

  // Load environments when application changes
  useEffect(() => {
    refreshEnvironments();
  }, [currentApplication, refreshEnvironments]);

  // Auto-select first workspace when workspaces load and none is selected
  useEffect(() => {
    if (!currentWorkspace && workspaces.length > 0 && !workspacesLoading) {
      setCurrentWorkspace(workspaces[0]);
    }
  }, [workspaces, currentWorkspace, workspacesLoading]);

  // Auto-select first application when applications load and none is selected
  useEffect(() => {
    if (!currentApplication && applications.length > 0 && !applicationsLoading && currentWorkspace) {
      setCurrentApplication(applications[0]);
    }
  }, [applications, currentApplication, applicationsLoading, currentWorkspace]);

  // Auto-select default or first environment when environments load and none is selected
  useEffect(() => {
    if (!currentEnvironment && environments.length > 0 && !environmentsLoading && currentApplication) {
      const defaultEnv = environments.find((env: IEnvironment) => env.metadata.isDefault);
      setCurrentEnvironment(defaultEnv || environments[0]);
    }
  }, [environments, currentEnvironment, environmentsLoading, currentApplication]);

  const contextValue: WorkspaceContextType = {
    currentWorkspace,
    currentApplication,
    currentEnvironment,
    workspaces,
    applications,
    environments,
    workspacesLoading,
    applicationsLoading,
    environmentsLoading,
    setCurrentWorkspace: handleSetCurrentWorkspace,
    setCurrentApplication: handleSetCurrentApplication,
    setCurrentEnvironment: handleSetCurrentEnvironment,
    refreshWorkspaces,
    refreshApplications,
    refreshEnvironments,
    isWorkspaceOwner,
    isWorkspaceAdmin,
    hasWorkspaceAccess
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export default WorkspaceContext;