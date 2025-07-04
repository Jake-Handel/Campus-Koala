'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChatBubbleLeftIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
        className={`p-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isDark
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
        }`}
        aria-label="Open AI Assistant"
      >
        <ChatBubbleLeftIcon className="h-6 w-6" />
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`flex flex-col rounded-lg shadow-xl overflow-hidden ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
          style={{ width: `${width}px`, height: `${height}px` }}
          ref={containerRef}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('chat');
                  if (!selectedConversation) {
                    setMessages([]);
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                  activeTab === 'chat'
                    ? isDark
                      ? 'text-indigo-400 border-b-2 border-indigo-400'
                      : 'text-indigo-600 border-b-2 border-indigo-600'
                    : isDark
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                  activeTab === 'history'
                    ? isDark
                      ? 'text-indigo-400 border-b-2 border-indigo-400'
                      : 'text-indigo-600 border-b-2 border-indigo-600'
                    : isDark
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                History
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold whitespace-nowrap ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                AI Assistant
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto p-4 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            {activeTab === 'chat' ? (
              <div className="space-y-4">
                {selectedConversation && (
                  <div className="flex items-center gap-2">
                    <h2 className={`text-lg font-semibold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {selectedConversation.title}
                    </h2>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? isDark
                            ? 'bg-indigo-700 text-white rounded-br-none'
                            : 'bg-indigo-100 text-indigo-900 rounded-br-none'
                          : isDark
                          ? 'bg-gray-700 text-white rounded-bl-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-500 opacity-50'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className={`text-lg font-semibold ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Chat History
                  </h2>
                  <p className={`text-sm mt-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Click to view or rename conversations
                  </p>
                </div>
                <div className="space-y-2">
                  {history?.map((conversation: AIConversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 border-b cursor-pointer transition-colors ${
                        isDark
                          ? 'border-gray-700 hover:bg-gray-700/50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={(e) => {
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
                            className={`flex-1 p-2 rounded-md ${
                              isDark
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border border-gray-300'
                            }`}
                            autoFocus
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTitleSave(conversation);
                            }}
                            className={`${
                              isDark ? 'text-green-400 hover:text-green-300' : 'text-green-500 hover:text-green-700'
                            }`}
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              isDark ? 'bg-indigo-900/50' : 'bg-indigo-100'
                            }`}>
                              <ChatBubbleLeftIcon className={`h-4 w-4 ${
                                isDark ? 'text-indigo-400' : 'text-indigo-600'
                              }`} />
                            </div>
                            <h3 className={`text-sm font-medium ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {conversation.title || 'New Chat'}
                            </h3>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTitleEdit(conversation);
                              }}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <span className="sr-only">Edit title</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(conversation.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <span className="sr-only">Delete conversation</span>
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
            <div className={`border-t p-4 ${
              isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'
            }`}>
              <div className="flex gap-2">
                <button
                  onClick={handleNewConversation}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-indigo-700 text-white hover:bg-indigo-600'
                      : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  }`}
                >
                  New Conversation
                </button>
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showHelp ? 'Hide Help' : 'Show Help'}
                </button>
              </div>
              {showHelp && (
                <div className={`mt-4 p-4 rounded-lg ${
                  isDark ? 'bg-gray-700/50 text-gray-200' : 'bg-gray-50 text-gray-800'
                }`}>
                  <h3 className="text-lg font-semibold mb-2">AI Assistant Help</h3>
                  <p className="text-sm">
                    The AI assistant maintains context across conversations. Each conversation is separate and maintains its own history.
                    You can:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    <li>Create new conversations for different topics</li>
                    <li>View conversation history and summaries</li>
                    <li>Rename conversations</li>
                    <li>Delete conversations</li>
                  </ul>
                </div>
              )}
              <div className="mt-4">
                {error && (
                  <div className={`p-3 rounded-lg mb-4 ${
                    isDark ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-700'
                  }`}>
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && input.trim() && sendMessage(input)}
                    placeholder="Type your message..."
                    className={`flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'border border-gray-300 bg-white text-gray-900'
                    }`}
                    disabled={loading}
                  />
                  <button
                    onClick={() => input.trim() && sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      !input.trim() || loading
                        ? isDark
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : isDark
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
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