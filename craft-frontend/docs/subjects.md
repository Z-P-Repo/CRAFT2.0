# Subject Management Documentation

The Subject Management module provides a comprehensive interface for managing users, groups, and roles within the CRAFT ABAC system. This module handles the creation, editing, and administration of all subject entities that can be granted or denied access.

## Overview

Subject management is a core component of the ABAC system where subjects represent entities (users, groups, roles) that request access to resources. The module provides full CRUD operations with advanced filtering, search capabilities, and detailed profile management.

## Component Structure

### SubjectsPage Component

**Location**: `/src/app/subjects/page.tsx`

The main subject management interface with comprehensive subject administration capabilities.

#### Features
- **Multi-type Subject Management**: Users, Groups, and Roles
- **Profile Management**: Detailed subject profiles with attributes
- **Status Tracking**: Active/Inactive subject monitoring
- **Department Organization**: Organize subjects by departments
- **Visual Differentiation**: Avatar-based type identification
- **Advanced Search**: Filter by type, status, department
- **Responsive Design**: Optimized for all screen sizes

## Data Models

### Subject Interface

```typescript
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
  attributes?: Record<string, any>;
  managerId?: string;
  groupMemberships?: string[];
  permissions?: string[];
}
```

### Subject Types

```typescript
enum SubjectType {
  User = 'User',      // Individual users
  Group = 'Group',    // Collections of users
  Role = 'Role'       // Permission-based roles
}

enum SubjectStatus {
  Active = 'Active',
  Inactive = 'Inactive'
}
```

## User Interface Components

### Subject Table

```typescript
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
        <SubjectRow key={subject.id} subject={subject} />
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### Subject Card (Mobile View)

```typescript
const SubjectCard = ({ subject }: { subject: Subject }) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: getTypeColor(subject.type), mr: 2 }}>
          {getTypeIcon(subject.type)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">{subject.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subject.email}
          </Typography>
        </Box>
        <Chip
          label={subject.status}
          color={subject.status === 'Active' ? 'success' : 'error'}
          size="small"
        />
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">
            Type
          </Typography>
          <Typography variant="body2">{subject.type}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">
            Department
          </Typography>
          <Typography variant="body2">{subject.department}</Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);
```

### Subject Creation Dialog

```typescript
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
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          >
            <MenuItem value="User">User</MenuItem>
            <MenuItem value="Group">Group</MenuItem>
            <MenuItem value="Role">Role</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  </DialogContent>
</Dialog>
```

## State Management

### Local State Structure

```typescript
const [subjects, setSubjects] = useState<Subject[]>([]);
const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Filter state
const [filters, setFilters] = useState({
  type: 'all',
  status: 'all',
  department: 'all',
  search: '',
});

// Pagination state
const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(10);
```

### CRUD Operations

#### Create Subject

```typescript
const handleCreateSubject = async (subjectData: Omit<Subject, 'id'>) => {
  try {
    setLoading(true);
    const response = await apiClient.post('/subjects', subjectData);
    
    if (response.success) {
      setSubjects(prev => [...prev, response.data]);
      setIsDialogOpen(false);
      showSuccessNotification('Subject created successfully');
    } else {
      setError(response.error || 'Failed to create subject');
    }
  } catch (error: any) {
    setError(error.message || 'Failed to create subject');
  } finally {
    setLoading(false);
  }
};
```

#### Update Subject

```typescript
const handleUpdateSubject = async (id: string, updates: Partial<Subject>) => {
  try {
    setLoading(true);
    const response = await apiClient.put(`/subjects/${id}`, updates);
    
    if (response.success) {
      setSubjects(prev => 
        prev.map(subject => 
          subject.id === id ? { ...subject, ...response.data } : subject
        )
      );
      setIsDialogOpen(false);
      showSuccessNotification('Subject updated successfully');
    } else {
      setError(response.error || 'Failed to update subject');
    }
  } catch (error: any) {
    setError(error.message || 'Failed to update subject');
  } finally {
    setLoading(false);
  }
};
```

#### Delete Subject

```typescript
const handleDeleteSubject = async (id: string) => {
  if (!confirm('Are you sure you want to delete this subject?')) {
    return;
  }

  try {
    setLoading(true);
    const response = await apiClient.delete(`/subjects/${id}`);
    
    if (response.success) {
      setSubjects(prev => prev.filter(subject => subject.id !== id));
      showSuccessNotification('Subject deleted successfully');
    } else {
      setError(response.error || 'Failed to delete subject');
    }
  } catch (error: any) {
    setError(error.message || 'Failed to delete subject');
  } finally {
    setLoading(false);
  }
};
```

## Filtering and Search

### Advanced Filtering

```typescript
const applyFilters = useCallback(() => {
  let filtered = [...subjects];

  // Filter by type
  if (filters.type !== 'all') {
    filtered = filtered.filter(subject => subject.type === filters.type);
  }

  // Filter by status
  if (filters.status !== 'all') {
    filtered = filtered.filter(subject => subject.status === filters.status);
  }

  // Filter by department
  if (filters.department !== 'all') {
    filtered = filtered.filter(subject => subject.department === filters.department);
  }

  // Search filter
  if (filters.search.trim()) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(subject =>
      subject.name.toLowerCase().includes(searchTerm) ||
      subject.email.toLowerCase().includes(searchTerm) ||
      subject.department.toLowerCase().includes(searchTerm)
    );
  }

  setFilteredSubjects(filtered);
}, [subjects, filters]);

