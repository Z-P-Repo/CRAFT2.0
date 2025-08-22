# Policy Management Documentation

The Policy Management module provides a comprehensive interface for creating, editing, and managing ABAC (Attribute-Based Access Control) policies in the CRAFT system.

## Overview

The policy management system allows administrators to define access control rules that determine whether a subject can perform a specific action on a particular object based on attributes and conditions.

## Component Structure

### PoliciesPage Component

**Location**: `/src/app/policies/page.tsx`

The main policy management interface with CRUD operations and visual analytics.

#### Features
- **Policy Listing**: Paginated table with search and filtering
- **CRUD Operations**: Create, read, update, delete policies
- **Status Management**: Active, Inactive, Draft policy states
- **Effect Types**: Allow/Deny policy effects
- **Statistics Dashboard**: Policy metrics and analytics
- **Responsive Design**: Works on all device sizes

## Data Models

### Policy Interface

```typescript
interface Policy {
  id: string;
  name: string;
  description: string;
  effect: 'Allow' | 'Deny';
  status: 'Active' | 'Inactive' | 'Draft';
  createdBy: string;
  createdAt: string;
  lastModified: string;
  priority?: number;
  conditions?: PolicyCondition[];
  subjects?: string[];
  objects?: string[];
  actions?: string[];
}
```

### Policy Condition

```typescript
interface PolicyCondition {
  attribute: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
  type: 'subject' | 'object' | 'environment' | 'action';
}
```

## User Interface

### Policy Table

```typescript
<TableContainer>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell>Description</TableCell>
        <TableCell>Effect</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Created By</TableCell>
        <TableCell>Last Modified</TableCell>
        <TableCell align="center">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {policies.map((policy) => (
        <TableRow key={policy.id} hover>
          {/* Table cells with policy data */}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### Statistics Cards

```typescript
const stats = [
  { label: 'Total Policies', value: policies.length, color: 'primary' },
  { label: 'Active', value: activeCount, color: 'success' },
  { label: 'Draft', value: draftCount, color: 'warning' },
  { label: 'This Month', value: monthlyCount, color: 'info' },
];
```

### Policy Dialog

```typescript
<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
  <DialogTitle>
    {selectedPolicy ? 'Edit Policy' : 'Create New Policy'}
  </DialogTitle>
  <DialogContent>
    <Grid container spacing={3}>
      {/* Form fields */}
    </Grid>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button variant="contained" onClick={handleSave}>
      {selectedPolicy ? 'Update' : 'Create'}
    </Button>
  </DialogActions>
</Dialog>
```

## State Management

### Local State

```typescript
const [policies, setPolicies] = useState<Policy[]>([]);
const [open, setOpen] = useState(false);
const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### CRUD Operations

#### Create Policy

```typescript
const handleCreatePolicy = async (policyData: Omit<Policy, 'id'>) => {
  try {
    setLoading(true);
    const response = await apiClient.post('/policies', policyData);
    
    if (response.success) {
      setPolicies(prev => [...prev, response.data]);
      setOpen(false);
      // Show success notification
    }
  } catch (error) {
    setError('Failed to create policy');
  } finally {
    setLoading(false);
  }
};
```

#### Update Policy

```typescript
const handleUpdatePolicy = async (id: string, updates: Partial<Policy>) => {
  try {
    setLoading(true);
    const response = await apiClient.put(`/policies/${id}`, updates);
    
    if (response.success) {
      setPolicies(prev => 
        prev.map(policy => 
          policy.id === id ? { ...policy, ...response.data } : policy
        )
      );
      setOpen(false);
    }
  } catch (error) {
    setError('Failed to update policy');
  } finally {
    setLoading(false);
  }
};
```

#### Delete Policy

```typescript
const handleDeletePolicy = async (id: string) => {
  try {
    setLoading(true);
    const response = await apiClient.delete(`/policies/${id}`);
    
    if (response.success) {
      setPolicies(prev => prev.filter(policy => policy.id !== id));
      // Show success notification
    }
  } catch (error) {
    setError('Failed to delete policy');
  } finally {
    setLoading(false);
  }
};
```

