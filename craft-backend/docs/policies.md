# Policy Engine Documentation

The CRAFT backend policy engine provides comprehensive Attribute-Based Access Control (ABAC) functionality for evaluating access decisions based on subject, object, action, and environment attributes.

## Overview

The policy engine is the core component that evaluates access control policies to determine whether a subject can perform a specific action on a particular object under given environmental conditions. It supports complex rule evaluation, policy combinations, and real-time decision making.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Policy Routes  │───▶│PolicyController │───▶│  PolicyService  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Policy Engine   │    │ Rule Evaluator  │    │PolicyRepository │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Decision Cache  │    │ Attribute Store │    │  Policy Model   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### PolicyController

**Location**: `/src/controllers/PolicyController.ts`

Handles HTTP requests for policy operations and evaluation.

```typescript
class PolicyController {
  private policyService: PolicyService;

  constructor() {
    this.policyService = new PolicyService();
  }

  // Create new policy
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const policyData = req.body;
    const result = await this.policyService.createPolicy(policyData);

    if (!result.success) {
      res.status(result.statusCode || 500).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      data: result.data,
    });
  });

  // Evaluate policy decision
  evaluate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { subject, action, object, environment } = req.body;

    const result = await this.policyService.evaluateAccess({
      subject,
      action,
      object,
      environment,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}
```

### PolicyService

**Location**: `/src/services/PolicyService.ts`

Contains business logic for policy management and evaluation.

```typescript
class PolicyService {
  private policyRepository: PolicyRepository;
  private policyEngine: PolicyEngine;
  private attributeService: AttributeService;

  constructor() {
    this.policyRepository = new PolicyRepository();
    this.policyEngine = new PolicyEngine();
    this.attributeService = new AttributeService();
  }

  async evaluateAccess(request: AccessRequest): Promise<PolicyDecision> {
    try {
      // Get applicable policies
      const policies = await this.getApplicablePolicies(request);

      // Evaluate each policy
      const evaluations: PolicyEvaluation[] = [];
      
      for (const policy of policies) {
        const evaluation = await this.policyEngine.evaluate(policy, request);
        evaluations.push(evaluation);
      }

      // Combine policy decisions
      const decision = this.combineDecisions(evaluations);

      // Log the decision
      logger.info('Access decision made', {
        subject: request.subject,
        action: request.action,
        object: request.object,
        decision: decision.decision,
        policies: evaluations.length,
      });

      return decision;
    } catch (error) {
      logger.error('Policy evaluation error:', error);
      throw new PolicyEvaluationError('Failed to evaluate access');
    }
  }
}
```

## Data Models

### Policy Model

**Location**: `/src/models/Policy.ts`

```typescript
interface IPolicy {
  _id: string;
  name: string;
  description: string;
  effect: PolicyEffect; // 'Allow' | 'Deny'
  status: PolicyStatus; // 'Active' | 'Inactive' | 'Draft'
  priority: number;
  version: number;
  
  // Policy components
  subjects: SubjectRule[];
  objects: ObjectRule[];
  actions: ActionRule[];
  conditions: ConditionRule[];
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastEvaluated?: Date;
}

const PolicySchema = new mongoose.Schema<IPolicy>({
  name: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  effect: {
    type: String,
    enum: ['Allow', 'Deny'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Draft'],
    default: 'Draft',
  },
  priority: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  subjects: [SubjectRuleSchema],
  objects: [ObjectRuleSchema],
  actions: [ActionRuleSchema],
  conditions: [ConditionRuleSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});
```

### Rule Schemas

```typescript
// Subject Rule
interface SubjectRule {
  type: 'user' | 'group' | 'role';
  identifier: string;
  attributes?: AttributeCondition[];
}

// Object Rule  
interface ObjectRule {
  type: 'resource' | 'data' | 'service';
  identifier: string;
  path?: string;
  attributes?: AttributeCondition[];
}

// Action Rule
interface ActionRule {
  name: string;
  parameters?: Record<string, any>;
}

// Condition Rule
interface ConditionRule {
  attribute: string;
  operator: ComparisonOperator;
  value: any;
  type: AttributeType;
}
```

## Policy Engine

### Core Engine Implementation

