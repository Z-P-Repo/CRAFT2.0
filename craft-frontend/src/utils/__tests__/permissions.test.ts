import { User } from '@/types';
import {
  canEdit,
  canDelete,
  canCreate,
  canManage,
  isAdmin,
  isSuperAdmin,
  isBasic,
} from '../permissions';

describe('permissions utilities', () => {
  // Mock user data for testing
  const superAdminUser: User = {
    email: 'superadmin@test.com',
    name: 'Super Admin',
    role: 'super_admin',
    attributes: {},
    active: true,
  };

  const adminUser: User = {
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
    attributes: {},
    active: true,
  };

  const basicUser: User = {
    email: 'basic@test.com',
    name: 'Basic User',
    role: 'basic',
    attributes: {},
    active: true,
  };

  describe('canEdit', () => {
    it('returns false for null user', () => {
      expect(canEdit(null)).toBe(false);
    });

    it('returns true for super_admin user', () => {
      expect(canEdit(superAdminUser)).toBe(true);
    });

    it('returns true for admin user', () => {
      expect(canEdit(adminUser)).toBe(true);
    });

    it('returns false for basic user', () => {
      expect(canEdit(basicUser)).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('returns false for null user', () => {
      expect(canDelete(null)).toBe(false);
    });

    it('returns true for super_admin user', () => {
      expect(canDelete(superAdminUser)).toBe(true);
    });

    it('returns true for admin user', () => {
      expect(canDelete(adminUser)).toBe(true);
    });

    it('returns false for basic user', () => {
      expect(canDelete(basicUser)).toBe(false);
    });
  });

  describe('canCreate', () => {
    it('returns false for null user', () => {
      expect(canCreate(null)).toBe(false);
    });

    it('returns true for super_admin user', () => {
      expect(canCreate(superAdminUser)).toBe(true);
    });

    it('returns true for admin user', () => {
      expect(canCreate(adminUser)).toBe(true);
    });

    it('returns false for basic user', () => {
      expect(canCreate(basicUser)).toBe(false);
    });
  });

  describe('canManage', () => {
    it('returns false for null user', () => {
      expect(canManage(null)).toBe(false);
    });

    it('returns true for super_admin user', () => {
      expect(canManage(superAdminUser)).toBe(true);
    });

    it('returns true for admin user', () => {
      expect(canManage(adminUser)).toBe(true);
    });

    it('returns false for basic user', () => {
      expect(canManage(basicUser)).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('returns false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });

    it('returns false for super_admin user', () => {
      expect(isAdmin(superAdminUser)).toBe(false);
    });

    it('returns true for admin user', () => {
      expect(isAdmin(adminUser)).toBe(true);
    });

    it('returns false for basic user', () => {
      expect(isAdmin(basicUser)).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('returns false for null user', () => {
      expect(isSuperAdmin(null)).toBe(false);
    });

    it('returns true for super_admin user', () => {
      expect(isSuperAdmin(superAdminUser)).toBe(true);
    });

    it('returns false for admin user', () => {
      expect(isSuperAdmin(adminUser)).toBe(false);
    });

    it('returns false for basic user', () => {
      expect(isSuperAdmin(basicUser)).toBe(false);
    });
  });

  describe('isBasic', () => {
    it('returns false for null user', () => {
      expect(isBasic(null)).toBe(false);
    });

    it('returns false for super_admin user', () => {
      expect(isBasic(superAdminUser)).toBe(false);
    });

    it('returns false for admin user', () => {
      expect(isBasic(adminUser)).toBe(false);
    });

    it('returns true for basic user', () => {
      expect(isBasic(basicUser)).toBe(true);
    });
  });

  describe('edge cases and comprehensive coverage', () => {
    it('handles users with additional properties correctly', () => {
      const userWithExtraProps: User = {
        _id: '12345',
        email: 'test@test.com',
        name: 'Test User',
        role: 'admin',
        attributes: { department: 'IT', location: 'NYC' },
        active: false,
        managerId: 'manager123',
        department: 'Engineering',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-02',
      };

      // All functions should work the same regardless of additional properties
      expect(canEdit(userWithExtraProps)).toBe(true);
      expect(canDelete(userWithExtraProps)).toBe(true);
      expect(canCreate(userWithExtraProps)).toBe(true);
      expect(canManage(userWithExtraProps)).toBe(true);
      expect(isAdmin(userWithExtraProps)).toBe(true);
      expect(isSuperAdmin(userWithExtraProps)).toBe(false);
      expect(isBasic(userWithExtraProps)).toBe(false);
    });

    it('validates all role combinations across all functions', () => {
      const testCases = [
        {
          role: 'super_admin' as const,
          expected: {
            canEdit: true,
            canDelete: true,
            canCreate: true,
            canManage: true,
            isAdmin: false,
            isSuperAdmin: true,
            isBasic: false,
          },
        },
        {
          role: 'admin' as const,
          expected: {
            canEdit: true,
            canDelete: true,
            canCreate: true,
            canManage: true,
            isAdmin: true,
            isSuperAdmin: false,
            isBasic: false,
          },
        },
        {
          role: 'basic' as const,
          expected: {
            canEdit: false,
            canDelete: false,
            canCreate: false,
            canManage: false,
            isAdmin: false,
            isSuperAdmin: false,
            isBasic: true,
          },
        },
      ];

      testCases.forEach(({ role, expected }) => {
        const user: User = {
          email: `${role}@test.com`,
          name: `${role} user`,
          role,
          attributes: {},
          active: true,
        };

        expect(canEdit(user)).toBe(expected.canEdit);
        expect(canDelete(user)).toBe(expected.canDelete);
        expect(canCreate(user)).toBe(expected.canCreate);
        expect(canManage(user)).toBe(expected.canManage);
        expect(isAdmin(user)).toBe(expected.isAdmin);
        expect(isSuperAdmin(user)).toBe(expected.isSuperAdmin);
        expect(isBasic(user)).toBe(expected.isBasic);
      });
    });

    it('handles null input consistently across all functions', () => {
      const functions = [
        canEdit,
        canDelete,
        canCreate,
        canManage,
        isAdmin,
        isSuperAdmin,
        isBasic,
      ];

      functions.forEach((fn) => {
        expect(fn(null)).toBe(false);
      });
    });
  });

  describe('function consistency', () => {
    it('ensures CRUD permission functions return same results for same roles', () => {
      const crudFunctions = [canEdit, canDelete, canCreate, canManage];
      
      // All CRUD functions should return the same result for each role
      [superAdminUser, adminUser, basicUser, null].forEach((user) => {
        const results = crudFunctions.map((fn) => fn(user));
        const firstResult = results[0];
        
        // All CRUD functions should return the same boolean value
        expect(results.every((result) => result === firstResult)).toBe(true);
      });
    });

    it('ensures role checker functions are mutually exclusive for valid users', () => {
      const roleCheckers = [isAdmin, isSuperAdmin, isBasic];
      
      [superAdminUser, adminUser, basicUser].forEach((user) => {
        const trueResults = roleCheckers.filter((fn) => fn(user));
        
        // Exactly one role checker should return true for each user
        expect(trueResults.length).toBe(1);
      });
    });

    it('validates permission escalation hierarchy', () => {
      // Super admins and admins should have all CRUD permissions
      [superAdminUser, adminUser].forEach((user) => {
        expect(canEdit(user)).toBe(true);
        expect(canDelete(user)).toBe(true);
        expect(canCreate(user)).toBe(true);
        expect(canManage(user)).toBe(true);
      });

      // Basic users should have no CRUD permissions
      expect(canEdit(basicUser)).toBe(false);
      expect(canDelete(basicUser)).toBe(false);
      expect(canCreate(basicUser)).toBe(false);
      expect(canManage(basicUser)).toBe(false);
    });
  });
});