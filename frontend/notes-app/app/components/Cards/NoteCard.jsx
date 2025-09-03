import React from 'react';
import { MdOutlinePushPin, MdDelete } from 'react-icons/md';

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

  // Handle pin note with event stopping
  const handlePinNote = (e) => {
    e.stopPropagation(); // Prevent card click
    onPinNote();
  };

  // Handle edit with event stopping
  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent card click
    onEdit();
  };

  // Handle delete with event stopping
  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent card click
    onDelete();
  };

  return (
    <div 
      className="border border-gray-200 rounded p-4 bg-white hover:drop-shadow-lg cursor-pointer transition-all ease-in-out"
      onClick={onEdit} // Make entire card clickable to open modal
    >
      <div className="flex items-center justify-between">
        <div>
          <h6 className="text-sm text-slate-900 font-medium">{title}</h6>
          <span className="text-xs text-slate-500">{date}</span>
        </div>
        <MdOutlinePushPin
          className={`text-2xl cursor-pointer ${
            isPinned ? 'text-blue-600' : 'text-slate-300'
          } hover:text-blue-600`}
          onClick={handlePinNote}
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
          <MdDelete 
            className="text-xl text-gray-500 cursor-pointer hover:text-red-500 transition-colors" 
            onClick={handleDelete} 
          />
        </div>
      </div>
    </div>
  );
};

export default NoteCard;