import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Users, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useSession } from '../contexts/SessionContext';
import { useConfig } from '../contexts/ConfigContext';
import { toast } from 'sonner';

const SessionListPage = () => {
  const { sessions, loading, createSession, loadSessions } = useSession();
  const { config } = useConfig();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    business_context: 'generic',
    estimated_duration: 60
  });

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSession = async (e) => {
    e.preventDefault();
    
    if (!config.openai.configured) {
      toast.error('Veuillez d\'abord configurer OpenAI');
      return;
    }

    const session = await createSession(newSession);
    if (session) {
      setShowCreateDialog(false);
      setNewSession({
        title: '',
        description: '',
        business_context: 'generic',
        estimated_duration: 60
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      waiting: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-orange-100 text-orange-800',
      completed: 'bg-blue-100 text-blue-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      waiting: 'En attente',
      active: 'Active',
      paused: 'En pause',
      completed: 'Terminée',
      archived: 'Archivée'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions BDD</h1>
          <p className="text-muted-foreground">
            Gérez vos sessions de développement dirigé par le comportement.
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button disabled={!config.openai.configured}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Créer une Nouvelle Session BDD</DialogTitle>
              <DialogDescription>
                Configurez votre session collaborative pour commencer à travailler avec votre équipe.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de la Session *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Fonctionnalité de Connexion Utilisateur"
                  value={newSession.title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez l'objectif et le contexte de cette session..."
                  value={newSession.description}
                  onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="business_context">Contexte Métier</Label>
                <Select 
                  value={newSession.business_context} 
                  onValueChange={(value) => setNewSession(prev => ({ ...prev, business_context: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">Générique</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Santé</SelectItem>
                    <SelectItem value="education">Éducation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Durée Estimée (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="480"
                  value={newSession.estimated_duration}
                  onChange={(e) => setNewSession(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) }))}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Création...' : 'Créer la Session'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="waiting">En attente</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">En pause</SelectItem>
            <SelectItem value="completed">Terminée</SelectItem>
            <SelectItem value="archived">Archivée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement des sessions...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {sessions.length === 0 ? 'Aucune session trouvée' : 'Aucun résultat'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {sessions.length === 0 
              ? 'Créez votre première session BDD pour commencer.'
              : 'Essayez de modifier vos critères de recherche.'
            }
          </p>
          {sessions.length === 0 && config.openai.configured && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer une Session
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{session.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {session.description}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(session.status)}>
                    {getStatusLabel(session.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatDate(session.created_at)}
                  </div>
                  {session.estimated_duration && (
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      {session.estimated_duration}min
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {session.participants?.length || 0} participant(s)
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/session/${session.id}`} className="flex items-center">
                      Ouvrir
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Configuration Warning */}
      {!config.openai.configured && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-orange-800">Configuration OpenAI requise</p>
                <p className="text-sm text-orange-700">
                  Configurez votre clé API OpenAI pour créer et utiliser des sessions BDD.
                </p>
              </div>
              <Button asChild variant="outline" className="border-orange-300 text-orange-800">
                <Link to="/config">Configurer</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SessionListPage;

