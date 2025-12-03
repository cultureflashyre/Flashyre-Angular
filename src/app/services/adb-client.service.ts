import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdbClientService {
  // Update this URL to match your Django server address
  private apiUrl = 'http://localhost:8000/api/clients/';

  constructor(private http: HttpClient) { }

  // Fetch all clients (For the list at the bottom)
  getClients(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Create new clients (Bulk or Single)
  createClients(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateClient(id: any, data: any): Observable<any> {
  // Remove the slash before ${id} if apiUrl already has one
    return this.http.put(`${this.apiUrl}${id}/`, data); 
  }

// Do the same for deleteClient just in case!
  deleteClient(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`);
  }

}