## Form Validation

### Policy Form Schema

```typescript
interface PolicyFormData {
  name: string;
  description: string;
  effect: 'Allow' | 'Deny';
  status: 'Active' | 'Inactive' | 'Draft';
  priority: number;
  conditions: PolicyCondition[];
}

const validatePolicy = (data: PolicyFormData): string[] => {
  const errors: string[] = [];
  
  if (!data.name.trim()) {
    errors.push('Policy name is required');
  }
  
  if (!data.description.trim()) {
    errors.push('Policy description is required');
  }
  
  if (data.priority < 1) {
    errors.push('Priority must be greater than 0');
  }
  
  return errors;
};
```

### Form Validation Implementation

```typescript
const [formData, setFormData] = useState<PolicyFormData>(initialFormData);
const [formErrors, setFormErrors] = useState<string[]>([]);

const handleSubmit = async () => {
  const errors = validatePolicy(formData);
  
  if (errors.length > 0) {
    setFormErrors(errors);
    return;
  }
  
  await handleCreatePolicy(formData);
};
```

## Status Management

### Status Color Mapping

```typescript
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
```

### Status Chips

```typescript
<Chip
  label={policy.status}
  size="small"
  color={getStatusColor(policy.status) as any}
/>

<Chip
  label={policy.effect}
  size="small"
  color={getEffectColor(policy.effect) as any}
/>
```

## Search and Filtering

### Filter Implementation

```typescript
const [filters, setFilters] = useState({
  status: 'all',
  effect: 'all',
  search: '',
});

const filteredPolicies = useMemo(() => {
  return policies.filter(policy => {
    const matchesStatus = filters.status === 'all' || 
                         policy.status === filters.status;
    
    const matchesEffect = filters.effect === 'all' || 
                         policy.effect === filters.effect;
    
    const matchesSearch = policy.name.toLowerCase()
                         .includes(filters.search.toLowerCase()) ||
                         policy.description.toLowerCase()
                         .includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesEffect && matchesSearch;
  });
}, [policies, filters]);
```

### Search Interface

```typescript
<TextField
  fullWidth
  label="Search policies..."
  value={filters.search}
  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon />
      </InputAdornment>
    ),
  }}
/>
```

## Pagination

### Pagination Implementation

```typescript
const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(10);

const paginatedPolicies = useMemo(() => {
  const startIndex = page * rowsPerPage;
  return filteredPolicies.slice(startIndex, startIndex + rowsPerPage);
}, [filteredPolicies, page, rowsPerPage]);

const handleChangePage = (event: unknown, newPage: number) => {
  setPage(newPage);
};

const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
  setRowsPerPage(parseInt(event.target.value, 10));
  setPage(0);
};
```

### Pagination Component

```typescript
<TablePagination
  rowsPerPageOptions={[5, 10, 25]}
  component="div"
  count={filteredPolicies.length}
  rowsPerPage={rowsPerPage}
  page={page}
  onPageChange={handleChangePage}
  onRowsPerPageChange={handleChangeRowsPerPage}
/>
```

## Responsive Design

### Breakpoint Handling

```typescript
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
const isTablet = useMediaQuery(theme.breakpoints.down('md'));

// Conditional rendering based on screen size
{isMobile ? (
  <PolicyCardView policies={policies} />
) : (
  <PolicyTableView policies={policies} />
)}
```

### Mobile Card View

```typescript
const PolicyCardView = ({ policies }: { policies: Policy[] }) => (
  <Grid container spacing={2}>
    {policies.map(policy => (
      <Grid item xs={12} sm={6} key={policy.id}>
        <Card>
          <CardContent>
            <Typography variant="h6">{policy.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {policy.description}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Chip label={policy.effect} size="small" />
              <Chip label={policy.status} size="small" />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);
```

