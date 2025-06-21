import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination, 
  Chip, 
  Card, 
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Grid as MuiGrid
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { SystemLog, LogLevel, LogCategory, LogSummary } from '../types';
import { logs as logsAPI } from '../services/config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Colors for different log levels
const logLevelColors = {
  [LogLevel.INFO]: '#2196f3',
  [LogLevel.WARNING]: '#ff9800',
  [LogLevel.ERROR]: '#f44336'
};

// Colors for different log categories
const logCategoryColors = {
  [LogCategory.SYSTEM]: '#4caf50',
  [LogCategory.AUTH]: '#9c27b0',
  [LogCategory.ORDER]: '#2196f3',
  [LogCategory.INVENTORY]: '#ff9800',
  [LogCategory.PRODUCT]: '#795548'
};

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Create a Grid component that works with the item prop
const Grid = (props: any) => {
  return <MuiGrid {...props} />;
};

const Logs: React.FC = () => {
  // State for logs data
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for pagination
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  
  // State for filters
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  
  // State for available options
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  // State for summary data
  const [summary, setSummary] = useState<LogSummary | null>(null);
  
  // Fetch logs based on current filters and pagination
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await logsAPI.getLogs({
        level: levelFilter || undefined,
        category: categoryFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        limit: rowsPerPage,
        page: page + 1 // API uses 1-based pagination
      });
      
      setLogs(response.logs);
      setTotalLogs(response.pagination.total);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch logs. Please try again.');
      setLoading(false);
    }
  };
  
  // Fetch available categories and levels
  const fetchOptions = async () => {
    try {
      const [categoriesResponse, levelsResponse] = await Promise.all([
        logsAPI.getCategories(),
        logsAPI.getLevels()
      ]);
      
      setAvailableCategories(categoriesResponse);
      setAvailableLevels(levelsResponse);
    } catch (err) {
      setError('Failed to fetch filter options.');
    }
  };
  
  // Fetch summary data
  const fetchSummary = async () => {
    try {
      const summaryData = await logsAPI.getSummary();
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to fetch logs summary:', err);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchOptions();
    fetchSummary();
    fetchLogs();
  }, []);
  
  // Fetch logs when filters or pagination changes
  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, levelFilter, categoryFilter, startDateFilter, endDateFilter]);
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle filter reset
  const handleResetFilters = () => {
    setLevelFilter('');
    setCategoryFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setPage(0);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    fetchLogs();
    fetchSummary();
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch (err) {
      return dateString;
    }
  };
  
  // Prepare data for charts
  const prepareCategoryChartData = () => {
    if (!summary) return [];
    return summary.byCategory.map(item => ({
      name: item._id,
      value: item.count
    }));
  };
  
  const prepareLevelChartData = () => {
    if (!summary) return [];
    return summary.byLevel.map(item => ({
      name: item._id,
      value: item.count
    }));
  };
  
  const prepareDailyChartData = () => {
    if (!summary) return [];
    return summary.byDay.map(item => ({
      date: item._id,
      count: item.count
    }));
  };
  
  return (
    <Container maxWidth="xl">
      <Box mb={4} mt={2}>
        <Typography variant="h4" component="h1" gutterBottom>
          System Logs
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          View and analyze system logs for monitoring and troubleshooting.
        </Typography>
      </Box>
      
      {/* Summary Charts */}
      {summary && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Log Summary
          </Typography>
          <Grid container spacing={3}>
            {/* Daily Log Count Chart */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Daily Log Activity (Last 7 Days)
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareDailyChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Log Count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            
            {/* Distribution Charts */}
            <Grid item xs={12} md={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Logs by Category
                    </Typography>
                    <Box sx={{ height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareCategoryChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={50}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {prepareCategoryChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Logs by Level
                    </Typography>
                    <Box sx={{ height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareLevelChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={50}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {prepareLevelChartData().map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={
                                  entry.name === LogLevel.INFO 
                                    ? logLevelColors[LogLevel.INFO]
                                    : entry.name === LogLevel.WARNING
                                      ? logLevelColors[LogLevel.WARNING]
                                      : logLevelColors[LogLevel.ERROR]
                                } 
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterListIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Filters</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Log Level</InputLabel>
                  <Select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    label="Log Level"
                  >
                    <MenuItem value="">All Levels</MenuItem>
                    {availableLevels.map((level) => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {availableCategories.map((category) => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleResetFilters}
                  >
                    Reset Filters
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleRefresh}
                    startIcon={<RefreshIcon />}
                  >
                    Refresh
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>
      
      {/* Logs Table */}
      <Paper sx={{ width: '100%', mb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleRefresh}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>{formatDate(log.createdAt)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={log.level} 
                            size="small"
                            sx={{ 
                              bgcolor: logLevelColors[log.level as LogLevel] || '#757575',
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={log.category} 
                            size="small"
                            sx={{ 
                              bgcolor: logCategoryColors[log.category as LogCategory] || '#757575',
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>{log.message}</TableCell>
                        <TableCell>
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
                              <AccordionSummary 
                                expandIcon={<ExpandMoreIcon />}
                                sx={{ p: 0, minHeight: 'auto' }}
                              >
                                <Typography variant="body2" color="primary">
                                  View Details
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails sx={{ p: 0 }}>
                                <pre style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </AccordionDetails>
                            </Accordion>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              No details
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalLogs}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Logs; 