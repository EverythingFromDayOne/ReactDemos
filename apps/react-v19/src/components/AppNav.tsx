import type { CSSProperties } from 'react';
import { NavLink } from '../react-router-typed';

const baseLinkStyle: CSSProperties = {
  borderRadius: '0.5rem',
  border: '1px solid transparent',
  padding: '0.375rem 0.75rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#94a3b8',
  textDecoration: 'none',
  transition: 'all 120ms ease',
};

const activeLinkStyle: CSSProperties = {
  backgroundColor: 'rgba(30, 41, 59, 0.9)',
  borderColor: '#475569',
  color: '#e2e8f0',
};

export function AppNav() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950 px-6 py-3" aria-label="Application pages">
      <div className="flex items-center gap-2">
        <NavLink
          to="/roadmap"
          style={({ isActive }) => ({
            ...baseLinkStyle,
            ...(isActive ? activeLinkStyle : null),
          })}
        >
          Roadmap
        </NavLink>
        <NavLink
          to="/feature-compare"
          style={({ isActive }) => ({
            ...baseLinkStyle,
            ...(isActive ? activeLinkStyle : null),
          })}
        >
          Feature Compare
        </NavLink>
      </div>
    </nav>
  );
}
