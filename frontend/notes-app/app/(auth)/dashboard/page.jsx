"use client"
import React from 'react'
import { useState } from 'react'
import ProfileInfo from '@/app/components/Cards/ProfileInfo'
import Navbar from '@/app/components/Navbar'
import SearchBar from '@/app/components/SearchBar/SearchBar'

function Homepage() {
const [searchTerm, setSearchTerm] = useState('')
 
  return (
    <div>
      <ProfileInfo name="Jane Smith" onLogout={() => console.log("Logged out")} />
        <SearchBar
        value={searchTerm}         // controlled input
        onChange={setSearchTerm}   // pass state updater
      />
    </div>
  )
}

export default Homepage
