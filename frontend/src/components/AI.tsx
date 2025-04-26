'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChatBubbleLeftIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIConversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages: any[];
  is_active: boolean;
  summary: string;
}

export default function AIAssistant() {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [history, setHistory] = useState<AIConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AIConversation | null>(null);
  const [activeConversation, setActiveConversation] = useState<AIConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTitleEdit, setShowTitleEdit] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [context, setContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(600);
  const resizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchChatHistory().catch(error => {
        setError('Failed to fetch chat history');
        console.error('Error fetching chat history:', error);
      });
    }
  }, [token]);

  useEffect(() => {
    if (selectedConversation?.id) {
      loadConversation(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', () => {});
      document.removeEventListener('mouseup', () => {});
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    if (resizeRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const startX = e.pageX;
      const startY = e.pageY;
      const startWidth = width;
      const startHeight = height;
    
      const onMouseMove = (e: MouseEvent) => {
        e.preventDefault(); // Prevent text selection during resize
        const deltaX = e.pageX - startX;
        const deltaY = e.pageY - startY;
        
        // Calculate new dimensions based on cursor movement
        const newWidth = Math.max(400, Math.min(startWidth - deltaX, window.innerWidth * 0.6 - 40));
        const newHeight = Math.max(400, Math.min(startHeight - deltaY, window.innerHeight * 0.8 - 40));
        
        setWidth(newWidth);
        setHeight(newHeight);
      };

      const onMouseUp = () => {
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      // Add event listeners
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      
      // Prevent text selection during resize
      document.body.style.userSelect = 'none';
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup any remaining event listeners if they exist
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', () => {});
      document.removeEventListener('mouseup', () => {});
    };
  }, []);

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/gemini/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch chat history');
      }

      const data = await response.json();
      setHistory(data.conversations);
      setLoading(false);

      // Set active conversation if none is selected
      if (!selectedConversation && data.conversations.length > 0) {
        const activeConv = data.conversations.find((conv: AIConversation) => conv.is_active);
        if (activeConv) {
          setSelectedConversation(activeConv);
          setActiveConversation(activeConv);
        }
      }
    } catch (error) {
      setError('Failed to fetch chat history');
      console.error('Error fetching chat history:', error);
      setLoading(false);
    }
  };

  const loadConversation = async (conversationId: number | string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5000/api/gemini/conversation/${conversationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load conversation');
      }

      const data = await response.json();
      const conversation = data.conversation;
      
      // Fetch conversation context
      const summary = await fetchConversationContext(conversation.id);
      
      // Convert messages to the format expected by the chat component
      const chatHistory = conversation.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at).toLocaleString()
      }));

      setSelectedConversation(conversation);
      setActiveConversation(conversation);
      setMessages(chatHistory);
      setActiveTab('chat');
      setLoading(false);
      
      // Update context with the conversation context
      setContext(summary || '');
    } catch (error) {
      setError('Failed to load conversation');
      console.error('Error loading conversation:', error);
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5000/api/gemini/conversation/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete conversation');
      }

      // Update local state
      const updatedHistory = history.filter(conversation => conversation.id !== conversationId);
      setHistory(updatedHistory);

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      setError(null);
    } catch (error) {
      setError('Failed to delete conversation');
      console.error('Error deleting conversation:', error);
    }
  };

  const deactivateConversation = async (conversationId: number | string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5000/api/gemini/conversation/${conversationId}/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deactivate conversation');
      }

      // Create a new conversation with welcome message
      const response2 = await fetch('http://localhost:5000/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: 'Welcome to your new conversation!' }),
        credentials: 'include',
      });

      if (!response2.ok) {
        const errorData = await response2.json();
        throw new Error(errorData.error || 'Failed to create new conversation');
      }

      const data = await response2.json();
      const conversation = data.conversation;
      setSelectedConversation(conversation);
      setActiveConversation(conversation);

      fetchChatHistory();
      setError(null);
    } catch (error) {
      setError('Failed to deactivate conversation');
      console.error('Error deactivating conversation:', error);
    }
  };

  const sendMessage = async (message: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: message, 
          conversation_id: selectedConversation?.id,
          context: context  // Pass the current context
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate response');
      }

      const data = await response.json();
      
      // Update messages with the new response
      const newMessages = [...messages, 
        { role: 'user', content: message, timestamp: new Date().toLocaleString() },
        { role: 'assistant', content: data.response, timestamp: new Date().toLocaleString() }
      ];
      setMessages(newMessages as Message[]);
      setContext(data.context);  // Update context with the new conversation state
      
      // Update selected conversation
      const conversation = data.conversation;
      setSelectedConversation(conversation);
      setActiveConversation(conversation);
      
      setError(null);
      setInput('');
      scrollToBottom();
    } catch (error) {
      setError('Failed to send message');
      console.error('Error sending message:', error);
    }
  };

  const handleTitleEdit = (conversation: AIConversation) => {
    setNewTitle(conversation.title);
    setShowTitleEdit(conversation.id);
  };

  const handleTitleSave = async (conversation: AIConversation) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5000/api/gemini/conversation/${conversation.id}/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rename conversation');
      }

      // Update the conversation title in state
      const updatedHistory = history.map(conv => 
        conv.id === conversation.id ? { ...conv, title: newTitle } : conv
      );
      setHistory(updatedHistory);
      
      if (selectedConversation?.id === conversation.id) {
        setSelectedConversation({ ...selectedConversation, title: newTitle });
      }

      setShowTitleEdit(null);
      setError(null);
    } catch (error) {
      setError('Failed to rename conversation');
      console.error('Error renaming conversation:', error);
    }
  };

  const handleTitleCancel = () => {
    setShowTitleEdit(null);
    setNewTitle('');
  };

  const handleNewConversation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Deactivate current conversation if any
      if (selectedConversation) {
        await fetch(`http://localhost:5000/api/gemini/conversation/${selectedConversation.id}/deactivate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
      }

      // Create new conversation
      const response = await fetch('http://localhost:5000/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: 'Welcome to your new conversation!' }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create new conversation');
      }

      fetchChatHistory();
      setError(null);
    } catch (error) {
      setError('Failed to create new conversation');
      console.error('Error creating new conversation:', error);
    }
  };

  const fetchConversationContext = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5000/api/gemini/conversation/${conversationId}/context`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get conversation context');
      }

      const data = await response.json();
      setContext(data.context);
      return data.summary;
    } catch (error) {
      console.error('Error fetching conversation context:', error);
      return null;
    }
  };

  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
      >
        <ChatBubbleLeftIcon className="w-6 h-6" />
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 right-4 bg-white rounded-lg shadow-xl border border-gray-100 flex flex-col min-w-[400px] max-w-[60vw]"
          style={{ 
            width: width, 
            height: height,
            maxHeight: '80vh',
            cursor: 'default'
          }}
          ref={containerRef}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div
                ref={resizeRef}
                onMouseDown={handleResizeStart}
                className="size-6 flex items-center justify-center bg-gray-100 rounded cursor-ns-resize hover:bg-gray-200 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-4 text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                  />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab('chat');
                    if (!selectedConversation) {
                      setMessages([]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg ${activeTab === 'chat' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Chat
                </button>
                <button
                  onClick={() => {
                    setActiveTab('history');
                    setMessages([]);
                    setSelectedConversation(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg ${activeTab === 'history' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  History
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold whitespace-nowrap">AI Assistant</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'chat' ? (
              <div className="space-y-4">
                {selectedConversation && (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-800">{selectedConversation.title}</h2>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`inline-block p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      style={{
                        maxWidth: '80%', // Limit message width to 80% of container
                        wordBreak: 'break-word'
                      }}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs text-gray-500 mt-1">{message.timestamp}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
                  <p className="text-sm text-gray-500 mt-1">Click to view or rename conversations</p>
                </div>
                
                <div className="space-y-2">
                  {history?.map((conversation: AIConversation) => (
                    <div
                      key={conversation.id}
                      className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => {
                        // Only handle click if not clicking a button
                        if (!(e.target as HTMLElement).closest('button')) {
                          loadConversation(conversation.id);
                        }
                      }}
                    >
                      {showTitleEdit === conversation.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="flex-1 p-2 border rounded-md bg-white"
                            autoFocus
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTitleSave(conversation);
                            }}
                            className="text-green-500 hover:text-green-700"
                          >
                            <span className="sr-only">Save title</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTitleCancel();
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <span className="sr-only">Cancel</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-800 flex-1" onClick={() => loadConversation(conversation.id)}>
                              {conversation.title}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTitleEdit(conversation);
                              }}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <span className="sr-only">Rename conversation</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-500">
                              {new Date(conversation.created_at).toLocaleDateString()} at {new Date(conversation.created_at).toLocaleTimeString()}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(conversation.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {activeTab === 'chat' && (
            <div className="border-t border-gray-100 p-4">
              <div className="flex gap-2">
                <button
                  onClick={handleNewConversation}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  New Conversation
                </button>
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="flex-1 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {showHelp ? 'Hide' : 'Show'} Help
                </button>
              </div>
              {showHelp && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">AI Assistant Help</h3>
                  <p className="text-sm text-gray-600">
                    The AI assistant maintains context across conversations. Each conversation is separate and maintains its own history.
                    You can:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
                    <li>Create new conversations for different topics</li>
                    <li>View conversation history and summaries</li>
                    <li>Rename conversations</li>
                    <li>Delete conversations</li>
                  </ul>
                </div>
              )}
              <div className="mt-4">
                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && input.trim()) {
                        sendMessage(input.trim());
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 p-3 border bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                  />
                  <button
                    onClick={() => sendMessage(input.trim())}
                    disabled={loading || !input.trim()}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      loading || !input.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {loading ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}