import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Money as MoneyIcon,
  Check as CheckIcon
} from '@mui/icons-material';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (paymentMethod: 'cash' | 'card', cashReceived?: number) => void;
  total: number;
  isProcessing: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payment-tabpanel-${index}`}
      aria-labelledby={`payment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  onComplete,
  total,
  isProcessing
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardName, setCardName] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvc, setCardCvc] = useState<string>('');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle cash payment
  const handleCashPayment = () => {
    const received = parseFloat(cashReceived);
    if (isNaN(received) || received < total) {
      return; // Not enough cash
    }
    onComplete('cash', received);
  };

  // Handle card payment
  const handleCardPayment = () => {
    // In a real app, this would validate the card details
    // and process the payment through a payment gateway
    onComplete('card');
  };

  // Calculate change
  const calculateChange = () => {
    const received = parseFloat(cashReceived);
    if (isNaN(received) || received < total) {
      return 0;
    }
    return received - total;
  };

  // Check if cash payment is valid
  const isCashPaymentValid = () => {
    const received = parseFloat(cashReceived);
    return !isNaN(received) && received >= total;
  };

  // Check if card payment is valid
  const isCardPaymentValid = () => {
    // Basic validation - in a real app, this would be more comprehensive
    return (
      cardNumber.length >= 16 &&
      cardName.length > 0 &&
      cardExpiry.length === 5 &&
      cardCvc.length >= 3
    );
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format card expiry
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return value;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>
        <Typography variant="h6">Payment</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Total: {formatCurrency(total)}
        </Typography>
      </DialogTitle>
      
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="payment method tabs"
        centered
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<MoneyIcon />} label="Cash" />
        <Tab icon={<CreditCardIcon />} label="Card" />
      </Tabs>
      
      <DialogContent>
        {/* Cash Payment */}
        <TabPanel value={tabValue} index={0}>
          <TextField
            label="Cash Received"
            variant="outlined"
            fullWidth
            value={cashReceived}
            onChange={(e) => setCashReceived(e.target.value)}
            type="number"
            InputProps={{
              startAdornment: <InputAdornment position="start">€</InputAdornment>,
            }}
            sx={{ mb: 3 }}
          />
          
          {cashReceived && parseFloat(cashReceived) >= total ? (
            <Paper elevation={2} sx={{ p: 2, bgcolor: 'success.light' }}>
              <Typography variant="subtitle1" gutterBottom>
                Change Due:
              </Typography>
              <Typography variant="h4" color="success.dark">
                {formatCurrency(calculateChange())}
              </Typography>
            </Paper>
          ) : (
            cashReceived && (
              <Paper elevation={2} sx={{ p: 2, bgcolor: 'error.light' }}>
                <Typography variant="subtitle1" color="error.dark">
                  Insufficient payment. Please enter at least {formatCurrency(total)}.
                </Typography>
              </Paper>
            )
          )}
        </TabPanel>
        
        {/* Card Payment */}
        <TabPanel value={tabValue} index={1}>
          <TextField
            label="Card Number"
            variant="outlined"
            fullWidth
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            inputProps={{ maxLength: 19 }}
            sx={{ mb: 2 }}
          />
          
          <TextField
            label="Cardholder Name"
            variant="outlined"
            fullWidth
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="John Doe"
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Expiry Date"
              variant="outlined"
              fullWidth
              value={cardExpiry}
              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              inputProps={{ maxLength: 5 }}
            />
            
            <TextField
              label="CVC"
              variant="outlined"
              fullWidth
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/g, ''))}
              type="password"
              inputProps={{ maxLength: 4 }}
            />
          </Box>
        </TabPanel>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        
        {tabValue === 0 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleCashPayment}
            disabled={!isCashPaymentValid() || isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {isProcessing ? 'Processing...' : 'Complete Payment'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleCardPayment}
            disabled={!isCardPaymentValid() || isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {isProcessing ? 'Processing...' : 'Complete Payment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog; 