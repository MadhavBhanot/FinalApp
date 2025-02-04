import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ReelsIconProps {
  color: string;
  size: number;
}

export function ReelsIcon({ color, size }: ReelsIconProps) {
  const actualSize = size + 2;
  
  return (
    <Svg width={actualSize} height={actualSize} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M10 8.5L15 12L10 15.5V8.5Z"
        fill={color}
      />
    </Svg>
  );
} 