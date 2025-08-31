"use client"
import React, { useState } from 'react'
import ProfileInfo from '@/app/components/Cards/ProfileInfo'
import SearchBar from '@/app/components/SearchBar/SearchBar'
import NoteCard from '@/app/components/Cards/NoteCard'
import { MdAdd } from 'react-icons/md'

function Homepage() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <>
      <div className='w-screen py-5'>
        <ProfileInfo name="Jane Smith" onLogout={() => console.log("Logged out")} />
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      <div className='container mx-auto'>
        <div className='grid grid-cols-3 gap-4 mt-8'>
              <NoteCard
                title="Meeting on 7"
                date="3rd April 2024"
                content="Content is Meeting on 7"
                tags="#Meeting"
                isPinned={true}
                onEdit={()=>{}}
                onDelete={()=>{}}
                onPinNote={()=>{}}
                />
        </div> 
      </div>

      <button className='w-16 h-16 flex items-center justify-center rounded-2xl bg-blue-400 hover:bg-blue-600 absolute right-10 bottom-10 cursor-pointer' onClick={() => {}}>
        <MdAdd className='text-[32px] text-white'/>
      </button>
    </>
  )
}

export default Homepage
