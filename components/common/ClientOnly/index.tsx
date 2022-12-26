import React, { FC, PropsWithChildren } from 'react';

// This component is used to prevent the content from being rendered on the server.
// More info: https://www.joshwcomeau.com/react/the-perils-of-rehydration
const ClientOnly: FC<PropsWithChildren> = ({ children, ...delegated }) => {
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);
  if (!hasMounted) {
    return null;
  }
  return <div {...delegated}>{children}</div>;
};

export default ClientOnly;
