declare module 'react-router-bootstrap' {
  import type { ReactElement } from 'react';
  import type { NavLinkProps } from 'react-router-dom';

  export interface LinkContainerProps extends Omit<NavLinkProps, 'to'> {
    to: NavLinkProps['to'];
    children: ReactElement;
  }

  export const LinkContainer: (props: LinkContainerProps) => ReactElement;
}

