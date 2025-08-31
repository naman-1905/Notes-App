"use client"
import React, { useState } from 'react'
import ProfileInfo from '@/app/components/Cards/ProfileInfo'
import SearchBar from '@/app/components/SearchBar/SearchBar'
import NoteCard from '@/app/components/Cards/NoteCard'

function Homepage() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <>
      <div className='w-screen bg-white py-5'>
        <ProfileInfo name="Jane Smith" onLogout={() => console.log("Logged out")} />
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      <div>
       <NoteCard/>
      </div>
    </>
  )
}

export default Homepage
