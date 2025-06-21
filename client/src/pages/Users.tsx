import React, { useState, useEffect } from 'react';
import { users as usersAPI } from '../services/config';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { Grid } from '../components/Grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  LockReset as LockResetIcon
} from '@mui/icons-material';
import { User, UserRole } from '../types';

const Users: React.FC = () => {
  // State for users
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for user dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // State for password reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetUsername, setResetUsername] = useState('');

  // Form state
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>(UserRole.CASHIER);
  const [formNewPassword, setFormNewPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      if (usersAPI) {
        console.log('Fetching users...');
        const data = await usersAPI.getAll();
        console.log('Users data received:', data);
        setUsers(data);
        setFilteredUsers(data);
      } else {
        console.error("API service is not available");
        setError("API service is not available");
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      // Add more detailed error information
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Error status:', err.response.status);
        setError(`Failed to fetch users: ${err.response.status} ${err.response.data.message || 'Unknown error'}`);
      } else if (err.request) {
        console.error('Error request:', err.request);
        setError('Failed to fetch users: No response received from server');
      } else {
        setError(`Failed to fetch users: ${err.message}`);
      }
      setLoading(false);
    }
  };

  // Handle dialog open for adding new user
  const handleAddUser = () => {
    setIsEditing(false);
    setCurrentUser(null);
    resetForm();
    setDialogOpen(true);
  };

  // Handle dialog open for editing user
  const handleEditUser = (user: User) => {
    setIsEditing(true);
    setCurrentUser(user);
    setFormUsername(user.username);
    setFormEmail(user.email || '');
    setFormFirstName(user.firstName || '');
    setFormLastName(user.lastName || '');
    setFormRole(user.role);
    setFormPassword('');
    setDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  // Reset form fields
  const resetForm = () => {
    setFormUsername('');
    setFormPassword('');
    setFormEmail('');
    setFormFirstName('');
    setFormLastName('');
    setFormRole(UserRole.CASHIER);
    setFormNewPassword('');
    setFormConfirmPassword('');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    console.log('Form data:', { formUsername, formRole, formPassword, formEmail, formFirstName, formLastName, isEditing });
    
    if (!formUsername || !formRole || !formEmail || !formFirstName || !formLastName || (!isEditing && !formPassword)) {
      setFormError('Please fill in all required fields');
      console.log('Form validation failed:', { formUsername, formRole, formPassword, formEmail, formFirstName, formLastName, isEditing });
      return;
    }

    if (!usersAPI) {
      setFormError('API service is not available');
      console.log('API service not available');
      return;
    }

    setFormLoading(true);
    try {
      console.log('Attempting to save user data...');
      if (isEditing && currentUser) {
        // Update existing user
        console.log('Updating user:', currentUser.id, { 
          username: formUsername, 
          email: formEmail,
          firstName: formFirstName,
          lastName: formLastName,
          role: formRole 
        });
        await usersAPI.update(currentUser.id, {
          username: formUsername,
          email: formEmail,
          firstName: formFirstName,
          lastName: formLastName,
          role: formRole
        });
        setSnackbarMessage(`User ${formUsername} updated successfully.`);
        setSnackbarSeverity('success');
      } else {
        // Create new user
        console.log('Creating new user:', { 
          username: formUsername, 
          password: formPassword, 
          email: formEmail,
          firstName: formFirstName,
          lastName: formLastName,
          role: formRole 
        });
        await usersAPI.create({
          username: formUsername,
          password: formPassword,
          email: formEmail,
          firstName: formFirstName,
          lastName: formLastName,
          role: formRole
        });
        setSnackbarMessage(`User ${formUsername} created successfully.`);
        setSnackbarSeverity('success');
      }
      console.log('User saved successfully');
      setSnackbarOpen(true);
      handleDialogClose();
      fetchUsers();
    } catch (err: any) {
      console.error('Error saving user:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Error status:', err.response.status);
        setFormError(`Error: ${err.response.status} ${err.response.data.message || 'Unknown error'}`);
      } else if (err.request) {
        console.error('Error request:', err.request);
        setFormError('Error: No response received from server');
      } else {
        setFormError(`Error: ${err.message}`);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (user: User) => {
    if (!usersAPI) {
      setError('API service is not available');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user ${user.username}?`)) {
      try {
        await usersAPI.delete(user.id);
        setSnackbarMessage(`User ${user.username} deleted successfully.`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchUsers();
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  // Handle password reset dialog open
  const handleResetPasswordOpen = (user: User) => {
    setResetUserId(user.id);
    setResetUsername(user.username);
    setFormNewPassword('');
    setFormConfirmPassword('');
    setResetDialogOpen(true);
  };

  // Handle password reset dialog close
  const handleResetPasswordClose = () => {
    setResetDialogOpen(false);
  };

  // Handle password reset submission
  const handleResetPasswordSubmit = async () => {
    // Validate passwords
    if (!formNewPassword || !formConfirmPassword) {
      setSnackbarMessage('Please enter both password fields.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (formNewPassword !== formConfirmPassword) {
      setSnackbarMessage('Passwords do not match.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!usersAPI) {
      setSnackbarMessage('API service is not available.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (resetUserId) {
      try {
        await usersAPI.resetPassword(resetUserId, formNewPassword);
        setSnackbarMessage(`Password for ${resetUsername} reset successfully.`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setResetDialogOpen(false);
      } catch (err) {
        setSnackbarMessage('An error occurred while resetting the password.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Get role color
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'error';
      case UserRole.MANAGER:
        return 'primary';
      case UserRole.CASHIER:
        return 'success';
      default:
        return 'default';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading users...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage user accounts, roles, and permissions.
        </Typography>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }} elevation={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8} md={9}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddUser}
            >
              Add User
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {searchTerm ? 'No users match your search.' : 'No users found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role} 
                      color={getRoleColor(user.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditUser(user)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => handleResetPasswordOpen(user)}
                    >
                      <LockResetIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? `Edit User: ${currentUser?.username}` : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            required
            value={formUsername}
            onChange={(e) => setFormUsername(e.target.value)}
          />
          {!isEditing && (
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              required
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
            />
          )}
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            required
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
          />
          <TextField
            margin="dense"
            label="First Name"
            fullWidth
            value={formFirstName}
            onChange={(e) => setFormFirstName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Last Name"
            fullWidth
            value={formLastName}
            onChange={(e) => setFormLastName(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              value={formRole}
              label="Role"
              onChange={(e) => setFormRole(e.target.value as UserRole)}
              required
            >
              <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
              <MenuItem value={UserRole.MANAGER}>Manager</MenuItem>
              <MenuItem value={UserRole.CASHIER}>Cashier</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={formLoading}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : null}
          >
            {isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onClose={handleResetPasswordClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Reset Password for {resetUsername}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            required
            value={formNewPassword}
            onChange={(e) => setFormNewPassword(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Confirm Password"
            type="password"
            fullWidth
            required
            value={formConfirmPassword}
            onChange={(e) => setFormConfirmPassword(e.target.value)}
            error={formNewPassword !== formConfirmPassword && formConfirmPassword !== ''}
            helperText={formNewPassword !== formConfirmPassword && formConfirmPassword !== '' ? 'Passwords do not match' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetPasswordClose}>Cancel</Button>
          <Button onClick={handleResetPasswordSubmit} variant="contained" color="warning">
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Users; 