```typescript
class PolicyEngine {
  private ruleEvaluator: RuleEvaluator;
  private attributeResolver: AttributeResolver;

  constructor() {
    this.ruleEvaluator = new RuleEvaluator();
    this.attributeResolver = new AttributeResolver();
  }

  async evaluate(policy: IPolicy, request: AccessRequest): Promise<PolicyEvaluation> {
    const startTime = Date.now();

    try {
      // Check if policy is active
      if (policy.status !== 'Active') {
        return {
          policyId: policy._id,
          decision: PolicyDecision.NotApplicable,
          reason: 'Policy is not active',
          executionTime: Date.now() - startTime,
        };
      }

      // Evaluate subject rules
      const subjectMatch = await this.evaluateSubjectRules(
        policy.subjects, 
        request.subject
      );

      if (!subjectMatch.matches) {
        return {
          policyId: policy._id,
          decision: PolicyDecision.NotApplicable,
          reason: `Subject does not match: ${subjectMatch.reason}`,
          executionTime: Date.now() - startTime,
        };
      }

      // Evaluate object rules
      const objectMatch = await this.evaluateObjectRules(
        policy.objects, 
        request.object
      );

      if (!objectMatch.matches) {
        return {
          policyId: policy._id,
          decision: PolicyDecision.NotApplicable,
          reason: `Object does not match: ${objectMatch.reason}`,
          executionTime: Date.now() - startTime,
        };
      }

      // Evaluate action rules
      const actionMatch = await this.evaluateActionRules(
        policy.actions, 
        request.action
      );

      if (!actionMatch.matches) {
        return {
          policyId: policy._id,
          decision: PolicyDecision.NotApplicable,
          reason: `Action does not match: ${actionMatch.reason}`,
          executionTime: Date.now() - startTime,
        };
      }

      // Evaluate conditions
      const conditionResult = await this.evaluateConditions(
        policy.conditions,
        request
      );

      const decision = conditionResult.satisfied 
        ? policy.effect === 'Allow' 
          ? PolicyDecision.Allow 
          : PolicyDecision.Deny
        : PolicyDecision.NotApplicable;

      return {
        policyId: policy._id,
        policyName: policy.name,
        decision,
        reason: conditionResult.reason,
        matchedRules: [
          ...subjectMatch.matchedRules,
          ...objectMatch.matchedRules,
          ...actionMatch.matchedRules,
        ],
        failedRules: conditionResult.failedRules,
        executionTime: Date.now() - startTime,
      };

    } catch (error) {
      logger.error(`Policy evaluation error for ${policy.name}:`, error);
      return {
        policyId: policy._id,
        decision: PolicyDecision.Indeterminate,
        reason: 'Policy evaluation failed',
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }
}
```

## Rule Evaluation

### Subject Rule Evaluation

```typescript
async evaluateSubjectRules(
  rules: SubjectRule[], 
  subject: AccessSubject
): Promise<RuleEvaluationResult> {
  const matchedRules: string[] = [];
  
  for (const rule of rules) {
    let matches = false;
    
    switch (rule.type) {
      case 'user':
        matches = subject.id === rule.identifier;
        break;
        
      case 'group':
        matches = subject.groups?.includes(rule.identifier) || false;
        break;
        
      case 'role':
        matches = subject.role === rule.identifier;
        break;
    }
    
    // Evaluate attribute conditions if subject matches
    if (matches && rule.attributes) {
      const attributeResult = await this.evaluateAttributeConditions(
        rule.attributes,
        subject.attributes || {}
      );
      matches = attributeResult.satisfied;
    }
    
    if (matches) {
      matchedRules.push(`${rule.type}:${rule.identifier}`);
      return {
        matches: true,
        matchedRules,
        reason: `Subject matches ${rule.type} ${rule.identifier}`,
      };
    }
  }
  
  return {
    matches: false,
    matchedRules: [],
    reason: 'No subject rules matched',
  };
}
```

### Object Rule Evaluation

