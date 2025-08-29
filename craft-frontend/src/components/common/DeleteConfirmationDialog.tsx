'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
  DeleteSweep as BulkDeleteIcon,
} from '@mui/icons-material';

export interface DeleteItem {
  id: string;
  name: string;
  displayName?: string;
  isSystem?: boolean;
}

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  item?: DeleteItem | undefined;
  items?: DeleteItem[];
  loading?: boolean;
  entityName: string; // e.g., "subject", "resource", "action"
  entityNamePlural: string; // e.g., "subjects", "resources", "actions"
  warningMessage?: string;
  additionalInfo?: string;
  bulkMode?: boolean;
}

export default function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  item,
  items,
  loading = false,
  entityName,
  entityNamePlural,
  warningMessage,
  additionalInfo,
  bulkMode = false,
}: DeleteConfirmationDialogProps) {
  const isBulk = bulkMode || (items && items.length > 0);
  const count = isBulk ? (items?.length || 0) : 1;
  const displayName = item?.displayName || item?.name || '';
  
  // Check if any items are system items
  const hasSystemItems = isBulk 
    ? items?.some(i => i.isSystem) 
    : item?.isSystem;

  const systemItems = isBulk 
    ? items?.filter(i => i.isSystem) || []
    : item?.isSystem ? [item] : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isBulk ? "sm" : "xs"}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }
      }}
    >
      {/* Header with Icon and Title */}
      <DialogTitle sx={{ 
        pb: 2, 
        pt: 3,
        px: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'error.50'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: 'error.main',
            width: 48,
            height: 48,
            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
          }}>
            {isBulk ? <BulkDeleteIcon /> : <DeleteIcon />}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="700" color="text.primary">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {isBulk 
                ? `Confirm deletion of ${count} ${count === 1 ? entityName : entityNamePlural}`
                : `Confirm deletion of ${entityName}`
              }
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 3 }}>
        <Box>
          {/* Warning Message */}
          {(hasSystemItems || warningMessage) && (
            <Box sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              p: 2,
              mb: 3,
              bgcolor: 'warning.50',
              border: '1px solid',
              borderColor: 'warning.200',
              borderRadius: 2,
            }}>
              <WarningIcon sx={{ color: 'warning.main', mt: 0.25 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight="600" color="warning.dark">
                  {hasSystemItems ? 'System Items Cannot Be Deleted' : 'Warning'}
                </Typography>
                <Typography variant="body2" color="warning.dark" sx={{ mt: 0.5 }}>
                  {hasSystemItems 
                    ? `${systemItems.length} selected ${systemItems.length === 1 ? entityName : entityNamePlural} ${systemItems.length === 1 ? 'is a system item' : 'are system items'} and cannot be deleted.`
                    : warningMessage
                  }
                </Typography>
              </Box>
            </Box>
          )}

          {/* Main confirmation message */}
          <Typography variant="body1" fontWeight="500" gutterBottom>
            {isBulk 
              ? `Are you sure you want to delete ${count} selected ${count === 1 ? entityName : entityNamePlural}?`
              : `Are you sure you want to delete "${displayName}"?`
            }
          </Typography>

          {additionalInfo && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              {additionalInfo}
            </Typography>
          )}

          {/* Show item details */}
          {!isBulk && item && (
            <Box sx={{
              mt: 2,
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200',
            }}>
              <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                {displayName}
              </Typography>
              {item.isSystem && (
                <Chip 
                  label="System Item" 
                  size="small" 
                  color="warning" 
                  sx={{ mt: 1 }} 
                />
              )}
            </Box>
          )}

          {/* Show bulk items */}
          {isBulk && items && items.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                The following {entityNamePlural} will be permanently deleted:
              </Typography>
              <Box sx={{
                maxHeight: '200px',
                overflow: 'auto',
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 2,
                mt: 1,
              }}>
                {items.slice(0, 10).map((item, index) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 2,
                      borderBottom: index < Math.min(items.length, 10) - 1 ? '1px solid' : 'none',
                      borderColor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography variant="body2" fontWeight="500">
                      {item.displayName || item.name}
                    </Typography>
                    {item.isSystem && (
                      <Chip 
                        label="System" 
                        size="small" 
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                ))}
                {items.length > 10 && (
                  <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary">
                      ... and {items.length - 10} more {entityNamePlural}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Final warning */}
          <Box sx={{
            mt: 3,
            p: 2,
            bgcolor: 'error.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'error.200',
          }}>
            <Typography variant="body2" fontWeight="600" color="error.dark">
              This action cannot be undone.
            </Typography>
            <Typography variant="body2" color="error.dark" sx={{ mt: 0.5 }}>
              {isBulk 
                ? `All selected ${entityNamePlural} will be permanently removed from the system.`
                : `This ${entityName} will be permanently removed from the system.`
              }
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{
        px: 3,
        pb: 3,
        pt: 1,
        gap: 2,
        bgcolor: 'grey.50',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            textTransform: 'none',
            minWidth: 120,
            height: 44,
            borderColor: 'grey.300',
            color: 'text.secondary',
            '&:hover': {
              borderColor: 'grey.400',
              bgcolor: 'grey.50'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={Boolean(loading) || Boolean(hasSystemItems)}
          sx={{
            textTransform: 'none',
            minWidth: 120,
            height: 44,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(244, 67, 54, 0.4)',
            },
            '&:disabled': {
              bgcolor: 'grey.300',
              color: 'grey.500',
              boxShadow: 'none'
            }
          }}
        >
          {loading 
            ? 'Deleting...' 
            : hasSystemItems 
              ? 'Cannot Delete'
              : isBulk 
                ? `Delete ${count} ${count === 1 ? entityName.charAt(0).toUpperCase() + entityName.slice(1) : entityNamePlural.charAt(0).toUpperCase() + entityNamePlural.slice(1)}`
                : `Delete ${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}