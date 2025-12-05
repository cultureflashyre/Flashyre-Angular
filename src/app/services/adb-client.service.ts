import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // Import the environment file

@Injectable({
  providedIn: 'root'
})
export class AdbClientService {
  // Store the base API URL from the environment file
  private baseUrl = environment.apiUrl;
  // Define the specific endpoint path for clients
  private endpoint = 'api/clients/';

  constructor(private http: HttpClient) { }

  /**
   * Fetches all clients from the backend.
   * @returns An Observable array of clients.
   */
  getClients(): Observable<any[]> {
    // Construct the full URL inside the method
    return this.http.get<any[]>(`${this.baseUrl}${this.endpoint}`);
  }

  /**
   * Creates new clients (Bulk or Single).
   * @param data - The client data to be created.
   * @returns An Observable of the server's response.
   */
  createClients(data: any): Observable<any> {
    // Construct the full URL inside the method
    return this.http.post<any>(`${this.baseUrl}${this.endpoint}`, data);
  }

  /**
   * Updates an existing client by their ID.
   * @param id - The ID of the client to update.
   * @param data - The updated client data.
   * @returns An Observable of the server's response.
   */
  updateClient(id: any, data: any): Observable<any> {
    // Construct the full URL for a specific client
    return this.http.put(`${this.baseUrl}${this.endpoint}${id}/`, data); 
  }

  /**
   * Deletes a client by their ID.
   * @param id - The ID of the client to delete.
   * @returns An Observable of the server's response.
   */
  deleteClient(id: any): Observable<any> {
    // Construct the full URL for a specific client
    return this.http.delete(`${this.baseUrl}${this.endpoint}${id}/`);
  }
}