"use client"
import React from 'react';
import { FaSearch } from 'react-icons/fa';

function SearchBar({ value, onChange }) {
  return (
    <div className="flex justify-center my-5">
      <div className="flex items-center bg-white rounded-full px-4 py-2 w-xs sm:w-screen max-w-md shadow-md">
        <FaSearch className="text-gray-400 mr-3" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search..."
          className="flex-1 bg-transparent outline-none border-none text-gray-800 text-base"
        />
      </div>
    </div>
  );
}

export default SearchBar;
