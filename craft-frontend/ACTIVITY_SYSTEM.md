# Activity System Documentation

## Overview

The Activity System is a comprehensive audit logging and monitoring solution for the CRAFT Permission System. It tracks all significant events, user actions, and system changes across the application, providing complete visibility into system operations for security, compliance, and debugging purposes.

## Features

### 🔍 **Comprehensive Tracking**
- Authentication events (login, logout, password changes)
- Authorization decisions (access granted/denied)
- Policy management operations (create, update, delete)
- User management activities
- Resource management changes
- System configuration updates
- Security events and violations
- Data modification tracking

### 📊 **Professional Dashboard**
- Real-time activity feed with detailed information
- Statistical overview with key metrics
- Advanced filtering and search capabilities
- Activity categorization with color-coded severity levels
- Detailed activity views with contextual information

### 🏷️ **Smart Categorization**
- **Security**: Authentication, authorization, security events
- **Administration**: User/policy/resource management
- **Compliance**: Audit trails, compliance checks
- **Operation**: Data operations, system operations
- **Configuration**: System settings, configuration changes
- **Integration**: API calls, external system interactions
- **Monitoring**: Health checks, performance metrics
- **User Activity**: Individual user actions and behaviors

### 🚨 **Severity Levels**
- **Low**: Routine operations (login, data read)
- **Medium**: Administrative changes (user updates, policy modifications)
- **High**: Significant security events (access violations)
- **Critical**: System compromise, data breaches

## Architecture

### Data Model

```typescript
interface Activity {
  _id?: string;
  type: ActivityType;           // Type of activity
  category: ActivityCategory;   // Categorization for filtering
  action: string;              // Specific action performed
  resource: {                  // Resource affected
    type: string;
    id: string;
    name: string;
  };
  actor: {                     // Who performed the action
    id: string;
    name: string;
    email: string;
    type: 'user' | 'system' | 'service';
  };
  target?: {                   // Target of the action (optional)
    type: string;
    id: string;
    name: string;
  };
  description: string;         // Human-readable description
  timestamp: string;           // When the activity occurred
  severity: ActivitySeverity;  // Importance level
  metadata?: {                 // Additional context
    changes?: Record<string, { from: any; to: any }>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    status?: 'success' | 'failure' | 'pending';
    errorMessage?: string;
  };
  tags?: string[];            // Searchable tags
}
```

### Service Layer

The `ActivityService` provides a singleton instance for easy activity tracking:

```typescript
import activityService, { trackAuth, trackPolicy } from '@/lib/activityService';

// Track authentication
await trackAuth('login', true);

// Track policy changes
await trackPolicy('created', 'policy-123', 'New Security Policy');

// Track custom activities
await activityService.track({
  type: 'security_event',
  category: 'security',
  action: 'suspicious_activity',
  description: 'Multiple failed login attempts detected',
  severity: 'high',
  metadata: { attempts: 5, timeWindow: '5min' }
});
```

## Usage Examples

### 1. Authentication Tracking

```typescript
// In login component
import { trackAuth } from '@/lib/activityService';

const handleLogin = async (credentials) => {
  try {
    const result = await login(credentials);
    await trackAuth('login', true);
    return result;
  } catch (error) {
    await trackAuth('login', false);
    throw error;
  }
};
```

### 2. Policy Management Tracking

```typescript
// In policy management component
import { trackPolicy } from '@/lib/activityService';

const createPolicy = async (policyData) => {
  const newPolicy = await api.createPolicy(policyData);
  await trackPolicy('created', newPolicy.id, newPolicy.name);
  return newPolicy;
};
```

### 3. Authorization Tracking

```typescript
// In permission check middleware
import { trackAuthz } from '@/lib/activityService';

const checkPermission = async (resource, action) => {
  const granted = await evaluatePolicy(resource, action);
  await trackAuthz(resource, action, granted);
  return granted;
};
```

### 4. Security Event Tracking

```typescript
// In security monitoring
import { trackSecurity } from '@/lib/activityService';

const detectSuspiciousActivity = async (event) => {
  await trackSecurity(
    'suspicious_login_pattern',
    `Detected ${event.attempts} failed login attempts from ${event.ip}`,
    'high'
  );
};
```

## API Integration

### Backend Endpoints

The system expects the following API endpoints:

