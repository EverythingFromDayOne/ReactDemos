import type { FC } from 'react';
import type { LinkProps, RouteProps, RoutesProps } from 'react-router-dom';
import {
  BrowserRouter,
  Link as RRLink,
  Navigate,
  Route as RRRoute,
  Routes as RRRoutes,
} from 'react-router-dom';

export { BrowserRouter, Navigate };

export const Routes = RRRoutes as unknown as FC<RoutesProps>;
export const Route = RRRoute as unknown as FC<RouteProps>;
export const Link = RRLink as unknown as FC<LinkProps>;
