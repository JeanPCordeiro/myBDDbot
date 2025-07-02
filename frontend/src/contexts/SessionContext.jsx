import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useConfig } from './ConfigContext';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const { config } = useConfig();
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  // Charger les sessions de l'utilisateur
  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.api.baseUrl}/sessions`, {
        headers: {
          'Authorization': `Bearer ${getUserToken()}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSessions(result.data);
      } else {
        toast.error('Erreur lors du chargement des sessions');
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Créer une nouvelle session
  const createSession = async (sessionData) => {
    setLoading(true);
    try {
      const response = await fetch(`${config.api.baseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getUserToken()}`
        },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        const result = await response.json();
        setSessions(prev => [result.data, ...prev]);
        toast.success('Session créée avec succès !');
        return result.data;
      } else {
        const error = await response.json();
        toast.error(`Erreur: ${error.message}`);
        return null;
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Erreur lors de la création de la session');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Rejoindre une session
  const joinSession = async (sessionId) => {
    setLoading(true);
    try {
      const response = await fetch(`${config.api.baseUrl}/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${getUserToken()}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentSession(result.data);
        setMessages(result.data.messages || []);
        setScenarios(result.data.scenarios || []);
        setParticipants(result.data.participants || []);
        
        // Établir la connexion WebSocket
        connectToSession(sessionId);
        
        toast.success('Session rejointe !');
        return result.data;
      } else {
        toast.error('Erreur lors de l\'accès à la session');
        return null;
      }
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Erreur de connexion à la session');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Quitter une session
  const leaveSession = async () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    setCurrentSession(null);
    setMessages([]);
    setScenarios([]);
    setParticipants([]);
    setConnected(false);
  };

  // Envoyer un message
  const sendMessage = async (content, type = 'text') => {
    if (!currentSession || !socket) {
      toast.error('Non connecté à une session');
      return;
    }

    const messageData = {
      message: content,
      messageType: type,
      timestamp: new Date().toISOString()
    };

    socket.emit('send_message', messageData);
  };

  // Connecter à une session via WebSocket
  const connectToSession = (sessionId) => {
    try {
      // Note: En développement, nous simulons la connexion WebSocket
      // En production, ceci utiliserait socket.io-client
      const mockSocket = {
        emit: (event, data) => {
          console.log('Socket emit:', event, data);
          
          // Simuler la réponse du bot pour les tests
          if (event === 'send_message') {
            setTimeout(() => {
              const botResponse = {
                id: Date.now(),
                sender: {
                  id: 'bot',
                  type: 'bot',
                  name: 'Assistant Testeur'
                },
                content: `Merci pour votre message: "${data.message}". Je suis là pour vous aider avec vos sessions BDD !`,
                type: 'text',
                timestamp: new Date().toISOString()
              };
              
              setMessages(prev => [...prev, {
                id: Date.now() - 1,
                sender: {
                  id: 'user',
                  type: 'user',
                  name: 'Vous'
                },
                content: data.message,
                type: data.messageType,
                timestamp: data.timestamp
              }, botResponse]);
            }, 1000);
          }
        },
        disconnect: () => {
          console.log('Socket disconnected');
          setConnected(false);
        }
      };

      setSocket(mockSocket);
      setConnected(true);
      
      toast.success('Connecté à la session en temps réel');
    } catch (error) {
      console.error('Error connecting to session:', error);
      toast.error('Erreur de connexion WebSocket');
    }
  };

  // Générer des scénarios
  const generateScenarios = async (requirements) => {
    if (!currentSession) {
      toast.error('Aucune session active');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.api.baseUrl}/bot/generate-scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getUserToken()}`
        },
        body: JSON.stringify({
          session_id: currentSession.id,
          requirements,
          context: {
            businessContext: currentSession.business_context
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setScenarios(prev => [...prev, ...result.data.scenarios]);
        toast.success(`${result.data.scenarios.length} scénarios générés !`);
        return result.data.scenarios;
      } else {
        const error = await response.json();
        toast.error(`Erreur: ${error.message}`);
        return [];
      }
    } catch (error) {
      console.error('Error generating scenarios:', error);
      toast.error('Erreur lors de la génération des scénarios');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Obtenir le token utilisateur (simulation pour le développement)
  const getUserToken = () => {
    // En développement, retourner un token fictif
    // En production, ceci devrait récupérer le vrai token d'authentification
    return 'dev-token';
  };

  // Charger les sessions au démarrage
  useEffect(() => {
    if (config.api.baseUrl) {
      loadSessions();
    }
  }, [config.api.baseUrl]);

  const value = {
    sessions,
    currentSession,
    messages,
    scenarios,
    participants,
    loading,
    connected,
    loadSessions,
    createSession,
    joinSession,
    leaveSession,
    sendMessage,
    generateScenarios
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

