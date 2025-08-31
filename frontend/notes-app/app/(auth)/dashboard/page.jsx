"use client"
import React, { useState } from 'react'
import ProfileInfo from '@/app/components/Cards/ProfileInfo'
import SearchBar from '@/app/components/SearchBar/SearchBar'
import NoteCard from '@/app/components/Cards/NoteCard'
import { MdAdd } from 'react-icons/md'
import AddEditNotes from '@/app/components/AddEditNotes'
import ReactModal from 'react-modal'

const Homepage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: 'add',
    data: null,
  })

  return (
    <>
      <div className='w-screen py-5'>
        <ProfileInfo name="Jane Smith" onLogout={() => console.log("Logged out")} />
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </div>

      <div className='container mx-auto'>
        <div className='grid grid-cols-3 gap-4 mt-8'>
          <NoteCard
            title="Meeting on 7"
            date="3rd April 2024"
            content="Content is Meeting on 7"
            tags="#Meeting"
            isPinned={true}
            onEdit={() => {}}
            onDelete={() => {}}
            onPinNote={() => {}}
          />
        </div> 
      </div>

      <button
        className='w-16 h-16 flex items-center justify-center rounded-2xl bg-blue-400 hover:bg-blue-600 absolute right-10 bottom-10 cursor-pointer'
        onClick={() => setOpenAddEditModal({ isShown: true, type: 'add', data: null })}
      >
        <MdAdd className='text-[32px] text-white'/>
      </button>

    <ReactModal
      isOpen={openAddEditModal.isShown}
      onRequestClose={() =>
        setOpenAddEditModal({ ...openAddEditModal, isShown: false })
      }
      ariaHideApp={false} // Disable automatic hiding to prevent Turbopack SSR errors
      style={{
        overlay: { backgroundColor: "rgba(0,0,0,0.2)" },
      }}
      contentLabel=''
      className='w-[40%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5 overflow-scroll'
    >
      <AddEditNotes
        onClose={() => {
          setOpenAddEditModal({ isShown: false, type: "add", data: null });
        }}
      />
    </ReactModal>
    </>
  )
}

export default Homepage
