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
  Chip,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight="600">
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* System items warning */}
        {hasSystemItems && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5, 
            p: 2, 
            mb: 3,
            bgcolor: 'warning.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'warning.200'
          }}>
            <WarningIcon color="warning" />
            <Typography variant="body2" color="warning.dark">
              System items cannot be deleted and will be skipped.
            </Typography>
          </Box>
        )}

        {/* Main confirmation message */}
        <Typography variant="body1" sx={{ mb: 3 }}>
          {isBulk 
            ? `Are you sure you want to delete ${count} selected ${entityNamePlural}? This action cannot be undone.`
            : `Are you sure you want to delete "${displayName}"? This action cannot be undone.`
          }
        </Typography>

        {/* Show item details */}
        {!isBulk && item && (
          <Box sx={{
            p: 2,
            mb: 2,
            bgcolor: 'grey.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Item to delete:
            </Typography>
            <Typography variant="subtitle1" fontWeight="500">
              {displayName}
            </Typography>
            {item.isSystem && (
              <Chip 
                label="System Item" 
                size="small" 
                color="warning"
                variant="outlined"
                sx={{ mt: 1 }} 
              />
            )}
          </Box>
        )}

        {/* Show bulk items */}
        {isBulk && items && items.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Items to delete ({count}):
            </Typography>
            <Box sx={{
              maxHeight: '200px',
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 1,
              bgcolor: 'grey.50'
            }}>
              {items.slice(0, 10).map((item, index) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 1.5,
                    borderBottom: index < Math.min(items.length, 10) - 1 ? '1px solid' : 'none',
                    borderColor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant="body2">
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
                <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: 'grey.100' }}>
                  <Typography variant="body2" color="text.secondary">
                    ... and {items.length - 10} more items
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={Boolean(loading || hasSystemItems)}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Deleting...' : hasSystemItems ? 'Cannot Delete' : `Delete${isBulk ? ` (${count})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}