import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Phone, Globe, AlertTriangle, Clock, MapPin, Heart } from 'lucide-react';

export function ProfessionalHelpPage() {
  const [selectedCountry, setSelectedCountry] = React.useState<string>('germany');

  const crisisResources = {
    germany: {
      name: 'Germany',
      flag: '🇩🇪',
      resources: [
        {
          name: 'Telefonseelsorge',
          description: 'Kostenlose und anonyme Beratung rund um die Uhr',
          phone: '0800 111 0 111 oder 0800 111 0 222',
          website: 'www.telefonseelsorge.de',
          hours: '24/7',
          type: 'Crisis Line',
          languages: ['Deutsch']
        },
        {
          name: 'Nummer gegen Kummer',
          description: 'Beratungstelefon für Erwachsene',
          phone: '0800 111 0 550',
          website: 'www.nummergegenkummer.de',
          hours: 'Mo-Sa 14:00-20:00, So 10:00-18:00',
          type: 'Support Line',
          languages: ['Deutsch']
        },
        {
          name: 'Deutsche Hospiz Stiftung',
          description: 'Unterstützung bei Trauer und Verlust',
          phone: '0180 30 04 27 37',
          website: 'www.hospize.de',
          hours: 'Mo-Fr 9:00-17:00',
          type: 'Grief Support',
          languages: ['Deutsch']
        },
        {
          name: 'Bundesverband Trauerbegleitung',
          description: 'Professionelle Trauerbegleitung',
          phone: '+49 (0)228 - 688 478 8',
          website: 'www.bv-trauerbegleitung.de',
          hours: 'Terminvereinbarung',
          type: 'Professional Support',
          languages: ['Deutsch']
        },
        {
          name: 'Online-Beratung der Caritas',
          description: 'Online-Beratung bei Trauer und Verlust',
          phone: 'Online Chat verfügbar',
          website: 'www.caritas.de/onlineberatung',
          hours: 'Online verfügbar',
          type: 'Online Support',
          languages: ['Deutsch']
        }
      ]
    },
    uk: {
      name: 'United Kingdom',
      flag: '🇬🇧',
      resources: [
        {
          name: 'Samaritans',
          description: 'Free 24/7 emotional support for anyone in distress',
          phone: '116 123',
          website: 'www.samaritans.org',
          hours: '24/7',
          type: 'Crisis Line',
          languages: ['English', 'Welsh']
        },
        {
          name: 'Cruse Bereavement Support',
          description: 'UK\'s leading bereavement charity',
          phone: '0808 808 1677',
          website: 'www.cruse.org.uk',
          hours: 'Mon-Fri 9:30am-5pm',
          type: 'Grief Support',
          languages: ['English', 'Welsh']
        },
        {
          name: 'Sue Ryder Grief Kind',
          description: 'Online grief support and resources',
          phone: '0808 164 9876',
          website: 'www.sueryder.org/grief-kind',
          hours: 'Mon-Fri 9am-5pm',
          type: 'Grief Support',
          languages: ['English']
        },
        {
          name: 'MIND',
          description: 'Mental health support and information',
          phone: '0300 123 3393',
          website: 'www.mind.org.uk',
          hours: 'Mon-Fri 9am-6pm',
          type: 'Mental Health',
          languages: ['English']
        },
        {
          name: 'Child Bereavement UK',
          description: 'Support for families when a child dies',
          phone: '0800 02 888 40',
          website: 'www.childbereavementuk.org',
          hours: '9am-5pm weekdays',
          type: 'Family Support',
          languages: ['English']
        }
      ]
    },
    usa: {
      name: 'United States',
      flag: '🇺🇸',
      resources: [
        {
          name: '988 Suicide & Crisis Lifeline',
          description: 'Free, confidential crisis support 24/7',
          phone: '988',
          website: 'www.988lifeline.org',
          hours: '24/7',
          type: 'Crisis Line',
          languages: ['English', 'Spanish']
        },
        {
          name: 'GriefShare',
          description: 'Grief recovery support groups nationwide',
          phone: '1-800-395-5755',
          website: 'www.griefshare.org',
          hours: 'Local group times vary',
          type: 'Grief Support',
          languages: ['English', 'Spanish']
        },
        {
          name: 'HealGrief.org',
          description: 'Online grief support community',
          phone: 'Online support available',
          website: 'www.healgrief.org',
          hours: 'Online 24/7',
          type: 'Online Support',
          languages: ['English']
        },
        {
          name: 'National Alliance on Mental Illness (NAMI)',
          description: 'Mental health support and resources',
          phone: '1-800-950-6264',
          website: 'www.nami.org',
          hours: 'Mon-Fri 10am-8pm ET',
          type: 'Mental Health',
          languages: ['English', 'Spanish']
        },
        {
          name: 'The Dougy Center',
          description: 'Support for children and families after death',
          phone: '(503) 775-5683',
          website: 'www.dougy.org',
          hours: 'Mon-Fri 9am-5pm PT',
          type: 'Family Support',
          languages: ['English', 'Spanish']
        }
      ]
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'Crisis Line': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Grief Support': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Mental Health': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Online Support': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Professional Support': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Support Line': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Family Support': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const currentResources = crisisResources[selectedCountry as keyof typeof crisisResources];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/resources">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            🤝 Professional Help & Crisis Support
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Immediate access to professional support when you need it most
          </p>
        </div>
      </div>

      {/* Emergency Warning */}
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
                🚨 In Case of Emergency
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                If you're having thoughts of harming yourself or others, please contact emergency services immediately:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white dark:bg-gray-800 p-3 rounded border-red-200 border">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">🇩🇪</span>
                    <strong>Germany:</strong>
                  </div>
                  <p>Emergency: <strong>112</strong></p>
                  <p>Police: <strong>110</strong></p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border-red-200 border">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">🇬🇧</span>
                    <strong>UK:</strong>
                  </div>
                  <p>Emergency: <strong>999</strong></p>
                  <p>NHS: <strong>111</strong></p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border-red-200 border">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">🇺🇸</span>
                    <strong>USA:</strong>
                  </div>
                  <p>Emergency: <strong>911</strong></p>
                  <p>Crisis: <strong>988</strong></p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Country Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Your Location</CardTitle>
          <CardDescription>
            Choose your country to see relevant local resources and support services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(crisisResources).map(([key, country]) => (
              <Button
                key={key}
                variant={selectedCountry === key ? "default" : "outline"}
                onClick={() => setSelectedCountry(key)}
                className="space-x-2"
              >
                <span className="text-lg">{country.flag}</span>
                <span>{country.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources for Selected Country */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-2xl">{currentResources.flag}</span>
            <span>Support Resources in {currentResources.name}</span>
          </CardTitle>
          <CardDescription>
            Professional support services available in your region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {currentResources.resources.map((resource, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{resource.name}</h3>
                        <Badge className={getTypeColor(resource.type)}>
                          {resource.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {resource.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {resource.languages.map((lang, langIndex) => (
                          <Badge key={langIndex} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Phone:</div>
                          <div className="text-gray-600 dark:text-gray-400">{resource.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">Hours:</div>
                          <div className="text-gray-600 dark:text-gray-400">{resource.hours}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Globe className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="font-medium">Website:</div>
                        <a 
                          href={`https://${resource.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {resource.website}
                        </a>
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button size="sm" onClick={() => window.open(`tel:${resource.phone.replace(/\D/g, '')}`, '_self')}>
                        <Phone className="h-3 w-3 mr-1" />
                        Call Now
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => window.open(`https://${resource.website}`, '_blank')}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Visit Website
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Support Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900 dark:text-blue-100" style={{ WebkitFontSmoothing: 'antialiased', fontWeight: 600 }}>
              <Heart className="h-5 w-5" />
              <span>When to Seek Help</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm" style={{ WebkitFontSmoothing: 'antialiased' }}>
              <li className="text-gray-900 dark:text-gray-100 font-medium">• Feeling overwhelmed by grief for extended periods</li>
              <li className="text-gray-900 dark:text-gray-100 font-medium">• Unable to function in daily activities</li>
              <li className="text-gray-900 dark:text-gray-100 font-medium">• Thoughts of self-harm or suicide</li>
              <li className="text-gray-900 dark:text-gray-100 font-medium">• Substance abuse as a coping mechanism</li>
              <li className="text-gray-900 dark:text-gray-100 font-medium">• Isolation from friends and family</li>
              <li className="text-gray-900 dark:text-gray-100 font-medium">• Physical symptoms affecting your health</li>
              <li className="text-gray-900 dark:text-gray-100 font-medium">• Anniversary reactions become too difficult</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-900 dark:text-green-100" style={{ WebkitFontSmoothing: 'antialiased', fontWeight: 600 }}>
              <MapPin className="h-5 w-5" />
              <span>Types of Professional Help</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm" style={{ WebkitFontSmoothing: 'antialiased' }}>
              <li className="text-gray-900 dark:text-gray-100">• <strong className="font-bold text-gray-900 dark:text-white">Grief Counselors:</strong> Specialized in bereavement support</li>
              <li className="text-gray-900 dark:text-gray-100">• <strong className="font-bold text-gray-900 dark:text-white">Therapists:</strong> Individual therapy for complex grief</li>
              <li className="text-gray-900 dark:text-gray-100">• <strong className="font-bold text-gray-900 dark:text-white">Support Groups:</strong> Connect with others in similar situations</li>
              <li className="text-gray-900 dark:text-gray-100">• <strong className="font-bold text-gray-900 dark:text-white">Psychiatrists:</strong> Medical support for severe symptoms</li>
              <li className="text-gray-900 dark:text-gray-100">• <strong className="font-bold text-gray-900 dark:text-white">Crisis Lines:</strong> Immediate support when needed</li>
              <li className="text-gray-900 dark:text-gray-100">• <strong className="font-bold text-gray-900 dark:text-white">Online Support:</strong> Accessible help from home</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Future Professional Services Notice */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-300 dark:border-purple-700">
        <CardHeader>
          <CardTitle className="text-purple-900 dark:text-purple-100" style={{ WebkitFontSmoothing: 'antialiased', fontWeight: 600 }}>
            🔮 Coming Soon: Integrated Professional Services
          </CardTitle>
          <CardDescription className="text-purple-800 dark:text-purple-200 font-medium" style={{ WebkitFontSmoothing: 'antialiased' }}>
            We're working on connecting you directly with local grief counselors and therapists
          </CardDescription>
        </CardHeader>
        <CardContent className="text-purple-900 dark:text-purple-100">
          <p className="text-sm mb-4 font-medium" style={{ WebkitFontSmoothing: 'antialiased', lineHeight: '1.7' }}>
            Soon you'll be able to find, book, and connect with local professional grief counselors 
            directly through our platform. Until then, please use the resources above to find 
            qualified help in your area.
          </p>
          <Button variant="outline" className="border-purple-400 text-purple-900 dark:text-purple-100 dark:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/50 font-semibold btn-clear-state">
            Notify Me When Available
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}