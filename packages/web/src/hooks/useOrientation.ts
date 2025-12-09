import { useEffect, useState } from 'react';

type Orientation = 'portrait' | 'landscape';

interface OrientationState {
  orientation: Orientation;
  width: number;
  height: number;
}

function getOrientation(): OrientationState {
  if (typeof window === 'undefined') {
    return { orientation: 'portrait', width: 0, height: 0 };
  }
  const { innerWidth: width, innerHeight: height } = window;
  const orientation: Orientation = width > height ? 'landscape' : 'portrait';
  return { orientation, width, height };
}

export function useOrientation(): OrientationState {
  const [state, setState] = useState<OrientationState>(getOrientation);

  useEffect(() => {
    const handler = () => setState(getOrientation());

    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);

    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);

  return state;
}

