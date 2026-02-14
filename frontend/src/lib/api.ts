const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('familia_token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'Request failed');
  }
  
  return response.json();
}

export const api = {
  // Auth
  signup: (data: any) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  verify: (data: any) => request('/auth/verify', { method: 'POST', body: JSON.stringify(data) }),
  
  // Profiles
  getProfile: (userId: string) => request(`/profiles/${userId}`),
  updateProfile: (userId: string, data: any) => request(`/profiles/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateAvatar: (userId: string, config: any) => request(`/profiles/${userId}/avatar`, { method: 'PUT', body: JSON.stringify(config) }),
  addLanguage: (userId: string, data: any) => request(`/profiles/${userId}/languages`, { method: 'POST', body: JSON.stringify(data) }),
  getRelationships: (userId: string) => request(`/profiles/${userId}/relationships`),
  getNotifications: (userId: string) => request(`/profiles/${userId}/notifications`),
  
  // Matching
  searchMatch: (data: any) => request('/matching/search', { method: 'POST', body: JSON.stringify(data) }),
  checkQueue: (userId: string) => request(`/matching/queue/${userId}`),
  cancelMatching: (userId: string) => request(`/matching/queue/${userId}`, { method: 'DELETE' }),
  getRoles: () => request('/matching/roles'),
  
  // Chat
  sendMessage: (data: any) => request('/chat/send', { method: 'POST', body: JSON.stringify(data) }),
  getMessages: (relationshipId: string, limit?: number) => request(`/chat/messages/${relationshipId}?limit=${limit || 50}`),
  getRelationship: (relationshipId: string) => request(`/chat/relationship/${relationshipId}`),
  
  // Contests
  createContest: (data: any) => request('/contests/create', { method: 'POST', body: JSON.stringify(data) }),
  getContests: (relationshipId: string) => request(`/contests/relationship/${relationshipId}`),
  getContest: (contestId: string) => request(`/contests/${contestId}`),
  submitAnswer: (data: any) => request('/contests/answer', { method: 'POST', body: JSON.stringify(data) }),
  completeContest: (contestId: string) => request(`/contests/${contestId}/complete`, { method: 'POST' }),
  
  // Games
  getGames: () => request('/games/'),
  startGame: (data: any) => request('/games/start', { method: 'POST', body: JSON.stringify(data) }),
  gameAction: (data: any) => request('/games/action', { method: 'POST', body: JSON.stringify(data) }),
  getGameSession: (sessionId: string) => request(`/games/session/${sessionId}`),
  getGameHistory: (relationshipId: string) => request(`/games/history/${relationshipId}`),
  
  // Family Rooms
  createRoom: (data: any) => request('/rooms/create', { method: 'POST', body: JSON.stringify(data) }),
  getRooms: () => request('/rooms/'),
  inviteToRoom: (roomId: string, data: any) => request(`/rooms/${roomId}/invite`, { method: 'POST', body: JSON.stringify(data) }),
  sendRoomMessage: (roomId: string, data: any) => request(`/rooms/${roomId}/message`, { method: 'POST', body: JSON.stringify(data) }),
  getRoomMessages: (roomId: string) => request(`/rooms/${roomId}/messages`),
  leaveRoom: (roomId: string) => request(`/rooms/${roomId}/leave`, { method: 'POST' }),
  getPotlucks: (roomId: string) => request(`/rooms/${roomId}/potlucks`),
  createPotluck: (roomId: string, data: any) => request(`/rooms/${roomId}/potluck`, { method: 'POST', body: JSON.stringify(data) }),
  
  // Safety
  reportUser: (data: any) => request('/safety/report', { method: 'POST', body: JSON.stringify(data) }),
  severBond: (data: any) => request('/safety/sever', { method: 'POST', body: JSON.stringify(data) }),
  
  // Translation
  translate: (text: string, sourceLang?: string, targetLang?: string) => 
    request(`/translate/?text=${encodeURIComponent(text)}&source_lang=${sourceLang || ''}&target_lang=${targetLang || 'en'}`, { method: 'POST' }),
  getLanguages: () => request('/translate/languages'),
};
