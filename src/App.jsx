import React, { useState, useEffect, useRef } from 'react';
import { Search, Star, TrendingUp, Copy, X, Settings, Plus, Tag, BarChart3, ThumbsUp, ThumbsDown, FolderOpen, History, Folder, MoreVertical } from 'lucide-react';

const STORAGE_KEY = 'ai_prompt_manager_data';

const loadFromStorage = () => {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        resolve(result[STORAGE_KEY] || { prompts: [], folders: [] });
      });
    } else {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        resolve(data ? JSON.parse(data) : { prompts: [], folders: [] });
      } catch (e) {
        console.error('Error loading from storage:', e);
        resolve({ prompts: [], folders: [] });
      }
    }
  });
};

const saveToStorage = (data) => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ [STORAGE_KEY]: data });
  } else {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving to storage:', e);
    }
  }
};

const usePromptStore = () => {
  const [data, setData] = useState({ prompts: [], folders: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStarred, setFilterStarred] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadFromStorage().then((loadedData) => {
      setData(loadedData);
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveToStorage(data);
    }
  }, [data, isLoaded]);

  const addPrompt = (prompt) => {
    setData(prev => ({
      ...prev,
      prompts: [prompt, ...prev.prompts]
    }));
  };

  const updatePrompt = (id, updates) => {
    setData(prev => ({
      ...prev,
      prompts: prev.prompts.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const deletePrompt = (id) => {
    setData(prev => ({
      ...prev,
      prompts: prev.prompts.filter(p => p.id !== id)
    }));
  };

  const duplicatePrompt = (prompt) => {
    const duplicate = {
      ...prompt,
      id: Date.now().toString(),
      title: `${prompt.title} (Copy)`,
      useCount: 0,
      positiveCount: 0,
      negativeCount: 0,
      createdAt: new Date().toISOString()
    };
    addPrompt(duplicate);
  };

  const toggleStar = (id) => {
    setData(prev => ({
      ...prev,
      prompts: prev.prompts.map(p =>
        p.id === id ? { ...p, starred: !p.starred } : p
      )
    }));
  };

  const incrementUse = (id) => {
    setData(prev => ({
      ...prev,
      prompts: prev.prompts.map(p =>
        p.id === id ? { ...p, useCount: (p.useCount || 0) + 1 } : p
      )
    }));
  };

  const recordFeedback = (id, isPositive) => {
    setData(prev => ({
      ...prev,
      prompts: prev.prompts.map(p => {
        if (p.id === id) {
          return {
            ...p,
            positiveCount: (p.positiveCount || 0) + (isPositive ? 1 : 0),
            negativeCount: (p.negativeCount || 0) + (isPositive ? 0 : 1)
          };
        }
        return p;
      })
    }));
  };

  const createVersion = (promptId, content, changeNote) => {
    setData(prev => ({
      ...prev,
      prompts: prev.prompts.map(p => {
        if (p.id === promptId) {
          const newVersion = {
            version: (p.versions?.length || 0) + 1,
            content,
            changeNote,
            createdAt: new Date().toISOString()
          };
          return {
            ...p,
            content,
            versions: [...(p.versions || []), newVersion],
            currentVersion: newVersion.version
          };
        }
        return p;
      })
    }));
  };

  const rollbackVersion = (promptId, versionNumber) => {
    setData(prev => ({
      ...prev,
      prompts: prev.prompts.map(p => {
        if (p.id === promptId) {
          const version = p.versions?.find(v => v.version === versionNumber);
          if (version) {
            return {
              ...p,
              content: version.content,
              currentVersion: versionNumber
            };
          }
        }
        return p;
      })
    }));
  };

  const addFolder = (name) => {
    setData(prev => ({
      ...prev,
      folders: [...prev.folders, { id: Date.now().toString(), name }]
    }));
  };

  const assignToFolder = (promptId, folderId) => {
    setData(prev => ({
      ...prev,
      prompts: prev.prompts.map(p =>
        p.id === promptId ? { ...p, folderId } : p
      )
    }));
  };

  const filteredPrompts = data.prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStarred = !filterStarred || p.starred;
    const matchesFolder = !selectedFolder || p.folderId === selectedFolder;
    return matchesSearch && matchesStarred && matchesFolder;
  });

  return {
    prompts: filteredPrompts,
    folders: data.folders,
    searchQuery,
    setSearchQuery,
    filterStarred,
    setFilterStarred,
    selectedFolder,
    setSelectedFolder,
    addPrompt,
    updatePrompt,
    deletePrompt,
    duplicatePrompt,
    toggleStar,
    incrementUse,
    recordFeedback,
    createVersion,
    rollbackVersion,
    addFolder,
    assignToFolder
  };
};

const FeedbackModal = ({ prompt, onFeedback, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">How was this prompt?</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">{prompt.title}</p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onFeedback(true)}
              className="flex-1 flex flex-col items-center gap-2 p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
            >
              <ThumbsUp className="w-8 h-8 text-gray-400 group-hover:text-green-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">Helpful</span>
            </button>

            <button
              onClick={() => onFeedback(false)}
              className="flex-1 flex flex-col items-center gap-2 p-6 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors group"
            >
              <ThumbsDown className="w-8 h-8 text-gray-400 group-hover:text-red-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-red-700">Not Helpful</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VersionHistoryModal = ({ prompt, onRollback, onClose }) => {
  const versions = prompt.versions || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Version History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No version history yet
            </div>
          ) : (
            versions.reverse().map((version) => (
              <div key={version.version} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">Version {version.version}</span>
                    {version.version === prompt.currentVersion && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Current</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {version.changeNote && (
                  <p className="text-sm text-gray-600 mb-2">{version.changeNote}</p>
                )}

                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mb-2 line-clamp-3">
                  {version.content}
                </p>

                {version.version !== prompt.currentVersion && (
                  <button
                    onClick={() => onRollback(version.version)}
                    className="text-sm text-gray-900 hover:bg-gray-100 px-3 py-1 rounded"
                  >
                    Restore this version
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const AddPromptModal = ({ onAdd, onClose, editPrompt = null, prefillContent = '', store }) => {
  const [title, setTitle] = useState(editPrompt?.title || '');
  const [content, setContent] = useState(
    editPrompt ? editPrompt.content : prefillContent
  );  
  const [tags, setTags] = useState(editPrompt?.tags?.join(', ') || '');
  const [starred, setStarred] = useState(editPrompt?.starred || false);
  const [folderId, setFolderId] = useState(editPrompt?.folderId || '');
  const [changeNote, setChangeNote] = useState('');
  
  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    if (editPrompt) {
      store.createVersion(editPrompt.id, content, changeNote);
      store.updatePrompt(editPrompt.id, {
        title: title.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        starred,
        folderId
      });
      onClose();
    } else {
      const newPrompt = {
        id: Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        starred,
        folderId,
        useCount: 0,
        positiveCount: 0,
        negativeCount: 0,
        createdAt: new Date().toISOString(),
        versions: [{
          version: 1,
          content: content.trim(),
          changeNote: 'Initial version',
          createdAt: new Date().toISOString()
        }],
        currentVersion: 1
      };
      onAdd(newPrompt);
    }
  };

  const canSubmit = title.trim() && content.trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {editPrompt ? 'Edit Prompt' : 'Add New Prompt'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="e.g., Code Review Assistant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prompt Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              placeholder="Paste your prompt here..."
            />
          </div>

          {editPrompt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Change Note
              </label>
              <input
                type="text"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="What did you change?"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="e.g., coding, review, productivity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Folder
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">No folder</option>
              {store.folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStarred(!starred)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Star className={`w-4 h-4 ${starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
              <span className="text-sm text-gray-700">
                {starred ? 'Starred' : 'Add to favorites'}
              </span>
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editPrompt ? 'Save Changes' : 'Add Prompt'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PromptCard = ({ prompt, onUse, onToggleStar, onEdit, onDuplicate, onDelete, onViewHistory, compact = false }) => {
  const [showMenu, setShowMenu] = useState(false);
  const totalFeedback = (prompt.positiveCount || 0) + (prompt.negativeCount || 0);
  const positivePercent = totalFeedback > 0
    ? Math.round(((prompt.positiveCount || 0) / totalFeedback) * 100)
    : 0;

  const effectivenessColor =
    positivePercent >= 80 ? 'text-green-600' :
      positivePercent >= 60 ? 'text-yellow-600' : 'text-gray-600';

  if (compact) {
    return (
      <button
        onClick={() => onUse(prompt)}
        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md transition-colors group relative"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">{prompt.title}</span>
              {prompt.currentVersion > 1 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">v{prompt.currentVersion}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{prompt.useCount || 0} uses</span>
              {totalFeedback > 0 && (
                <span className={`text-xs ${effectivenessColor}`}>
                  👍 {positivePercent}%
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(prompt.id);
              }}
            >
              <Star className={`w-4 h-4 ${prompt.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{prompt.title}</h3>
            {prompt.currentVersion > 1 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">v{prompt.currentVersion}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {prompt.tags?.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onToggleStar(prompt.id)}>
            <Star className={`w-5 h-5 ${prompt.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => { onEdit(prompt); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => { onViewHistory(prompt); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  Version History
                </button>
                <button
                  onClick={() => { onDuplicate(prompt); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => { onDelete(prompt.id); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{prompt.content}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Copy className="w-4 h-4" />
            {prompt.useCount || 0}
          </span>
          {totalFeedback > 0 && (
            <span className={`flex items-center gap-1 ${effectivenessColor}`}>
              <TrendingUp className="w-4 h-4" />
              {positivePercent}% helpful
            </span>
          )}
        </div>
        <button
          onClick={() => onUse(prompt)}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors"
        >
          Use Prompt
        </button>
      </div>
    </div>
  );
};

const PromptDropdown = ({ isOpen, onClose, onUsePrompt, onAddPrompt, store, openSidebar }) => {
  const searchRef = useRef(null);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search prompts... (Cmd/Ctrl + K)"
              value={store.searchQuery}
              onChange={(e) => store.setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <button
              onClick={() => openSidebar()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 shadow-lg flex items-center gap-1 font-medium"
            >
              <BarChart3 className="w-4 h-4" />
              Library
            </button>
            <button
              onClick={onAddPrompt}
              className="absolute right-[6.8rem] top-1/2 -translate-y-1/2 px-3 py-1 bg-black border border-gray-300 text-white rounded-md hover:bg-gray-700 shadow-lg flex items-center gap-1 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => store.setFilterStarred(!store.filterStarred)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${store.filterStarred
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Star className="w-4 h-4 inline mr-1" />
              Starred
            </button>
            {store.folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => store.setSelectedFolder(store.selectedFolder === folder.id ? null : folder.id)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${store.selectedFolder === folder.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Folder className="w-4 h-4 inline mr-1" />
                {folder.name}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {store.prompts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No prompts yet</p>
              <button
                onClick={onAddPrompt}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
              >
                Create your first prompt
              </button>
            </div>
          ) : (
            store.prompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onUse={onUsePrompt}
                onToggleStar={store.toggleStar}
                compact
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const PromptSidebar = ({ isOpen, onClose, onUsePrompt, onEdit, onDuplicate, onDelete, onViewHistory, store }) => {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      store.addFolder(newFolderName.trim());
      setNewFolderName('');
      setShowFolderModal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Prompt Library</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={store.searchQuery}
            onChange={(e) => store.setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => store.setFilterStarred(!store.filterStarred)}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${store.filterStarred
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
          >
            <Star className="w-4 h-4 inline mr-1" />
            Starred
          </button>
          <button
            onClick={() => setShowFolderModal(true)}
            className="px-3 py-1.5 text-sm bg-white text-gray-700 rounded-md hover:bg-gray-100 border border-gray-300"
          >
            <FolderOpen className="w-4 h-4 inline mr-1" />
          </button>
        </div>

        {store.folders.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {store.folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => store.setSelectedFolder(store.selectedFolder === folder.id ? null : folder.id)}
                className={`px-2 py-1 text-xs rounded transition-colors ${store.selectedFolder === folder.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {folder.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {store.prompts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No prompts found
          </div>
        ) : (
          store.prompts.map(prompt => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onUse={onUsePrompt}
              onToggleStar={store.toggleStar}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onViewHistory={onViewHistory}
            />
          ))
        )}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{store.prompts.length} prompts</span>
          <button className="flex items-center gap-1 hover:text-gray-900">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {showFolderModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="font-semibold mb-3">New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 border rounded-md mb-3"
              onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-3 py-1.5 text-sm hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFolder}
                className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [prefillContent, setPrefillContent] = useState('');
  const [addPromptModal, setAddPromptModal] = useState(false);
  const [editPrompt, setEditPrompt] = useState(null);
  const [versionHistory, setVersionHistory] = useState(null);
  const store = usePromptStore();
  useEffect(() => {
    const handleToggle = () => {
      setSidebarOpen(false);
      setDropdownOpen(prev => !prev);
    };

    window.addEventListener('togglePromptManager', handleToggle);
    return () => window.removeEventListener('togglePromptManager', handleToggle);
  }, []);
  useEffect(() => {
    const handler = () => {
      const text = getCurrentChatInputText();
      if (!text) return;
    
      setPrefillContent(text);
      setEditPrompt(null);     
      setAddPromptModal(true); 
    };
    
  
    window.addEventListener('openAddPromptFromChat', handler);
    return () => {
      window.removeEventListener('openAddPromptFromChat', handler);
    };
  }, []);
  
  useEffect(() => {
    const handleKeyboard = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSidebarOpen(false);
        setDropdownOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);


  const insertPrompt = (content) => {
    const chatGPTInput = document.querySelector('#prompt-textarea p');
    const geminiInput = document.querySelector('.ql-editor.textarea.new-input-ui p');
    let claudeInput = null;
    const selectors = [
      '[data-testid="chat-input"] p',
      '[data-testid="chat-input"]',
      'div[contenteditable="true"][role="textbox"] p',
      'div[contenteditable="true"][role="textbox"]',
      '.tiptap p',
      '.tiptap'
    ];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && !claudeInput) {
        claudeInput = element;
        break;
      }
    }

    const targetInput = chatGPTInput || geminiInput || claudeInput;
    if (targetInput) {
      const existingText = targetInput.textContent || '';
      const separator = existingText.trim() ? '\n\n' : '';
      targetInput.textContent = existingText + separator + content;
      targetInput.focus();

      const event = new Event('input', { bubbles: true });
      targetInput.dispatchEvent(event);
    } else {
      console.error('No input field found!');
      navigator.clipboard.writeText(content);
      alert('Prompt copied to clipboard!');
    }
  };
  const getCurrentChatInputText = () => {
    const selectors = [
      '#prompt-textarea p',
      '.ql-editor.textarea.new-input-ui p',
      '[data-testid="chat-input"]',
      'div[contenteditable="true"][role="textbox"]',
      '.tiptap'
    ];
  
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent?.trim()) {
        return el.textContent.trim();
      }
    }
  
    return '';
  };
  

  const handleUsePrompt = (prompt) => {
    store.incrementUse(prompt.id);
    insertPrompt(prompt.content);
    setDropdownOpen(false);
    setSidebarOpen(false);

    setTimeout(() => setFeedbackModal(prompt), 500);
  };

  const handleFeedback = (isPositive) => {
    if (feedbackModal) {
      store.recordFeedback(feedbackModal.id, isPositive);
      setFeedbackModal(null);
    }
  };

  const handleAddPrompt = (prompt) => {
    store.addPrompt(prompt);
    setAddPromptModal(false);
  };

  const handleEdit = (prompt) => {
    setEditPrompt(prompt);
  };

  const openAddPrompt = () => {
    setAddPromptModal(true);
    setDropdownOpen(false);
  };

  const openSidebar = () => {
    setDropdownOpen(false);
    setSidebarOpen(true);
  };

  return (
    <div className="ai-prompt-manager">
      <PromptDropdown
        isOpen={dropdownOpen}
        openSidebar={openSidebar}
        onClose={() => setDropdownOpen(false)}
        onUsePrompt={handleUsePrompt}
        onAddPrompt={openAddPrompt}
        store={store}
      />

      <PromptSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onUsePrompt={handleUsePrompt}
        onEdit={handleEdit}
        onDuplicate={store.duplicatePrompt}
        onDelete={store.deletePrompt}
        onViewHistory={setVersionHistory}
        store={store}
      />

      {feedbackModal && (
        <FeedbackModal
          prompt={feedbackModal}
          onFeedback={handleFeedback}
          onClose={() => setFeedbackModal(null)}
        />
      )}

{(addPromptModal || editPrompt) && (
  <AddPromptModal
    onAdd={handleAddPrompt}
    onClose={() => {
      setAddPromptModal(false);
      setEditPrompt(null);
      setPrefillContent('');
    }}
    editPrompt={editPrompt}
    prefillContent={prefillContent}
    store={store}
  />
)}
      {versionHistory && (
        <VersionHistoryModal
          prompt={versionHistory}
          onRollback={(version) => {
            store.rollbackVersion(versionHistory.id, version);
            setVersionHistory(null);
          }}
          onClose={() => setVersionHistory(null)}
        />
      )}
    </div>
  );
}