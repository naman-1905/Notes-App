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
  return (
    <div className="border border-gray-200 rounded p-4 bg-white hover:drop-shadow-lg cursor-pointer transition-all ease-in-out">
      <div className="flex items-center justify-between">
        <div>
          <h6 className="text-sm text-slate-900 font-medium">{title}</h6>
          <span className="text-xs text-slate-500">{date}</span>
        </div>

        <MdOutlinePushPin
          className={`text-2xl ${isPinned ? 'text-gray-500' : 'text-slate-300'}`}
          onClick={onPinNote}
        />
      </div>

      <p className='text-black'>{content?.slice(0, 60)}</p>

      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-slate-500">{tags}</div>
        <div className="flex gap-2">
          <MdCreate className="text-2xl text-gray-500 cursor-pointer hover:text-green-600" onClick={onEdit} />
          <MdDelete className="text-2xl text-gray-500 cursor-pointer hover:text-red-500" onClick={onDelete} />
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
