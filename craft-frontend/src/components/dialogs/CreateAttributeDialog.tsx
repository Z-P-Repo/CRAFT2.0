'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  IconButton,
} from '@mui/material';
import {
  Settings as AttributeIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface CreateAttributeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (attributeData: AttributeData) => Promise<void>;
  loading?: boolean;
}

export interface AttributeData {
  name: string;
  displayName: string;
  description: string;
  category: 'subject' | 'resource' | 'action' | 'environment';
  dataType: 'string' | 'number' | 'boolean' | 'date';
  isRequired: boolean;
  isMultiValue: boolean;
  enumValues: string[];
}

const CreateAttributeDialog: React.FC<CreateAttributeDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState<AttributeData>({
    name: '',
    displayName: '',
    description: '',
    category: 'subject',
    dataType: 'string',
    isRequired: false,
    isMultiValue: false,
    enumValues: ['']
  });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.displayName) return;
    
    await onSubmit(formData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      category: 'subject',
      dataType: 'string',
      isRequired: false,
      isMultiValue: false,
      enumValues: ['']
    });
  };

  const handleClose = () => {
    // Check if form has data and show confirmation
    const hasFormData = formData.name.trim() || 
                       formData.displayName.trim() || 
                       formData.description.trim() ||
                       formData.category !== 'subject' ||
                       formData.dataType !== 'string' ||
                       formData.isRequired ||
                       formData.isMultiValue ||
                       (formData.enumValues.length > 1 || formData.enumValues[0]?.trim());
    
    if (hasFormData) {
      setCancelDialogOpen(true);
      return;
    }
    
    // No data, close directly
    handleReset();
    onClose();
  };

  // Cancel confirmation handlers
  const handleCancelConfirm = () => {
    setCancelDialogOpen(false);
    handleReset();
    onClose();
  };

  const handleCancelCancel = () => {
    setCancelDialogOpen(false);
  };

  const handleEnumValueChange = (index: number, value: string) => {
    const newValues = [...formData.enumValues];
    newValues[index] = value;
    setFormData(prev => ({ ...prev, enumValues: newValues }));
  };

  const addEnumValue = () => {
    setFormData(prev => ({ ...prev, enumValues: [...prev.enumValues, ''] }));
  };

  const removeEnumValue = (index: number) => {
    if (formData.enumValues.length === 1) return;
    const newValues = formData.enumValues.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, enumValues: newValues }));
  };

  const isSubmitDisabled = !formData.name || !formData.displayName || loading;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttributeIcon color="primary" />
          New Attribute
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Attribute Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., department"
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Display Name"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="e.g., Department"
              required
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={2}
              placeholder="Describe what this attribute represents"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                label="Category"
              >
                <MenuItem value="subject">Subject</MenuItem>
                <MenuItem value="resource">Resource</MenuItem>
                <MenuItem value="action">Action</MenuItem>
                <MenuItem value="environment">Environment</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={formData.dataType}
                onChange={(e) => setFormData(prev => ({ ...prev, dataType: e.target.value as any }))}
                label="Data Type"
              >
                <MenuItem value="string">Text</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="boolean">Boolean</MenuItem>
                <MenuItem value="date">Date</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                  />
                }
                label="Required"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isMultiValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, isMultiValue: e.target.checked }))}
                  />
                }
                label="Multi-value"
              />
            </Box>
          </Grid>
          {formData.dataType === 'string' && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" gutterBottom>
                Predefined Values (Optional)
              </Typography>
              {formData.enumValues.map((value, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={value}
                    onChange={(e) => handleEnumValueChange(index, e.target.value)}
                    placeholder={`Value ${index + 1}`}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeEnumValue(index)}
                    disabled={formData.enumValues.length === 1}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addEnumValue}
                size="small"
              >
                Add Value
              </Button>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
        >
          Create Attribute
        </Button>
      </DialogActions>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCancelCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          Cancel Attribute Creation
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to cancel? All your changes will be lost and cannot be recovered.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelCancel} variant="outlined">
            Continue Creating
          </Button>
          <Button onClick={handleCancelConfirm} variant="contained" color="error">
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default CreateAttributeDialog;