useEffect(() => {
  applyFilters();
}, [applyFilters]);
```

### Search Interface

```typescript
<Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
  <TextField
    label="Search subjects..."
    value={filters.search}
    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon />
        </InputAdornment>
      ),
    }}
    sx={{ minWidth: 300 }}
  />
  
  <FormControl sx={{ minWidth: 120 }}>
    <InputLabel>Type</InputLabel>
    <Select
      value={filters.type}
      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
    >
      <MenuItem value="all">All Types</MenuItem>
      <MenuItem value="User">Users</MenuItem>
      <MenuItem value="Group">Groups</MenuItem>
      <MenuItem value="Role">Roles</MenuItem>
    </Select>
  </FormControl>

  <FormControl sx={{ minWidth: 120 }}>
    <InputLabel>Status</InputLabel>
    <Select
      value={filters.status}
      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
    >
      <MenuItem value="all">All Status</MenuItem>
      <MenuItem value="Active">Active</MenuItem>
      <MenuItem value="Inactive">Inactive</MenuItem>
    </Select>
  </FormControl>
</Box>
```

## Visual Design

### Type-Based Styling

```typescript
const getTypeColor = (type: string) => {
  switch (type) {
    case 'User': return 'primary';
    case 'Group': return 'secondary';
    case 'Role': return 'info';
    default: return 'default';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'User': return <PersonIcon />;
    case 'Group': return <GroupIcon />;
    case 'Role': return <AdminPanelSettingsIcon />;
    default: return <PersonIcon />;
  }
};

const getStatusColor = (status: string) => {
  return status === 'Active' ? 'success' : 'error';
};
```

### Avatar Implementation

```typescript
<Avatar 
  sx={{ 
    bgcolor: `${getTypeColor(subject.type)}.main`,
    width: 40,
    height: 40
  }}
>
  {subject.type === 'User' 
    ? subject.name.charAt(0).toUpperCase()
    : getTypeIcon(subject.type)
  }
