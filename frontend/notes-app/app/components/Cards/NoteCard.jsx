import React from 'react';
import { MdOutlinePushPin, MdCreate, MdDelete } from 'react-icons/md';

const NoteCard = ({
  title,
  date,
  content,
  tags,
  isPinned,
  onEdit,
  onDelete,
  onPinNote,
}) => {
  // Format tags as comma-separated string with # prefix
  const formatTags = (tagArray) => {
    if (!tagArray || tagArray.length === 0) return '';
    return tagArray.map(tag => `${tag}`).join(', ');
  };

  return (
    <div className="border border-gray-200 rounded p-4 bg-white hover:drop-shadow-lg cursor-pointer transition-all ease-in-out">
      <div className="flex items-center justify-between">
        <div>
          <h6 className="text-sm text-slate-900 font-medium">{title}</h6>
          <span className="text-xs text-slate-500">{date}</span>
        </div>
        <MdOutlinePushPin
          className={`text-2xl cursor-pointer ${
            isPinned ? 'text-blue-600' : 'text-slate-300'
          } hover:text-blue-600`}
          onClick={onPinNote}
        />
      </div>
      
      <p className='text-xs text-slate-600 mt-2'>
        {content?.slice(0, 60)}{content?.length > 60 ? '...' : ''}
      </p>
      
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-slate-500">
          {formatTags(tags)}
        </div>
        <div className="flex gap-2">
          <MdCreate 
            className="text-xl text-gray-500 cursor-pointer hover:text-green-600 transition-colors" 
            onClick={onEdit} 
          />
          <MdDelete 
            className="text-xl text-gray-500 cursor-pointer hover:text-red-500 transition-colors" 
            onClick={onDelete} 
          />
        </div>
      </div>
    </div>
  );
};

export default NoteCard;