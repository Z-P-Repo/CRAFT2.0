import { User } from '@/types';

export const canEdit = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'super_admin';
};

export const canDelete = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'super_admin';
};

export const canCreate = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'super_admin';
};

export const canManage = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'super_admin';
};

export const isAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'admin';
};

export const isSuperAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'super_admin';
};

export const isBasic = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'basic';
};