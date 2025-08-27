# User Management Documentation

The User Management module provides comprehensive user administration capabilities for the CRAFT backend system, including user authentication, profile management, and role-based access control.

## Overview

The user management system handles user registration, authentication, profile updates, and administrative operations while maintaining security through JWT tokens and password hashing. The system implements a three-tier role hierarchy: Super Admin, Admin, and Basic users, with strict role-based access control and automatic Basic role assignment for new registrations.

## Data Model

### User Schema

**Location**: `/src/models/User.ts`

```typescript
interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: string;
  department?: string;
  managerId?: string;
  attributes: Map<string, any>;
  active: boolean;
  lastLogin?: Date;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  generateAuthToken(): string;
  toJSON(): any;
}
```

### Schema Definition

```typescript
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (email: string) => validator.isEmail(email),
      message: 'Invalid email format',
    },
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['super_admin', 'admin', 'basic'],
    default: 'basic',
  },
  department: {
    type: String,
    trim: true,
    maxlength: [50, 'Department cannot exceed 50 characters'],
  },
  managerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  attributes: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map(),
  },
  active: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  loginCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  versionKey: false,
});
```

### Pre-save Middleware

```typescript
UserSchema.pre<IUser>('save', async function (next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with bcrypt
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});
```

### Instance Methods

#### Password Comparison

```typescript
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};
```

#### Token Generation

```typescript
UserSchema.methods.generateAuthToken = function (): string {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};
```

#### JSON Transformation

```typescript
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};
```

## Controller Implementation

### User Controller

**Location**: `/src/controllers/UserController.ts`

```typescript
export class UserController {
  // Get all users with pagination and filtering
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        department,
        active,
        search,
      } = req.query;

      const filter: any = {};
      
      // Apply filters
      if (role) filter.role = role;
      if (department) filter.department = department;
      if (active !== undefined) filter.active = active === 'true';
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password')
          .populate('managerId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        User.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'USER_FETCH_ERROR',
      });
    }
  }
}
```

#### Get User by ID

```typescript
static async getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID',
        code: 'INVALID_USER_ID',
      });
      return;
    }

    const user = await User.findById(id)
      .select('-password')
      .populate('managerId', 'name email department');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'USER_FETCH_ERROR',
    });
  }
}
```

#### Create User

```typescript
static async createUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, role, department, managerId, attributes } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
        code: 'MISSING_REQUIRED_FIELDS',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        code: 'USER_ALREADY_EXISTS',
      });
      return;
    }

    // Validate manager if provided
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        res.status(400).json({
          success: false,
          error: 'Invalid manager ID',
          code: 'INVALID_MANAGER_ID',
        });
        return;
      }
    }

    // Create new user
    const userData = {
      email: email.toLowerCase(),
      password,
      name: name.trim(),
      role: role || 'user',
      department,
      managerId,
      attributes: new Map(Object.entries(attributes || {})),
    };

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      success: true,
      data: user.toJSON(),
      message: 'User created successfully',
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        code: 'DUPLICATE_EMAIL',
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'USER_CREATION_ERROR',
      });
    }
  }
}
```

#### Update User

```typescript
static async updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID',
        code: 'INVALID_USER_ID',
      });
      return;
    }

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates._id;

    // Validate manager if being updated
    if (updates.managerId) {
      const manager = await User.findById(updates.managerId);
      if (!manager) {
        res.status(400).json({
          success: false,
          error: 'Invalid manager ID',
          code: 'INVALID_MANAGER_ID',
        });
        return;
      }
    }

    // Convert attributes to Map if provided
    if (updates.attributes) {
      updates.attributes = new Map(Object.entries(updates.attributes));
    }

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password').populate('managerId', 'name email');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'USER_UPDATE_ERROR',
    });
  }
}
```

#### Delete User

```typescript
static async deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID',
        code: 'INVALID_USER_ID',
      });
      return;
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'USER_DELETION_ERROR',
    });
  }
}
```

#### Change Password

```typescript
static async changePassword(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS',
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD',
      });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'PASSWORD_CHANGE_ERROR',
    });
  }
}
```

## Routes Configuration

**Location**: `/src/routes/userRoutes.ts`

```typescript
import express from 'express';
import { UserController } from '../controllers/UserController';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Public user routes (authenticated users)
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.put('/change-password', UserController.changePassword);

// Admin-only routes
router.use(adminAuth);
router.get('/', UserController.getUsers);
router.get('/:id', UserController.getUserById);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);
router.put('/:id/toggle-status', UserController.toggleUserStatus);

export default router;
```

## Middleware Integration

### Authentication Middleware

```typescript
// Check if user is authenticated
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token or user inactive',
        code: 'INVALID_TOKEN',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'TOKEN_VALIDATION_ERROR',
    });
  }
};
```

### Admin Authorization Middleware

```typescript
export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.',
      code: 'INSUFFICIENT_PRIVILEGES',
    });
  }
  next();
};
```

## Validation Schemas

### User Creation Validation

```typescript
import Joi from 'joi';

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().max(100).required(),
  role: Joi.string().valid('admin', 'manager', 'user').default('user'),
  department: Joi.string().max(50).optional(),
  managerId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  attributes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
});

export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  name: Joi.string().max(100).optional(),
  role: Joi.string().valid('admin', 'manager', 'user').optional(),
  department: Joi.string().max(50).optional(),
  managerId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  attributes: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  active: Joi.boolean().optional(),
});
```

