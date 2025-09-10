import { Request, Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { ValidationError, NotFoundError } from '@/exceptions/AppError';
import { asyncHandler } from '@/middleware/errorHandler';
import { PaginationHelper } from '@/utils/pagination';
import { logger } from '@/utils/logger';
import { Attribute, IAttribute } from '@/models/Attribute';
import { Policy } from '@/models/Policy';


export class AttributeController {
  // Get all attributes with pagination and filtering
  static getAttributes = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);
    const {
      search,
      categories,
      dataType,
      isRequired,
      active,
      isSystem,
      isCustom,
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (categories) {
      if (typeof categories === 'string') {
        filter.categories = categories;
      } else if (Array.isArray(categories)) {
        filter.categories = { $in: categories };
      }
    }
    if (dataType) filter.dataType = dataType;
    if (isRequired !== undefined) filter.isRequired = isRequired === 'true';
    if (active !== undefined) filter.active = active === 'true';
    if (isSystem !== undefined) filter['metadata.isSystem'] = isSystem === 'true';
    if (isCustom !== undefined) filter['metadata.isCustom'] = isCustom === 'true';

    // Add search filter
    if (search) {
      const searchFilter = PaginationHelper.buildSearchFilter(
        search as string,
        ['name', 'displayName', 'description', 'id']
      );
      Object.assign(filter, searchFilter);
    }

    // Calculate pagination
    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    const sortObject = PaginationHelper.buildSortObject(
      paginationOptions.sortBy!,
      paginationOptions.sortOrder!
    );

    // Execute queries
    const [attributes, total] = await Promise.all([
      Attribute.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Attribute.countDocuments(filter)
    ]);

    // Add policy count to each attribute
    const attributesWithPolicyCount = await Promise.all(
      attributes.map(async (attribute) => {
        const policiesUsingAttribute = await AttributeController.checkAttributeUsageInPolicies(attribute.name);
        return {
          ...attribute,
          policyCount: policiesUsingAttribute.length,
          usedInPolicies: policiesUsingAttribute.map(p => ({ 
            id: p._id || p.id, 
            name: p.name, 
            displayName: p.displayName 
          }))
        };
      })
    );

    const result = PaginationHelper.buildPaginationResult(attributesWithPolicyCount, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get attribute by ID
  static getAttributeById = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    // Try to find by MongoDB _id first, then by custom id field
    let attribute = await Attribute.findById(id).lean();
    if (!attribute) {
      attribute = await Attribute.findOne({ id }).lean();
    }

    if (!attribute) {
      throw new NotFoundError('Attribute not found');
    }

    // Add policy count to the attribute
    const policiesUsingAttribute = await AttributeController.checkAttributeUsageInPolicies(attribute.name);
    const attributeWithPolicyCount = {
      ...attribute,
      policyCount: policiesUsingAttribute.length,
      usedInPolicies: policiesUsingAttribute.map(p => ({ 
        id: p._id || p.id, 
        name: p.name, 
        displayName: p.displayName 
      }))
    };

    res.status(200).json({
      success: true,
      data: attributeWithPolicyCount,
    });
  });

  // Create new attribute
  static createAttribute = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const {
      id,
      name,
      displayName,
      description,
      categories,
      dataType,
      isRequired,
      isMultiValue,
      defaultValue,
      constraints,
      validation,
      mapping,
      tags,
      externalId,
      metadata,
      workspaceId,
      applicationId,
      environmentId,
      scope,
    } = req.body;

    // Validate required fields
    if (!id || !name || !displayName || !categories || !dataType || !workspaceId || !applicationId || !environmentId) {
      const missingFields = [];
      if (!id) missingFields.push('id');
      if (!name) missingFields.push('name');
      if (!displayName) missingFields.push('displayName');
      if (!categories) missingFields.push('categories');
      if (!dataType) missingFields.push('dataType');
      if (!workspaceId) missingFields.push('workspaceId');
      if (!applicationId) missingFields.push('applicationId');
      if (!environmentId) missingFields.push('environmentId');
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check if attribute already exists
    const existingAttribute = await Attribute.findOne({ id });
    if (existingAttribute) {
      throw new ValidationError('Attribute with this ID already exists');
    }

    // Validate constraints based on data type
    const constraintValidation = AttributeController.validateConstraints(dataType, constraints || {});
    if (!constraintValidation.valid) {
      throw new ValidationError(constraintValidation.error!);
    }

    // Create attribute
    const attributeData = {
      id,
      name: name.trim(),
      displayName: displayName.trim(),
      description: description?.trim(),
      categories,
      dataType,
      isRequired: isRequired || false,
      isMultiValue: isMultiValue || false,
      defaultValue,
      scope: scope || 'environment',
      // Required hierarchy IDs
      workspaceId,
      applicationId,
      environmentId,
      constraints: constraints || {},
      validation: validation || {},
      mapping: mapping || {},
      metadata: {
        createdBy: metadata?.createdBy || req.user?._id || 'anonymous',
        lastModifiedBy: req.user?._id || 'anonymous',
        tags: tags || metadata?.tags || [],
        isSystem: metadata?.isSystem || false,
        isCustom: metadata?.isCustom !== undefined ? metadata.isCustom : true,
        version: metadata?.version || '1.0.0',
        externalId,
      },
    };

    const attribute = await Attribute.create(attributeData);

    logger.info(`Attribute created: ${attribute.id} by ${req.user?.email || 'anonymous'}`);

    res.status(201).json({
      success: true,
      data: attribute,
      message: 'Attribute created successfully',
    });
  });

  // Update attribute
  static updateAttribute = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const updates = req.body;

    // Validate attribute exists - try MongoDB _id first, then custom id
    let existingAttribute = await Attribute.findById(id);
    if (!existingAttribute) {
      existingAttribute = await Attribute.findOne({ id });
    }
    if (!existingAttribute) {
      throw new NotFoundError('Attribute not found');
    }

    // Remove non-updatable fields
    delete updates.id;
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;

    // Validate constraints if being updated
    if (updates.constraints && updates.dataType) {
      const constraintValidation = AttributeController.validateConstraints(
        updates.dataType || existingAttribute.dataType,
        updates.constraints
      );
      if (!constraintValidation.valid) {
        throw new ValidationError(constraintValidation.error!);
      }
    }

    // Update metadata
    if (!updates.metadata) {
      updates.metadata = existingAttribute.metadata;
    }
    updates.metadata.lastModifiedBy = req.user?._id || 'anonymous';

    const attribute = await Attribute.findByIdAndUpdate(
      existingAttribute._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!attribute) {
      throw new NotFoundError('Attribute not found after update');
    }

    logger.info(`Attribute updated: ${attribute.id} by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: attribute,
      message: 'Attribute updated successfully',
    });
  });

  // Delete attribute
  static deleteAttribute = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;

    // Try to find by MongoDB _id first, then by custom id field
    let attribute = await Attribute.findById(id);
    if (!attribute) {
      attribute = await Attribute.findOne({ id });
    }
    
    if (!attribute) {
      throw new NotFoundError('Attribute not found');
    }

    // Prevent deletion of system attributes
    if (attribute.metadata.isSystem) {
      throw new ValidationError('Cannot delete system attributes');
    }

    // Check if attribute is used in any policies
    const policiesUsingAttribute = await AttributeController.checkAttributeUsageInPolicies(attribute.name);
    if (policiesUsingAttribute.length > 0) {
      const policyCount = policiesUsingAttribute.length;
      const policyNames = policiesUsingAttribute.map(p => p.displayName || p.name).join(', ');
      
      throw new ValidationError(
        `Unable to delete "${attribute.displayName}" - This attribute is currently being used in ${policyCount} ${policyCount === 1 ? 'policy' : 'policies'}`
      );
    }

    await Attribute.findByIdAndDelete(attribute._id);

    logger.info(`Attribute deleted: ${attribute.id} (MongoDB ID: ${attribute._id}) by ${req.user?.email || 'anonymous'}`);

    res.status(200).json({
      success: true,
      message: 'Attribute deleted successfully',
    });
  });

  // Validate attribute value
  static validateAttributeValue = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { value } = req.body;

    const attribute = await Attribute.findOne({ id, active: true });
    if (!attribute) {
      throw new NotFoundError('Attribute not found');
    }

    const validationResult = await AttributeController.validateValue(attribute, value);

    res.status(200).json({
      success: true,
      data: {
        valid: validationResult.valid,
        errors: validationResult.errors,
        normalizedValue: validationResult.normalizedValue,
      },
    });
  });

  // Get attributes by category
  static getAttributesByCategory = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { category } = req.params;
    const paginationOptions = PaginationHelper.validatePaginationParams(req.query);

    if (!category) {
      throw new ValidationError('Category parameter is required');
    }

    const validCategories = ['subject', 'resource'];
    if (!validCategories.includes(category)) {
      throw new ValidationError(`Invalid category. Valid categories: ${validCategories.join(', ')}`);
    }

    const filter = { categories: category, active: true };
    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    const sortObject = PaginationHelper.buildSortObject(
      paginationOptions.sortBy!,
      paginationOptions.sortOrder!
    );

    const [attributes, total] = await Promise.all([
      Attribute.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean(),
      Attribute.countDocuments(filter)
    ]);

    const result = PaginationHelper.buildPaginationResult(attributes, total, paginationOptions);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get attribute schema for a category
  static getAttributeSchema = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { category } = req.params;

    if (!category) {
      throw new ValidationError('Category parameter is required');
    }

    const validCategories = ['subject', 'resource'];
    if (!validCategories.includes(category)) {
      throw new ValidationError(`Invalid category. Valid categories: ${validCategories.join(', ')}`);
    }

    const attributes = await Attribute.find({ categories: category, active: true });
    
    const schema = {
      type: 'object',
      properties: {},
      required: [] as string[]
    };

    attributes.forEach(attr => {
      const property: any = {
        type: AttributeController.mapDataTypeToJsonSchema(attr.dataType),
        title: attr.displayName,
        description: attr.description,
      };

      // Add constraints
      if (attr.constraints.minLength) property.minLength = attr.constraints.minLength;
      if (attr.constraints.maxLength) property.maxLength = attr.constraints.maxLength;
      if (attr.constraints.minValue) property.minimum = attr.constraints.minValue;
      if (attr.constraints.maxValue) property.maximum = attr.constraints.maxValue;
      if (attr.constraints.pattern) property.pattern = attr.constraints.pattern;
      if (attr.constraints.enumValues) property.enum = attr.constraints.enumValues;
      if (attr.constraints.format) property.format = attr.constraints.format;

      // Add default value
      if (attr.defaultValue !== undefined) property.default = attr.defaultValue;

      // Handle multi-value attributes
      if (attr.isMultiValue) {
        (schema.properties as any)[attr.name] = {
          type: 'array',
          items: property,
          title: attr.displayName,
          description: attr.description,
        };
      } else {
        (schema.properties as any)[attr.name] = property;
      }

      // Add to required array if required
      if (attr.isRequired) {
        schema.required.push(attr.name);
      }
    });

    res.status(200).json({
      success: true,
      data: schema,
    });
  });

  // Get attribute statistics
  static getAttributeStats = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const stats = await Attribute.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] }
          },
          required: {
            $sum: { $cond: [{ $eq: ['$isRequired', true] }, 1, 0] }
          },
          custom: {
            $sum: { $cond: [{ $eq: ['$metadata.isCustom', true] }, 1, 0] }
          },
          system: {
            $sum: { $cond: [{ $eq: ['$metadata.isSystem', true] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Attribute.aggregate([
      { $match: { active: true } },
      { $unwind: '$categories' },
      {
        $group: {
          _id: '$categories',
          count: { $sum: 1 },
          required: {
            $sum: { $cond: [{ $eq: ['$isRequired', true] }, 1, 0] }
          }
        }
      }
    ]);

    const dataTypeStats = await Attribute.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: '$dataType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || { total: 0, active: 0, required: 0, custom: 0, system: 0 },
        byCategory: categoryStats,
        byDataType: dataTypeStats,
      },
    });
  });

  // Bulk operations
  static bulkUpdateAttributes = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { attributeIds, updates } = req.body;

    if (!Array.isArray(attributeIds) || attributeIds.length === 0) {
      throw new ValidationError('Attribute IDs array is required');
    }

    const result = await Attribute.updateMany(
      { id: { $in: attributeIds } },
      {
        ...updates,
        'metadata.lastModifiedBy': req.user!._id
      }
    );

    logger.info(`Bulk update performed on ${result.modifiedCount} attributes by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} attributes updated successfully`,
    });
  });

  static bulkDeleteAttributes = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { attributeIds } = req.body;

    if (!Array.isArray(attributeIds) || attributeIds.length === 0) {
      throw new ValidationError('Attribute IDs array is required');
    }

    // Get attributes to be deleted
    const attributesToDelete = await Attribute.find({ id: { $in: attributeIds } });

    // Prevent deletion of system attributes
    const systemAttributes = attributesToDelete.filter(attr => attr.metadata.isSystem);
    if (systemAttributes.length > 0) {
      const systemAttrNames = systemAttributes.map(attr => attr.displayName).join(', ');
      throw new ValidationError(`Cannot delete system attributes: ${systemAttrNames}`);
    }

    // Check if any attributes are used in policies
    const attributesInUse: { attribute: string; policies: string[] }[] = [];
    for (const attribute of attributesToDelete) {
      const policiesUsingAttribute = await AttributeController.checkAttributeUsageInPolicies(attribute.name);
      if (policiesUsingAttribute.length > 0) {
        attributesInUse.push({
          attribute: attribute.displayName,
          policies: policiesUsingAttribute.map(p => p.name)
        });
      }
    }

    if (attributesInUse.length > 0) {
      const attributeCount = attributesInUse.length;
      const totalPolicies = [...new Set(attributesInUse.flatMap(usage => usage.policies))].length;
      
      const errorMessages = attributesInUse.map(usage => {
        const policyCount = usage.policies.length;
        return `• "${usage.attribute}" is used in ${policyCount} ${policyCount === 1 ? 'policy' : 'policies'}: ${usage.policies.join(', ')}`;
      });
      
      throw new ValidationError(
        `Unable to delete ${attributeCount} ${attributeCount === 1 ? 'attribute' : 'attributes'} - ${attributeCount === 1 ? 'It is' : 'They are'} currently being used in ${totalPolicies} ${totalPolicies === 1 ? 'policy' : 'policies'}`
      );
    }

    const result = await Attribute.deleteMany({ id: { $in: attributeIds } });

    logger.info(`Bulk delete performed on ${result.deletedCount} attributes by ${req.user?.email}`);

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
      },
      message: `${result.deletedCount} attributes deleted successfully`,
    });
  });

  // Helper methods
  private static async checkAttributeUsageInPolicies(attributeName: string): Promise<any[]> {
    // Search for policies that use this attribute in their rules
    // We need to check both subject.attributes and object.attributes in rules
    const policies = await Policy.find({
      $or: [
        { 'rules.subject.attributes.name': attributeName },
        { 'rules.object.attributes.name': attributeName },
        { 'conditions.field': attributeName }
      ]
    }, 'id name displayName').lean();

    return policies;
  }

  private static validateConstraints(dataType: string, constraints: any): { valid: boolean; error?: string } {
    switch (dataType) {
      case 'string':
        if (constraints.minValue !== undefined || constraints.maxValue !== undefined) {
          return { valid: false, error: 'String type cannot have numeric value constraints' };
        }
        break;
      case 'number':
        if (constraints.minLength !== undefined || constraints.maxLength !== undefined || constraints.pattern !== undefined) {
          return { valid: false, error: 'Number type cannot have string constraints' };
        }
        break;
      case 'boolean':
        if (Object.keys(constraints).length > 0 && !constraints.enumValues) {
          return { valid: false, error: 'Boolean type can only have enum constraints' };
        }
        break;
    }
    return { valid: true };
  }

  private static async validateValue(
    attribute: IAttribute,
    value: any
  ): Promise<{ valid: boolean; errors: string[]; normalizedValue?: any }> {
    const errors: string[] = [];
    let normalizedValue = value;

    // Check if required
    if (attribute.isRequired && (value === null || value === undefined || value === '')) {
      errors.push('Value is required');
      return { valid: false, errors };
    }

    // If value is empty and not required, it's valid
    if (!attribute.isRequired && (value === null || value === undefined || value === '')) {
      return { valid: true, errors: [], normalizedValue: attribute.defaultValue };
    }

    // Data type validation
    switch (attribute.dataType) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push('Value must be a string');
        } else {
          normalizedValue = value.toString();
          
          // String constraints
          if (attribute.constraints.minLength && normalizedValue.length < attribute.constraints.minLength) {
            errors.push(`Value must be at least ${attribute.constraints.minLength} characters`);
          }
          if (attribute.constraints.maxLength && normalizedValue.length > attribute.constraints.maxLength) {
            errors.push(`Value cannot exceed ${attribute.constraints.maxLength} characters`);
          }
          if (attribute.constraints.pattern) {
            const regex = new RegExp(attribute.constraints.pattern);
            if (!regex.test(normalizedValue)) {
              errors.push('Value does not match required pattern');
            }
          }
        }
        break;

      case 'number':
        normalizedValue = Number(value);
        if (isNaN(normalizedValue)) {
          errors.push('Value must be a valid number');
        } else {
          if (attribute.constraints.minValue !== undefined && normalizedValue < attribute.constraints.minValue) {
            errors.push(`Value must be at least ${attribute.constraints.minValue}`);
          }
          if (attribute.constraints.maxValue !== undefined && normalizedValue > attribute.constraints.maxValue) {
            errors.push(`Value cannot exceed ${attribute.constraints.maxValue}`);
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          normalizedValue = value === 'true' || value === '1' || value === 1;
        }
        break;

      case 'date':
        normalizedValue = new Date(value);
        if (isNaN(normalizedValue.getTime())) {
          errors.push('Value must be a valid date');
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push('Value must be an array');
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push('Value must be an object');
        }
        break;
    }

    // Enum validation
    if (attribute.constraints.enumValues && attribute.constraints.enumValues.length > 0) {
      if (!attribute.constraints.enumValues.includes(normalizedValue)) {
        errors.push(`Value must be one of: ${attribute.constraints.enumValues.join(', ')}`);
      }
    }

    // Format validation
    if (attribute.constraints.format && typeof normalizedValue === 'string') {
      const formatValid = AttributeController.validateFormat(attribute.constraints.format, normalizedValue);
      if (!formatValid) {
        errors.push(`Value must be a valid ${attribute.constraints.format}`);
      }
    }

    return { valid: errors.length === 0, errors, normalizedValue };
  }

  private static validateFormat(format: string, value: string): boolean {
    switch (format) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      case 'phone':
        return /^\+?[\d\s\-\(\)]{10,}$/.test(value);
      case 'ipv4':
        return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value);
      case 'ipv6':
        return /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(value);
      default:
        return true;
    }
  }

  private static mapDataTypeToJsonSchema(dataType: string): string {
    switch (dataType) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'date': return 'string';
      case 'array': return 'array';
      case 'object': return 'object';
      default: return 'string';
    }
  }
}