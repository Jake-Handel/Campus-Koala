'use client';

import { useEffect, useState } from 'react';

export function ClientOnly({ children, ...props }: React.PropsWithChildren): React.ReactNode {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
