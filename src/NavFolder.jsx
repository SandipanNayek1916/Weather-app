import React, { useState } from 'react';
/* eslint-disable no-unused-vars */
import { AnimatePresence, motion } from 'framer-motion';
import { X, Clock, CalendarDays, BarChart3, GitCompareArrows, Map, Info, FolderOpen } from 'lucide-react';

const NAV_ITEMS = [
  { id: 1, name: 'Hourly',   href: '#hourly-section',   icon: Clock,            color: '#52b6ff' },
  { id: 2, name: 'Forecast', href: '#forecast-section',  icon: CalendarDays,     color: '#7cf2d6' },
  { id: 3, name: 'Charts',   href: '#trend-section',     icon: BarChart3,        color: '#ffad6f' },
  { id: 4, name: 'Compare',  href: '#compare-section',   icon: GitCompareArrows, color: '#8fb2ff' },
  { id: 5, name: 'Map',      href: '#map-section',       icon: Map,              color: '#7de0ff' },
  { id: 6, name: 'Details',  href: '#details-section',   icon: Info,             color: '#c9a7ff' },
];

export default function NavFolder({ folderName = 'Navigate' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative', zIndex: 100, justifySelf: 'center' }}>
      <motion.div
        animate={{
          height: isOpen ? '210px' : '42px',
          width: isOpen ? '340px' : 'auto',
          borderRadius: isOpen ? '18px' : '999px',
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{
          overflow: 'hidden',
          background: isOpen
            ? 'var(--surface-strong, rgba(8,20,35,0.76))'
            : 'rgba(255,255,255,0.03)',
          border: '1px solid var(--line, rgba(255,255,255,0.1))',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          boxShadow: isOpen
            ? 'var(--shadow, 0 28px 80px rgba(2,7,16,0.42))'
            : 'none',
        }}
      >
        <AnimatePresence mode="popLayout">
          {/* === CLOSED: looks like the other topbar-nav pill === */}
          {!isOpen && (
            <motion.button
              key="nav-closed"
              onClick={() => setIsOpen(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-faint, rgba(225,237,248,0.54))',
                fontFamily: 'inherit',
                fontSize: '14px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                transition: 'color 160ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text, #f6fbff)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
            >
              <FolderOpen size={16} strokeWidth={1.8} />
              {folderName}
            </motion.button>
          )}

          {/* === OPEN: glassmorphic dark panel matching the theme === */}
          {isOpen && (
            <motion.div
               key="nav-open"
               initial={{ filter: 'blur(8px)', opacity: 0 }}
               animate={{ filter: 'blur(0px)', opacity: 1 }}
               exit={{ filter: 'blur(8px)', opacity: 0 }}
               transition={{ type: 'spring', stiffness: 300, damping: 30 }}
               style={{
                 height: '100%',
                 width: '100%',
                 display: 'flex',
                 flexDirection: 'column',
                 overflow: 'hidden',
               }}
            >
              <div style={{
                height: '36px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 6px 0 14px',
                borderBottom: '1px solid var(--line, rgba(255,255,255,0.1))',
                flexShrink: 0,
              }}>
                <span style={{
                   color: 'var(--text-faint, rgba(225,237,248,0.54))',
                   fontWeight: 600,
                   fontSize: '11px',
                   letterSpacing: '1.2px',
                   textTransform: 'uppercase',
                   fontFamily: 'inherit',
                }}>
                  {folderName}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    padding: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-faint, #8b96a5)',
                    transition: 'background 150ms, color 150ms',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text, #f6fbff)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-faint)'; }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ flex: 1, padding: '14px', overflow: 'hidden' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                }}>
                  {NAV_ITEMS.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.a
                        key={'nav-' + item.id}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 28,
                          delay: index * 0.035,
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '7px',
                          padding: '14px 8px',
                          borderRadius: 'var(--radius-sm, 14px)',
                          background: 'var(--surface-soft, rgba(255,255,255,0.06))',
                          border: '1px solid transparent',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          transition: 'background 180ms, border-color 180ms, transform 180ms',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${item.color}14`;
                          e.currentTarget.style.borderColor = `${item.color}30`;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--surface-soft, rgba(255,255,255,0.06))';
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <Icon size={20} color={item.color} strokeWidth={1.8} />
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          color: 'var(--text-soft, rgba(225,237,248,0.72))',
                          fontFamily: 'inherit',
                        }}>
                          {item.name}
                        </span>
                      </motion.a>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
