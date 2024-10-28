import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { villagers } from 'animal-crossing';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  //constructor() { }

  private baseUrl = 'https://api.nookipedia.com/'; // Thay URL này thành API bạn muốn gọi
  private apiKey = '97152a5c-9c98-47e7-9f08-e6b52b3f8751';
  constructor(private http: HttpClient) { }

  // Hàm lấy dữ liệu từ API
  getVillagers(): Observable<any> {
    const headers = new HttpHeaders({
      
      'X-API-KEY': `${this.apiKey}` // Hoặc kiểu xác thực khác tùy thuộc vào API
    });

    return this.http.get<any>(`${this.baseUrl}/villagers`, { headers });
  }
  
  
}
