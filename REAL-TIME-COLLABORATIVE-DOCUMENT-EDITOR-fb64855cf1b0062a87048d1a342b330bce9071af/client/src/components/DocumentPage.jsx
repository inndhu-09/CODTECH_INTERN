import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// URL of the backend API / Socket.io server
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

// Quill toolbar configuration for a "document-style" editor
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'code-block'],
  [{ align: [] }],
  ['link'],
  ['clean'],
];

// Time (ms) between automatic saves when there are changes.
// Requirement: persist the document roughly every 2 seconds if the user is editing.
const SAVE_DEBOUNCE_MS = 2000;

function DocumentPage() {
  const { id: documentId } = useParams();

  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('All changes saved'); // or "Saving..."
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef(null);
  const quillRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);

  // Initial data load + Socket.io setup
  useEffect(() => {
    if (!documentId) return;

    // Fetch the latest content from the REST API
    async function fetchDocument() {
      try {
        const response = await axios.get(`${SERVER_URL}/api/documents/${documentId}`);
        setContent(response.data.content || '');
      } catch (err) {
        console.error('Error fetching document:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocument();

    // 1) Open a Socket.io connection to the backend.
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    // 2) Tell the server which "document room" this client cares about.
    //    Under the hood this is a Socket.io `emit` call from client -> server.
    //    The server listens with `socket.on('join-document')` and then calls `socket.join(documentId)`
    //    so all clients editing the same document share one room.
    socket.emit('join-document', documentId);

    // 3) When the server sends us the latest version of the document
    //    (this runs `socket.emit('load-document', ...)` on the server side),
    //    update local state but mark it as a "remote" update so we don't re-broadcast it.
    socket.on('load-document', (serverContent) => {
      isRemoteUpdateRef.current = true;
      setContent(serverContent || '');
    });

    // 4) When another user sends changes, Socket.io broadcasts a `receive-changes` event
    //    to everyone else in the same room. We listen here and update the editor content.
    socket.on('receive-changes', (serverContent) => {
      isRemoteUpdateRef.current = true;
      setContent(serverContent || '');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [documentId]);

  // Whenever `content` changes, broadcast to other clients (if the change is local)
  useEffect(() => {
    if (!socketRef.current || !documentId) return;

    // If this change came from the server (`load-document` / `receive-changes`),
    // don't broadcast it again or we would create an infinite loop of updates.
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    // Broadcast this user's latest content to other clients in the same document room.
    // - Client side: socket.emit('send-changes', { documentId, content })
    // - Server side: `socket.on('send-changes', ...)` then `socket.to(documentId).emit('receive-changes', ...)`
    socketRef.current.emit('send-changes', {
      documentId,
      content,
    });

    // Schedule an autosave
    scheduleSave(content);
  }, [content, documentId]);

  // Debounced autosave function
  const scheduleSave = (nextContent) => {
    if (!documentId) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('Saving...');

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await axios.put(`${SERVER_URL}/api/documents/${documentId}`, {
          content: nextContent,
        });
        setSaveStatus('All changes saved');
      } catch (err) {
        console.error('Error saving document:', err);
        setSaveStatus('Error while saving');
      }
    }, SAVE_DEBOUNCE_MS);
  };

  // Handle text changes in the editor
  const handleEditorChange = (value, delta, source) => {
    // Only treat "user" changes as edits we should save/broadcast
    if (source === 'user') {
      setContent(value);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="flex items-center justify-between px-8 py-4 bg-slate-900 text-slate-50 shadow-md">
        <div>
          <h1 className="text-xl font-semibold">Real-Time Collaborative Document Editor</h1>
        </div>
        <div className="text-xs px-3 py-1 rounded-full border border-emerald-300/80 bg-emerald-900/40 text-emerald-200">
          {saveStatus}
        </div>
      </header>

      <main className="flex-1 flex justify-center p-6">
        {isLoading ? (
          <div className="flex items-center justify-center w-full max-w-3xl min-h-[300px] rounded-xl bg-slate-200 text-slate-600 font-medium">
            Loading document...
          </div>
        ) : (
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-4">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={handleEditorChange}
              modules={{ toolbar: TOOLBAR_OPTIONS }}
              placeholder="Start typing here..."
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default DocumentPage;

