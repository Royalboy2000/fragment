import React from 'react'

export const Checkbox = ({ checked, onChange, className = "" }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className={`w-5 h-5 cursor-pointer accent-black ${className}`}
  />
)
