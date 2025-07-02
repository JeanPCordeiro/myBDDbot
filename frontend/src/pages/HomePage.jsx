import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Users, Settings, ArrowRight, CheckCircle, MessageSquare, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useConfig } from '../contexts/ConfigContext';
import { useSession } from '../contexts/SessionContext';

const HomePage = () => {
  const { config } = useConfig();
  const { sessions } = useSession();

  const features = [
    {
      icon: MessageSquare,
      title: 'Assistant Testeur IA',
      description: 'Un bot intelligent qui vous guide dans la création de scénarios BDD et pose les bonnes questions.'
    },
    {
      icon: Users,
      title: 'Collaboration Temps Réel',
      description: 'Travaillez ensemble avec votre équipe (Business Analyst, Développeur, Testeur) en temps réel.'
    },
    {
      icon: FileText,
      title: 'Génération de Scénarios',
      description: 'Génération automatique de scénarios Gherkin complets et de qualité professionnelle.'
    },
    {
      icon: CheckCircle,
      title: 'Validation Automatique',
      description: 'Validation de la syntaxe et de la complétude de vos critères d\'acceptation.'
    }
  ];

  const quickActions = [
    {
      title: 'Nouvelle Session BDD',
      description: 'Créer une nouvelle session collaborative',
      action: 'Créer',
      link: '/sessions',
      variant: 'default',
      disabled: !config.openai.configured
    },
    {
      title: 'Configurer OpenAI',
      description: 'Configurer votre clé API OpenAI',
      action: 'Configurer',
      link: '/config',
      variant: 'outline',
      disabled: false
    },
    {
      title: 'Mes Sessions',
      description: `${sessions.length} session(s) disponible(s)`,
      action: 'Voir',
      link: '/sessions',
      variant: 'secondary',
      disabled: false
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Bot className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          BDD Bot Assistant
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Facilitez vos sessions BDD avec un assistant IA intelligent qui guide votre équipe 
          dans la création de scénarios de test de qualité selon la méthode des Trois Amigos.
        </p>
        
        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge variant={config.openai.configured ? 'default' : 'destructive'}>
            {config.openai.configured ? 'Prêt à utiliser' : 'Configuration requise'}
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action, index) => (
          <Card key={index} className={action.disabled ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                asChild={!action.disabled}
                variant={action.variant}
                className="w-full"
                disabled={action.disabled}
              >
                {action.disabled ? (
                  <span>{action.action}</span>
                ) : (
                  <Link to={action.link} className="flex items-center justify-center">
                    {action.action}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Fonctionnalités Principales</h2>
          <p className="text-muted-foreground mt-2">
            Tout ce dont vous avez besoin pour des sessions BDD efficaces
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-2 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Getting Started */}
      {!config.openai.configured && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Settings className="mr-2 h-5 w-5" />
              Configuration Requise
            </CardTitle>
            <CardDescription className="text-orange-700">
              Pour utiliser BDD Bot, vous devez d'abord configurer votre clé API OpenAI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100">
              <Link to="/config">
                Configurer OpenAI
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Sessions Récentes</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.slice(0, 3).map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{session.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {session.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{session.status}</Badge>
                    <Button asChild size="sm">
                      <Link to={`/session/${session.id}`}>
                        Ouvrir
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {sessions.length > 3 && (
            <div className="text-center">
              <Button asChild variant="outline">
                <Link to="/sessions">
                  Voir toutes les sessions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;

