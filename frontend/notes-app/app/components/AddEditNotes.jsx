import React, { useState } from 'react'
import TagInput from './TagInput'



function AddEditNotes() {


const [title, setTitle] = useState("");
const [content, setContent] = useState("");
const[tags,setTags] = useState([]);

  return (
    <div>
      <div className='flex flex-col gap-2'>
        <label className='text-xs text-slate-400'>TITLE</label>
        <input
        type='text'
        className='text-2xl text-slate-950 outline-none'
        placeholder='Go to Gym at 5'
        value={title}
        onChange={({target}) => setTitle(target.value)}
        />

      </div>

      <div className='flex flex-col gap-2 mt-4'>
        <label className='text-xs text-slate-600'>CONTENT</label>
        <textarea
        type='text'
        className='text-sm text-slate-950 outline-none bg-slate-50 p-2 rounded'
        placeholder='Content'
        rows={10}
        value={content}
        onChange={({target}) => setContent(target.value)}
        />


        <div className='mt-3'>
            <label className='input-label'>TAGS</label>
            <TagInput tags={tags} setTags={setTags}/>
        </div>

        <button className='bg-blue-500 cursor-pointer rounded-2xl text-white hover:bg-blue-600 font-bold mt-5 p-3' onClick={()=>{}}>
            ADD
        </button>
      </div>
    </div>
  )
}

export default AddEditNotes
