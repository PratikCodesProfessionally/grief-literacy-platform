interface StorageProvider {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
  list(): Promise<any[]>;
  delete(key: string): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
  constructor(private namespace: string) {}

  async save(key: string, data: any): Promise<void> {
    const storageKey = `${this.namespace}_${key}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  async load(key: string): Promise<any> {
    const storageKey = `${this.namespace}_${key}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  }

  async list(): Promise<any[]> {
    const items: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.namespace}_`)) {
        const data = localStorage.getItem(key);
        if (data) items.push(JSON.parse(data));
      }
    }
    return items;
  }

  async delete(key: string): Promise<void> {
    const storageKey = `${this.namespace}_${key}`;
    localStorage.removeItem(storageKey);
  }
}

class CloudStorageProvider implements StorageProvider {
  constructor(
    private namespace: string,
    private apiUrl?: string
  ) {}

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async save(key: string, data: any): Promise<void> {
    const response = await fetch(`${this.apiUrl}/poems`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to save to cloud');
  }

  async load(key: string): Promise<any> {
    const response = await fetch(`${this.apiUrl}/poems/${key}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to load from cloud');
    return response.json();
  }

  async list(): Promise<any[]> {
    const response = await fetch(`${this.apiUrl}/poems`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to list from cloud');
    const result = await response.json();
    return result.data || [];
  }

  async delete(key: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/poems/${key}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete from cloud');
  }
}

export const storageProvider = {
  createProvider(
    type: 'local' | 'cloud',
    namespace: string,
    apiUrl?: string
  ): StorageProvider {
    return type === 'local'
      ? new LocalStorageProvider(namespace)
      : new CloudStorageProvider(namespace, apiUrl);
  }
};
