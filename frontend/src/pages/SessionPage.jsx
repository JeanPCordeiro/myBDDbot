import { ArrowLeft, Bot, Copy, Download, FileText, Send, Settings, User, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useConfig } from '../contexts/ConfigContext';
import { useSession } from '../contexts/SessionContext';

const SessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    currentSession, 
    messages, 
    scenarios, 
    participants, 
    loading, 
    connected,
    joinSession, 
    leaveSession, 
    sendMessage,
    generateScenarios
  } = useSession();
  const { config } = useConfig();

  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (id && !currentSession) {
      joinSession(id);
    }

    return () => {
      if (currentSession) {
        leaveSession();
      }
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !connected) return;

    await sendMessage(messageInput);
    setMessageInput('');
  };

  const handleGenerateScenarios = async () => {
    const requirements = prompt('Décrivez les exigences pour lesquelles vous souhaitez générer des scénarios :');
    if (requirements) {
      await generateScenarios(requirements);
      setActiveTab('scenarios');
    }
  };

  const copyScenario = (scenario) => {
    navigator.clipboard.writeText(scenario.gherkin_content);
    toast.success('Scénario copié dans le presse-papiers');
  };

  const exportScenarios = () => {
    const content = scenarios.map(s => s.gherkin_content).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenarios-${currentSession?.title || 'session'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Scénarios exportés');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      waiting: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-orange-100 text-orange-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Chargement de la session...</p>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Session non trouvée</h2>
        <p className="text-muted-foreground mb-4">
          La session demandée n'existe pas ou vous n'y avez pas accès.
        </p>
        <Button onClick={() => navigate('/sessions')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux Sessions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/sessions')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{currentSession.title}</h1>
            <p className="text-muted-foreground">{currentSession.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(currentSession.status)}>
            {currentSession.status}
          </Badge>
          <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {connected ? 'Connecté' : 'Déconnecté'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat and Scenarios */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chat" className="flex items-center">
                    <Bot className="mr-2 h-4 w-4" />
                    Chat Assistant
                  </TabsTrigger>
                  <TabsTrigger value="scenarios" className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Scénarios ({scenarios.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              <Tabs value={activeTab} className="flex-1 flex flex-col">
                {/* Chat Tab */}
                <TabsContent value="chat" className="flex-1 flex flex-col m-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex max-w-[80%] ${message.sender_type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <Avatar className="h-8 w-8 mx-2">
                              <AvatarFallback>
                                {message.sender_type === 'bot' ? (
                                  <Bot className="h-4 w-4" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`rounded-lg p-3 ${
                              message.sender_type === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              <div className="text-sm font-medium mb-1">
                                {message.sender_type}
                              </div>
                              <div className="whitespace-pre-wrap">{message.content}</div>
                              <div className="text-xs opacity-70 mt-1">
                                {formatTime(message.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <Separator />

                  <div className="p-4">
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                      <Input
                        placeholder={connected ? "Tapez votre message..." : "Connexion en cours..."}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        disabled={!connected}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!connected || !messageInput.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                    
                    <div className="flex justify-center mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleGenerateScenarios}
                        disabled={!connected}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Générer des Scénarios
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Scenarios Tab */}
                <TabsContent value="scenarios" className="flex-1 flex flex-col m-0">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Scénarios Générés</h3>
                      {scenarios.length > 0 && (
                        <Button variant="outline" size="sm" onClick={exportScenarios}>
                          <Download className="mr-2 h-4 w-4" />
                          Exporter
                        </Button>
                      )}
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    {scenarios.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-medium mb-2">Aucun scénario généré</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Demandez au bot de générer des scénarios basés sur vos exigences.
                        </p>
                        <Button variant="outline" onClick={handleGenerateScenarios}>
                          Générer des Scénarios
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {scenarios.map((scenario) => (
                          <Card key={scenario.id}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{scenario.title}</CardTitle>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary">{scenario.category}</Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyScenario(scenario)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md overflow-x-auto">
                                {scenario.gherkin_content}
                              </pre>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {participant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{participant.name}</p>
                    <p className="text-xs text-muted-foreground">{participant.role}</p>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${
                    participant.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                </div>
              ))}
              
              {participants.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun participant connecté
                </p>
              )}
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Contexte Métier</p>
                <p className="text-sm text-muted-foreground">{currentSession.business_context}</p>
              </div>
              
              {currentSession.estimated_duration && (
                <div>
                  <p className="text-sm font-medium">Durée Estimée</p>
                  <p className="text-sm text-muted-foreground">{currentSession.estimated_duration} minutes</p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium">Créée le</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentSession.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Messages</p>
                <p className="text-sm text-muted-foreground">{messages.length}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Scénarios</p>
                <p className="text-sm text-muted-foreground">{scenarios.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SessionPage;