```typescript
async evaluateObjectRules(
  rules: ObjectRule[], 
  object: AccessObject
): Promise<RuleEvaluationResult> {
  const matchedRules: string[] = [];
  
  for (const rule of rules) {
    let matches = false;
    
    // Check object type
    if (rule.type !== object.type) {
      continue;
    }
    
    // Check identifier (exact match or wildcard)
    if (rule.identifier === '*' || object.id === rule.identifier) {
      matches = true;
    }
    
    // Check path pattern if specified
    if (matches && rule.path && object.path) {
      matches = this.matchPath(rule.path, object.path);
    }
    
    // Evaluate attribute conditions
    if (matches && rule.attributes) {
      const attributeResult = await this.evaluateAttributeConditions(
        rule.attributes,
        object.attributes || {}
      );
      matches = attributeResult.satisfied;
    }
    
    if (matches) {
      matchedRules.push(`${rule.type}:${rule.identifier}`);
      return {
        matches: true,
        matchedRules,
        reason: `Object matches ${rule.type} ${rule.identifier}`,
      };
    }
  }
  
  return {
    matches: false,
    matchedRules: [],
    reason: 'No object rules matched',
  };
}
```

### Condition Evaluation

```typescript
async evaluateConditions(
  conditions: ConditionRule[],
  request: AccessRequest
): Promise<ConditionEvaluationResult> {
  const satisfiedConditions: string[] = [];
  const failedConditions: string[] = [];
  
  for (const condition of conditions) {
    const result = await this.evaluateCondition(condition, request);
    
    if (result.satisfied) {
      satisfiedConditions.push(condition.attribute);
    } else {
      failedConditions.push(`${condition.attribute} ${condition.operator} ${condition.value}`);
    }
  }
  
  // All conditions must be satisfied (AND logic)
  const allSatisfied = failedConditions.length === 0;
  
  return {
    satisfied: allSatisfied,
    satisfiedConditions,
    failedRules: failedConditions,
    reason: allSatisfied 
      ? 'All conditions satisfied' 
      : `Failed conditions: ${failedConditions.join(', ')}`,
  };
}

async evaluateCondition(
  condition: ConditionRule,
  request: AccessRequest
): Promise<{ satisfied: boolean; reason: string }> {
  // Resolve attribute value from request context
  const actualValue = await this.attributeResolver.resolve(
    condition.attribute,
    request
  );
  
  if (actualValue === undefined || actualValue === null) {
    return {
      satisfied: false,
      reason: `Attribute ${condition.attribute} not found`,
    };
  }
  
  // Evaluate condition based on operator
  const satisfied = this.compareValues(
    actualValue,
    condition.value,
    condition.operator
  );
  
  return {
    satisfied,
    reason: satisfied 
      ? `${condition.attribute} ${condition.operator} ${condition.value}` 
      : `${condition.attribute} (${actualValue}) does not ${condition.operator} ${condition.value}`,
  };
}
```

## Decision Combining

### Policy Combining Algorithm

```typescript
combineDecisions(evaluations: PolicyEvaluation[]): PolicyDecision {
  // Filter applicable policies
  const applicablePolicies = evaluations.filter(
    e => e.decision !== PolicyDecision.NotApplicable
  );
  
  if (applicablePolicies.length === 0) {
    return {
      decision: PolicyDecision.Deny,
      reason: 'No applicable policies found',
      evaluatedPolicies: evaluations.length,
      applicablePolicies: 0,
    };
  }
  
  // Check for any explicit deny (deny-overrides)
  const denyPolicies = applicablePolicies.filter(
    e => e.decision === PolicyDecision.Deny
  );
  
  if (denyPolicies.length > 0) {
    return {
      decision: PolicyDecision.Deny,
      reason: `Denied by policy: ${denyPolicies[0].policyName}`,
      evaluatedPolicies: evaluations.length,
      applicablePolicies: applicablePolicies.length,
      matchedPolicies: denyPolicies.map(p => p.policyName),
    };
  }
  
  // Check for any allow
  const allowPolicies = applicablePolicies.filter(
    e => e.decision === PolicyDecision.Allow
  );
  
  if (allowPolicies.length > 0) {
    return {
      decision: PolicyDecision.Allow,
      reason: `Allowed by policy: ${allowPolicies[0].policyName}`,
      evaluatedPolicies: evaluations.length,
      applicablePolicies: applicablePolicies.length,
      matchedPolicies: allowPolicies.map(p => p.policyName),
    };
  }
  
  // All policies are indeterminate
  return {
    decision: PolicyDecision.Deny,
    reason: 'All applicable policies are indeterminate',
    evaluatedPolicies: evaluations.length,
    applicablePolicies: applicablePolicies.length,
  };
}
```

## Attribute Resolution

