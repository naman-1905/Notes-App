"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProfileInfo from '@/app/components/Cards/ProfileInfo'
import SearchBar from '@/app/components/SearchBar/SearchBar'
import NoteCard from '@/app/components/Cards/NoteCard'
import { MdAdd } from 'react-icons/md'
import AddEditNotes from '@/app/components/AddEditNotes'
import ReactModal from 'react-modal'
import axiosInstance from '@/app/utils/axiosInstance'

const Homepage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: 'add',
    data: null,
  })
  const [userInfo, setUserInfo] = useState(null)
  const [allNotes, setAllNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const router = useRouter()

  // Fetch user info
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user")
      console.log("User info response:", response.data) // Debug log
      
      if (response.data && response.data.user) {
        setUserInfo(response.data.user)
      }
    } catch (error) {
      console.error("Get user info error:", error)
      if (error.response && error.response.status === 401) {
        localStorage.clear()
        router.push("/login")
      }
    }
  }

  // Fetch all notes
  const getAllNotes = async () => {
    try {
      const response = await axiosInstance.get("/get-all-notes")
      console.log("Notes response:", response.data) // Debug log
      
      if (response.data && response.data.notes) {
        setAllNotes(response.data.notes)
      }
    } catch (error) {
      console.error("Get notes error:", error)
      if (error.response && error.response.status === 401) {
        localStorage.clear()
        router.push("/login")
      }
    }
  }

  // Search notes
  const onSearchNote = async (query) => {
    try {
      if (query) {
        const response = await axiosInstance.get("/search-notes", {
          params: { query }
        })
        
        if (response.data && response.data.notes) {
          setAllNotes(response.data.notes)
        }
      } else {
        getAllNotes() // If search is cleared, get all notes
      }
    } catch (error) {
      console.error("Search notes error:", error)
    }
  }

  // Handle search
  const handleSearch = () => {
    if (searchTerm) {
      onSearchNote(searchTerm)
    } else {
      getAllNotes()
    }
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("")
    getAllNotes()
  }

  // Delete note
  const deleteNote = async (data) => {
    const noteId = data._id
    
    try {
      const response = await axiosInstance.delete("/delete-note/" + noteId)
      
      if (response.data && !response.data.error) {
        getAllNotes() // Refresh notes after deletion
      }
    } catch (error) {
      console.error("Delete note error:", error)
    }
  }

  // Pin note
  const updateIsPinned = async (noteData) => {
    const noteId = noteData._id
    
    try {
      const response = await axiosInstance.put(
        "/update-note-pinned/" + noteId,
        {
          isPinned: !noteData.isPinned
        }
      )
      
      if (response.data && !response.data.error) {
        getAllNotes() // Refresh notes after pinning
      }
    } catch (error) {
      console.error("Pin note error:", error)
    }
  }

  // Handle edit note
  const handleEdit = (noteDetails) => {
    setOpenAddEditModal({
      isShown: true,
      data: noteDetails,
      type: "edit"
    })
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.clear()
    router.push("/login")
  }

  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true)
      await getUserInfo()
      await getAllNotes()
      setIsLoading(false)
    }
    
    initializePage()
  }, [])

  // Handle search input change
  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        handleSearch()
      }, 500) // Debounce search
      
      return () => clearTimeout(timeoutId)
    } else {
      getAllNotes()
    }
  }, [searchTerm])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <div className='w-screen py-5'>
        <ProfileInfo 
          name={userInfo?.fullName || "User"} 
          onLogout={handleLogout}
        />
        <SearchBar 
          value={searchTerm} 
          onChange={setSearchTerm}
          handleSearch={handleSearch}
          onClearSearch={handleClearSearch}
        />
      </div>

      <div className='container mx-auto px-4'>
        {allNotes.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8'>
            {allNotes.map((item) => (
              <NoteCard
                key={item._id}
                title={item.title}
                date={new Date(item.createdOn).toLocaleDateString()}
                content={item.content}
                tags={item.tags}
                isPinned={item.isPinned}
                onEdit={() => handleEdit(item)}
                onDelete={() => deleteNote(item)}
                onPinNote={() => updateIsPinned(item)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center mt-20">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                {searchTerm ? "No notes found" : "No notes yet"}
              </h2>
              <p className="text-gray-500">
                {searchTerm 
                  ? "Try searching for something else" 
                  : "Click the + button to add your first note"}
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        className='w-16 h-16 flex items-center justify-center rounded-2xl bg-blue-400 hover:bg-blue-600 absolute right-10 bottom-10 cursor-pointer transition-colors'
        onClick={() => setOpenAddEditModal({ isShown: true, type: 'add', data: null })}
      >
        <MdAdd className='text-[32px] text-white'/>
      </button>

      <ReactModal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() =>
          setOpenAddEditModal({ isShown: false, type: 'add', data: null })
        }
        ariaHideApp={false}
        style={{
          overlay: { backgroundColor: "rgba(0,0,0,0.2)" },
        }}
        contentLabel=''
        className='w-[40%] max-w-4xl max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5 overflow-scroll'
      >
        <AddEditNotes
          type={openAddEditModal.type}
          noteData={openAddEditModal.data}
          onClose={() => setOpenAddEditModal({ isShown: false, type: "add", data: null })}
          onSubmit={async (note, actionType) => {
            if (actionType === "edit") {
              // Note will be updated, refresh the list
              await getAllNotes()
            } else {
              // Note will be added, refresh the list
              await getAllNotes()
            }
            // Close the modal
            setOpenAddEditModal({ isShown: false, type: "add", data: null })
          }}
        />
      </ReactModal>
    </>
  )
}

export default Homepage