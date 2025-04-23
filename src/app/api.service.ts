import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { villagers } from 'animal-crossing';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  //constructor() { }

  private apiUrl = 'https://api.nookipedia.com';
  private apiKey = '97152a5c-9c98-47e7-9f08-e6b52b3f8751';

  constructor(private http: HttpClient) { }

  // Hàm lấy dữ liệu từ API
  getVillagers(): Observable<any> {
    const headers = new HttpHeaders({
      'X-API-KEY': this.apiKey,
      'Accept-Version': '1.0.0'
    });

    return this.http.get<any>(`${this.apiUrl}/villagers`, { headers });
  }

  // Add method to get specific villager details
  getVillagerDetails(name: string): Observable<any> {
    const headers = new HttpHeaders({
      'X-API-KEY': this.apiKey,
      'Accept-Version': '1.0.0'
    });

    return this.http.get(`${this.apiUrl}/villagers/${name}`, { headers });
  }
}