</Avatar>
```

## Statistics and Analytics

### Subject Statistics

```typescript
const calculateStats = useMemo(() => {
  return {
    total: subjects.length,
    active: subjects.filter(s => s.status === 'Active').length,
    inactive: subjects.filter(s => s.status === 'Inactive').length,
    users: subjects.filter(s => s.type === 'User').length,
    groups: subjects.filter(s => s.type === 'Group').length,
    roles: subjects.filter(s => s.type === 'Role').length,
    byDepartment: subjects.reduce((acc, subject) => {
      acc[subject.department] = (acc[subject.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}, [subjects]);

const stats = [
  { label: 'Total Subjects', value: calculateStats.total, color: 'primary' },
  { label: 'Active Users', value: calculateStats.active, color: 'success' },
  { label: 'Groups', value: calculateStats.groups, color: 'secondary' },
  { label: 'Online Now', value: '12', color: 'info' },
];
```

### Statistics Display

```typescript
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
```

## Form Validation

### Subject Validation Schema

```typescript
interface SubjectFormData {
  name: string;
  email: string;
  type: SubjectType;
  role: string;
  department: string;
  status: SubjectStatus;
  managerId?: string;
}

const validateSubject = (data: SubjectFormData): ValidationResult => {
  const errors: string[] = [];

  // Name validation
  if (!data.name.trim()) {
    errors.push('Name is required');
  } else if (data.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  // Email validation
  if (data.type === 'User' && !data.email.trim()) {
    errors.push('Email is required for users');
  } else if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  // Role validation
  if (!data.role.trim()) {
    errors.push('Role is required');
  }

  // Department validation
  if (!data.department.trim()) {
    errors.push('Department is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

## Responsive Design

### Breakpoint Management

```typescript
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
const isTablet = useMediaQuery(theme.breakpoints.down('md'));

return (
  <DashboardLayout>
    {isMobile ? (
      <SubjectCardGrid subjects={filteredSubjects} />
    ) : (
      <SubjectTable subjects={filteredSubjects} />
    )}
  </DashboardLayout>
);
```

### Mobile Optimization

```typescript
const SubjectCardGrid = ({ subjects }: { subjects: Subject[] }) => (
  <Grid container spacing={2}>
    {subjects.map(subject => (
      <Grid item xs={12} sm={6} key={subject.id}>
        <SubjectCard subject={subject} />
      </Grid>
    ))}
  </Grid>
);
```

## Accessibility Features

### Keyboard Navigation

```typescript
<TableRow
  hover
  tabIndex={0}
  role="button"
  onClick={() => handleSubjectClick(subject)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSubjectClick(subject);
    }
  }}
  aria-label={`View details for ${subject.name}`}
>
```

### Screen Reader Support

```typescript
<IconButton
  aria-label={`Edit ${subject.name}`}
  onClick={() => handleEdit(subject)}
>
  <EditIcon />
</IconButton>

<IconButton
  aria-label={`Delete ${subject.name}`}
  onClick={() => handleDelete(subject.id)}
>
  <DeleteIcon />
</IconButton>
```

## Integration with Backend

### API Endpoints

```typescript
const subjectApi = {
  // List all subjects
  list: (params?: QueryParams) => apiClient.get('/subjects', params),
  
  // Get subject by ID
  get: (id: string) => apiClient.get(`/subjects/${id}`),
  
  // Create new subject
  create: (data: Omit<Subject, 'id'>) => apiClient.post('/subjects', data),
  
  // Update subject
  update: (id: string, data: Partial<Subject>) => apiClient.put(`/subjects/${id}`, data),
  
  // Delete subject
  delete: (id: string) => apiClient.delete(`/subjects/${id}`),
  
  // Update subject status
  updateStatus: (id: string, status: SubjectStatus) => 
    apiClient.patch(`/subjects/${id}/status`, { status }),
  
  // Get subject permissions
  getPermissions: (id: string) => apiClient.get(`/subjects/${id}/permissions`),
};
```

### Data Synchronization

```typescript
useEffect(() => {
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjectApi.list({
        page,
        limit: rowsPerPage,
        ...filters,
      });
      
      if (response.success) {
        setSubjects(response.data.subjects);
        setTotalCount(response.data.total);
      } else {
        setError(response.error || 'Failed to fetch subjects');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  fetchSubjects();
}, [page, rowsPerPage, filters]);
```

## Performance Optimization

### Memoization

```typescript
const memoizedSubjects = useMemo(() => {
  return filteredSubjects.sort((a, b) => {
    if (a.status === 'Active' && b.status === 'Inactive') return -1;
    if (a.status === 'Inactive' && b.status === 'Active') return 1;
    return a.name.localeCompare(b.name);
  });
}, [filteredSubjects]);

const handleSearch = useCallback(
  debounce((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  }, 300),
  []
);
```

### Virtual Scrolling (for large datasets)

```typescript
import { FixedSizeList as List } from 'react-window';

const SubjectRow = ({ index, style }: { index: number; style: CSSProperties }) => (
  <div style={style}>
    <SubjectCard subject={subjects[index]} />
  </div>
);

<List
  height={600}
  itemCount={subjects.length}
  itemSize={120}
  width="100%"
>
  {SubjectRow}
</List>
```

## Testing

### Unit Tests

```typescript
describe('SubjectsPage', () => {
  test('renders subject list', () => {
    render(<SubjectsPage />);
    expect(screen.getByText('Subjects')).toBeInTheDocument();
  });

  test('filters subjects by type', () => {
    render(<SubjectsPage />);
    
    const typeFilter = screen.getByLabelText('Type');
    fireEvent.change(typeFilter, { target: { value: 'User' } });
    
    expect(screen.queryByText('User')).toBeInTheDocument();
  });

  test('opens create dialog', () => {
    render(<SubjectsPage />);
    
    fireEvent.click(screen.getByText('Add Subject'));
    expect(screen.getByText('Add New Subject')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
describe('Subject Management Integration', () => {
  test('creates new subject', async () => {
    const mockApiResponse = {
      success: true,
      data: { id: '123', name: 'Test User', type: 'User' }
    };
    
    jest.spyOn(apiClient, 'post').mockResolvedValue(mockApiResponse);
    
    render(<SubjectsPage />);
    
    fireEvent.click(screen.getByText('Add Subject'));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test User' }
    });
    fireEvent.click(screen.getByText('Create'));
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/subjects', expect.objectContaining({
        name: 'Test User'
      }));
    });
  });
});
```

## Best Practices

1. **Data Validation**: Validate all inputs before submission
2. **Error Handling**: Provide clear error messages and recovery options
3. **Performance**: Use pagination and virtual scrolling for large datasets
4. **Accessibility**: Ensure keyboard navigation and screen reader support
5. **Responsive Design**: Optimize for all screen sizes
6. **State Management**: Use proper state management patterns
7. **Security**: Validate permissions before allowing operations

## Future Enhancements

- **Bulk Operations**: Select and modify multiple subjects
- **Import/Export**: CSV/Excel import and export functionality
- **Advanced Permissions**: Fine-grained permission management
- **Audit Trail**: Track subject changes and activities
- **Integration**: LDAP/AD integration for user management
- **Profile Pictures**: Avatar upload and management
- **Two-Factor Auth**: MFA setup for user subjects