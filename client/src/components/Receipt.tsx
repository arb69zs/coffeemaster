import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  IconButton,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import { Order } from '../types';
import { format } from 'date-fns';

interface ReceiptProps {
  order: Order;
  onNewOrder: () => void;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  customMessage?: string;
  showLogo?: boolean;
}

const Receipt: React.FC<ReceiptProps> = ({
  order,
  onNewOrder,
  storeName,
  storeAddress,
  storePhone,
  customMessage,
  showLogo = true
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    try {
      if (!date) return 'N/A';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'N/A';
      return format(dateObj, 'MMM dd, yyyy, hh:mm:ss a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Calculate change if cash payment
  const calculateChange = () => {
    if (order.payment_method === 'cash' && order.cash_received) {
      return order.cash_received - order.total_amount;
    }
    return 0;
  };

  // Handle print receipt
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${order.id}`,
    removeAfterPrint: true
  } as any);

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        background: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Receipt-${order.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Order Complete
          </Typography>
          <Typography color="success.main" variant="h6">
            Thank you for your purchase!
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<PrintIcon />} 
            onClick={handlePrint}
            fullWidth
          >
            Print Receipt
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />} 
            onClick={handleDownloadPDF}
            fullWidth
          >
            Download PDF
          </Button>
        </Box>
        
        <Button 
          variant="outlined" 
          startIcon={<CloseIcon />} 
          onClick={onNewOrder}
          fullWidth
        >
          Close
        </Button>
      </Paper>
      
      <Paper ref={receiptRef} elevation={3} sx={{ p: 4 }}>
        {/* Receipt Content */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          {showLogo && (
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              {storeName}
            </Typography>
          )}
          <Typography variant="body2">{storeAddress}</Typography>
          <Typography variant="body2">{storePhone}</Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Receipt #:</strong> {order.id}
          </Typography>
          <Typography variant="body2">
            <strong>Date:</strong> {formatDate(order.created_at)}
          </Typography>
          <Typography variant="body2">
            <strong>Payment:</strong> {order.payment_method === 'cash' ? 'Cash' : 'Card'}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product?.name || `Product #${item.product_id}`}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Total:</strong> 
            <span>{formatCurrency(order.total_amount)}</span>
          </Typography>
          
          {order.payment_method === 'cash' && order.cash_received && (
            <>
              <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Cash received:</span> 
                <span>{formatCurrency(order.cash_received)}</span>
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Change:</span> 
                <span>{formatCurrency(calculateChange())}</span>
              </Typography>
            </>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {customMessage && (
          <Typography variant="body2" align="center" sx={{ mt: 2, fontStyle: 'italic' }}>
            {customMessage}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default Receipt; 