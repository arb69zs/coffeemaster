import { Grid as MuiGrid } from '@mui/material';
import { ElementType } from 'react';

interface GridProps {
  item?: boolean;
  container?: boolean;
  spacing?: number;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  children?: React.ReactNode;
  sx?: any;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  component?: ElementType;
}

export const Grid = (props: GridProps) => {
  const { item, ...otherProps } = props;
  
  return <MuiGrid {...(item ? { item: true } : {})} {...otherProps} />;
};

export default Grid; 