### AttributeResolver Implementation

```typescript
class AttributeResolver {
  private attributeStore: AttributeStore;

  constructor() {
    this.attributeStore = new AttributeStore();
  }

  async resolve(attributePath: string, context: AccessRequest): Promise<any> {
    const [category, ...path] = attributePath.split('.');
    
    switch (category) {
      case 'subject':
        return this.resolveSubjectAttribute(path, context.subject);
        
      case 'object':
        return this.resolveObjectAttribute(path, context.object);
        
      case 'action':
        return this.resolveActionAttribute(path, context.action);
        
      case 'environment':
        return this.resolveEnvironmentAttribute(path, context.environment);
        
      default:
        throw new Error(`Unknown attribute category: ${category}`);
    }
  }

  private resolveSubjectAttribute(path: string[], subject: AccessSubject): any {
    const [attribute, ...subPath] = path;
    
    switch (attribute) {
      case 'id':
        return subject.id;
      case 'role':
        return subject.role;
      case 'groups':
        return subject.groups;
      case 'department':
        return subject.attributes?.department;
      default:
        return this.getNestedValue(subject.attributes, [attribute, ...subPath]);
    }
  }

  private getNestedValue(obj: any, path: string[]): any {
    return path.reduce((current, key) => current?.[key], obj);
  }
}
```

## Caching

### Decision Caching

```typescript
class PolicyDecisionCache {
  private cache: Map<string, CachedDecision>;
  private ttl: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cache = new Map();
    
    // Clean expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  generateKey(request: AccessRequest): string {
    return `${request.subject.id}:${request.action}:${request.object.id}`;
  }

  get(request: AccessRequest): PolicyDecision | null {
    const key = this.generateKey(request);
    const cached = this.cache.get(key);
    
    if (!cached || Date.now() - cached.timestamp > this.ttl) {
      return null;
    }
    
    return cached.decision;
  }

  set(request: AccessRequest, decision: PolicyDecision): void {
    const key = this.generateKey(request);
    
    this.cache.set(key, {
      decision,
      timestamp: Date.now(),
    });
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
```

## API Endpoints

### Policy Management

```typescript
// Get all policies
router.get('/policies', authenticate, authorize(['admin', 'manager']), policyController.list);

// Get policy by ID
router.get('/policies/:id', authenticate, policyController.get);

// Create new policy
router.post('/policies', authenticate, authorize(['admin']), policyController.create);

// Update policy
router.put('/policies/:id', authenticate, authorize(['admin']), policyController.update);

// Delete policy
router.delete('/policies/:id', authenticate, authorize(['admin']), policyController.delete);

// Evaluate access request
router.post('/policies/evaluate', authenticate, policyController.evaluate);

// Test policy
router.post('/policies/:id/test', authenticate, policyController.test);
```

### Request/Response Examples

#### Policy Evaluation Request

```json
POST /api/v1/policies/evaluate
{
  "subject": {
    "id": "user123",
    "role": "manager",
    "groups": ["sales_team"],
    "attributes": {
      "department": "sales",
      "clearance": 3
    }
  },
  "action": "read",
  "object": {
    "id": "document456",
    "type": "resource",
    "path": "/documents/sales/report.pdf",
    "attributes": {
      "classification": "internal",
      "owner": "sales_team"
    }
  },
  "environment": {
    "time": "2024-01-21T10:30:00Z",
    "ip": "192.168.1.100",
    "location": "office"
  }
}
```

#### Policy Evaluation Response

```json
{
  "success": true,
  "data": {
    "decision": "Allow",
    "reason": "Allowed by policy: Sales Team Access",
    "evaluatedPolicies": 5,
    "applicablePolicies": 2,
    "matchedPolicies": ["Sales Team Access"],
    "executionTime": 45,
    "details": {
      "matchedRules": [
        "role:manager",
        "resource:document456"
      ],
      "satisfiedConditions": [
        "subject.department == 'sales'",
        "object.classification != 'confidential'"
      ]
    }
  }
}
```

## Performance Optimization

### Query Optimization

```typescript
// Index for efficient policy lookup
PolicySchema.index({ status: 1, priority: -1 });
PolicySchema.index({ 'subjects.identifier': 1, status: 1 });
PolicySchema.index({ 'objects.identifier': 1, status: 1 });

// Compound index for evaluation queries
PolicySchema.index({
  status: 1,
  'subjects.identifier': 1,
  'actions.name': 1,
  priority: -1
});
```