## Error Handling

### Error Display

```typescript
{error && (
  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
    {error}
  </Alert>
)}
```

### Loading States

```typescript
{loading && (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
    <CircularProgress />
  </Box>
)}
```

## Accessibility

### Keyboard Navigation

```typescript
<TableRow
  hover
  onClick={() => handleRowClick(policy)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleRowClick(policy);
    }
  }}
  tabIndex={0}
  role="button"
  aria-label={`View policy ${policy.name}`}
>
```

### Screen Reader Support

```typescript
<IconButton
  aria-label={`Edit policy ${policy.name}`}
  onClick={() => handleEdit(policy)}
>
  <EditIcon />
</IconButton>

<IconButton
  aria-label={`Delete policy ${policy.name}`}
  onClick={() => handleDelete(policy.id)}
>
  <DeleteIcon />
</IconButton>
```

## Integration with Backend

### API Endpoints

```typescript
// Policy CRUD operations
const policyApi = {
  list: () => apiClient.get('/policies'),
  get: (id: string) => apiClient.get(`/policies/${id}`),
  create: (data: Omit<Policy, 'id'>) => apiClient.post('/policies', data),
  update: (id: string, data: Partial<Policy>) => apiClient.put(`/policies/${id}`, data),
  delete: (id: string) => apiClient.delete(`/policies/${id}`),
  evaluate: (evaluation: PolicyEvaluation) => apiClient.post('/policies/evaluate', evaluation),
};
```

### Data Synchronization

```typescript
useEffect(() => {
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await policyApi.list();
      
      if (response.success) {
        setPolicies(response.data);
      }
    } catch (error) {
      setError('Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  fetchPolicies();
}, []);
```

## Performance Optimization

### Memoization

```typescript
const memoizedPolicies = useMemo(() => {
  return policies.sort((a, b) => b.priority - a.priority);
}, [policies]);

const handleSearch = useCallback(
  debounce((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  }, 300),
  []
);
```

### Virtual Scrolling

```typescript
// For large datasets
import { FixedSizeList as List } from 'react-window';

const PolicyRow = ({ index, style }: { index: number; style: CSSProperties }) => (
  <div style={style}>
    <PolicyCard policy={policies[index]} />
  </div>
);

<List
  height={600}
  itemCount={policies.length}
  itemSize={120}
>
  {PolicyRow}
</List>
```

## Testing

### Unit Tests

```typescript
describe('PoliciesPage', () => {
  test('renders policy list', () => {
    render(<PoliciesPage />);
    expect(screen.getByText('Policies')).toBeInTheDocument();
  });

  test('opens create dialog', () => {
    render(<PoliciesPage />);
    fireEvent.click(screen.getByText('Create Policy'));
    expect(screen.getByText('Create New Policy')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
describe('Policy CRUD Operations', () => {
  test('creates new policy', async () => {
    render(<PoliciesPage />);
    
    fireEvent.click(screen.getByText('Create Policy'));
    fireEvent.change(screen.getByLabelText('Policy Name'), {
      target: { value: 'Test Policy' },
    });
    fireEvent.click(screen.getByText('Create'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Policy')).toBeInTheDocument();
    });
  });
});
```

## Best Practices

1. **Form Validation**: Always validate input before submission
2. **Error Handling**: Provide meaningful error messages
3. **Loading States**: Show progress indicators for async operations
4. **Accessibility**: Ensure keyboard navigation and screen reader support
5. **Performance**: Use pagination and virtualization for large datasets
6. **Responsive Design**: Adapt UI for different screen sizes

## Future Enhancements

- **Policy Versioning**: Track policy changes over time
- **Visual Policy Builder**: Drag-and-drop policy creation
- **Policy Templates**: Pre-defined policy templates
- **Bulk Operations**: Batch policy updates and deletions
- **Advanced Search**: Complex query builder
- **Policy Import/Export**: JSON/XML policy exchange