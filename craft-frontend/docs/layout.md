# Layout System Documentation

The CRAFT frontend uses a responsive dashboard layout with a collapsible sidebar navigation system built with Material-UI components.

## Overview

The layout system provides a professional, responsive interface that adapts to different screen sizes while maintaining usability and aesthetic appeal.

## Components

### DashboardLayout Component

**Location**: `/src/components/layout/DashboardLayout.tsx`

The main layout wrapper that provides the sidebar navigation and top app bar for all dashboard pages.

#### Props

```typescript
interface DashboardLayoutProps {
  children: ReactNode;
}
```

#### Features

- **Collapsible Sidebar**: 280px expanded, 64px collapsed
- **Responsive Design**: Mobile drawer on small screens
- **Active Page Highlighting**: Current route is highlighted in navigation
- **User Profile Section**: Avatar, name, and role display
- **Smooth Animations**: CSS transitions for collapsing/expanding

## Layout Structure

```
┌─────────────┬─────────────────────────────────┐
│             │         App Bar                 │
│   Sidebar   ├─────────────────────────────────┤
│             │                                 │
│ Navigation  │         Main Content            │
│             │                                 │
│   Links     │         Page Content            │
│             │                                 │
│ User Info   │                                 │
└─────────────┴─────────────────────────────────┘
```

## Responsive Breakpoints

### Desktop (≥ 960px)
- **Sidebar**: Persistent, collapsible
- **Width**: 280px expanded, 64px collapsed
- **Navigation**: Always visible

### Tablet (768px - 959px)
- **Sidebar**: Collapsible
- **Navigation**: Hamburger menu toggle

### Mobile (< 768px)
- **Sidebar**: Overlay drawer
- **Navigation**: Hidden by default, opens on menu button click

## Sidebar Navigation

### Menu Items

```typescript
const menuItems = [
  { text: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
  { text: 'Policies', icon: SecurityIcon, path: '/policies' },
  { text: 'Subjects', icon: PeopleIcon, path: '/subjects' },
  { text: 'Objects', icon: FolderIcon, path: '/objects' },
  { text: 'Actions', icon: ActionIcon, path: '/actions' },
  { text: 'Attributes', icon: AttributeIcon, path: '/attributes' },
  { text: 'Policy Tester', icon: TesterIcon, path: '/tester' },
];
```

### Active State Logic

```typescript
const isActive = pathname === item.path;
```

Active menu items are highlighted with:
- **Background**: Primary color
- **Text**: Primary contrast text
- **Font Weight**: 600 (bold)

## User Profile Section

Located at the bottom of the sidebar when expanded:

```typescript
<Box sx={{ p: 2 }}>
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
    <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
      {user?.name?.[0]?.toUpperCase()}
    </Avatar>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
        {user?.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        {user?.email}
      </Typography>
    </Box>
  </Box>
  <Chip
    label={user?.role?.toUpperCase()}
    size="small"
    color="primary"
    variant="outlined"
  />
</Box>
```

## App Bar

### Features
- **Fixed Position**: Stays at top during scroll
- **Dynamic Title**: Shows current page name
- **Profile Menu**: User account actions
- **Mobile Menu**: Hamburger menu for mobile

### Implementation

```typescript
<AppBar
  position="fixed"
  sx={{
    width: { md: `calc(100% - ${drawerWidth}px)` },
    ml: { md: `${drawerWidth}px` },
    bgcolor: 'background.paper',
    color: 'text.primary',
    boxShadow: 1,
  }}
>
  <Toolbar>
    <IconButton onClick={handleDrawerToggle} sx={{ display: { md: 'none' } }}>
      <MenuIcon />
    </IconButton>
    <Typography variant="h6" sx={{ flexGrow: 1 }}>
      {currentPageTitle}
    </Typography>
    <IconButton onClick={handleProfileMenuOpen}>
      <AccountCircle />
    </IconButton>
  </Toolbar>
</AppBar>
```

## State Management

### Drawer State

```typescript
const [drawerOpen, setDrawerOpen] = useState(!isMobile);
const [collapsed, setCollapsed] = useState(false);
```

### Responsive Logic

```typescript
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('md'));

useEffect(() => {
  if (isMobile) {
    setCollapsed(false);
    setDrawerOpen(false);
  }
}, [isMobile]);
```

## Styling and Theming

### CSS-in-JS with Material-UI

```typescript
const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

sx={{
  '& .MuiDrawer-paper': {
    boxSizing: 'border-box',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
}}
```

### Animation Transitions

```typescript
transition: theme.transitions.create('width', {
  easing: theme.transitions.easing.sharp,
  duration: theme.transitions.duration.enteringScreen,
})
```

## Usage

### Basic Implementation

```typescript
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function MyPage() {
  return (
    <DashboardLayout>
      <Typography variant="h4">Page Content</Typography>
      {/* Your page content here */}
    </DashboardLayout>
  );
}
```

### Page Structure

```typescript
export default function ExamplePage() {
  return (
    <DashboardLayout>
      {/* Page Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4">Page Title</Typography>
      </Paper>
      
      {/* Page Content */}
      <Grid container spacing={3}>
        {/* Content cards and components */}
      </Grid>
    </DashboardLayout>
  );
}
```

## Accessibility

### Keyboard Navigation
- **Tab Navigation**: All interactive elements are keyboard accessible
- **Focus Management**: Proper focus indicators
- **Screen Reader Support**: ARIA labels and roles

### ARIA Labels

```typescript
<IconButton
  aria-label="open drawer"
  onClick={handleDrawerToggle}
>
  <MenuIcon />
</IconButton>
```

## Performance Considerations

### Lazy Loading
- Navigation icons are imported as needed
- Page components use dynamic imports

### Memoization
- Expensive calculations are memoized
- Callback functions use useCallback

### Bundle Optimization
- Tree shaking for unused Material-UI components
- Code splitting at route level

## Customization

### Drawer Width

```typescript
const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 64;
```

### Theme Integration

```typescript
const theme = createTheme({
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          // Custom drawer styles
        },
      },
    },
  },
});
```

## Troubleshooting

### Common Issues

1. **Drawer not responsive**: Check breakpoint configuration
2. **Navigation icons missing**: Verify Material-UI icon imports
3. **Spacing issues**: Check sx prop usage and theme spacing

### Debug Tips

```typescript
// Log current breakpoint
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('md'));
console.log('Is mobile:', isMobile);

// Log drawer state
console.log('Drawer open:', drawerOpen, 'Collapsed:', collapsed);
```

## Best Practices

1. **Consistent Spacing**: Use theme spacing units
2. **Responsive Design**: Test on different screen sizes
3. **Accessibility**: Include proper ARIA labels
4. **Performance**: Minimize re-renders with proper state management
5. **Theme Integration**: Use theme variables for consistency

## Future Enhancements

- **Dark Mode Support**: Toggle between light and dark themes
- **Customizable Sidebar**: User-configurable navigation
- **Breadcrumb Navigation**: Show page hierarchy
- **Search Integration**: Global search in app bar