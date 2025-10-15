/**
 * Utility functions for formatting policies into human-readable text
 */

interface PolicyAttribute {
  name: string;
  operator: string;
  value: string | string[];
}

interface PolicyRule {
  subject: {
    type: string;
    attributes: PolicyAttribute[];
  };
  action: {
    name: string;
    displayName: string;
  };
  object: {
    type: string;
    attributes: PolicyAttribute[];
  };
}

interface AdditionalResource {
  id: string;
  attributes: PolicyAttribute[];
}

interface Policy {
  name: string;
  rules: PolicyRule[];
  subjects: string[];
  actions: string[];
  resources: string[];
  additionalResources?: AdditionalResource[];
  effect: 'Allow' | 'Deny';
}

/**
 * Format attribute conditions into human-readable text
 */
function formatAttributeConditions(attributes: PolicyAttribute[]): string {
  if (!attributes || attributes.length === 0) return '';

  const conditions = attributes
    .filter(attr => attr.value !== '' && attr.value !== null && attr.value !== undefined)
    .map((attr, index, array) => {
      const value = Array.isArray(attr.value) ? attr.value.join(' or ') : attr.value;
      let condition = '';

      switch (attr.operator) {
        case 'equals':
          condition = `${attr.name.toLowerCase()} is ${value}`;
          break;
        case 'in':
          condition = `${attr.name.toLowerCase()} in ${value}`;
          break;
        case 'contains':
          condition = `${attr.name.toLowerCase()} contains ${value}`;
          break;
        case 'not_equals':
          condition = `${attr.name.toLowerCase()} is not ${value}`;
          break;
        case 'not_in':
          condition = `${attr.name.toLowerCase()} not in ${value}`;
          break;
        case 'not_contains':
          condition = `${attr.name.toLowerCase()} does not contain ${value}`;
          break;
        default:
          condition = `${attr.name.toLowerCase()} ${attr.operator} ${value}`;
      }

      // Add "and" before the last condition if there are multiple
      if (index === array.length - 1 && array.length > 1) {
        return `and ${condition}`;
      }
      return condition;
    });

  return conditions.join(', ');
}

/**
 * Format a list of items with proper grammar (1 item, 2 items, or 3+ items)
 */
function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/**
 * Format a single rule into human-readable text
 */
function formatPolicyRule(rule: PolicyRule): string {
  const parts: string[] = [];

  // Subject with conditions
  let subjectText = rule.subject.type;
  if (rule.subject.attributes && rule.subject.attributes.length > 0) {
    const conditions = formatAttributeConditions(rule.subject.attributes);
    if (conditions) {
      subjectText += ` (when ${conditions})`;
    }
  }
  parts.push(subjectText);

  // Action (verb) - lowercase
  parts.push('to perform');
  const actionName = (rule.action.displayName || rule.action.name).toLowerCase();
  parts.push(actionName);
  parts.push('actions on');

  // Resource with conditions
  let resourceText = rule.object.type;
  if (rule.object.attributes && rule.object.attributes.length > 0) {
    const conditions = formatAttributeConditions(rule.object.attributes);
    if (conditions) {
      resourceText += ` (where ${conditions})`;
    }
  }
  parts.push(resourceText);

  return parts.join(' ');
}

/**
 * Format additional resources into human-readable text
 */
function formatAdditionalResources(additionalResources: AdditionalResource[]): string {
  if (!additionalResources || additionalResources.length === 0) return '';

  const resourceTexts = additionalResources.map(res => {
    let text = res.id;
    if (res.attributes && res.attributes.length > 0) {
      const conditions = formatAttributeConditions(res.attributes);
      if (conditions) {
        text += ` (${conditions})`;
      }
    }
    return text;
  });

  return formatList(resourceTexts);
}

/**
 * Generate a complete human-readable summary of a policy
 */
export function generatePolicySummary(policy: Policy): string {
  if (!policy) return '';

  const effectText = policy.effect === 'Allow' ? 'ALLOWS' : 'DENIES';

  // If policy has detailed rules, use them
  if (policy.rules && policy.rules.length > 0) {
    const ruleSummaries = policy.rules.map(rule => formatPolicyRule(rule));
    let summary = `This policy ${effectText} ${ruleSummaries.join('; ')}`;

    // Add additional resources if present
    if (policy.additionalResources && policy.additionalResources.length > 0) {
      const additionalText = formatAdditionalResources(policy.additionalResources);
      summary += ` if ${additionalText}`;
    }

    return summary + '.';
  }

  // Fallback: Use simple subjects/actions/resources arrays
  const subjectsText = policy.subjects && policy.subjects.length > 0
    ? formatList(policy.subjects)
    : 'All users';

  const actionsText = policy.actions && policy.actions.length > 0
    ? formatList(policy.actions.map(a => a.toLowerCase()))
    : 'any action';

  const resourcesText = policy.resources && policy.resources.length > 0
    ? formatList(policy.resources)
    : 'any resource';

  let summary = `This policy ${effectText} ${subjectsText} to perform ${actionsText} actions on ${resourcesText}`;

  // Add additional resources if present
  if (policy.additionalResources && policy.additionalResources.length > 0) {
    const additionalText = formatAdditionalResources(policy.additionalResources);
    summary += ` and on additional resources ${additionalText}`;
  }

  return summary + '.';
}

/**
 * Generate a shortened summary for display in tables (max length)
 */
export function generateShortPolicySummary(policy: Policy, maxLength: number = 120): string {
  const fullSummary = generatePolicySummary(policy);

  if (fullSummary.length <= maxLength) {
    return fullSummary;
  }

  return fullSummary.substring(0, maxLength - 3) + '...';
}
