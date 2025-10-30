/**
 * @fileoverview Datenbank-Konfiguration für die Poetry-Therapy-Platform
 *
 * Implementiert:
 * - MongoDB-Verbindung mit Mongoose
 * - Verbindungs-Pooling
 * - Error Handling
 * - Logging
 */
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
/**
 * Standard-Konfiguration für MongoDB
 */
const config = {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/poetry-therapy',
    options: {
        // Verbindungsoptionen
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true,
        // Neue Mongoose 7+ Optionen
        serverApi: {
            version: '1',
            strict: true,
            deprecationErrors: true,
        }
    }
};
/**
 * Verbindungsmanager-Klasse
 */
class DatabaseConnection {
    constructor() {
        this.isConnected = false;
        this.maxRetries = 3;
        this.retryCount = 0;
        this.setupMongooseEvents();
    }
    /**
     * Singleton-Instanz abrufen
     */
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    /**
     * Verbindung zur Datenbank herstellen
     */
    async connect() {
        if (this.isConnected) {
            logger.info('Bereits mit Datenbank verbunden');
            return;
        }
        try {
            await this.connectWithRetry();
        }
        catch (error) {
            const dbError = error;
            logger.error(`Datenbankfehler: ${dbError.message}`, {
                code: dbError.code,
                syscall: dbError.syscall
            });
            throw error;
        }
    }
    async connectWithRetry() {
        try {
            await mongoose.connect(config.uri, config.options);
            this.isConnected = true;
            this.retryCount = 0;
            logger.info('Datenbankverbindung erfolgreich hergestellt');
        }
        catch (error) {
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                const delay = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
                logger.warn(`Verbindungsversuch ${this.retryCount} fehlgeschlagen, erneuter Versuch in ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.connectWithRetry();
            }
            throw error;
        }
    }
    /**
     * Verbindung zur Datenbank trennen
     */
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose.disconnect();
            this.isConnected = false;
            logger.info('Datenbankverbindung getrennt');
        }
        catch (error) {
            logger.error('Fehler beim Trennen der Datenbankverbindung:', error);
            throw error;
        }
    }
    /**
     * Mongoose Events einrichten
     */
    setupMongooseEvents() {
        mongoose.connection.on('connected', () => {
            logger.info('Mongoose verbunden');
        });
        mongoose.connection.on('error', (error) => {
            logger.error('Mongoose Verbindungsfehler:', error);
        });
        mongoose.connection.on('disconnected', () => {
            logger.info('Mongoose getrennt');
        });
        // Graceful Shutdown
        process.on('SIGINT', async () => {
            try {
                await this.disconnect();
                process.exit(0);
            }
            catch (error) {
                process.exit(1);
            }
        });
    }
    /**
     * Verbindungsstatus prüfen
     */
    isConnectedToDatabase() {
        return this.isConnected && mongoose.connection.readyState === 1;
    }
    /**
     * Verbindung zurücksetzen
     */
    async resetConnection() {
        await this.disconnect();
        await this.connect();
    }
}
// Exportiere Singleton-Instanz
export const db = DatabaseConnection.getInstance();
// Beispielverwendung:
/*
import { db } from './config/database';

async function startServer() {
  try {
    await db.connect();
    // Server starten...
  } catch (error) {
    console.error('Serverfehler:', error);
    process.exit(1);
  }
}
*/
/*
Hauptkomponenten der Implementation:
1. Konfiguration
MongoDB URI und Verbindungsoptionen
Pool-Größen und Timeouts
Retry-Strategien
2. Verbindungsmanager
Singleton-Pattern
Verbindungsstatus-Tracking
Graceful Shutdown
3. Event-Handling
Verbindungsevents
Error-Events
Prozess-Termine
4. Hilfs-Methoden
Status-Prüfung
Verbindungs-Reset
Logging
Verwendung:
// In server.ts oder app.ts
import { db } from './config/database';

async function bootstrap() {
  try {
    await db.connect();
    console.log('Datenbank verbunden');
    
    // Server-Setup...
  } catch (error) {
    console.error('Startup-Fehler:', error);
    process.exit(1);
  }
}

bootstrap();
*/
