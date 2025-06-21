import React from 'react';
import {
  Box,
  Container,
  Typography,
} from '@mui/material';


const Settings: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center'
      }}>
        <Typography variant="h4" component="h1" gutterBottom>
          az44487@ubt-uni.net
        </Typography>
      </Box>
    </Container>
  );
};

export default Settings; 