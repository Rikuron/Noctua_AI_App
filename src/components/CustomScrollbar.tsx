// src/components/CustomScrollbar.tsx
// Reusable custom scrollbar CSS for dark theme
import React from 'react'

export function CustomScrollbarStyles() {
  return (
    <style>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #374151;
        border-radius: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #1f2937;
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #374151 #1f2937;
      }
    `}</style>
  )
}
