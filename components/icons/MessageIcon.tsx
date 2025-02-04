import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface MessageIconProps {
  color: string;
  size: number;
}

export function MessageIcon({ color, size }: MessageIconProps) {
  const actualSize = size + 4;
  
  return (
    <Svg width={actualSize} height={actualSize} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
    </Svg>
  );
} 