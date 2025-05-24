import React from 'react';
import { Grid as MuiGrid, GridProps as MuiGridProps } from '@mui/material';

type CustomGridProps = MuiGridProps & {
  component?: React.ElementType;
  item?: boolean;
  container?: boolean;
};

const CustomGrid: React.FC<CustomGridProps> = (props) => {
  const { component = 'div', ...rest } = props;
  return <MuiGrid component={component} {...rest} />;
};

export default CustomGrid;
