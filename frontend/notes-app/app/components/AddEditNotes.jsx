import { useState } from "react";
import { MdClose } from "react-icons/md";
import TagInput from "./TagInput";

function AddEditNotes({ noteData, type, onClose, onSubmit }) {
  const [title, setTitle] = useState(noteData?.title || "");
  const [content, setContent] = useState(noteData?.content || "");
  const [tags, setTags] = useState(noteData?.tags || []);
  const [error, setError] = useState(null);

  const handleSaveNote = () => {
    if (!title) {
      setError("Please enter the title");
      return;
    }

    if (!content) {
      setError("Content field cannot be empty");
      return;
    }

    setError("");

    const newNote = {
      ...noteData, // keeps existing fields like id if editing
      title,
      content,
      tags,
    };

    if (onSubmit) {
      onSubmit(newNote);
    }

    onClose(); // close modal after saving
  };

  return (
    <div className="relative">
      {/* Close button */}
      <button
        className="w-10 h-10 rounded-full flex items-center justify-center absolute -top-3 -right-3 hover:bg-slate-500"
        onClick={onClose}
      >
        <MdClose className="text-xl text-slate-400" />
      </button>

      {/* Title input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-slate-400">TITLE</label>
        <input
          type="text"
          className="text-2xl text-slate-950 outline-none"
          placeholder="Go to Gym at 5"
          value={title}
          onChange={({ target }) => setTitle(target.value)}
        />
      </div>

      {/* Content input */}
      <div className="flex flex-col gap-2 mt-4">
        <label className="text-xs text-slate-600">CONTENT</label>
        <textarea
          type="text"
          className="text-sm text-slate-950 outline-none bg-slate-50 p-2 rounded"
          placeholder="Content"
          rows={10}
          value={content}
          onChange={({ target }) => setContent(target.value)}
        />

        {/* Tags input */}
        <div className="mt-3">
          <label className="input-label">TAGS</label>
          <TagInput tags={tags} setTags={setTags} />
        </div>

        {/* Error message */}
        {error && <p className="text-red-500 text-xs pt-4">{error}</p>}

        {/* Submit button */}
        <button
          className="bg-blue-500 cursor-pointer rounded-2xl text-white hover:bg-blue-600 font-bold mt-5 p-3"
          onClick={handleSaveNote}
        >
          {type === "edit" ? "UPDATE" : "ADD"}
        </button>
      </div>
    </div>
  );
}

export default AddEditNotes;