```
GET    /api/v1/activities              # Get activities with filters
GET    /api/v1/activities/:id          # Get specific activity
POST   /api/v1/activities              # Create new activity
GET    /api/v1/activities/stats        # Get activity statistics
POST   /api/v1/activities/export       # Export activities
```

### Request/Response Examples

**Get Activities:**
```http
GET /api/v1/activities?page=1&limit=25&category=security&severity=high
```

**Create Activity:**
```http
POST /api/v1/activities
Content-Type: application/json

{
  "type": "authentication",
  "category": "security",
  "action": "login",
  "description": "User successfully logged in",
  "severity": "low",
  "actor": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com",
    "type": "user"
  },
  "resource": {
    "type": "system",
    "id": "auth-system",
    "name": "Authentication System"
  }
}
```

## UI Components

### Activity Page (`/activity`)
- Comprehensive activity dashboard
- Real-time activity feed
- Advanced filtering and search
- Statistics overview
- Export functionality

### Activity Detail Modal
- Detailed view of individual activities
- Actor, resource, and target information
- Metadata and context details
- Timeline information

### Key Features:
- **Search**: Full-text search across descriptions, actors, resources
- **Filters**: Category, severity, type, date range filtering
- **Pagination**: Efficient handling of large activity datasets
- **Real-time Updates**: Live activity feed updates
- **Export**: CSV/JSON export functionality
- **Responsive Design**: Works on desktop and mobile devices

## Performance Considerations

### Batch Processing
- Activities are queued and sent in batches every 5 seconds
- High/critical severity activities are sent immediately
- Failed requests are retried with exponential backoff

### Client-Side Optimizations
- Virtualized table for large datasets
- Debounced search input
- Memoized filter computations
- Lazy loading of activity details

### Server-Side Recommendations
- Index on timestamp, category, severity, and actor.id
- Implement activity retention policies
- Use background processing for heavy analytics
- Consider archiving old activities

## Configuration

### Environment Variables
```env
# Activity tracking
NEXT_PUBLIC_ACTIVITY_ENABLED=true
NEXT_PUBLIC_ACTIVITY_BATCH_SIZE=10
NEXT_PUBLIC_ACTIVITY_FLUSH_INTERVAL=5000

# API endpoints
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Activity Service Configuration
```typescript
// Disable activity tracking in development
activityService.setEnabled(process.env.NODE_ENV === 'production');
```

## Security Considerations

### Data Privacy
- Sensitive information is never logged in activity descriptions
- Personal data is sanitized before logging
- Activity data follows data retention policies

### Access Control
- Activity viewing requires appropriate permissions
- Sensitive activities have restricted visibility
- Audit logs are tamper-evident

### Performance Impact
- Minimal performance overhead through async processing
- Batch processing reduces server load
- Client-side queuing prevents UI blocking

## Compliance Features

### Audit Trail
- Complete audit trail of all system changes
- Immutable activity records
- Cryptographic integrity verification

### Reporting
- Compliance reports generation
- Activity trend analysis
- Security incident tracking

### Data Retention
- Configurable retention periods
- Automated archiving
- Secure data deletion

## Troubleshooting

### Common Issues

1. **Activities not appearing**
   - Check if activity service is enabled
   - Verify API endpoint connectivity
   - Check browser console for errors

2. **Performance issues**
   - Reduce batch size
   - Increase flush interval
   - Implement pagination on backend

3. **Missing activity details**
   - Ensure all required fields are provided
   - Check metadata serialization
   - Verify timestamp format

### Debugging

```typescript
// Enable debug logging
localStorage.setItem('debug', 'activity:*');

// Check activity queue
console.log(activityService.queue);

// Test connectivity
await apiClient.healthCheck();
```

## Future Enhancements

### Planned Features
- Real-time notifications for critical activities
- Machine learning for anomaly detection
- Advanced analytics dashboard
- Integration with SIEM systems
- Mobile app support

### Extensibility
- Plugin system for custom activity types
- Webhook support for external integrations
- Custom dashboard widgets
- Advanced filtering rules

## Support

For issues or questions about the Activity System:
1. Check this documentation
2. Review the codebase comments
3. Test with mock data first
4. Check browser console for errors
5. Verify API endpoint responses

The Activity System provides comprehensive visibility into your CRAFT Permission System, enabling better security, compliance, and operational insights.