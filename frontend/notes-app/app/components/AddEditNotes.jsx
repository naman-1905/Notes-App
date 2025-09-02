import { useState } from "react";
import { MdClose, MdEditNote } from "react-icons/md";
import TagInput from "./TagInput";
import axiosInstance from "@/app/utils/axiosInstance";

function AddEditNotes({ noteData, type, onClose, onSubmit }) {
  const [title, setTitle] = useState(noteData?.title || "");
  const [content, setContent] = useState(noteData?.content || "");
  const [tags, setTags] = useState(noteData?.tags || []);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add New Note
  const addNewNote = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.post("/add-note", {
        title,
        content,
        tags,
      });

      if (response.data && !response.data.error) {
        console.log("Note added successfully:", response.data.note);
        return response.data.note;
      } else {
        throw new Error(response.data.message || "Failed to add note");
      }
    } catch (error) {
      console.error("Add note error:", error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        "An error occurred while adding the note"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Edit Note
  const editNote = async () => {
    try {
      setIsLoading(true);
      const noteId = noteData._id;
      
      const response = await axiosInstance.put(`/edit-note/${noteId}`, {
        title,
        content,
        tags,
      });

      if (response.data && !response.data.error) {
        console.log("Note updated successfully:", response.data.note);
        return response.data.note;
      } else {
        throw new Error(response.data.message || "Failed to update note");
      }
    } catch (error) {
      console.error("Edit note error:", error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        "An error occurred while updating the note"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNote = async () => {
    // Clear any previous errors
    setError(null);

    // Validation
    if (!title.trim()) {
      setError("Please enter the title");
      return;
    }

    if (!content.trim()) {
      setError("Content field cannot be empty");
      return;
    }

    try {
      let savedNote;
      
      if (type === "edit") {
        savedNote = await editNote();
      } else {
        savedNote = await addNewNote();
      }

      // Call the parent's onSubmit callback with the saved note
      if (onSubmit) {
        onSubmit(savedNote, type);
      }

      // Close the modal
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="relative">
      {/* Close button */}
      <button
        className="w-10 h-10 rounded-full flex items-center justify-center absolute -top-3 -right-3 hover:bg-slate-500"
        onClick={onClose}
        disabled={isLoading}
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
          disabled={isLoading}
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
          disabled={isLoading}
        />

        {/* Tags input */}
        <div className="mt-3">
          <label className="input-label">TAGS</label>
          <TagInput tags={tags} setTags={setTags} disabled={isLoading} />
        </div>

        {/* Error message */}
        {error && <p className="text-red-500 text-xs pt-4">{error}</p>}

        {/* Submit button */}
        <button
          className={`rounded-2xl text-white font-bold mt-5 p-3 transition-colors ${
            isLoading 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-500 cursor-pointer hover:bg-blue-600"
          }`}
          onClick={handleSaveNote}
          disabled={isLoading}
        >
          {isLoading 
            ? (type === "edit" ? "UPDATING..." : "ADDING...") 
            : (type === "edit" ? "UPDATE" : "ADD")
          }
        </button>
      </div>
    </div>
  );
}

export default AddEditNotes;