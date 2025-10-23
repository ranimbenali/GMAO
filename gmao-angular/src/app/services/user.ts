import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserService {
  private api = '/api/users'; // ✅ correspond à @Controller('users') côté back
  constructor(private http: HttpClient) {}
  getUsers() {
    return this.http.get(this.api);
  }
}
