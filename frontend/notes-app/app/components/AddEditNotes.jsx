import { useState } from "react";
import { MdClose } from "react-icons/md";
import TagInput from "./TagInput";
import axiosInstance from "@/app/utils/axiosInstance";

function AddEditNotes({ noteData, type, onClose, onSubmit }) {
  const [title, setTitle] = useState(noteData?.title || "");
  const [content, setContent] = useState(noteData?.content || "");
  const [tags, setTags] = useState(noteData?.tags || []);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const addNewNote = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.post("/add-note", { title, content, tags });
      if (response.data && !response.data.error) return response.data.note;
      throw new Error(response.data.message || "Failed to add note");
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || "Error adding note");
    } finally {
      setIsLoading(false);
    }
  };

  const editNote = async () => {
    try {
      setIsLoading(true);
      const noteId = noteData._id;
      const response = await axiosInstance.put(`/edit-note/${noteId}`, { title, content, tags });
      if (response.data && !response.data.error) return response.data.note;
      throw new Error(response.data.message || "Failed to update note");
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || "Error updating note");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNote = async () => {
    setError(null);
    if (!title.trim()) return setError("Please enter the title");
    if (!content.trim()) return setError("Content field cannot be empty");

    try {
      const savedNote = type === "edit" ? await editNote() : await addNewNote();
      onSubmit?.(savedNote, type);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="fixed bg-gray-50  inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-xl sm:max-w-2xl md:max-w-3xl rounded-xl shadow-lg relative p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition"
          onClick={onClose}
          disabled={isLoading}
        >
          <MdClose className="text-xl text-gray-600" />
        </button>

        {/* Title Input */}
        <div className="flex flex-col gap-1 sm:gap-2">
          <label className="text-xs text-gray-500">TITLE</label>
          <input
            type="text"
            className="text-xl sm:text-2xl text-gray-900 outline-none border-b border-gray-300 focus:border-blue-500 transition p-2 sm:p-3 rounded"
            placeholder="Go to Gym at 5"
            value={title}
            onChange={({ target }) => setTitle(target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Content Input */}
        <div className="flex flex-col gap-1 sm:gap-2 mt-4">
          <label className="text-xs text-gray-500">CONTENT</label>
          <textarea
            className="text-sm sm:text-base text-gray-900 outline-none bg-gray-50 p-2 sm:p-3 rounded resize-none max-h-72 sm:max-h-96"
            placeholder="Content"
            rows={6}
            value={content}
            onChange={({ target }) => setContent(target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Tags Input */}
        <div className="mt-4">
          <label className="text-xs text-gray-500">TAGS</label>
          <TagInput tags={tags} setTags={setTags} disabled={isLoading} />
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        {/* Submit Button */}
        <button
          className={`w-full sm:w-auto mt-6 sm:mt-8 px-6 py-3 rounded-2xl font-bold text-white transition-colors ${
            isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
          onClick={handleSaveNote}
          disabled={isLoading}
        >
          {isLoading ? (type === "edit" ? "UPDATING..." : "ADDING...") : (type === "edit" ? "UPDATE" : "ADD")}
        </button>
      </div>
    </div>
  );
}

export default AddEditNotes;
