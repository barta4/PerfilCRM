'use client';

import React from 'react';

interface AddressInputProps {
  label?: string;
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
}

export function AddressInput({ label, value, onChange, placeholder }: AddressInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input 
        className="w-full h-11 px-4 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00a8e8]/20 focus:border-[#00a8e8] transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Ingresar dirección...'}
      />
    </div>
  );
}
