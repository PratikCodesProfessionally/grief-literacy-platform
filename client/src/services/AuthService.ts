// Typdefinitionen für bessere Entwicklererfahrung
interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
}

// Klasse für Auth-bezogene Fehler
class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * AuthService - Zentrale Klasse für Authentifizierung
 * Verwendet Singleton-Pattern für globalen Zustand
 */
export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private authToken: string | null = null;

  // Private constructor für Singleton-Pattern
  private constructor() {
    // Beim Start prüfen ob Token im localStorage existiert
    this.loadAuthState();
  }

  /**
   * Singleton-Instanz abrufen
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Lädt den Auth-Status aus dem localStorage
   * @private
   */
  private loadAuthState(): void {
    try {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        this.authToken = token;
        this.currentUser = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Auth-Status:', error);
      this.logout(); // Bei Fehler ausloggen
    }
  }

  /**
   * Speichert Auth-Status im localStorage
   * @private
   */
  private saveAuthState(): void {
    try {
      if (this.authToken && this.currentUser) {
        localStorage.setItem('auth_token', this.authToken);
        localStorage.setItem('user', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Auth-Status:', error);
    }
  }

  /**
   * Benutzer-Login
   * @param credentials Login-Daten
   * @returns Promise mit User-Daten
   */
  public async login(credentials: LoginCredentials): Promise<User> {
    try {
      // API-Call zum Backend (Beispiel)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new AuthError('Login fehlgeschlagen');
      }

      const data: AuthResponse = await response.json();
      
      // Auth-Status setzen
      this.currentUser = data.user;
      this.authToken = data.token;
      this.saveAuthState();

      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Neuen Benutzer registrieren
   * @param userData Registrierungsdaten
   * @returns Promise mit User-Daten
   */
  public async register(userData: RegisterData): Promise<User> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new AuthError('Registrierung fehlgeschlagen');
      }

      const data: AuthResponse = await response.json();
      
      // Auth-Status setzen
      this.currentUser = data.user;
      this.authToken = data.token;
      this.saveAuthState();

      return data.user;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  /**
   * Benutzer ausloggen
   */
  public logout(): void {
    this.currentUser = null;
    this.authToken = null;
    this.saveAuthState();
  }

  /**
   * Prüft ob Benutzer eingeloggt ist
   */
  public isAuthenticated(): boolean {
    return !!this.authToken && !!this.currentUser;
  }

  /**
   * Gibt den aktuellen Benutzer zurück
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Gibt den JWT-Token zurück
   */
  public getToken(): string | null {
    return this.authToken;
  }

  /**
   * Aktualisiert den JWT-Token
   * @param newToken Neuer Token
   */
  public updateToken(newToken: string): void {
    this.authToken = newToken;
    this.saveAuthState();
  }
}

// Export einer Singleton-Instanz
export const authService = AuthService.getInstance();

/**
 * @fileoverview Dokumentation des AuthService
 * 
 * @section Überblick
 * Der AuthService ist eine zentrale Komponente für die Benutzerverwaltung in der 
 * Poetry-Therapy-Plattform. Verwendet das Singleton-Pattern und verwaltet die 
 * Benutzerauthentifizierung mittels JWT (JSON Web Tokens).
 *
 * @section Kernkomponenten
 * 
 * Schnittstellen:
 * - User: Definiert die Struktur eines Benutzers (ID, E-Mail, Name)
 * - AuthResponse: Format der Server-Antwort (Benutzer + Token) 
 * - LoginCredentials: Anmeldedaten (E-Mail + Passwort)
 * - RegisterData: Registrierungsdaten (erweitert LoginCredentials um Namen)
 *
 * Hauptfunktionalitäten:
 * - Authentifizierung: Login/Logout-Mechanismen
 * - Registrierung: Neue Benutzer anlegen
 * - Statusverwaltung: Authentifizierungszustand verwalten
 * - Token-Management: JWT-Token speichern und aktualisieren
 * - Persistenz: Authentifizierungsstatus im localStorage speichern
 *
 * @section Sicherheit
 * - Token-Sicherheit: Tokens nur im localStorage
 * - Automatisches Logout bei Fehlern
 * - Robuste Fehlerbehandlung
 * 
 * @section Verwendung
 * ```typescript
 * const auth = AuthService.getInstance();
 * 
 * // Login
 * await auth.login({
 *   email: "benutzer@example.com",
 *   password: "passwort123"
 * });
 * 
 * // Status prüfen
 * if (auth.isAuthenticated()) {
 *   const user = auth.getCurrentUser();
 * }
 * ```
 *
 * @section Erweiterungen
 * Mögliche zukünftige Erweiterungen:
 * - Token-Refresh-Mechanismus
 * - Zwei-Faktor-Authentifizierung
 * - Passwort-Zurücksetzen
 * - Session-Timeout-Handling
 *
 * @version 1.0.0
 * @author Ihr Name
 * @copyright 2025 Poetry-Therapy-Platform
 */