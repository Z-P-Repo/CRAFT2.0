import { Resource, IResource, IResourceDependency, IResourceState } from '../models/Resource';
import { Policy, IPolicy, IComplexPolicyRule } from '../models/Policy';

export interface ResourceEvaluationContext {
  userId: string;
  userAttributes: Map<string, any>;
  requestTime: Date;
  environmentId: string;
  applicationId: string;
  workspaceId: string;
}

export interface ResourceAccessResult {
  resourceId: string;
  accessible: boolean;
  accessLevel: 'read' | 'write' | 'execute' | 'admin' | 'custom';
  conditions: string[];
  dependencies: string[];
  evaluationTime: number;
  cached: boolean;
}

export class ResourceDependencyService {
  private evaluationCache: Map<string, { result: ResourceAccessResult; expiry: Date }> = new Map();

  /**
   * Evaluates whether a resource is accessible based on its dependencies and conditions
   */
  async evaluateResourceAccess(
    resourceId: string,
    context: ResourceEvaluationContext
  ): Promise<ResourceAccessResult> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(resourceId, context);
    const cachedResult = this.evaluationCache.get(cacheKey);

    if (cachedResult && cachedResult.expiry > new Date()) {
      return { ...cachedResult.result, cached: true };
    }

    try {
      // Get the resource and its dependencies
      const resource = await Resource.findOne({
        id: resourceId,
        environmentId: context.environmentId,
        active: true
      });

      if (!resource) {
        return {
          resourceId,
          accessible: false,
          accessLevel: 'read',
          conditions: ['Resource not found'],
          dependencies: [],
          evaluationTime: Date.now() - startTime,
          cached: false
        };
      }

      // Evaluate basic access (no dependencies)
      if (!resource.conditions || !resource.conditions.enabled) {
        return {
          resourceId,
          accessible: true,
          accessLevel: 'read',
          conditions: [],
          dependencies: [],
          evaluationTime: Date.now() - startTime,
          cached: false
        };
      }

      // Evaluate additional access
      const accessResult = await this.evaluateAdditionalAccess(resource, context);

      // Cache the result if it's cacheable
      const resultWithTiming = {
        ...accessResult,
        evaluationTime: Date.now() - startTime,
        cached: false
      };

      if (accessResult.accessible) {
        this.cacheResult(cacheKey, resultWithTiming, 300); // 5 minutes default cache
      }

      return resultWithTiming;

    } catch (error) {
      console.error('Error evaluating resource access:', error);
      return {
        resourceId,
        accessible: false,
        accessLevel: 'read',
        conditions: ['Evaluation error'],
        dependencies: [],
        evaluationTime: Date.now() - startTime,
        cached: false
      };
    }
  }

  /**
   * Evaluates additional access based on resource dependencies
   */
  private async evaluateAdditionalAccess(
    resource: IResource,
    context: ResourceEvaluationContext
  ): Promise<Omit<ResourceAccessResult, 'evaluationTime' | 'cached'>> {

    if (!resource.conditions) {
      return {
        resourceId: resource.id,
        accessible: true,
        accessLevel: 'read',
        conditions: [],
        dependencies: []
      };
    }

    const { dependsOn, requiredStates, logicalOperator } = resource.conditions;
    const evaluationResults: boolean[] = [];
    const conditions: string[] = [];
    const dependencies: string[] = dependsOn;

    // Evaluate each dependency
    for (const dependencyId of dependsOn) {
      const dependencyResource = await Resource.findOne({
        id: dependencyId,
        environmentId: context.environmentId,
        active: true
      });

      if (!dependencyResource) {
        evaluationResults.push(false);
        conditions.push(`Dependency resource '${dependencyId}' not found`);
        continue;
      }

      // Check if dependency resource meets required states
      const stateEvaluations = await this.evaluateResourceStates(
        dependencyResource,
        requiredStates,
        context
      );

      evaluationResults.push(stateEvaluations.success);
      conditions.push(...stateEvaluations.conditions);
    }

    // Apply logical operator
    const finalResult = logicalOperator === 'AND'
      ? evaluationResults.every(result => result)
      : evaluationResults.some(result => result);

    return {
      resourceId: resource.id,
      accessible: finalResult,
      accessLevel: finalResult ? 'read' : 'read', // Default to read for now
      conditions,
      dependencies
    };
  }

  /**
   * Evaluates whether a resource meets the required states
   */
  private async evaluateResourceStates(
    resource: IResource,
    requiredStates: IResourceState[],
    context: ResourceEvaluationContext
  ): Promise<{ success: boolean; conditions: string[] }> {

    const conditions: string[] = [];
    const results: boolean[] = [];

    for (const state of requiredStates) {
      const attributeValue = resource.attributes.get(state.attributeName);

      if (attributeValue === undefined) {
        results.push(false);
        conditions.push(`Attribute '${state.attributeName}' not found in resource '${resource.id}'`);
        continue;
      }

      const evaluationResult = this.evaluateStateCondition(
        attributeValue,
        state.operator,
        state.expectedValue
      );

      results.push(evaluationResult.success);
      if (!evaluationResult.success) {
        conditions.push(evaluationResult.message);
      }
    }

    return {
      success: results.every(result => result),
      conditions
    };
  }

  /**
   * Evaluates a single state condition
   */
  private evaluateStateCondition(
    actualValue: any,
    operator: string,
    expectedValue: any
  ): { success: boolean; message: string } {

    switch (operator) {
      case 'equals':
        return {
          success: actualValue === expectedValue,
          message: `Expected '${expectedValue}', got '${actualValue}'`
        };

      case 'in':
        const expectedArray = Array.isArray(expectedValue) ? expectedValue : [expectedValue];
        return {
          success: expectedArray.includes(actualValue),
          message: `Value '${actualValue}' not in [${expectedArray.join(', ')}]`
        };

      case 'contains':
        return {
          success: String(actualValue).includes(String(expectedValue)),
          message: `Value '${actualValue}' does not contain '${expectedValue}'`
        };

      case 'not_equals':
        return {
          success: actualValue !== expectedValue,
          message: `Value should not equal '${expectedValue}'`
        };

      case 'not_in':
        const notInArray = Array.isArray(expectedValue) ? expectedValue : [expectedValue];
        return {
          success: !notInArray.includes(actualValue),
          message: `Value '${actualValue}' should not be in [${notInArray.join(', ')}]`
        };

      case 'greater_than':
        return {
          success: Number(actualValue) > Number(expectedValue),
          message: `Value '${actualValue}' is not greater than '${expectedValue}'`
        };

      case 'less_than':
        return {
          success: Number(actualValue) < Number(expectedValue),
          message: `Value '${actualValue}' is not less than '${expectedValue}'`
        };

      case 'greater_than_or_equal':
        return {
          success: Number(actualValue) >= Number(expectedValue),
          message: `Value '${actualValue}' is not greater than or equal to '${expectedValue}'`
        };

      case 'less_than_or_equal':
        return {
          success: Number(actualValue) <= Number(expectedValue),
          message: `Value '${actualValue}' is not less than or equal to '${expectedValue}'`
        };

      case 'includes':
        // For array actualValue, check if it includes the expectedValue
        if (Array.isArray(actualValue)) {
          return {
            success: actualValue.includes(expectedValue),
            message: `Array does not include '${expectedValue}'`
          };
        }
        return {
          success: false,
          message: `Value '${actualValue}' is not an array`
        };

      case 'not_includes':
        // For array actualValue, check if it does not include the expectedValue
        if (Array.isArray(actualValue)) {
          return {
            success: !actualValue.includes(expectedValue),
            message: `Array should not include '${expectedValue}'`
          };
        }
        return {
          success: false,
          message: `Value '${actualValue}' is not an array`
        };

      case 'before':
        // Date comparison: actualValue < expectedValue
        const beforeActual = new Date(actualValue);
        const beforeExpected = new Date(expectedValue);
        return {
          success: beforeActual < beforeExpected,
          message: `Date '${actualValue}' is not before '${expectedValue}'`
        };

      case 'after':
        // Date comparison: actualValue > expectedValue
        const afterActual = new Date(actualValue);
        const afterExpected = new Date(expectedValue);
        return {
          success: afterActual > afterExpected,
          message: `Date '${actualValue}' is not after '${expectedValue}'`
        };

      case 'on_or_before':
        // Date comparison: actualValue <= expectedValue
        const onOrBeforeActual = new Date(actualValue);
        const onOrBeforeExpected = new Date(expectedValue);
        return {
          success: onOrBeforeActual <= onOrBeforeExpected,
          message: `Date '${actualValue}' is not on or before '${expectedValue}'`
        };

      case 'on_or_after':
        // Date comparison: actualValue >= expectedValue
        const onOrAfterActual = new Date(actualValue);
        const onOrAfterExpected = new Date(expectedValue);
        return {
          success: onOrAfterActual >= onOrAfterExpected,
          message: `Date '${actualValue}' is not on or after '${expectedValue}'`
        };

      case 'between':
        // Date range comparison
        if (typeof expectedValue === 'object' && expectedValue.start && expectedValue.end) {
          const betweenActual = new Date(actualValue);
          const betweenStart = new Date(expectedValue.start);
          const betweenEnd = new Date(expectedValue.end);
          return {
            success: betweenActual >= betweenStart && betweenActual <= betweenEnd,
            message: `Date '${actualValue}' is not between '${expectedValue.start}' and '${expectedValue.end}'`
          };
        }
        return {
          success: false,
          message: `Invalid date range format for 'between' operator`
        };

      default:
        return {
          success: false,
          message: `Unknown operator: ${operator}`
        };
    }
  }

  /**
   * Gets all resources accessible to a user based on complex policies
   */
  async getAccessibleResources(context: ResourceEvaluationContext): Promise<ResourceAccessResult[]> {
    // Get all active resources in the environment
    const resources = await Resource.find({
      environmentId: context.environmentId,
      active: true
    });

    const results: ResourceAccessResult[] = [];

    // Evaluate access for each resource
    for (const resource of resources) {
      const accessResult = await this.evaluateResourceAccess(resource.id, context);
      results.push(accessResult);
    }

    return results.filter(result => result.accessible);
  }

  /**
   * Updates resource dependencies
   */
  async updateResourceDependencies(
    resourceId: string,
    dependencies: IResourceDependency,
    context: ResourceEvaluationContext
  ): Promise<boolean> {
    try {
      await Resource.findOneAndUpdate(
        {
          id: resourceId,
          environmentId: context.environmentId
        },
        {
          conditions: dependencies,
          'metadata.lastModifiedBy': context.userId,
          updatedAt: new Date()
        }
      );

      // Clear related cache entries
      this.clearResourceCache(resourceId);

      return true;
    } catch (error) {
      console.error('Error updating resource dependencies:', error);
      return false;
    }
  }

  /**
   * Validates resource dependency configuration
   */
  async validateDependencies(dependencies: IResourceDependency, environmentId: string): Promise<string[]> {
    const errors: string[] = [];

    // Check if all dependency resources exist
    for (const depId of dependencies.dependsOn) {
      const exists = await Resource.exists({
        id: depId,
        environmentId,
        active: true
      });

      if (!exists) {
        errors.push(`Dependency resource '${depId}' does not exist`);
      }
    }

    // Validate required states
    for (const state of dependencies.requiredStates) {
      if (!state.resourceId || !state.attributeName || !state.operator) {
        errors.push('Required state missing resourceId, attributeName, or operator');
      }
    }

    return errors;
  }

  /**
   * Cache management methods
   */
  private generateCacheKey(resourceId: string, context: ResourceEvaluationContext): string {
    return `${resourceId}:${context.userId}:${context.environmentId}:${context.requestTime.getTime()}`;
  }

  private cacheResult(key: string, result: ResourceAccessResult, ttlSeconds: number): void {
    const expiry = new Date(Date.now() + ttlSeconds * 1000);
    this.evaluationCache.set(key, { result, expiry });
  }

  private clearResourceCache(resourceId: string): void {
    for (const [key] of this.evaluationCache) {
      if (key.startsWith(resourceId + ':')) {
        this.evaluationCache.delete(key);
      }
    }
  }

  /**
   * Gets resource dependency graph for visualization
   */
  async getResourceDependencyGraph(environmentId: string): Promise<any> {
    const resources = await Resource.find({
      environmentId,
      active: true,
      'conditions.enabled': true
    }).select('id name displayName conditions relationships');

    const nodes = resources.map(resource => ({
      id: resource.id,
      name: resource.name,
      displayName: resource.displayName,
      type: 'resource',
      hasConditions: !!resource.conditions?.enabled,
      dependsOn: resource.conditions?.dependsOn || []
    }));

    const edges = resources.flatMap(resource =>
      (resource.conditions?.dependsOn || []).map(depId => ({
        source: depId,
        target: resource.id,
        type: 'dependency'
      }))
    );

    return { nodes, edges };
  }
}

export default new ResourceDependencyService();