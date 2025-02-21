import React from 'react';

export const PiButton = ({ children, ...props }) => (
    <button 
        className="pi-button" 
        {...props}
    >
        {children}
    </button>
);

export const PiSelect = ({ options, multiple, maxSelection, onChange, placeholder, ...props }) => (
    <select
        className="pi-select"
        multiple={multiple}
        onChange={(e) => {
            const selected = multiple 
                ? Array.from(e.target.selectedOptions).map(opt => opt.value)
                : e.target.value;
            if (!multiple || selected.length <= maxSelection) {
                onChange(selected);
            }
        }}
        {...props}
    >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
        ))}
    </select>
);

export const PiInput = ({ ...props }) => (
    <input 
        className="pi-input"
        {...props}
    />
);