### Batch Evaluation

```typescript
async evaluateBatch(requests: AccessRequest[]): Promise<PolicyDecision[]> {
  const results = await Promise.allSettled(
    requests.map(request => this.evaluateAccess(request))
  );
  
  return results.map(result => 
    result.status === 'fulfilled' 
      ? result.value 
      : { decision: PolicyDecision.Indeterminate, reason: 'Evaluation failed' }
  );
}
```

## Monitoring and Metrics

### Policy Performance Metrics

```typescript
class PolicyMetrics {
  private metrics: Map<string, PolicyMetric>;

  recordEvaluation(policyId: string, executionTime: number, decision: string): void {
    const metric = this.metrics.get(policyId) || {
      policyId,
      evaluationCount: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      decisions: { Allow: 0, Deny: 0, NotApplicable: 0 },
    };

    metric.evaluationCount++;
    metric.totalExecutionTime += executionTime;
    metric.averageExecutionTime = metric.totalExecutionTime / metric.evaluationCount;
    metric.decisions[decision]++;

    this.metrics.set(policyId, metric);
  }

  getMetrics(): PolicyMetric[] {
    return Array.from(this.metrics.values());
  }
}
```

## Testing

### Unit Tests

```typescript
describe('PolicyEngine', () => {
  describe('evaluate', () => {
    test('should allow access when all conditions match', async () => {
      const policy = createMockPolicy({
        effect: 'Allow',
        subjects: [{ type: 'role', identifier: 'manager' }],
        objects: [{ type: 'resource', identifier: 'document123' }],
        actions: [{ name: 'read' }],
        conditions: [
          {
            attribute: 'subject.department',
            operator: 'equals',
            value: 'sales',
            type: 'string'
          }
        ]
      });

      const request = createMockRequest({
        subject: { role: 'manager', attributes: { department: 'sales' } },
        action: 'read',
        object: { id: 'document123', type: 'resource' }
      });

      const result = await policyEngine.evaluate(policy, request);

      expect(result.decision).toBe(PolicyDecision.Allow);
      expect(result.matchedRules).toContain('role:manager');
    });

    test('should deny access when conditions fail', async () => {
      const policy = createMockPolicy({
        effect: 'Allow',
        conditions: [
          {
            attribute: 'subject.clearance',
            operator: 'greater_than',
            value: 5,
            type: 'number'
          }
        ]
      });

      const request = createMockRequest({
        subject: { attributes: { clearance: 3 } }
      });

      const result = await policyEngine.evaluate(policy, request);

      expect(result.decision).toBe(PolicyDecision.NotApplicable);
      expect(result.failedRules).toContain('subject.clearance greater_than 5');
    });
  });
});
```

### Integration Tests

```typescript
describe('Policy Evaluation API', () => {
  test('POST /policies/evaluate should return access decision', async () => {
    const request = {
      subject: { id: 'user123', role: 'user' },
      action: 'read',
      object: { id: 'doc123', type: 'resource' },
      environment: { time: new Date().toISOString() }
    };

    const response = await supertest(app)
      .post('/api/v1/policies/evaluate')
      .set('Authorization', `Bearer ${authToken}`)
      .send(request)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.decision).toMatch(/Allow|Deny/);
    expect(response.body.data.evaluatedPolicies).toBeGreaterThan(0);
  });
});
```

## Best Practices

1. **Policy Design**: Keep policies simple and focused
2. **Performance**: Use indexing and caching for frequent evaluations
3. **Security**: Deny by default, explicit allow required
4. **Auditing**: Log all access decisions for compliance
5. **Testing**: Comprehensive test coverage for policy logic
6. **Versioning**: Track policy changes and versions
7. **Monitoring**: Monitor policy performance and effectiveness

## Future Enhancements

- **Policy Versioning**: Track and manage policy versions
- **Policy Templates**: Pre-built policy templates for common scenarios  
- **Dynamic Attributes**: Real-time attribute resolution from external sources
- **Policy Simulation**: Test policy changes before deployment
- **Machine Learning**: Anomaly detection and policy recommendations
- **External Policy Stores**: Integration with external policy repositories
- **Policy as Code**: Git-based policy management workflows