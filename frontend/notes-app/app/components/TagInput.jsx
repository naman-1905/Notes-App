import React, { useState } from 'react'
import { MdAdd, MdClose } from 'react-icons/md'

function TagInput({ tags, setTags, disabled = false }) {
  const [inputValue, setInputValue] = useState("")

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  const addNewTag = () => {
    if (inputValue.trim() !== "" && !tags.includes(inputValue.trim())) {
      setTags([...tags, inputValue.trim()])
      setInputValue("")
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addNewTag()
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div>
      {tags.length > 0 && (
        <div className='flex items-center gap-2 flex-wrap mt-2'>
          {tags.map((tag, index) => (
            <span
              key={index}
              className='flex items-center gap-2 text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-md'
            >
              #{tag}
              <button 
                onClick={() => handleRemoveTag(tag)}
                disabled={disabled}
                className={disabled ? 'cursor-not-allowed opacity-50' : ''}
              >
                <MdClose className="text-gray-500 hover:text-red-500" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      <div className='flex items-center text-black gap-4 mt-3'>
        <input
          type='text'
          value={inputValue}
          className={`text-sm bg-transparent border border-gray-300 px-3 py-2 rounded outline-none ${
            disabled ? 'cursor-not-allowed opacity-50' : ''
          }`}
          placeholder='Add Tags'
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button
          className={`w-8 h-8 flex items-center justify-center rounded border border-blue-700 hover:bg-blue-700 ${
            disabled ? 'cursor-not-allowed opacity-50' : ''
          }`}
          onClick={addNewTag}
          disabled={disabled}
        >
          <MdAdd className='text-2xl text-blue-700 hover:text-white' />
        </button>
      </div>
    </div>
  )
}

export default TagInput