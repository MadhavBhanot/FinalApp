import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface HomeIconProps {
  color: string;
  size: number;
}

export function HomeIcon({ color, size }: HomeIconProps) {
  const actualSize = size + 4;
  
  return (
    <Svg width={actualSize} height={actualSize} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5V19.5C4 20.0523 4.44772 20.5 5 20.5H19C19.5523 20.5 20 20.0523 20 19.5V10.5L12 4.5L4 10.5Z"
        fill={color}
      />
      <Path
        d="M9 14.5C9 13.9477 9.44772 13.5 10 13.5H14C14.5523 13.5 15 13.9477 15 14.5V20.5H9V14.5Z"
        fill="black"
      />
    </Svg>
  );
} 