## Service Layer

### User Service

```typescript
export class UserService {
  static async findUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() });
  }

  static async createUser(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  static async updateLoginStats(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      lastLogin: new Date(),
      $inc: { loginCount: 1 },
    });
  }

  static async getActiveUsers(): Promise<IUser[]> {
    return await User.find({ active: true }).select('-password');
  }

  static async getUsersByRole(role: string): Promise<IUser[]> {
    return await User.find({ role, active: true }).select('-password');
  }

  static async getUsersByDepartment(department: string): Promise<IUser[]> {
    return await User.find({ department, active: true }).select('-password');
  }

  static async deactivateUser(userId: string): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      userId,
      { active: false },
      { new: true }
    );
  }
}
```

## Error Handling

### Custom Error Classes

```typescript
export class UserError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'USER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'UserError';
  }
}

export class UserNotFoundError extends UserError {
  constructor() {
    super('User not found', 404, 'USER_NOT_FOUND');
  }
}

export class DuplicateUserError extends UserError {
  constructor() {
    super('User with this email already exists', 409, 'USER_ALREADY_EXISTS');
  }
}
```

## Database Indexes

```typescript
// Email index for unique constraint and fast lookups
UserSchema.index({ email: 1 }, { unique: true });

// Role index for filtering
UserSchema.index({ role: 1 });

// Department index for organizational queries
UserSchema.index({ department: 1 });

// Active status index for filtering active users
UserSchema.index({ active: 1 });

// Manager relationship index
UserSchema.index({ managerId: 1 });

// Compound index for complex queries
UserSchema.index({ role: 1, active: 1 });
UserSchema.index({ department: 1, active: 1 });
```

## Testing

### Unit Tests

```typescript
describe('User Model', () => {
  test('should create user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'user',
    };

    const user = new User(userData);
    await user.save();

    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
    expect(user.role).toBe('user');
    expect(user.active).toBe(true);
  });

  test('should hash password before saving', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const user = new User(userData);
    await user.save();

    expect(user.password).not.toBe('password123');
    expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$/);
  });

  test('should compare passwords correctly', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });
    await user.save();

    const isMatch = await user.comparePassword('password123');
    const isNotMatch = await user.comparePassword('wrongpassword');

    expect(isMatch).toBe(true);
    expect(isNotMatch).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('User Controller', () => {
  test('GET /api/v1/users should return paginated users', async () => {
    const response = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.users).toBeInstanceOf(Array);
    expect(response.body.data.pagination).toBeDefined();
  });

  test('POST /api/v1/users should create new user', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      role: 'user',
    };

    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('newuser@example.com');
    expect(response.body.data.password).toBeUndefined();
  });
});
```

## Security Considerations

### Password Security

- Passwords are hashed using bcrypt with salt rounds of 12
- Original passwords are never stored or returned in API responses
- Password comparison is done through bcrypt's secure comparison

### Data Sanitization

```typescript
import mongoSanitize from 'express-mongo-sanitize';

// Prevent NoSQL injection attacks
app.use(mongoSanitize());

// Additional sanitization in controller
const sanitizeUserInput = (input: any) => {
  if (typeof input === 'object') {
    for (const key in input) {
      if (typeof input[key] === 'string') {
        input[key] = input[key].trim();
      }
    }
  }
  return input;
};
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const createUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 user creation requests per windowMs
  message: 'Too many user creation attempts, try again later',
});

router.post('/', createUserLimiter, UserController.createUser);
```

## Performance Optimizations

### Query Optimization

```typescript
// Use projection to exclude password field
const users = await User.find({}).select('-password');

// Use lean() for read-only operations
const users = await User.find({}).select('-password').lean();

// Use aggregation for complex queries
const userStats = await User.aggregate([
  { $match: { active: true } },
  { $group: { _id: '$role', count: { $sum: 1 } } },
]);
```

### Caching Strategy

```typescript
import NodeCache from 'node-cache';

const userCache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL

export const getCachedUser = async (userId: string): Promise<IUser | null> => {
  const cacheKey = `user_${userId}`;
  let user = userCache.get(cacheKey) as IUser;

  if (!user) {
    user = await User.findById(userId).select('-password');
    if (user) {
      userCache.set(cacheKey, user);
    }
  }

  return user;
};
```

## Best Practices

1. **Data Validation**: Always validate input data before processing
2. **Error Handling**: Use consistent error response format
3. **Security**: Never expose passwords in API responses
4. **Performance**: Use database indexes for frequently queried fields
5. **Testing**: Write comprehensive unit and integration tests
6. **Logging**: Log important user actions for audit trails
7. **Caching**: Cache frequently accessed user data

## Future Enhancements

- **Two-Factor Authentication**: SMS or email-based 2FA
- **Social Login**: OAuth integration with Google, Facebook, etc.
- **User Groups**: Group-based permissions and management
- **Activity Logging**: Detailed audit trail of user actions
- **Password Policies**: Configurable password complexity requirements
- **Account Lockout**: Temporary lockout after failed login attempts